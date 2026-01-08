#!/bin/bash

# ============================================================================
# Azure Infrastructure Setup Script
# ============================================================================
# Purpose: Automate Azure resource provisioning for Fleet Management System
# Features:
# - Azure Key Vault for secure secret management
# - Application Insights for monitoring
# - Azure Database for PostgreSQL
# - Container Registry for Docker images
# - App Service or AKS deployment
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Fleet Management System - Azure Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================================================
# Configuration
# ============================================================================

# Resource names
RESOURCE_GROUP=${RESOURCE_GROUP:-"fleet-management-rg"}
LOCATION=${LOCATION:-"eastus2"}
KEYVAULT_NAME=${KEYVAULT_NAME:-"fleet-secrets"}
POSTGRES_SERVER=${POSTGRES_SERVER:-"fleet-postgresql"}
APP_INSIGHTS_NAME=${APP_INSIGHTS_NAME:-"fleet-insights"}
CONTAINER_REGISTRY=${CONTAINER_REGISTRY:-"fleetregistry"}

# Database configuration
DB_ADMIN_USER=${DB_ADMIN_USER:-"fleetadmin"}
DB_NAME=${DB_NAME:-"fleet_db"}

echo -e "${YELLOW}Configuration:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Key Vault: $KEYVAULT_NAME"
echo "  PostgreSQL Server: $POSTGRES_SERVER"
echo "  App Insights: $APP_INSIGHTS_NAME"
echo ""

# ============================================================================
# Prerequisites Check
# ============================================================================

echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI not found${NC}"
    echo "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${GREEN}✓${NC} Azure CLI installed"

# Check if logged in
az account show &> /dev/null || {
    echo -e "${YELLOW}Not logged in to Azure. Please log in...${NC}"
    az login
}

echo -e "${GREEN}✓${NC} Logged in to Azure"

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "  Subscription: $SUBSCRIPTION_ID"
echo ""

# ============================================================================
# Create Resource Group
# ============================================================================

echo -e "${BLUE}Creating Resource Group...${NC}"

az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --output none

echo -e "${GREEN}✓${NC} Resource group created: $RESOURCE_GROUP"
echo ""

# ============================================================================
# Create Key Vault
# ============================================================================

echo -e "${BLUE}Creating Azure Key Vault...${NC}"

az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-soft-delete true \
  --enable-purge-protection true \
  --output none

# Get Key Vault URI
KEYVAULT_URI=$(az keyvault show --name $KEYVAULT_NAME --query properties.vaultUri -o tsv)

echo -e "${GREEN}✓${NC} Key Vault created: $KEYVAULT_NAME"
echo "  URI: $KEYVAULT_URI"
echo ""

# ============================================================================
# Create Application Insights
# ============================================================================

echo -e "${BLUE}Creating Application Insights...${NC}"

az monitor app-insights component create \
  --app $APP_INSIGHTS_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web \
  --output none

# Get instrumentation key
APPINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
  --app $APP_INSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)

echo -e "${GREEN}✓${NC} Application Insights created: $APP_INSIGHTS_NAME"
echo ""

# ============================================================================
# Create PostgreSQL Database
# ============================================================================

echo -e "${BLUE}Creating PostgreSQL Database...${NC}"

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)

az postgres flexible-server create \
  --name $POSTGRES_SERVER \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B2s \
  --tier Burstable \
  --version 14 \
  --storage-size 32 \
  --public-access 0.0.0.0-255.255.255.255 \
  --output none

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --database-name $DB_NAME \
  --output none

DB_HOST="${POSTGRES_SERVER}.postgres.database.azure.com"

echo -e "${GREEN}✓${NC} PostgreSQL server created: $POSTGRES_SERVER"
echo "  Host: $DB_HOST"
echo "  Database: $DB_NAME"
echo "  Admin User: $DB_ADMIN_USER"
echo ""

# ============================================================================
# Store Secrets in Key Vault
# ============================================================================

echo -e "${BLUE}Storing secrets in Key Vault...${NC}"

# Database secrets
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DB-HOST" --value "$DB_HOST" --output none
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DB-PORT" --value "5432" --output none
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DB-NAME" --value "$DB_NAME" --output none
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DB-USER" --value "$DB_ADMIN_USER" --output none
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DB-PASSWORD" --value "$DB_PASSWORD" --output none

