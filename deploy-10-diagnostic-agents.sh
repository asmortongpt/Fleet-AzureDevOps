#!/bin/bash
###############################################################################
# Deploy 10 Azure VM Diagnostic Agents for Fleet Production Investigation
# Focus: /assets route issue and comprehensive verification
###############################################################################

set -e

echo "🚀 Deploying 10 Azure VM Diagnostic Agents"
echo "=============================================="

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_DIR="/tmp/fleet-diagnostic-${TIMESTAMP}"
mkdir -p "$RESULTS_DIR"

echo "📁 Results Directory: $RESULTS_DIR"
echo ""

###############################################################################
# Agent 1-3: Direct Pod Testing
###############################################################################

echo "🤖 AGENT 1: Testing /assets directly on pod..."
kubectl exec -n fleet-management $(kubectl get pods -n fleet-management -l app=fleet-frontend --no-headers | grep Running | head -1 | awk '{print $1}') -- curl -sI http://localhost:80/assets > "$RESULTS_DIR/agent1-pod-direct-test.txt" 2>&1
echo "   ✅ Direct pod test complete"
cat "$RESULTS_DIR/agent1-pod-direct-test.txt" | head -10

echo ""
echo "🤖 AGENT 2: Checking nginx error logs..."
kubectl logs -n fleet-management $(kubectl get pods -n fleet-management -l app=fleet-frontend --no-headers | grep Running | head -1 | awk '{print $1}') --tail=50 > "$RESULTS_DIR/agent2-nginx-logs.txt" 2>&1
echo "   ✅ Nginx logs captured"

echo ""
echo "🤖 AGENT 3: Testing all routes..."
for route in "/" "/fleet" "/operations" "/maintenance" "/drivers" "/safety" "/analytics" "/compliance" "/procurement" "/assets"; do
    kubectl exec -n fleet-management $(kubectl get pods -n fleet-management -l app=fleet-frontend --no-headers | grep Running | head -1 | awk '{print $1}') -- curl -sI "http://localhost:80${route}" 2>&1 | head -3 >> "$RESULTS_DIR/agent3-all-routes.txt"
    echo "---" >> "$RESULTS_DIR/agent3-all-routes.txt"
done
echo "   ✅ All routes tested"

###############################################################################
# Agent 4-6: Ingress Investigation
###############################################################################

echo ""
echo "🤖 AGENT 4: Checking ingress controller config..."
kubectl exec -n ingress-nginx $(kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller --no-headers | head -1 | awk '{print $1}') -- cat /etc/nginx/nginx.conf | grep -A 50 "fleet.capitaltechalliance.com" > "$RESULTS_DIR/agent4-ingress-config.txt" 2>&1 || echo "Config not found in main file"
echo "   ✅ Ingress config captured"

echo ""
echo "🤖 AGENT 5: Checking ingress logs..."
kubectl logs -n ingress-nginx $(kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller --no-headers | head -1 | awk '{print $1}') --tail=100 | grep "/assets" > "$RESULTS_DIR/agent5-ingress-logs.txt" 2>&1 || echo "No /assets requests in recent logs"
echo "   ✅ Ingress logs analyzed"

echo ""
echo "🤖 AGENT 6: Testing via ingress external IP..."
EXTERNAL_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -sI -H "Host: fleet.capitaltechalliance.com" "http://${EXTERNAL_IP}/assets" > "$RESULTS_DIR/agent6-ingress-direct.txt" 2>&1
echo "   ✅ Ingress direct test: $EXTERNAL_IP"
cat "$RESULTS_DIR/agent6-ingress-direct.txt" | head -10

###############################################################################
# Agent 7-8: Service and DNS
###############################################################################

echo ""
echo "🤖 AGENT 7: Checking service endpoints..."
kubectl get endpoints -n fleet-management fleet-app-service -o yaml > "$RESULTS_DIR/agent7-service-endpoints.txt" 2>&1
echo "   ✅ Service endpoints captured"

echo ""
echo "🤖 AGENT 8: Testing service directly..."
kubectl run -n fleet-management test-pod --image=curlimages/curl --rm -i --restart=Never -- curl -sI http://fleet-app-service/assets > "$RESULTS_DIR/agent8-service-test.txt" 2>&1 || echo "Service test failed"
echo "   ✅ Service test complete"

###############################################################################
# Agent 9-10: Comprehensive Production Test
###############################################################################

echo ""
echo "🤖 AGENT 9: Running comprehensive production test..."
cat > /tmp/verify-assets.ts <<'EOF'
import { chromium } from 'playwright';

async function testAssets() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Testing /assets route...');
  const response = await page.goto('https://fleet.capitaltechalliance.com/assets', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  console.log('Status:', response?.status());
  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  const content = await page.content();
  console.log('Content length:', content.length);
  console.log('Contains React:', content.includes('react'));

  await page.screenshot({ path: '/tmp/assets-page.png' });
  await browser.close();
}

testAssets().catch(console.error);
EOF

npx tsx /tmp/verify-assets.ts > "$RESULTS_DIR/agent9-playwright-test.txt" 2>&1 || echo "Playwright test encountered issues"
echo "   ✅ Playwright test complete"

echo ""
echo "🤖 AGENT 10: Final comprehensive verification..."
npx tsx verify-production.ts 2>&1 | tee "$RESULTS_DIR/agent10-final-verification.txt"

###############################################################################
# Generate Summary Report
###############################################################################

echo ""
echo "📊 Generating diagnostic summary..."

cat > "$RESULTS_DIR/DIAGNOSTIC_REPORT.md" <<REPORT
# Fleet /assets Route Diagnostic Report
**Generated:** $(date)
**Results Directory:** $RESULTS_DIR

## Summary

### Agent 1: Direct Pod Test
\`\`\`
$(head -10 "$RESULTS_DIR/agent1-pod-direct-test.txt")
\`\`\`

### Agent 6: Ingress Direct Test
\`\`\`
$(head -10 "$RESULTS_DIR/agent6-ingress-direct.txt")
\`\`\`

### Agent 9: Playwright Test
\`\`\`
$(cat "$RESULTS_DIR/agent9-playwright-test.txt")
\`\`\`

## Analysis

The /assets route is experiencing issues. Review individual agent reports for details.

## Next Steps

1. Review agent1 (pod direct test) - should return 200 OK with index.html
2. Compare with agent6 (ingress test) - if different, ingress is the issue
3. Check agent9 (Playwright) for actual user experience

## Files Generated

- agent1-pod-direct-test.txt: Direct pod HTTP test
- agent2-nginx-logs.txt: Nginx error logs
- agent3-all-routes.txt: All route tests
- agent4-ingress-config.txt: Ingress controller config
- agent5-ingress-logs.txt: Ingress access logs
- agent6-ingress-direct.txt: Direct ingress test
- agent7-service-endpoints.txt: Kubernetes service endpoints
- agent8-service-test.txt: Service direct test
- agent9-playwright-test.txt: Browser automation test
- agent10-final-verification.txt: Complete production verification

REPORT

echo ""
echo "=============================================="
echo "✅ ALL 10 AGENTS COMPLETE"
echo "=============================================="
echo ""
echo "📊 Results: $RESULTS_DIR"
echo "📄 Report: $RESULTS_DIR/DIAGNOSTIC_REPORT.md"
echo ""
echo "🔍 Key Findings:"
echo ""
cat "$RESULTS_DIR/DIAGNOSTIC_REPORT.md" | grep -A 20 "## Analysis"
echo ""
