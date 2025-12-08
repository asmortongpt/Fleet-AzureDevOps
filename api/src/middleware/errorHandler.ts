/**
 * Enhanced Error Handling Middleware
 * ARCHITECTURE FIX (Critical): Standardized error handling with custom error hierarchy
 * SECURITY FIX (P0): Log sanitization to prevent log injection (CWE-117)
 */

import { Request, Response, NextFunction } from 'express';

import {
  isApplicationError,
  InternalServerError
} from '../errors/ApplicationError';
import telemetryService from '../monitoring/applicationInsights';
import { sanitizeForLog, sanitizeRequestForLog } from '../utils/logSanitizer';

/**
 * Extended request interface with telemetry tracking
 */
interface TelemetryRequest extends Request {
  telemetry?: {
    startTime: number
    correlationId: string
    userId?: string
  }
}

/**
 * Global error handler middleware
 * Must be registered LAST in the middleware chain
 */
export function errorHandler(
  err: Error,
  req: TelemetryRequest,
  res: Response,
  next: NextFunction
): void {
  // Get correlation ID for tracing
  const correlationId = req.telemetry?.correlationId || 'unknown';

  // Handle ApplicationError (custom errors with proper status codes)
  if (isApplicationError(err)) {
    // Log operational errors as warnings, non-operational as errors
    if (err.isOperational) {
      console.warn('Operational error', {
        correlationId,
        code: err.code,
        message: sanitizeForLog(err.message),
        statusCode: err.statusCode,
        request: sanitizeRequestForLog(req),
        details: err.details
      });
    } else {
      // SECURITY FIX (P0): Sanitize error details to prevent log injection (CWE-117)
      // Fingerprint: b7c4e2f9a3d6b8c1
      console.error('Non-operational error', {
        correlationId,
        code: err.code,
        message: sanitizeForLog(err.message),
        statusCode: err.statusCode,
        request: sanitizeRequestForLog(req),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }

    // Track error in Application Insights
    telemetryService.trackError(err, {
      correlationId,
      code: err.code,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
      method: req.method,
      path: req.path,
      userId: req.telemetry?.userId
    });

    // Send error response
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle unexpected errors (not ApplicationError)
  // SECURITY FIX (P0): Sanitize error details to prevent log injection (CWE-117)
  console.error('Unexpected error', {
    correlationId,
    message: sanitizeForLog(err.message),
    name: sanitizeForLog(err.name),
    request: sanitizeRequestForLog(req),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Track unexpected error in Application Insights
  telemetryService.trackError(err, {
    correlationId,
    errorType: 'UnexpectedError',
    isOperational: false,
    method: req.method,
    path: req.path,
    userId: req.telemetry?.userId
  });

  // Convert to InternalServerError and send response
  const internalError = new InternalServerError(
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred'
  );

  res.status(500).json(internalError.toJSON());
}

/**
 * Async handler wrapper to catch async route handler errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
