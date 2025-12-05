import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';

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

export default csrfProtection;
