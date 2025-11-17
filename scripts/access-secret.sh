#!/bin/bash

# Fleet Management - Secret Access Helper Script
# Quick access to secrets stored in Azure Key Vault

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Key Vault name is provided
if [ -z "$KEY_VAULT_NAME" ]; then
    echo -e "${RED}Error: KEY_VAULT_NAME environment variable not set${NC}"
    echo ""
    echo "Usage:"
    echo "  export KEY_VAULT_NAME='your-keyvault-name'"
    echo "  ./access-secret.sh [secret-name]"
    echo ""
    echo "Or:"
    echo "  KEY_VAULT_NAME='your-keyvault-name' ./access-secret.sh [secret-name]"
    exit 1
fi

# Function to list all secrets
list_secrets() {
    echo -e "${BLUE}Available secrets in ${GREEN}$KEY_VAULT_NAME${BLUE}:${NC}"
    echo ""
    az keyvault secret list \
        --vault-name $KEY_VAULT_NAME \
        --query '[].{Name:name, Enabled:attributes.enabled, Updated:attributes.updated}' \
        --output table
}

# Function to get a specific secret
get_secret() {
    local secret_name=$1

    echo -e "${BLUE}Retrieving secret: ${GREEN}$secret_name${NC}"

    # Get the secret value
    local secret_value=$(az keyvault secret show \
        --vault-name $KEY_VAULT_NAME \
        --name $secret_name \
        --query value \
        --output tsv 2>&1)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Secret retrieved successfully${NC}"
        echo ""
        echo -e "${YELLOW}Secret value:${NC}"
        echo "$secret_value"
        echo ""
        echo -e "${YELLOW}To copy to clipboard (macOS):${NC}"
        echo "  az keyvault secret show --vault-name $KEY_VAULT_NAME --name $secret_name --query value -o tsv | pbcopy"
        echo ""
        echo -e "${YELLOW}To copy to clipboard (Linux with xclip):${NC}"
        echo "  az keyvault secret show --vault-name $KEY_VAULT_NAME --name $secret_name --query value -o tsv | xclip -selection clipboard"
    else
        echo -e "${RED}✗ Failed to retrieve secret${NC}"
        echo "$secret_value"
        exit 1
    fi
}

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2

    if [ -z "$secret_value" ]; then
        echo -e "${RED}Error: Secret value not provided${NC}"
        echo "Usage: $0 set <secret-name> <secret-value>"
        exit 1
    fi

    echo -e "${BLUE}Setting secret: ${GREEN}$secret_name${NC}"

    az keyvault secret set \
        --vault-name $KEY_VAULT_NAME \
        --name $secret_name \
        --value "$secret_value" \
        --output none

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Secret set successfully${NC}"
    else
        echo -e "${RED}✗ Failed to set secret${NC}"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo -e "${GREEN}Fleet Management - Secret Access Helper${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 list                          - List all secrets"
    echo "  $0 get <secret-name>             - Get a specific secret"
    echo "  $0 set <secret-name> <value>     - Set a secret"
    echo "  $0 rotate <secret-name>          - Rotate a secret (generates new random value)"
    echo "  $0 help                          - Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  KEY_VAULT_NAME - The name of your Azure Key Vault (required)"
    echo ""
    echo "Examples:"
    echo "  export KEY_VAULT_NAME='fleet-secrets-vault-123456'"
    echo "  $0 list"
    echo "  $0 get db-password"
    echo "  $0 set openai-api-key 'sk-proj-...'"
    echo "  $0 rotate jwt-secret"
    echo ""
    echo "Common Secret Names:"
    echo "  Database:    db-password, db-username, db-host, db-port, db-name"
    echo "  App:         jwt-secret, encryption-key"
    echo "  Redis:       redis-password"
    echo "  AI:          openai-api-key, claude-api-key, gemini-api-key"
    echo "  Storage:     azure-storage-connection-string"
    echo "  Services:    sendgrid-api-key, twilio-auth-token, mapbox-api-key"
}

# Function to rotate a secret (generate new random value)
rotate_secret() {
    local secret_name=$1

    echo -e "${BLUE}Rotating secret: ${GREEN}$secret_name${NC}"
    echo -e "${YELLOW}Generating new random value...${NC}"

    # Generate a secure random password
    local new_value=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

    # Set the new secret
    az keyvault secret set \
        --vault-name $KEY_VAULT_NAME \
        --name $secret_name \
        --value "$new_value" \
        --output none

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Secret rotated successfully${NC}"
        echo ""
        echo -e "${YELLOW}New secret value:${NC}"
        echo "$new_value"
        echo ""
        echo -e "${RED}⚠️  IMPORTANT:${NC}"
        echo "  1. Update any systems using this secret"
        echo "  2. Restart Kubernetes pods to pick up new value:"
        echo "     kubectl rollout restart deployment/fleet-api -n fleet-management"
    else
        echo -e "${RED}✗ Failed to rotate secret${NC}"
        exit 1
    fi
}

# Main script logic
case "${1:-}" in
    list|ls)
        list_secrets
        ;;
    get)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Secret name required${NC}"
            echo "Usage: $0 get <secret-name>"
            exit 1
        fi
        get_secret "$2"
        ;;
    set)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Secret name required${NC}"
            echo "Usage: $0 set <secret-name> <secret-value>"
            exit 1
        fi
        set_secret "$2" "$3"
        ;;
    rotate)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Secret name required${NC}"
            echo "Usage: $0 rotate <secret-name>"
            exit 1
        fi
        rotate_secret "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -n "$1" ]; then
            # Assume it's a secret name to get
            get_secret "$1"
        else
            show_help
        fi
        ;;
esac
