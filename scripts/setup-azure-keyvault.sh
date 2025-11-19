#!/bin/bash

# Fleet Management - Azure Key Vault Setup Script
# This script sets up Azure Key Vault and stores all secrets securely
#
# ⚠️  SECURITY NOTICE ⚠️
# This script:
#   - Creates sensitive Service Principal credentials
#   - Generates cryptographic secrets
#   - Outputs a configuration file with credentials
#
# After running:
#   - Immediately add keyvault-config-*.env to .gitignore
#   - Delete the config file after creating Kubernetes secrets
#   - Never commit the generated credentials to version control

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Fleet Management - Azure Key Vault Setup${NC}"
echo "=============================================="
echo -e "${YELLOW}⚠️  This script generates sensitive credentials${NC}"
echo -e "${YELLOW}   Follow security best practices after completion${NC}"
echo ""

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-fleet-production-rg}"
LOCATION="${LOCATION:-eastus2}"
KEY_VAULT_NAME="${KEY_VAULT_NAME:-fleet-secrets-vault-$(date +%s | tail -c 6)}"
ENVIRONMENT="${ENVIRONMENT:-production}"

echo -e "\n${BLUE}Configuration:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Key Vault Name: $KEY_VAULT_NAME"
echo "  Environment: $ENVIRONMENT"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo -e "\n${YELLOW}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Azure. Please run 'az login' first.${NC}"
    exit 1
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo -e "${GREEN}✓ Logged in to Azure (Subscription: $SUBSCRIPTION_ID)${NC}"

# Create Resource Group if it doesn't exist
echo -e "\n${YELLOW}Creating/Verifying Resource Group...${NC}"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${GREEN}✓ Resource Group '$RESOURCE_GROUP' already exists${NC}"
else
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION
    echo -e "${GREEN}✓ Resource Group created${NC}"
fi

# Create Key Vault
echo -e "\n${YELLOW}Creating Azure Key Vault...${NC}"
az keyvault create \
    --name $KEY_VAULT_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --enable-rbac-authorization false \
    --enabled-for-deployment true \
    --enabled-for-template-deployment true

echo -e "${GREEN}✓ Key Vault created: $KEY_VAULT_NAME${NC}"

# Get current user's object ID
CURRENT_USER_ID=$(az ad signed-in-user show --query id -o tsv)

# Set access policy for current user
echo -e "\n${YELLOW}Setting Key Vault access policies...${NC}"
az keyvault set-policy \
    --name $KEY_VAULT_NAME \
    --object-id $CURRENT_USER_ID \
    --secret-permissions get list set delete purge recover backup restore

echo -e "${GREEN}✓ Access policy set for current user${NC}"

# Function to generate secure random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to generate secure random hex string
generate_hex() {
    local length=$1
    openssl rand -hex $length
}

# Function to set secret in Key Vault
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3

    echo -e "  Setting ${BLUE}$secret_name${NC}..."
    az keyvault secret set \
        --vault-name $KEY_VAULT_NAME \
        --name "$secret_name" \
        --value "$secret_value" \
        --description "$description" \
        --output none
}

echo -e "\n${YELLOW}Generating and storing secrets...${NC}"
echo -e "${RED}IMPORTANT: You will need to manually update the API keys with your actual values!${NC}"

# Database Secrets
DB_PASSWORD=$(generate_password)
set_secret "db-password" "$DB_PASSWORD" "PostgreSQL database password for $ENVIRONMENT"
set_secret "db-username" "fleetadmin" "PostgreSQL database username"
set_secret "db-host" "fleet-postgres-service" "PostgreSQL database host"
set_secret "db-port" "5432" "PostgreSQL database port"
set_secret "db-name" "fleetdb" "PostgreSQL database name"

# Redis Secrets
REDIS_PASSWORD=$(generate_password)
set_secret "redis-password" "$REDIS_PASSWORD" "Redis password for $ENVIRONMENT"

