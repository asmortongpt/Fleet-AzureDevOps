#!/bin/bash
# ============================================================================
# Fleet Emulator API Test Suite
# Comprehensive testing of all emulator endpoints
# ============================================================================

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net/api}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Logging functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Run a test
run_test() {
    local test_name="$1"
    local endpoint="$2"
    local expected_status="${3:-200}"
    local method="${4:-GET}"
    local data="${5:-}"

    ((TESTS_RUN++))
    log_test "$test_name"

    local response
    local http_status

    if [ "$method" = "POST" ]; then
        response=$(curl -X POST "$API_BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\nHTTP_STATUS:%{http_code}" \
            -s 2>&1)
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_BASE_URL$endpoint" 2>&1)
    fi

    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | grep -v "HTTP_STATUS:")

    if [ "$http_status" = "$expected_status" ]; then
        log_pass "$test_name (HTTP $http_status)"
        echo "$body" | jq '.' 2>/dev/null | head -5 || echo "$body" | head -5
    else
        log_fail "$test_name (Expected HTTP $expected_status, got $http_status)"
        echo "$body" | head -5
    fi

    echo ""
}

# Main test suite
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║           Fleet Emulator API Test Suite                       ║"
    echo "╠════════════════════════════════════════════════════════════════╣"
    echo "║ API: $API_BASE_URL"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    # ========================================================================
    # System Health Tests
    # ========================================================================
    log_info "Running System Health Tests..."
    echo ""

    run_test "API Health Check" "/health"
    run_test "Emulator Status" "/emulator/status"

    # ========================================================================
    # Vehicle Data Tests
    # ========================================================================
    log_info "Running Vehicle Data Tests..."
    echo ""

    run_test "List All Vehicles" "/emulator/vehicles"
    run_test "Get Routes" "/emulator/routes"
    run_test "Get Geofences" "/emulator/geofences"
    run_test "Get Scenarios" "/emulator/scenarios"

    # ========================================================================
    # Fleet Overview Tests
    # ========================================================================
    log_info "Running Fleet Overview Tests..."
    echo ""

    run_test "Fleet Overview" "/emulator/fleet/overview"
    run_test "Fleet Positions" "/emulator/fleet/positions"

    # ========================================================================
    # Individual Vehicle Tests
    # ========================================================================
    log_info "Running Individual Vehicle Tests..."
    echo ""

    # Get first vehicle ID
    VEHICLE_ID=$(curl -s "$API_BASE_URL/emulator/vehicles" | jq -r '.[0].id' 2>/dev/null)

    if [ -n "$VEHICLE_ID" ] && [ "$VEHICLE_ID" != "null" ]; then
        run_test "Get Vehicle Details" "/emulator/vehicles/$VEHICLE_ID"
        run_test "Get Vehicle Telemetry" "/emulator/vehicles/$VEHICLE_ID/telemetry"
        run_test "Get GPS History" "/emulator/vehicles/$VEHICLE_ID/telemetry/history?type=gps&limit=5"
        run_test "Get OBD2 History" "/emulator/vehicles/$VEHICLE_ID/telemetry/history?type=obd2&limit=5"
    else
        log_fail "No vehicles found - skipping individual vehicle tests"
        echo ""
    fi

    # ========================================================================
    # Video Emulator Tests
    # ========================================================================
    log_info "Running Video Emulator Tests..."
    echo ""

    run_test "Video Library" "/emulator/video/library"
    run_test "Active Streams" "/emulator/video/streams"

    # ========================================================================
    # Radio Emulator Tests
    # ========================================================================
    log_info "Running Radio Emulator Tests..."
    echo ""

    run_test "Radio Channels" "/emulator/channels"

    # ========================================================================
    # Inventory Emulator Tests
    # ========================================================================
    log_info "Running Inventory Tests..."
    echo ""

    run_test "Get Inventory" "/emulator/inventory"

    # ========================================================================
    # Control Tests (Optional - uncomment to test)
    # ========================================================================
    # log_info "Running Control Tests..."
    # echo ""

    # Uncomment these to test control endpoints (will affect running emulators)
    # run_test "Start Emulators" "/emulator/start" "200" "POST" '{"count": 5}'
    # run_test "Pause Emulators" "/emulator/pause" "200" "POST"
    # run_test "Resume Emulators" "/emulator/resume" "200" "POST"
    # run_test "Stop Emulators" "/emulator/stop" "200" "POST"

    # ========================================================================
    # Test Summary
    # ========================================================================
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                     Test Summary                               ║"
    echo "╠════════════════════════════════════════════════════════════════╣"
    echo "║ Total Tests:   $TESTS_RUN"
    echo "║ Passed:        ${GREEN}$TESTS_PASSED${NC}"
    echo "║ Failed:        ${RED}$TESTS_FAILED${NC}"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        exit 1
    fi
}

# Show help
show_help() {
    cat << EOF
Fleet Emulator API Test Suite

Usage: $0 [OPTIONS]

Options:
  -u, --url URL   API base URL (default: $API_BASE_URL)
  -h, --help      Show this help message

Environment Variables:
  API_BASE_URL    API base URL

Examples:
  # Test default API
  $0

  # Test custom API
  $0 -u https://custom-api.com/api

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            API_BASE_URL="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed${NC}"
    exit 1
fi

# Run tests
main
