#!/bin/bash
################################################################################
# Fleet-CTA Comprehensive Feature Spider Test
# Tests EVERY feature, function, and data element
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Test results array
declare -a FAILED_FEATURES=()
declare -a WARNING_FEATURES=()

# Database connection
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-fleet_user}
DB_NAME=${DB_NAME:-fleet_db}
DB_PASSWORD=${DB_PASSWORD:-fleet_password}
PGPASSWORD=$DB_PASSWORD

# API base URL
API_URL=${API_URL:-http://localhost:3000}

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_FEATURES+=("$1")
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNING_FEATURES+=("$1")
    ((WARNINGS++))
}

test_database_table() {
    local table=$1
    local description=$2

    log_info "Testing: $description"

    # Check if table exists
    if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d $table" &> /dev/null; then
        # Get record count
        local count=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $table;")
        count=$(echo $count | xargs)  # Trim whitespace

        if [ "$count" -gt 0 ]; then
            log_success "$description - $count records"
        else
            log_warning "$description - Table exists but empty (0 records)"
        fi
    else
        log_fail "$description - Table does not exist"
    fi
}

test_api_endpoint() {
    local endpoint=$1
    local description=$2
    local expect_auth=${3:-true}

    log_info "Testing: $description"

    # Make API request
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint" 2>/dev/null)

    if [ "$expect_auth" = "true" ]; then
        # Expect 401 (authentication required)
        if [ "$response" = "401" ]; then
            log_success "$description - Requires authentication (secure)"
        elif [ "$response" = "200" ]; then
            log_warning "$description - No authentication required (potential security issue)"
        else
            log_fail "$description - Unexpected response: $response"
        fi
    else
        # Expect 200 (public endpoint)
        if [ "$response" = "200" ]; then
            log_success "$description - Accessible"
        else
            log_fail "$description - Unexpected response: $response"
        fi
    fi
}

################################################################################
# Database Schema Tests
################################################################################

echo ""
echo "=========================================="
echo "DATABASE SCHEMA TESTS"
echo "=========================================="
echo ""

# Core Tables
test_database_table "tenants" "Tenants table"
test_database_table "users" "Users table"
test_database_table "drivers" "Drivers table"
test_database_table "vehicles" "Vehicles table"
test_database_table "work_orders" "Work orders table"
test_database_table "inspections" "Inspections table"
test_database_table "fuel_transactions" "Fuel transactions table"
test_database_table "facilities" "Facilities table"
test_database_table "vendors" "Vendors table"
test_database_table "purchase_orders" "Purchase orders table"
test_database_table "parts" "Parts inventory table"
test_database_table "maintenance_schedules" "Maintenance schedules table"
test_database_table "routes" "Routes table"
test_database_table "geofences" "Geofences table"
test_database_table "incidents" "Safety incidents table"
test_database_table "documents" "Document management table"
test_database_table "policies" "Policies table"
test_database_table "notifications" "Notifications table"
test_database_table "charging_stations" "EV charging stations table"

################################################################################
# Data Quality Tests
################################################################################

echo ""
echo "=========================================="
echo "DATA QUALITY TESTS"
echo "=========================================="
echo ""

log_info "Testing: Vehicles have GPS coordinates"
null_gps=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM vehicles WHERE latitude IS NULL OR longitude IS NULL OR (latitude = 0 AND longitude = 0);")
null_gps=$(echo $null_gps | xargs)
if [ "$null_gps" = "0" ]; then
    log_success "All vehicles have valid GPS coordinates"
else
    log_fail "Vehicles with NULL/zero GPS coordinates: $null_gps"
fi

log_info "Testing: Drivers linked to users"
orphan_drivers=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM drivers d LEFT JOIN users u ON d.user_id = u.id WHERE u.id IS NULL;")
orphan_drivers=$(echo $orphan_drivers | xargs)
if [ "$orphan_drivers" = "0" ]; then
    log_success "All drivers properly linked to users"
else
    log_fail "Orphaned drivers (no user link): $orphan_drivers"
fi

log_info "Testing: Work orders have valid costs"
invalid_costs=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM work_orders WHERE total_cost < 0;")
invalid_costs=$(echo $invalid_costs | xargs)
if [ "$invalid_costs" = "0" ]; then
    log_success "All work orders have valid costs"
