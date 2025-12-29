import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate, schemas } from '../middleware/input-validation';
import { config } from '../services/config';
import { db } from '../services/database';
import { logger } from '../services/logger';
import { AuditLoggerService, AuditEventTypes } from '../services/audit-logger.service';
import { encryptionService } from '../services/encryption';
import { siemIntegration } from '../services/siem-integration';
import { azureBlobService } from '../services/azure-blob';
import { JWTPayload } from '../types';

const router = Router();

// Initialize audit logger (lazily when first needed)
let auditLogger: AuditLoggerService | null = null;

async function getAuditLogger(): Promise<AuditLoggerService> {
  if (!auditLogger) {
    const pool = require('pg').Pool;
    const pgPool = new pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    });
    auditLogger = new AuditLoggerService(pgPool);
  }
  return auditLogger;
}

/**
 * Extract client IP address from request
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * GET /api/security/master-key
 * Fetch encryption master key from Azure Key Vault
 * Requires: Admin role
 */
router.get(
  '/master-key',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.tenant_id?.toString() || 'unknown';
      const ipAddress = getClientIp(req);
      const audit = await getAuditLogger();

      logger.info('Master key fetch requested', {
        userId: req.user?.id,
        tenantId,
      });

      // Fetch master key from Azure Key Vault
      const masterKey = await encryptionService.getMasterKey();

      // Log audit event
      await audit.log({
        tenantId,
        userId: req.user?.id,
        action: AuditEventTypes.ADMIN_ACTION,
        resourceType: 'encryption',
        resourceId: 'master-key',
        ipAddress,
        userAgent: req.headers['user-agent'] || undefined,
        result: 'success',
        after: { action: 'master_key_fetch' },
      });

      // IMPORTANT: Never return the actual master key in plaintext
      // Return only metadata and confirmation of successful retrieval
      res.json({
        success: true,
        keyId: masterKey.id,
        keyVersion: masterKey.version,
        algorithm: 'AES-256-GCM',
        retrievedAt: new Date().toISOString(),
        message: 'Master key successfully retrieved from Azure Key Vault',
      });
    } catch (error) {
      const tenantId = req.user?.tenant_id?.toString() || 'unknown';
      const ipAddress = getClientIp(req);
      const audit = await getAuditLogger();

      logger.error('Master key fetch failed', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
      });

      // Log security event
      await audit.log({
        tenantId,
        userId: req.user?.id,
        action: AuditEventTypes.SECURITY_ALERT,
        resourceType: 'encryption',
        resourceId: 'master-key',
        ipAddress,
        userAgent: req.headers['user-agent'] || undefined,
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: 'Failed to retrieve master key',
        code: 'ENCRYPTION_KEY_RETRIEVAL_FAILED',
      });
    }
  })
);

/**
 * POST /api/audit/log
 * Store audit log entry in database
 * Requires: Authenticated user
 */
router.post(
  '/audit/log',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { action, resourceType, resourceId, before, after, details } = req.body;

      if (!action || !resourceType) {
        res.status(400).json({
          error: 'Missing required fields: action, resourceType',
        });
        return;
      }

      const tenantId = req.user?.tenant_id?.toString() || 'unknown';
      const ipAddress = getClientIp(req);
      const audit = await getAuditLogger();

      // Log to database
      await audit.log({
        tenantId,
        userId: req.user?.id,
        action: action as any,
        resourceType,
        resourceId,
        before,
        after,
        ipAddress,
        userAgent: req.headers['user-agent'] || undefined,
        result: 'success',
      });

      logger.info('Audit log recorded', {
        action,
        resourceType,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        message: 'Audit log recorded successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Audit log recording failed', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        error: 'Failed to record audit log',
        code: 'AUDIT_LOG_FAILED',
      });
    }
  })
);

/**
 * POST /api/audit/blob-storage
 * Store audit log in Azure Blob Storage (immutable)
 * Requires: Admin role
 */
