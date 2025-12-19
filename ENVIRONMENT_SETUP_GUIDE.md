# Fleet Management System - Environment Setup Guide

**Created:** December 18, 2025 @ 23:00 UTC
**Version:** 2.0.0
**Status:** Production Ready with Full Database Backend

---

## 📋 Table of Contents

- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Local Development Setup](#local-development-setup)
- [Production Environment Setup](#production-environment-setup)
- [Environment Variable Mapping](#environment-variable-mapping)
- [Database Configuration](#database-configuration)
- [Quick Start Commands](#quick-start-commands)
- [Deployment Workflows](#deployment-workflows)
- [Troubleshooting](#troubleshooting)

---

## Overview

Fleet Management System is a **unified monorepo** containing:

- **Frontend**: React + Vite + TypeScript (50+ lazy-loaded modules)
- **Backend API**: Node.js + Express + TypeScript + PostgreSQL
- **Database**: PostgreSQL with Drizzle ORM (28 tables, 3,500+ seed records)
- **Real-time**: WebSocket support for live vehicle tracking
- **Deployment**: Azure Static Web Apps (frontend) + Azure Container Apps (backend)

**Single Repository Architecture:**
```
/Users/andrewmorton/Documents/GitHub/Fleet/
├── src/                    # Frontend React application
├── api/                    # Backend API server
├── dist/                   # Frontend production build
├── tests/                  # E2E Playwright tests
├── .env                    # Frontend environment variables
├── api/.env               # Backend environment variables
├── package.json           # Frontend dependencies
└── api/package.json       # Backend dependencies
```

---

## Repository Structure

### Frontend (`/`)

```
Fleet/
├── src/
│   ├── components/
│   │   ├── modules/           # 50+ feature modules
│   │   └── ui/                # Shadcn/UI components
│   ├── hooks/
│   │   ├── use-api.ts         # React Query API hooks
│   │   └── use-fleet-data.ts  # Hybrid demo/API data
│   ├── lib/
│   │   ├── demo-data.ts       # Demo data generators (legacy)
│   │   └── navigation.tsx     # Module registry
│   └── App.tsx                # Main application shell
├── dist/                      # Production build output
├── .env                       # Frontend config
├── package.json               # Frontend dependencies
├── vite.config.ts            # Vite bundler config
└── tsconfig.json             # TypeScript config
```

### Backend API (`/api`)

```
api/
├── src/
│   ├── schemas/
│   │   └── production.schema.ts   # Complete database schema (28 tables)
│   ├── scripts/
│   │   ├── seed-production-data.ts  # Comprehensive seed data
│   │   └── run-migrations.ts        # Database migrations
│   ├── routes/                      # API endpoints
│   ├── db/
│   │   └── connection.ts            # PostgreSQL connection
│   └── server-simple.ts             # Express API server
├── .env                       # Backend config
├── package.json               # Backend dependencies
├── drizzle.config.ts         # Drizzle ORM config
└── setup-and-test.sh         # Automated setup script
```

---

## Local Development Setup

### Prerequisites

```bash
# Required software
node --version   # v20.x or higher
npm --version    # 10.x or higher
psql --version   # PostgreSQL 14+ (brew install postgresql@14)

# Optional but recommended
docker --version # For containerized PostgreSQL
```

### Step 1: Install Dependencies

```bash
# Navigate to Fleet repository
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Install frontend dependencies
npm install

# Install backend dependencies
cd api
npm install
cd ..
```

### Step 2: Set Up Backend Database

**Option A: Automated Setup (Recommended)**

```bash
cd api

# One command does everything:
# - Creates PostgreSQL database
# - Runs migrations
# - Seeds 3,500+ records
# - Tests API endpoints
./setup-and-test.sh

# Start backend API server
npm run dev
```

**Option B: Manual Setup**

```bash
cd api

# Create PostgreSQL database
createdb fleet_dev

# Configure database connection
cp .env.example .env
# Edit .env and set DATABASE_URL

# Run migrations
npm run migrate

# Seed database
npm run seed

# Start server
npm run dev
```

**Backend API will run at:** `http://localhost:3000`

### Step 3: Configure Frontend Environment

```bash
# Navigate back to root
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Edit .env file
nano .env
```

**For Local Development with Real API:**

```bash
# Development Configuration (Real API)
NODE_ENV=development
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://localhost:3000

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>

# Azure AD (Optional SSO)
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback

# AI Services (Optional)
VITE_GROK_API_KEY=xai-wOeEAYZslZCGGu4tudhzBdMIm4tiZ6Ya4W2cjE0Rgm1UbXnJJezOhaJwdpgTliMg56nCGZTbslp6zlML
```

**For Demo Mode (No Backend Required):**

```bash
# Demo Configuration (Client-Side Only)
NODE_ENV=development
VITE_USE_MOCK_DATA=true
VITE_API_URL=http://localhost:5173

# Rest of variables same as above
```

### Step 4: Start Frontend

```bash
# From Fleet root directory
npm run dev
```

**Frontend will run at:** `http://localhost:5173`

### Step 5: Verify Everything Works

```bash
# Open browser to http://localhost:5173

# Check browser console for:
✅ "Fleet Data Provider initialized with API data"  # Real API
# OR
✅ "Fleet Data Provider initialized with demo data"  # Demo mode

# Test a module:
# 1. Click "Fleet Dashboard" in sidebar
# 2. Should see 100 vehicles from database (real API)
# 3. Or 50 vehicles from demo data (demo mode)
```

---

## Production Environment Setup

### Frontend Deployment (Azure Static Web Apps)

**Production URL:** `https://fleet.capitaltechalliance.com`
**Azure Static Web App:** `proud-bay-0fdc8040f.3.azurestaticapps.net`

**Deployment Methods:**

**Method 1: GitHub Actions (Automatic)**

```bash
# Triggers automatically on push to main branch
git add .
git commit -m "feat: your changes"
git push origin main

# GitHub Action workflow: .github/workflows/azure-static-web-apps.yml
# Builds frontend and deploys to Azure
```

**Method 2: Azure CLI (Manual)**

```bash
# Build frontend
npm run build

# Deploy to Azure Static Web Apps
az staticwebapp deploy \
  --name fleet-cta \
  --resource-group FleetManagement \
  --source ./dist \
  --token $AZURE_STATIC_WEB_APPS_API_TOKEN
```

**Environment Variables (Set in Azure Portal):**

```
VITE_USE_MOCK_DATA=false
VITE_API_URL=https://fleet-api.capitaltechalliance.com
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback
```

### Backend API Deployment (Azure Container Apps)

**Step 1: Create Azure Database for PostgreSQL**

```bash
# Create resource group (if not exists)
az group create \
  --name FleetManagement \
  --location eastus2

# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --name fleet-db-prod \
  --resource-group FleetManagement \
  --location eastus2 \
  --admin-user fleetadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group FleetManagement \
  --server-name fleet-db-prod \
  --database-name fleet_production

# Allow Azure services access
az postgres flexible-server firewall-rule create \
  --resource-group FleetManagement \
  --name fleet-db-prod \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Step 2: Build and Push Docker Image**

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Build Docker image
docker build -f api/Dockerfile -t fleet-api:latest .

# Tag for Azure Container Registry
docker tag fleet-api:latest fleetregistry.azurecr.io/fleet-api:latest

# Login to Azure Container Registry
az acr login --name fleetregistry

# Push image
docker push fleetregistry.azurecr.io/fleet-api:latest
```

**Step 3: Deploy to Azure Container Apps**

```bash
# Create Container App environment
az containerapp env create \
  --name fleet-env \
  --resource-group FleetManagement \
  --location eastus2

# Create Container App
az containerapp create \
  --name fleet-api \
  --resource-group FleetManagement \
  --environment fleet-env \
  --image fleetregistry.azurecr.io/fleet-api:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server fleetregistry.azurecr.io \
  --env-vars \
    DATABASE_URL='postgresql://fleetadmin:YourSecurePassword123!@fleet-db-prod.postgres.database.azure.com/fleet_production?sslmode=require' \
    NODE_ENV=production \
    PORT=3000 \
    JWT_SECRET='your-jwt-secret-from-keyvault' \
    AZURE_CLIENT_ID='from-keyvault' \
    AZURE_CLIENT_SECRET='from-keyvault' \
    AZURE_TENANT_ID='0ec14b81-7b82-45ee-8f3d-cbc31ced5347'

# Run migrations on production database
az containerapp exec \
  --name fleet-api \
  --resource-group FleetManagement \
  --command "npm run migrate"

# Seed production database
az containerapp exec \
  --name fleet-api \
  --resource-group FleetManagement \
  --command "npm run seed"
```

**Production API URL:** `https://fleet-api.capitaltechalliance.com`

---

## Environment Variable Mapping

### Frontend Variables (`.env` in root)

| Variable | Local Development | Production | Description |
|----------|------------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Build mode |
| `VITE_USE_MOCK_DATA` | `false` (API) or `true` (demo) | `false` | Use real API or demo data |
| `VITE_API_URL` | `http://localhost:3000` | `https://fleet-api.capitaltechalliance.com` | Backend API URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Same | Same | Google Maps API key |
| `VITE_AZURE_AD_CLIENT_ID` | Same | Same | Azure AD app ID |
| `VITE_AZURE_AD_TENANT_ID` | Same | Same | Azure AD tenant |
| `VITE_AZURE_AD_REDIRECT_URI` | `http://localhost:5173/auth/callback` | `https://fleet.capitaltechalliance.com/auth/callback` | OAuth redirect |

### Backend Variables (`api/.env`)

| Variable | Local Development | Production | Description |
|----------|------------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Runtime mode |
| `PORT` | `3000` | `3000` | API server port |
| `DATABASE_URL` | `postgresql://localhost/fleet_dev` | `postgresql://fleetadmin:***@fleet-db-prod.postgres.database.azure.com/fleet_production?sslmode=require` | PostgreSQL connection |
| `JWT_SECRET` | `dev-secret-change-in-prod` | From Azure Key Vault | JWT signing key |
| `REDIS_URL` | `redis://localhost:6379` | `redis://fleet-redis.redis.cache.windows.net:6380?ssl=true` | Redis cache |
| `AZURE_CLIENT_ID` | From global env | From Key Vault | Azure AD client |
| `AZURE_CLIENT_SECRET` | From global env | From Key Vault | Azure AD secret |
| `AZURE_TENANT_ID` | `0ec14b81-7b82-45ee-8f3d-cbc31ced5347` | Same | Azure AD tenant |

---

## Database Configuration

### Local PostgreSQL Setup

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create development database
createdb fleet_dev

# Create test database
createdb fleet_test

# Verify connection
psql -d fleet_dev -c "SELECT version();"
```

### Database Schema (28 Tables)

The database includes:

- **Core**: tenants, users, vehicles, drivers, facilities
- **Operations**: work_orders, maintenance_schedules, fuel_transactions
- **Tracking**: routes, gps_tracks, geofences
- **Safety**: inspections, incidents, certifications, training_records
- **Assets**: assets, parts, charging_stations, charging_sessions
- **Procurement**: vendors, purchase_orders
- **Workflow**: tasks, documents, announcements

**Total Seed Data:** 3,515+ records across all tables

### Migration Commands

```bash
cd api

# Generate migration from schema changes
npm run migrate:generate

# Run pending migrations
npm run migrate

# Drop all tables (⚠️ DESTRUCTIVE)
npm run migrate:drop

# Seed database
npm run seed

# Verify seed data
npm run seed:verify
```

---

## Quick Start Commands

### Development Workflow

```bash
# Start EVERYTHING in one terminal
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Terminal 1: Backend API
cd api && npm run dev

# Terminal 2: Frontend
npm run dev

# Terminal 3: PostgreSQL (if not running as service)
postgres -D /usr/local/var/postgresql@14
```

### Testing Workflow

```bash
# Run all E2E tests
npm test

# Run specific test suite
npm run test:smoke        # Quick smoke tests
npm run test:main         # Main modules
npm run test:security     # Security tests

# Run tests in headed mode (see browser)
npm run test:headed
```

### Build & Deploy

```bash
# Build frontend for production
npm run build

# Preview production build locally
npm run preview

# Build backend
cd api && npm run build

# Deploy to Azure (via GitHub Actions)
git add .
git commit -m "feat: your changes"
git push origin main
```

---

## Deployment Workflows

### GitHub Actions CI/CD

**Workflow File:** `.github/workflows/azure-static-web-apps.yml`

**Triggers:**
- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

**Steps:**
1. Checkout code
2. Install dependencies (`npm install`)
3. Build frontend (`npm run build`)
4. Run tests (`npm test`)
5. Deploy to Azure Static Web Apps

**Secrets Required (in GitHub Settings):**
```
AZURE_STATIC_WEB_APPS_API_TOKEN
```

### Manual Deployment

**Frontend:**

```bash
# Build
npm run build

# Deploy via Azure CLI
az staticwebapp deploy \
  --app-name fleet-cta \
  --resource-group FleetManagement \
  --source-path ./dist
```

**Backend:**

```bash
# Build Docker image
docker build -f api/Dockerfile -t fleet-api:latest .

# Push to Azure Container Registry
docker push fleetregistry.azurecr.io/fleet-api:latest

# Update Container App
az containerapp update \
  --name fleet-api \
  --resource-group FleetManagement \
  --image fleetregistry.azurecr.io/fleet-api:latest
```

---

## Troubleshooting

### Frontend Issues

**Issue: "Error Loading Data" on all modules**

```bash
# Check .env configuration
cat .env | grep VITE_

# Should see:
NODE_ENV=development  # NOT production
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://localhost:3000

# If wrong, fix and restart:
npm run dev
```

**Issue: Google Maps Error**

```bash
# Check API key is set
echo $VITE_GOOGLE_MAPS_API_KEY

# Remove domain restrictions in Google Cloud Console:
# https://console.cloud.google.com/apis/credentials?project=fleet-maps-app
```

**Issue: Vite build fails**

```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

### Backend Issues

**Issue: Database connection fails**

```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep fleet

# Test connection
psql -d fleet_dev -c "SELECT 1;"

# If fails, check DATABASE_URL in api/.env
```

**Issue: Migrations fail**

```bash
cd api

# Drop and recreate database
dropdb fleet_dev
createdb fleet_dev

# Run migrations fresh
npm run migrate

# Seed data
npm run seed
```

**Issue: Port 3000 already in use**

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Production Issues

**Issue: Azure deployment fails**

```bash
# Check GitHub Actions logs
# https://github.com/your-org/Fleet/actions

# Verify Azure credentials
az account show

# Test deployment locally
npm run build
npm run preview
```

**Issue: Production database slow**

```bash
# Check Azure Database metrics
az postgres flexible-server show \
  --resource-group FleetManagement \
  --name fleet-db-prod

# Scale up if needed
az postgres flexible-server update \
  --resource-group FleetManagement \
  --name fleet-db-prod \
  --sku-name Standard_D2s_v3
```

---

## Additional Resources

- **Frontend Documentation:** `/docs/README.md`
- **Backend API Docs:** `/api/PRODUCTION_BACKEND_QUICKSTART.md`
- **Database Schema:** `/api/src/schemas/production.schema.ts`
- **Deployment Guide:** `/DEPLOYMENT_GUIDE_COMPLETE.md`
- **Testing Strategy:** `/tests/README.md`

---

## Contact & Support

- **GitHub Issues:** https://github.com/andrewmorton/Fleet/issues
- **Production URL:** https://fleet.capitaltechalliance.com
- **API Documentation:** https://fleet-api.capitaltechalliance.com/docs

---

**Last Updated:** December 18, 2025 @ 23:00 UTC
**Version:** 2.0.0
**Deployment Status:** ✅ Production Ready
