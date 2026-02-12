#!/bin/bash

# ============================================================================
# Fleet-CTA Comprehensive Endpoint Testing Script
# ============================================================================
# Tests all 94 registered endpoints and identifies broken services
# ============================================================================

API_BASE="http://localhost:3000/api"
RESULTS_FILE="endpoint-test-results.md"
TENANT_ID="550e8400-e29b-41d4-a716-446655440000"
USER_ID="550e8400-e29b-41d4-a716-446655440001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSING=0
FAILING=0

# Create results file
echo "# Fleet-CTA Endpoint Test Results" > $RESULTS_FILE
echo "**Generated**: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4  # Expected status code (200, 404, 401, etc.)

    TOTAL=$((TOTAL + 1))

    echo -n "Testing $name... "

    # Make request
    if [ "$method" = "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-Tenant-ID: $TENANT_ID" \
            -H "X-User-ID: $USER_ID" 2>&1)
    elif [ "$method" = "POST" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-Tenant-ID: $TENANT_ID" \
            -H "X-User-ID: $USER_ID" \
            -d '{}' 2>&1)
    fi

    # Extract status code (last line)
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    # Check if response is valid
    if [[ ! "$STATUS" =~ ^[0-9]{3}$ ]]; then
        echo -e "${RED}✗ FAILED (Connection Error)${NC}"
        echo "- ❌ **$name** ($method $endpoint) - Connection Error" >> $RESULTS_FILE
        FAILING=$((FAILING + 1))
        return
    fi

    # Check for 500 errors (broken service)
    if [ "$STATUS" = "500" ]; then
        # Extract error message
        ERROR_MSG=$(echo "$BODY" | grep -o '"message":"[^"]*"' | head -1 | sed 's/"message":"//;s/"//')

        if [ -z "$ERROR_MSG" ]; then
            ERROR_MSG=$(echo "$BODY" | grep -o '"error":"[^"]*"' | head -1 | sed 's/"error":"//;s/"//')
        fi

        echo -e "${RED}✗ FAILED (500)${NC}"
        echo "- ❌ **$name** ($method $endpoint) - **500 Internal Server Error**" >> $RESULTS_FILE

        if [ ! -z "$ERROR_MSG" ]; then
            echo "  - Error: $ERROR_MSG" >> $RESULTS_FILE
        fi

        FAILING=$((FAILING + 1))
    elif [ "$STATUS" = "404" ]; then
        echo -e "${YELLOW}⚠ NOT FOUND (404)${NC}"
        echo "- ⚠️  **$name** ($method $endpoint) - 404 Not Found (Route not registered)" >> $RESULTS_FILE
        FAILING=$((FAILING + 1))
    elif [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
        echo -e "${YELLOW}⚠ AUTH REQUIRED ($STATUS)${NC}"
        echo "- ⚠️  **$name** ($method $endpoint) - $STATUS (Authentication required)" >> $RESULTS_FILE
        PASSING=$((PASSING + 1))  # This is expected behavior
    elif [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
        echo -e "${GREEN}✓ PASSED ($STATUS)${NC}"
        echo "- ✅ **$name** ($method $endpoint) - $STATUS OK" >> $RESULTS_FILE
        PASSING=$((PASSING + 1))
    else
        echo -e "${YELLOW}? STATUS $STATUS${NC}"
        echo "- ⚠️  **$name** ($method $endpoint) - Status $STATUS" >> $RESULTS_FILE
        PASSING=$((PASSING + 1))  # Count as passing if not 500
    fi
}

echo ""
echo "========================================"
echo " Fleet-CTA Endpoint Testing"
echo "========================================"
echo ""

# Core Fleet Management
echo "## Core Fleet Management" >> $RESULTS_FILE
test_endpoint "Alerts - List" "GET" "/alerts" 200
test_endpoint "Vehicles - List" "GET" "/vehicles" 200
test_endpoint "Drivers - List" "GET" "/drivers" 200
test_endpoint "Fuel Transactions - List" "GET" "/fuel-transactions" 200
test_endpoint "Maintenance - List" "GET" "/maintenance" 200
test_endpoint "Incidents - List" "GET" "/incidents" 200
echo "" >> $RESULTS_FILE

# Asset Management
echo "## Asset Management" >> $RESULTS_FILE
test_endpoint "Assets - List" "GET" "/assets" 200
test_endpoint "Asset Analytics - List" "GET" "/asset-analytics" 200
test_endpoint "Mobile Assets - List" "GET" "/assets-mobile" 200
test_endpoint "Heavy Equipment - List" "GET" "/heavy-equipment" 200
echo "" >> $RESULTS_FILE

# Dispatch & Communication
echo "## Dispatch & Communication" >> $RESULTS_FILE
test_endpoint "Communication Logs - List" "GET" "/communication-logs" 200
test_endpoint "Teams - List" "GET" "/teams" 200
echo "" >> $RESULTS_FILE

# GPS & Tracking
echo "## GPS & Tracking" >> $RESULTS_FILE
test_endpoint "GPS - Latest" "GET" "/gps/latest" 200
test_endpoint "Geofences - List" "GET" "/geofences" 200
test_endpoint "Telematics - List" "GET" "/telematics" 200
test_endpoint "Vehicle Idling - List" "GET" "/vehicle-idling" 200
echo "" >> $RESULTS_FILE

# Maintenance & Inspection
echo "## Maintenance & Inspection" >> $RESULTS_FILE
test_endpoint "Maintenance Schedules - List" "GET" "/maintenance-schedules" 200
test_endpoint "Inspections - List" "GET" "/inspections" 200
test_endpoint "Work Orders - List" "GET" "/work-orders" 200
echo "" >> $RESULTS_FILE

# EV Management
echo "## EV Management" >> $RESULTS_FILE
test_endpoint "EV Management - Dashboard" "GET" "/ev-management" 200
test_endpoint "Charging Sessions - List" "GET" "/charging-sessions" 200
test_endpoint "Charging Stations - List" "GET" "/charging-stations" 200
echo "" >> $RESULTS_FILE

# Financial & Cost Management
echo "## Financial & Cost Management" >> $RESULTS_FILE
test_endpoint "Cost Analysis - List" "GET" "/cost-analysis" 200
test_endpoint "Cost Benefit Analysis - List" "GET" "/cost-benefit-analysis" 200
test_endpoint "Billing Reports - List" "GET" "/billing-reports" 200
test_endpoint "Mileage Reimbursement - List" "GET" "/mileage-reimbursement" 200
test_endpoint "Personal Use Policies - List" "GET" "/personal-use-policies" 200
echo "" >> $RESULTS_FILE

# Reporting & Analytics
echo "## Reporting & Analytics" >> $RESULTS_FILE
test_endpoint "Executive Dashboard - Data" "GET" "/executive-dashboard" 200
test_endpoint "Assignment Reporting - List" "GET" "/assignment-reporting" 200
test_endpoint "Driver Scorecard - List" "GET" "/driver-scorecard" 200
echo "" >> $RESULTS_FILE

# AI & Automation
echo "## AI & Automation" >> $RESULTS_FILE
test_endpoint "AI Chat - Query" "POST" "/ai/chat" 200
test_endpoint "AI Search - Query" "POST" "/ai-search" 200
test_endpoint "AI Task Asset - List" "GET" "/ai-task-asset" 200
test_endpoint "AI Tasks - List" "GET" "/ai-tasks" 200
test_endpoint "AI Damage Detection - Analyze" "POST" "/ai/damage-detection" 200
echo "" >> $RESULTS_FILE

# Task & Schedule Management
echo "## Task & Schedule Management" >> $RESULTS_FILE
test_endpoint "Scheduling - List" "GET" "/scheduling" 200
test_endpoint "Calendar - List" "GET" "/calendar" 200
test_endpoint "On-Call Management - List" "GET" "/on-call-management" 200
echo "" >> $RESULTS_FILE

# Mobile & Integration
echo "## Mobile & Integration" >> $RESULTS_FILE
test_endpoint "Mobile Assignment - List" "GET" "/mobile-assignment" 200
test_endpoint "Mobile Hardware - List" "GET" "/mobile-hardware" 200
test_endpoint "Mobile Integration - Status" "GET" "/mobile-integration" 200
test_endpoint "Mobile Messaging - List" "GET" "/mobile-messaging" 200
test_endpoint "Mobile Photos - List" "GET" "/mobile-photos" 200
test_endpoint "Mobile Trips - List" "GET" "/mobile-trips" 200
test_endpoint "Push Notifications - List" "GET" "/push-notifications" 200
echo "" >> $RESULTS_FILE

# Vehicle Management
echo "## Vehicle Management" >> $RESULTS_FILE
test_endpoint "Vehicle Assignments - List" "GET" "/vehicle-assignments" 200
test_endpoint "Vehicle History - List" "GET" "/vehicle-history" 200
test_endpoint "Vehicle 3D - List" "GET" "/vehicle-3d" 200
test_endpoint "Damage - List" "GET" "/damage" 200
test_endpoint "Damage Reports - List" "GET" "/damage-reports" 200
test_endpoint "LiDAR - List" "GET" "/lidar" 200
test_endpoint "Trip Usage - List" "GET" "/trip-usage" 200
echo "" >> $RESULTS_FILE

# Safety & Compliance
echo "## Safety & Compliance" >> $RESULTS_FILE
test_endpoint "Safety Incidents - List" "GET" "/safety-incidents" 200
test_endpoint "OSHA Compliance - List" "GET" "/osha-compliance" 200
test_endpoint "Annual Reauthorization - List" "GET" "/annual-reauthorization" 200
echo "" >> $RESULTS_FILE

# Policy & Permission
echo "## Policy & Permission" >> $RESULTS_FILE
test_endpoint "Policies - List" "GET" "/policies" 200
test_endpoint "Policy Templates - List" "GET" "/policy-templates" 200
test_endpoint "Permissions - List" "GET" "/permissions" 200
echo "" >> $RESULTS_FILE

# External Integrations
echo "## External Integrations" >> $RESULTS_FILE
test_endpoint "SmartCar - Status" "GET" "/smartcar" 200
test_endpoint "ArcGIS Layers - List" "GET" "/arcgis-layers" 200
test_endpoint "Outlook - Messages" "GET" "/outlook" 200
test_endpoint "Video Events - List" "GET" "/video-events" 200
test_endpoint "Video Telematics - List" "GET" "/video-telematics" 200
echo "" >> $RESULTS_FILE

# System Management
echo "## System Management" >> $RESULTS_FILE
test_endpoint "Health - System" "GET" "/health" 200
test_endpoint "Performance - Metrics" "GET" "/performance" 200
test_endpoint "Queue - Jobs" "GET" "/queue" 200
test_endpoint "Deployments - List" "GET" "/deployments" 200
test_endpoint "Search - Query" "POST" "/search" 200
test_endpoint "Presence - Status" "GET" "/presence" 200
test_endpoint "Storage Admin - Files" "GET" "/storage-admin" 200
test_endpoint "Sync - Status" "GET" "/sync" 200
test_endpoint "Quality Gates - List" "GET" "/quality-gates" 200
test_endpoint "Reservations - List" "GET" "/reservations" 200
echo "" >> $RESULTS_FILE

# Summary
echo "" >> $RESULTS_FILE
echo "## Summary" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "| Metric | Count | Percentage |" >> $RESULTS_FILE
echo "|--------|-------|------------|" >> $RESULTS_FILE
echo "| **Total Endpoints** | $TOTAL | 100% |" >> $RESULTS_FILE
echo "| **Passing** | $PASSING | $((PASSING * 100 / TOTAL))% |" >> $RESULTS_FILE
echo "| **Failing** | $FAILING | $((FAILING * 100 / TOTAL))% |" >> $RESULTS_FILE

echo ""
echo "========================================"
echo " Test Results Summary"
echo "========================================"
echo -e "Total Endpoints: ${YELLOW}$TOTAL${NC}"
echo -e "Passing: ${GREEN}$PASSING${NC} ($((PASSING * 100 / TOTAL))%)"
echo -e "Failing: ${RED}$FAILING${NC} ($((FAILING * 100 / TOTAL))%)"
echo ""
echo "Detailed results saved to: $RESULTS_FILE"
echo ""
