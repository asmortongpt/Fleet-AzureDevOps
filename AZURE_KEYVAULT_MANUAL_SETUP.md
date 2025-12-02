# Azure Key Vault Manual Setup Guide

Since Azure CLI is not currently installed, you can set up Azure Key Vault manually through the Azure Portal. This guide provides step-by-step instructions.

---

## 🎯 Option 1: Azure Portal Setup (Easiest - No CLI Required)

### Step 1: Create the Key Vault

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com
   - Sign in with your Azure account

2. **Create Key Vault**
   - Click the **"+ Create a resource"** button (top left)
   - Search for **"Key Vault"**
   - Click **"Create"**

3. **Configure Basic Settings**
   ```
   Subscription: [Select your subscription]
   Resource Group: fleet-production-rg (create new if doesn't exist)
   Key Vault Name: fleet-secrets-vault-[your-initials-or-random]
   Region: East US 2 (or your preferred region)
   Pricing Tier: Standard
   ```

4. **Access Configuration**
   - On the "Access configuration" tab:
   - Permission model: **Vault access policy**
   - Check: ✅ Azure Virtual Machines for deployment
   - Check: ✅ Azure Resource Manager for template deployment

5. **Review + Create**
   - Click **"Review + create"**
   - Click **"Create"**
   - Wait for deployment to complete (~1 minute)

### Step 2: Grant Yourself Access

1. **Open Your Key Vault**
   - Go to: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.KeyVault%2Fvaults
   - Click on your newly created Key Vault

2. **Set Access Policy**
   - Click **"Access policies"** in left menu
   - Click **"+ Create"**
   - Select permissions:
     - Secret permissions: ✅ Get, List, Set, Delete, Recover, Backup, Restore, Purge
   - Click **"Next"**
   - Search for your email/username and select it
   - Click **"Next"**, then **"Create"**

### Step 3: Add Secrets to Key Vault

Now add all your secrets. For each secret below:

1. Click **"Secrets"** in the left menu
2. Click **"+ Generate/Import"**
3. Enter the **Name** and **Value** from the table below
4. Click **"Create"**

#### Required Secrets:

| Secret Name | Value (Generate or Enter) | Notes |
|------------|---------------------------|-------|
| `db-username` | `fleetadmin` | PostgreSQL username |
| `db-password` | [Generate secure password]* | PostgreSQL password |
| `db-host` | `fleet-postgres-service` | Database host |
| `db-port` | `5432` | Database port |
| `db-name` | `fleetdb` | Database name |
| `jwt-secret` | [Generate 64-char hex]* | JWT signing secret |
| `encryption-key` | [Generate 64-char hex]* | Encryption key |
| `redis-password` | [Generate secure password]* | Redis password |
| `openai-api-key` | `sk-proj-...` | Your OpenAI API key |
| `claude-api-key` | `sk-ant-...` | Your Claude API key |
| `gemini-api-key` | `AIza...` | Your Gemini API key |
| `azure-storage-connection-string` | `DefaultEndpointsProtocol=https;AccountName=...` | Azure Storage connection |

**Optional Secrets:**
| Secret Name | Value | Notes |
|------------|-------|-------|
| `sendgrid-api-key` | Your SendGrid key | Email service (optional) |
| `twilio-auth-token` | Your Twilio token | SMS service (optional) |
| `mapbox-api-key` | Your Mapbox key | Maps service (optional) |
| `samsara-api-token` | Your Samsara token | Telematics (optional) |

\* **How to generate secure passwords/keys:**

**Secure Password (32 characters):**
```bash
# On Mac/Linux:
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32

# Or use an online generator:
# https://passwordsgenerator.net/ (32 characters, all character types)
```

**64-character Hex String:**
```bash
# On Mac/Linux:
openssl rand -hex 32

# Or manually generate:
# Use https://www.random.org/strings/ (32 bytes in hex)
```

### Step 4: Create Service Principal for Kubernetes

