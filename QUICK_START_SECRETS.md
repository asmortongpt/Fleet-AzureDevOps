# 🚀 Quick Start: Accessing Your Secrets

This is a quick reference guide for accessing secrets after implementing the secure secret management solution.

---

## 🔑 How to Access Secrets

### Option 1: Azure Portal (Easiest for beginners)

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Key Vaults" in the search bar
3. Click on your Key Vault (name starts with `fleet-secrets-vault-`)
4. Click "Secrets" in the left menu
5. Click on any secret to view its value

### Option 2: Azure CLI (Recommended for developers)

```bash
# Set your Key Vault name (get this from setup script output)
export KEY_VAULT_NAME="fleet-secrets-vault-123456"

# List all secrets
az keyvault secret list --vault-name $KEY_VAULT_NAME --query '[].name' -o table

# Get a specific secret
az keyvault secret show \
  --vault-name $KEY_VAULT_NAME \
  --name db-password \
  --query value -o tsv
```

### Option 3: Helper Script (Easiest for command line)

```bash
# Set your Key Vault name
export KEY_VAULT_NAME="fleet-secrets-vault-123456"

# List all secrets
./scripts/access-secret.sh list

# Get a specific secret
./scripts/access-secret.sh get db-password

# Or simply
./scripts/access-secret.sh db-password
```

---

## 📋 Common Tasks

### View Database Password

```bash
# Azure CLI
az keyvault secret show \
  --vault-name $KEY_VAULT_NAME \
  --name db-password \
  --query value -o tsv

# Helper script
./scripts/access-secret.sh db-password
```

### Update an API Key

```bash
# Update OpenAI API key
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name openai-api-key \
  --value "YOUR_OPENAI_API_KEY_HERE"

# Or use the helper script
./scripts/access-secret.sh set openai-api-key "YOUR_OPENAI_API_KEY_HERE"
```

### Rotate a Secret (Generate New Random Value)

```bash
# Use the helper script to auto-generate a new secure value
./scripts/access-secret.sh rotate jwt-secret

# Then restart your application
kubectl rollout restart deployment/fleet-api -n fleet-management
```

---

## 🗺️ Secret Names Reference

| Secret Name | Description | Where Used |
|------------|-------------|------------|
| `db-password` | PostgreSQL database password | API, migrations |
| `db-username` | PostgreSQL username (usually `fleetadmin`) | API, migrations |
| `jwt-secret` | JWT token signing secret | API authentication |
| `encryption-key` | Data encryption key | API for sensitive data |
| `redis-password` | Redis cache password | API, background jobs |
| `openai-api-key` | OpenAI API key | AI features |
| `claude-api-key` | Anthropic Claude API key | AI features |
| `gemini-api-key` | Google Gemini API key | AI features |
| `azure-storage-connection-string` | Azure Storage connection | File uploads |
| `sendgrid-api-key` | SendGrid email service | Email notifications |
| `twilio-auth-token` | Twilio SMS/voice | SMS notifications |
| `mapbox-api-key` | Mapbox mapping | Maps and routing |
| `samsara-api-token` | Samsara telematics | Vehicle tracking |

---

## 🔄 How Secrets Flow

```
Azure Key Vault
       ↓
External Secrets Operator (syncs every 1 hour)
       ↓
Kubernetes Secrets (in cluster)
       ↓
Environment Variables (in pods)
       ↓
Your Application Code
```

**What this means:**
- Update secrets in Azure Key Vault
- They automatically sync to Kubernetes within ~1 hour
- Restart your pods to pick up new values
- Your code accesses them as environment variables (e.g., `process.env.DB_PASSWORD`)

---

## ⚡ Quick Commands Cheat Sheet

```bash
# Set your Key Vault name (do this once per terminal session)
export KEY_VAULT_NAME="your-vault-name"

# List all secrets
./scripts/access-secret.sh list

# Get a secret
./scripts/access-secret.sh db-password

# Set a secret
./scripts/access-secret.sh set api-key "new-value"

# Rotate a secret (auto-generates new value)
./scripts/access-secret.sh rotate jwt-secret

# View secret in Kubernetes
kubectl get secret fleet-database-secrets -n fleet-management -o yaml

# Force secret sync from Key Vault
kubectl delete secret fleet-database-secrets -n fleet-management

# Restart API to pick up new secrets
kubectl rollout restart deployment/fleet-api -n fleet-management
```

---

## 🆘 First Time Setup

If you haven't set up Azure Key Vault yet:

```bash
# Run the setup script
cd scripts
./setup-azure-keyvault.sh

# Follow the prompts and save the output
# You'll get a keyvault-config-*.env file with connection details
# KEEP THIS SAFE AND DO NOT COMMIT TO GIT!
```

After setup, you **MUST** update these API keys manually:

```bash
# Get your Key Vault name from setup output
KEY_VAULT_NAME="fleet-secrets-vault-123456"

# Update API keys with your actual values
az keyvault secret set --vault-name $KEY_VAULT_NAME \
  --name openai-api-key --value "YOUR_OPENAI_API_KEY_HERE"

az keyvault secret set --vault-name $KEY_VAULT_NAME \
  --name claude-api-key --value "YOUR_CLAUDE_API_KEY_HERE"

az keyvault secret set --vault-name $KEY_VAULT_NAME \
  --name gemini-api-key --value "YOUR_GEMINI_API_KEY_HERE"

az keyvault secret set --vault-name $KEY_VAULT_NAME \
  --name azure-storage-connection-string --value "YOUR_AZURE_STORAGE_CONNECTION_STRING_HERE"
```

---

## 📚 Full Documentation

For complete documentation, see:
- **[SECRET_MANAGEMENT.md](./SECRET_MANAGEMENT.md)** - Comprehensive guide
- **[deployment/secure/README.md](./deployment/secure/README.md)** - Kubernetes deployment guide
- **[SECURITY_AUDIT_PASSWORDS.md](./SECURITY_AUDIT_PASSWORDS.md)** - Security audit findings

---

## ❓ FAQ

**Q: Where do I find my Key Vault name?**
A: Run the setup script and it will output the name, or check Azure Portal under Key Vaults.

**Q: How do I give someone else access to secrets?**
A: Grant them access to the Key Vault in Azure Portal → Access policies → Add access policy.

**Q: How long does it take for secrets to sync to Kubernetes?**
A: Up to 1 hour by default. You can force immediate sync by deleting the Kubernetes secret.

**Q: Can I use different secrets for dev/staging/prod?**
A: Yes! Run the setup script with `ENVIRONMENT=dev`, `ENVIRONMENT=staging`, or `ENVIRONMENT=production`.

**Q: What if I lose the keyvault-config file?**
A: You can retrieve the connection details from Azure Portal. The Service Principal credentials are also stored in Key Vault.

---

Need help? See the full [SECRET_MANAGEMENT.md](./SECRET_MANAGEMENT.md) guide or contact the DevOps team.
