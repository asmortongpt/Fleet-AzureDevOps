#!/bin/bash
# ============================================================================
# Secret Migration Script: Environment Variables → Azure Key Vault
# ============================================================================
# This script migrates secrets from .env files to Azure Key Vault
# Following FedRAMP SC-28, SOC 2 CC6.1 (Encryption at Rest)
#
# Usage:
#   ./migrate-secrets-to-keyvault.sh [environment]
#
# Arguments:
#   environment - Optional: production, staging, dev (default: production)
#
# Prerequisites:
#   - Azure CLI installed and authenticated (az login)
#   - Appropriate permissions on target Key Vault
#   - .env file exists with secrets to migrate
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# CONFIGURATION
# ============================================================================

ENVIRONMENT="${1:-production}"

case "$ENVIRONMENT" in
  production)
    VAULT_NAME="fleet-secrets-0d326d71"
    RESOURCE_GROUP="fleet-production-rg"
    SECRETS_FILE="../.env.production"
    ;;
  staging)
    VAULT_NAME="fleet-staging-5e7dd5b7"
    RESOURCE_GROUP="fleet-staging-rg"
    SECRETS_FILE="../.env.staging"
    ;;
  dev)
    VAULT_NAME="fleet-secrets-dev-437bc9"
    RESOURCE_GROUP="fleet-dev-rg"
    SECRETS_FILE="../.env.development"
    ;;
  *)
    echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'${NC}"
    echo "Usage: $0 [production|staging|dev]"
    exit 1
    ;;
esac

