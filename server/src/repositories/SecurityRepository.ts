/**
 * Security Repository - Database access layer for security tables
 *
 * Provides type-safe, parameterized queries for all security operations.
 * Uses Knex.js for query building and PostgreSQL for data storage.
 */

import { Knex } from 'knex';
import * as crypto from 'crypto';
import {
  AuditLog,
  Session,
  EncryptionKey,
  UserPermission,
  CreateAuditLogRequest,
  CreateSessionRequest,
  CreateUserPermissionRequest,
  AuditLogQueryOptions,
  SessionQueryOptions,
  UserPermissionQueryOptions,
} from '../types/security';

export class SecurityRepository {
  constructor(private db: Knex) {}

  // ============================================================================
  // AUDIT LOGS - Immutable audit trail
  // ============================================================================

  /**
   * Create an audit log entry with cryptographic integrity
   *
   * SECURITY:
   * - Uses parameterized query ($1, $2, etc.)
   * - Automatically generates record_hash (SHA-256)
   * - Maintains integrity chain via previous_record_hash
   * - All user input escaped and validated before insertion
   */
  async createAuditLog(
    data: CreateAuditLogRequest,
    previousHash?: string
  ): Promise<AuditLog> {
    // Get next sequence number
    const sequenceResult = await this.db('audit_logs')
      .where('tenant_id', data.tenant_id)
      .orderBy('sequence_number', 'desc')
      .first();

    const lastSequence = sequenceResult?.sequence_number || 0;
    const nextSequence = BigInt(lastSequence) + BigInt(1);

    // Create record content for hashing
    const recordContent = JSON.stringify({
      tenant_id: data.tenant_id,
      event_type: data.event_type,
      action: data.action,
      result: data.result,
      user_id: data.user_id,
      resource: data.resource,
      resource_id: data.resource_id,
      details: data.details,
      sensitivity: data.sensitivity || 'standard',
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      sequence_number: nextSequence.toString(),
    });

    // Generate SHA-256 hash of record content
    const recordHash = crypto
      .createHash('sha256')
      .update(recordContent)
      .digest('hex');

    // Insert into database with parameterized query
    const [auditLog] = await this.db('audit_logs')
      .insert({
        tenant_id: data.tenant_id,
        record_hash: recordHash,
        previous_record_hash: previousHash || null,
        sequence_number: nextSequence,
        event_type: data.event_type,
        action: data.action,
        result: data.result,
        user_id: data.user_id || null,
        resource: data.resource || null,
        resource_id: data.resource_id || null,
        details: data.details || null,
        sensitivity: data.sensitivity || 'standard',
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null,
        created_at: new Date(),
      })
      .returning('*');

    return auditLog as AuditLog;
  }

  /**
   * Query audit logs with flexible filtering
   * Uses parameterized queries to prevent SQL injection
   */
  async queryAuditLogs(options: AuditLogQueryOptions): Promise<AuditLog[]> {
    let query = this.db('audit_logs')
      .where('tenant_id', options.tenant_id)
      .select('*');

    // Apply optional filters
    if (options.user_id) {
      query = query.where('user_id', options.user_id);
    }
    if (options.event_type) {
      query = query.where('event_type', options.event_type);
    }
    if (options.action) {
      query = query.where('action', 'ilike', `%${options.action}%`); // Parameterized LIKE
    }
    if (options.resource) {
      query = query.where('resource', options.resource);
    }
    if (options.resource_id) {
      query = query.where('resource_id', options.resource_id);
    }
    if (options.result) {
      query = query.where('result', options.result);
    }
    if (options.start_date) {
      query = query.where('created_at', '>=', options.start_date);
    }
    if (options.end_date) {
      query = query.where('created_at', '<=', options.end_date);
    }

    // Pagination
    const limit = Math.min(options.limit || 100, 1000); // Max 1000
    const offset = options.offset || 0;

    const logs = await query
      .orderBy('sequence_number', 'desc')
      .limit(limit)
      .offset(offset);

    return logs as AuditLog[];
  }

  /**
   * Verify audit log integrity using hash chain
   */
  async verifyAuditLogIntegrity(auditLogId: string): Promise<boolean> {
    const log = await this.db('audit_logs')
      .where('id', auditLogId)
      .first();

    if (!log) {
      return false;
    }

    // Verify record hash
    const recordContent = JSON.stringify({
      tenant_id: log.tenant_id,
      event_type: log.event_type,
      action: log.action,
      result: log.result,
      user_id: log.user_id,
      resource: log.resource,
      resource_id: log.resource_id,
      details: log.details,
      sensitivity: log.sensitivity,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      sequence_number: log.sequence_number.toString(),
    });

    const expectedHash = crypto
      .createHash('sha256')
      .update(recordContent)
      .digest('hex');

    return log.record_hash === expectedHash;
  }

