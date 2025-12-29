#!/usr/bin/env bash
# ==============================================================================
# Fleet Management System - Azure Production Deployment Script
# ==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
LOCATION="${2:-eastus}"
RESOURCE_GROUP="fleet-${ENVIRONMENT}-rg"
DEPLOYMENT_NAME="fleet-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"

# Functions
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

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi

    # Check if logged in
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi

    # Check if Bicep is installed
    if ! az bicep version &> /dev/null; then
        log_warning "Bicep not found. Installing..."
        az bicep install
    fi

    log_success "Prerequisites check passed"
}

create_resource_group() {
    log_info "Creating resource group: $RESOURCE_GROUP in $LOCATION..."

    if az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags Environment="$ENVIRONMENT" Application="Fleet Management" \
        &> /dev/null; then
        log_success "Resource group created"
    else
        log_warning "Resource group already exists or creation failed"
    fi
}

validate_template() {
    log_info "Validating Bicep template..."

    if az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file deploy-production.bicep \
        --parameters "@parameters-${ENVIRONMENT}.json" \
        &> /dev/null; then
        log_success "Template validation passed"
    else
        log_error "Template validation failed"
        exit 1
    fi
}

deploy_infrastructure() {
    log_info "Deploying infrastructure..."
    log_info "Deployment name: $DEPLOYMENT_NAME"

    az deployment group create \
        --name "$DEPLOYMENT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --template-file deploy-production.bicep \
        --parameters "@parameters-${ENVIRONMENT}.json" \
        --output json \
        > deployment-output.json

    if [ $? -eq 0 ]; then
        log_success "Infrastructure deployment completed"
    else
        log_error "Infrastructure deployment failed"
        exit 1
    fi
}

extract_outputs() {
    log_info "Extracting deployment outputs..."

    WEB_APP_URL=$(jq -r '.properties.outputs.webAppUrl.value' deployment-output.json)
    CDN_URL=$(jq -r '.properties.outputs.cdnUrl.value' deployment-output.json)
    DB_SERVER=$(jq -r '.properties.outputs.dbServerFqdn.value' deployment-output.json)
    APP_INSIGHTS_KEY=$(jq -r '.properties.outputs.appInsightsInstrumentationKey.value' deployment-output.json)
    KEY_VAULT_URI=$(jq -r '.properties.outputs.keyVaultUri.value' deployment-output.json)

    log_success "Deployment outputs extracted"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "                    DEPLOYMENT OUTPUTS"
    echo "═══════════════════════════════════════════════════════════════"
    echo "Web App URL:         $WEB_APP_URL"
    echo "CDN URL:             $CDN_URL"
    echo "Database Server:     $DB_SERVER"
    echo "Key Vault:           $KEY_VAULT_URI"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    # Save to .env file
    cat > "../.env.${ENVIRONMENT}" <<EOF
# Fleet Management System - ${ENVIRONMENT} Environment
# Generated: $(date)

WEB_APP_URL=${WEB_APP_URL}
CDN_URL=${CDN_URL}
DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@${DB_SERVER}/fleetdb?sslmode=require
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=${APP_INSIGHTS_KEY}
KEY_VAULT_URL=${KEY_VAULT_URI}
NODE_ENV=production
EOF

    log_success "Environment variables saved to .env.${ENVIRONMENT}"
}

configure_key_vault_access() {
    log_info "Configuring Key Vault access policies..."

    PRINCIPAL_ID=$(jq -r '.properties.outputs.webAppIdentityPrincipalId.value' deployment-output.json)
    KEY_VAULT_NAME="fleet-${ENVIRONMENT}-kv"

    az keyvault set-policy \
        --name "$KEY_VAULT_NAME" \
        --object-id "$PRINCIPAL_ID" \
        --secret-permissions get list \
        &> /dev/null

    log_success "Key Vault access configured"
}

run_database_migrations() {
    log_info "Database migrations should be run manually after deployment"
    log_info "Run: npm run migrate:deploy"
}

setup_ci_cd() {
    log_info "Setting up GitHub Actions for CI/CD..."

    # Get publish profile
    WEB_APP_NAME="fleet-${ENVIRONMENT}-app"

    az webapp deployment list-publishing-profiles \
        --name "$WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --xml \
        > publish-profile.xml

    log_info "Publish profile saved to publish-profile.xml"
    log_info "Add this as a GitHub secret named AZURE_WEBAPP_PUBLISH_PROFILE"
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Wait for app to be ready
    sleep 10

    if curl -s -o /dev/null -w "%{http_code}" "$WEB_APP_URL" | grep -q "200\|301\|302"; then
        log_success "Web app is responding"
    else
        log_warning "Web app health check failed - may still be starting up"
    fi
}

cleanup_on_error() {
    log_error "Deployment failed. Check logs above for details."
    log_info "To clean up, run: az group delete --name $RESOURCE_GROUP --yes"
    exit 1
}

# Main deployment flow
main() {
    echo "═══════════════════════════════════════════════════════════════"
    echo "         Fleet Management System - Azure Deployment"
    echo "═══════════════════════════════════════════════════════════════"
    echo "Environment:     $ENVIRONMENT"
    echo "Location:        $LOCATION"
    echo "Resource Group:  $RESOURCE_GROUP"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    check_prerequisites || cleanup_on_error
    create_resource_group || cleanup_on_error
    validate_template || cleanup_on_error
    deploy_infrastructure || cleanup_on_error
    extract_outputs || cleanup_on_error
    configure_key_vault_access || cleanup_on_error
    setup_ci_cd || cleanup_on_error
    verify_deployment

    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure GitHub secrets for CI/CD"
    echo "2. Run database migrations: npm run migrate:deploy"
    echo "3. Deploy application code via GitHub Actions or manual publish"
    echo "4. Configure custom domain and SSL certificate"
    echo "5. Set up monitoring alerts in Azure Monitor"
    echo ""
}

# Trap errors
trap cleanup_on_error ERR

# Run deployment
main
