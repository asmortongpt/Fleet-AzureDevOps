# GitHub Actions CI/CD Workflows

Comprehensive CI/CD pipeline for the Fleet-CTA project. All workflows are production-ready and follow GitHub Actions best practices.

## Workflow Overview

### Core Workflows

1. **[test.yml](#test-workflow)** - Comprehensive test suite
2. **[performance.yml](#performance-workflow)** - Performance benchmarking
3. **[deploy.yml](#deploy-workflow)** - Deployment to staging/production
4. **[security-scan.yml](#security-workflow)** - Security vulnerability scanning
5. **[production-deployment.yml](#production-deployment-workflow)** - Azure Static Web Apps deployment
6. **[ci-cd.yml](#legacy-ci-cd-workflow)** - Legacy CI/CD pipeline (AKS)

---

## Test Workflow

**File**: `test.yml`

Comprehensive automated testing on every push and pull request.

### When It Runs

- **Push**: On all branches (`main`, `develop`, `feature/**`, `fix/**`)
- **Pull Request**: When targeting `main` or `develop`
- **Manual**: Via workflow_dispatch

### Jobs

#### Frontend Tests
- Installs dependencies
- TypeScript type checking
- Unit tests via Vitest
- Coverage report generation
- Artifacts: Coverage reports

#### Backend Tests
- API dependency installation
- TypeScript type checking
- ESLint linting
- Unit tests via Vitest
- Integration tests (separate config)
- Coverage report generation
- Artifacts: Coverage reports

#### E2E Tests
- Installs Playwright browsers
- Runs full E2E test suite
- Generates HTML report
- Captures screenshots on failures
- Artifacts: Playwright test report

#### Code Quality
- Frontend ESLint checks
- Backend ESLint checks
- Non-blocking (informational)

#### Build Verification
- Frontend production build
- Verifies `dist/` output
- Backend build (if available)
- Artifacts: Build output

### Artifacts

All artifacts retained for 30 days:
- `frontend-coverage/` - Frontend coverage reports
- `backend-coverage/` - Backend coverage reports
- `playwright-report/` - E2E test results
- `build-output/` - Built dist/ and api/dist/

### Local Testing

Run the same checks locally:

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

### Branch Protection

Configure GitHub branch protection:

1. Go to Settings → Branches
2. Add rule for `main` and `develop`
3. Check "Require status checks to pass before merging"
4. Select required checks:
   - `frontend-tests`
   - `backend-tests`
   - `build-verification`

---

## Performance Workflow

**File**: `performance.yml`

Performance benchmarking and bundle analysis.

### When It Runs

- **Schedule**: Daily at 2 AM UTC
- **Manual**: Via workflow_dispatch with optional branch comparison

### Jobs

#### Performance Tests
- Runs performance test suite (if available)
- Builds frontend and analyzes bundle size
- Extracts build metrics
- Creates performance report

#### Performance Comparison
- Runs only on pull requests
- Compares current branch against base branch
- Analyzes build size changes
- Generates comparison report

#### Performance Summary
- Aggregates all reports
- Posts summary to GitHub actions summary
- Provides recommendations

### Artifacts

- `performance-report/` - Build analysis and metrics
- `build-log/` - Full build log
- `performance-comparison/` - Baseline comparison (PRs only)

### Local Testing

```bash
# If test:performance script exists
npm run test:performance

# Build analysis
npm run build

# Check bundle size
du -sh dist/
```

### Thresholds

Default recommendations:
- Bundle size alert: > 500KB
- CSS alert: > 100KB per file
- Monitor new large dependencies

---

## Deploy Workflow

**File**: `deploy.yml`

Manual deployment pipeline with quality gates.

### When It Runs

- **Manual only**: Via `workflow_dispatch`
- **Inputs**:
  - `environment`: Choose `staging` or `production`
  - `skip_tests`: Skip test verification (not recommended)

### Deployment Flow

```
Quality Gate
    ↓
├─→ Build Frontend ──┐
├─→ Build API ───────┤
    ↓                 ↓
Deploy (Staging/Prod)
    ↓
Post-Deployment Validation
    ↓
Create Release (Prod only)
    ↓
Deployment Summary
```

### Quality Gates

When `skip_tests` is false (default):
- TypeScript checks must pass
- Linting must pass (informational)
- Frontend tests must pass
- Backend tests must pass
- Builds must succeed

### Manual Deployment

1. Go to Actions → Deployment Pipeline
2. Click "Run workflow"
3. Select environment: `staging` or `production`
4. Optionally skip tests (not recommended)
5. Click "Run workflow"

### Staging Deployment

- Deploys to Azure Static Web Apps staging
- Runs health checks
- Validates frontend and API availability
- No release creation

### Production Deployment

- Requires staging deployment success
- Stricter health checks (must succeed)
- Creates GitHub release with changelog
- Generates detailed summary

### Environment URLs

- **Staging**: https://staging.fleet.capitaltechalliance.com
- **Production**: https://fleet.capitaltechalliance.com

### Required Secrets

| Secret | Used For |
|--------|----------|
| `AZURE_CREDENTIALS` | Azure authentication |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING` | Staging deployment |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Production deployment |
| `GOOGLE_MAPS_API_KEY` | Maps feature in build |
| `AZURE_AD_CLIENT_ID` | Azure AD auth |
| `AZURE_AD_TENANT_ID` | Azure AD auth |
| `GITHUB_TOKEN` | Release creation |

---

## Security Workflow

**File**: `security-scan.yml`

Security vulnerability scanning and dependency analysis.

### When It Runs

- **Push**: On all branches
- **Pull Request**: Against `main` or `develop`
- **Schedule**: Daily at 3 AM UTC
- **Manual**: Via workflow_dispatch

### Jobs

#### npm Audit
- Scans frontend for vulnerabilities
- Scans API for vulnerabilities
- Generates audit report
- Artifacts: `npm-audit-report`

#### Snyk Security Scan
- Scans with Snyk (if enabled)
- Sets severity threshold: high
- Artifacts: `snyk-results/`
- **Requires**: `SNYK_TOKEN` secret and `SNYK_ENABLED` variable

#### Dependency Check
- Lists outdated packages (frontend and backend)
- Artifacts: `outdated-packages/`
- Non-blocking (informational)

#### OWASP Dependency-Check
- Runs OWASP dependency checker
- Enabled via `OWASP_ENABLED` variable
- Artifacts: JSON and HTML reports

#### Container Image Scan
- Scans Docker images with Trivy
- Uploads SARIF results to GitHub Security
- Runs only if Dockerfile exists

#### Security Summary
- Aggregates all scan results
- Posts to GitHub actions summary
- Provides remediation recommendations

### Artifacts

- `npm-audit-report` - npm audit results
- `snyk-results/` - Snyk scan results
- `outdated-packages/` - Outdated packages list
- `dependency-check-report/` - OWASP reports

### Enabling Advanced Scanning

Set repository variables to enable:

```bash
# Repository Settings → Variables → New variable
SNYK_ENABLED=true
OWASP_ENABLED=true
SECURITY_STRICT_MODE=true  # Fail on critical vulnerabilities
```

Also set secrets:

```bash
# Repository Settings → Secrets → New secret
SNYK_TOKEN=<your-snyk-token>
```

### Local Security Checks

```bash
# npm audit
npm audit --audit-level=moderate --production
cd api && npm audit --audit-level=moderate --production

# Check for outdated packages
npm outdated
cd api && npm outdated

# Snyk (if installed)
snyk test --severity-threshold=high
```

### Remediation

When vulnerabilities are found:

1. Review the artifact reports
2. Update affected packages:
   ```bash
   npm update package-name
   cd api && npm update package-name
   ```
3. Re-run tests to ensure compatibility
4. Commit and push changes
5. Monitor the security workflow in next run

---

## Production Deployment Workflow

**File**: `production-deployment.yml`

Automated Azure Static Web Apps deployment (runs on push to main).

### When It Runs

- **Push**: To `main` branch only
- **Manual**: Via workflow_dispatch (choose staging/production)

### Jobs

1. **Quality Gates** - Frontend tests and type checks
2. **Build Frontend** - Production build with optimization
3. **Build API** - API production build
4. **Deploy Production** - Azure Static Web Apps deployment
5. **Verify Deployment** - Health checks
6. **Create Release** - GitHub release creation

### Deployment to Azure

Configured via Azure Static Web Apps GitHub integration:

1. Build artifacts uploaded from `dist/`
2. API uploaded from `api/dist/` (if available)
3. Automatic deployment on push to main
4. Status checks integrated with GitHub

### Configuration

See `AZURE.md` for:
- Azure Static Web Apps setup
- GitHub integration
- Environment variables
- Custom domain configuration

---

## Legacy CI/CD Workflow

**File**: `ci-cd.yml`

Legacy workflow for AKS deployment (Kubernetes).

### When It Runs

- **Push**: To `main` branch
- **Pull Request**: Against `main` branch

### Jobs

1. **Lint & Type Check** - ESLint and TypeScript
2. **Unit & Integration Tests** - Vitest suite
3. **Security Scan** - npm audit + Snyk
4. **Build Docker Image** - Creates container image
5. **Deploy to Staging** - AKS staging namespace
6. **Deploy to Production** - AKS production namespace

### Note

This workflow is for AKS deployments. For Azure Static Web Apps, use `production-deployment.yml`.

---

## Workflow Best Practices

### Caching

All workflows use GitHub's npm cache:

```yaml
setup-node@v4
  with:
    cache: 'npm'
```

This caches `node_modules/` between runs, saving 30-60 seconds per job.

### Node Memory

Frontend builds require increased memory:

```bash
NODE_OPTIONS: '--max-old-space-size=4096'
```

This prevents memory exhaustion during Vite compilation.

### Artifact Retention

- Coverage reports: 30 days
- Build output: 7 days
- Test reports: 30 days

Older artifacts are automatically deleted.

### Parallel Jobs

Where possible, jobs run in parallel:

```
Quality Gate
    ↓
├─→ Frontend Tests
├─→ Backend Tests
├─→ Code Quality
│
└─→ Build Verification
```

### Conditional Steps

Steps use `continue-on-error: true` for non-critical tasks:

```yaml
run: npm audit
continue-on-error: true
```

This allows the workflow to continue even if secondary checks fail.

### Environment Configuration

Environment-specific URLs and secrets:

```yaml
env:
  PRODUCTION_URL: https://fleet.capitaltechalliance.com
  STAGING_URL: https://staging.fleet.capitaltechalliance.com
```

---

## Troubleshooting

### Build Failures

**Error**: "ENOSPC: no space left on device"

**Solution**: Clear Docker cache:
```bash
# In workflow, add:
- name: Free disk space
  run: |
    sudo apt-get clean
    docker image prune -a --force
```

### Test Timeouts

**Error**: Tests exceed 10-minute timeout

**Solution**:
- Increase timeout in workflow: `timeout-minutes: 20`
- Profile slow tests locally
- Split tests into multiple jobs

### Deployment Failures

**Error**: Azure authentication fails

**Solution**:
1. Verify `AZURE_CREDENTIALS` secret is valid
2. Check JSON format of credentials
3. Ensure subscription hasn't expired
4. Re-create credentials if needed

### Coverage Upload Failures

**Error**: Codecov or Codacy upload fails

**Solution**:
- Verify tokens in secrets
- Check coverage file paths
- Ensure coverage files are generated

---

## GitHub Secrets Required

### Essential Secrets

```bash
AZURE_CREDENTIALS          # Azure AD service principal credentials
AZURE_STATIC_WEB_APPS_API_TOKEN  # Azure Static Web Apps deployment token
GITHUB_TOKEN              # Auto-provided, used for releases
```

### Optional Secrets

```bash
SNYK_TOKEN                 # For Snyk security scanning
GOOGLE_MAPS_API_KEY        # For Maps features
AZURE_AD_CLIENT_ID         # For Azure AD auth
AZURE_AD_TENANT_ID         # For Azure AD auth
```

### Setting Secrets

1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add secret name and value
5. Secrets are never logged or displayed in workflows

---

## GitHub Variables

Optional repository variables for feature flags:

```bash
# Security scanning
SNYK_ENABLED=true
OWASP_ENABLED=true
SECURITY_STRICT_MODE=true

# Performance
ENABLE_PERFORMANCE_TESTS=true
```

Set in Settings → Secrets and variables → Variables

---

## Monitoring & Status

### View Workflow Status

1. Go to Actions tab in GitHub
2. Select workflow on left sidebar
3. View recent runs with status badges
4. Click run to see detailed logs

### Status Badges

Add to README.md:

```markdown
![Tests](https://github.com/CapitalTechHub/Fleet-CTA/actions/workflows/test.yml/badge.svg)
![Security](https://github.com/CapitalTechHub/Fleet-CTA/actions/workflows/security-scan.yml/badge.svg)
![Deploy](https://github.com/CapitalTechHub/Fleet-CTA/actions/workflows/deploy.yml/badge.svg)
```

### Notifications

Configure in Settings → Code security and analysis:
- Email notifications on workflow failures
- Slack integration (via GitHub App)
- Custom webhooks

---

## Performance Optimization

### Workflow Times

Current average times:
- **Test workflow**: 8-12 minutes
- **Performance workflow**: 5-7 minutes
- **Security workflow**: 3-5 minutes
- **Deploy workflow**: 15-20 minutes

### Optimization Tips

1. Use `paths` to run workflows only on relevant changes:
   ```yaml
   on:
     push:
       paths:
         - 'src/**'
         - 'package.json'
   ```

2. Cache dependencies aggressively
3. Run jobs in parallel where possible
4. Use `needs` to express dependencies
5. Use `if:` conditions to skip unnecessary jobs

### Resource Usage

- **VM Size**: ubuntu-latest (standard 2-core, 7GB RAM)
- **Concurrent Jobs**: Up to 20 on GitHub
- **Storage**: Artifacts limited by plan

---

## Future Enhancements

Planned improvements:

- [ ] Add visual regression testing
- [ ] Implement performance budgets
- [ ] Add lighthouse CI
- [ ] Database migration testing
- [ ] Canary deployments
- [ ] Blue-green deployment strategy
- [ ] Automated rollback on failures
- [ ] Slack notifications with results
- [ ] Custom metrics and alerts

---

## Maintenance

### Regular Tasks

- [ ] Review and update workflow syntax quarterly
- [ ] Check for deprecated GitHub Actions
- [ ] Update Node.js version when needed
- [ ] Review and optimize job durations
- [ ] Clean up old artifacts manually if needed
- [ ] Update secret rotation schedule

### Updating Workflows

1. Create feature branch
2. Edit workflow file
3. Test via `workflow_dispatch` if possible
4. Create pull request with changes
5. Review and merge
6. Changes apply to next workflow run

### Version Pinning

All GitHub Actions use specific versions for stability:

```yaml
uses: actions/checkout@v4          # Specific major version
uses: actions/upload-artifact@v4   # Pinned for reliability
```

---

## Support & Contact

For workflow issues:
- Check GitHub Actions logs for detailed error messages
- Review GitHub Actions documentation
- Contact DevOps team or repository maintainers

**Last Updated**: February 2026
**Owner**: Andrew Morton
**Contact**: andrew.m@capitaltechalliance.com

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides)
- [Caching Dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Artifacts & Retention](https://docs.github.com/en/actions/managing-workflow-runs/removing-workflow-artifacts)
