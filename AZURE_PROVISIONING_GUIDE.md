# Fleet Management System - Azure Resource Provisioning Guide

**Version:** 1.0.0
**Date:** November 24, 2025
**Status:** ✅ Production Ready

---

## 🎯 Overview

This guide provides automated scripts to provision **ALL** required Azure resources for the Fleet Management System. These scripts eliminate manual configuration and ensure consistent, repeatable deployments.

### What Gets Provisioned

✅ **PostgreSQL Flexible Server** - Production database with 7-day backups
✅ **Azure AD App Registration** - Microsoft SSO authentication
✅ **Application Insights** - Comprehensive monitoring and telemetry
✅ **Log Analytics Workspace** - Centralized logging
✅ **Action Groups** - Alert notification system
✅ **Firewall Rules** - Network security configuration

### Time Required

- **Individual scripts:** 5-10 minutes each
- **Complete provisioning:** 15-20 minutes total
- **Validation:** 2-3 minutes

---

## 📋 Prerequisites

### Required Software

```bash
# Azure CLI (version 2.50+)
az --version

# OpenSSL (for secret generation)
openssl version

# jq (for JSON parsing - optional but recommended)
jq --version

# PostgreSQL client (optional, for connectivity testing)
psql --version
```

### Install Azure CLI

**macOS:**
```bash
brew update && brew install azure-cli
```

**Linux:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**Windows:**
Download from: https://aka.ms/installazurecliwindows

### Azure Requirements

- **Azure Subscription** with active credit
- **Permissions Required:**
  - `Contributor` role on subscription (or specific resource group)
  - `Application Administrator` role in Azure AD (for app registration)
- **Authentication:** Login with `az login`

### Verify Prerequisites

```bash
# Run the master script to check prerequisites
./scripts/provision-all-azure-resources.sh

# It will check:
# ✓ Azure CLI installed
# ✓ Logged in to Azure
# ✓ Active subscription
# ✓ Required tools available
```

---

## 🚀 Quick Start (Recommended)

### One-Command Provisioning

```bash
# Production environment
./scripts/provision-all-azure-resources.sh production

# Staging environment
./scripts/provision-all-azure-resources.sh staging
```

This master script orchestrates all provisioning steps:
1. Creates resource group
2. Provisions PostgreSQL database
3. Registers Azure AD application
4. Sets up Application Insights
5. Configures monitoring and alerts
6. Generates consolidated credentials file

**Time:** ~15 minutes

---

## 🔧 Individual Scripts (Advanced)

If you need to provision resources individually or re-run specific steps:

### 1. Database Provisioning

```bash
./scripts/provision-database.sh production
```

**What it does:**
- Creates PostgreSQL Flexible Server (v14)
- Configures 7-day backup retention
- Enables extensions (PostGIS, UUID, pgcrypto, vector)
- Sets up firewall rules
- Creates database and admin user
- Generates connection string

**Output:** `database-credentials-production.txt`

**Time:** ~8 minutes

---

### 2. Azure AD App Registration

```bash
./scripts/provision-azure-ad.sh production
```

**What it does:**
- Creates Azure AD app registration
- Configures redirect URIs
- Adds Microsoft Graph permissions (User.Read, openid, profile, email)
- Generates client secret (2-year expiry)
- Attempts to grant admin consent

**Output:**
- `azure-ad-credentials-production.txt`
- `azure-ad-env-production.txt` (ready for .env)

**Time:** ~3 minutes

**Note:** May require `Application Administrator` role

---

### 3. Application Insights & Monitoring

```bash
./scripts/provision-monitoring.sh production
```

**What it does:**
- Creates Application Insights resource
- Sets up Log Analytics workspace (90-day retention)
- Configures Action Group for alerts
- Creates alert rules:
  - High error rate (>10 errors/5min)
  - Slow response time (>3 seconds)
  - Low availability (<99%)
- Enables smart detection

**Output:**
- `monitoring-config-production.txt`
- `monitoring-env-production.txt` (ready for .env)

**Time:** ~4 minutes

---

## ✅ Validation

After provisioning, validate all resources:

```bash
./scripts/validate-azure-resources.sh production
```

**What it checks:**
- ✓ Resource group exists
- ✓ Database server is ready
- ✓ Database connectivity works
- ✓ Firewall rules configured
- ✓ Azure AD app registered
- ✓ API permissions granted
- ✓ Client secrets exist
- ✓ Application Insights connected
- ✓ Alert rules configured

**Output:**
- Readiness score (0-100%)
- Pass/Fail/Warning summary
- Recommendations

**Expected Result:** ≥90% readiness for production deployment

---

## 📁 Generated Files

After provisioning, you'll have these credential files:

