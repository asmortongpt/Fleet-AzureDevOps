/**
 * Sentry Error Tracking and Performance Monitoring
 * Comprehensive integration with Sentry for error tracking, performance monitoring, and session replay
 *
 * @module monitoring/sentry
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import type { User } from '@/types';
import logger from '@/utils/logger';

/**
 * Sentry Configuration
 */
export interface SentryConfig {
  dsn?: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  enabled: boolean;
  debug?: boolean;
}

/**
 * Default Sentry Configuration
 */
const DEFAULT_SENTRY_CONFIG: SentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
  debug: import.meta.env.DEV,
};

/**
 * Initialize Sentry
 */
export function initSentry(config: Partial<SentryConfig> = {}): void {
  const finalConfig = { ...DEFAULT_SENTRY_CONFIG, ...config };

  if (!finalConfig.enabled || !finalConfig.dsn) {
    if (import.meta.env.DEV) {
      logger.info('[Sentry] Not initialized - disabled or missing DSN');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: finalConfig.dsn,
      environment: finalConfig.environment,
      release: finalConfig.release,
      debug: finalConfig.debug,

      // Performance Monitoring
      integrations: [
        new BrowserTracing({
          // Set custom tracing origins
          tracingOrigins: [
            'localhost',
            /^https:\/\/api\.fleet-management\.com/,
            /^https:\/\/.*\.azurewebsites\.net/,
          ],
          // @ts-expect-error - Sentry v8 API changes - reactRouterV6Instrumentation signature changed
          // Enable automatic route tracking
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            // @ts-ignore - useLocation and useNavigationType will be provided by React Router
            window.location,
            window.history
          ),
        }),

        // @ts-expect-error - Sentry v8 API changes - Replay integration signature changed
        // Session Replay
        new Sentry.Replay({
          maskAllText: true, // Mask all text for privacy
          blockAllMedia: true, // Block all media (images, videos) for privacy
          maskAllInputs: true, // Mask all input values
          // Network details
          networkDetailAllowUrls: [
            /^https:\/\/api\.fleet-management\.com/,
          ],
          networkCaptureBodies: false, // Don't capture request bodies for privacy
          networkResponseHeaders: [], // Don't capture response headers
        }),
      ],

      // Performance monitoring sample rate
      tracesSampleRate: finalConfig.tracesSampleRate,

      // Session replay sample rates
      replaysSessionSampleRate: finalConfig.replaysSessionSampleRate,
      replaysOnErrorSampleRate: finalConfig.replaysOnErrorSampleRate,

      // Before send hook - sanitize sensitive data
      beforeSend(event, hint) {
        // Don't send events in development
        if (import.meta.env.DEV && !finalConfig.debug) {
          return null;
        }

        // Sanitize request data
        if (event.request) {
          // Remove cookies
          delete event.request.cookies;

          // Sanitize headers
          if (event.request.headers) {
            const sensitiveHeaders = [
              'authorization',
              'cookie',
              'x-api-key',
              'x-auth-token',
            ];
            sensitiveHeaders.forEach((header) => {
              if (event.request?.headers?.[header]) {
                event.request.headers[header] = '[Filtered]';
              }
            });
          }

          // Sanitize query string
          if (event.request.query_string) {
            const params = new URLSearchParams(event.request.query_string);
            ['token', 'key', 'secret', 'password'].forEach((param) => {
              if (params.has(param)) {
                params.set(param, '[Filtered]');
              }
            });
            event.request.query_string = params.toString();
          }
        }

        // Sanitize extra data
        if (event.extra) {
          Object.keys(event.extra).forEach((key) => {
            if (
              key.toLowerCase().includes('password') ||
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('secret')
            ) {
              event.extra![key] = '[Filtered]';
            }
          });
        }

        return event;
      },

      // Before breadcrumb hook
      beforeBreadcrumb(breadcrumb) {
        // Filter out sensitive breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          // Don't capture console.log breadcrumbs in production
          if (import.meta.env.PROD) {
            return null;
          }
        }

        // Sanitize XHR/fetch breadcrumbs
        if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
          if (breadcrumb.data?.url) {
            const url = new URL(breadcrumb.data.url, window.location.origin);
            // Remove sensitive query parameters
            ['token', 'key', 'secret', 'password'].forEach((param) => {
              url.searchParams.delete(param);
            });
            breadcrumb.data.url = url.toString();
          }
        }

        return breadcrumb;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',

        // Random plugins/extensions
        'Can\'t find variable: ZiteReader',
        'jigsaw is not defined',
        'ComboSearch is not defined',

        // React errors we can't control
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',

        // Network errors
        'NetworkError',
        'Network request failed',
        'Failed to fetch',

        // Non-errors
        'Non-Error promise rejection captured',
        'Non-Error exception captured',
      ],

      // Deny URLs (don't capture errors from these sources)
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
      ],

      // Max breadcrumbs
      maxBreadcrumbs: 50,

      // Attach stack trace
      attachStacktrace: true,
    });

    if (import.meta.env.DEV) {
      logger.info('[Sentry] Initialized successfully');
      logger.info('[Sentry] Environment:', finalConfig.environment);
      logger.info('[Sentry] Release:', finalConfig.release);
    }
  } catch (error) {
    logger.error('[Sentry] Failed to initialize:', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
): string {
  return Sentry.captureException(error, {
    level,
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): string {
  return Sentry.captureMessage(message, {
    level,
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Set user context
 */
export function setUserContext(user: Partial<User> | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
      // Don't send sensitive user data
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Set custom context
 */
export function setContext(name: string, context: Record<string, any>): void {
  Sentry.setContext(name, context);
}

/**
 * Set tag
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set tags
 */
export function setTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): any | undefined {
  // @ts-expect-error - Sentry v8 API changes - startTransaction deprecated, use startSpan instead
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const transaction = startTransaction(name, 'function');

  try {
    const result = fn();

    // Handle async functions
    if (result instanceof Promise) {
      return result.finally(() => {
        transaction?.finish();
      }) as T;
    }

    transaction?.finish();
    return result;
  } catch (error) {
    transaction?.setStatus('internal_error');
    transaction?.finish();
    throw error;
  }
}

/**
 * Error Boundary component wrapper
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Profiler component for React performance monitoring
 */
export const SentryProfiler = Sentry.Profiler;

/**
 * withProfiler HOC
 */
export const withProfiler = Sentry.withProfiler;

/**
 * Flush Sentry events (useful before page unload)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    logger.error('[Sentry] Failed to flush events:', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Close Sentry client
 */
export async function closeSentry(timeout: number = 2000): Promise<boolean> {
  try {
    return await Sentry.close(timeout);
  } catch (error) {
    logger.error('[Sentry] Failed to close:', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  // @ts-expect-error - Sentry v8 API changes - getCurrentHub deprecated, use getClient instead
  const client = Sentry.getCurrentHub().getClient();
  return !!client;
}

/**
 * Get Sentry DSN (for reporting to backend)
 */
export function getSentryDSN(): string | undefined {
  // @ts-expect-error - Sentry v8 API changes - getCurrentHub deprecated, use getClient instead
  const client = Sentry.getCurrentHub().getClient();
  return client?.getDsn()?.toString();
}

/**
 * Custom error class with Sentry integration
 */
export class MonitoredError extends Error {
  constructor(
    message: string,
    public context?: Record<string, any>,
    public level: Sentry.SeverityLevel = 'error'
  ) {
    super(message);
    this.name = 'MonitoredError';

    // Capture to Sentry immediately
    captureException(this, context, level);
  }
}

/**
 * Sentry performance marks
 */
export class SentryPerformanceMarks {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark?: string): void {
    const end = endMark || `${name}-end`;
    this.mark(end);

    try {
      performance.measure(name, startMark, end);

      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        addBreadcrumb(
          `Performance: ${name}`,
          'performance',
          'info',
          {
            duration: measure.duration,
            startTime: measure.startTime,
          }
        );
      }
    } catch (error) {
      logger.warn('[Sentry] Failed to measure performance:', { error });
    }
  }

  clear(): void {
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

export const performanceMarks = new SentryPerformanceMarks();

/**
 * Initialize Sentry with React Router integration
 */
export function initSentryWithRouter(
  config: Partial<SentryConfig> = {}
): void {
  initSentry(config);

  // Add router breadcrumbs
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      addBreadcrumb('Navigation', 'navigation', 'info', {
        to: window.location.pathname,
      });
    });
  }
}

/**
 * Sentry React integration utilities
 */
export const sentryReact = {
  ErrorBoundary: SentryErrorBoundary,
  Profiler: SentryProfiler,
  withProfiler,
  createReduxEnhancer: Sentry.createReduxEnhancer,
};

/**
 * Export Sentry for direct use
 */
export { Sentry };
