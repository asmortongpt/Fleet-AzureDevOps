# Fleet Management - Automated Deployment Strategy

## Overview

This deployment strategy implements a complete **PDCA (Plan-Do-Check-Act)** loop with automated validation and rollback capabilities.

### Key Features

- **Automated Build Monitoring**: Waits for ACR builds to complete
- **Zero-Downtime Deployment**: Rolling updates with health checks
- **Automated Validation**: Playwright tests run against production URL
- **Auto-Rollback**: Automatic rollback on validation failure
- **Retry Logic**: Intelligent retry with exponential backoff
- **Incident Reporting**: Detailed failure reports for troubleshooting

---

## PDCA Loop Implementation

### 1. PLAN (Prerequisites & Verification)

**What it does:**
- Verifies Azure CLI authentication
- Checks kubectl connectivity to AKS cluster
- Validates namespace exists
- Confirms Playwright is installed
- Captures current deployment state for rollback

**Script:** `verify_prerequisites()` in `deploy-with-validation.sh`

### 2. DO (Execute Deployment)

**What it does:**
- Waits for ACR build to complete
- Captures current deployment revision
- Updates Kubernetes deployments with new images
- Monitors rollout progress
- Waits for all pods to be ready

**Script:** `execute_deployment()` and `monitor_rollout()`

### 3. CHECK (Validation Testing)

**What it does:**
- Performs health checks against production URL
- Runs comprehensive Playwright test suite
- Validates:
  - HTTP 200 responses
  - No critical JavaScript errors
  - UI framework rendering
  - Static assets loading
  - API connectivity
  - Performance benchmarks
  - Security headers

**Script:** `run_validation_tests()`

**Test Suite:** `/Users/andrewmorton/Documents/GitHub/Fleet/e2e/deployment-validation.spec.ts`

### 4. ACT (Rollback or Promote)

**What it does:**

**On Failure:**
- Executes automatic rollback to previous revision
- Verifies rollback succeeded
- Creates incident report
- Archives logs for investigation

**On Success:**
- Promotes deployment
- Tags images as `{environment}-stable`
- Creates deployment record
- Updates git tags

**Script:** `execute_rollback()` or `promote_deployment()`

---

## Available Scripts

### 1. Deploy with Validation (Recommended)

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/deployment/scripts/deploy-with-validation.sh`

**Usage:**
```bash
# Deploy to staging with specific image tag
./deployment/scripts/deploy-with-validation.sh staging stage-a-12345

# Deploy to production
./deployment/scripts/deploy-with-validation.sh production v1.2.3
```

**What it does:**
- Complete PDCA loop
- Auto-rollback on failure
- Comprehensive validation
- Detailed logging

**When to use:**
- Production deployments
- Critical staging deployments
- When you need validation and rollback safety

---

### 2. Complete Pipeline (Build + Deploy)

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/deployment/scripts/deploy-complete-pipeline.sh`

**Usage:**
```bash
# Build from source and deploy to staging
./deployment/scripts/deploy-complete-pipeline.sh staging

# Build and deploy to production
./deployment/scripts/deploy-complete-pipeline.sh production
```

**What it does:**
- Triggers ACR build from current git commit
- Waits for build completion
- Runs deploy-with-validation.sh
- Tags git commit on success

**When to use:**
- When you want to build AND deploy in one command
- Deploying from latest code changes
- Full end-to-end pipeline execution

---

### 3. Quick Deploy

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/deployment/scripts/quick-deploy.sh`

**Usage:**
```bash
# Quick deploy to staging
./deployment/scripts/quick-deploy.sh staging latest

# Quick deploy to production
./deployment/scripts/quick-deploy.sh production v1.2.3
```

**What it does:**
- Simplified wrapper around deploy-with-validation.sh
- Interactive confirmation for production
- Minimal output, fast execution

**When to use:**
- When you have a working build ready
- Repeated deployments during testing
- Quick iteration cycles

---

### 4. Monitor ACR Build

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/deployment/scripts/monitor-acr-build.sh`

**Usage:**
```bash
# Monitor latest build
./deployment/scripts/monitor-acr-build.sh

# Monitor specific build
./deployment/scripts/monitor-acr-build.sh ca_1234567890
```

**What it does:**
- Monitors ACR build task progress
- Shows build status in real-time
- Displays logs on failure
- Lists generated images on success

