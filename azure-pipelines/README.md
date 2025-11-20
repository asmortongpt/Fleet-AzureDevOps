# Azure Pipelines Configuration

This directory contains the Azure DevOps Pipeline templates and configurations for the Fleet Management System.

## Directory Structure

```
azure-pipelines/
├── templates/
│   ├── lint-template.yml           # Lint & type check stage
│   ├── test-template.yml           # Unit tests stage
│   ├── build-template.yml          # Build verification stage
│   ├── docker-template.yml         # Docker build & push stage
│   ├── security-template.yml       # Security scanning stage
│   ├── deploy-template.yml         # Kubernetes deployment stage
│   ├── smoke-test-template.yml     # Post-deployment smoke tests
│   └── rollback-template.yml       # Rollback on failure
├── examples/
│   ├── service-connections.json    # Service connection examples
│   └── variable-groups.json        # Variable group examples
└── README.md                       # This file
```

## Templates Overview

### 1. lint-template.yml
**Purpose**: Code quality checks
**Steps**:
- Checkout code
- Setup Node.js
- Cache npm packages
- Install dependencies (frontend & API)
- Run ESLint (frontend & API)
- Run TypeScript type checking (frontend & API)

**Outputs**: Lint results artifact

---

### 2. test-template.yml
**Purpose**: Unit testing with coverage
**Steps**:
- Checkout code
- Setup Node.js
- Cache npm packages
- Install dependencies
- Run frontend tests
- Run API tests
- Generate coverage report
- Check coverage threshold (60%)
- Publish test results
- Publish coverage results

**Outputs**:
- Test results (JUnit format)
- Coverage report (Cobertura format)

---

### 3. build-template.yml
**Purpose**: Verify production builds work
**Steps**:
- Checkout code
- Setup Node.js
- Cache npm packages
- Build frontend (production mode)
- Build API (production mode)
- Publish build artifacts

**Outputs**:
- frontend-dist artifact
- api-dist artifact

---

### 4. docker-template.yml
**Purpose**: Build and push Docker images to ACR
**Steps**:
- Checkout code
- Login to ACR
- Build API Docker image
- Push API image to ACR
- Build Frontend Docker image
- Push Frontend image to ACR
- Generate SBOM (SPDX + CycloneDX) with Syft
- Save image digests

**Outputs**:
- Docker images in ACR
- SBOM reports
- Image digests

**Images**:
- `fleetacr.azurecr.io/fleet-api:{commit-sha}`
- `fleetacr.azurecr.io/fleet-api:latest`
- `fleetacr.azurecr.io/fleet-frontend:{commit-sha}`
- `fleetacr.azurecr.io/fleet-frontend:latest`

---

### 5. security-template.yml
**Purpose**: Comprehensive security scanning
**Steps**:
- **SAST**: Semgrep (security-audit, secrets, OWASP Top 10, JS/TS)
- **Container Scanning**: Trivy (CRITICAL & HIGH vulnerabilities)
- **Dependency Audit**: npm audit (production dependencies)
- **Secret Detection**: detect-secrets
- **Container Signing**: Cosign (placeholder for production)

**Outputs**:
- Semgrep SARIF results
- Trivy SARIF results
- Trivy human-readable reports
- NPM audit JSON reports

**Scan Coverage**:
- Static code analysis
- Container vulnerabilities
- Dependency vulnerabilities
- Hardcoded secrets
- OWASP Top 10 issues

---

### 6. deploy-template.yml
**Purpose**: Deploy to AKS production environment
**Steps**:
- Checkout code
- Get AKS credentials
- Create/verify namespace
- Fetch secrets from Azure Key Vault
- Create Kubernetes secrets
- Save current deployment state (for rollback)
- Apply ConfigMaps
- Apply Network Policies
- Deploy API to AKS
- Deploy Frontend to AKS
- Wait for rollouts
- Apply Ingress
- Apply HPA (Horizontal Pod Autoscaler)
- Apply PDB (Pod Disruption Budget)
- Run database migrations
- Verify deployment

**Outputs**:
- Deployment state artifact (for rollback)

**Resources Updated**:
- Deployments: fleet-api, fleet-frontend
- Services: fleet-api-service, fleet-frontend-service
- Ingress: fleet-ingress
- ConfigMaps: fleet-config
- Secrets: fleet-secrets