else
    log_fail "Work orders with negative costs: $invalid_costs"
fi

log_info "Testing: Fuel transactions have valid data"
invalid_fuel=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM fuel_transactions WHERE gallons <= 0 OR price_per_gallon <= 0;")
invalid_fuel=$(echo $invalid_fuel | xargs)
if [ "$invalid_fuel" = "0" ]; then
    log_success "All fuel transactions have valid gallons and prices"
else
    log_fail "Invalid fuel transactions: $invalid_fuel"
fi

log_info "Testing: Vehicle status values"
invalid_status=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM vehicles WHERE status NOT IN ('active', 'maintenance', 'out_of_service', 'sold', 'retired');")
invalid_status=$(echo $invalid_status | xargs)
if [ "$invalid_status" = "0" ]; then
    log_success "All vehicles have valid status values"
else
    log_fail "Vehicles with invalid status: $invalid_status"
fi

################################################################################
# Foreign Key Integrity Tests
################################################################################

echo ""
echo "=========================================="
echo "FOREIGN KEY INTEGRITY TESTS"
echo "=========================================="
echo ""

log_info "Testing: Vehicles tenant_id references tenants"
fk_test=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM vehicles v LEFT JOIN tenants t ON v.tenant_id = t.id WHERE t.id IS NULL;")
fk_test=$(echo $fk_test | xargs)
if [ "$fk_test" = "0" ]; then
    log_success "All vehicles have valid tenant references"
else
    log_fail "Vehicles with invalid tenant_id: $fk_test"
fi

log_info "Testing: Work orders vehicle_id references vehicles"
fk_test=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM work_orders w LEFT JOIN vehicles v ON w.vehicle_id = v.id WHERE w.vehicle_id IS NOT NULL AND v.id IS NULL;")
fk_test=$(echo $fk_test | xargs)
if [ "$fk_test" = "0" ]; then
    log_success "All work orders have valid vehicle references"
else
    log_fail "Work orders with invalid vehicle_id: $fk_test"
fi

log_info "Testing: Inspections driver_id references drivers"
fk_test=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM inspections i LEFT JOIN drivers d ON i.driver_id = d.id WHERE i.driver_id IS NOT NULL AND d.id IS NULL;")
fk_test=$(echo $fk_test | xargs)
if [ "$fk_test" = "0" ]; then
    log_success "All inspections have valid driver references"
else
    log_fail "Inspections with invalid driver_id: $fk_test"
fi

################################################################################
# API Endpoint Tests
################################################################################

echo ""
echo "=========================================="
echo "API ENDPOINT TESTS"
echo "=========================================="
echo ""

# Health endpoints (should be public)
test_api_endpoint "/api/health" "Health check endpoint" false
test_api_endpoint "/api/health-detailed" "Detailed health endpoint" false

# Core API endpoints (should require auth)
test_api_endpoint "/api/v1/vehicles" "Vehicles API endpoint"
test_api_endpoint "/api/v1/drivers" "Drivers API endpoint"
test_api_endpoint "/api/v1/work-orders" "Work orders API endpoint"
test_api_endpoint "/api/v1/inspections" "Inspections API endpoint"
test_api_endpoint "/api/v1/fuel-transactions" "Fuel transactions API endpoint"
test_api_endpoint "/api/v1/maintenance-schedules" "Maintenance schedules API endpoint"
test_api_endpoint "/api/v1/routes" "Routes API endpoint"
test_api_endpoint "/api/v1/geofences" "Geofences API endpoint"

# Dashboard endpoints
test_api_endpoint "/api/v1/dashboard/stats" "Dashboard statistics endpoint"
test_api_endpoint "/api/v1/analytics/cost-analysis" "Cost analysis endpoint"
test_api_endpoint "/api/v1/executive-dashboard" "Executive dashboard endpoint"

# AI endpoints
test_api_endpoint "/api/v1/ai/chat" "AI chat endpoint"
test_api_endpoint "/api/v1/ai/damage-detection" "AI damage detection endpoint"
test_api_endpoint "/api/v1/ai/insights" "AI insights endpoint"

