# Azure Key Vault Migration Guide

**Fleet API - Secure Secret Management**

This guide walks you through migrating all application secrets from `.env` files to Azure Key Vault for production-grade security.

---

## Table of Contents

1. [Why Azure Key Vault?](#why-azure-key-vault)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Code Integration](#code-integration)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Why Azure Key Vault?

### Security Benefits
- **Centralized secret management**: All secrets in one secure location
- **Audit logging**: Track every secret access
- **Access control**: RBAC for fine-grained permissions
- **Secret rotation**: Automated rotation without code changes
- **Encryption at rest**: AES 256-bit encryption
- **HSM support**: Hardware security module backing (Premium tier)

### Compliance
- SOC 2 Type II compliant
- HIPAA compliant
- PCI DSS compliant
- GDPR compliant

### Cost
- Standard tier: ~$0.03 per 10,000 operations
- Minimal cost for small-to-medium applications
- Premium tier: ~$1/month per key for HSM backing

---

## Prerequisites

### 1. Azure CLI
```bash
# Install Azure CLI
# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Verify installation
az --version
```

### 2. Azure Login
```bash
# Login to Azure
az login

# Set subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify current subscription
az account show
```

### 3. Required Permissions
You need the following permissions:
- `Key Vault Contributor` (to create Key Vault)
- `Key Vault Administrator` (to manage secrets)
- `Managed Identity Operator` (to create managed identities)

---

## Architecture Overview

### Current State (Insecure)
```
Application (.env file)
    ↓
Hardcoded secrets in file
    ↓
Secrets committed to Git (RISK!)
```

### Target State (Secure)
```
Application (uses Managed Identity)
    ↓
Azure Key Vault (centralized secrets)
    ↓
Audit logs → Azure Monitor
    ↓
Alerts on suspicious access
```

### Components
1. **Azure Key Vault**: Stores all secrets
2. **Managed Identity**: Application authenticates without passwords
3. **RBAC**: Controls who can access which secrets
4. **Azure Monitor**: Tracks secret access
5. **Application Code**: Fetches secrets on startup

---

## Step-by-Step Migration

### Phase 1: Create Azure Key Vault

#### 1.1 Create Resource Group (if needed)
```bash
# Create resource group
az group create \
  --name fleet-production \
  --location eastus

# Verify
az group show --name fleet-production
```

#### 1.2 Create Key Vault
```bash
# Create Key Vault with RBAC enabled
az keyvault create \
  --name fleet-api-secrets \
  --resource-group fleet-production \
  --location eastus \
  --enable-rbac-authorization true \
  --sku standard

# Get Key Vault URI (save this!)
az keyvault show \
  --name fleet-api-secrets \
  --query "properties.vaultUri" \
  --output tsv

# Output: https://fleet-api-secrets.vault.azure.net/
```

**Important Notes**:
- Key Vault name must be globally unique
- Use RBAC authorization (more secure than access policies)
- Standard tier is sufficient for most use cases
- Premium tier provides HSM backing for compliance requirements

#### 1.3 Enable Soft Delete and Purge Protection
```bash
# Enable soft delete (90-day retention)
az keyvault update \
  --name fleet-api-secrets \
  --resource-group fleet-production \
  --enable-soft-delete true \
  --retention-days 90

# Enable purge protection (prevents permanent deletion)
az keyvault update \
  --name fleet-api-secrets \
  --resource-group fleet-production \
  --enable-purge-protection true
```

---

### Phase 2: Create Managed Identity

#### 2.1 Create User-Assigned Managed Identity
```bash
# Create managed identity for the application
az identity create \
  --name fleet-api-identity \
  --resource-group fleet-production \
  --location eastus

# Get the principal ID (needed for RBAC)
PRINCIPAL_ID=$(az identity show \
  --name fleet-api-identity \
  --resource-group fleet-production \
  --query "principalId" \
  --output tsv)

echo "Principal ID: $PRINCIPAL_ID"

# Get the client ID (needed in application code)
CLIENT_ID=$(az identity show \
  --name fleet-api-identity \
  --resource-group fleet-production \
  --query "clientId" \
  --output tsv)

echo "Client ID: $CLIENT_ID"
```

#### 2.2 Grant Key Vault Permissions
```bash
# Get Key Vault resource ID
KEYVAULT_ID=$(az keyvault show \
  --name fleet-api-secrets \
  --resource-group fleet-production \
  --query "id" \
  --output tsv)

# Grant "Key Vault Secrets User" role to managed identity
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $PRINCIPAL_ID \
  --scope $KEYVAULT_ID

# Verify role assignment
az role assignment list \
  --assignee $PRINCIPAL_ID \
  --scope $KEYVAULT_ID
```

---

### Phase 3: Migrate Secrets to Key Vault

#### 3.1 Generate New Secrets
```bash
# Generate strong secrets
CSRF_SECRET=$(openssl rand -base64 48)
JWT_SECRET=$(openssl rand -base64 48)
SESSION_SECRET=$(openssl rand -base64 48)

echo "Generated new secrets (DO NOT commit these!)"
```

#### 3.2 Add Secrets to Key Vault
```bash
# Azure AD Client Secret
az keyvault secret set \
  --vault-name fleet-api-secrets \
  --name fleet-azure-ad-client-secret \
  --value "YOUR_NEW_AZURE_AD_SECRET"

# JWT Secret
az keyvault secret set \
  --vault-name fleet-api-secrets \
  --name fleet-jwt-secret \
  --value "$JWT_SECRET"

# CSRF Secret
az keyvault secret set \
  --vault-name fleet-api-secrets \
  --name fleet-csrf-secret \
  --value "$CSRF_SECRET"

# Session Secret
az keyvault secret set \
  --vault-name fleet-api-secrets \
  --name fleet-session-secret \
  --value "$SESSION_SECRET"

# Database Connection String
az keyvault secret set \
  --vault-name fleet-api-secrets \
  --name fleet-database-connection-string \
  --value "postgresql://USER:PASSWORD@HOST:5432/DB"

# Microsoft Graph Client Secret
az keyvault secret set \
  --vault-name fleet-api-secrets \
  --name fleet-msgraph-client-secret \
  --value "YOUR_MSGRAPH_SECRET"
```

#### 3.3 Verify Secrets
```bash
# List all secrets
az keyvault secret list \
  --vault-name fleet-api-secrets \
  --output table

# Get a specific secret (to verify)
az keyvault secret show \
  --vault-name fleet-api-secrets \
  --name fleet-jwt-secret \
  --query "value" \
  --output tsv
```

---

### Phase 4: Update Application Code

#### 4.1 Install Azure SDK Dependencies
```bash
npm install @azure/identity @azure/keyvault-secrets
```

#### 4.2 Create Key Vault Service

Create `src/services/keyvault.service.ts`:

```typescript
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

class KeyVaultService {
  private client: SecretClient;
  private secretCache: Map<string, { value: string; expiresAt: number }> = new Map();
  private cacheMaxAge = 3600000; // 1 hour in milliseconds

  constructor() {
    const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;

    if (!keyVaultUrl) {
      throw new Error('AZURE_KEY_VAULT_URL environment variable not set');
    }

    // Use DefaultAzureCredential which works with:
    // - Managed Identity (production)
    // - Azure CLI (local development)
    // - Environment variables
    const credential = new DefaultAzureCredential();

    this.client = new SecretClient(keyVaultUrl, credential);

    console.log('✅ Azure Key Vault client initialized');
    console.log(`   Vault URL: ${keyVaultUrl}`);
  }

  /**
   * Get a secret from Key Vault (with caching)
   */
  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    const cached = this.secretCache.get(secretName);
    if (cached && Date.now() < cached.expiresAt) {
      console.log(`📦 Using cached secret: ${secretName}`);
      return cached.value;
    }

    // Fetch from Key Vault
    console.log(`🔑 Fetching secret from Key Vault: ${secretName}`);
    try {
      const secret = await this.client.getSecret(secretName);

      if (!secret.value) {
        throw new Error(`Secret ${secretName} has no value`);
      }

      // Cache the secret
      this.secretCache.set(secretName, {
        value: secret.value,
        expiresAt: Date.now() + this.cacheMaxAge
      });

      return secret.value;
    } catch (error) {
      console.error(`❌ Failed to fetch secret ${secretName}:`, error);
      throw new Error(`Failed to retrieve secret: ${secretName}`);
    }
  }

  /**
   * Load all required secrets on application startup
   */
  async loadSecrets(): Promise<{
    azureAdClientSecret: string;
    jwtSecret: string;
    csrfSecret: string;
    sessionSecret: string;
    databaseUrl: string;
    msgraphClientSecret: string;
  }> {
    console.log('🔐 Loading secrets from Azure Key Vault...');

    const [
      azureAdClientSecret,
      jwtSecret,
      csrfSecret,
      sessionSecret,
      databaseUrl,
      msgraphClientSecret
    ] = await Promise.all([
      this.getSecret('fleet-azure-ad-client-secret'),
      this.getSecret('fleet-jwt-secret'),
      this.getSecret('fleet-csrf-secret'),
      this.getSecret('fleet-session-secret'),
      this.getSecret('fleet-database-connection-string'),
      this.getSecret('fleet-msgraph-client-secret')
    ]);

    console.log('✅ All secrets loaded successfully');

    return {
      azureAdClientSecret,
      jwtSecret,
      csrfSecret,
      sessionSecret,
      databaseUrl,
      msgraphClientSecret
    };
  }

  /**
   * Clear the secret cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.secretCache.clear();
    console.log('🗑️  Secret cache cleared');
  }
}

// Export singleton instance
export const keyVaultService = new KeyVaultService();
```

#### 4.3 Update Server Initialization

Update `src/server.ts` or `src/index.ts`:

```typescript
import express from 'express';
import { keyVaultService } from './services/keyvault.service';

async function startServer() {
  const app = express();

  // Load secrets from Key Vault at startup
  const secrets = await keyVaultService.loadSecrets();

  // Use secrets in configuration
  process.env.JWT_SECRET = secrets.jwtSecret;
  process.env.CSRF_SECRET = secrets.csrfSecret;
  process.env.SESSION_SECRET = secrets.sessionSecret;
  process.env.DATABASE_URL = secrets.databaseUrl;
  process.env.AZURE_AD_CLIENT_SECRET = secrets.azureAdClientSecret;
  process.env.MICROSOFT_GRAPH_CLIENT_SECRET = secrets.msgraphClientSecret;

  // ... rest of your server setup ...

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

#### 4.4 Update Environment Variables

Update `.env` (for local development):
```bash
# Azure Key Vault Configuration
AZURE_KEY_VAULT_URL=https://fleet-api-secrets.vault.azure.net

# For local development, you can still use .env for non-sensitive config
# Azure CLI authentication will be used to access Key Vault

# Non-sensitive configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5175
LOG_LEVEL=info
```

---

### Phase 5: Local Development Setup

#### 5.1 Authenticate with Azure CLI
```bash
# Login to Azure (one-time setup)
az login

# Verify you can access Key Vault
az keyvault secret show \
  --vault-name fleet-api-secrets \
  --name fleet-jwt-secret
```

#### 5.2 Grant Your User Account Access
```bash
# Get your user principal ID
USER_PRINCIPAL_ID=$(az ad signed-in-user show --query "id" --output tsv)

# Get Key Vault ID
KEYVAULT_ID=$(az keyvault show \
  --name fleet-api-secrets \
  --resource-group fleet-production \
  --query "id" \
  --output tsv)

# Grant yourself "Key Vault Secrets User" role
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $USER_PRINCIPAL_ID \
  --scope $KEYVAULT_ID
```

#### 5.3 Test Local Access
```bash
# Run your application
npm run dev

# You should see:
# ✅ Azure Key Vault client initialized
# 🔑 Fetching secret from Key Vault: fleet-jwt-secret
# 🔑 Fetching secret from Key Vault: fleet-csrf-secret
# ...
# ✅ All secrets loaded successfully
```

---

## Testing

### Unit Tests
```typescript
// src/services/__tests__/keyvault.service.test.ts
import { keyVaultService } from '../keyvault.service';

describe('KeyVaultService', () => {
  beforeEach(() => {
    keyVaultService.clearCache();
  });

  it('should fetch secrets from Key Vault', async () => {
    const secret = await keyVaultService.getSecret('fleet-jwt-secret');
    expect(secret).toBeDefined();
    expect(secret.length).toBeGreaterThan(0);
  });

  it('should cache secrets', async () => {
    const secret1 = await keyVaultService.getSecret('fleet-jwt-secret');
    const secret2 = await keyVaultService.getSecret('fleet-jwt-secret');
    expect(secret1).toBe(secret2); // Same instance from cache
  });

  it('should load all secrets', async () => {
    const secrets = await keyVaultService.loadSecrets();
    expect(secrets.jwtSecret).toBeDefined();
    expect(secrets.csrfSecret).toBeDefined();
    expect(secrets.azureAdClientSecret).toBeDefined();
  });
});
```

### Integration Test
```bash
# Test secret retrieval
curl -X GET http://localhost:3000/api/health

# Should return 200 OK if secrets loaded successfully
```

---

## Production Deployment

### Azure App Service

#### 1. Assign Managed Identity to App Service
```bash
# Enable system-assigned managed identity
az webapp identity assign \
  --name fleet-api-prod \
  --resource-group fleet-production

# Get the managed identity principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --name fleet-api-prod \
  --resource-group fleet-production \
  --query "principalId" \
  --output tsv)

