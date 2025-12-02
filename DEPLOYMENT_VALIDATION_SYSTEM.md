# Deployment Validation & Automatic Rollback System

## Overview

This system provides comprehensive deployment validation with automatic rollback capabilities for the Fleet Management application. It monitors all validation results and triggers immediate rollback if ANY validation fails.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deployment Pipeline                          │
│  (GitHub Actions / Manual Deployment)                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│               Orchestration Layer                                │
│  orchestrate-deployment-validation.sh                            │
│  - Coordinates all validation agents                             │
│  - Runs agents in parallel                                       │
│  - Monitors progress                                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐
│PDCA Validator│ │Visual    │ │Performance│ │Smoke Test     │
│              │ │Regression│ │Validator  │ │Validator      │
│- Plan phase  │ │          │ │           │ │               │
│- Do phase    │ │- UI tests│ │- k6 tests │ │- Health checks│
│- Check phase │ │- Screenshots│- Latency │ │- User flows   │
│- Act phase   │ │- Diffs   │ │- Throughput│ │- Dependencies│
└──────┬───────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘
       │              │             │               │
       └──────────────┴─────────────┴───────────────┘
                       │
                       ▼
           ┌─────────────────────┐
           │  Result Files       │
           │  (JSON format)      │
           └──────────┬──────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│         Deployment Validation Monitor                            │
│  deployment-validation-monitor.sh                                │
│                                                                   │
│  1. Collect results from all agents                              │
│  2. Decision logic:                                              │
│     - ALL PASS → Tag image, approve deployment                   │
│     - ANY FAIL → Trigger rollback                                │
│  3. Execute rollback if needed                                   │
│  4. Verify rollback                                              │
│  5. Generate incident report                                     │
└─────────────────────────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────┐            ┌──────────────────┐
│   SUCCESS    │            │    ROLLBACK      │
│              │            │                  │
│- Image tagged│            │- Deployment      │
│  as validated│            │  rolled back     │
│- Deployment  │            │- Incident report │
│  complete    │            │  generated       │
└──────────────┘            └──────────────────┘
```

## Components

### 1. Validation Agents

Located in `/scripts/validation-agents/`:

#### PDCA Validator (`pdca-validator.sh`)
Validates deployment follows Plan-Do-Check-Act cycle:
- **Plan**: Checks for changelog and version annotations
- **Do**: Verifies deployment strategy and pod status
- **Check**: Validates health probes and monitoring
- **Act**: Confirms rollback capability and resource configuration

#### Visual Regression Validator (`visual-regression-validator.sh`)
Performs UI testing:
- Homepage snapshots
- Dashboard visual tests
- Fleet view screenshots
- Responsive design validation
- Diff detection with baseline images

#### Performance Validator (`performance-validator.sh`)
Tests application performance:
- Response time validation (< 1000ms)
- Throughput testing (> 50 RPS)
- Error rate monitoring (< 1%)
- P95 latency checks (< 2000ms)
- Resource usage validation

#### Smoke Test Validator (`smoke-test-validator.sh`)
Runs critical smoke tests:
- Health endpoint validation
- Critical user flows
- Service dependency checks
- Authentication/authorization tests
- Data integrity verification
- Security headers validation

### 2. Orchestration Layer

#### `orchestrate-deployment-validation.sh`
Main orchestration script that:
1. Cleans up previous results
2. Runs all validators in parallel
3. Monitors agent progress
4. Displays validation summary
5. Triggers the deployment monitor

### 3. Monitoring & Decision Layer

#### `deployment-validation-monitor.sh`
Core decision engine that:
1. **Collects Results**: Waits for all validation agents to complete
2. **Makes Decision**:
   - If ALL tests PASS → Tag image, approve deployment
   - If ANY test FAILS → Trigger immediate rollback
3. **Executes Rollback**: `kubectl rollout undo deployment/fleet-app`
4. **Verifies Rollback**: Ensures old version is healthy
5. **Generates Report**: Creates comprehensive incident report

### 4. Result Submission

#### `submit-validation-result.sh`
Template for agents to submit results in standardized JSON format:
```json
{
  "agent": "agent-name",
  "status": "PASSED|FAILED|TIMEOUT|ERROR",
  "timestamp": "ISO-8601",
  "passed": true|false,
  "error": "error message",
  "screenshot": "path/to/screenshot.png"
}
```

## Deployment Integration

### Kubernetes Job

The validation runs as a Kubernetes Job (`k8s/deployment-validation-job.yaml`) with:
- ServiceAccount with necessary RBAC permissions
- Access to kubectl for deployment management
- Ability to rollback deployments
- ConfigMap-mounted validation scripts

### GitHub Actions Workflow

`.github/workflows/deploy-with-validation.yml` provides:
1. **Deploy** job: Updates deployment with new image
2. **Validate** job: Runs all validation tests
3. **Notify** job: Sends notifications and creates issues on failure
4. **Cleanup** job: Removes validation job after completion

## Usage

### Manual Execution

```bash
# Set environment variables
export NAMESPACE="fleet-management"
export DEPLOYMENT_NAME="fleet-app"
export BASE_URL="https://fleet.capitaltechalliance.com"
export RESULTS_DIR="./validation-results"

