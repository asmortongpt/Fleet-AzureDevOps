#!/bin/bash

###############################################################################
# Deploy All 15 Autonomous AI Agents to Azure
# 8 OpenAI Codex Agents + 7 Google Gemini Agents
###############################################################################

set -e

echo "🤖 Fleet Management System - AI Agent Deployment"
echo "=================================================="
echo ""
echo "Deploying 15 Autonomous Agents to Azure:"
echo "  - 8 OpenAI Codex Agents (32 vCPUs, 64GB RAM)"
echo "  - 7 Google Gemini Agents (26 vCPUs, 52GB RAM)"
echo "  - Total: 58 vCPUs, 116GB RAM"
echo ""

# Configuration
RESOURCE_GROUP="fleet-ai-agents"
LOCATION="eastus2"
SUBSCRIPTION_ID="021415c2-2f52-4a73-ae77-f8363165a5e1"

# Set active subscription
echo "1️⃣ Setting Azure subscription..."
az account set --subscription "$SUBSCRIPTION_ID"
echo "✅ Using subscription: $SUBSCRIPTION_ID"
echo ""

# Create resource group if it doesn't exist
echo "2️⃣ Creating resource group..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --tags "project=fleet-management" "purpose=ai-agents" "cost-center=development"
echo "✅ Resource group ready: $RESOURCE_GROUP"
echo ""

# Create Azure Key Vault for API keys
echo "3️⃣ Creating Azure Key Vault..."
VAULT_NAME="fleetai$(date +%s | tail -c 10)"
az keyvault create \
  --name "$VAULT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku standard \
  --enabled-for-deployment true \
  --enabled-for-template-deployment true
echo "✅ Key Vault created: $VAULT_NAME"
echo ""

# Store API keys in Key Vault
echo "4️⃣ Storing API keys in Key Vault..."

# OpenAI API Key
az keyvault secret set \
  --vault-name "$VAULT_NAME" \
  --name "OPENAI-API-KEY" \
  --value "$OPENAI_API_KEY" \
  --description "OpenAI API Key for Codex agents"

# Gemini API Key
az keyvault secret set \
  --vault-name "$VAULT_NAME" \
  --name "GEMINI-API-KEY" \
  --value "$GEMINI_API_KEY" \
  --description "Google Gemini API Key for review agents"

# GitHub PAT
az keyvault secret set \
  --vault-name "$VAULT_NAME" \
  --name "GITHUB-PAT" \
  --value "$GITHUB_PAT" \
  --description "GitHub Personal Access Token"

# Azure DevOps PAT
az keyvault secret set \
  --vault-name "$VAULT_NAME" \
  --name "AZURE-DEVOPS-PAT" \
  --value "$AZURE_DEVOPS_PAT" \
  --description "Azure DevOps Personal Access Token"

# Database connection string
az keyvault secret set \
  --vault-name "$VAULT_NAME" \
  --name "DATABASE-CONNECTION-STRING" \
  --value "postgresql://fleet_user:fleet_password@localhost:5432/fleet_dev" \
  --description "PostgreSQL connection string"

echo "✅ API keys stored securely"
echo ""

###############################################################################
# Deploy OpenAI Codex Agents (8 total)
###############################################################################

echo "5️⃣ Deploying OpenAI Codex Agents..."
echo "======================================"
echo ""

# Agent 1: Frontend Component Builder (4 vCPUs, 8GB RAM)
echo "  [1/8] Deploying Frontend Component Builder..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "openai-agent-1-frontend" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=openai-1" "purpose=frontend-builder" "model=gpt-4-turbo" \
  --output none

# Agent 2: Backend API Generator (4 vCPUs, 8GB RAM)
echo "  [2/8] Deploying Backend API Generator..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "openai-agent-2-backend" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=openai-2" "purpose=backend-api" "model=gpt-4-turbo" \
  --output none

# Agent 3: Database Schema Generator (2 vCPUs, 4GB RAM)
echo "  [3/8] Deploying Database Schema Generator..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "openai-agent-3-database" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D2s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=openai-3" "purpose=database-schema" "model=gpt-4-turbo" \
  --output none

