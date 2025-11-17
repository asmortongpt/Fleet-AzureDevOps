# Azure AD Authentication Fix - Complete Guide

**Date:** 2025-11-12
**Status:** Ready to Execute
**Affected Environments:** Dev, Staging

---

## 🎯 Overview

This guide fixes two Azure AD authentication errors:

1. **AADSTS7000215**: Invalid client secret provided
2. **AADSTS50011**: Redirect URI mismatch

**Solution:** Use Azure Key Vault for secure secret storage with AKS Secrets Store CSI Driver integration.

---

## 📋 Prerequisites

Before running the script, you must complete these manual steps in Azure Portal:

### Step 1: Add Redirect URIs to Azure AD App Registration

1. Go to https://portal.azure.com
2. Navigate to **Azure Active Directory** → **App registrations**
3. Search for app ID: `80fe6628-1dc4-41fe-894f-919b12ecc994`
4. Click on **Authentication** in the left sidebar
5. Under **Web** platform, add these redirect URIs:

```
✓ https://fleet-dev.capitaltechalliance.com/api/auth/microsoft/callback
✓ https://fleet-staging.capitaltechalliance.com/api/auth/microsoft/callback
✓ http://fleet-dev.capitaltechalliance.com/api/auth/microsoft/callback
✓ http://fleet-staging.capitaltechalliance.com/api/auth/microsoft/callback
✓ http://48.211.228.97/api/auth/microsoft/callback
✓ http://20.161.88.59/api/auth/microsoft/callback
```

6. Click **Save**

### Step 2: Generate New Client Secret

