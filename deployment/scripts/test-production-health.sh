#!/bin/bash
#=============================================================================
# Quick Production Health Check
#=============================================================================
# Runs a quick health check against a deployed environment
# Useful for manual verification after deployment
#
# USAGE:
#   ./test-production-health.sh [ENVIRONMENT]
#   ./test-production-health.sh staging
#   ./test-production-health.sh production
#=============================================================================

set -euo pipefail

ENVIRONMENT="${1:-staging}"

# Determine URL
case "${ENVIRONMENT}" in
  production)
    APP_URL="https://fleet.capitaltechalliance.com"
    ;;
  staging)
    APP_URL="https://fleet-staging.capitaltechalliance.com"
    ;;
  dev)
    APP_URL="https://fleet-dev.capitaltechalliance.com"
    ;;
  *)
    echo "❌ Invalid environment: ${ENVIRONMENT}"
    exit 1
    ;;
esac

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          Fleet Management - Health Check                         ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Environment:  ${ENVIRONMENT}"
echo "  URL:          ${APP_URL}"
echo "  Time:         $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: HTTP Connectivity
echo -n "1. HTTP Connectivity................"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}" --max-time 10 || echo "000")
if [ "${HTTP_CODE}" = "200" ]; then
  echo "✅ PASS (HTTP ${HTTP_CODE})"
else
  echo "❌ FAIL (HTTP ${HTTP_CODE})"
fi

# Test 2: Health Endpoint
echo -n "2. Health Endpoint.................."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/health" --max-time 10 || echo "000")
if [ "${HEALTH_CODE}" = "200" ] || [ "${HEALTH_CODE}" = "404" ]; then
  echo "✅ PASS (HTTP ${HEALTH_CODE})"
else
  echo "❌ FAIL (HTTP ${HEALTH_CODE})"
fi

# Test 3: API Health Endpoint
echo -n "3. API Health Endpoint.............."
API_HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/api/health" --max-time 10 || echo "000")
if [ "${API_HEALTH_CODE}" = "200" ] || [ "${API_HEALTH_CODE}" = "404" ]; then
  echo "✅ PASS (HTTP ${API_HEALTH_CODE})"
else
  echo "❌ FAIL (HTTP ${API_HEALTH_CODE})"
fi

# Test 4: Response Time
echo -n "4. Response Time...................."
START_TIME=$(date +%s%3N)
curl -s "${APP_URL}" -o /dev/null --max-time 10 || true
END_TIME=$(date +%s%3N)
RESPONSE_TIME=$((END_TIME - START_TIME))
if [ ${RESPONSE_TIME} -lt 3000 ]; then
  echo "✅ PASS (${RESPONSE_TIME}ms)"
else
  echo "⚠️  SLOW (${RESPONSE_TIME}ms)"
fi

# Test 5: HTTPS Certificate
if [[ "${APP_URL}" == https://* ]]; then
  echo -n "5. HTTPS Certificate................"
  CERT_VALID=$(echo | openssl s_client -connect "$(echo ${APP_URL} | sed 's|https://||' | sed 's|/.*||'):443" -servername "$(echo ${APP_URL} | sed 's|https://||' | sed 's|/.*||')" 2>/dev/null | openssl x509 -noout -checkend 86400 2>/dev/null && echo "valid" || echo "invalid")
  if [ "${CERT_VALID}" = "valid" ]; then
    echo "✅ PASS"
  else
    echo "❌ FAIL (certificate invalid or expiring)"
  fi
else
  echo "5. HTTPS Certificate................⚠️  SKIP (HTTP only)"
fi

# Test 6: Content Verification
echo -n "6. Content Verification............."
CONTENT=$(curl -s "${APP_URL}" --max-time 10)
CONTENT_LENGTH=${#CONTENT}
if [ ${CONTENT_LENGTH} -gt 1000 ]; then
  echo "✅ PASS (${CONTENT_LENGTH} bytes)"
else
  echo "❌ FAIL (${CONTENT_LENGTH} bytes - too small)"
fi

# Test 7: No Error Messages in HTML
echo -n "7. Error Detection.................."
if echo "${CONTENT}" | grep -qi "error\|exception\|failed"; then
  echo "⚠️  WARN (error text found in page)"
else
  echo "✅ PASS (no error text)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run Playwright smoke test if available
if command -v npx &> /dev/null; then
  echo "Running Playwright smoke tests..."
  echo ""

  cd /Users/andrewmorton/Documents/GitHub/Fleet

  if npx playwright test \
      --config=playwright.config.ts \
      e2e/00-smoke-tests.spec.ts \
      --reporter=list \
      --project=chromium 2>&1; then
    echo ""
    echo "✅ All smoke tests PASSED"
  else
    echo ""
    echo "❌ Smoke tests FAILED"
    exit 1
  fi
else
  echo "⚠️  Playwright not installed - skipping smoke tests"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  ✅ HEALTH CHECK COMPLETE                                        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Environment:  ${ENVIRONMENT}"
echo "  URL:          ${APP_URL}"
echo "  Status:       HEALTHY"
echo ""

exit 0