**When to use:**
- Checking build progress
- Debugging build failures
- Verifying images are available

---

### 5. Watch Deployment

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/deployment/scripts/watch-deployment.sh`

**Usage:**
```bash
# Watch staging deployment
./deployment/scripts/watch-deployment.sh staging

# Watch production deployment
./deployment/scripts/watch-deployment.sh production
```

**What it does:**
- Real-time dashboard of deployment status
- Shows pod health, events, and logs
- Auto-refreshes every 5 seconds
- Rollout progress tracking

**When to use:**
- Monitoring ongoing deployments
- Debugging pod issues
- Real-time visibility into cluster state

---

## Deployment Workflows

### Scenario 1: Deploy Latest Code to Staging

```bash
# Full pipeline: build + deploy + validate
./deployment/scripts/deploy-complete-pipeline.sh staging
```

**Steps executed:**
1. Build Docker images from current git commit
2. Push images to ACR
3. Deploy to staging namespace
4. Run validation tests
5. Rollback on failure, promote on success

**Duration:** ~15-20 minutes

---

### Scenario 2: Deploy Existing Build to Production

```bash
# First, verify the image exists
az acr repository show-tags \
  --name fleetappregistry \
  --repository fleet-frontend \
  --output table

# Deploy specific tag
./deployment/scripts/deploy-with-validation.sh production staging-abc123-20251124-143000
```

**Steps executed:**
1. Verify prerequisites
2. Check image exists in ACR
3. Deploy to production namespace
4. Run validation tests
5. Auto-rollback on failure

**Duration:** ~10-15 minutes

---

### Scenario 3: Quick Iteration During Development

```bash
# Build images via Azure DevOps pipeline (triggers automatically on push)
git push origin stage-a/requirements-inception

# Wait for build, then deploy
./deployment/scripts/monitor-acr-build.sh

# Once build completes, quick deploy
./deployment/scripts/quick-deploy.sh staging latest
```

**Duration:** ~5-10 minutes (after build)

---

### Scenario 4: Emergency Rollback

```bash
# Manual rollback to previous version
kubectl rollout undo deployment/fleet-app -n fleet-management-production
kubectl rollout undo deployment/fleet-api -n fleet-management-production

# Monitor rollback
./deployment/scripts/watch-deployment.sh production
```

**Duration:** ~2-3 minutes

---

## Validation Test Suite

### Test Categories

**1. Critical Health Checks (20 tests)**
- HTTP 200 responses
- No critical JavaScript errors
- Root element renders
- UI framework functional
- Static assets load
- API health endpoints

**2. Data & API Connectivity**
- Database connectivity
- Redis connectivity
- API endpoints responding

**3. Security Checks**
- Security headers present
- No exposed secrets
- HTTPS redirects working

**4. Performance Checks**
- Page load < 5 seconds
- Memory usage < 500MB
- Network requests < 100

**Test File:** `/Users/andrewmorton/Documents/GitHub/Fleet/e2e/deployment-validation.spec.ts`

---

## Rollback Strategy

### Automatic Rollback Triggers

1. **Rollout Failure**: Kubernetes reports deployment failure
2. **Health Check Failure**: Health endpoints don't respond within 5 minutes
3. **Validation Test Failure**: Any Playwright test fails

### Rollback Process

```bash
# Automatic rollback flow:
1. Detect failure
2. Get previous deployment revision
3. Execute: kubectl rollout undo deployment/fleet-app
4. Execute: kubectl rollout undo deployment/fleet-api
5. Wait for rollback to complete
6. Verify previous version is healthy
7. Create incident report
```

### Manual Rollback

```bash
# Rollback to previous revision
kubectl rollout undo deployment/fleet-app -n fleet-management-staging

# Rollback to specific revision
kubectl rollout history deployment/fleet-app -n fleet-management-staging
kubectl rollout undo deployment/fleet-app -n fleet-management-staging --to-revision=5
```

---

## Monitoring & Logs

### Deployment Logs

All logs are stored in `/tmp/fleet-deployment-{timestamp}/`:

- `deployment.log` - Full deployment log with timestamps
- `validation.log` - Playwright test output
- `incident-report.json` - Failure details (if applicable)
- `deployment-before.yaml` - Pre-deployment state
- `test-results.json` - Test results in JSON format

**Archived automatically:** `/tmp/fleet-deployment-{timestamp}.tar.gz`

### Live Monitoring

```bash
# Watch deployment in real-time
./deployment/scripts/watch-deployment.sh staging

