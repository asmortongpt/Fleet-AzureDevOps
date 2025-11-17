#!/bin/bash

#############################################
# Fleet Management API Endpoint Verification
# Tests all API endpoints across environments
#############################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment URLs
PROD_URL="http://68.220.148.2"
STAGING_URL="http://20.161.88.59"
DEV_URL="http://48.211.228.97"

# Output files
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="./test-results/${TIMESTAMP}"
mkdir -p "${REPORT_DIR}"

RESULTS_FILE="${REPORT_DIR}/endpoint-results.csv"
DETAILED_LOG="${REPORT_DIR}/detailed-log.txt"
SUMMARY_FILE="${REPORT_DIR}/summary.txt"

# Initialize CSV header
echo "Endpoint,Method,Prod Status,Prod Time (ms),Staging Status,Staging Time (ms),Dev Status,Dev Time (ms),Notes" > "${RESULTS_FILE}"

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

#############################################
# Helper Functions
#############################################

log() {
    echo -e "${1}" | tee -a "${DETAILED_LOG}"
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local env_name=$3
    local base_url=$4
    local auth_header=${5:-""}

    local full_url="${base_url}${endpoint}"
    local start_time=$(date +%s%3N)

    # Make request with timeout
    if [ -n "$auth_header" ]; then
        response=$(curl -X ${method} -s -w "\n%{http_code}" -m 10 \
            -H "Content-Type: application/json" \
            -H "Authorization: ${auth_header}" \
            "${full_url}" 2>&1)
    else
        response=$(curl -X ${method} -s -w "\n%{http_code}" -m 10 \
            -H "Content-Type: application/json" \
            "${full_url}" 2>&1)
    fi

    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))

    # Extract status code (last line)
    local status_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    # Determine if success
    if [[ "$status_code" =~ ^[23][0-9][0-9]$ ]]; then
        echo "${GREEN}✓${NC} ${status_code}"
        return 0
    else
        echo "${RED}✗${NC} ${status_code}"
        return 1
    fi
}

test_endpoint_all_envs() {
    local method=$1
    local endpoint=$2
    local description=$3

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    log "\n${BLUE}Testing:${NC} ${method} ${endpoint}"
    log "Description: ${description}"

    # Test Production
    printf "  Production:   "
    prod_result=$(test_endpoint "${method}" "${endpoint}" "Production" "${PROD_URL}")
    prod_status=$?

    # Test Staging
    printf "  Staging:      "
    staging_result=$(test_endpoint "${method}" "${endpoint}" "Staging" "${STAGING_URL}")
    staging_status=$?

    # Test Dev
    printf "  Dev:          "
    dev_result=$(test_endpoint "${method}" "${endpoint}" "Dev" "${DEV_URL}")
    dev_status=$?

    # Extract status codes and times
    prod_code=$(echo "$prod_result" | grep -oP '\d{3}' || echo "ERR")
    staging_code=$(echo "$staging_result" | grep -oP '\d{3}' || echo "ERR")
    dev_code=$(echo "$dev_result" | grep -oP '\d{3}' || echo "ERR")

    # Determine overall success
    if [[ $prod_status -eq 0 || $staging_status -eq 0 || $dev_status -eq 0 ]]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    # Write to CSV
    echo "\"${endpoint}\",\"${method}\",\"${prod_code}\",\"-\",\"${staging_code}\",\"-\",\"${dev_code}\",\"-\",\"${description}\"" >> "${RESULTS_FILE}"
}

#############################################
# Test All Endpoints
#############################################

log "${BLUE}═══════════════════════════════════════════${NC}"
log "${BLUE}Fleet Management API Endpoint Verification${NC}"
log "${BLUE}═══════════════════════════════════════════${NC}"
log "Started: $(date)"
log "Production:  ${PROD_URL}"
log "Staging:     ${STAGING_URL}"
log "Dev:         ${DEV_URL}"
log "${BLUE}═══════════════════════════════════════════${NC}"

# System Endpoints
log "\n${YELLOW}=== SYSTEM ENDPOINTS ===${NC}"
test_endpoint_all_envs "GET" "/api/health" "Health check endpoint"
test_endpoint_all_envs "GET" "/api/docs" "API documentation (Swagger UI)"
test_endpoint_all_envs "GET" "/api/openapi.json" "OpenAPI specification"

# Core Fleet Management
log "\n${YELLOW}=== CORE FLEET MANAGEMENT ===${NC}"
test_endpoint_all_envs "GET" "/api/vehicles" "List all vehicles"
test_endpoint_all_envs "GET" "/api/drivers" "List all drivers"
test_endpoint_all_envs "GET" "/api/work-orders" "List work orders"
test_endpoint_all_envs "GET" "/api/maintenance-schedules" "List maintenance schedules"
test_endpoint_all_envs "GET" "/api/fuel-transactions" "List fuel transactions"
test_endpoint_all_envs "GET" "/api/routes" "List routes"

