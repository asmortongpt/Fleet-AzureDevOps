# Security Tables Documentation

This document describes the comprehensive security tables created by the migration `20251228202100_security_tables.ts`.

## Overview

Four immutable security tables have been created to support SOC 2 Type II compliance:

1. **audit_logs** - Complete audit trail with cryptographic integrity
2. **sessions** - Secure session management with token hashing
3. **encryption_keys** - Key rotation metadata (never stores actual keys)
4. **user_permissions** - Role-based access control (RBAC)

All tables use best practices:
- UUID primary keys for uniqueness across systems
- Parameterized queries only (no string concatenation in SQL)
- Sensitive data properly typed and indexed
- Timezone-aware timestamps (`TIMESTAMP WITH TIME ZONE`)
- Foreign key constraints for referential integrity
- GIN indexes on JSONB columns for efficient searching

## Architecture & Security

### Design Principles

1. **Never Store Secrets**: Actual encryption keys are stored in Azure Key Vault or HSM. The `encryption_keys` table stores metadata only.

2. **Token Hashing**: Session tokens are hashed before storage using bcrypt or Argon2. The plaintext token is never stored in the database.

3. **Immutability**: Audit logs form an integrity chain using SHA-256 hashes. Each log references the hash of the previous log, creating a tamper-evident chain.

4. **Parameterized Queries**: All database access uses parameterized queries ($1, $2, etc.) to prevent SQL injection.

5. **Least Privilege**: All operations follow the principle of least privilege.

---

## Table Schemas

### 1. audit_logs

**Purpose**: Immutable audit trail for compliance and forensics.

**Columns**:

```typescript
{
  id: UUID                    // Primary key
  tenant_id: UUID            // Multi-tenant support
  record_hash: VARCHAR(64)    // SHA-256 hash of this record
  previous_record_hash: VARCHAR(64) // Hash chain for integrity
  sequence_number: BIGINT     // Monotonic sequence number
  event_type: VARCHAR(50)     // Type: 'authentication', 'data_access', etc.
  action: VARCHAR(100)        // Specific action: 'user.login', 'vehicle.update'
  result: VARCHAR(20)         // 'success', 'failure', 'partial'
  user_id: UUID (nullable)    // Null for system events
  resource: VARCHAR(100)      // Resource type: 'vehicle', 'driver', 'facility'
  resource_id: VARCHAR(255)   // Resource identifier
  details: JSONB              // Extra context (flexible schema)
  sensitivity: VARCHAR(20)    // 'public', 'standard', 'sensitive', 'confidential'
  ip_address: INET            // Client IP (IPv4/IPv6)
  user_agent: TEXT            // Browser/client identification
  created_at: TIMESTAMP TZ    // When event occurred
}
```

**Indexes**:

```
idx_audit_logs_tenant_id         // Filter by tenant
idx_audit_logs_user_id           // Filter by user
idx_audit_logs_action            // Search by action type
idx_audit_logs_event_type        // Filter by event type
idx_audit_logs_resource          // Filter by resource type
idx_audit_logs_created_at        // Time-based queries
idx_audit_logs_record_hash       // Hash verification
idx_audit_logs_sequence_number   // Monotonic ordering
idx_audit_logs_details_gin       // JSONB full-text search
idx_audit_logs_tenant_date       // Tenant + date range queries
idx_audit_logs_tenant_event_date // Complex compliance queries
idx_audit_logs_user_date         // User activity timeline
idx_audit_logs_resource_id       // Find resource changes
```

**Immutability & Integrity**:

- Each log is assigned a unique `sequence_number` per tenant, ensuring no gaps.
- The `record_hash` contains SHA-256 hash of log contents.
- The `previous_record_hash` references the hash of the preceding log, forming an integrity chain.
- To tamper with a log, an attacker would need to regenerate all subsequent hashes, which is computationally infeasible.