# Grant Key Vault access
KEYVAULT_ID=$(az keyvault show \
  --name fleet-api-secrets \
  --resource-group fleet-production \
  --query "id" \
  --output tsv)

az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $PRINCIPAL_ID \
  --scope $KEYVAULT_ID
```

#### 2. Set Application Settings
```bash
# Set Key Vault URL in App Service configuration
az webapp config appsettings set \
  --name fleet-api-prod \
  --resource-group fleet-production \
  --settings \
    AZURE_KEY_VAULT_URL=https://fleet-api-secrets.vault.azure.net
```

#### 3. Deploy Application
```bash
# Deploy code (example using Azure CLI)
az webapp deployment source config-zip \
  --name fleet-api-prod \
  --resource-group fleet-production \
  --src ./dist.zip
```

### Azure Kubernetes Service (AKS)

#### 1. Create Service Principal or Workload Identity
```bash
# Option A: Use Azure Workload Identity (recommended)
# Follow: https://azure.github.io/azure-workload-identity/docs/

# Option B: Use Pod Identity
az aks pod-identity add \
  --resource-group fleet-production \
  --cluster-name fleet-aks-cluster \
  --namespace default \
  --name fleet-api-identity \
  --identity-resource-id /subscriptions/.../fleet-api-identity
```

#### 2. Update Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-api
spec:
  template:
    spec:
      containers:
      - name: fleet-api
        # SECURITY: Always use specific version tags, never :latest
        image: your-registry.azurecr.io/fleet-api:v1.0.0
        imagePullPolicy: IfNotPresent
        env:
        - name: AZURE_KEY_VAULT_URL
          value: "https://fleet-api-secrets.vault.azure.net"
```

