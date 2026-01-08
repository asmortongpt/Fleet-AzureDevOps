#!/bin/bash

################################################################################
# Azure VM Testing Infrastructure Setup
# Configures Azure VMs with Playwright for comprehensive SSO testing
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Azure VM Testing Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Configuration
RESOURCE_GROUP="fleet-testing-rg"
LOCATION="eastus"
VM_SIZE="Standard_D2s_v3"  # 2 vCPUs, 8GB RAM - good for testing
VM_COUNT=3
VM_PREFIX="fleet-test-vm"
VNET_NAME="fleet-test-vnet"
SUBNET_NAME="fleet-test-subnet"
NSG_NAME="fleet-test-nsg"

# Check if logged in to Azure
echo -e "${YELLOW}Checking Azure CLI authentication...${NC}"
if ! az account show &>/dev/null; then
    echo -e "${RED}Not logged in to Azure. Please run: az login${NC}"
    exit 1
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✓ Using subscription: $SUBSCRIPTION${NC}"
echo ""

# Create resource group
echo -e "${YELLOW}Creating resource group: $RESOURCE_GROUP${NC}"
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output table

# Create virtual network
echo -e "${YELLOW}Creating virtual network...${NC}"
az network vnet create \
    --resource-group $RESOURCE_GROUP \
    --name $VNET_NAME \
    --address-prefix 10.0.0.0/16 \
    --subnet-name $SUBNET_NAME \
    --subnet-prefix 10.0.1.0/24 \
    --output table

# Create network security group
echo -e "${YELLOW}Creating network security group...${NC}"
az network nsg create \
    --resource-group $RESOURCE_GROUP \
    --name $NSG_NAME \
    --output table

# Allow SSH
az network nsg rule create \
    --resource-group $RESOURCE_GROUP \
    --nsg-name $NSG_NAME \
    --name AllowSSH \
    --priority 1000 \
    --source-address-prefixes '*' \
    --source-port-ranges '*' \
    --destination-address-prefixes '*' \
    --destination-port-ranges 22 \
    --access Allow \
    --protocol Tcp \
    --output table

# Allow HTTP (for testing)
az network nsg rule create \
    --resource-group $RESOURCE_GROUP \
    --nsg-name $NSG_NAME \
    --name AllowHTTP \
    --priority 1001 \
    --source-address-prefixes '*' \
    --source-port-ranges '*' \
    --destination-address-prefixes '*' \
    --destination-port-ranges 80 \
    --access Allow \
    --protocol Tcp \
    --output table

# Allow HTTPS
az network nsg rule create \
    --resource-group $RESOURCE_GROUP \
    --nsg-name $NSG_NAME \
    --name AllowHTTPS \
    --priority 1002 \
    --source-address-prefixes '*' \
    --source-port-ranges '*' \
    --destination-address-prefixes '*' \
    --destination-port-ranges 443 \
    --access Allow \
    --protocol Tcp \
    --output table

echo ""
echo -e "${GREEN}✓ Network infrastructure created${NC}"
echo ""

# Create VMs
echo -e "${BLUE}Creating $VM_COUNT test VMs...${NC}"
echo ""

for i in $(seq 1 $VM_COUNT); do
    VM_NAME="${VM_PREFIX}-${i}"
    PUBLIC_IP_NAME="${VM_NAME}-ip"
    NIC_NAME="${VM_NAME}-nic"

    echo -e "${YELLOW}Creating VM $i/$VM_COUNT: $VM_NAME${NC}"

    # Create public IP
    az network public-ip create \
        --resource-group $RESOURCE_GROUP \
        --name $PUBLIC_IP_NAME \
        --sku Standard \
        --output none

    # Create NIC
    az network nic create \
        --resource-group $RESOURCE_GROUP \
        --name $NIC_NAME \
        --vnet-name $VNET_NAME \
        --subnet $SUBNET_NAME \
        --public-ip-address $PUBLIC_IP_NAME \
        --network-security-group $NSG_NAME \
        --output none

    # Create VM with Ubuntu 22.04
    az vm create \
        --resource-group $RESOURCE_GROUP \
        --name $VM_NAME \
        --nics $NIC_NAME \
        --image Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest \
        --size $VM_SIZE \
        --admin-username azureuser \
        --generate-ssh-keys \
        --output table \
        --no-wait

    echo -e "${GREEN}✓ VM $VM_NAME creation started${NC}"
done

echo ""
echo -e "${BLUE}Waiting for VMs to be created (this may take 3-5 minutes)...${NC}"
echo ""

# Wait for all VMs
for i in $(seq 1 $VM_COUNT); do
    VM_NAME="${VM_PREFIX}-${i}"
    echo -e "${YELLOW}Waiting for $VM_NAME...${NC}"
    az vm wait \
        --resource-group $RESOURCE_GROUP \
        --name $VM_NAME \
        --created \
        --timeout 600
    echo -e "${GREEN}✓ $VM_NAME is ready${NC}"
done

