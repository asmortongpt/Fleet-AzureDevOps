#!/bin/bash
# Deploy Fleet Management System to Staging Environment

set -e

ENVIRONMENT="staging"
NAMESPACE="fleet-management-staging"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_DIR="$SCRIPT_DIR/../environments/$ENVIRONMENT"

echo "========================================="
echo "Deploying to Staging Environment"
echo "========================================="
echo "Namespace: $NAMESPACE"
echo "Environment: $ENVIRONMENT"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check if namespace exists, create if not
echo "1. Creating/verifying namespace..."
kubectl apply -f "$ENV_DIR/namespace.yaml"

# Apply ConfigMaps
echo "2. Applying ConfigMaps..."
kubectl apply -f "$ENV_DIR/configmap.yaml"

# Apply Secrets
echo "3. Applying Secrets..."
kubectl apply -f "$ENV_DIR/secrets.yaml"

# Deploy PostgreSQL
echo "4. Deploying PostgreSQL..."
kubectl apply -f "$ENV_DIR/postgres.yaml"

# Deploy Redis
echo "5. Deploying Redis..."
kubectl apply -f "$ENV_DIR/redis.yaml"

# Wait for databases to be ready
echo "6. Waiting for databases to be ready..."
echo "   Waiting for PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=fleet-postgres -n $NAMESPACE --timeout=300s || echo "PostgreSQL timeout - check manually"

echo "   Waiting for Redis..."
kubectl wait --for=condition=ready pod -l app=fleet-redis -n $NAMESPACE --timeout=120s || echo "Redis timeout - check manually"

# Deploy Application
echo "7. Deploying Fleet Application..."
kubectl apply -f "$ENV_DIR/app-deployment.yaml"

# Deploy API
echo "8. Deploying Fleet API..."
kubectl apply -f "$ENV_DIR/api-deployment.yaml"

# Apply Ingress
echo "9. Configuring Ingress..."
kubectl apply -f "$ENV_DIR/ingress.yaml"

# Wait for application pods
echo "10. Waiting for application pods..."
kubectl wait --for=condition=ready pod -l app=fleet-app -n $NAMESPACE --timeout=180s || echo "App timeout - check manually"
kubectl wait --for=condition=ready pod -l app=fleet-api -n $NAMESPACE --timeout=180s || echo "API timeout - check manually"

echo ""
echo "========================================="
echo "Deployment Status"
echo "========================================="
kubectl get pods -n $NAMESPACE
echo ""
kubectl get svc -n $NAMESPACE
echo ""
kubectl get ingress -n $NAMESPACE

echo ""
echo "========================================="
echo "Staging Environment Deployed!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Run seed script: ./seed-staging.sh"
echo "  2. Access the application at: https://fleet-staging.capitaltechalliance.com"
echo "  3. Check logs: kubectl logs -n $NAMESPACE -l app=fleet-app"
echo ""