**Example Entry**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
  "record_hash": "abc123def456...",
  "previous_record_hash": "xyz789uvw012...",
  "sequence_number": 42,
  "event_type": "authentication",
  "action": "user.login",
  "result": "success",
  "user_id": "550e8400-e29b-41d4-a716-446655440002",
  "resource": null,
  "resource_id": null,
  "details": { "method": "password", "mfa": true },
  "sensitivity": "standard",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-12-28T20:21:00+00:00"
}
```

---

### 2. sessions

**Purpose**: Secure session management with token hashing and revocation.

**Columns**:

```typescript
{
  id: UUID                    // Primary key
  user_id: UUID               // User this session belongs to
  tenant_id: UUID             // Tenant association
  token_hash: VARCHAR(255)    // Bcrypt/Argon2 hash of session token
  refresh_token_hash: TEXT    // Hash of refresh token (optional)
  ip_address: INET            // Session origin IP
  user_agent: TEXT            // Browser/device info
  expires_at: TIMESTAMP TZ    // When session expires
  last_activity_at: TIMESTAMP TZ // Last request time
  is_revoked: BOOLEAN         // Manual revocation flag
  device_id: VARCHAR(255)     // Device fingerprint
  device_name: VARCHAR(255)   // "iPhone 15 Pro"
  device_type: VARCHAR(50)    // 'mobile', 'desktop', 'tablet'
  created_at: TIMESTAMP TZ    // Session creation time
  updated_at: TIMESTAMP TZ    // Last update time
}
```

**Indexes**:

```
idx_sessions_user_id         // All sessions for user
idx_sessions_tenant_id       // All sessions for tenant
idx_sessions_expires_at      // Find expired sessions (cleanup)
idx_sessions_is_revoked      // Find revoked sessions
idx_sessions_token_hash      // Lookup by token (fast path)
idx_sessions_user_active     // Active sessions for user
idx_sessions_user_validity   // Combined: user, expiry, revoke status
```

**Security Notes**:

- Tokens are **never** stored in plaintext. Only the hash is stored.
- To verify a token, compare the SHA-256 or bcrypt hash of the incoming token with the stored hash.
- Sessions automatically expire after `expires_at` time.
- Sessions can be manually revoked via `is_revoked` flag.
- Activity tracking via `last_activity_at` helps detect inactive sessions.
- Device fingerprinting helps detect unauthorized access from unusual devices.

**Example Entry**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440002",
  "token_hash": "$2b$12$...",  // Bcrypt hash
  "refresh_token_hash": "$2b$12$...",
  "ip_address": "203.0.113.45",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "expires_at": "2025-12-29T20:21:00+00:00",
  "last_activity_at": "2025-12-28T20:20:00+00:00",
  "is_revoked": false,
  "device_id": "device_fingerprint_abc123",
  "device_name": "Chrome on Windows",
  "device_type": "desktop",
  "created_at": "2025-12-28T20:21:00+00:00",
  "updated_at": "2025-12-28T20:20:00+00:00"
}
```

---

### 3. encryption_keys

**Purpose**: Metadata for encryption key management and rotation. Never stores actual keys.

**Columns**:

```typescript
{
  id: UUID                    // Primary key
  key_version: VARCHAR(50)    // Unique version: 'v1', 'prod-2025-01'
  algorithm: VARCHAR(50)      // 'AES-256-GCM', 'ChaCha20-Poly1305'
  purpose: VARCHAR(100)       // 'data_encryption', 'token_signing'
  key_vault_url: VARCHAR(255) // Azure Key Vault URI
  key_vault_name: VARCHAR(100) // Vault name
  key_id: VARCHAR(255)        // ID in external system
  status: VARCHAR(20)         // 'active', 'deprecated', 'archived'
  created_at: TIMESTAMP TZ    // When key was created
  rotated_at: TIMESTAMP TZ    // When key became active
  deprecated_at: TIMESTAMP TZ // When deprecated
  archived_at: TIMESTAMP TZ   // When archived
  rotation_interval_days: INTEGER // Recommended rotation interval
  notes: TEXT                 // Admin notes
  managed_by: UUID            // Admin who created/rotated
  last_rotated_by: TIMESTAMP TZ // Timestamp of rotation
}
```

**Indexes**:

```
idx_encryption_keys_version   // Lookup by version
idx_encryption_keys_status    // Find active/deprecated keys
idx_encryption_keys_created_at // Chronological queries
idx_encryption_keys_rotated_at // Track rotation history
```

**Critical Security Note**:

**NEVER** store actual encryption keys in this table. This table stores **metadata only**. Actual keys must be stored in:
- Azure Key Vault (recommended for production)
- Hardware Security Module (HSM)
- Dedicated key management service

The `key_vault_url` column points to the external system where the real key is stored.

**Workflow**:

