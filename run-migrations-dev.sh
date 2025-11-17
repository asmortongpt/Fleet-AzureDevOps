#!/bin/bash
set -e

# Fleet Management System - Database Migration Runner for DEV Environment
# This script applies all migrations to the fleet-management-dev namespace

echo "=========================================="
echo "Fleet Management System - Migration Runner"
echo "Environment: DEV (fleet-management-dev)"
echo "=========================================="
echo ""

# Configuration
NAMESPACE="fleet-management-dev"
POD_NAME="fleet-postgres-0"
DB_NAME="fleetdb_dev"
DB_USER="fleetadmin"
DB_PASSWORD="DevFleet2024!Simple"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to execute SQL in the pod
execute_sql() {
    local sql_command="$1"
    local description="$2"

    echo -e "${YELLOW}Executing: ${description}${NC}"
    kubectl exec -n "$NAMESPACE" "$POD_NAME" -- psql -U "$DB_USER" -d "$DB_NAME" -c "$sql_command"
}

# Function to execute SQL file in the pod
execute_sql_file() {
    local file_path="$1"
    local description="$2"

    echo -e "${YELLOW}Applying: ${description}${NC}"
    echo -e "${YELLOW}File: ${file_path}${NC}"

    # Copy SQL file to pod and execute
    kubectl cp "$file_path" "$NAMESPACE/$POD_NAME:/tmp/migration.sql"
    kubectl exec -n "$NAMESPACE" "$POD_NAME" -- psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/migration.sql
    kubectl exec -n "$NAMESPACE" "$POD_NAME" -- rm /tmp/migration.sql

    echo -e "${GREEN}✓ Completed: ${description}${NC}"
    echo ""
}

# Function to count tables
count_tables() {
    kubectl exec -n "$NAMESPACE" "$POD_NAME" -- psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | xargs
}

# Check if pod exists
echo "Checking PostgreSQL pod status..."
if ! kubectl get pod "$POD_NAME" -n "$NAMESPACE" &> /dev/null; then
    echo -e "${RED}Error: Pod $POD_NAME not found in namespace $NAMESPACE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL pod found${NC}"
echo ""

# Get initial table count
echo "Checking current database state..."
INITIAL_COUNT=$(count_tables)
echo -e "${YELLOW}Current table count: ${INITIAL_COUNT}${NC}"
echo ""

# Create migrations tracking table
echo "Creating migrations tracking table..."
execute_sql "CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64)
);" "Schema migrations tracking table"
echo ""

# Migration counter
MIGRATIONS_APPLIED=0

# Step 1: Apply base schema
echo "=========================================="
echo "STEP 1: Applying Base Schema"
echo "=========================================="
if [ -f "/Users/andrewmorton/Documents/GitHub/Fleet/database/schema.sql" ]; then
    execute_sql_file "/Users/andrewmorton/Documents/GitHub/Fleet/database/schema.sql" "Base Schema (schema.sql)"
    execute_sql "INSERT INTO schema_migrations (migration_name) VALUES ('000_base_schema') ON CONFLICT (migration_name) DO NOTHING;" "Track base schema"
    ((MIGRATIONS_APPLIED++))
else
    echo -e "${YELLOW}Warning: Base schema file not found, skipping...${NC}"
fi