echo -e "${GREEN}✓${NC} Database secrets stored"

# Application Insights
az keyvault secret set --vault-name $KEYVAULT_NAME --name "APPLICATION-INSIGHTS-CONNECTION-STRING" --value "$APPINSIGHTS_CONNECTION_STRING" --output none

echo -e "${GREEN}✓${NC} Application Insights secrets stored"

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64)
az keyvault secret set --vault-name $KEYVAULT_NAME --name "JWT-SECRET" --value "$JWT_SECRET" --output none

echo -e "${GREEN}✓${NC} JWT secret generated and stored"

echo ""

# ============================================================================
# Create Container Registry (Optional)
# ============================================================================

read -p "Create Azure Container Registry? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Creating Container Registry...${NC}"

    az acr create \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_REGISTRY \
      --sku Basic \
      --admin-enabled true \
      --output none

    echo -e "${GREEN}✓${NC} Container Registry created: $CONTAINER_REGISTRY"
    echo ""
fi

# ============================================================================
# Create Managed Identity (for Key Vault access)
# ============================================================================

echo -e "${BLUE}Creating Managed Identity...${NC}"

IDENTITY_NAME="fleet-api-identity"

az identity create \
  --name $IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --output none

IDENTITY_ID=$(az identity show --name $IDENTITY_NAME --resource-group $RESOURCE_GROUP --query id -o tsv)
IDENTITY_PRINCIPAL_ID=$(az identity show --name $IDENTITY_NAME --resource-group $RESOURCE_GROUP --query principalId -o tsv)

echo -e "${GREEN}✓${NC} Managed Identity created: $IDENTITY_NAME"
echo ""

# Grant Key Vault access to Managed Identity
echo -e "${BLUE}Granting Key Vault access to Managed Identity...${NC}"

az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $IDENTITY_PRINCIPAL_ID \
  --secret-permissions get list \
  --output none

echo -e "${GREEN}✓${NC} Key Vault access granted"
echo ""

# ============================================================================
# Output Configuration
# ============================================================================

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Setup Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Create .env file for local development
ENV_FILE=".env.azure"

cat > $ENV_FILE <<EOF
# Azure Infrastructure Configuration
# Generated: $(date)

# Azure Resource Information
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID
AZURE_RESOURCE_GROUP=$RESOURCE_GROUP
AZURE_LOCATION=$LOCATION

# Key Vault
AZURE_KEY_VAULT_URL=$KEYVAULT_URI
KEY_VAULT_URL=$KEYVAULT_URI

# Database
DB_HOST=$DB_HOST
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_ADMIN_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=true

# Application Insights
APPLICATION_INSIGHTS_CONNECTION_STRING=$APPINSIGHTS_CONNECTION_STRING

# Managed Identity
AZURE_MANAGED_IDENTITY_ID=$IDENTITY_ID
AZURE_MANAGED_IDENTITY_PRINCIPAL_ID=$IDENTITY_PRINCIPAL_ID

# JWT
JWT_SECRET=$JWT_SECRET

# Container Registry (if created)
CONTAINER_REGISTRY=$CONTAINER_REGISTRY
ACR_LOGIN_SERVER=${CONTAINER_REGISTRY}.azurecr.io
EOF

echo -e "${GREEN}Environment configuration saved to: ${NC}$ENV_FILE"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Review and add the .env.azure file to your .gitignore"
echo "  2. Copy required secrets to your application .env file"
echo "  3. Run database migrations:"
echo "     ${BLUE}npm run migrate${NC}"
echo "  4. Test Key Vault connection:"
echo "     ${BLUE}npm run test:keyvault${NC}"
echo "  5. Deploy your application using Azure App Service or AKS"
echo ""

echo -e "${BLUE}Key Vault Secrets Available:${NC}"
echo "  - DB-HOST, DB-PORT, DB-NAME, DB-USER, DB-PASSWORD"
echo "  - APPLICATION-INSIGHTS-CONNECTION-STRING"
echo "  - JWT-SECRET"
echo ""

echo -e "${YELLOW}Important:${NC}"
echo "  - The database password and JWT secret are stored ONLY in Key Vault"
echo "  - Use Managed Identity for production deployments (no credentials needed)"
echo "  - For local development, use service principal or Azure CLI authentication"
echo ""

echo -e "${GREEN}Setup completed successfully!${NC}"
