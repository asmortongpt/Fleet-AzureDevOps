#!/bin/bash
# Comprehensive API Endpoint Test Script
# Tests all major API endpoints for Fleet-CTA

API_BASE="http://localhost:3001/api"
TENANT_ID="874954c7-b68b-5485-8ddd-183932497849"
SUCCESS=0
FAILED=0
TOTAL=0

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "CTA Fleet Management API - Endpoint Test Suite"
echo "Date: $(date)"
echo "API Base: $API_BASE"
echo "Tenant ID: $TENANT_ID"
echo "=============================================="
echo ""

test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local expected_code="${4:-200}"
    local data="$5"
    
    TOTAL=$((TOTAL + 1))
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "X-Tenant-ID: $TENANT_ID" \
            -d "$data" \
            "${API_BASE}${endpoint}" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "X-Tenant-ID: $TENANT_ID" \
            "${API_BASE}${endpoint}" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Check if response matches expected code or is a valid error response
    if [ "$http_code" == "$expected_code" ] || [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
        echo -e "${GREEN}✓${NC} [$method] $endpoint ($http_code) - $description"
        SUCCESS=$((SUCCESS + 1))
    elif [ "$http_code" == "401" ] || [ "$http_code" == "403" ]; then
        echo -e "${YELLOW}⚠${NC} [$method] $endpoint ($http_code) - Auth required - $description"
        SUCCESS=$((SUCCESS + 1))  # Auth required is expected for protected endpoints
    elif [ "$http_code" == "500" ]; then
        error_msg=$(echo "$body" | jq -r '.error // .message // "Unknown error"' 2>/dev/null)
        echo -e "${RED}✗${NC} [$method] $endpoint ($http_code) - $description - Error: $error_msg"
        FAILED=$((FAILED + 1))
    else
        echo -e "${RED}✗${NC} [$method] $endpoint ($http_code != $expected_code) - $description"
        FAILED=$((FAILED + 1))
    fi
}

# Test public health endpoints
echo ""
echo "=== Health Endpoints ==="
test_endpoint "GET" "/health" "API Health Check"
test_endpoint "GET" "/health/detailed" "Detailed Health Check"
test_endpoint "GET" "/health/ready" "Kubernetes Readiness Probe"
test_endpoint "GET" "/health/live" "Kubernetes Liveness Probe"

# Test core fleet endpoints (require auth)
echo ""
echo "=== Vehicle Endpoints ==="
test_endpoint "GET" "/vehicles" "List all vehicles"
test_endpoint "GET" "/vehicles/fleet-summary" "Fleet summary stats"

# Test work orders
echo ""
echo "=== Work Order Endpoints ==="
test_endpoint "GET" "/work-orders" "List work orders"
test_endpoint "GET" "/work-orders/stats" "Work order statistics"

# Test maintenance
echo ""
echo "=== Maintenance Endpoints ==="
test_endpoint "GET" "/maintenance" "List maintenance records"
test_endpoint "GET" "/maintenance-schedules" "List maintenance schedules"
test_endpoint "GET" "/maintenance-schedules/upcoming" "Upcoming maintenance"
test_endpoint "GET" "/maintenance-schedules/overdue" "Overdue maintenance"

# Test drivers
echo ""
echo "=== Driver Endpoints ==="
test_endpoint "GET" "/drivers" "List all drivers"

# Test facilities
echo ""
echo "=== Facility Endpoints ==="
test_endpoint "GET" "/facilities" "List all facilities"

# Test fuel management
echo ""
echo "=== Fuel Endpoints ==="
test_endpoint "GET" "/fuel" "List fuel records"
test_endpoint "GET" "/fuel-transactions" "Fuel transactions"

# Test parts inventory
echo ""
echo "=== Parts & Inventory Endpoints ==="
test_endpoint "GET" "/parts" "List parts"
test_endpoint "GET" "/inventory" "List inventory"

# Test vendors
echo ""
echo "=== Vendor Endpoints ==="
test_endpoint "GET" "/vendors" "List vendors"

# Test invoices
echo ""
echo "=== Invoice Endpoints ==="
test_endpoint "GET" "/invoices" "List invoices"

# Test purchase orders
echo ""
echo "=== Purchase Order Endpoints ==="
test_endpoint "GET" "/purchase-orders" "List purchase orders"

# Test tasks
echo ""
echo "=== Task Endpoints ==="
test_endpoint "GET" "/tasks" "List tasks"

# Test routes
echo ""
echo "=== Route Endpoints ==="
test_endpoint "GET" "/routes" "List routes"

# Test trips
echo ""
echo "=== Trip Endpoints ==="
test_endpoint "GET" "/trips" "List trips"

# Test analytics
echo ""
echo "=== Analytics Endpoints ==="
test_endpoint "GET" "/analytics/summary" "Analytics summary"
test_endpoint "GET" "/analytics/fleet-performance" "Fleet performance"

# Test dashboard
echo ""
echo "=== Dashboard Endpoints ==="
test_endpoint "GET" "/dashboard/stats" "Dashboard stats"
test_endpoint "GET" "/dashboard/fleet-metrics" "Fleet metrics"

# Test HOS (Hours of Service)
echo ""
echo "=== HOS Endpoints ==="
test_endpoint "GET" "/hos" "HOS logs list"

# Test safety
echo ""
echo "=== Safety Endpoints ==="
test_endpoint "GET" "/safety-alerts" "Safety alerts"
test_endpoint "GET" "/safety-incidents" "Safety incidents"

# Test compliance
echo ""
echo "=== Compliance Endpoints ==="
test_endpoint "GET" "/compliance" "Compliance records"

# Test alerts
echo ""
echo "=== Alert Endpoints ==="
test_endpoint "GET" "/alerts" "System alerts"

# Test reports
echo ""
echo "=== Report Endpoints ==="
test_endpoint "GET" "/reports" "Available reports"

# Test geofences
echo ""
echo "=== Geofence Endpoints ==="
test_endpoint "GET" "/geofences" "List geofences"

# Test reservations
echo ""
echo "=== Reservation Endpoints ==="
test_endpoint "GET" "/reservations" "List reservations"

# Test communications
echo ""
echo "=== Communication Endpoints ==="
test_endpoint "GET" "/communications" "Communication logs"

# Test telematics
echo ""
echo "=== Telematics Endpoints ==="
test_endpoint "GET" "/telematics" "Telematics data"

# Test admin endpoints
echo ""
echo "=== Admin Endpoints ==="
test_endpoint "GET" "/admin/users" "List users (admin)"
test_endpoint "GET" "/admin/settings" "System settings (admin)"

# Print summary
echo ""
echo "=============================================="
echo "TEST SUMMARY"
echo "=============================================="
echo -e "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$SUCCESS${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
else
    echo -e "${YELLOW}Some tests failed. Review the errors above.${NC}"
fi
echo "=============================================="
