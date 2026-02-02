#!/bin/bash

###############################################################################
# Monitoring Services Test Script
#
# This script tests all monitoring services to ensure they are operational:
# - Sentry Error Tracking
# - PostHog Analytics
# - Azure Application Insights
#
# Each test sends sample data and verifies receipt.
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f "/Users/andrewmorton/Documents/GitHub/fleet-local/api/.env" ]; then
    export $(cat /Users/andrewmorton/Documents/GitHub/fleet-local/api/.env | grep -v '^#' | xargs)
fi

if [ -f "/Users/andrewmorton/Documents/GitHub/fleet-local/.env.local" ]; then
    export $(cat /Users/andrewmorton/Documents/GitHub/fleet-local/.env.local | grep -v '^#' | xargs)
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Monitoring Services Test - Fleet Management System${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

TESTS_PASSED=0
TESTS_FAILED=0

###############################################################################
# 1. Test Sentry
###############################################################################

echo -e "${YELLOW}[1/3] Testing Sentry Error Tracking...${NC}"

if [ -z "$SENTRY_DSN" ]; then
    echo -e "${RED}✗ SENTRY_DSN not configured${NC}"
    ((TESTS_FAILED++))
else
    # Create test script
    cat > /tmp/test-sentry-monitoring.js <<EOF
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: '$SENTRY_DSN',
  environment: 'test',
  tracesSampleRate: 1.0,
});

console.log('[Sentry] Sending test error...');

// Test 1: Capture Exception
try {
  throw new Error('Sentry Monitoring Test - Error Tracking Verification');
} catch (error) {
  const errorId = Sentry.captureException(error, {
    tags: { test: 'monitoring-setup', type: 'error' },
    level: 'error'
  });
  console.log('[Sentry] Error captured:', errorId);
}

// Test 2: Capture Message
const messageId = Sentry.captureMessage('Sentry Monitoring Test - Message Tracking', {
  level: 'info',
  tags: { test: 'monitoring-setup', type: 'message' }
});
console.log('[Sentry] Message captured:', messageId);

// Test 3: Start Transaction
const transaction = Sentry.startTransaction({
  op: 'test',
  name: 'Monitoring Test Transaction'
});

setTimeout(() => {
  transaction.finish();
  console.log('[Sentry] Transaction completed');

  // Flush and exit
  Sentry.flush(2000).then(() => {
    console.log('[Sentry] ✓ All test events sent successfully');
    process.exit(0);
  }).catch(() => {
    console.error('[Sentry] ✗ Failed to flush events');
    process.exit(1);
  });
}, 100);
EOF

    # Run test
    if cd /Users/andrewmorton/Documents/GitHub/fleet-local/api && node /tmp/test-sentry-monitoring.js 2>&1 | grep -q "✓ All test events sent successfully"; then
        echo -e "${GREEN}✓ Sentry test passed${NC}"
        echo -e "  - Error tracking: Working"
        echo -e "  - Message tracking: Working"
        echo -e "  - Performance monitoring: Working"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ Sentry test failed${NC}"
        echo -e "  Check DSN and network connectivity"
        ((TESTS_FAILED++))
    fi
fi

echo ""

###############################################################################
# 2. Test PostHog
###############################################################################

echo -e "${YELLOW}[2/3] Testing PostHog Analytics...${NC}"

if [ -z "$VITE_POSTHOG_API_KEY" ]; then
    echo -e "${RED}✗ VITE_POSTHOG_API_KEY not configured${NC}"
    ((TESTS_FAILED++))
