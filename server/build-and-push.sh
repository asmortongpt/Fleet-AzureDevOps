#!/bin/bash
# Build and push Fleet Management API to Azure Container Registry

set -e

# Configuration
ACR_NAME="fleetproductionacr"
IMAGE_NAME="fleet-api"
VERSION="v1.0.0"
FULL_IMAGE="${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${VERSION}"

echo "=================================================="
echo "Fleet Management API - Docker Build & Push"
echo "=================================================="
echo "Image: ${FULL_IMAGE}"
echo ""

# Step 1: Build Docker image
echo "Step 1: Building Docker image..."
docker build --platform linux/amd64 -f Dockerfile.prod -t ${FULL_IMAGE} .

if [ $? -eq 0 ]; then
    echo "✓ Docker image built successfully"
else
    echo "✗ Docker image build failed"
    exit 1
fi

# Step 2: Tag as latest
echo ""
echo "Step 2: Tagging as latest..."
docker tag ${FULL_IMAGE} ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest

# Step 3: Login to Azure Container Registry
echo ""
echo "Step 3: Logging in to Azure Container Registry..."
az acr login --name ${ACR_NAME}

if [ $? -eq 0 ]; then
    echo "✓ Logged in to ACR successfully"
else
    echo "✗ ACR login failed"
    exit 1
fi

# Step 4: Push images
echo ""
echo "Step 4: Pushing Docker images to ACR..."
docker push ${FULL_IMAGE}
docker push ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest

if [ $? -eq 0 ]; then
    echo "✓ Images pushed successfully"
else
    echo "✗ Image push failed"
    exit 1
fi

echo ""
echo "=================================================="
echo "✓ Build and push completed successfully!"
echo "=================================================="
echo "Image: ${FULL_IMAGE}"
echo ""
echo "Next steps:"
echo "  1. Update secrets in k8s/secrets.yaml"
echo "  2. Apply Kubernetes manifests:"
echo "     kubectl apply -f k8s/secrets.yaml"
echo "     kubectl apply -f k8s/deployment.yaml"
echo "     kubectl apply -f k8s/service.yaml"
echo "  3. Verify deployment:"
echo "     kubectl get pods -n fleet-management"
echo "=================================================="
