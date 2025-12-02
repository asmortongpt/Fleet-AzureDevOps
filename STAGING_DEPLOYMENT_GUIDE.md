# 🚀 Staging Deployment Guide

## Quick Start

This guide will deploy the Fleet Management System to a staging environment for testing before production.

---

## Prerequisites

### Required
- ✅ Azure CLI installed (`az --version`)
- ✅ Node.js 18+ installed
- ✅ PostgreSQL client installed (`psql`)
- ✅ Git repository access
- ✅ Azure subscription with permissions to create resources

### Azure Resources (Will be created)
- Resource Group: `fleet-staging-rg`
- PostgreSQL Server: `fleet-staging-db`
- App Service Plan: `fleet-staging-plan` (B2 tier)
- Web App (API): `fleet-staging-api`
- Static Web App (Frontend): `fleet-staging-app`
- Storage Account: `fleetstaging[random]`

### Estimated Cost
**Staging Environment**: ~$50-100/month
- PostgreSQL: ~$30/month (Burstable B2s)
- App Service: ~$20/month (B2 tier)
- Storage: ~$5/month
- Static Web App: Free tier

---

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Navigate to project directory
cd /home/user/Fleet

# 2. Run automated deployment script
./scripts/deploy-staging.sh

# 3. Wait for completion (5-10 minutes)
# Script will output all URLs and credentials
```

### Option 2: Manual Deployment

#### Step 1: Login to Azure
```bash
az login
az account set --subscription "Your Subscription Name"
```

#### Step 2: Create Resource Group
```bash
az group create \
  --name fleet-staging-rg \
  --location eastus
```

#### Step 3: Create Database
```bash
# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create PostgreSQL server
az postgres flexible-server create \
  --name fleet-staging-db \
  --resource-group fleet-staging-rg \
  --location eastus \
  --admin-user fleetadmin \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B2s \
  --version 14 \
  --public-access 0.0.0.0-255.255.255.255

# Enable extensions
az postgres flexible-server parameter set \
  --resource-group fleet-staging-rg \
  --server-name fleet-staging-db \
  --name azure.extensions \
  --value POSTGIS

# Create database
az postgres flexible-server db create \
  --resource-group fleet-staging-rg \
  --server-name fleet-staging-db \
  --database-name fleet_staging
```

#### Step 4: Run Migrations
```bash
# Install pgvector extension
PGPASSWORD="$DB_PASSWORD" psql \
  -h fleet-staging-db.postgres.database.azure.com \
  -U fleetadmin \
  -d fleet_staging \
  -c "CREATE EXTENSION IF NOT EXISTS postgis;" \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run all migrations
cd api/db/migrations
for f in *.sql; do
  echo "Running $f..."
  PGPASSWORD="$DB_PASSWORD" psql \
    -h fleet-staging-db.postgres.database.azure.com \
    -U fleetadmin \
    -d fleet_staging \
    -f "$f"
done
cd ../../..
```

#### Step 5: Deploy Backend
```bash
# Create App Service Plan
az appservice plan create \
  --name fleet-staging-plan \
  --resource-group fleet-staging-rg \
  --sku B2 \
  --is-linux

# Create Web App
az webapp create \
  --name fleet-staging-api \
  --resource-group fleet-staging-rg \
  --plan fleet-staging-plan \
  --runtime "NODE:18-lts"

# Configure environment variables
JWT_SECRET=$(openssl rand -hex 64)

az webapp config appsettings set \
  --name fleet-staging-api \
  --resource-group fleet-staging-rg \
  --settings \
    NODE_ENV=staging \
    DATABASE_HOST=fleet-staging-db.postgres.database.azure.com \
    DATABASE_PASSWORD="$DB_PASSWORD" \
    JWT_SECRET="$JWT_SECRET"

# Build and deploy
cd api
npm ci --production
npm run build
zip -r deploy.zip .
az webapp deployment source config-zip \
  --name fleet-staging-api \
  --resource-group fleet-staging-rg \
  --src deploy.zip
cd ..
```

#### Step 6: Deploy Frontend
```bash
# Build frontend
VITE_API_URL=https://fleet-staging-api.azurewebsites.net \
npm run build

# Create Static Web App
az staticwebapp create \
  --name fleet-staging-app \
  --resource-group fleet-staging-rg \
  --location eastus

