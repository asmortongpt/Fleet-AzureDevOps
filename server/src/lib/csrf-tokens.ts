// server/src/lib/csrf-tokens.ts

import crypto from 'crypto';

import { Request, Response, NextFunction } from 'express';

import { FleetLocalConfig } from './config'; // Assuming a config module is available
import { logger } from './logger'; // Assuming a logger module is available

// Enable TypeScript strict mode
'use strict';

// Constants
const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_TOKEN_LENGTH = 32;

// Logger instance
const appLogger = new Logger('CSRF-Tokens');

/**
 * Generates a secure random CSRF token.
 * @returns {string} CSRF token
 */
function generateCsrfToken(): string {
  try {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  } catch (error) {
    appLogger.error('Error generating CSRF token:', error);
    throw new Error('Failed to generate CSRF token');
  }
}

/**
 * Middleware to set CSRF token cookie and header.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const csrfToken = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: true,
      secure: FleetLocalConfig.isProduction, // Ensure secure flag is set in production
      sameSite: 'strict',
    });
    res.setHeader(CSRF_HEADER_NAME, csrfToken);
    next();
  } catch (error) {
    appLogger.error('Error in CSRF token middleware:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * Middleware to verify CSRF token.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const csrfTokenFromCookie = req.cookies[CSRF_COOKIE_NAME];
    const csrfTokenFromHeader = req.headers[CSRF_HEADER_NAME.toLowerCase()];

    if (!csrfTokenFromCookie || !csrfTokenFromHeader || csrfTokenFromCookie !== csrfTokenFromHeader) {
      appLogger.warn('CSRF token verification failed');
      return res.status(403).send('Forbidden');
    }

    next();
  } catch (error) {
    appLogger.error('Error verifying CSRF token:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * FedRAMP Compliance Notes:
 * - Ensure secure flag is set on cookies in production to protect against MITM attacks.
 * - Use strong cryptographic functions to generate CSRF tokens.
 * - Log all errors and potential security incidents for auditing purposes.
 * - Regularly review and update security measures to comply with FedRAMP and SOC 2 requirements.
 */