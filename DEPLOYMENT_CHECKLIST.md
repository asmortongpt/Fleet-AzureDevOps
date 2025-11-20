# Fleet Deployment Checklist - What You Need to Do

**Date**: November 20, 2025
**Status**: ✅ Azure resources exist, ⚠️ Service connections needed
**Time Required**: 15-20 minutes

---

## ✅ Good News: Azure Resources Already Exist!

I checked your Azure subscription and found:

| Resource | Status | Details |
|----------|--------|---------|
| **Container Registry** | ✅ EXISTS | `fleetappregistry.azurecr.io` |
| **AKS Cluster** | ✅ EXISTS | `fleet-aks-cluster` in `fleet-production-rg` |
| **Resource Groups** | ✅ EXISTS | `fleet-production-rg`, `fleet-staging-rg`, `fleet-dev-rg` |

**This means you're 90% ready to deploy!**

---

## ⚠️ What "Service Connections Required" Means

**Simple Explanation**:
- Azure DevOps is separate from your Azure subscription
- Right now, Azure DevOps **cannot access** your Azure resources
- Service connections are like **giving Azure DevOps a key** to your Azure account
- Once you create them, Azure DevOps can deploy automatically

**Think of it like this**:
- You have a house (Azure resources)
- You hired a contractor (Azure DevOps)
- The contractor needs keys (service connections) to enter and work

---

## ✅ What You Need to Do (2 Simple Steps!)

### **Step 1: Create Azure Resource Manager Connection** (5 min)

1. **Click this link**: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_settings/adminservices

2. **Click**: "New service connection" (blue button)

3. **Select**: "Azure Resource Manager"

4. **Select**: "Service principal (automatic)"

5. **Fill in**:
   - Subscription: **Azure subscription 1**
   - Resource group: **Leave blank**
   - Service connection name: **`Azure-Fleet-Management`**
   - ✅ Check "Grant access permission to all pipelines"

6. **Click**: "Save"

### **Step 2: Create Container Registry Connection** (5 min)

1. **Same page**, click: "New service connection"

2. **Select**: "Docker Registry"

3. **Select**: "Azure Container Registry"

4. **Fill in**:
   - Subscription: **Azure subscription 1**
   - Container registry: **fleetappregistry**
   - Service connection name: **`fleetappregistry`**
   - ✅ Check "Grant access permission to all pipelines"

5. **Click**: "Save"

---

## 🚀 After Creating Connections

The pipeline will automatically run when you push code:

```bash
# Trigger the pipeline
git commit --allow-empty -m "ci: trigger pipeline"
git push origin stage-a/requirements-inception

# Monitor deployment
open https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4
```

---

## 📋 What Else Needs to Be Done

### Nothing else! That's it!

Once you create the 2 service connections:
1. ✅ Pipeline will automatically build
2. ✅ Tests will automatically run
3. ✅ Code coverage will be generated
4. ✅ Results will appear in Azure DevOps

### For Production Deployment (Later):

When you're ready to deploy to production:
```bash
git checkout main
git merge stage-a/requirements-inception
git push origin main
```

Pipeline will automatically:
- Build Docker images
- Push to Container Registry
- Deploy to Kubernetes
- Run database migrations
- Execute E2E tests

---

## ⏱️ Timeline

| Task | Time | Who Does It |
|------|------|-------------|
| Create service connections | 10 min | **YOU** |
| Push code | 1 min | **YOU** |
| Build & test | 6 min | **Automatic** |
| Review results | 2 min | **YOU** |
| **TOTAL** | **19 min** | **Done!** |

---

## 🎯 Summary

**"Service Connections Required" means**:
- You need to give Azure DevOps permission to access your Azure account
- It's a one-time setup (takes 10 minutes)
- After that, everything is automatic

**What else needs to be done**:
- **Just those 2 service connections!**
- Everything else is already configured ✅
- All Azure resources exist ✅
- Pipeline is created ✅
- Code is ready ✅

**You're literally 10 minutes away from automated deployments!** 🚀