# Upload build (manual or via GitHub Actions)
```

---

## Post-Deployment

### 1. Health Check
```bash
# Test API
curl https://fleet-staging-api.azurewebsites.net/health

# Expected response: {"status":"ok"}
```

### 2. Create Admin User
```bash
curl -X POST https://fleet-staging-api.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@capitaltechalliance.com",
    "password": "YourSecurePassword123!",
    "name": "System Administrator",
    "role": "admin"
  }'
```

### 3. Run Smoke Tests
```bash
# Test authentication
curl -X POST https://fleet-staging-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@capitaltechalliance.com",
    "password": "YourSecurePassword123!"
  }'

# Test API endpoints (with token)
curl https://fleet-staging-api.azurewebsites.net/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Configure Custom Domain (Optional)
```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name fleet-staging-api \
  --resource-group fleet-staging-rg \
  --hostname fleet-staging-api.capitaltechalliance.com

# Add SSL certificate
az webapp config ssl bind \
  --name fleet-staging-api \
  --resource-group fleet-staging-rg \
  --certificate-thumbprint YOUR_CERT_THUMBPRINT \
  --ssl-type SNI
```

### 5. Configure Monitoring
```bash
# Create Application Insights
az monitor app-insights component create \
  --app fleet-staging-insights \
  --location eastus \
  --resource-group fleet-staging-rg

# Link to Web App
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app fleet-staging-insights \
  --resource-group fleet-staging-rg \
  --query instrumentationKey -o tsv)

az webapp config appsettings set \
  --name fleet-staging-api \
  --resource-group fleet-staging-rg \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

---

## Testing Checklist

### Functional Testing
- [ ] User can register and login
- [ ] User can create vehicles
- [ ] User can create tasks
- [ ] User can report incidents
- [ ] Documents can be uploaded
- [ ] Alerts are generated
- [ ] Reports can be created

### Security Testing
- [ ] HTTPS enforced
- [ ] Authentication required
- [ ] CORS properly configured
- [ ] Rate limiting works
- [ ] Multi-tenant isolation verified

### Performance Testing
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] Frontend loads < 3s
- [ ] 100 concurrent users supported

### Integration Testing
- [ ] Email notifications work
- [ ] Push notifications work
- [ ] AI features functional
- [ ] Document Q&A works
- [ ] Reports generate correctly

---

## Troubleshooting

### API Not Responding
```bash
# Check logs
az webapp log tail --name fleet-staging-api --resource-group fleet-staging-rg

# Restart app
az webapp restart --name fleet-staging-api --resource-group fleet-staging-rg
```

### Database Connection Issues
```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group fleet-staging-rg \
  --name fleet-staging-db

# Add your IP
az postgres flexible-server firewall-rule create \
  --resource-group fleet-staging-rg \
  --name fleet-staging-db \
  --rule-name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### Environment Variables Not Set
```bash
# List all settings
az webapp config appsettings list \
  --name fleet-staging-api \
  --resource-group fleet-staging-rg
```

---

## Rollback Procedure

If issues are found in staging:

```bash
# 1. Stop the web app
az webapp stop --name fleet-staging-api --resource-group fleet-staging-rg

# 2. Deploy previous version
az webapp deployment source config-zip \
  --name fleet-staging-api \
  --resource-group fleet-staging-rg \
  --src previous-deploy.zip

# 3. Restart
az webapp restart --name fleet-staging-api --resource-group fleet-staging-rg
```

---

## Cleanup (After Testing)

To remove all staging resources:

```bash
# Delete entire resource group
az group delete --name fleet-staging-rg --yes --no-wait

# This will delete:
# - PostgreSQL database
# - App Service
# - Storage Account
# - All data
```

---

## Next Steps

After successful staging deployment and testing:

1. ✅ Complete all functional tests
2. ✅ Run security scans
3. ✅ Performance testing
4. ✅ Get stakeholder approval
5. ✅ Document any issues found
6. ✅ Fix critical issues
7. ✅ Prepare production deployment

See **DEPLOYMENT.md** for production deployment guide.

---

## Support

If you encounter issues:
1. Check troubleshooting section above
2. Review Azure portal logs
3. Check Application Insights
4. Review DEPLOYMENT.md
5. Contact support team

---

**Deployment Script**: `./scripts/deploy-staging.sh`
**Estimated Time**: 5-10 minutes
**Estimated Cost**: $50-100/month
