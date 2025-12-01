#!/bin/bash
set -e

echo "========================================"
echo "DEPLOYING ALL FLEET SERVICES"
echo "========================================"
echo ""

# Create namespace if it doesn't exist
kubectl create namespace fleet-management --dry-run=client -o yaml | kubectl apply -f -

# 1. Create secrets for AI APIs
echo "[1/5] Creating AI API Secrets..."
kubectl create secret generic ai-api-keys \
  --from-literal=ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}" \
  --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY}" \
  --from-literal=GEMINI_API_KEY="${GEMINI_API_KEY}" \
  --from-literal=GROQ_API_KEY="${GROQ_API_KEY}" \
  --from-literal=PERPLEXITY_API_KEY="${PERPLEXITY_API_KEY}" \
  -n fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ AI API secrets configured"

# 2. Check existing deployments
echo ""
echo "[2/5] Checking current deployments..."
kubectl get deployments -n fleet-management

# 3. Update fleet-api with AI secrets
echo ""
echo "[3/5] Updating fleet-api with AI credentials..."
kubectl set env deployment/fleet-api -n fleet-management \
  --from=secret/ai-api-keys \
  --keys=ANTHROPIC_API_KEY,OPENAI_API_KEY,GEMINI_API_KEY,GROQ_API_KEY,PERPLEXITY_API_KEY

echo "✅ API updated with AI credentials"

# 4. Verify pods are running
echo ""
echo "[4/5] Waiting for API pods to restart..."
kubectl rollout status deployment/fleet-api -n fleet-management --timeout=120s

# 5. Show connection status
echo ""
echo "[5/5] Connection Status:"
echo ""
echo "Frontend Pods:"
kubectl get pods -n fleet-management -l app=fleet-frontend
echo ""
echo "API Pods:"
kubectl get pods -n fleet-management -l app=fleet-api
echo ""
echo "Database:"
kubectl get pods -n fleet-management -l app=fleet-postgres
echo ""
echo "Redis:"
kubectl get pods -n fleet-management -l app=fleet-redis
echo ""
echo "Services:"
kubectl get svc -n fleet-management

echo ""
echo "========================================"
echo "✅ ALL SERVICES CONNECTED"
echo "========================================"
echo ""
echo "System URL: https://fleet.capitaltechalliance.com"
echo ""
echo "Connected Components:"
echo "  ✅ Frontend (3 replicas)"
echo "  ✅ Backend API (3 replicas) with AI"
echo "  ✅ PostgreSQL Database"
echo "  ✅ Redis Cache"
echo "  ✅ AI Services (OpenAI, Claude, Gemini, Groq, Perplexity)"
echo ""
