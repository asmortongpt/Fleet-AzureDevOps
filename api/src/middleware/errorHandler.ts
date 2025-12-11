import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import logger from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.id,
    tenantId: (req as any).user?.tenant_id,
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
      }),
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.url,
  });
}
