#!/bin/bash

###############################################################################
# Service Worker Cache Fix Verification Script
# Verifies that the cache poisoning fix is working correctly
###############################################################################

set -e

echo "================================================================"
echo "CTAFleet Service Worker Cache Fix Verification"
echo "================================================================"
echo ""

PRODUCTION_URL="${1:-http://localhost:5173}"
echo "Testing URL: $PRODUCTION_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

test_passed() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_failed() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "=== Critical Files Check ==="
echo ""

# Test 1: Service worker exists
echo -n "Checking sw.js exists... "
if curl -sL -w "%{http_code}" "$PRODUCTION_URL/sw.js" -o /dev/null | grep -q "200"; then
    test_passed "sw.js is accessible"
else
    test_failed "sw.js returned non-200 status"
fi

# Test 2: Service worker has correct version
echo -n "Checking sw.js version... "
SW_CONTENT=$(curl -sL "$PRODUCTION_URL/sw.js")
if echo "$SW_CONTENT" | grep -q "ctafleet-v1.0.2"; then
    test_passed "Service worker version is v1.0.2"
else
    test_failed "Service worker version is NOT v1.0.2"
    echo "   Found version:"
    echo "$SW_CONTENT" | grep "CACHE_VERSION" | head -1
fi

# Test 3: Service worker has NEVER_CACHE list
echo -n "Checking NEVER_CACHE implementation... "
if echo "$SW_CONTENT" | grep -q "NEVER_CACHE"; then
    test_passed "NEVER_CACHE list exists"
else
    test_failed "NEVER_CACHE list not found"
fi

# Test 4: Service worker bypasses cache for index.html
echo -n "Checking index.html cache bypass... "
if echo "$SW_CONTENT" | grep -q "Network-only (never cache)"; then
    test_passed "Network-only strategy for critical assets"
else
    test_failed "Network-only strategy not implemented"
fi

echo ""
echo "=== Cache Clear Utility Check ==="
echo ""

# Test 5: clear-cache.html exists
echo -n "Checking clear-cache.html exists... "
if curl -sL -w "%{http_code}" "$PRODUCTION_URL/clear-cache.html" -o /dev/null | grep -q "200"; then
    test_passed "clear-cache.html is accessible"
else
    test_failed "clear-cache.html returned non-200 status"
fi

# Test 6: clear-cache.html has clear functionality
echo -n "Checking clear-cache.html functionality... "
CLEAR_CACHE_CONTENT=$(curl -sL "$PRODUCTION_URL/clear-cache.html")
if echo "$CLEAR_CACHE_CONTENT" | grep -q "clearAllCaches"; then
    test_passed "clear-cache.html has clearAllCaches function"
else
    test_failed "clearAllCaches function not found"
fi

echo ""
echo "=== Offline Support Check ==="
echo ""

# Test 7: offline.html exists
echo -n "Checking offline.html exists... "
if curl -sL -w "%{http_code}" "$PRODUCTION_URL/offline.html" -o /dev/null | grep -q "200"; then
    test_passed "offline.html is accessible"
else
    test_failed "offline.html returned non-200 status"
fi

# Test 8: manifest.json exists
echo -n "Checking manifest.json exists... "
if curl -sL -w "%{http_code}" "$PRODUCTION_URL/manifest.json" -o /dev/null | grep -q "200"; then
    test_passed "manifest.json is accessible"
else
    test_failed "manifest.json returned non-200 status"
fi

echo ""
echo "=== Index.html Bundle Reference Check ==="
echo ""

# Test 9: index.html references correct bundle
echo -n "Checking index.html bundle references... "
INDEX_CONTENT=$(curl -sL "$PRODUCTION_URL/")
if echo "$INDEX_CONTENT" | grep -q "index-CouUt7cy.js"; then
    test_passed "index.html references current bundle (index-CouUt7cy.js)"
else
    test_warning "index.html may reference different bundle (check if this is expected)"
    echo "   Found bundles:"
    echo "$INDEX_CONTENT" | grep -o 'index-[^"]*\.js' | head -1
fi

# Test 10: index.html has cache control meta tags
echo -n "Checking cache control meta tags... "
if echo "$INDEX_CONTENT" | grep -q 'no-cache'; then
    test_passed "Cache control meta tags present"
else
    test_failed "Cache control meta tags missing"
fi

# Test 11: runtime-config.js exists
echo -n "Checking runtime-config.js exists... "
if curl -sL -w "%{http_code}" "$PRODUCTION_URL/runtime-config.js" -o /dev/null | grep -q "200"; then
    test_passed "runtime-config.js is accessible"
else
    test_failed "runtime-config.js returned non-200 status"
fi

echo ""
echo "=== Bundle Availability Check ==="
echo ""

# Test 12: Current bundle is available
echo -n "Checking current bundle availability... "
BUNDLE_URL=$(echo "$INDEX_CONTENT" | grep -o '/assets/js/index-[^"]*\.js' | head -1)
if [ -n "$BUNDLE_URL" ]; then
    if curl -sL -w "%{http_code}" "$PRODUCTION_URL$BUNDLE_URL" -o /dev/null | grep -q "200"; then
        test_passed "Current bundle is available: $BUNDLE_URL"
    else
        test_failed "Current bundle NOT available: $BUNDLE_URL"
    fi
else
    test_failed "Could not find bundle reference in index.html"
fi

echo ""
echo "================================================================"
echo "VERIFICATION SUMMARY"
echo "================================================================"
echo ""
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Cache fix is working correctly.${NC}"
    echo ""
    echo "Service Worker Status: HEALTHY"
    echo "Cache Version: v1.0.2"
    echo "White Screen Risk: RESOLVED"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the issues above.${NC}"
    echo ""
    echo "Service Worker Status: NEEDS ATTENTION"
    echo ""
    exit 1
fi
