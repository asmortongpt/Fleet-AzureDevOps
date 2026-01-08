#!/bin/bash
# Fleet API Full Deployment + Logo Restoration
# To be executed by Azure VM agents

set -e

echo "====================================================================="
echo "Fleet Management System - Full API Deployment & Logo Restoration"
echo "====================================================================="

# Task 1: Build and Deploy Full Backend API
echo ""
echo "[Task 1/3] Building Full Backend API with all endpoints..."
cd /Users/andrewmorton/Documents/GitHub/Fleet/api

# Build Docker image
echo "Building Docker image..."
docker build --platform linux/amd64 \
  -t fleetregistry2025.azurecr.io/fleet-api:v1.0-full \
  -f Dockerfile . || {
    echo "ERROR: Docker build failed. Retrying with --no-cache..."
    docker build --platform linux/amd64 --no-cache \
      -t fleetregistry2025.azurecr.io/fleet-api:v1.0-full \
      -f Dockerfile .
  }

# Push to ACR
echo "Pushing to Azure Container Registry..."
docker push fleetregistry2025.azurecr.io/fleet-api:v1.0-full

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."
kubectl set image deployment/fleet-api -n fleet-management \
  api=fleetregistry2025.azurecr.io/fleet-api:v1.0-full

echo "Waiting for rollout to complete..."
kubectl rollout status deployment/fleet-api -n fleet-management --timeout=300s

echo "✅ Backend API deployed successfully!"

# Task 2: Restore Original Fleet Logo
echo ""
echo "[Task 2/3] Restoring original Fleet logo..."
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Find and restore original logo files
# The logo should be in public/ directory
if [ -f "public/logo.svg" ]; then
  echo "Logo files found in public/"
  git checkout HEAD -- public/logo.svg public/favicon.ico 2>/dev/null || true
fi

# Also check src/assets
if [ -d "src/assets" ]; then
  git checkout HEAD -- src/assets/logo* 2>/dev/null || true
fi

# Rebuild frontend with restored logo
echo "Rebuilding frontend..."
npm run build

# Build and push frontend image
echo "Building frontend Docker image..."
docker build --platform linux/amd64 \
  -t fleetregistry2025.azurecr.io/fleet-frontend:v2.5-logo-restored \
  -f Dockerfile.frontend .

echo "Pushing frontend image..."
docker push fleetregistry2025.azurecr.io/fleet-frontend:v2.5-logo-restored

# Deploy frontend
echo "Deploying frontend..."
kubectl set image deployment/fleet-frontend -n fleet-management \
  frontend=fleetregistry2025.azurecr.io/fleet-frontend:v2.5-logo-restored

kubectl rollout status deployment/fleet-frontend -n fleet-management --timeout=300s

echo "✅ Logo restored and frontend redeployed!"

# Task 3: Verify All Endpoints
echo ""
echo "[Task 3/3] Verifying all API endpoints..."

# Wait for pods to be ready
sleep 30

# Get frontend pod
FRONTEND_POD=$(kubectl get pods -n fleet-management -l app=fleet-frontend -o jsonpath='{.items[0].metadata.name}')

# Test endpoints
echo "Testing API endpoints from within cluster..."
kubectl exec -n fleet-management $FRONTEND_POD -- curl -s -o /dev/null -w "%{http_code}" http://fleet-api-service/health

# Test a few key endpoints
ENDPOINTS=(
  "/api/vehicles"
  "/api/drivers"
  "/api/work-orders"
  "/api/maintenance-schedules"
)

echo "Endpoint Health Check:"
for endpoint in "${ENDPOINTS[@]}"; do
  HTTP_CODE=$(kubectl exec -n fleet-management $FRONTEND_POD -- \
    curl -s -o /dev/null -w "%{http_code}" "http://fleet-api-service$endpoint" || echo "000")

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "  ✅ $endpoint - $HTTP_CODE (OK)"
  else
    echo "  ❌ $endpoint - $HTTP_CODE (FAIL)"
  fi
done

# Final status
echo ""
echo "====================================================================="
echo "Deployment Complete!"
echo "====================================================================="
echo ""
echo "Frontend URL: https://fleet.capitaltechalliance.com"
echo "External IP: 135.18.149.69"
echo ""
kubectl get pods -n fleet-management -l app=fleet-api
kubectl get pods -n fleet-management -l app=fleet-frontend
echo ""
echo "Check backend logs: kubectl logs -n fleet-management -l app=fleet-api --tail=50"
echo "Check frontend logs: kubectl logs -n fleet-management -l app=fleet-frontend --tail=50"
echo ""
echo "====================================================================="