# Agent 4: Test Suite Generator (4 vCPUs, 8GB RAM)
echo "  [4/8] Deploying Test Suite Generator..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "openai-agent-4-testing" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=openai-4" "purpose=test-generation" "model=gpt-4-turbo" \
  --output none

# Agent 5: Microsoft 365 Emulator Builder (8 vCPUs, 16GB RAM)
echo "  [5/8] Deploying Microsoft 365 Emulator Builder..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "openai-agent-5-m365" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D8s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=openai-5" "purpose=m365-emulators" "model=gpt-4-turbo" \
  --output none

# Agent 6: Parts Inventory Builder (4 vCPUs, 8GB RAM)
echo "  [6/8] Deploying Parts Inventory Builder..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "openai-agent-6-inventory" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=openai-6" "purpose=parts-inventory" "model=gpt-4-turbo" \
  --output none

# Agent 7: Traffic Camera Integrator (8 vCPUs, 16GB RAM)
echo "  [7/8] Deploying Traffic Camera Integrator..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "openai-agent-7-traffic" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D8s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=openai-7" "purpose=traffic-cameras" "model=gpt-4-turbo" \
  --output none

# Agent 8: Drill-Through Builder (4 vCPUs, 8GB RAM)
echo "  [8/8] Deploying Drill-Through Builder..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "openai-agent-8-drillthrough" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=openai-8" "purpose=drill-through" "model=gpt-4-turbo" \
  --output none

echo "✅ All 8 OpenAI Codex Agents deployed"
echo ""

###############################################################################
# Deploy Google Gemini Agents (7 total)
###############################################################################

echo "6️⃣ Deploying Google Gemini Agents..."
echo "====================================="
echo ""

# Agent 1: Code Quality Reviewer (4 vCPUs, 8GB RAM)
echo "  [1/7] Deploying Code Quality Reviewer..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "gemini-agent-1-reviewer" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=gemini-1" "purpose=code-review" "model=gemini-1.5-pro" \
  --output none

# Agent 2: PDCA Loop Validator (4 vCPUs, 8GB RAM)
echo "  [2/7] Deploying PDCA Loop Validator..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "gemini-agent-2-pdca" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=gemini-2" "purpose=pdca-validation" "model=gemini-1.5-pro" \
  --output none

# Agent 3: Documentation Generator (2 vCPUs, 4GB RAM)
echo "  [3/7] Deploying Documentation Generator..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "gemini-agent-3-docs" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D2s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=gemini-3" "purpose=documentation" "model=gemini-1.5-pro" \
  --output none

# Agent 4: Integration Tester (4 vCPUs, 8GB RAM)
echo "  [4/7] Deploying Integration Tester..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "gemini-agent-4-integration" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=gemini-4" "purpose=integration-tests" "model=gemini-1.5-pro" \
  --output none

# Agent 5: Performance Optimizer (4 vCPUs, 8GB RAM)
echo "  [5/7] Deploying Performance Optimizer..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "gemini-agent-5-performance" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=gemini-5" "purpose=performance" "model=gemini-1.5-pro" \
  --output none

# Agent 6: Accessibility Auditor (2 vCPUs, 4GB RAM)
echo "  [6/7] Deploying Accessibility Auditor..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "gemini-agent-6-accessibility" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D2s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=gemini-6" "purpose=accessibility" "model=gemini-1.5-pro" \
  --output none

# Agent 7: Repository Review Agent (4 vCPUs, 8GB RAM)
echo "  [7/7] Deploying Repository Review Agent..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "gemini-agent-7-repository" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_D4s_v3" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku "Standard" \
  --tags "agent=gemini-7" "purpose=repository-review" "model=gemini-1.5-pro" \
  --output none

echo "✅ All 7 Google Gemini Agents deployed"
echo ""

###############################################################################
# Configure Networking
###############################################################################

echo "7️⃣ Configuring network security..."

# Create Network Security Group
NSG_NAME="fleet-ai-agents-nsg"
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
  --destination-port-ranges 22 \
  --protocol Tcp \
  --access Allow

