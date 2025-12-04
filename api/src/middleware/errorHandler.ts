import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { sanitizeForLog } from '../utils/logSanitizer';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack
      })
    });
  }

  // Unknown error
  // SECURITY FIX (P0): Sanitize error details to prevent log injection (CWE-117)
  // Fingerprint: b7c4e2f9a3d6b8c1
  console.error('Unexpected error', {
    message: sanitizeForLog(err.message),
    name: sanitizeForLog(err.name),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack
    })
  });
}
