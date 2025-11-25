# Fleet Management - Service Connection Authorization Guide

**Status**: ✅ nginx Configuration Fixed | ⚠️ Service Connections Need Authorization

**Date**: November 25, 2025

---

## 🎯 Current Status

### ✅ What's Working
- **Code Build**: ✅ Successfully builds locally (29.83s)
- **nginx Configuration**: ✅ Fixed - proper http block structure
- **Azure Resources**: ✅ All exist (ACR, AKS cluster)
- **Azure DevOps Pipelines**: ✅ 3 pipelines configured

### ⚠️ What Needs Action
- **Service Connections**: Need to be authorized for pipeline use

---

## 🚨 Pipeline Error Message

```
The pipeline is not valid.

Job BuildImages: Step Docker2 input containerRegistry references service
connection 'fleetappregistry' which could not be found. The service connection
does not exist, has been disabled or has not been authorized for use.

Job BuildImages: Step AzureCLI input connectedServiceNameARM references
service connection 'Azure-Fleet-Management' which could not be found. The
service connection does not exist, has been disabled or has not been
authorized for use.
```

---

## 📋 Required Service Connections

You need to create or authorize these two service connections:

### 1. Azure Resource Manager Connection
- **Name**: `Azure-Fleet-Management`
- **Type**: Azure Resource Manager (Service Principal)
- **Purpose**: Deploy to Azure resources (AKS, ACR)

### 2. Azure Container Registry Connection
- **Name**: `fleetappregistry`
- **Type**: Docker Registry / Azure Container Registry
- **Purpose**: Push Docker images to ACR

---

## 🔧 Step-by-Step Setup Instructions

### Option A: Create Service Connections (If They Don't Exist)

#### Step 1: Go to Service Connections Page
```
https://dev.azure.com/CapitalTechAlliance/FleetManagement/_settings/adminservices
```

#### Step 2: Create Azure Resource Manager Connection

1. Click **"New service connection"**
2. Select **"Azure Resource Manager"**
3. Choose **"Service Principal (automatic)"**
4. Configure:
   - **Subscription**: Select "Azure subscription 1" (or your subscription)
   - **Resource Group**: Leave empty (grant access to all)
   - **Service connection name**: `Azure-Fleet-Management`
   - **Grant access permission to all pipelines**: ✅ Check this box
5. Click **"Save"**

#### Step 3: Create Azure Container Registry Connection

1. Click **"New service connection"**
2. Select **"Docker Registry"**
3. Choose **"Azure Container Registry"**
4. Configure:
   - **Authentication Type**: Service Principal
   - **Subscription**: Select "Azure subscription 1"
   - **Azure Container Registry**: Select `fleetappregistry`
   - **Service connection name**: `fleetappregistry`
   - **Grant access permission to all pipelines**: ✅ Check this box
5. Click **"Save"**

---

### Option B: Authorize Existing Service Connections

If the service connections already exist but aren't authorized:

#### Step 1: Trigger Pipeline to See Authorization Prompt

The pipeline will show a permission request the first time it tries to use a service connection.

#### Step 2: Authorize from Pipeline Run

1. Go to the failed pipeline run: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build/results?buildId=275
2. Look for **"This pipeline needs permission to access a resource"**
3. Click **"View"** or **"Permit"**
4. Select both service connections:
   - `Azure-Fleet-Management`
   - `fleetappregistry`
5. Click **"Permit"** to authorize

#### Step 3: Re-run the Pipeline

Once authorized, re-run the pipeline:
```bash
cd /Users/andrewmorton/Documents/GitHub/FLEET
az pipelines run \
  --organization https://dev.azure.com/CapitalTechAlliance \
  --project FleetManagement \
  --name "Fleet-Management-Pipeline" \
  --branch stage-a/requirements-inception
```

---

## 🚀 Alternative: Use Simpler CI Pipeline

For testing purposes, you can use the simpler CI pipeline (Pipeline ID: 10) which may not require Docker/ACR permissions:

```bash
cd /Users/andrewmorton/Documents/GitHub/FLEET
az pipelines run \
  --organization https://dev.azure.com/CapitalTechAlliance \
  --project FleetManagement \
  --id 10 \
  --branch stage-a/requirements-inception
```

---

## ✅ Verification Steps

After creating/authorizing service connections:

### 1. Verify Service Connections Exist
```bash
az devops service-endpoint list \
  --organization https://dev.azure.com/CapitalTechAlliance \
  --project FleetManagement \
  --output table
```

### 2. Trigger New Pipeline Run
```bash
cd /Users/andrewmorton/Documents/GitHub/FLEET

# Trigger via CLI
az pipelines run \
  --organization https://dev.azure.com/CapitalTechAlliance \
  --project FleetManagement \
  --name "Fleet-Management-Pipeline" \
  --branch stage-a/requirements-inception

# OR push a change
git commit --allow-empty -m "ci: test service connections"
git push origin stage-a/requirements-inception
```

### 3. Monitor Pipeline
```bash
# Watch pipeline status
az pipelines runs list \
  --organization https://dev.azure.com/CapitalTechAlliance \
  --project FleetManagement \
  --pipeline-ids 4 \
  --top 1 \
  --output table
```

Or visit: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4

---

## 📊 Current Pipeline Stages

Once service connections are authorized, the pipeline will run:

### Stage 1: Build & Test (Current Branch)
- ✅ Build API
- ✅ Build Frontend (verified locally - 29.83s)
- ✅ Run tests
- ✅ Publish artifacts

### Stage 2: Docker (main branch only)
- 🔒 Build Docker images
- 🔒 Push to ACR
- 🔒 Tag with build ID

### Stage 3: Deploy (main branch only)
- 🔒 Deploy to AKS
- 🔒 Run migrations
- 🔒 Setup webhooks

### Stage 4: E2E Tests (main branch only)
- 🔒 Run Playwright tests
- 🔒 Verify production

**Note**: Your current branch `stage-a/requirements-inception` will only run Stage 1.

---

## 🎯 Next Steps

### Immediate (Required)
- [ ] Create or authorize service connections (see above)
- [ ] Verify service connections appear in Azure DevOps
- [ ] Re-run pipeline to test

### For Production Deployment
Once Stage 1 passes on `stage-a/requirements-inception`:

```bash
# Merge to main
git checkout main
git pull origin main
git merge stage-a/requirements-inception
git push origin main
```

This will trigger the full deployment pipeline:
- Build & Test
- Build Docker images with fixed nginx config
- Deploy to AKS production cluster
- Run E2E tests

---

## 🔍 Troubleshooting

### Service Connection Not Found
**Problem**: "service connection ... could not be found"
**Solution**: Create the service connection using the steps above

### Service Connection Not Authorized
**Problem**: "has not been authorized for use"
**Solution**:
1. Go to failed pipeline run
2. Click "Permit" on the authorization request
3. Re-run the pipeline

### Can't Create Service Connection
**Problem**: Don't have permissions to create service connections
**Solution**: Ask Azure DevOps admin to:
1. Grant you "Endpoint Administrators" role
2. Or create the service connections for you

---

## 📚 Resources

- **Pipeline URL**: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4
- **Service Connections**: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_settings/adminservices
- **Azure Portal**: https://portal.azure.com
- **ACR**: fleetappregistry.azurecr.io
- **AKS**: fleet-aks-cluster (eastus2)

---

## ✅ Success Criteria

You'll know setup is complete when:
- ✅ Service connections visible in Azure DevOps
- ✅ Pipeline runs without "service connection not found" error
- ✅ Build stage completes successfully
- ✅ Artifacts are published

---

**Last Updated**: November 25, 2025 02:20 EST
**Status**: Service connections need authorization
**Build Test**: ✅ Passed (29.83s local build)
**nginx Fix**: ✅ Applied (commit 254ae2ba)
