# GitHub Production Deployment Guide
## Fleet-AzureDevOps

---

## 📋 Overview

This guide covers the **GitHub Actions pipeline** for deploying the Fleet Management System to production using **Azure Static Web Apps**.

### Deployment Architecture

```
GitHub Repository (main branch)
    ↓
GitHub Actions Pipeline
    ↓
├── Quality Gates (TypeScript, Lint, Tests)
├── Build (Frontend + API)
├── Deploy to Azure Static Web Apps
├── Verification (Health Checks)
├── Create GitHub Release
└── Notifications
```

---

## ✅ Current Status

### Configured Secrets ✓

All required secrets are already configured in GitHub:

| Secret | Status | Purpose |
|--------|--------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | ✅ Configured | Azure deployment token |
| `GOOGLE_MAPS_API_KEY` | ✅ Configured | Google Maps integration |
| `AZURE_AD_CLIENT_ID` | ✅ Configured | Azure AD authentication |
| `AZURE_AD_TENANT_ID` | ✅ Configured | Azure AD tenant |

### Workflows

| Workflow | Purpose | Status |
|----------|---------|--------|
| `production-deployment.yml` | **Main production pipeline** | ✅ Active |
| `azure-static-web-apps-production.yml` | Legacy Azure SWA deployment | ⚠️ Can be deprecated |
| `ci-cd.yml` | AKS deployment (not configured) | ⚠️ Disabled |
| `quality-gate.yml` | Quality checks | ✅ Active |

---

## 🚀 How to Deploy to Production

### Automatic Deployment (Recommended)

**Trigger**: Every push to `main` branch

```bash
# Make your changes
git add .
git commit -m "feat: your changes"
git push origin main
```

The pipeline will automatically:
1. ✅ Run quality gates
2. ✅ Build frontend and API
3. ✅ Deploy to production
4. ✅ Verify deployment
5. ✅ Create GitHub release

### Manual Deployment

**Trigger**: Manually via GitHub Actions UI

1. Go to: https://github.com/asmortongpt/Fleet-AzureDevOps/actions
2. Select **"Production Deployment"** workflow
3. Click **"Run workflow"** button
4. Choose environment: `production` or `staging`
5. Click **"Run workflow"**

---

## 📊 Pipeline Stages

### Stage 1: Quality Gates (~3-5 minutes)

**What it does:**
- TypeScript type checking
- ESLint code quality validation
- Unit tests execution
- Build verification

**Pass Criteria:**
- All checks must pass (warnings allowed)
- Build must succeed

### Stage 2: Build (~2-3 minutes)

**What it does:**
- Builds frontend with production config
- Builds API (if applicable)
- Uploads artifacts for deployment

**Environment Variables Injected:**
```bash
VITE_GOOGLE_MAPS_API_KEY: <from secrets>
VITE_AZURE_AD_CLIENT_ID: <from secrets>
VITE_AZURE_AD_TENANT_ID: <from secrets>
VITE_AZURE_AD_REDIRECT_URI: https://fleet.capitaltechalliance.com/auth/callback
VITE_API_BASE_URL: https://fleet.capitaltechalliance.com/api
VITE_USE_MOCK_DATA: false
```

### Stage 3: Deploy to Production (~3-5 minutes)

**What it does:**
- Deploys to Azure Static Web Apps
- Uploads frontend (dist/)
- Uploads API (api/)

**Production URL:**
```
https://fleet.capitaltechalliance.com
```

### Stage 4: Verification (~30 seconds)

**What it does:**
- Health check on frontend (expects HTTP 200)
- Health check on API endpoint
- Generates deployment summary

### Stage 5: Release Creation

**What it does:**
- Creates GitHub release: `v1.0.<build_number>`
- Includes changelog (last 10 commits)
- Adds deployment metadata

### Stage 6: Notifications

**What it does:**
- Posts deployment status
- Provides deployment URL
- Shows release version

---

## 🔧 Configuration

### Update Production URL

If you change the Azure Static Web App, update these files:

**1. `.github/workflows/production-deployment.yml`**
```yaml
env:
  PRODUCTION_URL: https://your-new-url.azurestaticapps.net
  API_URL: https://your-new-url.azurestaticapps.net/api
```

**2. `.github/workflows/production-deployment.yml` (build steps)**
```yaml
VITE_AZURE_AD_REDIRECT_URI: https://your-new-url.azurestaticapps.net/auth/callback
VITE_API_BASE_URL: https://your-new-url.azurestaticapps.net/api
```

