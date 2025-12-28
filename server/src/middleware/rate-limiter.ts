/**
 * Rate Limiting Middleware - Phase 2 Security Hardening
 * Prevents brute force attacks and DoS attempts
 *
 * SECURITY: SEC-PHASE2-003
 * Priority: HIGH
 * CWE: CWE-307 (Improper Restriction of Excessive Authentication Attempts)
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../services/logger';

/**
 * Rate limiter for authentication endpoints
 * Strict limits to prevent credential stuffing
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false, // Count successful requests too
  skipFailedRequests: false, // Count all requests
  handler: (req: Request, res: Response) => {
    logger.securityEvent({
      event: 'RATE_LIMIT_EXCEEDED',
      endpoint: 'auth',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
      retryAfter: 900 // seconds
    });
  }
});

/**
 * Rate limiter for API endpoints
 * More permissive than auth, but still prevents abuse
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.securityEvent({
      event: 'API_RATE_LIMIT_EXCEEDED',
      ip: req.ip,
      endpoint: req.path,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: 'Too many requests, please slow down',
      retryAfter: 60
    });
  }
});

/**
 * Strict rate limiter for sensitive operations
 * e.g., password reset, data export, account deletion
 */
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 attempts per hour
  message: {
    error: 'Too many sensitive operations from this IP',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.securityEvent({
      event: 'SENSITIVE_OPERATION_RATE_LIMIT',
      ip: req.ip,
      endpoint: req.path,
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    });

    res.status(429).json({
      error: 'Too many sensitive operations, please try again in 1 hour',
      retryAfter: 3600
    });
  }
});

/**
 * Custom rate limiter factory for specific use cases
 */
export const createCustomLimiter = (options: {
  windowMs: number;
  max: number;
  eventName: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.securityEvent({
        event: `RATE_LIMIT_${options.eventName}`,
        ip: req.ip,
        endpoint: req.path,
        timestamp: new Date().toISOString()
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};
