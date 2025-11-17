# Secure Deployment Configurations

This directory contains Kubernetes manifests that use **Azure Key Vault** for secret management via the **External Secrets Operator**.

## ✅ Why This Approach?

- **No hardcoded secrets** in Git
- **Centralized secret management** with Azure Key Vault
- **Automatic secret synchronization** to Kubernetes
- **Audit logging** and access control
- **Secret rotation** without redeploying applications

## 📁 Files

### `external-secrets-setup.yaml`
Configures the External Secrets Operator to connect to Azure Key Vault and defines all ExternalSecret resources that sync secrets from Key Vault to Kubernetes.

**Contains:**
- `SecretStore` - Connection to Azure Key Vault
- `ExternalSecret` resources for database, app, Redis, AI services, storage, and third-party services

### `api-deployment-secure.yaml`
Secure API deployment manifest that references secrets from External Secrets (which come from Key Vault).

**Features:**
- No hardcoded secrets
- Environment variables pulled from Kubernetes secrets
- Secrets automatically synced from Azure Key Vault

### `postgres-deployment-secure.yaml`
Secure PostgreSQL deployment that uses database credentials from External Secrets.

### `redis-deployment-secure.yaml`
Secure Redis deployment that uses Redis password from External Secrets.

## 🚀 Deployment Steps

### Prerequisites
1. Azure Key Vault created and configured (run `scripts/setup-azure-keyvault.sh`)
2. External Secrets Operator installed in Kubernetes cluster
3. Service Principal credentials configured

### Step 1: Configure External Secrets

```bash
# Set your Key Vault details
KEY_VAULT_NAME="your-keyvault-name"
TENANT_ID="your-tenant-id"
CLIENT_ID="your-sp-client-id"
CLIENT_SECRET="your-sp-client-secret"

# Create Service Principal credentials secret
kubectl create secret generic azure-sp-credentials \
  --from-literal=client-id="$CLIENT_ID" \
  --from-literal=client-secret="$CLIENT_SECRET" \
  -n fleet-management

# Update external-secrets-setup.yaml with your vault details
# (Replace YOUR_KEYVAULT_NAME and YOUR_TENANT_ID)
```

### Step 2: Deploy External Secrets Configuration

```bash
kubectl apply -f external-secrets-setup.yaml
```

**Verify:**
```bash
# Check SecretStore
kubectl get secretstore -n fleet-management

# Check ExternalSecrets
kubectl get externalsecret -n fleet-management

# Check that secrets were created
kubectl get secrets -n fleet-management | grep fleet-
```

You should see these secrets created:
- `fleet-database-secrets`
- `fleet-app-secrets`
- `fleet-redis-secrets`
- `fleet-ai-secrets`
- `fleet-storage-secrets`
- `fleet-thirdparty-secrets`

### Step 3: Deploy Applications

```bash
# Deploy PostgreSQL
kubectl apply -f postgres-deployment-secure.yaml

# Deploy Redis
kubectl apply -f redis-deployment-secure.yaml

# Deploy API
kubectl apply -f api-deployment-secure.yaml
```

## 🔄 Updating Secrets

### Update a Secret in Key Vault

```bash
# Update the secret in Azure Key Vault
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name db-password \
  --value "new-password"

# Secrets sync automatically within ~1 hour
# To force immediate sync, delete the Kubernetes secret:
kubectl delete secret fleet-database-secrets -n fleet-management

# Restart pods to pick up new values
kubectl rollout restart deployment/fleet-api -n fleet-management
```

## 🔐 Secret Reference

### Database Secrets (`fleet-database-secrets`)
- `DB_USERNAME` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name

### Application Secrets (`fleet-app-secrets`)
- `JWT_SECRET` - JWT signing secret
- `ENCRYPTION_KEY` - Data encryption key

### Redis Secrets (`fleet-redis-secrets`)
- `REDIS_PASSWORD` - Redis password

### AI Service Secrets (`fleet-ai-secrets`)
- `OPENAI_API_KEY` - OpenAI API key
- `CLAUDE_API_KEY` - Claude API key
- `GEMINI_API_KEY` - Gemini API key

### Storage Secrets (`fleet-storage-secrets`)
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection

### Third-Party Service Secrets (`fleet-thirdparty-secrets`)
- `SENDGRID_API_KEY` - SendGrid API key
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `MAPBOX_API_KEY` - Mapbox API key
- `SAMSARA_API_TOKEN` - Samsara API token

## 🚨 Troubleshooting

### Secrets not syncing

```bash
# Check External Secrets Operator logs
kubectl logs -n external-secrets-system -l app.kubernetes.io/name=external-secrets

# Check specific ExternalSecret status
kubectl describe externalsecret fleet-database-secrets -n fleet-management

# Check for errors
kubectl get events -n fleet-management --field-selector involvedObject.kind=ExternalSecret
```

### Access denied errors

```bash
# Verify Service Principal has access
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --spn $CLIENT_ID \
  --secret-permissions get list
```

## 📚 Documentation

See [SECRET_MANAGEMENT.md](../../SECRET_MANAGEMENT.md) for comprehensive documentation on:
- Setting up Azure Key Vault
- Managing secrets
- Rotating secrets
- Security best practices
- Troubleshooting

## ⚠️ Security Notes

1. **Never commit secrets to Git** - All secrets are in Azure Key Vault
2. **Protect Service Principal credentials** - Store securely, never commit
3. **Use separate Key Vaults** for different environments
4. **Enable audit logging** on Azure Key Vault
5. **Rotate secrets regularly** (every 90 days minimum)

## 🔗 Related Files

- `../../scripts/setup-azure-keyvault.sh` - Initial Key Vault setup
- `../../scripts/access-secret.sh` - Helper script to access secrets
- `../../SECRET_MANAGEMENT.md` - Complete documentation
- `../../SECURITY_AUDIT_PASSWORDS.md` - Security audit findings

---

**For questions or issues, consult the [SECRET_MANAGEMENT.md](../../SECRET_MANAGEMENT.md) guide.**
