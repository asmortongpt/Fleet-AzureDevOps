#!/bin/bash

set -euo pipefail

# Fleet Management - Complete Kubernetes Deployment
# Deploys updated UI with endpoint monitoring to Kubernetes

echo "🚀 Fleet Management - Kubernetes Deployment"
echo "============================================"

# Configuration
PROJECT_ROOT="/Users/andrewmorton/Documents/GitHub/Fleet"
AZURE_SUBSCRIPTION_ID="021415c2-2f52-4a73-ae77-f8363165a5e1"
ACR_NAME="fleetproductionacr"
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
NAMESPACE="fleet-management"
VERSION_TAG="v$(date +%Y%m%d-%H%M%S)"

cd "$PROJECT_ROOT"

# Step 1: Build production frontend with latest UI improvements
echo ""
echo "📦 Step 1: Building production frontend..."
echo "==========================================="

npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist/ directory not found"
    exit 1
fi

echo "✅ Frontend built successfully"

# Step 2: Build Docker image
echo ""
echo "🐳 Step 2: Building Docker image..."
echo "===================================="

docker build \
    -f Dockerfile.production \
    -t "${ACR_LOGIN_SERVER}/fleet-frontend:${VERSION_TAG}" \
    -t "${ACR_LOGIN_SERVER}/fleet-frontend:latest" \
    .

echo "✅ Docker image built: ${ACR_LOGIN_SERVER}/fleet-frontend:${VERSION_TAG}"

# Step 3: Login to Azure and ACR
echo ""
echo "🔐 Step 3: Authenticating with Azure..."
echo "========================================"

az account set --subscription "${AZURE_SUBSCRIPTION_ID}"
az acr login --name "${ACR_NAME}"

echo "✅ Authenticated successfully"

# Step 4: Push images to ACR
echo ""
echo "📤 Step 4: Pushing images to ACR..."
echo "==================================="

docker push "${ACR_LOGIN_SERVER}/fleet-frontend:${VERSION_TAG}"
docker push "${ACR_LOGIN_SERVER}/fleet-frontend:latest"

echo "✅ Images pushed to ACR"

# Step 5: Get AKS credentials
echo ""
echo "☸️  Step 5: Connecting to AKS cluster..."
echo "========================================"

# Find the AKS cluster
AKS_CLUSTER=$(az aks list --subscription "${AZURE_SUBSCRIPTION_ID}" --query "[0].name" -o tsv)
AKS_RESOURCE_GROUP=$(az aks list --subscription "${AZURE_SUBSCRIPTION_ID}" --query "[0].resourceGroup" -o tsv)

if [ -z "$AKS_CLUSTER" ]; then
    echo "❌ No AKS cluster found"
    exit 1
fi

echo "Found AKS cluster: ${AKS_CLUSTER} in ${AKS_RESOURCE_GROUP}"

az aks get-credentials \
    --resource-group "${AKS_RESOURCE_GROUP}" \
    --name "${AKS_CLUSTER}" \
    --overwrite-existing

echo "✅ Connected to AKS cluster"

# Step 6: Create/update namespace
echo ""
echo "📁 Step 6: Setting up namespace..."
echo "=================================="

kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Namespace ready: ${NAMESPACE}"

# Step 7: Create ConfigMaps
echo ""
echo "⚙️  Step 7: Creating ConfigMaps..."
echo "=================================="

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: fleet-frontend-config
  namespace: ${NAMESPACE}
data:
  VITE_AZURE_AD_CLIENT_ID: "baae0851-0c24-4214-8587-e3fabc46bd4a"
  VITE_AZURE_AD_TENANT_ID: "0ec14b81-7b82-45ee-8f3d-cbc31ced5347"
  VITE_AZURE_AD_REDIRECT_URI: "https://fleet.capitaltechalliance.com/auth/callback"
  VITE_API_URL: "https://fleet-api.capitaltechalliance.com"
  VITE_ENVIRONMENT: "production"
EOF

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: ${NAMESPACE}
data:
  default.conf: |
    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Readiness check
        location /ready {
            access_log off;
            return 200 "ready\n";
            add_header Content-Type text/plain;
        }

        # SPA routing
        location / {
            try_files \$uri \$uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
EOF

echo "✅ ConfigMaps created"

# Step 8: Apply Kubernetes manifests
echo ""
echo "☸️  Step 8: Deploying to Kubernetes..."
echo "======================================"

kubectl apply -f k8s/frontend-deployment.yaml

echo "✅ Deployment applied"

# Step 9: Wait for rollout
echo ""
echo "⏳ Step 9: Waiting for rollout..."
echo "================================="

kubectl rollout status deployment/fleet-frontend -n "${NAMESPACE}" --timeout=5m

echo "✅ Rollout complete"

# Step 10: Create/update ingress
echo ""
echo "🌐 Step 10: Configuring ingress..."
echo "=================================="

cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fleet-ingress
  namespace: ${NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - fleet.capitaltechalliance.com
    secretName: fleet-tls
  rules:
  - host: fleet.capitaltechalliance.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fleet-frontend-service
            port:
              number: 80
EOF

echo "✅ Ingress configured"

# Step 11: Get deployment status
echo ""
echo "📊 Deployment Status"
echo "===================="
echo ""

kubectl get all -n "${NAMESPACE}"

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📋 Deployment Details:"
echo "  • Version: ${VERSION_TAG}"
echo "  • Image: ${ACR_LOGIN_SERVER}/fleet-frontend:${VERSION_TAG}"
echo "  • Namespace: ${NAMESPACE}"
echo "  • URL: https://fleet.capitaltechalliance.com"
echo ""
echo "📊 View logs:"
echo "  kubectl logs -f deployment/fleet-frontend -n ${NAMESPACE}"
echo ""
echo "🔍 View pods:"
echo "  kubectl get pods -n ${NAMESPACE}"
echo ""
echo "🌐 Access the application:"
echo "  https://fleet.capitaltechalliance.com"
echo ""
