#!/bin/bash
# EMERGENCY DEPLOYMENT SCRIPT - RUN THIS NOW
# This will deploy to Azure Static Web Apps immediately

set -e

echo "🚀 EMERGENCY DEPLOYMENT TO AZURE STATIC WEB APPS"
echo "================================================"

# Build production
echo "Building production bundle..."
npm run build

# Deploy to Azure Static Web Apps using SWA CLI
echo "Deploying to Azure..."

# Option 1: Using Azure Static Web Apps CLI
if command -v swa &> /dev/null; then
    swa deploy ./dist \
        --env production \
        --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN"
else
    echo "⚠️  SWA CLI not installed. Installing..."
    npm install -g @azure/static-web-apps-cli

    swa deploy ./dist \
        --env production \
        --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN"
fi

echo "✅ Deployment complete!"
echo "🌐 Check: https://purple-river-0f465960f.3.azurestaticapps.net"
