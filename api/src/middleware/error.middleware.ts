import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';

import { ApplicationError } from '../errors/AppError';
import { logError, sanitizeError } from '../utils/error-handler';

/**
 * Global error handling middleware for Express.
 * @param err - The error object thrown in the application.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the stack.
 */
export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    return next(err);
  }

  const isAppError = err instanceof ApplicationError;
  const statusCode = isAppError ? err.statusCode : 500;
  const errorMessage = isAppError ? err.message : 'Internal Server Error';

  // Log the error with structured logging
  logError(err, { requestId: req.headers['x-request-id'] });

  // Capture the error in Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  // Send a sanitized error response
  res.status(statusCode).json({
    error: sanitizeError(errorMessage),
    code: statusCode,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id']
  });
}