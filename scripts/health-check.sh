#!/bin/bash

##############################################################################
# System Health Monitoring Script
#
# Continuously monitors system health and sends alerts
#
# Features:
# - Real-time health checks
# - Performance monitoring
# - Error rate tracking
# - Database connection monitoring
# - API endpoint verification
# - Alert system
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${VITE_API_URL:-http://localhost:3000/api}"
CHECK_INTERVAL=60  # seconds
ALERT_THRESHOLD_ERROR_RATE=0.05  # 5%
ALERT_THRESHOLD_RESPONSE_TIME=2000  # milliseconds
LOG_FILE="/tmp/health-check-$(date +%Y%m%d).log"

# Metrics
TOTAL_CHECKS=0
FAILED_CHECKS=0
TOTAL_RESPONSE_TIME=0

##############################################################################
# Helper Functions
##############################################################################

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_api_health() {
    local url="$API_URL/health"
    local start_time=$(date +%s%N)

    response=$(curl -s -o /tmp/health-response.json -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    TOTAL_RESPONSE_TIME=$((TOTAL_RESPONSE_TIME + response_time))

    if [ "$response" = "200" ]; then
        local avg_response=$(( TOTAL_RESPONSE_TIME / TOTAL_CHECKS ))

        if [ "$response_time" -gt "$ALERT_THRESHOLD_RESPONSE_TIME" ]; then
            log "⚠️  WARN: Slow API response: ${response_time}ms (avg: ${avg_response}ms)"
        else
            log "✅ HEALTHY: API response ${response_time}ms (avg: ${avg_response}ms)"
        fi

        # Check database status from health response
        if [ -f /tmp/health-response.json ]; then
            db_status=$(jq -r '.database.status' /tmp/health-response.json 2>/dev/null || echo "unknown")

            if [ "$db_status" = "healthy" ]; then
                log "✅ Database connection: healthy"
            else
                log "❌ ALERT: Database connection: $db_status"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
            fi
        fi
    else
        log "❌ ALERT: API health check failed (HTTP $response)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # Calculate error rate
    local error_rate=$(echo "scale=4; $FAILED_CHECKS / $TOTAL_CHECKS" | bc)

    if (( $(echo "$error_rate > $ALERT_THRESHOLD_ERROR_RATE" | bc -l) )); then
        log "🚨 CRITICAL: Error rate ${error_rate} exceeds threshold ${ALERT_THRESHOLD_ERROR_RATE}"
    fi
}

check_core_endpoints() {
    log "Checking core endpoints..."

    local endpoints=(
        "/vehicles"
        "/drivers"
        "/incidents"
        "/maintenance"
        "/fuel"
    )

    for endpoint in "${endpoints[@]}"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint" 2>/dev/null || echo "000")

        # Should return 401 (unauthorized) when not authenticated
        if [ "$response" = "401" ] || [ "$response" = "200" ]; then
            log "✅ $endpoint: responding (HTTP $response)"
        else
            log "❌ ALERT: $endpoint not responding correctly (HTTP $response)"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    done
}

print_metrics() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "System Metrics"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Total Checks: $TOTAL_CHECKS"
    log "Failed Checks: $FAILED_CHECKS"

    if [ "$TOTAL_CHECKS" -gt 0 ]; then
        local success_rate=$(echo "scale=2; (($TOTAL_CHECKS - $FAILED_CHECKS) / $TOTAL_CHECKS) * 100" | bc)
        local avg_response=$(( TOTAL_RESPONSE_TIME / TOTAL_CHECKS ))

        log "Success Rate: ${success_rate}%"
        log "Avg Response Time: ${avg_response}ms"
    fi

    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

##############################################################################
# Main Monitoring Loop
##############################################################################

main() {
    log "═══════════════════════════════════════════════════════════════════"
    log "SYSTEM HEALTH MONITORING STARTED"
    log "═══════════════════════════════════════════════════════════════════"
    log "API URL: $API_URL"
    log "Check Interval: ${CHECK_INTERVAL}s"
    log "Log File: $LOG_FILE"
    log ""

    trap 'log "Health monitoring stopped"; print_metrics; exit 0' INT TERM

    while true; do
        check_api_health
        check_core_endpoints
        print_metrics

        log "Next check in ${CHECK_INTERVAL}s..."
        sleep "$CHECK_INTERVAL"
    done
}

# Check dependencies
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Warning: jq is not installed. Some health checks will be limited."
fi

if ! command -v bc &> /dev/null; then
    echo "Warning: bc is not installed. Metrics calculations will be limited."
fi

main "$@"
