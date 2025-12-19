import { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError';

export function standardizeErrors(err: Error, req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const requestId = req.id || '';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: (err as any).details,
        timestamp,
        requestId
      }
    });
  }

  console.error('Unexpected error:', err);
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