# JWT and Encryption
JWT_SECRET=$(generate_hex 32)
ENCRYPTION_KEY=$(generate_hex 32)
set_secret "jwt-secret" "$JWT_SECRET" "JWT signing secret for $ENVIRONMENT"
set_secret "encryption-key" "$ENCRYPTION_KEY" "Encryption key for sensitive data"

# API Keys (placeholders - must be updated manually)
set_secret "openai-api-key" "REPLACE_WITH_YOUR_OPENAI_KEY" "OpenAI API key - MUST BE UPDATED MANUALLY"
set_secret "claude-api-key" "REPLACE_WITH_YOUR_CLAUDE_KEY" "Claude API key - MUST BE UPDATED MANUALLY"
set_secret "gemini-api-key" "REPLACE_WITH_YOUR_GEMINI_KEY" "Gemini API key - MUST BE UPDATED MANUALLY"

# Azure Storage
set_secret "azure-storage-connection-string" "REPLACE_WITH_YOUR_AZURE_STORAGE_CONNECTION_STRING" "Azure Storage connection string - MUST BE UPDATED MANUALLY"

# Optional Services (placeholders)
set_secret "sendgrid-api-key" "REPLACE_IF_USING_SENDGRID" "SendGrid API key (optional)"
set_secret "twilio-auth-token" "REPLACE_IF_USING_TWILIO" "Twilio auth token (optional)"
set_secret "mapbox-api-key" "REPLACE_IF_USING_MAPBOX" "Mapbox API key (optional)"
set_secret "samsara-api-token" "REPLACE_IF_USING_SAMSARA" "Samsara API token (optional)"

echo -e "${GREEN}✓ All secrets stored in Key Vault${NC}"

# Create a Kubernetes Service Principal for accessing Key Vault
echo -e "\n${YELLOW}Creating Service Principal for Kubernetes...${NC}"
SP_NAME="fleet-k8s-keyvault-sp-$ENVIRONMENT"

# Create service principal
SP_OUTPUT=$(az ad sp create-for-rbac \
    --name $SP_NAME \
    --role Reader \
    --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP)

SP_APP_ID=$(echo $SP_OUTPUT | jq -r '.appId')
SP_PASSWORD=$(echo $SP_OUTPUT | jq -r '.password')
SP_TENANT=$(echo $SP_OUTPUT | jq -r '.tenant')

# Grant the Service Principal access to Key Vault
az keyvault set-policy \
    --name $KEY_VAULT_NAME \
    --spn $SP_APP_ID \
    --secret-permissions get list

# Store Service Principal credentials in Key Vault (for reference)
set_secret "k8s-sp-client-id" "$SP_APP_ID" "Kubernetes Service Principal Client ID"
set_secret "k8s-sp-client-secret" "$SP_PASSWORD" "Kubernetes Service Principal Client Secret"
set_secret "k8s-sp-tenant-id" "$SP_TENANT" "Azure Tenant ID"

echo -e "${GREEN}✓ Service Principal created and configured${NC}"

# Output summary
echo -e "\n${GREEN}=============================================="
echo -e "✅ Azure Key Vault Setup Complete!"
echo -e "==============================================${NC}"
echo -e "\n${BLUE}Key Vault Details:${NC}"
echo -e "  Name: ${GREEN}$KEY_VAULT_NAME${NC}"
echo -e "  Resource Group: ${GREEN}$RESOURCE_GROUP${NC}"
echo -e "  Location: ${GREEN}$LOCATION${NC}"
echo -e "  URI: ${GREEN}https://$KEY_VAULT_NAME.vault.azure.net/${NC}"

echo -e "\n${BLUE}Service Principal for Kubernetes:${NC}"
echo -e "  Client ID: ${GREEN}$SP_APP_ID${NC}"
echo -e "  Tenant ID: ${GREEN}$SP_TENANT${NC}"
echo -e "  Client Secret: ${YELLOW}(stored in Key Vault as 'k8s-sp-client-secret')${NC}"

