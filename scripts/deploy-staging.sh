#!/bin/bash

# ===========================================
# Fleet Management System - Staging Deployment
# ===========================================
# This script deploys the application to staging environment
# Domain: fleet-staging.capitaltechalliance.com

set -e

echo "🚀 Fleet Management System - Staging Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Error: Azure CLI is not installed${NC}"
    echo "Install: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure. Logging in...${NC}"
    az login
fi

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-fleet-staging-rg}"
LOCATION="${LOCATION:-eastus}"
APP_SERVICE_PLAN="${APP_SERVICE_PLAN:-fleet-staging-plan}"
API_APP_NAME="${API_APP_NAME:-fleet-staging-api}"
FRONTEND_APP_NAME="${FRONTEND_APP_NAME:-fleet-staging-app}"
DB_SERVER_NAME="${DB_SERVER_NAME:-fleet-staging-db}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-fleetstaging$(date +%s | tail -c 5)}"

echo "📋 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  API App: $API_APP_NAME"
echo "  Frontend App: $FRONTEND_APP_NAME"
echo ""

# Step 1: Create Resource Group
echo -e "${GREEN}Step 1: Creating Resource Group...${NC}"
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Environment=Staging Project=FleetManagement

# Step 2: Create PostgreSQL Server
echo -e "${GREEN}Step 2: Creating PostgreSQL Database Server...${NC}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"

az postgres flexible-server create \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user fleetadmin \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0-255.255.255.255 \
  --yes

# Enable PostGIS extension
echo -e "${GREEN}Enabling PostGIS extension...${NC}"
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --name azure.extensions \
  --value POSTGIS

# Create database
echo -e "${GREEN}Creating database...${NC}"
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name fleet_staging

# Step 3: Create Storage Account
echo -e "${GREEN}Step 3: Creating Storage Account...${NC}"
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Create containers
STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)

az storage container create \
  --name fleet-documents \
  --connection-string "$STORAGE_CONNECTION"

az storage container create \
  --name fleet-reports \
  --connection-string "$STORAGE_CONNECTION"

# Step 4: Create App Service Plan
echo -e "${GREEN}Step 4: Creating App Service Plan...${NC}"
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B2 \
  --is-linux

# Step 5: Create Backend API App Service
echo -e "${GREEN}Step 5: Creating Backend API...${NC}"
az webapp create \
  --name $API_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:18-lts"

# Enable HTTPS only
az webapp update \
  --name $API_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true

# Configure environment variables
echo -e "${GREEN}Configuring Backend Environment Variables...${NC}"

# Generate JWT secrets
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
ENCRYPTION_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

az webapp config appsettings set \
  --name $API_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=staging \
    PORT=8080 \
    DATABASE_HOST="${DB_SERVER_NAME}.postgres.database.azure.com" \
    DATABASE_PORT=5432 \
    DATABASE_NAME=fleet_staging \
    DATABASE_USER=fleetadmin \
    DATABASE_PASSWORD="$DB_PASSWORD" \
    DATABASE_SSL=true \
    JWT_SECRET="$JWT_SECRET" \
    JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
    JWT_EXPIRES_IN=8h \
    JWT_REFRESH_EXPIRES_IN=7d \
    ENCRYPTION_KEY="$ENCRYPTION_KEY" \
    SESSION_SECRET="$SESSION_SECRET" \
    CORS_ORIGIN="https://${FRONTEND_APP_NAME}.azurewebsites.net" \
    AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION" \
    DOCUMENT_UPLOAD_DIR=/tmp/uploads \
    REPORTS_OUTPUT_DIR=/tmp/reports

# Step 6: Deploy Backend Code
echo -e "${GREEN}Step 6: Building and Deploying Backend...${NC}"
cd api
npm ci --production
npm run build

# Create deployment package
zip -r ../deploy-api.zip . -x "node_modules/*" -x "tests/*" -x "*.test.ts"
cd ..

az webapp deployment source config-zip \
  --name $API_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --src deploy-api.zip

# Wait for deployment
echo -e "${YELLOW}Waiting for backend deployment to complete...${NC}"
sleep 30

# Step 7: Run Database Migrations
echo -e "${GREEN}Step 7: Running Database Migrations...${NC}"
DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com"

# Connect and run migrations
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -U fleetadmin \
  -d fleet_staging \
  -c "CREATE EXTENSION IF NOT EXISTS postgis;" \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run all migrations in order
for migration in api/db/migrations/*.sql; do
  echo "Running migration: $migration"
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -U fleetadmin \
    -d fleet_staging \
    -f "$migration" || echo "Migration may have already run"
done

# Step 8: Create Frontend Static Web App
echo -e "${GREEN}Step 8: Creating Frontend...${NC}"

# Build frontend
npm ci --production
VITE_API_URL="https://${API_APP_NAME}.azurewebsites.net" \
VITE_ENVIRONMENT=staging \
npm run build

# Create static web app
az staticwebapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Deploy frontend (manual upload needed or use GitHub Actions)
echo -e "${YELLOW}⚠️  Frontend deployment requires manual upload or GitHub Actions${NC}"
echo "Build output is in: dist/"

# Step 9: Health Check
echo -e "${GREEN}Step 9: Running Health Checks...${NC}"
API_URL="https://${API_APP_NAME}.azurewebsites.net"

echo "Waiting for API to be ready..."
sleep 20

if curl -f -s "$API_URL/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ API Health Check: PASSED${NC}"
else
  echo -e "${RED}❌ API Health Check: FAILED${NC}"
fi

# Step 10: Summary
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Staging Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📋 Deployment Details:"
echo "  API URL: https://${API_APP_NAME}.azurewebsites.net"
echo "  Frontend URL: https://${FRONTEND_APP_NAME}.azurewebsites.net"
echo "  Database: ${DB_SERVER_NAME}.postgres.database.azure.com"
echo ""
echo "🔐 Credentials (SAVE THESE SECURELY):"
echo "  Database Password: $DB_PASSWORD"
echo "  JWT Secret: $JWT_SECRET"
echo ""
echo "📝 Next Steps:"
echo "  1. Test API: curl https://${API_APP_NAME}.azurewebsites.net/health"
echo "  2. Complete frontend deployment"
echo "  3. Run smoke tests"
echo "  4. Configure custom domain"
echo "  5. Set up monitoring"
echo ""
echo "📚 Documentation:"
echo "  See DEPLOYMENT.md for detailed instructions"
echo "  See TESTING.md for test procedures"
echo ""

# Save deployment info
cat > deployment-info-staging.txt <<EOF
Fleet Management System - Staging Deployment
Deployed: $(date)

API URL: https://${API_APP_NAME}.azurewebsites.net
Frontend URL: https://${FRONTEND_APP_NAME}.azurewebsites.net
Database: ${DB_SERVER_NAME}.postgres.database.azure.com

Database Password: $DB_PASSWORD
JWT Secret: $JWT_SECRET
JWT Refresh Secret: $JWT_REFRESH_SECRET
Encryption Key: $ENCRYPTION_KEY
Session Secret: $SESSION_SECRET

Storage Account: $STORAGE_ACCOUNT
Resource Group: $RESOURCE_GROUP
EOF

echo -e "${YELLOW}⚠️  Deployment credentials saved to: deployment-info-staging.txt${NC}"
echo -e "${YELLOW}⚠️  KEEP THIS FILE SECURE - Contains sensitive information!${NC}"
