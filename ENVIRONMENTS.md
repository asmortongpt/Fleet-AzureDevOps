# Fleet Application Environment Configuration

**Last Updated:** November 12, 2025

This document provides comprehensive guidance for configuring and deploying the Fleet application across three environments: Development, Staging, and Production.

---

## 🔐 Azure Key Vaults

All sensitive configuration is stored in Azure Key Vaults. Each environment has its own dedicated vault:

| Environment | Key Vault Name | Secret Count | Azure Portal |
|------------|----------------|--------------|--------------|
| **Development** | `fleet-secrets-dev-437bc9` | 36 | [View in Portal](https://portal.azure.com/#@capitaltechalliance.com/resource/subscriptions/002d93e1-5cc6-46c3-bce5-9dc49b223274/resourceGroups/fleet-dev-rg/providers/Microsoft.KeyVault/vaults/fleet-secrets-dev-437bc9) |
| **Staging** | `fleet-staging-5e7dd5b7` | 36 | [View in Portal](https://portal.azure.com/#@capitaltechalliance.com/resource/subscriptions/002d93e1-5cc6-46c3-bce5-9dc49b223274/resourceGroups/fleet-staging-rg/providers/Microsoft.KeyVault/vaults/fleet-staging-5e7dd5b7) |
| **Production** | `fleet-secrets-0d326d71` | 36 | [View in Portal](https://portal.azure.com/#@capitaltechalliance.com/resource/subscriptions/002d93e1-5cc6-46c3-bce5-9dc49b223274/resourceGroups/fleet-production-rg/providers/Microsoft.KeyVault/vaults/fleet-secrets-0d326d71) |

---

## 📋 Complete Secret Inventory

All three vaults contain the following 36 secrets:

### Authentication & Security (6 secrets)
- `jwt-secret` - JWT access token signing key
- `jwt-refresh-secret` - JWT refresh token signing key
- `session-secret` - Session management secret
- `api-key-salt` - API key hashing salt
- `encryption-key` - General purpose encryption key

### Azure Services (9 secrets)
- `azure-client-id` - Azure AD application client ID
- `azure-client-secret` - Azure AD application secret
- `azure-tenant-id` - Azure AD tenant ID
- `azure-maps-key` - Azure Maps subscription key
- `azure-openai-endpoint` - Azure OpenAI service endpoint
- `azure-openai-key` - Azure OpenAI API key
- `azure-storage-connection-string` - Azure Storage connection
- `azure-key-vault-uri` - Key Vault URI
- `app-insights-connection-string` - Application Insights telemetry

### Microsoft Graph (3 secrets)
- `ms-graph-client-id` - Microsoft Graph client ID
- `ms-graph-client-secret` - Microsoft Graph secret
- `ms-graph-tenant-id` - Microsoft Graph tenant

### Database (5 secrets)
- `db-host` - PostgreSQL server hostname
- `db-name` - PostgreSQL database name
- `db-port` - PostgreSQL server port (5432)
- `db-username` - PostgreSQL admin username
- `db-password` - PostgreSQL admin password

### Redis Cache (2 secrets)
- `redis-host` - Redis server hostname
- `redis-password` - Redis authentication password

### Email & SMS (6 secrets)
- `sendgrid-api-key` - SendGrid email service API key
- `smtp-user` - SMTP authentication username
- `smtp-password` - SMTP authentication password
- `twilio-account-sid` - Twilio SMS account SID
- `twilio-auth-token` - Twilio authentication token
- `twilio-phone-number` - Twilio sender phone number

### Mobile Push Notifications (4 secrets)
- `firebase-service-account` - Firebase service account JSON (Android)
- `apns-key-path` - Apple Push Notification key path
- `apns-key-id` - APNS key identifier
- `apns-team-id` - APNS team identifier

### AI Services (1 secret)
- `openai-api-key` - OpenAI API key (fallback)

### Monitoring (1 secret)
- `sentry-dsn` - Sentry error tracking DSN

---

## 🏗️ Environment-Specific Configurations

### Development Environment

**Purpose:** Local development and testing
**Resource Group:** `fleet-dev-rg`
**Key Vault:** `fleet-secrets-dev-437bc9`

**Configuration Values:**
```bash
# Database (uses localhost for local development)
db-name: fleet_dev
db-host: localhost
db-username: postgres
db-password: DevPassword123!

# Redis (uses localhost)
redis-host: localhost
redis-password: DevRedisPassword123!

# Azure OpenAI
azure-openai-endpoint: https://fleet-openai-dev.openai.azure.com

# All secrets use test/development values
# Sensitive keys use generated values, not production keys
```

**Access:** Development team has read/write access for testing

---

### Staging Environment

**Purpose:** Pre-production testing and validation
**Resource Group:** `fleet-staging-rg`
**Key Vault:** `fleet-staging-5e7dd5b7`

**Configuration Values:**
```bash
# Database (Azure managed PostgreSQL)
db-name: fleet_staging
db-host: fleet-staging-db.postgres.database.azure.com
db-username: fleetadmin
db-password: [Secure generated value]

# Redis (Azure managed Redis)
redis-host: fleet-redis-staging.redis.cache.windows.net
redis-password: [Secure generated value]

# Azure OpenAI
azure-openai-endpoint: https://fleet-openai.openai.azure.com

# All secrets match production-level security
# Uses real Azure services but separate instances
```

**Access:** Development team + QA team have read access

---

### Production Environment

**Purpose:** Live production application
**Resource Group:** `fleet-production-rg`
**Key Vault:** `fleet-secrets-0d326d71`

**Configuration Values:**
```bash
# Database (Azure managed PostgreSQL with high availability)
db-name: fleet_production
db-host: fleet-production-db.postgres.database.azure.com
db-username: fleetadmin
db-password: [Secure generated 32-byte value]

# Redis (Azure managed Redis with clustering)
redis-host: fleet-redis-prod.redis.cache.windows.net
redis-password: [Secure generated 32-byte value]

# Azure OpenAI
azure-openai-endpoint: https://fleet-openai-prod.openai.azure.com

# All secrets use cryptographically secure generated values
# JWT secrets: 64-byte hex values
# Encryption keys: 32-byte hex values
# Database passwords: 32-byte base64 values
```

**Access:** Production access restricted to authorized personnel only

---

## 🔑 Accessing Secrets from Application

### Using Azure Key Vault SDK (Recommended)

```javascript
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

// Initialize Key Vault client
const vaultUrl = process.env.AZURE_KEY_VAULT_URI;
const credential = new DefaultAzureCredential();
const client = new SecretClient(vaultUrl, credential);

// Retrieve a secret
const secret = await client.getSecret("db-password");
const dbPassword = secret.value;
```

### Using Environment Variables

For local development, create `.env.development`:

```bash
# Key Vault Configuration
AZURE_KEY_VAULT_URI=https://fleet-secrets-dev-437bc9.vault.azure.net/

# Azure Authentication
AZURE_CLIENT_ID=<your-client-id>
AZURE_CLIENT_SECRET=<your-client-secret>
AZURE_TENANT_ID=<your-tenant-id>

# The application will automatically fetch secrets from Key Vault
```

---

## 🚀 Deployment Process

### Development Deployment

```bash
# 1. Set environment
export ENVIRONMENT=development

# 2. Run database migrations
./run-migrations-dev.sh

# 3. Start application
npm run dev
```

### Staging Deployment

```bash
# 1. Trigger Azure DevOps pipeline
az pipelines run --name "Fleet-Staging-Deploy" \
  --branch main

# 2. Verify deployment
curl https://fleet-staging.capitaltechalliance.com/api/status

# 3. Run integration tests
npm run test:staging
```

### Production Deployment

```bash
# 1. Create release branch
git checkout -b release/v1.x.x

# 2. Trigger production pipeline (requires approval)
az pipelines run --name "Fleet-Production-Deploy" \
  --branch release/v1.x.x

# 3. Monitor deployment
kubectl get pods -n fleet-production

# 4. Verify health
curl https://fleet.capitaltechalliance.com/api/status
```

---

## 👥 Access Management

### Current Access Permissions

**Himanshu Badola** (`Himanshu.badola.proff@gmail.com`)
- ✅ Reader access to all three Key Vaults
- ✅ Contributor access to fleet-dev-rg
- ✅ Reader access to fleet-staging-rg
- ✅ Reader access to fleet-production-rg

### Granting Additional Access

```bash
# Grant read access to Key Vault
az keyvault set-policy \
  --name fleet-staging-5e7dd5b7 \
  --upn user@example.com \
  --secret-permissions get list

# Grant resource group access
az role assignment create \
  --assignee user@example.com \
  --role "Reader" \
  --resource-group fleet-staging-rg
```

---

## 🔧 Secret Rotation

### Automated Rotation (Recommended)

Key Vault supports automatic rotation for:
- Database passwords
- Storage connection strings
- API keys

Configure rotation policies in Azure Portal:
1. Navigate to Key Vault → Secrets → [Secret Name] → Rotation Policy
2. Set rotation frequency (90 days recommended)
3. Configure notification webhooks

### Manual Rotation

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# Update in Key Vault
az keyvault secret set \
  --vault-name fleet-staging-5e7dd5b7 \
  --name jwt-secret \
  --value "$NEW_SECRET"

# Restart application to pick up new value
kubectl rollout restart deployment fleet-api -n fleet-staging
```

---

## 📊 Monitoring & Alerts

### Key Vault Monitoring

- **Audit Logs:** All secret access is logged in Azure Monitor
- **Access Alerts:** Configured for unauthorized access attempts
- **Expiration Alerts:** Notifications 30 days before secret expiration

### Application Insights Integration

```bash
# View secret access logs
az monitor activity-log list \
  --resource-group fleet-staging-rg \
  --resource-type "Microsoft.KeyVault/vaults" \
  --start-time 2025-11-12T00:00:00Z
```

---

## 🛡️ Security Best Practices

1. **Never commit secrets to git** - Use Key Vault or environment variables
2. **Use managed identities** - Avoid storing credentials in application code
3. **Rotate secrets regularly** - Implement 90-day rotation policy
4. **Principle of least privilege** - Grant minimum required permissions
5. **Monitor access** - Review Key Vault audit logs regularly
6. **Separate environments** - Never share secrets between dev/staging/prod

---

## 📞 Support

**Azure Key Vault Issues:**
- Azure Support Portal: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
- Documentation: https://docs.microsoft.com/azure/key-vault

**Application Configuration Issues:**
- Contact: andrew.m@capitaltechalliance.com
- Slack: #fleet-infrastructure

---

## 📝 Change Log

| Date | Changes | Author |
|------|---------|--------|
| 2025-11-12 | Initial environment setup with 36 secrets across 3 environments | System |
| 2025-11-12 | Added 25 missing Fleet-specific secrets to staging vault | System |
| 2025-11-12 | Replicated secrets to dev and production vaults | System |
| 2025-11-12 | Removed 5 radio-dispatch specific secrets | System |

---

**End of Document**
