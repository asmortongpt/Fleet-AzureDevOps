#!/bin/bash

# ============================================================================
# Fleet Management UI Refresh - Azure VM AI Agent Deployment (macOS Compatible)
# ============================================================================

set -e

echo "🚀 Fleet Management UI Refresh - Azure VM AI Agent Deployment"
echo "=============================================================="

# Load environment variables
if [ -f /Users/andrewmorton/.env ]; then
    source /Users/andrewmorton/.env
    echo "✅ Loaded environment variables"
else
    echo "❌ Error: /Users/andrewmorton/.env not found"
    exit 1
fi

# Configuration
RESOURCE_GROUP="FleetManagement-AI-Agents"
LOCATION="eastus2"
VM_SIZE="Standard_D4s_v3"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo ""
echo "📋 Deploying 5 AI Agents:"
echo "===================="
echo "  • endpoint-monitor → OpenAI GPT-4"
echo "  • scrolling-optimizer → Google Gemini"
echo "  • darkmode-fixer → OpenAI GPT-4"
echo "  • reactive-drilldown → Google Gemini"
echo "  • responsive-designer → OpenAI GPT-4"

# Create resource group
echo ""
echo "🔧 Creating Azure Resource Group: $RESOURCE_GROUP"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags "project=fleet-management" "purpose=ui-refresh" "timestamp=$TIMESTAMP" \
    --output table 2>/dev/null || echo "Resource group may already exist"

# Function to deploy a single agent
deploy_agent() {
    TASK_NAME=$1
    AI_ENGINE=$2
    VM_NAME="fleet-ui-agent-${TASK_NAME}"

    echo ""
    echo "🤖 Deploying Agent: $TASK_NAME (using $AI_ENGINE)"
    echo "=================================================="

    # Set API key based on engine
    if [ "$AI_ENGINE" = "OpenAI" ]; then
        API_KEY="$OPENAI_API_KEY"
        MODEL="gpt-4-turbo-preview"
    else
        API_KEY="$GEMINI_API_KEY"
        MODEL="gemini-1.5-pro"
    fi

    # Create VM
    echo "  Creating VM: $VM_NAME..."
    az vm create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VM_NAME" \
        --image "Ubuntu2204" \
        --size "$VM_SIZE" \
        --admin-username "azureuser" \
        --generate-ssh-keys \
        --public-ip-sku Standard \
        --tags "task=$TASK_NAME" "ai-engine=$AI_ENGINE" \
        --no-wait \
        --output table

    echo "  ✅ VM deployment started: $VM_NAME"
}

# Deploy all agents (using --no-wait for parallel deployment)
deploy_agent "endpoint-monitor" "OpenAI" &
deploy_agent "scrolling-optimizer" "Gemini" &
deploy_agent "darkmode-fixer" "OpenAI" &
deploy_agent "reactive-drilldown" "Gemini" &
deploy_agent "responsive-designer" "OpenAI" &

# Wait for background jobs
wait

echo ""
echo "⏳ Waiting for VMs to be ready (this may take 3-5 minutes)..."
sleep 180

echo ""
echo "📊 VM Status:"
az vm list -g "$RESOURCE_GROUP" -o table

echo ""
echo "✅ All AI Agents Deployment Initiated!"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Wait for VMs to complete provisioning (~5 more minutes)"
echo "2. Access VMs and run agent tasks"
echo "3. Monitor progress in agent logs"
echo ""
echo "Monitor Commands:"
echo "  • List VMs: az vm list -g $RESOURCE_GROUP -o table"
echo "  • Get IPs: az vm list-ip-addresses -g $RESOURCE_GROUP -o table"
echo ""
echo "🧹 Cleanup when done:"
echo "  az group delete --name $RESOURCE_GROUP --yes --no-wait"
