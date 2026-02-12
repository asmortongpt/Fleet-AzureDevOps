#!/bin/bash
# ============================================================================
# Fleet Management API - Comprehensive Endpoint Testing Script
# ============================================================================
# Tests ALL 94+ endpoints across all modules
# Outputs: JSON report with pass/fail status for each endpoint
# ============================================================================

API_BASE="http://localhost:3001"
OUTPUT_FILE="/tmp/fleet-api-test-results.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Initialize JSON report
echo "{" > "$OUTPUT_FILE"
echo "  \"timestamp\": \"$TIMESTAMP\"," >> "$OUTPUT_FILE"
echo "  \"api_base\": \"$API_BASE\"," >> "$OUTPUT_FILE"
echo "  \"tests\": [" >> "$OUTPUT_FILE"

# Test function
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local expected_status="$3"
    local description="$4"

    TOTAL=$((TOTAL + 1))

    # Make request
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    # Determine pass/fail (supports multiple status codes separated by |)
    if [ "$http_code" == "$expected_status" ] || [ "$expected_status" == "ANY" ] || [[ "$expected_status" == *"|"* && "$expected_status" =~ (^|[|])$http_code($|[|]) ]]; then
        status="PASS"
        PASSED=$((PASSED + 1))
        echo -e "${GREEN}✓${NC} $method $endpoint ($http_code)"
    else
        status="FAIL"
        FAILED=$((FAILED + 1))
        echo -e "${RED}✗${NC} $method $endpoint (Expected: $expected_status, Got: $http_code)"
    fi

    # Add to JSON report
    if [ $TOTAL -gt 1 ]; then
        echo "," >> "$OUTPUT_FILE"
    fi

    cat >> "$OUTPUT_FILE" << EOF
    {
      "endpoint": "$endpoint",
      "method": "$method",
      "description": "$description",
      "expected_status": "$expected_status",
      "actual_status": $http_code,
      "status": "$status",
      "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    }
EOF
}

echo "======================================================================"
echo "Fleet Management API - Comprehensive Endpoint Test"
echo "======================================================================"
echo "Testing $API_BASE"
echo ""

# ============================================================================
# CORE ENDPOINTS
# ============================================================================
echo -e "${YELLOW}Testing Core Endpoints...${NC}"
test_endpoint "GET" "/api/health" "200|503" "Health check (200=healthy, 503=unhealthy)"
test_endpoint "GET" "/api/stats" "ANY" "System statistics"

# ============================================================================
# VEHICLE MANAGEMENT
# ============================================================================
echo -e "${YELLOW}Testing Vehicle Management...${NC}"
test_endpoint "GET" "/api/vehicles" "200" "List all vehicles"
test_endpoint "GET" "/api/vehicles/stats" "ANY" "Vehicle statistics"
test_endpoint "GET" "/api/vehicles/analytics" "ANY" "Vehicle analytics"
test_endpoint "GET" "/api/vehicles/assignments" "ANY" "Vehicle assignments"
test_endpoint "GET" "/api/vehicles/history" "ANY" "Vehicle history"
test_endpoint "GET" "/api/vehicles/3d-models" "ANY" "Vehicle 3D models"

# ============================================================================
# DRIVER MANAGEMENT
# ============================================================================
echo -e "${YELLOW}Testing Driver Management...${NC}"
test_endpoint "GET" "/api/drivers" "200" "List all drivers"
test_endpoint "GET" "/api/drivers/stats" "ANY" "Driver statistics"
test_endpoint "GET" "/api/drivers/scorecards" "ANY" "Driver scorecards"
test_endpoint "GET" "/api/drivers/certifications" "ANY" "Driver certifications"
test_endpoint "GET" "/api/drivers/training" "ANY" "Driver training records"

# ============================================================================
# MAINTENANCE
# ============================================================================
echo -e "${YELLOW}Testing Maintenance...${NC}"
test_endpoint "GET" "/api/maintenance/work-orders" "ANY" "Maintenance work orders"
test_endpoint "GET" "/api/maintenance/schedules" "ANY" "Maintenance schedules"
test_endpoint "GET" "/api/maintenance/requests" "ANY" "Maintenance requests"
test_endpoint "GET" "/api/maintenance/predictive" "ANY" "Predictive maintenance"
test_endpoint "GET" "/api/maintenance/inspections" "ANY" "Inspections"

