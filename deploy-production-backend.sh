#!/bin/bash

set -e

echo "========================================="
echo "Fleet Management System - Production Deployment"
echo "========================================="
echo ""

# Configuration
ACR_NAME="fleetproductionacr"
ACR_LOGIN_SERVER="fleetproductionacr.azurecr.io"
IMAGE_NAME="fleet-api"
IMAGE_TAG="latest"
NAMESPACE="fleet-management"

# Step 1: Azure Container Registry Login
echo "[1/8] Logging into Azure Container Registry..."
az acr login --name $ACR_NAME
echo "✓ Logged into ACR successfully"
echo ""

# Step 2: Build API Docker Image
echo "[2/8] Building API Docker image..."
cd api
docker build -f Dockerfile.production -t $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG .
echo "✓ Docker image built successfully"
echo ""

# Step 3: Push to ACR
echo "[3/8] Pushing image to Azure Container Registry..."
docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG
echo "✓ Image pushed successfully"
cd ..
echo ""

# Step 4: Create/Update Namespace
echo "[4/8] Creating production namespace..."
kubectl apply -f deployment/production/00-namespace.yaml
echo "✓ Namespace created"
echo ""

# Step 5: Deploy Database and Infrastructure
echo "[5/8] Deploying PostgreSQL database..."
kubectl apply -f deployment/production/01-configmap.yaml
kubectl apply -f deployment/production/02-secrets.yaml
kubectl apply -f deployment/production/03-postgres.yaml
kubectl apply -f deployment/production/04-redis.yaml
echo "✓ Database and Redis deployed"
echo ""

# Step 6: Wait for Database to be Ready
echo "[6/8] Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=fleet-postgres -n $NAMESPACE --timeout=300s || true
echo "✓ PostgreSQL is ready"
echo ""

# Step 7: Deploy API and Services
echo "[7/8] Deploying API backend and OBD2 emulator..."
kubectl apply -f deployment/production/05-api-deployment.yaml
kubectl apply -f deployment/production/06-obd2-emulator.yaml
echo "✓ Backend services deployed"
echo ""

# Step 8: Update Ingress
echo "[8/8] Updating ingress configuration..."
kubectl apply -f deployment/production/07-ingress.yaml
echo "✓ Ingress updated"
echo ""

echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo ""

# Wait a moment for pods to start
sleep 5

echo "Namespace: $NAMESPACE"
echo ""
echo "Pods:"
kubectl get pods -n $NAMESPACE
echo ""
echo "Services:"
kubectl get svc -n $NAMESPACE
echo ""
echo "Ingress:"
kubectl get ingress -n $NAMESPACE
echo ""

echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Frontend URL: https://fleet.capitaltechalliance.com"
echo "API Health: https://fleet.capitaltechalliance.com/api/health"
echo "OBD2 WebSocket: wss://fleet.capitaltechalliance.com/ws/obd2"
echo ""
echo "To check logs:"
echo "  kubectl logs -f -n $NAMESPACE deployment/fleet-api"
echo "  kubectl logs -f -n $NAMESPACE deployment/fleet-postgres"
echo ""
echo "To run database migrations:"
echo "  kubectl exec -it -n $NAMESPACE deployment/fleet-api -- npm run migrate"
echo ""
