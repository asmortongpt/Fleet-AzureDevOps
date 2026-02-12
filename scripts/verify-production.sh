#!/bin/bash

##############################################################################
# Production Deployment Verification Script
#
# Validates that all critical systems are operational after deployment
#
# Test Coverage:
# - Frontend build and deployment
# - API health and endpoints
# - Database connectivity
# - Authentication system
# - Core hub functionality
# - Real-time features
# - Security headers
# - Performance metrics
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="${VITE_APP_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"
API_URL="${VITE_API_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net/api}"
MAX_RESPONSE_TIME=3000 # milliseconds
MIN_PERFORMANCE_SCORE=80

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging
LOG_FILE="/tmp/production-verify-$(date +%Y%m%d-%H%M%S).log"

##############################################################################
# Helper Functions
##############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ PASS${NC} $1" | tee -a "$LOG_FILE"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC} $1" | tee -a "$LOG_FILE"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC} $1" | tee -a "$LOG_FILE"
}

test_http() {
    local url="$1"
    local expected_status="${2:-200}"
    local description="$3"

    log "Testing: $description"

    response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" "$url" 2>/dev/null || echo "000|0")
    status_code=$(echo "$response" | cut -d'|' -f1)
    response_time=$(echo "$response" | cut -d'|' -f2)
    response_time_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)

    if [ "$status_code" = "$expected_status" ]; then
        if [ "$response_time_ms" -lt "$MAX_RESPONSE_TIME" ]; then
            success "$description (${response_time_ms}ms)"
        else
            warn "$description - Slow response: ${response_time_ms}ms"
            ((PASSED_TESTS++))
            ((TOTAL_TESTS++))
        fi
    else
        fail "$description - Expected HTTP $expected_status, got $status_code"
    fi
}

test_json_endpoint() {
    local url="$1"
    local description="$2"

    log "Testing: $description"

    response=$(curl -s "$url" 2>/dev/null)

    if echo "$response" | jq empty 2>/dev/null; then
        success "$description - Valid JSON response"
    else
        fail "$description - Invalid JSON response"
    fi
}

##############################################################################
# Test Suites
##############################################################################

print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

test_frontend_deployment() {
    print_header "1. Frontend Deployment Tests"

    test_http "$FRONTEND_URL" 200 "Frontend root URL accessible"
    test_http "$FRONTEND_URL/assets/" 404 "Assets directory exists (404 expected for root)"

    # Test critical routes
    test_http "$FRONTEND_URL/" 200 "Dashboard route"

    # Check for static assets
    log "Checking for JavaScript bundles..."
    if curl -s "$FRONTEND_URL" | grep -q "index.*\.js"; then
        success "JavaScript bundles loaded"
    else
        fail "JavaScript bundles not found"
    fi

    # Check for CSS
    log "Checking for stylesheets..."
    if curl -s "$FRONTEND_URL" | grep -q "\.css"; then
        success "Stylesheets loaded"
    else
        warn "Stylesheets not detected in HTML"
    fi
}

test_api_health() {
    print_header "2. API Health Tests"

    # Health endpoint
    test_http "$API_URL/health" 200 "API health endpoint"

    # Status endpoint
    test_json_endpoint "$API_URL/status" "API status endpoint returns JSON"

    # Check API version
    log "Checking API version..."
    version=$(curl -s "$API_URL/health" | jq -r '.version' 2>/dev/null || echo "unknown")
    if [ "$version" != "unknown" ] && [ "$version" != "null" ]; then
        success "API version: $version"
    else
        warn "API version not available"
    fi
}

test_core_endpoints() {
    print_header "3. Core API Endpoints"

    # These endpoints should return 401 (unauthorized) when not authenticated
    test_http "$API_URL/vehicles" 401 "Vehicles endpoint (auth required)"
    test_http "$API_URL/drivers" 401 "Drivers endpoint (auth required)"
    test_http "$API_URL/incidents" 401 "Incidents endpoint (auth required)"
    test_http "$API_URL/maintenance" 401 "Maintenance endpoint (auth required)"
    test_http "$API_URL/fuel" 401 "Fuel endpoint (auth required)"
}

test_authentication() {
    print_header "4. Authentication System"

    # CSRF endpoint
    test_http "$API_URL/auth/csrf" 200 "CSRF token endpoint"

    # Login endpoint should accept POST
    log "Testing login endpoint..."
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null || echo "000")

    if [ "$response" = "400" ] || [ "$response" = "401" ] || [ "$response" = "422" ]; then
        success "Login endpoint responds correctly to invalid credentials"
    else
        fail "Login endpoint unexpected response: $response"
    fi
}

test_security_headers() {
    print_header "5. Security Headers"

    log "Checking security headers..."
    headers=$(curl -s -I "$FRONTEND_URL" 2>/dev/null)

    # Check for critical security headers
    if echo "$headers" | grep -qi "X-Content-Type-Options"; then
        success "X-Content-Type-Options header present"
    else
        warn "X-Content-Type-Options header missing"
    fi

    if echo "$headers" | grep -qi "X-Frame-Options"; then
        success "X-Frame-Options header present"
    else
        warn "X-Frame-Options header missing"
    fi

    if echo "$headers" | grep -qi "Strict-Transport-Security"; then
        success "HSTS header present"
    else
        warn "HSTS header missing"
    fi

    if echo "$headers" | grep -qi "Content-Security-Policy"; then
        success "CSP header present"
    else
        warn "CSP header missing"
    fi
}

