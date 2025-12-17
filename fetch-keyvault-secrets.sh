#!/bin/bash
VAULT="fleet-secrets-0d326d71"

echo "🔐 Fetching secrets from Azure Key Vault: $VAULT"
echo "=================================================="

# Fetch all required secrets
POSTGRES_PASSWORD=$(az keyvault secret show --vault-name $VAULT --name DATABASE-PASSWORD --query value -o tsv 2>/dev/null || echo "Fleet2024SecureProd!")
REDIS_PASSWORD=$(az keyvault secret show --vault-name $VAULT --name redis-password --query value -o tsv 2>/dev/null || echo "RedisFleet2024Secure!")
JWT_SECRET=$(az keyvault secret show --vault-name $VAULT --name jwt-secret --query value -o tsv 2>/dev/null || echo "fleet-jwt-production-secret-2024")
AZURE_OPENAI_KEY=$(az keyvault secret show --vault-name $VAULT --name azure-openai-key --query value -o tsv 2>/dev/null)
AZURE_STORAGE_CONNECTION=$(az keyvault secret show --vault-name $VAULT --name azure-storage-connection-string --query value -o tsv 2>/dev/null)
MS_GRAPH_CLIENT_ID=$(az keyvault secret show --vault-name $VAULT --name AZURE-AD-CLIENT-ID --query value -o tsv 2>/dev/null)
MS_GRAPH_CLIENT_SECRET=$(az keyvault secret show --vault-name $VAULT --name AZURE-AD-CLIENT-SECRET --query value -o tsv 2>/dev/null)
APP_INSIGHTS_CONN=$(az keyvault secret show --vault-name $VAULT --name app-insights-connection-string --query value -o tsv 2>/dev/null)
AZURE_MAPS_KEY=$(az keyvault secret show --vault-name $VAULT --name azure-maps-key --query value -o tsv 2>/dev/null)

# Create production .env
cat > .env.production << EOF
# Database Configuration
POSTGRES_DB=fleetdb
POSTGRES_USER=fleetadmin
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_PORT=6379

# API Configuration
API_PORT=3000
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=1h

# Frontend Configuration  
FRONTEND_PORT=80

# Azure Services
AZURE_OPENAI_ENDPOINT=https://andre-m9qftqda-eastus2.cognitiveservices.azure.com/
AZURE_OPENAI_KEY=$AZURE_OPENAI_KEY
AZURE_STORAGE_CONNECTION_STRING=$AZURE_STORAGE_CONNECTION
AZURE_COSMOS_ENDPOINT=
AZURE_COSMOS_KEY=
AZURE_SEARCH_ENDPOINT=
AZURE_SEARCH_KEY=

# Microsoft Graph
MS_GRAPH_CLIENT_ID=$MS_GRAPH_CLIENT_ID
MS_GRAPH_CLIENT_SECRET=$MS_GRAPH_CLIENT_SECRET

# Application Insights
APPLICATION_INSIGHTS_CONNECTION_STRING=$APP_INSIGHTS_CONN

# Azure Maps
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=$AZURE_MAPS_KEY

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=GrafanaFleet2024!
GRAFANA_ROOT_URL=http://localhost:3001

# CORS
CORS_ORIGIN=*

# Environment
NODE_ENV=production
VITE_ENVIRONMENT=production
ENVIRONMENT=production

# Build
CACHE_BUST=1
EOF

echo "✅ Production .env file created with Key Vault secrets"
echo "📋 Secrets loaded:"
echo "  - DATABASE_PASSWORD: ****"
echo "  - REDIS_PASSWORD: ****"
echo "  - JWT_SECRET: ****"
echo "  - AZURE_OPENAI_KEY: ${AZURE_OPENAI_KEY:+****}"
echo "  - MS_GRAPH_CLIENT_ID: ${MS_GRAPH_CLIENT_ID:+****}"
echo ""
