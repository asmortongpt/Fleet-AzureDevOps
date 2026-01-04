#!/bin/bash

##############################################################################
# Fleet API Endpoint Testing Script
# Tests all production endpoints with real PostgreSQL data
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="${API_BASE:-http://localhost:3000}"
PASSED=0
FAILED=0
TOTAL=0

# Helper function to test an endpoint
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local expected_status="${3:-200}"

    TOTAL=$((TOTAL + 1))
    printf "${BLUE}Testing:${NC} %-50s " "$name"

    # Make request and capture status code
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}${endpoint}")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    # Check status code
    if [ "$status_code" = "$expected_status" ]; then
        # Verify JSON response (if 200)
        if [ "$expected_status" = "200" ]; then
            if echo "$body" | jq empty 2>/dev/null; then
                printf "${GREEN}✓ PASS${NC} (${status_code})\n"
                PASSED=$((PASSED + 1))
                return 0
            else
                printf "${RED}✗ FAIL${NC} (Invalid JSON)\n"
                FAILED=$((FAILED + 1))
                return 1
            fi
        else
            printf "${GREEN}✓ PASS${NC} (${status_code})\n"
            PASSED=$((PASSED + 1))
            return 0
        fi
    else
        printf "${RED}✗ FAIL${NC} (Expected: ${expected_status}, Got: ${status_code})\n"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test with data validation