---

## Monitoring & Maintenance

### Enable Diagnostic Logging
```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group fleet-production \
  --workspace-name fleet-keyvault-logs

# Get workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group fleet-production \
  --workspace-name fleet-keyvault-logs \
  --query "id" \
  --output tsv)

# Enable diagnostics
az monitor diagnostic-settings create \
  --name keyvault-diagnostics \
  --resource /subscriptions/.../fleet-api-secrets \
  --workspace $WORKSPACE_ID \
  --logs '[{"category": "AuditEvent", "enabled": true}]' \
  --metrics '[{"category": "AllMetrics", "enabled": true}]'
```

### Set Up Alerts
```bash
# Alert on failed secret access
az monitor metrics alert create \
  --name "KeyVault-AccessDenied" \
  --resource-group fleet-production \
  --scopes /subscriptions/.../fleet-api-secrets \
  --condition "count ServiceApiResult includes Unauthorized > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action email your-email@example.com
```

### Secret Rotation Strategy

#### Automated Rotation (Recommended)
```bash
# Set secret expiration (90 days)
az keyvault secret set \
  --vault-name fleet-api-secrets \
  --name fleet-jwt-secret \
  --value "$NEW_SECRET" \
  --expires "2025-03-01T00:00:00Z"

# Create Azure Automation runbook for rotation
# See: https://docs.microsoft.com/en-us/azure/key-vault/secrets/tutorial-rotation
```

