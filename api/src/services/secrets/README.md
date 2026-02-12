# Secrets Management Service

Production-grade secrets management service with Azure Key Vault integration for the Fleet Management System.

## Features

- **Azure Key Vault Integration**: Primary storage with automatic fallback to encrypted PostgreSQL
- **Secret Versioning**: Complete version history tracking with rollback capability
- **Automated Rotation**: Zero-downtime secret rotation with customizable policies
- **Access Control**: Fine-grained permissions with comprehensive audit logging
- **High Performance**: Redis caching with 1-minute TTL for frequently accessed secrets
- **Resilience**: Circuit breaker pattern with exponential backoff retry (3 retries, max 30s)
- **Security**:
  - Secrets never exposed in logs (masked with *****)
  - AES-256-GCM encryption for fallback storage
  - TLS 1.3 for all Azure Key Vault API calls
  - Comprehensive audit trail with IP address and user agent tracking
- **Monitoring**: Prometheus metrics and Application Insights telemetry
- **Production-Ready**: Full TypeScript with strict mode, comprehensive error handling

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  (Controllers, Services, Background Jobs)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          SecretsManagementService                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Circuit Breaker (5 failures → OPEN)                   │ │
│  │  Retry Logic (3 retries, exponential backoff)          │ │
│  └────────────────────────────────────────────────────────┘ │
└───────┬──────────────┬──────────────┬──────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Azure Key    │ │ Redis Cache  │ │ PostgreSQL   │
│ Vault        │ │ (1 min TTL)  │ │ (Fallback)   │
│ (Primary)    │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Quick Start

### 1. Environment Variables

```bash
# Azure Key Vault (Primary Storage)
AZURE_KEYVAULT_NAME=fleet-keyvault-prod
AZURE_TENANT_ID=xxx
AZURE_CLIENT_ID=xxx
AZURE_CLIENT_SECRET=xxx

# Redis Cache (Optional but recommended)
REDIS_URL=redis://localhost:6379

# Fallback Storage Encryption
FALLBACK_ENCRYPTION_KEY=base64_encoded_32_byte_key

# PostgreSQL (Required)
DATABASE_URL=postgresql://user:pass@localhost:5432/fleet_db

# Optional Configuration
SECRET_CACHE_TTL=60                      # Cache TTL in seconds (default: 60)
SECRET_ROTATION_CHECK_INTERVAL=3600      # Rotation check interval in seconds
```

### 2. Generate Encryption Key

```bash
# Generate a secure 32-byte encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Initialize Service

```typescript
import { createSecretsService } from './services/secrets/SecretsManagementService';
import { pool } from './db/connection';

// Create service instance
const secretsService = createSecretsService(pool);

// Initialize (connects to Azure Key Vault, Redis, creates DB tables)
await secretsService.initialize();

// Use throughout application
const apiKey = await secretsService.getSecret('stripe-api-key');
```

## Usage Examples

### Basic Operations

```typescript
// Get a secret
const apiKey = await secretsService.getSecret('stripe-api-key');
console.log('API Key retrieved successfully');

// Set a secret
await secretsService.setSecret('new-api-key', 'sk_live_xxx...');

// Set with metadata
await secretsService.setSecret('database-password', 'secure_password_123', {
  description: 'Production database password',
  expiresAt: new Date('2026-12-31'),
  tags: { environment: 'production', service: 'api' },
  notifyOnExpiry: ['admin@example.com', 'ops@example.com'],
});

// Delete (soft delete - can be recovered)
await secretsService.deleteSecret('old-api-key');

// Recover deleted secret
await secretsService.recoverSecret('old-api-key');

// Permanent deletion (CANNOT be recovered!)
await secretsService.purgeSecret('definitely-delete-this');
```

### Secret Rotation

```typescript
// Manual rotation with custom logic
await secretsService.rotateSecret('database-password', async () => {
  // Generate new password
  const newPassword = generateSecurePassword(32);

  // Update database with new password
  await updateDatabasePassword(newPassword);

  // Verify it works
  await testDatabaseConnection(newPassword);

  return newPassword;
}, {
  userId: 'admin-123',
  ipAddress: '10.0.0.5',
});