echo ""
echo -e "${GREEN}✓ All VMs created successfully${NC}"
echo ""

# Get VM IPs and create setup script
echo -e "${BLUE}VM Details:${NC}"
echo ""

for i in $(seq 1 $VM_COUNT); do
    VM_NAME="${VM_PREFIX}-${i}"
    PUBLIC_IP=$(az vm show -d \
        --resource-group $RESOURCE_GROUP \
        --name $VM_NAME \
        --query publicIps \
        -o tsv)

    echo -e "${GREEN}$VM_NAME:${NC}"
    echo -e "  Public IP: $PUBLIC_IP"
    echo -e "  SSH: ${BLUE}ssh azureuser@$PUBLIC_IP${NC}"
    echo ""
done

# Create setup script for VMs
cat > /tmp/setup-test-vm.sh << 'SETUP_SCRIPT'
#!/bin/bash
set -e

echo "Installing dependencies..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Playwright dependencies
sudo apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    libgtk-3-0

# Install Git
sudo apt-get install -y git

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker azureuser

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

echo "✓ Base dependencies installed"

# Clone Fleet repository
cd ~
if [ ! -d "Fleet" ]; then
    git clone https://github.com/andrewmorton/Fleet.git
    cd Fleet
else
    cd Fleet
    git pull
fi

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit

echo "✓ Playwright setup complete"

# Create test runner script
cat > ~/run-tests.sh << 'TEST_RUNNER'
#!/bin/bash
cd ~/Fleet

# Run comprehensive auth tests
echo "Running comprehensive auth tests..."
APP_URL=https://fleet.capitaltechalliance.com \
npx playwright test e2e/auth-comprehensive.spec.ts \
    --reporter=html,json,junit \
    --output=test-results-$(hostname) \
    --workers=2

# Run SSO tests
echo "Running SSO tests..."
APP_URL=https://fleet.capitaltechalliance.com \
npx playwright test e2e/sso-login.spec.ts \
    --reporter=html,json,junit \
    --output=test-results-$(hostname) \
    --workers=2

echo "Tests complete. Results in test-results-$(hostname)/"
TEST_RUNNER

chmod +x ~/run-tests.sh

echo ""
echo "========================================="
echo "✓ Test VM Setup Complete"
echo "========================================="
echo ""
echo "To run tests:"
echo "  ./run-tests.sh"
echo ""
echo "To view results:"
echo "  npx playwright show-report test-results-$(hostname)/html"
echo ""
SETUP_SCRIPT

chmod +x /tmp/setup-test-vm.sh

echo ""
echo -e "${BLUE}Installing test dependencies on VMs...${NC}"
echo ""

# Deploy setup script to each VM
for i in $(seq 1 $VM_COUNT); do
    VM_NAME="${VM_PREFIX}-${i}"
    PUBLIC_IP=$(az vm show -d \
        --resource-group $RESOURCE_GROUP \
        --name $VM_NAME \
        --query publicIps \
        -o tsv)

    echo -e "${YELLOW}Setting up $VM_NAME ($PUBLIC_IP)...${NC}"

    # Copy script
    scp -o StrictHostKeyChecking=no \
        /tmp/setup-test-vm.sh \
        azureuser@$PUBLIC_IP:~/

    # Run setup (in background)
    ssh -o StrictHostKeyChecking=no \
        azureuser@$PUBLIC_IP \
        'chmod +x ~/setup-test-vm.sh && nohup ~/setup-test-vm.sh > setup.log 2>&1 &'

    echo -e "${GREEN}✓ Setup started on $VM_NAME${NC}"
    echo -e "  Monitor progress: ${BLUE}ssh azureuser@$PUBLIC_IP 'tail -f setup.log'${NC}"
    echo ""
done

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ Azure VM Testing Infrastructure Ready${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Wait for setup to complete (~5-10 minutes):"
echo -e "   ${BLUE}ssh azureuser@<VM_IP> 'tail -f setup.log'${NC}"
echo ""
echo "2. Run tests on each VM:"
echo -e "   ${BLUE}ssh azureuser@<VM_IP> './run-tests.sh'${NC}"
echo ""
echo "3. Collect results:"
echo -e "   ${BLUE}scp -r azureuser@<VM_IP>:~/Fleet/test-results-* ./results/${NC}"
echo ""
echo "4. Clean up when done:"
echo -e "   ${BLUE}az group delete --name $RESOURCE_GROUP --yes --no-wait${NC}"
echo ""

# Create cleanup script
cat > azure-vm-cleanup.sh << 'CLEANUP'
#!/bin/bash
echo "Deleting Azure VM testing infrastructure..."
az group delete --name fleet-testing-rg --yes --no-wait
echo "✓ Cleanup initiated. Resources will be deleted in the background."
CLEANUP

chmod +x azure-vm-cleanup.sh

echo -e "${GREEN}Cleanup script created: ${BLUE}./azure-vm-cleanup.sh${NC}"
echo ""
