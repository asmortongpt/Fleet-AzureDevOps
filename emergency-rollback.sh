#!/bin/bash

##############################################################################
# EMERGENCY ROLLBACK SCRIPT
# Purpose: Immediately rollback Fleet to last known working state
# Created: 2025-11-24
# Usage: ./emergency-rollback.sh [--image IMAGE_TAG] [--verify-only]
##############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="fleet-production-rg"
CLUSTER_NAME="fleet-aks-cluster"
NAMESPACE="fleet-management"
ACR_NAME="fleetappregistry"

# Default rollback image (most recent production-ready)
DEFAULT_API_IMAGE="fleetappregistry.azurecr.io/fleet-api:v20251120-production-ready"
DEFAULT_APP_IMAGE="fleetappregistry.azurecr.io/fleet-frontend:latest"

# Parse command line arguments
ROLLBACK_IMAGE="${DEFAULT_API_IMAGE}"
VERIFY_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --image)
      ROLLBACK_IMAGE="$2"
      shift 2
      ;;
    --verify-only)
      VERIFY_ONLY=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --image IMAGE_TAG    Specify custom image tag to rollback to"
      echo "  --verify-only        Only verify current state, don't rollback"
      echo "  --help               Show this help message"
      echo ""
      echo "Default rollback image: ${DEFAULT_API_IMAGE}"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

##############################################################################
# Helper Functions
##############################################################################

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

wait_for_rollout() {
    local deployment=$1
    local timeout=${2:-300}

    log_info "Waiting for deployment/${deployment} to complete (timeout: ${timeout}s)..."
    if kubectl rollout status deployment/${deployment} -n ${NAMESPACE} --timeout=${timeout}s; then
        log_success "Deployment ${deployment} rolled out successfully"
        return 0
    else
        log_error "Deployment ${deployment} failed to rollout"
        return 1
    fi
}

check_pod_health() {
    local app_label=$1
    local expected_replicas=${2:-3}

    log_info "Checking health of pods with label app=${app_label}..."

    local ready_pods=$(kubectl get pods -n ${NAMESPACE} -l app=${app_label} \
        --field-selector=status.phase=Running \
        --no-headers 2>/dev/null | wc -l | tr -d ' ')

    if [[ ${ready_pods} -ge ${expected_replicas} ]]; then
        log_success "${ready_pods}/${expected_replicas} pods are running"
        return 0
    else
        log_warning "Only ${ready_pods}/${expected_replicas} pods are running"
        return 1
    fi
}

test_health_endpoint() {
    local deployment=$1
    local port=${2:-3001}
    local path=${3:-/api/v1/health}

    log_info "Testing health endpoint for ${deployment}..."

    if kubectl exec -n ${NAMESPACE} deployment/${deployment} -- \
        wget -qO- http://localhost:${port}${path} >/dev/null 2>&1; then
        log_success "Health endpoint responding"
        return 0
    else
        log_warning "Health endpoint not responding (may still be starting)"
        return 1
    fi
}

##############################################################################
# Pre-flight Checks
##############################################################################

pre_flight_checks() {
    log_info "Running pre-flight checks..."

    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check if az CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not found. Please install az CLI."
        exit 1
    fi

    # Check if logged into Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Run: az login"
        exit 1
    fi

    log_success "Pre-flight checks passed"
}

##############################################################################
# Verify Current State
##############################################################################

