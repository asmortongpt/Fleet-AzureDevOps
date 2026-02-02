#!/bin/bash
# ============================================================================
# Azure Key Vault Secret Fetcher
# ============================================================================
# Securely fetches secrets from Azure Key Vault for deployment
# NO HARDCODED SECRETS - All credentials retrieved at runtime
# ============================================================================

set -euo pipefail

# Configuration
VAULT_NAME="${AZURE_KEY_VAULT_NAME:-fleet-secrets-vault}"
SECRETS_FILE="/tmp/fleet-deployment-secrets.env"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    log_error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    log_error "Not logged in to Azure. Please run: az login"
    exit 1
fi

log_info "Fetching secrets from Azure Key Vault: $VAULT_NAME"

# Create temporary secrets file (will be deleted after sourcing)
rm -f "$SECRETS_FILE"
touch "$SECRETS_FILE"
chmod 600 "$SECRETS_FILE"

# Fetch secrets from Key Vault
fetch_secret() {
    local secret_name=$1
    local env_var_name=$2

    log_info "Fetching secret: $secret_name"

    local secret_value
    if secret_value=$(az keyvault secret show --vault-name "$VAULT_NAME" --name "$secret_name" --query value -o tsv 2>/dev/null); then
        echo "export ${env_var_name}='${secret_value}'" >> "$SECRETS_FILE"
        log_info "✓ Successfully fetched $secret_name"
    else
        log_warn "Failed to fetch $secret_name from Key Vault"
        # Try to get from environment as fallback
        if [ -n "${!env_var_name:-}" ]; then
            log_warn "Using environment variable for $env_var_name"
            echo "export ${env_var_name}='${!env_var_name}'" >> "$SECRETS_FILE"
        else
            log_error "Secret $secret_name not found in Key Vault or environment"
            return 1
        fi
    fi
}

# Fetch all required secrets
log_info "Starting secret retrieval..."

# API Keys
fetch_secret "grok-api-key" "GROK_API_KEY" || exit 1
fetch_secret "openai-api-key" "OPENAI_API_KEY" || exit 1
fetch_secret "anthropic-api-key" "ANTHROPIC_API_KEY" || exit 1

# GitHub
fetch_secret "github-pat" "GITHUB_PAT" || exit 1

# Azure DevOps
fetch_secret "azure-devops-pat" "AZURE_DEVOPS_PAT" || exit 1

# Azure Configuration
fetch_secret "azure-client-id" "AZURE_CLIENT_ID" || exit 1
fetch_secret "azure-tenant-id" "AZURE_TENANT_ID" || exit 1
fetch_secret "azure-client-secret" "AZURE_CLIENT_SECRET" || exit 1

# Add metadata
echo "export SECRETS_FETCHED_AT='$(date -u +%Y-%m-%dT%H:%M:%SZ)'" >> "$SECRETS_FILE"
echo "export SECRETS_SOURCE='azure-key-vault'" >> "$SECRETS_FILE"

log_info "✓ All secrets fetched successfully"
log_info "Secrets stored in: $SECRETS_FILE"
log_warn "This file will be automatically deleted after deployment"

# Output the file path for sourcing
echo "$SECRETS_FILE"
