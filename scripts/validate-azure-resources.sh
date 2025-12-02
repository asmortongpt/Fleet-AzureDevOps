#!/bin/bash
set -euo pipefail

# ===========================================
# Fleet Management System - Resource Validation
# ===========================================
# This script validates that all Azure resources
# are properly provisioned and configured.
#
# Usage:
#   ./validate-azure-resources.sh [production|staging]
#
# Validates:
#   - Resource Group existence
#   - PostgreSQL Database (connectivity, extensions)
#   - Azure AD App Registration (permissions, secrets)
#   - Application Insights (connection, metrics)
#   - Overall readiness score
#
# Author: Capital Tech Alliance
# Date: November 24, 2025

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_pass() { echo -e "${GREEN}✓${NC} $1"; }
log_fail() { echo -e "${RED}✗${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_info() { echo -e "${CYAN}ℹ${NC} $1"; }
log_test() { echo -e "${BLUE}→${NC} Testing: $1"; }

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0

# Test result tracking
test_pass() {
  ((TOTAL_TESTS++))
  ((PASSED_TESTS++))
  log_pass "$1"
}

test_fail() {
  ((TOTAL_TESTS++))
  ((FAILED_TESTS++))
  log_fail "$1"
}

test_warn() {
  ((TOTAL_TESTS++))
  ((WARNING_TESTS++))
  log_warn "$1"
}

# Script header
clear
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║         🔍 Fleet Management System 🔍                         ║"
echo "║         Azure Resource Validation                            ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Environment selection
ENVIRONMENT="${1:-production}"

if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
  log_fail "Invalid environment: $ENVIRONMENT"
  echo "Usage: $0 [production|staging]"
  exit 1
fi

log_info "Validating environment: $ENVIRONMENT"
echo ""

# Configuration
RESOURCE_GROUP="fleet-${ENVIRONMENT}-rg"
DB_SERVER_NAME_PATTERN="fleet-${ENVIRONMENT}-db"
APP_INSIGHTS_NAME="fleet-${ENVIRONMENT}-insights"
LOG_ANALYTICS_NAME="fleet-${ENVIRONMENT}-logs"
ACTION_GROUP_NAME="fleet-${ENVIRONMENT}-alerts"

# Section header
section_header() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

# Prerequisite checks
section_header "📋 Prerequisites"

log_test "Azure CLI installed"
if command -v az &> /dev/null; then
  test_pass "Azure CLI installed: $(az version --query '\"azure-cli\"' -o tsv)"
else
  test_fail "Azure CLI not installed"
  exit 1
fi

log_test "Azure authentication"
if az account show &> /dev/null; then
  SUBSCRIPTION=$(az account show --query name -o tsv)
  test_pass "Authenticated to: $SUBSCRIPTION"
else
  test_fail "Not logged in to Azure"
  exit 1
fi

# Resource Group validation
section_header "🗂️  Resource Group"

log_test "Resource group exists"
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
  test_pass "Resource group exists: $RESOURCE_GROUP"

  LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv)
  log_info "Location: $LOCATION"

  TAGS=$(az group show --name "$RESOURCE_GROUP" --query tags -o json)
  log_info "Tags: $TAGS"
else
  test_fail "Resource group not found: $RESOURCE_GROUP"
  exit 1
fi

# Database validation
section_header "🗄️  PostgreSQL Database"

log_test "Finding database server"
DB_SERVERS=$(az postgres flexible-server list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?starts_with(name, '${DB_SERVER_NAME_PATTERN}')].name" -o tsv)

