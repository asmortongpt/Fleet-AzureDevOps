#!/bin/bash

#############################################################################
# Fleet Management System - Kubernetes Rollback Script
#############################################################################
# This script performs a rollback of the Fleet Management System deployment
#############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if deployment exists
check_deployment() {
    if ! kubectl get deployment fleet-frontend -n fleet-management &> /dev/null; then
        print_error "Deployment fleet-frontend not found in namespace fleet-management"
        exit 1
    fi
}

# Show rollout history
show_history() {
    print_info "Deployment rollout history:"
    echo ""
    kubectl rollout history deployment/fleet-frontend -n fleet-management
    echo ""
}

# Perform rollback
perform_rollback() {
    local revision=$1

    print_warning "Starting rollback..."

    if [ -n "$revision" ]; then
        print_info "Rolling back to revision $revision"
        kubectl rollout undo deployment/fleet-frontend -n fleet-management --to-revision="$revision"
    else
        print_info "Rolling back to previous revision"
        kubectl rollout undo deployment/fleet-frontend -n fleet-management
    fi

    print_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/fleet-frontend -n fleet-management

    print_success "Rollback completed successfully"
}

# Verify rollback
verify_rollback() {
    print_info "Verifying deployment status..."

    # Check pod status
    print_info "Pod status:"
    kubectl get pods -n fleet-management -l app=fleet-frontend

    # Check if pods are ready
    ready_pods=$(kubectl get pods -n fleet-management -l app=fleet-frontend -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)
    total_pods=$(kubectl get pods -n fleet-management -l app=fleet-frontend --no-headers | wc -l)

    echo ""
    print_info "Ready pods: $ready_pods / $total_pods"

    if [ "$ready_pods" -eq "$total_pods" ]; then
        print_success "All pods are ready"
    else
        print_warning "Some pods are not ready. Check pod logs for details."
    fi
}

main() {
    print_info "=========================================="
    print_info "  Fleet Management System Rollback"
    print_info "=========================================="
    echo ""

    check_deployment
    show_history

    # Ask for confirmation
    read -p "Do you want to proceed with rollback? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Rollback cancelled"
        exit 0
    fi

    # Ask for specific revision
    read -p "Enter revision number (or press Enter for previous revision): " revision

    perform_rollback "$revision"

    echo ""
    verify_rollback

    echo ""
    print_success "=========================================="
    print_success "  Rollback completed"
    print_success "=========================================="
    echo ""
    print_info "To view logs:"
    echo "  kubectl logs -f deployment/fleet-frontend -n fleet-management"
    echo ""
}

main "$@"
