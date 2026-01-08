/**
 * Authentication Middleware
 *
 * Provides JWT validation, token refresh, session management, and device fingerprinting.
 * Integrates with AuthenticationService for all authentication operations.
 *
 * @module middleware/auth
 */

import crypto from 'crypto';

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { Pool } from 'pg';

import { AuditService, AuditCategory, AuditSeverity } from '../services/audit/AuditService';
import { AuthenticationService, TokenPayload } from '../services/auth/AuthenticationService';


// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      session?: {
        id: number;
        uuid: string;
      };
      deviceFingerprint?: string;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthenticationService;
  private auditService: AuditService;

  constructor(pool: Pool, redis: Redis, auditService: AuditService) {
    this.authService = new AuthenticationService(pool, redis);
    this.auditService = auditService;
  }

  /**
   * Authenticate JWT token from Authorization header
   *
   * Usage:
   * app.get('/protected', authMiddleware.authenticate, (req, res) => {
   *   res.json({ user: req.user });
   * });
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NO_TOKEN',
            message: 'No authentication token provided'
          }
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Validate token
      const payload = await this.authService.validateAccessToken(token);

      if (!payload) {
        // Log failed authentication attempt
        await this.auditService.log({
          userId: 'anonymous',
          action: 'authenticate',
          category: AuditCategory.AUTHENTICATION,
          severity: AuditSeverity.WARNING,
          result: 'failure',
          errorMessage: 'Invalid or expired token',
          metadata: {
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            requestId: req.headers['x-request-id'] as string
          }
        });

        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Authentication token is invalid or expired'
          }
        });
        return;
      }

      // Attach user info to request
      req.user = payload;
      req.session = {
        id: payload.sessionId,
        uuid: payload.sessionUuid
      };

      // Log successful authentication
      await this.auditService.log({
        userId: payload.userId.toString(),
        action: 'authenticate',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.INFO,
        result: 'success',
        metadata: {
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          sessionId: payload.sessionUuid,
          requestId: req.headers['x-request-id'] as string
        }
      });

      next();
    } catch (error) {
      // Log error
      await this.auditService.log({
        userId: 'anonymous',
        action: 'authenticate',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.ERROR,
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          requestId: req.headers['x-request-id'] as string
        }
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed'
        }
      });
    }
  };

  /**
   * Optional authentication - continues even if no token provided
   * Sets req.user if valid token exists, otherwise continues without user
   *
   * Usage:
   * app.get('/public', authMiddleware.optional, (req, res) => {
   *   if (req.user) {
   *     // Show personalized content
   *   } else {
   *     // Show public content
   *   }
   * });
   */
  optional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.substring(7);
      const payload = await this.authService.validateAccessToken(token);

      if (payload) {
        req.user = payload;
        req.session = {
          id: payload.sessionId,
          uuid: payload.sessionUuid
        };
      }

      next();
    } catch (error) {
      // Continue without authentication on error
      next();
    }
  };

  /**
   * Refresh access token using refresh token
   *
   * Usage:
   * app.post('/auth/refresh', authMiddleware.refresh);
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'Refresh token is required'
          }
        });
        return;
      }

      // Refresh the token
      const result = await this.authService.refreshAccessToken(refreshToken);

      await this.auditService.log({
        userId: 'token-refresh',
        action: 'refresh_token',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.INFO,
        result: 'success',
        metadata: {
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      await this.auditService.log({
        userId: 'token-refresh',
        action: 'refresh_token',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.WARNING,
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });

      res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: error instanceof Error ? error.message : 'Token refresh failed'
        }
      });
    }
  };

  /**
   * Extract device fingerprint from request
   */
  deviceFingerprint = (req: Request, res: Response, next: NextFunction): void => {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const ip = req.ip || req.socket.remoteAddress || '';

    // Create a simple fingerprint (in production, use a more sophisticated library)
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`)
      .digest('hex');

    req.deviceFingerprint = fingerprint;
    next();
  };

  /**
   * Require MFA for sensitive operations
   */
  requireMFA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Check if user has MFA enabled (would query database in real implementation)
    // For now, just continue
    next();
  };
}

/**
 * Factory function to create auth middleware
 */
export function createAuthMiddleware(pool: Pool, redis: Redis, auditService: AuditService): AuthMiddleware {
  return new AuthMiddleware(pool, redis, auditService);
}
