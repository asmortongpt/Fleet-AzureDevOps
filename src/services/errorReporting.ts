/**
 * Error Reporting Service
 *
 * Integration with error tracking services (Sentry, Bugsnag, etc.)
 * Provides structured error logging with context and automatic reporting.
 *
 * Features:
 * - Automatic error capture
 * - Error context (user actions, component state)
 * - Breadcrumbs
 * - User feedback
 * - Release tracking
 * - Environment detection
 */

import { getTelemetryConfig } from '../config/telemetry';
import { DataSanitizer } from '../utils/privacy';
import { analytics } from './analytics';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Error context
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

/**
 * Breadcrumb for tracking user actions leading to error
 */
export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: ErrorSeverity;
  data?: Record<string, any>;
}

/**
 * User feedback
 */
export interface UserFeedback {
  name?: string;
  email?: string;
  comments: string;
  eventId: string;
}

/**
 * Sentry-compatible error event
 */
interface SentryEvent {
  message?: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: any[];
      };
    }>;
  };
  level: ErrorSeverity;
  user?: {
    id?: string;
    email?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  breadcrumbs?: Breadcrumb[];
  contexts?: Record<string, any>;
  environment?: string;
  release?: string;
  timestamp: number;
}

/**
 * Error Reporting Service
 */
class ErrorReportingService {
  private static instance: ErrorReportingService;
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 100;
  private isInitialized = false;
  private sentryHub?: any;

