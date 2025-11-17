#!/bin/bash
###############################################################################
# Fleet Management System - Test Data Verification Script
#
# Verifies existing test data in the database and generates a comprehensive report
# Usage: ./verify-testdata.sh [dev|staging|production]
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_FILE="${SCRIPT_DIR}/testdata-verification-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).md"

# Kubernetes Configuration
case $ENVIRONMENT in
  production)
    NAMESPACE="fleet-management-prod"
    DB_NAME="fleetdb_prod"
    API_URL="https://fleet.capitaltechalliance.com"
    ;;
  staging)
    NAMESPACE="fleet-management-staging"
    DB_NAME="fleetdb_staging"
    API_URL="https://fleet-staging.capitaltechalliance.com"
    ;;
  dev)
    NAMESPACE="fleet-management-dev"
    DB_NAME="fleetdb_dev"
    API_URL="https://fleet-dev.capitaltechalliance.com"
    ;;
  *)
    echo -e "${RED}Invalid environment: ${ENVIRONMENT}${NC}"
    echo "Usage: $0 [dev|staging|production]"
    exit 1
    ;;
esac

DB_POD="fleet-postgres-0"
DB_USER="fleetadmin"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
  echo ""
  echo -e "${BLUE}================================================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================================================================${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${CYAN}## $1${NC}"
  echo -e "${CYAN}--------------------------------------------------------------------------------${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "  $1"
}

# Execute SQL query
exec_sql() {
  local query=$1
  kubectl exec -n "$NAMESPACE" "$DB_POD" -- psql -U "$DB_USER" -d "$DB_NAME" -t -c "$query" 2>/dev/null || echo "ERROR"
}

# Execute SQL query with formatting
exec_sql_formatted() {
  local query=$1
  kubectl exec -n "$NAMESPACE" "$DB_POD" -- psql -U "$DB_USER" -d "$DB_NAME" -c "$query" 2>/dev/null || echo "ERROR"
}

###############################################################################
# Start Report
###############################################################################

print_header "Fleet Management System - Test Data Verification"
echo "Environment: ${ENVIRONMENT}"
echo "Namespace: ${NAMESPACE}"
echo "Database: ${DB_NAME}"
echo "API URL: ${API_URL}"
echo "Timestamp: $(date)"
echo ""

# Initialize report file
cat > "$REPORT_FILE" <<EOF
# Fleet Management System - Test Data Verification Report

**Environment:** ${ENVIRONMENT}
**Namespace:** ${NAMESPACE}
**Database:** ${DB_NAME}
**API URL:** ${API_URL}
**Generated:** $(date)

---

EOF

###############################################################################
# Database Connection Check
###############################################################################

print_section "Database Connection"

if kubectl get pod -n "$NAMESPACE" "$DB_POD" &>/dev/null; then
  print_success "Database pod is running"
  echo "✓ Database pod is running" >> "$REPORT_FILE"
else
  print_error "Database pod not found"
  echo "✗ Database pod not found" >> "$REPORT_FILE"
  exit 1
fi

# Test connection
TEST_QUERY=$(exec_sql "SELECT 1;")
if [ "$TEST_QUERY" != "ERROR" ]; then
  print_success "Database connection successful"
  echo "✓ Database connection successful" >> "$REPORT_FILE"
else
  print_error "Database connection failed"
  echo "✗ Database connection failed" >> "$REPORT_FILE"
  exit 1
fi

echo "" >> "$REPORT_FILE"

###############################################################################
# Entity Counts
###############################################################################

print_section "Entity Counts"
echo "## Entity Counts" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Entity | Count | Status |" >> "$REPORT_FILE"
echo "|--------|-------|--------|" >> "$REPORT_FILE"

declare -A entity_counts

# Core entities
entities=("tenants" "users" "drivers" "vehicles")