# Location & Geofencing
log "\n${YELLOW}=== LOCATION & GEOFENCING ===${NC}"
test_endpoint_all_envs "GET" "/api/geofences" "List geofences"
test_endpoint_all_envs "GET" "/api/arcgis-layers" "List ArcGIS layers"
test_endpoint_all_envs "GET" "/api/traffic-cameras" "List traffic cameras"

# Safety & Compliance
log "\n${YELLOW}=== SAFETY & COMPLIANCE ===${NC}"
test_endpoint_all_envs "GET" "/api/inspections" "List vehicle inspections"
test_endpoint_all_envs "GET" "/api/damage-reports" "List damage reports"
test_endpoint_all_envs "GET" "/api/damage" "Damage management endpoint"
test_endpoint_all_envs "GET" "/api/safety-incidents" "List safety incidents"
test_endpoint_all_envs "GET" "/api/osha-compliance" "OSHA compliance records"

# Video & Telematics
log "\n${YELLOW}=== VIDEO & TELEMATICS ===${NC}"
test_endpoint_all_envs "GET" "/api/video-events" "List video events"
test_endpoint_all_envs "GET" "/api/video" "Video telematics endpoint"
test_endpoint_all_envs "GET" "/api/telemetry" "Telemetry data"
test_endpoint_all_envs "GET" "/api/telematics" "Telematics data"

# EV & Charging
log "\n${YELLOW}=== EV & CHARGING MANAGEMENT ===${NC}"
test_endpoint_all_envs "GET" "/api/charging-stations" "List charging stations"
test_endpoint_all_envs "GET" "/api/charging-sessions" "List charging sessions"
test_endpoint_all_envs "GET" "/api/ev" "EV management endpoint"

# Procurement & Vendors
log "\n${YELLOW}=== PROCUREMENT & VENDORS ===${NC}"
test_endpoint_all_envs "GET" "/api/purchase-orders" "List purchase orders"
test_endpoint_all_envs "GET" "/api/facilities" "List facilities"
test_endpoint_all_envs "GET" "/api/vendors" "List vendors"

# Communications & Policies
log "\n${YELLOW}=== COMMUNICATIONS & POLICIES ===${NC}"
test_endpoint_all_envs "GET" "/api/communication-logs" "Communication logs"
test_endpoint_all_envs "GET" "/api/communications" "Communications management"
test_endpoint_all_envs "GET" "/api/policies" "List policies"
test_endpoint_all_envs "GET" "/api/policy-templates" "Policy templates"
test_endpoint_all_envs "GET" "/api/documents" "Document management"

# Personal Use & Billing
log "\n${YELLOW}=== PERSONAL USE & BILLING ===${NC}"
test_endpoint_all_envs "GET" "/api/mileage-reimbursement" "Mileage reimbursement"
test_endpoint_all_envs "GET" "/api/trip-usage" "Trip usage tracking"
test_endpoint_all_envs "GET" "/api/personal-use-policies" "Personal use policies"
test_endpoint_all_envs "GET" "/api/personal-use-charges" "Personal use charges"
test_endpoint_all_envs "GET" "/api/billing-reports" "Billing reports"

# Dispatch & Routing
log "\n${YELLOW}=== DISPATCH & ROUTING ===${NC}"
test_endpoint_all_envs "GET" "/api/dispatch" "Dispatch management"
test_endpoint_all_envs "GET" "/api/route-optimization" "Route optimization"

# 3D & Mobile
log "\n${YELLOW}=== 3D VISUALIZATION & MOBILE ===${NC}"
test_endpoint_all_envs "GET" "/api/mobile" "Mobile integration"
test_endpoint_all_envs "GET" "/api/emulator" "Emulator endpoints"

# DevOps & Quality
log "\n${YELLOW}=== DEVOPS & QUALITY ===${NC}"
test_endpoint_all_envs "GET" "/api/quality-gates" "Quality gate checks"
test_endpoint_all_envs "GET" "/api/deployments" "Deployment tracking"

# External Integrations
log "\n${YELLOW}=== EXTERNAL INTEGRATIONS ===${NC}"
test_endpoint_all_envs "GET" "/api/smartcar" "Smartcar integration"

# Test POST endpoints with sample data
log "\n${YELLOW}=== TESTING POST ENDPOINTS ===${NC}"

