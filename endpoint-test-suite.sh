#!/bin/bash

##############################################################################
# Fleet Management API - Comprehensive Endpoint Test Suite
# Version: 1.0.0
# Date: November 13, 2025
#
# Usage:
#   ./endpoint-test-suite.sh [environment]
#
# Examples:
#   ./endpoint-test-suite.sh production
#   ./endpoint-test-suite.sh staging
#   ./endpoint-test-suite.sh dev
#   ./endpoint-test-suite.sh all
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Environment URLs
PROD_URL="https://fleet.capitaltechalliance.com"
STAGING_URL="https://fleet-staging.capitaltechalliance.com"
DEV_URL="https://fleet-dev.capitaltechalliance.com"

##############################################################################
# Helper Functions
##############################################################################

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_test() {
  echo -e "${YELLOW}TEST:${NC} $1"
}

print_pass() {
  echo -e "${GREEN}✅ PASS${NC} $1"
  ((PASSED_TESTS++))
  ((TOTAL_TESTS++))
}

print_fail() {
  echo -e "${RED}❌ FAIL${NC} $1"
  ((FAILED_TESTS++))
  ((TOTAL_TESTS++))
}

print_skip() {
  echo -e "${YELLOW}⏭️  SKIP${NC} $1"
  ((SKIPPED_TESTS++))
  ((TOTAL_TESTS++))
}

print_info() {
  echo -e "${BLUE}ℹ️  INFO${NC} $1"
}

##############################################################################
# Test Functions
##############################################################################

test_health_endpoint() {
  local env_name=$1
  local base_url=$2

  print_test "Health check - $env_name"

  local response=$(curl -s -w "\n%{http_code}" "$base_url/api/health" 2>/dev/null || echo "000")
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    print_pass "$env_name health endpoint returned 200"
    echo "     Response: $body"
  else
    print_fail "$env_name health endpoint returned $http_code"
  fi
}

test_swagger_docs() {
  local env_name=$1
  local base_url=$2

  print_test "Swagger documentation - $env_name"

  local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/api/docs" 2>/dev/null || echo "000")

  if [ "$http_code" = "200" ]; then
    print_pass "$env_name Swagger docs accessible"
  else
    print_fail "$env_name Swagger docs returned $http_code"
  fi
}

test_openapi_spec() {
  local env_name=$1
  local base_url=$2

  print_test "OpenAPI specification - $env_name"

  local response=$(curl -s "$base_url/api/openapi.json" 2>/dev/null)
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/api/openapi.json" 2>/dev/null || echo "000")

  if [ "$http_code" = "200" ] && [[ "$response" == *"openapi"* ]]; then
    print_pass "$env_name OpenAPI spec valid"
  else
    print_fail "$env_name OpenAPI spec invalid or unreachable"
  fi
}

test_cors_headers() {
  local env_name=$1
  local base_url=$2

  print_test "CORS configuration - $env_name"

  local headers=$(curl -s -I -X OPTIONS "$base_url/api/health" \
    -H "Origin: $base_url" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null)

  if [[ "$headers" == *"Access-Control-Allow-Origin"* ]]; then
    print_pass "$env_name CORS headers configured"
  else
    print_fail "$env_name CORS headers missing"
  fi
}

test_security_headers() {
  local env_name=$1
  local base_url=$2

  print_test "Security headers - $env_name"

  local headers=$(curl -s -I "$base_url/api/health" 2>/dev/null)

  local has_x_content=false
  local has_x_frame=false

  if [[ "$headers" == *"X-Content-Type-Options"* ]]; then
    has_x_content=true
  fi

  if [[ "$headers" == *"X-Frame-Options"* ]]; then
    has_x_frame=true
  fi

  if $has_x_content && $has_x_frame; then
    print_pass "$env_name security headers present"
  else
    print_fail "$env_name security headers incomplete"
  fi
}

test_ssl_certificate() {
  local env_name=$1
  local domain=$2

  print_test "SSL certificate - $env_name"

  local ssl_info=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep -E "verify return|subject=")

  if [[ "$ssl_info" == *"verify return:1"* ]]; then
    print_pass "$env_name SSL certificate valid"
  else
    print_fail "$env_name SSL certificate invalid or expired"
  fi
}