# Follow pod logs
kubectl logs -f -n fleet-management-staging -l app=fleet-app

# Watch events
kubectl get events -n fleet-management-staging --watch

# Monitor resource usage
kubectl top pods -n fleet-management-staging
```

---

## Environment Configuration

### Environment URLs

| Environment | Namespace | URL |
|------------|-----------|-----|
| Production | `fleet-management-production` | https://fleet.capitaltechalliance.com |
| Staging | `fleet-management-staging` | https://fleet-staging.capitaltechalliance.com |
| Dev | `fleet-management-dev` | https://fleet-dev.capitaltechalliance.com |

### Azure Resources

| Resource | Name | Purpose |
|----------|------|---------|
| ACR | `fleetappregistry` | Container image registry |
| AKS | `fleet-aks-cluster` | Kubernetes cluster |
| Resource Group | `fleet-production-rg` | Azure resource container |

---

## Troubleshooting

### Build Failures

```bash
# Check recent ACR builds
az acr task list-runs --registry fleetappregistry --top 10 --output table

# View build logs
az acr task logs --registry fleetappregistry --run-id ca_1234567890

# Check if image exists
az acr repository show-tags \
  --name fleetappregistry \
  --repository fleet-frontend \
  --output table
```

### Deployment Failures

```bash
# Check pod status
kubectl get pods -n fleet-management-staging

# Describe pod for events
kubectl describe pod <pod-name> -n fleet-management-staging

# Check logs
kubectl logs <pod-name> -n fleet-management-staging

# Check deployment rollout status
kubectl rollout status deployment/fleet-app -n fleet-management-staging
```

### Validation Test Failures

```bash
# Review validation logs
cat /tmp/fleet-deployment-*/validation.log

# Review test results
cat /tmp/fleet-deployment-*/test-results.json

# View HTML test report
open /tmp/fleet-deployment-*/html-report/index.html

# Check incident report
cat /tmp/fleet-deployment-*/incident-report.json
```

### Rollback Issues

```bash
# Check deployment history
kubectl rollout history deployment/fleet-app -n fleet-management-staging

# Force rollback to specific revision
kubectl rollout undo deployment/fleet-app \
  -n fleet-management-staging \
  --to-revision=3

# If rollback stuck, check pod events
kubectl get events -n fleet-management-staging \
  --field-selector involvedObject.kind=Pod \
  --sort-by='.lastTimestamp'
```

---

## Best Practices

### Before Deploying

1. **Test in lower environments first**
   ```bash
   # Always test in dev first
   ./deployment/scripts/deploy-complete-pipeline.sh dev

   # Then staging
   ./deployment/scripts/deploy-complete-pipeline.sh staging

   # Finally production
   ./deployment/scripts/deploy-complete-pipeline.sh production
   ```

2. **Review recent changes**
   ```bash
   git log --oneline -10
   git diff HEAD~1
   ```

3. **Check current production health**
   ```bash
   kubectl get pods -n fleet-management-production
   kubectl top pods -n fleet-management-production
   ```

### During Deployment

1. **Monitor in real-time**
   ```bash
   # In terminal 1: Run deployment
   ./deployment/scripts/deploy-with-validation.sh staging latest

   # In terminal 2: Watch progress
   ./deployment/scripts/watch-deployment.sh staging
   ```

2. **Check validation progress**
   ```bash
   tail -f /tmp/fleet-deployment-*/validation.log
   ```

### After Deployment

1. **Verify application manually**
   - Visit production URL
   - Test critical user flows
   - Check browser console for errors

2. **Monitor for issues**
   ```bash
   # Watch for errors in next 30 minutes
   kubectl logs -f -n fleet-management-staging -l app=fleet-app | grep -i error
   ```

3. **Archive logs**
   ```bash
   # Logs are auto-archived, but you can copy them
   cp /tmp/fleet-deployment-*.tar.gz ./deployment-logs/
   ```

---

## Integration with Azure DevOps

### Trigger via Azure Pipeline

**Option 1: Manual Pipeline Trigger**
```bash
# Trigger Azure DevOps pipeline
az pipelines run \
  --name "Fleet-CI-Pipeline" \
  --branch stage-a/requirements-inception

