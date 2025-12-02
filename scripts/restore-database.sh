#!/bin/bash
# Fleet Management System - Database Restore Script
# Interactive PostgreSQL database restoration

set -e

# Configuration
BACKUP_DIR="/var/backups/fleet-postgres"
DB_HOST="${DB_HOST:-fleet-postgres-service.fleet-management.svc.cluster.local}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-fleetdb}"
DB_USER="${DB_USER:-fleetuser}"
DB_PASSWORD="${DB_PASSWORD}"

echo "=========================================="
echo "Fleet Database Restore Utility"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo ""

# List available backups
echo "Available backups:"
echo ""
ls -lh "${BACKUP_DIR}"/fleet_backup_*.sql.gz | awk '{print $9, "(" $5 ")"}'
echo ""

# Prompt for backup file
read -p "Enter backup filename to restore (or 'latest' for most recent): " BACKUP_FILE

if [ "${BACKUP_FILE}" = "latest" ]; then
  BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/fleet_backup_*.sql.gz | head -1)
  echo "Selected latest backup: ${BACKUP_FILE}"
else
  BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

# Verify file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# Verify backup integrity
echo "Verifying backup integrity..."
if ! gunzip -t "${BACKUP_FILE}"; then
  echo "❌ Error: Backup file is corrupted!"
  exit 1
fi
echo "✅ Backup file integrity verified"

# Final confirmation
read -p "Are you ABSOLUTELY SURE you want to restore? (type 'YES' to confirm): " CONFIRM
if [ "${CONFIRM}" != "YES" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Create backup of current database before restore
echo "Creating safety backup of current database..."
SAFETY_BACKUP="${BACKUP_DIR}/pre_restore_safety_$(date +%Y%m%d_%H%M%S).sql.gz"
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=plain \
  | gzip > "${SAFETY_BACKUP}"
echo "✅ Safety backup created: ${SAFETY_BACKUP}"

# Perform restore
echo "Starting database restore..."
echo "This may take several minutes..."

# Drop existing connections
PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
  || echo "⚠️ Could not terminate connections (non-critical)"

# Drop and recreate database
echo "Dropping and recreating database..."
PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS ${DB_NAME};"

PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d postgres \
  -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

# Restore from backup
echo "Restoring database from backup..."
gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --single-transaction

echo "✅ Database restored successfully!"

# Verify restore
echo "Verifying restore..."
TABLE_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "Tables found: ${TABLE_COUNT}"

if [ "${TABLE_COUNT}" -gt 0 ]; then
  echo "✅ Restore verification passed"
else
  echo "❌ Warning: No tables found after restore!"
fi

echo "=========================================="
echo "Restore Summary:"
echo "  Source: ${BACKUP_FILE}"
echo "  Database: ${DB_NAME}"
echo "  Tables: ${TABLE_COUNT}"
echo "  Safety backup: ${SAFETY_BACKUP}"
echo "=========================================="
echo "✅ Restore completed!"
echo ""
echo "IMPORTANT: Restart application services to reconnect to database:"
echo "  kubectl rollout restart deployment/fleet-api -n fleet-management"

exit 0