# Allow HTTP/HTTPS for API endpoints
az network nsg rule create \
  --resource-group "$RESOURCE_GROUP" \
  --nsg-name "$NSG_NAME" \
  --name "Allow-HTTP" \
  --priority 110 \
  --source-address-prefixes '*' \
  --destination-port-ranges 80 443 \
  --protocol Tcp \
  --access Allow

echo "✅ Network security configured"
echo ""

###############################################################################
# Install Dependencies on All VMs
###############################################################################

echo "8️⃣ Installing dependencies on all agents..."

# Create initialization script
cat > /tmp/agent-init.sh << 'EOF'
#!/bin/bash
set -e

# Update system
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Install PostgreSQL client
sudo apt-get install -y postgresql-client

# Install Python 3.11
sudo apt-get install -y python3.11 python3.11-venv python3-pip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker azureuser

# Clone Fleet repository
cd /home/azureuser
git clone https://github.com/andrewmorton/fleet-local.git
cd fleet-local
npm install

echo "✅ Agent initialized successfully"
EOF

chmod +x /tmp/agent-init.sh

# Get all VM names
VMS=$(az vm list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv)

# Run initialization script on each VM
for VM in $VMS; do
  echo "  Installing on $VM..."
  az vm run-command invoke \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VM" \
    --command-id RunShellScript \
    --scripts @/tmp/agent-init.sh \
    --output none &
done

# Wait for all background jobs
wait

echo "✅ All agents initialized"
echo ""

###############################################################################
# Summary
###############################################################################

echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📊 Deployment Summary:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Key Vault: $VAULT_NAME"
echo ""
echo "🤖 OpenAI Codex Agents (8):"
echo "  1. openai-agent-1-frontend (4 vCPUs, 8GB)"
echo "  2. openai-agent-2-backend (4 vCPUs, 8GB)"
echo "  3. openai-agent-3-database (2 vCPUs, 4GB)"
echo "  4. openai-agent-4-testing (4 vCPUs, 8GB)"
echo "  5. openai-agent-5-m365 (8 vCPUs, 16GB)"
echo "  6. openai-agent-6-inventory (4 vCPUs, 8GB)"
echo "  7. openai-agent-7-traffic (8 vCPUs, 16GB)"
echo "  8. openai-agent-8-drillthrough (4 vCPUs, 8GB)"
echo ""
echo "🧠 Google Gemini Agents (7):"
echo "  1. gemini-agent-1-reviewer (4 vCPUs, 8GB)"
echo "  2. gemini-agent-2-pdca (4 vCPUs, 8GB)"
echo "  3. gemini-agent-3-docs (2 vCPUs, 4GB)"
echo "  4. gemini-agent-4-integration (4 vCPUs, 8GB)"
echo "  5. gemini-agent-5-performance (4 vCPUs, 8GB)"
echo "  6. gemini-agent-6-accessibility (2 vCPUs, 4GB)"
echo "  7. gemini-agent-7-repository (4 vCPUs, 8GB)"
echo ""
echo "💰 Monthly Cost Estimate: ~$1,200 USD"
echo "  (Based on Standard_Ds_v3 pricing in East US 2)"
echo ""
echo "🔐 Security:"
echo "  - All API keys stored in Key Vault: $VAULT_NAME"
echo "  - SSH access enabled for management"
echo "  - Network Security Group configured"
echo ""
echo "📋 Next Steps:"
echo "  1. Verify all VMs are running:"
echo "     az vm list --resource-group $RESOURCE_GROUP --output table"
echo ""
echo "  2. SSH into any agent:"
echo "     az vm show --resource-group $RESOURCE_GROUP --name openai-agent-1-frontend --query publicIps -d"
echo "     ssh azureuser@<public-ip>"
echo ""
echo "  3. Start agent orchestration:"
echo "     npm run orchestrate"
echo ""
echo "  4. Monitor agent activity:"
echo "     npm run monitor-agents"
echo ""
echo "✅ All systems ready for autonomous development!"
echo ""
