# GitHub Actions vs Azure Pipelines Comparison

Detailed comparison of the Fleet Management System CI/CD implementation in both platforms.

## Quick Comparison Table

| Feature | GitHub Actions | Azure Pipelines |
|---------|----------------|-----------------|
| **Workflow/Pipeline File** | `.github/workflows/ci-cd.yml` | `azure-pipelines.yml` |
| **Checkout** | `actions/checkout@v4` | `checkout: self` |
| **Node Setup** | `actions/setup-node@v4` | `NodeTool@0` |
| **Secrets** | `${{ secrets.NAME }}` | `$(SECRET_NAME)` from Variable Groups |
| **Env Variables** | `${{ env.NAME }}` | `$(VARIABLE_NAME)` |
| **Conditions** | `if: github.ref == 'refs/heads/main'` | `condition: eq(variables.isProdBranch, true)` |
| **Artifacts** | `actions/upload-artifact@v4` | `PublishPipelineArtifact@1` |
| **Docker Login** | `azure/docker-login@v1` | `Docker@2` with `command: login` |
| **AKS Context** | `azure/aks-set-context@v3` | `AzureCLI@2` with `az aks get-credentials` |
| **Container Registry** | GitHub Container Registry (ghcr.io) | Azure Container Registry (ACR) |
| **Environments** | `environment: production` | `environment: 'fleet-production'` |
| **Service Connections** | GitHub Secrets | Azure DevOps Service Connections |
| **Parallel Jobs** | Multiple `jobs:` in same workflow | Multiple `jobs:` in same stage |
| **Caching** | `actions/cache@v3` | `Cache@2` task |
| **Cost** | Free for public repos, 2000 min/month private | Azure DevOps pricing based on parallel jobs |

---

## Syntax Differences

### Workflow/Pipeline Structure

#### GitHub Actions
```yaml
name: Fleet Management CI/CD Pipeline

on:
  push:
    branches: [main, develop, stage-*]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.x'
  ACR_NAME: 'fleetacr'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
```

#### Azure Pipelines
```yaml
# azure-pipelines.yml

trigger:
  branches:
    include:
      - main
      - develop
      - stage-*

pr:
  branches:
    include:
      - main
      - develop

variables:
  - name: nodeVersion
    value: '20.x'
  - name: acrName
    value: 'fleetacr'

stages:
  - stage: Lint
    displayName: 'Lint & Type Check'
    jobs:
      - job: LintJob
        displayName: 'Lint & Type Check'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - checkout: self
          - task: NodeTool@0
            inputs:
              versionSpec: '$(nodeVersion)'
```

---

### Variables & Secrets

#### GitHub Actions
```yaml
# Workflow file
env:
  NODE_VERSION: '20.x'
  API_URL: ${{ secrets.API_URL }}

steps:
  - name: Build
    run: npm run build
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Secrets Management**: Project Settings → Secrets and variables → Actions

#### Azure Pipelines
```yaml
# Pipeline file
variables:
  - group: fleet-production-vars  # Variable group
  - name: nodeVersion
    value: '20.x'

steps:
  - script: npm run build
    env:
      DATABASE_URL: $(DATABASE-URL)  # From Key Vault via variable group
```

**Secrets Management**:
- Pipelines → Library → Variable Groups
- Link to Azure Key Vault for secrets

---

### Conditions

#### GitHub Actions
```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy
        if: success()
```

#### Azure Pipelines
```yaml
stages:
  - stage: Deploy
    condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
    jobs:
      - job: DeployJob
        condition: succeeded()
```

---

### Docker Operations

#### GitHub Actions
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Login to ACR
  uses: azure/docker-login@v1
  with:
    login-server: ${{ env.ACR_NAME }}.azurecr.io
    username: ${{ secrets.ACR_USERNAME }}
    password: ${{ secrets.ACR_PASSWORD }}

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: ./api
    file: ./api/Dockerfile.production
    push: true
    tags: |
      ${{ env.ACR_NAME }}.azurecr.io/fleet-api:${{ github.sha }}
      ${{ env.ACR_NAME }}.azurecr.io/fleet-api:latest
```

