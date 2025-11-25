# Azure DevOps Service Connection Setup for Fleet Pipeline

## Service Principal Created

**Name:** FleetManagement-Pipeline-SP
**App ID (Client ID):** `<stored in Azure Key Vault: fleet-pipeline-sp-app-id>`
**Client Secret:** `<stored in Azure Key Vault: fleet-pipeline-sp-secret>`
**Tenant ID:** `<stored in Azure Key Vault: fleet-pipeline-sp-tenant-id>`
**Subscription ID:** `<stored in Azure Key Vault: fleet-subscription-id>`

**To retrieve credentials:**
```bash
az keyvault secret show --vault-name fleet-pipeline-kv --name fleet-pipeline-sp-app-id --query value -o tsv
az keyvault secret show --vault-name fleet-pipeline-kv --name fleet-pipeline-sp-secret --query value -o tsv
az keyvault secret show --vault-name fleet-pipeline-kv --name fleet-pipeline-sp-tenant-id --query value -o tsv
az keyvault secret show --vault-name fleet-pipeline-kv --name fleet-subscription-id --query value -o tsv
```

## Permissions Granted

1. **Resource Group:** Contributor role on `fleet-production-rg`
2. **Azure Container Registry:** AcrPush role on `fleetappregistry`
3. **AKS Cluster:** Azure Kubernetes Service Cluster User Role on `fleet-aks-cluster`

## Required Service Connections in Azure DevOps

You must create the following service connections manually in Azure DevOps:

### 1. Azure Service Connection (Azure-Fleet-Management)

**Path:** Azure DevOps → FleetManagement Project → Project Settings → Service Connections → New Service Connection → Azure Resource Manager

**Configuration:**
- **Connection type:** Service Principal (manual)
- **Connection name:** `Azure-Fleet-Management`
- **Environment:** Azure Cloud
- **Subscription ID:** `<retrieve from Key Vault>`
- **Subscription Name:** `Azure subscription 1`
- **Service Principal ID (Client ID):** `<retrieve from Key Vault>`
- **Service Principal Key (Client Secret):** `<retrieve from Key Vault>`
- **Tenant ID:** `<retrieve from Key Vault>`
- **Grant access permission to all pipelines:** ✓ (Recommended)

**Direct URL:**
```
https://dev.azure.com/CapitalTechAlliance/FleetManagement/_settings/adminservices
```

### 2. Azure Container Registry Service Connection (fleetappregistry)

**Path:** Azure DevOps → FleetManagement Project → Project Settings → Service Connections → New Service Connection → Docker Registry

**Configuration:**
- **Registry type:** Azure Container Registry
- **Connection name:** `fleetappregistry`
- **Azure subscription:** Select "Azure-Fleet-Management" (the connection created above)
- **Azure container registry:** `fleetappregistry`
- **Grant access permission to all pipelines:** ✓ (Recommended)

### 3. Kubernetes Service Connection (Optional - if using Kubernetes task)

**Path:** Azure DevOps → FleetManagement Project → Project Settings → Service Connections → New Service Connection → Kubernetes

**Configuration:**
- **Authentication method:** Azure Subscription
- **Connection name:** `fleet-aks-cluster`
- **Azure subscription:** Select "Azure-Fleet-Management"
- **Cluster:** `fleet-aks-cluster`
- **Namespace:** `fleet-management`
- **Grant access permission to all pipelines:** ✓ (Recommended)

## Pipeline Configuration Verified

### Pipeline Details
- **Pipeline ID:** 4
- **Pipeline Name:** Fleet-Management-Pipeline
- **Pipeline URL:** https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4
- **YAML File:** `azure-pipelines.yml` (in repository root)
- **Repository:** Azure DevOps Git (`Fleet`)
- **Default Branch:** `stage-a/requirements-inception`

### Variable Groups Updated

**Group: fleet-production-vars (ID: 2)**
- ✓ `aksCluster` = `fleet-aks-cluster`
- ✓ `aksResourceGroup` = `fleet-production-rg` (UPDATED)
- ✓ `namespace` = `fleet-management`
- ✓ `nodeVersion` = `20.x`
- ✓ `productionUrl` = `https://green-pond-0f040980f.3.azurestaticapps.net`
- ✓ `registryLoginServer` = `fleetappregistry.azurecr.io` (UPDATED)
- ✓ `registryName` = `fleetappregistry` (UPDATED)