// Rotation with zero-downtime for API keys
await secretsService.rotateSecret('stripe-api-key', async () => {
  // Create new API key
  const newKey = await stripeClient.createApiKey();

  // Test new key before revoking old one
  await verifyApiKey(newKey);

  // Only revoke old key after new one is confirmed working
  const oldKey = await secretsService.getSecret('stripe-api-key');
  await stripeClient.revokeApiKey(oldKey);

  return newKey;
});

// Schedule automatic rotation
await secretsService.scheduleRotation('api-key', 90); // Every 90 days

// Set rotation policy with secret creation
await secretsService.setSecret('jwt-secret', 'secret_value_xxx', {
  description: 'JWT signing secret',
  rotationPolicy: {
    enabled: true,
    intervalDays: 90,
    notifyDaysBefore: 14,
    autoRotate: false, // Manual approval required
  },
});

// Execute scheduled rotations (run as cron job)
const results = await secretsService.executeScheduledRotations();
for (const result of results) {
  if (result.success) {
    console.log(`✓ Rotated ${result.secretName}`);
  } else {
    console.error(`✗ Failed to rotate ${result.secretName}: ${result.errorMessage}`);
  }
}
```

### Access Control

```typescript
// Grant read-only access
await secretsService.grantAccess(
  'database-password',
  'user-456',
  ['get'],
  { grantedBy: 'admin-123' }
);

// Grant full access with expiration
await secretsService.grantAccess(
  'temporary-key',
  'contractor-789',
  ['get', 'set'],
  {
    grantedBy: 'admin-123',
    expiresAt: new Date('2026-03-31'), // Access expires after 3 months
  }
);

// Check access before operation
const canRotate = await secretsService.checkAccess('api-key', 'user-456', 'rotate');
if (!canRotate) {
  throw new Error('Permission denied: Cannot rotate this secret');
}

// Revoke access
await secretsService.revokeAccess('database-password', 'user-456');
```

### Versioning

```typescript
// Get specific version
const oldApiKey = await secretsService.getSecretVersion(
  'stripe-api-key',
  '2024-01-15-v1'
);

// List all versions
const versions = await secretsService.listSecretVersions('database-password');
for (const version of versions) {
  console.log(`Version ${version.version}:`);
  console.log(`  Created: ${version.createdAt}`);
  console.log(`  Expires: ${version.expiresAt || 'Never'}`);
  console.log(`  Enabled: ${version.enabled}`);
}
```

### Monitoring and Health

```typescript
// Check expiring secrets
const expiring = await secretsService.checkExpiringSecrets(30); // Next 30 days
for (const secret of expiring) {
  console.log(`⚠️  ${secret.secretName} expires in ${secret.daysUntilExpiry} days`);

  // Send notification
  await sendExpiryNotification(secret);
}

// Health report
const health = await secretsService.getSecretHealth();
console.log('Secrets Health Report:');
console.log(`  Total Secrets: ${health.totalSecrets}`);
console.log(`  Expiring Soon (30 days): ${health.expiringSoon}`);
console.log(`  Expired: ${health.expired}`);
console.log(`  Without Rotation Policy: ${health.withoutRotationPolicy}`);
console.log(`  Last Check: ${health.lastRotationCheck}`);

if (health.recommendations.length > 0) {
  console.log('  Recommendations:');
  health.recommendations.forEach(rec => console.log(`    - ${rec}`));
}

// Access history audit
const logs = await secretsService.getAccessHistory('api-key', 50);
for (const log of logs) {
  console.log(`${log.timestamp} - ${log.userId} ${log.operation} ${log.success ? '✓' : '✗'}`);
  if (log.errorMessage) {
    console.log(`  Error: ${log.errorMessage}`);
  }
}
```

### Cache Management

```typescript
// Warm cache on application startup (improves performance)
await secretsService.warmCache([
  'database-password',
  'stripe-api-key',
  'jwt-secret',
  'encryption-key',
]);