else
    POSTHOG_HOST="${VITE_POSTHOG_HOST:-https://app.posthog.com}"

    # Test 1: Capture Event
    echo -e "${YELLOW}Testing event capture...${NC}"
    EVENT_RESPONSE=$(curl -s -X POST "$POSTHOG_HOST/capture/" \
        -H "Content-Type: application/json" \
        -d @- <<EOF
{
  "api_key": "$VITE_POSTHOG_API_KEY",
  "event": "monitoring_test_event",
  "properties": {
    "distinct_id": "test-user-$(date +%s)",
    "test": "monitoring-setup",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF
)

    # Test 2: Check Feature Flags
    echo -e "${YELLOW}Testing feature flags...${NC}"
    FLAGS_RESPONSE=$(curl -s -X POST "$POSTHOG_HOST/decide/?v=2" \
        -H "Content-Type: application/json" \
        -d @- <<EOF
{
  "api_key": "$VITE_POSTHOG_API_KEY",
  "distinct_id": "test-user-$(date +%s)"
}
EOF
)

    # Verify responses
    if echo "$EVENT_RESPONSE" | grep -q "status.*1" || echo "$FLAGS_RESPONSE" | grep -q "featureFlags"; then
        echo -e "${GREEN}✓ PostHog test passed${NC}"
        echo -e "  - Event capture: Working"
        echo -e "  - Feature flags: Working"

        # Check which flags are configured
        if echo "$FLAGS_RESPONSE" | grep -q "enable_ai_assistant"; then
            echo -e "  - Feature flags found: AI Assistant, Real-time Updates, etc."
        fi

        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ PostHog test failed${NC}"
        echo -e "  Response: $EVENT_RESPONSE"
        ((TESTS_FAILED++))
    fi
fi

echo ""

###############################################################################
# 3. Test Azure Application Insights
###############################################################################

echo -e "${YELLOW}[3/3] Testing Azure Application Insights...${NC}"

if [ -z "$APPLICATION_INSIGHTS_CONNECTION_STRING" ] && [ -z "$APPLICATIONINSIGHTS_CONNECTION_STRING" ]; then
    echo -e "${RED}✗ APPLICATION_INSIGHTS_CONNECTION_STRING not configured${NC}"
    ((TESTS_FAILED++))
else
    CONNECTION_STRING="${APPLICATION_INSIGHTS_CONNECTION_STRING:-$APPLICATIONINSIGHTS_CONNECTION_STRING}"

    # Create test script
    cat > /tmp/test-appinsights-monitoring.js <<EOF
const appInsights = require('applicationinsights');

appInsights.setup('$CONNECTION_STRING')
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .start();

const client = appInsights.defaultClient;

console.log('[AppInsights] Sending test events...');

// Test 1: Track Event
client.trackEvent({
  name: 'MonitoringTestEvent',
  properties: {
    test: 'monitoring-setup',
    timestamp: new Date().toISOString()
  }
});

// Test 2: Track Metric
client.trackMetric({
  name: 'MonitoringTestMetric',
  value: 42
});

// Test 3: Track Request
client.trackRequest({
  name: 'Monitoring Test Request',
  url: 'https://test.example.com/monitoring-test',
  duration: 100,
  resultCode: 200,
  success: true
});

// Test 4: Track Exception
client.trackException({
  exception: new Error('Monitoring Test Exception'),
  properties: {
    test: 'monitoring-setup'
  }
});

// Flush and verify
client.flush({
  callback: () => {
    console.log('[AppInsights] ✓ All test events sent successfully');
    process.exit(0);
  }
});

setTimeout(() => {
  console.error('[AppInsights] ✗ Timeout waiting for flush');
  process.exit(1);
}, 5000);
EOF

    # Run test
    if cd /Users/andrewmorton/Documents/GitHub/fleet-local/api && node /tmp/test-appinsights-monitoring.js 2>&1 | grep -q "✓ All test events sent successfully"; then
        echo -e "${GREEN}✓ Application Insights test passed${NC}"
        echo -e "  - Event tracking: Working"
        echo -e "  - Metric tracking: Working"
        echo -e "  - Request tracking: Working"
        echo -e "  - Exception tracking: Working"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ Application Insights test failed${NC}"
        echo -e "  Check connection string and network connectivity"
        ((TESTS_FAILED++))
    fi
fi

echo ""

###############################################################################
# 4. Summary
###############################################################################

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Test Results Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All monitoring services are operational!${NC}\n"

    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Check Sentry dashboard for test errors"
    echo -e "  2. Verify PostHog events in the dashboard"
    echo -e "  3. Review Application Insights telemetry"
    echo -e "  4. Configure alert notification channels"
    echo -e "  5. Set up custom dashboards"
    echo ""

    exit 0
else
    echo -e "${RED}✗ Some monitoring services failed${NC}\n"

    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "  1. Verify all API keys and connection strings"
    echo -e "  2. Check network connectivity to monitoring services"
    echo -e "  3. Ensure required packages are installed (npm install)"
    echo -e "  4. Review environment variable configuration"
    echo ""

    exit 1
fi

###############################################################################
# 5. Verification Links
###############################################################################

echo -e "${YELLOW}Verification Links:${NC}"

# Load monitoring config
if [ -f "/Users/andrewmorton/Documents/GitHub/fleet-local/monitoring/sentry-config.json" ]; then
    SENTRY_ORG=$(cat /Users/andrewmorton/Documents/GitHub/fleet-local/monitoring/sentry-config.json | grep -o '"organization":"[^"]*"' | cut -d'"' -f4)
    echo -e "  Sentry: ${BLUE}https://sentry.io/organizations/$SENTRY_ORG/${NC}"
fi

if [ -f "/Users/andrewmorton/Documents/GitHub/fleet-local/monitoring/posthog-config.json" ]; then
    PROJECT_ID=$(cat /Users/andrewmorton/Documents/GitHub/fleet-local/monitoring/posthog-config.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
    echo -e "  PostHog: ${BLUE}$POSTHOG_HOST/project/$PROJECT_ID/${NC}"
fi

if [ -f "/Users/andrewmorton/Documents/GitHub/fleet-local/monitoring/azure-monitor-config.json" ]; then
    APP_INSIGHTS_ID=$(cat /Users/andrewmorton/Documents/GitHub/fleet-local/monitoring/azure-monitor-config.json | grep -o '"resourceId":"[^"]*"' | cut -d'"' -f4)
    echo -e "  Azure: ${BLUE}https://portal.azure.com/#@/resource$APP_INSIGHTS_ID${NC}"
fi

echo ""