# ============================================================================
# VALIDATION
# ============================================================================

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Secret Migration to Azure Key Vault${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "Environment:     ${GREEN}$ENVIRONMENT${NC}"
echo -e "Key Vault:       ${GREEN}$VAULT_NAME${NC}"
echo -e "Resource Group:  ${GREEN}$RESOURCE_GROUP${NC}"
echo -e "Secrets File:    ${GREEN}$SECRETS_FILE${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is not installed${NC}"
  echo "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  exit 1
fi

# Check if authenticated
if ! az account show &> /dev/null; then
  echo -e "${RED}Error: Not authenticated with Azure${NC}"
  echo "Run: az login"
  exit 1
fi

# Check if Key Vault exists
if ! az keyvault show --name "$VAULT_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
  echo -e "${RED}Error: Key Vault '$VAULT_NAME' not found${NC}"
  exit 1
fi

# Check if secrets file exists
if [ ! -f "$SECRETS_FILE" ]; then
  echo -e "${YELLOW}Warning: Secrets file '$SECRETS_FILE' not found${NC}"
  echo "Available .env files:"
  find .. -maxdepth 1 -name ".env*" -type f
  exit 1
fi

# ============================================================================
# SECRET CATEGORIES
# ============================================================================

# Secrets that should NEVER be migrated (local development only)
EXCLUDED_SECRETS=(
  "NODE_ENV"
  "PORT"
  "LOG_LEVEL"
  "REDIS_HOST"
  "REDIS_PORT"
)

# Critical secrets that must exist
CRITICAL_SECRETS=(
  "JWT_SECRET"
  "DB_PASSWORD"
  "AZURE_CLIENT_SECRET"
)

# ============================================================================
# MIGRATION FUNCTIONS
# ============================================================================

is_excluded() {
  local key="$1"
  for excluded in "${EXCLUDED_SECRETS[@]}"; do
    if [ "$key" = "$excluded" ]; then
      return 0
    fi
  done
  return 1
}

is_critical() {
  local key="$1"
  for critical in "${CRITICAL_SECRETS[@]}"; do
    if [ "$key" = "$critical" ]; then
      return 0
    fi
  done
  return 1
}

normalize_secret_name() {
  # Azure Key Vault naming: alphanumeric and hyphens only
  echo "$1" | sed 's/_/-/g' | tr '[:upper:]' '[:lower:]'
}

# ============================================================================
# CONFIRMATION
# ============================================================================

echo -e "${YELLOW}This will migrate secrets from:${NC}"
echo -e "  ${SECRETS_FILE}"
echo -e "${YELLOW}To Azure Key Vault:${NC}"
echo -e "  ${VAULT_NAME}"
echo
echo -e "${RED}IMPORTANT:${NC}"
echo -e "  • Existing secrets in Key Vault will be OVERWRITTEN"
echo -e "  • This operation is logged and auditable"
echo -e "  • Secrets will be encrypted at rest with Azure-managed keys"
echo
read -p "Continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo -e "${YELLOW}Migration cancelled${NC}"
  exit 0
fi

# ============================================================================
# MIGRATION PROCESS
# ============================================================================

MIGRATED_COUNT=0
SKIPPED_COUNT=0
ERROR_COUNT=0
CRITICAL_MISSING=()

echo -e "${BLUE}Starting migration...${NC}"
echo

# Read and process each line from .env file
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue

  # Trim whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  # Skip if no value
  if [ -z "$value" ]; then
    echo -e "${YELLOW}⚠ Skipping '$key' (empty value)${NC}"
    ((SKIPPED_COUNT++))
    continue
  fi

  # Skip excluded secrets
  if is_excluded "$key"; then
    echo -e "${YELLOW}⊘ Skipping '$key' (excluded - environment config)${NC}"
    ((SKIPPED_COUNT++))
    continue
  fi

  # Normalize secret name for Key Vault
  SECRET_NAME=$(normalize_secret_name "$key")

  # Migrate to Key Vault
  echo -n "Migrating: $key → $SECRET_NAME ... "

  if az keyvault secret set \
    --vault-name "$VAULT_NAME" \
    --name "$SECRET_NAME" \
    --value "$value" \
    --output none 2>&1; then

    if is_critical "$key"; then
      echo -e "${GREEN}✓ (CRITICAL)${NC}"
    else
      echo -e "${GREEN}✓${NC}"
    fi
    ((MIGRATED_COUNT++))
  else
    echo -e "${RED}✗ FAILED${NC}"
    ((ERROR_COUNT++))
  fi

done < "$SECRETS_FILE"

# ============================================================================
# VALIDATION
# ============================================================================

echo
echo -e "${BLUE}Validating critical secrets...${NC}"

for critical in "${CRITICAL_SECRETS[@]}"; do
  SECRET_NAME=$(normalize_secret_name "$critical")
  echo -n "Checking: $SECRET_NAME ... "

  if az keyvault secret show \
    --vault-name "$VAULT_NAME" \
    --name "$SECRET_NAME" \
    --output none 2>&1; then
    echo -e "${GREEN}✓ Present${NC}"
  else
    echo -e "${RED}✗ MISSING${NC}"
    CRITICAL_MISSING+=("$critical")
  fi
done

# ============================================================================
# SUMMARY
# ============================================================================

echo
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Migration Summary${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "Secrets migrated:    ${GREEN}$MIGRATED_COUNT${NC}"
echo -e "Secrets skipped:     ${YELLOW}$SKIPPED_COUNT${NC}"
echo -e "Errors:              ${RED}$ERROR_COUNT${NC}"
echo -e "${BLUE}==============================================================================${NC}"

if [ ${#CRITICAL_MISSING[@]} -ne 0 ]; then
  echo
  echo -e "${RED}CRITICAL ERROR: Missing required secrets:${NC}"
  for missing in "${CRITICAL_MISSING[@]}"; do
    echo -e "  ${RED}✗ $missing${NC}"
  done
  echo
  echo -e "${RED}Application will not function without these secrets!${NC}"
  exit 1
fi

if [ $ERROR_COUNT -gt 0 ]; then
  echo
  echo -e "${YELLOW}Warning: Some secrets failed to migrate${NC}"
  echo "Review errors above and retry if needed"
  exit 1
fi

echo
echo -e "${GREEN}✓ Migration completed successfully!${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Update application to use Key Vault (see src/config/secrets.ts)"
echo "  2. Update CI/CD pipeline to reference Key Vault"
echo "  3. Test application with Key Vault secrets"
echo "  4. Remove or secure .env files"
echo "  5. Document Key Vault access for team"
echo
echo -e "${YELLOW}View migrated secrets:${NC}"
echo "  az keyvault secret list --vault-name $VAULT_NAME --output table"
echo
echo -e "${YELLOW}Access Key Vault in portal:${NC}"
echo "  https://portal.azure.com/#@capitaltechalliance.com/resource/subscriptions/021415c2-2f52-4a73-ae77-f8363165a5e1/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$VAULT_NAME/secrets"
echo
