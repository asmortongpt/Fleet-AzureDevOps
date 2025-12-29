# Security Tables Implementation Guide

Quick start guide for using the security tables in your application.

## Files Created

1. **Migration**: `migrations/20251228202100_security_tables.ts`
   - Creates 4 security tables with proper indexes and constraints

2. **Types**: `src/types/security.ts`
   - TypeScript interfaces for all security tables
   - Request/response types for API operations
   - Query option types for filtering

3. **Repository**: `src/repositories/SecurityRepository.ts`
   - Low-level database access layer
   - Type-safe parameterized queries
   - No SQL injection vulnerabilities

4. **Service**: `src/services/SecurityService.ts`
   - High-level security operations
   - Audit logging helpers
   - Session management
   - Permission checking

5. **Documentation**: `SECURITY_TABLES.md`
   - Complete schema documentation
   - Usage examples
   - Compliance notes

## Running the Migration

```bash
# Development
npm run migrate:latest

# Or directly
npx knex migrate:latest --env development
```

## Basic Usage

### 1. Initialize Security Service

```typescript
import { SecurityService } from '@/services/SecurityService';
import knex from './src/lib/database';

const securityService = new SecurityService(knex);
```

### 2. Log Authentication Events

```typescript
// On login success
await securityService.logAuthEvent(
  tenantId,
  userId,
  'success',
  request.ip,
  request.headers['user-agent']
);

// On login failure
await securityService.logAuthEvent(
  tenantId,
  null, // No user on failed login
  'failure',
  request.ip,
  request.headers['user-agent'],
  'Invalid password'
);
```

### 3. Create Sessions

```typescript
import bcrypt from 'bcrypt';

// Generate token
const token = securityService.generateSessionToken();

// Hash before storage (CRITICAL: never store plaintext tokens)
const tokenHash = await bcrypt.hash(token, 12);

// Create session
const session = await securityService.createSession({
  userId,
  tenantId,
  tokenHash,
  expiresIn: 86400, // 24 hours in seconds
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  deviceId: deviceFingerprint,
  deviceName: 'Chrome on Windows',
  deviceType: 'desktop',
});

// Return token (never hash) to client
response.json({
  sessionId: session.id,
  token, // Plaintext token for client
  expiresIn: 86400,
});
```

### 4. Verify Sessions

```typescript
// On each request with session token
const session = await securityService.verifySession(sessionId);

if (!session) {
  throw new UnauthorizedError('Invalid session');
}

// Session is automatically updated with last_activity_at
```

### 5. Grant Permissions

```typescript
await securityService.grantPermission(
  userId,
  tenantId,
  'vehicles.read',
  adminId, // Who granted it
  {
    scope: 'department:sales',
    reason: 'New sales representative',
    expiresIn: 2592000, // 30 days (optional temporary permission)
  }
);
```

### 6. Check Permissions

```typescript
// Soft check - returns boolean
const canRead = await securityService.checkPermission(
  userId,
  tenantId,
  'vehicles.read'
);

if (!canRead) {
  throw new ForbiddenError('Insufficient permissions');
}

// Or throw automatically
try {
  await securityService.requirePermission(
    userId,
    tenantId,
    'vehicles.read'
  );
} catch (error) {
  throw new ForbiddenError(error.message);
}
```

### 7. Revoke Sessions

```typescript
// Single session
await securityService.revokeSession(sessionId);

// All user sessions (e.g., on password change)
await securityService.revokeAllUserSessions(userId, tenantId);
```

### 8. Log Data Access

```typescript
// Log when user reads sensitive data
await securityService.logDataAccess(
  tenantId,
  userId,
  'vehicle', // resource type
  vehicleId,
  request.ip,
  request.headers['user-agent']
);
```

### 9. Log Data Modifications

```typescript
// Log when user modifies data
await securityService.logDataModification(
  tenantId,
  userId,
  'vehicle',
  vehicleId,
  {
    status: {
      before: 'active',
      after: 'inactive',
    },
    location: {
      before: 'Garage A',
      after: 'Garage B',
    },
  },
  request.ip,
  request.headers['user-agent']
);
```

### 10. Search Audit Logs

