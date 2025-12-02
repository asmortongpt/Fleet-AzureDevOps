#!/bin/bash
###############################################################################
# Fleet Management System - API Test Data Seeder (Bash Version)
#
# Creates comprehensive test data using API endpoints
# Usage: ./seed-api-testdata.sh [dev|staging|production]
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_FILE="${SCRIPT_DIR}/seed-report-${ENVIRONMENT}-$(date +%s).json"

# Environment URLs
case $ENVIRONMENT in
  production)
    BASE_URL="https://fleet.capitaltechalliance.com"
    ENV_NAME="Production"
    ;;
  staging)
    BASE_URL="https://fleet-staging.capitaltechalliance.com"
    ENV_NAME="Staging"
    ;;
  dev)
    BASE_URL="https://fleet-dev.capitaltechalliance.com"
    ENV_NAME="Development"
    ;;
  *)
    echo -e "${RED}Invalid environment: ${ENVIRONMENT}${NC}"
    echo "Usage: $0 [dev|staging|production]"
    exit 1
    ;;
esac

# Test admin credentials
ADMIN_EMAIL="testadmin@fleet.test"
ADMIN_PASSWORD="${TEST_ADMIN_PASSWORD:-TestPassword123}"
ADMIN_FIRSTNAME="Test"
ADMIN_LASTNAME="Administrator"
ADMIN_PHONE="850-555-0000"

# Counters
CREATED=0
FAILED=0

# Store JWT token
TOKEN=""
TENANT_ID=""

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

print_step() {
  echo ""
  echo -e "${YELLOW}$1${NC}"
  echo -e "${YELLOW}--------------------------------------------------------------------------------${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
  ((CREATED++))
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
  ((FAILED++))
}

print_info() {
  echo -e "${BLUE}  $1${NC}"
}

# API call wrapper
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  local url="${BASE_URL}${endpoint}"
  local headers=(-H "Content-Type: application/json")

  if [ -n "$TOKEN" ]; then
    headers+=(-H "Authorization: Bearer $TOKEN")
  fi

  local response
  local http_code

  if [ "$method" = "POST" ]; then
    if [ -n "$data" ]; then
      response=$(curl -s -w "\n%{http_code}" -X POST "$url" "${headers[@]}" -d "$data")
    else
      response=$(curl -s -w "\n%{http_code}" -X POST "$url" "${headers[@]}")
    fi
  elif [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$url" "${headers[@]}")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    print_success "$description"
    echo "$body"
    return 0
  else
    print_error "$description (HTTP $http_code)"
    echo "$body" | jq -r '.error // .message // "Unknown error"' 2>/dev/null || echo "Unknown error"
    return 1
  fi
}

###############################################################################
# Main Seeding Process
###############################################################################

print_header "Fleet Management System - API Test Data Seeder"
echo "Environment: $ENV_NAME"
echo "Base URL: $BASE_URL"
echo ""

# Step 1: Authentication
print_step "Step 1: Authentication"

# Try to login
login_response=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" 2>&1)

if echo "$login_response" | jq -e '.token' > /dev/null 2>&1; then
  TOKEN=$(echo "$login_response" | jq -r '.token')
  TENANT_ID=$(echo "$login_response" | jq -r '.user.tenant_id')
  print_success "Login successful"
  print_info "Token: ${TOKEN:0:20}..."
  print_info "Tenant ID: $TENANT_ID"
