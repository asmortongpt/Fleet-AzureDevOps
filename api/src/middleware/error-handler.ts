import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import logger from '../config/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
  }

  logger.error('Unhandled error:', err);

  return res.status(500).json({
    error: 'Internal server error',
    statusCode: 500
  });
}
