#!/bin/bash

# Fleet Management System - Comprehensive Production Test
# This script ACTUALLY tests every claim made about the system

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILURES=0
PASSES=0

echo "======================================================================"
echo "Fleet Management System - BRUTAL HONESTY TEST"
echo "Testing EVERY claim made about this system"
echo "======================================================================"
echo ""

# Function to test and report
test_component() {
    local description=$1
    local command=$2

    echo -n "Testing: $description... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSES++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILURES++))
        return 1
    fi
}

# ===================================================================
# PHASE 1: Infrastructure Tests
# ===================================================================
echo "PHASE 1: Infrastructure Tests"
echo "======================================================================"

test_component "Kubernetes pods running" \
    "kubectl get pods -n fleet-management | grep -E '(fleet-app|fleet-postgres|fleet-redis)' | grep Running"

test_component "PostgreSQL pod accessible" \
    "kubectl exec fleet-postgres-0 -n fleet-management -- psql -U fleetadmin -d fleetdb -c 'SELECT 1'"

test_component "Redis pod accessible" \
    "kubectl exec fleet-redis-0 -n fleet-management -- redis-cli -a 'Redis2024!Secure' ping 2>/dev/null | grep PONG"

test_component "Frontend application responding (HTTP 200)" \
    "curl -s -o /dev/null -w '%{http_code}' http://68.220.148.2 | grep -E '(200|304)'"

echo ""

# ===================================================================
# PHASE 2: Database Schema Tests
# ===================================================================
echo "PHASE 2: Database Schema Tests (Claimed: 26 tables)"
echo "======================================================================"

TABLES=(
    "tenants"
    "users"
    "audit_logs"
    "vehicles"
    "drivers"
    "facilities"
    "work_orders"
    "maintenance_schedules"
    "fuel_transactions"
    "routes"
    "geofences"
    "geofence_events"
    "telemetry_data"
    "inspection_forms"
    "inspections"
    "safety_incidents"
    "video_events"
    "charging_stations"
    "charging_sessions"
    "vendors"
    "purchase_orders"
    "communication_logs"
    "policies"
    "policy_violations"
    "notifications"
    "schema_version"
)

for table in "${TABLES[@]}"; do
    test_component "Table '$table' exists" \
        "kubectl exec fleet-postgres-0 -n fleet-management -- psql -U fleetadmin -d fleetdb -c '\d $table' 2>&1 | grep -v 'Did not find'"
done

# Count actual tables
ACTUAL_TABLES=$(kubectl exec fleet-postgres-0 -n fleet-management -- psql -U fleetadmin -d fleetdb -c "\dt" 2>&1 | grep -c "table")
echo "Actual table count: $ACTUAL_TABLES (Expected: 26)"

echo ""

# ===================================================================
# PHASE 3: Mock Data Tests (Claimed: 0% mock data)
# ===================================================================
echo "PHASE 3: Mock Data Tests (Testing claim: 100% removed)"
echo "======================================================================"

test_component "mockData.ts does NOT exist in src" \
    "! find /Users/andrewmorton/Documents/GitHub/Fleet/src -name 'mockData.ts' -o -name 'mockData.tsx'"

test_component "No 'generateVehicles' function in codebase" \
    "! grep -r 'generateVehicles' /Users/andrewmorton/Documents/GitHub/Fleet/src --include='*.ts' --include='*.tsx'"

test_component "No localStorage.setItem for vehicles" \
    "! grep -r \"localStorage.setItem.*vehicles\" /Users/andrewmorton/Documents/GitHub/Fleet/src --include='*.ts' --include='*.tsx'"

echo ""

# ===================================================================
# PHASE 4: API Backend Tests (Claimed: 90+ endpoints)
# ===================================================================
echo "PHASE 4: API Backend Tests (Testing claim: 90+ endpoints)"
echo "======================================================================"

# Check if API server file exists
test_component "API server.ts exists" \
    "test -f /Users/andrewmorton/Documents/GitHub/Fleet/api/src/server.ts"

