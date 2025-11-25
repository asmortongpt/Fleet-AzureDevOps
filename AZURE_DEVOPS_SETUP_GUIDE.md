# Fleet Production Deployment - Azure DevOps Setup Guide

This guide will help you set up the Azure DevOps pipeline to deploy the Fleet application to production using the existing AKS cluster.

## Prerequisites

✅ **Already in place:**
- AKS Cluster: `fleet-aks-cluster` in `fleet-production-rg`
- Azure Container Registry: `fleetappregistry.azurecr.io`
- Kubernetes Namespaces: `fleet-management` (production)
- GitHub Repository: https://github.com/asmortongpt/Fleet

## Step 1: Create Azure DevOps Project

1. Go to [Azure DevOps](https://dev.azure.com/capitaltechalliance)
2. Click **"+ New Project"**
3. Enter the following details:
   - **Project name**: `Fleet-Production`
   - **Visibility**: Private
   - **Version control**: Git
   - **Work item process**: Agile
4. Click **"Create"**

## Step 2: Import GitHub Repository

1. In your new project, go to **Repos** → **Files**
2. Click **"Import repository"**
3. Enter the clone URL: `https://github.com/asmortongpt/Fleet`
4. Click **"Import"**

Wait for the import to complete (~2-3 minutes).

## Step 3: Create Service Connections

### 3.1 Azure Resource Manager Service Connection

1. Go to **Project Settings** (bottom left)
2. Click **Service connections** under Pipelines
3. Click **"New service connection"**
4. Select **"Azure Resource Manager"** → **Next**
5. Select **"Service principal (automatic)"**
6. Configure:
   - **Scope level**: Subscription
   - **Subscription**: Azure subscription 1
   - **Resource group**: `fleet-production-rg`
   - **Service connection name**: `Azure-Production-Connection`
   - **Grant access permission to all pipelines**: ✅ Checked
7. Click **"Save"**

### 3.2 Docker Registry Service Connection

1. Click **"New service connection"** again
2. Select **"Docker Registry"** → **Next**
3. Select **"Azure Container Registry"**
4. Configure:
   - **Azure subscription**: Azure subscription 1
   - **Azure container registry**: `fleetappregistry`
   - **Service connection name**: `FleetACR-Connection`
   - **Grant access permission to all pipelines**: ✅ Checked
5. Click **"Save"**

## Step 4: Get ACR Credentials

Run this command to get your ACR credentials:

```bash
az acr credential show --name fleetappregistry --resource-group fleet-production-rg
```

Save the output - you'll need it for troubleshooting.

## Step 5: Create Pipeline Environment

1. Go to **Pipelines** → **Environments**
2. Click **"New environment"**
3. Configure:
   - **Name**: `fleet-production`
   - **Resource**: Kubernetes
4. Click **"Next"**
5. Select:
   - **Provider**: Azure Kubernetes Service
   - **Azure subscription**: Azure-Production-Connection
   - **Cluster**: fleet-aks-cluster
   - **Namespace**: fleet-management
6. Click **"Validate and create"**

### Add Approval Gates (Recommended)

1. Click on the `fleet-production` environment
2. Click the **⋮** menu → **Approvals and checks**
3. Click **"+"** → **"Approvals"**
4. Add approvers (your email: andrew.m@capitaltechalliance.com)
5. **Minimum number of approvers**: 1
6. Click **"Create"**

## Step 6: Create the Pipeline

1. Go to **Pipelines** → **Pipelines**
2. Click **"New pipeline"**
3. Select **"Azure Repos Git"**
4. Select your **Fleet-Production** repository
5. Select **"Existing Azure Pipelines YAML file"**
6. Configure:
   - **Branch**: main
   - **Path**: `/azure-pipelines-production.yml`
7. Click **"Continue"**
8. Review the pipeline YAML
9. Click **"Save"** (don't run yet)

## Step 7: Configure Pipeline Variables (Optional)

You can override default variables if needed:

1. Go to your pipeline
2. Click **"Edit"**
3. Click **"Variables"** (top right)
4. Add any custom variables (if needed):
   - `imageTag`: Custom tag (default is Build.BuildId)

## Step 8: Run First Deployment

1. Go to **Pipelines** → **Pipelines**
2. Select your **Fleet-Production** pipeline
3. Click **"Run pipeline"**
4. Select:
   - **Branch**: main
5. Click **"Run"**

The pipeline will:
1. ✅ Build Docker image
2. ✅ Run security scan
3. ✅ Push to ACR
4. ✅ Deploy to AKS production namespace
5. ✅ Wait for rollout
6. ✅ Verify deployment health
7. ✅ Run post-deployment health checks

## Step 9: Monitor Deployment

### Watch Pipeline Progress

The pipeline will show real-time progress through each stage:
- **Build** (~5-10 minutes)
- **Deploy to Production** (~5 minutes)
- **Health Check** (~2 minutes)
- **Notify** (~1 minute)

### Check Kubernetes Deployment

```bash
# Connect to AKS
az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster

# Check deployment status
kubectl get deployments -n fleet-management

# Check pods
kubectl get pods -n fleet-management

# Check services
kubectl get services -n fleet-management

# Check ingress
kubectl get ingress -n fleet-management

# View logs
kubectl logs -n fleet-management deployment/fleet-app --tail=100
```

## Step 10: Access Application

### Get Application URL

```bash
# Get ingress URL
kubectl get ingress -n fleet-management -o jsonpath='{.items[0].spec.rules[0].host}'

# Or get load balancer IP
kubectl get service -n fleet-management fleet-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

Visit the URL in your browser to verify deployment.

## Pipeline Features

### ✅ Automated Security Scanning
- Trivy vulnerability scanner runs on every build
- Fails on HIGH/CRITICAL vulnerabilities
- Security reports available as artifacts

### ✅ Rolling Updates
- Zero-downtime deployments
- Automatic rollout status monitoring
- Health checks before marking deployment successful

### ✅ Production Safety
- Manual trigger only (no automatic deployments)
- Approval gates for production environment
- Rollout status verification
- Pod health checks

## Troubleshooting

### Pipeline Fails at "Login to ACR"

**Solution**: Verify service connection
```bash
# Test ACR access
az acr login --name fleetappregistry
```

### Pipeline Fails at "Connect to AKS"

**Solution**: Verify AKS access
```bash
# Test AKS access
az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster
kubectl get nodes
```

### Deployment Fails at "Wait for Rollout"

**Solution**: Check pod logs
```bash
kubectl logs -n fleet-management deployment/fleet-app
kubectl describe pod -n fleet-management -l app=fleet-app
```

### Image Pull Error

**Solution**: Attach ACR to AKS
```bash
az aks update \
  --resource-group fleet-production-rg \
  --name fleet-aks-cluster \
  --attach-acr fleetappregistry
```

## Next Steps

### Set Up Continuous Integration

Edit the pipeline trigger in `azure-pipelines-production.yml`:

```yaml
trigger:
  branches:
    include:
      - main
  paths:
    exclude:
      - '*.md'
      - 'docs/**'
```

This will trigger builds automatically on push to main branch.

### Set Up Staging Environment

Create a separate pipeline for staging:
1. Copy `azure-pipelines-production.yml` to `azure-pipelines-staging.yml`
2. Update namespace to `fleet-management-staging`
3. Remove approval gates for faster iteration

### Set Up Monitoring

Already configured:
- Application Insights
- Log Analytics
- Container Insights for AKS

Access monitoring at:
https://portal.azure.com → Resource Groups → fleet-production-rg → Application Insights

## Pipeline YAML Location

The production pipeline is located at:
```
/azure-pipelines-production.yml
```

## Support

For issues or questions:
- Check Azure DevOps pipeline logs
- Review Kubernetes pod logs: `kubectl logs -n fleet-management deployment/fleet-app`
- Check this guide: `/AZURE_DEVOPS_SETUP_GUIDE.md`

## Security Notes

🔒 **Important Security Practices:**
- Service connections use Azure AD authentication
- ACR credentials are managed by Azure
- No secrets stored in repository
- All secrets managed through Azure Key Vault
- Security scanning on every build
- Parameterized queries only ($1, $2, $3)
- Non-root containers
- ReadOnlyRootFilesystem enabled

---

**Ready to deploy!** Follow the steps above to set up your Azure DevOps pipeline. 🚀
