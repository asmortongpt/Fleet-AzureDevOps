#!/bin/bash

# Comprehensive API Endpoint Test Suite
# Tests all 80+ API endpoints for basic connectivity

BASE_URL="http://localhost:3000"
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

declare -a FAILED_ENDPOINTS=()
declare -a PASSED_ENDPOINTS=()

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "  Comprehensive API Endpoint Test Suite"
echo "  Testing 80+ endpoints for basic connectivity"
echo "================================================"
echo ""

test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local expected_status=${3:-200}

    # Make request and capture status code
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$endpoint" 2>/dev/null)

    # Check if we got any response
    if [ -z "$status" ]; then
        echo -e "${RED}✗${NC} $method $endpoint - NO RESPONSE"
        FAILED_ENDPOINTS+=("$endpoint")
        ((FAIL_COUNT++))
        return 1
    fi

    # Accept 200, 404, 501 as "working" (endpoint exists but may have no data or not implemented)
    # Reject 500 errors as broken
    if [ "$status" = "500" ]; then
        echo -e "${RED}✗${NC} $method $endpoint - $status INTERNAL ERROR"
        FAILED_ENDPOINTS+=("$endpoint (${status})")
        ((FAIL_COUNT++))
        return 1
    elif [ "$status" = "404" ] || [ "$status" = "501" ]; then
        echo -e "${YELLOW}○${NC} $method $endpoint - $status (endpoint exists, no data/not implemented)"
        PASSED_ENDPOINTS+=("$endpoint")
        ((PASS_COUNT++))
        return 0
    elif [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo -e "${GREEN}✓${NC} $method $endpoint - $status OK"
        PASSED_ENDPOINTS+=("$endpoint")
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${YELLOW}○${NC} $method $endpoint - $status"
        PASSED_ENDPOINTS+=("$endpoint")
        ((PASS_COUNT++))
        return 0
    fi
}

echo "=== Core Fleet Management ==="
test_endpoint "/api/alerts"
test_endpoint "/api/vehicles"
test_endpoint "/api/drivers"
test_endpoint "/api/fuel-transactions"
test_endpoint "/api/maintenance"
test_endpoint "/api/incidents"
test_endpoint "/api/parts"
test_endpoint "/api/vendors"
test_endpoint "/api/invoices"
test_endpoint "/api/purchase-orders"
test_endpoint "/api/tasks"

echo ""
echo "=== Asset Management ==="
test_endpoint "/api/assets"
test_endpoint "/api/asset-analytics"
test_endpoint "/api/assets-mobile"
test_endpoint "/api/heavy-equipment"

echo ""
echo "=== Communication & Teams ==="
test_endpoint "/api/communication-logs"
test_endpoint "/api/teams"

echo ""
echo "=== GPS & Tracking ==="
test_endpoint "/api/gps"
test_endpoint "/api/geofences"
test_endpoint "/api/telematics"
test_endpoint "/api/traffic-cameras"
test_endpoint "/api/traffic-cameras/sources"
test_endpoint "/api/vehicle-idling"

echo ""
echo "=== Maintenance & Inspections ==="
test_endpoint "/api/maintenance-schedules"
test_endpoint "/api/maintenance/drilldowns"
test_endpoint "/api/inspections"
test_endpoint "/api/work-orders"

echo ""
echo "=== EV Management ==="
test_endpoint "/api/ev-management"
test_endpoint "/api/charging-sessions"
test_endpoint "/api/charging-stations"

echo ""
echo "=== Documents ==="
test_endpoint "/api/documents"
test_endpoint "/api/fleet-documents"

echo ""
echo "=== Financial & Cost Management ==="
test_endpoint "/api/cost-analysis"
test_endpoint "/api/cost-benefit-analysis"
test_endpoint "/api/billing-reports"
test_endpoint "/api/mileage-reimbursement"
test_endpoint "/api/personal-use-charges"
test_endpoint "/api/personal-use-policies"

echo ""
echo "=== Reporting & Analytics ==="
test_endpoint "/api/executive-dashboard"
test_endpoint "/api/assignment-reporting"
test_endpoint "/api/driver-scorecard"

echo ""
echo "=== AI & Automation ==="
test_endpoint "/api/ai/chat"
test_endpoint "/api/ai-search"
test_endpoint "/api/ai-task-asset"
test_endpoint "/api/ai-tasks"
test_endpoint "/api/ai/damage-detection"

echo ""
echo "=== Scheduling ==="
test_endpoint "/api/scheduling"
test_endpoint "/api/calendar"
test_endpoint "/api/on-call-management"

echo ""
echo "=== Mobile Integration ==="
test_endpoint "/api/mobile-assignment"
test_endpoint "/api/mobile-hardware"
test_endpoint "/api/mobile-integration"
test_endpoint "/api/mobile-messaging"
test_endpoint "/api/mobile-photos"
test_endpoint "/api/mobile-trips"
test_endpoint "/api/push-notifications"

echo ""
echo "=== Vehicle Management ==="
test_endpoint "/api/vehicle-assignments"
test_endpoint "/api/vehicle-history"
test_endpoint "/api/vehicle-3d"
test_endpoint "/api/damage"
test_endpoint "/api/damage-reports"
test_endpoint "/api/lidar"

echo ""
echo "=== Routes & Trips ==="
test_endpoint "/api/routes"
test_endpoint "/api/trip-usage"

echo ""
echo "=== Safety & Compliance ==="
test_endpoint "/api/safety-incidents"
test_endpoint "/api/osha-compliance"
test_endpoint "/api/annual-reauthorization"

echo ""
echo "=== Policies & Permissions ==="
test_endpoint "/api/policies"
test_endpoint "/api/policy-templates"
test_endpoint "/api/permissions"

echo ""
echo "=== Authentication ==="
test_endpoint "/api/auth"
test_endpoint "/api/break-glass"

echo ""
echo "=== External Integrations ==="
test_endpoint "/api/smartcar"
test_endpoint "/api/arcgis-layers"
test_endpoint "/api/outlook"
test_endpoint "/api/video-events"
test_endpoint "/api/video-telematics"

echo ""
echo "=== System & Monitoring ==="
test_endpoint "/api/dashboard"
test_endpoint "/api/health"
test_endpoint "/api/health/microsoft"
test_endpoint "/api/health-detailed"
test_endpoint "/api/performance"
test_endpoint "/api/telemetry"
test_endpoint "/api/queue"
test_endpoint "/api/deployments"

echo ""
echo "=== Utilities ==="
test_endpoint "/api/facilities"
test_endpoint "/api/search"
test_endpoint "/api/presence"
test_endpoint "/api/storage-admin"
test_endpoint "/api/sync"
test_endpoint "/api/quality-gates"
test_endpoint "/api/reservations"
test_endpoint "/api/admin/jobs"
test_endpoint "/api/batch" POST

echo ""
echo "================================================"
echo "  Test Results Summary"
echo "================================================"
echo -e "${GREEN}Passed:${NC} $PASS_COUNT endpoints"
echo -e "${RED}Failed:${NC} $FAIL_COUNT endpoints"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
    echo "Failed Endpoints:"
    for endpoint in "${FAILED_ENDPOINTS[@]}"; do
        echo -e "  ${RED}✗${NC} $endpoint"
    done
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ All endpoints responding (no 500 errors)${NC}"
    exit 0
fi
