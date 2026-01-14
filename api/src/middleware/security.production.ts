/**
 * PRODUCTION-READY SECURITY MIDDLEWARE
 * Comprehensive security measures including input validation, CSRF, rate limiting, XSS prevention
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import DOMPurify from 'isomorphic-dompurify';
import { z, ZodSchema } from 'zod';

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked. Please try again in 15 minutes.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Moderate rate limiter for data creation endpoints
 * 30 requests per 15 minutes per IP
 */
export const createRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many create requests',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// CSRF PROTECTION
// ============================================================================

const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production';

const {
  generateToken: generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

/**
 * CSRF token generation endpoint
 */
export const csrfTokenHandler = (req: Request, res: Response): void => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
};

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations
 */
export const csrfProtection = doubleCsrfProtection;

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

/**
 * Sanitize string input to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
  }).trim();
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Validate request body against Zod schema
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      } else {
        res.status(400).json({ error: 'Invalid request body' });
      }
    }
  };
};

/**
 * Validate query parameters against Zod schema
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      } else {
        res.status(400).json({ error: 'Invalid query parameters' });
      }
    }
  };
};

// ============================================================================
// SQL INJECTION PREVENTION
// ============================================================================

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Middleware to validate UUID parameters
 */
export const validateUUID = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.params[paramName];

    if (!uuid) {
      res.status(400).json({ error: `${paramName} is required` });
      return;
    }

    if (!isValidUUID(uuid)) {
      res.status(400).json({ error: `Invalid ${paramName} format` });
      return;
    }

    next();
  };
};

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Custom security headers middleware
 * (Note: helmet.js is already used in the main server)
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  );

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Disable DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // Disable IE compatibility mode
  res.setHeader('X-Download-Options', 'noopen');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  next();
};

// ============================================================================
// REQUEST LOGGING & AUDIT
// ============================================================================

/**
 * Log security-relevant events
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Log request details
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id,
    tenantId: (req as any).user?.tenantId,
  };

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      ...logData,
      statusCode: res.statusCode,
      duration,
    }));

    // Log security events
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('SECURITY EVENT:', JSON.stringify({
        ...logData,
        statusCode: res.statusCode,
        event: res.statusCode === 401 ? 'UNAUTHORIZED_ACCESS' : 'FORBIDDEN_ACCESS',
      }));
    }
  });

  next();
};

// ============================================================================
// SENSITIVE DATA FILTERING
// ============================================================================

const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'secret',
  'apiKey',
  'ssn',
  'creditCard',
  'cvv',
  'pin',
];

/**
 * Filter sensitive data from response
 */
export const filterSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(filterSensitiveData);
  }

  const filtered: any = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));

      if (isSensitive) {
        filtered[key] = '***REDACTED***';
      } else if (typeof data[key] === 'object') {
        filtered[key] = filterSensitiveData(data[key]);
      } else {
        filtered[key] = data[key];
      }
    }
  }

  return filtered;
};

// ============================================================================
// ERROR HANDLER (PRODUCTION-SAFE)
// ============================================================================

/**
 * Production-safe error handler
 * Hides internal error details in production
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse = {
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  res.status(500).json(errorResponse);
};

// ============================================================================
// EXPORT ALL MIDDLEWARE
// ============================================================================

export default {
  apiRateLimiter,
  authRateLimiter,
  createRateLimiter,
  csrfProtection,
  csrfTokenHandler,
  sanitizeInput,
  validateBody,
  validateQuery,
  validateUUID,
  securityHeaders,
  securityLogger,
  filterSensitiveData,
  errorHandler,
};
