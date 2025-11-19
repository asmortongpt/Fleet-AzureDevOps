#!/bin/bash

################################################################################
# Vehicle API Filter Testing Script
# Task 2.1: Vehicle Routes API Extension Verification
#
# Usage:
#   1. Set your JWT token: export JWT_TOKEN="your-token-here"
#   2. Run: ./test-vehicle-filters.sh
#   3. Or run individual tests: ./test-vehicle-filters.sh test1
################################################################################

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
JWT_TOKEN="${JWT_TOKEN:-}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if JWT token is set
if [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}ERROR: JWT_TOKEN not set${NC}"
  echo "Please set your JWT token:"
  echo "  export JWT_TOKEN=\"your-token-here\""
  exit 1
fi

# Helper function to make API calls
api_call() {
  local endpoint="$1"
  local test_name="$2"

  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}TEST: ${test_name}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "Endpoint: ${BLUE}GET ${endpoint}${NC}"
  echo ""

  response=$(curl -s -w "\n%{http_code}" \
    -X GET "${API_BASE_URL}${endpoint}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -H "Content-Type: application/json")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Status: ${http_code} OK${NC}"
    echo ""
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"

    # Extract and display summary
    count=$(echo "$body" | jq -r '.pagination.total' 2>/dev/null)
    if [ "$count" != "null" ]; then
      echo ""
      echo -e "${GREEN}📊 Results: ${count} vehicles found${NC}"
    fi
  else
    echo -e "${RED}❌ Status: ${http_code} FAILED${NC}"
    echo ""
    echo "Response:"
    echo "$body"
  fi

  echo ""
}

################################################################################
# Test 1: Filter by Asset Category - Heavy Equipment
################################################################################
test1() {
  api_call "/vehicles?asset_category=HEAVY_EQUIPMENT" \
    "Filter by Asset Category (HEAVY_EQUIPMENT)"
}

################################################################################
# Test 2: Filter by Asset Type - Excavators Only
################################################################################
test2() {
  api_call "/vehicles?asset_type=EXCAVATOR" \
    "Filter by Asset Type (EXCAVATOR)"
}

################################################################################
# Test 3: Filter by Operational Status - Available Only
################################################################################
test3() {
  api_call "/vehicles?operational_status=AVAILABLE" \
    "Filter by Operational Status (AVAILABLE)"
}

################################################################################
# Test 4: Filter by Operational Status - In Use
################################################################################
test4() {
  api_call "/vehicles?operational_status=IN_USE" \
    "Filter by Operational Status (IN_USE)"
}

################################################################################
# Test 5: Combined Filters - Available Heavy Equipment
################################################################################
test5() {
  api_call "/vehicles?asset_category=HEAVY_EQUIPMENT&operational_status=AVAILABLE" \
    "Combined Filters (Heavy Equipment + Available)"
}

################################################################################
# Test 6: Combined Filters - Available Trailers
################################################################################
test6() {
  api_call "/vehicles?asset_category=TRAILER&operational_status=AVAILABLE&power_type=TOWED" \
    "Combined Filters (Trailer + Available + Towed)"
}

################################################################################
# Test 7: Filter by Power Type - Self Powered
################################################################################
test7() {
  api_call "/vehicles?power_type=SELF_POWERED" \
    "Filter by Power Type (SELF_POWERED)"
}

################################################################################
# Test 8: Filter by Asset Category - Tractors
################################################################################
test8() {
  api_call "/vehicles?asset_category=TRACTOR" \
    "Filter by Asset Category (TRACTOR)"
}

################################################################################
# Test 9: Specific Asset Type - Semi Tractors
################################################################################
test9() {
  api_call "/vehicles?asset_type=SEMI_TRACTOR" \
    "Filter by Asset Type (SEMI_TRACTOR)"
}

################################################################################
# Test 10: Combined Filters - Available Semi Tractors
################################################################################
test10() {
  api_call "/vehicles?asset_category=TRACTOR&asset_type=SEMI_TRACTOR&operational_status=AVAILABLE" \
    "Combined Filters (Tractor + Semi Tractor + Available)"
}

################################################################################
# Test 11: Filter by Road Legal Status
################################################################################
test11() {
  api_call "/vehicles?is_road_legal=true" \
    "Filter by Road Legal (true)"
}

################################################################################
# Test 12: Off-Road Equipment Only
################################################################################
test12() {
  api_call "/vehicles?is_road_legal=false" \
    "Filter by Road Legal (false - off-road only)"
}

################################################################################
# Test 13: Pagination with Filters
################################################################################
test13() {
  api_call "/vehicles?asset_category=HEAVY_EQUIPMENT&page=1&limit=10" \
    "Pagination with Filters (Page 1, Limit 10)"

  sleep 1

  api_call "/vehicles?asset_category=HEAVY_EQUIPMENT&page=2&limit=10" \
    "Pagination with Filters (Page 2, Limit 10)"
}

