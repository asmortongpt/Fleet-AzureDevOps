#!/bin/bash

echo "🚀 AZURE VM DEPLOYMENT AGENT - FLEET APP"
echo "========================================"

cd ~/fleet || exit 1

echo ""
echo "1️⃣ Checking for Policy Hub..."
POLICY_HUB_FILES=$(find src/ -name "*olicy*ub*" -o -name "*PolicyHub*" 2>/dev/null | wc -l)
if [ "$POLICY_HUB_FILES" -gt 0 ]; then
    echo "✅ Policy Hub found: $POLICY_HUB_FILES files"
    find src/ -name "*olicy*ub*" -o -name "*PolicyHub*" 2>/dev/null | head -10
else
    echo "⚠️  Policy Hub not found in src/"
fi

echo ""
echo "2️⃣ Building production bundle..."
npm run build 2>&1 | tail -20

echo ""
echo "3️⃣ Checking build output..."
if [ -f "dist/index.html" ]; then
    echo "✅ dist/index.html exists ($(ls -lh dist/index.html | awk '{print $5}'))"
    echo "📦 Total dist size: $(du -sh dist/ | awk '{print $1}')"
else
    echo "❌ Build failed - no dist/index.html"
    exit 1
fi

echo ""
echo "4️⃣ Creating Dockerfile..."
cat > Dockerfile.vm << 'EOF'
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
EOF

echo "✅ Dockerfile created"

echo ""
echo "5️⃣ Building Docker image..."
az acr build --registry fleetacr --image fleet-ui:latest --file Dockerfile.vm . 2>&1 | grep -E "Successfully|Step|Pushing|digest"

echo ""
echo "6️⃣ Updating Azure Container App..."
az containerapp update --name fleet-management-ui --resource-group fleet-production-rg --image fleetacr.azurecr.io/fleet-ui:latest 2>&1 | grep -E "provisioningState|runningStatus"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Check: http://fleet.capitaltechalliance.com/"

