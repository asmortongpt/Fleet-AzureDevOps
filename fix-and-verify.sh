#!/bin/bash

# Fleet Management - Fix All Errors and Verify Deployment
# This script monitors deployment and runs verification tests

set -e

echo "======================================================================"
echo "Fleet Management - Automated Fix & Verification"
echo "======================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Monitor CI/CD Pipeline
echo -e "${YELLOW}📊 Step 1: Monitoring CI/CD Pipeline Deployment${NC}"
echo "Waiting for deployment to complete..."
echo ""

MAX_WAIT=600  # 10 minutes
ELAPSED=0
SLEEP_INTERVAL=15

while [ $ELAPSED -lt $MAX_WAIT ]; do
    STATUS=$(gh run list --workflow="Fleet Management CI/CD Pipeline" --limit 1 --json status,conclusion --jq '.[0]')
    RUN_STATUS=$(echo $STATUS | jq -r '.status')
    RUN_CONCLUSION=$(echo $STATUS | jq -r '.conclusion')

    if [ "$RUN_STATUS" = "completed" ]; then
        if [ "$RUN_CONCLUSION" = "success" ]; then
            echo -e "${GREEN}✅ CI/CD Pipeline completed successfully!${NC}"
            break
        else
            echo -e "${RED}❌ CI/CD Pipeline failed with conclusion: $RUN_CONCLUSION${NC}"
            echo "Checking logs..."
            gh run view --log-failed | tail -50
            exit 1
        fi
    fi

    echo -ne "\rElapsed: ${ELAPSED}s / ${MAX_WAIT}s - Status: $RUN_STATUS..."
    sleep $SLEEP_INTERVAL
    ELAPSED=$((ELAPSED + SLEEP_INTERVAL))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ Deployment timed out after ${MAX_WAIT}s${NC}"
    exit 1
fi

echo ""
echo ""

# Step 2: Wait for pods to be ready
echo -e "${YELLOW}⏳ Step 2: Waiting for pods to be ready (30s)...${NC}"
sleep 30
echo ""

# Step 3: Test CORS Headers
echo -e "${YELLOW}🔍 Step 3: Testing CORS Headers${NC}"
echo "Testing production API CORS configuration..."
echo ""

CORS_TEST=$(curl -I \
    -H "Origin: https://green-pond-0f040980f.3.azurestaticapps.net" \
    -H "Access-Control-Request-Method: GET" \
    -X OPTIONS \
    https://fleet.capitaltechalliance.com/api/vehicles 2>&1)

if echo "$CORS_TEST" | grep -q "access-control-allow-origin"; then
    CORS_ORIGIN=$(echo "$CORS_TEST" | grep -i "access-control-allow-origin" | cut -d: -f2- | tr -d ' \r\n')
    echo -e "${GREEN}✅ CORS Header Found: $CORS_ORIGIN${NC}"
else
    echo -e "${RED}❌ CORS Header Missing!${NC}"
    echo "Response headers:"
    echo "$CORS_TEST" | grep -i "access-control"
fi

echo ""
echo ""

# Step 4: Test API Endpoints
echo -e "${YELLOW}🔍 Step 4: Testing API Endpoints${NC}"
echo ""

for endpoint in "vehicles" "drivers" "health"; do
    echo "Testing /api/$endpoint..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        https://fleet.capitaltechalliance.com/api/$endpoint)

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
        echo -e "${GREEN}✅ /api/$endpoint - HTTP $HTTP_CODE${NC}"
    else
        echo -e "${RED}❌ /api/$endpoint - HTTP $HTTP_CODE${NC}"
    fi
done

echo ""
echo ""

# Step 5: Run Comprehensive Tests
echo -e "${YELLOW}🧪 Step 5: Running Comprehensive End-to-End Tests${NC}"
echo ""

cd /Users/andrewmorton/Documents/GitHub/fleet-app

# Run the comprehensive test
npx playwright test e2e/final-verification.spec.ts --project=chromium --reporter=list || true

echo ""
echo ""

# Step 6: Generate Report
echo -e "${YELLOW}📝 Step 6: Generating Verification Report${NC}"
echo ""

REPORT_FILE="FINAL_DEPLOYMENT_VERIFICATION.md"

cat > $REPORT_FILE <<EOF_REPORT
# Final Deployment Verification Report

**Date:** $(date)
**Commit:** $(git log -1 --oneline)

## Deployment Status

### CI/CD Pipeline
- Status: $RUN_STATUS
- Conclusion: $RUN_CONCLUSION

### CORS Configuration
\`\`\`
$CORS_TEST
\`\`\`

### API Endpoints
Tested endpoints at $(date):

$(for endpoint in "vehicles" "drivers" "health"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" https://fleet.capitaltechalliance.com/api/$endpoint)
    echo "- /api/$endpoint: HTTP $code"
done)

### Test Results
See: test-results/final-verification-report.json

## Summary

$(if echo "$CORS_TEST" | grep -q "access-control-allow-origin"; then
    echo "✅ CORS fix deployed successfully"
else
    echo "❌ CORS fix NOT deployed"
fi)

EOF_REPORT

echo -e "${GREEN}✅ Report generated: $REPORT_FILE${NC}"
echo ""

# Summary
echo "======================================================================"
echo -e "${GREEN}Verification Complete!${NC}"
echo "======================================================================"
echo ""
echo "Review the following files:"
echo "  - $REPORT_FILE"
echo "  - test-results/final-verification-report.json"
echo ""

if echo "$CORS_TEST" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}🎉 SUCCESS: CORS fix is deployed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  WARNING: CORS fix may not be deployed yet${NC}"
    exit 1
fi