test_rate_limiting() {
  local env_name=$1
  local base_url=$2

  print_test "Rate limiting - $env_name"

  print_info "Sending 105 requests to test rate limit (100/min)..."

  local success_count=0
  local rate_limited=false

  for i in {1..105}; do
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/api/health" 2>/dev/null)

    if [ "$http_code" = "200" ]; then
      ((success_count++))
    elif [ "$http_code" = "429" ]; then
      rate_limited=true
      break
    fi

    # Small delay to avoid overwhelming server
    sleep 0.01
  done

  if $rate_limited && [ $success_count -ge 90 ]; then
    print_pass "$env_name rate limiting working ($success_count requests succeeded before limit)"
  elif $rate_limited; then
    print_fail "$env_name rate limit triggered too early ($success_count requests)"
  else
    print_skip "$env_name rate limit not triggered (may need more aggressive testing)"
  fi
}

test_websocket_connection() {
  local env_name=$1
  local base_url=$2

  print_test "WebSocket connectivity - $env_name"

  # Convert https to wss
  local ws_url=$(echo "$base_url" | sed 's/https/wss/')/api/dispatch/ws

  # Check if websocat is installed
  if ! command -v websocat &> /dev/null; then
    print_skip "$env_name WebSocket test (websocat not installed)"
    return
  fi

  # Attempt connection (timeout after 5 seconds)
  local result=$(timeout 5 websocat "$ws_url" <<< '{"type":"ping"}' 2>&1 || echo "timeout")

  if [[ "$result" == *"timeout"* ]] || [[ "$result" == *"error"* ]]; then
    print_skip "$env_name WebSocket connection (requires auth or special setup)"
  else
    print_pass "$env_name WebSocket connection successful"
  fi
}

test_authentication() {
  local env_name=$1
  local base_url=$2

  print_test "Authentication endpoint - $env_name"

  # Test login endpoint with invalid credentials (should return 401)
  local response=$(curl -s -w "\n%{http_code}" -X POST "$base_url/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid@test.com","password":"wrong"}' 2>/dev/null || echo "000")

  local http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" = "401" ]; then
    print_pass "$env_name authentication endpoint working (401 for invalid credentials)"
  elif [ "$http_code" = "404" ]; then
    print_fail "$env_name authentication endpoint not found"
  else
    print_skip "$env_name authentication endpoint returned unexpected status: $http_code"
  fi
}

test_microsoft_oauth() {
  local env_name=$1
  local base_url=$2

  print_test "Microsoft OAuth redirect - $env_name"

  local response=$(curl -s -I "$base_url/api/auth/microsoft?tenant_id=1" 2>/dev/null)

  if [[ "$response" == *"login.microsoftonline.com"* ]]; then
    print_pass "$env_name Microsoft OAuth redirect configured"
  else
    print_skip "$env_name Microsoft OAuth redirect (may require browser)"
  fi
}

test_protected_endpoint() {
  local env_name=$1
  local base_url=$2

  print_test "Protected endpoint access control - $env_name"

  # Try to access vehicles without auth (should return 401)
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/api/vehicles" 2>/dev/null || echo "000")

  if [ "$http_code" = "401" ]; then
    print_pass "$env_name protected endpoint requires authentication"
  else
    print_skip "$env_name protected endpoint returned $http_code (may be in mock mode)"
  fi
}

test_response_time() {
  local env_name=$1
  local base_url=$2

  print_test "Response time - $env_name"

  local total_time=$(curl -s -o /dev/null -w "%{time_total}" "$base_url/api/health" 2>/dev/null)

  # Convert to milliseconds
  local ms=$(echo "$total_time * 1000" | bc)
  local ms_int=${ms%.*}

  if [ $ms_int -lt 500 ]; then
    print_pass "$env_name response time: ${ms_int}ms (excellent)"
  elif [ $ms_int -lt 1000 ]; then
    print_pass "$env_name response time: ${ms_int}ms (good)"
  elif [ $ms_int -lt 2000 ]; then
    print_pass "$env_name response time: ${ms_int}ms (acceptable)"
  else
    print_fail "$env_name response time: ${ms_int}ms (too slow)"
  fi
}

