#!/bin/bash
#
# Deploy AI Development Orchestrator to Azure VM
# Runs OpenAI + Gemini to complete all 71 features
#

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Deploying AI Dev Orchestrator to Azure VM              ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Configuration
RESOURCE_GROUP="FleetDevelopment"
VM_NAME="ai-dev-orchestrator"
LOCATION="eastus"
VM_SIZE="Standard_D4s_v3"  # 4 vCPUs, 16GB RAM
IMAGE="UbuntuLTS"

# Check if VM exists
echo "🔍 Checking if VM exists..."
if az vm show --resource-group $RESOURCE_GROUP --name $VM_NAME &>/dev/null; then
    echo "✅ VM already exists"
    VM_EXISTS=true
else
    echo "⚠️  VM not found, will create new one"
    VM_EXISTS=false
fi

# Create VM if needed
if [ "$VM_EXISTS" = false ]; then
    echo "🚀 Creating Azure VM..."

    # Create resource group
    az group create --name $RESOURCE_GROUP --location $LOCATION

    # Create VM
    az vm create \
        --resource-group $RESOURCE_GROUP \
        --name $VM_NAME \
        --image $IMAGE \
        --size $VM_SIZE \
        --admin-username azureuser \
        --generate-ssh-keys \
        --public-ip-sku Standard

    echo "✅ VM created successfully"
fi

# Get VM IP
echo "🔍 Getting VM IP address..."
VM_IP=$(az vm show -d --resource-group $RESOURCE_GROUP --name $VM_NAME --query publicIps -o tsv)
echo "📍 VM IP: $VM_IP"

# Install dependencies on VM
echo "📦 Installing Python and dependencies on VM..."
ssh azureuser@$VM_IP << 'ENDSSH'
    # Update system
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip git

    # Install Python packages
    pip3 install --user anthropic openai google-generativeai asyncio

    # Create working directory
    mkdir -p ~/fleet-dev
    cd ~/fleet-dev

    echo "✅ Dependencies installed"
ENDSSH

# Copy orchestrator script to VM
echo "📤 Uploading orchestrator script..."
scp scripts/ai_development_orchestrator.py azureuser@$VM_IP:~/fleet-dev/

# Copy environment variables (from system environment)
echo "📤 Uploading environment variables..."
echo "OPENAI_API_KEY=$OPENAI_API_KEY" > /tmp/.env.ai
echo "GEMINI_API_KEY=$GEMINI_API_KEY" >> /tmp/.env.ai
echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" >> /tmp/.env.ai
scp /tmp/.env.ai azureuser@$VM_IP:~/fleet-dev/.env
rm /tmp/.env.ai

# Copy existing codebase for context
echo "📤 Uploading codebase context..."
tar czf /tmp/fleet-context.tar.gz App/*.swift App/Views/*.swift App/ViewModels/*.swift 2>/dev/null || true
scp /tmp/fleet-context.tar.gz azureuser@$VM_IP:~/fleet-dev/
rm /tmp/fleet-context.tar.gz

ssh azureuser@$VM_IP << 'ENDSSH'
    cd ~/fleet-dev
    tar xzf fleet-context.tar.gz
    rm fleet-context.tar.gz
ENDSSH

# Start orchestrator
echo "🚀 Starting AI Development Orchestrator..."
ssh azureuser@$VM_IP << 'ENDSSH'
    cd ~/fleet-dev

    # Load environment
    export $(cat .env | xargs)

    # Run orchestrator in background
    nohup python3 ai_development_orchestrator.py > orchestrator.log 2>&1 &

    echo $! > orchestrator.pid
    echo "✅ Orchestrator started (PID: $(cat orchestrator.pid))"
    echo "📋 Check logs: tail -f ~/fleet-dev/orchestrator.log"
ENDSSH

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AI Development Orchestrator is Running!                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🖥️  VM IP: $VM_IP"
echo "📋 View logs: ssh azureuser@$VM_IP 'tail -f ~/fleet-dev/orchestrator.log'"
echo "⏹️  Stop: ssh azureuser@$VM_IP 'kill \$(cat ~/fleet-dev/orchestrator.pid)'"
echo "📥 Download results: scp -r azureuser@$VM_IP:~/fleet-dev/App/Views/Generated ./App/Views/"
echo ""
echo "The orchestrator will:"
echo "  - Generate all 71 features using OpenAI + Gemini"
echo "  - Use Claude sparingly (every 10 features for review)"
echo "  - Save progress to ai_development_progress.json"
echo "  - Complete Priority 1 features first (10 features)"
echo ""
echo "Estimated time: 2-3 hours for all features"
echo ""
