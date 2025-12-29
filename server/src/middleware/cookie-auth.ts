import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Middleware to set httpOnly cookies on login
export const setAuthCookies = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, csrfToken } = req.body;
    if (!token || !csrfToken) {
      logger.error('Missing token or CSRF token');
      return res.status(400).send('Bad Request');
    }

    // Set secure, httpOnly cookies
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    logger.info('Auth cookies set successfully');
    next();
  } catch (error) {
    logger.error('Error setting auth cookies', error);
    res.status(500).send('Internal Server Error');
  }
};

// Middleware for automatic CSRF token injection
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const csrfToken = req.cookies['csrf_token'];
  if (!csrfToken || req.headers['x-csrf-token'] !== csrfToken) {
    logger.warn('CSRF token mismatch');
    return res.status(403).send('Forbidden');
  }
  next();
};

// Middleware to refresh cookies on activity
export const refreshAuthCookies = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies['auth_token'];
    if (!token) {
      logger.warn('No auth token found');
      return res.status(401).send('Unauthorized');
    }

    // Verify and refresh token logic here
    const newToken = jwt.sign({ data: 'newData' }, 'secret', { expiresIn: '1h' });
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    logger.info('Auth cookies refreshed');
    next();
  } catch (error) {
    logger.error('Error refreshing auth cookies', error);
    res.status(500).send('Internal Server Error');
  }
};

// Middleware to clear cookies on logout
export const clearAuthCookies = (req: Request, res: Response) => {
  try {
    res.clearCookie('auth_token');
    res.clearCookie('csrf_token');
    logger.info('Auth cookies cleared');
    res.status(200).send('Logged out');
  } catch (error) {
    logger.error('Error clearing auth cookies', error);
    res.status(500).send('Internal Server Error');
  }
};
