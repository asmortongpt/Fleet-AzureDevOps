#!/bin/bash

#############################################################################
# Fleet Management System - Kubernetes Manifest Validation Script
#############################################################################
# This script validates all Kubernetes manifests for syntax and best practices
#############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Validate YAML syntax
validate_yaml() {
    local file=$1
    print_info "Validating YAML syntax: $(basename "$file")"

    if kubectl apply --dry-run=client -f "$file" &> /dev/null; then
        print_success "✓ $(basename "$file") - Valid YAML"
        return 0
    else
        print_error "✗ $(basename "$file") - Invalid YAML"
        kubectl apply --dry-run=client -f "$file"
        return 1
    fi
}

# Validate all manifests
validate_all() {
    local failed=0

    print_info "=========================================="
    print_info "  Validating Kubernetes Manifests"
    print_info "=========================================="
    echo ""

    # Find all YAML files
    for file in "${SCRIPT_DIR}"/*.yaml; do
        if [ -f "$file" ]; then
            if ! validate_yaml "$file"; then
                ((failed++))
            fi
        fi
    done

    echo ""
    if [ $failed -eq 0 ]; then
        print_success "=========================================="
        print_success "  All manifests are valid!"
        print_success "=========================================="
        return 0
    else
        print_error "=========================================="
        print_error "  $failed manifest(s) failed validation"
        print_error "=========================================="
        return 1
    fi
}

# Check for best practices
check_best_practices() {
    print_info "Checking best practices..."
    echo ""

    # Check if namespace is defined
    if grep -q "namespace: fleet-management" "${SCRIPT_DIR}"/*.yaml; then
        print_success "✓ Namespace defined in manifests"
    else
        print_warning "⚠ Namespace not found in manifests"
    fi

    # Check if resource limits are defined
    if grep -q "resources:" "${SCRIPT_DIR}/10-frontend-deployment.yaml"; then
        print_success "✓ Resource limits defined"
    else
        print_warning "⚠ Resource limits not defined"
    fi

    # Check if health probes are defined
    if grep -q "livenessProbe:" "${SCRIPT_DIR}/10-frontend-deployment.yaml"; then
        print_success "✓ Liveness probes defined"
    else
        print_warning "⚠ Liveness probes not defined"
    fi

    if grep -q "readinessProbe:" "${SCRIPT_DIR}/10-frontend-deployment.yaml"; then
        print_success "✓ Readiness probes defined"
    else
        print_warning "⚠ Readiness probes not defined"
    fi

    # Check if security context is defined
    if grep -q "securityContext:" "${SCRIPT_DIR}/10-frontend-deployment.yaml"; then
        print_success "✓ Security context defined"
    else
        print_warning "⚠ Security context not defined"
    fi

    # Check if TLS is configured
    if grep -q "tls:" "${SCRIPT_DIR}/50-ingress.yaml"; then
        print_success "✓ TLS configured for ingress"
    else
        print_warning "⚠ TLS not configured"
    fi

    echo ""
}

main() {
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi

    # Validate all manifests
    validate_all

    # Check best practices
    check_best_practices

    print_info "Validation complete!"
}

main "$@"
