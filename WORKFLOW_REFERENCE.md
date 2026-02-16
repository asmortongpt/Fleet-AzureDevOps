# GitHub Actions Workflow Reference

Quick reference guide for all GitHub Actions workflows in Fleet-CTA.

## Workflow Files

### test.yml
**Location**: `.github/workflows/test.yml`
**Purpose**: Automated testing on every push and pull request
**Triggers**: Push/PR, manual
**Duration**: 8-12 minutes

**Jobs**:
- `frontend-tests` - Frontend unit tests, TypeScript, coverage
- `backend-tests` - Backend unit/integration tests, TypeScript, lint, coverage
- `e2e-tests` - End-to-end tests with Playwright
- `code-quality` - ESLint checks (informational)
- `build-verification` - Build production artifacts
- `test-summary` - Aggregate results

**Artifacts**:
- `frontend-coverage/` (30 days)
- `backend-coverage/` (30 days)
- `playwright-report/` (30 days)
- `build-output/` (7 days)

**When to Use**: Automatic on every code change

---

### performance.yml
**Location**: `.github/workflows/performance.yml`
**Purpose**: Performance benchmarking and bundle analysis
**Triggers**: Schedule (daily 2 AM UTC), manual
**Duration**: 5-7 minutes

**Jobs**:
- `performance-tests` - Run perf tests, build analysis
- `performance-comparison` - Compare against baseline (PRs only)
- `performance-summary` - Generate reports

**Artifacts**:
- `performance-report/` (30 days)
- `build-log/` (30 days)
- `performance-comparison/` (30 days)

**When to Use**: Automatic daily or manual for PR analysis

---

### security-scan.yml
**Location**: `.github/workflows/security-scan.yml`
**Purpose**: Security vulnerability scanning
**Triggers**: Push/PR, schedule (daily 3 AM UTC), manual
**Duration**: 3-5 minutes

**Jobs**:
- `npm-audit` - npm vulnerability scanning
- `snyk-scan` - Snyk scanning (optional, needs SNYK_TOKEN)
- `dependency-check` - Outdated packages
- `dependency-check-owasp` - OWASP scanning (optional)
- `container-scan` - Docker image scanning
- `security-summary` - Aggregate results
- `security-gate` - Fail on critical (optional)

**Artifacts**:
- `npm-audit-report` (30 days)
- `snyk-results/` (30 days)
- `outdated-packages/` (30 days)
- `dependency-check-report/` (30 days)

**When to Use**: Automatic on every change or manual

---

### deploy.yml
**Location**: `.github/workflows/deploy.yml`
**Purpose**: Manual deployment to staging/production
**Triggers**: Manual only (workflow_dispatch)
**Duration**: 15-20 minutes

**Jobs**:
- `quality-gate` - Pre-deployment tests (optional)
- `build-frontend` - Build frontend
- `build-api` - Build API
- `deploy-staging` - Deploy to staging
- `deploy-production` - Deploy to production
- `post-deployment-validation` - Smoke tests
- `create-release` - Create GitHub release
- `deployment-summary` - Final summary

**Artifacts**:
- `frontend-build/` (7 days)
- `api-build/` (7 days)
- `validation-report/` (30 days)

**How to Use**:
1. Go to: GitHub → Actions → Deployment Pipeline
2. Click: Run workflow
3. Select: Environment (staging/production)
4. Confirm: Run workflow

---

## Quick Command Reference

### Local Testing
```bash
# Frontend tests
npm run typecheck
npx vitest run
npx vitest run --coverage

# Backend tests
cd api
npm run typecheck
npm run lint
npx vitest run
npx vitest run --config vitest.integration.config.ts

# E2E tests
npx playwright test

# Build
npm run build
cd api && npm run build
```

### Viewing Workflow Results
```
GitHub → Actions → [Workflow Name] → [Run] → Logs
```

### Downloading Artifacts
```
GitHub → Actions → [Workflow Name] → [Run] → Artifacts
```

---

## GitHub Configuration

### Required Secrets
```
AZURE_CREDENTIALS
AZURE_STATIC_WEB_APPS_API_TOKEN
AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING
```

### Optional Secrets
```
SNYK_TOKEN
GOOGLE_MAPS_API_KEY
AZURE_AD_CLIENT_ID
AZURE_AD_TENANT_ID
```

### Repository Variables
```
SNYK_ENABLED=true (optional)
OWASP_ENABLED=true (optional)
SECURITY_STRICT_MODE=true (optional)
```

---

## Trigger Matrix

| Workflow | Push | PR | Schedule | Manual | Inputs |
|----------|------|-----|----------|--------|--------|
| test.yml | ✓ | ✓ | | ✓ | |
| performance.yml | | | Daily 2 AM UTC | ✓ | branch |
| security-scan.yml | ✓ | ✓ | Daily 3 AM UTC | ✓ | |
| deploy.yml | | | | ✓ | env, skip_tests |

---

## Environment URLs

**Staging**: https://staging.fleet.capitaltechalliance.com
**Production**: https://fleet.capitaltechalliance.com

---

## Troubleshooting

### Workflow Won't Start
- Check GitHub Actions tab
- Verify workflow file syntax
- Check for required secrets/variables

### Tests Failing
- Run locally first
- Check test logs in GitHub Actions
- Review coverage reports

### Deployment Issues
- Verify Azure credentials
- Check deployment logs
- Validate health checks

### Performance Workflow Slow
- Check build logs
- Monitor artifact size
- Review dependency count

---

## Documentation

**Main Reference**: `.github/workflows/README.md` (709 lines)
**Summary**: `CI_CD_PIPELINE_SUMMARY.md`
**This File**: `WORKFLOW_REFERENCE.md`

---

For detailed information, see `.github/workflows/README.md`
