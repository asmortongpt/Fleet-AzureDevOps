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
  VITE_AZURE_MAPS_SUBSCRIPTION_KEY: "${VITE_AZURE_MAPS_SUBSCRIPTION_KEY:-}",
  VITE_API_URL: "${VITE_API_URL:-}",
  VITE_ENVIRONMENT: "${VITE_ENVIRONMENT:-production}",
  VITE_BUILD_VERSION: "${VITE_BUILD_VERSION:-latest}"
};
EOF

echo "✓ Runtime configuration created at ${CONFIG_FILE}"
echo ""
echo "Configuration values:"
echo "  VITE_AZURE_MAPS_SUBSCRIPTION_KEY: ${VITE_AZURE_MAPS_SUBSCRIPTION_KEY:+[SET]}"
echo "  VITE_API_URL: ${VITE_API_URL:-[NOT SET]}"
echo "  VITE_ENVIRONMENT: ${VITE_ENVIRONMENT:-production}"
echo "  VITE_BUILD_VERSION: ${VITE_BUILD_VERSION:-latest}"
echo ""
echo "==================================="
echo "Configuration injection complete"
echo "==================================="

# Start nginx in the background
exec "$@"
