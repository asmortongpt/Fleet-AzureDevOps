# Azure Pipelines Migration Guide

This document provides a comprehensive guide for migrating from GitHub Actions to Azure DevOps Pipelines for the Fleet Management System.

## Table of Contents

1. [Overview](#overview)
2. [Key Differences](#key-differences)
3. [Migration Mapping](#migration-mapping)
4. [Prerequisites](#prerequisites)
5. [Step-by-Step Migration](#step-by-step-migration)
6. [Validation](#validation)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Fleet Management System CI/CD pipeline has been converted from GitHub Actions to Azure DevOps Pipelines while maintaining all functionality:

### Features Maintained
- ✅ Multi-stage pipeline (Lint, Test, Build, Security, Deploy)
- ✅ SBOM generation (SPDX + CycloneDX)
- ✅ Container scanning (Trivy)
- ✅ SAST scanning (Semgrep)
- ✅ Secret detection (detect-secrets)
- ✅ NPM audit
- ✅ Automatic rollback on failure
- ✅ Health checks / smoke tests
- ✅ Container signing capability (Cosign)

### Architecture

```
azure-pipelines.yml (Main Pipeline)
├── Stage 1: Lint & Type Check
│   └── lint-template.yml
├── Stage 2: Unit Tests
│   └── test-template.yml
├── Stage 3: Build Verification
│   └── build-template.yml
├── Stage 4: Docker Build & Push
│   └── docker-template.yml
├── Stage 5: Security Scanning
│   └── security-template.yml
├── Stage 6: Deploy to Kubernetes
│   └── deploy-template.yml
├── Stage 7: Smoke Tests
│   └── smoke-test-template.yml
└── Stage 8: Rollback (on failure)
    └── rollback-template.yml
```

---

## Key Differences

### GitHub Actions → Azure Pipelines

| Feature | GitHub Actions | Azure Pipelines |
|---------|---------------|----------------|
| **Workflow File** | `.github/workflows/ci-cd.yml` | `azure-pipelines.yml` |
| **Actions** | `uses: actions/checkout@v4` | `checkout: self` |
| **Tasks** | Actions from marketplace | Tasks from Azure DevOps |
| **Secrets** | `${{ secrets.SECRET_NAME }}` | `$(SECRET_NAME)` from Variable Groups |
| **Conditions** | `if: github.ref == 'refs/heads/main'` | `condition: eq(variables.isProdBranch, true)` |
| **Artifacts** | `actions/upload-artifact@v4` | `PublishPipelineArtifact@1` |
| **Environments** | `environment: production` | `environment: 'fleet-production'` |
| **Service Connections** | Secrets | Service Connections in Azure DevOps |
| **Container Registry** | GHCR (`ghcr.io`) | ACR (`fleetacr.azurecr.io`) |

### Syntax Comparison

#### GitHub Actions
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: npm run build
        env:
          NODE_ENV: ${{ secrets.NODE_ENV }}
```

#### Azure Pipelines
```yaml
jobs:
  - job: Build
    pool:
      vmImage: 'ubuntu-latest'
    steps:
      - checkout: self
      - script: npm run build
        displayName: 'Build'
        env:
          NODE_ENV: $(NODE_ENV)
```

---

## Migration Mapping

### Stage Mapping

| GitHub Actions Job | Azure Pipeline Stage | Template File |
|-------------------|---------------------|---------------|
| `lint` | `Lint` | `lint-template.yml` |
| `test` | `Test` | `test-template.yml` |
| `build` | `Build` | `build-template.yml` |
| `docker` | `Docker` | `docker-template.yml` |
| `security` | `Security` | `security-template.yml` |
| `deploy` | `Deploy` | `deploy-template.yml` |
| `smoke-test` | `SmokeTest` | `smoke-test-template.yml` |
| `rollback` | `Rollback` | `rollback-template.yml` |

### Secret Migration

| GitHub Secret | Azure DevOps Variable | Location |
|--------------|----------------------|----------|
| `ACR_USERNAME` | Service Connection | `fleet-acr-connection` |
| `ACR_PASSWORD` | Service Connection | `fleet-acr-connection` |
| `AZURE_CREDENTIALS` | Service Connection | `fleet-azure-subscription` |
| `DATABASE_URL` | Variable Group | `fleet-secrets` |
| `JWT_SECRET` | Azure Key Vault | `fleet-keyvault` |
| `OPENAI_API_KEY` | Azure Key Vault | `fleet-keyvault` |
| `ANTHROPIC_API_KEY` | Azure Key Vault | `fleet-keyvault` |

### Action → Task Mapping

| GitHub Action | Azure Task | Notes |
|--------------|------------|-------|
| `actions/checkout@v4` | `checkout: self` | Built-in |
| `actions/setup-node@v4` | `NodeTool@0` | Built-in task |
| `docker/build-push-action@v5` | `Docker@2` | Built-in task |
| `azure/docker-login@v1` | `Docker@2` with `command: login` | Built-in task |
| `azure/login@v1` | `AzureCLI@2` | Service connection |
| `azure/aks-set-context@v3` | `AzureCLI@2` with `az aks get-credentials` | CLI command |
| `actions/upload-artifact@v4` | `PublishPipelineArtifact@1` | Built-in task |
| `codecov/codecov-action@v3` | `PublishCodeCoverageResults@2` | Built-in task |
| Custom scripts | `script:` or `bash:` | Direct execution |

---

## Prerequisites

Before starting the migration, ensure you have:

### Azure DevOps Setup
- [ ] Azure DevOps organization created
- [ ] Project created in Azure DevOps
- [ ] Azure DevOps CLI installed (optional)
- [ ] Appropriate permissions (Build Administrator, Release Administrator)

### Azure Resources
- [ ] Azure Container Registry (ACR) - `fleetacr.azurecr.io`
- [ ] Azure Kubernetes Service (AKS) - `fleet-aks-cluster`
- [ ] Azure Key Vault - `fleet-keyvault`
- [ ] Azure subscription with appropriate permissions

### Access & Permissions
- [ ] Azure subscription Owner/Contributor access
- [ ] ACR push permissions
- [ ] AKS cluster admin access
- [ ] Key Vault secrets access
- [ ] Azure DevOps project admin access

---

## Step-by-Step Migration

### Step 1: Create Service Connections

Service connections are how Azure Pipelines authenticates to external services.

#### 1.1 Azure Container Registry Connection

1. In Azure DevOps, go to **Project Settings** → **Service Connections**
2. Click **New service connection**
3. Select **Docker Registry**
4. Choose **Azure Container Registry**
5. Fill in:
   - **Connection name**: `fleet-acr-connection`
   - **Azure subscription**: Select your subscription
   - **Azure container registry**: `fleetacr`
6. Click **Save**

#### 1.2 Azure Resource Manager Connection

1. Click **New service connection**
2. Select **Azure Resource Manager**
3. Choose **Service principal (automatic)**
4. Fill in:
   - **Connection name**: `fleet-azure-subscription`
   - **Subscription**: Select your subscription
   - **Resource group**: `fleet-management-rg` (or leave empty for all)
5. Click **Save**

#### 1.3 Kubernetes Service Connection

1. Click **New service connection**
2. Select **Kubernetes**
3. Choose **Azure Subscription**
4. Fill in:
   - **Connection name**: `fleet-aks-connection`
   - **Azure subscription**: Select the connection from 1.2
   - **Cluster**: `fleet-aks-cluster`
   - **Namespace**: `fleet-management`
5. Click **Save**

### Step 2: Create Variable Groups

Variable groups store reusable variables across pipelines.

#### 2.1 Create `fleet-production-vars`

1. Go to **Pipelines** → **Library**
2. Click **+ Variable group**
3. Name: `fleet-production-vars`
4. Add variables:
   ```
   NODE_VERSION: 20.x
   REGISTRY_NAME: fleetacr
   REGISTRY_LOGIN_SERVER: fleetacr.azurecr.io
   AKS_CLUSTER: fleet-aks-cluster
   AKS_RESOURCE_GROUP: fleet-management-rg
   NAMESPACE: fleet-management
   PRODUCTION_URL: https://fleet.capitaltechalliance.com
   ```
5. Click **Save**

#### 2.2 Create `fleet-secrets` (Linked to Key Vault)

1. Click **+ Variable group**
2. Name: `fleet-secrets`
3. Enable **Link secrets from an Azure key vault as variables**
4. Select:
   - **Azure subscription**: `fleet-azure-subscription`
   - **Key vault name**: `fleet-keyvault`
5. Click **Authorize** to grant permissions
6. Click **+ Add** and select secrets:
   - `DATABASE-URL`
   - `JWT-SECRET`
   - `AZURE-MAPS-KEY`
   - `OPENAI-API-KEY`
   - `ANTHROPIC-API-KEY`
7. Click **Save**

### Step 3: Create Pipeline Environments

Environments enable deployment approvals and history.

#### 3.1 Create Production Environment

1. Go to **Pipelines** → **Environments**
2. Click **New environment**
3. Name: `fleet-production`
4. Resource: **None** (we'll use Kubernetes)
5. Click **Create**

#### 3.2 Configure Approvals (Optional)

1. Click on the `fleet-production` environment
2. Click **Approvals and checks** (three dots menu)
3. Click **Approvals**
4. Add approvers (e.g., team leads, managers)
5. Configure:
   - **Approvers**: Add users/groups
   - **Timeout**: 30 days
   - **Approval policy**: First response
6. Click **Create**

### Step 4: Configure Azure Key Vault

Store sensitive secrets in Azure Key Vault.

#### 4.1 Add Secrets to Key Vault

```bash
# Set variables
KEYVAULT_NAME="fleet-keyvault"
RESOURCE_GROUP="fleet-management-rg"
LOCATION="eastus"

# Create Key Vault (if not exists)
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Add secrets
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "DATABASE-URL" \
  --value "postgresql://user:pass@host:5432/fleetdb"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "JWT-SECRET" \
  --value "your-jwt-secret-here"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "AZURE-MAPS-KEY" \
  --value "your-azure-maps-key"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "OPENAI-API-KEY" \
  --value "sk-..."

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "ANTHROPIC-API-KEY" \
  --value "sk-ant-..."
```

#### 4.2 Grant Pipeline Access to Key Vault

```bash
# Get the service principal ID from the service connection
# Then grant access
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --spn <service-principal-id> \
  --secret-permissions get list
```

### Step 5: Create the Pipeline

#### 5.1 Push Code to Azure Repos (or connect to GitHub)

**Option A: Azure Repos**
```bash
# Add Azure Repos remote
git remote add azure https://dev.azure.com/your-org/fleet-management/_git/Fleet

# Push code
git push azure main
```

**Option B: Keep using GitHub**
- Azure Pipelines can connect to GitHub repositories
- In Pipeline creation, select GitHub as the source

#### 5.2 Create Pipeline in Azure DevOps

1. Go to **Pipelines** → **Pipelines**
2. Click **New pipeline**
3. Select your repository source (Azure Repos or GitHub)
4. Select repository: `Fleet`
5. Select **Existing Azure Pipelines YAML file**
6. Path: `/azure-pipelines.yml`
7. Click **Continue**
8. Review the pipeline YAML
9. Click **Run** to test

### Step 6: Configure Branch Policies (Optional)

Enforce pipeline validation before merging PRs.

1. Go to **Repos** → **Branches**
2. Click on `main` branch → **Branch policies**
3. Under **Build Validation**, click **+**
4. Select your pipeline
5. Configure:
   - **Build expiration**: Immediately
   - **Policy requirement**: Required
6. Click **Save**

### Step 7: Test the Pipeline

#### 7.1 Trigger Pipeline Manually

1. Go to **Pipelines** → **Pipelines**
2. Select your pipeline
3. Click **Run pipeline**
4. Select branch: `main`
5. Click **Run**

#### 7.2 Monitor Pipeline Execution

1. Click on the running pipeline
2. Monitor each stage:
   - ✅ Lint → ✅ Test → ✅ Build → ✅ Docker → ✅ Security → ✅ Deploy → ✅ SmokeTest
3. Check logs for any errors

#### 7.3 Verify Deployment

```bash
# Check AKS deployments
az aks get-credentials \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster

kubectl get pods -n fleet-management
kubectl get services -n fleet-management
kubectl get ingress -n fleet-management

# Test endpoints
curl https://fleet.capitaltechalliance.com/api/health
curl https://fleet.capitaltechalliance.com/
```

---

## Validation

### Pre-Migration Checklist

Before disabling GitHub Actions:

- [ ] All service connections created and working
- [ ] Variable groups configured with correct values
- [ ] Azure Key Vault secrets added
- [ ] Pipeline environments created
- [ ] Pipeline runs successfully on `main` branch
- [ ] Deployment to AKS successful
- [ ] Smoke tests pass
- [ ] Rollback tested (simulate failure)
- [ ] All team members have access to Azure DevOps
- [ ] Documentation updated

### Post-Migration Validation

- [ ] Run pipeline 3-5 times successfully
- [ ] Test PR validation
- [ ] Verify all artifacts are published
- [ ] Check security scan results
- [ ] Verify SBOM generation
- [ ] Test rollback mechanism
- [ ] Monitor production for 24-48 hours
- [ ] Disable GitHub Actions workflow

---

## Troubleshooting

### Common Issues

#### Issue 1: Service Connection Authentication Fails

**Error**: `##[error]Failed to connect to Azure Container Registry`

**Solution**:
```bash
# Re-create service connection with correct credentials
# Or verify ACR permissions
az role assignment create \
  --assignee <service-principal-id> \
  --role AcrPush \
  --scope /subscriptions/{subscription-id}/resourceGroups/fleet-management-rg/providers/Microsoft.ContainerRegistry/registries/fleetacr
```

#### Issue 2: Key Vault Access Denied

**Error**: `##[error]The user, group or application does not have secrets get permission`

**Solution**:
```bash
# Grant Key Vault access to service principal
az keyvault set-policy \
  --name fleet-keyvault \
  --spn <service-principal-id> \
  --secret-permissions get list
```

#### Issue 3: AKS Deployment Fails

**Error**: `##[error]Unable to connect to the AKS cluster`

**Solution**:
```bash
# Verify AKS permissions
az role assignment create \
  --assignee <service-principal-id> \
  --role "Azure Kubernetes Service Cluster User Role" \
  --scope /subscriptions/{subscription-id}/resourceGroups/fleet-management-rg/providers/Microsoft.ContainerService/managedClusters/fleet-aks-cluster
```

#### Issue 4: Pipeline Variables Not Resolved

**Error**: Variables show as `$(VARIABLE_NAME)` in logs

**Solution**:
- Verify variable group is linked to pipeline
- Check variable group name matches YAML
- Ensure secrets are not marked as "secret" if they need to be used in conditions

#### Issue 5: Trivy Scan Fails to Pull Image

**Error**: `Error: failed to scan image: failed to initialize scanner`

**Solution**:
- Ensure Docker login task runs before Trivy scan
- Verify ACR authentication in security stage

### Debug Tips

```yaml
# Add debug logging to any step
- script: |
    echo "Debug: Current directory"
    pwd
    echo "Debug: Environment variables"
    printenv | sort
    echo "Debug: Azure CLI version"
    az --version
  displayName: 'Debug Information'
```

### Getting Help

- Azure DevOps Documentation: https://docs.microsoft.com/en-us/azure/devops/
- Azure Pipelines YAML Schema: https://aka.ms/yaml
- Support: Contact DevOps team or Azure Support

---

## Next Steps

1. **Monitoring**: Set up Azure Monitor alerts for pipeline failures
2. **Optimization**: Enable caching for faster builds
3. **Security**: Implement signed commits and artifact scanning
4. **Compliance**: Add compliance checks for regulatory requirements
5. **Documentation**: Update team onboarding docs with new pipeline info

---

## Additional Resources

- [Azure Pipelines YAML Schema Reference](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema)
- [Predefined Variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables)
- [Service Connections](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints)
- [Variable Groups](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups)
- [Environments](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/environments)

---

**Last Updated**: 2025-11-20
**Version**: 1.0.0
**Maintained By**: DevOps Team