**Group: fleet-secrets (ID: 3)**
- Contains 1 secret variable (protected)

### Azure Resources Verified

**Azure Container Registry:**
- ✓ Name: `fleetappregistry`
- ✓ Login Server: `fleetappregistry.azurecr.io`
- ✓ Resource Group: `fleet-production-rg`
- ✓ Repositories: fleet-api, fleet-app, fleet-frontend, etc.

**AKS Cluster:**
- ✓ Name: `fleet-aks-cluster`
- ✓ Resource Group: `fleet-production-rg`
- ✓ Location: `eastus2`
- ✓ Kubernetes Version: `1.32`

**Kubernetes Namespace:**
- ✓ Namespace: `fleet-management` (Active)
- ✓ Deployments: fleet-api (3/3), fleet-app (3/3)

## Pipeline YAML Review

The `azure-pipelines.yml` file is properly configured with:

1. ✓ **Triggers:** CI on main, develop, and stage-* branches
2. ✓ **Build Stage:** Node.js API and Frontend builds with tests
3. ✓ **Docker Stage:** Builds and pushes images to ACR using AzureCLI task
4. ✓ **Deploy Stage:** Deploys to AKS using Kubernetes tasks
5. ✓ **Database Migrations:** Automated via Kubernetes job
6. ✓ **E2E Tests:** Playwright tests post-deployment

### Known Issues to Fix

1. **Missing Service Connections:** The pipeline requires service connections to be created manually (see above)
2. **Variable Reference:** Pipeline uses `$(acrName)` but variable group has `registryName` - needs alignment
3. **Namespace Mismatch:** K8s manifests use `ctafleet` namespace but pipeline uses `fleet-management`

## Next Steps

### Immediate Actions Required:

1. **Create Service Connections** (Manual - Azure DevOps Portal)
   - Navigate to: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_settings/adminservices
   - Create "Azure-Fleet-Management" service connection using credentials above
   - Create "fleetappregistry" Docker Registry connection

2. **Update Pipeline YAML Variables**
   ```yaml
   # In azure-pipelines.yml, line 24:
   acrName: 'fleetappregistry'  # Currently correct
   ```

3. **Verify and Trigger Pipeline**
   - Push a commit to trigger CI
   - Or manually run: `az pipelines run --id 4 --organization https://dev.azure.com/CapitalTechAlliance --project FleetManagement`

4. **Monitor First Successful Run**
   - Watch: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4

### Optional Improvements:

1. Fix namespace inconsistency (decide between `fleet-management` vs `ctafleet`)
2. Add environment approval gates for production deployments
3. Configure branch policies to require successful build
4. Set up Azure Monitor integration for pipeline metrics

## Security Notes

- ⚠️ **IMPORTANT:** Store the Client Secret securely - it's only shown once during creation
- ✓ Service Principal has least-privilege access (only to fleet-production-rg)
- ✓ Secrets are managed via Azure DevOps variable groups (encrypted at rest)
- ✓ No secrets in source code or pipeline YAML files

## Troubleshooting

If pipeline continues to fail:

1. **Check Service Connection Status:**
   ```bash
   az devops service-endpoint list --organization https://dev.azure.com/CapitalTechAlliance --project FleetManagement
   ```

2. **View Pipeline Logs:**
   - Navigate to pipeline URL above
   - Click on failed run
   - Review detailed logs for each stage

3. **Verify ACR Access:**
   ```bash
   az acr login --name fleetappregistry
   az acr repository list --name fleetappregistry
   ```

4. **Verify AKS Access:**
   ```bash
   az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster
   kubectl get all -n fleet-management
   ```

## Reference Links

- **Pipeline URL:** https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4
- **Project URL:** https://dev.azure.com/CapitalTechAlliance/FleetManagement
- **Service Connections:** https://dev.azure.com/CapitalTechAlliance/FleetManagement/_settings/adminservices
- **Variable Groups:** https://dev.azure.com/CapitalTechAlliance/FleetManagement/_library?itemType=VariableGroups

---

**Last Updated:** 2025-11-24
**Created By:** Azure DevOps Pipeline Configuration Script
