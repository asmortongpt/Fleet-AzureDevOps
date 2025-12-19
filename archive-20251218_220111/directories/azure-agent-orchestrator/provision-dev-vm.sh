#!/bin/bash

##############################################################################
# Azure VM Provisioning Script for AI Coding Agents
#
# This script creates an Azure VM with all development tools installed
# and sets up autonomous AI agents (OpenAI Codex, Gemini Jules) to perform
# the Bloomberg Terminal UI rebuild.
##############################################################################

set -e

# Configuration
RESOURCE_GROUP="fleet-dev-agents-rg"
LOCATION="eastus2"
VM_NAME="fleet-dev-agent-01"
VM_SIZE="Standard_B2s"  # 2 vCPUs, 4GB RAM - fits within quota
IMAGE="Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest"
ADMIN_USERNAME="azureuser"
NSG_NAME="fleet-dev-nsg"

echo "🚀 Creating Azure VM for AI Coding Agents..."

# Create resource group
echo "📦 Creating resource group: $RESOURCE_GROUP"
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create network security group
echo "🔒 Creating network security group..."
az network nsg create \
  --resource-group $RESOURCE_GROUP \
  --name $NSG_NAME

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
  --protocol Tcp

# Create VM with SSH key
echo "💻 Creating VM: $VM_NAME"
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image $IMAGE \
  --size $VM_SIZE \
  --admin-username $ADMIN_USERNAME \
  --generate-ssh-keys \
  --nsg $NSG_NAME \
  --public-ip-sku Standard

# Get VM IP
VM_IP=$(az vm list-ip-addresses \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress" \
  --output tsv)

echo "✅ VM Created! IP Address: $VM_IP"

# Install development environment
echo "📥 Installing development tools on VM..."

az vm run-command invoke \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @- << 'SETUP_SCRIPT'
#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Install Docker (for containerized agents)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker azureuser

# Install Python 3.11 (for agent orchestration)
sudo apt-get install -y python3.11 python3-pip python3.11-venv

# Install build tools
sudo apt-get install -y build-essential

# Clone the Fleet repository
cd /home/azureuser
git clone https://github.com/asmortongpt/Fleet.git
cd Fleet
npm install

# Create agent workspace
mkdir -p /home/azureuser/agent-workspace
cd /home/azureuser/agent-workspace

# Install agent orchestration dependencies
python3.11 -m venv venv
source venv/bin/activate
pip install openai google-generativeai anthropic langchain redis celery

echo "✅ Development environment setup complete!"
SETUP_SCRIPT

# Create SSH config entry
echo ""
echo "📝 SSH Connection Info:"
echo "   ssh $ADMIN_USERNAME@$VM_IP"
echo ""
echo "🔑 To connect, run:"
echo "   ssh -i ~/.ssh/id_rsa $ADMIN_USERNAME@$VM_IP"
echo ""

# Save VM info to file
cat > azure-vm-info.txt << EOF
VM Name: $VM_NAME
IP Address: $VM_IP
Username: $ADMIN_USERNAME
Resource Group: $RESOURCE_GROUP
SSH Command: ssh $ADMIN_USERNAME@$VM_IP

Next Steps:
1. SSH into the VM
2. Navigate to /home/azureuser/agent-workspace
3. Run the agent orchestrator: python3 orchestrator.py
EOF

echo "✅ VM provisioning complete! Info saved to azure-vm-info.txt"