#### Azure Pipelines
```yaml
- task: Docker@2
  displayName: 'Docker Login to ACR'
  inputs:
    command: 'login'
    containerRegistry: 'fleet-acr-connection'

- task: Docker@2
  displayName: 'Build Docker Image'
  inputs:
    command: 'build'
    repository: '$(registryLoginServer)/fleet-api'
    dockerfile: '$(Build.SourcesDirectory)/api/Dockerfile.production'
    buildContext: '$(Build.SourcesDirectory)/api'
    tags: |
      $(imageTag)
      latest

- task: Docker@2
  displayName: 'Push Docker Image'
  inputs:
    command: 'push'
    repository: '$(registryLoginServer)/fleet-api'
    tags: |
      $(imageTag)
      latest
```

---

### Kubernetes Deployment

#### GitHub Actions
```yaml
- name: Azure Login
  uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

- name: Set AKS context
  uses: azure/aks-set-context@v3
  with:
    resource-group: ${{ env.AKS_RESOURCE_GROUP }}
    cluster-name: ${{ env.AKS_CLUSTER }}

- name: Update deployment
  run: |
    kubectl set image deployment/fleet-api \
      fleet-api=${{ env.ACR_NAME }}.azurecr.io/fleet-api:${{ github.sha }} \
      -n ${{ env.NAMESPACE }}
```

#### Azure Pipelines
```yaml
- task: AzureCLI@2
  displayName: 'Get AKS Credentials'
  inputs:
    azureSubscription: 'fleet-azure-subscription'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      az aks get-credentials \
        --resource-group $(aksResourceGroup) \
        --name $(aksCluster) \
        --overwrite-existing

- task: Kubernetes@1
  displayName: 'Update deployment image'
  inputs:
    connectionType: 'Azure Resource Manager'
    azureSubscriptionEndpoint: 'fleet-azure-subscription'
    azureResourceGroup: '$(aksResourceGroup)'
    kubernetesCluster: '$(aksCluster)'
    namespace: '$(namespace)'
    command: 'set'
    arguments: 'image deployment/fleet-api fleet-api=$(registryLoginServer)/fleet-api:$(imageTag)'
```

---

### Artifacts

#### GitHub Actions
```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: frontend-dist
    path: dist/
    retention-days: 90

- name: Download artifacts
  uses: actions/download-artifact@v4
  with:
    name: frontend-dist
    path: dist/
```

#### Azure Pipelines
```yaml
- task: PublishPipelineArtifact@1
  displayName: 'Publish frontend artifacts'
  inputs:
    targetPath: '$(Build.SourcesDirectory)/dist'
    artifact: 'frontend-dist'
    publishLocation: 'pipeline'

- task: DownloadPipelineArtifact@2
  displayName: 'Download frontend artifacts'
  inputs:
    artifactName: 'frontend-dist'
    targetPath: '$(Pipeline.Workspace)/dist'
```

---

### Test Results & Coverage

#### GitHub Actions
```yaml
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./api/coverage/coverage-final.json
    flags: api
    fail_ci_if_error: true

# No built-in test results visualization
```

#### Azure Pipelines
```yaml
- task: PublishTestResults@2
  displayName: 'Publish test results'
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: '**/test-results/junit.xml'
    mergeTestResults: true
    failTaskOnFailedTests: true

- task: PublishCodeCoverageResults@2
  displayName: 'Publish code coverage'
  inputs:
    codeCoverageTool: 'Cobertura'
    summaryFileLocation: '$(Build.SourcesDirectory)/api/coverage/cobertura-coverage.xml'
    reportDirectory: '$(Build.SourcesDirectory)/api/coverage'
```

---

## Feature Comparison

### Multi-Stage Pipelines