1. **Open Cloud Shell in Azure Portal**
   - Click the **Cloud Shell** icon (>_) at the top of Azure Portal
   - Choose **Bash**

2. **Run these commands:**

```bash
# Set variables
RESOURCE_GROUP="fleet-production-rg"
KEY_VAULT_NAME="your-keyvault-name"  # Use the name you created
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create Service Principal
SP_OUTPUT=$(az ad sp create-for-rbac \
  --name fleet-k8s-keyvault-sp \
  --role Reader \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP)

# Extract values
SP_APP_ID=$(echo $SP_OUTPUT | jq -r '.appId')
SP_PASSWORD=$(echo $SP_OUTPUT | jq -r '.password')
SP_TENANT=$(echo $SP_OUTPUT | jq -r '.tenant')

# Grant Service Principal access to Key Vault
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --spn $SP_APP_ID \
  --secret-permissions get list

# Display credentials (SAVE THESE!)
echo "================================"
echo "SAVE THESE CREDENTIALS:"
echo "================================"
echo "Client ID: $SP_APP_ID"
echo "Client Secret: $SP_PASSWORD"
echo "Tenant ID: $SP_TENANT"
echo "================================"
```

3. **Save the output** - You'll need these for Kubernetes setup

### Step 5: Access Your Secrets

**Direct Link to Your Key Vault:**
```
https://portal.azure.com/#view/Microsoft_Azure_KeyVault/SecretMenuBlade/~/secrets/id/%2Fsubscriptions%2FYOUR_SUBSCRIPTION_ID%2FresourceGroups%2Ffleet-production-rg%2Fproviders%2FMicrosoft.KeyVault%2Fvaults%2FYOUR_VAULT_NAME
```

Replace:
- `YOUR_SUBSCRIPTION_ID` with your subscription ID
- `YOUR_VAULT_NAME` with your Key Vault name

**Or navigate manually:**
1. Go to: https://portal.azure.com
2. Search for "Key Vaults" in the top search bar
3. Click on your vault name
4. Click "Secrets" in left menu
5. Click any secret to view its value

---

## 🎯 Option 2: Install Azure CLI and Use Automation Script

If you prefer to use the automated script:

### Install Azure CLI

**On Ubuntu/Debian:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**On macOS:**
```bash
brew install azure-cli
```

**On Windows:**
Download from: https://aka.ms/installazurecliwindows

### Login to Azure

```bash
az login
```

### Run the Setup Script

```bash
cd /home/user/Fleet/scripts
./setup-azure-keyvault.sh
```

The script will:
- Create Key Vault automatically
- Generate all passwords
- Create Service Principal
- Set up access policies
- Output all credentials

---

## 📋 Kubernetes Configuration

After creating the Key Vault and Service Principal, configure Kubernetes:

### 1. Create Service Principal Secret

```bash
# Use the credentials from Step 4
kubectl create secret generic azure-sp-credentials \
  --from-literal=client-id="YOUR_CLIENT_ID" \
  --from-literal=client-secret="YOUR_CLIENT_SECRET" \
  -n fleet-management
```

### 2. Update External Secrets Configuration

```bash
# Set your values
KEY_VAULT_NAME="your-vault-name"
TENANT_ID="your-tenant-id"

# Update the configuration file
cd /home/user/Fleet
sed -i "s/YOUR_KEYVAULT_NAME/$KEY_VAULT_NAME/g" deployment/secure/external-secrets-setup.yaml
sed -i "s/YOUR_TENANT_ID/$TENANT_ID/g" deployment/secure/external-secrets-setup.yaml

# Also update the Service Principal credentials in the file
# Edit deployment/secure/external-secrets-setup.yaml
# Replace REPLACE_WITH_SP_CLIENT_ID and REPLACE_WITH_SP_CLIENT_SECRET
```

### 3. Install External Secrets Operator

```bash
# Add Helm repo
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

# Install
helm install external-secrets \
  external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace \
  --set installCRDs=true
```

### 4. Deploy External Secrets

