# Secrets Management Guide

## Overview

This guide explains how to securely manage secrets and credentials for the Fleet Management System in all environments.

## Quick Start

### 1. Local Development

Copy the example environment file:
```bash
cp .env.example .env
```

Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

Update `.env` with your values:
```bash
# Minimum required for local development
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/fleet_db
JWT_SECRET=your-generated-secret-minimum-32-characters
```

### 2. Production Deployment

**NEVER** commit secrets to git. Use one of these methods:

#### Option A: Environment Variables (Recommended for containers)

Set environment variables in your deployment platform:

**Azure App Service:**
```bash
az webapp config appsettings set \
  --resource-group fleet-rg \
  --name fleet-api \
  --settings \
    JWT_SECRET="your-secret" \
    DATABASE_URL="postgresql://..." \
    MICROSOFT_CLIENT_SECRET="your-secret"
```

**Docker:**
```bash
docker run -e JWT_SECRET="your-secret" -e DATABASE_URL="postgresql://..." fleet-api
```

**Kubernetes:**
```bash
kubectl create secret generic fleet-secrets \
  --from-literal=JWT_SECRET="your-secret" \
  --from-literal=DATABASE_URL="postgresql://..."
```

#### Option B: Azure Key Vault (Recommended for Azure deployments)

1. **Create an Azure Key Vault:**
```bash
az keyvault create \
  --name fleet-keyvault \
  --resource-group fleet-rg \
  --location eastus2
```

2. **Add secrets to Key Vault:**
```bash
# JWT Secret
az keyvault secret set \
  --vault-name fleet-keyvault \
  --name JWT-SECRET \
  --value "$(openssl rand -base64 32)"

# Microsoft OAuth
az keyvault secret set \
  --vault-name fleet-keyvault \
  --name MICROSOFT-CLIENT-SECRET \
  --value "your-secret"

# Database Password
az keyvault secret set \
  --vault-name fleet-keyvault \
  --name DATABASE-PASSWORD \
  --value "your-db-password"
```

3. **Configure service principal authentication:**
```bash
# Set in your application's environment
AZURE_KEY_VAULT_URL=https://fleet-keyvault.vault.azure.net/
AZURE_CLIENT_ID=your-service-principal-id
AZURE_CLIENT_SECRET=your-service-principal-secret
AZURE_TENANT_ID=your-tenant-id
```

4. **Use in application (optional - for future Key Vault integration):**
```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const client = new SecretClient(env.get('AZURE_KEY_VAULT_URL'), credential);

const jwtSecret = await client.getSecret('JWT-SECRET');
```

## Required Secrets

### Critical (Required for production)

#### 1. JWT_SECRET (REQUIRED)
- **Purpose:** JWT token signing and verification
- **Required Length:** Minimum 32 characters
- **Generate:** `openssl rand -base64 32`
- **Environment Variable:** `JWT_SECRET`
- **Rotation:** Every 90 days

**Example:**
```bash
JWT_SECRET=Xk8p2Vm9R4wQnE7zYjL3aF6cH5sT1bN0
```

#### 2. DATABASE_URL or DB_* variables (REQUIRED)
- **Purpose:** Database connection credentials
- **Environment Variable:** `DATABASE_URL`
- **Never use default passwords in production**

**Example:**
```bash
DATABASE_URL=postgresql://fleet_user:secure_password@db.example.com:5432/fleet_db
```

### Optional (Recommended for full functionality)

#### 3. MICROSOFT_CLIENT_SECRET
- **Purpose:** Microsoft OAuth login
- **Obtain from:** Azure AD App Registration
- **Environment Variable:** `MICROSOFT_CLIENT_SECRET`

#### 4. REDIS_URL
- **Purpose:** Caching (performance optimization)
- **Environment Variable:** `REDIS_URL`
- **Can run without caching in development**

## Security Best Practices

### DO's ✅

1. **Use strong, randomly generated secrets**
   ```bash
   # Good: 256-bit random secret
   openssl rand -base64 32

   # Good: 512-bit random secret
   openssl rand -base64 64
   ```

2. **Rotate secrets every 90 days**
   - Set calendar reminders
   - Document rotation procedures
   - Test rotation in staging first

3. **Use different secrets for each environment**
   - Development: `JWT_SECRET_DEV`
   - Staging: `JWT_SECRET_STAGING`
   - Production: `JWT_SECRET_PROD`

4. **Restrict access to production secrets**
   - Use Azure RBAC for Key Vault
   - Limit who can view secrets
   - Audit secret access

