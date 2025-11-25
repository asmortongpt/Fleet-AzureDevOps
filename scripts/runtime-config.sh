#!/bin/sh
# Runtime configuration injection for frontend
# This script injects environment variables at runtime instead of build-time
# to prevent secrets from being baked into Docker images

set -e

echo "==================================="
echo "Fleet Frontend - Runtime Config"
echo "==================================="
echo ""

# Target directory for configuration
CONFIG_DIR="/usr/share/nginx/html"
CONFIG_FILE="${CONFIG_DIR}/runtime-config.js"

# Create runtime configuration file
cat > "${CONFIG_FILE}" <<EOF
// Runtime configuration injected at container startup
window.__RUNTIME_CONFIG__ = {
  // Azure AD Authentication
  VITE_AZURE_AD_CLIENT_ID: "${VITE_AZURE_AD_CLIENT_ID:-baae0851-0c24-4214-8587-e3fabc46bd4a}",
  VITE_AZURE_AD_TENANT_ID: "${VITE_AZURE_AD_TENANT_ID:-0ec14b81-7b82-45ee-8f3d-cbc31ced5347}",
  VITE_AZURE_AD_REDIRECT_URI: "${VITE_AZURE_AD_REDIRECT_URI:-https://fleet.capitaltechalliance.com/auth/callback}",

  // API Configuration
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-https://fleet-api.capitaltechalliance.com}",
  VITE_API_URL: "${VITE_API_URL:-https://fleet-api.capitaltechalliance.com}",

  // Azure Maps
  VITE_AZURE_MAPS_SUBSCRIPTION_KEY: "${VITE_AZURE_MAPS_SUBSCRIPTION_KEY:-}",

  // Environment
  VITE_ENVIRONMENT: "${VITE_ENVIRONMENT:-production}",
  VITE_BUILD_VERSION: "${VITE_BUILD_VERSION:-latest}",

  // Feature Flags
  ENABLE_AI_AGENTS: ${ENABLE_AI_AGENTS:-true},
  ENABLE_VIDEO_ANALYTICS: ${ENABLE_VIDEO_ANALYTICS:-true},
  ENABLE_PREDICTIVE_MAINTENANCE: ${ENABLE_PREDICTIVE_MAINTENANCE:-true},
  ENABLE_REAL_TIME_TRACKING: ${ENABLE_REAL_TIME_TRACKING:-true}
};
EOF

echo "✓ Runtime configuration created at ${CONFIG_FILE}"
echo ""
echo "Configuration values:"
echo "  VITE_AZURE_AD_CLIENT_ID: ${VITE_AZURE_AD_CLIENT_ID:+[SET]}"
echo "  VITE_AZURE_AD_REDIRECT_URI: ${VITE_AZURE_AD_REDIRECT_URI:-https://fleet.capitaltechalliance.com/auth/callback}"
echo "  VITE_API_URL: ${VITE_API_URL:-https://fleet-api.capitaltechalliance.com}"
echo "  VITE_ENVIRONMENT: ${VITE_ENVIRONMENT:-production}"
echo ""
echo "==================================="
echo "Configuration injection complete"
echo "==================================="

# Start nginx in the background
exec "$@"
