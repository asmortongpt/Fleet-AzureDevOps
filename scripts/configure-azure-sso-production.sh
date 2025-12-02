#!/usr/bin/env bash
#
# Configure Azure Static Web App with SSO Environment Variables
# Fixes: "Failed to initiate authentication" error in production
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

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "CONFIGURE AZURE STATIC WEB APP SSO"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Configure Frontend Environment Variables
echo -e "${BLUE}[1/3]${NC} Configuring Frontend Environment Variables..."
echo ""

# Read from local .env file
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ FAIL${NC} - .env file not found"
    exit 1
fi

CLIENT_ID=$(grep "VITE_AZURE_AD_CLIENT_ID=" .env | cut -d'=' -f2)
TENANT_ID=$(grep "VITE_AZURE_AD_TENANT_ID=" .env | cut -d'=' -f2)
REDIRECT_URI="https://green-pond-0f040980f.3.azurestaticapps.net/auth/callback"

echo "CLIENT_ID: $CLIENT_ID"
echo "TENANT_ID: $TENANT_ID"
echo "REDIRECT_URI: $REDIRECT_URI"
echo ""

# Configure Azure Static Web App settings
echo "Setting VITE_AZURE_AD_CLIENT_ID..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "VITE_AZURE_AD_CLIENT_ID=$CLIENT_ID"

echo "Setting VITE_AZURE_AD_TENANT_ID..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "VITE_AZURE_AD_TENANT_ID=$TENANT_ID"

echo "Setting VITE_AZURE_AD_REDIRECT_URI..."
az staticwebapp appsettings set \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "VITE_AZURE_AD_REDIRECT_URI=$REDIRECT_URI"

echo -e "${GREEN}✓${NC} Frontend environment variables configured"
echo ""

# Step 2: Configure Backend Environment Variables
echo -e "${BLUE}[2/3]${NC} Configuring Backend Environment Variables..."
echo ""

# Backend secrets from api/.env
if [ -f "api/.env" ]; then
    CLIENT_SECRET=$(grep "AZURE_AD_CLIENT_SECRET=" api/.env | cut -d'=' -f2)
    JWT_SECRET=$(grep "JWT_SECRET=" api/.env | cut -d'=' -f2)
    CSRF_SECRET=$(grep "CSRF_SECRET=" api/.env | cut -d'=' -f2)

    echo "Setting AZURE_AD_CLIENT_ID..."
    az staticwebapp appsettings set \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --setting-names "AZURE_AD_CLIENT_ID=$CLIENT_ID"

    echo "Setting AZURE_AD_TENANT_ID..."
    az staticwebapp appsettings set \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --setting-names "AZURE_AD_TENANT_ID=$TENANT_ID"

    echo "Setting AZURE_AD_CLIENT_SECRET..."
    az staticwebapp appsettings set \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --setting-names "AZURE_AD_CLIENT_SECRET=$CLIENT_SECRET"

    echo "Setting JWT_SECRET..."
    az staticwebapp appsettings set \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --setting-names "JWT_SECRET=$JWT_SECRET"

    echo "Setting CSRF_SECRET..."
    az staticwebapp appsettings set \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --setting-names "CSRF_SECRET=$CSRF_SECRET"

    echo "Setting NODE_ENV=production..."
    az staticwebapp appsettings set \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --setting-names "NODE_ENV=production"

    echo -e "${GREEN}✓${NC} Backend environment variables configured"
else
    echo -e "${YELLOW}⚠ WARN${NC} - api/.env not found, skipping backend secrets"
fi
echo ""

# Step 3: Verify Configuration
echo -e "${BLUE}[3/3]${NC} Verifying Configuration..."
echo ""

az staticwebapp appsettings list \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties" -o json

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║  ✓ CONFIGURATION COMPLETE                             ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next Steps:"
echo "  1. Redeploy the application to pick up environment variables"
echo "  2. Test SSO: https://green-pond-0f040980f.3.azurestaticapps.net"
echo ""
