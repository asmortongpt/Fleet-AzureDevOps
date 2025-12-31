# Fleet Management System - Production Deployment Guide

**Version:** 1.0.1
**Last Updated:** 2025-12-31
**Environment:** Production
**Target URL:** https://proud-bay-0fdc8040f.3.azurestaticapps.net

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Deployment Process](#deployment-process)
5. [Monitoring & Validation](#monitoring--validation)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Overview

The Fleet Management System uses a modern Azure-based infrastructure with automated CI/CD pipelines for production deployments. This guide covers both automated (GitHub Actions) and manual deployment methods.

### Architecture

- **Frontend Hosting:** Azure Static Web Apps
- **Container Registry:** Azure Container Registry (ACR)
- **Secrets Management:** Azure Key Vault
- **Monitoring:** Azure Application Insights + Sentry + PostHog
- **CDN:** Azure Front Door (optional)
- **CI/CD:** GitHub Actions

### Deployment Methods

1. **Automated (Recommended):** Push to `main` branch triggers GitHub Actions
2. **Manual:** Run deployment scripts locally
3. **Emergency:** Fast rollback procedures

---

## Prerequisites

### Required Tools

```bash
# Node.js 20+
node --version  # Should be v20.x.x

# npm
npm --version

# Git
git --version

# Azure CLI (optional for infrastructure setup)
az --version

# Docker (optional for container builds)
docker --version
```

### Required Environment Variables

Create a `.env.production` file with:

```bash
# Environment
NODE_ENV=production
VITE_APP_ENV=production

# Azure AD
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=https://proud-bay-0fdc8040f.3.azurestaticapps.net/auth/callback

# API
VITE_API_BASE_URL=https://proud-bay-0fdc8040f.3.azurestaticapps.net/api

# Monitoring
VITE_SENTRY_DSN=[Get from Sentry dashboard]
VITE_POSTHOG_API_KEY=[Get from PostHog dashboard]
VITE_APP_INSIGHTS_CONNECTION_STRING=[Get from Azure]
```

### GitHub Secrets

Configure these secrets in your GitHub repository:

- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Deployment token
- `VITE_AZURE_AD_CLIENT_ID` - Azure AD client ID
- `VITE_AZURE_AD_TENANT_ID` - Azure AD tenant ID
- `AZURE_CREDENTIALS` - Service principal credentials (JSON)
- `SENTRY_DSN` - Sentry error tracking DSN
- `POSTHOG_API_KEY` - PostHog analytics key

---

## Infrastructure Setup

### Option 1: Automated Setup (Recommended)

Run the infrastructure setup script:

```bash
./scripts/deployment/setup-azure-infrastructure.sh
```

This script will create:
- Resource Group
- Azure Container Registry
- Log Analytics Workspace
- Application Insights
- Key Vault with secrets
- Monitoring alerts

### Option 2: Manual Setup

#### 1. Create Resource Group

```bash
az group create \
  --name fleet-management-prod \
  --location eastus2 \
  --tags Environment=Production Project=FleetManagement
```

#### 2. Create Static Web App

```bash
az staticwebapp create \
  --name fleet-management-app \
  --resource-group fleet-management-prod \
  --location eastus2 \
  --sku Free
```

#### 3. Get Deployment Token

```bash
az staticwebapp secrets list \
  --name fleet-management-app \
  --resource-group fleet-management-prod \
  --query "properties.apiKey" -o tsv
```

Add this token to GitHub Secrets as `AZURE_STATIC_WEB_APPS_API_TOKEN`.

#### 4. Create Application Insights

```bash
az monitor app-insights component create \
  --app fleet-insights-prod \
  --resource-group fleet-management-prod \
  --location eastus2 \
  --kind web
```

---

## Deployment Process

### Method 1: Automated Deployment (GitHub Actions)

**Recommended for production use**

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **Monitor deployment:**
   - GitHub Actions: https://github.com/asmortongpt/Fleet/actions
   - Logs show: Quality gates → Tests → Build → Deploy → Validation

4. **Verify deployment:**
   - The workflow automatically runs post-deployment smoke tests
   - Check the workflow summary for deployment URL

### Method 2: Manual Deployment Script

**For emergency deployments or testing**

1. **Run the deployment script:**
   ```bash
   ./scripts/deployment/deploy-production.sh
   ```

2. **Follow the interactive prompts:**
   - Confirm branch and commit
   - Review quality gates
   - Run tests (optional)
   - Deploy to Azure

3. **Script phases:**
   - ✅ Phase 1: Pre-flight checks
   - ✅ Phase 2: Install dependencies
   - ✅ Phase 3: Quality gates (TypeScript, lint, security)
   - ✅ Phase 4: Build production bundle
   - ✅ Phase 5: Run tests
   - ✅ Phase 6: Deploy to Azure
   - ✅ Phase 7: Post-deployment verification
   - ✅ Phase 8: Summary report

### Method 3: Docker Container Deployment

**For Kubernetes or containerized environments**

1. **Build Docker image:**
   ```bash
   ./scripts/deployment/build-docker.sh
   ```

2. **Push to Azure Container Registry:**
   - Script automatically pushes to ACR
   - Tags: `latest` and version-specific

3. **Deploy container:**
   ```bash
   # Using Docker
   docker run -p 8080:8080 ctafleetregistry.azurecr.io/fleet-management:latest

   # Or using Kubernetes
   kubectl apply -f kubernetes/deployment.yaml
   ```

---

## Monitoring & Validation

### Automated Validation

Run the validation script:

```bash
./scripts/deployment/validate-production.sh
```

This checks:
- ✅ Basic connectivity (HTTP status)
- ✅ Response time (<2s target)
- ✅ SSL certificate validity
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Content delivery and compression
- ✅ Cache headers
- ✅ Service Worker (PWA)
- ✅ API endpoints
- ✅ Performance metrics (Lighthouse)
- ✅ DNS resolution
- ✅ CDN/Edge distribution

### Manual Health Checks

```bash
# Quick health check
curl -I https://proud-bay-0fdc8040f.3.azurestaticapps.net

# Response time test
curl -o /dev/null -s -w '%{time_total}\n' https://proud-bay-0fdc8040f.3.azurestaticapps.net

# SSL certificate check
openssl s_client -connect proud-bay-0fdc8040f.3.azurestaticapps.net:443 -servername proud-bay-0fdc8040f.3.azurestaticapps.net </dev/null
```

### Monitoring Dashboards

1. **Azure Application Insights:**
   - Portal: https://portal.azure.com
   - Navigate to: fleet-insights-prod
   - View: Performance, Failures, Availability

2. **Sentry Error Tracking:**
   - Dashboard: https://sentry.io
   - Project: fleet-management
   - Monitor: Real-time errors and exceptions

3. **PostHog Analytics:**
   - Dashboard: https://app.posthog.com
   - View: User behavior, feature usage, funnels

4. **GitHub Actions:**
   - History: https://github.com/asmortongpt/Fleet/actions
   - Monitor: Deployment status and logs

---

## Rollback Procedures

### Emergency Rollback

If critical issues are detected in production:

1. **Run rollback script:**
   ```bash
   ./scripts/deployment/rollback.sh
   ```

2. **Follow the prompts:**
   - Confirm rollback
   - Provide rollback reason
   - Select target commit (or use previous)
   - Verify rollback

3. **Script actions:**
   - Creates rollback branch
   - Builds previous version
   - Deploys to Azure
   - Verifies deployment
   - Creates rollback log

### Manual Rollback via GitHub

1. **Find previous working commit:**
   ```bash
   git log --oneline -10
   ```

2. **Create rollback branch:**
   ```bash
   git checkout -b rollback-YYYYMMDD [COMMIT_SHA]
   ```

3. **Force push to main:**
   ```bash
   git push origin rollback-YYYYMMDD:main --force
   ```

4. **Monitor GitHub Actions for automatic deployment**

### Rollback via Azure Portal

1. Navigate to Static Web App in Azure Portal
2. Go to "Deployment History"
3. Select previous successful deployment
4. Click "Activate"

---

## Troubleshooting

### Common Issues

#### Issue: Deployment fails at build step

**Solution:**
```bash
# Clear cache and rebuild locally
rm -rf node_modules package-lock.json dist
npm install
npm run build

# If successful, commit and push
git add package-lock.json
git commit -m "fix: update dependencies"
git push
```

#### Issue: TypeScript errors in production build

**Solution:**
```bash
# Run type check locally
npm run typecheck

# Fix errors, then rebuild
npm run build
```

#### Issue: Application loads but shows errors

**Possible causes:**
1. Missing environment variables
2. API endpoints not configured
3. CORS issues

**Solution:**
```bash
# Check browser console for specific errors
# Verify environment variables in Azure Portal
# Check Application Insights for server-side errors
```

#### Issue: Slow response times

**Solution:**
```bash
# Run performance validation
./scripts/deployment/validate-production.sh

# Check Lighthouse report
lighthouse https://proud-bay-0fdc8040f.3.azurestaticapps.net

# Review bundle size
npm run build:analyze
```

### Getting Help

1. **Check logs:**
   - GitHub Actions logs
   - Azure Application Insights
   - Browser console (F12)

2. **Review documentation:**
   - This guide
   - Azure Static Web Apps docs
   - GitHub Actions docs

3. **Contact team:**
   - Create GitHub issue
   - Notify on team channel
   - Email: andrew.m@capitaltechalliance.com

---

## Maintenance

### Regular Tasks

#### Weekly
- [ ] Review Application Insights metrics
- [ ] Check error rates in Sentry
- [ ] Monitor user analytics in PostHog
- [ ] Review security alerts

#### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Review bundle size trends
- [ ] Check SSL certificate expiry
- [ ] Review and update secrets rotation

#### Quarterly
- [ ] Performance optimization review
- [ ] Infrastructure cost analysis
- [ ] Disaster recovery test
- [ ] Update deployment documentation
- [ ] Security penetration testing

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Run tests
npm test

# Deploy if tests pass
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
```

### Security Updates

```bash
# Run security audit
npm audit

# Fix vulnerabilities automatically
npm audit fix

# For breaking changes
npm audit fix --force

# Manual review required
npm audit
```

---

## Emergency Contacts

- **Technical Lead:** Andrew Morton (andrew.m@capitaltechalliance.com)
- **Azure Support:** https://portal.azure.com → Support
- **GitHub Support:** https://support.github.com

---

## Appendix

### Deployment Checklist

Pre-Deployment:
- [ ] All tests passing locally
- [ ] TypeScript compilation successful
- [ ] No linting errors
- [ ] Security audit clean
- [ ] Environment variables configured
- [ ] GitHub secrets up to date

During Deployment:
- [ ] Monitor GitHub Actions workflow
- [ ] Watch for build errors
- [ ] Verify deployment success
- [ ] Check health endpoints

Post-Deployment:
- [ ] Run validation script
- [ ] Check Application Insights
- [ ] Monitor error rates
- [ ] Verify user access
- [ ] Update team on status

### Useful Commands

```bash
# Check deployment status
gh run list --limit 5

# View latest deployment logs
gh run view --log

# Check production health
curl -I https://proud-bay-0fdc8040f.3.azurestaticapps.net

# View Azure resources
az resource list --resource-group fleet-management-prod --output table

# Get Static Web App details
az staticwebapp show --name fleet-management-app --resource-group fleet-management-prod

# List deployments
az staticwebapp environment list --name fleet-management-app --resource-group fleet-management-prod
```

### Performance Targets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Response Time | <2s | <5s | >5s |
| Lighthouse Performance | >90 | >70 | <70 |
| Availability | >99.9% | >99% | <99% |
| Error Rate | <0.1% | <1% | >1% |
| Bundle Size | <5MB | <10MB | >10MB |

---

**Document Version:** 1.0.0
**Last Review:** 2025-12-31
**Next Review:** 2026-01-31