router.post(
  '/audit/blob-storage',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { action, resourceType, resourceId, data } = req.body;

      if (!action || !resourceType) {
        res.status(400).json({
          error: 'Missing required fields: action, resourceType',
        });
        return;
      }

      const tenantId = req.user?.tenant_id?.toString() || 'unknown';
      const ipAddress = getClientIp(req);
      const audit = await getAuditLogger();

      // Create immutable audit record
      const auditRecord = {
        timestamp: new Date().toISOString(),
        tenantId,
        userId: req.user?.id,
        action,
        resourceType,
        resourceId,
        data,
        ipAddress,
        userAgent: req.headers['user-agent'],
        signature: generateAuditSignature({ action, resourceType, tenantId }),
      };

      // Store in Azure Blob Storage with immutable policy
      const blobUrl = await azureBlobService.storeAuditLog(
        tenantId,
        action,
        auditRecord
      );

      // Log to audit logger that blob storage was used
      await audit.log({
        tenantId,
        userId: req.user?.id,
        action: AuditEventTypes.ADMIN_ACTION,
        resourceType: 'audit',
        resourceId: 'blob-storage',
        ipAddress,
        userAgent: req.headers['user-agent'] || undefined,
        result: 'success',
        after: { blobUrl, immutable: true },
      });

      logger.info('Audit log stored in Azure Blob Storage', {
        tenantId,
        action,
        blobUrl,
      });

      res.json({
        success: true,
        message: 'Audit log stored in immutable blob storage',
        blobUrl,
        immutable: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const tenantId = req.user?.tenant_id?.toString() || 'unknown';
      const ipAddress = getClientIp(req);
      const audit = await getAuditLogger();

      logger.error('Blob storage audit logging failed', {
        error: error instanceof Error ? error.message : error,
        tenantId,
      });

      // Log the failure
      await audit.log({
        tenantId,
        userId: req.user?.id,
        action: AuditEventTypes.SECURITY_ALERT,
        resourceType: 'audit',
        resourceId: 'blob-storage',
        ipAddress,
        userAgent: req.headers['user-agent'] || undefined,
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: 'Failed to store audit log in blob storage',
        code: 'BLOB_STORAGE_FAILED',
      });
    }
  })
);

/**
 * POST /api/audit/siem
 * Forward audit log to SIEM system
 * Requires: Admin role
 */
router.post(
  '/audit/siem',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { action, resourceType, severity, details } = req.body;

      if (!action || !resourceType) {
        res.status(400).json({
          error: 'Missing required fields: action, resourceType',
        });
        return;
      }

      const tenantId = req.user?.tenant_id?.toString() || 'unknown';
      const ipAddress = getClientIp(req);
      const audit = await getAuditLogger();

      // Prepare event for SIEM
      const siemEvent = {
        timestamp: new Date().toISOString(),
        eventType: action,
        severity: severity || 'INFO',
        source: 'FleetManagement-API',
        tenantId,
        userId: req.user?.id,
        resourceType,
        details,
        ipAddress,
        environment: config.nodeEnv,
      };

      // Send to SIEM system
      const siemResult = await siemIntegration.sendEvent(siemEvent);

      // Log locally that event was sent to SIEM
      await audit.log({
        tenantId,
        userId: req.user?.id,
        action: AuditEventTypes.ADMIN_ACTION,
        resourceType: 'siem',
        resourceId: action,
        ipAddress,
        userAgent: req.headers['user-agent'] || undefined,
        result: 'success',
        after: { siemEventId: siemResult.eventId, forwarded: true },
      });

      logger.info('Event forwarded to SIEM', {
        tenantId,
        action,
        siemEventId: siemResult.eventId,
      });

      res.json({
        success: true,
        message: 'Event forwarded to SIEM system',
        siemEventId: siemResult.eventId,
        forwarded: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const tenantId = req.user?.tenant_id?.toString() || 'unknown';
      const ipAddress = getClientIp(req);
      const audit = await getAuditLogger();

      logger.error('SIEM integration failed', {
        error: error instanceof Error ? error.message : error,
        tenantId,
      });

      // Log the failure
      await audit.log({
        tenantId,
        userId: req.user?.id,
        action: AuditEventTypes.SECURITY_ALERT,
        resourceType: 'siem',
        resourceId: req.body?.action || 'unknown',
        ipAddress,
        userAgent: req.headers['user-agent'] || undefined,
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: 'Failed to forward event to SIEM',
        code: 'SIEM_INTEGRATION_FAILED',
      });
    }
  })
);

/**
 * POST /api/auth/login
 * Auth0 login handler - exchanges Auth0 code for JWT
 */
