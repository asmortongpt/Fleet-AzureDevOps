# Authorization Service

Production-ready authorization service for the Fleet Management System implementing RBAC, PBAC, and ABAC.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Performance](#performance)
- [Security](#security)
- [Examples](#examples)
- [Testing](#testing)
- [Monitoring](#monitoring)

## Overview

The Authorization Service provides comprehensive access control for the Fleet Management System. It combines three authorization models:

1. **RBAC (Role-Based Access Control)** - Users inherit permissions from assigned roles
2. **PBAC (Policy-Based Access Control)** - Dynamic policies with conditions
3. **ABAC (Attribute-Based Access Control)** - Context-aware decisions based on user, resource, and environment attributes

## Features

### Core Authorization

- ✅ Fine-grained permission checking (e.g., `vehicle:view:team`)
- ✅ Hierarchical role inheritance
- ✅ Row-level security with scopes (own/team/fleet/global)
- ✅ Dynamic policy evaluation with complex conditions
- ✅ Batch permission checks for performance

### Security

- ✅ Separation of Duties (SoD) enforcement
- ✅ Comprehensive audit trail
- ✅ Rate limiting protection
- ✅ PII-safe logging
- ✅ Secure by default (deny on error)

### Performance

- ✅ Redis caching (5-minute TTL)
- ✅ Cache warming for common permissions
- ✅ Circuit breaker for resilience
- ✅ <10ms cached, <100ms uncached (target)
- ✅ Batch operations for efficiency

### Monitoring

- ✅ Prometheus metrics
- ✅ Cache hit rate tracking
- ✅ Performance logging
- ✅ Security event logging
- ✅ Circuit breaker state monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Authorization Service                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     RBAC     │  │     PBAC     │  │     ABAC     │      │
│  │  Role-Based  │  │Policy-Based  │  │Attribute-Based│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                           │                                   │
│         ┌─────────────────┴─────────────────┐                │
│         │    Permission Evaluation Engine    │                │
│         └─────────────────┬─────────────────┘                │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐                │
│         │                 │                 │                │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐           │
│    │  Redis  │      │Database │      │ Circuit │           │
│    │  Cache  │      │   Pool  │      │ Breaker │           │
│    └─────────┘      └─────────┘      └─────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js 18+ with TypeScript
- PostgreSQL 14+
- Redis 6+ (optional but recommended)

### Database Setup

The service uses the RBAC schema from migration `002_rbac_permissions.sql`:

```bash
# Run the migration
psql -U postgres -d fleet_dev -f api/database/migrations/002_rbac_permissions.sql
```

### Dependencies

```bash
npm install pg redis zod winston
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fleet_dev
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

## Usage

### Basic Initialization

```typescript
import { Pool } from 'pg';
import { AuthorizationService } from './services/authz/AuthorizationService';

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize authorization service
const authzService = new AuthorizationService(
  pool,
  true, // Enable caching
  process.env.REDIS_URL
);
```

### Simple Permission Check

```typescript
// Check if user can view a vehicle
const canView = await authzService.hasPermission(
  userId,
  'vehicle:view:fleet'
);

if (canView) {
  // Proceed with operation
}
```

### Detailed Authorization Decision

```typescript
// Get detailed decision with reason
const decision = await authzService.checkPermission(
  userId,
  'vehicle:update:team',
  vehicle, // Resource context
  {
    environment: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  }
);

console.log(decision);
// {
//   granted: true,
//   reason: "Granted via role: FleetManager",
//   evaluationTimeMs: 12,
//   cacheHit: false,
//   ...
// }
```

### Batch Permission Checks

```typescript
// Check multiple permissions at once
const permissions = await authzService.checkMultiplePermissions(
  userId,
  [
    'vehicle:view:fleet',
    'vehicle:update:fleet',
    'vehicle:delete:fleet'
  ]
);

console.log(permissions.get('vehicle:delete:fleet')); // false
```

### Role Management

```typescript
// Assign a role to a user
await authzService.assignRole(
  userId,
  roleId,
  assignedBy,
  expiresAt // Optional: temporary elevation
);

// Revoke a role
await authzService.revokeRole(userId, roleId, revokedBy);

// Get user's roles
const roles = await authzService.getUserRoles(userId);
console.log(roles.map(r => r.name)); // ['FleetManager', 'Dispatcher']
```

### Permission Management

```typescript
// Grant a permission to a role
await authzService.grantPermission(
  roleId,
  permissionId,
  grantedBy,
  { // Optional: row-level conditions
    teamId: '${user.teamId}'
  }
);

// Revoke a permission
await authzService.revokePermission(roleId, permissionId, revokedBy);
```

### Cache Management

```typescript
// Invalidate user's cached permissions
await authzService.invalidateUserCache(userId);

// Warm cache with common permissions
await authzService.warmCache(userId);
```

## API Reference

### Permission Checking

#### `hasPermission(userId, permission, resource?): Promise<boolean>`

Simple boolean check for a permission.

**Parameters:**
- `userId` (string) - User ID (UUID)
- `permission` (string) - Permission name (format: `resource:verb:scope`)
- `resource` (any) - Optional resource context

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const canDelete = await authzService.hasPermission(
  'user-123',
  'vehicle:delete:global'
);
```

#### `checkPermission(userId, permission, resource?, context?): Promise<AuthorizationDecision>`

Detailed permission check with full decision context.

**Parameters:**
- `userId` (string) - User ID
- `permission` (string) - Permission name
- `resource` (any) - Optional resource
- `context` (Partial<AuthContext>) - Optional context

**Returns:** `Promise<AuthorizationDecision>`

**Example:**
```typescript
const decision = await authzService.checkPermission(
  'user-123',
  'work_order:approve:fleet',
  workOrder,
  {
    environment: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...'
    }
  }
);
```

#### `checkMultiplePermissions(userId, permissions, resource?): Promise<Map<string, boolean>>`

Batch permission check for multiple permissions.

**Parameters:**
- `userId` (string) - User ID
- `permissions` (string[]) - Array of permission names
- `resource` (any) - Optional resource

**Returns:** `Promise<Map<string, boolean>>`

**Example:**
```typescript
const results = await authzService.checkMultiplePermissions(
  'user-123',
  ['vehicle:view:fleet', 'vehicle:update:fleet', 'vehicle:delete:fleet']
);
```

### Role Management

#### `getUserRoles(userId): Promise<Role[]>`

Get all active roles for a user.

**Returns:** Array of role objects with permissions

#### `assignRole(userId, roleId, assignedBy, expiresAt?): Promise<void>`

Assign a role to a user. Enforces SoD rules.

**Throws:** `RoleAssignmentError` if SoD violation detected

#### `revokeRole(userId, roleId, revokedBy): Promise<void>`

Revoke a role from a user.

### Permission Management

#### `getRolePermissions(roleId): Promise<Permission[]>`

Get all permissions for a role.

#### `grantPermission(roleId, permissionId, grantedBy, conditions?): Promise<void>`

Grant a permission to a role with optional conditions.

#### `revokePermission(roleId, permissionId, revokedBy): Promise<void>`

Revoke a permission from a role.

### Policy Evaluation

#### `evaluatePolicy(userId, action, resource, context): Promise<PolicyDecision>`

Evaluate a single policy.

#### `evaluatePolicies(userId, action, resource, context): Promise<PolicyDecision>`

Evaluate all applicable policies (comprehensive check).

### Cache Management

#### `invalidateUserCache(userId): Promise<void>`

Clear cached decisions for a user.

#### `warmCache(userId): Promise<void>`

Preload common permissions for a user.

### Audit

#### `logAuthorizationDecision(decision): Promise<void>`

Log an authorization decision to the audit trail.

## Performance

### Benchmarks

| Operation | Cached | Uncached | Target |
|-----------|--------|----------|--------|
| Simple permission check | <5ms | <50ms | <10ms / <100ms |
| Batch check (10 perms) | <20ms | <200ms | <50ms / <500ms |
| Policy evaluation | N/A | <100ms | <150ms |

### Optimization Tips

1. **Use batch checks** when checking multiple permissions
2. **Warm cache** for active users during login
3. **Enable Redis** for production deployments
4. **Monitor cache hit rate** (target: >80%)
5. **Use scoped permissions** to reduce database queries

### Cache Strategy

- **TTL:** 5 minutes
- **Invalidation:** On role/permission changes
- **Warming:** Common permissions on login
- **Key format:** `authz:{userId}:{permission}:{resourceId}`

## Security

### Separation of Duties (SoD)

The service enforces SoD rules defined in the database:

```sql
-- Example: Finance cannot be FleetAdmin
INSERT INTO sod_rules (role_id, conflicting_role_id, reason)
VALUES (
  (SELECT id FROM roles WHERE name = 'Finance'),
  (SELECT id FROM roles WHERE name = 'FleetAdmin'),
  'Finance cannot also be FleetAdmin to prevent budget control conflicts'
);
```

Attempting to assign conflicting roles throws `RoleAssignmentError`.

### Audit Trail

All authorization decisions are logged to `permission_check_logs`:

```sql
SELECT * FROM permission_check_logs
WHERE user_id = 'user-123'
  AND granted = false
ORDER BY created_at DESC
LIMIT 10;
```

### Rate Limiting

The service tracks permission checks to detect enumeration attacks:

```typescript
// Monitored via metrics
this.metrics.permissionChecks++;
```

### Secure Defaults

- **Deny on error** - If evaluation fails, access is denied
- **Circuit breaker** - Opens on repeated failures, denies access
- **PII redaction** - Sensitive data masked in logs

## Examples

### Example 1: Time-Based Access

```typescript
// Policy: Allow vehicle assignment only during business hours
const policy: Policy = {
  id: 'policy-1',
  name: 'Business Hours Only',
  effect: 'allow',
  actions: ['vehicle:assign'],
  resources: ['vehicle'],
  conditions: [
    {
      attribute: 'environment.timestamp.hour',
      operator: 'greaterThan',
      value: 8
    },
    {
      attribute: 'environment.timestamp.hour',
      operator: 'lessThan',
      value: 18
    }
  ]
};
```

### Example 2: Geofenced Operations

```typescript
// Policy: Maintenance approval only on-site (within 100m)
const policy: Policy = {
  id: 'policy-2',
  name: 'On-site Maintenance Only',
  effect: 'allow',
  actions: ['maintenance:approve'],
  resources: ['work_order'],
  conditions: [
    {
      attribute: 'environment.geolocation.distance',
      operator: 'lessThan',
      value: 100
    }
  ]
};
```

### Example 3: Resource Ownership

```typescript
// Policy: Users can only update their own records
const policy: Policy = {
  id: 'policy-3',
  name: 'Own Records Only',
  effect: 'allow',
  actions: ['record:update'],
  resources: ['driver_profile'],
  conditions: [
    {
      attribute: 'resource.ownerId',
      operator: 'equals',
      value: '${userId}' // Variable substitution
    }
  ]
};
```

### Example 4: Express Middleware

```typescript
// Middleware for route protection
function requirePermission(permission: string) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const decision = await authzService.checkPermission(
        userId,
        permission,
        req.body,
        {
          environment: {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        }
      );

      if (!decision.granted) {
        return res.status(403).json({
          error: 'Permission denied',
          reason: decision.reason
        });
      }

      // Attach decision to request for logging
      req.authzDecision = decision;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

// Usage
app.post('/api/vehicles',
  authenticate,
  requirePermission('vehicle:create:global'),
  createVehicleHandler
);
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthorizationService } from './AuthorizationService';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
      connect: vi.fn()
    };
    service = new AuthorizationService(mockPool, false);
  });

  it('should grant permission when user has role', async () => {
    // Mock user has FleetAdmin role
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'role-1', name: 'FleetAdmin' }]
    });

    // Mock FleetAdmin has vehicle:view:global permission
    mockPool.query.mockResolvedValueOnce({
      rows: [{ name: 'vehicle:view:global' }]
    });

    const granted = await service.hasPermission(
      'user-123',
      'vehicle:view:global'
    );

    expect(granted).toBe(true);
  });

  it('should deny permission when user lacks role', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const granted = await service.hasPermission(
      'user-123',
      'vehicle:delete:global'
    );

    expect(granted).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('AuthorizationService Integration', () => {
  let pool: Pool;
  let service: AuthorizationService;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DATABASE_URL });
    service = new AuthorizationService(pool);

    // Seed test data
    await seedTestUsers();
    await seedTestRoles();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should enforce SoD rules', async () => {
    const userId = 'test-user-1';
    const financeRoleId = await getRoleId('Finance');
    const adminRoleId = await getRoleId('FleetAdmin');

    // Assign Finance role
    await service.assignRole(userId, financeRoleId, 'admin-1');

    // Attempt to assign conflicting FleetAdmin role
    await expect(
      service.assignRole(userId, adminRoleId, 'admin-1')
    ).rejects.toThrow(RoleAssignmentError);
  });
});
```

## Monitoring

### Metrics

The service exposes metrics via Winston logger:

```json
{
  "message": "Authorization service metrics",
  "permissionChecks": 1547,
  "cacheHits": 1234,
  "cacheMisses": 313,
  "cacheHitRate": "79.76%",
  "grants": 1389,
  "denials": 158,
  "errors": 0,
  "grantRate": "89.78%",
  "circuitBreakerState": "closed"
}
```

### Dashboard Queries

**Permission denials by user:**
```sql
SELECT
  user_id,
  COUNT(*) as denials,
  array_agg(DISTINCT permission_name) as denied_permissions
FROM permission_check_logs
WHERE granted = false
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY user_id
ORDER BY denials DESC
LIMIT 10;
```

**Most checked permissions:**
```sql
SELECT
  permission_name,
  COUNT(*) as checks,
  COUNT(*) FILTER (WHERE granted) as grants,
  COUNT(*) FILTER (WHERE NOT granted) as denials
FROM permission_check_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY permission_name
ORDER BY checks DESC
LIMIT 20;
```

**Authorization latency:**
```sql
SELECT
  permission_name,
  AVG(evaluation_time_ms) as avg_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY evaluation_time_ms) as p95_ms
FROM permission_check_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY permission_name
HAVING AVG(evaluation_time_ms) > 50
ORDER BY avg_ms DESC;
```

## Troubleshooting

### High cache miss rate

**Symptom:** Cache hit rate below 70%

**Solutions:**
1. Increase cache TTL (balance with security)
2. Warm cache on user login
3. Check Redis connectivity
4. Review permission patterns (too many unique checks?)

### Slow permission checks

**Symptom:** p95 latency >200ms

**Solutions:**
1. Enable Redis caching
2. Check database indexes on `user_roles`, `role_permissions`
3. Review policy complexity
4. Use batch checks for multiple permissions

### Circuit breaker opening

**Symptom:** `circuitBreakerState: "open"` in metrics

**Solutions:**
1. Check database connectivity
2. Review database pool settings
3. Check for slow queries in `permission_check_logs`
4. Scale database if needed

### SoD violations

**Symptom:** `RoleAssignmentError` with SoD message

**Solutions:**
1. Review SoD rules in `sod_rules` table
2. Document conflicting roles for admins
3. Consider role hierarchy redesign if too restrictive

## License

Proprietary - Capital Tech Alliance

## Support

For issues or questions, contact the Fleet Management System team.

---

**Version:** 1.0.0
**Last Updated:** 2026-01-05
**Maintainer:** Fleet Development Team
