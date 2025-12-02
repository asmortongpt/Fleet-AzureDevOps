#!/bin/bash
# Fleet Management System - Database Backup Script
# Automated PostgreSQL backup with Azure Blob Storage upload

set -e

# Configuration
BACKUP_DIR="/var/backups/fleet-postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="fleet_backup_${DATE}.sql.gz"
RETENTION_DAYS=30

# Database connection (from Kubernetes secrets)
DB_HOST="${DB_HOST:-fleet-postgres-service.fleet-management.svc.cluster.local}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-fleetdb}"
DB_USER="${DB_USER:-fleetuser}"
DB_PASSWORD="${DB_PASSWORD}"

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT}"
AZURE_STORAGE_CONTAINER="${AZURE_STORAGE_CONTAINER:-fleet-backups}"
AZURE_STORAGE_KEY="${AZURE_STORAGE_KEY}"

# Email notification
SMTP_HOST="${SMTP_HOST:-smtp.office365.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-sara@capitaltechalliance.com}"
SMTP_PASSWORD="${SMTP_PASSWORD}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-admin@capitaltechalliance.com}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "=========================================="
echo "Fleet Database Backup - $(date)"
echo "=========================================="

# Perform backup
echo "Starting PostgreSQL dump..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-acl \
  --verbose \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "✅ Backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Verify backup integrity
echo "Verifying backup integrity..."
if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}"; then
  echo "✅ Backup file integrity verified"
else
  echo "❌ Backup file is corrupted!"
  exit 1
fi

# Upload to Azure Blob Storage
if [ -n "${AZURE_STORAGE_ACCOUNT}" ]; then
  echo "Uploading to Azure Blob Storage..."
  az storage blob upload \
    --account-name "${AZURE_STORAGE_ACCOUNT}" \
    --account-key "${AZURE_STORAGE_KEY}" \
    --container-name "${AZURE_STORAGE_CONTAINER}" \
    --name "${BACKUP_FILE}" \
    --file "${BACKUP_DIR}/${BACKUP_FILE}" \
    --tier Hot
  echo "✅ Uploaded to Azure: ${AZURE_STORAGE_CONTAINER}/${BACKUP_FILE}"
fi

# Clean up old local backups
echo "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "fleet_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "✅ Old backups cleaned up"

# Send email notification
if [ -n "${NOTIFICATION_EMAIL}" ]; then
  echo "Sending notification email..."
  
  EMAIL_BODY="Fleet Database Backup Completed Successfully

Date: $(date)
Backup File: ${BACKUP_FILE}
Size: ${BACKUP_SIZE}
Location: ${AZURE_STORAGE_CONTAINER}/${BACKUP_FILE}
Retention: ${RETENTION_DAYS} days

Database: ${DB_NAME}
Host: ${DB_HOST}

This is an automated notification from the Fleet Management System backup service.
"
  
  # Send via SMTP (requires mailx or similar)
  echo "${EMAIL_BODY}" | mail -s "Fleet Backup Success - ${DATE}" \
    -S smtp="${SMTP_HOST}:${SMTP_PORT}" \
    -S smtp-use-starttls \
    -S smtp-auth=login \
    -S smtp-auth-user="${SMTP_USER}" \
    -S smtp-auth-password="${SMTP_PASSWORD}" \
    -S from="${SMTP_USER}" \
    "${NOTIFICATION_EMAIL}" 2>/dev/null || echo "⚠️ Email notification failed (non-critical)"
fi

echo "=========================================="
echo "Backup Summary:"
echo "  File: ${BACKUP_FILE}"
echo "  Size: ${BACKUP_SIZE}"
echo "  Local: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "  Cloud: ${AZURE_STORAGE_CONTAINER}/${BACKUP_FILE}"
echo "=========================================="
echo "✅ Backup process completed successfully!"

exit 0
