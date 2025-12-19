#!/bin/bash
set -e

# Fleet Backend Authentication API - Azure Deployment Script
# Generated: $(date +%Y-%m-%d)

echo "============================================"
echo "Fleet Backend Auth API - Azure Deployment"
echo "============================================"

# Configuration
RESOURCE_GROUP="fleet-production-rg"
LOCATION="eastus"
CONTAINER_NAME="fleet-auth-api"
IMAGE="fleetproductionacr.azurecr.io/fleet-auth-api:v1.0.0"
ACR_NAME="fleetproductionacr"
DNS_LABEL="fleet-auth-api-prod"

# Generate JWT secret if not set
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -base64 32)
  echo "Generated new JWT_SECRET"
fi

echo "Deploying Fleet Auth API..."
echo "Resource Group: $RESOURCE_GROUP"
echo "Image: $IMAGE"

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# Deploy to Azure Container Instances
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --image $IMAGE \
  --os-type Linux \
  --registry-login-server fleetproductionacr.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label $DNS_LABEL \
  --ports 3001 \
  --cpu 1 \
  --memory 1.5 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3001 \
    LOG_LEVEL=info \
    FRONTEND_URL=https://fleet.capitaltechalliance.com \
    JWT_ACCESS_EXPIRY=15m \
    JWT_REFRESH_EXPIRY=7d \
    AZURE_CLIENT_ID=ca507b25-c6c8-4f9d-89b5-8f95892e4f0a \
    AZURE_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347 \
    AZURE_REDIRECT_URI=https://fleet.capitaltechalliance.com/api/auth/callback \
    REDIS_HOST=20.85.39.60 \
    REDIS_PORT=6379 \
    COOKIE_DOMAIN=.capitaltechalliance.com \
  --secure-environment-variables \
    JWT_SECRET=$JWT_SECRET \
    AZURE_CLIENT_SECRET=aJN8Q~py5Vf.tH9xfhrhIBl.ofsRRvQB9owhGcdE \
  --restart-policy Always \
  --no-wait

echo ""
echo "Deployment initiated!"
echo "Container will be available at: http://$DNS_LABEL.eastus.azurecontainer.io:3001"
echo ""
echo "Check status with:"
echo "  az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query '{Status:provisioningState, FQDN:ipAddress.fqdn, IP:ipAddress.ip}' -o table"
echo ""
echo "View logs with:"
echo "  az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME"
echo ""
echo "JWT_SECRET (save this securely): $JWT_SECRET"