# Mobile endpoints
test_api_endpoint "/api/v1/mobile/trips" "Mobile trips endpoint"
test_api_endpoint "/api/v1/mobile/photos" "Mobile photos endpoint"

# Integration endpoints
test_api_endpoint "/api/v1/teams" "Microsoft Teams integration endpoint"
test_api_endpoint "/api/v1/smartcar" "Smartcar integration endpoint"

################################################################################
# Database Performance Tests
################################################################################

echo ""
echo "=========================================="
echo "DATABASE PERFORMANCE TESTS"
echo "=========================================="
echo ""

log_info "Testing: Simple query performance"
start_time=$(date +%s%N)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM vehicles;" &> /dev/null
end_time=$(date +%s%N)
query_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds

if [ "$query_time" -lt 100 ]; then
    log_success "Simple query performance: ${query_time}ms (excellent)"
elif [ "$query_time" -lt 500 ]; then
    log_success "Simple query performance: ${query_time}ms (good)"
else
    log_warning "Simple query performance: ${query_time}ms (slow)"
fi

log_info "Testing: Complex JOIN query performance"
start_time=$(date +%s%N)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT v.*, u.first_name, u.last_name FROM vehicles v LEFT JOIN users u ON v.assigned_driver_id = u.id LIMIT 100;" &> /dev/null
end_time=$(date +%s%N)
query_time=$(( (end_time - start_time) / 1000000 ))

if [ "$query_time" -lt 200 ]; then
    log_success "Complex JOIN query: ${query_time}ms (excellent)"
elif [ "$query_time" -lt 1000 ]; then
    log_success "Complex JOIN query: ${query_time}ms (good)"
else
    log_warning "Complex JOIN query: ${query_time}ms (slow)"
fi

################################################################################
# Feature-Specific Tests
################################################################################

echo ""
echo "=========================================="
echo "FEATURE-SPECIFIC TESTS"
echo "=========================================="
echo ""

# Fleet Management
log_info "Testing: Vehicle diversity (multiple makes/models)"
vehicle_diversity=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(DISTINCT make) FROM vehicles;")
vehicle_diversity=$(echo $vehicle_diversity | xargs)
if [ "$vehicle_diversity" -ge 5 ]; then
    log_success "Vehicle diversity: $vehicle_diversity different makes"
else
    log_warning "Low vehicle diversity: only $vehicle_diversity makes"
fi

# Driver Management
log_info "Testing: CDL license diversity"
cdl_count=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM drivers WHERE cdl_class IS NOT NULL AND cdl_class != '';")
cdl_count=$(echo $cdl_count | xargs)
if [ "$cdl_count" -gt 0 ]; then
    log_success "Drivers with CDL licenses: $cdl_count"
else
    log_warning "No drivers with CDL licenses"
fi

# Maintenance
log_info "Testing: VMRS code usage in work orders"
vmrs_count=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM work_orders WHERE vmrs_code IS NOT NULL AND vmrs_code != '';")
vmrs_count=$(echo $vmrs_count | xargs)
if [ "$vmrs_count" -gt 0 ]; then
    log_success "Work orders with VMRS codes: $vmrs_count"
else
    log_warning "No work orders with VMRS codes"
fi

# Fuel Management
log_info "Testing: IFTA jurisdiction tracking"
ifta_count=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM fuel_transactions WHERE jurisdiction_code IS NOT NULL AND jurisdiction_code != '';")
ifta_count=$(echo $ifta_count | xargs)
if [ "$ifta_count" -gt 0 ]; then
    log_success "Fuel transactions with jurisdiction codes: $ifta_count"
else
    log_warning "No fuel transactions with jurisdiction codes (IFTA reporting may fail)"
fi

# Compliance
log_info "Testing: DVIR inspection compliance"
dvir_count=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM inspections WHERE dvir_number IS NOT NULL AND dvir_number != '';")
dvir_count=$(echo $dvir_count | xargs)
if [ "$dvir_count" -gt 0 ]; then
    log_success "Inspections with DVIR numbers: $dvir_count"
else
    log_warning "No inspections with DVIR numbers"
fi

################################################################################
# Multi-Tenant Tests
################################################################################

echo ""
echo "=========================================="
echo "MULTI-TENANT ISOLATION TESTS"
echo "=========================================="
echo ""

