# Azure Pipelines Setup Guide

Complete setup instructions for the Fleet Management System CI/CD pipeline in Azure DevOps.

## Quick Start (TL;DR)

```bash
# 1. Create service connections (UI)
# 2. Create variable groups (UI)
# 3. Push code to Azure Repos or connect GitHub
# 4. Create pipeline pointing to azure-pipelines.yml
# 5. Run pipeline
```

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure Resource Setup](#azure-resource-setup)
3. [Azure DevOps Configuration](#azure-devops-configuration)
4. [Service Connections](#service-connections)
5. [Variable Groups](#variable-groups)
6. [Pipeline Creation](#pipeline-creation)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Tools

```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az --version

# kubectl
az aks install-cli

# Optional: Azure DevOps CLI
az extension add --name azure-devops
```

### Required Access

- Azure subscription (Owner or Contributor role)
- Azure DevOps organization
- GitHub repository access (if using GitHub as source)

---

## Azure Resource Setup

### 1. Create Resource Group

```bash
# Variables
RESOURCE_GROUP="fleet-management-rg"
LOCATION="eastus"
SUBSCRIPTION_ID="your-subscription-id"

# Set subscription
az account set --subscription $SUBSCRIPTION_ID

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### 2. Create Azure Container Registry (ACR)

```bash
ACR_NAME="fleetacr"

# Create ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Standard \
  --location $LOCATION

# Enable admin user (for service connection)
az acr update \
  --name $ACR_NAME \
  --admin-enabled true

# Get credentials
az acr credential show --name $ACR_NAME
```

### 3. Create Azure Kubernetes Service (AKS)

```bash
AKS_CLUSTER="fleet-aks-cluster"
NODE_COUNT=3

# Create AKS cluster
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER \
  --node-count $NODE_COUNT \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --generate-ssh-keys \
  --attach-acr $ACR_NAME \
  --enable-addons monitoring \
  --location $LOCATION

# Get credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER \
  --overwrite-existing

# Verify connection
kubectl get nodes
```

### 4. Create Azure Key Vault

```bash
KEYVAULT_NAME="fleet-keyvault"

# Create Key Vault
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-rbac-authorization false

# Add secrets
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "DATABASE-URL" \
  --value "postgresql://user:pass@host:5432/fleetdb"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "JWT-SECRET" \
  --value "$(openssl rand -base64 32)"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "AZURE-MAPS-KEY" \
  --value "your-azure-maps-subscription-key"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "OPENAI-API-KEY" \
  --value "sk-proj-..."

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "ANTHROPIC-API-KEY" \
  --value "sk-ant-api03-..."
```

### 5. Create Namespace in AKS

```bash
NAMESPACE="fleet-management"

# Create namespace
kubectl create namespace $NAMESPACE

# Label namespace
kubectl label namespace $NAMESPACE \
  name=$NAMESPACE \
  environment=production

# Verify
kubectl get namespace $NAMESPACE
```

### 6. Create ACR Pull Secret in AKS

```bash
# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"

# Create docker-registry secret
kubectl create secret docker-registry acr-secret \
  --docker-server=$ACR_LOGIN_SERVER \
  --docker-username=$ACR_USERNAME \
  --docker-password=$ACR_PASSWORD \
  --namespace=$NAMESPACE

# Verify
kubectl get secret acr-secret -n $NAMESPACE
```

---

## Azure DevOps Configuration

### 1. Create Azure DevOps Organization (if needed)

1. Go to https://dev.azure.com
2. Sign in with your Microsoft account
3. Click **New organization**
4. Name: `your-org-name`
5. Click **Create**

### 2. Create Project

1. In your organization, click **New project**
2. Name: `Fleet Management`
3. Visibility: **Private**
4. Version control: **Git**
5. Work item process: **Agile**
6. Click **Create**

### 3. Import Repository (if using existing GitHub repo)

**Option A: Azure Repos (Import from GitHub)**
```bash
# In Azure DevOps UI
# Repos → Files → Import repository
# Clone URL: https://github.com/your-org/Fleet.git
# Authentication: Personal Access Token
```

**Option B: Connect GitHub Repository**
```bash
# When creating pipeline, select GitHub as source
# Authorize Azure Pipelines app on GitHub
# Select repository
```

---

## Service Connections

### 1. Azure Container Registry Connection

**UI Method:**

1. Go to **Project Settings** → **Service connections**
2. Click **New service connection**
3. Select **Docker Registry** → **Next**
4. Choose **Azure Container Registry**
5. Fill in:
   ```
   Connection name: fleet-acr-connection
   Azure subscription: [Select subscription]
   Azure container registry: fleetacr
   Service connection name: fleet-acr-connection
   ```
6. Click **Save**

**CLI Method:**

```bash
# Set variables
ORG_URL="https://dev.azure.com/your-org"
PROJECT="Fleet Management"

# Create service connection (requires service principal)
az devops service-endpoint azurerm create \
  --azure-rm-service-principal-id <sp-id> \
  --azure-rm-subscription-id $SUBSCRIPTION_ID \
  --azure-rm-subscription-name "Your Subscription" \
  --azure-rm-tenant-id <tenant-id> \
  --name fleet-acr-connection \
  --organization $ORG_URL \
  --project "$PROJECT"
```

### 2. Azure Resource Manager Connection

**UI Method:**

1. Click **New service connection**
2. Select **Azure Resource Manager** → **Next**
3. Choose **Service principal (automatic)**
4. Fill in:
   ```
   Scope level: Subscription
   Subscription: [Select subscription]
   Resource group: fleet-management-rg (or leave empty)
   Service connection name: fleet-azure-subscription
   Grant access permission to all pipelines: ✅
   ```
5. Click **Save**

### 3. Kubernetes Service Connection

**UI Method:**

1. Click **New service connection**
2. Select **Kubernetes** → **Next**
3. Choose **Azure Subscription**
4. Fill in:
   ```
   Azure subscription: [Select from dropdown]
   Cluster: fleet-aks-cluster
   Namespace: fleet-management
   Service connection name: fleet-aks-connection
   Grant access permission to all pipelines: ✅
   ```
5. Click **Save**

**Verify Service Connections:**

```bash
# List service connections
az devops service-endpoint list \
  --organization $ORG_URL \
  --project "$PROJECT" \
  --output table
```

---

## Variable Groups

### 1. Create `fleet-production-vars`

**UI Method:**

1. Go to **Pipelines** → **Library**
2. Click **+ Variable group**
3. Name: `fleet-production-vars`
4. Description: `Production variables for Fleet Management pipeline`
5. Click **+ Add** and add each variable:

| Variable | Value | Secret? |
|----------|-------|---------|
| `nodeVersion` | `20.x` | No |
| `registryName` | `fleetacr` | No |
| `registryLoginServer` | `fleetacr.azurecr.io` | No |
| `aksCluster` | `fleet-aks-cluster` | No |
| `aksResourceGroup` | `fleet-management-rg` | No |
| `namespace` | `fleet-management` | No |
| `productionUrl` | `https://fleet.capitaltechalliance.com` | No |

6. Click **Save**

**CLI Method:**

```bash
# Create variable group
az pipelines variable-group create \
  --name fleet-production-vars \
  --variables \
    nodeVersion=20.x \
    registryName=fleetacr \
    registryLoginServer=fleetacr.azurecr.io \
    aksCluster=fleet-aks-cluster \
    aksResourceGroup=fleet-management-rg \
    namespace=fleet-management \
    productionUrl=https://fleet.capitaltechalliance.com \
  --organization $ORG_URL \
  --project "$PROJECT"
```

### 2. Create `fleet-secrets` (Linked to Key Vault)

**UI Method:**

1. Click **+ Variable group**
2. Name: `fleet-secrets`
3. Description: `Secrets from Azure Key Vault`
4. Toggle **Link secrets from an Azure key vault as variables** ON
5. Select:
   ```
   Azure subscription: fleet-azure-subscription
   Key vault name: fleet-keyvault
   ```
6. Click **Authorize** (grants pipeline access to Key Vault)
7. Click **+ Add** and select secrets:
   - `DATABASE-URL`
   - `JWT-SECRET`
   - `AZURE-MAPS-KEY`
   - `OPENAI-API-KEY`
   - `ANTHROPIC-API-KEY`
8. Click **Save**

**Grant Key Vault Access to Service Principal:**

```bash
# Get service principal ID from service connection
SP_ID=$(az ad sp list --display-name "fleet-azure-subscription" --query [0].appId -o tsv)

# Grant Key Vault access
az keyvault set-policy \
  --name fleet-keyvault \
  --spn $SP_ID \
  --secret-permissions get list
```

---

## Pipeline Creation

### 1. Create Pipeline Environment

**UI Method:**

1. Go to **Pipelines** → **Environments**
2. Click **New environment**
3. Fill in:
   ```
   Name: fleet-production
   Description: Production environment for Fleet Management
   Resource: None
   ```
4. Click **Create**

**Configure Approvals:**

1. Click on `fleet-production` environment
2. Click **⋯** (three dots) → **Approvals and checks**
3. Click **Approvals**
4. Add approvers:
   ```
   Approvers: [Add users/groups]
   Timeout: 30 days
   Approval policy: First response
   Instructions for approvers: Please review deployment before approving
   ```
5. Click **Create**

### 2. Create the Pipeline

**UI Method:**

1. Go to **Pipelines** → **Pipelines**
2. Click **New pipeline**
3. Select repository source:
   - **Azure Repos Git** (if imported)
   - **GitHub** (if connected)
4. Select repository: `Fleet`
5. Select **Existing Azure Pipelines YAML file**
6. Branch: `main`
7. Path: `/azure-pipelines.yml`
8. Click **Continue**
9. Review the YAML
10. Click **Save** (don't run yet)

**CLI Method:**

```bash
# Create pipeline
az pipelines create \
  --name "Fleet Management CI/CD" \
  --description "Multi-stage pipeline for Fleet Management System" \
  --repository Fleet \
  --branch main \
  --yml-path azure-pipelines.yml \
  --organization $ORG_URL \
  --project "$PROJECT"
```

### 3. Configure Pipeline Settings

1. Go to your pipeline
2. Click **⋯** (three dots) → **Settings**
3. Configure:
   ```
   Build number format: $(Date:yyyyMMdd)$(Rev:.r)
   YAML file path: azure-pipelines.yml
   Default branch for manual and scheduled builds: main
   ```
4. Under **Advanced**:
   ```
   Allow scripts to access the OAuth token: ✅
   ```
5. Click **Save**

---

## Testing

### 1. Manual Pipeline Run

```bash
# Trigger pipeline via CLI
az pipelines run \
  --name "Fleet Management CI/CD" \
  --branch main \
  --organization $ORG_URL \
  --project "$PROJECT"
```

**Or via UI:**

1. Go to **Pipelines** → **Pipelines**
2. Select your pipeline
3. Click **Run pipeline**
4. Select branch: `main`
5. Click **Run**

### 2. Monitor Pipeline Execution

**UI Method:**

1. Click on the running pipeline
2. View stages:
   - Lint & Type Check
   - Unit Tests
   - Build Verification
   - Build & Push Docker Images
   - Security Scanning
   - Deploy to Kubernetes
   - Smoke Tests

**CLI Method:**

```bash
# List pipeline runs
az pipelines runs list \
  --pipeline-ids <pipeline-id> \
  --organization $ORG_URL \
  --project "$PROJECT" \
  --output table

# Get run details
az pipelines runs show \
  --id <run-id> \
  --organization $ORG_URL \
  --project "$PROJECT"
```

### 3. Verify Deployment

```bash
# Connect to AKS
az aks get-credentials \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster

# Check pods
kubectl get pods -n fleet-management
kubectl get services -n fleet-management
kubectl get ingress -n fleet-management

# View logs
kubectl logs -n fleet-management deployment/fleet-api --tail=50
kubectl logs -n fleet-management deployment/fleet-frontend --tail=50

# Test endpoints
curl https://fleet.capitaltechalliance.com/api/health
curl https://fleet.capitaltechalliance.com/
```

### 4. Review Artifacts

1. Go to the completed pipeline run
2. Click on each stage to view logs
3. Check published artifacts:
   - **frontend-dist**: Built frontend files
   - **api-dist**: Built API files
   - **sbom-reports**: SBOM files (SPDX, CycloneDX)
   - **trivy-results**: Security scan results
   - **coverage-report**: Code coverage

---

## Production Deployment

### 1. Configure Branch Protection

**Azure Repos:**

1. Go to **Repos** → **Branches**
2. Click **⋯** next to `main` → **Branch policies**
3. Configure:
   ```
   Require a minimum number of reviewers: 2
   Check for linked work items: Required
   Build Validation:
     - Build pipeline: Fleet Management CI/CD
     - Build expiration: Immediately
     - Policy requirement: Required
   ```
4. Click **Save changes**

### 2. Configure Notifications

**Email Notifications:**

1. Go to **Project Settings** → **Notifications**
2. Click **New subscription**
3. Configure:
   ```
   Type: A build completes
   Filters:
     - Build pipeline: Fleet Management CI/CD
     - Build status: Failed
   Deliver to: [Team email]
   ```
4. Click **Finish**

**Slack/Teams Integration:**

```bash
# Install Azure Pipelines app in Slack/Teams
# Configure webhook in pipeline for notifications
```

### 3. Set Up Monitoring

**Application Insights:**

```bash
# Create Application Insights
az monitor app-insights component create \
  --app fleet-app-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app fleet-app-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Add to Key Vault
az keyvault secret set \
  --vault-name fleet-keyvault \
  --name "APP-INSIGHTS-KEY" \
  --value "$INSTRUMENTATION_KEY"
```

**Azure Monitor Alerts:**

```bash
# Create alert for pipeline failures
az monitor metrics alert create \
  --name "Pipeline Failure Alert" \
  --resource-group $RESOURCE_GROUP \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --condition "count > 0" \
  --description "Alert when pipeline fails" \
  --evaluation-frequency 5m \
  --window-size 15m \
  --action email notify@example.com
```

---

## Troubleshooting

### Pipeline Fails at Lint Stage

```bash
# Run locally first
npm install
npm run lint
npx tsc --noEmit
```

### Docker Build Fails

```bash
# Test Docker build locally
cd api
docker build -f Dockerfile.production -t test-api .

# Check ACR connectivity
az acr login --name fleetacr
```

### AKS Deployment Fails

```bash
# Check AKS cluster status
az aks show \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster \
  --query powerState

# Check node health
kubectl get nodes
kubectl describe node <node-name>

# Check pod status
kubectl get pods -n fleet-management
kubectl describe pod <pod-name> -n fleet-management
```

### Security Scan Fails

```bash
# Run Trivy locally
docker pull aquasec/trivy:latest
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image fleetacr.azurecr.io/fleet-api:latest
```

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review pipeline run history
- Check for security vulnerabilities
- Update dependencies

**Monthly:**
- Review and rotate secrets
- Update pipeline agent pools if needed
- Review resource utilization
- Check for Azure service updates

**Quarterly:**
- Review and update service connections
- Audit access permissions
- Performance optimization
- Disaster recovery testing

---

## Additional Resources

- [Azure Pipelines Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Azure Container Registry Best Practices](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-best-practices)
- [Azure Key Vault Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)

---

**Last Updated**: 2025-11-20
**Version**: 1.0.0
**Maintained By**: DevOps Team