```bash
kubectl apply -f deployment/secure/external-secrets-setup.yaml

# Verify
kubectl get secretstore -n fleet-management
kubectl get externalsecret -n fleet-management
kubectl get secrets -n fleet-management | grep fleet-
```

### 5. Deploy Applications

```bash
kubectl apply -f deployment/secure/postgres-deployment-secure.yaml
kubectl apply -f deployment/secure/redis-deployment-secure.yaml
kubectl apply -f deployment/secure/api-deployment-secure.yaml
```

---

## 🔐 Accessing Secrets After Setup

### View in Azure Portal

1. Go to: https://portal.azure.com
2. Navigate to: **Key Vaults** → **[Your Vault Name]** → **Secrets**
3. Click any secret to view its current value
4. Click "Show Secret Value" to reveal the actual value

### View in Kubernetes

```bash
# List all secrets
kubectl get secrets -n fleet-management

# View a specific secret (base64 encoded)
kubectl get secret fleet-database-secrets -n fleet-management -o yaml

# Decode a secret value
kubectl get secret fleet-database-secrets \
  -n fleet-management \
  -o jsonpath='{.data.DB_PASSWORD}' | base64 -d && echo
```

### View via Azure CLI (if installed)

```bash
# Set your vault name
export KEY_VAULT_NAME="your-vault-name"

# List all secrets
az keyvault secret list --vault-name $KEY_VAULT_NAME --query '[].name' -o table

# Get a specific secret
az keyvault secret show \
  --vault-name $KEY_VAULT_NAME \
  --name db-password \
  --query value -o tsv
```

---

## 🎯 Quick Reference Card

**Your Key Vault Details:**
```
Key Vault Name: [Write here after creation]
Resource Group: fleet-production-rg
Region: East US 2 (or your chosen region)

Azure Portal Link:
https://portal.azure.com/#view/Microsoft_Azure_KeyVault/VaultMenuBlade/~/overview/id/%2Fsubscriptions%2F[SUBSCRIPTION]%2FresourceGroups%2Ffleet-production-rg%2Fproviders%2FMicrosoft.KeyVault%2Fvaults%2F[VAULT_NAME]

Direct Secrets Link:
https://portal.azure.com → Search "Key Vaults" → [Your Vault] → Secrets
```

**Kubernetes Service Principal:**
```
Client ID: [Save from Step 4]
Client Secret: [Save from Step 4]
Tenant ID: [Save from Step 4]
```

---

## ✅ Verification Checklist

- [ ] Key Vault created in Azure Portal
- [ ] Access policy configured for your account
- [ ] All required secrets added (13 minimum)
- [ ] Service Principal created and has Key Vault access
- [ ] Service Principal credentials saved securely
- [ ] External Secrets Operator installed in Kubernetes
- [ ] External Secrets configuration deployed
- [ ] Kubernetes secrets created (verify with `kubectl get secrets`)
- [ ] Applications deployed with secure manifests

---

## 🆘 Troubleshooting

**Can't see secrets in Portal:**
- Check Access Policies → Ensure you have "Get" and "List" permissions

**External Secrets not syncing:**
- Check Service Principal has access: `az keyvault show --name VAULT_NAME --query properties.accessPolicies`
- Check External Secrets Operator logs: `kubectl logs -n external-secrets-system -l app.kubernetes.io/name=external-secrets`

**Forgot Service Principal credentials:**
- You can create a new Service Principal and update the Kubernetes secret
- Or retrieve from Key Vault if you stored them there

---

## 📚 Additional Resources

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [External Secrets Operator Guide](https://external-secrets.io/)
- [SECRET_MANAGEMENT.md](./SECRET_MANAGEMENT.md) - Full documentation
- [QUICK_START_SECRETS.md](./QUICK_START_SECRETS.md) - Quick reference

---

**Need Help?**
- Azure Support: https://azure.microsoft.com/support/
- Check SECRET_MANAGEMENT.md for detailed troubleshooting
