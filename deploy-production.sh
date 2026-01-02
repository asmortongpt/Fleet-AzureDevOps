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

# Google Maps API Key
az staticwebapp appsettings set \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --setting-names \
        "VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>" \
        "VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a" \
        "VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347" \
        "VITE_AZURE_AD_REDIRECT_URI=https://gray-flower-03a2a730f.3.azurestaticapps.net/auth/callback" \
        "VITE_API_BASE_URL=https://gray-flower-03a2a730f.3.azurestaticapps.net/api"

echo "✅ Environment variables configured"

# Build application
echo ""
echo "🔨 Building application..."
export VITE_GOOGLE_MAPS_API_KEY="<your-google-maps-api-key>"
export VITE_AZURE_AD_CLIENT_ID="baae0851-0c24-4214-8587-e3fabc46bd4a"
export VITE_AZURE_AD_TENANT_ID="0ec14b81-7b82-45ee-8f3d-cbc31ced5347"
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
