#!/bin/bash

################################################################################
# Fleet Management System - Production Health Check
################################################################################
# Description: Comprehensive production health validation
# Author: Capital Tech Alliance - SRE Team
# Version: 1.0.0
# Last Updated: 2025-12-31
################################################################################

set -euo pipefail

# ============================================================================
# ANSI Color Codes
# ============================================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'

# ============================================================================
# Configuration
# ============================================================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/logs/health-checks"
readonly LOG_FILE="${LOG_DIR}/health-$(date +%Y%m%d-%H%M%S).log"
readonly REPORT_FILE="${LOG_DIR}/health-report-$(date +%Y%m%d-%H%M%S).json"

# Target Configuration
readonly TARGET_URL="${AZURE_STATIC_WEB_APP_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"
readonly TIMEOUT="${HEALTH_CHECK_TIMEOUT:-10}"

# Health Check Settings
readonly CHECK_HTTP="${CHECK_HTTP:-true}"
readonly CHECK_SSL="${CHECK_SSL:-true}"
readonly CHECK_HEADERS="${CHECK_HEADERS:-true}"
readonly CHECK_API="${CHECK_API:-true}"
readonly CHECK_PWA="${CHECK_PWA:-true}"
readonly FAIL_ON_WARNING="${FAIL_ON_WARNING:-false}"

# Counters
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0
TOTAL_CHECKS=0

# ============================================================================
# Utility Functions
# ============================================================================

log() {
    local level="$1"
    shift
    local message="$*"

    case "$level" in
        INFO)
            echo -e "${CYAN}[INFO]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        PASS)
            echo -e "${GREEN}[PASS]${NC} ${message}" | tee -a "${LOG_FILE}"
            ((PASSED_CHECKS++))
            ;;
        FAIL)
            echo -e "${RED}[FAIL]${NC} ${message}" | tee -a "${LOG_FILE}"
            ((FAILED_CHECKS++))
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} ${message}" | tee -a "${LOG_FILE}"
            ((WARNING_CHECKS++))
            ;;
    esac
    ((TOTAL_CHECKS++))
}

print_banner() {
    echo -e "${BOLD}${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Production Health Check - Fleet Management System          ║
║   Capital Tech Alliance                                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

check_prerequisites() {
    if ! command -v curl &> /dev/null; then
        echo "ERROR: curl not found"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        echo "WARNING: jq not found - JSON parsing will be limited"
    fi

    if ! command -v openssl &> /dev/null; then
        echo "WARNING: openssl not found - SSL checks will be skipped"
    fi
}

# ============================================================================
# HTTP Health Checks
# ============================================================================

check_http_status() {
    echo ""
    echo -e "${BOLD}${BLUE}HTTP Status Checks${NC}"
    echo "─────────────────────────────────────────────────────────────"

    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "${TARGET_URL}" || echo "000")

    if [ "$http_code" = "200" ]; then
        log PASS "HTTP Status: ${http_code} OK"
    else
        log FAIL "HTTP Status: ${http_code} (Expected 200)"
    fi

    # Check response time
    local response_time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" "${TARGET_URL}" || echo "999")

    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        log PASS "Response Time: ${response_time}s (< 2s)"
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        log WARN "Response Time: ${response_time}s (acceptable but slow)"
    else
        log FAIL "Response Time: ${response_time}s (> 5s)"
    fi

    # Check redirects
    local final_url
    final_url=$(curl -Ls -o /dev/null -w "%{url_effective}" --max-time "$TIMEOUT" "${TARGET_URL}")

    if [[ "$final_url" == https* ]]; then
        log PASS "HTTPS Redirect: Correctly redirected to HTTPS"
    else
        log WARN "HTTPS Redirect: Not redirected to HTTPS"
    fi
}

# ============================================================================
# SSL/TLS Certificate Checks
# ============================================================================

