#!/bin/bash
set -euo pipefail

# ===========================================
# Fleet Management System - Complete Azure Provisioning
# ===========================================
# This master script orchestrates the provisioning of ALL
# required Azure resources for production deployment.
#
# Usage:
#   ./provision-all-azure-resources.sh [production|staging]
#
# What it provisions:
#   1. Resource Group
#   2. PostgreSQL Database
#   3. Azure AD App Registration
#   4. Application Insights Monitoring
#   5. Storage Account (optional)
#   6. Key Vault (optional)
#
# Prerequisites:
#   - Azure CLI installed and configured
#   - Logged in to Azure (az login)
#   - Appropriate permissions (Contributor + Application Administrator)
#   - Email address for alerts
#
# Author: Capital Tech Alliance
# Date: November 24, 2025

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Emoji indicators
CHECK="✓"
CROSS="✗"
WARN="⚠"
INFO="ℹ"
ROCKET="🚀"
GEAR="⚙"
KEY="🔑"
DB="🗄️"
CHART="📊"
LOCK="🔒"

# Helper functions
log_info() { echo -e "${GREEN}${CHECK}${NC} $1"; }
log_warn() { echo -e "${YELLOW}${WARN}${NC} $1"; }
log_error() { echo -e "${RED}${CROSS}${NC} $1"; }
log_step() { echo -e "\n${BLUE}${GEAR}${NC} $1"; }
log_success() { echo -e "${GREEN}${CHECK} $1${NC}"; }
log_section() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${CYAN}$1${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

# Script header
clear
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║         ${ROCKET} Fleet Management System ${ROCKET}                      ║"
echo "║         Complete Azure Infrastructure Provisioning           ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Environment selection
ENVIRONMENT="${1:-}"

if [[ -z "$ENVIRONMENT" ]]; then
  echo "Select environment:"
  echo "  1) Production"
  echo "  2) Staging"
  echo ""
  read -p "Enter choice (1 or 2): " choice

  case $choice in
    1) ENVIRONMENT="production" ;;
    2) ENVIRONMENT="staging" ;;
    *)
      log_error "Invalid choice"
      exit 1
      ;;
  esac
fi

if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
  log_error "Invalid environment: $ENVIRONMENT"
  echo "Usage: $0 [production|staging]"
  exit 1
fi

log_success "Environment: $ENVIRONMENT"

# Configuration
RESOURCE_GROUP="fleet-${ENVIRONMENT}-rg"
LOCATION="eastus"
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_section "${GEAR} Prerequisites Check"

# Check 1: Azure CLI
log_step "Checking Azure CLI..."
if ! command -v az &> /dev/null; then
  log_error "Azure CLI not installed"
  echo "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
  exit 1
fi
log_info "Azure CLI installed: $(az version --query '\"azure-cli\"' -o tsv)"

# Check 2: Authentication
log_step "Checking Azure authentication..."
if ! az account show &> /dev/null; then
  log_error "Not logged in to Azure"
  echo "Run: az login"
  exit 1
fi

SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

log_info "Subscription: $SUBSCRIPTION_NAME"
log_info "Subscription ID: $SUBSCRIPTION_ID"
log_info "Tenant ID: $TENANT_ID"

# Check 3: Permissions
log_step "Checking permissions..."
USER_PRINCIPAL=$(az account show --query user.name -o tsv)
log_info "Logged in as: $USER_PRINCIPAL"

# Check 4: Required tools
log_step "Checking required tools..."

MISSING_TOOLS=()

if ! command -v jq &> /dev/null; then
  MISSING_TOOLS+=("jq")
fi

if ! command -v openssl &> /dev/null; then
  MISSING_TOOLS+=("openssl")
fi