#### GitHub Actions
- ✅ Jobs can depend on other jobs
- ❌ No native "stages" concept
- ⚠️ Must use job dependencies

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps: [...]

  deploy:
    needs: [build, test]
    runs-on: ubuntu-latest
    steps: [...]
```

#### Azure Pipelines
- ✅ Native stages concept
- ✅ Stages can depend on multiple stages
- ✅ Better visualization in UI

```yaml
stages:
  - stage: Build
  - stage: Test
  - stage: Deploy
    dependsOn:
      - Build
      - Test
```

---

### Deployment Environments

#### GitHub Actions
- ✅ Deployment environments
- ✅ Protection rules & approvals
- ✅ Environment secrets
- ⚠️ Limited to GitHub

```yaml
jobs:
  deploy:
    environment: production
    steps: [...]
```

**Configuration**: Repository Settings → Environments

#### Azure Pipelines
- ✅ Environments with approval gates
- ✅ Checks and validations
- ✅ Deployment history
- ✅ Integration with Azure resources

```yaml
- deployment: DeployToProduction
  environment: 'fleet-production'
  strategy:
    runOnce:
      deploy:
        steps: [...]
```

**Configuration**: Pipelines → Environments

---

### Caching

#### GitHub Actions
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

#### Azure Pipelines
```yaml
- task: Cache@2
  displayName: 'Cache npm packages'
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    restoreKeys: |
      npm | "$(Agent.OS)"
    path: $(npm_config_cache)
```

---

### Security Scanning

Both platforms support:
- ✅ Semgrep SAST
- ✅ Trivy container scanning
- ✅ npm audit
- ✅ Secret detection
- ✅ SBOM generation

#### GitHub Actions
- ✅ Native CodeQL integration
- ✅ Dependabot alerts
- ✅ Security tab in UI
- ✅ SARIF upload

#### Azure Pipelines
- ✅ Integration with Defender for Cloud
- ✅ SARIF upload to Azure Security Center
- ✅ Artifact scanning
- ⚠️ CodeQL requires manual setup

---

## Cost Comparison

### GitHub Actions

**Free Tier** (Public Repositories):
- Unlimited minutes
- 20 concurrent jobs

**Free Tier** (Private Repositories):
- 2,000 minutes/month
- Storage: 500 MB

**Paid Plans**:
- Team: $4/user/month + usage
- Enterprise: $21/user/month + usage
- Minutes: $0.008/minute (Linux), $0.016/minute (Windows), $0.064/minute (macOS)

### Azure Pipelines

**Free Tier**:
- Public projects: 10 free parallel jobs
- Private projects: 1 free parallel job (1,800 minutes/month)

**Paid Plans**:
- Additional parallel job: $40/month (unlimited minutes)
- Self-hosted agents: Free (unlimited)

**Cost Optimization**:
- Use self-hosted agents for heavy workloads
- Azure DevOps Server for on-premises

---

## Migration Checklist

### Before Migration

- [ ] Document current GitHub Actions workflow
- [ ] Identify all secrets used
- [ ] List all external services/integrations
- [ ] Review branch protection rules
- [ ] Document environment configurations

### During Migration

- [ ] Create Azure DevOps project
- [ ] Set up service connections
- [ ] Create variable groups
- [ ] Link Azure Key Vault
- [ ] Create pipeline environments
- [ ] Convert YAML syntax
- [ ] Test pipeline on feature branch
- [ ] Update documentation

### After Migration

- [ ] Run pipeline multiple times
- [ ] Verify all stages complete
- [ ] Test deployment to production
- [ ] Test rollback mechanism
- [ ] Update team onboarding docs
- [ ] Configure notifications
- [ ] Disable GitHub Actions (optional)

---

## Advantages & Disadvantages

### GitHub Actions

**Advantages**:
✅ Tight GitHub integration
✅ Large marketplace of actions
✅ Simpler syntax for beginners
✅ Better for open-source projects
✅ Native CodeQL integration
✅ Dependabot integration

**Disadvantages**:
❌ Limited to GitHub
❌ No native multi-stage concept
❌ Fewer enterprise features
❌ Limited test result visualization
❌ No built-in approval gates (requires environments)

### Azure Pipelines

**Advantages**:
✅ Enterprise-grade features
✅ Better multi-stage pipeline support
✅ Excellent test result visualization
✅ Integrated with Azure ecosystem
✅ Powerful approval gates
✅ Can use GitHub, Azure Repos, or Bitbucket
✅ Self-hosted agents
✅ Better compliance features

**Disadvantages**:
❌ Steeper learning curve
❌ More complex YAML syntax
❌ Requires Azure DevOps account
❌ Less community marketplace
❌ Setup more complex

---

## Recommendations

### Use GitHub Actions If:
- Your code is on GitHub
- You're building open-source projects
- You need simple CI/CD
- Your team is small (<10 developers)
- You want plug-and-play integrations

### Use Azure Pipelines If:
- You use Azure services heavily
- You need enterprise compliance
- You want advanced deployment strategies
- You need sophisticated approval workflows
- You're building large-scale applications
- You need multi-cloud deployments

### Hybrid Approach:
- Use GitHub for code hosting
- Use Azure Pipelines for CI/CD
- Leverage both platforms' strengths

---

## Conversion Reference

| GitHub Actions Syntax | Azure Pipelines Equivalent |
|----------------------|---------------------------|
| `name:` | `displayName:` |
| `on.push.branches` | `trigger.branches.include` |
| `on.pull_request` | `pr:` |
| `jobs.job-id.runs-on` | `pool.vmImage` |
| `jobs.job-id.steps` | `steps:` |
| `jobs.job-id.needs` | `dependsOn:` |
| `env:` | `variables:` or `env:` |
| `${{ }}` | `$()` |
| `uses:` | `task:` |
| `run:` | `script:` or `bash:` |
| `if:` | `condition:` |
| `secrets.NAME` | `$(SECRET-NAME)` from variable group |
| `github.sha` | `$(Build.SourceVersion)` |
| `github.ref` | `$(Build.SourceBranch)` |
| `github.actor` | `$(Build.RequestedFor)` |
| `github.run_number` | `$(Build.BuildNumber)` |

---

## Example: Complete Job Conversion

### GitHub Actions
```yaml
jobs:
  build:
    name: Build Application
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          API_URL: ${{ secrets.API_URL }}

      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### Azure Pipelines
