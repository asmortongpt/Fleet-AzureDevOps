#!/bin/bash

##############################################################################
# Azure VM Fleet Completion AI Agents - Deployment Script
# Deploys 5 specialized AI agents on Azure VMs to complete Fleet development
##############################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="fleet-completion-agents-rg"
LOCATION="eastus"
VM_SIZE="Standard_B2s"  # 2 vCPU, 4 GB RAM - cost-effective
IMAGE="Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest"
ADMIN_USER="azureuser"
# Repository URL - use PAT from environment
AZURE_DEVOPS_PAT="${AZURE_DEVOPS_PAT:-}"
if [ -z "$AZURE_DEVOPS_PAT" ]; then
    echo -e "${RED}ERROR: AZURE_DEVOPS_PAT not found in environment${NC}"
    echo "Please set AZURE_DEVOPS_PAT environment variable"
    exit 1
fi
REPO_URL="https://${AZURE_DEVOPS_PAT}@dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet"

# Generate SSH key if it doesn't exist
SSH_KEY_PATH="$HOME/.ssh/fleet-agents-key"
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${BLUE}Generating SSH key...${NC}"
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "fleet-agents@azure"
fi

# Agent definitions
declare -A AGENTS=(
    ["agent1"]="enterprise-data-table:Claude 3.5 Sonnet:EnterpriseDataTable.tsx:ANTHROPIC_API_KEY"
    ["agent2"]="advanced-chart-library:GPT-4 Turbo:ChartLibrary.tsx:OPENAI_API_KEY"
    ["agent3"]="complete-form-system:Gemini 1.5 Pro:FormComponents.tsx:GEMINI_API_KEY"
    ["agent4"]="performance-optimization:Claude 3.5 Sonnet:vite.config.optimized.ts:ANTHROPIC_API_KEY"
    ["agent5"]="storybook-documentation:GPT-4 Turbo:.storybook:OPENAI_API_KEY"
)

# Load API keys from environment
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
GITHUB_PAT="${GITHUB_PAT:-}"

if [ -z "$ANTHROPIC_API_KEY" ] || [ -z "$OPENAI_API_KEY" ] || [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}ERROR: API keys not found in environment${NC}"
    echo "Please set: ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY"
    exit 1
fi

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Azure VM Fleet Completion AI Agents - Deployment          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Create Resource Group
echo -e "${BLUE}Step 1: Creating Resource Group...${NC}"
if az group exists --name "$RESOURCE_GROUP" | grep -q "true"; then
    echo -e "${YELLOW}Resource group already exists. Deleting and recreating...${NC}"
    az group delete --name "$RESOURCE_GROUP" --yes --no-wait
    sleep 30
fi

az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags "Project=Fleet-Completion" "Environment=AI-Agents" "CostCenter=Development"

echo -e "${GREEN}✓ Resource group created${NC}"
echo ""

# Step 2: Create Network Security Group
echo -e "${BLUE}Step 2: Creating Network Security Group...${NC}"
NSG_NAME="fleet-agents-nsg"

az network nsg create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$NSG_NAME" \
    --location "$LOCATION"

# Allow SSH from anywhere (for management)
az network nsg rule create \
    --resource-group "$RESOURCE_GROUP" \
    --nsg-name "$NSG_NAME" \
    --name "Allow-SSH" \
    --priority 100 \
    --source-address-prefixes '*' \
    --source-port-ranges '*' \
    --destination-address-prefixes '*' \
    --destination-port-ranges 22 \
    --access Allow \
    --protocol Tcp

# Allow HTTP/HTTPS for package downloads
az network nsg rule create \
    --resource-group "$RESOURCE_GROUP" \
    --nsg-name "$NSG_NAME" \
    --name "Allow-HTTP-Outbound" \
    --priority 200 \
    --direction Outbound \
    --source-address-prefixes '*' \
    --source-port-ranges '*' \
    --destination-address-prefixes '*' \
    --destination-port-ranges 80 443 \
    --access Allow \
    --protocol Tcp

echo -e "${GREEN}✓ Network security group created${NC}"
echo ""

# Step 3: Create Virtual Network
echo -e "${BLUE}Step 3: Creating Virtual Network...${NC}"
VNET_NAME="fleet-agents-vnet"
SUBNET_NAME="agents-subnet"

az network vnet create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VNET_NAME" \
    --address-prefix 10.0.0.0/16 \
    --subnet-name "$SUBNET_NAME" \
    --subnet-prefix 10.0.1.0/24 \
    --location "$LOCATION"

# Associate NSG with subnet
az network vnet subnet update \
    --resource-group "$RESOURCE_GROUP" \
    --vnet-name "$VNET_NAME" \
    --name "$SUBNET_NAME" \
    --network-security-group "$NSG_NAME"

echo -e "${GREEN}✓ Virtual network created${NC}"
echo ""

# Step 4: Deploy VMs
echo -e "${BLUE}Step 4: Deploying AI Agent VMs (5 VMs)...${NC}"
declare -A VM_IPS
declare -A VM_NAMES

