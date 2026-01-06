# Secrets Management Service - Quick Start Guide

Get started with the Secrets Management Service in 5 minutes.

## Prerequisites

- Node.js 16+ with npm
- PostgreSQL database
- Azure account (for Key Vault) - optional but recommended
- Redis (optional for caching)

## Step 1: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install --legacy-peer-deps
```

## Step 2: Configure Environment Variables

Create or update your `.env` file:

```bash
# Required - PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/fleet_dev

# Required - Encryption key for fallback storage
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
FALLBACK_ENCRYPTION_KEY=YOUR_BASE64_ENCODED_32_BYTE_KEY

# Optional - Azure Key Vault (recommended for production)
AZURE_KEYVAULT_NAME=your-keyvault-name
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Optional - Redis cache (recommended for performance)
REDIS_URL=redis://localhost:6379

# Optional - Configuration
SECRET_CACHE_TTL=60
SECRET_ROTATION_CHECK_INTERVAL=3600
```

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and set it as `FALLBACK_ENCRYPTION_KEY`.

## Step 3: Initialize Service

In your application startup file (e.g., `api/src/index.ts`):

```typescript
import { createSecretsService } from './services/secrets';
import { pool } from './db/connection';

// Create and initialize the service
const secretsService = createSecretsService(pool);
await secretsService.initialize();

// Export for use in other modules
export { secretsService };
```

## Step 4: Use the Service

### Basic Usage

```typescript
import { secretsService } from './index';

// Store a secret
await secretsService.setSecret('my-api-key', 'sk_test_abc123');

// Retrieve a secret
const apiKey = await secretsService.getSecret('my-api-key');
console.log('API Key:', apiKey);
```

### With Metadata

```typescript
await secretsService.setSecret('stripe-api-key', 'sk_live_xxx', {
  description: 'Stripe API key for production',
  expiresAt: new Date('2026-12-31'),
  tags: { environment: 'production', service: 'payments' },
  rotationPolicy: {
    enabled: true,
    intervalDays: 90,
    notifyDaysBefore: 14,
    autoRotate: false,
  },
});
```

## Step 5: Test It

Run the example usage file:

```bash
npx tsx api/src/services/secrets/example-usage.ts
```

This runs 11 comprehensive examples demonstrating all features.

## Common Use Cases

### 1. Store Database Password

```typescript
await secretsService.setSecret('database-password', process.env.DB_PASSWORD, {
  description: 'PostgreSQL database password',
  rotationPolicy: {
    enabled: true,
    intervalDays: 90,
    notifyDaysBefore: 14,
    autoRotate: false,
  },
});

// Use it
const dbPassword = await secretsService.getSecret('database-password');
```

### 2. Rotate API Key

```typescript
await secretsService.rotateSecret('stripe-api-key', async () => {
  // Your rotation logic here
  const newKey = await generateNewStripeKey();
  return newKey;
});
```

### 3. Grant Temporary Access

```typescript
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 30); // 30 days

await secretsService.grantAccess(
  'production-secret',
  'contractor-user-id',
  ['get'],
  {
    grantedBy: 'admin-user-id',
    expiresAt: expiryDate,
  }
);
```

### 4. Monitor Expiring Secrets

```typescript
// Check for secrets expiring in next 30 days
const expiring = await secretsService.checkExpiringSecrets(30);

for (const secret of expiring) {
  console.log(`⚠️  ${secret.secretName} expires in ${secret.daysUntilExpiry} days`);
  // Send notification email
}
```

### 5. Health Check

```typescript
const health = await secretsService.getSecretHealth();
console.log('Secrets Health:', health);

if (health.recommendations.length > 0) {
  console.log('Recommendations:', health.recommendations);
}
```

## Production Checklist

Before deploying to production:

- [ ] Azure Key Vault configured and accessible
- [ ] `FALLBACK_ENCRYPTION_KEY` set to secure random value
- [ ] Redis configured for caching
- [ ] Database tables created (automatic on first run)
- [ ] Environment variables set correctly
- [ ] Rotation policies defined for all secrets
- [ ] Access controls configured
- [ ] Monitoring alerts set up for expiring secrets
- [ ] Team trained on secrets service usage
- [ ] Emergency access procedures documented

## Troubleshooting

### Error: "Circuit breaker is OPEN"

Azure Key Vault is unavailable. The service will automatically use fallback storage.

**Solution**: Check Azure Key Vault connectivity, wait 1 minute for circuit breaker to reset.

### Error: "Secret not found"

The secret doesn't exist in Key Vault or database.

**Solution**: Create the secret with `setSecret()`.

### Slow performance

Caching is disabled or not working.

**Solution**: Configure Redis and enable caching via `REDIS_URL`.

## Next Steps

1. Read the full documentation: `api/src/services/secrets/README.md`
2. Review examples: `api/src/services/secrets/example-usage.ts`
3. Set up Azure Key Vault (recommended)
4. Configure monitoring and alerts
5. Migrate existing secrets from .env files

## Security Best Practices

1. ✅ **Never commit secrets to git**
2. ✅ **Use rotation policies for all secrets**
3. ✅ **Monitor expiration dates**
4. ✅ **Review audit logs regularly**
5. ✅ **Use least privilege access**
6. ✅ **Enable MFA for sensitive operations**
7. ✅ **Use Azure Key Vault in production**
8. ✅ **Set up automated rotation**
9. ✅ **Test disaster recovery procedures**
10. ✅ **Keep encryption keys secure**

## Support

- **Full Documentation**: `api/src/services/secrets/README.md`
- **Service Implementation**: `api/src/services/secrets/SecretsManagementService.ts`
- **Usage Examples**: `api/src/services/secrets/example-usage.ts`
- **Implementation Summary**: `SECRETS_MANAGEMENT_SERVICE_IMPLEMENTATION.md`

## Quick Reference

```typescript
// Initialize
const secretsService = createSecretsService(pool);
await secretsService.initialize();

// CRUD operations
await secretsService.setSecret(name, value, metadata);
const value = await secretsService.getSecret(name);
await secretsService.deleteSecret(name);
await secretsService.recoverSecret(name);
await secretsService.purgeSecret(name);

// Rotation
await secretsService.rotateSecret(name, generateNewValue);
await secretsService.scheduleRotation(name, intervalDays);

// Access control
await secretsService.grantAccess(name, userId, permissions);
await secretsService.revokeAccess(name, userId);
const hasAccess = await secretsService.checkAccess(name, userId, permission);

// Monitoring
const expiring = await secretsService.checkExpiringSecrets(days);
const health = await secretsService.getSecretHealth();
const logs = await secretsService.getAccessHistory(name, limit);

// Cache
await secretsService.warmCache(secretNames);
await secretsService.invalidateCache(name);

// Versioning (Azure Key Vault only)
const versions = await secretsService.listSecretVersions(name);
const oldValue = await secretsService.getSecretVersion(name, version);
```

---

**Ready to use!** 🚀

For detailed information, see the full README.md in this directory.
