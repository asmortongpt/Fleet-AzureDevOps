#!/bin/bash

# Test Dashboard API Endpoints with Authentication
# Tests all role-based dashboard endpoints with real test users

API_BASE="http://localhost:3000/api"
AUTH_ENDPOINT="${API_BASE}/auth/login"

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "============================================================"
echo "🧪 Dashboard API Endpoint Testing"
echo "============================================================"
echo ""

# Test users with password Test123!
declare -A TEST_USERS=(
    ["fleet.manager@test.com"]="fleet_manager"
    ["driver@test.com"]="driver"
    ["admin@test.com"]="admin"
)

# Function to login and get JWT token
login_user() {
    local email=$1
    local password="Test123!"

    echo -e "${BLUE}Logging in as ${email}...${NC}"

    response=$(curl -s -X POST "${AUTH_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${email}\",\"password\":\"${password}\"}" \
        -c /tmp/cookies_${email}.txt \
        -w "\n%{http_code}")

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ Login successful${NC}"
        return 0
    else
        echo -e "${RED}✗ Login failed (HTTP $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Function to test an endpoint
test_endpoint() {
    local email=$1
    local endpoint=$2
    local description=$3

    echo ""
    echo -e "${YELLOW}Testing:${NC} $description"
    echo -e "${YELLOW}Endpoint:${NC} $endpoint"

    response=$(curl -s -X GET "${API_BASE}${endpoint}" \
        -b /tmp/cookies_${email}.txt \
        -H "Content-Type: application/json" \
        -w "\n%{http_code}")

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ HTTP 200 OK${NC}"
        # Pretty print JSON (first 500 chars)
        echo "$body" | python3 -m json.tool 2>/dev/null | head -20 || echo "$body" | head -10
        return 0
    elif [ "$http_code" = "401" ]; then
        echo -e "${RED}✗ HTTP 401 Unauthorized (auth issue)${NC}"
        echo "Response: $body"
        return 1
    elif [ "$http_code" = "403" ]; then
        echo -e "${YELLOW}⚠ HTTP 403 Forbidden (RBAC restriction)${NC}"
        echo "Response: $body"
        return 2
    else
        echo -e "${RED}✗ HTTP $http_code${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Test Fleet Manager Dashboard
echo ""
echo "======================================"
echo "🚗 FLEET MANAGER DASHBOARD"
echo "======================================"

if login_user "fleet.manager@test.com"; then
    test_endpoint "fleet.manager@test.com" "/dashboard/maintenance/alerts" "Maintenance Alerts"
    test_endpoint "fleet.manager@test.com" "/dashboard/fleet/stats" "Fleet Status Statistics"
    test_endpoint "fleet.manager@test.com" "/dashboard/costs/summary?period=monthly" "Cost Summary (Monthly)"
fi

# Test Driver Dashboard
echo ""
echo "======================================"
echo "👤 DRIVER DASHBOARD"
echo "======================================"

if login_user "driver@test.com"; then
    test_endpoint "driver@test.com" "/dashboard/drivers/me/vehicle" "My Assigned Vehicle"
    test_endpoint "driver@test.com" "/dashboard/drivers/me/trips/today" "Today's Trips"
fi

# Test Admin Dashboard (should have access to all)
echo ""
echo "======================================"
echo "🔐 ADMIN DASHBOARD"
echo "======================================"

if login_user "admin@test.com"; then
    test_endpoint "admin@test.com" "/dashboard/maintenance/alerts" "Maintenance Alerts (Admin)"
    test_endpoint "admin@test.com" "/dashboard/fleet/stats" "Fleet Stats (Admin)"
    test_endpoint "admin@test.com" "/dashboard/costs/summary?period=weekly" "Cost Summary Weekly (Admin)"
fi

# Summary
echo ""
echo "============================================================"
echo "✅ Dashboard API Testing Complete"
echo "============================================================"
echo ""
echo "Test users created:"
echo "  - fleet.manager@test.com (password: Test123!)"
echo "  - driver@test.com (password: Test123!)"
echo "  - admin@test.com (password: Test123!)"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"
echo ""

# Cleanup cookies
rm -f /tmp/cookies_*.txt