#### Manual Rotation Checklist
1. Generate new secret: `openssl rand -base64 48`
2. Add new secret with version: `fleet-jwt-secret-v2`
3. Update application to use new secret
4. Deploy application
5. Verify application works
6. Delete old secret after 7-day grace period

---

## Troubleshooting

### Error: "Authentication failed"
```bash
# Verify managed identity has access
az role assignment list \
  --assignee $PRINCIPAL_ID \
  --scope $KEYVAULT_ID

# Check if RBAC is enabled on Key Vault
az keyvault show \
  --name fleet-api-secrets \
  --query "properties.enableRbacAuthorization"
```

### Error: "Secret not found"
```bash
# List all secrets
az keyvault secret list \
  --vault-name fleet-api-secrets \
  --output table

# Verify secret name matches exactly
```

### Error: "Access denied (local development)"
```bash
# Re-login to Azure
az login

# Verify your role assignment
az role assignment list \
  --assignee $(az ad signed-in-user show --query "id" --output tsv) \
  --scope $KEYVAULT_ID
```

---

## Cost Estimation

### Key Vault Costs (Standard Tier)
- Secret operations: $0.03 per 10,000 operations
- Monthly estimate for small app: < $5/month
- Certificate renewals: $3 per renewal

### Example Calculation
```
Assumptions:
- 10 secrets
- Application restarts: 10/day
- Cache duration: 1 hour
- Secrets fetched per restart: 10

Daily operations: 10 restarts × 10 secrets = 100 operations
Monthly operations: 100 × 30 = 3,000 operations
Cost: 3,000 / 10,000 × $0.03 = $0.009/month

Total monthly cost: ~$0.01 (negligible)
```

