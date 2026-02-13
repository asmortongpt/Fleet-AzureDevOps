import { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

/** AppError subclasses that carry a details property (e.g. ValidationError) */
interface AppErrorWithDetails extends AppError {
  details?: unknown;
}

export function standardizeErrors(err: Error, req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const requestId = req.requestId || req.headers['x-request-id'] || '';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: (err as AppErrorWithDetails).details,
        timestamp,
        requestId
      }
    });
  }

  logger.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp,
      requestId
    }
  });
}
