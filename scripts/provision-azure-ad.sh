#!/bin/bash
set -euo pipefail

# ===========================================
# Fleet Management System - Azure AD App Registration
# ===========================================
# This script automates Azure AD app registration
# for Microsoft SSO authentication.
#
# Usage:
#   ./provision-azure-ad.sh [production|staging]
#
# Environment Variables Optional:
#   APP_NAME - Application display name
#   REDIRECT_URI - OAuth redirect URI
#   FRONTEND_URL - Frontend application URL
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
echo "  Fleet Management - Azure AD Configuration"
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
if [[ "$ENVIRONMENT" == "production" ]]; then
  APP_NAME="${APP_NAME:-Fleet Management System}"
  FRONTEND_URL="${FRONTEND_URL:-https://fleet.capitaltechalliance.com}"
else
  APP_NAME="${APP_NAME:-Fleet Management System (Staging)}"
  FRONTEND_URL="${FRONTEND_URL:-https://fleet-staging.capitaltechalliance.com}"
fi

REDIRECT_URI_FRONTEND="${FRONTEND_URL}/auth/callback"
REDIRECT_URI_API="${FRONTEND_URL}/api/auth/microsoft/callback"
LOGOUT_URI="${FRONTEND_URL}/logout"

echo ""
echo "Configuration:"
echo "  App Name:          $APP_NAME"
echo "  Environment:       $ENVIRONMENT"
echo "  Frontend URL:      $FRONTEND_URL"
echo "  Redirect URI:      $REDIRECT_URI_FRONTEND"
echo "  API Callback:      $REDIRECT_URI_API"
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

TENANT_ID=$(az account show --query tenantId -o tsv)
log_info "Tenant ID: $TENANT_ID"

# Check for existing app registration
log_step "Step 2: Checking for existing app registration..."

EXISTING_APP_ID=$(az ad app list \
  --display-name "$APP_NAME" \
  --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [[ -n "$EXISTING_APP_ID" && "$EXISTING_APP_ID" != "null" ]]; then
  log_warn "App registration already exists: $APP_NAME"
  log_info "App ID: $EXISTING_APP_ID"
  echo ""
  read -p "Do you want to update the existing app? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Skipping app creation"
    APP_ID="$EXISTING_APP_ID"
    UPDATE_ONLY=true
  else
    APP_ID="$EXISTING_APP_ID"
    UPDATE_ONLY=true
  fi
else
  UPDATE_ONLY=false
fi

# Create or get app registration
if [[ "$UPDATE_ONLY" == "false" ]]; then
  log_step "Step 3: Creating Azure AD app registration..."

  # Create the app registration
  APP_ID=$(az ad app create \
    --display-name "$APP_NAME" \
    --sign-in-audience AzureADMyOrg \
    --web-redirect-uris "$REDIRECT_URI_FRONTEND" "$REDIRECT_URI_API" \
    --enable-id-token-issuance true \
    --query appId -o tsv)

  log_info "App registration created"
  log_info "Application (client) ID: $APP_ID"
else
  log_step "Step 3: Updating existing app registration..."
  log_info "Using existing App ID: $APP_ID"
fi

# Get object ID
OBJECT_ID=$(az ad app show --id "$APP_ID" --query id -o tsv)

# Configure redirect URIs
log_step "Step 4: Configuring redirect URIs..."

az ad app update \
  --id "$APP_ID" \
  --web-redirect-uris "$REDIRECT_URI_FRONTEND" "$REDIRECT_URI_API" \
  --enable-id-token-issuance true

log_info "Redirect URI added: $REDIRECT_URI_FRONTEND"
log_info "Redirect URI added: $REDIRECT_URI_API"

# Configure logout URL
az ad app update \
  --id "$APP_ID" \
  --web-home-page-url "$FRONTEND_URL"

log_info "Home page URL set: $FRONTEND_URL"

# Configure API permissions
log_step "Step 5: Configuring API permissions..."

# Microsoft Graph API permissions
GRAPH_API_ID="00000003-0000-0000-c000-000000000000"

# Permission IDs for Microsoft Graph
USER_READ_ID="e1fe6dd8-ba31-4d61-89e7-88639da4683d"       # User.Read
OPENID_ID="37f7f235-527c-4136-accd-4a02d197296e"          # openid
PROFILE_ID="14dad69e-099b-42c9-810b-d002981feec1"         # profile
EMAIL_ID="64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0"           # email

# Add Microsoft Graph permissions
log_info "Adding Microsoft Graph API permissions..."

# Build the required resource access JSON
REQUIRED_RESOURCE_ACCESS='[{
  "resourceAppId": "'$GRAPH_API_ID'",
  "resourceAccess": [
    {"id": "'$USER_READ_ID'", "type": "Scope"},
    {"id": "'$OPENID_ID'", "type": "Scope"},
    {"id": "'$PROFILE_ID'", "type": "Scope"},
    {"id": "'$EMAIL_ID'", "type": "Scope"}
  ]
}]'

