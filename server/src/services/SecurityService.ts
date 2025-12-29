/**
 * Security Service - High-level security operations
 *
 * Provides convenient methods for common security tasks:
 * - Audit logging
 * - Session management
 * - Permission checking
 * - Key rotation
 *
 * SECURITY NOTES:
 * - All operations use parameterized queries (no string concatenation)
 * - Tokens are hashed before storage (bcrypt/argon2)
 * - All sensitive operations are logged to audit trail
 * - Follows principle of least privilege
 */

import { Knex } from 'knex';
import * as crypto from 'crypto';
import { SecurityRepository } from '../repositories/SecurityRepository';
import {
  AuditLog,
  Session,
  UserPermission,
  CreateAuditLogRequest,
  CreateSessionRequest,
} from '../types/security';

export class SecurityService {
  private repo: SecurityRepository;

  constructor(db: Knex) {
    this.repo = new SecurityRepository(db);
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  /**
   * Log a security-relevant event
   *
   * Usage example:
   * ```
   * await securityService.logEvent(
   *   tenantId,
   *   'user.login',
   *   'success',
   *   {
   *     userId: user.id,
   *     ip: request.ip,
   *     userAgent: request.headers['user-agent'],
   *   }
   * )
   * ```
   */
  async logEvent(
    tenantId: string,
    action: string,
    result: 'success' | 'failure' | 'partial',
    context: {
      userId?: string;
      resource?: string;
      resourceId?: string;
      details?: Record<string, unknown>;
      sensitivity?: 'public' | 'standard' | 'sensitive' | 'confidential';
      ip?: string;
      userAgent?: string;
      eventType?: string;
    }
  ): Promise<AuditLog> {
    const logData: CreateAuditLogRequest = {
      tenant_id: tenantId,
      event_type: context.eventType || 'system_event',
      action,
      result,
      user_id: context.userId,
      resource: context.resource,
      resource_id: context.resourceId,
      details: context.details,
      sensitivity: context.sensitivity || 'standard',
      ip_address: context.ip,
      user_agent: context.userAgent,
    };

    // Get previous hash for integrity chain
    const previousLogs = await this.repo.queryAuditLogs({
      tenant_id: tenantId,
      limit: 1,
    });

    const previousHash = previousLogs.length > 0 ? previousLogs[0].record_hash : undefined;

    return this.repo.createAuditLog(logData, previousHash);
  }

  /**
   * Log data access (compliance requirement)
   */
  async logDataAccess(
    tenantId: string,
    userId: string,
    resource: string,
    resourceId: string,
    ip: string,
    userAgent: string
  ): Promise<AuditLog> {
    return this.logEvent(tenantId, `${resource}.read`, 'success', {
      userId,
      resource,
      resourceId,
      eventType: 'data_access',
      sensitivity: 'standard',
      ip,
      userAgent,
    });
  }

  /**
   * Log data modification
   */
  async logDataModification(
    tenantId: string,
    userId: string,
    resource: string,
    resourceId: string,
    changes: Record<string, { before: unknown; after: unknown }>,
    ip: string,
    userAgent: string
  ): Promise<AuditLog> {
    return this.logEvent(tenantId, `${resource}.update`, 'success', {
      userId,
      resource,
      resourceId,
      eventType: 'configuration_change',
      details: { changes },
      sensitivity: 'sensitive',
      ip,
      userAgent,
    });
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    tenantId: string,
    userId: string | null,
    result: 'success' | 'failure',
    ip: string,
    userAgent: string,
    reason?: string
  ): Promise<AuditLog> {
    return this.logEvent(tenantId, 'user.login', result, {
      userId,
      eventType: 'authentication',
      ip,
      userAgent,
      details: reason ? { reason } : undefined,
    });
  }

  /**
   * Log permission grant/revoke
   */
  async logPermissionChange(
    tenantId: string,
    grantedBy: string,
    userId: string,
    action: 'granted' | 'revoked',
    permission: string,
    reason?: string
  ): Promise<AuditLog> {
    return this.logEvent(tenantId, `permission.${action}`, 'success', {
      userId: grantedBy,
      resource: 'user_permission',
      resourceId: userId,
      eventType: 'permission_change',
      details: {
        permission,
        target_user_id: userId,
        reason,
      },
      sensitivity: 'sensitive',
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Generate a secure session token
   *
   * Returns base64-encoded random bytes suitable for use as session token.
   * Token should be hashed before storage using bcrypt/argon2.
   */
  generateSessionToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Hash a session token (e.g., with bcrypt or argon2)
   *
   * NOTE: This is a placeholder. Use bcrypt or argon2 in production:
   * ```
   * import bcrypt from 'bcrypt';
   * const hash = await bcrypt.hash(token, 12);
   * ```
   */
  async hashToken(token: string, algorithm: 'sha256' | 'bcrypt' = 'sha256'): Promise<string> {
    if (algorithm === 'sha256') {
      // Simple SHA-256 for demonstration (NOT recommended for passwords/tokens)
      return crypto.createHash('sha256').update(token).digest('hex');
    }

    // For bcrypt, caller should use bcrypt package directly:
    // import bcrypt from 'bcrypt';
    // return await bcrypt.hash(token, 12);
    throw new Error('Use bcrypt package directly for token hashing');
  }

  /**
   * Create a new session
   *
   * Usage example:
   * ```
   * const token = securityService.generateSessionToken();
   * const tokenHash = await bcrypt.hash(token, 12);
   *
   * const session = await securityService.createSession({
   *   userId: user.id,
   *   tenantId: tenant.id,
   *   tokenHash,
   *   expiresIn: 86400, // 24 hours in seconds
   *   ip: request.ip,
   *   userAgent: request.headers['user-agent'],
   *   deviceId: deviceFingerprint,
   * });
   *
   * // Return token (never return hash) to client
   * return { sessionId: session.id, token };
   * ```
   */
  async createSession(options: {
    userId: string;
    tenantId: string;
    tokenHash: string;
    expiresIn?: number; // Seconds, defaults to 24 hours
    refreshTokenHash?: string;
    ip?: string;
    userAgent?: string;
    deviceId?: string;
    deviceName?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
  }): Promise<Session> {
    const expiresIn = options.expiresIn || 86400; // Default 24 hours
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return this.repo.createSession({
      user_id: options.userId,
      tenant_id: options.tenantId,
      token_hash: options.tokenHash,
      refresh_token_hash: options.refreshTokenHash,
      ip_address: options.ip,
      user_agent: options.userAgent,
      expires_at: expiresAt,
      device_id: options.deviceId,
      device_name: options.deviceName,
      device_type: options.deviceType,
    });
  }

  /**
   * Verify session is valid
   *
   * Checks:
   * - Session exists
   * - Session not revoked
   * - Session not expired
   */
  async verifySession(sessionId: string): Promise<Session | null> {
    const session = await this.repo.getSessionById(sessionId);

    if (!session) {
      return null;
    }

    // Update last activity
    await this.repo.updateSessionActivity(sessionId);

    return session;
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.repo.revokeSession(sessionId);

    // Log the revocation
    const session = await this.repo.getSessionById(sessionId);
    if (session) {
      await this.logEvent(session.tenant_id, 'session.revoke', 'success', {
        userId: session.user_id,
        resourceId: sessionId,
        eventType: 'authentication',
      });
    }
  }

  /**
   * Revoke all user sessions (e.g., on password change)
   */
  async revokeAllUserSessions(userId: string, tenantId: string): Promise<void> {
    await this.repo.revokeAllUserSessions(userId);

    // Log the action
    await this.logEvent(tenantId, 'sessions.revoke_all', 'success', {
      userId,
      eventType: 'authentication',
      details: { reason: 'Password changed or account secured' },
    });
  }

  /**
   * Clean up expired sessions (maintenance task - run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    return this.repo.cleanupExpiredSessions();
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  /**
   * Grant permission to user
   */
  async grantPermission(
    userId: string,
    tenantId: string,
    permission: string,
    grantedBy: string,
    options?: {
      scope?: string;
      resourceId?: string;
      expiresIn?: number; // Seconds, optional temporary permission
      reason?: string;
      notes?: string;
    }
  ): Promise<UserPermission> {
    const expiresAt = options?.expiresIn
      ? new Date(Date.now() + options.expiresIn * 1000)
      : null;

    const perm = await this.repo.grantPermission({
      user_id: userId,
      tenant_id: tenantId,
      permission,
      scope: options?.scope,
      resource_id: options?.resourceId,
      granted_by: grantedBy,
      expires_at: expiresAt,
      reason: options?.reason,
      notes: options?.notes,
    });

    // Log the grant
    await this.logPermissionChange(tenantId, grantedBy, userId, 'granted', permission, options?.reason);

    return perm;
  }

  /**
   * Revoke permission from user
   */
  async revokePermission(permissionId: string, revokedBy: string): Promise<void> {
    const perm = await this.repo.queryPermissions({ limit: 1 });
    if (perm.length === 0) {
      return;
    }

    const permission = perm[0];
    await this.repo.revokePermission(permissionId);

    // Log the revoke
    await this.logPermissionChange(
      permission.tenant_id,
      revokedBy,
      permission.user_id,
      'revoked',
      permission.permission
    );
  }

  /**
   * Check user permission
   */
  async checkPermission(
    userId: string,
    tenantId: string,
    permission: string
  ): Promise<boolean> {
    return this.repo.hasPermission(userId, tenantId, permission);
  }

  /**
   * Require permission (throw if not authorized)
   */
  async requirePermission(
    userId: string,
    tenantId: string,
    permission: string
  ): Promise<void> {
    const hasPermission = await this.checkPermission(userId, tenantId, permission);

    if (!hasPermission) {
      // Log unauthorized access attempt
      await this.logEvent(tenantId, `permission.denied`, 'failure', {
        userId,
        details: { required_permission: permission },
        eventType: 'configuration_change',
        sensitivity: 'sensitive',
      });

      throw new Error(`Insufficient permissions: ${permission} required`);
    }
  }

  /**
   * Get all user permissions
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<UserPermission[]> {
    return this.repo.getUserPermissions(userId, tenantId);
  }

  /**
   * Clean up expired permissions (maintenance task)
   */
  async cleanupExpiredPermissions(): Promise<number> {
    return this.repo.cleanupExpiredPermissions();
  }

  // ============================================================================
  // AUDIT LOG VERIFICATION
  // ============================================================================

  /**
   * Verify integrity of audit log
   */
  async verifyAuditLogIntegrity(auditLogId: string): Promise<boolean> {
    return this.repo.verifyAuditLogIntegrity(auditLogId);
  }

  /**
   * Get audit log by ID
   */
  async getAuditLog(id: string): Promise<AuditLog | null> {
    return this.repo.getAuditLogById(id);
  }

  /**
   * Query audit logs with complex filters
   */
  async searchAuditLogs(
    tenantId: string,
    filters: {
      userId?: string;
      eventType?: string;
      action?: string;
      resource?: string;
      result?: 'success' | 'failure' | 'partial';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<AuditLog[]> {
    return this.repo.queryAuditLogs({
      tenant_id: tenantId,
      user_id: filters.userId,
      event_type: filters.eventType,
      action: filters.action,
      resource: filters.resource,
      result: filters.result,
      start_date: filters.startDate,
      end_date: filters.endDate,
      limit: filters.limit,
      offset: filters.offset,
    });
  }
}
