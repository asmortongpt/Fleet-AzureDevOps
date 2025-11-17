#!/bin/bash
#
# Capital Tech Alliance - Staging Database Population Script
# This script populates the staging database with realistic data
#
# Usage: ./seed_staging.sh [database_url]
#
# If database_url is not provided, it will use the DATABASE_URL environment variable
# Example: ./seed_staging.sh "postgresql://user:password@host:5432/fleetdb"
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Capital Tech Alliance - Staging DB Seed${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get database URL
if [ -n "$1" ]; then
    DATABASE_URL="$1"
elif [ -n "$DATABASE_URL" ]; then
    DATABASE_URL="$DATABASE_URL"
else
    echo -e "${RED}Error: No database URL provided${NC}"
    echo "Usage: $0 [database_url]"
    echo "Or set DATABASE_URL environment variable"
    exit 1
fi

echo -e "${YELLOW}Database URL: ${DATABASE_URL}${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo -e "${YELLOW}Step 1: Testing database connection...${NC}"
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 2: Applying schema (if needed)...${NC}"
if [ -f "$SCRIPT_DIR/schema.sql" ]; then
    echo "Applying schema.sql..."
    psql "$DATABASE_URL" -f "$SCRIPT_DIR/schema.sql" > /dev/null
    echo -e "${GREEN}✓ Schema applied${NC}"
else
    echo -e "${YELLOW}⚠ schema.sql not found, skipping...${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Populating data - Part 1 (Tenant, Users, Facilities, Drivers)...${NC}"
psql "$DATABASE_URL" -f "$SCRIPT_DIR/seed_capital_tech_alliance.sql"
echo -e "${GREEN}✓ Part 1 complete${NC}"
echo ""

echo -e "${YELLOW}Step 4: Populating data - Part 2 (Vehicles)...${NC}"
psql "$DATABASE_URL" -f "$SCRIPT_DIR/seed_capital_tech_alliance_part2.sql"
echo -e "${GREEN}✓ Part 2 complete${NC}"
echo ""

echo -e "${YELLOW}Step 5: Populating data - Part 3 (Operations, Maintenance, Transactions)...${NC}"
psql "$DATABASE_URL" -f "$SCRIPT_DIR/seed_capital_tech_alliance_part3.sql"
echo -e "${GREEN}✓ Part 3 complete${NC}"
echo ""

echo -e "${YELLOW}Step 6: Verifying data...${NC}"
echo "Counting records..."

# Count records in key tables
TENANT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM tenants WHERE name = 'Capital Tech Alliance';")
USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001';")
VEHICLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM vehicles WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001';")
DRIVER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM drivers WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001';")
FACILITY_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM facilities WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001';")

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}        Data Population Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Capital Tech Alliance - Record Summary:"
echo "  Tenants:    $TENANT_COUNT"
echo "  Users:      $USER_COUNT"
echo "  Vehicles:   $VEHICLE_COUNT"
echo "  Drivers:    $DRIVER_COUNT"
echo "  Facilities: $FACILITY_COUNT"
echo ""
echo -e "${GREEN}✓ Staging database successfully populated!${NC}"
echo ""
echo "Login credentials:"
echo "  Admin: admin@capitaltechalliance.com"
echo "  Password: Admin123!"
echo ""
