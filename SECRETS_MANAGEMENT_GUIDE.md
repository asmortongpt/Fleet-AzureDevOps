# Secrets Management Guide

## Overview

This guide provides comprehensive documentation on how to securely manage secrets, credentials, and sensitive configuration in the Fleet Management System.

## ⚠️ Critical Security Rules

1. **NEVER** commit secrets to version control
2. **NEVER** hardcode credentials in source code
3. **NEVER** share secrets via unencrypted channels (email, Slack, etc.)
4. **ALWAYS** use environment variables for configuration
5. **ALWAYS** use Azure Key Vault for production secrets
6. **ALWAYS** rotate credentials regularly

## What Are Secrets?

Secrets include any sensitive information such as:

- Database passwords
- API keys and tokens
- JWT signing keys
- OAuth client secrets
- Service account credentials
- Encryption keys
- SSL/TLS certificates
- Third-party service credentials (SendGrid, Twilio, etc.)
- Kubernetes tokens and kubeconfigs

## Environment-Specific Configuration

### Development Environment

**Location:** `.env` (local file, never committed)

```bash
# Copy the example file
cp .env.example .env

# Edit with your local development values
nano .env
```

**Key Points:**
- Use `.env.example` as a template
- Never commit your `.env` file
- Use weak passwords only for local dev (not production passwords)
- Can use localhost URLs

### Staging/Production Environments

**Location:** Azure Key Vault (preferred) or Kubernetes Secrets

**Setup Process:**

1. **Create Key Vault (if not exists)**
   ```bash
   az keyvault create \
     --name fleet-keyvault-prod \
     --resource-group fleet-rg \
     --location eastus2 \
     --enable-rbac-authorization
   ```

2. **Store Secrets in Key Vault**
   ```bash
   # Database password
   az keyvault secret set \
     --vault-name fleet-keyvault-prod \
     --name "db-password" \
     --value "$(openssl rand -base64 32)"

   # JWT secret
   az keyvault secret set \
     --vault-name fleet-keyvault-prod \
     --name "jwt-secret" \
     --value "$(openssl rand -base64 48)"

   # API keys
   az keyvault secret set \
     --vault-name fleet-keyvault-prod \
     --name "sendgrid-api-key" \
     --value "your-sendgrid-key"
   ```

3. **Grant Access to Application**
   ```bash
   # Using managed identity (recommended)
   az role assignment create \
     --role "Key Vault Secrets User" \
     --assignee-object-id "<app-managed-identity-id>" \
     --scope "/subscriptions/<sub-id>/resourceGroups/fleet-rg/providers/Microsoft.KeyVault/vaults/fleet-keyvault-prod"
   ```

## Docker Compose Secrets

**File:** `docker-compose.yml`

### ✅ Correct (Using Environment Variables)

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

### ❌ Incorrect (Hardcoded Password)

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: MyHardcodedPassword123!  # NEVER DO THIS
```

### Usage

```bash
# Create .env file in same directory as docker-compose.yml
cat > .env <<EOF
POSTGRES_PASSWORD=$(openssl rand -base64 24)
EOF

# Start containers
docker-compose up -d
```

## Kubernetes Secrets

### Creating Secrets

**Option 1: From Literal Values**

```bash
kubectl create secret generic fleet-db-credentials \
  --from-literal=username=fleetadmin \
  --from-literal=password=$(openssl rand -base64 24) \
  -n fleet-production
```

**Option 2: From File**

```bash
# Create secret file (NEVER commit this)
cat > /tmp/db-password.txt <<EOF
$(openssl rand -base64 24)
EOF

kubectl create secret generic fleet-db-credentials \
  --from-file=password=/tmp/db-password.txt \
  -n fleet-production

# Securely delete the file
shred -u /tmp/db-password.txt
```

**Option 3: From Azure Key Vault (Recommended)**

Use [Azure Key Vault Provider for Secrets Store CSI Driver](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver):

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-keyvault-sync
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: "<managed-identity-client-id>"
    keyvaultName: "fleet-keyvault-prod"
    objects: |
      array:
        - |
          objectName: db-password
          objectType: secret
        - |
          objectName: jwt-secret
          objectType: secret
```