# Test POST vehicle
log "\n${BLUE}Testing POST /api/vehicles${NC}"
for env_url in "$PROD_URL" "$STAGING_URL" "$DEV_URL"; do
    env_name=$(echo $env_url | grep -oP '\d+\.\d+\.\d+\.\d+')
    printf "  ${env_name}: "

    response=$(curl -X POST -s -w "\n%{http_code}" -m 10 \
        -H "Content-Type: application/json" \
        -d '{"vin":"TEST12345","make":"Test","model":"Vehicle","year":2024}' \
        "${env_url}/api/vehicles" 2>&1)

    status_code=$(echo "$response" | tail -n1)
    if [[ "$status_code" =~ ^[234][0-9][0-9]$ ]]; then
        echo -e "${GREEN}✓${NC} ${status_code}"
    else
        echo -e "${YELLOW}○${NC} ${status_code} (may require auth)"
    fi
done

#############################################
# Generate Summary Report
#############################################

log "\n${BLUE}═══════════════════════════════════════════${NC}"
log "${BLUE}TEST SUMMARY${NC}"
log "${BLUE}═══════════════════════════════════════════${NC}"
log "Total Tests:   ${TOTAL_TESTS}"
log "Passed:        ${GREEN}${PASSED_TESTS}${NC}"
log "Failed:        ${RED}${FAILED_TESTS}${NC}"
log "Success Rate:  $(awk "BEGIN {printf \"%.1f\", (${PASSED_TESTS}/${TOTAL_TESTS})*100}")%"
log ""
log "Results saved to:"
log "  - CSV Report:    ${RESULTS_FILE}"
log "  - Detailed Log:  ${DETAILED_LOG}"
log "${BLUE}═══════════════════════════════════════════${NC}"

# Create HTML report
cat > "${REPORT_DIR}/report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>API Endpoint Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .summary { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: flex; gap: 20px; margin-top: 20px; }
        .stat { flex: 1; background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #2c3e50; }
        .stat-label { color: #7f8c8d; margin-top: 5px; }
        table { width: 100%; background: white; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th { background: #34495e; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ecf0f1; }
        tr:hover { background: #f8f9fa; }
        .status-200, .status-201 { color: #27ae60; font-weight: bold; }
        .status-404, .status-500 { color: #e74c3c; font-weight: bold; }
        .status-401, .status-403 { color: #f39c12; font-weight: bold; }
        .endpoint { font-family: monospace; color: #2980b9; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 Fleet Management API Test Report</h1>
        <p>Generated: TIMESTAMP_PLACEHOLDER</p>
    </div>

    <div class="summary">
        <h2>Test Summary</h2>
        <div class="stats">
            <div class="stat">
                <div class="stat-value" id="total-tests">0</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #27ae60;" id="passed-tests">0</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #e74c3c;" id="failed-tests">0</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="success-rate">0%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </div>
    </div>

    <table id="results-table">
        <thead>
            <tr>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Production</th>
                <th>Staging</th>
                <th>Dev</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody id="results-body">
        </tbody>
    </table>

    <script>
        // This will be populated by the test script
        document.getElementById('total-tests').textContent = 'TOTAL_TESTS_PLACEHOLDER';
        document.getElementById('passed-tests').textContent = 'PASSED_TESTS_PLACEHOLDER';
        document.getElementById('failed-tests').textContent = 'FAILED_TESTS_PLACEHOLDER';
        document.getElementById('success-rate').textContent = 'SUCCESS_RATE_PLACEHOLDER';
    </script>
</body>
</html>
EOF

# Update HTML with actual values
sed -i.bak "s/TIMESTAMP_PLACEHOLDER/$(date)/" "${REPORT_DIR}/report.html"
sed -i.bak "s/TOTAL_TESTS_PLACEHOLDER/${TOTAL_TESTS}/" "${REPORT_DIR}/report.html"
sed -i.bak "s/PASSED_TESTS_PLACEHOLDER/${PASSED_TESTS}/" "${REPORT_DIR}/report.html"
sed -i.bak "s/FAILED_TESTS_PLACEHOLDER/${FAILED_TESTS}/" "${REPORT_DIR}/report.html"
sed -i.bak "s/SUCCESS_RATE_PLACEHOLDER/$(awk "BEGIN {printf \"%.1f%%\", (${PASSED_TESTS}/${TOTAL_TESTS})*100}")/" "${REPORT_DIR}/report.html"
rm "${REPORT_DIR}/report.html.bak"

echo ""
echo -e "${GREEN}✓${NC} HTML report generated: ${REPORT_DIR}/report.html"
echo ""
echo "To view results:"
echo "  cat ${RESULTS_FILE}"
echo "  open ${REPORT_DIR}/report.html"