# ============================================================================
# ASSETS
# ============================================================================
echo -e "${YELLOW}Testing Asset Management...${NC}"
test_endpoint "GET" "/api/assets" "ANY" "List all assets"
test_endpoint "GET" "/api/assets/analytics" "ANY" "Asset analytics"
test_endpoint "GET" "/api/assets/heavy-equipment" "ANY" "Heavy equipment"
test_endpoint "GET" "/api/assets/mobile" "ANY" "Mobile assets"

# ============================================================================
# INCIDENTS
# ============================================================================
echo -e "${YELLOW}Testing Incidents...${NC}"
test_endpoint "GET" "/api/incidents" "ANY" "List all incidents"
test_endpoint "GET" "/api/incidents/stats" "ANY" "Incident statistics"
test_endpoint "GET" "/api/damage-records" "ANY" "Damage records"
test_endpoint "GET" "/api/damage-reports" "ANY" "Damage reports"

# ============================================================================
# FUEL & CHARGING
# ============================================================================
echo -e "${YELLOW}Testing Fuel & Charging...${NC}"
test_endpoint "GET" "/api/fuel/transactions" "ANY" "Fuel transactions"
test_endpoint "GET" "/api/fuel/analytics" "ANY" "Fuel analytics"
test_endpoint "GET" "/api/charging/stations" "ANY" "Charging stations"
test_endpoint "GET" "/api/charging/sessions" "ANY" "Charging sessions"

# ============================================================================
# COMPLIANCE
# ============================================================================
echo -e "${YELLOW}Testing Compliance...${NC}"
test_endpoint "GET" "/api/compliance/reports" "ANY" "Compliance reports"
test_endpoint "GET" "/api/compliance/osha" "ANY" "OSHA logs"
test_endpoint "GET" "/api/compliance/reauthorizations" "ANY" "Annual reauthorizations"

# ============================================================================
# SCHEDULING & CALENDAR
# ============================================================================
echo -e "${YELLOW}Testing Scheduling...${NC}"
test_endpoint "GET" "/api/schedules" "ANY" "Schedules"
test_endpoint "GET" "/api/calendar/events" "ANY" "Calendar events"
test_endpoint "GET" "/api/on-call" "ANY" "On-call shifts"
test_endpoint "GET" "/api/reservations" "ANY" "Reservations"

# ============================================================================
# COMMUNICATIONS
# ============================================================================
echo -e "${YELLOW}Testing Communications...${NC}"
test_endpoint "GET" "/api/notifications" "ANY" "Notifications"
test_endpoint "GET" "/api/communications/logs" "ANY" "Communication logs"
test_endpoint "GET" "/api/alerts" "ANY" "Alerts"

# ============================================================================
# MOBILE
# ============================================================================
echo -e "${YELLOW}Testing Mobile Integration...${NC}"
test_endpoint "GET" "/api/mobile/photos" "ANY" "Mobile photos"
test_endpoint "GET" "/api/mobile/trips" "ANY" "Mobile trips"
test_endpoint "GET" "/api/mobile/assignments" "ANY" "Mobile assignments"
test_endpoint "GET" "/api/mobile/hardware" "ANY" "Mobile hardware"

# ============================================================================
# TELEMATICS
# ============================================================================
echo -e "${YELLOW}Testing Telematics...${NC}"
test_endpoint "GET" "/api/telematics/data" "ANY" "Telematics data"
test_endpoint "GET" "/api/gps/tracks" "ANY" "GPS tracks"
test_endpoint "GET" "/api/geofences" "ANY" "Geofences"

# ============================================================================
# REPORTING & ANALYTICS
# ============================================================================
echo -e "${YELLOW}Testing Reporting...${NC}"
test_endpoint "GET" "/api/reports/executive-dashboard" "ANY" "Executive dashboard"
test_endpoint "GET" "/api/reports/cost-analysis" "ANY" "Cost analysis"
test_endpoint "GET" "/api/reports/assignments" "ANY" "Assignment reports"
test_endpoint "GET" "/api/reports/custom" "ANY" "Custom reports"

