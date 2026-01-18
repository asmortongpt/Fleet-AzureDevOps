```typescript
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
   * const branding = await configService.getConfig<BrandingConfig>(
   *   'branding',
   *   { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' }
   * );
   * console.log(branding.primaryColor); // "#FF6B00"
   * ```
   */
  async getConfig<T = any>(
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
   * Set a configuration value with automatic versioning
   *
   * @example
   * ```typescript
   * const version = await configService.setConfig(
   *   'branding',
   *   { logo: 'https://example.com/logo.png', primaryColor: '#FF6B00' },
   *   { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' },
   *   'user-456',
   *   'Updated branding colors'
   * );
   * console.log('Created version:', version.version);
   * ```
   */
  async setConfig<T = any>(
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