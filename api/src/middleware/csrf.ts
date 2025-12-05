import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection Middleware
 * Implements Cross-Site Request Forgery protection for state-changing operations
 */

// CSRF protection with cookie storage
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  }
});

// Route handler to provide CSRF token to clients
export function getCsrfToken(req: Request, res: Response): void {
  res.json({
    success: true,
    csrfToken: req.csrfToken()
  });
}

// Error handler specifically for CSRF validation failures
export function csrfErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token - request rejected',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }
  next(err);
}
