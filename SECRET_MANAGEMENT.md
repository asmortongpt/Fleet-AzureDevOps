# Secret Management Guide

**Fleet Management System - Secure Secret Storage & Access**

This guide explains how to securely store and access secrets using Azure Key Vault and Kubernetes External Secrets Operator.

---

## 🎯 Overview

We use **Azure Key Vault** as the source of truth for all secrets, with **External Secrets Operator** automatically syncing them to Kubernetes. This ensures:

- ✅ No secrets in Git
- ✅ Centralized secret management
- ✅ Automatic rotation support
- ✅ Audit logging
- ✅ Role-based access control

---

## 🚀 Quick Start

### Step 1: Set Up Azure Key Vault

Run the setup script to create and configure Azure Key Vault:

```bash
cd scripts
chmod +x setup-azure-keyvault.sh

# For production
./setup-azure-keyvault.sh

# For staging
ENVIRONMENT=staging ./setup-azure-keyvault.sh

# For development
ENVIRONMENT=development ./setup-azure-keyvault.sh
```

**What this script does:**
1. Creates an Azure Key Vault
2. Generates secure random passwords for database, Redis, JWT
3. Creates placeholder entries for API keys
4. Sets up a Service Principal for Kubernetes access
5. Configures access policies
6. Outputs a configuration file (DO NOT commit to Git!)

**Output:** You'll get a file like `keyvault-config-production.env` with connection details.

### Step 2: Update API Keys in Key Vault

The script creates placeholders for API keys. You **MUST** update these with your actual keys:

```bash
# Set your Key Vault name from the setup script output
KEY_VAULT_NAME="your-keyvault-name"

# Update OpenAI API Key
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name openai-api-key \
  --value "sk-proj-your-actual-openai-key"

# Update Claude API Key
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name claude-api-key \
  --value "sk-ant-your-actual-claude-key"

# Update Gemini API Key
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name gemini-api-key \
  --value "your-actual-gemini-key"

# Update Azure Storage Connection String
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name azure-storage-connection-string \
  --value "DefaultEndpointsProtocol=https;AccountName=..."
```

### Step 3: Install External Secrets Operator

Install the External Secrets Operator in your Kubernetes cluster:

```bash
# Add the External Secrets Helm repository
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

# Install External Secrets Operator
helm install external-secrets \
  external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace \
  --set installCRDs=true
```

**Verify installation:**
```bash
kubectl get pods -n external-secrets-system
```

### Step 4: Configure Kubernetes to Access Key Vault

Update the External Secrets configuration with your Key Vault details:

```bash
# Get your values from the keyvault-config-*.env file
KEY_VAULT_NAME="your-vault-name"
TENANT_ID="your-tenant-id"
CLIENT_ID="your-service-principal-client-id"
CLIENT_SECRET="your-service-principal-client-secret"

# Create the Service Principal credentials secret
kubectl create secret generic azure-sp-credentials \
  --from-literal=client-id="$CLIENT_ID" \
  --from-literal=client-secret="$CLIENT_SECRET" \
  -n fleet-management

# Update the external-secrets-setup.yaml file
# Replace YOUR_KEYVAULT_NAME and YOUR_TENANT_ID with your values
sed -i "s/YOUR_KEYVAULT_NAME/$KEY_VAULT_NAME/g" deployment/secure/external-secrets-setup.yaml
sed -i "s/YOUR_TENANT_ID/$TENANT_ID/g" deployment/secure/external-secrets-setup.yaml
```

### Step 5: Deploy External Secrets Configuration

```bash
# Apply the External Secrets configuration
kubectl apply -f deployment/secure/external-secrets-setup.yaml

# Verify the SecretStore is ready
kubectl get secretstore -n fleet-management

# Verify External Secrets are syncing
kubectl get externalsecret -n fleet-management
```

**Check if secrets are created:**
```bash
# These secrets should be automatically created from Key Vault
kubectl get secrets -n fleet-management | grep fleet-
```

You should see:
- `fleet-database-secrets`
- `fleet-app-secrets`
- `fleet-redis-secrets`
- `fleet-ai-secrets`
- `fleet-storage-secrets`
- `fleet-thirdparty-secrets`

### Step 6: Deploy Your Application

Now deploy your application using the secure manifests:

```bash
# Deploy PostgreSQL
kubectl apply -f deployment/secure/postgres-deployment-secure.yaml

# Deploy Redis
kubectl apply -f deployment/secure/redis-deployment-secure.yaml

# Deploy API
kubectl apply -f deployment/secure/api-deployment-secure.yaml
```

---

## 🔐 Accessing Secrets

### From Azure CLI

```bash
# List all secrets
az keyvault secret list --vault-name $KEY_VAULT_NAME

# Get a specific secret
az keyvault secret show --vault-name $KEY_VAULT_NAME --name db-password

# Get just the secret value
az keyvault secret show \
  --vault-name $KEY_VAULT_NAME \
  --name db-password \
  --query value -o tsv
```

### From Kubernetes

```bash
# View a Kubernetes secret (base64 encoded)
kubectl get secret fleet-database-secrets -n fleet-management -o yaml

# Decode a specific secret value
kubectl get secret fleet-database-secrets \
  -n fleet-management \
  -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

### From Application Code

Your application automatically receives secrets as environment variables. No code changes needed!

```typescript
// In your Node.js/TypeScript application
const dbPassword = process.env.DB_PASSWORD; // Automatically injected
const jwtSecret = process.env.JWT_SECRET;
const openaiKey = process.env.OPENAI_API_KEY;
```

---

## 🔄 Updating Secrets

### Update a Secret in Key Vault

```bash
# Update a secret
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name db-password \
  --value "new-secure-password"
