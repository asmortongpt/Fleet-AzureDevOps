#!/bin/bash

################################################################################
# Fleet Management - Azure VM Remote Testing Script
# Executes comprehensive tests on deployed Azure VM instance
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
VM_IP="${VM_IP:-172.173.175.71}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
API_PORT="${API_PORT:-3001}"
FRONTEND_URL="http://${VM_IP}:${FRONTEND_PORT}"
API_URL="http://${VM_IP}:${API_PORT}"

# Logging functions
log_header() { echo -e "\n${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"; echo -e "${PURPLE}║  $1${NC}"; echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}\n"; }
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_test() { echo -e "${CYAN}  →${NC} $1"; }

# Create results directory
RESULTS_DIR="/tmp/fleet-vm-test-results-$(date +%s)"
mkdir -p "$RESULTS_DIR"

log_header "🚀 FLEET AZURE VM - REMOTE TEST SUITE"

echo -e "${CYAN}Target Configuration:${NC}"
echo "  VM IP:           $VM_IP"
echo "  Frontend URL:    $FRONTEND_URL"
echo "  API URL:         $API_URL"
echo "  Results Dir:     $RESULTS_DIR"
echo ""

# Test 1: Network Connectivity
log_header "TEST 1: Network Connectivity"
log_test "Pinging Azure VM..."

if ping -c 4 "$VM_IP" > /dev/null 2>&1; then
  log_success "VM is reachable at $VM_IP"
else
  log_warning "VM ping failed (may be blocked by firewall)"
fi

# Test 2: Port Availability
log_header "TEST 2: Port Availability Check"

check_port() {
  local port=$1
  local service=$2

  log_test "Checking port $port ($service)..."

  if nc -zv -w5 "$VM_IP" "$port" 2>&1 | grep -q "succeeded\|open"; then
    log_success "Port $port ($service) is open"
    echo "Port $port,$service,OPEN" >> "$RESULTS_DIR/ports.csv"
    return 0
  else
    log_error "Port $port ($service) is closed or filtered"
    echo "Port $port,$service,CLOSED" >> "$RESULTS_DIR/ports.csv"
    return 1
  fi
}

echo "Port,Service,Status" > "$RESULTS_DIR/ports.csv"
check_port 22 "SSH"
check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3000 "Frontend"
check_port 3001 "API"
check_port 5432 "PostgreSQL"

# Test 3: API Health Checks
log_header "TEST 3: API Health & Endpoints"

test_api_endpoint() {
  local endpoint=$1
  local method=${2:-GET}
  local expected_status=${3:-200}
  local timeout=${4:-10}

  log_test "Testing ${method} ${endpoint}"

  response=$(curl -s -o /dev/null -w "%{http_code}" -m "$timeout" -X "$method" "${API_URL}${endpoint}" 2>/dev/null || echo "000")

  if [ "$response" == "$expected_status" ]; then
    log_success "${endpoint} → HTTP $response ✓"
    echo "${endpoint},${method},${response},PASS" >> "$RESULTS_DIR/api-results.csv"
    return 0
  else
    log_error "${endpoint} → HTTP $response (expected $expected_status)"
    echo "${endpoint},${method},${response},FAIL" >> "$RESULTS_DIR/api-results.csv"
    return 1
  fi
}

echo "Endpoint,Method,Status,Result" > "$RESULTS_DIR/api-results.csv"

# Core health endpoints
test_api_endpoint "/health" "GET" "200" 5
test_api_endpoint "/api/health" "GET" "200" 5

# Data endpoints
test_api_endpoint "/api/vehicles" "GET" "200" 10
test_api_endpoint "/api/vehicles?limit=10" "GET" "200" 10
test_api_endpoint "/api/drivers" "GET" "200" 10
test_api_endpoint "/api/work-orders" "GET" "200" 10
test_api_endpoint "/api/routes" "GET" "200" 10
test_api_endpoint "/api/inspections" "GET" "200" 10
test_api_endpoint "/api/incidents" "GET" "200" 10
test_api_endpoint "/api/facilities" "GET" "200" 10

# Test 4: Frontend Availability
log_header "TEST 4: Frontend Server Check"

frontend_status=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$FRONTEND_URL" 2>/dev/null || echo "000")

if [ "$frontend_status" == "200" ]; then
  log_success "Frontend server responding → HTTP $frontend_status"

  # Download homepage for analysis
  curl -s -m 10 "$FRONTEND_URL" > "$RESULTS_DIR/homepage.html" 2>/dev/null

  # Check for expected content
  if grep -q "Fleet" "$RESULTS_DIR/homepage.html"; then
    log_success "Frontend contains expected Fleet content"
  else
    log_warning "Frontend content may be incomplete"
  fi
else
  log_error "Frontend server issue → HTTP $frontend_status"
fi

# Test 5: Database Connectivity (via API)
log_header "TEST 5: Database Connectivity Test"

log_test "Fetching vehicle data to verify database..."
vehicle_data=$(curl -s -m 10 "${API_URL}/api/vehicles?limit=5" 2>/dev/null || echo '{"data":[]}')

# Try to parse with jq if available, otherwise use grep
if command -v jq &> /dev/null; then
  vehicle_count=$(echo "$vehicle_data" | jq -r '.data | length' 2>/dev/null || echo "0")
  echo "$vehicle_data" | jq '.' > "$RESULTS_DIR/sample-vehicle-data.json" 2>/dev/null
else
  vehicle_count=$(echo "$vehicle_data" | grep -o '"id"' | wc -l | tr -d ' ')
  echo "$vehicle_data" > "$RESULTS_DIR/sample-vehicle-data.json"