# Run orchestration
./scripts/orchestrate-deployment-validation.sh
```

### GitHub Actions

```bash
# Trigger via GitHub UI or gh CLI
gh workflow run deploy-with-validation.yml \
  -f environment=staging \
  -f image_tag=v1.2.3
```

### Kubernetes Job

```bash
# Upload scripts to ConfigMap
kubectl create configmap validation-scripts \
  --from-file=./scripts/ \
  -n fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -

# Create validation job
kubectl apply -f k8s/deployment-validation-job.yaml

# Monitor job
kubectl logs -f job/deployment-validation -n fleet-management

# Check job status
kubectl get job deployment-validation -n fleet-management
```

## Validation Results

### Success Case

When all tests pass:
```json
{
  "status": "SUCCESS",
  "timestamp": "2025-11-24T10:30:00Z",
  "deployment": "fleet-app",
  "namespace": "fleet-management",
  "image": "fleetappregistry.azurecr.io/fleet-app:v1.2.3",
  "revision": "42",
  "all_validations_passed": true
}
```

Image is tagged as `v1.2.3-production-validated`

### Rollback Case

When any test fails:
```json
{
  "status": "ROLLBACK",
  "timestamp": "2025-11-24T10:30:00Z",
  "deployment": "fleet-app",
  "namespace": "fleet-management",
  "image": "fleetappregistry.azurecr.io/fleet-app:v1.2.3",
  "revision": "41",
  "failed_validations": ["performance-tester", "smoke-tester"],
  "incident_report": "/path/to/incident/report"
}
```

## Incident Reports

Generated in `incident-reports/INC-YYYYMMDD_HHMMSS/`:

### Structure
```
INC-20251124_103000/
├── incident-report.md       # Markdown summary
├── incident-summary.json    # JSON metadata
├── error-logs.txt          # Pod logs and events
└── screenshots/            # Failure screenshots
    ├── visual-regression-failure.png
    ├── performance-charts.png
    └── ...
```

### Report Contents
1. **Summary**: What failed and when
2. **Failed Validations**: Detailed error messages
3. **Deployment Information**: Image, revision, timestamps
4. **Error Logs**: Pod logs and Kubernetes events
5. **Screenshots**: Visual evidence of failures
6. **Recommended Fixes**: Specific guidance per failure type
7. **Next Steps**: Action items for resolution

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NAMESPACE` | `fleet-management` | Kubernetes namespace |
| `DEPLOYMENT_NAME` | `fleet-app` | Deployment name |
| `BASE_URL` | `https://fleet.capitaltechalliance.com` | Application URL |
| `RESULTS_DIR` | `./validation-results` | Results directory |
| `INCIDENT_REPORT_DIR` | `./incident-reports` | Incident reports directory |
| `VALIDATION_TIMEOUT` | `600` | Timeout in seconds |

