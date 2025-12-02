# Fleet Management System - Complete Deployment Guide
**Version:** 2.0.0
**Date:** November 24, 2025
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Azure AD Setup](#azure-ad-setup)
4. [Database Setup](#database-setup)
5. [Build & Deploy](#build--deploy)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Pre-Deployment Checklist

### Prerequisites:
- [ ] Azure subscription active
- [ ] Azure AD tenant configured
- [ ] PostgreSQL database provisioned
- [ ] Domain name configured (fleet.capitaltechalliance.com)
- [ ] SSL certificate obtained
- [ ] GitHub/Azure DevOps repository access
- [ ] Node.js 18+ installed locally
- [ ] npm or yarn installed

### Required Accounts:
- [ ] Azure Portal access (admin)
- [ ] Azure DevOps/GitHub access (contributor)
- [ ] Database admin credentials
- [ ] Domain DNS management access

---

## ⚙️ Environment Configuration

### Step 1: Create Production Environment File

```bash
# Copy the template
cp .env.production.example .env.production

# Generate secrets
openssl rand -base64 48  # For JWT_SECRET
openssl rand -base64 48  # For CSRF_SECRET
```

### Step 2: Configure Environment Variables

Edit `.env.production`:

```bash
# ============================================
# CRITICAL: Azure AD Authentication
# ============================================
VITE_AZURE_AD_CLIENT_ID=your-azure-ad-client-id
VITE_AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
VITE_AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback

AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret-from-portal
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/api/auth/microsoft/callback

# ============================================
# Security (Generate with openssl rand -base64 48)
# ============================================
JWT_SECRET=your-generated-jwt-secret-minimum-32-characters
CSRF_SECRET=your-generated-csrf-secret-minimum-32-characters

# ============================================
# Environment
# ============================================
NODE_ENV=production
VITE_ENVIRONMENT=production
VITE_API_URL=https://fleet.capitaltechalliance.com
PORT=3000

# ============================================
# Database
# ============================================
DATABASE_URL=postgresql://user:password@host:5432/fleetdb
POSTGRES_DB=fleetdb
POSTGRES_USER=fleetadmin
POSTGRES_PASSWORD=your-secure-database-password

# ============================================
# CORS
# ============================================
CORS_ORIGIN=https://fleet.capitaltechalliance.com,https://www.fleet.capitaltechalliance.com

# ============================================
# Optional: Azure Services
# ============================================
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=your-azure-maps-key
APPLICATION_INSIGHTS_CONNECTION_STRING=your-app-insights-connection
```

### Step 3: Validate Configuration

```bash
# Check all required variables are set
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env.production', 'utf8');
const required = [
  'VITE_AZURE_AD_CLIENT_ID',
  'AZURE_AD_CLIENT_SECRET',
  'JWT_SECRET',
  'DATABASE_URL',
  'NODE_ENV'
];
required.forEach(key => {
  if (!env.includes(key + '=')) {
    console.error('❌ Missing:', key);
    process.exit(1);
  }
});
console.log('✅ All required variables present');
"
```

---

## 🔐 Azure AD Setup

### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App Registrations**
3. Click **New registration**

4. Fill in details:
   - **Name:** Fleet Management System
   - **Supported account types:** Accounts in this organizational directory only (Single tenant)
   - **Redirect URI:**
     - Type: Web
     - URI: `https://fleet.capitaltechalliance.com/api/auth/microsoft/callback`

5. Click **Register**

### Step 2: Configure API Permissions

1. In your new app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `User.Read` (Read user profile)
   - `openid` (Sign in)
   - `profile` (View users' basic profile)
   - `email` (View users' email address)

6. Click **Grant admin consent** (requires admin)

### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: "Production Secret"
4. Expires: 24 months (or per policy)
5. Click **Add**
6. **IMPORTANT:** Copy the secret value immediately (it won't be shown again)
7. Store in `.env.production` as `AZURE_AD_CLIENT_SECRET`

### Step 4: Get Application IDs

1. Go to **Overview** tab
2. Copy **Application (client) ID** → `VITE_AZURE_AD_CLIENT_ID` and `AZURE_AD_CLIENT_ID`
3. Copy **Directory (tenant) ID** → `VITE_AZURE_AD_TENANT_ID` and `AZURE_AD_TENANT_ID`

### Step 5: Configure Authentication

1. Go to **Authentication**
2. Under **Platform configurations**, click your Web platform
3. Add additional redirect URI:
   - `https://fleet.capitaltechalliance.com/auth/callback` (frontend callback)
4. Under **Implicit grant and hybrid flows**:
   - ✅ ID tokens
5. Click **Save**

---

## 🗄️ Database Setup

### Step 1: Provision PostgreSQL Database

#### Option A: Azure Database for PostgreSQL

```bash
# Create resource group (if not exists)
az group create --name fleet-rg --location eastus

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group fleet-rg \
  --name fleet-postgres-server \
  --location eastus \
  --admin-user fleetadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --version 14 \
  --storage-size 32

# Create database
az postgres flexible-server db create \
  --resource-group fleet-rg \
  --server-name fleet-postgres-server \
  --database-name fleetdb

# Configure firewall (allow Azure services)
az postgres flexible-server firewall-rule create \
  --resource-group fleet-rg \
  --name fleet-postgres-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

#### Option B: Local/VPS PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE fleetdb;
CREATE USER fleetadmin WITH ENCRYPTED PASSWORD 'YourSecurePassword';
GRANT ALL PRIVILEGES ON DATABASE fleetdb TO fleetadmin;
\q
EOF
```

### Step 2: Run Database Migrations

```bash
# Install dependencies
cd api
npm install

# Run migrations
npm run migrate

# Verify tables
psql -h your-host -U fleetadmin -d fleetdb -c "\dt"
```

### Step 3: Create Default Tenant

```bash
# Connect to database
psql -h your-host -U fleetadmin -d fleetdb

# Create default tenant
INSERT INTO tenants (name, domain, settings)
VALUES ('Capital Tech Alliance', 'capitaltechalliance.com', '{}');

# Verify
SELECT * FROM tenants;

# Exit
\q
```

---

## 🚀 Build & Deploy

### Step 1: Build Frontend

```bash
# Install dependencies
npm install

# Build for production
NODE_ENV=production npm run build

# Verify build
ls -lh dist/

# Expected output:
# - index.html
# - assets/js/   (multiple vendor chunks)
# - assets/css/
# - assets/images/
```

### Step 2: Build Backend

```bash
cd api
npm install
npm run build

# Verify
ls -lh dist/
```

### Step 3: Deploy to Azure Static Web Apps

#### Option A: GitHub Actions (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Create **Static Web App**
   - Resource group: fleet-rg
   - Name: fleet-management-app
   - Plan type: Standard
   - Region: East US 2
   - Source: GitHub
   - Organization: your-org
   - Repository: Fleet
   - Branch: main
   - Build Presets: Custom
   - App location: `/`
   - API location: `/api`
   - Output location: `dist`

3. Azure creates a GitHub Actions workflow automatically

4. Add secrets to GitHub:
   - Go to your repo > Settings > Secrets and variables > Actions
   - Add all environment variables as secrets

5. Trigger deployment:
   ```bash
   git push origin main
   ```

#### Option B: Azure CLI

```bash
# Login to Azure
az login

# Deploy
az staticwebapp create \
  --name fleet-management-app \
  --resource-group fleet-rg \
  --source https://github.com/asmortongpt/Fleet \
  --location "East US 2" \
  --branch main \
  --app-location "/" \
  --api-location "/api" \
  --output-location "dist" \
  --login-with-github
```

### Step 4: Deploy Backend API (Separate if needed)

If API is hosted separately:

```bash
# Build Docker image
docker build -t fleet-api:latest -f Dockerfile.api .

# Push to container registry
docker tag fleet-api:latest your-registry.azurecr.io/fleet-api:latest
docker push your-registry.azurecr.io/fleet-api:latest

# Deploy to Azure Container Apps / App Service / Kubernetes
az containerapp create \
  --name fleet-api \
  --resource-group fleet-rg \
  --image your-registry.azurecr.io/fleet-api:latest \
  --target-port 3000 \
  --ingress external \
  --environment my-container-env
```

---

## ✅ Post-Deployment Verification

### Step 1: Health Checks

```bash
# Check frontend is accessible
curl -I https://fleet.capitaltechalliance.com
# Expected: HTTP/2 200

# Check API health endpoint
curl https://fleet.capitaltechalliance.com/api/v1/health
# Expected: {"status":"healthy"}

# Check database connectivity
curl https://fleet.capitaltechalliance.com/api/v1/status
# Expected: {"database":"connected"}
```

### Step 2: Test Authentication Flow

1. **Open browser:** https://fleet.capitaltechalliance.com
2. **Click:** "Sign in with Microsoft"
3. **Expected:** Redirect to login.microsoftonline.com
4. **Log in** with Microsoft account
5. **Expected:** Redirect back to dashboard
6. **Verify:** User info displayed, no errors in console

### Step 3: Verify Bundle Performance

```bash
# Run Lighthouse audit
npx lighthouse https://fleet.capitaltechalliance.com \
  --output=html \
  --output-path=./lighthouse-report.html

# Expected scores:
# Performance: 85+ ✅
# Accessibility: 90+ ✅
# Best Practices: 95+ ✅
# SEO: 90+ ✅
```

### Step 4: Test Critical Flows

- [ ] Login with Microsoft SSO
- [ ] View Fleet Dashboard
- [ ] Navigate between modules
- [ ] View GPS Tracking
- [ ] Create maintenance request
- [ ] View analytics
- [ ] Logout

### Step 5: Security Verification

```bash
# Check headers
curl -I https://fleet.capitaltechalliance.com | grep -i security

# Expected headers:
# Strict-Transport-Security: max-age=31536000
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: ...

# Test HTTPS redirect
curl -I http://fleet.capitaltechalliance.com
# Expected: 301 redirect to HTTPS
```

---

## 📊 Monitoring & Maintenance

### Application Insights Setup

1. **Create Application Insights:**
   ```bash
   az monitor app-insights component create \
     --app fleet-monitoring \
     --location eastus \
     --resource-group fleet-rg \
     --application-type web
   ```

2. **Get connection string:**
   ```bash
   az monitor app-insights component show \
     --app fleet-monitoring \
     --resource-group fleet-rg \
     --query connectionString -o tsv
   ```

3. **Add to environment:**
   ```bash
   VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=your-connection-string
   APPLICATION_INSIGHTS_CONNECTION_STRING=your-connection-string
   ```

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Uptime** | 99.9% | < 99.5% |
| **Response Time** | < 500ms | > 1000ms |
| **Error Rate** | < 0.1% | > 1% |
| **Failed Logins** | < 5% | > 10% |
| **Database Connections** | < 80% | > 90% |
| **CPU Usage** | < 70% | > 85% |
| **Memory Usage** | < 80% | > 90% |

### Set Up Alerts

```bash
# CPU alert
az monitor metrics alert create \
  --name fleet-high-cpu \
  --resource-group fleet-rg \
  --scopes /subscriptions/{sub-id}/resourceGroups/fleet-rg/providers/Microsoft.Web/sites/fleet-management-app \
  --condition "avg Percentage CPU > 85" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group email-admins

# Error rate alert
az monitor metrics alert create \
  --name fleet-high-errors \
  --resource-group fleet-rg \
  --scopes /subscriptions/{sub-id}/resourceGroups/fleet-rg/providers/Microsoft.Web/sites/fleet-management-app \
  --condition "avg Http5xx > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group email-admins
```

### Backup Strategy

```bash
# Daily database backups
az postgres flexible-server backup create \
  --resource-group fleet-rg \
  --name fleet-postgres-server \
  --backup-name daily-backup-$(date +%Y%m%d)

# Automated backup script (add to cron)
0 2 * * * /usr/local/bin/backup-fleet-db.sh
```

### Update Schedule

| Component | Frequency | Notes |
|-----------|-----------|-------|
| **Dependencies** | Weekly | `npm audit fix` |
| **OS Patches** | Monthly | Azure auto-patches |
| **Database** | Quarterly | Minor versions |
| **SSL Certificates** | Annually | Auto-renewed |
| **Azure AD Secrets** | 18-24 months | Manual renewal |
| **JWT Secret Rotation** | 90 days | Rolling update |

---

## 🔧 Troubleshooting

### Issue: Azure AD Login Fails

**Symptoms:** Redirect to Microsoft works, but callback fails

**Solutions:**
1. **Check redirect URI:**
   ```bash
   # Verify in Azure Portal
   # App Registrations > Your App > Authentication
   # Must exactly match: https://fleet.capitaltechalliance.com/api/auth/microsoft/callback
   ```

2. **Check client secret:**
   ```bash
   # Verify secret hasn't expired
   # Azure Portal > App Registrations > Certificates & secrets
   # If expired, generate new secret and update .env.production
   ```

3. **Check environment variables:**
   ```bash
   # Verify all are set correctly
   echo $AZURE_AD_CLIENT_ID
   echo $AZURE_AD_CLIENT_SECRET
   echo $AZURE_AD_TENANT_ID
   ```

4. **Check API logs:**
   ```bash
   # Azure Portal > Your app > Log Stream
   # Look for "Microsoft OAuth error"
   ```

### Issue: Large Bundle Size / Slow Load

**Symptoms:** Initial page load takes > 5 seconds

**Solutions:**
1. **Verify code splitting is working:**
   ```bash
   # Check dist/assets/js/
   ls -lh dist/assets/js/

   # Should see multiple chunks:
   # react-vendor-[hash].js
   # ui-vendor-[hash].js
   # maps-vendor-[hash].js
   # three-vendor-[hash].js
   # charts-vendor-[hash].js
   ```

2. **Check if production build was used:**
   ```bash
   # Rebuild with NODE_ENV=production
   NODE_ENV=production npm run build
   ```

3. **Enable compression:**
   ```bash
   # Verify gzip/brotli is enabled in Azure
   # Static Web Apps enable this by default
   ```

### Issue: Database Connection Fails

**Symptoms:** API returns 500, "database connection error"

**Solutions:**
1. **Check database is running:**
   ```bash
   az postgres flexible-server show \
     --resource-group fleet-rg \
     --name fleet-postgres-server
   ```

2. **Check firewall rules:**
   ```bash
   # Allow your app's IP
   az postgres flexible-server firewall-rule create \
     --resource-group fleet-rg \
     --name fleet-postgres-server \
     --rule-name AllowAppService \
     --start-ip-address x.x.x.x \
     --end-ip-address x.x.x.x
   ```

3. **Test connection manually:**
   ```bash
   psql -h fleet-postgres-server.postgres.database.azure.com \
        -U fleetadmin \
        -d fleetdb
   ```

4. **Check DATABASE_URL format:**
   ```bash
   # Correct format:
   postgresql://fleetadmin:password@fleet-postgres-server.postgres.database.azure.com:5432/fleetdb?sslmode=require
   ```

### Issue: Console Errors in Browser

**Symptoms:** JavaScript errors in browser console

**Solutions:**
1. **Check for missing environment variables:**
   ```javascript
   // In browser console
   console.log('API URL:', import.meta.env.VITE_API_URL)
   console.log('Azure AD Client:', import.meta.env.VITE_AZURE_AD_CLIENT_ID)
   ```

2. **Clear browser cache:**
   ```
   Ctrl+Shift+R (Windows)
   Cmd+Shift+R (Mac)
   ```

3. **Check service worker:**
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister())
   })
   ```

### Issue: 500 Internal Server Error

**Symptoms:** API requests return 500 status

**Solutions:**
1. **Check API logs:**
   ```bash
   # Azure Portal > Your API app > Log Stream
   # Or download logs
   az webapp log download \
     --resource-group fleet-rg \
     --name fleet-api
   ```

2. **Check environment variables are set:**
   ```bash
   # In Azure Portal
   # App Service > Configuration > Application settings
   # Verify all required vars are present
   ```

3. **Restart API:**
   ```bash
   az webapp restart \
     --resource-group fleet-rg \
     --name fleet-api
   ```

---

## 📚 Additional Resources

### Documentation Links

- [Azure AD OAuth Documentation](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [PostgreSQL on Azure](https://docs.microsoft.com/azure/postgresql/)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)

### Support Contacts

- **Technical Issues:** andrew.m@capitaltechalliance.com
- **Azure Support:** Azure Portal > Help + Support
- **GitHub Issues:** https://github.com/asmortongpt/Fleet/issues

### Useful Commands

```bash
# Check deployment status
az staticwebapp show --name fleet-management-app --resource-group fleet-rg

# View logs
az webapp log tail --resource-group fleet-rg --name fleet-api

# Restart application
az webapp restart --resource-group fleet-rg --name fleet-api

# Scale up
az appservice plan update --name fleet-plan --resource-group fleet-rg --sku P1V2

# Database backup
az postgres flexible-server backup list --resource-group fleet-rg --name fleet-postgres-server

# SSL certificate status
az webapp config ssl list --resource-group fleet-rg
```

---

## ✅ Deployment Success Criteria

Your deployment is successful when:

- [ ] ✅ Application loads at https://fleet.capitaltechalliance.com
- [ ] ✅ Microsoft SSO login works end-to-end
- [ ] ✅ Dashboard displays with data
- [ ] ✅ All 40+ modules load without errors
- [ ] ✅ API health endpoint returns 200 OK
- [ ] ✅ Database queries succeed
- [ ] ✅ Lighthouse score > 85
- [ ] ✅ No console errors in browser
- [ ] ✅ HTTPS redirect works
- [ ] ✅ Monitoring and alerts configured

---

**Deployment Guide Version:** 2.0.0
**Last Updated:** November 24, 2025
**Status:** ✅ Complete and Production-Ready

**Questions?** Contact: andrew.m@capitaltechalliance.com