for entity in "${entities[@]}"; do
  count=$(exec_sql "SELECT COUNT(*) FROM $entity;")
  count=$(echo "$count" | tr -d ' ')
  entity_counts[$entity]=$count

  if [ "$count" != "ERROR" ] && [ "$count" -gt 0 ]; then
    print_success "$entity: $count"
    echo "| $entity | $count | ✓ |" >> "$REPORT_FILE"
  elif [ "$count" = "0" ]; then
    print_warning "$entity: $count (empty)"
    echo "| $entity | $count | ⚠ Empty |" >> "$REPORT_FILE"
  else
    print_error "$entity: ERROR"
    echo "| $entity | ERROR | ✗ |" >> "$REPORT_FILE"
  fi
done

# Additional tables
additional_tables=(
  "charging_stations"
  "charging_sessions"
  "dispatch_channels"
  "dispatch_transmissions"
  "emergency_contacts"
  "fuel_cards"
  "fuel_purchases"
  "fuel_stations"
  "fuel_transactions"
  "geofences"
  "incident_reports"
  "inspections"
  "maintenance_history"
  "maintenance_schedules"
  "notifications"
  "purchase_orders"
  "routes"
  "safety_incidents"
  "service_reminders"
  "telemetry_data"
  "trip_history"
  "vehicle_assignments"
  "vehicle_health"
  "work_orders"
)

echo "" >> "$REPORT_FILE"
echo "### Additional Tables" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Table | Count |" >> "$REPORT_FILE"
echo "|-------|-------|" >> "$REPORT_FILE"