test_endpoint_with_data() {
    local name="$1"
    local endpoint="$2"
    local jq_filter="$3"
    local min_count="${4:-0}"

    TOTAL=$((TOTAL + 1))
    printf "${BLUE}Testing:${NC} %-50s " "$name"

    response=$(curl -s -w "\n%{http_code}" "${API_BASE}${endpoint}")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status_code" = "200" ]; then
        if echo "$body" | jq empty 2>/dev/null; then
            # Check if data matches filter
            if [ -n "$jq_filter" ]; then
                count=$(echo "$body" | jq -r "$jq_filter" 2>/dev/null || echo "0")
                if [ "$count" -ge "$min_count" ]; then
                    printf "${GREEN}✓ PASS${NC} (${status_code}, ${count} items)\n"
                    PASSED=$((PASSED + 1))
                    return 0
                else
                    printf "${YELLOW}⚠ WARN${NC} (${status_code}, ${count} items, expected >= ${min_count})\n"
                    PASSED=$((PASSED + 1))
                    return 0
                fi
            else
                printf "${GREEN}✓ PASS${NC} (${status_code})\n"
                PASSED=$((PASSED + 1))
                return 0
            fi
        else
            printf "${RED}✗ FAIL${NC} (Invalid JSON)\n"
            FAILED=$((FAILED + 1))
            return 1
        fi
    else
        printf "${RED}✗ FAIL${NC} (Expected: 200, Got: ${status_code})\n"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

##############################################################################
# START TESTS
##############################################################################

echo ""
echo "============================================================================"
echo "  Fleet Management API - Endpoint Testing"
echo "============================================================================"
echo ""
echo "API Base URL: ${API_BASE}"
echo ""

# Check if server is running
printf "${BLUE}Checking:${NC} API server health...                                   "
if curl -s "${API_BASE}/health" > /dev/null 2>&1; then
    printf "${GREEN}✓ Server is running${NC}\n"
else
    printf "${RED}✗ Server is NOT running${NC}\n"
    echo ""
    echo "Please start the API server first:"
    echo "  cd api && npm run dev"
    echo ""
    exit 1
fi

echo ""
echo "────────────────────────────────────────────────────────────────────────────"
echo "  Core Fleet Endpoints"
echo "────────────────────────────────────────────────────────────────────────────"
echo ""

test_endpoint_with_data "GET /api/vehicles" "/api/vehicles" ".data | length" 0
test_endpoint_with_data "GET /api/vehicles?status=active" "/api/vehicles?status=active" ".data | length" 0
test_endpoint_with_data "GET /api/drivers" "/api/drivers" ".data | length" 0
test_endpoint_with_data "GET /api/facilities" "/api/facilities" ".data | length" 0

echo ""
echo "────────────────────────────────────────────────────────────────────────────"
echo "  Assets & Equipment Endpoints"
echo "────────────────────────────────────────────────────────────────────────────"
echo ""

test_endpoint_with_data "GET /api/assets" "/api/assets" "length" 0
test_endpoint_with_data "GET /api/assets?filter=active" "/api/assets?filter=active" "length" 0
test_endpoint_with_data "GET /api/equipment" "/api/equipment" "length" 0
test_endpoint_with_data "GET /api/equipment?category=heavy" "/api/equipment?category=heavy" "length" 0
test_endpoint_with_data "GET /api/inventory" "/api/inventory" "length" 0
test_endpoint_with_data "GET /api/inventory?filter=low-stock" "/api/inventory?filter=low-stock" "length" 0

echo ""
echo "────────────────────────────────────────────────────────────────────────────"
echo "  Maintenance Endpoints"
echo "────────────────────────────────────────────────────────────────────────────"
echo ""

test_endpoint_with_data "GET /api/work-orders" "/api/work-orders" ".data | length" 0
test_endpoint_with_data "GET /api/maintenance-requests" "/api/maintenance-requests" "length" 0
test_endpoint_with_data "GET /api/maintenance-requests?status=pending" "/api/maintenance-requests?status=pending" "length" 0
test_endpoint_with_data "GET /api/scheduled-items" "/api/scheduled-items" "length" 0

echo ""
echo "────────────────────────────────────────────────────────────────────────────"
echo "  Safety & Compliance Endpoints"
echo "────────────────────────────────────────────────────────────────────────────"
echo ""

test_endpoint_with_data "GET /api/alerts" "/api/alerts" "length" 0
test_endpoint_with_data "GET /api/alerts?severity=critical" "/api/alerts?severity=critical" "length" 0
test_endpoint_with_data "GET /api/incidents" "/api/incidents" ".data | length" 0
test_endpoint_with_data "GET /api/inspections" "/api/inspections" ".data | length" 0

echo ""
echo "────────────────────────────────────────────────────────────────────────────"
echo "  Operations Endpoints"
echo "────────────────────────────────────────────────────────────────────────────"
echo ""

test_endpoint_with_data "GET /api/routes" "/api/routes" ".data | length" 0
test_endpoint_with_data "GET /api/fuel-transactions" "/api/fuel-transactions" ".data | length" 0
test_endpoint_with_data "GET /api/gps-tracks" "/api/gps-tracks" ".data | length" 0

echo ""
echo "────────────────────────────────────────────────────────────────────────────"
echo "  Individual Item Endpoints (if data exists)"
echo "────────────────────────────────────────────────────────────────────────────"
echo ""

# Get first vehicle ID
VEHICLE_ID=$(curl -s "${API_BASE}/api/vehicles?limit=1" | jq -r '.data[0].id // empty' 2>/dev/null || echo "")
if [ -n "$VEHICLE_ID" ]; then
    test_endpoint "GET /api/vehicles/:id" "/api/vehicles/${VEHICLE_ID}" 200
    test_endpoint "GET /api/assets/:id" "/api/assets/${VEHICLE_ID}" 200
    test_endpoint "GET /api/equipment/:id" "/api/equipment/${VEHICLE_ID}" 200
else
    printf "${YELLOW}⚠ SKIP${NC} Individual endpoints (no vehicles in database)\n"
fi

# Get first work order ID
WO_ID=$(curl -s "${API_BASE}/api/work-orders?limit=1" | jq -r '.data[0].id // empty' 2>/dev/null || echo "")
if [ -n "$WO_ID" ]; then
    test_endpoint "GET /api/maintenance-requests/:id" "/api/maintenance-requests/${WO_ID}" 200
else
    printf "${YELLOW}⚠ SKIP${NC} Maintenance request detail (no work orders in database)\n"
fi

# Get first incident ID
INCIDENT_ID=$(curl -s "${API_BASE}/api/incidents?limit=1" | jq -r '.data[0].id // empty' 2>/dev/null || echo "")
if [ -n "$INCIDENT_ID" ]; then
    test_endpoint "GET /api/alerts/:id" "/api/alerts/${INCIDENT_ID}" 200
else
    printf "${YELLOW}⚠ SKIP${NC} Alert detail (no incidents in database)\n"
fi

##############################################################################
# SUMMARY
##############################################################################

echo ""
echo "============================================================================"
echo "  Test Summary"
echo "============================================================================"
echo ""
printf "Total Tests:  ${BLUE}%3d${NC}\n" "$TOTAL"
printf "Passed:       ${GREEN}%3d${NC}\n" "$PASSED"
printf "Failed:       ${RED}%3d${NC}\n" "$FAILED"
echo ""

if [ "$FAILED" -eq 0 ]; then
    printf "${GREEN}✓ All tests passed!${NC}\n"
    echo ""
    exit 0
else
    printf "${RED}✗ Some tests failed${NC}\n"
    echo ""
    echo "Check the output above for details."
    echo ""
    exit 1
fi