1. Generate new key in Azure Key Vault
2. Store metadata in `encryption_keys` table
3. Mark previous key as deprecated
4. Gradually migrate data encrypted with old key to use new key
5. Archive old key after migration is complete

**Example Entry**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key_version": "prod-2025-01",
  "algorithm": "AES-256-GCM",
  "purpose": "data_encryption",
  "key_vault_url": "https://my-vault.vault.azure.net/",
  "key_vault_name": "my-vault",
  "key_id": "keys/data-encryption-key/ae3e5d31c38d4a66b38e",
  "status": "active",
  "created_at": "2025-01-01T00:00:00+00:00",
  "rotated_at": "2025-01-01T00:00:00+00:00",
  "deprecated_at": null,
  "archived_at": null,
  "rotation_interval_days": 90,
  "notes": "Primary data encryption key",
  "managed_by": "550e8400-e29b-41d4-a716-446655440001",
  "last_rotated_by": "2025-01-01T00:00:00+00:00"
}
```

---

### 4. user_permissions

**Purpose**: Role-based access control (RBAC) with fine-grained permission management.

**Columns**:

```typescript
{
  id: UUID                    // Primary key
  user_id: UUID               // User being granted permission
  tenant_id: UUID             // Tenant context
  permission: VARCHAR(100)    // 'vehicles.read', 'users.admin', etc.
  scope: VARCHAR(100)         // Optional scope: 'department:sales'
  resource_id: VARCHAR(255)   // Optional specific resource
  granted_at: TIMESTAMP TZ    // When permission granted
  granted_by: UUID            // Admin who granted (nullable)
  granted_by_at: TIMESTAMP TZ // When granted
  expires_at: TIMESTAMP TZ    // Optional expiration
  is_active: BOOLEAN          // Soft delete flag
  reason: TEXT                // Why permission granted
  notes: TEXT                 // Admin notes
  created_at: TIMESTAMP TZ    // Record creation
  updated_at: TIMESTAMP TZ    // Last update
}
```

**Constraints**:

```
UNIQUE (user_id, tenant_id, permission, scope, resource_id)
```

This ensures no duplicate permissions for a user.

**Indexes**:

```
idx_user_permissions_user_id         // All permissions for user
idx_user_permissions_tenant_id       // All permissions in tenant
idx_user_permissions_permission      // Find who has permission
idx_user_permissions_active          // Filter active permissions
idx_user_permissions_expires_at      // Find expired permissions
idx_user_permissions_user_active     // Active permissions for user
idx_user_permissions_user_perm_active // User + permission + active
idx_user_permissions_tenant_perm     // Tenant + permission combo
```

**Permission Format**:

Permissions follow a hierarchical dot-notation format:

- `vehicles.read` - Read vehicle information
- `vehicles.write` - Create/update vehicles
- `vehicles.delete` - Delete vehicles
- `users.admin` - Administer users
- `audit.export` - Export audit logs
- `settings.configure` - Configure system settings

**Scopes** (optional):

Restrict permission to specific contexts:

- `department:sales` - Only for sales department
- `region:northeast` - Only for northeast region
- `vehicle_type:trucks` - Only for trucks

**Example Entries**:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440002",
    "permission": "vehicles.read",
    "scope": "department:sales",
    "resource_id": null,
    "granted_at": "2025-01-01T00:00:00+00:00",
    "granted_by": "550e8400-e29b-41d4-a716-446655440003",
    "granted_by_at": "2025-01-01T00:00:00+00:00",
    "expires_at": null,
    "is_active": true,
    "reason": "Sales role requirement",
    "notes": null,
    "created_at": "2025-01-01T00:00:00+00:00",
    "updated_at": "2025-01-01T00:00:00+00:00"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440002",
    "permission": "vehicles.write",
    "scope": null,
    "resource_id": null,
    "granted_at": "2025-02-01T00:00:00+00:00",
    "granted_by": "550e8400-e29b-41d4-a716-446655440003",
    "granted_by_at": "2025-02-01T00:00:00+00:00",
    "expires_at": "2025-03-01T00:00:00+00:00",  // Temporary permission
    "is_active": true,
    "reason": "Temporary project lead for Q1",
    "notes": "Review on 2025-02-28",
    "created_at": "2025-02-01T00:00:00+00:00",
    "updated_at": "2025-02-01T00:00:00+00:00"
  }
]
```

---

## Usage Examples

### TypeScript Interfaces

