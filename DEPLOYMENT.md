# Fleet Management System - Production Deployment Guide

## 🚀 Quick Start

This guide covers deploying the Fleet Management System to production with enterprise-grade security and scalability.

## 📋 Prerequisites

### Required
- Node.js 18+ and npm 9+
- PostgreSQL 14+ with PostGIS extension
- SSL/TLS certificates
- Domain with DNS access

### Recommended (Production)
- Azure account (or AWS/GCP equivalent)
- Azure Key Vault for secrets management
- Azure Database for PostgreSQL
- Azure Storage for file uploads
- Application Insights for monitoring
- Redis for caching and sessions

## 🔐 Step 1: Secrets & Environment Setup

### Generate Secrets

```bash
# Generate cryptographically secure secrets
./scripts/generate-secrets.sh

# This creates .env.secrets.tmp with:
# - JWT secrets (512-bit)
# - Encryption keys (256-bit)
# - Database passwords
# - API keys
```

### Configure Environment

1. **Copy production template**:
   ```bash
   cp .env.production .env
   ```

2. **Fill in secrets** from `.env.secrets.tmp`

3. **Update all `YOUR_*` placeholders** with real values:
   - Azure OpenAI credentials
   - Database connection strings
   - Email/SMS provider keys
   - Storage credentials

4. **Store in Azure Key Vault** (recommended):
   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

   # Login
   az login

   # Create Key Vault
   az keyvault create \
     --name fleet-keyvault \
     --resource-group fleet-rg \
     --location eastus

   # Store secrets
   az keyvault secret set --vault-name fleet-keyvault --name JWT-SECRET --value "your-jwt-secret"
   az keyvault secret set --vault-name fleet-keyvault --name DB-PASSWORD --value "your-db-password"
   ```

5. **Delete temporary secrets**:
   ```bash
   rm .env.secrets.tmp
   ```

## 🗄️ Step 2: Database Setup

### Create PostgreSQL Database

```bash
# Using Azure Database for PostgreSQL
az postgres flexible-server create \
  --name fleet-db-prod \
  --resource-group fleet-rg \
  --location eastus \
  --admin-user fleetadmin \
  --admin-password "YOUR_SECURE_PASSWORD" \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose \
  --public-access 0.0.0.0 \
  --storage-size 128 \
  --version 14

# Enable PostGIS extension
az postgres flexible-server parameter set \
  --resource-group fleet-rg \
  --server-name fleet-db-prod \
  --name azure.extensions \
  --value POSTGIS

# Create database
az postgres flexible-server db create \
  --resource-group fleet-rg \
  --server-name fleet-db-prod \
  --database-name fleet_production
```

### Run Migrations

```bash
# Connect to database
psql "host=fleet-db-prod.postgres.database.azure.com \
      port=5432 \
      dbname=fleet_production \
      user=fleetadmin \
      password=YOUR_PASSWORD \
      sslmode=require"

# Run migrations in order
\i api/db/migrations/001_initial_schema.sql
\i api/db/migrations/002_authentication.sql
\i api/db/migrations/003_asset_task_incident_management.sql
\i api/db/migrations/004_alert_notification_system.sql
\i api/db/migrations/005_ai_ml_infrastructure.sql
\i api/db/migrations/006_document_management.sql
\i api/db/migrations/007_analytics_ml.sql
\i api/db/migrations/008_fuel_purchasing.sql
\i api/db/migrations/009_heavy_equipment.sql
\i api/db/migrations/010_mobile_push.sql
\i api/db/migrations/011_custom_reports.sql

# Enable pgvector for RAG
CREATE EXTENSION IF NOT EXISTS vector;

# Verify
\dt
\q
```

## 📦 Step 3: Build Application

### Backend

```bash
cd api

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Verify build
ls -la dist/
```

### Frontend

```bash
# Install dependencies
npm ci --production

# Build for production
npm run build

# Verify build
ls -la dist/
```

## ☁️ Step 4: Deploy to Azure (Option 1)

### Deploy Backend API

```bash
# Create App Service Plan
az appservice plan create \
  --name fleet-api-plan \
  --resource-group fleet-rg \
  --sku P1V2 \
  --is-linux

# Create Web App
az webapp create \
  --name fleet-api \
  --resource-group fleet-rg \
  --plan fleet-api-plan \
  --runtime "NODE:18-lts"

# Configure environment variables from Key Vault
az webapp config appsettings set \
  --name fleet-api \
  --resource-group fleet-rg \
  --settings \
    NODE_ENV=production \
    DATABASE_HOST=fleet-db-prod.postgres.database.azure.com \
    "@Microsoft.KeyVault(SecretUri=https://fleet-keyvault.vault.azure.net/secrets/JWT-SECRET/)"

# Enable managed identity
az webapp identity assign \
  --name fleet-api \
  --resource-group fleet-rg

# Grant Key Vault access
az keyvault set-policy \
  --name fleet-keyvault \
  --object-id <managed-identity-id> \
  --secret-permissions get list

# Deploy code
cd api
zip -r deploy.zip .
az webapp deployment source config-zip \
  --name fleet-api \
  --resource-group fleet-rg \
  --src deploy.zip

# Enable HTTPS only
az webapp update \
  --name fleet-api \
  --resource-group fleet-rg \
  --https-only true
```

### Deploy Frontend

```bash
# Create Static Web App
az staticwebapp create \
  --name fleet-app \
  --resource-group fleet-rg \
  --source https://github.com/your-org/fleet \
  --location eastus2 \
  --branch main \
  --app-location "/" \
  --output-location "dist"

# Configure custom domain
az staticwebapp hostname set \
  --name fleet-app \
  --resource-group fleet-rg \
  --hostname fleet.capitaltechalliance.com
