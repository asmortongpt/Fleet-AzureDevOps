import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection Middleware
 * Implements Cross-Site Request Forgery protection for state-changing operations
 * Made optional for local development environments
 */

// Optional CSRF protection - gracefully handle missing dependency
let csrfMiddleware: any = null;
let csrfEnabled = false;

try {
  // Try to import csurf if available
  const csrf = require('csurf');

  // CSRF protection with cookie storage
  csrfMiddleware = csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    }
  });

  csrfEnabled = true;
  console.log('✅ CSRF protection enabled');
} catch (error) {
  console.log('ℹ️  CSRF protection not available (csurf not installed) - continuing without CSRF');
  // Create a no-op middleware for compatibility
  csrfMiddleware = (req: Request, res: Response, next: NextFunction) => next();
}

// Export the middleware (either real or no-op)
export const csrfProtection = csrfMiddleware;

// Route handler to provide CSRF token to clients
export function getCsrfToken(req: Request, res: Response): void {
  if (csrfEnabled && typeof req.csrfToken === 'function') {
    res.json({
      success: true,
      csrfToken: req.csrfToken()
    });
  } else {
    res.json({
      success: true,
      csrfToken: null,
      message: 'CSRF protection not enabled'
    });
  }
}

// Error handler specifically for CSRF validation failures
export function csrfErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (csrfEnabled && err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token - request rejected',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }
  next(err);
}
