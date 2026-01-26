#!/bin/bash
# ============================================================================
# Fleet Production Emulator Deployment Script
# Starts all emulators in production environment
# ============================================================================

set -e  # Exit on error

# Configuration
API_BASE_URL="${API_BASE_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net/api}"
VEHICLE_COUNT="${VEHICLE_COUNT:-50}"
MAX_RETRIES=10
RETRY_DELAY=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# Function: Wait for API to be ready
# ============================================================================
wait_for_api() {
    log_info "Waiting for API to be ready..."

    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s "$API_BASE_URL/health" | grep -q "healthy"; then
            log_success "API is healthy and ready"
            return 0
        else
            log_warning "API not ready yet, retry $i/$MAX_RETRIES..."
            sleep $RETRY_DELAY
        fi
    done

    log_error "API health check failed after $MAX_RETRIES retries"
    return 1
}

# ============================================================================
# Function: Start emulators
# ============================================================================
start_emulators() {
    log_info "Starting fleet emulators for $VEHICLE_COUNT vehicles..."

    RESPONSE=$(curl -X POST "$API_BASE_URL/emulator/start" \
        -H "Content-Type: application/json" \
        -d "{\"count\": $VEHICLE_COUNT}" \
        -w "\nHTTP_STATUS:%{http_code}" \
        -s)

    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
        log_success "Emulators started successfully!"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        return 0
    else
        log_error "Failed to start emulators (HTTP $HTTP_STATUS)"
        echo "$BODY"
        return 1
    fi
}

# ============================================================================
# Function: Verify emulator status
# ============================================================================
verify_emulators() {
    log_info "Verifying emulator status..."

    sleep 5  # Wait for emulators to initialize

    # Get emulator status
    STATUS_RESPONSE=$(curl -s "$API_BASE_URL/emulator/status")

    if [ $? -ne 0 ]; then
        log_error "Failed to get emulator status"
        return 1
    fi

    IS_RUNNING=$(echo "$STATUS_RESPONSE" | jq -r '.isRunning' 2>/dev/null)
    ACTIVE_VEHICLES=$(echo "$STATUS_RESPONSE" | jq -r '.stats.activeVehicles' 2>/dev/null)

    if [ "$IS_RUNNING" = "true" ] && [ "$ACTIVE_VEHICLES" -gt 0 ]; then
        log_success "Emulators verified: $ACTIVE_VEHICLES vehicles active"
        return 0
    else
        log_error "Emulator verification failed"
        echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
        return 1
    fi
}

# ============================================================================
# Function: Display emulator report
# ============================================================================
display_report() {
    log_info "Generating emulator system report..."

    STATUS=$(curl -s "$API_BASE_URL/emulator/status")

    echo ""
    echo "=================================="
    echo "  Fleet Emulator System Report"
    echo "=================================="
    echo ""
    echo "Status:           $(echo "$STATUS" | jq -r '.isRunning')"
    echo "Total Vehicles:   $(echo "$STATUS" | jq -r '.stats.totalVehicles')"
    echo "Active Vehicles:  $(echo "$STATUS" | jq -r '.stats.activeVehicles')"
    echo "Total Events:     $(echo "$STATUS" | jq -r '.stats.totalEvents')"
    echo "Events/Second:    $(echo "$STATUS" | jq -r '.stats.eventsPerSecond')"
    echo "Memory Usage:     $(echo "$STATUS" | jq -r '.stats.memoryUsage') MB"
    echo ""
    echo "🎯 Available Endpoints:"
    echo "  - Status:         $API_BASE_URL/emulator/status"
    echo "  - Fleet Overview: $API_BASE_URL/emulator/fleet/overview"
    echo "  - Vehicles:       $API_BASE_URL/emulator/vehicles"
    echo "  - Positions:      $API_BASE_URL/emulator/fleet/positions"
    echo ""

    log_success "Emulator deployment complete!"
}

# ============================================================================
# Main Execution
# ============================================================================
main() {
    echo ""
    log_info "Fleet Production Emulator Deployment"
    log_info "API URL: $API_BASE_URL"
    log_info "Vehicle Count: $VEHICLE_COUNT"
    echo ""

    # Step 1: Wait for API
    if ! wait_for_api; then
        log_error "Deployment failed: API not ready"
        exit 1
    fi

    # Step 2: Start emulators
    if ! start_emulators; then
        log_error "Deployment failed: Could not start emulators"
        exit 1
    fi

    # Step 3: Verify emulators
    if ! verify_emulators; then
        log_error "Deployment failed: Emulator verification failed"
        exit 1
    fi

    # Step 4: Display report
    display_report

    echo ""
    log_success "🎉 Fleet emulator deployment successful!"
    echo ""
}

# Run main function
main "$@"
