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

# Inject runtime-config.js script tag into index.html if not already present
INDEX_FILE="${CONFIG_DIR}/index.html"
if [ -f "${INDEX_FILE}" ]; then
  if ! grep -q "runtime-config.js" "${INDEX_FILE}"; then
    echo "Injecting runtime-config.js script tag into index.html..."
    # Insert script tag before the first <script> tag
    sed -i 's|<script |<script src="/runtime-config.js"></script>\n  <script |' "${INDEX_FILE}"
    echo "✓ Script tag injected into index.html"
  else
    echo "✓ Script tag already present in index.html"
  fi
else
  echo "⚠ index.html not found at ${INDEX_FILE}"
fi

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
