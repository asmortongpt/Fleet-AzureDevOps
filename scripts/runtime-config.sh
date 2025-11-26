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
# CRITICAL: Use temp file and atomic move to handle read-only filesystems
TEMP_CONFIG="/tmp/runtime-config.js"
cat > "${TEMP_CONFIG}" <<EOF
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

# Move temp config to final location (handles read-only filesystem scenarios)
if [ -w "${CONFIG_DIR}" ]; then
  mv "${TEMP_CONFIG}" "${CONFIG_FILE}" 2>/dev/null || cp "${TEMP_CONFIG}" "${CONFIG_FILE}"
  echo "✓ Runtime configuration created at ${CONFIG_FILE}"
else
  echo "⚠ Warning: ${CONFIG_DIR} is read-only, keeping config at ${TEMP_CONFIG}"
  CONFIG_FILE="${TEMP_CONFIG}"
fi

echo ""

# Inject runtime-config.js script tag into index.html if not already present
INDEX_FILE="${CONFIG_DIR}/index.html"
if [ -f "${INDEX_FILE}" ]; then
  if ! grep -q "runtime-config.js" "${INDEX_FILE}"; then
    echo "Injecting runtime-config.js script tag into index.html..."
    # Create temp copy for read-only filesystem compatibility
    TEMP_INDEX="/tmp/index.html"
    cp "${INDEX_FILE}" "${TEMP_INDEX}"
    # Insert script tag before the first <script> tag
    sed -i 's|<script |<script src="/runtime-config.js"></script>\n  <script |' "${TEMP_INDEX}" 2>/dev/null || \
      sed 's|<script |<script src="/runtime-config.js"></script>\n  <script |' "${INDEX_FILE}" > "${TEMP_INDEX}"

    # Move back if writable
    if [ -w "${CONFIG_DIR}" ]; then
      mv "${TEMP_INDEX}" "${INDEX_FILE}" 2>/dev/null || cp "${TEMP_INDEX}" "${INDEX_FILE}"
      echo "✓ Script tag injected into index.html"
    else
      echo "⚠ Warning: Cannot modify index.html (read-only filesystem)"
    fi
  else
    echo "✓ Script tag already present in index.html"
  fi
else
  echo "⚠ index.html not found at ${INDEX_FILE}"
fi

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
