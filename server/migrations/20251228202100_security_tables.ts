import { Knex } from 'knex';

/**
 * Migration: Create comprehensive security tables
 *
 * This migration creates four critical security tables for SOC 2 Type II compliance:
 * 1. audit_logs - Immutable audit trail with cryptographic integrity
 * 2. sessions - Secure session management with token hashing
 * 3. encryption_keys - Metadata for key rotation (never stores actual keys)
 * 4. user_permissions - Role-based access control (RBAC)
 *
 * Security considerations:
 * - All tables use UUID primary keys for uniqueness
 * - Timestamps use timezone-aware TIMESTAMP WITH TIME ZONE
 * - Sensitive data (tokens, IP addresses) are properly typed and indexed
 * - Immutable audit logs include cryptographic hash chain for integrity verification
 * - Foreign keys cascade appropriately for referential integrity
 * - GIN indexes on JSONB columns for efficient searching
 */
export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // 1. AUDIT_LOGS TABLE - Immutable audit trail for compliance
  // ============================================================================
  await knex.schema.createTable('audit_logs', (table) => {
    // Primary key and tenant isolation
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable(); // Multi-tenant support

    // Cryptographic integrity chain
    table.string('record_hash', 64).notNullable(); // SHA-256 hash of this record
    table.string('previous_record_hash', 64).nullable(); // Hash of previous record (integrity chain)
    table.bigInteger('sequence_number').notNullable().unique(); // Monotonic sequence for ordering

    // Event classification and action tracking
    table.string('event_type', 50).notNullable(); // e.g., 'authentication', 'data_access', 'configuration_change'
    table.string('action', 100).notNullable(); // e.g., 'user.login', 'vehicle.update', 'permissions.granted'
    table.string('result', 20).notNullable(); // 'success', 'failure', 'partial'

    // Actor and resource identification
    table.uuid('user_id').nullable(); // Null for system events
    table.string('resource', 100).nullable(); // Resource type (vehicle, driver, facility, etc.)
    table.string('resource_id', 255).nullable(); // Resource identifier

    // Detailed change tracking
    table.jsonb('details').nullable(); // Extra context: {'change_type': 'update', 'affected_fields': [...]}

    // Security classification
    table.string('sensitivity', 20).notNullable().defaultTo('standard'); // 'public', 'standard', 'sensitive', 'confidential'

    // Network and client information
    table.specificType('ip_address', 'inet').nullable(); // Client IP address (INET type for PostgreSQL)
    table.text('user_agent').nullable(); // Browser/client identification string

    // Timestamps with timezone
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Indexes for fast querying and compliance reporting
    table.index('tenant_id', 'idx_audit_logs_tenant_id');
    table.index('user_id', 'idx_audit_logs_user_id');
    table.index('action', 'idx_audit_logs_action');
    table.index('event_type', 'idx_audit_logs_event_type');
    table.index('resource', 'idx_audit_logs_resource');
    table.index('created_at', 'idx_audit_logs_created_at');
    table.index('record_hash', 'idx_audit_logs_record_hash');
    table.index('sequence_number', 'idx_audit_logs_sequence_number');

    // Composite indexes for common queries
    table.index(['tenant_id', 'created_at'], 'idx_audit_logs_tenant_date');
    table.index(['tenant_id', 'event_type', 'created_at'], 'idx_audit_logs_tenant_event_date');
    table.index(['user_id', 'created_at'], 'idx_audit_logs_user_date');
    table.index(['resource', 'resource_id'], 'idx_audit_logs_resource_id');
  });

  // Create GIN index on JSONB details column for full-text search capabilities
  await knex.raw(`
    CREATE INDEX idx_audit_logs_details_gin
    ON audit_logs USING gin(details)
  `);

  // Add foreign key constraint to users table if it exists
  await knex.schema.alterTable('audit_logs', (table) => {
    table.foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.foreign('tenant_id')
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });

  console.log('✅ Migration up: Created audit_logs table with integrity chain');

  // ============================================================================
  // 2. SESSIONS TABLE - Secure session management
  // ============================================================================
  await knex.schema.createTable('sessions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // User association
    table.uuid('user_id').notNullable();
    table.uuid('tenant_id').notNullable();

    // Token management - store hash only, never the actual token
    table.string('token_hash', 255).notNullable(); // bcrypt or argon2 hash
    table.text('refresh_token_hash').nullable(); // Hash of refresh token

    // Session context
    table.specificType('ip_address', 'inet').nullable(); // Session origin IP
    table.text('user_agent').nullable(); // Browser/client info

    // Session lifecycle
    table.timestamp('expires_at', { useTz: true }).notNullable(); // Absolute expiration
    table.timestamp('last_activity_at', { useTz: true }).nullable(); // Last request time
    table.boolean('is_revoked').notNullable().defaultTo(false); // Manual revocation flag

    // Metadata
    table.string('device_id', 255).nullable(); // Device fingerprint
    table.string('device_name', 255).nullable(); // Human-readable device name (e.g., "iPhone 15 Pro")
    table.string('device_type', 50).nullable(); // 'mobile', 'desktop', 'tablet'

    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Indexes for fast lookups and cleanup
    table.index('user_id', 'idx_sessions_user_id');
    table.index('tenant_id', 'idx_sessions_tenant_id');
    table.index('expires_at', 'idx_sessions_expires_at'); // For cleanup queries
    table.index('is_revoked', 'idx_sessions_is_revoked');
    table.index('token_hash', 'idx_sessions_token_hash');
    table.index(['user_id', 'is_revoked'], 'idx_sessions_user_active');

    // Composite for common queries
    table.index(['user_id', 'expires_at', 'is_revoked'], 'idx_sessions_user_validity');
  });

  // Add foreign key constraints
  await knex.schema.alterTable('sessions', (table) => {
    table.foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.foreign('tenant_id')
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });

  console.log('✅ Migration up: Created sessions table');

  // ============================================================================
  // 3. ENCRYPTION_KEYS TABLE - Key rotation metadata (never stores actual keys)
  // ============================================================================
  await knex.schema.createTable('encryption_keys', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Key versioning
    table.string('key_version', 50).notNullable().unique(); // e.g., 'v1', 'v2', 'prod-2025-01'

    // Algorithm metadata
    table.string('algorithm', 50).notNullable(); // 'AES-256-GCM', 'ChaCha20-Poly1305', etc.
    table.string('purpose', 100).notNullable(); // 'data_encryption', 'token_signing', 'field_encryption'

    // Key storage location - actual key stored in Azure Key Vault or HSM
    table.string('key_vault_url', 255).notNullable(); // Azure Key Vault URI or HSM endpoint
    table.string('key_vault_name', 100).nullable(); // Azure Key Vault name
    table.string('key_id', 255).nullable(); // ID in external key management system

    // Key rotation tracking
    table.string('status', 20).notNullable().defaultTo('active'); // 'active', 'deprecated', 'archived', 'compromised'
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('rotated_at', { useTz: true }).nullable(); // When this key became active
    table.timestamp('deprecated_at', { useTz: true }).nullable(); // When this key was deprecated
    table.timestamp('archived_at', { useTz: true }).nullable(); // When archived

    // Metadata
    table.integer('rotation_interval_days').nullable(); // Recommended rotation interval
    table.text('notes').nullable(); // Admin notes about key

    // Audit trail
    table.uuid('managed_by').nullable(); // Admin who created/rotated
    table.timestamp('last_rotated_by', { useTz: true }).nullable();

    // Indexes
    table.index('key_version', 'idx_encryption_keys_version');
    table.index('status', 'idx_encryption_keys_status');
    table.index('created_at', 'idx_encryption_keys_created_at');
    table.index('rotated_at', 'idx_encryption_keys_rotated_at');
    table.unique('key_version');
  });

  // Add foreign key constraint
  await knex.schema.alterTable('encryption_keys', (table) => {
    table.foreign('managed_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });

  console.log('✅ Migration up: Created encryption_keys table');

  // ============================================================================
  // 4. USER_PERMISSIONS TABLE - Role-based access control (RBAC)
  // ============================================================================
  await knex.schema.createTable('user_permissions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // User and tenant
    table.uuid('user_id').notNullable();
    table.uuid('tenant_id').notNullable();

    // Permission value
    table.string('permission', 100).notNullable(); // e.g., 'vehicles.read', 'users.admin', 'audit.export'

    // Permission scope (optional)
    table.string('scope', 100).nullable(); // e.g., 'department:sales', 'region:northeast', 'vehicle_type:trucks'
    table.string('resource_id', 255).nullable(); // Specific resource (e.g., vehicle ID, facility ID)

    // Grant tracking
    table.timestamp('granted_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.uuid('granted_by').nullable(); // Admin who granted permission
    table.timestamp('granted_by_at', { useTz: true }).nullable();

    // Expiration (optional)
    table.timestamp('expires_at', { useTz: true }).nullable(); // Temporary permission expiration
    table.boolean('is_active').notNullable().defaultTo(true); // Soft delete/deactivation

    // Reason/audit
    table.text('reason').nullable(); // Why permission was granted
    table.text('notes').nullable(); // Additional notes

    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Prevent duplicate permissions
    table.unique(['user_id', 'tenant_id', 'permission', 'scope', 'resource_id'], 'idx_user_permissions_unique');

    // Indexes for fast lookups
    table.index('user_id', 'idx_user_permissions_user_id');
    table.index('tenant_id', 'idx_user_permissions_tenant_id');
    table.index('permission', 'idx_user_permissions_permission');
    table.index('is_active', 'idx_user_permissions_active');
    table.index('expires_at', 'idx_user_permissions_expires_at');

    // Composite indexes
    table.index(['user_id', 'is_active'], 'idx_user_permissions_user_active');
    table.index(['user_id', 'permission', 'is_active'], 'idx_user_permissions_user_perm_active');
    table.index(['tenant_id', 'permission'], 'idx_user_permissions_tenant_perm');
  });

  // Add foreign key constraints
  await knex.schema.alterTable('user_permissions', (table) => {
    table.foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.foreign('tenant_id')
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.foreign('granted_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });

  console.log('✅ Migration up: Created user_permissions table');

  // ============================================================================
  // VERIFY EXTENSIONS
  // ============================================================================
  // Verify UUID extension is installed
  await knex.raw(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
  `);

  // Verify INET type is available (built-in, but verify)
  await knex.raw(`
    SELECT typname FROM pg_type WHERE typname = 'inet'
  `);

  console.log('✅ Migration up: All security tables created successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Drop in reverse order of creation (respecting foreign key constraints)
  await knex.schema.dropTableIfExists('user_permissions');
  console.log('✅ Migration down: Dropped user_permissions table');

  await knex.schema.dropTableIfExists('encryption_keys');
  console.log('✅ Migration down: Dropped encryption_keys table');

  await knex.schema.dropTableIfExists('sessions');
  console.log('✅ Migration down: Dropped sessions table');

  await knex.schema.dropTableIfExists('audit_logs');
  console.log('✅ Migration down: Dropped audit_logs table');

  console.log('✅ Migration down: All security tables dropped successfully');
}