```

## 🐳 Step 5: Deploy with Docker (Option 2)

### Build Images

```bash
# Backend
cd api
docker build -t fleet-api:latest .

# Frontend
cd ..
docker build -t fleet-frontend:latest .
```

### Deploy with Docker Compose

```bash
# Create docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to Azure Container Instances
az container create \
  --resource-group fleet-rg \
  --name fleet-api-container \
  --image fleet-api:latest \
  --dns-name-label fleet-api \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    DATABASE_HOST=fleet-db-prod.postgres.database.azure.com
```

## 🔒 Step 6: Security Hardening

### SSL/TLS Certificates

```bash
# Using Let's Encrypt with certbot
sudo certbot --nginx -d fleet.capitaltechalliance.com -d fleet-api.capitaltechalliance.com

# Or use Azure managed certificates (automatic)
az webapp config ssl bind \
  --name fleet-api \
  --resource-group fleet-rg \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

### Firewall Rules

```bash
# Restrict database access
az postgres flexible-server firewall-rule create \
  --resource-group fleet-rg \
  --name fleet-db-prod \
  --rule-name AllowAppService \
  --start-ip-address <app-service-ip> \
  --end-ip-address <app-service-ip>

# Configure WAF on Application Gateway
az network application-gateway waf-config set \
  --gateway-name fleet-gateway \
  --resource-group fleet-rg \
  --enabled true \
  --firewall-mode Prevention \
  --rule-set-version 3.1
```

### Enable Security Headers

Already configured in backend via Helmet middleware:
- HSTS
- X-Frame-Options
- X-Content-Type-Options
- CSP (Content Security Policy)

## 📊 Step 7: Monitoring & Logging

### Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app fleet-insights \
  --location eastus \
  --resource-group fleet-rg

# Get instrumentation key
az monitor app-insights component show \
  --app fleet-insights \
  --resource-group fleet-rg \
  --query instrumentationKey
```

### Log Analytics

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group fleet-rg \
  --workspace-name fleet-logs

# Configure alerts
az monitor metrics alert create \
  --name high-cpu-alert \
  --resource-group fleet-rg \
  --scopes /subscriptions/.../fleet-api \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m
```

## 🧪 Step 8: Testing

### Smoke Tests

```bash
# Health check
curl https://fleet-api.capitaltechalliance.com/health

# API test
curl -X POST https://fleet-api.capitaltechalliance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test"}'

# Frontend
curl https://fleet.capitaltechalliance.com
```

### Load Testing

```bash
# Using Artillery
cd api/tests/performance
artillery run load-test.yml --target https://fleet-api.capitaltechalliance.com
```

## 🔄 Step 9: CI/CD Setup

### GitHub Actions (Already configured)

`.github/workflows/deploy.yml` handles:
- Automated testing
- Security scanning
- Build and deploy
- Rollback on failure

### Enable Continuous Deployment

```bash
# Configure GitHub Actions secrets
gh secret set AZURE_CREDENTIALS --body "$(az ad sp create-for-rbac --sdk-auth)"
gh secret set DATABASE_URL --body "postgresql://..."
gh secret set JWT_SECRET --body "your-secret"
```

## 📈 Step 10: Post-Deployment

### Initial Data Setup

```bash
# Create admin user
curl -X POST https://fleet-api.capitaltechalliance.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@capitaltechalliance.com",
    "password":"SECURE_PASSWORD",
    "name":"System Administrator",
    "role":"admin"
  }'

# Create tenant
# Login to UI and create first tenant
```

### Configure Scheduled Jobs

Jobs automatically start with the application:
- Alert checker (every 5 minutes)
- Report scheduler (every hour)
- Push notification scheduler (every minute)
- ML model retraining (daily at 2 AM)

### Enable Features

1. **Upload training data** for ML models
2. **Index documents** into RAG system
3. **Configure alert rules** for critical events
4. **Set up notification templates**
5. **Create report templates**

## 🚨 Troubleshooting

### Application won't start

```bash
# Check logs
az webapp log tail --name fleet-api --resource-group fleet-rg

# Check environment variables
az webapp config appsettings list --name fleet-api --resource-group fleet-rg
```

### Database connection errors

```bash
# Test connectivity
psql "host=fleet-db-prod.postgres.database.azure.com ..."

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group fleet-rg \
  --name fleet-db-prod
```

### High memory usage

```bash
# Scale up
az appservice plan update \
  --name fleet-api-plan \
  --resource-group fleet-rg \
  --sku P2V2

# Enable auto-scaling
az monitor autoscale create \
  --resource-group fleet-rg \
  --resource fleet-api \
  --min-count 2 \
  --max-count 10 \
  --count 2
```

## 📚 Additional Resources

- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [PostgreSQL Best Practices](https://docs.microsoft.com/azure/postgresql/)
- [Security Best Practices](docs/SECURITY_SECRETS.md)
- [Testing Guide](docs/TESTING.md)

## ✅ Production Checklist

- [ ] All secrets generated and stored in Key Vault
- [ ] Database created with PostGIS and pgvector extensions
- [ ] All 11 migrations executed successfully
- [ ] SSL/TLS certificates configured
- [ ] Environment variables set (no placeholders)
- [ ] Firewall rules configured
- [ ] Monitoring and alerting enabled
- [ ] Backup and disaster recovery configured
- [ ] CI/CD pipeline tested
- [ ] Security scan passed
- [ ] Load testing completed
- [ ] Admin user created
- [ ] Custom domain configured
- [ ] DNS records updated
- [ ] Smoke tests passed
- [ ] Documentation reviewed
- [ ] Team trained on admin panel
- [ ] Support contacts configured

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________