else
  print_info "Login failed. Attempting to register admin user..."

  # Register admin user
  register_response=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\":\"${ADMIN_EMAIL}\",
      \"password\":\"${ADMIN_PASSWORD}\",
      \"first_name\":\"${ADMIN_FIRSTNAME}\",
      \"last_name\":\"${ADMIN_LASTNAME}\",
      \"phone\":\"${ADMIN_PHONE}\",
      \"role\":\"admin\"
    }")

  if echo "$register_response" | jq -e '.user.id' > /dev/null 2>&1; then
    print_success "User registered: ${ADMIN_EMAIL}"

    # Now login
    login_response=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

    TOKEN=$(echo "$login_response" | jq -r '.token')
    TENANT_ID=$(echo "$login_response" | jq -r '.user.tenant_id')
    print_success "Login successful after registration"
    print_info "Token: ${TOKEN:0:20}..."
    print_info "Tenant ID: $TENANT_ID"
  else
    print_error "Failed to register admin user"
    echo "$register_response" | jq '.'
    exit 1
  fi
fi

# Step 2: Create Facilities
print_step "Step 2: Creating Facilities"

api_call POST "/api/facilities" '{
  "name": "Main Depot - Tallahassee",
  "facility_type": "headquarters",
  "address": "123 Capital Circle",
  "city": "Tallahassee",
  "state": "FL",
  "zip_code": "32301",
  "latitude": 30.4383,
  "longitude": -84.2807,
  "phone": "850-555-1000",
  "capacity": 50,
  "service_bays": 10,
  "is_active": true
}' "Facility: Main Depot - Tallahassee" > /dev/null

api_call POST "/api/facilities" '{
  "name": "Jacksonville Service Center",
  "facility_type": "service_center",
  "address": "456 Bay Street",
  "city": "Jacksonville",
  "state": "FL",
  "zip_code": "32202",
  "latitude": 30.3322,
  "longitude": -81.6557,
  "phone": "904-555-2000",
  "capacity": 30,
  "service_bays": 6,
  "is_active": true
}' "Facility: Jacksonville Service Center" > /dev/null

api_call POST "/api/facilities" '{
  "name": "Miami Distribution Hub",
  "facility_type": "distribution",
  "address": "789 Biscayne Blvd",
  "city": "Miami",
  "state": "FL",
  "zip_code": "33132",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "phone": "305-555-3000",
  "capacity": 40,
  "service_bays": 8,
  "is_active": true
}' "Facility: Miami Distribution Hub" > /dev/null

# Step 3: Create Vendors
print_step "Step 3: Creating Vendors"

api_call POST "/api/vendors" '{
  "name": "AutoZone Fleet Services",
  "vendor_type": "parts",
  "contact_name": "John Smith",
  "contact_email": "fleet@autozone.com",
  "contact_phone": "850-555-6000",
  "address": "100 Auto Plaza",
  "city": "Tallahassee",
  "state": "FL",
  "zip_code": "32301",
  "is_active": true,
  "notes": "Primary parts supplier"
}' "Vendor: AutoZone Fleet Services" > /dev/null

api_call POST "/api/vendors" '{
  "name": "Shell Fleet Fuel",
  "vendor_type": "fuel",
  "contact_name": "Robert Johnson",
  "contact_email": "fleet@shell.com",
  "contact_phone": "800-555-8000",
  "address": "300 Fuel Station Blvd",
  "city": "Miami",
  "state": "FL",
  "zip_code": "33132",
  "is_active": true,
  "notes": "Corporate fuel card program"
}' "Vendor: Shell Fleet Fuel" > /dev/null

# Step 4: Create Vehicles
print_step "Step 4: Creating Vehicles"

api_call POST "/api/vehicles" '{
  "vin": "1FTFW1ET5BFA12345",
  "license_plate": "FL-VAN-001",
  "make": "Ford",
  "model": "Transit 350",
  "year": 2023,
  "vehicle_type": "van",
  "fuel_type": "gasoline",
  "status": "active",
  "odometer": 12500,
  "purchase_date": "2023-01-15",
  "purchase_price": 42000,
  "current_value": 38000
}' "Vehicle: Ford Transit 350 (FL-VAN-001)" > /dev/null