for table in "${additional_tables[@]}"; do
  count=$(exec_sql "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
  count=$(echo "$count" | tr -d ' ')
  if [ "$count" != "ERROR" ] && [ "$count" != "" ]; then
    entity_counts[$table]=$count
    print_info "$table: $count"
    echo "| $table | $count |" >> "$REPORT_FILE"
  fi
done

echo "" >> "$REPORT_FILE"

###############################################################################
# Tenant Analysis
###############################################################################

print_section "Tenant Analysis"
echo "## Tenant Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

tenant_data=$(exec_sql_formatted "SELECT id, name, status FROM tenants ORDER BY id LIMIT 10;")
echo "\`\`\`" >> "$REPORT_FILE"
echo "$tenant_data" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

print_info "Tenants: ${entity_counts[tenants]}"
echo "$tenant_data" | head -10

###############################################################################
# User Analysis
###############################################################################

print_section "User Analysis"
echo "## User Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# User role breakdown
echo "### User Roles" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

user_roles=$(exec_sql_formatted "SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC;")
echo "\`\`\`" >> "$REPORT_FILE"
echo "$user_roles" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

print_info "Total Users: ${entity_counts[users]}"
echo "$user_roles"

# Sample users
echo "### Sample Users" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

sample_users=$(exec_sql_formatted "SELECT email, role, status FROM users ORDER BY created_at LIMIT 10;")
echo "\`\`\`" >> "$REPORT_FILE"
echo "$sample_users" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

###############################################################################
# Vehicle Analysis
###############################################################################

print_section "Vehicle Analysis"
echo "## Vehicle Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Vehicle types
echo "### Vehicle Types" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

vehicle_types=$(exec_sql_formatted "SELECT vehicle_type, COUNT(*) as count FROM vehicles GROUP BY vehicle_type ORDER BY count DESC;")
echo "\`\`\`" >> "$REPORT_FILE"
echo "$vehicle_types" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

print_info "Total Vehicles: ${entity_counts[vehicles]}"
echo "$vehicle_types"

# Vehicle status
echo "### Vehicle Status" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

vehicle_status=$(exec_sql_formatted "SELECT status, COUNT(*) as count FROM vehicles GROUP BY status ORDER BY count DESC;")
echo "\`\`\`" >> "$REPORT_FILE"
echo "$vehicle_status" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Sample vehicles
echo "### Sample Vehicles" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

sample_vehicles=$(exec_sql_formatted "SELECT make, model, year, license_plate, vehicle_type, status FROM vehicles ORDER BY created_at LIMIT 10;")
echo "\`\`\`" >> "$REPORT_FILE"
echo "$sample_vehicles" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

###############################################################################
# Driver Analysis
###############################################################################

print_section "Driver Analysis"
echo "## Driver Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

print_info "Total Drivers: ${entity_counts[drivers]}"

# Sample drivers
sample_drivers=$(exec_sql_formatted "SELECT u.email, u.first_name, u.last_name, d.license_number, d.license_state FROM drivers d JOIN users u ON d.user_id = u.id ORDER BY d.created_at LIMIT 10;")
echo "\`\`\`" >> "$REPORT_FILE"
echo "$sample_drivers" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

###############################################################################
# API Health Check
###############################################################################

print_section "API Health Check"
echo "## API Health Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

api_health=$(curl -s -X GET "${API_URL}/health" 2>&1 || echo "ERROR")
if [ "$api_health" = "healthy" ] || [ "$api_health" = '{"status":"ok"}' ]; then
  print_success "API is healthy"
  echo "✓ API is healthy" >> "$REPORT_FILE"
else
  print_warning "API health check returned: $api_health"
  echo "⚠ API health check: $api_health" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

###############################################################################
# Data Quality Checks
###############################################################################

print_section "Data Quality Checks"
echo "## Data Quality Checks" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Users without email
users_no_email=$(exec_sql "SELECT COUNT(*) FROM users WHERE email IS NULL OR email = '';")
users_no_email=$(echo "$users_no_email" | tr -d ' ')
if [ "$users_no_email" = "0" ]; then
  print_success "All users have email addresses"
  echo "✓ All users have email addresses" >> "$REPORT_FILE"
else
  print_warning "$users_no_email users without email"
  echo "⚠ $users_no_email users without email" >> "$REPORT_FILE"
fi

# Vehicles without VIN
vehicles_no_vin=$(exec_sql "SELECT COUNT(*) FROM vehicles WHERE vin IS NULL OR vin = '';")
vehicles_no_vin=$(echo "$vehicles_no_vin" | tr -d ' ')
if [ "$vehicles_no_vin" = "0" ]; then
  print_success "All vehicles have VINs"
  echo "✓ All vehicles have VINs" >> "$REPORT_FILE"
else
  print_warning "$vehicles_no_vin vehicles without VIN"
  echo "⚠ $vehicles_no_vin vehicles without VIN" >> "$REPORT_FILE"
fi

# Drivers without users
orphan_drivers=$(exec_sql "SELECT COUNT(*) FROM drivers WHERE user_id NOT IN (SELECT id FROM users);")
orphan_drivers=$(echo "$orphan_drivers" | tr -d ' ')
if [ "$orphan_drivers" = "0" ]; then
  print_success "All drivers linked to users"
  echo "✓ All drivers linked to users" >> "$REPORT_FILE"
else
  print_warning "$orphan_drivers drivers without user accounts"
  echo "⚠ $orphan_drivers drivers without user accounts" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

###############################################################################
# Summary
###############################################################################

print_header "Summary"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

total_records=0
for count in "${entity_counts[@]}"; do
  if [ "$count" != "ERROR" ] && [ "$count" != "" ]; then
    total_records=$((total_records + count))
  fi
done

echo "**Total Records:** $total_records" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Core Entities:**" >> "$REPORT_FILE"
echo "- Tenants: ${entity_counts[tenants]}" >> "$REPORT_FILE"
echo "- Users: ${entity_counts[users]}" >> "$REPORT_FILE"
echo "- Drivers: ${entity_counts[drivers]}" >> "$REPORT_FILE"
echo "- Vehicles: ${entity_counts[vehicles]}" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

print_success "Total Records: $total_records"
print_info "Tenants: ${entity_counts[tenants]}"
print_info "Users: ${entity_counts[users]}"
print_info "Drivers: ${entity_counts[drivers]}"
print_info "Vehicles: ${entity_counts[vehicles]}"

echo ""
echo "Report saved to: $REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "*Generated by verify-testdata.sh on $(date)*" >> "$REPORT_FILE"

print_header "Verification Complete"
