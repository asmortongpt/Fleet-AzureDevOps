#!/bin/bash

# ===================================================================
# Credential Rotation Script
# ===================================================================
# This script helps rotate sensitive credentials in the Fleet system
# Use this for regular credential rotation or after security incidents
# ===================================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KEY_VAULT_NAME="${KEY_VAULT_NAME:-fleet-keyvault-prod}"
NAMESPACE="${NAMESPACE:-fleet-production}"

echo -e "${BLUE}====================================================================${NC}"
echo -e "${BLUE}Fleet Management System - Credential Rotation${NC}"
echo -e "${BLUE}====================================================================${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    local missing=0

    if ! command -v az &> /dev/null; then
        echo -e "${RED}❌ Azure CLI (az) is not installed${NC}"
        missing=1
    fi

    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed${NC}"
        missing=1
    fi

    if ! command -v openssl &> /dev/null; then
        echo -e "${RED}❌ openssl is not installed${NC}"
        missing=1
    fi

    if [ $missing -eq 1 ]; then
        echo -e "${RED}Missing required tools. Please install them and try again.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Function to rotate database password
rotate_database_password() {
    echo ""
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"
    echo -e "${BLUE}Rotating Database Password${NC}"
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"

    # Generate new password
    NEW_PASSWORD=$(openssl rand -base64 32)
    echo -e "${YELLOW}Generated new database password${NC}"

    # Update Azure Key Vault
    echo -e "${YELLOW}Updating Azure Key Vault...${NC}"
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "db-password" \
        --value "$NEW_PASSWORD" \
        --output none
    echo -e "${GREEN}✓ Key Vault updated${NC}"

    # Update Kubernetes secret
    echo -e "${YELLOW}Updating Kubernetes secret...${NC}"
    kubectl create secret generic fleet-db-credentials \
        --from-literal=password="$NEW_PASSWORD" \
        --namespace="$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    echo -e "${GREEN}✓ Kubernetes secret updated${NC}"

    # Restart pods to pick up new secret
    echo -e "${YELLOW}Restarting application pods...${NC}"
    kubectl rollout restart deployment/fleet-api -n "$NAMESPACE"
    echo -e "${GREEN}✓ Pods restarting${NC}"

    echo -e "${GREEN}✓ Database password rotated successfully${NC}"
    echo -e "${YELLOW}Note: You must also update the database user password manually${NC}"
}

# Function to rotate JWT secret
rotate_jwt_secret() {
    echo ""
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"
    echo -e "${BLUE}Rotating JWT Secret${NC}"
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"

    # Generate new JWT secret (48 bytes = 384 bits)
    NEW_JWT_SECRET=$(openssl rand -base64 48)
    echo -e "${YELLOW}Generated new JWT secret${NC}"

    # Update Azure Key Vault
    echo -e "${YELLOW}Updating Azure Key Vault...${NC}"
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "jwt-secret" \
        --value "$NEW_JWT_SECRET" \
        --output none
    echo -e "${GREEN}✓ Key Vault updated${NC}"

    # Update Kubernetes secret
    echo -e "${YELLOW}Updating Kubernetes secret...${NC}"
    kubectl create secret generic fleet-jwt-secret \
        --from-literal=secret="$NEW_JWT_SECRET" \
        --namespace="$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    echo -e "${GREEN}✓ Kubernetes secret updated${NC}"

    # Gradual rollout
    echo -e "${YELLOW}Performing gradual rollout...${NC}"
    kubectl rollout restart deployment/fleet-api -n "$NAMESPACE"
    echo -e "${GREEN}✓ JWT secret rotated successfully${NC}"
    echo -e "${YELLOW}Warning: All existing user sessions will be invalidated${NC}"
}

# Function to rotate API keys
rotate_api_keys() {
    echo ""
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"
    echo -e "${BLUE}Rotating Third-Party API Keys${NC}"
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"

    echo -e "${YELLOW}This will rotate third-party service API keys${NC}"
    echo -e "${YELLOW}You must obtain new keys from each service provider${NC}"
    echo ""

    # SendGrid
    read -p "Do you want to rotate SendGrid API key? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter new SendGrid API key: " -s SENDGRID_KEY
        echo ""
        az keyvault secret set \
            --vault-name "$KEY_VAULT_NAME" \
            --name "sendgrid-api-key" \
            --value "$SENDGRID_KEY" \
            --output none
        echo -e "${GREEN}✓ SendGrid API key updated${NC}"
    fi

    # Twilio
    read -p "Do you want to rotate Twilio credentials? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter Twilio Auth Token: " -s TWILIO_TOKEN
        echo ""
        az keyvault secret set \
            --vault-name "$KEY_VAULT_NAME" \
            --name "twilio-auth-token" \
            --value "$TWILIO_TOKEN" \
            --output none
        echo -e "${GREEN}✓ Twilio auth token updated${NC}"
    fi

    # Microsoft Graph
    read -p "Do you want to rotate Microsoft Graph client secret? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter new Graph client secret: " -s GRAPH_SECRET
        echo ""
        az keyvault secret set \
            --vault-name "$KEY_VAULT_NAME" \
            --name "graph-client-secret" \
            --value "$GRAPH_SECRET" \
            --output none
        echo -e "${GREEN}✓ Microsoft Graph client secret updated${NC}"
    fi
}

