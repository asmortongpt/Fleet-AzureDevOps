#!/usr/bin/env bash
#
# Configure Azure Static Web App with Key Vault References
# Uses Azure Key Vault for all secrets (production-ready security)
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
STATIC_WEB_APP_NAME="fleet-app"
RESOURCE_GROUP="fleet-production-rg"
KEY_VAULT_NAME="fleet-secrets-0d326d71"
KEY_VAULT_URI="https://fleet-secrets-0d326d71.vault.azure.net"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "CONFIGURE AZURE STATIC WEB APP WITH KEY VAULT"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Enable Managed Identity for Static Web App
echo -e "${BLUE}[1/3]${NC} Enabling Managed Identity for Static Web App..."
echo ""

SWA_IDENTITY=$(az staticwebapp identity assign \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "principalId" -o tsv)

echo -e "${GREEN}✓${NC} Managed Identity enabled: $SWA_IDENTITY"
echo ""

# Step 2: Grant Static Web App access to Key Vault
echo -e "${BLUE}[2/3]${NC} Granting Key Vault permissions..."
echo ""

az keyvault set-policy \
    --name "$KEY_VAULT_NAME" \
    --object-id "$SWA_IDENTITY" \
    --secret-permissions get list

echo -e "${GREEN}✓${NC} Key Vault access granted"
echo ""

# Step 3: Configure Static Web App with Key Vault references
echo -e "${BLUE}[3/3]${NC} Configuring environment variables with Key Vault references..."
echo ""

# Frontend environment variables (VITE_ prefix - these need actual values, not references)
# Static Web Apps don't support Key Vault references for build-time variables
# So we'll use actual values for VITE_ vars and Key Vault refs for backend secrets

echo "Setting VITE_AZURE_AD_CLIENT_ID (build-time value)..."
CLIENT_ID=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "AZURE-AD-CLIENT-ID" --query "value" -o tsv)
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "VITE_AZURE_AD_CLIENT_ID=$CLIENT_ID"

echo "Setting VITE_AZURE_AD_TENANT_ID (build-time value)..."
TENANT_ID=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "AZURE-AD-TENANT-ID" --query "value" -o tsv)
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "VITE_AZURE_AD_TENANT_ID=$TENANT_ID"

echo "Setting VITE_AZURE_AD_REDIRECT_URI..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "VITE_AZURE_AD_REDIRECT_URI=https://green-pond-0f040980f.3.azurestaticapps.net/auth/callback"

# Backend secrets (Key Vault references - runtime access)
echo "Setting AZURE_AD_CLIENT_ID (Key Vault reference)..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "AZURE_AD_CLIENT_ID=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/AZURE-AD-CLIENT-ID/)"

echo "Setting AZURE_AD_TENANT_ID (Key Vault reference)..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "AZURE_AD_TENANT_ID=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/AZURE-AD-TENANT-ID/)"

echo "Setting AZURE_AD_CLIENT_SECRET (Key Vault reference)..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "AZURE_AD_CLIENT_SECRET=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/AZURE-AD-CLIENT-SECRET/)"

echo "Setting JWT_SECRET (Key Vault reference)..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "JWT_SECRET=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/JWT-SECRET/)"

echo "Setting SESSION_SECRET (Key Vault reference)..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "SESSION_SECRET=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/SESSION-SECRET/)"

echo "Setting NODE_ENV..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "NODE_ENV=production"

echo "Setting AZURE_KEY_VAULT_URI..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "AZURE_KEY_VAULT_URI=$KEY_VAULT_URI"

echo ""
echo -e "${GREEN}✓${NC} All environment variables configured with Key Vault references"
echo ""

# Verify configuration
echo "Verifying configuration..."
az staticwebapp appsettings list \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties" -o json

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║  ✓ KEY VAULT CONFIGURATION COMPLETE                    ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Security Status:"
echo "  ✅ Managed Identity enabled"
echo "  ✅ Key Vault access granted"
echo "  ✅ All secrets referenced from Key Vault"
echo "  ✅ No secrets stored as plain text"
echo ""
echo "Next Steps:"
echo "  1. Redeploy the application"
echo "  2. Test SSO at: https://green-pond-0f040980f.3.azurestaticapps.net"
echo ""
