import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger'; // Assumed logger utility
import { COOKIE_OPTIONS } from '../config'; // Assumed configuration file

// FedRAMP Compliance: Ensure secure handling of CSRF tokens to protect against cross-site request forgery attacks.

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Middleware to generate CSRF token and set it as a cookie
export function csrfTokenGenerator(req: Request, res: Response, next: NextFunction): void {
  try {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      ...COOKIE_OPTIONS,
      httpOnly: false, // Must be accessible via JavaScript
      secure: process.env.NODE_ENV === 'production', // FedRAMP: Secure cookies in production
      sameSite: 'strict', // FedRAMP: Mitigate CSRF attacks
    });
    next();
  } catch (error) {
    logger.error('Failed to generate CSRF token', { error });
    res.status(500).send('Internal Server Error');
  }
}

// Middleware to validate CSRF token
export function csrfTokenValidator(req: Request, res: Response, next: NextFunction): void {
  try {
    const csrfTokenFromCookie = req.cookies[CSRF_COOKIE_NAME];
    const csrfTokenFromHeader = req.headers[CSRF_HEADER_NAME] as string;

    if (!csrfTokenFromCookie || !csrfTokenFromHeader) {
      logger.warn('CSRF token missing');
      return res.status(403).send('Forbidden');
    }

    if (csrfTokenFromCookie !== csrfTokenFromHeader) {
      logger.warn('CSRF token mismatch');
      return res.status(403).send('Forbidden');
    }

    next();
  } catch (error) {
    logger.error('Failed to validate CSRF token', { error });
    res.status(500).send('Internal Server Error');
  }
}