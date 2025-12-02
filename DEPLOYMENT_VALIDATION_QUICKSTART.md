# Deployment Validation & Rollback - Quick Start Guide

## Overview

This system automatically validates deployments and rolls back if ANY test fails.

**Decision Logic:**
- ✅ **ALL tests PASS** → Image tagged as production-validated, deployment approved
- ❌ **ANY test FAILS** → Automatic rollback triggered immediately

## Prerequisites

```bash
# Required tools
- kubectl (connected to AKS cluster)
- jq (JSON processor)
- curl
- bash 4.0+

# Optional (for enhanced testing)
- k6 (performance testing)
- Playwright (visual regression)
```

## Quick Start

### 1. Setup (One-time)

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Run setup script to create all validation components
./scripts/setup-validation-system.sh
```

This creates:
- `scripts/deployment-validation-monitor.sh` - Main decision engine
- `scripts/submit-validation-result.sh` - Result submission template
- `scripts/orchestrate-deployment-validation.sh` - Orchestrator
- `scripts/validation-agents/pdca-validator.sh` - PDCA cycle validation
- `scripts/validation-agents/visual-regression-validator.sh` - UI testing
- `scripts/validation-agents/performance-validator.sh` - Performance testing
- `scripts/validation-agents/smoke-test-validator.sh` - Smoke tests

### 2. Run Validation (Manual)

```bash
# Set environment (optional - defaults shown)
export NAMESPACE="fleet-management"
export DEPLOYMENT_NAME="fleet-app"
export BASE_URL="https://fleet.capitaltechalliance.com"

# Run validation orchestrator
./scripts/orchestrate-deployment-validation.sh
```

### 3. Run Validation (Kubernetes Job)

```bash
# Upload validation scripts to cluster
kubectl create configmap validation-scripts \
  --from-file=./scripts/ \
  -n fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy validation job
kubectl apply -f k8s/deployment-validation-job.yaml

# Monitor progress
kubectl logs -f job/deployment-validation -n fleet-management

# Check final status
kubectl get job deployment-validation -n fleet-management
```

### 4. Run Validation (GitHub Actions)

```bash
# Trigger deployment with validation
gh workflow run deploy-with-validation.yml \
  -f environment=staging \
  -f image_tag=v1.2.3
```

## What Happens

### Success Path (All Tests Pass)

```
1. Orchestrator starts all 4 validation agents in parallel
2. Agents run their tests:
   ✓ PDCA Validator: Deployment health, rollback capability
   ✓ Visual Regression: UI snapshots, responsive design
   ✓ Performance Tester: Response time, latency, throughput
   ✓ Smoke Tester: Health endpoints, critical flows
3. Monitor collects results
4. ALL PASS → Image tagged as production-validated
5. Deployment complete ✅
```

**Result:** `validation-results/deployment-success-TIMESTAMP.json`

### Failure Path (Any Test Fails)

```
1. Orchestrator starts all 4 validation agents
2. One or more agents fail
3. Monitor detects failure
4. AUTOMATIC ROLLBACK triggered:
   → kubectl rollout undo deployment/fleet-app
5. Rollback verified
6. Incident report generated
7. Deployment rolled back ❌
```

**Result:** `incident-reports/INC-TIMESTAMP/incident-report.md`

## Validation Agents

### 1. PDCA Validator
**Tests:** Plan-Do-Check-Act cycle compliance
- Deployment annotations and versioning
- Rolling update strategy
- Health probes (liveness/readiness)
- Rollback capability

**Pass Criteria:** All PDCA phases validated

### 2. Visual Regression Validator
**Tests:** UI consistency
- Homepage rendering
- Dashboard views
- Responsive design (mobile/tablet/desktop)
- Screenshot comparison

**Pass Criteria:** Homepage accessible, no critical UI breaks

### 3. Performance Validator
**Tests:** Application performance
- Response time < 5000ms (configurable)
- API health endpoint latency
- Error rate monitoring
- Resource usage

**Pass Criteria:** Response time within threshold

### 4. Smoke Test Validator
**Tests:** Critical functionality
- Health endpoints (/api/health)
- Pod availability
- Service connectivity
- Authentication flows
- Security headers

**Pass Criteria:** All critical paths functional

## Outputs

### Success Output

```json
{
  "status": "SUCCESS",
  "timestamp": "2025-11-24T20:00:00Z",
  "deployment": "fleet-app",
  "namespace": "fleet-management",
  "image": "fleetappregistry.azurecr.io/fleet-app:v1.2.3",
  "revision": "42",
  "all_validations_passed": true
}
```

### Rollback Output

```json
{
  "status": "ROLLBACK",
  "timestamp": "2025-11-24T20:00:00Z",
  "deployment": "fleet-app",
  "namespace": "fleet-management",
  "image": "fleetappregistry.azurecr.io/fleet-app:v1.2.3",
  "revision": "41",
  "failed": ["performance-tester", "smoke-tester"]
}
```

### Incident Report Structure

```
incident-reports/INC-20251124_200000/
├── incident-report.md       # Human-readable summary
├── incident-summary.json    # Machine-readable metadata
├── error-logs.txt          # Pod logs and events
└── screenshots/            # Visual evidence
    └── failure-screenshot.png
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NAMESPACE` | `fleet-management` | Kubernetes namespace |
| `DEPLOYMENT_NAME` | `fleet-app` | Deployment to validate |
| `BASE_URL` | `https://fleet.capitaltechalliance.com` | Application URL |
| `RESULTS_DIR` | `./validation-results` | Results directory |
| `INCIDENT_REPORT_DIR` | `./incident-reports` | Incident reports |
| `VALIDATION_TIMEOUT` | `600` | Max wait time (seconds) |

