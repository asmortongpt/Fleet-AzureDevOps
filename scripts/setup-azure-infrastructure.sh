#!/bin/bash

################################################################################
# Fleet Management System - Azure Infrastructure Setup
################################################################################
# Description: Automated Azure resource provisioning and configuration
# Author: Capital Tech Alliance - Infrastructure Team
# Version: 1.0.0
# Last Updated: 2025-12-31
################################################################################

set -euo pipefail

# ============================================================================
# ANSI Color Codes for Output
# ============================================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'

# ============================================================================
# Configuration
# ============================================================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/logs/infrastructure"
readonly LOG_FILE="${LOG_DIR}/setup-$(date +%Y%m%d-%H%M%S).log"

# Azure Resource Configuration
readonly RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-fleet-management-rg}"
readonly LOCATION="${AZURE_LOCATION:-eastus2}"
readonly STATIC_WEB_APP_NAME="${AZURE_STATIC_WEB_APP_NAME:-fleet-management-app}"
readonly CONTAINER_REGISTRY="${AZURE_CONTAINER_REGISTRY:-fleetmgmtacr}"
readonly KEY_VAULT_NAME="${AZURE_KEY_VAULT_NAME:-fleet-keyvault-$(date +%s)}"
readonly FRONT_DOOR_NAME="${AZURE_FRONT_DOOR_NAME:-fleet-frontdoor}"
readonly APP_INSIGHTS_NAME="${AZURE_APP_INSIGHTS_NAME:-fleet-appinsights}"
readonly STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-fleetstore$(date +%s)}"

# Azure AD Configuration
readonly AZURE_CLIENT_ID="${AZURE_CLIENT_ID}"
readonly AZURE_TENANT_ID="${AZURE_TENANT_ID}"

# Deployment Settings
readonly DRY_RUN="${DRY_RUN:-false}"
readonly CREATE_ALL="${CREATE_ALL:-true}"

# ============================================================================
# Utility Functions
# ============================================================================

log() {
    local level="$1"
    shift
    local message="$*"

    case "$level" in
        INFO)
            echo -e "${CYAN}[INFO]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
    esac
}