```

**The secret will automatically sync to Kubernetes within ~1 hour** (default refresh interval).

To force immediate sync:
```bash
# Delete the Kubernetes secret (it will be recreated from Key Vault)
kubectl delete secret fleet-database-secrets -n fleet-management

# Wait a few seconds for External Secrets to recreate it
kubectl get externalsecret fleet-database-secrets -n fleet-management
```

### Rotate Secrets

```bash
# Example: Rotate database password
NEW_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Update in Key Vault
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name db-password \
  --value "$NEW_DB_PASSWORD"

# Update your database with the new password
# Then restart your application pods to pick up the new secret
kubectl rollout restart deployment/fleet-api -n fleet-management
```

---

## 📋 Secret Inventory

### Database Secrets
- `db-username` - PostgreSQL username
- `db-password` - PostgreSQL password
- `db-host` - PostgreSQL host
- `db-port` - PostgreSQL port
- `db-name` - Database name

### Application Secrets
- `jwt-secret` - JWT signing secret
- `encryption-key` - Encryption key for sensitive data

### Redis Secrets
- `redis-password` - Redis authentication password

### AI Service Keys
- `openai-api-key` - OpenAI API key
- `claude-api-key` - Anthropic Claude API key
- `gemini-api-key` - Google Gemini API key

### Storage Secrets
- `azure-storage-connection-string` - Azure Storage connection string

### Optional Third-Party Services
- `sendgrid-api-key` - SendGrid email service API key
- `twilio-auth-token` - Twilio SMS/voice service auth token
- `mapbox-api-key` - Mapbox mapping service API key
- `samsara-api-token` - Samsara telematics API token

---

## 🛡️ Security Best Practices

### 1. Access Control

```bash
# Grant read-only access to a user
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --upn user@example.com \
  --secret-permissions get list

# Grant full access to an admin
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --upn admin@example.com \
  --secret-permissions get list set delete purge recover backup restore
```

### 2. Enable Audit Logging

```bash
# Create a Log Analytics workspace (if not exists)
az monitor log-analytics workspace create \
  --resource-group fleet-production-rg \
  --workspace-name fleet-keyvault-logs

# Enable diagnostic logs
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group fleet-production-rg \
  --workspace-name fleet-keyvault-logs \
  --query id -o tsv)

az monitor diagnostic-settings create \
  --name keyvault-diagnostics \
  --resource $(az keyvault show --name $KEY_VAULT_NAME --query id -o tsv) \
  --workspace $WORKSPACE_ID \
  --logs '[{"category": "AuditEvent","enabled": true}]'
```

### 3. Set Expiration on Secrets (Optional)

```bash
# Set a secret with expiration date
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name temp-api-key \
  --value "temporary-key" \
  --expires "2025-12-31T23:59:59Z"
```

### 4. Backup Key Vault

```bash
# Backup all secrets
mkdir -p keyvault-backup
for secret in $(az keyvault secret list --vault-name $KEY_VAULT_NAME --query '[].name' -o tsv); do
  az keyvault secret backup \
    --vault-name $KEY_VAULT_NAME \
    --name $secret \
    --file "keyvault-backup/$secret.backup"
done

# Store backup in a secure location (NOT in Git!)
```

---

## 🚨 Troubleshooting

### External Secrets not syncing

```bash
# Check External Secrets Operator logs
kubectl logs -n external-secrets-system -l app.kubernetes.io/name=external-secrets

# Check specific ExternalSecret status
kubectl describe externalsecret fleet-database-secrets -n fleet-management

# Check SecretStore status
kubectl describe secretstore azure-keyvault-store -n fleet-management
```

### Access Denied Errors

```bash
# Verify Service Principal has access to Key Vault
az keyvault show --name $KEY_VAULT_NAME --query properties.accessPolicies

# Re-grant access if needed
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --spn $CLIENT_ID \
  --secret-permissions get list
```

### Kubernetes Secret not found

```bash
# Check if ExternalSecret exists
kubectl get externalsecret -n fleet-management

# Check ExternalSecret events
kubectl get events -n fleet-management --field-selector involvedObject.kind=ExternalSecret

# Manually trigger sync by deleting and letting it recreate
kubectl delete externalsecret fleet-database-secrets -n fleet-management
kubectl apply -f deployment/secure/external-secrets-setup.yaml
```

---

## 📚 Additional Resources

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [External Secrets Operator Documentation](https://external-secrets.io/)
- [Kubernetes Secrets Best Practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)

---

## ⚠️ Important Security Notes

1. **NEVER commit the following to Git:**
   - `keyvault-config-*.env` files
   - Any file containing actual secret values
   - Service Principal credentials

2. **Regularly rotate secrets:**
   - Database passwords: Every 90 days
   - JWT secrets: Every 90 days
   - API keys: Based on provider recommendations

3. **Monitor access:**
   - Enable audit logging
   - Review Key Vault access logs regularly
   - Set up alerts for suspicious activity

4. **Use separate environments:**
   - Production, staging, and development should have separate Key Vaults
   - Never share secrets between environments

---

## 🆘 Emergency: Secret Compromised

If a secret is compromised:

```bash
# 1. Immediately revoke the compromised secret
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name compromised-secret \
  --value "REVOKED-$(date +%s)"

# 2. Generate a new secret
NEW_SECRET=$(openssl rand -base64 32)

# 3. Update Key Vault
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name compromised-secret \
  --value "$NEW_SECRET"

# 4. Force Kubernetes to sync immediately
kubectl delete secret <secret-name> -n fleet-management

# 5. Restart affected pods
kubectl rollout restart deployment/fleet-api -n fleet-management

# 6. Review audit logs
az monitor activity-log list \
  --resource-group fleet-production-rg \
  --offset 7d
```

---

**Need Help?** Contact the DevOps/Security team immediately for assistance.
