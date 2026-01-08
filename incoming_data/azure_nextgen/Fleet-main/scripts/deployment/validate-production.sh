#!/bin/bash

# ============================================================================
# Fleet Management System - Production Validation Script
# ============================================================================
# Comprehensive validation of production deployment
# Author: Capital Tech Alliance
# Last Updated: 2025-12-31
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PRODUCTION_URL="${PRODUCTION_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"
TIMEOUT=10
VALIDATION_LOG="production-validation-$(date +%Y%m%d-%H%M%S).log"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$VALIDATION_LOG"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$VALIDATION_LOG"
    ((PASSED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$VALIDATION_LOG"
    ((WARNING_TESTS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$VALIDATION_LOG"
    ((FAILED_TESTS++))
}

run_test() {
    ((TOTAL_TESTS++))
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           Fleet Management System                             ║
║           Production Validation                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_info "Starting production validation"
log_info "Target URL: $PRODUCTION_URL"
log_info "Timestamp: $(date)"
echo ""

# ============================================================================
# Test 1: Basic Connectivity
# ============================================================================
log_info "Test 1: Basic Connectivity"
run_test

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$PRODUCTION_URL" || echo "000")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
    log_success "Application is accessible (HTTP $HTTP_STATUS)"
else
    log_error "Application is not accessible (HTTP $HTTP_STATUS)"
fi

# ============================================================================
# Test 2: Response Time
# ============================================================================
log_info "Test 2: Response Time"
run_test

RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' --max-time "$TIMEOUT" "$PRODUCTION_URL" || echo "999")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)

if [ "$(echo "$RESPONSE_TIME < 2" | bc -l)" -eq 1 ]; then
    log_success "Response time is excellent: ${RESPONSE_MS}ms"
elif [ "$(echo "$RESPONSE_TIME < 5" | bc -l)" -eq 1 ]; then
    log_warning "Response time is acceptable: ${RESPONSE_MS}ms (target: <2s)"
else
    log_error "Response time is too slow: ${RESPONSE_MS}ms (max: 5s)"
fi

# ============================================================================
# Test 3: SSL Certificate
# ============================================================================
log_info "Test 3: SSL Certificate"
run_test

DOMAIN=$(echo "$PRODUCTION_URL" | sed 's|https://||' | sed 's|/.*||')

if echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -dates &>/dev/null; then
    CERT_EXPIRY=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
    DAYS_UNTIL_EXPIRY=$(( ($(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null || echo 0) - $(date +%s)) / 86400 ))

    if [ "$DAYS_UNTIL_EXPIRY" -gt 30 ]; then
        log_success "SSL certificate is valid (expires in $DAYS_UNTIL_EXPIRY days)"
    elif [ "$DAYS_UNTIL_EXPIRY" -gt 0 ]; then
        log_warning "SSL certificate expires soon ($DAYS_UNTIL_EXPIRY days)"
    else
        log_error "SSL certificate is expired or invalid"
    fi
else
    log_warning "Could not verify SSL certificate"
fi

# ============================================================================
# Test 4: Security Headers
# ============================================================================
log_info "Test 4: Security Headers"

# Check for security headers
HEADERS=$(curl -s -I --max-time "$TIMEOUT" "$PRODUCTION_URL")

# Strict-Transport-Security
run_test
if echo "$HEADERS" | grep -iq "Strict-Transport-Security"; then
    log_success "HSTS header present"
else
    log_warning "HSTS header missing"
fi

# Content-Security-Policy
run_test
if echo "$HEADERS" | grep -iq "Content-Security-Policy"; then
    log_success "CSP header present"
else
    log_warning "CSP header missing"
fi

# X-Content-Type-Options
run_test
if echo "$HEADERS" | grep -iq "X-Content-Type-Options"; then
    log_success "X-Content-Type-Options header present"
else
    log_warning "X-Content-Type-Options header missing"
fi

# X-Frame-Options
run_test
if echo "$HEADERS" | grep -iq "X-Frame-Options"; then
    log_success "X-Frame-Options header present"
else
    log_warning "X-Frame-Options header missing"
fi

# ============================================================================
# Test 5: Content Delivery
# ============================================================================
log_info "Test 5: Content Delivery"
run_test

CONTENT_LENGTH=$(curl -s -I --max-time "$TIMEOUT" "$PRODUCTION_URL" | grep -i "content-length" | awk '{print $2}' | tr -d '\r')

if [ -n "$CONTENT_LENGTH" ] && [ "$CONTENT_LENGTH" -gt 0 ]; then
    log_success "Content is being delivered (${CONTENT_LENGTH} bytes)"
else
    log_warning "Could not determine content length"
fi

# ============================================================================
# Test 6: Compression
# ============================================================================
log_info "Test 6: Compression"
run_test

if curl -s -I -H "Accept-Encoding: gzip" --max-time "$TIMEOUT" "$PRODUCTION_URL" | grep -iq "content-encoding: gzip"; then
    log_success "Gzip compression is enabled"
else
    log_warning "Gzip compression not detected"
fi

# ============================================================================
# Test 7: Cache Headers
# ============================================================================
log_info "Test 7: Cache Headers"
run_test

if echo "$HEADERS" | grep -iq "cache-control"; then
    CACHE_CONTROL=$(echo "$HEADERS" | grep -i "cache-control" | cut -d: -f2 | tr -d '\r')
    log_success "Cache-Control header present:$CACHE_CONTROL"
else
    log_warning "Cache-Control header missing"
fi

# ============================================================================
# Test 8: Service Worker (PWA)
# ============================================================================
log_info "Test 8: Service Worker Registration"
run_test

SW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$PRODUCTION_URL/sw.js" || echo "000")

if [ "$SW_STATUS" -eq 200 ]; then
    log_success "Service Worker is accessible"
elif [ "$SW_STATUS" -eq 404 ]; then
    log_warning "Service Worker not found (PWA may not be configured)"
else
    log_warning "Service Worker status unclear (HTTP $SW_STATUS)"
fi

# ============================================================================
# Test 9: API Endpoints
# ============================================================================
log_info "Test 9: API Endpoint Availability"

# Check /api/health if it exists
run_test
API_HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$PRODUCTION_URL/api/health" 2>/dev/null || echo "404")

if [ "$API_HEALTH_STATUS" -eq 200 ]; then
    log_success "API health endpoint is responding"
elif [ "$API_HEALTH_STATUS" -eq 404 ]; then
    log_info "API health endpoint not configured"
else
    log_warning "API health endpoint returned HTTP $API_HEALTH_STATUS"
fi

# ============================================================================
# Test 10: Lighthouse Performance (if available)
# ============================================================================
log_info "Test 10: Performance Metrics"
run_test

if command -v lighthouse &> /dev/null; then
    log_info "Running Lighthouse audit..."
    LIGHTHOUSE_OUTPUT="lighthouse-$(date +%Y%m%d-%H%M%S).json"

    lighthouse "$PRODUCTION_URL" \
        --output=json \
        --output-path="$LIGHTHOUSE_OUTPUT" \
        --chrome-flags="--headless" \
        --quiet 2>/dev/null || true

    if [ -f "$LIGHTHOUSE_OUTPUT" ]; then
        PERF_SCORE=$(cat "$LIGHTHOUSE_OUTPUT" | grep -o '"performance":[0-9.]*' | cut -d: -f2 | head -1)
        PERF_SCORE_PCT=$(echo "$PERF_SCORE * 100" | bc | cut -d. -f1)

        if [ "$PERF_SCORE_PCT" -ge 90 ]; then
            log_success "Lighthouse Performance: ${PERF_SCORE_PCT}/100 (Excellent)"
        elif [ "$PERF_SCORE_PCT" -ge 70 ]; then
            log_warning "Lighthouse Performance: ${PERF_SCORE_PCT}/100 (Good)"
        else
            log_error "Lighthouse Performance: ${PERF_SCORE_PCT}/100 (Needs improvement)"
        fi

        log_info "Full Lighthouse report: $LIGHTHOUSE_OUTPUT"
    else
        log_warning "Lighthouse audit failed to generate report"
    fi
else
    log_info "Lighthouse not installed - skipping performance audit"
fi

# ============================================================================
# Test 11: DNS Resolution
# ============================================================================
log_info "Test 11: DNS Resolution"
run_test

if dig +short "$DOMAIN" &>/dev/null || nslookup "$DOMAIN" &>/dev/null || host "$DOMAIN" &>/dev/null; then
    log_success "DNS resolution successful"
else
    log_error "DNS resolution failed"
fi

# ============================================================================
# Test 12: Geographic Availability
# ============================================================================
log_info "Test 12: CDN/Edge Distribution"
run_test

# Check for CDN headers
if echo "$HEADERS" | grep -iq "cf-ray\|x-amz-cf-id\|x-azure-ref"; then
    log_success "CDN detected (edge distribution active)"
else
    log_info "CDN headers not detected"
fi

# ============================================================================
# Summary Report
# ============================================================================
echo "" | tee -a "$VALIDATION_LOG"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}" | tee -a "$VALIDATION_LOG"
echo -e "${BLUE}                    VALIDATION SUMMARY${NC}" | tee -a "$VALIDATION_LOG"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}" | tee -a "$VALIDATION_LOG"
echo "" | tee -a "$VALIDATION_LOG"

echo "Total Tests:    $TOTAL_TESTS" | tee -a "$VALIDATION_LOG"
echo -e "${GREEN}Passed:         $PASSED_TESTS${NC}" | tee -a "$VALIDATION_LOG"
echo -e "${YELLOW}Warnings:       $WARNING_TESTS${NC}" | tee -a "$VALIDATION_LOG"
echo -e "${RED}Failed:         $FAILED_TESTS${NC}" | tee -a "$VALIDATION_LOG"

# Calculate success rate
SUCCESS_RATE=$(echo "scale=2; ($PASSED_TESTS / $TOTAL_TESTS) * 100" | bc)
echo "" | tee -a "$VALIDATION_LOG"
echo "Success Rate:   ${SUCCESS_RATE}%" | tee -a "$VALIDATION_LOG"
echo "" | tee -a "$VALIDATION_LOG"

# Final verdict
if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}"
    cat << "EOF" | tee -a "$VALIDATION_LOG"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           ✅ PRODUCTION VALIDATION PASSED                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    log_success "All critical tests passed"
    EXIT_CODE=0
else
    echo -e "${RED}"
    cat << "EOF" | tee -a "$VALIDATION_LOG"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           ❌ PRODUCTION VALIDATION FAILED                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    log_error "$FAILED_TESTS test(s) failed - review required"
    EXIT_CODE=1
fi

echo "" | tee -a "$VALIDATION_LOG"
log_info "Full validation log: $VALIDATION_LOG"
echo ""

exit $EXIT_CODE
