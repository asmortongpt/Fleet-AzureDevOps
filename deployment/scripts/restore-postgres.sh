#!/bin/bash
# PostgreSQL Restore Script for CTAFleet
# This script restores an encrypted backup from Azure Blob Storage or local file

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
RESTORE_DIR="/tmp/restore"

# Database credentials from environment
DB_HOST="${POSTGRES_HOST:-postgres-service}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-fleetdb}"
DB_USER="${POSTGRES_USER}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Azure Blob Storage configuration
AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT}"
AZURE_STORAGE_KEY="${AZURE_STORAGE_KEY}"
AZURE_CONTAINER="database-backups"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Usage information
usage() {
    echo "Usage: $0 <backup-file-or-timestamp>"
    echo ""
    echo "Examples:"
    echo "  $0 fleet_backup_20250115_120000.sql.gz.gpg    # Restore from local file"
    echo "  $0 20250115_120000                             # Download from Azure and restore"
    echo "  $0 latest                                       # Restore the latest backup from Azure"
    echo ""
    echo "WARNING: This will drop and recreate the database!"
    exit 1
}

# Check arguments
if [ $# -eq 0 ]; then
    usage
fi

BACKUP_IDENTIFIER="$1"

log "Starting PostgreSQL restore process..."

# Create restore directory
mkdir -p "${RESTORE_DIR}"

# Determine backup file
if [ "${BACKUP_IDENTIFIER}" == "latest" ]; then
    log "Fetching latest backup from Azure..."
    BACKUP_FILE=$(az storage blob list \
        --account-name "${AZURE_STORAGE_ACCOUNT}" \
        --account-key "${AZURE_STORAGE_KEY}" \
        --container-name "${AZURE_CONTAINER}" \
        --query "max_by([], &properties.createdOn).name" \
        --output tsv)

    if [ -z "${BACKUP_FILE}" ]; then
        log "ERROR: No backups found in Azure"
        exit 1
    fi

    log "Latest backup: ${BACKUP_FILE}"

elif [ -f "${BACKUP_DIR}/${BACKUP_IDENTIFIER}" ]; then
    BACKUP_FILE="${BACKUP_IDENTIFIER}"
    log "Using local backup file: ${BACKUP_FILE}"

elif [ -f "${BACKUP_IDENTIFIER}" ]; then
    BACKUP_FILE=$(basename "${BACKUP_IDENTIFIER}")
    cp "${BACKUP_IDENTIFIER}" "${BACKUP_DIR}/${BACKUP_FILE}"
    log "Using backup file: ${BACKUP_FILE}"

else
    # Try to download from Azure
    BACKUP_FILE="fleet_backup_${BACKUP_IDENTIFIER}.sql.gz.gpg"
    log "Downloading backup from Azure: ${BACKUP_FILE}"

    if az storage blob download \
        --account-name "${AZURE_STORAGE_ACCOUNT}" \
        --account-key "${AZURE_STORAGE_KEY}" \
        --container-name "${AZURE_CONTAINER}" \
        --name "${BACKUP_FILE}" \
        --file "${BACKUP_DIR}/${BACKUP_FILE}"; then
        log "Backup downloaded successfully"
    else
        log "ERROR: Failed to download backup from Azure"
        exit 1
    fi
fi

# Verify backup file exists
if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    log "ERROR: Backup file not found: ${BACKUP_DIR}/${BACKUP_FILE}"
    exit 1
fi

# Decrypt backup
log "Decrypting backup file..."
DECRYPTED_FILE="${RESTORE_DIR}/$(basename ${BACKUP_FILE} .gpg)"

if gpg --decrypt --output "${DECRYPTED_FILE}" "${BACKUP_DIR}/${BACKUP_FILE}"; then
    log "Backup decrypted successfully"
else
    log "ERROR: Failed to decrypt backup file"
    exit 1
fi

# Verify decrypted file
if [ ! -s "${DECRYPTED_FILE}" ]; then
    log "ERROR: Decrypted file is empty"
    exit 1
fi

log "Decrypted file size: $(du -h ${DECRYPTED_FILE} | cut -f1)"

# Confirmation prompt
read -p "WARNING: This will DROP and RECREATE the database '${DB_NAME}'. Continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
fi

# Set PostgreSQL password
export PGPASSWORD="${DB_PASSWORD}"

# Terminate existing connections
log "Terminating existing database connections..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres <<SQL
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${DB_NAME}'
AND pid <> pg_backend_pid();
SQL

# Drop existing database
log "Dropping existing database..."
if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres \
    -c "DROP DATABASE IF EXISTS ${DB_NAME};"; then
    log "Database dropped successfully"
else
    log "ERROR: Failed to drop database"
    exit 1
fi

# Create new database
log "Creating new database..."
if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres \
    -c "CREATE DATABASE ${DB_NAME} WITH ENCODING='UTF8';"; then
    log "Database created successfully"
else
    log "ERROR: Failed to create database"
    exit 1
fi

# Restore database
log "Restoring database from backup..."
if pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose \
    --no-owner \
    --no-acl \
    "${DECRYPTED_FILE}"; then
    log "Database restored successfully"
else
    log "ERROR: Database restore failed"
    exit 1
fi

# Verify restore
log "Verifying database restore..."
TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

log "Restored ${TABLE_COUNT} tables"

if [ "${TABLE_COUNT}" -eq 0 ]; then
    log "WARNING: No tables found in restored database"
else
    log "Database restore verified successfully"
fi

# Clean up
log "Cleaning up temporary files..."
rm -f "${DECRYPTED_FILE}"

log "Restore completed successfully!"
log "Database: ${DB_NAME}"
log "Restored from: ${BACKUP_FILE}"

# Send notification
if [ -n "${RESTORE_WEBHOOK_URL:-}" ]; then
    curl -X POST "${RESTORE_WEBHOOK_URL}" \
        -H "Content-Type: application/json" \
        -d "{\"status\":\"success\",\"database\":\"${DB_NAME}\",\"backup_file\":\"${BACKUP_FILE}\"}" \
        || log "WARNING: Failed to send restore notification"
fi

exit 0
