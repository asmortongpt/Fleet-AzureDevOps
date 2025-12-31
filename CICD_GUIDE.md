# CI/CD Pipeline Guide

## Fleet Management System - Continuous Integration & Deployment

This guide covers the comprehensive CI/CD pipeline implemented for the Fleet Management System, including GitHub Actions workflows, automated testing, security scanning, and deployment strategies.

---

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [CI Workflow](#ci-workflow)
4. [Deployment Workflow](#deployment-workflow)
5. [Dependency Management](#dependency-management)
6. [Performance Monitoring](#performance-monitoring)
7. [Security Scanning](#security-scanning)
8. [Environment Variables](#environment-variables)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Fleet Management System uses a multi-stage CI/CD pipeline that ensures code quality, security, and reliable deployments:

- **Continuous Integration**: Automated testing, linting, and building on every push
- **Security Scanning**: Vulnerability detection in dependencies and container images
- **Performance Monitoring**: Bundle size tracking and Lighthouse audits
- **Automated Deployments**: Zero-downtime deployments to Azure and Kubernetes
- **Dependency Updates**: Automated weekly dependency updates with security patches

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├──> Push/PR Trigger
                  │
        ┌─────────▼──────────┐
        │   CI Pipeline       │
        │  (ci.yml)           │
        │                     │
        │  • Code Quality     │
        │  • Unit Tests       │
        │  • E2E Tests        │
        │  • Security Scans   │
        │  • Build            │
        │  • Docker Image     │
        └─────────┬───────────┘
                  │
                  ├──> Artifacts
                  │
        ┌─────────▼──────────┐
        │ Deploy Pipeline     │
        │ (deploy.yml)        │
        │                     │
        │  • Azure Static     │
        │  • Kubernetes       │
        │  • Health Checks    │
        └─────────┬───────────┘
                  │
                  └──> Production
```

---

## CI Workflow

Location: `.github/workflows/ci.yml`

### Triggered By:
- Push to: `main`, `develop`, `feature/**`, `bugfix/**`, `security/**`
- Pull requests to: `main`, `develop`

### Jobs:

#### 1. Code Quality
```yaml
Runs: ESLint, TypeScript type checking, Prettier format check
Duration: ~5 minutes
```

#### 2. Unit Tests
```yaml
Runs: Vitest unit tests with coverage
Coverage: Uploaded to Codecov
Duration: ~5-10 minutes
```

#### 3. E2E Tests
```yaml
Runs: Playwright tests across Chromium, Firefox, and WebKit
Artifacts: Test reports and screenshots
Duration: ~15-20 minutes
```

#### 4. Security Scanning
```yaml
Tools:
  - npm audit (dependency vulnerabilities)
  - Snyk (comprehensive security scanning)
  - Trivy (filesystem and image scanning)
Duration: ~5-10 minutes
```

#### 5. Build
```yaml
Runs: npm run build
Artifacts: dist/ directory
Cache: Build output for subsequent jobs
Duration: ~5 minutes
```

#### 6. Docker Build & Scan
```yaml
Runs:
  - Multi-stage Docker build
  - Trivy image vulnerability scan
  - Push to GitHub Container Registry
Duration: ~10-15 minutes
```

#### 7. Performance Budget
```yaml
Checks:
  - Bundle size limits
  - Individual asset sizes
Duration: ~2 minutes
```

#### 8. Accessibility Tests
```yaml
Runs: WCAG 2.1 AA compliance checks
Duration: ~5 minutes
```

### Example Usage:

```bash
# Trigger CI manually
gh workflow run ci.yml

# View CI status
gh run list --workflow=ci.yml

# Download artifacts
gh run download <run-id>
```

---

## Deployment Workflow

Location: `.github/workflows/deploy.yml`

### Triggered By:
- Release published
- Manual trigger with environment selection

### Deployment Targets:

#### 1. Azure Static Web Apps
```yaml
Environment: Production/Staging
URL: https://proud-bay-0fdc8040f.3.azurestaticapps.net
Health Check: Automated post-deployment validation
```

#### 2. Kubernetes (AKS)
```yaml
Cluster: Azure Kubernetes Service
Namespace: fleet-management
Rolling Update: Zero-downtime deployments
Health Check: Readiness and liveness probes
```

### Deployment Process:

1. **Pre-deployment Validation**
   - Run smoke tests
   - Verify build
   - Security audit

2. **Deploy to Azure**
   - Build application with production config
   - Deploy to Azure Static Web Apps
   - Capture deployment URL

3. **Deploy to Kubernetes** (on release)
   - Update ConfigMaps
   - Apply manifests
   - Wait for rollout completion
   - Verify deployment

4. **Post-deployment**
   - Health checks
   - Smoke tests on live environment
   - Rollback if validation fails

### Manual Deployment:

```bash
# Deploy to staging
gh workflow run deploy.yml -f environment=staging

# Deploy to production
gh workflow run deploy.yml -f environment=production

# Deploy with skip tests
gh workflow run deploy.yml -f environment=staging -f skip_tests=true
```

---

## Dependency Management

Location: `.github/workflows/dependency-update.yml`

### Features:

- **Automated Weekly Updates**: Every Monday at 3 AM UTC
- **Security Patches**: Automatic `npm audit fix`
- **Pull Request Creation**: Automated PR with changelog
- **Test Execution**: Validates updates before merging

### Update Types:

1. **Patch Updates**: Bug fixes and security patches
2. **Minor Updates**: New features (backward compatible)
3. **All Updates**: Major + Minor + Patch (use with caution)

### Manual Trigger:

```bash
# Update patch versions
gh workflow run dependency-update.yml -f update_type=patch

# Update minor versions
gh workflow run dependency-update.yml -f update_type=minor

# Update all
gh workflow run dependency-update.yml -f update_type=all
```

### Review Process:

1. Automated PR created with changes
2. Review changed dependencies
3. Check CI status (all tests must pass)
4. Verify bundle size hasn't increased significantly
5. Merge if all checks pass

---

## Performance Monitoring

Location: `.github/workflows/performance.yml`

### Lighthouse CI

**Budgets:**
```json
{
  "performance": 90,
  "accessibility": 100,
  "best-practices": 90,
  "seo": 90
}
```

**Metrics Tracked:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)
- Speed Index

### Bundle Size Limits:

```
Total: < 10MB
Assets: < 5MB
Individual JS: < 500KB
Individual CSS: < 200KB
```

### Performance Regression Detection:

- Compares build size with base branch
- Fails if size increases by >10% or >500KB
- Tracks individual asset sizes

---

## Security Scanning

### Vulnerability Detection:

1. **npm audit**
   - Production dependencies only
   - Critical/High severity threshold
   - Automated fixes where possible

2. **Snyk**
   - Comprehensive security scanning
   - License compliance checks
   - Actionable remediation advice

3. **Trivy**
   - Filesystem scanning
   - Container image scanning
   - OS package vulnerabilities
   - Results uploaded to GitHub Security

### Security Best Practices:

- All secrets stored in GitHub Secrets
- No hardcoded credentials in code
- Regular dependency updates
- Container images scanned before deployment
- Network policies in Kubernetes

---

## Environment Variables

### GitHub Secrets Required:

```bash
# Azure
AZURE_STATIC_WEB_APPS_API_TOKEN
AZURE_CREDENTIALS
AZURE_RESOURCE_GROUP
AKS_CLUSTER_NAME

# Application
VITE_AZURE_AD_CLIENT_ID
VITE_AZURE_AD_TENANT_ID
VITE_AZURE_AD_REDIRECT_URI

# API Configuration
API_URL
WS_URL

# Security
CODECOV_TOKEN (optional)
SNYK_TOKEN (optional)
LHCI_GITHUB_APP_TOKEN (optional)
```

### Setting Secrets:

```bash
# Via GitHub CLI
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN

# Via GitHub UI
Settings → Secrets and variables → Actions → New repository secret
```

---

## Troubleshooting

### Common Issues:

#### CI Pipeline Fails on Build

```bash
# Check build logs
gh run view <run-id> --log

# Run build locally
npm ci
npm run build
```

#### E2E Tests Fail

```bash
# Run tests locally with UI
npm run test:e2e:ui

# Check Playwright report
npm run test:e2e:report
```

#### Docker Build Fails

```bash
# Build locally
docker build -t fleet-local:test .

# Check Dockerfile syntax
docker build --no-cache -t fleet-local:test .
```

#### Deployment Fails

```bash
# Check deployment logs
gh run view <run-id> --log

# Verify secrets are set
gh secret list

# Manual health check
curl -f https://proud-bay-0fdc8040f.3.azurestaticapps.net/health.txt
```

#### Security Scan Failures

```bash
# Run locally
npm audit --production

# Check for specific vulnerability
npm audit | grep <package-name>

# Update specific package
npm update <package-name>
```

### Getting Help:

1. Check workflow logs in GitHub Actions
2. Review artifact outputs (test reports, build logs)
3. Run workflows locally where possible
4. Check Azure Portal for deployment issues
5. Review Kubernetes events: `kubectl get events -n fleet-management`

---

## Best Practices

### For Developers:

1. **Always run tests locally before pushing**
   ```bash
   npm run test:unit
   npm run test:e2e
   npm run lint
   ```

2. **Keep dependencies up to date**
   - Review weekly dependency update PRs
   - Test thoroughly before merging

3. **Monitor bundle size**
   ```bash
   npm run build:check
   ```

4. **Write meaningful commit messages**
   - Use conventional commits format
   - Reference issue numbers

### For DevOps:

1. **Rotate secrets regularly**
2. **Monitor CI/CD costs**
3. **Keep workflows updated**
4. **Review security scan results weekly**
5. **Maintain deployment documentation**

---

## Continuous Improvement

### Planned Enhancements:

- [ ] Canary deployments
- [ ] Feature flags integration
- [ ] A/B testing infrastructure
- [ ] Performance monitoring dashboard
- [ ] Automated rollback on errors
- [ ] Multi-region deployments

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Snyk Documentation](https://docs.snyk.io/)

---

**Last Updated**: 2025-12-31
**Maintained By**: Capital Tech Alliance DevOps Team
