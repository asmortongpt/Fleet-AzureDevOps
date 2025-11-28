#!/bin/bash
#
# Fleet Management Smoke Tests
# Quick health and functionality checks
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-https://fleet.capitaltechalliance.com}"
TIMEOUT=10

echo "🏥 Fleet Management Smoke Tests"
echo "================================"
echo "Target: $BASE_URL"
echo ""

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -n "Testing: $name ... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $status)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (HTTP $status, expected $expected_status)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test function with content check
test_content() {
    local name="$1"
    local url="$2"
    local expected_content="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -n "Testing: $name ... "
    
    content=$(curl -s --max-time $TIMEOUT "$url" || echo "")
    
    if echo "$content" | grep -q "$expected_content"; then
        echo -e "${GREEN}PASS${NC} (content found)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (content not found: $expected_content)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Run tests
echo "🧪 Running smoke tests..."
echo ""

# Critical endpoints
test_endpoint "Homepage" "$BASE_URL/" 200
test_endpoint "Health Check" "$BASE_URL/health" 200 || test_endpoint "Health Check (alt)" "$BASE_URL/api/health" 200

# Content checks
test_content "Homepage HTML" "$BASE_URL/" "<title>"
test_content "Homepage React" "$BASE_URL/" "root"

# Static assets (if accessible)
test_endpoint "Favicon" "$BASE_URL/favicon.ico" 200 || echo -e "${YELLOW}WARNING${NC}: Favicon not accessible (non-critical)"

# API endpoints (if available)
if curl -s --max-time 2 "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo ""
    echo "🔌 API tests..."
    test_endpoint "API Health" "$BASE_URL/api/health" 200
    test_endpoint "API Status" "$BASE_URL/api/status" 200 || echo -e "${YELLOW}INFO${NC}: /api/status not found (may not exist)"
fi

# Performance check
echo ""
echo "⚡ Performance check..."
PERF_URL="$BASE_URL/"
echo -n "Measuring response time... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 30 "$PERF_URL")
response_ms=$(echo "$response_time * 1000" | bc)
echo "${response_ms}ms"

if (( $(echo "$response_time < 3.0" | bc -l) )); then
    echo -e "${GREEN}✓${NC} Response time acceptable (< 3s)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠${NC} Response time slow (> 3s)"
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Summary
echo ""
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo "Total:  $TESTS_RUN"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