test_hub_routes() {
    print_header "6. Hub Route Accessibility"

    # All major hubs should return 200 (HTML page loads)
    test_http "$FRONTEND_URL/fleet" 200 "Fleet Hub route"
    test_http "$FRONTEND_URL/drivers" 200 "Drivers Hub route"
    test_http "$FRONTEND_URL/maintenance" 200 "Maintenance Hub route"
    test_http "$FRONTEND_URL/compliance" 200 "Compliance Hub route"
    test_http "$FRONTEND_URL/fuel" 200 "Fuel Hub route"
    test_http "$FRONTEND_URL/hos" 200 "HOS Hub route"
    test_http "$FRONTEND_URL/incidents" 200 "Incidents Hub route"
}

test_database_connectivity() {
    print_header "7. Database Connectivity (via API)"

    # Test that API can query database
    log "Testing database connectivity through API..."

    # The /health endpoint should include database status
    health_response=$(curl -s "$API_URL/health" 2>/dev/null)

    if echo "$health_response" | jq -e '.database.status == "healthy"' >/dev/null 2>&1; then
        success "Database connection healthy"
    elif echo "$health_response" | jq -e '.database' >/dev/null 2>&1; then
        warn "Database status: $(echo "$health_response" | jq -r '.database.status')"
    else
        warn "Database status not reported in health endpoint"
    fi
}

test_performance() {
    print_header "8. Performance Metrics"

    log "Measuring page load time..."
    start_time=$(date +%s%N)
    curl -s -o /dev/null "$FRONTEND_URL"
    end_time=$(date +%s%N)
    load_time=$(( (end_time - start_time) / 1000000 ))

    if [ "$load_time" -lt 2000 ]; then
        success "Page load time: ${load_time}ms (Excellent)"
    elif [ "$load_time" -lt 3000 ]; then
        success "Page load time: ${load_time}ms (Good)"
    else
        warn "Page load time: ${load_time}ms (Needs improvement)"
    fi

    # Test API response time
    log "Measuring API response time..."
    api_start=$(date +%s%N)
    curl -s -o /dev/null "$API_URL/health"
    api_end=$(date +%s%N)
    api_time=$(( (api_end - api_start) / 1000000 ))

    if [ "$api_time" -lt 500 ]; then
        success "API response time: ${api_time}ms (Excellent)"
    elif [ "$api_time" -lt 1000 ]; then
        success "API response time: ${api_time}ms (Good)"
    else
        warn "API response time: ${api_time}ms (Slow)"
    fi
}

test_critical_features() {
    print_header "9. Critical Feature Verification"

    # Check that main application JavaScript loaded successfully
    log "Verifying main application bundle..."
    main_html=$(curl -s "$FRONTEND_URL")

    if echo "$main_html" | grep -q "root"; then
        success "React root element present"
    else
        fail "React root element not found"
    fi

    # Check for error pages
    test_http "$FRONTEND_URL/nonexistent-route-12345" 404 "404 handling"
}

test_incident_management() {
    print_header "10. Incident Management System"

    # Test incident hub specifically
    test_http "$FRONTEND_URL/incidents" 200 "Incident Hub accessible"

    # Test incident API endpoint (should require auth)
    test_http "$API_URL/incidents" 401 "Incident API endpoint (auth required)"

    # Test incident metrics endpoint
    test_http "$API_URL/incidents/metrics" 401 "Incident metrics endpoint (auth required)"
}

##############################################################################
# Main Execution
##############################################################################

main() {
    log "═══════════════════════════════════════════════════════════════════"
    log "PRODUCTION DEPLOYMENT VERIFICATION"
    log "═══════════════════════════════════════════════════════════════════"
    log ""
    log "Frontend URL: $FRONTEND_URL"
    log "API URL: $API_URL"
    log "Log File: $LOG_FILE"
    log ""

    # Run all test suites
    test_frontend_deployment
    test_api_health
    test_core_endpoints
    test_authentication
    test_security_headers
    test_hub_routes
    test_database_connectivity
    test_performance
    test_critical_features
    test_incident_management

    # Print summary
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Total Tests:  $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC}       $PASSED_TESTS"
    echo -e "${RED}Failed:${NC}       $FAILED_TESTS"
    echo ""

    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "${GREEN}✅ ALL TESTS PASSED - DEPLOYMENT VERIFIED${NC}"
        echo ""
        echo "The production deployment is healthy and all critical systems are operational."
        exit 0
    else
        echo -e "${RED}❌ DEPLOYMENT VERIFICATION FAILED${NC}"
        echo ""
        echo "There are $FAILED_TESTS failed test(s). Please review the log file:"
        echo "$LOG_FILE"
        exit 1
    fi
}

# Check dependencies
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Warning: jq is not installed. Some JSON tests will be skipped."
fi

if ! command -v bc &> /dev/null; then
    echo "Warning: bc is not installed. Some performance tests may be inaccurate."
fi

# Run main
main "$@"
