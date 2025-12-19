#!/bin/bash
set -e

# Fleet Management System - Complete Production Deployment
# This script deploys the full Fleet system to Azure with all emulators and backend

echo "════════════════════════════════════════════════════════"
echo "  FLEET MANAGEMENT SYSTEM - COMPLETE DEPLOYMENT"
echo "════════════════════════════════════════════════════════"
echo ""

# Configuration
RESOURCE_GROUP="FleetManagement"
LOCATION="eastus2"
ACR_NAME="fleetregistry2025"
POSTGRES_SERVER="fleet-postgres-2025"
KEY_VAULT="fleetvault2025"
CONTAINER_ENV="fleet-env"
STATIC_WEB_APP="fleet-frontend"

# Get PostgreSQL password from Key Vault
echo "🔐 Retrieving secrets from Key Vault..."
POSTGRES_PASSWORD=$(az keyvault secret show --vault-name $KEY_VAULT --name POSTGRES-ADMIN-PASSWORD --query value -o tsv)
export POSTGRES_CONNECTION_STRING="postgresql://fleetadmin:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}.postgres.database.azure.com:5432/fleet_dev?sslmode=require"

# Login to ACR
echo ""
echo "🔐 Logging in to Azure Container Registry..."
az acr login --name $ACR_NAME

# Build and push backend API
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 1: Building and Pushing Backend API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd server
docker build -f Dockerfile.prod -t $ACR_NAME.azurecr.io/fleet-api:latest .
docker push $ACR_NAME.azurecr.io/fleet-api:latest
echo "✅ Backend API image pushed"

# Build and push OBD2 Emulator
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 Step 2: Building and Pushing OBD2 Emulator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker build -f emulators/Dockerfile.obd2 -t $ACR_NAME.azurecr.io/obd2-emulator:latest .
docker push $ACR_NAME.azurecr.io/obd2-emulator:latest
echo "✅ OBD2 Emulator image pushed"

# Build and push Radio Emulator
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📻 Step 3: Building and Pushing Radio Emulator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker build -f emulators/Dockerfile.radio -t $ACR_NAME.azurecr.io/radio-emulator:latest .
docker push $ACR_NAME.azurecr.io/radio-emulator:latest
echo "✅ Radio Emulator image pushed"

# Build and push Dispatch Emulator
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📞 Step 4: Building and Pushing Dispatch Emulator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker build -f emulators/Dockerfile.dispatch -t $ACR_NAME.azurecr.io/dispatch-emulator:latest .
docker push $ACR_NAME.azurecr.io/dispatch-emulator:latest
echo "✅ Dispatch Emulator image pushed"

cd ..

# Create Container Apps Environment if not exists
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏗️  Step 5: Setting Up Container Apps Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! az containerapp env show --name $CONTAINER_ENV --resource-group $RESOURCE_GROUP &>/dev/null; then
    az containerapp env create \
        --name $CONTAINER_ENV \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION
    echo "✅ Container Apps Environment created"
else
    echo "✅ Container Apps Environment already exists"
fi

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Deploy Backend API (dev environment)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Step 6: Deploying Backend API (Development)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

az containerapp create \
    --name fleet-api-dev \
    --resource-group $RESOURCE_GROUP \
    --environment $CONTAINER_ENV \
    --image $ACR_NAME.azurecr.io/fleet-api:latest \
    --registry-server $ACR_NAME.azurecr.io \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --target-port 3000 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 5 \
    --cpu 1.0 \
    --memory 2Gi \
    --env-vars \
        "NODE_ENV=development" \
        "DATABASE_URL=secretref:postgres-connection-string" \
        "AZURE_CLIENT_ID=secretref:azure-client-id" \
        "AZURE_TENANT_ID=secretref:azure-tenant-id" \
        "AZURE_CLIENT_SECRET=secretref:azure-client-secret" \
    --secrets \
        "postgres-connection-string=$POSTGRES_CONNECTION_STRING" \
        "azure-client-id=4c8641fa-3a56-448f-985a-e763017d70d7" \
        "azure-tenant-id=0ec14b81-7b82-45ee-8f3d-cbc31ced5347" \
        "azure-client-secret=aJN8Q~py5Vf.tH9xfhrhIBl.ofsRRvQB9owhGcdE" || \
az containerapp update \
    --name fleet-api-dev \
    --resource-group $RESOURCE_GROUP \
    --image $ACR_NAME.azurecr.io/fleet-api:latest