All tables have corresponding TypeScript interfaces in `src/types/security.ts`:

```typescript
import {
  AuditLog,
  Session,
  EncryptionKey,
  UserPermission,
} from '@/types/security';
```

### Using SecurityService

High-level operations through `SecurityService`:

```typescript
import { SecurityService } from '@/services/SecurityService';
import knex from 'knex';

const db = knex(config);
const security = new SecurityService(db);

// Log an event
await security.logAuthEvent(
  tenantId,
  userId,
  'success',
  request.ip,
  request.headers['user-agent']
);

// Create session
const token = security.generateSessionToken();
const tokenHash = await bcrypt.hash(token, 12);
const session = await security.createSession({
  userId,
  tenantId,
  tokenHash,
  expiresIn: 86400, // 24 hours
  ip: request.ip,
  userAgent: request.headers['user-agent'],
});

// Check permission
const canExport = await security.checkPermission(
  userId,
  tenantId,
  'audit.export'
);

// Grant permission
await security.grantPermission(
  userId,
  tenantId,
  'vehicles.read',
  adminId,
  {
    scope: 'department:sales',
    reason: 'New sales team member',
  }
);

// Search audit logs
const logs = await security.searchAuditLogs(tenantId, {
  userId,
  startDate: new Date(Date.now() - 86400000), // Last 24 hours
  endDate: new Date(),
});
```

### Using SecurityRepository

Lower-level database access:

```typescript
import { SecurityRepository } from '@/repositories/SecurityRepository';

const repo = new SecurityRepository(db);

// Direct repository access
const session = await repo.getSessionById(sessionId);
const hasPermission = await repo.hasPermission(userId, tenantId, 'vehicles.read');
const logs = await repo.queryAuditLogs({
  tenant_id: tenantId,
  event_type: 'authentication',
  limit: 100,
});
```

---

## Maintenance Tasks

### Clean up expired sessions

Run periodically (e.g., hourly cron job):

```typescript
const deleted = await security.cleanupExpiredSessions();
console.log(`Cleaned up ${deleted} expired sessions`);
```

### Clean up expired permissions

Run periodically (e.g., daily cron job):

```typescript
const deactivated = await security.cleanupExpiredPermissions();
console.log(`Deactivated ${deactivated} expired permissions`);
```

### Rotate encryption keys

When rotating keys:

```typescript
// Generate new key in Azure Key Vault
// Then update metadata:

const newKey = await repo.rotateKey(
  'prod-2024-12', // Old key version
  {
    key_version: 'prod-2025-01',
    algorithm: 'AES-256-GCM',
    purpose: 'data_encryption',
    key_vault_url: 'https://my-vault.vault.azure.net/',
    key_id: 'keys/data-encryption-key/new-id',
  }
);

// Now gradually migrate data...
// Then archive old key:

await repo.deprecateKey('prod-2024-12');
```

---

## Compliance & Audit

### SOC 2 Type II Requirements Met

- [x] Complete audit trail (`audit_logs`)
- [x] Immutable log integrity (`record_hash`, `previous_record_hash`)
- [x] User activity tracking (user_id, timestamp)
- [x] Session management (`sessions`)
- [x] Permission tracking (`user_permissions`)
- [x] Encryption key management (`encryption_keys`)
- [x] Parameterized queries (no SQL injection)
- [x] Timezone-aware timestamps
- [x] Indexed for compliance reporting

### HIPAA/PCI Compliance

- All sensitive data (tokens, passwords) are hashed, never stored in plaintext
- PII fields properly classified with `sensitivity` level
- Audit logs track all access to sensitive data
- Session revocation for compromised accounts
- Encryption key rotation support

---

## Security Checklist

- [x] No plaintext tokens in database
- [x] No plaintext passwords in database
- [x] No encryption keys in database (stored in Key Vault)
- [x] Parameterized queries only
- [x] Foreign key constraints
- [x] Timezone-aware timestamps
- [x] Indexed for performance
- [x] Immutable audit logs
- [x] Soft delete support (is_active)
- [x] Role-based access control
- [x] Session expiration and revocation
- [x] Key rotation support

---

## Migration History

### 20251228202100_security_tables.ts

Initial creation of all four security tables:
- audit_logs
- sessions
- encryption_keys
- user_permissions

Includes:
- All indexes for performance
- Foreign key constraints
- UUID extension verification
- INET type support