---

## Security Best Practices

1. **Use RBAC** instead of access policies
2. **Enable soft delete** and purge protection
3. **Rotate secrets** every 90 days
4. **Monitor access logs** in Azure Monitor
5. **Use managed identities** instead of service principals
6. **Separate Key Vaults** for dev/staging/production
7. **Implement least privilege** - grant minimal required permissions
8. **Tag secrets** with metadata (owner, purpose, rotation schedule)
9. **Use secret versions** for safe rotation
10. **Enable firewall** rules to restrict network access

---

## Checklist

- [ ] Azure Key Vault created
- [ ] Managed identity created and assigned
- [ ] RBAC permissions configured
- [ ] All secrets migrated to Key Vault
- [ ] Old secrets rotated
- [ ] Application code updated
- [ ] NPM packages installed (`@azure/identity`, `@azure/keyvault-secrets`)
- [ ] Local development tested
- [ ] Production deployment configured
- [ ] Monitoring and alerts set up
- [ ] Secret rotation schedule documented
- [ ] .env files removed from Git history
- [ ] Team trained on new process

---

## Additional Resources

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Managed Identities](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/)
- [Azure SDK for JavaScript](https://docs.microsoft.com/en-us/javascript/api/@azure/keyvault-secrets)
- [Secret Rotation Tutorial](https://docs.microsoft.com/en-us/azure/key-vault/secrets/tutorial-rotation)
- [Security Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)

---

**Last Updated**: 2025-11-21
**Maintained By**: Fleet API Security Team
