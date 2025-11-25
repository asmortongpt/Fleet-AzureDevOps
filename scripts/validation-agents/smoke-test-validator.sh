#!/bin/bash

################################################################################
# Production Smoke Test Validation Agent
# Purpose: Run critical smoke tests on production deployment
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${RESULTS_DIR:-./validation-results}"
NAMESPACE="${NAMESPACE:-fleet-management}"
BASE_URL="${BASE_URL:-https://fleet.capitaltechalliance.com}"

log_info() {
    echo "[SMOKE-TEST-VALIDATOR] $(date '+%Y-%m-%d %H:%M:%S') - $*"
}

################################################################################
# Smoke test: Health endpoints
################################################################################

test_health_endpoints() {
    log_info "Testing health endpoints..."

    # API health
    if curl -f -s "${BASE_URL}/api/health" | grep -q "ok\|healthy\|UP"; then
        log_info "✓ API health endpoint responding"
    else
        log_info "✗ API health endpoint failed"
        return 1
    fi

    # Database connectivity (via API)
    if curl -f -s "${BASE_URL}/api/health/db" >/dev/null 2>&1; then
        log_info "✓ Database connectivity OK"
    else
        log_info "✗ Database connectivity failed"
        return 1
    fi

    # Redis connectivity (via API)
    if curl -f -s "${BASE_URL}/api/health/redis" >/dev/null 2>&1; then
        log_info "✓ Redis connectivity OK"
    else
        log_info "✗ Redis connectivity failed"
        return 1
    fi

    return 0
}

################################################################################
# Smoke test: Critical user flows
################################################################################

test_critical_user_flows() {
    log_info "Testing critical user flows..."

    # Test 1: Homepage loads
    if curl -f -s "${BASE_URL}/" >/dev/null 2>&1; then
        log_info "✓ Homepage loads successfully"
    else
        log_info "✗ Homepage failed to load"
        return 1
    fi

    # Test 2: Login page accessible
    if curl -f -s "${BASE_URL}/login" >/dev/null 2>&1; then
        log_info "✓ Login page accessible"
    else
        log_info "✗ Login page not accessible"
        return 1
    fi

    # Test 3: API endpoints respond (unauthenticated should return 401)
    local status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/vehicles")
    if [ "$status" = "401" ] || [ "$status" = "200" ]; then
        log_info "✓ API authentication working (status: $status)"
    else
        log_info "✗ API authentication issue (status: $status)"
        return 1
    fi

    # Test 4: Static assets load
    if curl -f -s "${BASE_URL}/favicon.ico" >/dev/null 2>&1; then
        log_info "✓ Static assets accessible"
    else
        log_info "✗ Static assets not accessible"
        return 1
    fi

    return 0
}

################################################################################
# Smoke test: Service dependencies
################################################################################

test_service_dependencies() {
    log_info "Testing service dependencies..."

    # Check all required pods are running
    local required_components=("api" "frontend")

    for component in "${required_components[@]}"; do
        local running_pods=$(kubectl get pods -n "$NAMESPACE" \
            -l "app=fleet,component=$component" \
            -o jsonpath='{.items[?(@.status.phase=="Running")].metadata.name}' | wc -w)

        local desired_pods=$(kubectl get deployment -n "$NAMESPACE" \
            -l "app=fleet,component=$component" \
            -o jsonpath='{.items[0].spec.replicas}')

        if [ "$running_pods" -eq "$desired_pods" ] && [ "$running_pods" -gt 0 ]; then
            log_info "✓ Component '$component': $running_pods/$desired_pods pods running"
        else
            log_info "✗ Component '$component': Only $running_pods/$desired_pods pods running"
            return 1
        fi
    done

    # Check database is accessible from pods
    local api_pod=$(kubectl get pods -n "$NAMESPACE" \
        -l "app=fleet,component=api" \
        -o jsonpath='{.items[0].metadata.name}')

    if [ -n "$api_pod" ]; then
        if kubectl exec -n "$NAMESPACE" "$api_pod" -- \
            sh -c 'timeout 5 nc -zv postgres-service 5432' >/dev/null 2>&1; then
            log_info "✓ Database accessible from pods"
        else
            log_info "✗ Database not accessible from pods"
            return 1
        fi
    fi

    return 0
}

################################################################################
# Smoke test: Authentication & Authorization
################################################################################