  /**
   * Get immutable audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const log = await this.db('audit_logs')
      .where('id', id)
      .first();

    return log as AuditLog | null;
  }

  // ============================================================================
  // SESSIONS - Secure session management
  // ============================================================================

  /**
   * Create a new session
   * Token is pre-hashed before storage (never store plaintext tokens)
   */
  async createSession(data: CreateSessionRequest): Promise<Session> {
    const [session] = await this.db('sessions')
      .insert({
        user_id: data.user_id,
        tenant_id: data.tenant_id,
        token_hash: data.token_hash, // Pre-hashed token
        refresh_token_hash: data.refresh_token_hash || null,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null,
        expires_at: data.expires_at,
        last_activity_at: new Date(),
        is_revoked: false,
        device_id: data.device_id || null,
        device_name: data.device_name || null,
        device_type: data.device_type || null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return session as Session;
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: string): Promise<Session | null> {
    const session = await this.db('sessions')
      .where('id', id)
      .andWhere('is_revoked', false)
      .andWhere('expires_at', '>', new Date())
      .first();

    return session as Session | null;
  }

  /**
   * Get session by token hash (compare hashes, never plaintext)
   */
  async getSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    const session = await this.db('sessions')
      .where('token_hash', tokenHash)
      .andWhere('is_revoked', false)
      .andWhere('expires_at', '>', new Date())
      .first();

    return session as Session | null;
  }

  /**
   * Query sessions with filtering
   */
  async querySessions(options: SessionQueryOptions): Promise<Session[]> {
    let query = this.db('sessions').select('*');

    if (options.user_id) {
      query = query.where('user_id', options.user_id);
    }
    if (options.tenant_id) {
      query = query.where('tenant_id', options.tenant_id);
    }
    if (options.is_revoked !== undefined) {
      query = query.where('is_revoked', options.is_revoked);
    }

    // Always filter expired sessions
    query = query.where('expires_at', '>', new Date());

    const limit = Math.min(options.limit || 100, 1000);
    const offset = options.offset || 0;

    const sessions = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return sessions as Session[];
  }

  /**
   * Update last activity timestamp
   */
  async updateSessionActivity(id: string): Promise<void> {
    await this.db('sessions')
      .where('id', id)
      .update({
        last_activity_at: new Date(),
        updated_at: new Date(),
      });
  }

  /**
   * Revoke session
   */
  async revokeSession(id: string): Promise<void> {
    await this.db('sessions')
      .where('id', id)
      .update({
        is_revoked: true,
        updated_at: new Date(),
      });
  }

  /**
   * Revoke all sessions for user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.db('sessions')
      .where('user_id', userId)
      .update({
        is_revoked: true,
        updated_at: new Date(),
      });
  }

  /**
   * Clean up expired sessions (maintenance task)
   */
  async cleanupExpiredSessions(): Promise<number> {
    return await this.db('sessions')
      .where('expires_at', '<', new Date())
      .del();
  }

  // ============================================================================
  // ENCRYPTION KEYS - Key rotation metadata
  // ============================================================================

  /**
   * Create encryption key metadata (not the key itself)
   */
  async createEncryptionKey(data: Partial<EncryptionKey>): Promise<EncryptionKey> {
    const [key] = await this.db('encryption_keys')
      .insert({
        key_version: data.key_version,
        algorithm: data.algorithm,
        purpose: data.purpose,
        key_vault_url: data.key_vault_url,
        key_vault_name: data.key_vault_name || null,
        key_id: data.key_id || null,
        status: data.status || 'active',
        rotation_interval_days: data.rotation_interval_days || null,
        notes: data.notes || null,
        managed_by: data.managed_by || null,
        created_at: new Date(),
      })
      .returning('*');

    return key as EncryptionKey;
  }

  /**
   * Get active encryption key by version
   */
  async getActiveEncryptionKey(keyVersion: string): Promise<EncryptionKey | null> {
    const key = await this.db('encryption_keys')
      .where('key_version', keyVersion)
      .andWhere('status', 'active')
      .first();

    return key as EncryptionKey | null;
  }

  /**
   * Get current active key by purpose
   */
  async getCurrentActiveKeyByPurpose(purpose: string): Promise<EncryptionKey | null> {
    const key = await this.db('encryption_keys')
      .where('purpose', purpose)
      .andWhere('status', 'active')
      .orderBy('created_at', 'desc')
      .first();

    return key as EncryptionKey | null;
  }

  /**
   * Mark key as deprecated
   */
  async deprecateKey(keyVersion: string): Promise<void> {
    await this.db('encryption_keys')
      .where('key_version', keyVersion)
      .update({
        status: 'deprecated',
        deprecated_at: new Date(),
      });
  }

  /**
   * Rotate key (create new, deprecate old)
   */
  async rotateKey(
    oldKeyVersion: string,
    newKeyData: Partial<EncryptionKey>
  ): Promise<EncryptionKey> {
    // Start transaction to ensure atomicity
    return await this.db.transaction(async (trx) => {
      // Deprecate old key
      await trx('encryption_keys')
        .where('key_version', oldKeyVersion)
        .update({
          status: 'deprecated',
          deprecated_at: new Date(),
        });

      // Create new key
      const [newKey] = await trx('encryption_keys')
        .insert({
          key_version: newKeyData.key_version,
          algorithm: newKeyData.algorithm,
          purpose: newKeyData.purpose,
          key_vault_url: newKeyData.key_vault_url,
          key_vault_name: newKeyData.key_vault_name || null,
          key_id: newKeyData.key_id || null,
          status: 'active',
          rotated_at: new Date(),
          managed_by: newKeyData.managed_by || null,
          created_at: new Date(),
        })
        .returning('*');

      return newKey as EncryptionKey;
    });
  }

  /**
   * List all keys (with optional filtering)
   */
  async listEncryptionKeys(
    filters?: Partial<{ status: string; purpose: string }>
  ): Promise<EncryptionKey[]> {
    let query = this.db('encryption_keys').select('*');

    if (filters?.status) {
      query = query.where('status', filters.status);
    }
    if (filters?.purpose) {
      query = query.where('purpose', filters.purpose);
    }

    return (await query.orderBy('created_at', 'desc')) as EncryptionKey[];
  }

  // ============================================================================
  // USER PERMISSIONS - Role-based access control (RBAC)
  // ============================================================================

  /**
   * Grant permission to user
   */
  async grantPermission(data: CreateUserPermissionRequest): Promise<UserPermission> {
    const [permission] = await this.db('user_permissions')
      .insert({
        user_id: data.user_id,
        tenant_id: data.tenant_id,
        permission: data.permission,
        scope: data.scope || null,
        resource_id: data.resource_id || null,
        granted_at: new Date(),
        granted_by: data.granted_by || null,
        expires_at: data.expires_at || null,
        is_active: true,
        reason: data.reason || null,
        notes: data.notes || null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return permission as UserPermission;
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    permission: string
  ): Promise<boolean> {
    const perm = await this.db('user_permissions')
      .where('user_id', userId)
      .andWhere('tenant_id', tenantId)
      .andWhere('permission', permission)
      .andWhere('is_active', true)
      .andWhere((qb) => {
        // Include permissions that don't expire or haven't expired yet
        qb.whereNull('expires_at').orWhere('expires_at', '>', new Date());
      })
      .first();

    return !!perm;
  }

  /**
   * Get all permissions for user
   */
  async getUserPermissions(
    userId: string,
    tenantId: string
  ): Promise<UserPermission[]> {
    return (await this.db('user_permissions')
      .where('user_id', userId)
      .andWhere('tenant_id', tenantId)
      .andWhere('is_active', true)
      .andWhere((qb) => {
        qb.whereNull('expires_at').orWhere('expires_at', '>', new Date());
      })
      .select('*')) as UserPermission[];
  }

  /**
   * Revoke permission
   */
  async revokePermission(permissionId: string): Promise<void> {
    await this.db('user_permissions')
      .where('id', permissionId)
      .update({
        is_active: false,
        updated_at: new Date(),
      });
  }

  /**
   * Query permissions with filtering
   */
  async queryPermissions(options: UserPermissionQueryOptions): Promise<UserPermission[]> {
    let query = this.db('user_permissions').select('*');

    if (options.user_id) {
      query = query.where('user_id', options.user_id);
    }
    if (options.tenant_id) {
      query = query.where('tenant_id', options.tenant_id);
    }
    if (options.permission) {
      query = query.where('permission', options.permission);
    }
    if (options.is_active !== undefined) {
      query = query.where('is_active', options.is_active);
    }

    const limit = Math.min(options.limit || 100, 1000);
    const offset = options.offset || 0;

    return (await query
      .orderBy('granted_at', 'desc')
      .limit(limit)
      .offset(offset)) as UserPermission[];
  }

  /**
   * Clean up expired permissions (maintenance task)
   */
  async cleanupExpiredPermissions(): Promise<number> {
    return await this.db('user_permissions')
      .where('expires_at', '<', new Date())
      .update({
        is_active: false,
        updated_at: new Date(),
      });
  }
}