router.post(
  '/login',
  validate(schemas.loginRequest.optional().catch(() => ({ idToken: '' }))),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { idToken, email } = req.body;
      const ipAddress = getClientIp(req);

      if (!idToken && !email) {
        res.status(400).json({
          error: 'Missing required fields: idToken or email',
        });
        return;
      }

      // Verify Auth0 ID token (in production, use Auth0's SDK)
      let userEmail = email;
      if (idToken) {
        // Decode token without verification in development
        // In production, verify against Auth0's public key
        try {
          const decoded = jwt.decode(idToken) as any;
          userEmail = decoded?.email || email;
        } catch (e) {
          logger.warn('ID token decode failed, using email parameter');
        }
      }

      if (!userEmail) {
        res.status(400).json({
          error: 'Could not extract email from token or parameters',
        });
        return;
      }

      // Find or create user
      let user = await db.findUserByEmail(userEmail);

      if (!user) {
        // Create new user with default role
        user = await db.createUser(userEmail, `auth0-${Date.now()}`, userEmail, 'user');
        logger.info('New user created via Auth0', { email: userEmail });
      }

      // Generate JWT token
      const jwtPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const jwtToken = jwt.sign(jwtPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as string | number,
      } as jwt.SignOptions);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create session
      await db.createSession(user.id, jwtToken, expiresAt);

      // Log audit event
      const tenantId = user.tenant_id?.toString() || 'unknown';
      await auditLogger.logAuth(
        tenantId,
        user.id,
        'login',
        ipAddress,
        req.headers['user-agent'] || '',
        'success'
      );

      logger.info('User logged in via Auth0', {
        userId: user.id,
        email: userEmail,
        ipAddress,
      });

      res.json({
        success: true,
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.display_name,
        },
        expiresAt,
      });
    } catch (error) {
      const ipAddress = getClientIp(req);
      logger.error('Auth0 login failed', {
        error: error instanceof Error ? error.message : error,
        ipAddress,
      });

      res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
      });
    }
  })
);

/**
 * POST /api/auth/logout
 * Invalidate user session
 * Requires: Authenticated user
 */
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      const ipAddress = getClientIp(req);
      const tenantId = req.user?.tenant_id?.toString() || 'unknown';

      if (token) {
        // Delete session from database
        await db.deleteSession(token);

        // Log audit event
        await auditLogger.logAuth(
          tenantId,
          req.user?.id || null,
          'logout',
          ipAddress,
          req.headers['user-agent'] || '',
          'success'
        );

        logger.info('User logged out', {
          userId: req.user?.id,
          ipAddress,
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        error: 'Logout failed',
        code: 'LOGOUT_FAILED',
      });
    }
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Requires: Authenticated user
 */
router.post(
  '/refresh',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Generate new JWT token
      const jwtPayload: JWTPayload = {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
      };

      const newToken = jwt.sign(jwtPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as string | number,
      } as jwt.SignOptions);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create new session
      await db.createSession(req.user.id, newToken, expiresAt);

      // Delete old session
      const authHeader = req.headers.authorization;
      const oldToken = authHeader && authHeader.split(' ')[1];
      if (oldToken) {
        await db.deleteSession(oldToken);
      }

      logger.info('Token refreshed', {
        userId: req.user.id,
      });

      res.json({
        success: true,
        token: newToken,
        expiresAt,
      });
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        error: 'Token refresh failed',
        code: 'REFRESH_FAILED',
      });
    }
  })
);

/**
 * GET /api/auth/user
 * Get current user with roles and permissions
 * Requires: Authenticated user
 */
router.get(
  '/user',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Fetch latest user data from database
      const user = await db.findUserById(req.user.id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Map roles to permissions (simplified - expand as needed)
      const permissions = getPermissionsForRole(user.role);

      logger.debug('User profile retrieved', {
        userId: user.id,
        role: user.role,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          tenantId: user.tenant_id,
          authProvider: user.auth_provider,
          createdAt: user.created_at,
        },
        permissions,
      });
    } catch (error) {
      logger.error('User profile retrieval failed', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        error: 'Failed to retrieve user profile',
        code: 'USER_PROFILE_FAILED',
      });
    }
  })
);

/**
 * Helper function to generate audit signature
 */
function generateAuditSignature(data: any): string {
  const crypto = require('crypto');
  const signature = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
  return signature;
}

/**
 * Helper function to map roles to permissions
 */
function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'read:all',
      'write:all',
      'delete:all',
      'manage:users',
      'manage:roles',
      'view:audit',
      'manage:security',
      'manage:encryption',
    ],
    user: [
      'read:own',
      'read:fleet',
      'write:own',
      'view:own_audit',
    ],
    viewer: [
      'read:fleet',
    ],
  };

  return rolePermissions[role] || [];
}

export default router;
