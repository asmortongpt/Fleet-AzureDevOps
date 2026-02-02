#!/bin/bash

# ============================================================================
# Fleet Management System - Azure Infrastructure Setup
# ============================================================================
# Creates and configures all required Azure resources
# Author: Capital Tech Alliance
# Last Updated: 2025-12-31
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-fleet-management-prod}"
LOCATION="${AZURE_LOCATION:-eastus2}"
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-002d93e1-5cc6-46c3-bce5-9dc49b223274}"

# Resource names
STATIC_WEB_APP_NAME="${STATIC_WEB_APP_NAME:-fleet-management-app}"
ACR_NAME="${ACR_NAME:-ctafleetregistry}"
KEY_VAULT_NAME="${KEY_VAULT_NAME:-fleet-kv-prod}"
APP_INSIGHTS_NAME="${APP_INSIGHTS_NAME:-fleet-insights-prod}"
LOG_ANALYTICS_NAME="${LOG_ANALYTICS_NAME:-fleet-logs-prod}"
FRONT_DOOR_NAME="${FRONT_DOOR_NAME:-fleet-frontdoor-prod}"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

error_handler() {
    log_error "Infrastructure setup failed at line $1"
    exit 1
}

trap 'error_handler $LINENO' ERR

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           Fleet Management System                             ║
║           Azure Infrastructure Setup                          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_info "Starting Azure infrastructure setup"

# ============================================================================
# Phase 1: Prerequisites
# ============================================================================
log_info "Phase 1: Checking prerequisites"

# Check Azure CLI
if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed"
    log_info "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

log_success "Azure CLI found: $(az version --query '\"azure-cli\"' -o tsv)"

# Check if logged in
if ! az account show &> /dev/null; then
    log_info "Not logged into Azure - initiating login..."
    az login
fi

CURRENT_ACCOUNT=$(az account show --query name -o tsv)
log_success "Logged into Azure account: $CURRENT_ACCOUNT"

# Set subscription
log_info "Setting subscription to: $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"

log_success "Prerequisites check completed"

# ============================================================================
# Phase 2: Resource Group
# ============================================================================
log_info "Phase 2: Creating resource group"

if az group exists --name "$RESOURCE_GROUP" | grep -q true; then
    log_warning "Resource group '$RESOURCE_GROUP' already exists"
else
    log_info "Creating resource group: $RESOURCE_GROUP in $LOCATION"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags \
            Environment=Production \
            Project=FleetManagement \
            ManagedBy=Automation \
            CostCenter=Engineering

    log_success "Resource group created"
fi

# ============================================================================
# Phase 3: Azure Container Registry
# ============================================================================
log_info "Phase 3: Creating Azure Container Registry"

if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log_warning "ACR '$ACR_NAME' already exists"
else
    log_info "Creating ACR: $ACR_NAME"
    az acr create \
        --name "$ACR_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Standard \
        --admin-enabled true

    log_success "ACR created"
fi

# Enable admin and get credentials
log_info "Retrieving ACR credentials..."
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

log_success "ACR configured - Username: $ACR_USERNAME"

# ============================================================================
# Phase 4: Log Analytics Workspace
# ============================================================================
log_info "Phase 4: Creating Log Analytics Workspace"

if az monitor log-analytics workspace show --workspace-name "$LOG_ANALYTICS_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log_warning "Log Analytics workspace '$LOG_ANALYTICS_NAME' already exists"
else
    log_info "Creating Log Analytics workspace: $LOG_ANALYTICS_NAME"
    az monitor log-analytics workspace create \
        --workspace-name "$LOG_ANALYTICS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --retention-time 30

    log_success "Log Analytics workspace created"
fi

# Get workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
    --workspace-name "$LOG_ANALYTICS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id -o tsv)

log_info "Workspace ID: $WORKSPACE_ID"

# ============================================================================
# Phase 5: Application Insights
# ============================================================================
log_info "Phase 5: Creating Application Insights"

if az monitor app-insights component show --app "$APP_INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log_warning "Application Insights '$APP_INSIGHTS_NAME' already exists"
else
    log_info "Creating Application Insights: $APP_INSIGHTS_NAME"
    az monitor app-insights component create \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --workspace "$WORKSPACE_ID" \
        --kind web \
        --application-type web

    log_success "Application Insights created"
fi

