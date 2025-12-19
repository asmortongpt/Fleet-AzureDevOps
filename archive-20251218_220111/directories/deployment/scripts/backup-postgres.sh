#!/bin/bash
# PostgreSQL Backup Script for CTAFleet
# This script creates encrypted backups and uploads them to Azure Blob Storage

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="fleet_backup_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
RETENTION_DAYS=30

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

# GPG encryption key (should be stored in Azure Key Vault)
GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:-backup@ctafleet.com}"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${BACKUP_DIR}/backup.log"
}

log "Starting PostgreSQL backup..."

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Set PostgreSQL password for non-interactive execution
export PGPASSWORD="${DB_PASSWORD}"

# Perform the backup
log "Creating database dump..."
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="${BACKUP_DIR}/${BACKUP_FILE}" 2>&1 | tee -a "${BACKUP_DIR}/backup.log"; then
    log "Database dump created successfully: ${BACKUP_FILE}"
else
    log "ERROR: Database dump failed!"
    exit 1
fi

# Get backup file size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log "Backup file size: ${BACKUP_SIZE}"

# Encrypt the backup
log "Encrypting backup file..."
if gpg --encrypt --recipient "${GPG_RECIPIENT}" \
    --trust-model always \
    --output "${BACKUP_DIR}/${ENCRYPTED_FILE}" \
    "${BACKUP_DIR}/${BACKUP_FILE}"; then
    log "Backup encrypted successfully"
    rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
else
    log "ERROR: Backup encryption failed!"
    exit 1
fi

# Calculate checksums
MD5_SUM=$(md5sum "${BACKUP_DIR}/${ENCRYPTED_FILE}" | awk '{print $1}')
SHA256_SUM=$(sha256sum "${BACKUP_DIR}/${ENCRYPTED_FILE}" | awk '{print $1}')
log "MD5: ${MD5_SUM}"
log "SHA256: ${SHA256_SUM}"

# Upload to Azure Blob Storage
log "Uploading backup to Azure Blob Storage..."
if command -v az &> /dev/null; then
    # Using Azure CLI
    if az storage blob upload \
        --account-name "${AZURE_STORAGE_ACCOUNT}" \
        --account-key "${AZURE_STORAGE_KEY}" \
        --container-name "${AZURE_CONTAINER}" \
        --name "${ENCRYPTED_FILE}" \
        --file "${BACKUP_DIR}/${ENCRYPTED_FILE}" \
        --metadata "timestamp=${TIMESTAMP}" "md5=${MD5_SUM}" "sha256=${SHA256_SUM}" \
        --tier Hot; then
        log "Backup uploaded successfully to Azure"
    else
        log "ERROR: Failed to upload backup to Azure"
        exit 1
    fi
else
    log "WARNING: Azure CLI not found, skipping cloud upload"
fi

# Create backup manifest
cat > "${BACKUP_DIR}/manifest_${TIMESTAMP}.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "filename": "${ENCRYPTED_FILE}",
  "size": "${BACKUP_SIZE}",
  "md5": "${MD5_SUM}",
  "sha256": "${SHA256_SUM}",
  "database": "${DB_NAME}",
  "encrypted": true,
  "retention_days": ${RETENTION_DAYS}
}
EOF

# Clean up old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "fleet_backup_*.gpg" -type f -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "manifest_*.json" -type f -mtime +${RETENTION_DAYS} -delete

# Clean up old backups from Azure
if command -v az &> /dev/null; then
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    az storage blob list \
        --account-name "${AZURE_STORAGE_ACCOUNT}" \
        --account-key "${AZURE_STORAGE_KEY}" \
        --container-name "${AZURE_CONTAINER}" \
        --query "[?properties.createdOn<'${CUTOFF_DATE}'].name" \
        --output tsv | while read -r blob; do
            log "Deleting old backup from Azure: ${blob}"
            az storage blob delete \
                --account-name "${AZURE_STORAGE_ACCOUNT}" \
                --account-key "${AZURE_STORAGE_KEY}" \
                --container-name "${AZURE_CONTAINER}" \
                --name "${blob}"
        done
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gpg --decrypt --quiet "${BACKUP_DIR}/${ENCRYPTED_FILE}" > /dev/null 2>&1; then
    log "Backup integrity verified successfully"
else
    log "ERROR: Backup integrity verification failed!"
    exit 1
fi

log "Backup completed successfully!"
log "Backup file: ${ENCRYPTED_FILE}"
log "Location: ${BACKUP_DIR}/${ENCRYPTED_FILE}"

# Send notification (optional)
if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
    curl -X POST "${BACKUP_WEBHOOK_URL}" \
        -H "Content-Type: application/json" \
        -d "{\"status\":\"success\",\"timestamp\":\"${TIMESTAMP}\",\"file\":\"${ENCRYPTED_FILE}\",\"size\":\"${BACKUP_SIZE}\"}" \
        || log "WARNING: Failed to send backup notification"
fi

exit 0
