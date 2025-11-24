# Fleet Management - Azure Provisioning Quick Start

**⏱️ Total Time: 15 minutes**
**🎯 Goal: Provision all Azure resources for production**

---

## ⚡ One Command Provisioning

```bash
# From project root
./scripts/provision-all-azure-resources.sh production
```

That's it! This will provision:
- ✅ PostgreSQL Database
- ✅ Azure AD App (Microsoft SSO)
- ✅ Application Insights (Monitoring)
- ✅ All security configurations

---

## 📋 Prerequisites (2 minutes)

```bash
# 1. Install Azure CLI (if needed)
brew install azure-cli  # macOS
# or see: https://docs.microsoft.com/cli/azure/install-azure-cli

# 2. Login to Azure
az login

# 3. Verify you're ready
az account show
```

---

## 🚀 Execution Steps

### Step 1: Provision (15 minutes)
```bash
./scripts/provision-all-azure-resources.sh production
```

**What happens:**
1. Creates resource group → 30 seconds
2. Provisions database → 8 minutes
3. Registers Azure AD app → 3 minutes
4. Sets up monitoring → 4 minutes
5. Generates credentials → 30 seconds

**Watch for:**
- Green checkmarks ✓ = Success
- Yellow warnings ⚠ = Review but not critical
- Red errors ✗ = Must fix

---

### Step 2: Validate (2 minutes)
```bash
./scripts/validate-azure-resources.sh production
```

**Expected:** Readiness score ≥90%

If less than 90%:
1. Read the error messages
2. Re-run specific provisioning script
3. Re-validate

---

### Step 3: Update .env (5 minutes)
```bash
# Copy credentials to .env
cat azure-ad-env-production.txt >> .env
cat monitoring-env-production.txt >> .env

# Get DATABASE_URL from:
cat database-credentials-production.txt | grep "DATABASE_URL="

# Generate secrets
export JWT_SECRET=$(openssl rand -base64 48)
export CSRF_SECRET=$(openssl rand -base64 48)

# Add everything to .env manually
```

---

### Step 4: Run Migrations (3 minutes)
```bash
cd api
npm install
npm run migrate
```

---

### Step 5: Deploy (Follow main guide)
```bash
# See DEPLOYMENT_GUIDE_COMPLETE.md
npm run build
# Then deploy to Azure
```

---

## 📁 Generated Files

After running provisioning:

```
azure-credentials-production-MASTER.txt  ← Everything in one file
database-credentials-production.txt
azure-ad-credentials-production.txt
azure-ad-env-production.txt              ← Copy to .env
monitoring-config-production.txt
monitoring-env-production.txt            ← Copy to .env
```

🔒 **All files are automatically chmod 600 (secure)**

---

## ⚠️ Common Issues

### "Azure CLI not found"
```bash
# Install it
brew install azure-cli
```

### "Not logged in"
```bash
az login
```

### "Permission denied"
```bash
# Need Contributor + Application Administrator roles
# Contact your Azure admin
```

### Script hangs at database provisioning
- **Normal!** Database takes 8-10 minutes
- Check Azure Portal for progress
- Don't interrupt!

---

## 🔍 Troubleshooting

### Validation fails?
```bash
# Re-run individual scripts
./scripts/provision-database.sh production
./scripts/provision-azure-ad.sh production
./scripts/provision-monitoring.sh production

# Re-validate
./scripts/validate-azure-resources.sh production
```

### Can't grant Azure AD admin consent?
1. Open Azure Portal
2. Go to: Azure AD > App Registrations
3. Find your app
4. Click: API permissions > Grant admin consent
5. Must be Global Administrator

---

## 📖 Full Documentation

For detailed information, see:
- **`AZURE_PROVISIONING_GUIDE.md`** - Complete guide (650+ lines)
- **`PROVISIONING_COMPLETE_SUMMARY.md`** - Technical details
- **`DEPLOYMENT_GUIDE_COMPLETE.md`** - After provisioning

---

## ✅ Success Checklist

After provisioning, you should have:

- [x] Validation score ≥90%
- [x] Database connection string
- [x] Azure AD client ID and secret
- [x] Application Insights connection string
- [x] All credential files saved securely
- [x] .env file updated
- [x] Database migrations run

Then you're ready to deploy! 🚀

---

## 📞 Need Help?

**Documentation:** See guides above
**Email:** andrew.m@capitaltechalliance.com
**Issues:** https://github.com/asmortongpt/Fleet/issues

---

**Time Estimate:**
- ⏱️ Provisioning: 15 minutes
- ⏱️ Validation: 2 minutes
- ⏱️ Configuration: 5 minutes
- ⏱️ Migrations: 3 minutes
- **Total: ~25 minutes to production-ready**
