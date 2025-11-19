/**
 * CSRF Protection Middleware
 *
 * Implements Cross-Site Request Forgery protection using the csrf-csrf package.
 * This middleware generates and validates CSRF tokens for state-changing operations.
 *
 * Security Features:
 * - Double Submit Cookie pattern
 * - Secure, HttpOnly cookies
 * - SameSite=Strict attribute
 * - Token rotation on each request
 *
 * Usage:
 * - Apply csrfProtection middleware to all POST, PUT, PATCH, DELETE routes
 * - Client must include CSRF token in X-CSRF-Token header or _csrf field
 * - GET /api/csrf endpoint provides token to clients
 */

import { Request, Response, NextFunction } from 'express'
import { doubleCsrf } from 'csrf-csrf'

const CSRF_SECRET = process.env.CSRF_SECRET || 'fleet-management-csrf-secret-change-in-production'

// Warn if using default secret
if (!process.env.CSRF_SECRET) {
  console.warn('⚠️  WARNING: Using default CSRF secret. Set CSRF_SECRET environment variable in production!')
}

/**
 * Configure CSRF protection with double submit cookie pattern
 */
const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  cookieName: '__Host-csrf.token', // Use __Host- prefix for enhanced security
  cookieOptions: {
    httpOnly: true, // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Prevent CSRF attacks
    path: '/',
    maxAge: 7200000, // 2 hours
  },
  size: 64, // Token size in bytes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Safe methods don't need CSRF protection
  getTokenFromRequest: (req) => {
    // Check multiple locations for CSRF token
    return req.headers['x-csrf-token'] as string ||
           req.body?._csrf ||
           req.query?._csrf as string
  },
})

/**
 * Middleware to generate and send CSRF token to client
 * Mount at GET /api/csrf
 */
export const csrfTokenMiddleware = (req: Request, res: Response) => {
  try {
    const token = generateToken(req, res)

    res.json({
      csrfToken: token,
      message: 'CSRF token generated successfully'
    })
  } catch (error) {
    console.error('CSRF token generation error:', error)
    res.status(500).json({
      error: 'Failed to generate CSRF token'
    })
  }
}

/**
 * CSRF protection middleware
 * Apply to all state-changing routes (POST, PUT, PATCH, DELETE)
 */
export const csrfProtection = doubleCsrfProtection

/**
 * Error handler for CSRF validation failures
 */
export const csrfErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({
      error: 'Invalid or missing CSRF token',
      message: 'CSRF token validation failed. Please refresh the page and try again.'
    })
  } else {
    next(err)
  }
}

/**
 * Conditional CSRF protection middleware
 * Skips CSRF for development mock mode and webhook endpoints
 */
export const conditionalCsrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF for webhook endpoints (they use signature validation instead)
  if (req.path.startsWith('/api/webhooks/')) {
    return next()
  }

  // Skip CSRF in development mock data mode
  if (process.env.USE_MOCK_DATA === 'true' && process.env.NODE_ENV === 'development') {
    return next()
  }

  // Apply CSRF protection
  csrfProtection(req, res, next)
}

export default {
  csrfTokenMiddleware,
  csrfProtection,
  csrfErrorHandler,
  conditionalCsrfProtection
}