# Wait for build to complete
./deployment/scripts/monitor-acr-build.sh

# Deploy once build is ready
./deployment/scripts/deploy-with-validation.sh staging latest
```

**Option 2: Automatic on Git Push**
```bash
# Push to trigger pipeline
git add .
git commit -m "feat: add new feature"
git push origin stage-a/requirements-inception

# Pipeline automatically builds images
# Monitor build progress
./deployment/scripts/monitor-acr-build.sh

# Deploy when ready
./deployment/scripts/quick-deploy.sh staging stage-a-requirements-inception-latest
```

---

## GitHub Actions Integration

### Workflow File

Located at: `/Users/andrewmorton/Documents/GitHub/Fleet/.github/workflows/deploy-with-validation.yml`

**Trigger manually:**
```bash
gh workflow run "Deploy with Automatic Validation & Rollback" \
  -f environment=staging \
  -f image_tag=stage-a-12345
```

**Features:**
- Automatic validation job in Kubernetes
- Artifact upload for test results
- GitHub issue creation on production failure
- Notification integration

---

## Security Considerations

### Image Security

- **Pinned base images**: Using SHA256 digests
- **Non-root containers**: All containers run as user 1001
- **Read-only filesystems**: Where possible
- **Minimal attack surface**: Alpine-based images

### Secret Management

- **Never in logs**: Secrets masked in output
- **Kubernetes secrets**: Used for all sensitive data
- **Azure Key Vault**: Integration for production secrets
- **No hardcoded credentials**: All externalized

### Network Security

- **TLS/HTTPS**: All production traffic encrypted
- **Security headers**: X-Frame-Options, CSP, etc.
- **Network policies**: Pod-to-pod communication restricted
- **Ingress rules**: Rate limiting and WAF enabled

---

## Performance Metrics

### Expected Timings

| Phase | Duration | Timeout |
|-------|----------|---------|
| ACR Build | 5-10 min | 20 min |
| K8s Rollout | 2-5 min | 10 min |
| Health Checks | 30-60 sec | 5 min |
| Validation Tests | 3-7 min | 15 min |
| Rollback (if needed) | 2-3 min | 5 min |
| **Total (success)** | **10-22 min** | **50 min** |
| **Total (with rollback)** | **15-30 min** | **60 min** |

### Resource Usage

**Deployment Pod:**
- CPU: 50m request, 200m limit
- Memory: 128Mi request, 512Mi limit
- Replicas: 3 (min) to 20 (max with HPA)

**Validation Job:**
- CPU: 200m request, 500m limit
- Memory: 512Mi request, 1Gi limit
- TTL: 24 hours after completion

---

## Examples

### Example 1: Standard Staging Deployment

```bash
# Navigate to project root
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Run complete pipeline
./deployment/scripts/deploy-complete-pipeline.sh staging

# Expected output:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 1: Triggering ACR Build
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Building frontend image...
# Frontend build ID: ca_1234567890
# Building API image...
# API build ID: ca_1234567891
# ...
# ✅ All builds completed successfully
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 2: Deploying with Validation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ...
# ✅ DEPLOYMENT SUCCESSFUL - All Tests Passed
```

### Example 2: Deploy Specific Build to Production

```bash
# Deploy specific tested image
./deployment/scripts/deploy-with-validation.sh production staging-abc123-20251124-143000

# Production confirmation required
# ⚠️  WARNING: PRODUCTION DEPLOYMENT
#    This will deploy to the live production environment
#
# Continue? (yes/no): yes
```

### Example 3: Monitor Deployment in Real-Time

```bash
# Terminal 1: Deploy
./deployment/scripts/deploy-with-validation.sh staging latest

# Terminal 2: Watch progress
./deployment/scripts/watch-deployment.sh staging