1. In the same App Registration, click **Certificates & secrets**
2. Under **Client secrets**, click **+ New client secret**
3. Description: `Fleet Management - Generated 2025-11-12`
4. Expires: **24 months**
5. Click **Add**
6. **CRITICAL**: Immediately copy the **VALUE** (you won't see it again!)

---

## 🚀 Execution Steps

### 1. Update the Script with Your Client Secret

Open the script and replace the placeholder:

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
nano fix-azure-ad-with-keyvault.sh
```

Find this line:
```bash
AZURE_AD_CLIENT_SECRET="YOUR_NEW_CLIENT_SECRET_HERE"
```

Replace it with your actual client secret VALUE (not the Secret ID):
```bash
AZURE_AD_CLIENT_SECRET="your-actual-secret-value-here"
```

Save and exit.

### 2. Run the Script

```bash
./fix-azure-ad-with-keyvault.sh
```

The script will:
- ✅ Validate prerequisites
- ✅ Store all secrets in Azure Key Vault `fleet-secrets-0d326d71`
- ✅ Enable AKS Secrets Store CSI Driver
- ✅ Grant managed identity access to Key Vault
- ✅ Create SecretProviderClass for dev and staging

---

## 🏗️ Architecture

### Before (Insecure)
```
Kubernetes Secrets (base64 encoded)
└── Pod reads secrets directly
```

### After (Secure with Key Vault)
```
Azure Key Vault (fleet-secrets-0d326d71)
└── AKS Secrets Store CSI Driver
    └── Managed Identity Authentication
        └── SecretProviderClass mounts secrets
            └── Pod reads secrets from mounted volume
```

---

## 📦 Secrets Stored in Key Vault

| Secret Name | Description | Used By |
|-------------|-------------|---------|
| `microsoft-client-id` | Azure AD App Client ID | Dev, Staging |
| `microsoft-client-secret` | Azure AD App Client Secret | Dev, Staging |
| `microsoft-tenant-id` | Azure AD Tenant ID | Dev, Staging |
| `microsoft-redirect-uri-dev` | Dev redirect URI | Dev |
| `microsoft-redirect-uri-staging` | Staging redirect URI | Staging |

---

## 🔧 Update Your API Deployment

After running the script, update your API deployment manifests to mount secrets from Key Vault.

### Dev Environment (`/Users/andrewmorton/Documents/GitHub/Fleet/k8s/dev/fleet-api-deployment.yaml`)

Add this to your deployment spec:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-api
  namespace: fleet-management-dev
spec:
  template:
    spec:
      # Add volume for Key Vault secrets
      volumes:
        - name: secrets-store-inline
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: "azure-microsoft-auth"

      containers:
        - name: fleet-api
          image: fleetappregistry.azurecr.io/fleet-api:latest

          # Mount the secrets volume
          volumeMounts:
            - name: secrets-store-inline
              mountPath: "/mnt/secrets-store"
              readOnly: true

          # Reference secrets as environment variables
          env:
            - name: MICROSOFT_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: microsoft-auth-kv-secret
                  key: MICROSOFT_CLIENT_ID

            - name: MICROSOFT_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: microsoft-auth-kv-secret
                  key: MICROSOFT_CLIENT_SECRET

            - name: MICROSOFT_TENANT_ID
              valueFrom:
                secretKeyRef:
                  name: microsoft-auth-kv-secret
                  key: MICROSOFT_TENANT_ID

            - name: MICROSOFT_REDIRECT_URI
              valueFrom:
                secretKeyRef:
                  name: microsoft-auth-kv-secret
                  key: MICROSOFT_REDIRECT_URI

            # Keep existing env vars...
```

### Staging Environment

Same configuration, but namespace is `fleet-management-staging`.

---

## 🧪 Testing

### 1. Verify Secrets are in Key Vault

```bash
az keyvault secret list \
  --vault-name fleet-secrets-0d326d71 \
  --query "[?starts_with(name, 'microsoft')].name" \
  -o table
```

Expected output:
```
Result
-------------------------
microsoft-client-id
microsoft-client-secret
microsoft-redirect-uri-dev
microsoft-redirect-uri-staging
microsoft-tenant-id
```

### 2. Verify SecretProviderClass

```bash
kubectl get secretproviderclass -n fleet-management-dev
kubectl get secretproviderclass -n fleet-management-staging
```

Expected output:
```
NAME                    AGE
azure-microsoft-auth    5m
```

### 3. Test Secret Sync

After deploying the updated API:

```bash
# Check if secret was created by CSI driver
kubectl get secret microsoft-auth-kv-secret -n fleet-management-dev
kubectl get secret microsoft-auth-kv-secret -n fleet-management-staging

# Verify secret contents (base64 encoded)
kubectl get secret microsoft-auth-kv-secret -n fleet-management-dev -o yaml
```

### 4. Test Microsoft SSO Login

```bash
# Dev environment
curl -I https://fleet-dev.capitaltechalliance.com/api/auth/microsoft

# Staging environment
curl -I https://fleet-staging.capitaltechalliance.com/api/auth/microsoft
```

Both should return HTTP 302 redirect to Microsoft login.

### 5. Full SSO Flow Test

1. Open browser to: `https://fleet-dev.capitaltechalliance.com/api/auth/microsoft`
2. You should be redirected to Microsoft login
3. After successful login, you should be redirected back to your app
4. No AADSTS errors should occur

---

## 🔍 Troubleshooting

### Issue: "Secret microsoft-auth-kv-secret not found"

**Cause:** Pod hasn't mounted the CSI volume yet

**Solution:**
```bash
# Check pod logs
kubectl logs -n fleet-management-dev deployment/fleet-api

# Check CSI driver status
kubectl get pods -n kube-system | grep secrets-store

# Restart deployment to trigger mount
kubectl rollout restart deployment/fleet-api -n fleet-management-dev
```

### Issue: "Access denied to Key Vault"

**Cause:** Managed identity doesn't have Key Vault permissions

**Solution:**
```bash
# Get managed identity client ID
IDENTITY_CLIENT_ID=$(az aks show \
  --name fleet-aks-cluster \
  --resource-group fleet-production-rg \
  --query "addonProfiles.azureKeyvaultSecretsProvider.identity.clientId" \
  -o tsv)

# Grant access
az keyvault set-policy \
  --name fleet-secrets-0d326d71 \
  --secret-permissions get list \
  --spn $IDENTITY_CLIENT_ID
```

### Issue: Still getting AADSTS50011 redirect URI errors

**Cause:** Redirect URI not added to Azure AD app registration

**Solution:** Double-check all 6 redirect URIs were added correctly in Azure Portal.

---

## 📊 Verification Checklist

- [ ] Redirect URIs added to Azure AD app registration (all 6)
- [ ] New client secret generated in Azure Portal
- [ ] Client secret VALUE copied (not Secret ID)
- [ ] Script updated with client secret
- [ ] Script executed successfully
- [ ] Secrets visible in Key Vault
- [ ] SecretProviderClass created in both namespaces
- [ ] API deployment updated with volume mounts
- [ ] Deployment rolled out successfully
- [ ] Secret `microsoft-auth-kv-secret` created by CSI driver
- [ ] Microsoft SSO login redirects correctly
- [ ] No AADSTS errors in browser

---

## 🔗 Quick Links

### Azure Portal
- [App Registration](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Authentication/appId/80fe6628-1dc4-41fe-894f-919b12ecc994)
- [Key Vault](https://portal.azure.com/#@/resource/subscriptions/<sub-id>/resourceGroups/fleet-production-rg/providers/Microsoft.KeyVault/vaults/fleet-secrets-0d326d71)
- [AKS Cluster](https://portal.azure.com/#@/resource/subscriptions/<sub-id>/resourceGroups/fleet-production-rg/providers/Microsoft.ContainerService/managedClusters/fleet-aks-cluster)

### Application Endpoints
- Dev: https://fleet-dev.capitaltechalliance.com
- Dev API: https://fleet-dev.capitaltechalliance.com/api/health
- Staging: https://fleet-staging.capitaltechalliance.com
- Staging API: https://fleet-staging.capitaltechalliance.com/api/health

### Microsoft SSO Login Endpoints
- Dev: https://fleet-dev.capitaltechalliance.com/api/auth/microsoft
- Staging: https://fleet-staging.capitaltechalliance.com/api/auth/microsoft

---

## 📝 Summary

This solution provides:

✅ **Security**: Secrets stored in Azure Key Vault, not Kubernetes
✅ **Automation**: AKS Secrets Store CSI Driver auto-syncs secrets
✅ **Auditability**: All secret access logged in Key Vault
✅ **Rotation**: Easy secret rotation without pod restarts
✅ **Compliance**: Meets enterprise security standards

---

## 🆘 Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review pod logs: `kubectl logs -n fleet-management-dev deployment/fleet-api`
3. Check Key Vault access: `az keyvault secret show --vault-name fleet-secrets-0d326d71 --name microsoft-client-id`
4. Verify CSI driver: `kubectl get pods -n kube-system | grep secrets-store`

---

**Last Updated:** 2025-11-12
**Maintained By:** Fleet Management DevOps Team