5. **Use environment variables or Key Vault**
   - Never hardcode in source code
   - Never commit to version control
   - Use secure secret storage

### DON'Ts ❌

1. **❌ DON'T: Commit `.env` files to git**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **❌ DON'T: Share secrets via email or Slack**
   - Use secure secret sharing tools
   - Use Azure Key Vault access policies
   - Use 1Password or similar for sharing

3. **❌ DON'T: Use weak or default secrets in production**
   ```bash
   # BAD - Never use these
   JWT_SECRET=changeme
   JWT_SECRET=secret
   JWT_SECRET=password123
   ```

4. **❌ DON'T: Enable USE_MOCK_DATA in production**
   ```bash
   # Development only
   USE_MOCK_DATA=true  # ❌ NEVER in production
   ```

## Environment Configuration System

The Fleet Management System uses a centralized environment configuration system located at:
- **Backend:** `/api/src/config/environment.ts`

### Features

- ✅ **Centralized configuration** - All environment variables in one place
- ✅ **Validation at startup** - Fails fast if critical variables are missing
- ✅ **Production safety checks** - Prevents insecure configurations
- ✅ **Type-safe access** - TypeScript types for all configuration
- ✅ **Environment-specific defaults** - Development vs Production

### Usage

```typescript
import { env } from '../config/environment';

// Get configuration values
const jwtSecret = env.get('JWT_SECRET');
const dbUrl = env.get('DATABASE_URL');
const port = env.get('PORT');

// Check environment
if (env.isProduction()) {
  // Production-specific logic
}

if (env.isDevelopment()) {
  // Development-specific logic
}
```

### Validation

The system validates:
- ✅ JWT_SECRET is at least 32 characters in production
- ✅ Database configuration is present
- ✅ USE_MOCK_DATA is disabled in production
- ⚠️ Warnings for missing optional configurations

## Troubleshooting

### "JWT_SECRET environment variable is not configured"

**Cause:** JWT_SECRET is not set or is empty

**Solution:**
```bash
# Generate a new secret
openssl rand -base64 32

# Add to .env file
echo "JWT_SECRET=your-generated-secret" >> .env

# Or set in environment
export JWT_SECRET="your-generated-secret"
```

### "JWT_SECRET must be at least 32 characters long"

**Cause:** JWT_SECRET is too short

**Solution:**
```bash
# Generate a properly sized secret
openssl rand -base64 32

# Verify length (should be 44+ characters base64 encoded)
echo -n "your-secret" | wc -c
```

### "Microsoft OAuth configuration missing"

**Cause:** MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, or MICROSOFT_TENANT_ID not set

**Solution:**
1. Register an application in Azure AD
2. Set the required environment variables:
```bash
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
```

**Or disable OAuth login if not needed** (users can still use email/password)

### "Database configuration required"

**Cause:** Neither DATABASE_URL nor DB_* variables are set

**Solution:**
```bash
# Option 1: Use connection string
DATABASE_URL=postgresql://user:password@host:5432/database

# Option 2: Use individual parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleet_db
DB_USER=fleet_user
DB_PASSWORD=secure_password
```

## Secret Rotation Procedures

### JWT Secret Rotation

**Frequency:** Every 90 days

**Procedure:**
1. Generate new secret:
   ```bash
   NEW_JWT_SECRET=$(openssl rand -base64 32)
   ```

2. Test in staging:
   ```bash
   # Update staging environment
   az webapp config appsettings set \
     --name fleet-api-staging \
     --settings JWT_SECRET="$NEW_JWT_SECRET"
   ```

3. Deploy to production:
   ```bash
   # Update production environment
   az webapp config appsettings set \
     --name fleet-api-production \
     --settings JWT_SECRET="$NEW_JWT_SECRET"
   ```

4. **Note:** All users will need to re-authenticate after rotation

### Database Password Rotation

**Frequency:** Every 90 days

**Procedure:**
1. Create new database user or update password
2. Update connection string
3. Restart application
4. Verify connectivity
5. Remove old credentials

### Microsoft OAuth Secret Rotation

**Frequency:** Every 180 days (per Azure AD recommendations)

**Procedure:**
1. Generate new secret in Azure AD
2. Update environment variable
3. Test authentication
4. Remove old secret from Azure AD after verification

## Additional Resources

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Azure App Service Configuration](https://docs.microsoft.com/en-us/azure/app-service/configure-common)
- [NIST Secret Management Guidelines](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

## Support

For questions or issues with secrets management:
1. Review this documentation
2. Check the troubleshooting section
3. Review the `.env.example` file
4. Contact the DevOps team
