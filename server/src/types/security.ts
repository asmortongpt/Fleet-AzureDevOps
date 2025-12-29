/**
 * Security Table Type Definitions
 *
 * TypeScript interfaces for all security-related database tables.
 * These interfaces ensure type safety throughout the application.
 */

/**
 * Audit log entry - immutable audit trail for compliance
 */
export interface AuditLog {
  id: string; // UUID
  tenant_id: string; // UUID
  record_hash: string; // SHA-256 hash
  previous_record_hash: string | null; // Integrity chain
  sequence_number: bigint; // Monotonic sequence
  event_type: 'authentication' | 'data_access' | 'configuration_change' | 'permission_change' | 'system_event' | string;
  action: string; // e.g., 'user.login', 'vehicle.update'
  result: 'success' | 'failure' | 'partial';
  user_id: string | null; // UUID or null for system events
  resource: string | null; // Resource type
  resource_id: string | null; // Resource identifier
  details: Record<string, unknown> | null; // JSONB extra context
  sensitivity: 'public' | 'standard' | 'sensitive' | 'confidential';
  ip_address: string | null; // INET type (IPv4 or IPv6)
  user_agent: string | null; // Browser/client info
  created_at: Date; // TIMESTAMP WITH TIME ZONE
}

/**
 * User session - secure session management
 */
export interface Session {
  id: string; // UUID
  user_id: string; // UUID (not null)
  tenant_id: string; // UUID (not null)
  token_hash: string; // Bcrypt or Argon2 hash (never store actual token)
  refresh_token_hash: string | null; // Refresh token hash
  ip_address: string | null; // INET type
  user_agent: string | null;
  expires_at: Date; // TIMESTAMP WITH TIME ZONE
  last_activity_at: Date | null; // TIMESTAMP WITH TIME ZONE
  is_revoked: boolean;
  device_id: string | null; // Device fingerprint
  device_name: string | null; // e.g., "iPhone 15 Pro"
  device_type: 'mobile' | 'desktop' | 'tablet' | null;
  created_at: Date; // TIMESTAMP WITH TIME ZONE
  updated_at: Date; // TIMESTAMP WITH TIME ZONE
}

/**
 * Encryption key metadata - never stores actual keys
 * Actual keys stored in Azure Key Vault or HSM
 */
export interface EncryptionKey {
  id: string; // UUID
  key_version: string; // Unique version identifier (e.g., 'v1', 'prod-2025-01')
  algorithm: string; // e.g., 'AES-256-GCM', 'ChaCha20-Poly1305'
  purpose: 'data_encryption' | 'token_signing' | 'field_encryption' | string;
  key_vault_url: string; // Azure Key Vault URI or HSM endpoint
  key_vault_name: string | null; // Azure Key Vault name
  key_id: string | null; // ID in external KMS
  status: 'active' | 'deprecated' | 'archived' | 'compromised';
  created_at: Date; // TIMESTAMP WITH TIME ZONE
  rotated_at: Date | null; // When this key became active
  deprecated_at: Date | null;
  archived_at: Date | null;
  rotation_interval_days: number | null; // Recommended rotation interval
  notes: string | null;
  managed_by: string | null; // UUID of admin who created/rotated
  last_rotated_by: Date | null;
}

/**
 * User permission - role-based access control (RBAC)
 */
export interface UserPermission {
  id: string; // UUID
  user_id: string; // UUID
  tenant_id: string; // UUID
  permission: string; // e.g., 'vehicles.read', 'users.admin', 'audit.export'
  scope: string | null; // e.g., 'department:sales', 'region:northeast'
  resource_id: string | null; // Specific resource (vehicle ID, facility ID, etc.)
  granted_at: Date; // TIMESTAMP WITH TIME ZONE
  granted_by: string | null; // UUID of admin who granted
  granted_by_at: Date | null;
  expires_at: Date | null; // Optional temporary permission expiration
  is_active: boolean; // Soft delete/deactivation
  reason: string | null; // Why permission was granted
  notes: string | null;
  created_at: Date; // TIMESTAMP WITH TIME ZONE
  updated_at: Date; // TIMESTAMP WITH TIME ZONE
}

/**
 * Request type for creating/updating audit logs
 */
export interface CreateAuditLogRequest {
  tenant_id: string;
  event_type: AuditLog['event_type'];
  action: string;
  result: AuditLog['result'];
  user_id?: string | null;
  resource?: string | null;
  resource_id?: string | null;
  details?: Record<string, unknown> | null;
  sensitivity?: AuditLog['sensitivity'];
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Request type for creating/updating sessions
 */
export interface CreateSessionRequest {
  user_id: string;
  tenant_id: string;
  token_hash: string; // Pre-hashed token
  refresh_token_hash?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: Date;
  device_id?: string | null;
  device_name?: string | null;
  device_type?: Session['device_type'];
}

/**
 * Request type for creating/updating permissions
 */
export interface CreateUserPermissionRequest {
  user_id: string;
  tenant_id: string;
  permission: string;
  scope?: string | null;
  resource_id?: string | null;
  granted_by?: string | null;
  expires_at?: Date | null;
  reason?: string | null;
  notes?: string | null;
}

/**
 * Query options for audit log searches
 */
export interface AuditLogQueryOptions {
  tenant_id: string;
  user_id?: string | null;
  event_type?: string | null;
  action?: string | null;
  resource?: string | null;
  resource_id?: string | null;
  start_date?: Date | null;
  end_date?: Date | null;
  result?: AuditLog['result'] | null;
  limit?: number;
  offset?: number;
}

/**
 * Query options for session searches
 */
export interface SessionQueryOptions {
  user_id?: string | null;
  tenant_id?: string | null;
  is_revoked?: boolean | null;
  limit?: number;
  offset?: number;
}

/**
 * Query options for permission searches
 */
export interface UserPermissionQueryOptions {
  user_id?: string | null;
  tenant_id?: string | null;
  permission?: string | null;
  is_active?: boolean | null;
  limit?: number;
  offset?: number;
}
