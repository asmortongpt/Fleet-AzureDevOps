# Fleet-CTA Production Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Environment Configuration](#environment-configuration)
5. [Infrastructure Setup](#infrastructure-setup)
6. [Database Migration](#database-migration)
7. [Backend Deployment](#backend-deployment)
8. [Frontend Deployment](#frontend-deployment)
9. [Verification Steps](#verification-steps)
10. [Post-Deployment Configuration](#post-deployment-configuration)
11. [Rollback Procedures](#rollback-procedures)
12. [Support & Escalation](#support--escalation)

---

## Overview

Fleet-CTA is an enterprise fleet management system deployed to Azure cloud infrastructure. This guide covers moving the complete application from development to production.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Cloud Infrastructure              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Azure Static Web Apps (Frontend)             │  │
│  │  - React 19 / Vite 7 / TailwindCSS                 │  │
│  │  - Served globally via CDN                         │  │
│  │  - Auto-scaling, DDoS protection                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────────┐ │
│  │    Azure Container Instances / App Service           │ │
│  │          (Backend API - Node.js/Express)            │ │
│  │  - Port 3001 (internal), 443 (HTTPS)               │ │
│  │  - 118+ Drizzle migrations                         │ │
│  │  - Bull/BullMQ background jobs                     │ │
│  │  - WebSocket support for real-time data            │ │
│  └─────────────────────────────────────────────────────────┘ │
│           │                              │                    │
│  ┌────────▼──────────┐        ┌─────────▼─────────────────┐ │
│  │   PostgreSQL      │        │   Redis Cache Layer      │ │
│  │   Azure Database   │        │   6379 (protected)       │ │
│  │   - 100+ tables    │        │   - Session storage      │ │
│  │   - 20 connections │        │   - Rate limiting        │ │
│  │   - Backups: daily │        │   - Pub/Sub messaging    │ │
│  └────────────────────┘        └──────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Azure Services (Supporting)                     │  │
│  │  - Azure AD (OIDC/JWT auth)                         │  │
│  │  - Key Vault (secrets management)                   │  │
│  │  - Application Insights (monitoring)                │  │
│  │  - OpenTelemetry (distributed tracing)              │  │
│  │  - Blob Storage (file uploads)                      │  │
│  │  - Service Bus (async messaging)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What Gets Deployed

- **Frontend**: React SPA → Azure Static Web Apps (global CDN)
- **Backend API**: Node.js Express → Azure App Service or Container Instances
- **Database**: PostgreSQL → Azure Database for PostgreSQL
- **Cache**: Redis → Azure Cache for Redis
- **Authentication**: Azure AD integration (OIDC + JWT)
- **Secrets**: Azure Key Vault
- **Monitoring**: Application Insights + OpenTelemetry

---

## Prerequisites

### Required Access & Credentials

You must have the following before starting deployment:

1. **Azure Subscription Access**
   - Owner or Contributor role on the subscription
   - Verified email address
   - API access enabled

2. **GitHub Access**
   - Write access to the repository
   - GitHub Actions enabled
   - PAT (Personal Access Token) with `repo` and `workflow` scopes

3. **Azure DevOps (optional, for pipeline-based deployment)**
   - Project creation ability
   - Service connection configuration rights

4. **Required Tools (Local)**
   - Node.js 20+ (`node --version`)
   - npm 10+ (`npm --version`)
   - Azure CLI 2.50+ (`az --version`)
   - Docker 20.10+ (for container deployment)
   - Git 2.40+

### Required Software & Libraries

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20 LTS | Backend runtime |
| React | 19.x | Frontend framework |
| PostgreSQL | 16.x | Database |
| Redis | 7.x | Cache layer |
| Express | 4.x | API framework |
| Drizzle ORM | Latest | Database abstraction |
| TypeScript | 5.x | Type safety |

### Azure Resource Requirements

- **Azure Subscription**: Standard tier with pay-as-you-go or commitment
- **Service Principal**: For CI/CD pipeline automation (optional)
- **SSH Keys**: For database access (optional, recommended)
- **IP Whitelist**: If using firewall rules (document your office/VPN IPs)

---

## Pre-Deployment Checklist

### Code Quality Checks (Run Locally First)

```bash
# 1. Verify all tests pass
npm test
npm run test:coverage

# 2. Type check - no TypeScript errors
npm run typecheck

# 3. Lint - no code style violations
npm run lint

# 4. Backend tests
cd api
npm test
npm run test:integration
cd ..

# 5. Security audit - no critical vulnerabilities
npm audit
cd api && npm audit && cd ..
```

### Infrastructure Readiness

- [ ] Azure subscription created and configured
- [ ] Resource groups created: `fleet-prod-rg`, `fleet-db-rg`, `fleet-secrets-rg`
- [ ] Network isolation configured (VNet, subnets)
- [ ] SSL/TLS certificates obtained (Let's Encrypt or Azure-managed)
- [ ] Backup storage account created
- [ ] Monitoring dashboards pre-configured
- [ ] Disaster recovery plan documented

### Backup & Snapshot Creation

```bash
# Create backup before deployment
# (if upgrading existing database)
db:snapshot $(date +%Y%m%d-%H%M%S)-pre-prod-deploy

# Export database schema
pg_dump --schema-only fleet_db > schema-backup.sql

# Snapshot application state
git tag -a "pre-prod-$(date +%Y%m%d)" -m "Pre-production deployment snapshot"
git push origin "pre-prod-$(date +%Y%m%d)"
```

### Security & Secrets Checklist

- [ ] All secrets stored in Azure Key Vault (not in code)
- [ ] .env file never committed to Git
- [ ] Database credentials rotated (minimum 32 chars, special characters)
- [ ] Redis password set (minimum 32 chars)
- [ ] JWT signing key generated (minimum 64 chars)
- [ ] API keys for external services configured
- [ ] Azure AD tenant verified and configured
- [ ] CORS origins whitelist configured
- [ ] Rate limiting thresholds set

### Performance Baselines (Document These)

Before deployment, document current local performance:

```bash
# Run performance benchmarks
npm run build  # Note: build time (target: < 2 minutes)
du -sh dist    # Size of built frontend (target: < 20MB)

# Database query performance
cd api
npm run db:benchmark  # Note: query times
cd ..

# API response times (use Apache Bench or similar)
ab -n 1000 -c 10 http://localhost:3001/api/health
```

---

## Environment Configuration

### Azure Key Vault Setup

Create a Key Vault to store all secrets:

```bash
# Create Key Vault
az keyvault create \
  --name fleet-secrets-prod-xyz \
  --resource-group fleet-prod-rg \
  --location eastus2 \
  --enable-purge-protection

# Grant current user admin access
az keyvault set-policy \
  --name fleet-secrets-prod-xyz \
  --resource-group fleet-prod-rg \
  --upn $(az account show --query user.name -o tsv) \
  --secret-permissions get list set delete

# Grant App Service access to Key Vault
# (do this after creating the App Service)
```

### Store Secrets in Key Vault

```bash
# Database credentials
az keyvault secret set \
  --vault-name fleet-secrets-prod-xyz \
  --name DATABASE-PASSWORD \
  --value "$(openssl rand -base64 32)"

# Redis credentials
az keyvault secret set \
  --vault-name fleet-secrets-prod-xyz \
  --name REDIS-PASSWORD \
  --value "$(openssl rand -base64 32)"

# JWT signing key
az keyvault secret set \
  --vault-name fleet-secrets-prod-xyz \
  --name JWT-SECRET \
  --value "$(openssl rand -base64 64)"

# Azure AD credentials
az keyvault secret set \
  --vault-name fleet-secrets-prod-xyz \
  --name AZURE-AD-CLIENT-ID \
  --value "<your-client-id>"

az keyvault secret set \
  --vault-name fleet-secrets-prod-xyz \
  --name AZURE-AD-CLIENT-SECRET \
  --value "<your-client-secret>"

# API keys
az keyvault secret set \
  --vault-name fleet-secrets-prod-xyz \
  --name GOOGLE-MAPS-API-KEY \
  --value "<your-api-key>"

az keyvault secret set \
  --vault-name fleet-secrets-prod-xyz \
  --name AZURE-OPENAI-KEY \
  --value "<your-openai-key>"
```

### Environment Variables Template

Create `.env.production` (DO NOT COMMIT):

```bash
# ============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ============================================================================

# Environment
NODE_ENV=production
ENVIRONMENT=production

# ============================================================================
# Azure & Infrastructure
# ============================================================================
AZURE_KEY_VAULT_URI=https://fleet-secrets-prod-xyz.vault.azure.net/
AZURE_CLIENT_ID=<from-key-vault>
AZURE_TENANT_ID=<from-key-vault>
AZURE_SUBSCRIPTION_ID=<your-subscription-id>
AZURE_RESOURCE_GROUP=fleet-prod-rg

# ============================================================================
# Database - PostgreSQL
# ============================================================================
DATABASE_HOST=fleet-db-prod.postgres.database.azure.com
DATABASE_PORT=5432
DATABASE_NAME=fleet_production
DATABASE_USER=fleet_webapp_user
DATABASE_PASSWORD=<from-key-vault>
DATABASE_SSL=true
DB_POOL_SIZE=30
DB_HEALTH_CHECK_INTERVAL=60000
DB_LOG_QUERIES=false  # Disable in production

# ============================================================================
# Redis Cache
# ============================================================================
REDIS_HOST=fleet-redis-prod.redis.cache.windows.net
REDIS_PORT=6380  # Azure Redis uses 6380 for TLS
REDIS_PASSWORD=<from-key-vault>
REDIS_TLS=true
REDIS_URL=rediss://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}

# ============================================================================
# Application Configuration
# ============================================================================
PORT=3001
HOST=0.0.0.0  # Listen on all interfaces in container
API_BASE_URL=https://fleet.capitaltechalliance.com/api
FRONTEND_URL=https://fleet.capitaltechalliance.com

# CORS - whitelist production domain only
CORS_ORIGIN=https://fleet.capitaltechalliance.com

# Session
SESSION_SECRET=<from-key-vault>  # Use 64+ char random string
SESSION_TIMEOUT=3600000  # 1 hour in milliseconds

# ============================================================================
# Authentication - Azure AD
# ============================================================================
AZURE_AD_CLIENT_ID=<from-key-vault>
AZURE_AD_CLIENT_SECRET=<from-key-vault>
AZURE_AD_TENANT_ID=<from-key-vault>
AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback

# JWT
JWT_SECRET=<from-key-vault>  # Use 64+ char random string
JWT_EXPIRY=86400  # 24 hours in seconds
JWT_REFRESH_EXPIRY=604800  # 7 days in seconds

# ============================================================================
# Monitoring & Observability
# ============================================================================
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=0.1  # Sample 10% of transactions
SENTRY_TRACE_SAMPLE_RATE=0.1

APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;...
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=https://fleet-app-insights.monitor.azure.com

# ============================================================================
# Logging
# ============================================================================
LOG_LEVEL=info  # debug, info, warn, error, fatal
LOG_FORMAT=json  # json for structured logging in production
LOG_FILE=/var/log/fleet-api/app.log
LOG_MAX_SIZE=100M
LOG_MAX_FILES=10

# ============================================================================
# Security
# ============================================================================
BCRYPT_ROUNDS=12  # Higher = more secure but slower (production should be 12+)
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Per window per IP
RATE_LIMIT_STORE=redis  # Use Redis for distributed rate limiting

# ============================================================================
# External Services
# ============================================================================
GOOGLE_MAPS_API_KEY=<from-key-vault>
GOOGLE_MAPS_MAX_REQUESTS_PER_SECOND=10

AZURE_OPENAI_ENDPOINT=https://fleet-openai-prod.openai.azure.com/
AZURE_OPENAI_KEY=<from-key-vault>
AZURE_OPENAI_DEPLOYMENT_ID=gpt-4-turbo

AZURE_VISION_ENDPOINT=https://fleet-vision-prod.cognitiveservices.azure.com/
AZURE_VISION_KEY=<from-key-vault>

# ============================================================================
# Email (Azure Communication Services or SMTP)
# ============================================================================
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=noreply@capitaltechalliance.com
SMTP_PASSWORD=<from-key-vault>
SMTP_FROM_NAME="Fleet Management System"
SMTP_FROM_EMAIL=noreply@capitaltechalliance.com

# ============================================================================
# Feature Flags
# ============================================================================
ENABLE_DEBUG_LOGGING=false
ENABLE_HOT_RELOAD=false
ENABLE_MOCK_DATA=false
ENABLE_API_DOCS=false  # Hide API docs in production
ENABLE_TELEMETRY_EXPORT=true
ENABLE_AUDIT_LOGGING=true
ENABLE_RATE_LIMITING=true
ENABLE_CACHING=true

# ============================================================================
# Performance Tuning
# ============================================================================
MAX_REQUEST_SIZE=50mb
MAX_JSON_SIZE=50mb
COMPRESSION_ENABLED=true
COMPRESSION_THRESHOLD=1024  # bytes
CACHE_TTL_USERS=300  # 5 minutes
CACHE_TTL_VEHICLES=60  # 1 minute
CACHE_TTL_CONFIG=3600  # 1 hour

# ============================================================================
# File Upload (Azure Blob Storage)
# ============================================================================
STORAGE_ACCOUNT_NAME=fleetprodstg
STORAGE_ACCOUNT_KEY=<from-key-vault>
STORAGE_CONTAINER_VEHICLE_PHOTOS=vehicle-photos
STORAGE_CONTAINER_DOCUMENTS=documents
STORAGE_CONTAINER_LOGS=logs
STORAGE_MAX_FILE_SIZE=100mb

# ============================================================================
# Deployment Information
# ============================================================================
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD)
DEPLOYED_BY=<deployment-user>
DEPLOYMENT_TIMESTAMP=$(date)
```

---

## Infrastructure Setup

### Create Azure Resources

```bash
# Set variables
RESOURCE_GROUP="fleet-prod-rg"
LOCATION="eastus2"
APP_NAME="fleet-api-prod"
DB_NAME="fleet-db-prod"
REDIS_NAME="fleet-redis-prod"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create PostgreSQL Database
az postgres server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_NAME \
  --location $LOCATION \
  --admin-user cloudadmin \
  --admin-password $(openssl rand -base64 32) \
  --sku-name B_Gen5_2 \
  --storage-size 51200 \
  --backup-retention 35 \
  --geo-redundant-backup Enabled \
  --infrastructure-encryption Enabled

# Configure PostgreSQL firewall for Azure services
az postgres server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_NAME \
  --name "AllowAzureServices" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create Redis Cache
az redis create \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --location $LOCATION \
  --sku Premium \
  --vm-size p1 \
  --enable-non-ssl-port false \
  --minimum-tls-version 1.2

# Create Storage Account for logs and file uploads
az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name "fleetprodstg" \
  --location $LOCATION \
  --sku Standard_GRS \
  --kind StorageV2 \
  --https-only true \
  --min-tls-version TLS1_2

# Create containers in storage account
az storage container create \
  --account-name "fleetprodstg" \
  --name "vehicle-photos"

az storage container create \
  --account-name "fleetprodstg" \
  --name "documents"

az storage container create \
  --account-name "fleetprodstg" \
  --name "logs"

# Create Key Vault (if not already created)
az keyvault create \
  --name "fleet-secrets-prod-xyz" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-purge-protection
```

### Create App Service for Backend

```bash
# Create App Service Plan
az appservice plan create \
  --name "fleet-api-plan" \
  --resource-group $RESOURCE_GROUP \
  --sku B2 \
  --is-linux

# Create App Service
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "fleet-api-plan" \
  --name $APP_NAME \
  --runtime "node|20-lts"

# Configure App Service
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    NODE_ENV="production" \
    WEBSITE_NODE_DEFAULT_VERSION="20-lts" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"

# Enable logging
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --docker-container-logging filesystem \
  --level verbose
```

### Network Security & Firewall

```bash
# Add your IP to PostgreSQL firewall (if not using Azure services only)
MY_IP=$(curl -s https://api.ipify.org)
az postgres server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_NAME \
  --name "MyIP" \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP

# Configure NSG rules for Redis
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name "fleet-nsg" \
  --name "AllowRedisFromAppService" \
  --priority 100 \
  --access Allow \
  --protocol Tcp \
  --direction Inbound \
  --source-address-prefixes "10.0.0.0/8" \
  --destination-port-ranges "6380"
```

---

## Database Migration

### Initialize Database Schema

```bash
# 1. Create databases
psql -h fleet-db-prod.postgres.database.azure.com \
  -U cloudadmin@fleet-db-prod \
  -d postgres \
  -c "CREATE DATABASE fleet_production;"

# 2. Create database users
psql -h fleet-db-prod.postgres.database.azure.com \
  -U cloudadmin@fleet-db-prod \
  -d fleet_production \
  << EOF
-- Web app user (for normal operations)
CREATE USER fleet_webapp_user WITH PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE fleet_production TO fleet_webapp_user;

-- Read-only user (for reporting/analytics)
CREATE USER fleet_readonly_user WITH PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE fleet_production TO fleet_readonly_user;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO fleet_webapp_user;
GRANT USAGE ON SCHEMA public TO fleet_readonly_user;
GRANT CREATE ON SCHEMA public TO fleet_webapp_user;

-- Grant table permissions to webapp user (write)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fleet_webapp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fleet_webapp_user;

-- Grant table permissions to readonly user (read-only)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO fleet_readonly_user;

-- Set defaults for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fleet_webapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO fleet_readonly_user;
EOF

# 3. Run Drizzle migrations (from api/ directory)
cd api
npm install
DATABASE_HOST=fleet-db-prod.postgres.database.azure.com \
DATABASE_USER=fleet_webapp_user \
DATABASE_PASSWORD=secure_password_here \
DATABASE_NAME=fleet_production \
npm run migrate:push

# 4. Seed initial data (optional, if needed)
npm run seed

# 5. Verify schema was created
psql -h fleet-db-prod.postgres.database.azure.com \
  -U fleet_webapp_user \
  -d fleet_production \
  -c "\dt"  # List all tables
```

### Database Backup Strategy

```bash
# Create automated backup script
cat > backup-database.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/fleet-db"
DB_HOST="${DATABASE_HOST}"
DB_NAME="${DATABASE_NAME}"
DB_USER="${DATABASE_USER}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/fleet_${TIMESTAMP}.sql"

mkdir -p $BACKUP_DIR

echo "Starting backup of $DB_NAME..."
pg_dump \
  --host=$DB_HOST \
  --username=$DB_USER \
  --verbose \
  --compress=9 \
  $DB_NAME > "${BACKUP_FILE}.gz"

echo "Backup completed: ${BACKUP_FILE}.gz"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Cleanup completed"
EOF

chmod +x backup-database.sh

# Schedule as cron job (run daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-database.sh") | crontab -
```

---

## Backend Deployment

### Build Backend

```bash
# From root directory
cd api

# Install dependencies
npm ci  # Clean install (use package-lock.json)

# Type check
npm run typecheck

# Run tests
npm test
npm run test:integration

# Build for production
npm run build  # Creates dist/server.js

# Verify build size
du -sh dist/

cd ..
```

### Deploy to Azure App Service

#### Option A: Using GitHub Actions (Recommended)

The repository includes `.github/workflows/production-deployment.yml` which:
1. Runs quality gates (TypeScript, linting, tests)
2. Builds frontend and backend
3. Uploads to Azure Static Web Apps
4. Deploys backend to App Service
5. Runs post-deployment verification

**To trigger deployment:**

```bash
# Push to main branch (auto-triggers)
git add .
git commit -m "feat: deploy to production"
git push origin main

# Or manually trigger via GitHub Actions
# Go to Actions → Production Deployment → Run workflow
```

#### Option B: Manual Azure CLI Deployment

```bash
# Build application
npm run build
cd api && npm run build && cd ..

# ZIP the backend dist
cd api/dist
zip -r ../../fleet-api.zip .
cd ../../

# Deploy to App Service
az webapp up \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --runtime "node|20-lts" \
  --remote fleet-api.zip

# Configure App Service environment variables
az webapp config appsettings set \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --settings \
    NODE_ENV="production" \
    PORT="3001" \
    DATABASE_HOST="fleet-db-prod.postgres.database.azure.com" \
    DATABASE_NAME="fleet_production" \
    DATABASE_USER="fleet_webapp_user" \
    DATABASE_PASSWORD="@Microsoft.KeyVault(SecretUri=https://fleet-secrets-prod-xyz.vault.azure.net/secrets/DATABASE-PASSWORD/)" \
    REDIS_HOST="fleet-redis-prod.redis.cache.windows.net" \
    REDIS_PASSWORD="@Microsoft.KeyVault(SecretUri=https://fleet-secrets-prod-xyz.vault.azure.net/secrets/REDIS-PASSWORD/)" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://fleet-secrets-prod-xyz.vault.azure.net/secrets/JWT-SECRET/)"

# Restart App Service
az webapp restart \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# Tail logs
az webapp log tail \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod
```

#### Option C: Docker Container Deployment

```bash
# Build Docker image
docker build -f api/Dockerfile -t fleet-api:prod .

# Tag for Azure Container Registry
docker tag fleet-api:prod fleet-acr.azurecr.io/fleet-api:prod

# Push to registry
az acr login --name fleet-acr
docker push fleet-acr.azurecr.io/fleet-api:prod

# Deploy to Container Instances
az container create \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --image fleet-acr.azurecr.io/fleet-api:prod \
  --cpu 2 \
  --memory 4 \
  --port 3001 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3001
```

---

## Frontend Deployment

### Build Frontend

```bash
# From root directory
npm ci  # Clean install

# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Build for production
npm run build  # Creates dist/ directory

# Verify build
ls -lh dist/
du -sh dist/
```

### Deploy to Azure Static Web Apps

#### Option A: GitHub Actions (Recommended)

The workflow in `.github/workflows/production-deployment.yml` automatically:
1. Builds the frontend with optimized settings
2. Uploads to Azure Static Web Apps
3. Purges CDN cache
4. Verifies deployment

**To trigger:**

```bash
git push origin main
```

#### Option B: Using Static Web Apps CLI

```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy \
  --app-location . \
  --api-location api \
  --output-location dist \
  --deployment-token $AZURE_STATIC_WEB_APPS_DEPLOYMENT_TOKEN

# Verify deployment
curl https://fleet.capitaltechalliance.com/
```

#### Option C: Azure CLI Deployment

```bash
# Get deployment token from Azure Portal
# Settings → Deployment tokens → Click "Manage"

# Create deployment script
cat > deploy-frontend.sh << 'EOF'
#!/bin/bash
set -e

DEPLOYMENT_TOKEN="$1"
APP_LOCATION="."
API_LOCATION="api"
OUTPUT_LOCATION="dist"

npm ci --legacy-peer-deps
npm run build

swa deploy \
  --app-location $APP_LOCATION \
  --api-location $API_LOCATION \
  --output-location $OUTPUT_LOCATION \
  --deployment-token $DEPLOYMENT_TOKEN

echo "Deployment completed successfully!"
EOF

chmod +x deploy-frontend.sh
./deploy-frontend.sh "$AZURE_STATIC_WEB_APPS_DEPLOYMENT_TOKEN"
```

---

## Verification Steps

### API Health Checks

```bash
# 1. Basic health endpoint
curl https://fleet.capitaltechalliance.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-02-15T10:00:00Z",
#   "uptime": 3600,
#   "version": "1.0.0"
# }

# 2. Database connectivity
curl https://fleet.capitaltechalliance.com/api/health/db

# 3. Redis connectivity
curl https://fleet.capitaltechalliance.com/api/health/redis

# 4. Authentication
curl -H "Authorization: Bearer $(get_valid_token)" \
  https://fleet.capitaltechalliance.com/api/auth/me
```

### Frontend Verification

```bash
# 1. Check frontend is served
curl https://fleet.capitaltechalliance.com/ | head -50

# 2. Verify assets are loaded (check headers)
curl -I https://fleet.capitaltechalliance.com/

# Expected headers:
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: ...

# 3. Check performance metrics
# (Navigate to https://fleet.capitaltechalliance.com/ in browser)
# - Open DevTools → Network tab
# - Check load times (target: < 3 seconds total load)
# - Check bundle sizes (target: < 100KB main JS)
```

### Database Verification

```bash
# 1. Connect to database
psql -h fleet-db-prod.postgres.database.azure.com \
  -U fleet_webapp_user \
  -d fleet_production

# 2. Check tables exist
\dt

# 3. Verify data count
SELECT COUNT(*) FROM vehicles;
SELECT COUNT(*) FROM drivers;
SELECT COUNT(*) FROM users;

# 4. Check migrations completed
SELECT name FROM migrations ORDER BY executed_at DESC LIMIT 5;

# Exit
\q
```

### Redis Verification

```bash
# 1. Connect to Redis
redis-cli -h fleet-redis-prod.redis.cache.windows.net \
  -p 6380 \
  -a $(az keyvault secret show --vault-name fleet-secrets-prod-xyz --name REDIS-PASSWORD --query value -o tsv) \
  --tls

# 2. Check connection
PING

# Expected: PONG

# 3. Check memory usage
INFO memory

# 4. Check key count
DBSIZE

# Exit
QUIT
```

### End-to-End Workflow Test

```bash
# 1. Login to the application
# - Navigate to https://fleet.capitaltechalliance.com
# - Click "Login with Azure AD"
# - Verify authentication succeeds
# - Check token is stored in browser

# 2. Load dashboard
# - Verify main page loads (< 3 seconds)
# - Check vehicle map displays
# - Verify real-time updates work

# 3. Create test vehicle
# - Go to Fleet Management → Add Vehicle
# - Fill in test data
# - Save and verify in database

# 4. Check real-time updates
# - Monitor GPS location updates
# - Verify WebSocket connection
# - Check data appears in real-time

# 5. Run smoke tests
curl -X POST https://fleet.capitaltechalliance.com/api/test/smoke-test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## Post-Deployment Configuration

### Configure Custom Domain

```bash
# If using Azure-managed domain
az staticwebapp show \
  --name fleet-prod \
  --resource-group fleet-prod-rg \
  --query defaultHostname

# To add custom domain
az staticwebapp custom-domain create \
  --name fleet-prod \
  --resource-group fleet-prod-rg \
  --domain-name fleet.capitaltechalliance.com
```

### Configure SSL/TLS

```bash
# Azure Static Web Apps provides SSL by default
# Azure manages certificates automatically

# To configure custom certificate (if needed)
az keyvault secret show \
  --vault-name fleet-secrets-prod-xyz \
  --name ssl-certificate
```

### Configure Monitoring & Alerts

```bash
# Enable Application Insights
az webapp config appsettings set \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY="xxx" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=xxx;..."

# Create alert for high error rate
az monitor metrics alert create \
  --resource-group fleet-prod-rg \
  --name "Fleet-API-High-Error-Rate" \
  --scopes "/subscriptions/{subscription}/resourceGroups/fleet-prod-rg/providers/Microsoft.Web/sites/fleet-api-prod" \
  --condition "avg Exception.Count > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group "fleet-alerts"

# Create alert for database CPU
az monitor metrics alert create \
  --resource-group fleet-prod-rg \
  --name "Fleet-DB-High-CPU" \
  --scopes "/subscriptions/{subscription}/resourceGroups/fleet-prod-rg/providers/Microsoft.DBforPostgreSQL/servers/fleet-db-prod" \
  --condition "avg cpu_percent > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group "fleet-alerts"
```

### Configure Backup & Recovery

```bash
# Enable geo-redundant backups for database
az postgres server update \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod \
  --backup-retention 35 \
  --geo-redundant-backup Enabled

# Configure storage account backup
az storage account update \
  --resource-group fleet-prod-rg \
  --name fleetprodstg \
  --enable-change-feed \
  --enable-versioning

# Enable blob soft delete
az storage blob service-properties delete-policy update \
  --account-name fleetprodstg \
  --days-retained 30 \
  --enable true
```

---

## Rollback Procedures

### Quick Rollback to Previous Version

If deployment fails or introduces critical bugs:

```bash
# 1. Check deployment history
az deployment group list \
  --resource-group fleet-prod-rg \
  --query "[].{name:name, timestamp:properties.timestamp, state:properties.provisioningState}" \
  --output table

# 2. Redeploy from previous commit
git log --oneline | head -10
git checkout <previous-commit-hash>
git push origin main --force-with-lease  # Only use if absolutely necessary

# Or revert the commit
git revert <problematic-commit-hash>
git push origin main

# This automatically triggers GitHub Actions to redeploy

# 3. Monitor redeployment
# Check GitHub Actions → Production Deployment
```

### Rollback Backend (App Service)

```bash
# 1. View deployment slots
az webapp deployment slot list \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# 2. Swap staging to production (if you deployed to staging first)
az webapp deployment slot swap \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --slot staging

# 3. Or restart and check logs
az webapp restart \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

az webapp log tail \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod
```

### Rollback Database

```bash
# 1. Stop the API to prevent writes
az webapp stop \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# 2. Restore from backup (if available)
# Azure Database for PostgreSQL creates daily backups

# Find restore point (automatic backups kept for 35 days)
az postgres server restore \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod-restored \
  --source-server fleet-db-prod \
  --restore-point-in-time "2024-02-15T09:00:00Z"

# 3. Update connection string in App Service to point to restored DB
az webapp config appsettings set \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --settings \
    DATABASE_HOST="fleet-db-prod-restored.postgres.database.azure.com"

# 4. Restart API
az webapp start \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# 5. Verify functionality
curl https://fleet.capitaltechalliance.com/api/health
```

### Rollback Frontend (Static Web Apps)

```bash
# Azure Static Web Apps automatically maintains previous versions

# If you need to rollback:
# 1. GitHub provides automatic rollback for last 30 days
# 2. Revert the commit that caused the issue

git revert <problematic-commit-hash>
git push origin main

# GitHub Actions automatically redeploys the previous version
```

---

## Support & Escalation

### Monitoring & Alerting

**Key Metrics to Monitor:**

- API Response Time (target: < 200ms p95)
- Database Connection Pool Usage (alert if > 80%)
- Redis Memory Usage (alert if > 80%)
- Error Rate (alert if > 1%)
- CPU Usage (alert if > 75%)
- Disk Usage (alert if > 80%)

**Access Monitoring Dashboards:**

```bash
# Application Insights
az monitor app-insights show \
  --resource-group fleet-prod-rg \
  --name fleet-app-insights

# Database metrics
az monitor metrics list \
  --resource fleet-db-prod \
  --resource-group fleet-prod-rg \
  --resource-type "Microsoft.DBforPostgreSQL/servers"

# Alerts
az monitor alert list \
  --resource-group fleet-prod-rg
```

### Logs & Troubleshooting

**Log Locations:**

| Component | Location | Command |
|-----------|----------|---------|
| API Logs | Application Insights | `az webapp log tail --name fleet-api-prod` |
| Database Logs | PostgreSQL portal | Portal → Logs |
| Redis Logs | Azure portal | Portal → Diagnostics |
| Frontend Errors | Browser DevTools | F12 → Console |

**Useful Log Queries (Kusto Query Language):**

```kusto
// API errors in last 24 hours
customEvents
| where timestamp > ago(24h)
| where name == "Exception"
| summarize count() by tostring(customDimensions.["error"])
| top 10 by count_

// Slow API requests
customMetrics
| where name == "http_request_duration_ms"
| where value > 500
| summarize count() by tostring(customDimensions.["route"])

// Database connection pool issues
customEvents
| where name == "db_pool_exhausted"
| summarize count() by bin(timestamp, 5m)
```

### Getting Help

**Internal Escalation Path:**

1. **First:** Check logs and monitoring dashboards
2. **Second:** Review recent changes (git log, GitHub Actions)
3. **Third:** Contact DevOps team
4. **Fourth:** Open Azure Support ticket (Premium support)

**Contact Information:**

- **DevOps Team:** devops@capitaltechalliance.com
- **Database Admin:** dba@capitaltechalliance.com
- **Security Team:** security@capitaltechalliance.com
- **Incident Response:** incidents@capitaltechalliance.com (24/7)

---

## Summary

Deployment checklist before going live:

- [ ] All pre-deployment checks passed
- [ ] Environment variables configured in Key Vault
- [ ] Database schema migrated and verified
- [ ] Backend built and deployed
- [ ] Frontend built and deployed
- [ ] SSL/TLS certificates configured
- [ ] Health checks passing
- [ ] Monitoring and alerts enabled
- [ ] Backup and recovery procedures tested
- [ ] Team trained on rollback procedures
- [ ] Incident response plan documented

**Estimated Total Deployment Time: 2-4 hours**

For detailed information on specific components, see:
- `/docs/ENVIRONMENT_SETUP.md` - Environment variables reference
- `/docs/INFRASTRUCTURE_REQUIREMENTS.md` - Infrastructure specs
- `/docs/DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `/docs/TROUBLESHOOTING.md` - Common issues and solutions
- `/docs/MAINTENANCE.md` - Post-deployment operations

---

**Document Version:** 1.0
**Last Updated:** February 15, 2024
**Maintained By:** DevOps Team
**Next Review Date:** February 15, 2025
