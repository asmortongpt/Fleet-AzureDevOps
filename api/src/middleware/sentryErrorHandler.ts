/**
 * Sentry Error Handler Middleware
 * Captures and reports all unhandled errors to Sentry with full context
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';

import { sentryService, Sentry } from '../monitoring/sentry';

/**
 * Custom error class for operational errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Determine if an error should be reported to Sentry
 */
const shouldReportError = (error: any): boolean => {
  // Don't report client errors except auth failures
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return error.statusCode === 401 || error.statusCode === 403;
  }

  // Don't report operational errors marked as non-critical
  if (error.isOperational === false) {
    return false;
  }

  // Report all other errors
  return true;
};

/**
 * Extract error details for logging
 */
const extractErrorDetails = (error: any) => {
  return {
    name: error.name || 'UnknownError',
    message: error.message || 'An unknown error occurred',
    statusCode: error.statusCode || error.status || 500,
    code: error.code,
    stack: error.stack,
    isOperational: error.isOperational !== undefined ? error.isOperational : false,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format validation errors for better readability
 */
const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors
    .map(err => `${err.type} in ${err.location}: ${err.msg}`)
    .join(', ');
};

/**
 * Sentry request handler - should be the first middleware
 */
export const sentryRequestHandler = () => {
  // Check if Sentry is properly initialized
  if (!Sentry.Handlers || !Sentry.Handlers.requestHandler) {
    // Return a no-op middleware if Sentry is not available
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return Sentry.Handlers.requestHandler({
    include: {
      data: true,
      query_string: true,
      cookies: false, // Don't include cookies for privacy
      headers: true,
      local_variables: false,
      user: true
    },
    timeout: 0,
    parseUser: (req: Request) => {
      // Extract user from JWT or session
      if ((req as any).user) {
        return {
          id: (req as any).user.id,
          email: (req as any).user.email,
          username: (req as any).user.username
        };
      }
      return null;
    }
  });
};

/**
 * Sentry tracing handler - for performance monitoring
 */
export const sentryTracingHandler = () => {
  // Check if Sentry is properly initialized
  if (!Sentry.Handlers || !Sentry.Handlers.tracingHandler) {
    // Return a no-op middleware if Sentry is not available
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return Sentry.Handlers.tracingHandler();
};

/**
 * Main error handler middleware
 */
export const sentryErrorHandler = () => {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    // Extract error details
    const errorDetails = extractErrorDetails(err);

    // Log error for debugging
    console.error('Error occurred:', {
      ...errorDetails,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    // Prepare error context for Sentry
    const errorContext = {
      request: req,
      user: (req as any).user,
      custom: {
        url: req.originalUrl,
        method: req.method,
        params: req.params,
        query: req.query,
        body: req.body,
        errorDetails
      },
      tags: {
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: errorDetails.statusCode.toString(),
        errorType: errorDetails.name
      },
      extra: {
        headers: req.headers,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    };

    // Add breadcrumb for the error
    sentryService.addBreadcrumb(
      `Error in ${req.method} ${req.originalUrl}`,
      'error',
      {
        statusCode: errorDetails.statusCode,
        message: errorDetails.message
      }
    );

    // Report to Sentry if appropriate
    if (shouldReportError(err)) {
      const eventId = sentryService.captureException(err, errorContext);

      // Add event ID to response for user reference
      if (eventId) {
        res.locals.sentryEventId = eventId;
      }
    }

    // Handle specific error types
    let responseMessage = errorDetails.message;
    let responseStatusCode = errorDetails.statusCode;

    // Validation errors
    if (err.errors && Array.isArray(err.errors)) {
      responseMessage = formatValidationErrors(err.errors);
      responseStatusCode = 422;
    }

    // Database errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      responseMessage = 'Service temporarily unavailable';
      responseStatusCode = 503;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      responseMessage = 'Invalid authentication token';
      responseStatusCode = 401;
    } else if (err.name === 'TokenExpiredError') {
      responseMessage = 'Authentication token expired';
      responseStatusCode = 401;
    }

    // MongoDB/Mongoose errors
    if (err.name === 'MongoError' || err.name === 'MongooseError') {
      if (err.code === 11000) {
        responseMessage = 'Duplicate entry found';
        responseStatusCode = 409;
      } else {
        responseMessage = 'Database operation failed';
        responseStatusCode = 500;
      }
    }

    // PostgreSQL errors
    if (err.code && typeof err.code === 'string' && err.code.startsWith('23')) {
      if (err.code === '23505') {
        responseMessage = 'Duplicate entry found';
        responseStatusCode = 409;
      } else if (err.code === '23503') {
        responseMessage = 'Referenced resource not found';
        responseStatusCode = 400;
      } else {
        responseMessage = 'Database constraint violation';
        responseStatusCode = 400;
      }
    }

    // Send error response
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(responseStatusCode).json({
      success: false,
      error: {
        message: responseMessage,
        statusCode: responseStatusCode,
        ...(isDevelopment && {
          code: errorDetails.code,
          stack: errorDetails.stack,
          name: errorDetails.name
        }),
        ...(res.locals.sentryEventId && {
          eventId: res.locals.sentryEventId,
          support: 'Please provide this event ID when contacting support'
        })
      },
      timestamp: new Date().toISOString()
    });
  };
};

/**
 * Async error wrapper for route handlers
 */
export const asyncErrorHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Add request context to error
      if (!error.request) {
        error.request = {
          url: req.originalUrl,
          method: req.method,
          params: req.params,
          query: req.query
        };
      }

      next(error);
    });
  };
};

/**
 * Not found handler - should come before error handler
 */
export const notFoundHandler = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      true,
      'ROUTE_NOT_FOUND'
    );

    // Add breadcrumb for 404
    sentryService.addBreadcrumb(
      '404 Not Found',
      'navigation',
      {
        url: req.originalUrl,
        method: req.method
      }
    );

    next(error);
  };
};

/**
 * Unhandled rejection handler
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);

    sentryService.captureException(
      reason instanceof Error ? reason : new Error(String(reason)),
      {
        tags: {
          type: 'unhandledRejection'
        },
        extra: {
          promise: String(promise),
          reason: String(reason)
        }
      }
    );

    // Don't exit in development
    if (process.env.NODE_ENV === 'production') {
      // Give Sentry time to send the error before shutting down
      sentryService.flush(2000).then(() => {
        process.exit(1);
      });
    }
  });
};

/**
 * Uncaught exception handler
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);

    sentryService.captureException(error, {
      tags: {
        type: 'uncaughtException'
      }
    });

    // Give Sentry time to send the error before shutting down
    sentryService.flush(2000).then(() => {
      process.exit(1);
    });
  });
};

/**
 * Graceful shutdown handler
 */
export const handleGracefulShutdown = () => {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);

    // Flush any remaining Sentry events
    await sentryService.flush(5000);

    // Close Sentry client
    await sentryService.close(2000);

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};