fi

if [ "$vehicle_count" -gt "0" ]; then
  log_success "Database connected - Found $vehicle_count vehicles"
else
  log_warning "No vehicles found in database (may be empty)"
fi

# Test 6: Performance Metrics
log_header "TEST 6: Performance & Response Times"

measure_response_time() {
  local url=$1
  local name=$2

  log_test "Measuring response time for $name..."

  start_time=$(date +%s%N)
  status=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$url" 2>/dev/null || echo "000")
  end_time=$(date +%s%N)

  duration_ms=$(( (end_time - start_time) / 1000000 ))

  if [ "$status" == "200" ]; then
    log_success "$name responded in ${duration_ms}ms"
    echo "$name,$url,$status,${duration_ms}ms" >> "$RESULTS_DIR/performance.csv"
  else
    log_warning "$name returned HTTP $status"
    echo "$name,$url,$status,FAILED" >> "$RESULTS_DIR/performance.csv"
  fi
}

echo "Endpoint,URL,Status,ResponseTime" > "$RESULTS_DIR/performance.csv"

measure_response_time "$FRONTEND_URL" "Frontend Homepage"
measure_response_time "${API_URL}/health" "API Health"
measure_response_time "${API_URL}/api/vehicles" "Vehicles API"
measure_response_time "${API_URL}/api/drivers" "Drivers API"

# Test 7: Service Status (if SSH is available)
log_header "TEST 7: System Services Status"

log_info "Checking PM2 process status (requires SSH access)..."
log_warning "Skipping service checks (requires SSH configuration)"

# Generate Summary Report
log_header "📊 GENERATING TEST REPORT"

api_pass=$(grep -c ",PASS" "$RESULTS_DIR/api-results.csv" 2>/dev/null || echo "0")
api_fail=$(grep -c ",FAIL" "$RESULTS_DIR/api-results.csv" 2>/dev/null || echo "0")
api_total=$((api_pass + api_fail))

ports_open=$(grep -c ",OPEN" "$RESULTS_DIR/ports.csv" 2>/dev/null || echo "0")
ports_closed=$(grep -c ",CLOSED" "$RESULTS_DIR/ports.csv" 2>/dev/null || echo "0")

cat > "$RESULTS_DIR/SUMMARY.md" << EOF
# Fleet Management - Azure VM Test Report

**Date:** $(date)
**VM IP:** $VM_IP
**Frontend URL:** $FRONTEND_URL
**API URL:** $API_URL

---

## Test Results Summary

### Network & Connectivity
- **VM Reachable:** $(ping -c 1 "$VM_IP" >/dev/null 2>&1 && echo "✅ Yes" || echo "⚠️ No/Blocked")
- **Ports Open:** $ports_open
- **Ports Closed:** $ports_closed

### API Endpoints
- **Total Endpoints Tested:** $api_total
- **Passed:** $api_pass ✅
- **Failed:** $api_fail $([ $api_fail -gt 0 ] && echo "❌" || echo "")

### Frontend
- **Status:** $([ "$frontend_status" == "200" ] && echo "✅ Online (HTTP 200)" || echo "❌ Offline (HTTP $frontend_status)")

### Database
- **Vehicles Found:** $vehicle_count $([ "$vehicle_count" -gt 0 ] && echo "✅" || echo "⚠️")

---

## Port Status

\`\`\`
$(cat "$RESULTS_DIR/ports.csv")
\`\`\`

## API Test Results

\`\`\`
$(cat "$RESULTS_DIR/api-results.csv")
\`\`\`

## Performance Metrics

\`\`\`
$(cat "$RESULTS_DIR/performance.csv")
\`\`\`

---

## Files Generated

- \`ports.csv\` - Port availability results
- \`api-results.csv\` - API endpoint test results
- \`performance.csv\` - Response time measurements
- \`homepage.html\` - Frontend homepage content
- \`sample-vehicle-data.json\` - Sample database data
- \`SUMMARY.md\` - This summary report

---

## Next Steps

$(if [ "$api_fail" -gt 0 ]; then
  echo "⚠️ **Action Required:** $api_fail API endpoints are failing"
elif [ "$frontend_status" != "200" ]; then
  echo "⚠️ **Action Required:** Frontend server is not responding"
elif [ "$vehicle_count" -eq 0 ]; then
  echo "⚠️ **Recommendation:** Database appears empty, consider seeding data"
else
  echo "✅ **All Tests Passed:** Application is healthy and operational"
fi)

---

**Generated:** $(date)
EOF

log_success "Test report generated: $RESULTS_DIR/SUMMARY.md"

# Display Summary
log_header "✅ AZURE VM TEST SUITE COMPLETE"

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          FLEET AZURE VM TEST SUMMARY                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  🖥️  VM IP:             $VM_IP"
echo "  🌐 Frontend:          $FRONTEND_URL (HTTP $frontend_status)"
echo "  🔌 API Tests:         $api_pass/$api_total passed"
echo "  🗄️  Database:          $vehicle_count vehicles found"
echo "  📁 Results:           $RESULTS_DIR"
echo ""
echo -e "${CYAN}View detailed report:${NC}"
echo "  cat $RESULTS_DIR/SUMMARY.md"
echo ""
echo -e "${CYAN}View API results:${NC}"
echo "  cat $RESULTS_DIR/api-results.csv"
echo ""

# Return appropriate exit code
if [ "$api_fail" -gt 0 ] || [ "$frontend_status" != "200" ]; then
  log_warning "Some tests failed - Review results above"
  exit 1
else
  log_success "All tests passed!"
  exit 0
fi