---

### 7. smoke-test-template.yml
**Purpose**: Validate production deployment
**Steps**:
- Wait for services to stabilize (30s)
- Health check - API endpoint
- Health check - Frontend endpoint
- Test authentication endpoint
- Test vehicles API endpoint
- Test CORS headers
- Test SSL certificate
- Performance check (response time)

**Success Criteria**:
- All health checks return 200 OK
- Auth endpoint returns 401 (expected for wrong credentials)
- API responds within 2 seconds
- CORS headers present
- SSL certificate valid

---

### 8. rollback-template.yml
**Purpose**: Automatic rollback on deployment failure
**Steps**:
- Get AKS credentials
- Download previous deployment state
- Rollback API deployment to previous image
- Rollback Frontend deployment to previous image
- Verify rollback successful
- Test health endpoints after rollback
- Send rollback notification
- Create work item for investigation
- Send email notification

**Triggers**:
- Smoke test failure
- Deployment failure
- Any stage failure after deployment

**Notifications**:
- Console output with rollback details
- Work item creation (Bug)
- Email notification (optional)

---

## Usage

### Run Entire Pipeline

The main pipeline (`azure-pipelines.yml`) orchestrates all stages:

```yaml
# Triggers on:
# - Push to main, develop, stage-* branches
# - Pull requests to main, develop

# Stage execution order:
Lint (parallel) ──┐
Test (parallel) ──┴─→ Build → Docker → Security → Deploy → SmokeTest
                                                       ↓ (on failure)
                                                    Rollback
```

### Run Individual Template

You can test individual templates locally or in a separate pipeline:

```yaml
# test-pipeline.yml
trigger: none  # Manual only

stages:
  - stage: TestOnly
    jobs:
      - template: azure-pipelines/templates/test-template.yml
```

### Modify Templates

To customize templates:

1. **Add new step**: Add to appropriate template
2. **Modify variables**: Update in main pipeline or variable groups
3. **Change conditions**: Update `condition:` in template or stage
4. **Add new stage**: Create new template and reference in main pipeline

Example: Add a new security tool to security-template.yml:

```yaml
- script: |
    # Install new security tool
    pip install bandit
    bandit -r . -f json -o bandit-results.json
  displayName: 'Run Bandit security scan'
  continueOnError: true

- task: PublishPipelineArtifact@1
  displayName: 'Publish Bandit results'
  inputs:
    targetPath: 'bandit-results.json'
    artifact: 'bandit-results'
```

---

## Variables Used

### Pipeline Variables
These are defined in `azure-pipelines.yml`:

| Variable | Value | Description |
|----------|-------|-------------|
| `nodeVersion` | `20.x` | Node.js version |
| `registryName` | `fleetacr` | ACR name |
| `registryLoginServer` | `fleetacr.azurecr.io` | ACR login server |
| `aksCluster` | `fleet-aks-cluster` | AKS cluster name |
| `aksResourceGroup` | `fleet-management-rg` | Azure resource group |
| `namespace` | `fleet-management` | Kubernetes namespace |
| `productionUrl` | `https://fleet.capitaltechalliance.com` | Production URL |
| `imageTag` | `$(Build.SourceVersion)` | Docker image tag (commit SHA) |
| `isProdBranch` | `$[eq(...)]` | Condition for main branch |
| `isDevelopBranch` | `$[eq(...)]` | Condition for develop branch |

### Variable Groups
These are defined in Azure DevOps Library:

#### fleet-production-vars
Non-sensitive configuration values (see examples/variable-groups.json)

#### fleet-secrets
Sensitive values from Azure Key Vault (see examples/variable-groups.json)

---

## Service Connections Required

### 1. fleet-acr-connection
- **Type**: Docker Registry
- **Registry**: Azure Container Registry
- **Purpose**: Push/pull Docker images

### 2. fleet-azure-subscription
- **Type**: Azure Resource Manager
- **Purpose**: Deploy to Azure resources

### 3. fleet-aks-connection
- **Type**: Kubernetes
- **Purpose**: Deploy to AKS cluster

See `examples/service-connections.json` for configuration details.

---

## Artifacts Published

Each stage publishes artifacts that can be used by subsequent stages or for debugging:

| Stage | Artifact Name | Contents |
|-------|--------------|----------|
| Lint | `lint-results` | ESLint/TypeScript output |
| Test | `coverage-report` | Code coverage HTML/XML |
| Build | `frontend-dist` | Built frontend files |
| Build | `api-dist` | Built API files |
| Docker | `sbom-reports` | SPDX & CycloneDX SBOMs |
| Docker | `image-digests` | Docker image digests |
| Security | `semgrep-results` | SAST scan results |
| Security | `trivy-results` | Container scan results |
| Security | `npm-audit-results` | Dependency audit |
| Deploy | `deployment-state` | Previous image tags (for rollback) |

---

## Conditions & Triggers

### Stage Conditions

**Docker Stage**: Only runs on `main` or `develop` branches
```yaml
condition: and(succeeded(), or(eq(variables.isProdBranch, true), eq(variables.isDevelopBranch, true)))
```

**Deploy Stage**: Only runs on `main` branch after security scans pass
```yaml
condition: and(succeeded(), eq(variables.isProdBranch, true))
```

**Rollback Stage**: Only runs if Deploy or SmokeTest fails
```yaml
condition: failed()
```

### Trigger Configuration

**Branch Triggers**:
- `main` - Production deployment
- `develop` - Development deployment
- `stage-*` - Feature branches (no deployment)

**PR Triggers**:
- Pull requests to `main` or `develop`
- Runs Lint, Test, Build stages only

**Path Exclusions**:
- `*.md` files
- `docs/**` directory
- Changes to these don't trigger pipeline

---

## Extending the Pipeline

### Add New Stage

1. Create template in `templates/` directory
2. Reference in main pipeline:

```yaml
- stage: NewStage
  displayName: 'New Stage Name'
  dependsOn: PreviousStage
  condition: succeeded()
  jobs:
    - template: azure-pipelines/templates/new-stage-template.yml
```

### Add Parallel Job

```yaml
# In any template
jobs:
  - job: Job1
    displayName: 'First Job'
    steps:
      - script: echo "Job 1"

  - job: Job2
    displayName: 'Second Job'
    steps:
      - script: echo "Job 2"
```

### Add Manual Approval

Use environments with approvals:

```yaml
- deployment: DeployToProduction
  environment: 'fleet-production'  # Must have approvals configured
  strategy:
    runOnce:
      deploy:
        steps:
          - script: echo "Deploying after approval"
```

---

## Troubleshooting

### Template Not Found

**Error**: `Template file not found: azure-pipelines/templates/xxx.yml`

**Solution**: Verify file path is correct relative to repository root

### Variable Not Resolved

**Error**: `$(VARIABLE_NAME)` appears in logs

**Solution**:
- Check variable group is linked to pipeline
- Verify variable name matches exactly
- Ensure variable group has correct permissions

### Service Connection Fails

**Error**: `##[error]Failed to connect to service`

**Solution**:
- Verify service connection name matches YAML
- Check service connection permissions
- Re-authorize service connection if needed

### Stage Skipped

**Condition not met**: Check stage conditions

**Solution**:
- Review `condition:` in stage definition
- Verify branch name matches expected pattern
- Check dependency stages completed successfully

---

## Best Practices

1. **Template Organization**
   - One template per stage/major function
   - Keep templates reusable
   - Use parameters for flexibility

2. **Variable Management**
   - Non-sensitive: Variable groups
   - Sensitive: Azure Key Vault
   - Environment-specific: Variable groups per environment

3. **Artifact Management**
   - Publish artifacts for debugging
   - Set retention policies
   - Use meaningful artifact names

4. **Error Handling**
   - Use `continueOnError: true` for non-critical steps
   - Always rollback on deployment failure
   - Send notifications on errors

5. **Security**
   - Never hardcode secrets
   - Use service connections
   - Scan all container images
   - Review security scan results

6. **Performance**
   - Use caching for dependencies
   - Run independent stages in parallel
   - Optimize Docker builds with layer caching

---

## Additional Resources

- [Azure Pipelines YAML Schema](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema)
- [Template Expressions](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/templates)
- [Predefined Variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables)
- [Service Connections](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints)

---

**Maintained By**: DevOps Team
**Last Updated**: 2025-11-20
**Version**: 1.0.0
