#!/bin/bash
##############################################################################
# Deploy Retool to Azure VM
# This script finds your Fleet testing VM and installs Retool on it
##############################################################################

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Deploy Retool to Azure Fleet Testing VM             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_SCRIPT="$SCRIPT_DIR/install-retool-on-azure-vm.sh"

# Check if install script exists
if [ ! -f "$INSTALL_SCRIPT" ]; then
    echo -e "${RED}ERROR: Install script not found at $INSTALL_SCRIPT${NC}"
    exit 1
fi

# Step 1: Find Fleet-related Azure VMs
echo -e "${BLUE}[1/5] Finding Fleet testing VMs in Azure...${NC}"
echo ""

# Search for VMs with 'fleet' in the name or resource group
VMS=$(az vm list --query "[?contains(name, 'fleet') || contains(resourceGroup, 'fleet')].{Name:name, ResourceGroup:resourceGroup, Location:location, PowerState:powerState, IP:publicIps}" -o tsv 2>/dev/null || echo "")

if [ -z "$VMS" ]; then
    echo -e "${YELLOW}No Fleet VMs found. Searching all VMs...${NC}"
    VMS=$(az vm list --query "[].{Name:name, ResourceGroup:resourceGroup, Location:location}" -o tsv)
fi

if [ -z "$VMS" ]; then
    echo -e "${RED}ERROR: No VMs found in Azure subscription${NC}"
    echo ""
    echo "Please ensure:"
    echo "  1. You are logged in to Azure CLI: az login"
    echo "  2. You have selected the correct subscription: az account set --subscription <id>"
    echo "  3. You have VMs in your subscription"
    exit 1
fi

echo -e "${GREEN}Found VMs:${NC}"
echo "$VMS" | nl
echo ""

# Step 2: Select VM
echo -e "${BLUE}[2/5] Select target VM:${NC}"
SELECTED_VM=""
SELECTED_RG=""

# Count VMs
VM_COUNT=$(echo "$VMS" | wc -l | tr -d ' ')

if [ "$VM_COUNT" -eq 1 ]; then
    # Auto-select if only one VM
    SELECTED_VM=$(echo "$VMS" | awk '{print $1}')
    SELECTED_RG=$(echo "$VMS" | awk '{print $2}')
    echo -e "${GREEN}Auto-selected VM: ${CYAN}$SELECTED_VM${NC} in ${CYAN}$SELECTED_RG${NC}"
else
    # Let user select
    read -p "Enter VM number (1-$VM_COUNT): " VM_NUM
    SELECTED_VM=$(echo "$VMS" | sed -n "${VM_NUM}p" | awk '{print $1}')
    SELECTED_RG=$(echo "$VMS" | sed -n "${VM_NUM}p" | awk '{print $2}')

    if [ -z "$SELECTED_VM" ]; then
        echo -e "${RED}ERROR: Invalid selection${NC}"
        exit 1
    fi

    echo -e "${GREEN}Selected: ${CYAN}$SELECTED_VM${NC} in ${CYAN}$SELECTED_RG${NC}"
fi
echo ""

# Step 3: Get VM details and public IP
echo -e "${BLUE}[3/5] Getting VM details...${NC}"

VM_DETAILS=$(az vm show -g "$SELECTED_RG" -n "$SELECTED_VM" -d --query "{PowerState:powerState, PublicIP:publicIps, PrivateIP:privateIps, AdminUser:osProfile.adminUsername}" -o json)

POWER_STATE=$(echo "$VM_DETAILS" | jq -r '.PowerState')
PUBLIC_IP=$(echo "$VM_DETAILS" | jq -r '.PublicIP')
PRIVATE_IP=$(echo "$VM_DETAILS" | jq -r '.PrivateIP')
ADMIN_USER=$(echo "$VM_DETAILS" | jq -r '.AdminUser // "azureuser"')

echo -e "${CYAN}Power State:${NC} $POWER_STATE"
echo -e "${CYAN}Public IP:${NC} $PUBLIC_IP"
echo -e "${CYAN}Private IP:${NC} $PRIVATE_IP"
echo -e "${CYAN}Admin User:${NC} $ADMIN_USER"
echo ""

# Check if VM is running
if [ "$POWER_STATE" != "VM running" ]; then
    echo -e "${YELLOW}⚠ VM is not running (state: $POWER_STATE)${NC}"
    read -p "Start VM now? (y/n): " START_VM

    if [ "$START_VM" = "y" ] || [ "$START_VM" = "Y" ]; then
        echo -e "${BLUE}Starting VM...${NC}"
        az vm start -g "$SELECTED_RG" -n "$SELECTED_VM"
        echo -e "${GREEN}✓ VM started${NC}"

        # Wait for SSH to be ready
        echo "Waiting for SSH to be ready..."
        sleep 30
    else
        echo -e "${RED}Cannot proceed with stopped VM${NC}"
        exit 1
    fi
fi

