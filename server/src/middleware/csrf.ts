import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';

// CSRF protection middleware
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Endpoint to get CSRF token
export function getCsrfToken(req: Request, res: Response) {
  res.json({ csrfToken: req.csrfToken() });
}

// CSRF error handler
export function csrfErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  // Handle CSRF token errors
  res.status(403).json({
    error: 'Invalid CSRF token',
    message: 'Form has expired. Please refresh the page and try again.'
  });
}

export default csrfProtection;