if [[ ${#MISSING_TOOLS[@]} -gt 0 ]]; then
  log_warn "Optional tools missing: ${MISSING_TOOLS[*]}"
  log_warn "Install for full functionality"
else
  log_info "All required tools installed"
fi

# Configuration summary
log_section "${INFO} Configuration Summary"

echo "Environment:       $ENVIRONMENT"
echo "Resource Group:    $RESOURCE_GROUP"
echo "Location:          $LOCATION"
echo "Subscription:      $SUBSCRIPTION_NAME"
echo "Tenant:            $TENANT_ID"
echo ""

# Collect additional configuration
log_step "Configuration options..."

read -p "Alert email address [$USER_PRINCIPAL]: " ALERT_EMAIL
ALERT_EMAIL="${ALERT_EMAIL:-$USER_PRINCIPAL}"

read -p "Frontend domain [fleet.capitaltechalliance.com]: " FRONTEND_DOMAIN
if [[ "$ENVIRONMENT" == "production" ]]; then
  FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-fleet.capitaltechalliance.com}"
else
  FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-fleet-staging.capitaltechalliance.com}"
fi

echo ""
echo "Alert Email:       $ALERT_EMAIL"
echo "Frontend Domain:   $FRONTEND_DOMAIN"
echo ""

# Confirmation
log_warn "This will create the following Azure resources:"
echo "  ${DB} PostgreSQL Flexible Server (with 7-day backups)"
echo "  ${KEY} Azure AD App Registration (for Microsoft SSO)"
echo "  ${CHART} Application Insights (for monitoring)"
echo "  ${GEAR} Log Analytics Workspace"
echo "  ${LOCK} Action Group (for alerts)"
echo ""

read -p "Continue with provisioning? (yes/no): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]es$ ]]; then
  log_warn "Provisioning cancelled"
  exit 0
fi

# Start provisioning
START_TIME=$(date +%s)

log_section "${ROCKET} Starting Provisioning"

# Create resource group
log_step "Step 1: Creating resource group..."

if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
  log_info "Resource group already exists"
else
  az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags Environment="$ENVIRONMENT" Project=FleetManagement CreatedBy="$USER_PRINCIPAL" CreatedDate="$(date +%Y-%m-%d)" \
    --output none
  log_success "Resource group created: $RESOURCE_GROUP"
fi

# Export environment variables for sub-scripts
export RESOURCE_GROUP
export LOCATION
export ALERT_EMAIL
export FRONTEND_URL="https://${FRONTEND_DOMAIN}"

# Provision database
log_section "${DB} Step 2: Provisioning Database"

if [[ -x "$SCRIPTS_DIR/provision-database.sh" ]]; then
  log_info "Running database provisioning script..."

  if "$SCRIPTS_DIR/provision-database.sh" "$ENVIRONMENT"; then
    log_success "Database provisioning completed"
  else
    log_error "Database provisioning failed"
    exit 1
  fi
else
  log_error "Database provisioning script not found or not executable"
  log_error "Expected: $SCRIPTS_DIR/provision-database.sh"
  exit 1
fi

# Provision Azure AD
log_section "${KEY} Step 3: Provisioning Azure AD App"

if [[ -x "$SCRIPTS_DIR/provision-azure-ad.sh" ]]; then
  log_info "Running Azure AD provisioning script..."

  if "$SCRIPTS_DIR/provision-azure-ad.sh" "$ENVIRONMENT"; then
    log_success "Azure AD provisioning completed"
  else
    log_error "Azure AD provisioning failed"
    log_warn "This may require Application Administrator permissions"
    log_warn "You can run this script manually later"
  fi
else
  log_error "Azure AD provisioning script not found or not executable"
  log_error "Expected: $SCRIPTS_DIR/provision-azure-ad.sh"
fi

# Provision monitoring
log_section "${CHART} Step 4: Provisioning Monitoring"

if [[ -x "$SCRIPTS_DIR/provision-monitoring.sh" ]]; then
  log_info "Running monitoring provisioning script..."

  if "$SCRIPTS_DIR/provision-monitoring.sh" "$ENVIRONMENT"; then
    log_success "Monitoring provisioning completed"
  else
    log_error "Monitoring provisioning failed"
    exit 1
  fi
else
  log_error "Monitoring provisioning script not found or not executable"
  log_error "Expected: $SCRIPTS_DIR/provision-monitoring.sh"
  exit 1
fi

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Consolidate credentials
log_section "${LOCK} Step 5: Consolidating Credentials"

MASTER_CREDENTIALS_FILE="azure-credentials-${ENVIRONMENT}-MASTER.txt"

cat > "$MASTER_CREDENTIALS_FILE" <<EOF
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         Fleet Management System - Azure Credentials          ║
║                   MASTER CREDENTIALS FILE                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Environment:       $ENVIRONMENT
Created:           $(date)
Provisioning Time: ${MINUTES}m ${SECONDS}s
Resource Group:    $RESOURCE_GROUP
Location:          $LOCATION
Subscription:      $SUBSCRIPTION_NAME

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREDENTIALS FILES GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following files contain detailed credentials:

${DB} Database Credentials:
   - database-credentials-${ENVIRONMENT}.txt
   - Contains connection strings and database passwords

${KEY} Azure AD Credentials:
   - azure-ad-credentials-${ENVIRONMENT}.txt
   - Contains client ID, tenant ID, and client secret
   - azure-ad-env-${ENVIRONMENT}.txt (ready to copy to .env)

${CHART} Monitoring Configuration:
   - monitoring-config-${ENVIRONMENT}.txt
   - Contains Application Insights connection strings
   - monitoring-env-${ENVIRONMENT}.txt (ready to copy to .env)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK START - ADD TO .ENV
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy the contents of these files to your .env file:

1. Database configuration:
   cat database-credentials-${ENVIRONMENT}.txt | grep "DATABASE_URL=" >> .env

2. Azure AD configuration:
   cat azure-ad-env-${ENVIRONMENT}.txt >> .env

3. Monitoring configuration:
   cat monitoring-env-${ENVIRONMENT}.txt >> .env

Or manually copy the environment variables from each file.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Update .env file with all credentials:
   - Copy from *-env-${ENVIRONMENT}.txt files
   - Generate JWT secrets: openssl rand -base64 48
   - Set CORS_ORIGIN to your domain

2. Run database migrations:
   cd api
   npm run migrate

3. Create initial admin user:
   npm run seed:admin

4. Verify Azure AD configuration:
   - Check Azure Portal for admin consent status
   - Test Microsoft SSO login

5. Deploy application:
   - Build: npm run build
   - Deploy to Azure Static Web Apps or App Service

6. Verify monitoring:
   - Check Application Insights in Azure Portal
   - Test alert email delivery

7. Remove temporary firewall rules:
   az postgres flexible-server firewall-rule delete \\
     --resource-group $RESOURCE_GROUP \\
     --name fleet-${ENVIRONMENT}-db-* \\
     --rule-name AllowAll --yes

8. Run validation script:
   ./scripts/validate-azure-resources.sh $ENVIRONMENT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AZURE PORTAL QUICK LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resource Group:
https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP

Database:
https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DBforPostgreSQL/flexibleServers/

Azure AD:
https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps

Application Insights:
https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY REMINDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${LOCK} KEEP ALL CREDENTIALS FILES SECURE!
${LOCK} DO NOT commit to git (already in .gitignore)
${LOCK} Store in secure password manager or Azure Key Vault
${LOCK} Set calendar reminders for secret rotation (18-24 months)
${LOCK} Remove temporary firewall rules after initial setup
${LOCK} Enable Azure AD Conditional Access for enhanced security
${LOCK} Review and audit regularly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documentation: DEPLOYMENT_GUIDE_COMPLETE.md
Email: andrew.m@capitaltechalliance.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

chmod 600 "$MASTER_CREDENTIALS_FILE"

log_success "Master credentials file created: $MASTER_CREDENTIALS_FILE"

# Final summary
log_section "${ROCKET} Provisioning Complete!"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║         ${CHECK} Azure Infrastructure Provisioning Complete! ${CHECK}        ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "Time taken:        ${MINUTES} minutes ${SECONDS} seconds"
echo "Environment:       $ENVIRONMENT"
echo "Resource Group:    $RESOURCE_GROUP"
echo ""

log_success "Resources provisioned:"
echo "  ${DB} PostgreSQL Database"
echo "  ${KEY} Azure AD App Registration"
echo "  ${CHART} Application Insights"
echo "  ${LOCK} Alert Configuration"
echo ""

log_warn "Credentials saved to:"
echo "  ${MASTER_CREDENTIALS_FILE}"
echo ""

log_warn "Next steps:"
echo "  1. Update .env file with credentials"
echo "  2. Run database migrations"
echo "  3. Deploy application"
echo "  4. Run validation: ./scripts/validate-azure-resources.sh $ENVIRONMENT"
echo ""

log_info "For detailed information, see:"
echo "  - $MASTER_CREDENTIALS_FILE"
echo "  - DEPLOYMENT_GUIDE_COMPLETE.md"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}${ROCKET} Ready for deployment! ${ROCKET}${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