# If no public IP, allocate one
if [ "$PUBLIC_IP" = "null" ] || [ -z "$PUBLIC_IP" ]; then
    echo -e "${YELLOW}⚠ No public IP found. Allocating one...${NC}"

    NIC_ID=$(az vm show -g "$SELECTED_RG" -n "$SELECTED_VM" --query "networkProfile.networkInterfaces[0].id" -o tsv)
    NIC_NAME=$(basename "$NIC_ID")

    # Create public IP
    PUBLIC_IP_NAME="${SELECTED_VM}-ip"
    az network public-ip create \
        --resource-group "$SELECTED_RG" \
        --name "$PUBLIC_IP_NAME" \
        --allocation-method Static \
        --sku Standard

    # Associate with NIC
    az network nic ip-config update \
        --resource-group "$SELECTED_RG" \
        --nic-name "$NIC_NAME" \
        --name ipconfig1 \
        --public-ip-address "$PUBLIC_IP_NAME"

    PUBLIC_IP=$(az network public-ip show -g "$SELECTED_RG" -n "$PUBLIC_IP_NAME" --query ipAddress -o tsv)
    echo -e "${GREEN}✓ Public IP allocated: $PUBLIC_IP${NC}"
fi
echo ""

# Step 4: Copy install script to VM
echo -e "${BLUE}[4/5] Copying install script to VM...${NC}"

# Try SSH with common key locations
SSH_KEY_PATHS=(
    "$HOME/.ssh/id_rsa"
    "$HOME/.ssh/fleet-agents-key"
    "$HOME/.ssh/azure_vm_key"
    "$HOME/.ssh/id_ed25519"
)

SSH_KEY=""
for KEY_PATH in "${SSH_KEY_PATHS[@]}"; do
    if [ -f "$KEY_PATH" ]; then
        echo -e "${CYAN}Trying SSH key: $KEY_PATH${NC}"
        if ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=5 "${ADMIN_USER}@${PUBLIC_IP}" "echo 'SSH OK'" 2>/dev/null; then
            SSH_KEY="$KEY_PATH"
            echo -e "${GREEN}✓ SSH connection successful${NC}"
            break
        fi
    fi
done

if [ -z "$SSH_KEY" ]; then
    echo -e "${YELLOW}⚠ Could not connect with SSH keys. Trying password auth...${NC}"
    scp -o StrictHostKeyChecking=no "$INSTALL_SCRIPT" "${ADMIN_USER}@${PUBLIC_IP}:/tmp/install-retool.sh"
else
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$INSTALL_SCRIPT" "${ADMIN_USER}@${PUBLIC_IP}:/tmp/install-retool.sh"
fi

echo -e "${GREEN}✓ Script copied to VM${NC}"
echo ""

# Step 5: Execute installation on VM
echo -e "${BLUE}[5/5] Installing Retool on VM...${NC}"
echo ""

# Get database credentials from environment or prompt
FLEET_DB_HOST="${FLEET_DB_HOST:-fleet-db.postgres.database.azure.com}"
FLEET_DB_NAME="${FLEET_DB_NAME:-fleetdb}"
FLEET_DB_USER="${FLEET_DB_USER:-fleetadmin}"
FLEET_API_URL="${FLEET_API_URL:-https://fleet.capitaltechalliance.com}"

echo -e "${CYAN}Configuration:${NC}"
echo -e "  Database Host: $FLEET_DB_HOST"
echo -e "  Database Name: $FLEET_DB_NAME"
echo -e "  Database User: $FLEET_DB_USER"
echo -e "  API URL: $FLEET_API_URL"
echo ""

read -p "Is this correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${RED}Installation cancelled${NC}"
    exit 0
fi

# Execute install script on VM
if [ -z "$SSH_KEY" ]; then
    ssh -o StrictHostKeyChecking=no "${ADMIN_USER}@${PUBLIC_IP}" \
        "export FLEET_DB_HOST='$FLEET_DB_HOST' && \
         export FLEET_DB_NAME='$FLEET_DB_NAME' && \
         export FLEET_DB_USER='$FLEET_DB_USER' && \
         export FLEET_API_URL='$FLEET_API_URL' && \
         chmod +x /tmp/install-retool.sh && \
         /tmp/install-retool.sh"
else
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${ADMIN_USER}@${PUBLIC_IP}" \
        "export FLEET_DB_HOST='$FLEET_DB_HOST' && \
         export FLEET_DB_NAME='$FLEET_DB_NAME' && \
         export FLEET_DB_USER='$FLEET_DB_USER' && \
         export FLEET_API_URL='$FLEET_API_URL' && \
         chmod +x /tmp/install-retool.sh && \
         /tmp/install-retool.sh"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           RETOOL DEPLOYMENT COMPLETE                         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}VM Details:${NC}"
echo -e "  Name: $SELECTED_VM"
echo -e "  Resource Group: $SELECTED_RG"
echo -e "  Public IP: $PUBLIC_IP"
echo -e "  Admin User: $ADMIN_USER"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo -e "  1. ${YELLOW}SSH into the VM:${NC}"
if [ -z "$SSH_KEY" ]; then
    echo -e "     ${BLUE}ssh ${ADMIN_USER}@${PUBLIC_IP}${NC}"
else
    echo -e "     ${BLUE}ssh -i $SSH_KEY ${ADMIN_USER}@${PUBLIC_IP}${NC}"
fi
echo ""
echo -e "  2. ${YELLOW}View Retool documentation:${NC}"
echo -e "     ${BLUE}cat /opt/retool/fleet-admin/README.md${NC}"
echo ""
echo -e "  3. ${YELLOW}Login to Retool:${NC}"
echo -e "     ${BLUE}retool login${NC}"
echo ""
echo -e "  4. ${YELLOW}Push configuration to Retool cloud:${NC}"
echo -e "     ${BLUE}cd /opt/retool/fleet-admin && retool push${NC}"
echo ""
echo -e "  5. ${YELLOW}Access Retool at:${NC}"
echo -e "     ${BLUE}https://retool.com${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