BACKEND_DEV_URL=$(az containerapp show --name fleet-api-dev --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
echo "✅ Backend API (dev) deployed: https://$BACKEND_DEV_URL"

# Deploy OBD2 Emulator
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 Step 7: Deploying OBD2 Emulator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

az containerapp create \
    --name fleet-obd2-emulator \
    --resource-group $RESOURCE_GROUP \
    --environment $CONTAINER_ENV \
    --image $ACR_NAME.azurecr.io/obd2-emulator:latest \
    --registry-server $ACR_NAME.azurecr.io \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --target-port 8081 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1Gi || \
az containerapp update \
    --name fleet-obd2-emulator \
    --resource-group $RESOURCE_GROUP \
    --image $ACR_NAME.azurecr.io/obd2-emulator:latest

OBD2_URL=$(az containerapp show --name fleet-obd2-emulator --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
echo "✅ OBD2 Emulator deployed: https://$OBD2_URL"

# Deploy Radio Emulator
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📻 Step 8: Deploying Radio Emulator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

az containerapp create \
    --name fleet-radio-emulator \
    --resource-group $RESOURCE_GROUP \
    --environment $CONTAINER_ENV \
    --image $ACR_NAME.azurecr.io/radio-emulator:latest \
    --registry-server $ACR_NAME.azurecr.io \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --target-port 8082 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1Gi || \
az containerapp update \
    --name fleet-radio-emulator \
    --resource-group $RESOURCE_GROUP \
    --image $ACR_NAME.azurecr.io/radio-emulator:latest

RADIO_URL=$(az containerapp show --name fleet-radio-emulator --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
echo "✅ Radio Emulator deployed: https://$RADIO_URL"

# Deploy Dispatch Emulator
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📞 Step 9: Deploying Dispatch Emulator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

az containerapp create \
    --name fleet-dispatch-emulator \
    --resource-group $RESOURCE_GROUP \
    --environment $CONTAINER_ENV \
    --image $ACR_NAME.azurecr.io/dispatch-emulator:latest \
    --registry-server $ACR_NAME.azurecr.io \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --target-port 8083 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1Gi || \
az containerapp update \
    --name fleet-dispatch-emulator \
    --resource-group $RESOURCE_GROUP \
    --image $ACR_NAME.azurecr.io/dispatch-emulator:latest

DISPATCH_URL=$(az containerapp show --name fleet-dispatch-emulator --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
echo "✅ Dispatch Emulator deployed: https://$DISPATCH_URL"

# Update Static Web App configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Step 10: Configuring Static Web App"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create staticwebapp.config.json with API and emulator URLs
cat > staticwebapp.config.json <<EOF
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "responseOverrides": {
    "401": {
      "rewrite": "/login"
    }
  },
  "globalHeaders": {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  },
  "platform": {
    "apiRuntime": "node:20"
  },
  "env": {
    "VITE_API_URL": "https://${BACKEND_DEV_URL}",
    "VITE_OBD2_EMULATOR_URL": "https://${OBD2_URL}",
    "VITE_RADIO_EMULATOR_URL": "https://${RADIO_URL}",
    "VITE_DISPATCH_EMULATOR_URL": "https://${DISPATCH_URL}",
    "VITE_USE_MOCK_DATA": "false"
  }
}
EOF

echo "✅ Static Web App configuration created"

# Display deployment summary
echo ""
echo "════════════════════════════════════════════════════════"
echo "  DEPLOYMENT COMPLETE"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🎉 All services deployed successfully!"
echo ""
echo "📋 DEPLOYMENT SUMMARY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend API (Dev):"
echo "  URL: https://$BACKEND_DEV_URL"
echo "  Health: https://$BACKEND_DEV_URL/health"
echo ""
echo "OBD2 Emulator:"
echo "  URL: https://$OBD2_URL"
echo "  WebSocket: wss://$OBD2_URL"
echo ""
echo "Radio Emulator:"
echo "  URL: https://$RADIO_URL"
echo "  WebSocket: wss://$RADIO_URL"
echo ""
echo "Dispatch Emulator:"
echo "  URL: https://$DISPATCH_URL"
echo "  WebSocket: wss://$DISPATCH_URL"
echo ""
echo "Frontend (Static Web App):"
echo "  URL: https://proud-bay-0fdc8040f.3.azurestaticapps.net"
echo ""
echo "PostgreSQL Server:"
echo "  Host: $POSTGRES_SERVER.postgres.database.azure.com"
echo "  Databases: fleet_dev, fleet_stage, fleet_production"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo "1. Run database seeding: cd server && npx ts-node scripts/seed-comprehensive.ts dev"
echo "2. Test backend API health check"
echo "3. Verify emulators are broadcasting data"
echo "4. Update frontend environment variables"
echo "5. Deploy frontend to Static Web App"
echo ""
echo "════════════════════════════════════════════════════════"