# Update app with required resource access
az ad app update \
  --id "$APP_ID" \
  --required-resource-accesses "$REQUIRED_RESOURCE_ACCESS"

log_info "Permission added: User.Read"
log_info "Permission added: openid"
log_info "Permission added: profile"
log_info "Permission added: email"

# Grant admin consent (if user has permissions)
log_step "Step 6: Attempting to grant admin consent..."

if az ad app permission admin-consent --id "$APP_ID" 2>/dev/null; then
  log_info "Admin consent granted automatically"
else
  log_warn "Could not grant admin consent automatically"
  log_warn "You may need Global Administrator privileges"
  log_warn "Manual step required: Grant admin consent in Azure Portal"
fi

# Create client secret
log_step "Step 7: Creating client secret..."

SECRET_NAME="fleet-${ENVIRONMENT}-secret-$(date +%Y%m%d)"
SECRET_EXPIRY="2y"

# Create the secret
SECRET_OUTPUT=$(az ad app credential reset \
  --id "$APP_ID" \
  --append \
  --display-name "$SECRET_NAME" \
  --years 2 \
  --query password -o tsv)

CLIENT_SECRET="$SECRET_OUTPUT"

log_info "Client secret created"
log_info "Secret name: $SECRET_NAME"
log_info "Expires: 2 years from now"

# Get app details
log_step "Step 8: Retrieving application details..."

APP_DETAILS=$(az ad app show --id "$APP_ID")
APP_DISPLAY_NAME=$(echo "$APP_DETAILS" | jq -r '.displayName')

log_info "Application configured successfully"

# Create credentials file
CREDENTIALS_FILE="azure-ad-credentials-${ENVIRONMENT}.txt"

cat > "$CREDENTIALS_FILE" <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fleet Management System - Azure AD Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment:       $ENVIRONMENT
Created:           $(date)
Application Name:  $APP_DISPLAY_NAME

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AZURE AD APPLICATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Application (Client) ID:    $APP_ID
Directory (Tenant) ID:      $TENANT_ID
Client Secret:              $CLIENT_SECRET

Object ID:                  $OBJECT_ID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REDIRECT URIs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend Callback:          $REDIRECT_URI_FRONTEND
API Callback:               $REDIRECT_URI_API
Home Page:                  $FRONTEND_URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API PERMISSIONS (Granted)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Microsoft Graph:
  - User.Read (Read user profile)
  - openid (Sign in)
  - profile (View basic profile)
  - email (View email address)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT VARIABLES FOR .env
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Azure AD Configuration (Frontend)
VITE_AZURE_AD_CLIENT_ID=$APP_ID
VITE_AZURE_AD_TENANT_ID=$TENANT_ID
VITE_AZURE_AD_REDIRECT_URI=$REDIRECT_URI_FRONTEND

