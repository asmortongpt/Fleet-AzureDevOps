#!/bin/bash
set -e

echo "🗄️  Executing Database Migrations..."

# Check database connection
echo "Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Database connection failed"
    exit 1
fi

# Backup database
echo "Creating backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Execute migrations
echo "Executing add_tenant_id migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f api/migrations/20251203030620_add_tenant_id_to_tables.sql

echo "Executing performance indexes migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f api/migrations/20251203040000_add_performance_indexes.sql

echo "✅ All migrations executed successfully"
