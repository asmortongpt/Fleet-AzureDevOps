/**
 * Sentry Error Tracking Configuration
 * Provides comprehensive error tracking for the Fleet Management API
 */

import * as Sentry from '@sentry/node';
import { Request } from 'express';
import logger from '../config/logger';


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
  if (!data) {
return data;
}

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
      logger.info('Sentry already initialized');
      return;
    }

    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
      logger.info('Sentry DSN not configured - error tracking disabled');
      return;
    }

    try {
      let profilingIntegration: any = null;
      try {
        // Optional native dependency - guard to avoid hard crash in dev environments.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const profiling = require('@sentry/profiling-node');
        profilingIntegration = profiling?.nodeProfilingIntegration?.();
      } catch (error: any) {
        logger.warn('Sentry profiling disabled', { error: error?.message || 'missing native module' });
      }

      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.SENTRY_RELEASE || 'fleet-api@1.0.0',
        serverName: process.env.HOSTNAME || 'fleet-api-server',

        // Performance monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Integrations - using modern Sentry v8+ API
        integrations: [
          // HTTP integration for automatic request/response tracking
          Sentry.httpIntegration(),
          // Express integration for automatic Express error tracking
          Sentry.expressIntegration(),
          // Postgres integration for database query tracking
          Sentry.postgresIntegration(),
          // Profiling for performance monitoring (optional)
          ...(profilingIntegration ? [profilingIntegration] : []),
          // Console integration to capture console errors
          Sentry.consoleIntegration(),
          // Context lines for better error context
          Sentry.contextLinesIntegration(),
          // Linked errors to track error causes
          Sentry.linkedErrorsIntegration({ key: 'cause', limit: 10 })
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
            event.request = filterSensitiveData(event.request);
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

        // Sample rate for errors (1.0 = 100%)
        sampleRate: process.env.NODE_ENV === 'production' ? 0.9 : 1.0,

        // Maximum breadcrumbs to store
        maxBreadcrumbs: 100,

        // Attach stack trace to messages
        attachStacktrace: true
      });

      this.initialized = true;
      logger.info('Sentry initialized successfully');

      // Set initial context
      Sentry.setContext('runtime', {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      });

    } catch (error) {
      logger.error('Failed to initialize Sentry', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Capture an exception with optional context
   */
  captureException(error: Error, context?: any): string {
    if (!this.initialized) {
      logger.error('Sentry not initialized. Error:', { error: error instanceof Error ? error.message : String(error) });
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
    logger.error(`Error captured with ID: ${eventId}`, { error: error.message });

    return eventId;
  }

  /**
   * Capture a message with specified severity level
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void {
    if (!this.initialized) {
      logger.info(`[${level.toUpperCase()}] ${message}`);
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
    if (!this.initialized) {
return;
}

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
    if (!this.initialized) {
return;
}

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
    if (!this.initialized) {
return null;
}

    return (Sentry as any).startTransaction({
      op,
      name,
      trimEnd: true
    });
  }

  /**
   * Create a span within a transaction
   */
  startSpan(transaction: any, description: string) {
    if (!transaction) {
return null;
}

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
    if (!this.initialized) {
return true;
}

    try {
      return await Sentry.flush(timeout);
    } catch (error) {
      logger.error('Failed to flush Sentry events', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Close Sentry client
   */
  async close(timeout = 2000): Promise<boolean> {
    if (!this.initialized) {
return true;
}

    try {
      return await Sentry.close(timeout);
    } catch (error) {
      logger.error('Failed to close Sentry', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
}

// Export singleton instance
export const sentryService = new SentryService();

// Export Sentry for direct use if needed
export { Sentry };
