#!/bin/bash
# ============================================================================
# Fleet Kubernetes Deployment Script
# Deploys Fleet-Clean to Kubernetes cluster with emulators enabled
# ============================================================================

set -e

# Configuration
REGISTRY="${REGISTRY:-fleetregistry2025.azurecr.io}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"
NAMESPACE="${NAMESPACE:-fleet-management}"
CONTEXT="${CONTEXT:-fleet-aks-cluster}"

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
# Check Prerequisites
# ============================================================================
check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found"
        exit 1
    fi

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found"
        exit 1
    fi

    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not found"
        exit 1
    fi

    # Check kubectl context
    CURRENT_CONTEXT=$(kubectl config current-context)
    if [ "$CURRENT_CONTEXT" != "$CONTEXT" ]; then
        log_warning "Current context: $CURRENT_CONTEXT (expected: $CONTEXT)"
        log_info "Switching context to $CONTEXT..."
        kubectl config use-context $CONTEXT
    fi

    log_success "All prerequisites met"
}

# ============================================================================
# Login to Azure Container Registry
# ============================================================================
login_acr() {
    log_step "Logging in to Azure Container Registry..."

    az acr login --name ${REGISTRY%%.*}

    log_success "Logged in to $REGISTRY"
}

# ============================================================================
# Build Docker Images
# ============================================================================
build_images() {
    log_step "Building Docker images..."

    # Build API
    log_info "Building fleet-api image..."
    docker build \
        -t $REGISTRY/fleet-api:$IMAGE_TAG \
        -t $REGISTRY/fleet-api:latest \
        -f Dockerfile \
        --build-arg NODE_ENV=production \
        --build-arg EMULATOR_ENABLED=true \
        ./api

    # Build Frontend
    log_info "Building fleet-frontend image..."
    docker build \
        -t $REGISTRY/fleet-frontend:$IMAGE_TAG \
        -t $REGISTRY/fleet-frontend:latest \
        -f Dockerfile \
        --build-arg VITE_API_URL=https://fleet.capitaltechalliance.com/api \
        --build-arg VITE_USE_MOCK_DATA=false \
        .

    log_success "Images built successfully"
}

# ============================================================================
# Push Docker Images
# ============================================================================
push_images() {
    log_step "Pushing images to registry..."

    docker push $REGISTRY/fleet-api:$IMAGE_TAG
    docker push $REGISTRY/fleet-api:latest
    docker push $REGISTRY/fleet-frontend:$IMAGE_TAG
    docker push $REGISTRY/fleet-frontend:latest

    log_success "Images pushed to $REGISTRY"
}

# ============================================================================
# Update Kubernetes Deployments
# ============================================================================
update_kubernetes() {
    log_step "Updating Kubernetes deployments..."

    # Update API deployment with emulator configuration
    kubectl set image deployment/fleet-api \
        fleet-api=$REGISTRY/fleet-api:$IMAGE_TAG \
        -n $NAMESPACE

    # Add/update emulator environment variables
    kubectl set env deployment/fleet-api \
        EMULATOR_ENABLED=true \
        EMULATOR_AUTO_START=false \
        EMULATOR_VEHICLE_COUNT=48 \
        EMULATOR_TIME_COMPRESSION=60 \
        EMULATOR_UPDATE_INTERVAL=1000 \
        EMULATOR_WEBSOCKET_ENABLED=true \
        EMULATOR_WEBSOCKET_PORT=3004 \
        -n $NAMESPACE

    # Update frontend deployment
    kubectl set image deployment/fleet-frontend \
        frontend=$REGISTRY/fleet-frontend:$IMAGE_TAG \
        -n $NAMESPACE

    log_success "Kubernetes deployments updated"
}

# ============================================================================
# Wait for Rollout
# ============================================================================
wait_for_rollout() {
    log_step "Waiting for deployment rollout..."

    kubectl rollout status deployment/fleet-api -n $NAMESPACE --timeout=5m
    kubectl rollout status deployment/fleet-frontend -n $NAMESPACE --timeout=5m

    log_success "Rollout completed successfully"
}