################################################################################
# Test 14: All Vehicles (No Filters)
################################################################################
test14() {
  api_call "/vehicles" \
    "All Vehicles (No Filters)"
}

################################################################################
# Test 15: Multiple Asset Types
################################################################################
test15() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}TEST: Query Multiple Asset Types${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  echo ""
  echo "Fetching different asset categories..."

  categories=("HEAVY_EQUIPMENT" "TRACTOR" "TRAILER" "HEAVY_TRUCK" "LIGHT_COMMERCIAL")

  for category in "${categories[@]}"; do
    response=$(curl -s \
      -X GET "${API_BASE_URL}/vehicles?asset_category=${category}" \
      -H "Authorization: Bearer ${JWT_TOKEN}" \
      -H "Content-Type: application/json")

    count=$(echo "$response" | jq -r '.pagination.total' 2>/dev/null)

    if [ "$count" != "null" ]; then
      echo -e "  ${category}: ${GREEN}${count} vehicles${NC}"
    else
      echo -e "  ${category}: ${RED}Error${NC}"
    fi
  done
  echo ""
}

################################################################################
# Test 16: SQL Injection Prevention Test
################################################################################
test16() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}SECURITY TEST: SQL Injection Prevention${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Try SQL injection attack
  injection_payload="HEAVY_EQUIPMENT' OR '1'='1"

  echo ""
  echo "Attempting SQL injection with payload:"
  echo -e "  ${RED}${injection_payload}${NC}"
  echo ""

  response=$(curl -s -w "\n%{http_code}" \
    -X GET "${API_BASE_URL}/vehicles?asset_category=${injection_payload}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -H "Content-Type: application/json")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    count=$(echo "$body" | jq -r '.pagination.total' 2>/dev/null)

    if [ "$count" = "0" ]; then
      echo -e "${GREEN}✅ SECURITY PASS: SQL injection blocked${NC}"
      echo "   Returned 0 results (expected behavior)"
    else
      echo -e "${RED}⚠️  WARNING: Unexpected results returned${NC}"
      echo "   This may indicate a vulnerability"
    fi
  else
    echo -e "${YELLOW}ℹ️  Status: ${http_code}${NC}"
    echo "   Response: $body"
  fi
  echo ""
}

################################################################################
# Run All Tests
################################################################################
run_all_tests() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}  ${YELLOW}Vehicle API Filter Testing Suite${NC}                            ${BLUE}║${NC}"
  echo -e "${BLUE}║${NC}  Task 2.1: Vehicle Routes API Extension Verification         ${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "API Base URL: ${BLUE}${API_BASE_URL}${NC}"
  echo ""

  test1
  test2
  test3
  test4
  test5
  test6
  test7
  test8
  test9
  test10
  test11
  test12
  test13
  test14
  test15
  test16

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ All tests completed!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

################################################################################
# Main Script
################################################################################

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠️  Warning: 'jq' not found. Install for better output formatting.${NC}"
  echo "   macOS: brew install jq"
  echo "   Ubuntu: sudo apt-get install jq"
  echo ""
fi

# Run specified test or all tests
case "${1:-all}" in
  test1) test1 ;;
  test2) test2 ;;
  test3) test3 ;;
  test4) test4 ;;
  test5) test5 ;;
  test6) test6 ;;
  test7) test7 ;;
  test8) test8 ;;
  test9) test9 ;;
  test10) test10 ;;
  test11) test11 ;;
  test12) test12 ;;
  test13) test13 ;;
  test14) test14 ;;
  test15) test15 ;;
  test16) test16 ;;
  all) run_all_tests ;;
  *)
    echo "Usage: $0 [test1|test2|...|test16|all]"
    echo ""
    echo "Available tests:"
    echo "  test1  - Filter by Asset Category (HEAVY_EQUIPMENT)"
    echo "  test2  - Filter by Asset Type (EXCAVATOR)"
    echo "  test3  - Filter by Operational Status (AVAILABLE)"
    echo "  test4  - Filter by Operational Status (IN_USE)"
    echo "  test5  - Combined Filters (Heavy Equipment + Available)"
    echo "  test6  - Combined Filters (Trailer + Available + Towed)"
    echo "  test7  - Filter by Power Type (SELF_POWERED)"
    echo "  test8  - Filter by Asset Category (TRACTOR)"
    echo "  test9  - Filter by Asset Type (SEMI_TRACTOR)"
    echo "  test10 - Combined Filters (Tractor + Semi Tractor + Available)"
    echo "  test11 - Filter by Road Legal (true)"
    echo "  test12 - Filter by Road Legal (false)"
    echo "  test13 - Pagination with Filters"
    echo "  test14 - All Vehicles (No Filters)"
    echo "  test15 - Query Multiple Asset Types"
    echo "  test16 - SQL Injection Prevention Test"
    echo "  all    - Run all tests"
    exit 1
    ;;
esac
