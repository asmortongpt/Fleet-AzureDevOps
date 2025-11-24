#!/bin/bash
set -euo pipefail

# ===========================================
# Fleet Management System - Database Provisioning
# ===========================================
# This script provisions Azure PostgreSQL Flexible Server
# for production deployment with all necessary configurations.
#
# Usage:
#   ./provision-database.sh [production|staging]
#
# Environment Variables Required:
#   RESOURCE_GROUP - Azure resource group name
#   DB_SERVER_NAME - PostgreSQL server name
#   DB_ADMIN_USER - Database admin username
#   DB_ADMIN_PASSWORD - Database admin password (or will be generated)
#   LOCATION - Azure region (default: eastus)
#
# Author: Capital Tech Alliance
# Date: November 24, 2025

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_step() { echo -e "\n${BLUE}==>${NC} $1"; }

# Script header
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Fleet Management - Database Provisioning"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Environment selection
ENVIRONMENT="${1:-production}"
if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
  log_error "Invalid environment: $ENVIRONMENT"
  echo "Usage: $0 [production|staging]"
  exit 1
fi

log_info "Environment: $ENVIRONMENT"

# Configuration with defaults
RESOURCE_GROUP="${RESOURCE_GROUP:-fleet-${ENVIRONMENT}-rg}"
LOCATION="${LOCATION:-eastus}"
DB_SERVER_NAME="${DB_SERVER_NAME:-fleet-${ENVIRONMENT}-db-$(date +%s | tail -c 5)}"
DB_NAME="${DB_NAME:-fleetdb}"
DB_ADMIN_USER="${DB_ADMIN_USER:-fleetadmin}"
DB_ADMIN_PASSWORD="${DB_ADMIN_PASSWORD:-}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
GEO_REDUNDANT_BACKUP="${GEO_REDUNDANT_BACKUP:-Disabled}"
SKU_NAME="${SKU_NAME:-Standard_B2s}"
TIER="${TIER:-Burstable}"
STORAGE_SIZE_GB="${STORAGE_SIZE_GB:-32}"
POSTGRES_VERSION="${POSTGRES_VERSION:-14}"

# Generate strong password if not provided
if [[ -z "$DB_ADMIN_PASSWORD" ]]; then
  log_warn "No password provided, generating secure password..."
  DB_ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
  log_info "Password generated (will be shown at end)"
fi

echo ""
echo "Configuration:"
echo "  Resource Group:    $RESOURCE_GROUP"
echo "  Location:          $LOCATION"
echo "  Server Name:       $DB_SERVER_NAME"
echo "  Database Name:     $DB_NAME"
echo "  Admin User:        $DB_ADMIN_USER"
echo "  SKU:               $SKU_NAME ($TIER)"
echo "  Storage:           ${STORAGE_SIZE_GB}GB"
echo "  PostgreSQL:        v${POSTGRES_VERSION}"
echo "  Backup Retention:  ${BACKUP_RETENTION_DAYS} days"
echo ""

# Prerequisite checks
log_step "Step 1: Checking prerequisites..."

if ! command -v az &> /dev/null; then
  log_error "Azure CLI not installed"
  echo "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
  exit 1
fi
log_info "Azure CLI installed"

if ! az account show &> /dev/null; then
  log_error "Not logged in to Azure"
  echo "Run: az login"
  exit 1
fi
log_info "Azure CLI authenticated"

SUBSCRIPTION=$(az account show --query name -o tsv)
log_info "Active subscription: $SUBSCRIPTION"

# Resource group check/creation
log_step "Step 2: Ensuring resource group exists..."

if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
  log_info "Resource group exists: $RESOURCE_GROUP"
else
  log_warn "Creating resource group: $RESOURCE_GROUP"
  az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags Environment="$ENVIRONMENT" Project=FleetManagement CreatedBy=AutomatedScript \
    --output none
  log_info "Resource group created"
fi

# Check if server already exists
log_step "Step 3: Checking if database server exists..."

if az postgres flexible-server show --name "$DB_SERVER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
  log_warn "Database server already exists: $DB_SERVER_NAME"
  echo "Skipping creation (idempotent operation)"
  EXISTING_SERVER=true
else
  EXISTING_SERVER=false

  # Create PostgreSQL Flexible Server
  log_step "Step 4: Creating PostgreSQL Flexible Server..."
  log_info "This may take 5-10 minutes..."

  az postgres flexible-server create \
    --name "$DB_SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --admin-user "$DB_ADMIN_USER" \
    --admin-password "$DB_ADMIN_PASSWORD" \
    --sku-name "$SKU_NAME" \
    --tier "$TIER" \
    --storage-size "$STORAGE_SIZE_GB" \
    --version "$POSTGRES_VERSION" \
    --backup-retention "$BACKUP_RETENTION_DAYS" \
    --geo-redundant-backup "$GEO_REDUNDANT_BACKUP" \
    --public-access 0.0.0.0 \
    --tags Environment="$ENVIRONMENT" Project=FleetManagement \
    --yes \
    --output none

  log_info "PostgreSQL server created successfully"
fi

# Configure firewall rules
log_step "Step 5: Configuring firewall rules..."

# Allow Azure services
if ! az postgres flexible-server firewall-rule show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DB_SERVER_NAME" \
  --rule-name AllowAzureServices &> /dev/null; then

  az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER_NAME" \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none
  log_info "Firewall rule created: AllowAzureServices"
