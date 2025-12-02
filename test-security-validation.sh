#!/bin/bash

# Security Configuration Validation Test Script
# Tests that security improvements are working correctly

echo "=================================================="
echo "Security Configuration Validation Tests"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local expected_result="$2"
    shift 2
    local command="$@"

    echo "Testing: $test_name"

    # Run command and capture exit code
    output=$($command 2>&1)
    exit_code=$?

    if [ "$expected_result" = "fail" ]; then
        # We expect the server to fail
        if [ $exit_code -ne 0 ]; then
            echo -e "${GREEN}✅ PASS${NC}: Server correctly failed to start"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC}: Server should have failed but didn't"
            ((TESTS_FAILED++))
        fi
    else
        # We expect the server to succeed
        if [ $exit_code -eq 0 ]; then
            echo -e "${GREEN}✅ PASS${NC}: Server started successfully"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC}: Server failed to start"
            ((TESTS_FAILED++))
        fi
    fi

    # Show relevant output
    if echo "$output" | grep -q "FATAL SECURITY ERROR"; then
        echo -e "${YELLOW}Security Error Detected:${NC}"
        echo "$output" | grep "FATAL SECURITY ERROR" | head -3
    fi

    echo ""
}

echo "Test 1: No JWT_SECRET"
echo "Expected: Server fails to start"
echo "---"
JWT_SECRET="" CSRF_SECRET="test-csrf-secret-at-least-32-chars" timeout 5 npm --prefix api run dev > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Server correctly failed without JWT_SECRET"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Server should have failed without JWT_SECRET"
    ((TESTS_FAILED++))
fi
echo ""

echo "Test 2: Short JWT_SECRET (< 32 chars)"
echo "Expected: Server fails to start"
echo "---"
JWT_SECRET="short" CSRF_SECRET="test-csrf-secret-at-least-32-chars" timeout 5 npm --prefix api run dev > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Server correctly failed with short JWT_SECRET"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Server should have failed with short JWT_SECRET"
    ((TESTS_FAILED++))
fi
echo ""

echo "Test 3: Weak JWT_SECRET pattern"
echo "Expected: Server fails to start"
echo "---"
JWT_SECRET="changeme-changeme-changeme-changeme" CSRF_SECRET="test-csrf-secret-at-least-32-chars" timeout 5 npm --prefix api run dev > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Server correctly failed with weak JWT_SECRET"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Server should have failed with weak JWT_SECRET"
    ((TESTS_FAILED++))
fi
echo ""

echo "Test 4: No CSRF_SECRET"
echo "Expected: Server fails to start"
echo "---"
JWT_SECRET="test-jwt-secret-that-is-long-enough-32-characters" CSRF_SECRET="" timeout 5 npm --prefix api run dev > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Server correctly failed without CSRF_SECRET"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Server should have failed without CSRF_SECRET"
    ((TESTS_FAILED++))
fi
echo ""

echo "Test 5: Short CSRF_SECRET (< 32 chars)"
echo "Expected: Server fails to start"
echo "---"
JWT_SECRET="test-jwt-secret-that-is-long-enough-32-characters" CSRF_SECRET="short" timeout 5 npm --prefix api run dev > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Server correctly failed with short CSRF_SECRET"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Server should have failed with short CSRF_SECRET"
    ((TESTS_FAILED++))
fi
echo ""

echo "=================================================="
echo "Test Summary"
echo "=================================================="
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All security validation tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some security validation tests failed!${NC}"
    exit 1
fi
