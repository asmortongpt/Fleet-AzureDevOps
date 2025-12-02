#!/bin/bash
# Fleet Management Pipeline Configuration Verification Script
# Verifies all Azure resources and pipeline configuration

set -e

echo "=========================================="
echo "Fleet Management Pipeline Verification"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking Azure Container Registry..."
if az acr show --name fleetappregistry --resource-group fleet-production-rg &>/dev/null; then
    check_pass "ACR 'fleetappregistry' exists"

    # Check for images
    IMAGES=$(az acr repository list --name fleetappregistry --output tsv | wc -l)
    if [ "$IMAGES" -gt 0 ]; then
        check_pass "ACR contains $IMAGES repositories"
    else
        check_warn "ACR is empty - no images pushed yet"
    fi
else
    check_fail "ACR 'fleetappregistry' not found"
    exit 1
fi

echo ""
echo "2. Checking AKS Cluster..."
if az aks show --name fleet-aks-cluster --resource-group fleet-production-rg &>/dev/null; then
    check_pass "AKS cluster 'fleet-aks-cluster' exists"

    # Get credentials
    az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster --overwrite-existing &>/dev/null

    # Check namespace
    if kubectl get namespace fleet-management &>/dev/null; then
        check_pass "Namespace 'fleet-management' exists"

        # Check deployments
        DEPLOYMENTS=$(kubectl get deployments -n fleet-management --no-headers 2>/dev/null | wc -l)
        if [ "$DEPLOYMENTS" -gt 0 ]; then
            check_pass "Found $DEPLOYMENTS deployments in namespace"
        else
            check_warn "No deployments found in namespace"
        fi
    else
        check_fail "Namespace 'fleet-management' not found"
    fi
else
    check_fail "AKS cluster 'fleet-aks-cluster' not found"
    exit 1
fi

echo ""
echo "3. Checking Azure Key Vault..."
if az keyvault show --name fleet-pipeline-kv --resource-group fleet-production-rg &>/dev/null; then
    check_pass "Key Vault 'fleet-pipeline-kv' exists"

    # Check for required secrets
    REQUIRED_SECRETS=("fleet-pipeline-sp-app-id" "fleet-pipeline-sp-secret" "fleet-pipeline-sp-tenant-id" "fleet-subscription-id")
    for SECRET in "${REQUIRED_SECRETS[@]}"; do
        if az keyvault secret show --vault-name fleet-pipeline-kv --name "$SECRET" &>/dev/null; then
            check_pass "Secret '$SECRET' exists"
        else
            check_fail "Secret '$SECRET' not found"
        fi
    done
else
    check_fail "Key Vault 'fleet-pipeline-kv' not found"
    exit 1
fi

echo ""
echo "4. Checking Service Principal Permissions..."
SP_APP_ID=$(az keyvault secret show --vault-name fleet-pipeline-kv --name fleet-pipeline-sp-app-id --query value -o tsv 2>/dev/null)

if [ -n "$SP_APP_ID" ]; then
    check_pass "Service Principal App ID retrieved"

    # Check role assignments
    if az role assignment list --assignee "$SP_APP_ID" --resource-group fleet-production-rg | grep -q "Contributor"; then
        check_pass "Service Principal has Contributor role on resource group"
    else
        check_warn "Contributor role not found - may need to be assigned"
    fi

    if az role assignment list --assignee "$SP_APP_ID" --scope "/subscriptions/021415c2-2f52-4a73-ae77-f8363165a5e1/resourceGroups/fleet-production-rg/providers/Microsoft.ContainerRegistry/registries/fleetappregistry" | grep -q "AcrPush"; then
        check_pass "Service Principal has AcrPush role on ACR"
    else
        check_warn "AcrPush role not found - may need to be assigned"
    fi
else
    check_fail "Could not retrieve Service Principal App ID"
fi

echo ""
echo "5. Checking Azure DevOps Pipeline Configuration..."
if az pipelines show --id 4 --organization https://dev.azure.com/CapitalTechAlliance --project FleetManagement &>/dev/null; then
    check_pass "Pipeline 'Fleet-Management-Pipeline' (ID: 4) exists"

    # Check variable group
    VARS=$(az pipelines variable-group variable list --group-id 2 --organization https://dev.azure.com/CapitalTechAlliance --project FleetManagement --output json 2>/dev/null)

    if echo "$VARS" | jq -e '.aksCluster.value == "fleet-aks-cluster"' &>/dev/null; then
        check_pass "Variable 'aksCluster' correctly set"
    else
        check_fail "Variable 'aksCluster' incorrect or missing"
    fi

    if echo "$VARS" | jq -e '.aksResourceGroup.value == "fleet-production-rg"' &>/dev/null; then
        check_pass "Variable 'aksResourceGroup' correctly set"
    else
        check_fail "Variable 'aksResourceGroup' incorrect or missing"
    fi

    if echo "$VARS" | jq -e '.registryName.value == "fleetappregistry"' &>/dev/null; then
        check_pass "Variable 'registryName' correctly set"
    else
        check_fail "Variable 'registryName' incorrect or missing"
    fi

    if echo "$VARS" | jq -e '.registryLoginServer.value == "fleetappregistry.azurecr.io"' &>/dev/null; then
        check_pass "Variable 'registryLoginServer' correctly set"
    else
        check_fail "Variable 'registryLoginServer' incorrect or missing"
    fi
else
    check_fail "Pipeline not found"
    exit 1
fi

echo ""
echo "6. Checking Service Connections..."
ENDPOINTS=$(az devops service-endpoint list --organization https://dev.azure.com/CapitalTechAlliance --project FleetManagement --output json 2>/dev/null)

if [ "$(echo "$ENDPOINTS" | jq 'length')" -eq 0 ]; then
    check_warn "No service connections found - MUST CREATE MANUALLY"
    echo ""
    echo "   Required service connections:"
    echo "   1. Azure-Fleet-Management (Azure Resource Manager)"
    echo "   2. fleetappregistry (Docker Registry)"
    echo ""
    echo "   Create at: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_settings/adminservices"
else
    check_pass "Found $(echo "$ENDPOINTS" | jq 'length') service connection(s)"

    if echo "$ENDPOINTS" | jq -e '.[] | select(.name == "Azure-Fleet-Management")' &>/dev/null; then
        check_pass "Service connection 'Azure-Fleet-Management' exists"
    else
        check_warn "Service connection 'Azure-Fleet-Management' not found - MUST CREATE"
    fi

    if echo "$ENDPOINTS" | jq -e '.[] | select(.name == "fleetappregistry")' &>/dev/null; then
        check_pass "Service connection 'fleetappregistry' exists"
    else
        check_warn "Service connection 'fleetappregistry' not found - MUST CREATE"
    fi
fi

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "Pipeline URL: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build?definitionId=4"
echo ""
echo "To retrieve service principal credentials:"
echo "  az keyvault secret show --vault-name fleet-pipeline-kv --name fleet-pipeline-sp-app-id --query value -o tsv"
echo "  az keyvault secret show --vault-name fleet-pipeline-kv --name fleet-pipeline-sp-secret --query value -o tsv"
echo "  az keyvault secret show --vault-name fleet-pipeline-kv --name fleet-pipeline-sp-tenant-id --query value -o tsv"
echo ""
echo "Next steps: See PIPELINE_QUICK_START.md for service connection setup"
echo ""