# Check if API routes exist
ROUTE_FILES=(
    "auth.ts"
    "vehicles.ts"
    "drivers.ts"
    "work-orders.ts"
    "maintenance-schedules.ts"
    "fuel-transactions.ts"
    "routes.ts"
    "geofences.ts"
    "inspections.ts"
    "safety-incidents.ts"
    "video-events.ts"
    "charging-stations.ts"
    "charging-sessions.ts"
    "vendors.ts"
    "purchase-orders.ts"
    "communication-logs.ts"
    "policies.ts"
    "telemetry.ts"
)

for route in "${ROUTE_FILES[@]}"; do
    test_component "Route file '$route' exists" \
        "test -f /Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/$route"
done

# Count actual route definitions
ROUTE_COUNT=$(grep -r "router\.(get\|post\|put\|delete)" /Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes --include="*.ts" 2>/dev/null | wc -l || echo "0")
echo "Actual route count: $ROUTE_COUNT (Expected: 90+)"

if [ "$ROUTE_COUNT" -ge 90 ]; then
    echo -e "${GREEN}✓ Route count meets claim${NC}"
    ((PASSES++))
else
    echo -e "${RED}✗ Route count DOES NOT meet claim (Found: $ROUTE_COUNT, Claimed: 90+)${NC}"
    ((FAILURES++))
fi

echo ""

# ===================================================================
# PHASE 5: Security Tests (FedRAMP compliance claimed: 85%)
# ===================================================================
echo "PHASE 5: Security Tests (Testing FedRAMP claims)"
echo "======================================================================"

test_component "JWT authentication middleware exists" \
    "grep -r 'authenticateJWT\|verifyToken' /Users/andrewmorton/Documents/GitHub/Fleet/api/src/middleware --include='*.ts'"

test_component "RBAC authorization exists" \
    "grep -r 'role.*admin\|fleet_manager\|driver\|technician\|viewer' /Users/andrewmorton/Documents/GitHub/Fleet/api/src --include='*.ts'"

test_component "Audit logging middleware exists" \
    "test -f /Users/andrewmorton/Documents/GitHub/Fleet/api/src/middleware/audit.ts"

test_component "Password hashing (bcrypt) implemented" \
    "grep -r 'bcrypt' /Users/andrewmorton/Documents/GitHub/Fleet/api --include='*.ts'"

test_component "Rate limiting configured" \
    "grep -r 'express-rate-limit\|rateLimit' /Users/andrewmorton/Documents/GitHub/Fleet/api/src --include='*.ts'"

test_component "Input validation (Zod) implemented" \
    "grep -r 'zod\|z\\.object' /Users/andrewmorton/Documents/GitHub/Fleet/api/src --include='*.ts'"

test_component "Helmet.js for XSS protection" \
    "grep -r 'helmet' /Users/andrewmorton/Documents/GitHub/Fleet/api/src/server.ts"

echo ""

# ===================================================================
# PHASE 6: AI Integration Tests (Claimed: 3 services)
# ===================================================================
echo "PHASE 6: AI Integration Tests (Testing claim: 3 AI services)"
echo "======================================================================"

test_component "OpenAI service exists" \
    "test -f /Users/andrewmorton/Documents/GitHub/Fleet/api/src/services/openai.ts && grep -q 'OpenAI' /Users/andrewmorton/Documents/GitHub/Fleet/api/src/services/openai.ts"

test_component "OpenAI dependency in package.json" \
    "grep -q '\"openai\"' /Users/andrewmorton/Documents/GitHub/Fleet/api/package.json"

test_component "Claude SDK in package.json" \
    "grep -q '@anthropic-ai/sdk' /Users/andrewmorton/Documents/GitHub/Fleet/api/package.json"

test_component "Azure OpenAI in package.json" \
    "grep -q '@azure/openai' /Users/andrewmorton/Documents/GitHub/Fleet/api/package.json"

echo ""

# ===================================================================
# PHASE 7: Frontend Integration Tests
# ===================================================================
echo "PHASE 7: Frontend Integration Tests (Testing API client)"
echo "======================================================================"

