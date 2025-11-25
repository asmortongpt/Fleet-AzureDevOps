# Fleet Deployment - Quick Start Guide

## When You Have a Working Build

### Option 1: Deploy Existing ACR Image (Fastest)

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Deploy to staging
./deployment/scripts/quick-deploy.sh staging latest

# Deploy specific tag to production
./deployment/scripts/quick-deploy.sh production v1.2.3
```

**Duration:** 10-15 minutes
**Includes:** Deployment + Validation + Auto-rollback

---

### Option 2: Build from Source + Deploy (Complete)

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Build and deploy to staging
./deployment/scripts/deploy-complete-pipeline.sh staging

# Build and deploy to production
./deployment/scripts/deploy-complete-pipeline.sh production
```

**Duration:** 20-30 minutes
**Includes:** ACR Build + Deployment + Validation + Auto-rollback

---

## Monitoring During Deployment

### Watch Real-Time Progress

```bash
# Open in separate terminal
./deployment/scripts/watch-deployment.sh staging
```

### Monitor Logs

```bash
# Follow deployment logs
tail -f /tmp/fleet-deployment-*/deployment.log

# Follow validation logs
tail -f /tmp/fleet-deployment-*/validation.log
```

---

## What Gets Validated

### Automatic Checks (20 tests)

1. HTTP 200 response
2. No critical JavaScript errors
3. UI renders correctly
4. Static assets load
5. API connectivity
6. Database connectivity
7. Performance benchmarks
8. Security headers
9. No exposed secrets
10. React framework health
11. Routing functionality
12. Service worker registration
13. HTTPS redirects
14. Memory usage
15. Network request count
... and more

**Test File:** `e2e/deployment-validation.spec.ts`

---

## If Deployment Fails

### Automatic Actions

1. **Auto-rollback** to previous version
2. **Incident report** created at `/tmp/fleet-deployment-*/incident-report.json`
3. **Logs archived** at `/tmp/fleet-deployment-*.tar.gz`
4. **GitHub issue** created (for production failures)

### Manual Investigation

```bash
# 1. Check incident report
cat /tmp/fleet-deployment-*/incident-report.json

# 2. Review validation logs
cat /tmp/fleet-deployment-*/validation.log

# 3. Check pod status
kubectl get pods -n fleet-management-staging

# 4. View pod logs
kubectl logs -n fleet-management-staging -l app=fleet-app --tail=100

# 5. Check events
kubectl get events -n fleet-management-staging --sort-by='.lastTimestamp' | tail -20
```

---

## Environment URLs

| Environment | URL | Namespace |
|------------|-----|-----------|
| Production | https://fleet.capitaltechalliance.com | `fleet-management-production` |
| Staging | https://fleet-staging.capitaltechalliance.com | `fleet-management-staging` |
| Dev | https://fleet-dev.capitaltechalliance.com | `fleet-management-dev` |

---

## Common Tasks

### Check Build Status

```bash
# Monitor current/latest build
./deployment/scripts/monitor-acr-build.sh

# List recent builds
az acr task list-runs --registry fleetappregistry --top 10 --output table
```

### Manual Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/fleet-app -n fleet-management-staging
kubectl rollout undo deployment/fleet-api -n fleet-management-staging

# Rollback to specific revision
kubectl rollout history deployment/fleet-app -n fleet-management-staging
kubectl rollout undo deployment/fleet-app -n fleet-management-staging --to-revision=5
```

### View Deployment History

```bash
# See deployment revisions
kubectl rollout history deployment/fleet-app -n fleet-management-staging

# Check current image
kubectl get deployment fleet-app -n fleet-management-staging -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### Test Locally First

```bash
# Run validation tests against localhost
APP_URL=http://localhost:5173 npx playwright test e2e/deployment-validation.spec.ts

# Run against staging
APP_URL=https://fleet-staging.capitaltechalliance.com npx playwright test e2e/deployment-validation.spec.ts
```

---

## Prerequisites

### One-Time Setup

```bash
# 1. Install Azure CLI
brew install azure-cli

# 2. Login to Azure
az login

# 3. Get AKS credentials
az aks get-credentials \
  --resource-group fleet-production-rg \
  --name fleet-aks-cluster

# 4. Verify kubectl access
kubectl get nodes

# 5. Install Playwright
npm install -g playwright
npx playwright install chromium
```

---

## PDCA Loop Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     PDCA DEPLOYMENT LOOP                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PLAN   → Verify prerequisites and ACR build             │
│              Capture current state for rollback             │
│                                                              │
│  2. DO     → Deploy new images to Kubernetes                │
│              Monitor rollout with health checks             │
│                                                              │
│  3. CHECK  → Run Playwright tests against production        │
│              Validate functionality and performance         │
│                                                              │
│  4. ACT    → SUCCESS: Promote and tag as stable             │
│              FAILURE: Auto-rollback and create incident     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Ready to Deploy

**Once you have a working ACR build, run:**

```bash
./deployment/scripts/quick-deploy.sh staging latest
```

**This will:**
- ✅ Verify the build exists in ACR
- ✅ Deploy to Kubernetes
- ✅ Run validation tests
- ✅ Auto-rollback if tests fail
- ✅ Promote if tests pass

**Expected result:** Deployment completes in 10-15 minutes with full validation.

---

**For detailed information, see:** `AUTOMATED_DEPLOYMENT_STRATEGY.md`