// Invalidate cache after manual update
await secretsService.invalidateCache('api-key');
```

### Error Handling

```typescript
try {
  const secret = await secretsService.getSecret('nonexistent-key');
} catch (error) {
  if (error.message.includes('Secret not found')) {
    // Handle missing secret
    console.error('Secret does not exist');
  } else if (error.message.includes('Circuit breaker is OPEN')) {
    // Azure Key Vault is unavailable
    console.error('Secrets service temporarily unavailable');
  } else {
    // Other errors
    console.error('Failed to retrieve secret:', error.message);
  }
}
```

### Break-Glass Emergency Access

```typescript
// Emergency access workflow (requires approval)
async function emergencyAccess(secretName: string, adminUserId: string) {
  // Log emergency access attempt
  logger.warn('Emergency access requested', {
    secretName,
    userId: adminUserId,
    timestamp: new Date(),
  });

  // Require MFA or dual approval
  await requireMFAApproval(adminUserId);

  // Grant temporary access
  await secretsService.grantAccess(
    secretName,
    adminUserId,
    ['get'],
    {
      grantedBy: 'emergency-system',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    }
  );

  // Retrieve secret
  const secret = await secretsService.getSecret(secretName, {
    userId: adminUserId,
    ipAddress: requestIp,
    userAgent: requestUserAgent,
  });

  // Auto-revoke after use
  setTimeout(async () => {
    await secretsService.revokeAccess(secretName, adminUserId);
  }, 3600000);

  return secret;
}
```

### Batch Operations

```typescript
// Get multiple secrets efficiently
const secrets = await Promise.all([
  secretsService.getSecret('database-password'),
  secretsService.getSecret('stripe-api-key'),
  secretsService.getSecret('jwt-secret'),
]);

// Rotate multiple secrets
const rotationTasks = [
  'database-password',
  'api-key-1',
  'api-key-2',
].map(secretName =>
  secretsService.rotateSecret(secretName, async () => generateNewSecret())
);

const results = await Promise.allSettled(rotationTasks);
results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`✓ Rotated secret ${index + 1}`);
  } else {
    console.error(`✗ Failed to rotate secret ${index + 1}:`, result.reason);
  }
});
```

## Metrics

The service automatically tracks these Prometheus metrics:

- `secrets.keyvault_connected` - Azure Key Vault connection status
- `secrets.redis_connected` - Redis cache connection status
- `secrets.get_success` - Successful secret retrievals (by source)
- `secrets.get_failure` - Failed secret retrievals
- `secrets.get_duration_ms` - Secret retrieval latency
- `secrets.set_success` - Successful secret updates
- `secrets.set_failure` - Failed secret updates
- `secrets.cache_hit` - Cache hits
- `secrets.cache_miss` - Cache misses
- `secrets.rotation_success` - Successful rotations
- `secrets.rotation_failure` - Failed rotations
- `secrets.circuit_breaker_opened` - Circuit breaker opened events
- `secrets.circuit_breaker_closed` - Circuit breaker closed events

## Security Best Practices

1. **Never hardcode secrets** - Always use the secrets service
2. **Use rotation policies** - Set automatic rotation for critical secrets
3. **Monitor expiry** - Set up alerts for expiring secrets (30 days before)
4. **Audit regularly** - Review access logs monthly
5. **Principle of least privilege** - Grant minimum required permissions
6. **Use versioning** - Keep version history for rollback capability
7. **Enable MFA** - Require MFA for sensitive operations
8. **Encrypt in transit** - Always use TLS (enabled by default)
9. **Encrypt at rest** - Azure Key Vault provides this automatically
10. **Backup regularly** - Azure Key Vault has automatic backups

## Database Schema

The service automatically creates these tables:

### secrets_vault
Fallback encrypted storage when Azure Key Vault is unavailable.

```sql
CREATE TABLE secrets_vault (
  id SERIAL PRIMARY KEY,
  secret_name VARCHAR(255) NOT NULL UNIQUE,
  encrypted_value TEXT NOT NULL,
  iv VARCHAR(255) NOT NULL,
  auth_tag VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);
