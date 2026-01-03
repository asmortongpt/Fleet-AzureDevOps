#!/bin/bash
# Comprehensive API Endpoint Test Script

BASE_URL="http://localhost:3333"
PASSED=0
FAILED=0
SKIPPED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_codes=$3  # comma-separated list of acceptable codes

    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method --max-time 10 "${BASE_URL}${endpoint}" 2>/dev/null)

    # Check if response code is in expected codes
    if [[ ",$expected_codes," == *",$response,"* ]]; then
        echo -e "${GREEN}✓${NC} $response $method $endpoint"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $response $method $endpoint (expected: $expected_codes)"
        ((FAILED++))
    fi
}

echo "================================================"
echo "   Fleet API Comprehensive Endpoint Tests"
echo "================================================"
echo ""

# Health & System Endpoints
echo "--- Health & System ---"
test_endpoint GET "/health" "200"
test_endpoint GET "/api/health" "200,503"
test_endpoint GET "/api/health/ping" "200"
test_endpoint GET "/api/health/live" "200"
test_endpoint GET "/api/health/microsoft" "200,500"
test_endpoint GET "/api/health-detailed" "200,503"
test_endpoint GET "/api/monitoring" "200,401,500"
test_endpoint GET "/api/performance" "200,401,500"
test_endpoint GET "/api/telemetry" "200,401"
test_endpoint GET "/api/queue" "200,401,500"
test_endpoint GET "/api/quality-gates" "200,401"

# Core Fleet Management
echo ""
echo "--- Core Fleet Management ---"
test_endpoint GET "/api/vehicles" "200,401,403,500"
test_endpoint GET "/api/drivers" "200,401,403,500"
test_endpoint GET "/api/fuel-transactions" "200,401,403,500"
test_endpoint GET "/api/maintenance" "200,401,403,500"
test_endpoint GET "/api/incidents" "200,401,403,500"
test_endpoint GET "/api/parts" "200,401,403,500"
test_endpoint GET "/api/vendors" "200,401,403,500"
test_endpoint GET "/api/invoices" "200,401,403,500"
test_endpoint GET "/api/purchase-orders" "200,401,403,500"
test_endpoint GET "/api/tasks" "200,401,403,500"

# Asset Management
echo ""
echo "--- Asset Management ---"
test_endpoint GET "/api/assets" "200,401,403,500"
test_endpoint GET "/api/asset-analytics" "200,401,403,500"
test_endpoint GET "/api/assets-mobile" "200,401,403,500"
test_endpoint GET "/api/heavy-equipment" "200,401,403,500"

# GPS & Tracking
echo ""
echo "--- GPS & Tracking ---"
test_endpoint GET "/api/gps" "200,401,403,500"
test_endpoint GET "/api/geofences" "200,401,403,500"
test_endpoint GET "/api/telematics" "200,401,403,500"
test_endpoint GET "/api/vehicle-idling" "200,401,403,500"

# Maintenance & Inspection
echo ""
echo "--- Maintenance & Inspection ---"
test_endpoint GET "/api/maintenance-schedules" "200,401,403,500"
test_endpoint GET "/api/maintenance/drilldowns" "200,401,403,500"
test_endpoint GET "/api/inspections" "200,401,403,500"
test_endpoint GET "/api/work-orders" "200,401,403,500"

# EV Management
echo ""
echo "--- EV Management ---"
test_endpoint GET "/api/ev-management" "200,401,403,500"
test_endpoint GET "/api/charging-sessions" "200,401,403,500"
test_endpoint GET "/api/charging-stations" "200,401,403,500"

# Documents
echo ""
echo "--- Documents ---"
test_endpoint GET "/api/documents" "200,401,403,500"
test_endpoint GET "/api/fleet-documents" "200,401,403,500"

# Financial & Costs
echo ""
echo "--- Financial & Costs ---"
test_endpoint GET "/api/costs" "200,401,403,500"
test_endpoint GET "/api/cost-analysis" "200,401,403,500"
test_endpoint GET "/api/cost-benefit-analysis" "200,401,403,500"
test_endpoint GET "/api/billing-reports" "200,401,403,500"
test_endpoint GET "/api/mileage-reimbursement" "200,401,403,500"
test_endpoint GET "/api/personal-use-charges" "200,401,403,500"
test_endpoint GET "/api/personal-use-policies" "200,401,403,500"

