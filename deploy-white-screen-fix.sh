#!/bin/bash
# Fleet Management System - White Screen Fix Deployment Script
# This script deploys all white screen fixes to AKS
# Date: November 26, 2025

set -e

echo "======================================================================"
echo "Fleet Management System - White Screen Fix Deployment"
echo "======================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="fleetappregistry.azurecr.io"
IMAGE_NAME="fleet-frontend"
TAG_LATEST="latest"
TAG_VERSION="v1.0.1-white-screen-fix"
NAMESPACE="ctafleet"
DEPLOYMENT_FILE="k8s/deployment-final.yaml"

# Step 1: Verify prerequisites
echo "Step 1: Verifying prerequisites..."
echo "-----------------------------------"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install kubectl and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ kubectl is installed${NC}"

# Check if az CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install az CLI and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Azure CLI is installed${NC}"

echo ""

# Step 2: Build Docker image
echo "Step 2: Building Docker image..."
echo "--------------------------------"
docker build -t ${REGISTRY}/${IMAGE_NAME}:${TAG_LATEST} .
docker tag ${REGISTRY}/${IMAGE_NAME}:${TAG_LATEST} ${REGISTRY}/${IMAGE_NAME}:${TAG_VERSION}
echo -e "${GREEN}✓ Docker images built successfully${NC}"
echo ""

# Step 3: Login to Azure Container Registry
echo "Step 3: Logging in to Azure Container Registry..."
echo "--------------------------------------------------"
az acr login --name fleetappregistry
echo -e "${GREEN}✓ Logged in to Azure Container Registry${NC}"
echo ""

# Step 4: Push Docker images
echo "Step 4: Pushing Docker images to registry..."
echo "---------------------------------------------"
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG_LATEST}
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG_VERSION}
echo -e "${GREEN}✓ Docker images pushed successfully${NC}"
echo ""

# Step 5: Apply Kubernetes configuration
echo "Step 5: Applying Kubernetes configuration..."
echo "--------------------------------------------"
kubectl apply -f ${DEPLOYMENT_FILE}
echo -e "${GREEN}✓ Kubernetes configuration applied${NC}"
echo ""

# Step 6: Force rollout restart
echo "Step 6: Forcing deployment rollout..."
echo "--------------------------------------"
kubectl rollout restart deployment/fleet-frontend -n ${NAMESPACE}
echo -e "${GREEN}✓ Rollout initiated${NC}"
echo ""

# Step 7: Wait for rollout to complete
echo "Step 7: Waiting for rollout to complete..."
echo "-------------------------------------------"
kubectl rollout status deployment/fleet-frontend -n ${NAMESPACE} --timeout=5m
echo -e "${GREEN}✓ Rollout completed successfully${NC}"
echo ""

# Step 8: Verify deployment
echo "Step 8: Verifying deployment..."
echo "--------------------------------"

# Check pod status
echo "Pod status:"
kubectl get pods -n ${NAMESPACE} -l component=frontend

echo ""
echo "Service status:"
kubectl get svc fleet-frontend-service -n ${NAMESPACE}

echo ""
echo "ConfigMap verification:"
kubectl get configmap fleet-frontend-config -n ${NAMESPACE} -o jsonpath='{.data.VITE_ENVIRONMENT}'
echo ""

# Check if pods are running
RUNNING_PODS=$(kubectl get pods -n ${NAMESPACE} -l component=frontend --field-selector=status.phase=Running --no-headers | wc -l)
if [ "$RUNNING_PODS" -gt 0 ]; then
    echo -e "${GREEN}✓ ${RUNNING_PODS} pod(s) running${NC}"
else
    echo -e "${RED}❌ No pods running!${NC}"
    exit 1
fi

echo ""

# Step 9: Display logs from one pod
echo "Step 9: Checking pod logs..."
echo "----------------------------"
POD_NAME=$(kubectl get pods -n ${NAMESPACE} -l component=frontend -o jsonpath='{.items[0].metadata.name}')
echo "Logs from pod: ${POD_NAME}"
echo ""
kubectl logs ${POD_NAME} -n ${NAMESPACE} --tail=30

echo ""
echo "======================================================================"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo "======================================================================"
echo ""
echo "Next Steps:"
echo "1. Open browser to: https://fleet.capitaltechalliance.com"
echo "2. Verify no white screen appears"
echo "3. Test Azure AD login"
echo "4. Check browser console for errors (F12)"
echo ""
echo "Troubleshooting Commands:"
echo "  - View pod logs:     kubectl logs -n ${NAMESPACE} -l component=frontend"
echo "  - View pod status:   kubectl get pods -n ${NAMESPACE} -l component=frontend"
echo "  - View events:       kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp'"
echo "  - Port forward:      kubectl port-forward -n ${NAMESPACE} svc/fleet-frontend-service 8080:80"
echo ""
echo "Report: AKS_WHITE_SCREEN_PERMANENT_FIX_REPORT.md"
echo ""
