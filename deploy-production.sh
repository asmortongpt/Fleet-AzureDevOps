#!/bin/bash
set -e

echo "🚀 FLEET MANAGEMENT - PRODUCTION DEPLOYMENT"
echo "============================================="
echo ""

# Configuration
RESOURCE_GROUP="CTA-FLEET-PROD"
STATIC_WEB_APP_NAME="fleet-management-production"
LOCATION="eastus"
SKU="Standard"

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   App Name: $STATIC_WEB_APP_NAME"
echo "   Location: $LOCATION"
echo ""

# Check if Static Web App exists
echo "🔍 Checking if Static Web App exists..."
if az staticwebapp show --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "✅ Static Web App exists"
else
    echo "📦 Creating new Static Web App..."
    az staticwebapp create \
        --name $STATIC_WEB_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku $SKU \
        --source https://github.com/asmortongpt/Fleet \
        --branch main \
        --app-location "/" \
        --api-location "api" \
        --output-location "dist"
    echo "✅ Static Web App created"
fi

# Get deployment token
echo ""
echo "🔑 Getting deployment token..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo "❌ Failed to get deployment token"
    exit 1
fi
echo "✅ Deployment token retrieved"

# Set environment variables
echo ""
echo "⚙️  Configuring environment variables..."

# Load secrets from Azure Key Vault
GOOGLE_MAPS_API_KEY=$(az keyvault secret show --vault-name fleet-keyvault --name google-maps-api-key --query value -o tsv)
AZURE_AD_CLIENT_ID=$(az keyvault secret show --vault-name fleet-keyvault --name azure-ad-client-id --query value -o tsv)
AZURE_AD_TENANT_ID=$(az keyvault secret show --vault-name fleet-keyvault --name azure-ad-tenant-id --query value -o tsv)

az staticwebapp appsettings set \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --setting-names \
        "VITE_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY" \
        "VITE_AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID" \
        "VITE_AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID" \
        "VITE_AZURE_AD_REDIRECT_URI=https://gray-flower-03a2a730f.3.azurestaticapps.net/auth/callback" \
        "VITE_API_BASE_URL=https://gray-flower-03a2a730f.3.azurestaticapps.net/api"

echo "✅ Environment variables configured"

# Build application
echo ""
echo "🔨 Building application..."
# Use secrets loaded from Azure Key Vault
export VITE_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY"
export VITE_AZURE_AD_CLIENT_ID="$AZURE_AD_CLIENT_ID"
export VITE_AZURE_AD_TENANT_ID="$AZURE_AD_TENANT_ID"
export VITE_AZURE_AD_REDIRECT_URI="https://gray-flower-03a2a730f.3.azurestaticapps.net/auth/callback"
export VITE_API_BASE_URL="https://gray-flower-03a2a730f.3.azurestaticapps.net/api"

npm ci
npm run build

echo "✅ Build completed successfully"

# Deploy using Static Web Apps CLI
echo ""
echo "🚀 Deploying to Azure Static Web Apps..."

npx @azure/static-web-apps-cli deploy \
    --deployment-token $DEPLOYMENT_TOKEN \
    --app-location ./ \
    --output-location ./dist \
    --api-location ./api

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Production URL: https://gray-flower-03a2a730f.3.azurestaticapps.net"
echo "📊 Azure Portal: https://portal.azure.com"
echo ""
echo "🧪 Testing endpoints..."
echo ""

# Test main page
echo "Testing main page..."
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://gray-flower-03a2a730f.3.azurestaticapps.net)
echo "   Main page: HTTP $MAIN_STATUS"

# Test API
echo "Testing API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://gray-flower-03a2a730f.3.azurestaticapps.net/api/status || echo "000")
echo "   API: HTTP $API_STATUS"

echo ""
echo "✅ Deployment verification complete!"