```typescript
// Complex audit log search (for compliance reports)
const logs = await securityService.searchAuditLogs(
  tenantId,
  {
    eventType: 'data_access',
    startDate: new Date(Date.now() - 86400000 * 30), // Last 30 days
    endDate: new Date(),
    userId: specificUserId, // Optional
    limit: 1000,
  }
);

logs.forEach(log => {
  console.log(`${log.action} by ${log.user_id} at ${log.created_at}`);
});
```

## Integration Points

### Express Middleware

```typescript
import { SecurityService } from '@/services/SecurityService';
import knex from './database';

const security = new SecurityService(knex);

// Session verification middleware
app.use(async (req, res, next) => {
  const sessionId = req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(401).json({ error: 'Missing session' });
  }

  const session = await security.verifySession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  req.user = { id: session.user_id };
  req.tenantId = session.tenant_id;
  next();
});

// Permission check middleware
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      await security.requirePermission(
        req.user.id,
        req.tenantId,
        permission
      );
      next();
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  };
};

// Use in routes
app.get('/api/vehicles', requirePermission('vehicles.read'), (req, res) => {
  // ...
});
```

### Audit Logging Middleware

```typescript
// Log all API requests
app.use(async (req, res, next) => {
  res.on('finish', async () => {
    if (req.user && req.tenantId) {
      const result = res.statusCode < 400 ? 'success' : 'failure';

      await security.logEvent(req.tenantId, req.path, result, {
        userId: req.user.id,
        details: {
          method: req.method,
          statusCode: res.statusCode,
        },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
  });

  next();
});
```

## Maintenance Tasks

### Daily Tasks

```typescript
// Clean up expired permissions
const deactivated = await securityService.cleanupExpiredPermissions();
console.log(`Deactivated ${deactivated} expired permissions`);
```

### Hourly Tasks

```typescript
// Clean up expired sessions
const deleted = await securityService.cleanupExpiredSessions();
console.log(`Deleted ${deleted} expired sessions`);
```

### Monthly Tasks

```typescript
// Key rotation (when needed)
// 1. Generate new key in Azure Key Vault
// 2. Update key metadata:

const newKey = await securityRepository.rotateKey(
  'prod-2024-12',
  {
    key_version: 'prod-2025-01',
    algorithm: 'AES-256-GCM',
    purpose: 'data_encryption',
    key_vault_url: 'https://my-vault.vault.azure.net/',
    key_id: 'keys/data-encryption-key/new-id',
  }
);

console.log('Key rotated successfully:', newKey.key_version);
```

## Security Checklist

Before deploying:

- [ ] All tokens are hashed before storage
- [ ] No plaintext secrets in database
- [ ] All database queries are parameterized
- [ ] Audit logging is enabled for sensitive operations
- [ ] Session expiration is configured appropriately
- [ ] Permission checking is enforced on all sensitive endpoints
- [ ] Key rotation procedure is documented
- [ ] Cleanup tasks are scheduled
- [ ] Error messages don't leak sensitive information
- [ ] HTTPS is enforced in production

## Common Issues

### BigInt in Database

The `sequence_number` in audit_logs uses PostgreSQL's BIGINT type. In Node.js:

```typescript
// Correct: Convert to BigInt for math
const nextNumber = BigInt(lastNumber) + BigInt(1);

// Incorrect: Direct math with BigInt literal (ES2020+ required)
// const nextNumber = (lastNumber || 0n) + 1n; // May fail
```

### Token Hashing

Always hash tokens before storage:

```typescript
// CORRECT
const tokenHash = await bcrypt.hash(token, 12);
await db('sessions').insert({ token_hash: tokenHash });

// WRONG - Never store plaintext
await db('sessions').insert({ token_hash: token });
```

### Permission Scope

When checking permissions with scope:

```typescript
// If user has 'vehicles.read' with scope 'department:sales'
// They can only read vehicles in the sales department

// Include scope in permission check:
const canRead = await security.checkPermission(
  userId,
  tenantId,
  'vehicles.read',
  { scope: 'department:sales' } // Not implemented, but shows concept
);

// Or filter results by scope in business logic
const vehicles = allVehicles.filter(v => v.department === 'sales');
```

## Support

For issues or questions:
1. Check `SECURITY_TABLES.md` for complete documentation
2. Review type definitions in `src/types/security.ts`
3. Check implementation examples in `src/services/SecurityService.ts`
4. Refer to test files for usage patterns
