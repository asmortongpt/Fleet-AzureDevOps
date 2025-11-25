# Fleet Management Pipeline - Quick Start

## Pipeline Status

**Current Status:** ⚠️ NEEDS SERVICE CONNECTIONS

**Pipeline URL:** https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4

## Quick Actions

### 1. Create Service Connections (REQUIRED)

Go to Azure DevOps Service Connections:
```
https://dev.azure.com/CapitalTechAlliance/FleetManagement/_settings/adminservices
```

**Click "New service connection" and create:**

#### Azure Resource Manager Connection
- **Name:** `Azure-Fleet-Management`
- **Type:** Service Principal (manual)
- **Credentials:** Retrieve from Azure Key Vault (see AZURE_DEVOPS_SERVICE_CONNECTION_SETUP.md)
  - Service Principal ID
  - Service Principal Key
  - Tenant ID
  - Subscription ID

#### Docker Registry Connection
- **Name:** `fleetappregistry`
- **Type:** Azure Container Registry
- **Subscription:** Use "Azure-Fleet-Management" connection
- **Registry:** `fleetappregistry`

### 2. Run Pipeline

```bash
# Option A: Trigger via commit
git add .
git commit -m "trigger pipeline"
git push

# Option B: Manual trigger
az pipelines run --id 4 \
  --organization https://dev.azure.com/CapitalTechAlliance \
  --project FleetManagement
```

### 3. Monitor Pipeline

Watch live: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4

## Pipeline Stages

1. **Build & Test** - Builds API and Frontend, runs unit tests
2. **Docker** - Builds and pushes images to fleetappregistry.azurecr.io
3. **Deploy** - Deploys to AKS cluster in fleet-management namespace
4. **Test** - Runs E2E tests against production

## Current Configuration

| Resource | Value |
|----------|-------|
| ACR | fleetappregistry.azurecr.io |
| AKS Cluster | fleet-aks-cluster |
| Resource Group | fleet-production-rg |
| Namespace | fleet-management |
| Images | fleet-api, fleet-frontend |

## Deployment Targets

| Deployment | Current Image |
|------------|---------------|
| fleet-api | fleetappregistry.azurecr.io/fleet-api:latest |
| fleet-app (frontend) | fleetappregistry.azurecr.io/fleet-frontend:latest |

## Troubleshooting

**Pipeline fails immediately?**
→ Service connections not created (see step 1)

**Build fails?**
→ Check azure-pipelines.yml for syntax errors

**Deploy fails?**
→ Verify AKS cluster and namespace exist

**Images not pushing?**
→ Check ACR service connection permissions

## Support

Full documentation: `AZURE_DEVOPS_SERVICE_CONNECTION_SETUP.md`

---
Last Updated: 2025-11-24