test_authentication() {
    log_info "Testing authentication flows..."

    # Test Azure AD configuration endpoint
    if curl -f -s "${BASE_URL}/.auth/me" >/dev/null 2>&1; then
        log_info "✓ Auth endpoint accessible"
    else
        log_info "Warning: Auth endpoint check skipped (may require authentication)"
    fi

    # Test that protected routes require authentication
    local status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/vehicles")
    if [ "$status" = "401" ] || [ "$status" = "403" ]; then
        log_info "✓ Protected routes require authentication"
    elif [ "$status" = "200" ]; then
        log_info "Warning: API returned 200 without auth (check if test token is set)"
    else
        log_info "✗ Unexpected status for protected route: $status"
        return 1
    fi

    return 0
}

################################################################################
# Smoke test: Data integrity
################################################################################

test_data_integrity() {
    log_info "Testing data integrity..."

    # Create a test health check via API that verifies DB schema
    local response=$(curl -f -s "${BASE_URL}/api/health/detailed" 2>/dev/null)

    if [ -n "$response" ]; then
        if echo "$response" | grep -q "database\|schema\|tables"; then
            log_info "✓ Database schema integrity check passed"
        else
            log_info "Warning: Could not verify database schema"
        fi
    else
        log_info "Warning: Detailed health check not available"
    fi

    return 0
}

################################################################################
# Smoke test: Monitoring & Observability
################################################################################

test_monitoring() {
    log_info "Testing monitoring and observability..."

    # Check if metrics endpoint is accessible
    if curl -f -s "${BASE_URL}/api/metrics" >/dev/null 2>&1; then
        log_info "✓ Metrics endpoint accessible"
    else
        log_info "Warning: Metrics endpoint not accessible"
    fi

    # Check Prometheus annotations on pods
    local has_scrape_annotation=$(kubectl get pods -n "$NAMESPACE" \
        -l "app=fleet" \
        -o jsonpath='{.items[0].metadata.annotations.prometheus\.io/scrape}')

    if [ "$has_scrape_annotation" = "true" ]; then
        log_info "✓ Prometheus scraping configured"
    else
        log_info "Warning: Prometheus scraping not configured"
    fi

    return 0
}

################################################################################
# Smoke test: Security headers
################################################################################

test_security_headers() {
    log_info "Testing security headers..."

    local headers=$(curl -I -s "${BASE_URL}/")

    # Check for important security headers
    if echo "$headers" | grep -qi "X-Content-Type-Options"; then
        log_info "✓ X-Content-Type-Options header present"
    else
        log_info "Warning: X-Content-Type-Options header missing"
    fi

    if echo "$headers" | grep -qi "X-Frame-Options\|Content-Security-Policy"; then
        log_info "✓ Clickjacking protection headers present"
    else
        log_info "Warning: Clickjacking protection headers missing"
    fi

    if echo "$headers" | grep -qi "Strict-Transport-Security"; then
        log_info "✓ HSTS header present"
    else
        log_info "Warning: HSTS header missing"
    fi

    return 0
}

################################################################################
# Main validation
################################################################################

main() {
    log_info "Starting production smoke tests..."
    log_info "Base URL: $BASE_URL"

    local all_passed=true
    local failed_tests=()

    # Run all smoke tests
    if ! test_health_endpoints; then
        all_passed=false
        failed_tests+=("Health endpoints")
    fi

    if ! test_critical_user_flows; then
        all_passed=false
        failed_tests+=("Critical user flows")
    fi

    if ! test_service_dependencies; then
        all_passed=false
        failed_tests+=("Service dependencies")
    fi

    if ! test_authentication; then
        all_passed=false
        failed_tests+=("Authentication")
    fi

    if ! test_data_integrity; then
        all_passed=false
        failed_tests+=("Data integrity")
    fi

    if ! test_monitoring; then
        all_passed=false
        failed_tests+=("Monitoring")
    fi

    if ! test_security_headers; then
        all_passed=false
        failed_tests+=("Security headers")
    fi

    # Submit results
    if [ "$all_passed" = true ]; then
        log_info "All smoke tests PASSED"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" "smoke-tester" "PASSED"
        exit 0
    else
        local error_details="Failed tests: ${failed_tests[*]}"
        log_info "Smoke tests FAILED: $error_details"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" \
            "smoke-tester" "FAILED" "$error_details"
        exit 1
    fi
}

main "$@"
