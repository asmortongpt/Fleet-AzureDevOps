/**
 * @file logMiddleware.ts
 * @description Middleware to sanitize logs in an Express application.
 */

import { Request, Response, NextFunction } from 'express';
import { sanitizeForLogging } from './logSanitizer';

import logger from '@/utils/logger';
/**
 * Middleware to sanitize request logs.
 * @param req - The HTTP request.
 * @param res - The HTTP response.
 * @param next - The next middleware function.
 */
export function logSanitizationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sanitizedBody = sanitizeForLogging(req.body);
  const sanitizedQuery = sanitizeForLogging(req.query);
  const sanitizedParams = sanitizeForLogging(req.params);

  logger.debug('Sanitized Request:', {
    body: sanitizedBody,
    query: sanitizedQuery,
    params: sanitizedParams,
  });

  next();
}