api_call POST "/api/vehicles" '{
  "vin": "1XKYDP9X5LJ456789",
  "license_plate": "FL-SEMI-201",
  "make": "Kenworth",
  "model": "T680",
  "year": 2022,
  "vehicle_type": "semi_truck",
  "fuel_type": "diesel",
  "status": "active",
  "odometer": 145000,
  "purchase_date": "2022-01-05",
  "purchase_price": 165000,
  "current_value": 142000
}' "Vehicle: Kenworth T680 (FL-SEMI-201)" > /dev/null

api_call POST "/api/vehicles" '{
  "vin": "5YJ3E1EA1KF890123",
  "license_plate": "FL-EV-401",
  "make": "Tesla",
  "model": "Model 3",
  "year": 2024,
  "vehicle_type": "sedan",
  "fuel_type": "electric",
  "status": "active",
  "odometer": 5200,
  "purchase_date": "2024-06-01",
  "purchase_price": 48000,
  "current_value": 46000
}' "Vehicle: Tesla Model 3 (FL-EV-401)" > /dev/null

# Step 5: Create Geofences
print_step "Step 5: Creating Geofences"

api_call POST "/api/geofences" '{
  "name": "Tallahassee Main Depot",
  "description": "Primary facility geofence",
  "latitude": 30.4383,
  "longitude": -84.2807,
  "radius": 500,
  "geofence_type": "facility",
  "is_active": true
}' "Geofence: Tallahassee Main Depot" > /dev/null

api_call POST "/api/geofences" '{
  "name": "Miami Distribution Zone",
  "description": "Distribution hub zone",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "radius": 1000,
  "geofence_type": "distribution",
  "is_active": true
}' "Geofence: Miami Distribution Zone" > /dev/null

# Step 6: Create Fuel Transactions
print_step "Step 6: Creating Fuel Transactions"

api_call POST "/api/fuel-transactions" '{
  "transaction_date": "2025-11-10",
  "fuel_type": "diesel",
  "gallons": 125.5,
  "price_per_gallon": 3.89,
  "total_cost": 488.20,
  "odometer": 145234,
  "location": "Pilot Flying J - Jacksonville, FL",
  "notes": "Full tank"
}' "Fuel Transaction: 125.5 gal diesel" > /dev/null

api_call POST "/api/fuel-transactions" '{
  "transaction_date": "2025-11-11",
  "fuel_type": "gasoline",
  "gallons": 28.3,
  "price_per_gallon": 3.45,
  "total_cost": 97.64,
  "odometer": 12689,
  "location": "Shell - Tallahassee, FL",
  "notes": "Regular fuel stop"
}' "Fuel Transaction: 28.3 gal gasoline" > /dev/null

# Step 7: Create Maintenance Schedules
print_step "Step 7: Creating Maintenance Schedules"

api_call POST "/api/maintenance-schedules" '{
  "service_type": "oil_change",
  "scheduled_date": "2025-11-20",
  "interval_type": "mileage",
  "interval_value": 5000,
  "notes": "Regular oil change and filter replacement"
}' "Maintenance: Oil Change (2025-11-20)" > /dev/null

api_call POST "/api/maintenance-schedules" '{
  "service_type": "inspection",
  "scheduled_date": "2025-11-25",
  "interval_type": "time",
  "interval_value": 90,
  "notes": "Quarterly DOT inspection"
}' "Maintenance: DOT Inspection (2025-11-25)" > /dev/null

# Summary
print_header "Seeding Summary"
echo "Environment: $ENV_NAME"
echo "Base URL: $BASE_URL"
echo "Tenant ID: $TENANT_ID"
echo ""
echo -e "${GREEN}Successfully Created: $CREATED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

# Save report
cat > "$REPORT_FILE" <<EOF
{
  "environment": "$ENVIRONMENT",
  "baseUrl": "$BASE_URL",
  "tenantId": "$TENANT_ID",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "stats": {
    "created": $CREATED,
    "failed": $FAILED
  }
}
EOF

echo -e "${BLUE}Report saved to: $REPORT_FILE${NC}"
echo ""
print_header "Seeding Complete"