# Terminal 3: Follow logs
kubectl logs -f -n fleet-management-staging -l app=fleet-app
```

---

## Incident Response

### When Deployment Fails

1. **Review Incident Report**
   ```bash
   cat /tmp/fleet-deployment-*/incident-report.json
   ```

2. **Check Logs**
   ```bash
   cat /tmp/fleet-deployment-*/deployment.log
   cat /tmp/fleet-deployment-*/validation.log
   ```

3. **Investigate Root Cause**
   ```bash
   # Check pod events
   kubectl describe pod <failing-pod> -n fleet-management-staging

   # Check recent commits
   git log --oneline -10

   # Compare with working version
   kubectl describe deployment fleet-app -n fleet-management-production
   ```

4. **Fix and Redeploy**
   ```bash
   # Fix the issue in code
   git add .
   git commit -m "fix: resolve deployment issue"
   git push

   # Rebuild and redeploy
   ./deployment/scripts/deploy-complete-pipeline.sh staging
   ```

---

## Continuous Improvement

### Metrics to Track

- **Deployment success rate**: Target >95%
- **Average deployment time**: Baseline for optimization
- **Rollback frequency**: Indicates code quality
- **Validation test pass rate**: Health indicator

### Future Enhancements

1. **Blue-Green Deployments**: Zero-downtime with instant rollback
2. **Canary Releases**: Gradual traffic shifting
3. **A/B Testing**: Feature flag integration
4. **Chaos Engineering**: Automated resilience testing
5. **Performance Regression Detection**: Lighthouse CI integration

---

## Quick Reference

### File Locations

```
/Users/andrewmorton/Documents/GitHub/Fleet/
├── deployment/
│   ├── scripts/
│   │   ├── deploy-with-validation.sh        # Main deployment script
│   │   ├── deploy-complete-pipeline.sh      # Build + Deploy
│   │   ├── quick-deploy.sh                  # Simplified deployment
│   │   ├── monitor-acr-build.sh             # Build monitoring
│   │   └── watch-deployment.sh              # Real-time monitoring
│   ├── kubernetes/
│   │   ├── deployment-optimized.yaml        # K8s deployment manifest
│   │   ├── deployment-validation-job.yaml   # Validation job
│   │   ├── service.yaml                     # K8s services
│   │   └── ingress.yaml                     # Ingress configuration
│   └── AUTOMATED_DEPLOYMENT_STRATEGY.md     # This file
├── e2e/
│   ├── deployment-validation.spec.ts        # Validation test suite
│   ├── 00-smoke-tests.spec.ts              # Smoke tests
│   └── production-verification.spec.ts     # Production checks
└── playwright.config.ts                     # Playwright configuration
```

### Common Commands

```bash
# Deploy to staging
./deployment/scripts/deploy-with-validation.sh staging latest

# Deploy to production
./deployment/scripts/deploy-with-validation.sh production v1.2.3

# Build and deploy
./deployment/scripts/deploy-complete-pipeline.sh staging

# Monitor deployment
./deployment/scripts/watch-deployment.sh staging

# Monitor ACR build
./deployment/scripts/monitor-acr-build.sh

# Manual rollback
kubectl rollout undo deployment/fleet-app -n fleet-management-staging

# Check deployment logs
ls -lh /tmp/fleet-deployment-*
```

---

## Support

### Getting Help

1. **Review logs**: Start with `/tmp/fleet-deployment-*/deployment.log`
2. **Check incident report**: `/tmp/fleet-deployment-*/incident-report.json`
3. **Review Kubernetes events**: `kubectl get events -n fleet-management-staging`
4. **Test locally first**: Use `APP_URL=http://localhost:5173 npx playwright test`

### Contact

- **DevOps Team**: andrew.m@capitaltechalliance.com
- **Documentation**: `/Users/andrewmorton/Documents/GitHub/Fleet/deployment/`
- **Issue Tracker**: GitHub Issues (auto-created on production failures)

---

## Checklist

### Pre-Deployment Checklist

- [ ] Code reviewed and approved
- [ ] Tests passing locally
- [ ] Database migrations tested
- [ ] Breaking changes documented
- [ ] Deployed to dev environment first
- [ ] Validated in staging
- [ ] Production deployment window scheduled
- [ ] Rollback plan confirmed

### Post-Deployment Checklist

- [ ] Validation tests passed
- [ ] Manual smoke test completed
- [ ] No errors in logs (15 min monitoring)
- [ ] Performance metrics acceptable
- [ ] Security headers verified
- [ ] Deployment tagged in git
- [ ] Team notified of deployment
- [ ] Documentation updated if needed

---

**Generated:** 2025-11-24
**Version:** 1.0
**Status:** Ready for Execution
