/**
 * Sentry Error Tracking Configuration
 * Provides comprehensive error tracking for the Fleet Management API
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Request } from 'express';


export interface SentryConfig {
  init(): void;
  captureException(error: Error, context?: any): string;
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void;
  setUser(userId: string, email?: string): void;
  addBreadcrumb(message: string, category: string, data?: any): void;
}

/**
 * Filter sensitive data from request objects
 */
const filterSensitiveData = (data: any): any => {
  if (!data) return data;

  const sensitiveKeys = [
    'password', 'token', 'secret', 'api_key', 'apikey',
    'authorization', 'cookie', 'session', 'credit_card',
    'ssn', 'social_security', 'bank_account'
  ];

  const filtered = { ...data };

  for (const key in filtered) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof filtered[key] === 'object' && filtered[key] !== null) {
      filtered[key] = filterSensitiveData(filtered[key]);
    }
  }

  return filtered;
};

/**
 * Extract request context for error reports
 */
const extractRequestContext = (req: Request) => {
  return {
    url: req.originalUrl,
    method: req.method,
    headers: filterSensitiveData(req.headers),
    query: filterSensitiveData(req.query),
    body: filterSensitiveData(req.body),
    params: filterSensitiveData(req.params),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  };
};

class SentryService implements SentryConfig {
  private initialized = false;

  /**
   * Initialize Sentry with environment-specific configuration
   */
  init(): void {
    if (this.initialized) {
      console.log('Sentry already initialized');
      return;
    }

    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
      console.log('⚠️ Sentry DSN not configured - error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.SENTRY_RELEASE || 'fleet-api@1.0.0',
        serverName: process.env.HOSTNAME || 'fleet-api-server',

        // Performance monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Integrations
        integrations: [
          // HTTP integration for automatic request/response tracking
          new Sentry.Integrations.Http({ tracing: true }),
          // Express integration for automatic Express error tracking
          new Sentry.Integrations.Express({
            app: true,
            router: true,
            errorHandler: true
          }),
          // Postgres integration for database query tracking
          new Sentry.Integrations.Postgres(),
          // Profiling for performance monitoring
          nodeProfilingIntegration(),
          // Console integration to capture console errors
          new Sentry.Integrations.Console(),
          // Context lines for better error context
          new Sentry.Integrations.ContextLines(),
          // Linked errors to track error causes
          new Sentry.Integrations.LinkedErrors({ key: 'cause', limit: 10 })
        ],

        // Breadcrumb configuration
        beforeBreadcrumb(breadcrumb) {
          // Filter out noisy breadcrumbs
          if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
          }

          // Filter sensitive data from breadcrumb data
          if (breadcrumb.data) {
            breadcrumb.data = filterSensitiveData(breadcrumb.data);
          }

          return breadcrumb;
        },

        // Error filtering and enhancement
        beforeSend(event, hint) {
          // Skip certain errors
          const error = hint.originalException;

          if (error && typeof error === 'object' && 'statusCode' in error) {
            // Don't report 4xx client errors (except 401 and 403 for security monitoring)
            const statusCode = (error as any).statusCode;
            if (statusCode >= 400 && statusCode < 500 && statusCode !== 401 && statusCode !== 403) {
              return null;
            }
          }

          // Add additional context
          if (event.request) {
            event.request = filterSensitiveData(event.request) as any;
          }

          // Add custom tags
          event.tags = {
            ...event.tags,
            api_version: '1.0.0',
            node_version: process.version
          };

          return event;
        },

        // Ignore specific errors
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          /^Failed to fetch$/,
          /^NetworkError/,
          /^Request aborted/
        ],

        // Auto session tracking
        autoSessionTracking: true,

        // Sample rate for errors (1.0 = 100%)
        sampleRate: process.env.NODE_ENV === 'production' ? 0.9 : 1.0,

        // Maximum breadcrumbs to store
        maxBreadcrumbs: 100,

        // Attach stack trace to messages
        attachStacktrace: true
      });

      this.initialized = true;
      console.log('✅ Sentry initialized successfully');

      // Set initial context
      Sentry.setContext('runtime', {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      });

    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an exception with optional context
   */
  captureException(error: Error, context?: any): string {
    if (!this.initialized) {
      console.error('Sentry not initialized. Error:', error);
      return '';
    }

    const scope = Sentry.getCurrentScope();

    if (context) {
      // Add request context if available
      if (context.request) {
        scope.setContext('request', extractRequestContext(context.request));
      }

      // Add user context if available
      if (context.user) {
        scope.setUser({
          id: context.user.id,
          email: context.user.email,
          username: context.user.username
        });
      }

      // Add custom context
      if (context.custom) {
        scope.setContext('custom', filterSensitiveData(context.custom));
      }

      // Add tags
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value as string);
        });
      }

      // Add extra data
      if (context.extra) {
        scope.setContext('extra', filterSensitiveData(context.extra));
      }
    }

    const eventId = Sentry.captureException(error);
    console.error(`Error captured with ID: ${eventId}`, error.message);

    return eventId;
  }

  /**
   * Capture a message with specified severity level
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void {
    if (!this.initialized) {
      console.log(`[${level.toUpperCase()}] ${message}`);
      return;
    }

    const sentryLevel = level === 'info' ? 'info' :
                        level === 'warning' ? 'warning' : 'error';

    Sentry.captureMessage(message, sentryLevel);
  }

  /**
   * Set the current user context
   */
  setUser(userId: string, email?: string): void {
    if (!this.initialized) return;

    Sentry.setUser({
      id: userId,
      email: email,
      ip_address: '{{auto}}'
    });
  }

  /**
   * Add a breadcrumb for tracking user actions
   */
  addBreadcrumb(message: string, category: string, data?: any): void {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data: data ? filterSensitiveData(data) : undefined,
      timestamp: Date.now() / 1000
    });
  }

  /**
   * Start a new transaction for performance monitoring
   */
  startTransaction(name: string, op: string) {
    if (!this.initialized) return null;

    return Sentry.startTransaction({
      op,
      name,
      trimEnd: true
    });
  }

  /**
   * Create a span within a transaction
   */
  startSpan(transaction: any, description: string) {
    if (!transaction) return null;

    return transaction.startChild({
      op: 'function',
      description
    });
  }

  /**
   * Finish a span or transaction
   */
  finishSpan(span: any) {
    if (span && typeof span.finish === 'function') {
      span.finish();
    }
  }

  /**
   * Flush all pending events (useful for serverless)
   */
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return true;

    try {
      return await Sentry.flush(timeout);
    } catch (error) {
      console.error('Failed to flush Sentry events:', error);
      return false;
    }
  }

  /**
   * Close Sentry client
   */
  async close(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return true;

    try {
      return await Sentry.close(timeout);
    } catch (error) {
      console.error('Failed to close Sentry:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sentryService = new SentryService();

// Export Sentry for direct use if needed
export { Sentry };