### Performance Thresholds

Edit `scripts/validation-agents/performance-validator.sh`:

```bash
MAX_RESPONSE_TIME_MS=5000      # Adjust based on your SLAs
```

## Troubleshooting

### Issue: "jq: command not found"

```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

### Issue: "kubectl: connection refused"

```bash
# Verify kubectl is configured
kubectl cluster-info

# Get AKS credentials
az aks get-credentials \
  --resource-group <resource-group> \
  --name <cluster-name>
```

### Issue: "No validation results found"

```bash
# Check if agents are running
ps aux | grep validator

# Check logs
cat validation-results/*.log

# Run agents manually for debugging
bash scripts/validation-agents/smoke-test-validator.sh
```

### Issue: "Rollback failed"

```bash
# Check deployment history
kubectl rollout history deployment/fleet-app -n fleet-management

# Manual rollback
kubectl rollout undo deployment/fleet-app -n fleet-management

# Check status
kubectl rollout status deployment/fleet-app -n fleet-management
```

## Testing the System

### Simulate Success

```bash
# All agents should pass with current deployment
./scripts/orchestrate-deployment-validation.sh
```

Expected: Exit code 0, success message

### Simulate Failure

```bash
# Temporarily break the deployment
export BASE_URL="https://invalid-url-that-does-not-exist.com"
./scripts/orchestrate-deployment-validation.sh
```

Expected: Exit code 1, rollback triggered, incident report generated

## CI/CD Integration

### GitHub Actions

The `.github/workflows/deploy-with-validation.yml` workflow:

1. **Deploy** job - Updates deployment
2. **Validate** job - Runs all tests
3. **Notify** job - Sends notifications
4. **Cleanup** job - Removes validation resources

Trigger: `workflow_dispatch` with environment and image tag

### Azure DevOps (Coming Soon)

```yaml
# Example pipeline stage
stages:
  - stage: Validate
    jobs:
    - job: RunValidation
      steps:
      - script: ./scripts/orchestrate-deployment-validation.sh
      - condition: failed()
        script: echo "Deployment rolled back"
```

## Best Practices

1. **Always validate in staging first**
   ```bash
   export NAMESPACE="fleet-staging"
   ./scripts/orchestrate-deployment-validation.sh
   ```

2. **Review all rollback incidents**
   ```bash
   ls -lt incident-reports/
   cat incident-reports/INC-*/incident-report.md
   ```

3. **Archive validation results**
   ```bash
   tar -czf validation-archive-$(date +%Y%m%d).tar.gz validation-results/
   ```

4. **Update thresholds based on metrics**
   ```bash
   # Review performance over time
   grep "Response time:" validation-results/*.log
   ```

## Monitoring

### Check Validation History

```bash
# List all validation runs
ls -lt validation-results/*.json

# Count successes vs rollbacks
grep -c '"status":"SUCCESS"' validation-results/*.json
grep -c '"status":"ROLLBACK"' validation-results/*.json
```

### View Recent Incident

```bash
# Find latest incident
latest_incident=$(ls -t incident-reports/INC-*/incident-report.md | head -1)

# Display
cat "$latest_incident"
```

## Security

- All containers run as non-root (UID 1001)
- Read-only root filesystem
- Minimal RBAC permissions
- No secrets in scripts (use env vars/Key Vault)
- Audit logging of all rollbacks

## Support

For issues:
1. Check this guide
2. Review validation logs in `validation-results/`
3. Check incident reports in `incident-reports/`
4. Review [Full Documentation](./DEPLOYMENT_VALIDATION_SYSTEM.md)
5. Create GitHub issue with logs attached

## Quick Reference Commands

```bash
# Setup system
./scripts/setup-validation-system.sh

# Run validation
./scripts/orchestrate-deployment-validation.sh

# Upload to Kubernetes
kubectl create configmap validation-scripts --from-file=./scripts/ -n fleet-management --dry-run=client -o yaml | kubectl apply -f -

# Deploy validation job
kubectl apply -f k8s/deployment-validation-job.yaml

# Monitor job
kubectl logs -f job/deployment-validation -n fleet-management

# Manual rollback
kubectl rollout undo deployment/fleet-app -n fleet-management

# Check deployment status
kubectl rollout status deployment/fleet-app -n fleet-management

# View recent results
ls -lt validation-results/ incident-reports/
```

## What's Next?

- ✅ System is ready to use
- Test in staging environment
- Integrate with CI/CD pipeline
- Set up monitoring/alerting
- Review and adjust thresholds
- Train team on incident response

---

**Questions?** See [DEPLOYMENT_VALIDATION_SYSTEM.md](./DEPLOYMENT_VALIDATION_SYSTEM.md) for complete documentation.