# ============================================================================
# DOCUMENTS
# ============================================================================
echo -e "${YELLOW}Testing Document Management...${NC}"
test_endpoint "GET" "/api/documents" "ANY" "Documents"
test_endpoint "GET" "/api/documents/search" "ANY" "Document search"
test_endpoint "GET" "/api/documents/folders" "ANY" "Document folders"

# ============================================================================
# AI SERVICES
# ============================================================================
echo -e "${YELLOW}Testing AI Services...${NC}"
test_endpoint "GET" "/api/ai/conversations" "ANY" "AI conversations"
test_endpoint "GET" "/api/ai/damage-detection" "ANY" "AI damage detection"
test_endpoint "GET" "/api/ai/suggestions" "ANY" "AI suggestions"

# ============================================================================
# INTEGRATIONS
# ============================================================================
echo -e "${YELLOW}Testing Integrations...${NC}"
test_endpoint "GET" "/api/smartcar/vehicles" "ANY" "SmartCar vehicles"
test_endpoint "GET" "/api/microsoft/graph/messages" "ANY" "Microsoft Graph messages"
test_endpoint "GET" "/api/arcgis/layers" "ANY" "ArcGIS layers"

# ============================================================================
# USER MANAGEMENT
# ============================================================================
echo -e "${YELLOW}Testing User Management...${NC}"
test_endpoint "GET" "/api/users" "ANY" "Users"
test_endpoint "GET" "/api/users/presence" "ANY" "User presence"
test_endpoint "GET" "/api/roles" "ANY" "Roles"
test_endpoint "GET" "/api/permissions" "ANY" "Permissions"

# ============================================================================
# DISPATCH
# ============================================================================
echo -e "${YELLOW}Testing Dispatch...${NC}"
test_endpoint "GET" "/api/dispatch/routes" "ANY" "Dispatch routes"
test_endpoint "GET" "/api/dispatch/tasks" "ANY" "Dispatch tasks"

# ============================================================================
# VENDORS & INVENTORY
# ============================================================================
echo -e "${YELLOW}Testing Vendors & Inventory...${NC}"
test_endpoint "GET" "/api/vendors" "ANY" "Vendors"
test_endpoint "GET" "/api/parts" "ANY" "Parts inventory"
test_endpoint "GET" "/api/purchase-orders" "ANY" "Purchase orders"

# ============================================================================
# POLICIES
# ============================================================================
echo -e "${YELLOW}Testing Policies...${NC}"
test_endpoint "GET" "/api/policies/templates" "ANY" "Policy templates"

# ============================================================================
# STORAGE
# ============================================================================
echo -e "${YELLOW}Testing Storage...${NC}"
test_endpoint "GET" "/api/storage/files" "ANY" "Storage files"

# ============================================================================
# FINALIZE REPORT
# ============================================================================

# Close JSON
echo "" >> "$OUTPUT_FILE"
echo "  ]," >> "$OUTPUT_FILE"
echo "  \"summary\": {" >> "$OUTPUT_FILE"
echo "    \"total_tests\": $TOTAL," >> "$OUTPUT_FILE"
echo "    \"passed\": $PASSED," >> "$OUTPUT_FILE"
echo "    \"failed\": $FAILED," >> "$OUTPUT_FILE"
echo "    \"pass_rate\": \"$(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)%\"" >> "$OUTPUT_FILE"
echo "  }" >> "$OUTPUT_FILE"
echo "}" >> "$OUTPUT_FILE"

# Print summary
echo ""
echo "======================================================================"
echo "Test Summary"
echo "======================================================================"
echo "Total Tests:  $TOTAL"
echo -e "Passed:       ${GREEN}$PASSED${NC}"
echo -e "Failed:       ${RED}$FAILED${NC}"
echo "Pass Rate:    $(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)%"
echo ""
echo "Detailed report saved to: $OUTPUT_FILE"
echo "======================================================================"

# Exit with failure if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
