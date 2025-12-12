#!/bin/bash
# Apply Row-Level Security Migration
#
# This script applies RLS policies to the database in a safe manner.
# It checks for required tools, validates connections, and provides clear feedback.
#
# Usage:
#   ./apply-rls.sh
#
# Environment Variables:
#   DB_HOST - Database host (default: localhost)
#   DB_PORT - Database port (default: 5432)
#   DB_NAME - Database name (default: fleet_db)
#   DB_USER - Database user (default: postgres)
#   DB_PASSWORD - Database password (optional, can also be set via PGPASSWORD)

# Default values for database connection
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-fleet_db}
DB_USER=${DB_USER:-postgres}

# Print header information
echo "🔐 Applying Row-Level Security Migration..."
echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo "User: $DB_USER"

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "❌ Error: psql not found. Please install PostgreSQL client."
  exit 1
fi

# Test database connection
echo "🔍 Testing database connection..."
PGPASSWORD=${DB_PASSWORD:-} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to connect to database. Check connection parameters or ensure database is running."
  echo "   Host: $DB_HOST:$DB_PORT"
  echo "   Database: $DB_NAME"
  echo "   User: $DB_USER"
  exit 1
fi

# Determine the path to the SQL file (assuming it's in the same directory as the script)
SQL_FILE="$(dirname "$0")/006_enable_rls.sql"

# Check if the SQL file exists
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: RLS migration file not found at $SQL_FILE"
  exit 1
fi

# Apply migration with error handling
echo "🚀 Applying RLS migration..."
PGPASSWORD=${DB_PASSWORD:-} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE" 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Success: RLS migration applied successfully"
  exit 0
else
  echo "❌ Error: RLS migration failed. Check the output above for details."
  exit 1
fi