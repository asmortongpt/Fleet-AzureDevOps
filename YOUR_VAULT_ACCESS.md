# 🔐 Your Azure Key Vault - Quick Access Guide

## 🚀 Setup Azure Key Vault (Choose One Method)

### ⚡ Method 1: Azure Portal (No CLI Needed - Recommended)

**Step-by-Step:**

1. **Create Key Vault**
   - 🔗 **Direct Link:** https://portal.azure.com/#create/Microsoft.KeyVault
   - Fill in:
     - **Key Vault Name:** `fleet-secrets-vault-[yourname]` (must be globally unique)
     - **Resource Group:** `fleet-production-rg` (create new)
     - **Region:** `East US 2`
     - **Pricing Tier:** Standard
   - Click **"Review + create"** → **"Create"**

2. **Grant Yourself Access**
   - After creation, click **"Go to resource"**
   - Click **"Access policies"** → **"+ Create"**
   - Select ALL secret permissions (Get, List, Set, Delete, etc.)
   - Search for your email, select yourself → **"Next"** → **"Create"**

3. **Add Your Secrets**
   - Click **"Secrets"** → **"+ Generate/Import"**
   - Add each secret from the table below:

   | Click "Generate/Import" for each | Secret Name | Value |
   |----------------------------------|-------------|-------|
   | ➕ | `db-username` | `fleetadmin` |
   | ➕ | `db-password` | Generate: `openssl rand -base64 32 \| tr -d "=+/" \| cut -c1-32` |
   | ➕ | `db-host` | `fleet-postgres-service` |
   | ➕ | `db-port` | `5432` |
   | ➕ | `db-name` | `fleetdb` |
   | ➕ | `jwt-secret` | Generate: `openssl rand -hex 32` |
   | ➕ | `encryption-key` | Generate: `openssl rand -hex 32` |
   | ➕ | `redis-password` | Generate: `openssl rand -base64 32 \| tr -d "=+/" \| cut -c1-32` |
   | ➕ | `openai-api-key` | Your actual OpenAI key: `sk-proj-...` |
   | ➕ | `claude-api-key` | Your actual Claude key: `sk-ant-...` |
   | ➕ | `gemini-api-key` | Your actual Gemini key: `AIza...` |
   | ➕ | `azure-storage-connection-string` | Your Azure Storage connection string |

   **Generate passwords in your terminal:**
   ```bash
   # Generate a secure password (copy the output)
   openssl rand -base64 32 | tr -d "=+/" | cut -c1-32

   # Generate a hex key (copy the output)
   openssl rand -hex 32
   ```

---

### ⚡ Method 2: Automated Script (Requires Azure CLI)

**Install Azure CLI first:**
```bash
# Ubuntu/Debian
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# macOS
brew install azure-cli

# Then login
az login

# Run the setup script
cd /home/user/Fleet/scripts
./setup-azure-keyvault.sh
```

---

## 🔗 Direct Access Links

### Azure Portal Links

**All Key Vaults:**
- https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.KeyVault%2Fvaults

**Create New Key Vault:**
- https://portal.azure.com/#create/Microsoft.KeyVault

**After you create your vault, bookmark this:**
- https://portal.azure.com → Search "Key Vaults" → Click your vault → "Secrets"

---

## 🔐 How to View Your Secrets

### In Azure Portal (Easiest)

1. Go to https://portal.azure.com
2. Type "Key Vaults" in the search bar at top
3. Click on your vault name (e.g., `fleet-secrets-vault-john`)
4. Click **"Secrets"** in the left menu
5. Click any secret name
6. Click **"Show Secret Value"** to reveal it

**📸 Visual Guide:**
```
Azure Portal → 🔍 Search "Key Vaults" → Your Vault → Secrets → Click Secret → Show Secret Value
```

### With Azure CLI (If Installed)

```bash
# List all your Key Vaults
az keyvault list --query "[].name" -o table

# Set your vault name
export KEY_VAULT_NAME="fleet-secrets-vault-yourname"

# List all secrets
az keyvault secret list --vault-name $KEY_VAULT_NAME --query '[].name' -o table

# Get a specific secret
az keyvault secret show --vault-name $KEY_VAULT_NAME --name db-password --query value -o tsv
```

### With Helper Script (If Azure CLI Installed)

```bash
export KEY_VAULT_NAME="fleet-secrets-vault-yourname"

# List all secrets
./scripts/access-secret.sh list

# Get a specific secret
./scripts/access-secret.sh db-password
```

---

## 📋 Secrets Checklist

After creating your vault, make sure you have these secrets:

**Required Secrets (11 minimum):**
- [ ] `db-username`
- [ ] `db-password`
- [ ] `db-host`
- [ ] `db-port`
- [ ] `db-name`
- [ ] `jwt-secret`
- [ ] `encryption-key`
- [ ] `redis-password`
- [ ] `openai-api-key`
- [ ] `claude-api-key`
- [ ] `gemini-api-key`
- [ ] `azure-storage-connection-string`

**Optional Secrets:**
- [ ] `sendgrid-api-key` (for email)
- [ ] `twilio-auth-token` (for SMS)
- [ ] `mapbox-api-key` (for maps)
- [ ] `samsara-api-token` (for telematics)

---

## 🎯 Next Steps After Creating Vault

### 1. Note Your Vault Details

```
✏️ Fill this in after creating your vault:

Key Vault Name: _________________________________
Resource Group: fleet-production-rg
Region: East US 2

My Vault URL:
https://portal.azure.com → Key Vaults → [Your Vault Name]
```

### 2. Create Service Principal for Kubernetes

Open Azure Cloud Shell (click >_ icon in Azure Portal) and run:

```bash
# Set your vault name
KEY_VAULT_NAME="your-vault-name-here"
RESOURCE_GROUP="fleet-production-rg"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create Service Principal
SP_OUTPUT=$(az ad sp create-for-rbac \
  --name fleet-k8s-keyvault-sp \
  --role Reader \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP)

# Get credentials
SP_APP_ID=$(echo $SP_OUTPUT | jq -r '.appId')
SP_PASSWORD=$(echo $SP_OUTPUT | jq -r '.password')
SP_TENANT=$(echo $SP_OUTPUT | jq -r '.tenant')

# Grant access to vault
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --spn $SP_APP_ID \
  --secret-permissions get list

# Show credentials
echo "================================================"
echo "🔐 SAVE THESE - YOU'LL NEED THEM FOR KUBERNETES"
echo "================================================"
echo "Client ID:     $SP_APP_ID"
echo "Client Secret: $SP_PASSWORD"
echo "Tenant ID:     $SP_TENANT"
echo "================================================"
```

**💾 Save these credentials somewhere safe!**

### 3. Configure Kubernetes

```bash
# Create Kubernetes secret with Service Principal credentials
kubectl create secret generic azure-sp-credentials \
  --from-literal=client-id="YOUR_CLIENT_ID_FROM_ABOVE" \
  --from-literal=client-secret="YOUR_CLIENT_SECRET_FROM_ABOVE" \
  -n fleet-management

# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system --create-namespace --set installCRDs=true

# Update and deploy External Secrets config
cd /home/user/Fleet
# Edit deployment/secure/external-secrets-setup.yaml
# Replace YOUR_KEYVAULT_NAME and YOUR_TENANT_ID with your values

kubectl apply -f deployment/secure/external-secrets-setup.yaml

# Verify secrets are syncing
kubectl get externalsecret -n fleet-management
kubectl get secrets -n fleet-management | grep fleet-
```

---

## 📱 Mobile Access

You can also access your Key Vault from your phone:

1. Download "Microsoft Azure" app from App Store / Google Play
2. Sign in with your Azure account
3. Navigate to Key Vaults → Your Vault → Secrets

---

## 🆘 Quick Help

**Can't find my vault?**
- Go to: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.KeyVault%2Fvaults
- All your vaults are listed there

**Can't see secret values?**
- Click "Access policies" in your vault
- Make sure you have "Get" and "List" permissions

**Need to update a secret?**
- Click the secret in Portal
- Click "+ New Version"
- Enter new value
- Click "Create"

**Forgot Service Principal password?**
- Create a new Service Principal (it's okay to have multiple)
- Or reset the existing one in Azure Portal → Azure Active Directory → App registrations

---

## 📚 Full Documentation

For complete details, see:
- **[AZURE_KEYVAULT_MANUAL_SETUP.md](./AZURE_KEYVAULT_MANUAL_SETUP.md)** - Detailed setup guide
- **[SECRET_MANAGEMENT.md](./SECRET_MANAGEMENT.md)** - Complete management guide
- **[QUICK_START_SECRETS.md](./QUICK_START_SECRETS.md)** - Quick reference

---

## ✅ Summary

**What you need to do:**

1. ✅ Create Key Vault in Azure Portal (5 minutes)
2. ✅ Add all secrets (10 minutes)
3. ✅ Create Service Principal via Cloud Shell (2 minutes)
4. ✅ Save Service Principal credentials
5. ✅ Configure Kubernetes (5 minutes)

**Total time: ~20-25 minutes**

**Your secrets will be stored securely in Azure Key Vault and automatically synced to Kubernetes!**

---

🔗 **Start here:** https://portal.azure.com/#create/Microsoft.KeyVault