### Add New Secrets

To add additional secrets:

```bash
# Via GitHub CLI
gh secret set SECRET_NAME --repo asmortongpt/Fleet-AzureDevOps

# Or via GitHub UI
# Settings → Secrets and variables → Actions → New repository secret
```

---

## 📈 Monitoring Deployments

### View Deployment History

```bash
# Via GitHub CLI
gh run list --workflow=production-deployment.yml

# View specific run
gh run view <run-id>
```

### Check Deployment Status

**GitHub UI:**
1. Go to: https://github.com/asmortongpt/Fleet-AzureDevOps/actions
2. Click on latest workflow run
3. View deployment summary

**Production Health Check:**
```bash
# Frontend
curl -I https://fleet.capitaltechalliance.com

# API
curl https://fleet.capitaltechalliance.com/api/health
```

---

## 🛡️ Security Best Practices

### Secrets Management

✅ **Current Setup (Good):**
- All secrets stored in GitHub Secrets
- Never committed to repository
- Injected at build/deploy time

### API Key Rotation

If you need to rotate the Google Maps API key:

```bash
# Update GitHub secret
gh secret set GOOGLE_MAPS_API_KEY --repo asmortongpt/Fleet-AzureDevOps

# Re-run deployment
gh workflow run production-deployment.yml
```

---

## 🐛 Troubleshooting

### Deployment Fails at Build Stage

**Error**: TypeScript errors

**Solution**:
```bash
# Run locally
npm run typecheck

# Fix errors, then commit
git commit -am "fix: resolve TypeScript errors"
git push
```

### Deployment Fails at Deploy Stage

**Error**: `AZURE_STATIC_WEB_APPS_API_TOKEN` invalid

**Solution**:
```bash
# Get new deployment token from Azure Portal
az staticwebapp secrets list \
  --name fleet-management-production \
  --query properties.apiKey -o tsv

# Update GitHub secret
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo asmortongpt/Fleet-AzureDevOps
```

### Health Check Fails

**Error**: Frontend returns non-200 status

**Solution**:
- Wait 2-3 minutes for Azure to propagate changes
- Check Azure Static Web App logs
- Verify build succeeded and `dist/` folder was created

---

## 🔄 Rollback Procedure

If a deployment causes issues:

### Option 1: Revert via Git

```bash
# Find previous working commit
git log --oneline

# Revert to previous commit
git revert <bad-commit-sha>
git push origin main

# Pipeline will auto-deploy the revert
```

### Option 2: Re-deploy Previous Release

```bash
# Find previous release
gh release list

# Checkout previous release tag
git checkout v1.0.<previous-build-number>

# Create rollback branch
git checkout -b rollback-to-v1.0.<build-number>
git push origin rollback-to-v1.0.<build-number>

# Merge to main
gh pr create --title "Rollback to v1.0.<build-number>" --base main
```

### Option 3: Manual Deployment via Azure Portal

1. Go to Azure Portal
2. Navigate to Azure Static Web Apps
3. Go to **Deployment History**
4. Select previous successful deployment
5. Click **"Redeploy"**

---

## 📊 Pipeline Performance

**Average Deployment Time:** ~10-15 minutes

| Stage | Duration |
|-------|----------|
| Quality Gates | 3-5 min |
| Build | 2-3 min |
| Deploy | 3-5 min |
| Verification | 30 sec |
| Release Creation | 30 sec |

---

## 🎯 Next Steps

### Recommended Enhancements

- [ ] Add Playwright E2E tests in pipeline
- [ ] Implement blue-green deployments
- [ ] Add performance budgets
- [ ] Integrate Lighthouse CI
- [ ] Add Slack/Teams notifications
- [ ] Implement canary deployments
- [ ] Add automated rollback on health check failure

### Optional: Set up Staging Environment

Create a staging Azure Static Web App:

```bash
# Create staging environment
az staticwebapp create \
  --name fleet-staging \
  --resource-group FleetManagement-RG \
  --location eastus2

# Update workflow to deploy to staging first
# Then require manual approval for production
```

---

## 📞 Support

**Questions or Issues?**
- GitHub Issues: https://github.com/asmortongpt/Fleet-AzureDevOps/issues
- Email: andrew.m@capitaltechalliance.com

---

**Last Updated**: 2026-01-18
**Pipeline Version**: v1.0
**Maintained By**: DevOps Team