print_banner() {
    echo -e "${BOLD}${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Azure Infrastructure Setup - Fleet Management System       ║
║   Capital Tech Alliance                                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

check_prerequisites() {
    log INFO "Checking prerequisites..."

    if ! command -v az &> /dev/null; then
        log ERROR "Azure CLI not found. Please install: https://docs.microsoft.com/cli/azure/install-azure-cli"
        exit 1
    fi

    if ! az account show &> /dev/null; then
        log ERROR "Not logged in to Azure CLI. Please run: az login"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        log ERROR "jq not found. Please install jq for JSON processing"
        exit 1
    fi

    log SUCCESS "Prerequisites satisfied"
}

create_resource_group() {
    log INFO "Creating resource group: ${RESOURCE_GROUP}..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would create resource group: ${RESOURCE_GROUP} in ${LOCATION}"
        return 0
    fi

    # Check if resource group exists
    if az group exists --name "$RESOURCE_GROUP" | grep -q true; then
        log WARNING "Resource group ${RESOURCE_GROUP} already exists"
        return 0
    fi

    # Create resource group
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags \
            Environment=Production \
            Project=FleetManagement \
            ManagedBy=Automation \
            CreatedDate="$(date +%Y-%m-%d)" \
        --output table

    log SUCCESS "Resource group created: ${RESOURCE_GROUP}"
}

create_container_registry() {
    log INFO "Creating Azure Container Registry: ${CONTAINER_REGISTRY}..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would create ACR: ${CONTAINER_REGISTRY}"
        return 0
    fi

    # Check if ACR exists
    if az acr show --name "$CONTAINER_REGISTRY" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log WARNING "Container Registry ${CONTAINER_REGISTRY} already exists"
        return 0
    fi

    # Create ACR
    az acr create \
        --name "$CONTAINER_REGISTRY" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Standard \
        --admin-enabled true \
        --output table

    # Enable vulnerability scanning
    az acr task create \
        --registry "$CONTAINER_REGISTRY" \
        --name securityScan \
        --context /dev/null \
        --cmd "{{.Run.Registry}}/security-scanner:latest" \
        --schedule "0 2 * * *" \
        || log WARNING "Could not create security scan task"

    log SUCCESS "Container Registry created: ${CONTAINER_REGISTRY}.azurecr.io"

    # Get ACR credentials
    local acr_username
    local acr_password
    acr_username=$(az acr credential show --name "$CONTAINER_REGISTRY" --query username -o tsv)
    acr_password=$(az acr credential show --name "$CONTAINER_REGISTRY" --query "passwords[0].value" -o tsv)

    log INFO "ACR Username: ${acr_username}"
    log INFO "ACR Password: [HIDDEN - stored in Key Vault]"
}

create_static_web_app() {
    log INFO "Creating Azure Static Web App: ${STATIC_WEB_APP_NAME}..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would create Static Web App: ${STATIC_WEB_APP_NAME}"
        return 0
    fi

    # Check if Static Web App exists
    if az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log WARNING "Static Web App ${STATIC_WEB_APP_NAME} already exists"

        # Get URL
        local app_url
        app_url=$(az staticwebapp show \
            --name "$STATIC_WEB_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --query defaultHostname -o tsv)

        log INFO "Static Web App URL: https://${app_url}"
        return 0
    fi

    # Create Static Web App
    az staticwebapp create \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Free \
        --output table

    # Get deployment token
    local deployment_token
    deployment_token=$(az staticwebapp secrets list \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query properties.apiKey -o tsv)

    log SUCCESS "Static Web App created: ${STATIC_WEB_APP_NAME}"
    log INFO "Deployment Token: [HIDDEN - store in GitHub Secrets as AZURE_STATIC_WEB_APPS_API_TOKEN]"

    # Get URL
    local app_url
    app_url=$(az staticwebapp show \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query defaultHostname -o tsv)

    log SUCCESS "Static Web App URL: https://${app_url}"
}

create_key_vault() {
    log INFO "Creating Azure Key Vault: ${KEY_VAULT_NAME}..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would create Key Vault: ${KEY_VAULT_NAME}"
        return 0
    fi

    # Check if Key Vault exists
    if az keyvault show --name "$KEY_VAULT_NAME" &> /dev/null; then
        log WARNING "Key Vault ${KEY_VAULT_NAME} already exists"
        return 0
    fi

    # Create Key Vault
    az keyvault create \
        --name "$KEY_VAULT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --enable-rbac-authorization false \
        --enabled-for-deployment true \
        --enabled-for-template-deployment true \
        --output table

    # Set access policy for current user
    local current_user
    current_user=$(az account show --query user.name -o tsv)

    az keyvault set-policy \
        --name "$KEY_VAULT_NAME" \
        --upn "$current_user" \
        --secret-permissions get list set delete \
        --key-permissions get list create delete \
        --certificate-permissions get list create delete

    # Store ACR credentials in Key Vault
    if az acr show --name "$CONTAINER_REGISTRY" &> /dev/null; then
        local acr_username
        local acr_password

        acr_username=$(az acr credential show --name "$CONTAINER_REGISTRY" --query username -o tsv)
        acr_password=$(az acr credential show --name "$CONTAINER_REGISTRY" --query "passwords[0].value" -o tsv)

        az keyvault secret set \
            --vault-name "$KEY_VAULT_NAME" \
            --name "ACR-Username" \
            --value "$acr_username" \
            --output none

        az keyvault secret set \
            --vault-name "$KEY_VAULT_NAME" \
            --name "ACR-Password" \
            --value "$acr_password" \
            --output none

        log SUCCESS "ACR credentials stored in Key Vault"
    fi

    log SUCCESS "Key Vault created: ${KEY_VAULT_NAME}"
}

create_app_insights() {
    log INFO "Creating Application Insights: ${APP_INSIGHTS_NAME}..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would create Application Insights: ${APP_INSIGHTS_NAME}"
        return 0
    fi

    # Check if App Insights exists
    if az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log WARNING "Application Insights ${APP_INSIGHTS_NAME} already exists"
        return 0
    fi

    # Create App Insights
    az monitor app-insights component create \
        --app "$APP_INSIGHTS_NAME" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" \
        --application-type web \
        --kind web \
        --output table

    # Get instrumentation key
    local instrumentation_key
    instrumentation_key=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query instrumentationKey -o tsv)

    log SUCCESS "Application Insights created: ${APP_INSIGHTS_NAME}"
    log INFO "Instrumentation Key: ${instrumentation_key}"

    # Store in Key Vault if exists
    if az keyvault show --name "$KEY_VAULT_NAME" &> /dev/null; then
        az keyvault secret set \
            --vault-name "$KEY_VAULT_NAME" \
            --name "AppInsights-InstrumentationKey" \
            --value "$instrumentation_key" \
            --output none

        log SUCCESS "Instrumentation key stored in Key Vault"
    fi
}

create_storage_account() {
    log INFO "Creating Storage Account: ${STORAGE_ACCOUNT}..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would create Storage Account: ${STORAGE_ACCOUNT}"
        return 0
    fi

    # Check if storage account exists
    if az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log WARNING "Storage Account ${STORAGE_ACCOUNT} already exists"
        return 0
    fi

    # Create storage account
    az storage account create \
        --name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Standard_LRS \
        --kind StorageV2 \
        --access-tier Hot \
        --https-only true \
        --min-tls-version TLS1_2 \
        --output table

    # Enable blob versioning
    az storage account blob-service-properties update \
        --account-name "$STORAGE_ACCOUNT" \
        --enable-versioning true

    log SUCCESS "Storage Account created: ${STORAGE_ACCOUNT}"
}

configure_front_door() {
    log INFO "Configuring Azure Front Door: ${FRONT_DOOR_NAME}..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would configure Front Door: ${FRONT_DOOR_NAME}"
        return 0
    fi

    # Note: Front Door setup requires additional configuration
    # This is a placeholder for Front Door premium features
    log WARNING "Front Door configuration requires manual setup or Azure Portal"
    log INFO "Recommended: Configure Front Door for CDN, WAF, and SSL termination"
}

configure_custom_domain() {
    log INFO "Custom domain configuration..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would configure custom domain"
        return 0
    fi

    log WARNING "Custom domain configuration requires DNS records"
    log INFO "To configure custom domain:"
    log INFO "  1. Add CNAME record pointing to Static Web App URL"
    log INFO "  2. Run: az staticwebapp hostname set --name ${STATIC_WEB_APP_NAME} --hostname <your-domain>"
    log INFO "  3. SSL certificate will be provisioned automatically"
}

print_summary() {
    log SUCCESS "═══════════════════════════════════════════════════════════════"
    log SUCCESS "  INFRASTRUCTURE SETUP COMPLETE"
    log SUCCESS "═══════════════════════════════════════════════════════════════"
    log SUCCESS "  Resource Group:         ${RESOURCE_GROUP}"
    log SUCCESS "  Location:               ${LOCATION}"
    log SUCCESS "  Container Registry:     ${CONTAINER_REGISTRY}.azurecr.io"
    log SUCCESS "  Static Web App:         ${STATIC_WEB_APP_NAME}"
    log SUCCESS "  Key Vault:              ${KEY_VAULT_NAME}"
    log SUCCESS "  App Insights:           ${APP_INSIGHTS_NAME}"
    log SUCCESS "  Storage Account:        ${STORAGE_ACCOUNT}"
    log SUCCESS "═══════════════════════════════════════════════════════════════"
    log SUCCESS "  Log File:               ${LOG_FILE}"
    log SUCCESS "═══════════════════════════════════════════════════════════════"

    echo ""
    log INFO "Next Steps:"
    log INFO "  1. Store deployment token in GitHub Secrets"
    log INFO "  2. Configure custom domain (optional)"
    log INFO "  3. Set up CI/CD pipeline"
    log INFO "  4. Run first deployment: ./scripts/deploy-production.sh"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Setup
    mkdir -p "$LOG_DIR"
    exec > >(tee -a "${LOG_FILE}")
    exec 2>&1

    # Print banner
    print_banner

    # Checks
    check_prerequisites

    # Create resources
    log INFO "Creating Azure infrastructure..."

    create_resource_group
    create_container_registry
    create_static_web_app
    create_key_vault
    create_app_insights
    create_storage_account
    configure_front_door
    configure_custom_domain

    # Summary
    print_summary

    exit 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    cat << EOF
Usage: $0 [OPTIONS]

Azure infrastructure setup for Fleet Management System.

OPTIONS:
    --dry-run           Simulate setup without creating resources
    -h, --help          Show this help message

ENVIRONMENT VARIABLES:
    AZURE_RESOURCE_GROUP         Resource group name
    AZURE_LOCATION               Azure region (default: eastus2)
    AZURE_STATIC_WEB_APP_NAME    Static Web App name
    AZURE_CONTAINER_REGISTRY     Container Registry name
    AZURE_KEY_VAULT_NAME         Key Vault name
    DRY_RUN                      Set to 'true' for dry run

EXAMPLES:
    # Standard setup
    $0

    # Dry run
    $0 --dry-run

EOF
    exit 0
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            log ERROR "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main
main