# Step 2: Apply database/migrations (if exists)
echo "=========================================="
echo "STEP 2: Applying Database Migrations"
echo "=========================================="
if [ -d "/Users/andrewmorton/Documents/GitHub/Fleet/database/migrations" ]; then
    for migration in /Users/andrewmorton/Documents/GitHub/Fleet/database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            filename=$(basename "$migration")

            # Check if migration already applied
            already_applied=$(kubectl exec -n "$NAMESPACE" "$POD_NAME" -- psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = 'db_$filename';" | xargs)

            if [ "$already_applied" -eq 0 ]; then
                execute_sql_file "$migration" "Database Migration: $filename"
                execute_sql "INSERT INTO schema_migrations (migration_name) VALUES ('db_$filename');" "Track migration: $filename"
                ((MIGRATIONS_APPLIED++))
            else
                echo -e "${GREEN}✓ Already applied: $filename${NC}"
            fi
        fi
    done
else
    echo -e "${YELLOW}No database/migrations directory found${NC}"
fi
echo ""

# Step 3: Apply api/src/migrations
echo "=========================================="
echo "STEP 3: Applying API Migrations"
echo "=========================================="
if [ -d "/Users/andrewmorton/Documents/GitHub/Fleet/api/src/migrations" ]; then
    # Sort migrations numerically
    for migration in $(ls -v /Users/andrewmorton/Documents/GitHub/Fleet/api/src/migrations/*.sql 2>/dev/null); do
        if [ -f "$migration" ]; then
            filename=$(basename "$migration")

            # Check if migration already applied
            already_applied=$(kubectl exec -n "$NAMESPACE" "$POD_NAME" -- psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = 'api_$filename';" | xargs)

            if [ "$already_applied" -eq 0 ]; then
                execute_sql_file "$migration" "API Migration: $filename"
                execute_sql "INSERT INTO schema_migrations (migration_name) VALUES ('api_$filename');" "Track migration: $filename"
                ((MIGRATIONS_APPLIED++))
            else
                echo -e "${GREEN}✓ Already applied: $filename${NC}"
            fi
        fi
    done
else
    echo -e "${YELLOW}No api/src/migrations directory found${NC}"
fi
echo ""

# Step 4: Apply api/db/migrations
echo "=========================================="
echo "STEP 4: Applying API DB Migrations"
echo "=========================================="
if [ -d "/Users/andrewmorton/Documents/GitHub/Fleet/api/db/migrations" ]; then
    for migration in $(ls -v /Users/andrewmorton/Documents/GitHub/Fleet/api/db/migrations/*.sql 2>/dev/null); do
        if [ -f "$migration" ]; then
            filename=$(basename "$migration")

            # Check if migration already applied
            already_applied=$(kubectl exec -n "$NAMESPACE" "$POD_NAME" -- psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = 'api_db_$filename';" | xargs)

            if [ "$already_applied" -eq 0 ]; then
                execute_sql_file "$migration" "API DB Migration: $filename"
                execute_sql "INSERT INTO schema_migrations (migration_name) VALUES ('api_db_$filename');" "Track migration: $filename"
                ((MIGRATIONS_APPLIED++))
            else
                echo -e "${GREEN}✓ Already applied: $filename${NC}"
            fi
        fi
    done
else
    echo -e "${YELLOW}No api/db/migrations directory found${NC}"
fi
echo ""

# Step 5: Apply indexes
echo "=========================================="
echo "STEP 5: Applying Database Indexes"
echo "=========================================="
if [ -f "/Users/andrewmorton/Documents/GitHub/Fleet/database/indexes.sql" ]; then
    already_applied=$(kubectl exec -n "$NAMESPACE" "$POD_NAME" -- psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '999_indexes';" | xargs)

    if [ "$already_applied" -eq 0 ]; then
        execute_sql_file "/Users/andrewmorton/Documents/GitHub/Fleet/database/indexes.sql" "Database Indexes"
        execute_sql "INSERT INTO schema_migrations (migration_name) VALUES ('999_indexes');" "Track indexes"
        ((MIGRATIONS_APPLIED++))
    else
        echo -e "${GREEN}✓ Indexes already applied${NC}"
    fi
else
    echo -e "${YELLOW}No indexes.sql file found${NC}"
fi
echo ""

# Get final table count
FINAL_COUNT=$(count_tables)

# Display summary
echo "=========================================="
echo "MIGRATION SUMMARY"
echo "=========================================="
echo -e "Tables before:         ${YELLOW}${INITIAL_COUNT}${NC}"
echo -e "Tables after:          ${GREEN}${FINAL_COUNT}${NC}"
echo -e "Migrations applied:    ${GREEN}${MIGRATIONS_APPLIED}${NC}"
echo -e "Tables added:          ${GREEN}$((FINAL_COUNT - INITIAL_COUNT))${NC}"
echo ""

# List all migrations applied
echo "Applied migrations:"
kubectl exec -n "$NAMESPACE" "$POD_NAME" -- psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT migration_name, applied_at FROM schema_migrations ORDER BY applied_at;"
echo ""

# List all tables
echo "All tables in database:"
kubectl exec -n "$NAMESPACE" "$POD_NAME" -- psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
echo ""

if [ "$FINAL_COUNT" -gt 200 ]; then
    echo -e "${GREEN}✓✓✓ MIGRATION SUCCESSFUL ✓✓✓${NC}"
    echo -e "${GREEN}Database has $FINAL_COUNT tables (target: 200+)${NC}"
else
    echo -e "${YELLOW}⚠ WARNING: Expected 200+ tables, got $FINAL_COUNT${NC}"
    echo -e "${YELLOW}Some migrations may have failed or been skipped${NC}"
fi

echo ""
echo "Migration process completed!"
echo "=========================================="
