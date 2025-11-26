#!/bin/bash

#############################################################################
# Fleet Management System - Kubernetes Deployment Script
#############################################################################
# This script deploys the Fleet Management System to a Kubernetes cluster
# It applies manifests in the correct order and validates each step
#############################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored output
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

# Function to check if kubectl is installed
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    print_success "kubectl is installed"
}

# Function to check cluster connectivity
check_cluster() {
    print_info "Checking cluster connectivity..."
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please configure kubectl."
        exit 1
    fi
    print_success "Connected to cluster: $(kubectl config current-context)"
}

# Function to create namespace
create_namespace() {
    print_info "Creating namespace..."
    kubectl apply -f "${SCRIPT_DIR}/00-namespace.yaml"
    print_success "Namespace created"
}

# Function to create ACR image pull secret
create_acr_secret() {
    print_info "Checking for ACR image pull secret..."

    if kubectl get secret acr-secret -n fleet-management &> /dev/null; then
        print_warning "ACR secret already exists. Skipping creation."
        return 0
    fi

    print_warning "ACR secret not found!"
    print_info "You need to create the ACR secret manually:"
    echo ""
    echo "kubectl create secret docker-registry acr-secret \\"
    echo "  --namespace=fleet-management \\"
    echo "  --docker-server=fleetappregistry.azurecr.io \\"
    echo "  --docker-username=<your-acr-username> \\"
    echo "  --docker-password=<your-acr-password>"
    echo ""

    read -p "Have you created the ACR secret? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cannot continue without ACR secret"
        exit 1
    fi
}

# Function to apply configuration
apply_configmap() {
    print_info "Applying ConfigMap..."
    kubectl apply -f "${SCRIPT_DIR}/30-configmap.yaml"
    print_success "ConfigMap applied"
}

# Function to apply secrets
apply_secrets() {
    print_info "Applying Secrets..."
    kubectl apply -f "${SCRIPT_DIR}/40-secret.yaml"
    print_success "Secrets applied"
}

# Function to apply cert-manager issuer
apply_cert_issuer() {
    print_info "Applying cert-manager ClusterIssuer..."

    # Check if cert-manager is installed
    if ! kubectl get crd clusterissuers.cert-manager.io &> /dev/null; then
        print_warning "cert-manager CRDs not found. Skipping ClusterIssuer creation."
        print_info "Install cert-manager first: kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml"
        return 0
    fi

    kubectl apply -f "${SCRIPT_DIR}/90-cert-manager-issuer.yaml"
    print_success "ClusterIssuer applied"
}

# Function to deploy frontend
deploy_frontend() {
    print_info "Deploying frontend..."
    kubectl apply -f "${SCRIPT_DIR}/10-frontend-deployment.yaml"
    print_success "Frontend deployment created"
}

# Function to create service
create_service() {
    print_info "Creating service..."
    kubectl apply -f "${SCRIPT_DIR}/20-frontend-service.yaml"
    print_success "Service created"
}

# Function to apply network policy
apply_network_policy() {
    print_info "Applying network policy..."
    kubectl apply -f "${SCRIPT_DIR}/60-network-policy.yaml"
    print_success "Network policy applied"
}

# Function to apply HPA
apply_hpa() {
    print_info "Applying Horizontal Pod Autoscaler..."
    kubectl apply -f "${SCRIPT_DIR}/70-horizontal-pod-autoscaler.yaml"
    print_success "HPA applied"
}

# Function to apply PDB
apply_pdb() {
    print_info "Applying Pod Disruption Budget..."
    kubectl apply -f "${SCRIPT_DIR}/80-pod-disruption-budget.yaml"
    print_success "PDB applied"
}

# Function to apply ingress
apply_ingress() {
    print_info "Applying ingress..."
    kubectl apply -f "${SCRIPT_DIR}/50-ingress.yaml"
    print_success "Ingress applied"
}

# Function to wait for deployment
wait_for_deployment() {
    print_info "Waiting for deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s \
        deployment/fleet-frontend -n fleet-management
    print_success "Deployment is ready"
}

# Function to check pod status
check_pods() {
    print_info "Checking pod status..."
    kubectl get pods -n fleet-management -l app=fleet-frontend
}

# Function to get service details
get_service_info() {
    print_info "Service details:"
    kubectl get svc -n fleet-management fleet-frontend
}

# Function to get ingress details
get_ingress_info() {
    print_info "Ingress details:"
    kubectl get ingress -n fleet-management fleet-frontend-ingress
}

# Function to show deployment summary
show_summary() {
    echo ""
    print_success "=========================================="
    print_success "   DEPLOYMENT COMPLETED SUCCESSFULLY"
    print_success "=========================================="
    echo ""
    print_info "Namespace: fleet-management"
    print_info "Application URL: https://fleet.capitaltechalliance.com"
    echo ""
    print_info "To check deployment status:"
    echo "  kubectl get all -n fleet-management"
    echo ""
    print_info "To view logs:"
    echo "  kubectl logs -f deployment/fleet-frontend -n fleet-management"
    echo ""
    print_info "To check ingress status:"
    echo "  kubectl describe ingress fleet-frontend-ingress -n fleet-management"
    echo ""
}

#############################################################################
# Main Deployment Flow
#############################################################################

main() {
    print_info "=========================================="
    print_info "  Fleet Management System Deployment"
    print_info "=========================================="
    echo ""

    # Pre-flight checks
    check_kubectl
    check_cluster

    # Create namespace
    create_namespace

    # Create ACR secret
    create_acr_secret

    # Apply cert-manager issuer (optional)
    apply_cert_issuer

    # Apply configuration and secrets
    apply_configmap
    apply_secrets

    # Deploy application
    deploy_frontend
    create_service

    # Apply policies
    apply_network_policy
    apply_hpa
    apply_pdb

    # Create ingress
    apply_ingress

    # Wait for deployment
    wait_for_deployment

    # Show status
    echo ""
    check_pods
    echo ""
    get_service_info
    echo ""
    get_ingress_info
    echo ""

    # Show summary
    show_summary
}

# Run main function
main "$@"
