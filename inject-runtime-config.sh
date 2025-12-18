#!/bin/sh
# Inject runtime configuration from environment variables

CONFIG_FILE=/tmp/runtime-config.js

cat > $CONFIG_FILE << JSEOF
window.RUNTIME_CONFIG = {
  VITE_API_URL: '${VITE_API_URL}',
  VITE_AZURE_AD_CLIENT_ID: '${VITE_AZURE_AD_CLIENT_ID}',
  VITE_AZURE_AD_TENANT_ID: '${VITE_AZURE_AD_TENANT_ID}',
  VITE_AZURE_AD_REDIRECT_URI: '${VITE_AZURE_AD_REDIRECT_URI}',
  VITE_ENVIRONMENT: '${VITE_ENVIRONMENT}'
};
JSEOF

# Copy to final location (this works because nginx starts before USER directive takes effect)
cp -f $CONFIG_FILE /usr/share/nginx/html/runtime-config.js || true

echo "✅ Runtime config injected: /usr/share/nginx/html/runtime-config.js"
cat $CONFIG_FILE
