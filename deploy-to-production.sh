#!/bin/bash
###############################################################################
# Fleet Production Deployment Script
# Builds and deploys Fleet application to Azure Kubernetes Service
###############################################################################

set -e

echo "🚀 Fleet Production Deployment"
echo "=============================================="

# Configuration
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REGISTRY="fleetregistry2025.azurecr.io"
IMAGE_NAME="fleet-frontend"
NAMESPACE="fleet-management"
DEPLOYMENT="fleet-frontend"

# Step 1: Build production frontend
echo ""
echo "📦 Building frontend..."
npm run build

# Step 2: Build Docker image
echo ""
echo "🐳 Building Docker image..."
docker build -f Dockerfile.frontend \
  -t ${REGISTRY}/${IMAGE_NAME}:${TIMESTAMP} \
  -t ${REGISTRY}/${IMAGE_NAME}:latest \
  .

# Step 3: Push to Azure Container Registry
echo ""
echo "📤 Pushing to ACR..."
docker push ${REGISTRY}/${IMAGE_NAME}:${TIMESTAMP}
docker push ${REGISTRY}/${IMAGE_NAME}:latest

# Step 4: Update Kubernetes deployment
echo ""
echo "☸️  Updating Kubernetes deployment..."
kubectl set image deployment/${DEPLOYMENT} \
  frontend=${REGISTRY}/${IMAGE_NAME}:${TIMESTAMP} \
  -n ${NAMESPACE}

# Step 5: Wait for rollout
echo ""
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/${DEPLOYMENT} -n ${NAMESPACE} --timeout=180s

# Step 6: Verify deployment
echo ""
echo "✅ Verifying deployment..."
kubectl get pods -n ${NAMESPACE} -l app=${IMAGE_NAME}

echo ""
echo "=============================================="
echo "✅ Deployment Complete!"
echo "Image: ${REGISTRY}/${IMAGE_NAME}:${TIMESTAMP}"
echo "URL: https://fleet.capitaltechalliance.com"
echo "=============================================="