# Get instrumentation key
APPINSIGHTS_KEY=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query instrumentationKey -o tsv)

APPINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv)

log_success "Application Insights configured"

# ============================================================================
# Phase 6: Key Vault
# ============================================================================
log_info "Phase 6: Creating Key Vault"

if az keyvault show --name "$KEY_VAULT_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log_warning "Key Vault '$KEY_VAULT_NAME' already exists"
else
    log_info "Creating Key Vault: $KEY_VAULT_NAME"
    az keyvault create \
        --name "$KEY_VAULT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --enable-rbac-authorization false \
        --enabled-for-deployment true \
        --enabled-for-template-deployment true

    log_success "Key Vault created"
fi

# Store secrets in Key Vault
log_info "Storing secrets in Key Vault..."

# ACR credentials
az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "ACR-Username" \
    --value "$ACR_USERNAME" \
    --output none

az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "ACR-Password" \
    --value "$ACR_PASSWORD" \
    --output none

# Application Insights
az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "AppInsights-InstrumentationKey" \
    --value "$APPINSIGHTS_KEY" \
    --output none

az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "AppInsights-ConnectionString" \
    --value "$APPINSIGHTS_CONNECTION_STRING" \
    --output none

log_success "Secrets stored in Key Vault"

# ============================================================================
# Phase 7: Static Web App (if not exists)
# ============================================================================
log_info "Phase 7: Checking Static Web App"

if az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null 2>&1; then
    log_success "Static Web App '$STATIC_WEB_APP_NAME' already exists"
    STATIC_WEB_APP_URL=$(az staticwebapp show \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "defaultHostname" -o tsv)
    log_info "Static Web App URL: https://$STATIC_WEB_APP_URL"
else
    log_warning "Static Web App '$STATIC_WEB_APP_NAME' not found"
    log_info "Static Web Apps are typically created via GitHub Actions"
    log_info "Ensure your GitHub Actions workflow is configured properly"
fi

# ============================================================================
# Phase 8: Monitoring Alerts
# ============================================================================
log_info "Phase 8: Creating monitoring alerts"

# Create action group for alerts
ACTION_GROUP_NAME="fleet-alerts"

if az monitor action-group show --name "$ACTION_GROUP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log_warning "Action group '$ACTION_GROUP_NAME' already exists"
else
    log_info "Creating action group: $ACTION_GROUP_NAME"
    az monitor action-group create \
        --name "$ACTION_GROUP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --short-name "FleetAlert" \
        --email-receiver name=DevOps email=andrew.m@capitaltechalliance.com

    log_success "Action group created"
fi

# Create metric alert for availability
log_info "Creating availability alert..."
az monitor metrics alert create \
    --name "fleet-availability-alert" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$WORKSPACE_ID" \
    --description "Alert when availability drops below 99%" \
    --condition "avg availabilityResults/availabilityPercentage < 99" \
    --evaluation-frequency 5m \
    --window-size 15m \
    --action "$ACTION_GROUP_NAME" \
    --severity 1 \
    || log_warning "Availability alert may already exist"

log_success "Monitoring alerts configured"

# ============================================================================
# Summary
# ============================================================================
echo -e "\n${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           🎉 INFRASTRUCTURE SETUP COMPLETE 🎉                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

log_success "Azure infrastructure setup completed successfully"
echo ""
log_info "Infrastructure Summary:"
echo "  - Resource Group: $RESOURCE_GROUP"
echo "  - Location: $LOCATION"
echo "  - Container Registry: $ACR_NAME.azurecr.io"
echo "  - Key Vault: $KEY_VAULT_NAME"
echo "  - Application Insights: $APP_INSIGHTS_NAME"
echo "  - Log Analytics: $LOG_ANALYTICS_NAME"
echo ""
log_info "Next Steps:"
echo "  1. Configure GitHub Secrets with the following values:"
echo "     - AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "     - ACR_USERNAME: $ACR_USERNAME"
echo "     - ACR_PASSWORD: [stored in Key Vault]"
echo "     - APPINSIGHTS_INSTRUMENTATION_KEY: [stored in Key Vault]"
echo ""
echo "  2. Run deployment:"
echo "     ./scripts/deployment/deploy-production.sh"
echo ""
echo "  3. Build and push Docker images:"
echo "     ./scripts/deployment/build-docker.sh"
echo ""

exit 0