  private constructor() {
    this.initialize();
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  /**
   * Initialize error reporting
   */
  private async initialize(): Promise<void> {
    const config = getTelemetryConfig();

    if (!config.errorReporting?.enabled) {
      return;
    }

    try {
      // Initialize Sentry if DSN is provided
      if (config.errorReporting.dsn) {
        await this.initializeSentry(config.errorReporting);
      }

      // Set up global error handlers
      this.setupGlobalHandlers();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize error reporting:', error);
    }
  }

  /**
   * Initialize Sentry SDK
   */
  private async initializeSentry(config: any): Promise<void> {
    // In production, dynamically import Sentry SDK
    // For now, we'll create a mock implementation
    if (typeof (window as any).Sentry !== 'undefined') {
      const Sentry = (window as any).Sentry;

      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        sampleRate: config.sampleRate,
        tracesSampleRate: config.tracesSampleRate,
        ignoreErrors: config.ignoreErrors,
        beforeSend: (event: any) => this.beforeSend(event),
        beforeBreadcrumb: (breadcrumb: any) => this.beforeBreadcrumb(breadcrumb),
      });

      this.sentryHub = Sentry;
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          extra: {
            type: 'unhandled_rejection',
          },
        }
      );
    });

    // Handle console errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Only capture if it looks like an error
      if (args[0] instanceof Error) {
        this.captureException(args[0], {
          extra: { consoleArgs: args.slice(1) },
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Before send hook (sanitize data)
   */
  private beforeSend(event: SentryEvent): SentryEvent | null {
    const config = getTelemetryConfig();

    // Check if error should be ignored
    if (config.errorReporting?.ignoreErrors) {
      const message = event.message || event.exception?.values[0]?.value || '';
      for (const ignored of config.errorReporting.ignoreErrors) {
        if (message.includes(ignored)) {
          return null; // Don't send
        }
      }
    }

    // Sanitize event data
    return {
      ...event,
      extra: event.extra ? DataSanitizer.scrubObject(event.extra) : undefined,
      breadcrumbs: event.breadcrumbs?.map(b => ({
        ...b,
        data: b.data ? DataSanitizer.scrubObject(b.data) : undefined,
      })),
    };
  }

  /**
   * Before breadcrumb hook
   */
  private beforeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
    // Filter out sensitive breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.message?.includes('password')) {
      return null;
    }

    return breadcrumb;
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: ErrorContext): string {
    if (!this.isInitialized) {
      console.error('Error reporting not initialized:', error);
      return '';
    }

    // Add breadcrumb for this error
    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'error',
      message: error.message,
      level: ErrorSeverity.ERROR,
      data: {
        stack: error.stack,
      },
    });

    // Create event ID
    const eventId = this.generateEventId();

    // Send to Sentry if available
    if (this.sentryHub) {
      this.sentryHub.withScope((scope: any) => {
        if (context?.component) {
          scope.setTag('component', context.component);
        }
        if (context?.action) {
          scope.setTag('action', context.action);
        }
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }
        if (context?.extra) {
          scope.setExtras(DataSanitizer.scrubObject(context.extra));
        }
        if (context?.userId) {
          scope.setUser({ id: context.userId });
        }

        this.sentryHub.captureException(error);
      });
    } else {
      // Fallback: send to custom backend
      this.sendToCustomBackend({
        message: error.message,
        exception: {
          values: [
            {
              type: error.name,
              value: error.message,
              stacktrace: error.stack ? { frames: this.parseStackTrace(error.stack) } : undefined,
            },
          ],
        },
        level: ErrorSeverity.ERROR,
        breadcrumbs: this.breadcrumbs,
        contexts: context,
        environment: getTelemetryConfig().errorReporting?.environment,
        timestamp: Date.now(),
      });
    }

    // Also track in analytics
    analytics.trackError(error, context as any);

    return eventId;
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: ErrorSeverity = ErrorSeverity.INFO, context?: ErrorContext): string {
    if (!this.isInitialized) {
      return '';
    }

    const eventId = this.generateEventId();

    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'message',
      message,
      level,
    });

    if (this.sentryHub) {
      this.sentryHub.withScope((scope: any) => {
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }
        if (context?.extra) {
          scope.setExtras(DataSanitizer.scrubObject(context.extra));
        }

        this.sentryHub.captureMessage(message, level);
      });
    } else {
      this.sendToCustomBackend({
        message,
        level,
        breadcrumbs: this.breadcrumbs,
        contexts: context,
        environment: getTelemetryConfig().errorReporting?.environment,
        timestamp: Date.now(),
      });
    }

    return eventId;
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    // Also add to Sentry if available
    if (this.sentryHub) {
      this.sentryHub.addBreadcrumb(breadcrumb);
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id?: string; email?: string; name?: string }): void {
    if (this.sentryHub) {
      this.sentryHub.setUser(user);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (this.sentryHub) {
      this.sentryHub.setUser(null);
    }
  }

  /**
   * Set custom tags
   */
  setTag(key: string, value: string): void {
    if (this.sentryHub) {
      this.sentryHub.setTag(key, value);
    }
  }

  /**
   * Set custom context
   */
  setContext(name: string, context: Record<string, any>): void {
    if (this.sentryHub) {
      this.sentryHub.setContext(name, DataSanitizer.scrubObject(context));
    }
  }

  /**
   * Capture user feedback
   */
  captureUserFeedback(feedback: UserFeedback): void {
    if (this.sentryHub) {
      this.sentryHub.captureUserFeedback(feedback);
    } else {
      // Send to custom backend
      const config = getTelemetryConfig();
      if (config.custom?.endpoint) {
        fetch(`${config.custom.endpoint}/user-feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedback),
        }).catch(console.error);
      }
    }
  }

  /**
   * Send to custom backend
   */
  private async sendToCustomBackend(event: SentryEvent): Promise<void> {
    const config = getTelemetryConfig();
    if (!config.custom?.endpoint) return;

    try {
      await fetch(`${config.custom.endpoint}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.custom.apiKey && { 'X-API-Key': config.custom.apiKey }),
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send error to backend:', error);
    }
  }

  /**
   * Parse stack trace into frames
   */
  private parseStackTrace(stack: string): any[] {
    return stack
      .split('\n')
      .slice(1) // Remove first line (error message)
      .map(line => {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            filename: match[2],
            lineno: parseInt(match[3], 10),
            colno: parseInt(match[4], 10),
          };
        }
        return { raw: line.trim() };
      });
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get breadcrumbs
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

// Export singleton instance
export const errorReporting = ErrorReportingService.getInstance();

// Export convenience functions
export const captureException = (error: Error, context?: ErrorContext) =>
  errorReporting.captureException(error, context);

export const captureMessage = (message: string, level?: ErrorSeverity, context?: ErrorContext) =>
  errorReporting.captureMessage(message, level, context);

export const addBreadcrumb = (breadcrumb: Breadcrumb) =>
  errorReporting.addBreadcrumb(breadcrumb);

export const setUser = (user: { id?: string; email?: string; name?: string }) =>
  errorReporting.setUser(user);

export const clearUser = () => errorReporting.clearUser();

export const setTag = (key: string, value: string) => errorReporting.setTag(key, value);

export const setContext = (name: string, context: Record<string, any>) =>
  errorReporting.setContext(name, context);

/**
 * React Error Boundary helper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }
): React.ComponentType<P> {
  return class ErrorBoundary extends React.Component<
    P,
    { hasError: boolean; error?: Error }
  > {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      // Report to error tracking
      captureException(error, {
        component: Component.displayName || Component.name,
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });

      // Call custom error handler
      options?.onError?.(error, errorInfo);
    }

    resetError = () => {
      this.setState({ hasError: false, error: undefined });
    };

    render() {
      if (this.state.hasError && this.state.error) {
        if (options?.fallback) {
          const Fallback = options.fallback;
          return <Fallback error={this.state.error} resetError={this.resetError} />;
        }

        return (
          <div style={{ padding: 20, color: 'red' }}>
            <h2>Something went wrong</h2>
            <pre>{this.state.error.message}</pre>
            <button onClick={this.resetError}>Try again</button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
}

export default errorReporting;
