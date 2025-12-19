import { Request, Response, NextFunction } from 'express';

import { AppInsightsClient } from '../services/AppInsightsClient';
import { Logger } from '../services/Logger';

interface ErrorContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  CRITICAL = 1,
  ERROR = 2,
  WARNING = 3,
  INFO = 4,
}

abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly context?: ErrorContext;
  public readonly severity: ErrorSeverity;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: ErrorContext,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.severity = severity;
    this.context = context;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  serializeErrors() {
    return {
      message: this.message,
      errorCode: this.errorCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        context: this.context,
      }),
    };
  }
}

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>, context?: ErrorContext) {
    super(message, 400, 'VALIDATION_ERROR', ErrorSeverity.WARNING, context);
    this.fields = fields;
  }

  serializeErrors() {
    return {
      ...super.serializeErrors(),
      fields: this.fields,
    };
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 401, 'AUTH_ERROR', ErrorSeverity.WARNING, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 403, 'FORBIDDEN_ERROR', ErrorSeverity.WARNING, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 404, 'NOT_FOUND_ERROR', ErrorSeverity.INFO, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 409, 'CONFLICT_ERROR', ErrorSeverity.WARNING, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, retryAfter?: number, context?: ErrorContext) {
    super(message, 429, 'RATE_LIMIT_ERROR', ErrorSeverity.WARNING, context);
    if (retryAfter) {
      this.context = { ...this.context, retryAfter };
    }
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 500, 'DATABASE_ERROR', ErrorSeverity.CRITICAL, context, false);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, service: string, context?: ErrorContext) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', ErrorSeverity.ERROR, {
      ...context,
      service,
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR', ErrorSeverity.CRITICAL, context);
  }
}

/**
 * Enhanced error handler middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // Build comprehensive error context
  const context: ErrorContext = {
    userId: req.user?.id,
    tenantId: req.tenant?.id,
    requestId: req.headers['x-request-id'] as string || req.id,
    path: req.path,
    method: req.method,
    ip: req.ip || req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
    query: req.query,
    body: sanitizeRequestBody(req.body),
  };

  let appError: AppError;

  if (err instanceof AppError) {
    // Known operational error
    appError = err;
    appError.context = { ...appError.context, ...context };
  } else {
    // Unknown/programming error
    appError = new DatabaseError(
      process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      context
    );
    appError.stack = err.stack;
  }

  // Log the error
  logError(appError, context);

  // Send appropriate response
  const statusCode = appError.statusCode || 500;

  // Don't expose internal error details in production
  const responseBody = process.env.NODE_ENV === 'production' && statusCode >= 500
    ? {
        message: 'Internal Server Error',
        errorCode: appError.errorCode,
        requestId: context.requestId,
      }
    : appError.serializeErrors();

  res.status(statusCode).json(responseBody);

  // For critical non-operational errors, consider alerting or shutting down
  if (!appError.isOperational && appError.severity === ErrorSeverity.CRITICAL) {
    Logger.error('CRITICAL non-operational error detected. Consider graceful shutdown.');
    // In a production environment, you might want to:
    // - Alert the on-call team
    // - Gracefully shutdown the server
    // - Let the orchestrator restart the service
  }
};

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization', 'ssn', 'creditCard'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Log error with comprehensive details
 */
function logError(error: AppError, context: ErrorContext): void {
  const logData = {
    timestamp: new Date().toISOString(),
    message: error.message,
    errorCode: error.errorCode,
    severity: ErrorSeverity[error.severity],
    isOperational: error.isOperational,
    statusCode: error.statusCode,
    context,
    stack: error.stack,
    environment: process.env.NODE_ENV,
  };

  // Log to console/file
  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      Logger.error(`[CRITICAL] ${JSON.stringify(logData)}`);
      break;
    case ErrorSeverity.ERROR:
      Logger.error(`[ERROR] ${JSON.stringify(logData)}`);
      break;
    case ErrorSeverity.WARNING:
      Logger.warn(`[WARNING] ${JSON.stringify(logData)}`);
      break;
    default:
      Logger.info(`[INFO] ${JSON.stringify(logData)}`);
  }

  // Track in Application Insights
  try {
    AppInsightsClient.trackException({
      exception: error,
      properties: {
        ...logData,
        // Remove stack from properties to avoid duplication
        stack: undefined,
      },
      severityLevel: mapSeverityToAppInsights(error.severity),
    });

    // Also track as custom event for easier querying
    AppInsightsClient.trackEvent({
      name: 'APIError',
      properties: {
        errorCode: error.errorCode,
        severity: ErrorSeverity[error.severity],
        statusCode: error.statusCode.toString(),
        path: context.path,
        method: context.method,
        userId: context.userId,
        tenantId: context.tenantId,
      },
    });
  } catch (trackingError) {
    Logger.error(`Failed to track error in Application Insights: ${trackingError}`);
  }
}

/**
 * Map internal severity to Application Insights severity level
 */
function mapSeverityToAppInsights(severity: ErrorSeverity): number {
  // Application Insights severity levels:
  // Verbose = 0, Information = 1, Warning = 2, Error = 3, Critical = 4
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 4;
    case ErrorSeverity.ERROR:
      return 3;
    case ErrorSeverity.WARNING:
      return 2;
    case ErrorSeverity.INFO:
      return 1;
    default:
      return 3;
  }
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Export error classes and types
 */
export {
  AppError,
  ErrorContext,
};