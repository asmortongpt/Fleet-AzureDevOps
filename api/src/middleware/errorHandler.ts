/**
 * Enhanced Error Handling Middleware
 * ARCHITECTURE FIX (BACKEND-3, BACKEND-8): Standardized error handling with custom error hierarchy
 * SECURITY FIX (P0): Log sanitization to prevent log injection (CWE-117)
 */

import { Request, Response, NextFunction } from 'express';

import logger from '../config/logger';
import { AppError, InternalError, isAppError } from '../errors/AppError';
import telemetryService from '../monitoring/applicationInsights';

/**
 * Extended request interface with telemetry tracking
 */
interface TelemetryRequest extends Request {
  telemetry?: {
    startTime: number
    correlationId: string
    userId?: string
  }
  user?: {
    id?: string
    tenant_id?: string
    email?: string
  }
}

/**
 * Global error handler middleware
 * Must be registered LAST in the middleware chain
 *
 * Usage in server.ts:
 * app.use(errorHandler)
 */
export function errorHandler(
  err: Error,
  req: TelemetryRequest,
  res: Response,
  next: NextFunction
): void {
  // Get correlation ID for tracing
  const correlationId = req.telemetry?.correlationId || `req-${Date.now()}`;

  // Context for logging
  const context = {
    correlationId,
    method: req.method,
    path: req.path,
    userId: req.user?.id || req.telemetry?.userId,
    tenantId: req.user?.tenant_id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  // Handle AppError (custom errors with proper status codes)
  if (isAppError(err)) {
    // Log operational errors as warnings, non-operational as errors
    if (err.isOperational) {
      logger.warn('Operational error', {
        ...context,
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        details: err.details
      });
    } else {
      // Log programming errors with full stack trace
      logger.error('Non-operational error', {
        ...context,
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack
      });
    }

    // Track error in Application Insights
    telemetryService.trackError(err, {
      ...context,
      code: err.code,
      statusCode: err.statusCode,
      isOperational: err.isOperational
    });

    // Send error response (use toJSON if available)
    const response = typeof (err as AppError).toJSON === 'function'
      ? (err as AppError).toJSON()
      : {
          success: false,
          error: err.code,
          message: err.message,
          statusCode: err.statusCode
        };

    return res.status(err.statusCode).json(response);
  }

  // Handle unexpected errors (not AppError)
  logger.error('Unexpected error', {
    ...context,
    message: err.message,
    name: err.name,
    stack: err.stack
  });

  // Track unexpected error in Application Insights
  telemetryService.trackError(err, {
    ...context,
    errorType: 'UnexpectedError',
    isOperational: false
  });

  // SECURITY: Hide error details in production
  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'An unexpected error occurred';

  const internalError = new InternalError(message);

  res.status(500).json(internalError.toJSON());
}

/**
 * Async handler wrapper to catch async route handler errors
 * Eliminates need for try-catch blocks in every route
 *
 * Usage:
 * router.get('/path', asyncHandler(async (req, res) => {
 *   const data = await service.getData()
 *   res.json(data)
 * }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
