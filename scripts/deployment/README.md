# Fleet Management System - Deployment Scripts

This directory contains production-grade deployment automation scripts for the Fleet Management System.

## Available Scripts

### 1. `deploy-production.sh`
**Purpose:** Complete automated production deployment

**Usage:**
```bash
./deploy-production.sh
```

**What it does:**
- ✅ Pre-flight checks (git status, dependencies)
- ✅ Quality gates (TypeScript, linting, security audit)
- ✅ Production build with optimization
- ✅ Test execution (optional)
- ✅ Deployment to Azure Static Web Apps
- ✅ Post-deployment validation
- ✅ Comprehensive logging

**When to use:** Normal production deployments from main branch

---

### 2. `setup-azure-infrastructure.sh`
**Purpose:** Initialize Azure cloud infrastructure

**Usage:**
```bash
./setup-azure-infrastructure.sh
```

**What it creates:**
- Resource Group
- Azure Container Registry
- Log Analytics Workspace
- Application Insights
- Key Vault with secrets
- Monitoring alerts and action groups

**When to use:** First-time setup or infrastructure reset

**Prerequisites:** Azure CLI installed and authenticated

---

### 3. `build-docker.sh`
**Purpose:** Build and push Docker container images

**Usage:**
```bash
./build-docker.sh
```

**What it does:**
- Builds multi-stage Docker image
- Security scanning (Trivy/Docker scan)
- Tests container health
- Pushes to Azure Container Registry
- Tags with version and 'latest'

**When to use:** Container-based deployments or Kubernetes

---

### 4. `rollback.sh`
**Purpose:** Emergency rollback to previous version

**Usage:**
```bash
./rollback.sh
```

**What it does:**
- Creates rollback branch
- Builds previous version
- Deploys to production
- Verifies rollback success
- Creates rollback documentation

**When to use:** Critical production issues requiring immediate rollback

**Safety:** Interactive prompts prevent accidental rollbacks

---

### 5. `validate-production.sh`
**Purpose:** Comprehensive production validation

**Usage:**
```bash
./validate-production.sh
```

**What it checks:**
- HTTP connectivity and status codes
- Response time performance
- SSL certificate validity
- Security headers (HSTS, CSP, etc.)
- Content delivery and compression
- Cache configuration
- Service Worker registration
- API endpoint availability
- Lighthouse performance metrics
- DNS resolution
- CDN distribution

**When to use:** After deployment or during regular health checks

---

## Quick Start

### First Time Setup

1. **Install prerequisites:**
   ```bash
   # Node.js 20+
   node --version

   # Azure CLI (optional)
   az --version

   # Docker (optional)
   docker --version
   ```

2. **Set up Azure infrastructure:**
   ```bash
   ./setup-azure-infrastructure.sh
   ```

3. **Configure environment variables:**
   ```bash
   cp ../../.env.production.example ../../.env.production
   # Edit .env.production with your values
   ```

4. **Deploy to production:**
   ```bash
   ./deploy-production.sh
   ```

5. **Validate deployment:**
   ```bash
   ./validate-production.sh
   ```

### Regular Deployment Workflow

```bash
# 1. Make changes to code
git add .
git commit -m "feat: new feature"

# 2. Deploy
./deploy-production.sh

# 3. Validate
./validate-production.sh
```

### Emergency Rollback

```bash
# If production issues detected
./rollback.sh

# Follow interactive prompts
# Validate after rollback
./validate-production.sh
```

---

## Environment Variables

### Required for Deployment

```bash
# Azure Static Web Apps
AZURE_STATIC_WEB_APP_URL=https://proud-bay-0fdc8040f.3.azurestaticapps.net
AZURE_STATIC_WEB_APPS_API_TOKEN=[from Azure Portal]

# Azure AD
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
```

### Optional for Enhanced Features

```bash
# Azure Container Registry
ACR_NAME=ctafleetregistry
ACR_REGISTRY=ctafleetregistry.azurecr.io

# Monitoring
VITE_SENTRY_DSN=[from Sentry]
VITE_POSTHOG_API_KEY=[from PostHog]
VITE_APP_INSIGHTS_CONNECTION_STRING=[from Azure]
```

---

## Troubleshooting

### Script Permissions

```bash
# If scripts aren't executable
chmod +x *.sh
```

### Azure CLI Not Authenticated

```bash
az login
az account set --subscription [SUBSCRIPTION_ID]
```

### Missing Dependencies

```bash
cd ../..
npm ci
```

### Deployment Fails

```bash
# Check deployment logs
cat deployment-*.log

# Run validation
./validate-production.sh

# Review GitHub Actions
# https://github.com/asmortongpt/Fleet/actions
```

---

## Best Practices

1. **Always run from project root context:**
   ```bash
   ./scripts/deployment/deploy-production.sh
   ```

2. **Review logs after deployment:**
   ```bash
   tail -f deployment-*.log
   ```

3. **Validate before announcing:**
   ```bash
   ./scripts/deployment/validate-production.sh
   ```

4. **Keep rollback ready:**
   - Know your last working commit
   - Test rollback in staging first
   - Document rollback reason

5. **Monitor after deployment:**
   - Check Application Insights
   - Review Sentry errors
   - Monitor PostHog analytics

---

## Script Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 130 | User cancelled (Ctrl+C) |

---

## Logging

All scripts create detailed logs:

- **Deployment:** `deployment-YYYYMMDD-HHMMSS.log`
- **Validation:** `production-validation-YYYYMMDD-HHMMSS.log`
- **Rollback:** `rollback-YYYYMMDD-HHMMSS.log`

Logs include:
- Timestamps
- All command output
- Error messages
- Success/failure status

---

## GitHub Actions Integration

These scripts complement GitHub Actions workflows:

- **Automated:** GitHub Actions on push to `main`
- **Manual:** These scripts for local/emergency deployments
- **Rollback:** These scripts for fast emergency response

---

## Security Notes

1. **Never commit secrets** to version control
2. **Use Azure Key Vault** for production secrets
3. **Rotate tokens regularly** (every 90 days)
4. **Audit deployment logs** for suspicious activity
5. **Review security headers** in validation output

---

## Support

- **Documentation:** See [DEPLOYMENT_GUIDE.md](../../DEPLOYMENT_GUIDE.md)
- **Issues:** https://github.com/asmortongpt/Fleet/issues
- **Email:** andrew.m@capitaltechalliance.com

---

**Last Updated:** 2025-12-31
**Scripts Version:** 1.0.0