echo -e "\n${BLUE}Generated Secrets:${NC}"
echo -e "  Database Password: ${YELLOW}(stored in Key Vault as 'db-password')${NC}"
echo -e "  Redis Password: ${YELLOW}(stored in Key Vault as 'redis-password')${NC}"
echo -e "  JWT Secret: ${YELLOW}(stored in Key Vault as 'jwt-secret')${NC}"
echo -e "  Encryption Key: ${YELLOW}(stored in Key Vault as 'encryption-key')${NC}"

echo -e "\n${RED}⚠️  IMPORTANT - ACTION REQUIRED:${NC}"
echo -e "${RED}You must manually update these secrets with your actual API keys:${NC}"
echo ""
echo -e "  1. OpenAI API Key:"
echo -e "     ${YELLOW}az keyvault secret set --vault-name $KEY_VAULT_NAME --name openai-api-key --value 'your-actual-key'${NC}"
echo ""
echo -e "  2. Claude API Key:"
echo -e "     ${YELLOW}az keyvault secret set --vault-name $KEY_VAULT_NAME --name claude-api-key --value 'your-actual-key'${NC}"
echo ""
echo -e "  3. Gemini API Key:"
echo -e "     ${YELLOW}az keyvault secret set --vault-name $KEY_VAULT_NAME --name gemini-api-key --value 'your-actual-key'${NC}"
echo ""
echo -e "  4. Azure Storage Connection String:"
echo -e "     ${YELLOW}az keyvault secret set --vault-name $KEY_VAULT_NAME --name azure-storage-connection-string --value 'your-connection-string'${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo "  1. Update API keys in Key Vault (see commands above)"
echo "  2. Install External Secrets Operator in your Kubernetes cluster"
echo "  3. Apply the Kubernetes manifests in deployment/secure/"
echo "  4. See SECRET_MANAGEMENT.md for detailed instructions"

# Save configuration to file
CONFIG_FILE="keyvault-config-$ENVIRONMENT.env"
cat > $CONFIG_FILE <<EOF
# Azure Key Vault Configuration - $ENVIRONMENT
# Generated: $(date)
#
# ⚠️  SECURITY WARNING ⚠️
# This file contains sensitive credentials!
# DO NOT:
#   - Commit this file to Git
#   - Share this file via email, Slack, or any messaging platform
#   - Store this file in shared drives or cloud storage
#   - Include this file in container images
#
# DO:
#   - Store this file in a secure location with restricted access
#   - Add to .gitignore: echo "keyvault-config-*.env" >> .gitignore
#   - Delete after deploying to production
#   - Use the values to create Kubernetes secrets, then delete the file

KEY_VAULT_NAME=$KEY_VAULT_NAME
RESOURCE_GROUP=$RESOURCE_GROUP
AZURE_TENANT_ID=$SP_TENANT
AZURE_CLIENT_ID=$SP_APP_ID
AZURE_CLIENT_SECRET=$SP_PASSWORD
SUBSCRIPTION_ID=$SUBSCRIPTION_ID
KEY_VAULT_URI=https://$KEY_VAULT_NAME.vault.azure.net/
EOF

# Restrict file permissions
chmod 600 $CONFIG_FILE

echo -e "\n${GREEN}✓ Configuration saved to: $CONFIG_FILE${NC}"
echo -e "${RED}⚠️  SECURITY WARNING: This file contains sensitive credentials!${NC}"
echo -e "${RED}   - File permissions set to 600 (owner read/write only)${NC}"
echo -e "${RED}   - DO NOT commit this file to Git${NC}"
echo -e "${RED}   - Add to .gitignore immediately${NC}"
echo -e "${RED}   - Delete after creating Kubernetes secrets${NC}"

echo -e "\n${YELLOW}Security Best Practices:${NC}"
echo "  1. Add to .gitignore: echo 'keyvault-config-*.env' >> .gitignore"
echo "  2. Create Kubernetes secret using these values"
echo "  3. Delete this file after deployment: rm $CONFIG_FILE"
echo "  4. Rotate Service Principal credentials regularly (every 90 days)"
echo "  5. Enable Azure Key Vault audit logging"
echo "  6. Use managed identities in production when possible"

echo -e "\n${GREEN}Setup complete! 🎉${NC}"
