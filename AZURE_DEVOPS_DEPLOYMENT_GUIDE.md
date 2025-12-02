# Azure DevOps Deployment Guide - Fleet Management System

**Date**: November 20, 2025
**Pipeline Created**: ✅ YES (ID: 4, Build: 1)
**Status**: ⚠️ Service Connections Required

---

## 🎉 SUCCESS: Pipeline Created!

**Pipeline Details**:
- **Name**: Fleet-Management-Pipeline
- **Pipeline ID**: 4
- **Build ID**: 1
- **Branch**: stage-a/requirements-inception
- **Commit**: 89102bf
- **Status**: Awaiting service connection setup

**Pipeline URL**:
```
https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4
```

---

## ⚠️ Required Setup: Service Connections

The pipeline requires two Azure service connections to be created in Azure DevOps:

### 1. Azure Resource Manager Connection

**Name**: `Azure-Fleet-Management`
**Type**: Azure Resource Manager (Service Principal)
**Purpose**: Deploy to Azure resources (AKS, ACR, databases)

**How to Create**:
1. Go to Azure DevOps: `https://dev.azure.com/CapitalTechAlliance/FleetManagement/_settings/adminservices`
2. Click "New service connection"
3. Select "Azure Resource Manager"
4. Choose "Service Principal (automatic)"
5. Select your Azure subscription: "Azure subscription 1"
6. Name it: `Azure-Fleet-Management`
7. Click "Save"

### 2. Azure Container Registry Connection

**Name**: `fleetappregistry`
**Type**: Docker Registry
**Purpose**: Push Docker images to Azure Container Registry

**How to Create**:
1. In the same Service connections page
2. Click "New service connection"
3. Select "Docker Registry"
4. Choose "Azure Container Registry"
5. Select subscription: "Azure subscription 1"
6. Select registry: `fleetappregistry` (or create new)
7. Name it: `fleetappregistry`
8. Click "Save"

---

## 🚀 After Service Connections Are Created

Once both service connections are set up, the pipeline can be run:

### Option A: Automatic Trigger (Recommended)
```bash
# Push any change to trigger the pipeline
git commit --allow-empty -m "ci: trigger Azure DevOps pipeline"
git push origin stage-a/requirements-inception
```

### Option B: Manual Trigger via Web UI
1. Go to: `https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4`
2. Click "Run pipeline"
3. Select branch: `stage-a/requirements-inception`
4. Click "Run"

### Option C: Manual Trigger via CLI
```bash
az pipelines run \
  --name "Fleet-Management-Pipeline" \
  --branch stage-a/requirements-inception \
  --organization https://dev.azure.com/CapitalTechAlliance \
  --project FleetManagement
```

---

## 📋 Pipeline Stages

Once the service connections are configured, the pipeline will execute these stages:

### Stage 1: Build & Test (✅ Always Runs)
- **BuildAPI**: Build backend, run tests, generate coverage
- **BuildFrontend**: Build frontend React application

### Stage 2: Docker (🔒 main branch only)
- Build Docker images for API
- Push images to Azure Container Registry
- Tag with build ID and 'latest'

### Stage 3: Deploy (🔒 main branch only)
- Deploy API to Azure Kubernetes Service (AKS)
- Run database migrations
- Setup Microsoft Graph webhooks
- Verify deployment with CORS check

### Stage 4: Test (🔒 after deploy)
- Run Playwright E2E tests against production
- Verify full application functionality

**Note**: Your branch `stage-a/requirements-inception` will only run Stage 1 (Build & Test).
Docker build and deployment only run on the `main` branch.

---

## 🔧 Azure Resources Required

The pipeline expects these Azure resources to exist:

### 1. Azure Container Registry
- **Name**: `fleetappregistry`
- **Login Server**: `fleetappregistry.azurecr.io`
- **Create if needed**:
```bash
az acr create \
  --resource-group fleet-production-rg \
  --name fleetappregistry \
  --sku Standard
```

### 2. Azure Kubernetes Service
- **Resource Group**: `fleet-production-rg`
- **Cluster Name**: `fleet-aks-cluster`
- **Namespace**: `fleet-management`
- **Create if needed**:
```bash
# Create resource group
az group create --name fleet-production-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group fleet-production-rg \
  --name fleet-aks-cluster \
  --node-count 2 \
  --enable-managed-identity \
  --generate-ssh-keys

# Create namespace
az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster
kubectl create namespace fleet-management
```

### 3. Azure Static Web Apps (Frontend)
- **URL**: `https://purple-river-0f465960f.3.azurestaticapps.net`
- Already configured ✅

---

## 📊 Pipeline Variables

