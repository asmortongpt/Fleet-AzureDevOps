#!/bin/bash
set -e

# Fleet Management System - Production Deployment Script
# This script:
# 1. Builds the API Docker image
# 2. Pushes to Azure Container Registry
# 3. Deploys to AKS
# 4. Verifies deployment

echo "🚀 Fleet Management - Production Deployment"
echo "==========================================="

# Configuration
REGISTRY="fleetappregistry.azurecr.io"
API_IMAGE="$REGISTRY/fleet-api"
FRONTEND_IMAGE="$REGISTRY/fleet-app"
VERSION="1.0.$(date +%Y%m%d%H%M%S)"
NAMESPACE="fleet-management"

# Step 1: Build API Docker image
echo ""
echo "📦 Step 1: Building API Docker image..."
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
docker build -t $API_IMAGE:$VERSION -t $API_IMAGE:latest .

if [ $? -eq 0 ]; then
  echo "✅ API image built successfully"
else
  echo "❌ API image build failed"
  exit 1
fi

# Step 2: Push to Azure Container Registry
echo ""
echo "📤 Step 2: Pushing API image to Azure Container Registry..."
# Login to ACR (using Azure CLI)
az acr login --name fleetappregistry

docker push $API_IMAGE:$VERSION
docker push $API_IMAGE:latest

if [ $? -eq 0 ]; then
  echo "✅ API image pushed successfully"
else
  echo "❌ API image push failed"
  exit 1
fi

# Step 3: Deploy secrets and config to Kubernetes
echo ""
echo "🔐 Step 3: Deploying secrets and config..."
cd /Users/andrewmorton/Documents/GitHub/Fleet

kubectl apply -f deployment/api-deployment.yaml -n $NAMESPACE

if [ $? -eq 0 ]; then
  echo "✅ Secrets and config deployed"
else
  echo "❌ Deployment failed"
  exit 1
fi

# Step 4: Deploy API to AKS
echo ""
echo "🚢 Step 4: Deploying API to AKS..."

# Update deployment with new image
kubectl set image deployment/fleet-api fleet-api=$API_IMAGE:$VERSION -n $NAMESPACE

# Wait for rollout
kubectl rollout status deployment/fleet-api -n $NAMESPACE --timeout=5m

if [ $? -eq 0 ]; then
  echo "✅ API deployed successfully"
else
  echo "❌ API deployment failed"
  exit 1
fi

# Step 5: Update frontend to connect to API
echo ""
echo "🌐 Step 5: Updating frontend environment..."

# Update frontend .env to point to API
# Note: Set AZURE_MAPS_KEY environment variable before running this script
cat > /Users/andrewmorton/Documents/GitHub/Fleet/.env.production << EOF
VITE_API_URL=http://fleet-api-service:3000
VITE_ENVIRONMENT=production
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=\${AZURE_MAPS_KEY:-YOUR_AZURE_MAPS_KEY}
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_DARK_MODE=true
EOF

# Build frontend with production API URL
cd /Users/andrewmorton/Documents/GitHub/Fleet
npm run build

# Build frontend image
docker build -t $FRONTEND_IMAGE:$VERSION -t $FRONTEND_IMAGE:latest .

# Push frontend image
docker push $FRONTEND_IMAGE:$VERSION
docker push $FRONTEND_IMAGE:latest

# Update frontend deployment
kubectl set image deployment/fleet-app fleet-app=$FRONTEND_IMAGE:$VERSION -n $NAMESPACE
kubectl rollout status deployment/fleet-app -n $NAMESPACE --timeout=5m

if [ $? -eq 0 ]; then
  echo "✅ Frontend deployed successfully"
else
  echo "❌ Frontend deployment failed"
  exit 1
fi

# Step 6: Verification
echo ""
echo "🔍 Step 6: Verifying deployment..."

# Check pod status
echo "Checking pods..."
kubectl get pods -n $NAMESPACE | grep fleet

# Check services
echo ""
echo "Checking services..."
kubectl get svc -n $NAMESPACE

# Test API health endpoint
echo ""
echo "Testing API health endpoint..."
kubectl exec -n $NAMESPACE deployment/fleet-api -- curl -s http://localhost:3000/api/health

# Test frontend
echo ""
echo "Testing frontend..."
FRONTEND_IP=$(kubectl get svc fleet-app-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -I http://$FRONTEND_IP

echo ""
echo "============================================"
echo "✨ Deployment Complete!"
echo "============================================"
echo ""
echo "📊 Deployment Summary:"
echo "  API Version: $VERSION"
echo "  Frontend URL: http://$FRONTEND_IP"
echo "  Namespace: $NAMESPACE"
echo ""
echo "🔗 Access your application:"
echo "  http://$FRONTEND_IP"
echo ""
echo "📝 Next steps:"
echo "  1. Login with your administrator credentials"
echo "  2. Verify all 31 modules are functional"
echo "  3. Run end-to-end tests"
echo "  4. Monitor logs: kubectl logs -f deployment/fleet-api -n $NAMESPACE"
echo ""