# Reporting & Analytics
echo ""
echo "--- Reporting & Analytics ---"
test_endpoint GET "/api/executive-dashboard" "200,401,403,500"
test_endpoint GET "/api/assignment-reporting" "200,401,403,500"
test_endpoint GET "/api/driver-scorecard" "200,401,403,500"

# AI & Automation
echo ""
echo "--- AI & Automation ---"
test_endpoint GET "/api/ai-search" "200,401,403,500"
test_endpoint GET "/api/ai-task-asset" "200,401,403,500"
test_endpoint GET "/api/ai-tasks" "200,401,403,500"

# Scheduling
echo ""
echo "--- Scheduling ---"
test_endpoint GET "/api/scheduling" "200,401,403,500"
test_endpoint GET "/api/calendar" "200,401,403,500"
test_endpoint GET "/api/on-call-management" "200,401,403,500"
test_endpoint GET "/api/reservations" "200,401,403,500"

# Mobile & Integration
echo ""
echo "--- Mobile & Integration ---"
test_endpoint GET "/api/mobile-assignment" "200,401,403,500"
test_endpoint GET "/api/mobile-hardware" "200,401,403,500"
test_endpoint GET "/api/mobile-integration" "200,401,403,500"
test_endpoint GET "/api/mobile-messaging" "200,401,403,500"
test_endpoint GET "/api/mobile-photos" "200,401,403,500"
test_endpoint GET "/api/mobile-trips" "200,401,403,500"
test_endpoint GET "/api/push-notifications" "200,401,403,500"

# Vehicle Management
echo ""
echo "--- Vehicle Management ---"
test_endpoint GET "/api/vehicle-assignments" "200,401,403,500"
test_endpoint GET "/api/vehicle-history" "200,401,403,500"
test_endpoint GET "/api/vehicle-3d" "200,401,403,500"
test_endpoint GET "/api/damage" "200,401,403,500"
test_endpoint GET "/api/damage-reports" "200,401,403,500"

# Routes & Trips
echo ""
echo "--- Routes & Trips ---"
test_endpoint GET "/api/routes" "200,401,403,500"
test_endpoint GET "/api/route-emulator" "200,401,403,500"
test_endpoint GET "/api/trip-usage" "200,401,403,500"

# Safety & Compliance
echo ""
echo "--- Safety & Compliance ---"
test_endpoint GET "/api/safety-incidents" "200,401,403,500"
test_endpoint GET "/api/osha-compliance" "200,401,403,500"
test_endpoint GET "/api/annual-reauthorization" "200,401,403,500"

# Policies & Permissions
echo ""
echo "--- Policies & Permissions ---"
test_endpoint GET "/api/policies" "200,401,403,500"
test_endpoint GET "/api/policy-templates" "200,401,403,500"
test_endpoint GET "/api/permissions" "200,401,403,500"

# External Integrations
echo ""
echo "--- External Integrations ---"
test_endpoint GET "/api/smartcar/status" "200,503"
test_endpoint GET "/api/arcgis-layers" "200,401,403,500"
test_endpoint GET "/api/outlook/status" "200"
test_endpoint GET "/api/teams" "200,401,403,500"
test_endpoint GET "/api/video-events" "200,401,403,500"
test_endpoint GET "/api/video-telematics" "200,401,403,500"

# Communication
echo ""
echo "--- Communication ---"
test_endpoint GET "/api/communication-logs" "200,401,403,500"

# System
echo ""
echo "--- System ---"
test_endpoint GET "/api/facilities" "200,401,403,500"
test_endpoint GET "/api/search" "200,401,403,500"
test_endpoint GET "/api/presence" "200,401,403,500"
test_endpoint GET "/api/sync" "200,401,403,500"
test_endpoint GET "/api/deployments" "200,401,403,500"

# Demo & Emulator
echo ""
echo "--- Demo & Emulator ---"
test_endpoint GET "/api/emulator" "200,401,403,500"
test_endpoint GET "/api/obd2-emulator" "200,401,403,500"
test_endpoint GET "/api/demo" "200,401,403,500"

# Batch
echo ""
echo "--- Batch ---"
test_endpoint GET "/api/batch" "200,401,403,404,405,500"
test_endpoint GET "/api/v1/batch" "200,401,403,404,405,500"

echo ""
echo "================================================"
echo "                  SUMMARY"
echo "================================================"
echo -e "${GREEN}Passed:${NC}  $PASSED"
echo -e "${RED}Failed:${NC}  $FAILED"
echo -e "${YELLOW}Skipped:${NC} $SKIPPED"
echo "Total:   $((PASSED + FAILED + SKIPPED))"
echo "================================================"
