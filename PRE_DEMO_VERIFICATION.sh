#!/bin/bash
# Pre-Demo Verification Script
# Run this 15 minutes before demo to ensure everything is ready

echo "🚀 Fleet Management System - Pre-Demo Verification"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to print check result
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((CHECKS_FAILED++))
    fi
}

echo -e "${BLUE}1. Production API Health Check${NC}"
echo "Testing: https://fleet.capitaltechalliance.com/api/health"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://fleet.capitaltechalliance.com/api/health)
if [ "$API_RESPONSE" -eq 200 ]; then
    HEALTH_STATUS=$(curl -s https://fleet.capitaltechalliance.com/api/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        check_result 0 "Production API is healthy and responding"
    else
        check_result 1 "Production API returned status: $HEALTH_STATUS"
    fi
else
    check_result 1 "Production API not responding (HTTP $API_RESPONSE)"
fi
echo ""

echo -e "${BLUE}2. API Documentation Accessibility${NC}"
echo "Testing: https://fleet.capitaltechalliance.com/api/docs"
DOCS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://fleet.capitaltechalliance.com/api/docs)
if [ "$DOCS_RESPONSE" -eq 200 ]; then
    check_result 0 "API documentation is accessible"
else
    check_result 1 "API documentation not accessible (HTTP $DOCS_RESPONSE)"
fi
echo ""

echo -e "${BLUE}3. Demo Materials Check${NC}"
DEMO_FILES=(
    "DEMO_SCRIPT_TONIGHT.md"
    "DEMO_CHECKLIST.md"
    "EXECUTIVE_SUMMARY.md"
    "REQUIREMENTS_STATUS.md"
    "QUICK_API_TESTS.sh"
    "mobile-apps/AI_DAMAGE_DETECTION_IMPLEMENTATION.md"
    "mobile-apps/LIDAR_3D_SCANNING_IMPLEMENTATION.md"
)

for file in "${DEMO_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_result 0 "Found: $file"
    else
        check_result 1 "Missing: $file"
    fi
done
echo ""

echo -e "${BLUE}4. Core Implementation Files Check${NC}"
CORE_FILES=(
    "api/src/services/samsara.service.ts"
    "api/src/services/smartcar.service.ts"
    "api/src/routes/telematics.routes.ts"
    "api/src/routes/smartcar.routes.ts"
    "api/src/jobs/telematics-sync.ts"
    "api/src/migrations/009_telematics_integration.sql"
    "mobile-apps/ios/BarcodeScannerView.swift"
    "mobile-apps/android/BarcodeScannerActivity.kt"
)

for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_result 0 "Found: $file"
    else
        check_result 1 "Missing: $file"
    fi
done
echo ""

echo -e "${BLUE}5. Git Repository Status${NC}"
if git rev-parse --git-dir > /dev/null 2>&1; then
    check_result 0 "Git repository initialized"

    # Check for uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        check_result 0 "All changes committed"
    else
        check_result 1 "Uncommitted changes exist"
        echo -e "${YELLOW}   Run: git add . && git commit -m 'Pre-demo commit'${NC}"
    fi
else
    check_result 1 "Not a git repository"
fi
echo ""

echo -e "${BLUE}6. Environment Variables Check${NC}"
if [ -f "api/.env" ]; then
    check_result 0 "API environment file exists"

    # Check for critical variables
    if grep -q "SAMSARA_API_KEY" api/.env; then
        check_result 0 "Samsara API key configured"
    else
        check_result 1 "Samsara API key not found"
    fi

    if grep -q "SMARTCAR_CLIENT_ID" api/.env; then
        check_result 0 "Smartcar client ID configured"
    else
        check_result 1 "Smartcar client ID not found"
    fi
else
    check_result 1 "API environment file missing"
fi
echo ""

echo -e "${BLUE}7. Quick API Tests${NC}"
if [ -f "QUICK_API_TESTS.sh" ]; then
    check_result 0 "Quick API test script exists"
    if [ -x "QUICK_API_TESTS.sh" ]; then
        check_result 0 "Quick API test script is executable"
    else
        check_result 1 "Quick API test script not executable"
        echo -e "${YELLOW}   Run: chmod +x QUICK_API_TESTS.sh${NC}"
    fi
else
    check_result 1 "Quick API test script missing"
fi
echo ""

echo "=================================================="
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo "=================================================="
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}✅ YOU ARE READY FOR THE DEMO!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review DEMO_SCRIPT_TONIGHT.md"
    echo "2. Open browser tabs:"
    echo "   - https://fleet.capitaltechalliance.com/api/docs"
    echo "   - Code editor with Fleet project"
    echo "3. Test screen sharing and audio"
    echo "4. Have DEMO_CHECKLIST.md open during demo"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  SOME CHECKS FAILED${NC}"
    echo -e "${YELLOW}Please address the failed checks before the demo.${NC}"
    echo ""
    exit 1
fi