# ============================================================================
# Start Emulators
# ============================================================================
start_emulators() {
    log_step "Starting emulators..."

    sleep 10  # Wait for pods to be fully ready

    # Get API pod
    API_POD=$(kubectl get pods -n $NAMESPACE -l app=fleet-api -o jsonpath='{.items[0].metadata.name}')

    log_info "API Pod: $API_POD"

    # Start emulators via API
    log_info "Activating emulators..."

    curl -X POST https://fleet.capitaltechalliance.com/api/emulator/start \
        -H "Content-Type: application/json" \
        -d '{"count": 48}' \
        -s | jq '.'

    log_success "Emulators started"
}

# ============================================================================
# Verify Deployment
# ============================================================================
verify_deployment() {
    log_step "Verifying deployment..."

    # Check API health
    log_info "Checking API health..."
    HEALTH=$(curl -s https://fleet.capitaltechalliance.com/api/health)
    if echo "$HEALTH" | jq -e '.status == "healthy"' > /dev/null; then
        log_success "API is healthy"
    else
        log_error "API health check failed"
        return 1
    fi

    # Check emulator status
    log_info "Checking emulator status..."
    STATUS=$(curl -s https://fleet.capitaltechalliance.com/api/emulator/status)
    IS_RUNNING=$(echo "$STATUS" | jq -r '.data.isRunning')

    if [ "$IS_RUNNING" = "true" ]; then
        VEHICLE_COUNT=$(echo "$STATUS" | jq -r '.data.stats.totalVehicles')
        log_success "Emulators running with $VEHICLE_COUNT vehicles"
    else
        log_warning "Emulators not running yet"
    fi

    # Check pods
    log_info "Checking pod status..."
    kubectl get pods -n $NAMESPACE

    log_success "Deployment verification complete"
}

# ============================================================================
# Display Summary
# ============================================================================
display_summary() {
    echo ""
    echo "=========================================="
    echo "  Kubernetes Deployment Summary"
    echo "=========================================="
    echo ""
    echo "Registry:     $REGISTRY"
    echo "Image Tag:    $IMAGE_TAG"
    echo "Namespace:    $NAMESPACE"
    echo "Context:      $CONTEXT"
    echo ""
    echo "URLs:"
    echo "  Frontend:   https://fleet.capitaltechalliance.com"
    echo "  API:        https://fleet.capitaltechalliance.com/api"
    echo "  Health:     https://fleet.capitaltechalliance.com/api/health"
    echo "  Emulators:  https://fleet.capitaltechalliance.com/api/emulator/status"
    echo ""
    log_success "🎉 Deployment complete!"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================
main() {
    echo ""
    log_step "Fleet Kubernetes Deployment"
    log_info "Registry: $REGISTRY"
    log_info "Tag: $IMAGE_TAG"
    log_info "Namespace: $NAMESPACE"
    echo ""

    check_prerequisites
    login_acr
    build_images
    push_images
    update_kubernetes
    wait_for_rollout
    start_emulators
    verify_deployment
    display_summary
}

# Handle arguments
case "${1:-}" in
    --skip-build)
        log_info "Skipping build step"
        check_prerequisites
        login_acr
        push_images
        update_kubernetes
        wait_for_rollout
        start_emulators
        verify_deployment
        display_summary
        ;;
    --emulators-only)
        log_info "Starting emulators only"
        start_emulators
        ;;
    --help)
        cat << EOF
Fleet Kubernetes Deployment Script

Usage: $0 [OPTIONS]

Options:
  --skip-build       Skip building images (use existing)
  --emulators-only   Only start emulators
  --help             Show this help

Environment Variables:
  REGISTRY           Container registry (default: fleetregistry2025.azurecr.io)
  IMAGE_TAG          Docker image tag (default: timestamp)
  NAMESPACE          Kubernetes namespace (default: fleet-management)
  CONTEXT            kubectl context (default: fleet-aks-cluster)

Examples:
  # Full deployment
  ./scripts/deploy-kubernetes.sh

  # Skip build (use existing images)
  ./scripts/deploy-kubernetes.sh --skip-build

  # Start emulators only
  ./scripts/deploy-kubernetes.sh --emulators-only

  # Custom tag
  IMAGE_TAG=v1.2.3 ./scripts/deploy-kubernetes.sh

EOF
        ;;
    *)
        main
        ;;
esac