These variables are configured in the pipeline YAML:

| Variable | Value | Purpose |
|----------|-------|---------|
| azureSubscription | Azure-Fleet-Management | Service connection name |
| acrName | fleetappregistry | Container registry name |
| acrLoginServer | fleetappregistry.azurecr.io | Registry URL |
| aksResourceGroup | fleet-production-rg | Resource group name |
| aksClusterName | fleet-aks-cluster | AKS cluster name |
| aksNamespace | fleet-management | Kubernetes namespace |
| nodeVersion | 20.x | Node.js version |

---

## 🔐 Required Secrets (Variable Groups)

Create these variable groups in Azure DevOps:

### Fleet-Production-Secrets
Go to: `https://dev.azure.com/CapitalTechAlliance/FleetManagement/_library`

Add these secrets:
- `MS_GRAPH_CLIENT_ID` - Microsoft Graph API client ID
- `MS_GRAPH_CLIENT_SECRET` - Microsoft Graph API secret
- `MS_GRAPH_TENANT_ID` - Azure AD tenant ID
- `MS_GRAPH_WEBHOOK_URL` - Webhook endpoint URL

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Create service connection: `Azure-Fleet-Management`
- [ ] Create service connection: `fleetappregistry`
- [ ] Create Azure Container Registry (if not exists)
- [ ] Create Azure Kubernetes Service (if not exists)
- [ ] Create variable group: `Fleet-Production-Secrets`
- [ ] Add Microsoft Graph secrets to variable group
- [ ] Test pipeline on `stage-a/requirements-inception` branch
- [ ] Merge to `main` branch for production deployment

---

## 🎯 Quick Start: Test Current Branch

To test the pipeline on your current branch (Build & Test stages only):

```bash
# 1. Create service connections in Azure DevOps web UI

# 2. Trigger pipeline with empty commit
git commit --allow-empty -m "ci: test Azure DevOps pipeline"
git push origin stage-a/requirements-inception

# 3. Monitor pipeline
open https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4
```

---

## 📈 Monitoring Deployment

### Pipeline Dashboard
```
https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4
```

### View Build Logs
```
https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build/results?buildId=1
```

### Check Pipeline Status via CLI
```bash
az pipelines build list \
  --definition-ids 4 \
  --organization https://dev.azure.com/CapitalTechAlliance \
  --project FleetManagement
```

---

## 🐛 Troubleshooting

### Error: Service connection not found
**Solution**: Create the service connections in Azure DevOps (see "Required Setup" section above)

### Error: Container registry not found
**Solution**: Create Azure Container Registry or update `acrName` variable

### Error: AKS cluster not found
**Solution**: Create AKS cluster or update `aksClusterName` variable

### Error: Unauthorized to access Azure resources
**Solution**: Grant the service principal proper permissions on Azure resources

---

## 🎉 Production Deployment Process

Once everything is tested on `stage-a/requirements-inception`:

1. **Merge to main**:
```bash
git checkout main
git pull origin main
git merge stage-a/requirements-inception
git push origin main
```

2. **Pipeline automatically**:
   - Builds & tests (Stage 1)
   - Builds Docker images (Stage 2)
   - Deploys to AKS (Stage 3)
   - Runs E2E tests (Stage 4)

3. **Monitor deployment**:
   - Watch pipeline UI for progress
   - Check build logs for any errors
   - Verify application is running

4. **Verify production**:
   - Test application: `https://fleet.capitaltechalliance.com`
   - Check API health: `https://fleet.capitaltechalliance.com/api/health`
   - Review logs in AKS: `kubectl logs -n fleet-management deployment/fleet-api`

---

## 📚 Additional Documentation

- **Pipeline Configuration**: `azure-pipelines.yml` (main pipeline)
- **Staging Pipeline**: `azure-pipelines-staging.yml`
- **Production Pipeline**: `azure-pipelines-prod.yml`
- **Deployment Strategy**: `DEPLOYMENT_STRATEGY.md`
- **Production Readiness**: `FINAL_100_PERCENT_CONFIDENCE_SCORE.md`

---

## ✅ Summary

**Status**: ✅ **Pipeline Created Successfully**

**Next Steps**:
1. Create Azure service connections (15 minutes)
2. Create Azure resources if needed (30 minutes)
3. Configure variable groups with secrets (10 minutes)
4. Test pipeline on current branch (5 minutes)
5. Merge to main for production deployment

**Total Time to Production**: ~1 hour (if resources exist)

---

**Pipeline Created**: November 20, 2025
**Created By**: Andrew Morton (andrew.m@capitaltechalliance.com)
**Pipeline URL**: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4
**Status**: Ready for service connection setup
