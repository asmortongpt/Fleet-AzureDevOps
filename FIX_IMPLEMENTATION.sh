#!/bin/bash

# PRODUCTION OUTAGE FIX
# This script implements the fix for the missing runtime-config.js script tag

echo "=========================================="
echo "FLEET PRODUCTION OUTAGE FIX"
echo "=========================================="
echo ""

# Solution 1: Create placeholder runtime-config.js in public directory
echo "Step 1: Creating placeholder runtime-config.js..."
mkdir -p public
cat > public/runtime-config.js << 'ENDJS'
// Placeholder - will be overwritten at container startup
window.__RUNTIME_CONFIG__ = {
  VITE_AZURE_MAPS_SUBSCRIPTION_KEY: "",
  VITE_API_URL: "",
  VITE_ENVIRONMENT: "production",
  VITE_BUILD_VERSION: "latest"
};
ENDJS
echo "✓ Created public/runtime-config.js"
echo ""

# Solution 2: Update vite.config.ts to ensure script tag is preserved
echo "Step 2: Updating vite.config.ts..."
cat > /tmp/vite-plugin.ts << 'ENDPLUGIN'

// Add this function before export default defineConfig
function injectRuntimeConfig(): PluginOption {
  return {
    name: 'inject-runtime-config',
    enforce: 'post',
    transformIndexHtml(html) {
      // Ensure runtime-config.js is loaded before the main app
      return html.replace(
        '<div id="root"></div>',
        '<div id="root"></div>\n    <script src="/runtime-config.js"></script>'
      );
    },
  };
}
ENDPLUGIN
echo "✓ Vite plugin created (manual merge required)"
echo ""

# Solution 3: Update Dockerfile to inject script tag as fallback
echo "Step 3: Updating Dockerfile..."
cat > /tmp/dockerfile-patch.txt << 'ENDDOCKER'
# Add after line 40 (after build version injection):
RUN sed -i 's|<div id="root"></div>|<div id="root"></div>\n    <script src="/runtime-config.js"></script>|' /app/dist/index.html && \
    echo "✓ Injected runtime-config.js script tag"
ENDDOCKER
echo "✓ Dockerfile patch created (manual merge required)"
echo ""

echo "=========================================="
echo "NEXT STEPS"
echo "=========================================="
echo ""
echo "1. Review and commit public/runtime-config.js"
echo "2. Update vite.config.ts with the plugin (see /tmp/vite-plugin.ts)"
echo "3. Update Dockerfile (see /tmp/dockerfile-patch.txt)"
echo "4. Build and test locally:"
echo "   npm run build"
echo "   npx serve dist"
echo "   curl http://localhost:3000 | grep runtime-config"
echo ""
echo "5. Deploy to production:"
echo "   docker build -t fleetappregistry.azurecr.io/fleet-app:latest ."
echo "   docker push fleetappregistry.azurecr.io/fleet-app:latest"
echo "   kubectl rollout restart deployment/fleet-app -n fleet-management"
echo ""
echo "6. Verify fix:"
echo "   npx playwright test e2e/production-deep-diagnosis.spec.ts"
echo ""
echo "=========================================="
