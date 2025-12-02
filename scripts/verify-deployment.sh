#!/bin/bash

# ===========================================
# Fleet Management System - Deployment Verification Checklist
# Run this AFTER deployment to verify everything works
# ===========================================

set -e

echo "🔍 Fleet Management System - Deployment Verification"
echo "===================================================="
echo ""

# Configuration
API_URL="${API_URL:-https://fleet-staging-api.azurewebsites.net}"
FRONTEND_URL="${FRONTEND_URL:-https://fleet-staging.azurewebsites.net}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

check_test() {
  local test_name="$1"
  local command="$2"

  echo -n "Testing: $test_name... "

  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
  fi
}

echo "🌐 Testing API Endpoints"
echo "========================"

# Test 1: Health Check
check_test "API Health Check" "curl -f -s $API_URL/health"

# Test 2: Database Connection
check_test "Database Connection" "curl -f -s $API_URL/api/health/db"

# Test 3: HTTPS Redirect
check_test "HTTPS Enforcement" "curl -s -o /dev/null -w '%{http_code}' http://${API_URL#https://} | grep -q 301"

# Test 4: CORS Headers
check_test "CORS Configuration" "curl -s -I $API_URL/health | grep -q 'access-control-allow-origin'"

# Test 5: Rate Limiting Headers
check_test "Rate Limiting" "curl -s -I $API_URL/health | grep -q 'x-ratelimit'"

echo ""
echo "🔐 Testing Authentication"
echo "========================"

# Create test user
TEST_EMAIL="test-$(date +%s)@test.com"
TEST_PASSWORD="${TEST_PASSWORD:-YOUR_TEST_PASSWORD_HERE}"

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}")

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ User Registration${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ User Registration${NC}"
  ((FAILED++))
fi

# Login
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ User Login${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ User Login${NC}"
  ((FAILED++))
fi

echo ""
echo "📡 Testing API Endpoints (Authenticated)"
echo "========================================"

if [ -n "$TOKEN" ]; then
  # Test authenticated endpoints
  check_test "Get Vehicles" "curl -f -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/vehicles"
  check_test "Get Assets" "curl -f -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/asset-management"
  check_test "Get Tasks" "curl -f -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/task-management"
  check_test "Get Incidents" "curl -f -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/incident-management"
  check_test "Get Alerts" "curl -f -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/alerts"
  check_test "Get Executive Dashboard" "curl -f -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/executive-dashboard/kpis"
else
  echo -e "${YELLOW}⚠ Skipping authenticated tests (no token)${NC}"
fi

echo ""
echo "🎨 Testing Frontend"
echo "==================="

check_test "Frontend Accessible" "curl -f -s $FRONTEND_URL"
check_test "Frontend HTML Valid" "curl -s $FRONTEND_URL | grep -q '<html'"
check_test "Frontend Assets Load" "curl -s $FRONTEND_URL | grep -q 'script'"

echo ""
echo "🗄️ Testing Database"
echo "==================="

if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_PASSWORD" ]; then
  check_test "Database Connection" "PGPASSWORD='$DATABASE_PASSWORD' psql -h '$DATABASE_HOST' -U fleetadmin -d fleet_staging -c 'SELECT 1;'"
  check_test "PostGIS Extension" "PGPASSWORD='$DATABASE_PASSWORD' psql -h '$DATABASE_HOST' -U fleetadmin -d fleet_staging -c 'SELECT PostGIS_Version();'"
  check_test "pgvector Extension" "PGPASSWORD='$DATABASE_PASSWORD' psql -h '$DATABASE_HOST' -U fleetadmin -d fleet_staging -c 'SELECT * FROM pg_extension WHERE extname = '\''vector'\'';'"
else
  echo -e "${YELLOW}⚠ Skipping database tests (credentials not provided)${NC}"
fi

echo ""
echo "📊 Summary"
echo "=========="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed! Deployment successful!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
  exit 1
fi