verify_current_state() {
    log_info "==================================================================="
    log_info "CURRENT STATE VERIFICATION"
    log_info "==================================================================="

    # Get AKS credentials
    log_info "Connecting to AKS cluster..."
    az aks get-credentials \
        --resource-group ${RESOURCE_GROUP} \
        --name ${CLUSTER_NAME} \
        --overwrite-existing \
        &> /dev/null

    log_success "Connected to ${CLUSTER_NAME}"

    # Check namespace exists
    if ! kubectl get namespace ${NAMESPACE} &> /dev/null; then
        log_error "Namespace ${NAMESPACE} does not exist"
        exit 1
    fi

    # Check current API deployment
    log_info "Current API deployment state:"
    kubectl get deployment fleet-api -n ${NAMESPACE} -o wide || true

    local current_api_image=$(kubectl get deployment fleet-api -n ${NAMESPACE} \
        -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "NOT FOUND")
    log_info "Current API image: ${current_api_image}"

    local current_api_replicas=$(kubectl get deployment fleet-api -n ${NAMESPACE} \
        -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    log_info "Current API replicas: ${current_api_replicas}"

    # Check current APP deployment
    log_info "Current APP deployment state:"
    kubectl get deployment fleet-app -n ${NAMESPACE} -o wide || true

    local current_app_image=$(kubectl get deployment fleet-app -n ${NAMESPACE} \
        -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "NOT FOUND")
    log_info "Current APP image: ${current_app_image}"

    # Check pods
    log_info "Current pods:"
    kubectl get pods -n ${NAMESPACE} -l app=fleet-api || true
    kubectl get pods -n ${NAMESPACE} -l app=fleet-app || true

    # Check recent events
    log_info "Recent events (last 10):"
    kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' | tail -10 || true

    log_info "==================================================================="
}

##############################################################################
# Rollback Execution
##############################################################################

execute_rollback() {
    log_info "==================================================================="
    log_info "EXECUTING EMERGENCY ROLLBACK"
    log_info "==================================================================="
    log_info "Target image: ${ROLLBACK_IMAGE}"
    log_info "Target replicas: 3"
    log_info "==================================================================="

    # Confirm rollback
    read -p "$(echo -e ${YELLOW}Are you sure you want to rollback? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Rollback cancelled by user"
        exit 0
    fi

    log_info "Starting rollback at $(date)"

    # Step 1: Update API image
    log_info "Step 1/4: Updating API image to ${ROLLBACK_IMAGE}..."
    if kubectl set image deployment/fleet-api \
        fleet-api=${ROLLBACK_IMAGE} \
        -n ${NAMESPACE}; then
        log_success "API image updated"
    else
        log_error "Failed to update API image"
        exit 1
    fi

    # Step 2: Scale up API
    log_info "Step 2/4: Scaling API to 3 replicas..."
    if kubectl scale deployment/fleet-api --replicas=3 -n ${NAMESPACE}; then
        log_success "API scaled to 3 replicas"
    else
        log_error "Failed to scale API"
        exit 1
    fi

    # Step 3: Wait for rollout
    log_info "Step 3/4: Waiting for rollout to complete..."
    if ! wait_for_rollout "fleet-api" 300; then
        log_error "Rollout failed. Checking pod status..."
        kubectl get pods -n ${NAMESPACE} -l app=fleet-api
        kubectl describe pods -n ${NAMESPACE} -l app=fleet-api | tail -50
        exit 1
    fi

    # Step 4: Verify health
    log_info "Step 4/4: Verifying application health..."
    sleep 10  # Give pods time to fully start

    if ! check_pod_health "fleet-api" 3; then
        log_warning "Not all pods are healthy, checking logs..."
        kubectl logs -n ${NAMESPACE} -l app=fleet-api --tail=20
    fi

    # Test health endpoint (non-fatal)
    test_health_endpoint "fleet-api" 3001 "/api/v1/health" || true

    log_success "==================================================================="
    log_success "ROLLBACK COMPLETED SUCCESSFULLY"
    log_success "==================================================================="
}

##############################################################################
# Post-Rollback Verification
##############################################################################

post_rollback_verification() {
    log_info "==================================================================="
    log_info "POST-ROLLBACK VERIFICATION"
    log_info "==================================================================="

    # Check deployment status
    log_info "Deployment status:"
    kubectl get deployment fleet-api -n ${NAMESPACE}
    kubectl get deployment fleet-app -n ${NAMESPACE}

    # Check pod status
    log_info "Pod status:"
    kubectl get pods -n ${NAMESPACE} -l app=fleet-api
    kubectl get pods -n ${NAMESPACE} -l app=fleet-app

    # Check recent logs for errors
    log_info "Checking for errors in recent logs..."
    if kubectl logs -n ${NAMESPACE} -l app=fleet-api --tail=50 | grep -i error; then
        log_warning "Errors found in logs (review above)"
    else
        log_success "No errors found in recent logs"
    fi

    # Check services
    log_info "Service status:"
    kubectl get svc -n ${NAMESPACE} | grep fleet || true

    # Check ingress
    log_info "Ingress status:"
    kubectl get ingress -n ${NAMESPACE} || true

    log_info "==================================================================="
    log_info "VERIFICATION CHECKLIST:"
    log_info "==================================================================="
    log_info "[ ] API pods running (3/3)"
    log_info "[ ] Frontend pods running"
    log_info "[ ] Health endpoint responding"
    log_info "[ ] Web UI loads (https://fleet.capitaltechalliance.com)"
    log_info "[ ] Login flow works"
    log_info "[ ] No error logs"
    log_info "==================================================================="
}

##############################################################################
# Quick Rollback Alternatives
##############################################################################

show_alternatives() {
    log_info "==================================================================="
    log_info "ALTERNATIVE ROLLBACK OPTIONS"
    log_info "==================================================================="
    log_info "1. Most recent production: v20251120-production-ready (CURRENT DEFAULT)"
    log_info "2. Clean build version:    v6.3-clean-build"
    log_info "3. Stable production:      v5.0-production"
    log_info "4. Staging working:        v3.1-sso"
    log_info ""
    log_info "To use alternative:"
    log_info "  ./emergency-rollback.sh --image fleetappregistry.azurecr.io/fleet-api:v6.3-clean-build"
    log_info "==================================================================="
}

##############################################################################
# Main Execution
##############################################################################

main() {
    echo -e "${GREEN}"
    echo "=================================================================="
    echo "  FLEET EMERGENCY ROLLBACK SCRIPT"
    echo "  Created: 2025-11-24"
    echo "=================================================================="
    echo -e "${NC}"

    pre_flight_checks
    verify_current_state

    if [[ "${VERIFY_ONLY}" == true ]]; then
        log_info "Verify-only mode. Skipping rollback."
        show_alternatives
        exit 0
    fi

    execute_rollback
    post_rollback_verification

    log_success "Rollback completed at $(date)"
    log_info "Review the verification checklist above"
    log_info "Check application at: https://fleet.capitaltechalliance.com"
}

# Run main function
main "$@"