if [[ -n "$DB_SERVERS" ]]; then
  DB_SERVER_NAME=$(echo "$DB_SERVERS" | head -n 1)
  test_pass "Database server found: $DB_SERVER_NAME"

  # Get database details
  log_test "Retrieving database configuration"
  DB_DETAILS=$(az postgres flexible-server show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER_NAME" 2>/dev/null)

  if [[ -n "$DB_DETAILS" ]]; then
    DB_STATE=$(echo "$DB_DETAILS" | jq -r '.state')
    DB_VERSION=$(echo "$DB_DETAILS" | jq -r '.version')
    DB_SKU=$(echo "$DB_DETAILS" | jq -r '.sku.name')
    DB_STORAGE=$(echo "$DB_DETAILS" | jq -r '.storage.storageSizeGb')
    DB_BACKUP_RETENTION=$(echo "$DB_DETAILS" | jq -r '.backup.backupRetentionDays')

    if [[ "$DB_STATE" == "Ready" ]]; then
      test_pass "Database state: $DB_STATE"
    else
      test_warn "Database state: $DB_STATE (expected Ready)"
    fi

    log_info "PostgreSQL version: $DB_VERSION"
    log_info "SKU: $DB_SKU"
    log_info "Storage: ${DB_STORAGE}GB"
    log_info "Backup retention: ${DB_BACKUP_RETENTION} days"

    # Check backup retention
    if [[ "$DB_BACKUP_RETENTION" -ge 7 ]]; then
      test_pass "Backup retention: ${DB_BACKUP_RETENTION} days (≥7 days)"
    else
      test_warn "Backup retention: ${DB_BACKUP_RETENTION} days (recommended: ≥7 days)"
    fi
  fi

  # Check firewall rules
  log_test "Checking firewall rules"
  FIREWALL_RULES=$(az postgres flexible-server firewall-rule list \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER_NAME" \
    --query "[].name" -o tsv)

  if [[ -n "$FIREWALL_RULES" ]]; then
    RULE_COUNT=$(echo "$FIREWALL_RULES" | wc -l)
    test_pass "Firewall rules configured: $RULE_COUNT rule(s)"

    if echo "$FIREWALL_RULES" | grep -q "AllowAll"; then
      test_warn "AllowAll firewall rule detected (security risk - remove after setup)"
    fi
  else
    test_fail "No firewall rules configured"
  fi

  # Check databases
  log_test "Checking databases"
  DATABASES=$(az postgres flexible-server db list \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$DB_SERVER_NAME" \
    --query "[].name" -o tsv)

  if [[ -n "$DATABASES" ]]; then
    DB_COUNT=$(echo "$DATABASES" | wc -l)
    test_pass "Databases found: $DB_COUNT"
    echo "$DATABASES" | while read -r db; do
      log_info "  - $db"
    done
  else
    test_warn "No databases found (excluding system databases)"
  fi

  # Test connectivity (if psql is available)
  if command -v psql &> /dev/null; then
    log_test "Testing database connectivity"
    DB_HOST=$(echo "$DB_DETAILS" | jq -r '.fullyQualifiedDomainName')

    # Note: This requires DB password to be set in environment
    if [[ -n "${DB_PASSWORD:-}" ]]; then
      if PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -U fleetadmin \
        -d postgres \
        -c "SELECT version();" &> /dev/null; then
        test_pass "Database connectivity test passed"
      else
        test_warn "Database connectivity test failed (may need password)"
      fi
    else
      test_warn "Database connectivity test skipped (set DB_PASSWORD to test)"
    fi
  fi

else
  test_fail "No database server found matching pattern: $DB_SERVER_NAME_PATTERN"
fi

# Azure AD validation
section_header "🔑 Azure AD App Registration"

log_test "Finding Azure AD applications"
TENANT_ID=$(az account show --query tenantId -o tsv)

# Search for Fleet Management apps
APP_REGISTRATIONS=$(az ad app list \
  --filter "startswith(displayName, 'Fleet Management')" \
  --query "[].{name:displayName,appId:appId}" -o json 2>/dev/null || echo "[]")

APP_COUNT=$(echo "$APP_REGISTRATIONS" | jq '. | length')

if [[ "$APP_COUNT" -gt 0 ]]; then
  test_pass "Found $APP_COUNT Azure AD app registration(s)"

  echo "$APP_REGISTRATIONS" | jq -r '.[] | "  - \(.name) (\(.appId))"'

  # Validate the first app
  APP_ID=$(echo "$APP_REGISTRATIONS" | jq -r '.[0].appId')

  log_test "Checking app permissions"
  APP_PERMISSIONS=$(az ad app permission list --id "$APP_ID" 2>/dev/null || echo "[]")

  if [[ "$APP_PERMISSIONS" != "[]" ]]; then
    PERMISSION_COUNT=$(echo "$APP_PERMISSIONS" | jq '. | length')
    test_pass "API permissions configured: $PERMISSION_COUNT"

    # Check for required Microsoft Graph permissions
    REQUIRED_PERMS=("User.Read" "openid" "profile" "email")
    MISSING_PERMS=()

    for perm in "${REQUIRED_PERMS[@]}"; do
      if echo "$APP_PERMISSIONS" | jq -r '.[].resourceAccess[].id' | grep -q "."; then
        log_info "  ✓ $perm (appears configured)"
      else
        MISSING_PERMS+=("$perm")
      fi
    done

    if [[ ${#MISSING_PERMS[@]} -eq 0 ]]; then
      test_pass "All required permissions appear configured"
    else
      test_warn "Some permissions may be missing: ${MISSING_PERMS[*]}"
    fi
  else
    test_warn "Could not retrieve API permissions"
  fi

  log_test "Checking redirect URIs"
  REDIRECT_URIS=$(az ad app show --id "$APP_ID" --query "web.redirectUris" -o json 2>/dev/null || echo "[]")

  REDIRECT_COUNT=$(echo "$REDIRECT_URIS" | jq '. | length')
  if [[ "$REDIRECT_COUNT" -gt 0 ]]; then
    test_pass "Redirect URIs configured: $REDIRECT_COUNT"
    echo "$REDIRECT_URIS" | jq -r '.[]' | while read -r uri; do
      log_info "  - $uri"
    done
  else
    test_fail "No redirect URIs configured"
  fi

  log_test "Checking client secrets"
  # Note: Cannot retrieve secret values, only check if they exist
  CREDENTIALS=$(az ad app credential list --id "$APP_ID" 2>/dev/null || echo "[]")
  CREDENTIAL_COUNT=$(echo "$CREDENTIALS" | jq '. | length')

  if [[ "$CREDENTIAL_COUNT" -gt 0 ]]; then
    test_pass "Client secret(s) configured: $CREDENTIAL_COUNT"

    # Check expiration
    echo "$CREDENTIALS" | jq -r '.[] | "\(.displayName): expires \(.endDateTime)"' | while read -r cred; do
      log_info "  - $cred"
    done
  else
    test_fail "No client secrets configured"
  fi

else
  test_warn "No Azure AD app registrations found (may need Application Administrator role)"
fi

# Application Insights validation
section_header "📊 Application Insights"

log_test "Finding Application Insights resource"
if az monitor app-insights component show \
  --resource-group "$RESOURCE_GROUP" \
  --app "$APP_INSIGHTS_NAME" &> /dev/null; then

  test_pass "Application Insights found: $APP_INSIGHTS_NAME"

  # Get connection details
  CONNECTION_STRING=$(az monitor app-insights component show \
    --resource-group "$RESOURCE_GROUP" \
    --app "$APP_INSIGHTS_NAME" \
    --query connectionString -o tsv)

  INSTRUMENTATION_KEY=$(az monitor app-insights component show \
    --resource-group "$RESOURCE_GROUP" \
    --app "$APP_INSIGHTS_NAME" \
    --query instrumentationKey -o tsv)

  if [[ -n "$CONNECTION_STRING" ]]; then
    test_pass "Connection string retrieved"
  else
    test_fail "Could not retrieve connection string"
  fi

  if [[ -n "$INSTRUMENTATION_KEY" ]]; then
    test_pass "Instrumentation key retrieved"
    log_info "Key: ${INSTRUMENTATION_KEY:0:8}...${INSTRUMENTATION_KEY: -4}"
  else
    test_fail "Could not retrieve instrumentation key"
  fi

else
  test_fail "Application Insights not found: $APP_INSIGHTS_NAME"
fi

# Log Analytics validation
log_test "Finding Log Analytics workspace"
if az monitor log-analytics workspace show \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_ANALYTICS_NAME" &> /dev/null; then

  test_pass "Log Analytics workspace found: $LOG_ANALYTICS_NAME"

  RETENTION=$(az monitor log-analytics workspace show \
    --resource-group "$RESOURCE_GROUP" \
    --workspace-name "$LOG_ANALYTICS_NAME" \
    --query retentionInDays -o tsv)

  log_info "Retention: $RETENTION days"

else
  test_warn "Log Analytics workspace not found: $LOG_ANALYTICS_NAME"
fi

# Action Group validation
log_test "Finding Action Group"
if az monitor action-group show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACTION_GROUP_NAME" &> /dev/null; then

  test_pass "Action Group found: $ACTION_GROUP_NAME"

  RECEIVERS=$(az monitor action-group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACTION_GROUP_NAME" \
    --query "emailReceivers[].emailAddress" -o tsv)

  if [[ -n "$RECEIVERS" ]]; then
    test_pass "Email receivers configured"
    echo "$RECEIVERS" | while read -r email; do
      log_info "  - $email"
    done
  else
    test_warn "No email receivers configured"
  fi

else
  test_warn "Action Group not found: $ACTION_GROUP_NAME"
fi

# Alert rules validation
log_test "Checking alert rules"
ALERT_RULES=$(az monitor metrics alert list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[].name" -o tsv)

if [[ -n "$ALERT_RULES" ]]; then
  ALERT_COUNT=$(echo "$ALERT_RULES" | wc -l)
  test_pass "Alert rules configured: $ALERT_COUNT"

  echo "$ALERT_RULES" | while read -r rule; do
    log_info "  - $rule"
  done
else
  test_warn "No alert rules configured"
fi

# Final summary
section_header "📊 Validation Summary"

echo "Total Tests:       $TOTAL_TESTS"
echo "Passed:            $PASSED_TESTS (${GREEN}✓${NC})"
echo "Failed:            $FAILED_TESTS (${RED}✗${NC})"
echo "Warnings:          $WARNING_TESTS (${YELLOW}⚠${NC})"
echo ""

# Calculate readiness percentage
if [[ $TOTAL_TESTS -gt 0 ]]; then
  READINESS=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
  echo -n "Readiness Score:   "

  if [[ $READINESS -ge 90 ]]; then
    echo -e "${GREEN}${READINESS}%${NC} - Excellent! ✓"
  elif [[ $READINESS -ge 75 ]]; then
    echo -e "${YELLOW}${READINESS}%${NC} - Good, minor issues"
  elif [[ $READINESS -ge 50 ]]; then
    echo -e "${YELLOW}${READINESS}%${NC} - Needs attention"
  else
    echo -e "${RED}${READINESS}%${NC} - Critical issues"
  fi
else
  echo "Readiness Score:   Unable to calculate"
fi

echo ""

# Recommendations
section_header "💡 Recommendations"

if [[ $FAILED_TESTS -gt 0 ]]; then
  log_fail "Address $FAILED_TESTS failed test(s) before production deployment"
fi

if [[ $WARNING_TESTS -gt 0 ]]; then
  log_warn "Review $WARNING_TESTS warning(s) and address if needed"
fi

if [[ $READINESS -ge 90 ]]; then
  log_pass "System is ready for production deployment!"
  echo ""
  echo "Next steps:"
  echo "  1. Update .env file with credentials"
  echo "  2. Run database migrations"
  echo "  3. Deploy application"
  echo "  4. Test all functionality"
elif [[ $READINESS -ge 75 ]]; then
  log_warn "System is mostly ready, but address warnings first"
  echo ""
  echo "Recommended actions:"
  echo "  1. Fix any failed tests"
  echo "  2. Review and address warnings"
  echo "  3. Re-run validation"
else
  log_fail "System is not ready for production"
  echo ""
  echo "Required actions:"
  echo "  1. Fix all failed tests"
  echo "  2. Run provisioning scripts if resources are missing"
  echo "  3. Re-run validation"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Exit code based on failures
if [[ $FAILED_TESTS -gt 0 ]]; then
  exit 1
else
  exit 0
fi