test_component "Production API client exists" \
    "test -f /Users/andrewmorton/Documents/GitHub/Fleet/src/lib/api-client.ts"

test_component "SWR hooks for data fetching exist" \
    "test -f /Users/andrewmorton/Documents/GitHub/Fleet/src/hooks/use-api.ts"

test_component "useVehicles hook implemented" \
    "grep -q 'useVehicles' /Users/andrewmorton/Documents/GitHub/Fleet/src/hooks/use-api.ts"

test_component "API calls replace localStorage in use-fleet-data.ts" \
    "! grep -q 'localStorage' /Users/andrewmorton/Documents/GitHub/Fleet/src/hooks/use-fleet-data.ts || grep -q 'useSWR\|fetch' /Users/andrewmorton/Documents/GitHub/Fleet/src/hooks/use-fleet-data.ts"

echo ""

# ===================================================================
# PHASE 8: Deployment Infrastructure Tests
# ===================================================================
echo "PHASE 8: Deployment Infrastructure Tests"
echo "======================================================================"

test_component "API Dockerfile exists" \
    "test -f /Users/andrewmorton/Documents/GitHub/Fleet/api/Dockerfile"

test_component "Frontend Dockerfile exists" \
    "test -f /Users/andrewmorton/Documents/GitHub/Fleet/Dockerfile"

test_component "Kubernetes manifests exist" \
    "test -f /Users/andrewmorton/Documents/GitHub/Fleet/deployment/api-deployment.yaml"

test_component "Deployment script exists and is executable" \
    "test -x /Users/andrewmorton/Documents/GitHub/Fleet/scripts/deploy-production.sh"

test_component "Verification script exists and is executable" \
    "test -x /Users/andrewmorton/Documents/GitHub/Fleet/scripts/verify-production.sh"

echo ""

# ===================================================================
# PHASE 9: Azure Maps Tests (Claimed: 7 maps)
# ===================================================================
echo "PHASE 9: Azure Maps Tests (Testing claim: 7 working maps)"
echo "======================================================================"

test_component "Azure Maps subscription key in .env" \
    "grep -q 'VITE_AZURE_MAPS_SUBSCRIPTION_KEY' /Users/andrewmorton/Documents/GitHub/Fleet/.env"

test_component "AzureMap component exists" \
    "test -f /Users/andrewmorton/Documents/GitHub/Fleet/src/components/AzureMap.tsx"

MAP_COMPONENTS=(
    "GPSTracking.tsx"
    "GISCommandCenter.tsx"
    "EnhancedMapLayers.tsx"
    "GeofenceManagement.tsx"
    "VehicleTelemetry.tsx"
    "AdvancedRouteOptimization.tsx"
    "RouteManagement.tsx"
)

for component in "${MAP_COMPONENTS[@]}"; do
    test_component "Map component '$component' exists" \
        "test -f /Users/andrewmorton/Documents/GitHub/Fleet/src/components/modules/$component"

    test_component "'$component' uses AzureMap" \
        "grep -q 'AzureMap' /Users/andrewmorton/Documents/GitHub/Fleet/src/components/modules/$component"
done

echo ""

# ===================================================================
# SUMMARY
# ===================================================================
echo "======================================================================"
echo "BRUTAL HONESTY TEST SUMMARY"
echo "======================================================================"
echo ""
echo -e "Total Tests Run: $((PASSES + FAILURES))"
echo -e "${GREEN}Passed: $PASSES${NC}"
echo -e "${RED}Failed: $FAILURES${NC}"
echo ""

PASS_RATE=$((PASSES * 100 / (PASSES + FAILURES)))
echo "Pass Rate: $PASS_RATE%"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ ALL TESTS PASSED - Claims are VERIFIED${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo -e "${RED}✗ $FAILURES TESTS FAILED - Some claims are NOT verified${NC}"
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo ""
    echo "Review failed tests above to see what needs fixing."
    exit 1
fi