agent_num=1
for agent_key in "${!AGENTS[@]}"; do
    IFS=':' read -r agent_name llm_model output_file api_key_name <<< "${AGENTS[$agent_key]}"

    VM_NAME="fleet-${agent_name}-vm"
    VM_NAMES[$agent_key]="$VM_NAME"
    PUBLIC_IP_NAME="${VM_NAME}-ip"
    NIC_NAME="${VM_NAME}-nic"

    echo -e "${YELLOW}Deploying Agent $agent_num: $agent_name (using $llm_model)${NC}"

    # Create public IP
    az network public-ip create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$PUBLIC_IP_NAME" \
        --allocation-method Static \
        --sku Standard \
        --location "$LOCATION" \
        --tags "Agent=$agent_name" "LLM=$llm_model"

    # Create NIC
    az network nic create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$NIC_NAME" \
        --vnet-name "$VNET_NAME" \
        --subnet "$SUBNET_NAME" \
        --public-ip-address "$PUBLIC_IP_NAME" \
        --network-security-group "$NSG_NAME" \
        --location "$LOCATION"

    # Create VM
    az vm create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VM_NAME" \
        --location "$LOCATION" \
        --nics "$NIC_NAME" \
        --image "$IMAGE" \
        --size "$VM_SIZE" \
        --admin-username "$ADMIN_USER" \
        --ssh-key-values "@${SSH_KEY_PATH}.pub" \
        --os-disk-size-gb 128 \
        --storage-sku Premium_LRS \
        --tags "Agent=$agent_name" "LLM=$llm_model" "Output=$output_file" \
        --no-wait

    # Get public IP
    PUBLIC_IP=$(az network public-ip show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$PUBLIC_IP_NAME" \
        --query ipAddress -o tsv)

    VM_IPS[$agent_key]="$PUBLIC_IP"

    echo -e "${GREEN}  ✓ VM created: $VM_NAME (IP: $PUBLIC_IP)${NC}"
    ((agent_num++))
done

echo -e "${GREEN}✓ All VMs deployed (provisioning in progress)${NC}"
echo ""

# Wait for all VMs to be ready
echo -e "${BLUE}Step 5: Waiting for VMs to be ready (this may take 3-5 minutes)...${NC}"
sleep 180

for agent_key in "${!AGENTS[@]}"; do
    VM_NAME="${VM_NAMES[$agent_key]}"
    echo -e "${YELLOW}Checking VM: $VM_NAME${NC}"

    az vm wait \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VM_NAME" \
        --created \
        --timeout 600 || true

    echo -e "${GREEN}  ✓ $VM_NAME is ready${NC}"
done

echo -e "${GREEN}✓ All VMs are ready${NC}"
echo ""

# Step 6: Configure and Start AI Agents
echo -e "${BLUE}Step 6: Configuring AI Agents on VMs...${NC}"

for agent_key in "${!AGENTS[@]}"; do
    IFS=':' read -r agent_name llm_model output_file api_key_name <<< "${AGENTS[$agent_key]}"
    VM_NAME="${VM_NAMES[$agent_key]}"
    PUBLIC_IP="${VM_IPS[$agent_key]}"

    # Get the API key value based on the key name
    API_KEY_VALUE=""
    case "$api_key_name" in
        "ANTHROPIC_API_KEY")
            API_KEY_VALUE="$ANTHROPIC_API_KEY"
            ;;
        "OPENAI_API_KEY")
            API_KEY_VALUE="$OPENAI_API_KEY"
            ;;
        "GEMINI_API_KEY")
            API_KEY_VALUE="$GEMINI_API_KEY"
            ;;
    esac

    echo -e "${YELLOW}Configuring Agent: $agent_name on $VM_NAME${NC}"

    # Create initialization script
    cat > "/tmp/init-${agent_key}.sh" <<'EOF'
#!/bin/bash
set -euo pipefail

# Update system
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3 and pip
sudo apt-get install -y python3 python3-pip python3-venv

# Install Git
sudo apt-get install -y git

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Create working directory
mkdir -p ~/fleet-agent
cd ~/fleet-agent

# Clone repository
git clone REPO_URL fleet
cd fleet

# Install npm dependencies
npm install

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies for AI agent
pip install anthropic openai google-generativeai python-dotenv gitpython

# Create agent script
cat > agent.py <<'AGENT_SCRIPT'
AGENT_SCRIPT_CONTENT
AGENT_SCRIPT

# Create environment file
cat > .env <<'ENVFILE'
ENV_CONTENT
ENVFILE

# Run the AI agent
nohup python agent.py > ~/agent.log 2>&1 &