check_ssl_certificate() {
    if [ "$CHECK_SSL" != "true" ]; then
        return 0
    fi

    echo ""
    echo -e "${BOLD}${BLUE}SSL/TLS Certificate Checks${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if ! command -v openssl &> /dev/null; then
        log WARN "OpenSSL not available - skipping SSL checks"
        return 0
    fi

    # Extract hostname from URL
    local hostname
    hostname=$(echo "$TARGET_URL" | sed -e 's|^https://||' -e 's|/.*||')

    # Get certificate info
    local cert_info
    cert_info=$(echo | openssl s_client -servername "$hostname" -connect "${hostname}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")

    if [ -z "$cert_info" ]; then
        log FAIL "SSL Certificate: Unable to retrieve certificate"
        return 0
    fi

    # Check expiration
    local expiry_date
    expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)

    local expiry_epoch
    expiry_epoch=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" "+%s" 2>/dev/null || date -d "$expiry_date" "+%s" 2>/dev/null || echo "0")

    local current_epoch
    current_epoch=$(date "+%s")

    local days_until_expiry
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

    if [ "$days_until_expiry" -gt 30 ]; then
        log PASS "SSL Certificate: Valid for ${days_until_expiry} days"
    elif [ "$days_until_expiry" -gt 7 ]; then
        log WARN "SSL Certificate: Expires in ${days_until_expiry} days (renew soon)"
    else
        log FAIL "SSL Certificate: Expires in ${days_until_expiry} days (URGENT)"
    fi

    # Check TLS version
    local tls_version
    tls_version=$(curl -sI --tlsv1.2 --max-time "$TIMEOUT" "${TARGET_URL}" -o /dev/null -w "%{ssl_version}" 2>/dev/null || echo "unknown")

    if [[ "$tls_version" == "TLSv1.2" ]] || [[ "$tls_version" == "TLSv1.3" ]]; then
        log PASS "TLS Version: ${tls_version}"
    else
        log FAIL "TLS Version: ${tls_version} (should be TLS 1.2 or 1.3)"
    fi
}

# ============================================================================
# Security Headers Checks
# ============================================================================

check_security_headers() {
    if [ "$CHECK_HEADERS" != "true" ]; then
        return 0
    fi

    echo ""
    echo -e "${BOLD}${BLUE}Security Headers Checks${NC}"
    echo "─────────────────────────────────────────────────────────────"

    local headers
    headers=$(curl -sI --max-time "$TIMEOUT" "${TARGET_URL}" || echo "")

    # Check for security headers
    local required_headers=(
        "Strict-Transport-Security"
        "X-Content-Type-Options"
        "X-Frame-Options"
        "Content-Security-Policy"
    )

    for header in "${required_headers[@]}"; do
        if echo "$headers" | grep -qi "^${header}:"; then
            log PASS "Security Header: ${header} present"
        else
            log WARN "Security Header: ${header} missing"
        fi
    done

    # Check for unwanted headers
    if echo "$headers" | grep -qi "^Server:"; then
        local server_value
        server_value=$(echo "$headers" | grep -i "^Server:" | cut -d' ' -f2-)
        log WARN "Server Header: Exposed (${server_value}) - should be hidden"
    else
        log PASS "Server Header: Not exposed"
    fi

    if echo "$headers" | grep -qi "^X-Powered-By:"; then
        log WARN "X-Powered-By Header: Exposed - should be removed"
    else
        log PASS "X-Powered-By Header: Not exposed"
    fi
}

# ============================================================================
# API Endpoint Checks
# ============================================================================

