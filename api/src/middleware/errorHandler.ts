import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.name}: ${err.message}`);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: 'An unexpected error occurred',
    message: err.message
  });
};