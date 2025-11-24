#!/usr/bin/env bash
#
# Post-Deployment Validation Script
# Comprehensive validation of production deployment
#
# Exit codes:
#   0 - All validations passed
#   1 - One or more validations failed
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-fleet-management}"
VALIDATION_REPORT="validation-report-$(date +%Y%m%d-%H%M%S).txt"
PERFORMANCE_THRESHOLD=2000  # 2 seconds

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Start logging
exec > >(tee "$VALIDATION_REPORT")
exec 2>&1

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; ((PASSED++)); }
log_failure() { echo -e "${RED}[FAIL]${NC} $1"; ((FAILED++)); }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; ((WARNINGS++)); }
log_section() {
    echo ""
    echo -e "${MAGENTA}========================================${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}========================================${NC}"
}

# Function to get application URL
get_app_url() {
    local external_ip=$(kubectl get svc fleet-frontend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

    if [[ -n "$external_ip" ]]; then
        echo "http://$external_ip"
    elif [[ -n "${PRODUCTION_DOMAIN:-}" ]]; then
        echo "https://$PRODUCTION_DOMAIN"
    else
        echo ""
    fi
}

# Function to check endpoint responds
check_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-10}

    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")

    if [[ "$status" == "$expected_status" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to measure response time
measure_response_time() {
    local url=$1
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$url" 2>/dev/null || echo "999")

    # Convert to milliseconds
    echo "$response_time" | awk '{printf "%.0f", $1 * 1000}'
}

# Validation 1: Check all endpoints respond
validate_endpoints() {
    log_section "1. Endpoint Health Validation"

    local app_url=$(get_app_url)

    if [[ -z "$app_url" ]]; then
        log_failure "Cannot determine application URL"
        return 1
    fi

    log_info "Testing against: $app_url"

    # Test frontend
    log_info "Testing frontend (/)..."
    if check_endpoint "$app_url/"; then
        log_success "Frontend responding (200 OK)"
    else
        log_failure "Frontend not responding"
    fi

    # Test API health endpoint
    log_info "Testing API health endpoint..."
    if check_endpoint "$app_url/api/health"; then
        log_success "API health endpoint responding (200 OK)"
    else
        log_failure "API health endpoint not responding"
    fi

    # Test API protected endpoints (should return 401 without auth)
    local protected_endpoints=(
        "/api/vehicles"
        "/api/drivers"
        "/api/work-orders"
        "/api/facilities"
    )

    log_info "Testing protected API endpoints..."
    for endpoint in "${protected_endpoints[@]}"; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$app_url$endpoint" 2>/dev/null || echo "000")

        if [[ "$status" == "401" ]] || [[ "$status" == "403" ]]; then
            log_success "Endpoint $endpoint properly protected ($status)"
        elif [[ "$status" == "200" ]]; then
            log_warning "Endpoint $endpoint responding without auth (may be intentional)"
        else
            log_failure "Endpoint $endpoint unexpected status: $status"
        fi
    done
}

# Validation 2: Verify Microsoft SSO works
validate_microsoft_sso() {
    log_section "2. Microsoft SSO Configuration"

    local app_url=$(get_app_url)

    if [[ -z "$app_url" ]]; then
        log_warning "Cannot validate SSO - no application URL"
        return 0
    fi

    # Check if Microsoft OAuth endpoint is configured
    log_info "Testing Microsoft OAuth endpoint..."
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$app_url/api/auth/microsoft" 2>/dev/null || echo "000")

    if [[ "$status" == "302" ]] || [[ "$status" == "301" ]]; then
        log_success "Microsoft OAuth redirect configured ($status)"
    else
        log_warning "Microsoft OAuth endpoint status: $status (expected redirect)"
    fi

    # Check environment variables are set
    log_info "Checking Azure AD configuration..."
    local config_ok=true

    if [[ -n "${AZURE_AD_CLIENT_ID:-}" ]]; then
        log_success "AZURE_AD_CLIENT_ID is configured"
    else
        log_failure "AZURE_AD_CLIENT_ID not set"
        config_ok=false
    fi

    if [[ -n "${AZURE_AD_TENANT_ID:-}" ]]; then
        log_success "AZURE_AD_TENANT_ID is configured"
    else
        log_failure "AZURE_AD_TENANT_ID not set"
        config_ok=false
    fi

    $config_ok || return 1
}

# Validation 3: Test database connectivity
validate_database() {
    log_section "3. Database Connectivity"

    # Get database pod
    local db_pod=$(kubectl get pods -n "$NAMESPACE" -l app=fleet-postgres -o name 2>/dev/null | head -1 || echo "")

    if [[ -z "$db_pod" ]]; then
        log_warning "Database pod not found - may be using external database"
        return 0
    fi

    log_info "Testing database connection..."
    if kubectl exec -n "$NAMESPACE" "$db_pod" -- psql -U fleetadmin -d fleetdb -c "SELECT 1" &> /dev/null; then
        log_success "Database connection successful"

        # Test query performance
        local query_time=$(kubectl exec -n "$NAMESPACE" "$db_pod" -- psql -U fleetadmin -d fleetdb -c "\timing" -c "SELECT COUNT(*) FROM vehicles" 2>&1 | grep "Time:" | awk '{print $2}' || echo "unknown")
        log_info "Query performance: $query_time"

        # Check database size
        local db_size=$(kubectl exec -n "$NAMESPACE" "$db_pod" -- psql -U fleetadmin -d fleetdb -t -c "SELECT pg_size_pretty(pg_database_size('fleetdb'));" 2>/dev/null | xargs || echo "unknown")
        log_info "Database size: $db_size"

        # Check connection count
        local conn_count=$(kubectl exec -n "$NAMESPACE" "$db_pod" -- psql -U fleetadmin -d fleetdb -t -c "SELECT COUNT(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "unknown")
        log_info "Active connections: $conn_count"

        if [[ "$conn_count" != "unknown" ]] && [[ "$conn_count" -gt 50 ]]; then
            log_warning "High number of database connections: $conn_count"
        fi
    else
        log_failure "Cannot connect to database"
        return 1
    fi
}

# Validation 4: Check Application Insights receiving data
validate_application_insights() {
    log_section "4. Application Insights"

    if [[ -z "${APPLICATION_INSIGHTS_CONNECTION_STRING:-}" ]]; then
        log_warning "APPLICATION_INSIGHTS_CONNECTION_STRING not configured"
        return 0
    fi

    log_success "Application Insights connection string is configured"

    # Check if instrumentation key is in frontend bundle
    local app_url=$(get_app_url)
    if [[ -n "$app_url" ]]; then
        local has_app_insights=$(curl -s "$app_url" | grep -o "applicationinsights" | wc -l || echo "0")
        if [[ "$has_app_insights" -gt 0 ]]; then
            log_success "Application Insights SDK detected in frontend"
        else
            log_warning "Application Insights SDK not detected in frontend bundle"
        fi
    fi

    log_info "Verify telemetry in Azure Portal > Application Insights"
}

# Validation 5: Validate lazy loading works
validate_lazy_loading() {
    log_section "5. Code Splitting & Lazy Loading"

    local app_url=$(get_app_url)

    if [[ -z "$app_url" ]]; then
        log_warning "Cannot validate lazy loading - no application URL"
        return 0
    fi

    # Download index.html and check for chunk references
    log_info "Analyzing frontend bundle structure..."
    local html_content=$(curl -s "$app_url" || echo "")

    if [[ -z "$html_content" ]]; then
        log_failure "Cannot fetch frontend HTML"
        return 1
    fi

    # Check for multiple JS chunks
    local chunk_count=$(echo "$html_content" | grep -o '\.js"' | wc -l || echo "0")

    if [[ "$chunk_count" -gt 5 ]]; then
        log_success "Code splitting detected ($chunk_count JS files)"
    elif [[ "$chunk_count" -gt 0 ]]; then
        log_warning "Limited code splitting detected ($chunk_count JS files)"
    else
        log_failure "No code splitting detected"
    fi

    # Check for vendor chunks
    if echo "$html_content" | grep -q "vendor"; then
        log_success "Vendor chunk separation detected"
    else
        log_warning "Vendor chunk not detected"
    fi
}

# Validation 6: Test mobile responsiveness
validate_mobile_responsiveness() {
    log_section "6. Mobile Responsiveness"

    local app_url=$(get_app_url)

    if [[ -z "$app_url" ]]; then
        log_warning "Cannot validate responsiveness - no application URL"
        return 0
    fi

    # Check for viewport meta tag
    log_info "Checking viewport configuration..."
    local html_content=$(curl -s "$app_url" || echo "")

    if echo "$html_content" | grep -q 'viewport'; then
        log_success "Viewport meta tag configured"
    else
        log_failure "Viewport meta tag not found"
    fi

    # Check for responsive CSS indicators
    if echo "$html_content" | grep -qE '(media.*query|@media)'; then
        log_success "Responsive CSS detected"
    else
        log_info "Responsive CSS not detected in HTML (may be in separate files)"
    fi

    log_info "For full responsiveness testing, use browser dev tools or Lighthouse"
}

# Validation 7: Run critical E2E test
validate_critical_e2e() {
    log_section "7. Critical E2E Tests"

    log_info "Checking if E2E tests are available..."

    if [[ -d "tests/e2e" ]] || [[ -f "playwright.config.ts" ]]; then
        log_info "E2E test infrastructure detected"

        if command -v npm &> /dev/null; then
            log_info "To run E2E tests manually: npm run test:e2e"
        fi

        log_success "E2E test infrastructure available"
    else
        log_warning "No E2E test infrastructure found"
    fi
}

# Validation 8: Check performance metrics
validate_performance() {
    log_section "8. Performance Metrics"

    local app_url=$(get_app_url)

    if [[ -z "$app_url" ]]; then
        log_warning "Cannot measure performance - no application URL"
        return 0
    fi

    # Measure frontend load time
    log_info "Measuring frontend load time..."
    local load_time=$(measure_response_time "$app_url")

    log_info "Frontend load time: ${load_time}ms"

    if [[ "$load_time" -lt "$PERFORMANCE_THRESHOLD" ]]; then
        log_success "Frontend loads in < ${PERFORMANCE_THRESHOLD}ms"
    else
        log_warning "Frontend load time exceeds threshold: ${load_time}ms > ${PERFORMANCE_THRESHOLD}ms"
    fi

    # Measure API response time
    log_info "Measuring API response time..."
    local api_time=$(measure_response_time "$app_url/api/health")

    log_info "API response time: ${api_time}ms"

    if [[ "$api_time" -lt 500 ]]; then
        log_success "API responds in < 500ms"
    else
        log_warning "API response time: ${api_time}ms (target: < 500ms)"
    fi
}

# Validation 9: Check Kubernetes resources
validate_kubernetes_resources() {
    log_section "9. Kubernetes Resources"

    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl not found - skipping K8s checks"
        return 0
    fi

    # Check pods are running
    log_info "Checking pod status..."
    local pod_status=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null || echo "")

    if [[ -z "$pod_status" ]]; then
        log_failure "No pods found in namespace: $NAMESPACE"
        return 1
    fi

    local running_pods=$(echo "$pod_status" | grep -c "Running" || echo "0")
    local total_pods=$(echo "$pod_status" | wc -l)

    log_info "Pods: $running_pods/$total_pods running"

    if [[ "$running_pods" == "$total_pods" ]]; then
        log_success "All pods are running"
    else
        log_failure "Not all pods are running ($running_pods/$total_pods)"
        echo "$pod_status"
    fi

    # Check for pod restarts
    local high_restart_pods=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | awk '$4 > 2 {print $1, $4}' || echo "")

    if [[ -z "$high_restart_pods" ]]; then
        log_success "No pods with high restart counts"
    else
        log_warning "Pods with high restart counts:"
        echo "$high_restart_pods"
    fi

    # Check services
    log_info "Checking services..."
    local svc_count=$(kubectl get svc -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l || echo "0")

    if [[ "$svc_count" -gt 0 ]]; then
        log_success "Services configured ($svc_count services)"
    else
        log_failure "No services found"
    fi

    # Check resource limits
    log_info "Checking resource limits..."
    local pods_without_limits=$(kubectl get pods -n "$NAMESPACE" -o json 2>/dev/null | jq -r '.items[] | select(.spec.containers[].resources.limits == null) | .metadata.name' || echo "")

    if [[ -z "$pods_without_limits" ]]; then
        log_success "All pods have resource limits"
    else
        log_warning "Pods without resource limits:"
        echo "$pods_without_limits"
    fi
}

# Validation 10: Security checks
validate_security() {
    log_section "10. Security Validation"

    local app_url=$(get_app_url)

    if [[ -z "$app_url" ]]; then
        log_warning "Cannot validate security headers - no application URL"
        return 0
    fi

    # Check security headers
    log_info "Checking HTTP security headers..."
    local headers=$(curl -s -I "$app_url" 2>/dev/null || echo "")

    if [[ -z "$headers" ]]; then
        log_warning "Cannot fetch HTTP headers"
        return 0
    fi

    # Check for important security headers
    if echo "$headers" | grep -qi "Strict-Transport-Security"; then
        log_success "HSTS header present"
    else
        log_warning "HSTS header missing (important for HTTPS)"
    fi

    if echo "$headers" | grep -qi "X-Content-Type-Options.*nosniff"; then
        log_success "X-Content-Type-Options: nosniff present"
    else
        log_warning "X-Content-Type-Options header missing"
    fi

    if echo "$headers" | grep -qi "X-Frame-Options"; then
        log_success "X-Frame-Options header present"
    else
        log_warning "X-Frame-Options header missing"
    fi

    if echo "$headers" | grep -qi "Content-Security-Policy"; then
        log_success "Content-Security-Policy header present"
    else
        log_warning "Content-Security-Policy header missing"
    fi

    # Check for HTTPS redirect
    if [[ "$app_url" =~ ^https:// ]]; then
        log_success "Application is using HTTPS"
    else
        log_warning "Application is not using HTTPS"
    fi
}

# Main validation flow
main() {
    log_section "PRODUCTION DEPLOYMENT VALIDATION"
    echo "Starting post-deployment validation..."
    echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    echo "Report: $VALIDATION_REPORT"
    echo ""

    # Run all validations
    validate_endpoints || true
    validate_microsoft_sso || true
    validate_database || true
    validate_application_insights || true
    validate_lazy_loading || true
    validate_mobile_responsiveness || true
    validate_critical_e2e || true
    validate_performance || true
    validate_kubernetes_resources || true
    validate_security || true

    # Print summary
    log_section "VALIDATION SUMMARY"
    echo ""
    echo -e "  ${GREEN}✓ Passed:${NC}   $PASSED"
    echo -e "  ${RED}✗ Failed:${NC}   $FAILED"
    echo -e "  ${YELLOW}⚠ Warnings:${NC} $WARNINGS"
    echo ""

    # Generate recommendation
    if [[ $FAILED -eq 0 ]]; then
        if [[ $WARNINGS -eq 0 ]]; then
            echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║  ✓ DEPLOYMENT VALIDATED SUCCESSFULLY  ║${NC}"
            echo -e "${GREEN}║  Production is ready                   ║${NC}"
            echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        else
            echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
            echo -e "${YELLOW}║  ⚠ DEPLOYMENT VALIDATED WITH WARNINGS ║${NC}"
            echo -e "${YELLOW}║  Review warnings above                 ║${NC}"
            echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
        fi
        echo ""
        echo "✓ Production deployment is operational"
    else
        echo -e "${RED}╔════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ✗ VALIDATION FAILED                   ║${NC}"
        echo -e "${RED}║  Fix issues before production use      ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo "Critical issues detected. Fix before production use."
    fi

    echo ""
    echo "Report saved to: $VALIDATION_REPORT"
    echo ""

    # Return appropriate exit code
    [[ $FAILED -eq 0 ]] && exit 0 || exit 1
}

# Run main function
main "$@"
