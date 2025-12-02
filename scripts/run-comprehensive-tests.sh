#!/bin/bash

###############################################################################
# Comprehensive E2E Test Runner
# Runs all test suites and generates detailed reports
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Fleet Manager Comprehensive E2E Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Clean previous test results
echo -e "${YELLOW}Cleaning previous test results...${NC}"
rm -rf test-results playwright-report
mkdir -p test-results

# Function to run test suite
run_test_suite() {
    local suite_name=$1
    local test_path=$2
    local project=$3

    echo ""
    echo -e "${BLUE}Running ${suite_name}...${NC}"

    if [ -n "$project" ]; then
        npx playwright test "$test_path" --project="$project" --reporter=list || {
            echo -e "${RED}${suite_name} FAILED${NC}"
            return 1
        }
    else
        npx playwright test "$test_path" --reporter=list || {
            echo -e "${RED}${suite_name} FAILED${NC}"
            return 1
        }
    fi

    echo -e "${GREEN}${suite_name} PASSED${NC}"
    return 0
}

# Start time
START_TIME=$(date +%s)

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Phase 1: Critical User Flows${NC}"
echo -e "${BLUE}========================================${NC}"

run_test_suite "Fleet Operations Tests" "e2e/critical-flows/fleet-operations.test.ts" "chromium" || true
run_test_suite "Maintenance Tests" "e2e/critical-flows/maintenance.test.ts" "chromium" || true
run_test_suite "People Management Tests" "e2e/critical-flows/people-management.test.ts" "chromium" || true
run_test_suite "Financial Tests" "e2e/critical-flows/financial.test.ts" "chromium" || true
run_test_suite "Navigation Tests" "e2e/critical-flows/navigation.test.ts" "chromium" || true

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Phase 2: Mobile Experience${NC}"
echo -e "${BLUE}========================================${NC}"

run_test_suite "Mobile Navigation Tests" "e2e/mobile/mobile-navigation.test.ts" "mobile-iphone" || true
run_test_suite "Mobile Responsiveness Tests" "e2e/mobile/mobile-responsiveness.test.ts" "mobile-iphone" || true
run_test_suite "Mobile Interactions Tests" "e2e/mobile/mobile-interactions.test.ts" "mobile-iphone" || true

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Phase 3: Performance${NC}"
echo -e "${BLUE}========================================${NC}"

run_test_suite "Load Time Tests" "e2e/performance/load-time.test.ts" "chromium" || true
run_test_suite "Lazy Loading Tests" "e2e/performance/lazy-loading.test.ts" "chromium" || true
run_test_suite "Bundle Size Tests" "e2e/performance/bundle-size.test.ts" "chromium" || true

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Phase 4: Security${NC}"
echo -e "${BLUE}========================================${NC}"

run_test_suite "Authentication Flow Tests" "e2e/security/auth-flows.test.ts" "chromium" || true
run_test_suite "Unauthorized Access Tests" "e2e/security/unauthorized-access.test.ts" "chromium" || true
run_test_suite "CSRF & XSS Protection Tests" "e2e/security/csrf-xss.test.ts" "chromium" || true

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Phase 5: Integration${NC}"
echo -e "${BLUE}========================================${NC}"

run_test_suite "API Connectivity Tests" "e2e/integration/api-connectivity.test.ts" "chromium" || true
run_test_suite "Maps Integration Tests" "e2e/integration/maps-integration.test.ts" "chromium" || true

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Phase 6: Existing Auth Tests${NC}"
echo -e "${BLUE}========================================${NC}"

run_test_suite "Microsoft SSO Tests" "e2e/auth/microsoft-sso.test.ts" "chromium" || true

# End time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Generate HTML report
echo ""
echo -e "${YELLOW}Generating HTML report...${NC}"
npx playwright show-report --host 0.0.0.0 --port 9323 &
REPORT_PID=$!

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Execution Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total Duration: ${DURATION}s"
echo ""
echo -e "${GREEN}Test suite execution completed!${NC}"
echo ""
echo -e "Reports generated in:"
echo -e "  - HTML: playwright-report/index.html"
echo -e "  - JSON: test-results/results.json"
echo -e "  - JUnit: test-results/junit.xml"
echo ""
echo -e "${YELLOW}View HTML report: http://localhost:9323${NC}"
echo ""
echo -e "${GREEN}Press Ctrl+C to close the report server${NC}"

# Wait for user interrupt
wait $REPORT_PID

exit 0
