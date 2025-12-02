#!/bin/bash
# Install cert-manager for automatic SSL/TLS certificate management

set -euo pipefail

# Configuration
CERT_MANAGER_VERSION="v1.13.0"
NAMESPACE="cert-manager"

echo "Installing cert-manager ${CERT_MANAGER_VERSION}..."

# Create namespace
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Install cert-manager CRDs
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.crds.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml

# Wait for cert-manager to be ready
echo "Waiting for cert-manager to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n ${NAMESPACE} --timeout=5m

# Verify installation
echo "Verifying cert-manager installation..."
kubectl get pods -n ${NAMESPACE}

# Create ClusterIssuers
echo "Creating ClusterIssuers for Let's Encrypt..."
kubectl apply -f /home/user/Fleet/k8s/ingress.yaml

echo "cert-manager installed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your DNS records to point to the ingress controller"
echo "2. Create Certificate resources for your domains"
echo "3. Verify certificates are issued: kubectl get certificates -n ctafleet"
