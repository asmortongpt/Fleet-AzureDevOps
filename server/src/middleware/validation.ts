/**
 * Input Validation Middleware
 * Security: Centralized validation for common patterns
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Validate numeric ID parameter
 */
export function validateIdParam(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    if (!id || !/^[0-9]+$/.test(id)) {
      return res.status(400).json({ error: `Invalid ${paramName} format` });
    }
    next();
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const { limit, offset } = req.query;

  if (limit) {
    const parsed = parseInt(limit as string, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      return res.status(400).json({ 
        error: 'Invalid limit: must be between 1 and 100' 
      });
    }
  }

  if (offset) {
    const parsed = parseInt(offset as string, 10);
    if (isNaN(parsed) || parsed < 0) {
      return res.status(400).json({ 
        error: 'Invalid offset: must be non-negative' 
      });
    }
  }

  next();
}

/**
 * Sanitize string inputs to prevent XSS
 */
export function sanitizeBody(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field]
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '')
          .trim();
      }
    }
    next();
  };
}

/**
 * Rate limiting helper (basic)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    record.count++;
    next();
  };
}


// Alias for compatibility
export const validate = validateBody;
