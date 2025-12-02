# Fleet Production Deployment - Quick Start

## 🎯 What's Been Done

✅ **Production Pipeline Created**: `azure-pipelines-production.yml`
✅ **Setup Guide Created**: `AZURE_DEVOPS_SETUP_GUIDE.md`
✅ **Pushed to GitHub**: Ready for Azure DevOps integration

## 🏗️ Existing Infrastructure

Your production environment is already set up:

- **Resource Group**: `fleet-production-rg`
- **AKS Cluster**: `fleet-aks-cluster` (3 nodes, eastus2)
- **Container Registry**: `fleetappregistry.azurecr.io`
- **Namespace**: `fleet-management` (production)
- **Staging**: `fleet-management-staging`
- **Development**: `fleet-management-dev`

## 🚀 Deploy to Production in 3 Steps

### Step 1: Set Up Azure DevOps (5 minutes)

1. Go to https://dev.azure.com/capitaltechalliance
2. Create new project: **"Fleet-Production"**
3. Import repository: https://github.com/asmortongpt/Fleet

### Step 2: Configure Service Connections (5 minutes)

```bash
# Get your current credentials
az account show

# You'll need:
# - Subscription ID: 021415c2-2f52-4a73-ae77-f8363165a5e1
# - Tenant ID: 0ec14b81-7b82-45ee-8f3d-cbc31ced5347
```

In Azure DevOps:
1. **Project Settings** → **Service connections**
2. Create **Azure Resource Manager** connection:
   - Name: `Azure-Production-Connection`
   - Subscription: Azure subscription 1
   - Resource Group: fleet-production-rg
3. Create **Docker Registry** connection:
   - Name: `FleetACR-Connection`
   - Registry: fleetappregistry

### Step 3: Create and Run Pipeline (2 minutes)

1. **Pipelines** → **New pipeline**
2. Select **Azure Repos Git**
3. Choose **Fleet-Production** repository
4. Select **Existing YAML file**: `/azure-pipelines-production.yml`
5. Click **Run**

## 📊 What the Pipeline Does

```
1. Build Docker Image (5-10 min)
   ├─ Checkout code from main branch
   ├─ Build with Dockerfile
   ├─ Security scan with Trivy
   └─ Push to fleetappregistry.azurecr.io

2. Deploy to Production (5 min)
   ├─ Connect to AKS cluster
   ├─ Update fleet-app deployment
   ├─ Wait for rolling update
   └─ Verify pod health

3. Health Checks (2 min)
   ├─ Wait for stabilization (60s)
   ├─ Check deployment status
   └─ Verify all pods running

4. Notify (1 min)
   └─ Display deployment summary
```

**Total Time**: ~15 minutes per deployment

## 🔍 Monitor Deployment

### Azure DevOps
- View pipeline: https://dev.azure.com/capitaltechalliance/Fleet-Production/_build
- Check logs in real-time
- Download artifacts (security reports)

### Kubernetes
```bash
# Connect to cluster
az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster

# Check deployment
kubectl get deployments -n fleet-management

# Check pods
kubectl get pods -n fleet-management -l app=fleet-app

# View logs
kubectl logs -n fleet-management deployment/fleet-app --tail=100 -f

# Check services
kubectl get services -n fleet-management

# Check ingress
kubectl get ingress -n fleet-management
```

## 🌐 Access Your Application

### Get Application URL
```bash
# Method 1: Via ingress (if configured)
kubectl get ingress -n fleet-management

# Method 2: Via load balancer
kubectl get service -n fleet-management
```

### Test Endpoints
```bash
# Health check
curl https://your-app-url/api/health

# App status
curl https://your-app-url/
```

## 🛡️ Security Features

✅ **Trivy Vulnerability Scanning** - Every build
✅ **Parameterized SQL Queries** - Prevents SQL injection
✅ **Non-root Containers** - Enhanced security
✅ **Azure AD Authentication** - Service connections
✅ **RBAC Enabled** - Kubernetes role-based access
✅ **Network Policies** - Pod-to-pod traffic control

## 🔧 Common Commands

### Rebuild and Deploy
```bash
# From Azure DevOps
Pipelines → Fleet-Production → Run pipeline → Run
```

### Rollback Deployment
```bash
# Connect to AKS
az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster

# Rollback to previous version
kubectl rollout undo deployment/fleet-app -n fleet-management

# Check rollout status
kubectl rollout status deployment/fleet-app -n fleet-management
```

### Scale Application
```bash
# Scale up
kubectl scale deployment fleet-app -n fleet-management --replicas=5

# Scale down
kubectl scale deployment fleet-app -n fleet-management --replicas=2
```

### View Logs
```bash
# Recent logs
kubectl logs -n fleet-management deployment/fleet-app --tail=100

# Follow logs in real-time
kubectl logs -n fleet-management deployment/fleet-app -f

# Logs from specific pod
kubectl logs -n fleet-management <pod-name>
```

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `azure-pipelines-production.yml` | Production deployment pipeline |
| `AZURE_DEVOPS_SETUP_GUIDE.md` | Detailed setup instructions |
| `Dockerfile` | Container image definition |
| `k8s/` | Kubernetes manifests |

## 🆘 Troubleshooting

### Pipeline Fails at Build Stage
```bash
# Check Dockerfile syntax
docker build -t fleet-test .

# Check ACR access
az acr login --name fleetappregistry
```

### Pipeline Fails at Deploy Stage
```bash
# Verify AKS connection
az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster
kubectl get nodes

# Check if namespace exists
kubectl get namespace fleet-management

# Verify deployment exists
kubectl get deployment fleet-app -n fleet-management
```

### Pods Not Starting
```bash
# Describe pod to see errors
kubectl describe pod -n fleet-management -l app=fleet-app

# Check pod logs
kubectl logs -n fleet-management -l app=fleet-app

# Check events
kubectl get events -n fleet-management --sort-by='.lastTimestamp'
```

### Can't Access Application
```bash
# Check service
kubectl get service -n fleet-management

# Check ingress
kubectl get ingress -n fleet-management

# Port-forward for testing
kubectl port-forward -n fleet-management deployment/fleet-app 8080:3000
# Then access: http://localhost:8080
```

## 📚 Additional Resources

- **Full Setup Guide**: `AZURE_DEVOPS_SETUP_GUIDE.md`
- **GitHub Repository**: https://github.com/asmortongpt/Fleet
- **Azure DevOps**: https://dev.azure.com/capitaltechalliance
- **Azure Portal**: https://portal.azure.com
- **AKS Documentation**: https://docs.microsoft.com/azure/aks/

## 🎯 Next Steps

1. ✅ **Set up Azure DevOps project** (follow steps above)
2. ✅ **Run first deployment**
3. ⏳ **Set up custom domain** (optional)
4. ⏳ **Configure SSL certificate** (optional)
5. ⏳ **Set up monitoring alerts** (optional)
6. ⏳ **Configure auto-scaling** (optional)

## 💡 Pro Tips

- **Use Staging First**: Test in `fleet-management-staging` before production
- **Monitor Costs**: Check Azure Cost Management weekly
- **Backup Regularly**: Database backups are essential
- **Review Security Scans**: Check Trivy reports after each build
- **Set Up Alerts**: Configure Azure Monitor for critical issues

---

**Ready to deploy!** 🚀 Follow Step 1 above to get started.

*Questions? Check `AZURE_DEVOPS_SETUP_GUIDE.md` for detailed instructions.*