check_api_endpoints() {
    if [ "$CHECK_API" != "true" ]; then
        return 0
    fi

    echo ""
    echo -e "${BOLD}${BLUE}API Endpoint Checks${NC}"
    echo "─────────────────────────────────────────────────────────────"

    # Check health endpoint
    local health_url="${TARGET_URL}/api/health"
    local health_status
    health_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "${health_url}" || echo "000")

    if [ "$health_status" = "200" ]; then
        log PASS "API Health Endpoint: ${health_status} OK"
    elif [ "$health_status" = "404" ]; then
        log WARN "API Health Endpoint: Not found (404)"
    else
        log FAIL "API Health Endpoint: ${health_status}"
    fi

    # Check API authentication
    local api_url="${TARGET_URL}/api/vehicles"
    local api_status
    api_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "${api_url}" || echo "000")

    if [ "$api_status" = "401" ] || [ "$api_status" = "403" ]; then
        log PASS "API Authentication: Protected (${api_status})"
    elif [ "$api_status" = "200" ]; then
        log WARN "API Authentication: Public access (should require auth)"
    else
        log WARN "API Status: ${api_status}"
    fi
}

# ============================================================================
# PWA Manifest Checks
# ============================================================================

check_pwa_manifest() {
    if [ "$CHECK_PWA" != "true" ]; then
        return 0
    fi

    echo ""
    echo -e "${BOLD}${BLUE}PWA Manifest Checks${NC}"
    echo "─────────────────────────────────────────────────────────────"

    # Check manifest.json
    local manifest_url="${TARGET_URL}/manifest.json"
    local manifest_status
    manifest_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "${manifest_url}" || echo "000")

    if [ "$manifest_status" = "200" ]; then
        log PASS "PWA Manifest: Available"

        # Download and validate manifest
        local manifest_content
        manifest_content=$(curl -s --max-time "$TIMEOUT" "${manifest_url}" || echo "{}")

        if command -v jq &> /dev/null; then
            # Check required fields
            local name
            name=$(echo "$manifest_content" | jq -r '.name // empty')

            if [ -n "$name" ]; then
                log PASS "PWA Manifest: Name field present (${name})"
            else
                log WARN "PWA Manifest: Name field missing"
            fi

            local icons
            icons=$(echo "$manifest_content" | jq -r '.icons // empty')

            if [ -n "$icons" ]; then
                log PASS "PWA Manifest: Icons defined"
            else
                log WARN "PWA Manifest: Icons missing"
            fi
        fi
    else
        log WARN "PWA Manifest: Not found (${manifest_status})"
    fi

    # Check service worker
    local sw_url="${TARGET_URL}/sw.js"
    local sw_status
    sw_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "${sw_url}" || echo "000")

    if [ "$sw_status" = "200" ]; then
        log PASS "Service Worker: Available"
    else
        log WARN "Service Worker: Not found (${sw_status})"
    fi
}

# ============================================================================
# Performance Checks
# ============================================================================

check_performance() {
    echo ""
    echo -e "${BOLD}${BLUE}Performance Checks${NC}"
    echo "─────────────────────────────────────────────────────────────"

    # Check compression
    local content_encoding
    content_encoding=$(curl -sI -H "Accept-Encoding: gzip, deflate, br" --max-time "$TIMEOUT" "${TARGET_URL}" | grep -i "content-encoding" | cut -d' ' -f2- || echo "")

    if [[ "$content_encoding" =~ (gzip|br|deflate) ]]; then
        log PASS "Compression: Enabled (${content_encoding})"
    else
        log WARN "Compression: Not detected"
    fi

    # Check caching headers
    local cache_control
    cache_control=$(curl -sI --max-time "$TIMEOUT" "${TARGET_URL}" | grep -i "cache-control" | cut -d' ' -f2- || echo "")

    if [ -n "$cache_control" ]; then
        log PASS "Cache Headers: Present (${cache_control})"
    else
        log WARN "Cache Headers: Not found"
    fi

    # Check CDN
    local cdn_header
    cdn_header=$(curl -sI --max-time "$TIMEOUT" "${TARGET_URL}" | grep -iE "x-cache|cf-cache-status|x-cdn" | head -1 || echo "")

    if [ -n "$cdn_header" ]; then
        log PASS "CDN: Detected"
    else
        log INFO "CDN: Not detected (not necessarily a problem)"
    fi
}

