/**
 * CORS Middleware - Centralized CORS Configuration
 *
 * This module exports middleware functions for CORS handling:
 * - Main CORS middleware using cors package
 * - Explicit preflight (OPTIONS) handler
 * - Custom CORS headers for non-standard scenarios
 *
 * Security Features:
 * - Environment-specific origin validation
 * - HTTPS enforcement in production
 * - Comprehensive logging of CORS rejections
 * - Preflight caching for performance
 *
 * Compliance:
 * - FedRAMP SC-7 (Boundary Protection)
 * - FedRAMP AC-4 (Information Flow Enforcement)
 * - CWE-346 (Origin Validation Error)
 * - CWE-942 (Overly Permissive CORS Policy)
 */

import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getCorsConfig } from './corsConfig';

/**
 * Main CORS middleware
 * Delegates to the cors package with our secure configuration
 */
export const corsMiddleware = cors(getCorsConfig());

/**
 * Preflight request handler
 * Explicitly handles OPTIONS requests for all routes
 * This ensures proper CORS preflight handling even with complex routing
 */
export const preflightHandler = cors(getCorsConfig());

/**
 * Manual CORS headers setter (for edge cases)
 * Use this when you need fine-grained control over CORS headers
 * Generally prefer the corsMiddleware instead
 */
export function setCustomCorsHeaders(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  // Log for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CORS Custom] Request from origin: ${origin || 'none'}`);
  }

  // Allow credentials
  res.header('Access-Control-Allow-Credentials', 'true');

  // Set allowed methods
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');

  // Set allowed headers
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,X-CSRF-Token,X-Requested-With'
  );

  // Set exposed headers (for client-side access)
  res.header('Access-Control-Expose-Headers', 'X-Total-Count,X-Page-Count,X-Rate-Limit');

  // Set max age for preflight cache (24 hours)
  res.header('Access-Control-Max-Age', '86400');

  next();
}

/**
 * CORS error handler
 * Catches CORS-related errors and formats them appropriately
 */
export function corsErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  // Check if this is a CORS error
  if (err.message && err.message.includes('CORS')) {
    console.error(`[CORS ERROR] ${err.message}`, {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    return res.status(403).json({
      error: 'CORS Policy Violation',
      message: 'This origin is not allowed to access this resource',
      statusCode: 403
    });
  }

  // Not a CORS error, pass to next error handler
  next(err);
}

/**
 * Development-only CORS logger
 * Logs all CORS-related headers for debugging
 */
export function corsDebugLogger(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'development') {
    return next();
  }

  console.log('[CORS DEBUG] Request Headers:', {
    origin: req.headers.origin,
    referer: req.headers.referer,
    method: req.method,
    path: req.path,
    'access-control-request-method': req.headers['access-control-request-method'],
    'access-control-request-headers': req.headers['access-control-request-headers']
  });

  // Log response CORS headers after request completes
  const originalSend = res.send;
  res.send = function (data): Response {
    console.log('[CORS DEBUG] Response Headers:', {
      'access-control-allow-origin': res.getHeader('access-control-allow-origin'),
      'access-control-allow-credentials': res.getHeader('access-control-allow-credentials'),
      'access-control-allow-methods': res.getHeader('access-control-allow-methods'),
      'access-control-expose-headers': res.getHeader('access-control-expose-headers')
    });
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Preflight success handler
 * Sends a successful response for OPTIONS requests
 */
export function preflightSuccess(req: Request, res: Response): void {
  res.status(204).end();
}

/**
 * Apply all CORS middleware to an Express app
 * Use this as a convenience method to set up CORS in one call
 */
export function applyCorsMiddleware(app: any): void {
  // Add debug logger in development
  if (process.env.NODE_ENV === 'development') {
    app.use(corsDebugLogger);
  }

  // Main CORS middleware
  app.use(corsMiddleware);

  // Handle all OPTIONS requests
  app.options('*', preflightHandler);

  // Add CORS error handler
  app.use(corsErrorHandler);

  console.log('[CORS] Middleware applied successfully');
}

export default {
  corsMiddleware,
  preflightHandler,
  setCustomCorsHeaders,
  corsErrorHandler,
  corsDebugLogger,
  preflightSuccess,
  applyCorsMiddleware
};
