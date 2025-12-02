# Fleet Management CI/CD Setup Guide

Complete guide for setting up continuous integration and deployment for the Fleet Management application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [GitHub Actions Setup](#github-actions-setup)
5. [Azure DevOps Setup](#azure-devops-setup)
6. [Environment Configuration](#environment-configuration)
7. [Deployment Workflows](#deployment-workflows)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Fleet Management CI/CD system supports:

- **Automated Testing**: Unit, integration, and E2E tests
- **Security Scanning**: Vulnerability detection and dependency audits
- **Multi-Environment Deployments**: Dev, Staging, Production
- **Blue-Green Deployments**: Zero-downtime production releases
- **Automatic Rollbacks**: Safety net for failed deployments
- **Approval Gates**: Manual review for critical environments

### Technology Stack

- **CI/CD Platforms**: GitHub Actions, Azure DevOps
- **Container Registry**: Azure Container Registry (ACR)
- **Orchestration**: Azure Kubernetes Service (AKS)
- **Infrastructure**: Azure Cloud

---

## Architecture

### Deployment Flow

```
Developer Push
      ↓
  CI Pipeline
      ↓
 Build & Test
      ↓
  Security Scan
      ↓
Docker Image Build
      ↓
   Push to ACR
      ↓
Deploy to Environment
      ↓
  Health Checks
      ↓
 Success/Rollback
```

### Environments

| Environment | Namespace | Trigger | Approval | URL |
|------------|-----------|---------|----------|-----|
| Development | `fleet-management-dev` | Automatic (develop branch) | No | https://fleet-dev.capitaltechalliance.com |
| Staging | `fleet-management-staging` | Manual | Yes | https://fleet-staging.capitaltechalliance.com |
| Production | `fleet-management` | Manual | Yes (2 gates) | https://fleet.capitaltechalliance.com |

---

## Prerequisites

### Required Azure Resources

1. **Azure Container Registry**
   - Name: `fleetappregistry`
   - SKU: Standard or Premium
   - Admin user enabled

2. **Azure Kubernetes Service (AKS)**
   - Cluster name: `fleet-aks-cluster`
   - Resource group: `fleet-management-rg`
   - Node count: Minimum 3 nodes
   - VM size: Standard_D2s_v3 or higher

3. **Azure Database for PostgreSQL**
   - Flexible Server recommended
   - Separate databases for each environment

4. **Azure Key Vault** (Optional but recommended)
   - For secure secret management
   - Service principal with access

### Required Tools

- Azure CLI (`az`) version 2.30+
- kubectl version 1.21+
- Docker version 20.10+
- Node.js version 20.x
- Git

---

## GitHub Actions Setup

### Step 1: Azure Service Principal

Create a service principal for GitHub Actions:

```bash
# Login to Azure
az login

# Set variables
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
RESOURCE_GROUP="fleet-management-rg"

# Create service principal
az ad sp create-for-rbac \
  --name "fleet-github-actions" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth
```

**Save the JSON output** - you'll need it for GitHub secrets.

### Step 2: Azure Container Registry Access

```bash
# Get ACR credentials
az acr credential show \
  --name fleetappregistry \
  --resource-group fleet-management-rg

# Note the username and password
```

### Step 3: Configure GitHub Secrets

Navigate to your GitHub repository:
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add the following secrets:

#### Azure Credentials
```
Name: AZURE_CREDENTIALS
Value: <JSON output from service principal creation>
```

#### Container Registry
```
Name: ACR_USERNAME
Value: <username from ACR credentials>

Name: ACR_PASSWORD
Value: <password from ACR credentials>
```

#### Development Environment
```
Name: DEV_DATABASE_URL
Value: postgresql://user:password@host:5432/fleet_dev

Name: DEV_JWT_SECRET
Value: <generate with: openssl rand -base64 32>
```

#### Staging Environment
```
Name: STAGING_DATABASE_URL
Value: postgresql://user:password@host:5432/fleet_staging

Name: STAGING_JWT_SECRET
Value: <generate with: openssl rand -base64 32>
```

#### Production Environment
```
Name: PROD_DATABASE_URL
Value: postgresql://user:password@host:5432/fleet_prod

Name: PROD_JWT_SECRET
Value: <generate with: openssl rand -base64 32>
```

#### Application Secrets
```
Name: VITE_AZURE_MAPS_SUBSCRIPTION_KEY
Value: <your Azure Maps key>

Name: OPENAI_API_KEY (optional)
Value: <your OpenAI key>

Name: ANTHROPIC_API_KEY (optional)
Value: <your Anthropic key>
```

### Step 4: Configure GitHub Environments

1. Go to `Settings` → `Environments`
2. Create the following environments:

#### Development Environment
- Name: `development`
- Protection rules: None (auto-deploy)

#### Staging Approval
- Name: `staging-approval`
- Protection rules:
  - Required reviewers: Add DevOps team members
  - Wait timer: 0 minutes

#### Staging Environment
- Name: `staging`
- Protection rules:
  - Required reviewers: Add team leads

#### Production Approval
- Name: `production-approval`
- Protection rules:
  - Required reviewers: Add senior engineers/leads
  - Prevent self-review: Yes

#### Production Deployment
- Name: `production-deployment`
- Protection rules:
  - Required reviewers: Add C-level or engineering managers
  - Wait timer: 5 minutes (cooling-off period)

#### Production Environment
- Name: `production`
- Protection rules:
  - Required reviewers: Add operations team

### Step 5: Verify Workflows

```bash
# List workflows
gh workflow list

# Test CI workflow
git checkout -b test/ci-validation
git commit --allow-empty -m "test: trigger CI"
git push origin test/ci-validation

# Watch workflow run
gh run watch
```

---

## Azure DevOps Setup

### Step 1: Create Azure DevOps Project

1. Navigate to https://dev.azure.com
2. Create new project: "Fleet Management"
3. Select Git for version control

### Step 2: Create Service Connections

Navigate to `Project Settings` → `Service connections`

#### Azure Resource Manager Connection
1. Click "New service connection"
2. Select "Azure Resource Manager"
3. Authentication method: "Service principal (automatic)"
4. Subscription: Select your Azure subscription
5. Resource group: `fleet-management-rg`
6. Service connection name: `AZURE_SERVICE_CONNECTION`
7. Click "Save"

#### Azure Container Registry Connection
1. Click "New service connection"
2. Select "Docker Registry"
3. Registry type: "Azure Container Registry"
4. Subscription: Select your Azure subscription
5. Azure container registry: `fleetappregistry`
6. Service connection name: `ACR_SERVICE_CONNECTION`
7. Click "Save"

### Step 3: Create Variable Groups

Navigate to `Pipelines` → `Library` → `+ Variable group`

#### Development Variable Group
- Name: `fleet-dev-vars`
- Variables:
  ```
  DEV_DATABASE_URL: (value, secret)
  DEV_JWT_SECRET: (value, secret)
  AZURE_MAPS_KEY: (value, secret)
  ACR_NAME: fleetappregistry
  AKS_CLUSTER: fleet-aks-cluster
  AKS_RESOURCE_GROUP: fleet-management-rg
  ```

#### Staging Variable Group
- Name: `fleet-staging-vars`
- Variables:
  ```
  STAGING_DATABASE_URL: (value, secret)
  STAGING_JWT_SECRET: (value, secret)
  AZURE_MAPS_KEY: (value, secret)
  ACR_NAME: fleetappregistry
  AKS_CLUSTER: fleet-aks-cluster
  AKS_RESOURCE_GROUP: fleet-management-rg
  ```

#### Production Variable Group
- Name: `fleet-prod-vars`
- Variables:
  ```
  PROD_DATABASE_URL: (value, secret)
  PROD_JWT_SECRET: (value, secret)
  AZURE_MAPS_KEY: (value, secret)
  ACR_NAME: fleetappregistry
  AKS_CLUSTER: fleet-aks-cluster
  AKS_RESOURCE_GROUP: fleet-management-rg
  ```

### Step 4: Create Pipelines

#### CI Pipeline
1. Go to `Pipelines` → `New pipeline`
2. Select `Azure Repos Git` (or your Git provider)
3. Select your repository
4. Select "Existing Azure Pipelines YAML file"
5. Path: `/azure-pipelines-ci.yml`
6. Click "Run"

#### Dev Pipeline
1. Create new pipeline
2. Path: `/azure-pipelines-dev.yml`
3. Click "Run"

#### Staging Pipeline
1. Create new pipeline
2. Path: `/azure-pipelines-staging.yml`
3. Set to manual trigger only

#### Production Pipeline
1. Create new pipeline
2. Path: `/azure-pipelines-prod.yml`
3. Set to manual trigger only

### Step 5: Configure Environments

Navigate to `Pipelines` → `Environments`

#### Create Environments
1. `fleet-dev`: No approvals
2. `fleet-staging`: Add approvals and checks
3. `fleet-production`: Add approvals, checks, and wait time

For each environment requiring approvals:
1. Click on environment
2. Click the "⋮" menu → "Approvals and checks"
3. Add "Approvals" check
4. Add approvers
5. Configure timeout and policies

---

## Environment Configuration

### Kubernetes Namespaces

Create namespaces if they don't exist:

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster

# Create namespaces
kubectl create namespace fleet-management-dev
kubectl create namespace fleet-management-staging
kubectl create namespace fleet-management
```

### Kubernetes Secrets

Create base secrets in each namespace:

```bash
# Development
kubectl create secret generic fleet-secrets \
  --from-literal=database-url="${DEV_DATABASE_URL}" \
  --from-literal=jwt-secret="${DEV_JWT_SECRET}" \
  --from-literal=azure-maps-key="${AZURE_MAPS_KEY}" \
  --namespace fleet-management-dev

# Staging
kubectl create secret generic fleet-secrets \
  --from-literal=database-url="${STAGING_DATABASE_URL}" \
  --from-literal=jwt-secret="${STAGING_JWT_SECRET}" \
  --from-literal=azure-maps-key="${AZURE_MAPS_KEY}" \
  --namespace fleet-management-staging

# Production
kubectl create secret generic fleet-secrets \
  --from-literal=database-url="${PROD_DATABASE_URL}" \
  --from-literal=jwt-secret="${PROD_JWT_SECRET}" \
  --from-literal=azure-maps-key="${AZURE_MAPS_KEY}" \
  --namespace fleet-management
```

### Image Pull Secrets

If using private ACR, create image pull secrets:

```bash
# Create secret in each namespace
for NS in fleet-management-dev fleet-management-staging fleet-management; do
  kubectl create secret docker-registry acr-secret \
    --docker-server=fleetappregistry.azurecr.io \
    --docker-username=$ACR_USERNAME \
    --docker-password=$ACR_PASSWORD \
    --namespace $NS
done
```

---

## Deployment Workflows

### Development Deployment

**Automatic** on every push to `develop` branch:

```bash
git checkout develop
git pull origin develop

# Make changes
git add .
git commit -m "feat: new feature"
git push origin develop

# Deployment triggers automatically
# View in GitHub Actions or Azure DevOps
```

### Staging Deployment

**Manual** trigger with version:

#### GitHub Actions
```bash
# Via GitHub UI:
# 1. Go to Actions tab
# 2. Select "Deploy to Staging"
# 3. Click "Run workflow"
# 4. Enter version (e.g., v1.2.3)
# 5. Approve when prompted

# Via GitHub CLI:
gh workflow run deploy-staging.yml -f version=v1.2.3
```

#### Azure DevOps
```bash
# Via Azure DevOps UI:
# 1. Go to Pipelines
# 2. Select staging pipeline
# 3. Click "Run pipeline"
# 4. Enter version parameter
# 5. Approve when prompted
```

### Production Deployment

**Manual** trigger with strict approval process:

#### Pre-Deployment Checklist
- [ ] Version tested in staging
- [ ] All tests passing
- [ ] Security scans clean
- [ ] Database migrations reviewed
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)

#### GitHub Actions
```bash
# Via GitHub UI:
# 1. Go to Actions tab
# 2. Select "Deploy to Production"
# 3. Click "Run workflow"
# 4. Enter version (e.g., v1.2.3)
# 5. Choose rollback option (recommended: true)
# 6. Approve at first gate
# 7. Review pre-deployment checks
# 8. Approve at second gate
# 9. Monitor deployment

# Via GitHub CLI:
gh workflow run deploy-production.yml \
  -f version=v1.2.3 \
  -f rollback=true
```

---

## Troubleshooting

### Common Issues

#### 1. Image Pull Errors

**Symptoms:**
```
Failed to pull image: unauthorized
```

**Solution:**
```bash
# Verify ACR credentials
az acr credential show --name fleetappregistry

# Check service connection in GitHub/Azure DevOps
# Update ACR_USERNAME and ACR_PASSWORD secrets

# Verify image exists
az acr repository list --name fleetappregistry
az acr repository show-tags --name fleetappregistry --repository fleet-api
```

#### 2. Deployment Timeout

**Symptoms:**
```
Waiting for rollout to finish: 0 of 3 updated replicas are available...
```

**Solution:**
```bash
# Check pod status
kubectl get pods -n fleet-management

# Check pod logs
kubectl logs -f deployment/fleet-api -n fleet-management

# Describe pod for events
kubectl describe pod <pod-name> -n fleet-management

# Check resource limits
kubectl top nodes
kubectl top pods -n fleet-management
```

#### 3. Health Check Failures

**Symptoms:**
```
Health check failed: connection refused
```

**Solution:**
```bash
# Check if service is running
kubectl get svc -n fleet-management

# Port forward to test locally
kubectl port-forward svc/fleet-api 3000:3000 -n fleet-management

# Test health endpoint
curl http://localhost:3000/api/health

# Check ingress configuration
kubectl get ingress -n fleet-management
kubectl describe ingress -n fleet-management
```

#### 4. Secret Not Found

**Symptoms:**
```
Error: secret "fleet-secrets" not found
```

**Solution:**
```bash
# List secrets in namespace
kubectl get secrets -n fleet-management

# Create missing secret
kubectl create secret generic fleet-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --namespace fleet-management

# Verify secret
kubectl get secret fleet-secrets -n fleet-management -o yaml
```

#### 5. Database Connection Errors

**Symptoms:**
```
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# Verify database URL in secret
kubectl get secret fleet-secrets -n fleet-management -o jsonpath='{.data.database-url}' | base64 -d

# Test connection from pod
kubectl exec -it deployment/fleet-api -n fleet-management -- sh
# Inside pod:
nc -zv <db-host> 5432

# Check network policies
kubectl get networkpolicies -n fleet-management

# Verify firewall rules in Azure
az postgres flexible-server firewall-rule list \
  --resource-group fleet-management-rg \
  --name fleet-postgres
```

### Rollback Procedures

#### Automatic Rollback (Production)

If enabled, automatic rollback triggers on health check failure.

#### Manual Rollback

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster

# Rollback API
kubectl rollout undo deployment/fleet-api -n fleet-management

# Rollback Frontend
kubectl rollout undo deployment/fleet-frontend -n fleet-management

# Verify rollback
kubectl rollout status deployment/fleet-api -n fleet-management
kubectl get pods -n fleet-management

# Check running version
kubectl get deployment fleet-api -n fleet-management \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
```

#### Rollback to Specific Version

```bash
# View rollout history
kubectl rollout history deployment/fleet-api -n fleet-management

# Rollback to specific revision
kubectl rollout undo deployment/fleet-api -n fleet-management --to-revision=3

# Verify
kubectl rollout status deployment/fleet-api -n fleet-management
```

### Monitoring Commands

```bash
# Watch pod status
kubectl get pods -n fleet-management -w

# View recent events
kubectl get events -n fleet-management --sort-by='.lastTimestamp'

# Stream logs
kubectl logs -f deployment/fleet-api -n fleet-management --tail=100

# Check resource usage
kubectl top pods -n fleet-management
kubectl top nodes

# View deployment status
kubectl get deployments -n fleet-management
kubectl describe deployment fleet-api -n fleet-management
```

---

## Security Best Practices

1. **Rotate Secrets Regularly**: Update secrets every 90 days
2. **Use Managed Identities**: Where possible, use Azure Managed Identities instead of credentials
3. **Limit Service Principal Permissions**: Follow principle of least privilege
4. **Enable Container Scanning**: Use Trivy or similar tools in pipelines
5. **Review Access**: Regularly audit who has access to environments
6. **Use Private Endpoints**: Configure private endpoints for Azure resources
7. **Enable Network Policies**: Restrict pod-to-pod communication in Kubernetes
8. **Audit Logs**: Enable and review Azure activity logs and AKS logs

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review failed pipeline runs
- Check security scan results
- Update dependencies with security patches

**Monthly:**
- Rotate non-production secrets
- Review and update approval lists
- Clean up old Docker images in ACR

**Quarterly:**
- Rotate production secrets
- Review and update pipeline configurations
- Audit access permissions
- Update documentation

### Cleanup Commands

```bash
# Remove old images from ACR (keep last 10 of each)
az acr repository show-manifests \
  --name fleetappregistry \
  --repository fleet-api \
  --orderby time_desc \
  --query "[10:].digest" -o tsv \
  | xargs -I% az acr repository delete \
      --name fleetappregistry \
      --image fleet-api@% \
      --yes

# Clean up completed pods
kubectl delete pods --field-selector status.phase=Succeeded -n fleet-management-dev

# Remove old replica sets
kubectl delete replicaset \
  $(kubectl get rs -n fleet-management -o jsonpath='{.items[?(@.spec.replicas==0)].metadata.name}') \
  -n fleet-management
```

---

## Support

For CI/CD issues:
- **GitHub Actions**: Check workflow logs in Actions tab
- **Azure DevOps**: Review pipeline runs in Pipelines section
- **Kubernetes**: Use `kubectl` commands to inspect resources
- **Escalation**: Contact DevOps team or create incident ticket

---

## Appendix

### Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Docker Documentation](https://docs.docker.com/)

### Version Information

- **Document Version**: 1.0.0
- **Last Updated**: 2025-11-12
- **CI/CD Version**: 1.0.0