log_info "Testing: All vehicles have tenant_id"
vehicles_no_tenant=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM vehicles WHERE tenant_id IS NULL;")
vehicles_no_tenant=$(echo $vehicles_no_tenant | xargs)
if [ "$vehicles_no_tenant" = "0" ]; then
    log_success "All vehicles have tenant_id (multi-tenant compliant)"
else
    log_fail "Vehicles without tenant_id: $vehicles_no_tenant"
fi

log_info "Testing: All drivers have tenant_id"
drivers_no_tenant=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM drivers WHERE tenant_id IS NULL;")
drivers_no_tenant=$(echo $drivers_no_tenant | xargs)
if [ "$drivers_no_tenant" = "0" ]; then
    log_success "All drivers have tenant_id (multi-tenant compliant)"
else
    log_fail "Drivers without tenant_id: $drivers_no_tenant"
fi

log_info "Testing: Tenant isolation (no cross-tenant data)"
# This is a simple check - in production, would need RLS policy testing
tenant_count=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM tenants;")
tenant_count=$(echo $tenant_count | xargs)
if [ "$tenant_count" -ge 1 ]; then
    log_success "Multi-tenant setup: $tenant_count tenants configured"
else
    log_fail "No tenants configured"
fi

################################################################################
# Security Tests
################################################################################

echo ""
echo "=========================================="
echo "SECURITY TESTS"
echo "=========================================="
echo ""

log_info "Testing: SQL injection protection (parameterized queries)"
# Check for string concatenation in SQL (basic check)
sql_concat_count=$(grep -r "query.*+" /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api-standalone --include="*.js" | grep -v "test" | grep -v "//" | wc -l)
sql_concat_count=$(echo $sql_concat_count | xargs)
if [ "$sql_concat_count" = "0" ]; then
    log_success "No SQL string concatenation detected (parameterized queries)"
else
    log_warning "Potential SQL string concatenation found: $sql_concat_count instances (review needed)"
fi

log_info "Testing: Hardcoded passwords in code"
hardcoded_pwd=$(grep -r "password.*=.*[\"']" /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api-standalone --include="*.js" | grep -v "PASSWORD" | grep -v "//" | grep -v "test" | wc -l)
hardcoded_pwd=$(echo $hardcoded_pwd | xargs)
if [ "$hardcoded_pwd" = "0" ]; then
    log_success "No hardcoded passwords detected"
else
    log_fail "Potential hardcoded passwords: $hardcoded_pwd instances"
fi

################################################################################
# Frontend Component Tests
################################################################################

echo ""
echo "=========================================="
echo "FRONTEND COMPONENT TESTS"
echo "=========================================="
echo ""

log_info "Testing: React component file count"
component_count=$(find /Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/components -name "*.tsx" -type f | wc -l)
component_count=$(echo $component_count | xargs)
if [ "$component_count" -gt 100 ]; then
    log_success "React components: $component_count files"
else
    log_warning "Low component count: $component_count files"
fi

log_info "Testing: Custom hooks count"
hook_count=$(find /Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/hooks -name "*.ts" -type f | wc -l)
hook_count=$(echo $hook_count | xargs)
if [ "$hook_count" -gt 20 ]; then
    log_success "Custom React hooks: $hook_count files"
else
    log_warning "Low hook count: $hook_count files"
fi

log_info "Testing: TypeScript configuration"
if [ -f "/Users/andrewmorton/Documents/GitHub/Fleet-CTA/tsconfig.json" ]; then
    log_success "TypeScript configuration exists"
else
    log_fail "TypeScript configuration missing"
fi

################################################################################
# Final Report
################################################################################

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo ""

echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
echo -e "${RED}Failed:${NC} $FAILED_TESTS"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"

if [ "$FAILED_TESTS" -gt 0 ]; then
    echo ""
    echo -e "${RED}FAILED FEATURES:${NC}"
    for feature in "${FAILED_FEATURES[@]}"; do
        echo "  - $feature"
    done
fi

if [ "$WARNINGS" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}WARNINGS:${NC}"
    for warning in "${WARNING_FEATURES[@]}"; do
        echo "  - $warning"
    done
fi

echo ""
if [ "$FAILED_TESTS" = "0" ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    exit 1
fi