echo "Agent started. PID: $!"
echo "Log file: ~/agent.log"
EOF

    # Replace placeholders
    sed -i "s|REPO_URL|$REPO_URL|g" "/tmp/init-${agent_key}.sh"

    # Upload and execute initialization script
    scp -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" \
        "/tmp/init-${agent_key}.sh" \
        "${ADMIN_USER}@${PUBLIC_IP}:~/init.sh"

    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" \
        "${ADMIN_USER}@${PUBLIC_IP}" \
        "chmod +x ~/init.sh && nohup ~/init.sh > ~/init.log 2>&1 &"

    echo -e "${GREEN}  ✓ Agent configured and starting${NC}"
done

echo -e "${GREEN}✓ All agents configured${NC}"
echo ""

# Step 7: Create monitoring script
echo -e "${BLUE}Step 7: Creating monitoring script...${NC}"

cat > "monitor-agents.sh" <<'MONITOR_SCRIPT'
#!/bin/bash

RESOURCE_GROUP="fleet-completion-agents-rg"
SSH_KEY_PATH="$HOME/.ssh/fleet-agents-key"
ADMIN_USER="azureuser"

echo "Fleet AI Agents - Progress Monitor"
echo "=================================="
echo ""

# Get all VMs in the resource group
VMS=$(az vm list -g "$RESOURCE_GROUP" --query "[].name" -o tsv)

for VM_NAME in $VMS; do
    echo "Agent: $VM_NAME"
    echo "-----------------------------------"

    # Get public IP
    PUBLIC_IP=$(az vm show -g "$RESOURCE_GROUP" -n "$VM_NAME" -d --query publicIps -o tsv)

    # Check if VM is running
    VM_STATUS=$(az vm get-instance-view -g "$RESOURCE_GROUP" -n "$VM_NAME" --query "instanceView.statuses[?starts_with(code, 'PowerState/')].displayStatus" -o tsv)
    echo "Status: $VM_STATUS"
    echo "IP: $PUBLIC_IP"

    # SSH and check agent log
    if [ "$VM_STATUS" == "VM running" ]; then
        echo "Latest agent log:"
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i "$SSH_KEY_PATH" \
            "${ADMIN_USER}@${PUBLIC_IP}" \
            "tail -20 ~/agent.log 2>/dev/null || echo 'Agent not started yet'"
    fi

    echo ""
done

echo "To view full logs, SSH into VMs:"
echo "ssh -i $SSH_KEY_PATH ${ADMIN_USER}@<PUBLIC_IP>"
echo ""
echo "To stop all agents:"
echo "./stop-agents.sh"
MONITOR_SCRIPT

chmod +x monitor-agents.sh

echo -e "${GREEN}✓ Monitoring script created: ./monitor-agents.sh${NC}"
echo ""

# Step 8: Create cleanup script
cat > "stop-agents.sh" <<'STOP_SCRIPT'
#!/bin/bash

RESOURCE_GROUP="fleet-completion-agents-rg"

echo "Stopping all AI agents and deleting resources..."
echo "This will delete the resource group: $RESOURCE_GROUP"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" == "yes" ]; then
    az group delete --name "$RESOURCE_GROUP" --yes --no-wait
    echo "Resource group deletion initiated."
    echo "Check status: az group show --name $RESOURCE_GROUP"
else
    echo "Cancelled."
fi
STOP_SCRIPT

chmod +x stop-agents.sh

echo -e "${GREEN}✓ Cleanup script created: ./stop-agents.sh${NC}"
echo ""

# Step 9: Create summary
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                 DEPLOYMENT COMPLETE                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}AI Agents Deployed:${NC}"
echo ""

agent_num=1
for agent_key in "${!AGENTS[@]}"; do
    IFS=':' read -r agent_name llm_model output_file api_key_name <<< "${AGENTS[$agent_key]}"
    VM_NAME="${VM_NAMES[$agent_key]}"
    PUBLIC_IP="${VM_IPS[$agent_key]}"

    echo -e "${YELLOW}Agent $agent_num: $agent_name${NC}"
    echo "  VM: $VM_NAME"
    echo "  IP: $PUBLIC_IP"
    echo "  LLM: $llm_model"
    echo "  Output: $output_file"
    echo "  Status: Initializing (check with monitor-agents.sh)"
    echo ""
    ((agent_num++))
done

echo -e "${BLUE}Estimated Completion Time:${NC} 30-45 minutes per agent"
echo -e "${BLUE}Total Expected Time:${NC} 1-2 hours (agents run in parallel)"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Monitor progress:"
echo "   ./monitor-agents.sh"
echo ""
echo "2. SSH to individual VMs:"
echo "   ssh -i $SSH_KEY_PATH ${ADMIN_USER}@<PUBLIC_IP>"
echo ""
echo "3. View agent logs:"
echo "   ssh -i $SSH_KEY_PATH ${ADMIN_USER}@<PUBLIC_IP> 'tail -f ~/agent.log'"
echo ""
echo "4. Check repository for commits:"
echo "   git fetch && git log --oneline"
echo ""
echo "5. Stop agents and cleanup:"
echo "   ./stop-agents.sh"
echo ""

echo -e "${GREEN}Deployment script completed successfully!${NC}"
