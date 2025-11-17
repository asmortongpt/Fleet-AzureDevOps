# Azure Setup Guide - Fleet Management System
## Complete Azure Infrastructure Configuration

**Estimated Time:** 2-3 hours
**Prerequisites:** Azure subscription with Owner/Contributor access
**Cost Estimate:** ~$90/month (dev) to $1,000/month (production)

---

## 🚀 Quick Start (Copy-Paste Commands)

### Step 1: Install Azure CLI (if not installed)
```bash
# macOS
brew install azure-cli

# Windows
winget install Microsoft.AzureCLI

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Step 2: Login to Azure
```bash
az login
az account list --output table
az account set --subscription "Your-Subscription-Name"
```

### Step 3: Set Variables
```bash
# Configuration variables
RESOURCE_GROUP="fleet-production-rg"
LOCATION="eastus2"
APP_NAME="fleet"
ENVIRONMENT="production"

# Verify
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
```

---

## 📦 COMPLETE SETUP SCRIPT

Save this as `azure-setup.sh` and run it:

```bash
#!/bin/bash
set -e  # Exit on error

# Colors for output
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Fleet Azure Infrastructure Setup${NC}"
echo "======================================="

# Variables
RESOURCE_GROUP="fleet-production-rg"
LOCATION="eastus2"
APP_NAME="fleet"
SQL_ADMIN="fleetadmin"
SQL_PASSWORD="FleetSecure123!@#"  # Change this!

# 1. Create Resource Group
echo -e "\n${YELLOW}Creating Resource Group...${NC}"
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# 2. Create Static Web App (Frontend)
echo -e "\n${YELLOW}Creating Static Web App...${NC}"
az staticwebapp create \
  --name ${APP_NAME}-webapp \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard

# 3. Create Function App (Backend API)
echo -e "\n${YELLOW}Creating Storage Account for Functions...${NC}"
STORAGE_NAME="${APP_NAME}storage$(date +%s | tail -c 5)"
az storage account create \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

echo -e "\n${YELLOW}Creating Function App...${NC}"
az functionapp create \
  --name ${APP_NAME}-api \
  --resource-group $RESOURCE_GROUP \
  --storage-account $STORAGE_NAME \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4

# 4. Create Azure SQL Database
echo -e "\n${YELLOW}Creating SQL Server...${NC}"
az sql server create \
  --name ${APP_NAME}-sql-server \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $SQL_ADMIN \
  --admin-password $SQL_PASSWORD

echo -e "\n${YELLOW}Creating SQL Database...${NC}"
az sql db create \
  --name ${APP_NAME}-db \
  --server ${APP_NAME}-sql-server \
  --resource-group $RESOURCE_GROUP \
  --service-objective S2 \
  --backup-storage-redundancy Local

echo -e "\n${YELLOW}Configuring Firewall...${NC}"
az sql server firewall-rule create \
  --server ${APP_NAME}-sql-server \
  --resource-group $RESOURCE_GROUP \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 5. Create Azure OpenAI Service
echo -e "\n${YELLOW}Creating Azure OpenAI Service...${NC}"
az cognitiveservices account create \
  --name ${APP_NAME}-openai \
  --resource-group $RESOURCE_GROUP \
  --location eastus \
  --kind OpenAI \
  --sku S0 \
  --yes

# 6. Create Application Insights
echo -e "\n${YELLOW}Creating Application Insights...${NC}"
az monitor app-insights component create \
  --app ${APP_NAME}-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# 7. Create Key Vault
echo -e "\n${YELLOW}Creating Key Vault...${NC}"
az keyvault create \
  --name ${APP_NAME}-keyvault-$(date +%s | tail -c 5) \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# 8. Create Storage Account (for files)
echo -e "\n${YELLOW}Creating Blob Storage...${NC}"
az storage account create \
  --name ${APP_NAME}files$(date +%s | tail -c 5) \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Get Connection Strings
echo -e "\n${GREEN}✅ Infrastructure Created!${NC}"
echo -e "\n${YELLOW}📋 Collecting Configuration...${NC}"

# Static Web App
SWA_URL=$(az staticwebapp show \
  --name ${APP_NAME}-webapp \
  --resource-group $RESOURCE_GROUP \
  --query "defaultHostname" -o tsv)

# SQL Connection String
SQL_CONNECTION="Server=tcp:${APP_NAME}-sql-server.database.windows.net,1433;Database=${APP_NAME}-db;User ID=${SQL_ADMIN};Password=${SQL_PASSWORD};Encrypt=true;Connection Timeout=30;"

# Application Insights
APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --app ${APP_NAME}-insights \
  --resource-group $RESOURCE_GROUP \
  --query "instrumentationKey" -o tsv)

# OpenAI
OPENAI_ENDPOINT=$(az cognitiveservices account show \
  --name ${APP_NAME}-openai \
  --resource-group $RESOURCE_GROUP \
  --query "properties.endpoint" -o tsv)

