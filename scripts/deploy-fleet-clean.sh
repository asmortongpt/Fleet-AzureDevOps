#!/bin/bash
# ============================================================================
# Fleet-Clean Full Production Deployment Script
# Deploys frontend, backend, and activates all emulators
# ============================================================================

set -e  # Exit on error

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-fleet-production-rg}"
LOCATION="${LOCATION:-eastus2}"
STATIC_WEB_APP_NAME="${STATIC_WEB_APP_NAME:-fleet-clean-prod}"
API_BASE_URL="${API_BASE_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"
DEPLOYMENT_TOKEN="${AZURE_STATIC_WEB_APPS_API_TOKEN}"
VEHICLE_COUNT="${VEHICLE_COUNT:-50}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${PURPLE}🚀 $1${NC}"; }

# ============================================================================
# Step 1: Prerequisites Check
# ============================================================================
check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not found. Install from: https://aka.ms/installazurecli"
        exit 1
    fi

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Install from: https://nodejs.org"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm not found"
        exit 1
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        log_warning "jq not found - JSON parsing may be limited"
    fi

    # Check Azure login
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Run: az login"
        exit 1
    fi

    log_success "All prerequisites met"
}

# ============================================================================
# Step 2: Build Application
# ============================================================================
build_application() {
    log_step "Building Fleet-Clean application..."

    # Install dependencies
    log_info "Installing dependencies..."
    npm ci

    # Build frontend
    log_info "Building frontend..."
    npm run build

    # Build API
    log_info "Building API..."
    cd api
    npm ci
    npm run build
    cd ..

    log_success "Application built successfully"
}

# ============================================================================
# Step 3: Deploy to Azure Static Web Apps
# ============================================================================
deploy_static_web_app() {
    log_step "Deploying to Azure Static Web Apps..."

    # Check if deployment token is set
    if [ -z "$DEPLOYMENT_TOKEN" ]; then
        log_error "AZURE_STATIC_WEB_APPS_API_TOKEN not set"
        log_info "Get token from: Azure Portal → Static Web Apps → $STATIC_WEB_APP_NAME → Manage deployment token"
        exit 1
    fi

    # Deploy using SWA CLI
    if command -v swa &> /dev/null; then
        log_info "Deploying with SWA CLI..."
        swa deploy \
            --app-location . \
            --api-location api \
            --output-location dist \
            --deployment-token "$DEPLOYMENT_TOKEN"
    else
        log_warning "SWA CLI not found, using manual deployment"
        log_info "Install with: npm install -g @azure/static-web-apps-cli"

        # Manual deployment using Azure CLI
        az staticwebapp update \
            --name "$STATIC_WEB_APP_NAME" \
            --resource-group "$RESOURCE_GROUP"
    fi

    log_success "Deployment to Static Web Apps complete"
}

# ============================================================================
# Step 4: Configure Environment Variables
# ============================================================================
configure_environment() {
    log_step "Configuring production environment..."

    # Set application settings
    az staticwebapp appsettings set \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --setting-names \
            NODE_ENV=production \
            EMULATOR_ENABLED=true \
            EMULATOR_AUTO_START=false \
            EMULATOR_VEHICLE_COUNT="$VEHICLE_COUNT" \
            GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY"

    log_success "Environment configured"
}

# ============================================================================
# Step 5: Health Check
# ============================================================================
health_check() {
    log_step "Running health checks..."

    MAX_RETRIES=10
    RETRY_DELAY=10

    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s "$API_BASE_URL/api/health" | grep -q "healthy"; then
            log_success "API health check passed"
            return 0
        else
            log_warning "API not ready, retry $i/$MAX_RETRIES..."
            sleep $RETRY_DELAY
        fi
    done

    log_error "API health check failed"
    return 1
}

# ============================================================================
# Step 6: Start Emulators
# ============================================================================
start_emulators() {
    log_step "Starting fleet emulators..."

    # Use the dedicated emulator deployment script
    export API_BASE_URL="$API_BASE_URL/api"
    export VEHICLE_COUNT="$VEHICLE_COUNT"

    if [ -f "./scripts/deploy-production-emulators.sh" ]; then
        bash ./scripts/deploy-production-emulators.sh
    else
        log_warning "Emulator script not found, starting manually..."

        curl -X POST "$API_BASE_URL/api/emulator/start" \
            -H "Content-Type: application/json" \
            -d "{\"count\": $VEHICLE_COUNT}"
    fi

    log_success "Emulators started"
}

# ============================================================================
# Step 7: Post-Deployment Validation
# ============================================================================
validate_deployment() {
    log_step "Validating deployment..."

    # Test frontend
    if curl -f -s "$API_BASE_URL" > /dev/null; then
        log_success "Frontend is accessible"
    else
        log_error "Frontend validation failed"
        return 1
    fi

    # Test API
    if curl -f -s "$API_BASE_URL/api/health" | grep -q "healthy"; then
        log_success "API is healthy"
    else
        log_error "API validation failed"
        return 1
    fi

    # Test emulators
    EMULATOR_STATUS=$(curl -s "$API_BASE_URL/api/emulator/status" | jq -r '.isRunning' 2>/dev/null)
    if [ "$EMULATOR_STATUS" = "true" ]; then
        log_success "Emulators are running"
    else
        log_warning "Emulators may not be running"
    fi

    log_success "Deployment validation complete"
}

# ============================================================================
# Step 8: Display Deployment Summary
# ============================================================================
display_summary() {
    echo ""
    echo "=========================================="
    echo "  Fleet-Clean Production Deployment"
    echo "=========================================="
    echo ""
    echo "Frontend URL:    $API_BASE_URL"
    echo "API URL:         $API_BASE_URL/api"
    echo "Health Check:    $API_BASE_URL/api/health"
    echo "Emulator Status: $API_BASE_URL/api/emulator/status"
    echo "Fleet Overview:  $API_BASE_URL/api/emulator/fleet/overview"
    echo ""
    echo "Active Emulators: $VEHICLE_COUNT vehicles"
    echo ""
    log_success "🎉 Fleet-Clean deployed successfully!"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================
main() {
    echo ""
    log_step "Fleet-Clean Production Deployment"
    log_info "Target: $API_BASE_URL"
    log_info "Vehicle Count: $VEHICLE_COUNT"
    echo ""

    check_prerequisites
    build_application
    deploy_static_web_app
    configure_environment
    health_check
    start_emulators
    validate_deployment
    display_summary
}

# Handle script arguments
case "${1:-}" in
    --skip-build)
        log_info "Skipping build step"
        check_prerequisites
        deploy_static_web_app
        configure_environment
        health_check
        start_emulators
        validate_deployment
        display_summary
        ;;
    --emulators-only)
        log_info "Starting emulators only"
        start_emulators
        ;;
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --skip-build       Skip build step (use existing build)"
        echo "  --emulators-only   Only start emulators (skip deployment)"
        echo "  --help             Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  RESOURCE_GROUP                    Azure resource group name"
        echo "  STATIC_WEB_APP_NAME               Azure Static Web App name"
        echo "  API_BASE_URL                      Production API URL"
        echo "  AZURE_STATIC_WEB_APPS_API_TOKEN  Deployment token"
        echo "  VEHICLE_COUNT                     Number of vehicles to emulate"
        echo "  GOOGLE_MAPS_API_KEY              Google Maps API key"
        ;;
    *)
        main
        ;;
esac