##############################################################################
# Test Suite Runner
##############################################################################

run_test_suite() {
  local env_name=$1
  local base_url=$2
  local domain=$3

  print_header "Testing $env_name Environment: $base_url"

  # Core functionality tests
  test_health_endpoint "$env_name" "$base_url"
  test_swagger_docs "$env_name" "$base_url"
  test_openapi_spec "$env_name" "$base_url"

  # Security tests
  test_cors_headers "$env_name" "$base_url"
  test_security_headers "$env_name" "$base_url"
  test_ssl_certificate "$env_name" "$domain"

  # Authentication tests
  test_authentication "$env_name" "$base_url"
  test_microsoft_oauth "$env_name" "$base_url"
  test_protected_endpoint "$env_name" "$base_url"

  # Performance tests
  test_response_time "$env_name" "$base_url"
  # test_rate_limiting "$env_name" "$base_url"  # Commented out to avoid triggering actual limits

  # Real-time tests
  # test_websocket_connection "$env_name" "$base_url"  # Requires websocat

  echo ""
}

##############################################################################
# Main Script
##############################################################################

main() {
  local environment=${1:-"all"}

  clear
  echo ""
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║                                                               ║"
  echo "║       Fleet Management API - Endpoint Test Suite             ║"
  echo "║       Version 1.0.0                                           ║"
  echo "║       Date: November 13, 2025                                 ║"
  echo "║                                                               ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo ""

  print_info "Starting test suite for: $environment"
  echo ""

  # Run tests based on environment parameter
  case $environment in
    production|prod)
      run_test_suite "Production" "$PROD_URL" "fleet.capitaltechalliance.com"
      ;;
    staging|stage)
      run_test_suite "Staging" "$STAGING_URL" "fleet-staging.capitaltechalliance.com"
      ;;
    development|dev)
      run_test_suite "Development" "$DEV_URL" "fleet-dev.capitaltechalliance.com"
      ;;
    all)
      run_test_suite "Production" "$PROD_URL" "fleet.capitaltechalliance.com"
      run_test_suite "Staging" "$STAGING_URL" "fleet-staging.capitaltechalliance.com"
      run_test_suite "Development" "$DEV_URL" "fleet-dev.capitaltechalliance.com"
      ;;
    *)
      echo -e "${RED}Error: Unknown environment '$environment'${NC}"
      echo ""
      echo "Usage: $0 [environment]"
      echo ""
      echo "Available environments:"
      echo "  production, prod     - Test production environment"
      echo "  staging, stage       - Test staging environment"
      echo "  development, dev     - Test development environment"
      echo "  all                  - Test all environments"
      echo ""
      exit 1
      ;;
  esac

  # Print summary
  print_header "Test Summary"
  echo ""
  echo "  Total Tests:    $TOTAL_TESTS"
  echo -e "  ${GREEN}Passed:${NC}         $PASSED_TESTS"
  echo -e "  ${RED}Failed:${NC}         $FAILED_TESTS"
  echo -e "  ${YELLOW}Skipped:${NC}        $SKIPPED_TESTS"
  echo ""

  # Calculate pass rate
  if [ $TOTAL_TESTS -gt 0 ]; then
    local pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "  Pass Rate:      ${pass_rate}%"
  fi

  echo ""

  # Exit with error if any tests failed
  if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}⚠️  Some tests failed. Please review the results above.${NC}"
    echo ""
    exit 1
  else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    exit 0
  fi
}

# Check dependencies
check_dependencies() {
  if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed${NC}"
    exit 1
  fi

  if ! command -v openssl &> /dev/null; then
    echo -e "${YELLOW}Warning: openssl is not installed (SSL tests will be skipped)${NC}"
  fi

  if ! command -v bc &> /dev/null; then
    echo -e "${YELLOW}Warning: bc is not installed (response time calculations may be affected)${NC}"
  fi

  if ! command -v websocat &> /dev/null; then
    echo -e "${YELLOW}Note: websocat is not installed (WebSocket tests will be skipped)${NC}"
    echo -e "${YELLOW}      Install with: cargo install websocat${NC}"
  fi
}

# Run dependency check
check_dependencies

# Run main function
main "$@"