else
  log_info "Firewall rule exists: AllowAzureServices"
fi

# Allow all IPs temporarily (for initial setup)
# SECURITY NOTE: Restrict this to specific IPs in production!
if ! az postgres flexible-server firewall-rule show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DB_SERVER_NAME" \
  --rule-name AllowAll &> /dev/null; then

  log_warn "Creating temporary firewall rule: AllowAll"
  log_warn "SECURITY: Remove this rule after setup!"

  az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER_NAME" \
    --rule-name AllowAll \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 255.255.255.255 \
    --output none
  log_info "Temporary firewall rule created"
fi

# Enable PostgreSQL extensions
log_step "Step 6: Enabling PostgreSQL extensions..."

EXTENSIONS=("uuid-ossp" "pgcrypto" "postgis" "vector")

for ext in "${EXTENSIONS[@]}"; do
  log_info "Enabling extension: $ext"
done

# Enable extensions via server parameters
az postgres flexible-server parameter set \
  --resource-group "$RESOURCE_GROUP" \
  --server-name "$DB_SERVER_NAME" \
  --name azure.extensions \
  --value "uuid-ossp,pgcrypto,postgis,vector" \
  --output none

log_info "Extensions configured"

# Create database if not exists
log_step "Step 7: Creating database..."

if az postgres flexible-server db show \
  --resource-group "$RESOURCE_GROUP" \
  --server-name "$DB_SERVER_NAME" \
  --database-name "$DB_NAME" &> /dev/null; then
  log_info "Database already exists: $DB_NAME"
else
  az postgres flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$DB_SERVER_NAME" \
    --database-name "$DB_NAME" \
    --output none
  log_info "Database created: $DB_NAME"
fi

# Configure backup settings
log_step "Step 8: Configuring backup settings..."

az postgres flexible-server update \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DB_SERVER_NAME" \
  --backup-retention "$BACKUP_RETENTION_DAYS" \
  --geo-redundant-backup "$GEO_REDUNDANT_BACKUP" \
  --output none

log_info "Backup retention: ${BACKUP_RETENTION_DAYS} days"
log_info "Geo-redundant backup: $GEO_REDUNDANT_BACKUP"

# Get connection information
log_step "Step 9: Retrieving connection information..."

DB_HOST=$(az postgres flexible-server show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DB_SERVER_NAME" \
  --query fullyQualifiedDomainName -o tsv)

DB_PORT=5432

# Build connection string
CONNECTION_STRING="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

log_info "Database host: $DB_HOST"
log_info "Database port: $DB_PORT"

# Test connection
log_step "Step 10: Testing database connection..."

if command -v psql &> /dev/null; then
  if PGPASSWORD="$DB_ADMIN_PASSWORD" psql \
    -h "$DB_HOST" \
    -U "$DB_ADMIN_USER" \
    -d postgres \
    -c "SELECT version();" &> /dev/null; then
    log_info "Connection test PASSED"
  else
    log_warn "Connection test FAILED (may need to wait for server to be ready)"
  fi
else
  log_warn "psql not installed, skipping connection test"
fi

# Create output credentials file
CREDENTIALS_FILE="database-credentials-${ENVIRONMENT}.txt"

cat > "$CREDENTIALS_FILE" <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fleet Management System - Database Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment:       $ENVIRONMENT
Created:           $(date)
Resource Group:    $RESOURCE_GROUP
Server Name:       $DB_SERVER_NAME
Database Name:     $DB_NAME

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONNECTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Host:              $DB_HOST
Port:              $DB_PORT
Database:          $DB_NAME
Username:          $DB_ADMIN_USER
Password:          $DB_ADMIN_PASSWORD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONNECTION STRING (add to .env)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE_URL=$CONNECTION_STRING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PSQL COMMAND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

psql "$CONNECTION_STRING"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT VARIABLES FOR .env
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE_URL=$CONNECTION_STRING
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_ADMIN_USER
POSTGRES_PASSWORD=$DB_ADMIN_PASSWORD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Add DATABASE_URL to your .env file
2. Run database migrations: npm run migrate
3. Create initial admin user
4. Configure application to use this database
5. REMOVE the AllowAll firewall rule after setup:
   az postgres flexible-server firewall-rule delete \\
     --resource-group $RESOURCE_GROUP \\
     --name $DB_SERVER_NAME \\
     --rule-name AllowAll --yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Store this file securely (DO NOT commit to git)
- Rotate password every 90 days
- Remove AllowAll firewall rule after initial setup
- Enable Azure AD authentication for enhanced security
- Set up monitoring and alerting
- Configure automated backups (currently: ${BACKUP_RETENTION_DAYS} days)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

chmod 600 "$CREDENTIALS_FILE"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Database Provisioning Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Database Server:   $DB_SERVER_NAME"
echo "Database Name:     $DB_NAME"
echo "Connection Host:   $DB_HOST"
echo ""
echo -e "${YELLOW}Credentials saved to: $CREDENTIALS_FILE${NC}"
echo -e "${YELLOW}KEEP THIS FILE SECURE!${NC}"
echo ""
echo "Next Steps:"
echo "  1. Add DATABASE_URL to .env file"
echo "  2. Run: npm run migrate (in api directory)"
echo "  3. Create admin user"
echo "  4. Remove AllowAll firewall rule (security)"
echo ""
echo "Database URL for .env:"
echo "$CONNECTION_STRING"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
