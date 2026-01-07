/**
 * Configuration Management Service
 *
 * Comprehensive configuration management with versioning, rollback, and approval workflows.
 * Acts as the SINGLE SOURCE OF TRUTH for all application configuration.
 *
 * Features:
 * - Typed configuration with Zod validation
 * - Hierarchical scope inheritance (global → org → team → user)
 * - Git-like versioning with complete history
 * - Point-in-time recovery and rollback
 * - Approval workflow for critical changes
 * - Feature flags with gradual rollout
 * - Real-time configuration updates
 * - Impact analysis before changes
 * - Encrypted sensitive values
 * - Complete audit trail
 *
 * @module ConfigurationManagementService
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

import Redis from 'ioredis';
import { Pool } from 'pg';
import { z } from 'zod';

// ============================================================================
// Types and Enums
// ============================================================================

export enum ConfigScope {
  GLOBAL = 'global',        // Applies to entire system
  ORGANIZATION = 'org',     // Applies to one organization
  TEAM = 'team',            // Applies to one team
  USER = 'user'             // User-specific overrides
}

export enum ImpactLevel {
  NONE = 'none',           // No impact
  LOW = 'low',             // Minor UI changes
  MEDIUM = 'medium',       // Feature behavior changes
  HIGH = 'high',           // Critical system behavior
  CRITICAL = 'critical'    // Requires downtime or approval
}

export enum ChangeStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  APPLIED = 'applied'
}

export interface ConfigVersion {
  id: string;
  key: string;
  value: any;
  version: string;
  previousVersion?: string;
  scope: ConfigScope;
  scopeId?: string;
  changedBy: string;
  changedAt: Date;
  comment?: string;
  tags: string[];
  impactLevel: ImpactLevel;
  isRollback: boolean;
  rollbackFromVersion?: string;
  diff?: ConfigDiff[];
}

export interface ConfigDiff {
  path: string;
  operation: 'add' | 'modify' | 'delete';
  oldValue?: any;
  newValue?: any;
}

export interface ChangeRequest {
  id: string;
  key: string;
  currentValue: any;
  proposedValue: any;
  scope: ConfigScope;
  scopeId?: string;
  status: ChangeStatus;
  impactLevel: ImpactLevel;
  requestedBy: string;
  requestedAt: Date;
  justification: string;
  minimumApprovals: number;
  approvals: ChangeApproval[];
  rejections: ChangeApproval[];
  appliedAt?: Date;
  appliedVersion?: string;
  expiresAt?: Date;
}

export interface ChangeApproval {
  userId: string;
  timestamp: Date;
  comment?: string;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: FlagCondition[];
  description: string;
  metadata?: Record<string, any>;
}

export interface FlagCondition {
  attribute: string;
  operator: 'equals' | 'in' | 'notIn' | 'gt' | 'lt' | 'contains';
  value?: any;
  values?: any[];
}

export interface FlagContext {
  userId?: string;
  organizationId?: string;
  environment?: string;
  attributes?: Record<string, any>;
}

export interface ImpactReport {
  impactLevel: ImpactLevel;
  affectedServices: string[];
  affectedUsers: number;
  requiresApproval: boolean;
  requiredApprovers: string[];
  estimatedDowntime?: number;
  rollbackPlan: string;
  testingRecommendations: string[];
  dependencies: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ key: string; error: string }>;
}

export interface ConfigChange {
  key: string;
  oldValue: any;
  newValue: any;
  scope: ConfigScope;
  scopeId?: string;
  changedBy: string;
  version: string;
}

// ============================================================================
// Pre-defined Configuration Schemas
// ============================================================================

const brandingSchema = z.object({
  logo: z.string().url(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/),
  companyName: z.string().min(1).max(100),
  tagline: z.string().max(200).optional()
});

const pmIntervalsSchema = z.object({
  lightDuty: z.number().min(1000).max(10000),
  mediumDuty: z.number().min(5000).max(20000),
  heavyDuty: z.number().min(10000).max(50000)
});

const approvalThresholdsSchema = z.object({
  maintenanceApproval: z.number().min(0),
  procurementApproval: z.number().min(0),
  budgetVariance: z.number().min(0).max(100)
});

const emailNotificationsSchema = z.object({
  maintenanceDue: z.boolean(),
  inspectionDue: z.boolean(),
  documentExpiring: z.boolean(),
  workOrderAssigned: z.boolean(),
  dailyDigest: z.boolean()
});

const systemSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  allowSelfRegistration: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440),
  maxLoginAttempts: z.number().min(3).max(10)
});

// ============================================================================
// Configuration Management Service
// ============================================================================

export class ConfigurationManagementService {
  private pool: Pool;
  private redis?: Redis;
  private eventEmitter: EventEmitter;
  private encryptionKey: Buffer;
  private cacheEnabled: boolean;
  private cacheTtl: number;
  private schemas: Map<string, z.ZodSchema>;

  /**
   * Create a new ConfigurationManagementService
   *
   * @param pool - PostgreSQL connection pool
   * @param options - Service configuration options
   */
  constructor(
    pool: Pool,
    options: {
      redis?: Redis;
      encryptionKey?: string;
      cacheEnabled?: boolean;
      cacheTtl?: number;
    } = {}
  ) {
    this.pool = pool;
    this.redis = options.redis;
    this.eventEmitter = new EventEmitter();
    this.cacheEnabled = options.cacheEnabled ?? true;
    this.cacheTtl = options.cacheTtl ?? 300; // 5 minutes default

    // Initialize encryption key (from env or generate)
    const keyString = options.encryptionKey || process.env.CONFIG_ENCRYPTION_KEY;
    if (keyString) {
      this.encryptionKey = Buffer.from(keyString, 'base64');
    } else {
      // Generate a random key (should be persisted in production)
      this.encryptionKey = crypto.randomBytes(32);
      console.warn(
        '[ConfigService] No encryption key provided, generated random key. ' +
        'Set CONFIG_ENCRYPTION_KEY env var in production!'
      );
    }

    // Register built-in schemas
    this.schemas = new Map<string, z.ZodSchema>();
    this.schemas.set('branding', brandingSchema);
    this.schemas.set('pm_intervals', pmIntervalsSchema);
    this.schemas.set('approval_thresholds', approvalThresholdsSchema);
    this.schemas.set('email_notifications', emailNotificationsSchema);
    this.schemas.set('system_settings', systemSettingsSchema);
  }

  // ============================================================================
  // Configuration CRUD Operations
  // ============================================================================

  /**
   * Get a configuration value with scope inheritance
   *
   * Lookup order: USER → TEAM → ORG → GLOBAL
   *
   * @example
   * ```typescript
   * const branding = await configService.get<BrandingConfig>(
   *   'branding',
   *   { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' }
   * );
   * console.log(branding.primaryColor); // "#FF6B00"
   * ```
   */
  async get<T = any>(
    key: string,
    scope?: { scope: ConfigScope; scopeId?: string }
  ): Promise<T | null> {
    const cacheKey = this.getCacheKey(key, scope);

    // Try cache first
    if (this.cacheEnabled && this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        await this.recordAudit('get', key, undefined, true, { cache: 'hit' });
        return JSON.parse(cached);
      }
    }

    try {
      // Build scope hierarchy for inheritance
      const scopes = this.buildScopeHierarchy(scope);

      // Query with scope precedence
      const result = await this.pool.query<{
        value: any;
        is_encrypted: boolean;
      }>(
        `SELECT value, is_encrypted
         FROM configuration_settings
         WHERE key = $1
         AND scope = ANY($2)
         AND (scope_id = $3 OR scope_id IS NULL)
         AND is_active = true
         ORDER BY
           CASE scope
             WHEN 'user' THEN 1
             WHEN 'team' THEN 2
             WHEN 'org' THEN 3
             WHEN 'global' THEN 4
           END
         LIMIT 1`,
        [key, scopes.map(s => s.scope), scope?.scopeId || null]
      );

      if (result.rows.length === 0) {
        await this.recordAudit('get', key, undefined, true, { found: false });
        return null;
      }

      let value = result.rows[0].value;

      // Decrypt if encrypted
      if (result.rows[0].is_encrypted) {
        value = this.decrypt(value);
      }

      // Cache the result
      if (this.cacheEnabled && this.redis) {
        await this.redis.setex(cacheKey, this.cacheTtl, JSON.stringify(value));
      }

      await this.recordAudit('get', key, undefined, true, { cache: 'miss' });
      return value as T;
    } catch (error) {
      await this.recordAudit('get', key, undefined, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get multiple configuration values in a single query
   *
   * @example
   * ```typescript
   * const configs = await configService.getBatch(
   *   ['branding', 'pm_intervals', 'approval_thresholds'],
   *   { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' }
   * );
   * console.log(configs.get('branding'));
   * ```
   */
  async getBatch(
    keys: string[],
    scope?: { scope: ConfigScope; scopeId?: string }
  ): Promise<Map<string, any>> {
    const result = new Map<string, any>();

    // Try to get from cache first
    if (this.cacheEnabled && this.redis) {
      const cacheKeys = keys.map(k => this.getCacheKey(k, scope));
      const cached = await this.redis.mget(...cacheKeys);

      cached.forEach((value, index) => {
        if (value) {
          result.set(keys[index], JSON.parse(value));
        }
      });

      // Remove cached keys from fetch list
      keys = keys.filter((_, i) => !cached[i]);
    }

    if (keys.length === 0) {
      return result;
    }

    // Fetch remaining from database
    const scopes = this.buildScopeHierarchy(scope);

    const dbResult = await this.pool.query<{
      key: string;
      value: any;
      is_encrypted: boolean;
    }>(
      `SELECT DISTINCT ON (key) key, value, is_encrypted
       FROM configuration_settings
       WHERE key = ANY($1)
       AND scope = ANY($2)
       AND (scope_id = $3 OR scope_id IS NULL)
       AND is_active = true
       ORDER BY key,
         CASE scope
           WHEN 'user' THEN 1
           WHEN 'team' THEN 2
           WHEN 'org' THEN 3
           WHEN 'global' THEN 4
         END`,
      [keys, scopes.map(s => s.scope), scope?.scopeId || null]
    );

    // Process and cache results
    for (const row of dbResult.rows) {
      let value = row.value;
      if (row.is_encrypted) {
        value = this.decrypt(value);
      }

      result.set(row.key, value);

      // Cache individual values
      if (this.cacheEnabled && this.redis) {
        const cacheKey = this.getCacheKey(row.key, scope);
        await this.redis.setex(cacheKey, this.cacheTtl, JSON.stringify(value));
      }
    }

    return result;
  }

  /**
   * Get all configuration values for a scope
   *
   * @example
   * ```typescript
   * const allConfigs = await configService.getAll({
   *   scope: ConfigScope.ORGANIZATION,
   *   scopeId: 'org-123'
   * });
   * ```
   */
  async getAll(
    scope?: { scope: ConfigScope; scopeId?: string }
  ): Promise<Record<string, any>> {
    const scopes = this.buildScopeHierarchy(scope);

    const result = await this.pool.query<{
      key: string;
      value: any;
      is_encrypted: boolean;
    }>(
      `SELECT DISTINCT ON (key) key, value, is_encrypted
       FROM configuration_settings
       WHERE scope = ANY($1)
       AND (scope_id = $2 OR scope_id IS NULL)
       AND is_active = true
       ORDER BY key,
         CASE scope
           WHEN 'user' THEN 1
           WHEN 'team' THEN 2
           WHEN 'org' THEN 3
           WHEN 'global' THEN 4
         END`,
      [scopes.map(s => s.scope), scope?.scopeId || null]
    );

    const configs: Record<string, any> = {};

    for (const row of result.rows) {
      let value = row.value;
      if (row.is_encrypted) {
        value = this.decrypt(value);
      }
      configs[row.key] = value;
    }

    return configs;
  }

  /**
   * Set a configuration value with automatic versioning
   *
   * @example
   * ```typescript
   * const version = await configService.set(
   *   'branding',
   *   { logo: 'https://example.com/logo.png', primaryColor: '#FF6B00' },
   *   { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' },
   *   'user-456',
   *   'Updated branding colors'
   * );
   * console.log('Created version:', version.version);
   * ```
   */
  async set<T = any>(
    key: string,
    value: T,
    scope: { scope: ConfigScope; scopeId?: string },
    userId: string,
    comment?: string
  ): Promise<ConfigVersion> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Validate against schema if exists
      const validationResult = await this.validateConfig(key, value);
      if (!validationResult.valid) {
        throw new Error(
          `Validation failed: ${validationResult.errors?.map(e => e.message).join(', ')}`
        );
      }

      // Get current value for diff calculation
      const currentResult = await client.query<{ value: any; current_version: string }>(
        `SELECT value, current_version
         FROM configuration_settings
         WHERE key = $1 AND scope = $2 AND (scope_id = $3 OR (scope_id IS NULL AND $3 IS NULL))`,
        [key, scope.scope, scope.scopeId || null]
      );

      const previousValue = currentResult.rows[0]?.value || null;
      const previousVersion = currentResult.rows[0]?.current_version;

      // Determine if value should be encrypted
      const shouldEncrypt = this.shouldEncrypt(key);
      const storedValue = shouldEncrypt ? this.encrypt(value) : value;

      // Generate new version
      const version = this.generateVersion(key, value);

      // Calculate diff
      const diff = previousValue ? this.calculateDiff(previousValue, value) : null;

      // Determine impact level
      const impactLevel = await this.determineImpactLevel(key, value);

      // Check if approval is required
      const schema = await this.getSchema(key);
      if (schema?.requiresApproval && impactLevel !== ImpactLevel.NONE && impactLevel !== ImpactLevel.LOW) {
        // Create change request instead of applying directly
        await client.query('ROLLBACK');
        const requestId = await this.requestChange({
          key,
          currentValue: previousValue,
          proposedValue: value,
          scope: scope.scope,
          scopeId: scope.scopeId,
          requestedBy: userId,
          justification: comment || 'Configuration change',
          impactLevel
        } as any);

        throw new Error(
          `This change requires approval. Change request created: ${requestId}`
        );
      }

      // Insert or update configuration_settings
      await client.query(
        `INSERT INTO configuration_settings
         (key, value, scope, scope_id, current_version, is_encrypted, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (key, scope, scope_id)
         DO UPDATE SET
           value = EXCLUDED.value,
           current_version = EXCLUDED.current_version,
           is_encrypted = EXCLUDED.is_encrypted,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()`,
        [key, storedValue, scope.scope, scope.scopeId || null, version, shouldEncrypt, userId]
      );

      // Insert version history
      const versionResult = await client.query<ConfigVersion>(
        `INSERT INTO configuration_versions
         (key, value, version, previous_version, scope, scope_id, impact_level,
          changed_by, comment, diff)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING
           id, key, value, version, previous_version, scope, scope_id::text as "scopeId",
           impact_level as "impactLevel", changed_by as "changedBy",
           changed_at as "changedAt", comment, tags, is_rollback as "isRollback",
           rollback_from_version as "rollbackFromVersion", diff`,
        [
          key,
          value,
          version,
          previousVersion || null,
          scope.scope,
          scope.scopeId || null,
          impactLevel,
          userId,
          comment || null,
          diff ? JSON.stringify(diff) : null
        ]
      );

      await client.query('COMMIT');

      // Invalidate cache
      if (this.cacheEnabled && this.redis) {
        await this.invalidateCache(key);
      }

      // Broadcast change to subscribers
      await this.broadcastChange(key, value, previousValue, scope.scope, scope.scopeId, userId, version);

      await this.recordAudit('set', key, userId, true);

      return versionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      await this.recordAudit('set', key, userId, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a configuration value
   *
   * @example
   * ```typescript
   * await configService.delete(
   *   'branding',
   *   { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' },
   *   'user-456',
   *   'Reverting to default branding'
   * );
   * ```
   */
  async delete(
    key: string,
    scope: { scope: ConfigScope; scopeId?: string },
    userId: string,
    comment?: string
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get current value for audit
      const currentResult = await client.query<{ value: any; current_version: string }>(
        `SELECT value, current_version
         FROM configuration_settings
         WHERE key = $1 AND scope = $2 AND (scope_id = $3 OR (scope_id IS NULL AND $3 IS NULL))`,
        [key, scope.scope, scope.scopeId || null]
      );

      if (currentResult.rows.length === 0) {
        throw new Error(`Configuration key '${key}' not found in scope ${scope.scope}`);
      }

      const currentValue = currentResult.rows[0].value;
      const currentVersion = currentResult.rows[0].current_version;

      // Soft delete (mark as inactive)
      await client.query(
        `UPDATE configuration_settings
         SET is_active = false, updated_by = $4, updated_at = NOW()
         WHERE key = $1 AND scope = $2 AND (scope_id = $3 OR (scope_id IS NULL AND $3 IS NULL))`,
        [key, scope.scope, scope.scopeId || null, userId]
      );

      // Record deletion in version history
      const version = this.generateVersion(key, null);
      await client.query(
        `INSERT INTO configuration_versions
         (key, value, version, previous_version, scope, scope_id, impact_level,
          changed_by, comment, diff)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          key,
          null,
          version,
          currentVersion,
          scope.scope,
          scope.scopeId || null,
          ImpactLevel.MEDIUM,
          userId,
          comment || 'Configuration deleted',
          JSON.stringify([{ path: '*', operation: 'delete', oldValue: currentValue }])
        ]
      );

      await client.query('COMMIT');

      // Invalidate cache
      if (this.cacheEnabled && this.redis) {
        await this.invalidateCache(key);
      }

      // Broadcast deletion
      await this.broadcastChange(key, null, currentValue, scope.scope, scope.scopeId, userId, version);

      await this.recordAudit('delete', key, userId, true);
    } catch (error) {
      await client.query('ROLLBACK');
      await this.recordAudit('delete', key, userId, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Versioning and History
  // ============================================================================

  /**
   * Get a specific version of a configuration value
   *
   * @example
   * ```typescript
   * const oldVersion = await configService.getVersion('branding', 'abc123def456');
   * console.log('Old primary color:', oldVersion.value.primaryColor);
   * ```
   */
  async getVersion(key: string, version: string): Promise<ConfigVersion | null> {
    const result = await this.pool.query<ConfigVersion>(
      `SELECT
         id, key, value, version, previous_version as "previousVersion",
         scope, scope_id::text as "scopeId", impact_level as "impactLevel",
         changed_by as "changedBy", changed_at as "changedAt", comment, tags,
         is_rollback as "isRollback", rollback_from_version as "rollbackFromVersion",
         diff
       FROM configuration_versions
       WHERE key = $1 AND version = $2
       LIMIT 1`,
      [key, version]
    );

    return result.rows[0] || null;
  }

  /**
   * Get version history for a configuration key
   *
   * @example
   * ```typescript
   * const history = await configService.getHistory('branding', 10);
   * for (const version of history) {
   *   console.log(`${version.changedAt}: ${version.comment}`);
   * }
   * ```
   */
  async getHistory(key: string, limit: number = 50): Promise<ConfigVersion[]> {
    const result = await this.pool.query<ConfigVersion>(
      `SELECT
         id, key, value, version, previous_version as "previousVersion",
         scope, scope_id::text as "scopeId", impact_level as "impactLevel",
         changed_by as "changedBy", changed_at as "changedAt", comment, tags,
         is_rollback as "isRollback", rollback_from_version as "rollbackFromVersion",
         diff
       FROM configuration_versions
       WHERE key = $1
       ORDER BY changed_at DESC
       LIMIT $2`,
      [key, limit]
    );

    return result.rows;
  }

  /**
   * Get diff between two versions
   *
   * @example
   * ```typescript
   * const diff = await configService.getDiff('branding', 'version1', 'version2');
   * for (const change of diff) {
   *   console.log(`${change.operation} ${change.path}`);
   * }
   * ```
   */
  async getDiff(key: string, versionA: string, versionB: string): Promise<ConfigDiff[]> {
    const [versionAData, versionBData] = await Promise.all([
      this.getVersion(key, versionA),
      this.getVersion(key, versionB)
    ]);

    if (!versionAData || !versionBData) {
      throw new Error(`One or both versions not found for key '${key}'`);
    }

    return this.calculateDiff(versionAData.value, versionBData.value);
  }

  /**
   * Rollback a configuration to a previous version
   *
   * @example
   * ```typescript
   * const newVersion = await configService.rollback(
   *   'branding',
   *   'abc123def456',
   *   'user-789',
   *   'Reverting bad color change'
   * );
   * console.log('Rolled back to version:', newVersion.version);
   * ```
   */
  async rollback(
    key: string,
    toVersion: string,
    userId: string,
    reason: string
  ): Promise<ConfigVersion> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get the target version
      const targetVersion = await this.getVersion(key, toVersion);
      if (!targetVersion) {
        throw new Error(`Version '${toVersion}' not found for key '${key}'`);
      }

      // Validate the value still passes schema validation
      const validationResult = await this.validateConfig(key, targetVersion.value);
      if (!validationResult.valid) {
        throw new Error(
          `Cannot rollback: target version fails current validation: ${validationResult.errors?.map(e => e.message).join(', ')}`
        );
      }

      // Get current value
      const currentResult = await client.query<{ value: any; current_version: string }>(
        `SELECT value, current_version
         FROM configuration_settings
         WHERE key = $1 AND scope = $2 AND (scope_id = $3 OR (scope_id IS NULL AND $3 IS NULL))`,
        [key, targetVersion.scope, targetVersion.scopeId || null]
      );

      const currentValue = currentResult.rows[0]?.value;
      const currentVersion = currentResult.rows[0]?.current_version;

      // Generate new version for rollback
      const newVersion = this.generateVersion(key, targetVersion.value);

      // Calculate diff
      const diff = this.calculateDiff(currentValue, targetVersion.value);

      // Update configuration_settings
      const shouldEncrypt = this.shouldEncrypt(key);
      const storedValue = shouldEncrypt ? this.encrypt(targetVersion.value) : targetVersion.value;

      await client.query(
        `INSERT INTO configuration_settings
         (key, value, scope, scope_id, current_version, is_encrypted, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (key, scope, scope_id)
         DO UPDATE SET
           value = EXCLUDED.value,
           current_version = EXCLUDED.current_version,
           is_encrypted = EXCLUDED.is_encrypted,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()`,
        [
          key,
          storedValue,
          targetVersion.scope,
          targetVersion.scopeId || null,
          newVersion,
          shouldEncrypt,
          userId
        ]
      );

      // Insert version history with rollback flag
      const versionResult = await client.query<ConfigVersion>(
        `INSERT INTO configuration_versions
         (key, value, version, previous_version, scope, scope_id, impact_level,
          changed_by, comment, is_rollback, rollback_from_version, diff)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11)
         RETURNING
           id, key, value, version, previous_version, scope, scope_id::text as "scopeId",
           impact_level as "impactLevel", changed_by as "changedBy",
           changed_at as "changedAt", comment, tags, is_rollback as "isRollback",
           rollback_from_version as "rollbackFromVersion", diff`,
        [
          key,
          targetVersion.value,
          newVersion,
          currentVersion,
          targetVersion.scope,
          targetVersion.scopeId || null,
          ImpactLevel.HIGH,
          userId,
          `Rollback: ${reason}`,
          toVersion,
          JSON.stringify(diff)
        ]
      );

      await client.query('COMMIT');

      // Invalidate cache
      if (this.cacheEnabled && this.redis) {
        await this.invalidateCache(key);
      }

      // Broadcast change
      await this.broadcastChange(
        key,
        targetVersion.value,
        currentValue,
        targetVersion.scope,
        targetVersion.scopeId,
        userId,
        newVersion
      );

      await this.recordAudit('rollback', key, userId, true, { toVersion, reason });

      return versionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      await this.recordAudit('rollback', key, userId, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a tag for a specific version (like git tags)
   *
   * @example
   * ```typescript
   * await configService.createTag('stable-v1.0', 'abc123def456', 'Production stable release');
   * ```
   */
  async createTag(tagName: string, version: string, description: string): Promise<void> {
    // Get version to validate it exists
    const versionData = await this.pool.query(
      `SELECT key FROM configuration_versions WHERE version = $1 LIMIT 1`,
      [version]
    );

    if (versionData.rows.length === 0) {
      throw new Error(`Version '${version}' not found`);
    }

    await this.pool.query(
      `INSERT INTO configuration_tags (tag_name, config_key, version, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tag_name) DO UPDATE SET
         config_key = EXCLUDED.config_key,
         version = EXCLUDED.version,
         description = EXCLUDED.description`,
      [tagName, versionData.rows[0].key, version, description, 'system']
    );

    // Also update the version record to include this tag
    await this.pool.query(
      `UPDATE configuration_versions
       SET tags = array_append(tags, $1)
       WHERE version = $2 AND NOT ($1 = ANY(tags))`,
      [tagName, version]
    );
  }

  // ============================================================================
  // Validation and Schema Management
  // ============================================================================

  /**
   * Validate a configuration value against its schema
   *
   * @example
   * ```typescript
   * const result = await configService.validateConfig('branding', {
   *   logo: 'invalid-url',
   *   primaryColor: '#FF6B00'
   * });
   * if (!result.valid) {
   *   console.error(result.errors);
   * }
   * ```
   */
  async validateConfig(key: string, value: any): Promise<ValidationResult> {
    const schema = this.schemas.get(key);

    if (!schema) {
      // No schema registered, allow any value
      return { valid: true };
    }

    try {
      schema.parse(value);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        };
      }
      throw error;
    }
  }

  /**
   * Register a validation schema for a configuration key
   *
   * @example
   * ```typescript
   * const vehicleSettingsSchema = z.object({
   *   maxSpeed: z.number().min(0).max(200),
   *   fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid'])
   * });
   * await configService.registerSchema('vehicle_settings', vehicleSettingsSchema);
   * ```
   */
  async registerSchema(key: string, schema: z.ZodSchema): Promise<void> {
    this.schemas.set(key, schema);

    // Also persist to database for reference
    await this.pool.query(
      `INSERT INTO configuration_schemas
       (key, schema, description, default_impact_level, requires_approval)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (key) DO UPDATE SET
         schema = EXCLUDED.schema,
         updated_at = NOW()`,
      [
        key,
        JSON.stringify(schema),
        `Schema for ${key}`,
        ImpactLevel.MEDIUM,
        false
      ]
    );
  }

  /**
   * Get the schema for a configuration key
   *
   * @example
   * ```typescript
   * const schema = await configService.getSchema('branding');
   * console.log('Requires approval:', schema.requiresApproval);
   * ```
   */
  async getSchema(key: string): Promise<{
    schema: any;
    requiresApproval: boolean;
    minimumApprovals: number;
    defaultImpactLevel: ImpactLevel;
  } | null> {
    const result = await this.pool.query<{
      schema: any;
      requires_approval: boolean;
      minimum_approvals: number;
      default_impact_level: ImpactLevel;
    }>(
      `SELECT schema, requires_approval, minimum_approvals, default_impact_level
       FROM configuration_schemas
       WHERE key = $1`,
      [key]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      schema: result.rows[0].schema,
      requiresApproval: result.rows[0].requires_approval,
      minimumApprovals: result.rows[0].minimum_approvals,
      defaultImpactLevel: result.rows[0].default_impact_level
    };
  }

  // ============================================================================
  // Approval Workflow
  // ============================================================================

  /**
   * Request a configuration change that requires approval
   *
   * @example
   * ```typescript
   * const requestId = await configService.requestChange({
   *   key: 'approval_thresholds',
   *   currentValue: { maintenanceApproval: 5000 },
   *   proposedValue: { maintenanceApproval: 10000 },
   *   scope: ConfigScope.GLOBAL,
   *   requestedBy: 'user-123',
   *   justification: 'Increase threshold to reduce approval bottleneck',
   *   impactLevel: ImpactLevel.HIGH
   * });
   * console.log('Request ID:', requestId);
   * ```
   */
  async requestChange(request: Omit<ChangeRequest, 'id' | 'requestedAt' | 'status' | 'approvals' | 'rejections'>): Promise<string> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Validate proposed value
      const validationResult = await this.validateConfig(request.key, request.proposedValue);
      if (!validationResult.valid) {
        throw new Error(
          `Validation failed: ${validationResult.errors?.map(e => e.message).join(', ')}`
        );
      }

      // Get schema to determine minimum approvals
      const schema = await this.getSchema(request.key);
      const minimumApprovals = schema?.minimumApprovals || 1;

      // Set expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Insert change request
      const result = await client.query<{ id: string }>(
        `INSERT INTO configuration_change_requests
         (key, current_value, proposed_value, scope, scope_id, status, impact_level,
          requested_by, justification, minimum_approvals, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          request.key,
          request.currentValue,
          request.proposedValue,
          request.scope,
          request.scopeId || null,
          ChangeStatus.PENDING,
          request.impactLevel,
          request.requestedBy,
          request.justification,
          minimumApprovals,
          expiresAt
        ]
      );

      await client.query('COMMIT');

      const requestId = result.rows[0].id;

      await this.recordAudit('request_change', request.key, request.requestedBy, true, {
        requestId,
        impactLevel: request.impactLevel
      });

      return requestId;
    } catch (error) {
      await client.query('ROLLBACK');
      await this.recordAudit('request_change', request.key, request.requestedBy, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Approve a change request
   *
   * @example
   * ```typescript
   * await configService.approveChange(
   *   'request-id-123',
   *   'approver-456',
   *   'Looks good, approved'
   * );
   * ```
   */
  async approveChange(requestId: string, approverId: string, comment?: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get change request
      const requestResult = await client.query<{
        id: string;
        key: string;
        proposed_value: any;
        scope: ConfigScope;
        scope_id: string | null;
        minimum_approvals: number;
        status: ChangeStatus;
      }>(
        `SELECT id, key, proposed_value, scope, scope_id, minimum_approvals, status
         FROM configuration_change_requests
         WHERE id = $1`,
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error(`Change request '${requestId}' not found`);
      }

      const request = requestResult.rows[0];

      if (request.status !== ChangeStatus.PENDING) {
        throw new Error(`Change request is already ${request.status}`);
      }

      // Record approval
      await client.query(
        `INSERT INTO configuration_change_approvals
         (change_request_id, approver_id, approved, comment)
         VALUES ($1, $2, true, $3)
         ON CONFLICT (change_request_id, approver_id) DO UPDATE SET
           approved = true,
           comment = EXCLUDED.comment,
           approved_at = NOW()`,
        [requestId, approverId, comment || null]
      );

      // Check if we have enough approvals
      const approvalCount = await client.query<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM configuration_change_approvals
         WHERE change_request_id = $1 AND approved = true`,
        [requestId]
      );

      const approvals = parseInt(approvalCount.rows[0].count.toString());

      if (approvals >= request.minimum_approvals) {
        // Apply the change
        const version = this.generateVersion(request.key, request.proposed_value);

        const shouldEncrypt = this.shouldEncrypt(request.key);
        const storedValue = shouldEncrypt
          ? this.encrypt(request.proposed_value)
          : request.proposed_value;

        await client.query(
          `INSERT INTO configuration_settings
           (key, value, scope, scope_id, current_version, is_encrypted, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (key, scope, scope_id)
           DO UPDATE SET
             value = EXCLUDED.value,
             current_version = EXCLUDED.current_version,
             is_encrypted = EXCLUDED.is_encrypted,
             updated_by = EXCLUDED.updated_by,
             updated_at = NOW()`,
          [
            request.key,
            storedValue,
            request.scope,
            request.scope_id,
            version,
            shouldEncrypt,
            approverId
          ]
        );

        // Insert version history
        await client.query(
          `INSERT INTO configuration_versions
           (key, value, version, scope, scope_id, impact_level, changed_by, comment)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            request.key,
            request.proposed_value,
            version,
            request.scope,
            request.scope_id,
            ImpactLevel.HIGH,
            approverId,
            `Applied approved change request ${requestId}`
          ]
        );

        // Update request status
        await client.query(
          `UPDATE configuration_change_requests
           SET status = $1, applied_at = NOW(), applied_version = $2
           WHERE id = $3`,
          [ChangeStatus.APPLIED, version, requestId]
        );

        // Invalidate cache
        if (this.cacheEnabled && this.redis) {
          await this.invalidateCache(request.key);
        }
      } else {
        // Just update status to approved (waiting for more approvals)
        await client.query(
          `UPDATE configuration_change_requests
           SET status = $1
           WHERE id = $2`,
          [ChangeStatus.APPROVED, requestId]
        );
      }

      await client.query('COMMIT');

      await this.recordAudit('approve_change', request.key, approverId, true, { requestId });
    } catch (error) {
      await client.query('ROLLBACK');
      await this.recordAudit('approve_change', undefined, approverId, false, {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reject a change request
   *
   * @example
   * ```typescript
   * await configService.rejectChange(
   *   'request-id-123',
   *   'approver-456',
   *   'Impact too high for current quarter'
   * );
   * ```
   */
  async rejectChange(requestId: string, approverId: string, reason: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get change request
      const requestResult = await client.query<{ key: string; status: ChangeStatus }>(
        `SELECT key, status
         FROM configuration_change_requests
         WHERE id = $1`,
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error(`Change request '${requestId}' not found`);
      }

      const request = requestResult.rows[0];

      if (request.status !== ChangeStatus.PENDING && request.status !== ChangeStatus.APPROVED) {
        throw new Error(`Change request is already ${request.status}`);
      }

      // Record rejection
      await client.query(
        `INSERT INTO configuration_change_approvals
         (change_request_id, approver_id, approved, comment)
         VALUES ($1, $2, false, $3)
         ON CONFLICT (change_request_id, approver_id) DO UPDATE SET
           approved = false,
           comment = EXCLUDED.comment,
           approved_at = NOW()`,
        [requestId, approverId, reason]
      );

      // Update request status
      await client.query(
        `UPDATE configuration_change_requests
         SET status = $1
         WHERE id = $2`,
        [ChangeStatus.REJECTED, requestId]
      );

      await client.query('COMMIT');

      await this.recordAudit('reject_change', request.key, approverId, true, {
        requestId,
        reason
      });
    } catch (error) {
      await client.query('ROLLBACK');
      await this.recordAudit('reject_change', undefined, approverId, false, {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pending change requests for approval
   *
   * @example
   * ```typescript
   * const pending = await configService.getPendingChanges('approver-123');
   * for (const request of pending) {
   *   console.log(`${request.key}: ${request.justification}`);
   * }
   * ```
   */
  async getPendingChanges(approverId?: string): Promise<ChangeRequest[]> {
    // Build query based on whether we're filtering by approver
    let query = `
      SELECT
        cr.id,
        cr.key,
        cr.current_value as "currentValue",
        cr.proposed_value as "proposedValue",
        cr.scope,
        cr.scope_id::text as "scopeId",
        cr.status,
        cr.impact_level as "impactLevel",
        cr.requested_by as "requestedBy",
        cr.requested_at as "requestedAt",
        cr.justification,
        cr.minimum_approvals as "minimumApprovals",
        cr.applied_at as "appliedAt",
        cr.applied_version as "appliedVersion",
        cr.expires_at as "expiresAt",
        COALESCE(
          json_agg(
            json_build_object(
              'userId', ca.approver_id,
              'timestamp', ca.approved_at,
              'comment', ca.comment
            )
          ) FILTER (WHERE ca.approved = true),
          '[]'
        ) as approvals,
        COALESCE(
          json_agg(
            json_build_object(
              'userId', ca.approver_id,
              'timestamp', ca.approved_at,
              'comment', ca.comment
            )
          ) FILTER (WHERE ca.approved = false),
          '[]'
        ) as rejections
      FROM configuration_change_requests cr
      LEFT JOIN configuration_change_approvals ca ON cr.id = ca.change_request_id
      WHERE cr.status IN ('pending', 'approved')
      AND cr.expires_at > NOW()
    `;

    const params: any[] = [];

    if (approverId) {
      query += ` AND NOT EXISTS (
        SELECT 1 FROM configuration_change_approvals
        WHERE change_request_id = cr.id AND approver_id = $1
      )`;
      params.push(approverId);
    }

    query += `
      GROUP BY cr.id
      ORDER BY cr.requested_at DESC
    `;

    const result = await this.pool.query<ChangeRequest>(query, params);

    return result.rows;
  }

  // ============================================================================
  // Feature Flags
  // ============================================================================

  /**
   * Evaluate a feature flag for a given context
   *
   * @example
   * ```typescript
   * const enabled = await configService.evaluateFlag('advanced-analytics', {
   *   userId: 'user-123',
   *   organizationId: 'org-456',
   *   attributes: { role: 'Analyst', tier: 'enterprise' }
   * });
   * if (enabled) {
   *   // Show advanced analytics
   * }
   * ```
   */
  async evaluateFlag(flagName: string, context: FlagContext): Promise<boolean> {
    const cacheKey = `flag:${flagName}`;

    // Try cache first
    let flag: FeatureFlag | null = null;

    if (this.cacheEnabled && this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        flag = JSON.parse(cached);
      }
    }

    // Fetch from database if not cached
    if (!flag) {
      const result = await this.pool.query<{
        name: string;
        enabled: boolean;
        rollout_percentage: number;
        conditions: any;
        description: string;
        metadata: any;
      }>(
        `SELECT name, enabled, rollout_percentage, conditions, description, metadata
         FROM feature_flags
         WHERE name = $1`,
        [flagName]
      );

      if (result.rows.length === 0) {
        // Flag doesn't exist, default to false
        return false;
      }

      flag = {
        name: result.rows[0].name,
        enabled: result.rows[0].enabled,
        rolloutPercentage: result.rows[0].rollout_percentage,
        conditions: result.rows[0].conditions || [],
        description: result.rows[0].description,
        metadata: result.rows[0].metadata
      };

      // Cache for 5 minutes
      if (this.cacheEnabled && this.redis) {
        await this.redis.setex(cacheKey, 300, JSON.stringify(flag));
      }
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      await this.recordFlagEvaluation(flagName, context, false);
      return false;
    }

    // Check conditions
    if (flag.conditions && flag.conditions.length > 0) {
      for (const condition of flag.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          await this.recordFlagEvaluation(flagName, context, false);
          return false;
        }
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      // Use consistent hashing based on userId or organizationId
      const hashInput = context.userId || context.organizationId || 'anonymous';
      const hash = crypto.createHash('md5').update(flagName + hashInput).digest('hex');
      const percentage = parseInt(hash.substring(0, 8), 16) % 100;

      if (percentage >= flag.rolloutPercentage) {
        await this.recordFlagEvaluation(flagName, context, false);
        return false;
      }
    }

    await this.recordFlagEvaluation(flagName, context, true);
    return true;
  }

  /**
   * Set the rollout percentage for a feature flag
   *
   * @example
   * ```typescript
   * // Gradually increase rollout
   * await configService.setFlagRollout('new-ui-redesign', 10);  // 10% of users
   * // ... monitor metrics ...
   * await configService.setFlagRollout('new-ui-redesign', 50);  // 50% of users
   * // ... monitor metrics ...
   * await configService.setFlagRollout('new-ui-redesign', 100); // All users
   * ```
   */
  async setFlagRollout(flagName: string, percentage: number): Promise<void> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    await this.pool.query(
      `UPDATE feature_flags
       SET rollout_percentage = $1, updated_at = NOW()
       WHERE name = $2`,
      [percentage, flagName]
    );

    // Invalidate cache
    if (this.cacheEnabled && this.redis) {
      await this.redis.del(`flag:${flagName}`);
    }

    await this.recordAudit('set_flag_rollout', flagName, undefined, true, { percentage });
  }

  /**
   * List all feature flags
   *
   * @example
   * ```typescript
   * const flags = await configService.listFlags();
   * for (const flag of flags) {
   *   console.log(`${flag.name}: ${flag.enabled ? 'enabled' : 'disabled'} (${flag.rolloutPercentage}%)`);
   * }
   * ```
   */
  async listFlags(): Promise<FeatureFlag[]> {
    const result = await this.pool.query<{
      name: string;
      enabled: boolean;
      rollout_percentage: number;
      conditions: any;
      description: string;
      metadata: any;
    }>(
      `SELECT name, enabled, rollout_percentage, conditions, description, metadata
       FROM feature_flags
       ORDER BY name`
    );

    return result.rows.map(row => ({
      name: row.name,
      enabled: row.enabled,
      rolloutPercentage: row.rollout_percentage,
      conditions: row.conditions || [],
      description: row.description,
      metadata: row.metadata
    }));
  }

  // ============================================================================
  // Real-time Updates
  // ============================================================================

  /**
   * Watch configuration keys for changes
   *
   * @example
   * ```typescript
   * const unwatch = await configService.watchConfig(
   *   ['branding', 'pm_intervals'],
   *   (changes) => {
   *     for (const change of changes) {
   *       console.log(`${change.key} changed from`, change.oldValue, 'to', change.newValue);
   *       // Update UI, reload config, etc.
   *     }
   *   }
   * );
   *
   * // Later: unwatch();
   * ```
   */
  async watchConfig(
    keys: string[],
    callback: (changes: ConfigChange[]) => void
  ): Promise<() => void> {
    const listener = (change: ConfigChange) => {
      if (keys.includes(change.key)) {
        callback([change]);
      }
    };

    this.eventEmitter.on('config:change', listener);

    // Return unwatch function
    return () => {
      this.eventEmitter.off('config:change', listener);
    };
  }

  /**
   * Broadcast a configuration change to all subscribers
   * (Internal method called after successful set/delete/rollback)
   */
  private async broadcastChange(
    key: string,
    newValue: any,
    oldValue: any,
    scope: ConfigScope,
    scopeId: string | undefined,
    changedBy: string,
    version: string
  ): Promise<void> {
    const change: ConfigChange = {
      key,
      oldValue,
      newValue,
      scope,
      scopeId,
      changedBy,
      version
    };

    this.eventEmitter.emit('config:change', change);

    // Also publish to Redis for cross-instance notifications
    if (this.redis) {
      await this.redis.publish('config:changes', JSON.stringify(change));
    }
  }

  // ============================================================================
  // Impact Analysis
  // ============================================================================

  /**
   * Analyze the impact of changing a configuration value
   *
   * @example
   * ```typescript
   * const impact = await configService.analyzeImpact('pm_intervals', {
   *   lightDuty: 15000  // Increasing from 5000
   * });
   * console.log('Impact level:', impact.impactLevel);
   * console.log('Affected services:', impact.affectedServices);
   * console.log('Requires approval:', impact.requiresApproval);
   * ```
   */
  async analyzeImpact(key: string, newValue: any): Promise<ImpactReport> {
    // Get current value
    const currentValue = await this.get(key);

    // Get schema
    const schema = await this.getSchema(key);

    // Get dependencies
    const dependencies = await this.getDependencies(key);

    // Calculate impact level
    const impactLevel = await this.determineImpactLevel(key, newValue, currentValue);

    // Determine affected services (simplified - in real system would query service registry)
    const affectedServices = this.getAffectedServices(key);

    // Estimate affected users (simplified)
    const affectedUsers = await this.estimateAffectedUsers(key);

    // Determine if approval required
    const requiresApproval = schema?.requiresApproval || impactLevel === ImpactLevel.CRITICAL;

    // Get required approvers (simplified - would integrate with RBAC)
    const requiredApprovers = requiresApproval ? ['admin-role'] : [];

    return {
      impactLevel,
      affectedServices,
      affectedUsers,
      requiresApproval,
      requiredApprovers,
      estimatedDowntime: impactLevel === ImpactLevel.CRITICAL ? 5 : undefined,
      rollbackPlan: `Use configService.rollback('${key}', '<version>', '<userId>', 'Reverting bad change')`,
      testingRecommendations: this.getTestingRecommendations(key, impactLevel),
      dependencies
    };
  }

  /**
   * Get configuration dependencies
   *
   * @example
   * ```typescript
   * const deps = await configService.getDependencies('approval_thresholds');
   * console.log('Depends on:', deps);
   * ```
   */
  async getDependencies(key: string): Promise<string[]> {
    const result = await this.pool.query<{ depends_on_key: string }>(
      `SELECT depends_on_key
       FROM configuration_dependencies
       WHERE config_key = $1`,
      [key]
    );

    return result.rows.map(row => row.depends_on_key);
  }

  // ============================================================================
  // Export/Import
  // ============================================================================

  /**
   * Export configuration to JSON or YAML
   *
   * @example
   * ```typescript
   * const json = await configService.exportConfig(
   *   { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' },
   *   'json'
   * );
   * await fs.writeFile('config-backup.json', json);
   * ```
   */
  async exportConfig(
    scope: { scope: ConfigScope; scopeId?: string },
    format: 'json' | 'yaml' = 'json'
  ): Promise<string> {
    const configs = await this.getAll(scope);

    if (format === 'json') {
      return JSON.stringify(configs, null, 2);
    } else {
      // Simple YAML conversion (for production use a proper YAML library)
      let yaml = '';
      for (const [key, value] of Object.entries(configs)) {
        yaml += `${key}:\n`;
        yaml += this.toYaml(value, 1);
      }
      return yaml;
    }
  }

  /**
   * Import configuration from JSON or YAML
   *
   * @example
   * ```typescript
   * const json = await fs.readFile('config-backup.json', 'utf8');
   * const result = await configService.importConfig(json, 'json', 'user-123');
   * console.log(`Imported ${result.imported}, failed ${result.failed}`);
   * ```
   */
  async importConfig(
    data: string,
    format: 'json' | 'yaml',
    userId: string,
    scope: { scope: ConfigScope; scopeId?: string } = { scope: ConfigScope.GLOBAL }
  ): Promise<ImportResult> {
    let configs: Record<string, any>;

    if (format === 'json') {
      configs = JSON.parse(data);
    } else {
      throw new Error('YAML import not yet implemented');
    }

    const result: ImportResult = {
      imported: 0,
      failed: 0,
      errors: []
    };

    for (const [key, value] of Object.entries(configs)) {
      try {
        await this.set(key, value, scope, userId, 'Imported from backup');
        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          key,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Invalidate cache for a configuration key or pattern
   *
   * @example
   * ```typescript
   * // Invalidate specific key
   * await configService.invalidateCache('branding');
   *
   * // Invalidate all keys matching pattern
   * await configService.invalidateCache('pm_*');
   * ```
   */
  async invalidateCache(pattern?: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    if (pattern) {
      // Delete specific pattern
      const keys = await this.redis.keys(`config:${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } else {
      // Delete all config cache
      const keys = await this.redis.keys('config:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  /**
   * Preload frequently accessed configurations into cache
   *
   * @example
   * ```typescript
   * await configService.preloadHotConfigs();
   * ```
   */
  async preloadHotConfigs(): Promise<void> {
    if (!this.redis) {
      return;
    }

    // Define hot configs (frequently accessed)
    const hotKeys = [
      'system_settings',
      'approval_thresholds',
      'pm_intervals'
    ];

    for (const key of hotKeys) {
      await this.get(key); // This will cache it
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildScopeHierarchy(
    scope?: { scope: ConfigScope; scopeId?: string }
  ): Array<{ scope: ConfigScope; scopeId?: string }> {
    if (!scope) {
      return [{ scope: ConfigScope.GLOBAL }];
    }

    const hierarchy: Array<{ scope: ConfigScope; scopeId?: string }> = [];

    switch (scope.scope) {
      case ConfigScope.USER:
        hierarchy.push({ scope: ConfigScope.USER, scopeId: scope.scopeId });
        hierarchy.push({ scope: ConfigScope.TEAM, scopeId: scope.scopeId });
        hierarchy.push({ scope: ConfigScope.ORGANIZATION, scopeId: scope.scopeId });
        hierarchy.push({ scope: ConfigScope.GLOBAL });
        break;
      case ConfigScope.TEAM:
        hierarchy.push({ scope: ConfigScope.TEAM, scopeId: scope.scopeId });
        hierarchy.push({ scope: ConfigScope.ORGANIZATION, scopeId: scope.scopeId });
        hierarchy.push({ scope: ConfigScope.GLOBAL });
        break;
      case ConfigScope.ORGANIZATION:
        hierarchy.push({ scope: ConfigScope.ORGANIZATION, scopeId: scope.scopeId });
        hierarchy.push({ scope: ConfigScope.GLOBAL });
        break;
      case ConfigScope.GLOBAL:
        hierarchy.push({ scope: ConfigScope.GLOBAL });
        break;
    }

    return hierarchy;
  }

  private getCacheKey(
    key: string,
    scope?: { scope: ConfigScope; scopeId?: string }
  ): string {
    if (!scope) {
      return `config:${key}:global`;
    }
    return `config:${key}:${scope.scope}:${scope.scopeId || 'null'}`;
  }

  private generateVersion(key: string, value: any): string {
    const timestamp = Date.now();
    const hash = crypto
      .createHash('sha256')
      .update(`${timestamp}${key}${JSON.stringify(value)}`)
      .digest('hex');
    return hash.substring(0, 16);
  }

  private calculateDiff(oldValue: any, newValue: any): ConfigDiff[] {
    const diff: ConfigDiff[] = [];

    // Handle null/undefined
    if (oldValue === null || oldValue === undefined) {
      return [{ path: '*', operation: 'add', newValue }];
    }
    if (newValue === null || newValue === undefined) {
      return [{ path: '*', operation: 'delete', oldValue }];
    }

    // Handle primitive types
    if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
      if (oldValue !== newValue) {
        return [{ path: '*', operation: 'modify', oldValue, newValue }];
      }
      return [];
    }

    // Handle objects
    const oldKeys = Object.keys(oldValue);
    const newKeys = Object.keys(newValue);
    const allKeysArray = [...oldKeys, ...newKeys];
    const allKeys = new Set(allKeysArray);

    for (const key of Array.from(allKeys)) {
      const oldVal = oldValue[key];
      const newVal = newValue[key];

      if (!(key in newValue)) {
        diff.push({ path: key, operation: 'delete', oldValue: oldVal });
      } else if (!(key in oldValue)) {
        diff.push({ path: key, operation: 'add', newValue: newVal });
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff.push({ path: key, operation: 'modify', oldValue: oldVal, newValue: newVal });
      }
    }

    return diff;
  }

  private async determineImpactLevel(
    key: string,
    newValue: any,
    currentValue?: any
  ): Promise<ImpactLevel> {
    // Get schema default impact level
    const schema = await this.getSchema(key);
    if (schema) {
      return schema.defaultImpactLevel;
    }

    // Heuristics based on key patterns
    if (key.includes('system') || key.includes('global')) {
      return ImpactLevel.HIGH;
    }
    if (key.includes('approval') || key.includes('threshold')) {
      return ImpactLevel.MEDIUM;
    }
    if (key.includes('notification') || key.includes('ui')) {
      return ImpactLevel.LOW;
    }

    return ImpactLevel.MEDIUM;
  }

  private shouldEncrypt(key: string): boolean {
    // Keys that should be encrypted
    const encryptedKeys = [
      'api_keys',
      'secrets',
      'credentials',
      'tokens',
      'passwords'
    ];

    return encryptedKeys.some(pattern => key.toLowerCase().includes(pattern));
  }

  private encrypt(value: any): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('base64'),
      encrypted: encrypted.toString('base64'),
      authTag: authTag.toString('base64')
    });
  }

  private decrypt(encryptedValue: string): any {
    const { iv, encrypted, authTag } = JSON.parse(encryptedValue);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  private evaluateCondition(condition: FlagCondition, context: FlagContext): boolean {
    const value = this.getAttributeValue(condition.attribute, context);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'in':
        return condition.values ? condition.values.includes(value) : false;
      case 'notIn':
        return condition.values ? !condition.values.includes(value) : true;
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      default:
        return false;
    }
  }

  private getAttributeValue(attribute: string, context: FlagContext): any {
    const parts = attribute.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async recordFlagEvaluation(
    flagName: string,
    context: FlagContext,
    result: boolean
  ): Promise<void> {
    // Record asynchronously, don't block
    this.pool
      .query(
        `INSERT INTO feature_flag_evaluations
         (flag_name, user_id, organization_id, result, context)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          flagName,
          context.userId || null,
          context.organizationId || null,
          result,
          context
        ]
      )
      .catch(err => {
        console.error('[ConfigService] Failed to record flag evaluation:', err);
      });
  }

  private async recordAudit(
    operation: string,
    configKey: string | undefined,
    userId: string | undefined,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Record asynchronously, don't block
    this.pool
      .query(
        `INSERT INTO configuration_audit_log
         (operation, config_key, user_id, success, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [operation, configKey || null, userId || null, success, metadata || {}]
      )
      .catch(err => {
        console.error('[ConfigService] Failed to record audit log:', err);
      });
  }

  private getAffectedServices(key: string): string[] {
    // Simplified - in real system would query service dependency graph
    const serviceMap: Record<string, string[]> = {
      branding: ['frontend', 'email-service'],
      pm_intervals: ['maintenance-service', 'scheduler'],
      approval_thresholds: ['workflow-service', 'notification-service'],
      system_settings: ['all']
    };

    return serviceMap[key] || ['unknown'];
  }

  private async estimateAffectedUsers(key: string): Promise<number> {
    // Simplified - in real system would query user database
    const estimates: Record<string, number> = {
      branding: 1000,
      pm_intervals: 50,
      approval_thresholds: 200,
      system_settings: 10000
    };

    return estimates[key] || 100;
  }

  private getTestingRecommendations(key: string, impactLevel: ImpactLevel): string[] {
    const recommendations: string[] = [
      'Test in development environment first',
      'Verify configuration loads correctly'
    ];

    if (impactLevel === ImpactLevel.HIGH || impactLevel === ImpactLevel.CRITICAL) {
      recommendations.push(
        'Test in staging with production data snapshot',
        'Perform load testing',
        'Prepare rollback plan',
        'Notify affected teams before deployment'
      );
    }

    return recommendations;
  }

  private toYaml(obj: any, indent: number): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (typeof obj !== 'object' || obj === null) {
      return `${obj}\n`;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.toYaml(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new ConfigurationManagementService instance
 *
 * @example
 * ```typescript
 * import { createConfigurationService } from './services/config/ConfigurationManagementService';
 * import { pool } from './config/database';
 * import Redis from 'ioredis';
 *
 * const redis = new Redis(process.env.REDIS_URL);
 * const configService = createConfigurationService(pool, { redis });
 *
 * // Use the service
 * const branding = await configService.get('branding');
 * ```
 */
export function createConfigurationService(
  pool: Pool,
  options?: {
    redis?: Redis;
    encryptionKey?: string;
    cacheEnabled?: boolean;
    cacheTtl?: number;
  }
): ConfigurationManagementService {
  return new ConfigurationManagementService(pool, options);
}
