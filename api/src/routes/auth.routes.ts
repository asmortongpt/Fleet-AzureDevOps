/**
 * Authentication Routes
 *
 * Endpoints for registration, login, MFA setup, and token management
 */

import { Router, Request, Response } from 'express';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { z } from 'zod';

import { ApiError } from '../middleware/error.middleware';
import { AuditService, AuditCategory, AuditSeverity } from '../services/audit/AuditService';
import { AuthenticationService } from '../services/auth/AuthenticationService';
import { authenticateJWT } from '../middleware/auth'


// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  mfaCode: z.string().length(6).optional(),
  deviceId: z.string().optional(),
  deviceName: z.string().optional()
});

const mfaVerifySchema = z.object({
  code: z.string().length(6)
});

export function createAuthRoutes(pool: Pool, redis: Redis, auditService: AuditService): Router {
  const router = Router();

// Note: Do not apply authentication globally. Login/register must be public.
  const authService = new AuthenticationService(pool, redis);

  /**
   * POST /auth/register
   * Register a new user account
   */
  router.post('/register', async (req: Request, res: Response, next) => {
    try {
      const data = registerSchema.parse(req.body);

      const result = await authService.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      });

      await auditService.log({
        userId: result.userId.toString(),
        action: 'user_register',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.INFO,
        result: 'success',
        metadata: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });

      res.status(201).json({
        success: true,
        data: {
          userId: result.userId,
          uuid: result.uuid,
          message: 'Registration successful. Please verify your email.'
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /auth/login
   * Authenticate user and get access token
   */
  router.post('/login', async (req: Request, res: Response, next) => {
    try {
      const data = loginSchema.parse(req.body);

      const result = await authService.login({
        email: data.email,
        password: data.password,
        mfaCode: data.mfaCode,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      });

      if (!result.success && result.requiresMFA) {
        res.json({
          success: false,
          requiresMFA: true,
          message: 'MFA verification required'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          user: result.user
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /auth/logout
   * Revoke current session
   */
  router.post('/logout', authenticateJWT, async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      if (!user || !user.sessionUuid) {
        throw new ApiError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      await authService.revokeSession(user.sessionUuid);

      await auditService.log({
        userId: user.userId.toString(),
        action: 'user_logout',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.INFO,
        result: 'success',
        metadata: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          sessionId: user.sessionUuid
        }
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  router.post('/refresh', authenticateJWT, async (req: Request, res: Response, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new ApiError('Refresh token required', 400, 'VALIDATION_ERROR');
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /auth/mfa/setup
   * Setup MFA for authenticated user
   */
  router.post('/mfa/setup', authenticateJWT, async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      if (!user) {
        throw new ApiError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const result = await authService.setupMFA(user.userId);

      res.json({
        success: true,
        data: {
          secret: result.secret,
          qrCodeUrl: result.qrCodeUrl,
          backupCodes: result.backupCodes
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /auth/mfa/verify
   * Verify and enable MFA
   */
  router.post('/mfa/verify', authenticateJWT, async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      if (!user) {
        throw new ApiError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { code } = mfaVerifySchema.parse(req.body);
      await authService.enableMFA(user.userId, code);

      await auditService.log({
        userId: user.userId.toString(),
        action: 'mfa_enabled',
        category: AuditCategory.SECURITY_EVENT,
        severity: AuditSeverity.INFO,
        result: 'success',
        metadata: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });

      res.json({
        success: true,
        message: 'MFA enabled successfully'
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /auth/me
   * Get current authenticated user info
   */
  router.get('/me', authenticateJWT, async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      if (!user) {
        throw new ApiError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      res.json({
        success: true,
        data: {
          userId: user.userId,
          uuid: user.userUuid,
          email: user.email,
          sessionId: user.sessionId
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
