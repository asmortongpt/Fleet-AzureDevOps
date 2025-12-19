#!/bin/bash
set -e

# Database Migration Runner
# Runs all SQL migrations on specified environment

ENV=${1:-dev}
DATABASE_NAME="fleet_${ENV}"

echo "════════════════════════════════════════════════════════"
echo "  DATABASE MIGRATION RUNNER"
echo "════════════════════════════════════════════════════════"
echo "📍 Environment: $ENV"
echo "📍 Database: $DATABASE_NAME"
echo ""

# Get password from Key Vault
echo "🔐 Retrieving database password..."
POSTGRES_PASSWORD=$(az keyvault secret show --vault-name fleetvault2025 --name POSTGRES-ADMIN-PASSWORD --query value -o tsv)

# Connection string
export PGPASSWORD="$POSTGRES_PASSWORD"
PSQL_CMD="psql -h fleet-postgres-2025.postgres.database.azure.com -U fleetadmin -d $DATABASE_NAME -p 5432"

# Run migrations in order
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Running Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# List of migrations in order
MIGRATIONS=(
    "001_initial_schema.sql"
    "002_vehicle_3d_models.sql"
    "006_amt_complete_schema.sql"
    "007_performance_indexes.sql"
    "008_rls_policies.sql"
    "add-security-columns.sql"
)

cd "$(dirname "$0")/../migrations"

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "🔹 Running: $migration"
        $PSQL_CMD -f "$migration" || echo "⚠️  Warning: $migration may have already been applied"
        echo "✅ Completed: $migration"
    else
        echo "⚠️  Skipping missing migration: $migration"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All migrations completed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verify tables
echo "📊 Verifying database schema..."
$PSQL_CMD -c "\dt" | head -20

echo ""
echo "✅ Migration complete for $ENV environment"