```yaml
stages:
  - stage: Build
    displayName: 'Build Application'
    condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
    jobs:
      - job: BuildJob
        displayName: 'Build Application'
        pool:
          vmImage: 'ubuntu-latest'
        variables:
          NODE_ENV: production
        steps:
          - checkout: self

          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'

          - task: Cache@2
            inputs:
              key: 'npm | "$(Agent.OS)" | package-lock.json'
              path: $(npm_config_cache)

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run build
            displayName: 'Build'
            env:
              API_URL: $(API-URL)

          - task: PublishPipelineArtifact@1
            inputs:
              targetPath: 'dist/'
              artifact: 'dist'
```

---

## Conclusion

Both GitHub Actions and Azure Pipelines are excellent CI/CD platforms. The choice depends on:

1. **Existing Infrastructure**: GitHub vs Azure ecosystem
2. **Team Size**: Small teams → GitHub Actions, Large teams → Azure Pipelines
3. **Complexity**: Simple projects → GitHub Actions, Complex → Azure Pipelines
4. **Compliance**: Enterprise compliance → Azure Pipelines
5. **Cost**: Evaluate based on usage patterns

For the Fleet Management System, Azure Pipelines provides:
- Better integration with Azure services (ACR, AKS, Key Vault)
- More robust multi-stage pipeline support
- Enterprise-grade approval workflows
- Superior test result visualization

---

**Last Updated**: 2025-11-20
**Version**: 1.0.0
**Maintained By**: DevOps Team
