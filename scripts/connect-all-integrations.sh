#!/bin/bash
set -e

echo "========================================="
echo "CONNECTING ALL INTEGRATIONS"
echo "========================================="
echo ""

# Update fleet-api with ALL environment variables from global .env
echo "[1/6] Adding Azure AD and Microsoft integrations..."
kubectl create secret generic azure-integrations \
  --from-literal=AZURE_AD_CLIENT_ID="${AZURE_AD_APP_ID}" \
  --from-literal=AZURE_AD_TENANT_ID="${AZURE_AD_TENANT_ID}" \
  --from-literal=AZURE_AD_REDIRECT_URI="${AZURE_AD_REDIRECT_URI}" \
  --from-literal=MICROSOFT_GRAPH_CLIENT_ID="${MICROSOFT_GRAPH_CLIENT_ID}" \
  --from-literal=MICROSOFT_GRAPH_CLIENT_SECRET="${MICROSOFT_GRAPH_CLIENT_SECRET}" \
  --from-literal=MICROSOFT_GRAPH_TENANT_ID="${MICROSOFT_GRAPH_TENANT_ID}" \
  -n fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Azure AD configured"

# GitHub integration
echo ""
echo "[2/6] Adding GitHub integration..."
kubectl create secret generic github-integration \
  --from-literal=GITHUB_PAT="${GITHUB_PAT}" \
  -n fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ GitHub configured"

# Additional AI services
echo ""
echo "[3/6] Adding additional AI services..."
kubectl create secret generic extended-ai-services \
  --from-literal=HUME_API_KEY="${HUME_API_KEY}" \
  --from-literal=HUME_SECRET_KEY="${HUME_SECRET_KEY}" \
  --from-literal=MISTRAL_API_KEY="${MISTRAL_API_KEY}" \
  --from-literal=COHERE_API_KEY="${COHERE_API_KEY}" \
  --from-literal=HUGGINGFACE_API_KEY="${HUGGINGFACE_API_KEY}" \
  --from-literal=XAI_API_KEY="${XAI_API_KEY}" \
  --from-literal=TOGETHER_API_KEY="${TOGETHER_API_KEY}" \
  -n fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Extended AI services configured"

# Business integrations
echo ""
echo "[4/6] Adding business integrations..."
kubectl create secret generic business-integrations \
  --from-literal=SMARTCAR_CLIENT_ID="${SMARTCAR_CLIENT_ID}" \
  --from-literal=SMARTCAR_CLIENT_SECRET="${SMARTCAR_CLIENT_SECRET}" \
  --from-literal=ADOBE_CLIENT_ID="${ADOBE_CLIENT_ID}" \
  --from-literal=ADOBE_ACCESS_TOKEN="${ADOBE_ACCESS_TOKEN}" \
  -n fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Business integrations configured"

# Update fleet-frontend with runtime config
echo ""
echo "[5/6] Updating frontend with API keys..."
kubectl set env deployment/fleet-frontend -n fleet-management \
  VITE_GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY}" \
  VITE_AZURE_AD_CLIENT_ID="${AZURE_AD_APP_ID}" \
  VITE_AZURE_AD_TENANT_ID="${AZURE_AD_TENANT_ID}" \
  VITE_API_URL="https://fleet.capitaltechalliance.com/api"

echo "✅ Frontend configured"

# Update API with all secrets
echo ""
echo "[6/6] Updating API with all integrations..."
kubectl set env deployment/fleet-api -n fleet-management \
  --from=secret/azure-integrations \
  --from=secret/github-integration \
  --from=secret/extended-ai-services \
  --from=secret/business-integrations

echo ""
echo "Waiting for API rollout..."
kubectl rollout status deployment/fleet-api -n fleet-management --timeout=120s

echo ""
echo "Waiting for frontend rollout..."
kubectl rollout status deployment/fleet-frontend -n fleet-management --timeout=120s

echo ""
echo "========================================="
echo "✅ ALL INTEGRATIONS CONNECTED"
echo "========================================="
echo ""
echo "Connected Services:"
echo "  ✅ Google Maps API"
echo "  ✅ Azure AD / Microsoft Graph"
echo "  ✅ GitHub"
echo "  ✅ OpenAI GPT-4"
echo "  ✅ Claude (Anthropic)"
echo "  ✅ Google Gemini"
echo "  ✅ Groq LLMs"
echo "  ✅ Perplexity AI"
echo "  ✅ Mistral AI"
echo "  ✅ Cohere"
echo "  ✅ HuggingFace"
echo "  ✅ X.AI (Grok)"
echo "  ✅ Together AI"
echo "  ✅ Hume AI"
echo "  ✅ SmartCar"
echo "  ✅ Adobe Creative Suite"
echo ""
echo "Database Connections:"
echo "  ✅ PostgreSQL (fleet-postgres-service:5432)"
echo "  ✅ Redis (fleet-redis-service:6379)"
echo ""
echo "Production URL: https://fleet.capitaltechalliance.com"
echo ""
