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
import logger from '../utils/logger'

// SECURITY: CSRF_SECRET must be set in environment variables (no defaults allowed)
// This prevents CSRF attacks by ensuring unique secret per deployment (CWE-352)
if (!process.env.CSRF_SECRET) {
  console.error('❌ FATAL SECURITY ERROR: CSRF_SECRET environment variable is not set')
  console.error('❌ CSRF_SECRET is required for CSRF protection')
  console.error('❌ Generate a secure secret with: openssl rand -base64 48')
  console.error('❌ Server startup aborted')
  process.exit(1)
}

if (process.env.CSRF_SECRET.length < 32) {
  console.error('❌ FATAL SECURITY ERROR: CSRF_SECRET is too short')
  console.error(`❌ Current length: ${process.env.CSRF_SECRET.length} characters`)
  console.error('❌ Minimum required: 32 characters')
  console.error('❌ Recommended: 64+ characters')
  console.error('❌ Generate a secure secret with: openssl rand -base64 48')
  console.error('❌ Server startup aborted')
  process.exit(1)
}

const CSRF_SECRET = process.env.CSRF_SECRET

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
    logger.error('CSRF token generation error:', { error: error })
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

  // Skip CSRF for login in DEV mode for easier testing
  if (process.env.NODE_ENV === 'development' && req.path === '/api/auth/login') {
    console.log('[CSRF] DEV mode - skipping CSRF protection for login endpoint')
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
