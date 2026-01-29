#!/bin/bash
# ============================================================================
# Run Missing Tables Migration
# ============================================================================
# This script safely runs the comprehensive missing tables migration
# Location: Fleet-CTA/run-missing-tables-migration.sh
# ============================================================================

set -e  # Exit on error

echo "============================================================"
echo "Fleet-CTA: Missing Tables Migration"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get database URL from environment
if [ -f "api/.env" ]; then
    export $(cat api/.env | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not found${NC}"
    echo "Please set DATABASE_URL in api/.env"
    exit 1
fi

echo -e "${GREEN}✓${NC} Database URL found"
echo ""

# Check if PostgreSQL is accessible
echo "Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${RED}✗${NC} Database connection failed"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if PostgreSQL is running: docker ps | grep postgres"
    echo "  2. Start PostgreSQL: docker start fleet-postgres"
    echo "  3. Verify DATABASE_URL in api/.env"
    exit 1
fi

echo ""
echo "============================================================"
echo "Migration File:"
echo "  api/src/migrations/999_missing_tables_comprehensive.sql"
echo ""
echo "This will create the following tables:"
echo "  • quality_gates"
echo "  • teams"
echo "  • team_members"
echo "  • cost_analysis"
echo "  • billing_reports"
echo "  • mileage_reimbursement"
echo "  • personal_use_data"
echo "============================================================"
echo ""

# Prompt for confirmation
read -p "Proceed with migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "Running migration..."
echo ""

# Run the migration
if psql "$DATABASE_URL" -f api/src/migrations/999_missing_tables_comprehensive.sql; then
    echo ""
    echo -e "${GREEN}✓ Migration completed successfully${NC}"
    echo ""

    # Verify tables were created
    echo "Verifying tables..."
    TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('quality_gates', 'teams', 'team_members', 'cost_analysis', 'billing_reports', 'mileage_reimbursement', 'personal_use_data')")

    if [ "$TABLE_COUNT" -eq 7 ]; then
        echo -e "${GREEN}✓ All 7 tables created successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: Expected 7 tables, found $TABLE_COUNT${NC}"
        echo "  Check for pre-existing tables or migration errors"
    fi

    echo ""
    echo "============================================================"
    echo "Next Steps:"
    echo "============================================================"
    echo "  1. Restart the API server: cd api && npm run dev"
    echo "  2. View health report: http://localhost:3000/api/health/startup"
    echo "  3. Check server console for startup health check results"
    echo ""
    echo "To view created tables:"
    echo "  psql \$DATABASE_URL -c \"\\dt\""
    echo ""
    echo "To inspect a specific table:"
    echo "  psql \$DATABASE_URL -c \"\\d quality_gates\""
    echo ""

else
    echo ""
    echo -e "${RED}✗ Migration failed${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Tables may already exist (run DROP TABLE IF EXISTS first)"
    echo "  2. Missing dependencies (users, tenants, facilities tables)"
    echo "  3. Permission issues (check database user permissions)"
    echo ""
    echo "To view error details, run manually:"
    echo "  psql \$DATABASE_URL -f api/src/migrations/999_missing_tables_comprehensive.sql"
    echo ""
    exit 1
fi

echo "============================================================"
echo "Migration Complete"
echo "============================================================"