```

### secret_access_logs
Comprehensive audit trail of all secret access.

```sql
CREATE TABLE secret_access_logs (
  id SERIAL PRIMARY KEY,
  secret_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### secret_rotation_schedule
Tracks rotation policies and schedules.

```sql
CREATE TABLE secret_rotation_schedule (
  id SERIAL PRIMARY KEY,
  secret_name VARCHAR(255) NOT NULL UNIQUE,
  rotation_policy JSONB NOT NULL,
  last_rotated_at TIMESTAMP WITH TIME ZONE,
  next_rotation_at TIMESTAMP WITH TIME ZONE NOT NULL,
  rotation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### secret_access_control
Fine-grained access control per secret.

```sql
CREATE TABLE secret_access_control (
  id SERIAL PRIMARY KEY,
  secret_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  permissions TEXT[] NOT NULL,
  granted_by VARCHAR(255) NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (secret_name, user_id)
);
```

## Troubleshooting

### Circuit Breaker is OPEN

**Symptom**: Errors with "Circuit breaker is OPEN"

**Cause**: Azure Key Vault had 5+ consecutive failures

**Solution**:
1. Check Azure Key Vault service health
2. Verify network connectivity
3. Check Azure AD credentials
4. Wait 1 minute for circuit breaker to enter half-open state
5. Service will automatically recover when Key Vault is healthy

### Slow Secret Retrieval

**Symptom**: High latency when getting secrets

**Solution**:
1. Enable Redis caching (set `REDIS_URL`)
2. Warm cache on startup with frequently used secrets
3. Check Azure Key Vault latency metrics
4. Consider increasing cache TTL for non-sensitive secrets

### Secrets Not Rotating

**Symptom**: Scheduled rotations not executing

**Solution**:
1. Check rotation schedule: `SELECT * FROM secret_rotation_schedule WHERE next_rotation_at < NOW()`
2. Ensure cron job is running `executeScheduledRotations()`
3. Check rotation policy: `autoRotate` must be `true`
4. Verify custom rotation handlers are registered
5. Review error logs for failed rotations

## Migration from Hardcoded Secrets

```typescript
// 1. Migrate existing secrets to Key Vault
const secretsToMigrate = {
  'database-password': process.env.DB_PASSWORD,
  'stripe-api-key': process.env.STRIPE_API_KEY,
  'jwt-secret': process.env.JWT_SECRET,
};

for (const [name, value] of Object.entries(secretsToMigrate)) {
  await secretsService.setSecret(name, value, {
    description: `Migrated from environment variable`,
    rotationPolicy: {
      enabled: true,
      intervalDays: 90,
      notifyDaysBefore: 14,
      autoRotate: false,
    },
  });
  console.log(`✓ Migrated ${name}`);
}

// 2. Update application code
// Before:
const dbPassword = process.env.DB_PASSWORD;

// After:
const dbPassword = await secretsService.getSecret('database-password');

// 3. Remove from .env file
// 4. Test thoroughly
// 5. Set up rotation schedule
```

## Performance Considerations

- **Cache TTL**: Default 60 seconds, adjust based on secret sensitivity
- **Connection pooling**: Database pool configured in `db/connection.ts`
- **Retry strategy**: 3 retries with exponential backoff (max 30s total)
- **Circuit breaker**: Opens after 5 failures, resets after 1 minute
- **Batch operations**: Use `Promise.all()` for parallel secret retrieval

## Compliance

This service helps meet compliance requirements for:

- **SOC 2**: Audit logs, access control, encryption at rest/transit
- **ISO 27001**: Secret lifecycle management, version control
- **HIPAA**: Encryption, audit trails, access control
- **PCI DSS**: Secret rotation, access logging, encryption
- **GDPR**: Data protection, access controls, audit logs

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Application Insights logs
3. Check Prometheus metrics for anomalies
4. Review audit logs in `secret_access_logs` table
5. Contact the DevOps team

## License

Proprietary - Capital Tech Alliance / Fleet Management System
