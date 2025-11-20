# Fleet Management CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline for the Fleet Management application, including all stages, security measures, deployment strategies, and rollback procedures.

**Pipeline File:** `.github/workflows/ci-cd.yml`

**Last Updated:** 2025-11-20

---

## Table of Contents

1. [Pipeline Architecture](#pipeline-architecture)
2. [Pipeline Stages](#pipeline-stages)
3. [Security Features](#security-features)
4. [Deployment Strategy](#deployment-strategy)
5. [Rollback Procedures](#rollback-procedures)
6. [SBOM Generation](#sbom-generation)
7. [Environment Variables](#environment-variables)
8. [Secrets Management](#secrets-management)
9. [Troubleshooting](#troubleshooting)

---

## Pipeline Architecture

### Trigger Events

The pipeline is triggered on:
- **Push** to branches: `main`, `develop`, `stage-*`
- **Pull Requests** to branches: `main`, `develop`

### Pipeline Flow

```
┌─────────────────┐
│  Lint & Type    │
│     Check       │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Test   │
    └────┬────┘
         │
    ┌────▼────────┐
    │    Build    │
    │ Verification│
    └────┬────────┘
         │
    ┌────▼─────────┐    (main/develop only)
    │   Docker     │
    │ Build & Push │
    └────┬─────────┘
         │
    ┌────▼─────────┐
    │   SBOM       │
    │ Generation   │
    └────┬─────────┘
         │
    ┌────▼─────────┐
    │  Security    │
    │  Scanning    │
    └────┬─────────┘
         │
    ┌────▼─────────┐    (main only)
    │   Deploy     │
    │     to       │
    │ Kubernetes   │
    └────┬─────────┘
         │
    ┌────▼─────────┐
    │   Smoke      │
    │    Tests     │
    └────┬─────────┘
         │
    ┌────▼─────────┐    (on failure)
    │  Rollback    │
    └──────────────┘
```

---

## Pipeline Stages

### 1. Lint & Type Check

**Purpose:** Ensure code quality and type safety

**Steps:**
- Checkout code
- Setup Node.js 20.x
- Install dependencies (frontend & API)
- Run ESLint on frontend and API
- Run TypeScript type checking

**Failure Impact:** Pipeline stops, preventing bad code from proceeding

---

### 2. Unit Tests

**Purpose:** Validate functionality and maintain code coverage

**Steps:**
- Run frontend unit tests
- Run API unit tests
- Generate coverage report
- Check coverage threshold (minimum 60%)
- Upload coverage to Codecov

**Coverage Requirements:**
- **Minimum:** 60% line coverage
- **Target:** 80%+ line coverage

**Artifacts:**
- `coverage-final.json` uploaded to Codecov

---

### 3. Build Verification

**Purpose:** Ensure the application builds successfully

**Steps:**
- Build frontend (Vite)
- Build API (TypeScript compilation)
- Upload build artifacts

**Artifacts:**
- `frontend-dist/` - Frontend production build
- `api-dist/` - API compiled JavaScript

**Dependencies:** Requires `lint` job to pass

---

### 4. Docker Build & Push

**Purpose:** Create and publish container images

**Trigger:** Only on `main` or `develop` branches

**Images Built:**
1. **API Image**
   - Context: `./api`
   - Dockerfile: `./api/Dockerfile.production`
   - Tags: `{ACR}/fleet-api:{sha}`, `{ACR}/fleet-api:latest`

2. **Frontend Image**
   - Context: `.` (root)
   - Dockerfile: `./Dockerfile.production`
   - Tags: `{ACR}/fleet-frontend:{sha}`, `{ACR}/fleet-frontend:latest`

**Features:**
- BuildKit caching for faster builds
- Multi-stage builds for smaller images
- Pushed to Azure Container Registry (ACR)

**Dependencies:** Requires `build` job to pass

---

### 5. SBOM Generation

**Purpose:** Create Software Bill of Materials for supply chain security

**Tool:** Anchore Syft

**Generated Files:**
- `sbom-api.spdx.json` - API SBOM (SPDX format)
- `sbom-api.cyclonedx.json` - API SBOM (CycloneDX format)
- `sbom-frontend.spdx.json` - Frontend SBOM (SPDX format)
- `sbom-frontend.cyclonedx.json` - Frontend SBOM (CycloneDX format)

**Retention:** 90 days

**Use Cases:**
- Vulnerability tracking
- License compliance
- Dependency auditing
- Regulatory requirements (SBOM mandate)

**Artifact Download:**
```bash
gh run download <run-id> -n sbom-reports
```

---

### 6. Security Scanning

**Purpose:** Identify security vulnerabilities before deployment

**Trigger:** Only on `main` or `develop` branches

**Tools Used:**

1. **Semgrep SAST**
   - Static Application Security Testing
   - Rulesets: security-audit, secrets, OWASP Top 10, JavaScript, TypeScript
   - Finds code-level vulnerabilities

2. **Trivy Container Scanning**
   - Scans Docker images for vulnerabilities
   - Severity threshold: CRITICAL and HIGH
   - Generates SARIF reports
   - Fails on vulnerabilities found

3. **npm audit**
   - Checks for vulnerable dependencies
   - Runs on production dependencies
   - Audit level: HIGH
   - Fails on HIGH or CRITICAL vulnerabilities

4. **detect-secrets**
   - Scans for hardcoded secrets
   - Uses baseline: `.secrets.baseline`
   - Prevents credential leaks

5. **Cosign Image Signing**
   - Signs container images cryptographically
   - Ensures image integrity
   - Uses Sigstore keyless signing

**Artifacts:**
- `trivy-frontend-results.sarif`
- `trivy-api-results.sarif`
- `semgrep-results.json`

**Uploaded to GitHub Security tab for review**

**Dependencies:** Requires `docker` job to pass

---

### 7. Deploy to Kubernetes

**Purpose:** Deploy application to production AKS cluster

**Trigger:** Only on `main` branch, requires manual approval (production environment)

**Environment:** production

**Steps:**

1. **Azure Login**
   - Authenticates to Azure using service principal

2. **Set AKS Context**
   - Connects to AKS cluster
   - Resource Group: `fleet-management-rg`
   - Cluster: `fleet-aks-cluster`
   - Namespace: `fleet-management`

3. **Save Current State (Rollback Preparation)**
   - Captures current image tags
   - Stores in job outputs for rollback

4. **Update Secrets**
   - Creates/updates `fleet-secrets` Kubernetes secret
   - Contains: database URL, JWT secret, API keys

5. **Deploy New Images**
   - Updates API deployment
   - Updates Frontend deployment
   - Uses image tag: `{ACR}/{service}:{github.sha}`

6. **Wait for Rollout**
   - Waits up to 5 minutes for each deployment
   - Monitors pod health

7. **Verify Deployment**
   - Lists pods and services
   - Confirms new pods are running

**Outputs:**
- `previous-api-image`: Previous API image tag (for rollback)
- `previous-frontend-image`: Previous Frontend image tag (for rollback)

**Dependencies:** Requires `docker` and `security` jobs to pass

---

### 8. Smoke Tests

**Purpose:** Validate deployment in production

**Trigger:** Only after successful deployment to `main`

**Tests Performed:**

1. **API Health Check**
   ```bash
   curl --fail $PRODUCTION_URL/api/health
   ```

2. **Frontend Health Check**
   ```bash
   curl --fail $PRODUCTION_URL/
   ```

3. **Authentication Endpoint Test**
   ```bash
   curl --fail -X POST $PRODUCTION_URL/api/auth/login
   ```

**Wait Time:** 30 seconds for services to stabilize

**Failure Action:** Triggers automatic rollback

**Dependencies:** Requires `deploy` job to pass

---

### 9. Rollback (On Failure)

**Purpose:** Automatically revert deployment if smoke tests fail

**Trigger:**
- Smoke test job fails
- Deploy job succeeded (to ensure there's something to roll back)

**Environment:** production (requires approval)

**Rollback Strategy:**

1. **Primary Strategy: Previous Image Restore**
   - Uses saved image tags from deploy job
   - Directly sets images to previous versions
   - Fastest rollback method

2. **Fallback Strategy: kubectl rollout undo**
   - Used if previous image tags not available
   - Reverts to last successful deployment
   - Uses Kubernetes revision history

**Steps:**

1. **Authenticate to Azure & AKS**

2. **Rollback API Deployment**
   ```bash
   kubectl set image deployment/fleet-api \
     fleet-api=$PREVIOUS_API_IMAGE \
     -n fleet-management
   ```

3. **Rollback Frontend Deployment**
   ```bash
   kubectl set image deployment/fleet-frontend \
     fleet-frontend=$PREVIOUS_FRONTEND_IMAGE \
     -n fleet-management
   ```

4. **Wait for Rollback Completion**
   - Timeout: 3 minutes per deployment

5. **Verify Rollback**
   - Lists pods
   - Tests health endpoints
   - Confirms services are operational

6. **Send Rollback Notification**

**Manual Verification Required:**
Even after automatic rollback, manual review is recommended to understand and fix the root cause.

---

### 10. Notifications

**Purpose:** Alert team of pipeline failures

**Trigger:** Any job failure (deploy, smoke-test, rollback)

**Information Provided:**
- Failure notification
- Link to pipeline run
- Rollback status (if applicable)

---

## Security Features

### 1. Secret Detection

- **Tool:** detect-secrets
- **Baseline:** `.secrets.baseline`
- **Scope:** All code files
- **Action:** Fails pipeline if secrets detected

**Update Baseline:**
```bash
detect-secrets scan --baseline .secrets.baseline
```

### 2. Container Scanning

- **Tool:** Trivy
- **Severity:** CRITICAL and HIGH
- **Action:** Fails pipeline if vulnerabilities found
- **Reports:** Uploaded to GitHub Security

### 3. SAST Scanning

- **Tool:** Semgrep
- **Rules:** Security, OWASP Top 10, Secrets
- **Languages:** JavaScript, TypeScript
- **Action:** Reports findings to GitHub Security

### 4. Image Signing

- **Tool:** Cosign (Sigstore)
- **Method:** Keyless signing
- **Purpose:** Verify image integrity and provenance

### 5. Secrets Management

- **Storage:** Kubernetes secrets
- **Source:** GitHub Secrets
- **Encryption:** At rest in etcd

**Required Secrets:**
- `AZURE_CREDENTIALS` - Azure service principal
- `ACR_USERNAME` - Azure Container Registry username
- `ACR_PASSWORD` - Azure Container Registry password
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key
- `AZURE_MAPS_SUBSCRIPTION_KEY` - Azure Maps API key
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key

---

## Deployment Strategy

### Blue-Green Deployment

Kubernetes handles rolling updates automatically:
- New pods are created
- Old pods remain until new pods are healthy
- Traffic switches to new pods
- Old pods are terminated

### Rollout Configuration

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 0
    maxSurge: 1
```

This ensures zero-downtime deployments.

### Deployment Verification

1. **Rollout Status Check**
   - Waits for rollout completion
   - Timeout: 5 minutes

2. **Pod Health Check**
   - Verifies pods are running
   - Checks readiness probes

3. **Smoke Tests**
   - Validates endpoints
   - Tests critical functionality

---

## Rollback Procedures

### Automatic Rollback

Triggered automatically when:
- Smoke tests fail
- Health checks fail after deployment

**See Stage 9 above for details**

### Manual Rollback

If you need to manually roll back:

```bash
# Authenticate to Azure
az login

# Set AKS context
az aks get-credentials \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster

# Rollback API
kubectl rollout undo deployment/fleet-api -n fleet-management

# Rollback Frontend
kubectl rollout undo deployment/fleet-frontend -n fleet-management

# Verify
kubectl get pods -n fleet-management
```

### Rollback to Specific Revision

```bash
# List revisions
kubectl rollout history deployment/fleet-api -n fleet-management

# Rollback to specific revision
kubectl rollout undo deployment/fleet-api \
  --to-revision=3 \
  -n fleet-management
```

---

## SBOM Generation

### What is SBOM?

Software Bill of Materials (SBOM) is a complete inventory of all components in a software application.

### Why We Generate SBOM

1. **Security:** Track vulnerabilities in dependencies
2. **Compliance:** Meet regulatory requirements (Executive Order 14028)
3. **License Management:** Identify license obligations
4. **Supply Chain:** Understand software provenance

### SBOM Formats

We generate two formats for maximum compatibility:

1. **SPDX (Software Package Data Exchange)**
   - Industry standard
   - ISO/IEC 5962:2021
   - Best for compliance

2. **CycloneDX**
   - OWASP standard
   - Designed for security use cases
   - Best for vulnerability tracking

### Accessing SBOM

**Via GitHub Actions:**
1. Go to Actions tab
2. Select the workflow run
3. Download "sbom-reports" artifact

**Via GitHub CLI:**
```bash
gh run list --workflow=ci-cd.yml
gh run download <run-id> -n sbom-reports
```

### SBOM Contents

Each SBOM contains:
- Package name and version
- License information
- Dependencies
- File hashes
- Package URLs (PURL)
- Supplier information

### SBOM Retention

- **Retention Period:** 90 days
- **Storage:** GitHub Actions artifacts
- **Recommendation:** Archive important SBOMs externally for long-term storage

---

## Environment Variables

### Global Environment Variables

Defined in `env:` section of workflow:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_VERSION` | `20.x` | Node.js version for builds |
| `ACR_NAME` | `fleetacr` | Azure Container Registry name |
| `AKS_CLUSTER` | `fleet-aks-cluster` | AKS cluster name |
| `AKS_RESOURCE_GROUP` | `fleet-management-rg` | Azure resource group |
| `NAMESPACE` | `fleet-management` | Kubernetes namespace |
| `PRODUCTION_URL` | `https://fleet.capitaltechalliance.com` | Production URL for smoke tests |

### Updating Production URL

To change the production URL:

1. Update `PRODUCTION_URL` in `env:` section
2. Commit and push changes
3. No secrets update required

**Why?** The production URL is not sensitive and makes smoke tests more maintainable.

---

## Secrets Management

### GitHub Secrets

Configure in: **Settings → Secrets and variables → Actions**

### Required Secrets

| Secret | Type | Purpose |
|--------|------|---------|
| `AZURE_CREDENTIALS` | JSON | Azure service principal for authentication |
| `ACR_USERNAME` | String | ACR username |
| `ACR_PASSWORD` | String | ACR password |
| `DATABASE_URL` | String | PostgreSQL connection string |
| `JWT_SECRET` | String | JWT signing key (min 32 chars) |
| `AZURE_MAPS_SUBSCRIPTION_KEY` | String | Azure Maps API key |
| `OPENAI_API_KEY` | String | OpenAI API key |
| `ANTHROPIC_API_KEY` | String | Anthropic Claude API key |

### Azure Credentials Format

```json
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "xxx",
  "tenantId": "xxx"
}
```

### Rotating Secrets

1. **Update in Azure/Provider**
2. **Update GitHub Secret**
3. **Update Kubernetes Secret**
   ```bash
   kubectl create secret generic fleet-secrets \
     --from-literal=jwt-secret="new-secret" \
     --namespace fleet-management \
     --dry-run=client -o yaml | kubectl apply -f -
   ```
4. **Restart Pods** (if needed)
   ```bash
   kubectl rollout restart deployment/fleet-api -n fleet-management
   ```

---

## Troubleshooting

### Pipeline Failures

#### Lint/Type Check Failed

**Symptoms:** ESLint or TypeScript errors

**Solutions:**
```bash
# Run locally
npm run lint
npx tsc --noEmit

# Auto-fix
npm run lint:fix
```

#### Tests Failed

**Symptoms:** Unit test failures

**Solutions:**
```bash
# Run tests locally
npm test

# Run with coverage
npm run test:coverage

# Debug specific test
npm test -- --testNamePattern="test name"
```

#### Build Failed

**Symptoms:** Compilation errors

**Solutions:**
```bash
# Build locally
npm run build

# Check dependencies
npm ci
```

#### Docker Build Failed

**Symptoms:** Docker build errors

**Possible Causes:**
- Missing dependencies
- Incorrect Dockerfile path
- Build context issues

**Solutions:**
```bash
# Test locally
docker build -f api/Dockerfile.production -t test-api api/
docker build -f Dockerfile.production -t test-frontend .

# Check build logs
docker build --progress=plain ...
```

#### Security Scan Failed

**Symptoms:** Vulnerabilities found

**Solutions:**
```bash
# Update dependencies
npm audit fix

# View vulnerabilities
npm audit

# Trivy scan locally
trivy image <image-name>
```

#### Deployment Failed

**Symptoms:** kubectl errors, rollout timeout

**Solutions:**
```bash
# Check pods
kubectl get pods -n fleet-management

# Check events
kubectl get events -n fleet-management --sort-by='.lastTimestamp'

# Check logs
kubectl logs deployment/fleet-api -n fleet-management

# Check resource limits
kubectl describe deployment fleet-api -n fleet-management
```

#### Smoke Test Failed

**Symptoms:** Health check failures

**Solutions:**
```bash
# Check service endpoints
kubectl get svc -n fleet-management

# Check ingress
kubectl get ingress -n fleet-management

# Test manually
curl -v https://fleet.capitaltechalliance.com/api/health

# Check pod logs
kubectl logs -l app=fleet-api -n fleet-management --tail=100
```

#### Rollback Failed

**Symptoms:** Rollback errors

**Solutions:**
```bash
# Manual rollback
kubectl rollout undo deployment/fleet-api -n fleet-management

# Check rollout history
kubectl rollout history deployment/fleet-api -n fleet-management

# Force delete pods
kubectl delete pod -l app=fleet-api -n fleet-management
```

### Common Issues

#### Issue: "No space left on device"

**Cause:** Docker disk space full

**Solution:**
```bash
docker system prune -a
```

#### Issue: "Unauthorized" when pushing to ACR

**Cause:** ACR credentials expired

**Solution:**
1. Update `ACR_USERNAME` and `ACR_PASSWORD` in GitHub Secrets
2. Verify ACR credentials:
   ```bash
   az acr credential show --name fleetacr
   ```

#### Issue: "Context deadline exceeded"

**Cause:** Kubernetes operation timeout

**Solution:**
1. Increase timeout values
2. Check cluster health
3. Scale up node pool if needed

#### Issue: Pipeline stuck on "Waiting for approval"

**Cause:** Production environment requires manual approval

**Solution:**
1. Go to Actions tab
2. Click on the workflow run
3. Click "Review deployments"
4. Approve or reject

---

## Best Practices

### 1. Branch Strategy

- **main:** Production deployments (requires approval)
- **develop:** Development environment (auto-deploy)
- **stage-*:** Feature branches (build only)

### 2. Commit Messages

Use conventional commits:
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
chore: Update dependencies
test: Add tests
```

### 3. Pull Requests

- All changes via pull requests
- Require status checks to pass
- Require code review
- Squash and merge

### 4. Security

- Never commit secrets
- Run `detect-secrets` locally before committing
- Keep dependencies updated
- Review security alerts

### 5. Testing

- Write tests for new features
- Maintain 60%+ coverage
- Test locally before pushing
- Use test doubles for external services

### 6. Monitoring

- Check pipeline regularly
- Review security scan results
- Monitor deployment metrics
- Set up alerts for failures

---

## Pipeline Metrics

### Success Criteria

- ✅ All jobs pass
- ✅ Code coverage ≥ 60%
- ✅ No HIGH/CRITICAL vulnerabilities
- ✅ No secrets detected
- ✅ Deployment successful
- ✅ Smoke tests pass

### Performance Targets

| Stage | Target Time |
|-------|-------------|
| Lint & Type Check | < 2 min |
| Tests | < 5 min |
| Build | < 3 min |
| Docker Build | < 10 min |
| Security Scan | < 10 min |
| Deploy | < 5 min |
| Smoke Tests | < 2 min |
| **Total** | **< 40 min** |

### Monitoring

Track these metrics:
- Pipeline success rate
- Average execution time
- Rollback frequency
- Security findings
- Coverage trends

---

## Change Log

### 2025-11-20

**Critical Remediation:**
- ✅ Fixed Docker build path (api/Dockerfile.production)
- ✅ Added SBOM generation with Syft
- ✅ Fixed hardcoded production URL (now uses PRODUCTION_URL env var)
- ✅ Implemented automatic rollback strategy
- ✅ Added rollback verification
- ✅ Enhanced notification with rollback status
- ✅ Updated .secrets.baseline
- ✅ Created comprehensive documentation

**Security Improvements:**
- SBOM generation for supply chain security
- Image signing with Cosign
- Container scanning with Trivy
- SAST scanning with Semgrep
- Secret detection with detect-secrets

**Reliability Improvements:**
- Automatic rollback on smoke test failure
- Rollback verification
- Previous image state preservation
- Enhanced error notifications

---

## Support

### Resources

- **GitHub Repository:** https://github.com/your-org/Fleet
- **Azure Portal:** https://portal.azure.com
- **Kubernetes Dashboard:** `az aks browse`

### Contacts

- **DevOps Team:** devops@capitaltechalliance.com
- **Security Team:** security@capitaltechalliance.com

### Documentation

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-20
**Author:** DevOps Team
**Status:** Production Ready ✅