OPENAI_KEY=$(az cognitiveservices account keys list \
  --name ${APP_NAME}-openai \
  --resource-group $RESOURCE_GROUP \
  --query "key1" -o tsv)

# Output Configuration
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}   CONFIGURATION - Save these values!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Static Web App URL: https://$SWA_URL"
echo ""
echo "SQL Connection String:"
echo "$SQL_CONNECTION"
echo ""
echo "Application Insights Key: $APPINSIGHTS_KEY"
echo ""
echo "Azure OpenAI Endpoint: $OPENAI_ENDPOINT"
echo "Azure OpenAI Key: $OPENAI_KEY"
echo ""
echo -e "${YELLOW}⚠️  Save these to .env file!${NC}"
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Run: npm install"
echo "2. Create .env.production with above values"
echo "3. Deploy: npm run build && npm run deploy"
```

Make it executable and run:
```bash
chmod +x azure-setup.sh
./azure-setup.sh
```

---

## 🔐 Post-Setup Configuration

### 1. Configure Azure AD B2C (Authentication)

```bash
# Create Azure AD B2C tenant
az ad b2c create \
  --name fleet-auth \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Register application
az ad app create \
  --display-name "Fleet Management System" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "https://fleet-webapp.azurestaticapps.net/auth/callback"

# Get credentials
APP_ID=$(az ad app list --display-name "Fleet Management System" --query "[0].appId" -o tsv)
echo "Azure AD Application ID: $APP_ID"
```

### 2. Deploy Database Schema

```bash
# Connect to SQL Database
sqlcmd -S fleet-sql-server.database.windows.net \
  -U fleetadmin \
  -P FleetSecure123!@# \
  -d fleet-db \
  -i database-schema.sql

# Or use Azure Data Studio with connection string
```

### 3. Configure Secrets in Key Vault

```bash
# Store secrets
az keyvault secret set \
  --vault-name fleet-keyvault \
  --name "SQL-CONNECTION-STRING" \
  --value "$SQL_CONNECTION"

az keyvault secret set \
  --vault-name fleet-keyvault \
  --name "OPENAI-API-KEY" \
  --value "$OPENAI_KEY"

az keyvault secret set \
  --vault-name fleet-keyvault \
  --name "JWT-SECRET" \
  --value "$(openssl rand -base64 32)"
```

---

## 💰 COST ESTIMATION

### Development Environment (~$90/month)
```
Static Web App (Free tier):        $0
Function App (Consumption):        $10
SQL Database (Basic):              $5
Storage Account:                   $5
Azure OpenAI (light usage):        $50
Application Insights:              $20
Key Vault:                         $0
────────────────────────────────
TOTAL DEV:                         ~$90/month
```

### Production Environment (~$1,069/month)
```
Static Web App (Standard):         $9
Function App (Premium P1V2):       $146
SQL Database (S2):                 $149
Storage Account (Premium):         $50
Azure OpenAI (GPT-4):              $500
Application Insights:              $100
Front Door + WAF:                  $35
SignalR Service:                   $50
Key Vault:                         $0.03
Bandwidth:                         $30
────────────────────────────────
TOTAL PRODUCTION:                  ~$1,069/month
```

### Scale (1000+ vehicles) (~$3,000-5,000/month)
```
All services scale up 2-5x
```

---

## 🔍 VERIFY SETUP

```bash
# Check all resources
az resource list \
  --resource-group fleet-production-rg \
  --output table

# Test Static Web App
curl -I https://$(az staticwebapp show \
  --name fleet-webapp \
  --resource-group fleet-production-rg \
  --query "defaultHostname" -o tsv)

# Test SQL Connection
sqlcmd -S fleet-sql-server.database.windows.net -U fleetadmin -Q "SELECT @@VERSION"

# Test OpenAI
curl $OPENAI_ENDPOINT/openai/deployments?api-version=2023-05-15 \
  -H "api-key: $OPENAI_KEY"
```

---

## 🚨 TROUBLESHOOTING

### Issue: "Resource group already exists"
```bash
# Delete and recreate
az group delete --name fleet-production-rg --yes
# Then run setup again
```

### Issue: "SQL firewall blocking connection"
```bash
# Add your IP
MY_IP=$(curl -s ifconfig.me)
az sql server firewall-rule create \
  --server fleet-sql-server \
  --resource-group fleet-production-rg \
  --name "MyIP" \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### Issue: "OpenAI service not available in region"
```bash
# Try different regions: eastus, westeurope, etc.
az cognitiveservices account create \
  --name fleet-openai \
  --resource-group fleet-production-rg \
  --location eastus \
  --kind OpenAI \
  --sku S0
```

---

## 📋 CLEANUP (DELETE EVERYTHING)

**⚠️ WARNING: This deletes ALL resources!**

```bash
az group delete \
  --name fleet-production-rg \
  --yes \
  --no-wait

echo "Deleting resource group... (takes 5-10 minutes)"
```

---

**Document Version:** 1.0
**Last Updated:** November 7, 2025