```
Fleet/
├── azure-credentials-production-MASTER.txt  # ← All credentials in one file
├── database-credentials-production.txt
├── azure-ad-credentials-production.txt
├── azure-ad-env-production.txt             # ← Copy to .env
├── monitoring-config-production.txt
└── monitoring-env-production.txt           # ← Copy to .env
```

### Security Notes

🔒 **All credential files are:**
- Automatically `chmod 600` (owner read/write only)
- Listed in `.gitignore` (won't be committed)
- Should be stored in a password manager or Azure Key Vault

🔒 **DO NOT:**
- Commit credential files to git
- Share via email or chat
- Store in public locations

---

## 🔐 Update .env File

After provisioning, update your `.env` file:

### Option 1: Copy Snippets (Recommended)

```bash
# From project root
cat azure-ad-env-production.txt >> .env
cat monitoring-env-production.txt >> .env

# Manually add DATABASE_URL from database-credentials-production.txt
```

### Option 2: Extract from Master File

```bash
# View master credentials file
cat azure-credentials-production-MASTER.txt

# Copy relevant sections to .env
```

### Required .env Variables

```bash
# Database
DATABASE_URL=postgresql://fleetadmin:password@host:5432/fleetdb?sslmode=require

# Azure AD (Frontend)
VITE_AZURE_AD_CLIENT_ID=your-client-id
VITE_AZURE_AD_TENANT_ID=your-tenant-id
VITE_AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback

# Azure AD (Backend)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/api/auth/microsoft/callback

# Monitoring
APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=...
VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Security (generate with: openssl rand -base64 48)
JWT_SECRET=your-generated-secret
CSRF_SECRET=your-generated-secret

# CORS
CORS_ORIGIN=https://fleet.capitaltechalliance.com
```

---

## 🎬 Post-Provisioning Steps

### 1. Run Database Migrations

```bash
cd api
npm install
npm run migrate
```

Expected output: All migrations succeed, tables created

### 2. Create Admin User

```bash
npm run seed:admin
```

Or manually via SQL:
```sql
INSERT INTO users (email, name, role)
VALUES ('admin@capitaltechalliance.com', 'Admin User', 'admin');
```

### 3. Test Azure AD Login

1. Deploy application (see DEPLOYMENT_GUIDE_COMPLETE.md)
2. Navigate to frontend URL
3. Click "Sign in with Microsoft"
4. Verify you can authenticate

### 4. Verify Monitoring

1. Generate some test traffic to your app
2. Open Azure Portal: Application Insights
3. Wait 5-10 minutes for data to appear
4. Verify metrics are flowing

### 5. Security Hardening

```bash
# Remove temporary AllowAll firewall rule
az postgres flexible-server firewall-rule delete \
  --resource-group fleet-production-rg \
  --name fleet-production-db-xxxxx \
  --rule-name AllowAll \
  --yes

# Add specific IP ranges instead
az postgres flexible-server firewall-rule create \
  --resource-group fleet-production-rg \
  --name fleet-production-db-xxxxx \
  --rule-name AllowAppService \
  --start-ip-address x.x.x.x \
  --end-ip-address x.x.x.x
```

---

## 🔍 Troubleshooting

### Issue: Azure CLI Login Fails

**Solution:**
```bash
# Clear Azure CLI cache
rm -rf ~/.azure

# Re-login
az login

# Select correct subscription
az account set --subscription "Your Subscription Name"
```

---

### Issue: Insufficient Permissions

**Symptom:** "Authorization failed" or "Forbidden"

**Solution:**
1. Verify roles:
   ```bash
   az role assignment list --assignee your-email@domain.com
   ```
2. Request `Contributor` role from subscription admin
3. For Azure AD: Request `Application Administrator` role

---

### Issue: Database Provisioning Hangs

**Symptom:** Script appears stuck at database creation

**Solution:**
- Wait 10 minutes (database provisioning is slow)
- Check Azure Portal for progress
- If failed, delete and retry:
  ```bash
  az postgres flexible-server delete \
    --resource-group fleet-production-rg \
    --name fleet-production-db-xxxxx \
    --yes
  ```

---

### Issue: Azure AD Admin Consent Not Granted

**Symptom:** "AADSTS65001" error when logging in

**Solution:**
1. Go to Azure Portal > Azure AD > App Registrations
2. Find your app
3. Go to "API permissions"
4. Click "Grant admin consent for [your org]"
5. Must be done by Global Administrator

---

### Issue: Application Insights Not Receiving Data

**Symptom:** No telemetry in Azure Portal

**Solutions:**
1. **Wait 5-10 minutes** for initial data
2. Verify connection string is correct in .env
3. Check firewall allows outbound to `*.applicationinsights.azure.com`
4. Verify SDK is initialized in application code
5. Check application logs for errors

---

### Issue: Validation Script Fails

**Symptom:** Low readiness score (<90%)

**Solution:**
1. Read specific error messages
2. Re-run individual provisioning scripts
3. Check Azure Portal for resource status
4. Verify permissions and access

---

## 📊 Resource Naming Conventions

All resources follow this pattern:

```
fleet-{environment}-{resource-type}-{random-suffix}

Examples:
- fleet-production-rg           (resource group)
- fleet-production-db-12345     (database)
- fleet-production-insights     (monitoring)
- fleet-staging-rg              (staging environment)
```

This ensures:
- Clear identification of environment
- No naming conflicts
- Easy filtering in Azure Portal

---

## 💰 Cost Estimates

### Production Environment (Monthly)

| Resource | SKU | Estimated Cost |
|----------|-----|----------------|
| PostgreSQL Flexible Server | Standard_B2s | $30-50 |
| Application Insights | Pay-as-you-go | $10-30 |
| Log Analytics | 5GB free, then per GB | $5-15 |
| Storage (if used) | Standard LRS | $5-10 |
| **Total** | | **$50-105/month** |

### Staging Environment (Monthly)

| Resource | SKU | Estimated Cost |
|----------|-----|----------------|
| PostgreSQL Flexible Server | Burstable B1ms | $15-25 |
| Application Insights | Pay-as-you-go | $5-10 |
| Log Analytics | Free tier | $0-5 |
| **Total** | | **$20-40/month** |

**Note:** Costs vary based on:
- Data ingestion volume
- Number of API calls
- Storage usage
- Region selection

### Cost Optimization Tips

1. **Use Reserved Instances** for production database (save 30-50%)
2. **Enable auto-pause** for dev/test environments
3. **Set sampling rate** in Application Insights (default: 100%)
4. **Archive old logs** to cheaper storage
5. **Right-size resources** after monitoring usage

---

## 🔄 Cleanup (Delete Resources)

To delete all resources and stop charges:

### Delete Entire Resource Group

```bash
# Production (CAREFUL!)
az group delete --name fleet-production-rg --yes --no-wait

# Staging
az group delete --name fleet-staging-rg --yes --no-wait
```

### Delete Individual Resources

```bash
# Database only
az postgres flexible-server delete \
  --resource-group fleet-production-rg \
  --name fleet-production-db-xxxxx \
  --yes

# Azure AD app
az ad app delete --id <app-id>

# Application Insights
az monitor app-insights component delete \
  --resource-group fleet-production-rg \
  --app fleet-production-insights
```

---

## 📚 Additional Resources

### Documentation

- [DEPLOYMENT_GUIDE_COMPLETE.md](./DEPLOYMENT_GUIDE_COMPLETE.md) - Full deployment process
- [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) - Readiness validation
- [Azure PostgreSQL Docs](https://docs.microsoft.com/azure/postgresql/)
- [Azure AD App Registration](https://docs.microsoft.com/azure/active-directory/develop/)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/)

### Support

- **Technical Issues:** andrew.m@capitaltechalliance.com
- **Azure Support:** https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
- **GitHub Issues:** https://github.com/asmortongpt/Fleet/issues

---

## 📝 Script Reference

### All Available Scripts

```bash
# Master orchestration (RECOMMENDED)
./scripts/provision-all-azure-resources.sh [production|staging]

# Individual provisioning
./scripts/provision-database.sh [production|staging]
./scripts/provision-azure-ad.sh [production|staging]
./scripts/provision-monitoring.sh [production|staging]

# Validation
./scripts/validate-azure-resources.sh [production|staging]

# Existing scripts (still useful)
./scripts/deploy-production.sh          # Deploy to AKS
./scripts/deploy-staging.sh             # Deploy staging
./scripts/security-audit.sh             # Security checks
./scripts/pre-deploy-check.sh           # Pre-deployment validation
```

---

## ✅ Success Criteria

Your provisioning is complete when:

- ✅ All scripts run without errors
- ✅ Validation script shows ≥90% readiness
- ✅ Database connection test passes
- ✅ Azure AD app has admin consent granted
- ✅ Application Insights connection string generated
- ✅ All credential files created
- ✅ .env file updated with all variables

---

## 🎯 Next Steps

After successful provisioning:

1. ✅ **Update .env** - Add all credentials
2. ✅ **Run migrations** - `npm run migrate` in api/
3. ✅ **Deploy application** - Follow DEPLOYMENT_GUIDE_COMPLETE.md
4. ✅ **Test SSO** - Verify Microsoft login works
5. ✅ **Monitor metrics** - Check Application Insights after 10 min
6. ✅ **Harden security** - Remove temporary firewall rules
7. ✅ **Document secrets** - Store credentials in Key Vault

---

**Generated:** November 24, 2025
**By:** Capital Tech Alliance - Azure Infrastructure Team
**Version:** 1.0.0
**Status:** Production Ready ✅