# ============================================================================
# Generate Report
# ============================================================================

generate_report() {
    local pass_rate
    if [ $TOTAL_CHECKS -gt 0 ]; then
        pass_rate=$(echo "scale=2; ($PASSED_CHECKS * 100) / $TOTAL_CHECKS" | bc)
    else
        pass_rate=0
    fi

    # Create JSON report
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "target_url": "${TARGET_URL}",
  "summary": {
    "total_checks": ${TOTAL_CHECKS},
    "passed": ${PASSED_CHECKS},
    "failed": ${FAILED_CHECKS},
    "warnings": ${WARNING_CHECKS},
    "pass_rate": "${pass_rate}%"
  },
  "status": "$([ $FAILED_CHECKS -eq 0 ] && echo "HEALTHY" || echo "DEGRADED")"
}
EOF

    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  HEALTH CHECK SUMMARY${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "  Target URL:         ${TARGET_URL}"
    echo -e "  Total Checks:       ${TOTAL_CHECKS}"
    echo -e "  ${GREEN}Passed:${NC}             ${PASSED_CHECKS}"
    echo -e "  ${RED}Failed:${NC}             ${FAILED_CHECKS}"
    echo -e "  ${YELLOW}Warnings:${NC}           ${WARNING_CHECKS}"
    echo -e "  Pass Rate:          ${pass_rate}%"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "  ${GREEN}${BOLD}Status: HEALTHY ✓${NC}"
    else
        echo -e "  ${RED}${BOLD}Status: DEGRADED ✗${NC}"
    fi

    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "  Log File:           ${LOG_FILE}"
    echo -e "  Report File:        ${REPORT_FILE}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Setup
    mkdir -p "$LOG_DIR"
    exec > >(tee -a "${LOG_FILE}")
    exec 2>&1

    # Print banner
    print_banner

    # Prerequisites
    check_prerequisites

    log INFO "Target: ${TARGET_URL}"
    log INFO "Timeout: ${TIMEOUT}s"
    echo ""

    # Run health checks
    check_http_status
    check_ssl_certificate
    check_security_headers
    check_api_endpoints
    check_pwa_manifest
    check_performance

    # Generate report
    generate_report

    # Exit code
    if [ $FAILED_CHECKS -gt 0 ]; then
        exit 1
    elif [ $WARNING_CHECKS -gt 0 ] && [ "$FAIL_ON_WARNING" = "true" ]; then
        exit 1
    else
        exit 0
    fi
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    cat << EOF
Usage: $0 [OPTIONS]

Production health check for Fleet Management System.

OPTIONS:
    --url URL               Target URL to check
    --timeout SECONDS       Request timeout (default: 10)
    --fail-on-warning       Fail if warnings detected
    --skip-ssl              Skip SSL checks
    --skip-headers          Skip security headers checks
    --skip-api              Skip API endpoint checks
    --skip-pwa              Skip PWA manifest checks
    -h, --help              Show this help message

ENVIRONMENT VARIABLES:
    AZURE_STATIC_WEB_APP_URL    Target URL
    HEALTH_CHECK_TIMEOUT        Timeout in seconds
    FAIL_ON_WARNING             Set to 'true' to fail on warnings

EXAMPLES:
    # Standard health check
    $0

    # Check specific URL
    $0 --url https://example.com

    # Fail on warnings (CI/CD)
    $0 --fail-on-warning

EOF
    exit 0
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            TARGET_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --fail-on-warning)
            FAIL_ON_WARNING=true
            shift
            ;;
        --skip-ssl)
            CHECK_SSL=false
            shift
            ;;
        --skip-headers)
            CHECK_HEADERS=false
            shift
            ;;
        --skip-api)
            CHECK_API=false
            shift
            ;;
        --skip-pwa)
            CHECK_PWA=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main
main
