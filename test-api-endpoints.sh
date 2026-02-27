#!/bin/bash
# Fleet API Comprehensive Endpoint Test Script

API_BASE="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "Fleet API Endpoint Test Suite"
echo "========================================="
echo ""

test_count=0
pass_count=0
fail_count=0

test_get() {
    local name=$1
    local endpoint=$2
    local expected_field=$3

    test_count=$((test_count + 1))

    result=$(curl -s "$API_BASE$endpoint")
    if echo "$result" | jq -e ".$expected_field" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} $name"
        fail_count=$((fail_count + 1))
    fi
}

echo "Testing Core Endpoints..."
test_get "Health Check" "/health" "status"
test_get "API Documentation" "/api" "endpoints"
test_get "Root Endpoint" "/" "service"

echo ""
echo "Testing Vehicle Endpoints..."
test_get "List Vehicles" "/api/v1/vehicles" "data"
test_get "Get Vehicle Stats" "/api/v1/stats" "vehicles"

echo ""
echo "Testing Driver Endpoints..."
test_get "List Drivers" "/api/v1/drivers" "data"

echo ""
echo "Testing Work Order Endpoints..."
test_get "List Work Orders" "/api/v1/work-orders" "data"

echo ""
echo "Testing Maintenance Endpoints..."
test_get "List Maintenance" "/api/v1/maintenance" "data"

echo ""
echo "Testing Safety Endpoints..."
test_get "List Safety Incidents" "/api/v1/safety-incidents" "data"
test_get "List Inspections" "/api/v1/inspections" "data"

echo ""
echo "Testing EV Charging Endpoints..."
test_get "List Charging Stations" "/api/v1/charging-stations" "data"
test_get "List Charging Sessions" "/api/v1/charging-sessions" "data"

echo ""
echo "Testing Routes & Telematics Endpoints..."
test_get "List Routes" "/api/v1/routes" "data"
test_get "Get Telematics Data" "/api/v1/telematics" "data"

echo ""
echo "Testing Fuel & Cost Endpoints..."
test_get "List Fuel Transactions" "/api/v1/fuel-transactions" "data"
test_get "Get Cost Analysis" "/api/v1/cost-analysis" "data"

echo ""
echo "========================================="
echo "Test Results Summary"
echo "========================================="
echo "Total Tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