### Using Secrets in Deployments

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-api
spec:
  template:
    spec:
      containers:
      - name: api
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: fleet-db-credentials
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: fleet-jwt-secret
              key: secret
```

## Azure Key Vault Integration

### Application Configuration

**Install Azure SDK:**

```bash
npm install @azure/keyvault-secrets @azure/identity
```

**Code Example:**

```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

// Use managed identity (no credentials needed in code)
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.AZURE_KEY_VAULT_URI;
const client = new SecretClient(vaultUrl, credential);

// Fetch secrets at startup
async function loadSecrets() {
  const dbPassword = await client.getSecret('db-password');
  const jwtSecret = await client.getSecret('jwt-secret');

  process.env.DB_PASSWORD = dbPassword.value;
  process.env.JWT_SECRET = jwtSecret.value;
}
```

### Managed Identity Setup

```bash
# Enable managed identity on AKS
az aks update \
  --resource-group fleet-rg \
  --name fleet-aks-cluster \
  --enable-managed-identity

# Create identity for pods
az identity create \
  --name fleet-api-identity \
  --resource-group fleet-rg

# Assign Key Vault access
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee-object-id "<identity-object-id>" \
  --scope "/subscriptions/<sub-id>/resourceGroups/fleet-rg/providers/Microsoft.KeyVault/vaults/fleet-keyvault-prod"
```

## Credential Rotation

### Database Passwords

```bash
# Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# Update Key Vault
az keyvault secret set \
  --vault-name fleet-keyvault-prod \
  --name "db-password" \
  --value "$NEW_PASSWORD"

# Update database user
psql -h fleet-db.postgres.database.azure.com \
  -U fleetadmin -d fleetdb \
  -c "ALTER USER fleetadmin PASSWORD '$NEW_PASSWORD';"

# Restart pods to pick up new secret
kubectl rollout restart deployment/fleet-api -n fleet-production
```

### JWT Secrets

```bash
# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 48)

# Update Key Vault
az keyvault secret set \
  --vault-name fleet-keyvault-prod \
  --name "jwt-secret" \
  --value "$NEW_JWT_SECRET"

# Gradual rollout to avoid invalidating all sessions
kubectl set env deployment/fleet-api \
  JWT_SECRET_NEW="$NEW_JWT_SECRET" \
  -n fleet-production

# After validation, update primary secret
kubectl set env deployment/fleet-api \
  JWT_SECRET="$NEW_JWT_SECRET" \
  -n fleet-production
```

### Kubernetes Service Account Tokens

```bash
# Delete service account to invalidate tokens
kubectl delete serviceaccount vendor-developer -n fleet-dev

# Recreate with new token
kubectl create serviceaccount vendor-developer -n fleet-dev

# Generate new kubeconfig
cd deployment/vendor-access
./generate-temporary-kubeconfig.sh
```

## API Keys and Third-Party Services

### SendGrid

```bash
# Store in Key Vault
az keyvault secret set \
  --vault-name fleet-keyvault-prod \
  --name "sendgrid-api-key" \
  --value "SG.xxxxxxxxxxxxx"
```

### Twilio

```bash
# Store both Account SID and Auth Token
az keyvault secret set \
  --vault-name fleet-keyvault-prod \
  --name "twilio-account-sid" \
  --value "ACxxxxxxxxxxxxx"

az keyvault secret set \
  --vault-name fleet-keyvault-prod \
  --name "twilio-auth-token" \
  --value "your-auth-token"
```

### Microsoft Graph API

```bash
# Store client secret
az keyvault secret set \
  --vault-name fleet-keyvault-prod \
  --name "graph-client-secret" \
  --value "your-client-secret"
```

## .gitignore Configuration

Ensure these patterns are in `.gitignore`:

```gitignore
# Environment files
.env
.env.local
.env.production
.env.staging
.env.development
.env.*.local
.env.secrets*

# Secrets and keys
*.pem
*.key
*.p8
*.p12
*.pfx
secrets/
.secrets/

# Kubernetes secrets
*-secrets.yaml
*secret*.yaml
vendor-kubeconfig.yaml
vendor-kubeconfig.yaml.gpg