# Function to revoke vendor access
revoke_vendor_access() {
    echo ""
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"
    echo -e "${BLUE}Revoking Vendor Access${NC}"
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"

    echo -e "${YELLOW}This will invalidate all vendor Kubernetes access tokens${NC}"
    read -p "Are you sure? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipped vendor access revocation${NC}"
        return
    fi

    # Delete and recreate service account
    kubectl delete serviceaccount vendor-developer -n fleet-dev --ignore-not-found
    kubectl create serviceaccount vendor-developer -n fleet-dev

    echo -e "${GREEN}✓ All vendor tokens invalidated${NC}"
    echo -e "${YELLOW}Generate new access with: ./deployment/vendor-access/generate-temporary-kubeconfig.sh${NC}"
}

# Function to audit secrets
audit_secrets() {
    echo ""
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"
    echo -e "${BLUE}Auditing Secrets${NC}"
    echo -e "${BLUE}-------------------------------------------------------------------${NC}"

    echo -e "${YELLOW}Checking Key Vault secrets...${NC}"
    az keyvault secret list --vault-name "$KEY_VAULT_NAME" --query "[].{name:name, enabled:attributes.enabled, expires:attributes.expires}" -o table

    echo ""
    echo -e "${YELLOW}Checking Kubernetes secrets...${NC}"
    kubectl get secrets -n "$NAMESPACE" -o custom-columns=NAME:.metadata.name,TYPE:.type,AGE:.metadata.creationTimestamp

    echo ""
    echo -e "${YELLOW}Recent Key Vault access logs (last 24 hours):${NC}"
    az monitor activity-log list \
        --resource-group fleet-rg \
        --start-time "$(date -u -d '24 hours ago' '+%Y-%m-%dT%H:%M:%SZ')" \
        --query "[?contains(resourceId, 'KeyVault')].{time:eventTimestamp, operation:operationName.value, status:status.value}" \
        -o table
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}====================================================================${NC}"
    echo -e "${BLUE}Select Rotation Action${NC}"
    echo -e "${BLUE}====================================================================${NC}"
    echo ""
    echo "1) Rotate Database Password"
    echo "2) Rotate JWT Secret"
    echo "3) Rotate API Keys"
    echo "4) Revoke Vendor Access"
    echo "5) Audit All Secrets"
    echo "6) Rotate All Credentials (Emergency)"
    echo "7) Exit"
    echo ""
}

# Emergency rotation (all credentials)
emergency_rotation() {
    echo ""
    echo -e "${RED}====================================================================${NC}"
    echo -e "${RED}EMERGENCY CREDENTIAL ROTATION${NC}"
    echo -e "${RED}====================================================================${NC}"
    echo -e "${RED}This will rotate ALL credentials and invalidate ALL sessions${NC}"
    echo -e "${RED}Users will need to re-authenticate${NC}"
    echo -e "${RED}Services may experience brief downtime${NC}"
    echo ""

    read -p "Are you ABSOLUTELY sure? Type 'ROTATE' to confirm: " -r
    if [[ $REPLY != "ROTATE" ]]; then
        echo -e "${YELLOW}Emergency rotation cancelled${NC}"
        return
    fi

    echo -e "${RED}Starting emergency rotation...${NC}"

    rotate_database_password
    rotate_jwt_secret
    revoke_vendor_access

    echo ""
    echo -e "${GREEN}====================================================================${NC}"
    echo -e "${GREEN}Emergency Rotation Complete${NC}"
    echo -e "${GREEN}====================================================================${NC}"
    echo -e "${YELLOW}Action Required:${NC}"
    echo -e "1. Update database user password manually"
    echo -e "2. Restart all application services"
    echo -e "3. Notify users about session invalidation"
    echo -e "4. Monitor logs for any issues"
    echo -e "5. Document this rotation in security log"
}

# Main script execution
main() {
    check_prerequisites

    while true; do
        show_menu
        read -p "Enter choice [1-7]: " choice

        case $choice in
            1) rotate_database_password ;;
            2) rotate_jwt_secret ;;
            3) rotate_api_keys ;;
            4) revoke_vendor_access ;;
            5) audit_secrets ;;
            6) emergency_rotation ;;
            7)
                echo -e "${GREEN}Exiting...${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice. Please select 1-7${NC}"
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main