# Azure AD Configuration (Backend)
AZURE_AD_CLIENT_ID=$APP_ID
AZURE_AD_CLIENT_SECRET=$CLIENT_SECRET
AZURE_AD_TENANT_ID=$TENANT_ID
AZURE_AD_REDIRECT_URI=$REDIRECT_URI_API

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Add the environment variables above to your .env file

2. Grant admin consent (if not done automatically):
   - Go to: https://portal.azure.com
   - Navigate to: Azure Active Directory > App registrations
   - Find: $APP_DISPLAY_NAME
   - Go to: API permissions
   - Click: "Grant admin consent for <your-org>"

3. Test the configuration:
   - Deploy your application
   - Click "Sign in with Microsoft"
   - Verify you can authenticate successfully

4. Configure additional settings if needed:
   - Branding (logo, colors)
   - Token configuration
   - Optional claims
   - Certificate authentication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AZURE PORTAL LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App Registration:
https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/$APP_ID

API Permissions:
https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallAnAPI/appId/$APP_ID

Authentication:
https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Authentication/appId/$APP_ID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Store this file securely (DO NOT commit to git)
- Client secret expires in 2 years - set calendar reminder
- Rotate secrets regularly (every 18-24 months)
- Use Azure Key Vault for production secret storage
- Monitor sign-in logs in Azure AD
- Enable Conditional Access policies for enhanced security

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If authentication fails:

1. Verify redirect URIs match exactly (case-sensitive)
2. Check that admin consent has been granted
3. Ensure client secret hasn't expired
4. Verify tenant ID is correct
5. Check application logs for specific errors
6. Ensure CORS is properly configured

Common Error: "AADSTS50011"
Solution: Redirect URI mismatch - check exact URLs

Common Error: "AADSTS65001"
Solution: Admin consent not granted

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

chmod 600 "$CREDENTIALS_FILE"

# Create .env snippet
ENV_SNIPPET_FILE="azure-ad-env-${ENVIRONMENT}.txt"

cat > "$ENV_SNIPPET_FILE" <<EOF
# ============================================
# Azure AD Configuration - $ENVIRONMENT
# ============================================
# Generated: $(date)
# Add these to your .env file

# Frontend (Vite)
VITE_AZURE_AD_CLIENT_ID=$APP_ID
VITE_AZURE_AD_TENANT_ID=$TENANT_ID
VITE_AZURE_AD_REDIRECT_URI=$REDIRECT_URI_FRONTEND

# Backend API
AZURE_AD_CLIENT_ID=$APP_ID
AZURE_AD_CLIENT_SECRET=$CLIENT_SECRET
AZURE_AD_TENANT_ID=$TENANT_ID
AZURE_AD_REDIRECT_URI=$REDIRECT_URI_API

# Optional: Additional configuration
AZURE_AD_SCOPE=openid profile email User.Read
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/$TENANT_ID
EOF

chmod 600 "$ENV_SNIPPET_FILE"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Azure AD Configuration Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Application Name:      $APP_DISPLAY_NAME"
echo "Client ID:             $APP_ID"
echo "Tenant ID:             $TENANT_ID"
echo ""
echo -e "${YELLOW}Credentials saved to:${NC}"
echo "  Full details:   $CREDENTIALS_FILE"
echo "  .env snippet:   $ENV_SNIPPET_FILE"
echo ""
echo -e "${YELLOW}KEEP THESE FILES SECURE!${NC}"
echo ""
echo "Next Steps:"
echo "  1. Copy environment variables to your .env file"
echo "  2. Verify admin consent is granted (check Azure Portal)"
echo "  3. Test Microsoft SSO login"
echo "  4. Store client secret in Azure Key Vault"
echo ""
echo "Quick test:"
echo "  Deploy app and visit: ${FRONTEND_URL}"
echo "  Click 'Sign in with Microsoft'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