# Azure credentials
azure-sp-credentials.*
keyvault-config-*.env
```

## Verifying Secret Security

### Audit Git History

```bash
# Check for accidentally committed secrets
git log -p | grep -i "password\|secret\|key" | head -50

# Use git-secrets tool
git secrets --install
git secrets --register-aws
git secrets --scan
```

### Scan for Exposed Secrets

```bash
# Using gitleaks
docker run --rm -v $(pwd):/path zricethezav/gitleaks:latest detect \
  --source="/path" \
  --verbose

# Using trufflehog
docker run --rm -v $(pwd):/repo trufflesecurity/trufflehog:latest \
  filesystem /repo
```

## Emergency: Secret Exposed

If a secret is accidentally committed or exposed:

1. **Immediately rotate the secret**
   ```bash
   # Example: Rotate DB password
   ./scripts/rotate-db-password.sh
   ```

2. **Remove from git history**
   ```bash
   # Use BFG Repo-Cleaner
   java -jar bfg.jar --delete-files secret-file.env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive

   # Force push (coordinate with team!)
   git push --force
   ```

3. **Notify security team**
   - Document the incident
   - Review access logs
   - Assess potential impact

4. **Update Key Vault/Kubernetes**
   ```bash
   # Update all instances with new secret
   kubectl create secret generic fleet-db-credentials \
     --from-literal=password=$(openssl rand -base64 24) \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

## Best Practices Checklist

### For Developers

- [ ] Never commit `.env` files
- [ ] Use `.env.example` for documentation
- [ ] Generate strong random secrets (`openssl rand -base64 32`)
- [ ] Never log secrets to console
- [ ] Never pass secrets in URLs
- [ ] Use HTTPS for all API calls
- [ ] Enable MFA on all cloud accounts
- [ ] Review `.gitignore` before committing

### For DevOps

- [ ] Use managed identities instead of service principals
- [ ] Enable Key Vault audit logging
- [ ] Set secret expiration dates
- [ ] Implement secret rotation schedule
- [ ] Use network policies to restrict secret access
- [ ] Enable Azure Policy for security compliance
- [ ] Review access logs regularly

### For Security Team

- [ ] Conduct quarterly secret audits
- [ ] Test secret rotation procedures
- [ ] Review Key Vault access policies
- [ ] Monitor for exposed credentials
- [ ] Maintain incident response plan
- [ ] Document all secrets and owners

## Generating Secure Secrets

### Database Passwords

```bash
# PostgreSQL (32 bytes = 256 bits)
openssl rand -base64 32

# With special characters
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

### JWT Secrets

```bash
# 48 bytes = 384 bits (recommended)
openssl rand -base64 48
```

### API Keys

```bash
# UUID format
uuidgen

# Random hex
openssl rand -hex 32
```

### Encryption Keys

```bash
# AES-256 key
openssl rand -hex 32

# RSA key pair
openssl genrsa -out private.pem 4096
openssl rsa -in private.pem -pubout -out public.pem
```

## Monitoring and Alerting

### Azure Monitor Alerts

```bash
# Alert on Key Vault access
az monitor metrics alert create \
  --name "keyvault-high-access" \
  --resource-group fleet-rg \
  --scopes "/subscriptions/<sub-id>/resourceGroups/fleet-rg/providers/Microsoft.KeyVault/vaults/fleet-keyvault-prod" \
  --condition "count ServiceApiResult > 100" \
  --window-size 5m \
  --evaluation-frequency 1m
```

### Application Insights

Track secret-related operations:

```typescript
import { ApplicationInsights } from '@azure/monitor-opentelemetry';

// Log secret access (not the secret value!)
appInsights.trackEvent({
  name: 'SecretAccessed',
  properties: {
    secretName: 'db-password',
    timestamp: new Date().toISOString(),
    service: 'fleet-api'
  }
});
```

## References

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [NIST SP 800-57 Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

## Support

For questions about secrets management:

- **Security Team:** security@fleet.example.com
- **DevOps Team:** devops@fleet.example.com
- **Emergency:** Call security hotline

---

**Last Updated:** 2025-11-19
**Version:** 1.0
**Owner:** Security & DevOps Teams
