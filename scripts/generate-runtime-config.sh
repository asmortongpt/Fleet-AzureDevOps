#!/bin/bash
# Generate runtime-config.js with environment variables

cat > public/runtime-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  VITE_AZURE_MAPS_SUBSCRIPTION_KEY: "${VITE_AZURE_MAPS_SUBSCRIPTION_KEY:-}",
  VITE_API_URL: "${VITE_API_URL:-}",
  VITE_ENVIRONMENT: "${VITE_ENVIRONMENT:-production}",
  VITE_BUILD_VERSION: "${VITE_BUILD_VERSION:-v1.0.0}",
  VITE_AZURE_AD_CLIENT_ID: "${VITE_AZURE_AD_CLIENT_ID:-}",
  VITE_AZURE_AD_TENANT_ID: "${VITE_AZURE_AD_TENANT_ID:-}",
  VITE_AZURE_AD_REDIRECT_URI: "${VITE_AZURE_AD_REDIRECT_URI:-}"
};
EOF

echo "✓ Generated runtime-config.js with environment variables"
cat public/runtime-config.js
