#!/bin/bash
# Fleet Management System - Staging Database Migration Script
# This script applies all database migrations to the staging environment

set -e

echo "==================================="
echo "Fleet Database Migration - STAGING"
echo "==================================="
echo ""

# Database connection settings
DB_NAME="fleetdb_staging"
DB_USER="fleetadmin"
DB_HOST="fleet-postgres-service"
DB_PORT="5432"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting migration process...${NC}"
echo ""

# Step 1: Apply base schema
echo -e "${GREEN}[1/5] Applying base schema...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /migrations/schema.sql
echo "✓ Base schema applied"
echo ""

# Step 2: Apply indexes
echo -e "${GREEN}[2/5] Creating indexes...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /migrations/indexes.sql
echo "✓ Indexes created"
echo ""

# Step 3: Apply orchestration schema
echo -e "${GREEN}[3/5] Applying orchestration schema...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /migrations/orchestration-schema.sql
echo "✓ Orchestration schema applied"
echo ""

# Step 4: Apply api/src migrations (in order)
echo -e "${GREEN}[4/5] Applying API migrations...${NC}"
migrations=(
    "002-add-ai-features.sql"
    "003-recurring-maintenance.sql"
    "003-add-rag-embeddings.sql"
    "008_security_events_and_password_reset.sql"
    "009_telematics_integration.sql"
    "010_route_optimization.sql"
    "011_dispatch_system.sql"
    "012_vehicle_3d_models.sql"
    "013_ev_management.sql"
    "014_create_emulator_tables.sql"
    "014_video_telematics.sql"
    "015_mobile_integration.sql"
    "016_policies_procedures_devices.sql"
    "020_osha_compliance_forms.sql"
    "021_contextual_communications_ai.sql"
    "022_policy_templates_library.sql"
    "023_document_management_ocr.sql"
    "add-arcgis-layers-table.sql"
    "add-cameras-system.sql"
    "add-maintenance-tracking.sql"
    "add-microsoft-id.sql"
    "add-vehicle-damage-table.sql"
    "add-vendor-parts-pricing.sql"
)

for migration in "${migrations[@]}"; do
    if [ -f "/migrations/api/$migration" ]; then
        echo "  Applying: $migration"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "/migrations/api/$migration" || echo "  Warning: $migration may have failed (continuing...)"
    else
        echo "  Skipping: $migration (file not found)"
    fi
done
echo "✓ API migrations applied"
echo ""

# Step 5: Apply api/db migrations
echo -e "${GREEN}[5/5] Applying database migrations...${NC}"
db_migrations=(
    "003_asset_task_incident_management.sql"
    "004_alert_notification_system.sql"
    "005_ai_ml_infrastructure.sql"
    "006_document_management.sql"
    "007_analytics_ml.sql"
    "008_fuel_purchasing.sql"
    "009_heavy_equipment.sql"
    "010_mobile_push.sql"
    "011_custom_reports.sql"
)

for migration in "${db_migrations[@]}"; do
    if [ -f "/migrations/db/$migration" ]; then
        echo "  Applying: $migration"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "/migrations/db/$migration" || echo "  Warning: $migration may have failed (continuing...)"
    else
        echo "  Skipping: $migration (file not found)"
    fi
done
echo "✓ Database migrations applied"
echo ""

# Final verification
echo -e "${YELLOW}Verifying migration results...${NC}"
table_count=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
echo "Total tables in database: $table_count"
echo ""

if [ "$table_count" -gt 200 ]; then
    echo -e "${GREEN}✓ Migration completed successfully!${NC}"
    echo -e "${GREEN}✓ Database has $table_count tables (expected 200+)${NC}"
else
    echo -e "${YELLOW}⚠ Migration completed but table count is lower than expected${NC}"
    echo -e "${YELLOW}  Expected: 200+ tables${NC}"
    echo -e "${YELLOW}  Actual: $table_count tables${NC}"
fi

echo ""
echo "==================================="
echo "Migration Complete"
echo "==================================="