### Performance Thresholds

Configured in `performance-validator.sh`:
```bash
MAX_RESPONSE_TIME_MS=1000      # Maximum acceptable response time
MIN_THROUGHPUT_RPS=50          # Minimum requests per second
MAX_ERROR_RATE_PERCENT=1       # Maximum error percentage
MAX_P95_LATENCY_MS=2000        # Maximum P95 latency
```

## RBAC Permissions

The deployment validator ServiceAccount requires:

```yaml
# Read permissions
- deployments (get, list, watch)
- replicasets (get, list)
- pods (get, list, watch)
- pods/log (get, list)
- events (get, list, watch)
- services (get, list)
- ingresses (get, list)

# Write permissions
- deployments/rollback (create)
- deployments (patch)  # For rollback
- pods/exec (create)   # For testing
```

## Security Considerations

1. **Non-root Execution**: All containers run as non-root user (UID 1001)
2. **Read-only Filesystem**: Containers use read-only root filesystem
3. **Capability Dropping**: All Linux capabilities dropped
4. **Seccomp Profile**: RuntimeDefault seccomp profile applied
5. **Image Pinning**: Base images pinned with SHA256 digests
6. **Least Privilege**: ServiceAccount has minimal required permissions

## Monitoring & Observability

### Logs
- Orchestrator logs: `validation-results/*.log`
- Monitor logs: Console output
- Kubernetes Job logs: `kubectl logs job/deployment-validation`

### Metrics
- Validation duration
- Test pass/fail rates
- Rollback frequency
- Incident count

### Alerts
- GitHub issue created on production rollback
- Notification via GitHub Actions

## Troubleshooting

### Common Issues

#### 1. Validation Timeout
**Symptom**: Agents don't complete within timeout
**Solution**: Increase `VALIDATION_TIMEOUT` or check network connectivity

#### 2. Missing jq
**Symptom**: JSON parsing errors
**Solution**: Ensure jq is installed in validator container

#### 3. RBAC Permissions
**Symptom**: Cannot rollback deployment
**Solution**: Verify ServiceAccount has correct RBAC permissions

#### 4. ConfigMap Not Found
**Symptom**: Scripts not available in validation job
**Solution**: Update ConfigMap with scripts:
```bash
kubectl create configmap validation-scripts \
  --from-file=./scripts/ \
  -n fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Debug Mode

Enable verbose logging:
```bash
set -x  # Add to scripts for debug output
export DEBUG=true
```

## Best Practices

1. **Always Test in Staging First**: Run validation in staging before production
2. **Review Incident Reports**: Analyze all rollback incidents
3. **Update Baselines**: Keep visual regression baselines current
4. **Monitor Thresholds**: Adjust performance thresholds based on actual data
5. **Version Scripts**: Keep validation scripts in version control
6. **Archive Results**: Preserve validation results for trend analysis

## Continuous Improvement

### Metrics to Track
- Mean Time Between Rollbacks (MTBR)
- Mean Time To Rollback (MTTR)
- Validation success rate
- False positive rate

### Regular Reviews
- Weekly: Review failed validations
- Monthly: Analyze rollback trends
- Quarterly: Update thresholds and baselines

## Future Enhancements

1. **Machine Learning**: Anomaly detection in performance metrics
2. **Canary Deployments**: Gradual rollout with validation
3. **Multi-region**: Validation across all regions
4. **Cost Analysis**: Track rollback costs
5. **Predictive Analytics**: Predict deployment success probability

## Support

For issues or questions:
1. Check troubleshooting guide above
2. Review incident reports
3. Check validation logs
4. Create GitHub issue with validation results attached

## License

Copyright © 2025 Capital Tech Alliance. All rights reserved.
