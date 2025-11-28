#!/bin/bash

# ============================================================================
# Fleet Management UI Refresh - Azure VM AI Agent Deployment
# ============================================================================
# This script deploys multiple AI agents on Azure VMs to parallelize the
# UI refresh tasks using OpenAI GPT-4 and Google Gemini
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
VM_SIZE="Standard_D4s_v3"  # 4 vCPUs, 16GB RAM
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Task distribution
declare -A AGENTS=(
    ["endpoint-monitor"]="OpenAI"
    ["scrolling-optimizer"]="Gemini"
    ["darkmode-fixer"]="OpenAI"
    ["reactive-drilldown"]="Gemini"
    ["responsive-designer"]="OpenAI"
)

echo ""
echo "📋 Task Distribution:"
echo "===================="
for agent in "${!AGENTS[@]}"; do
    echo "  • $agent → ${AGENTS[$agent]}"
done

# Create resource group
echo ""
echo "🔧 Creating Azure Resource Group: $RESOURCE_GROUP"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags "project=fleet-management" "purpose=ui-refresh" "timestamp=$TIMESTAMP" \
    || echo "Resource group may already exist"

# Deploy VM agents
deploy_agent() {
    local TASK_NAME=$1
    local AI_ENGINE=$2
    local VM_NAME="fleet-ui-agent-${TASK_NAME}"

    echo ""
    echo "🤖 Deploying Agent: $TASK_NAME (using $AI_ENGINE)"
    echo "=================================================="

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
        --output table

    # Get VM public IP
    VM_IP=$(az vm show -d \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VM_NAME" \
        --query publicIps -o tsv)

    echo "  ✅ VM Created: $VM_NAME ($VM_IP)"

    # Create initialization script based on AI engine
    if [ "$AI_ENGINE" = "OpenAI" ]; then
        API_KEY="$OPENAI_API_KEY"
        MODEL="gpt-4-turbo-preview"
    else
        API_KEY="$GEMINI_API_KEY"
        MODEL="gemini-1.5-pro"
    fi

    # Create agent startup script
    cat > "/tmp/agent-${TASK_NAME}.sh" <<EOF
#!/bin/bash

# Install dependencies
sudo apt-get update
sudo apt-get install -y git nodejs npm python3-pip

# Install Claude CLI
npm install -g @anthropic-ai/claude-cli

# Clone repository
git clone https://github.com/yourusername/Fleet.git /home/azureuser/Fleet
cd /home/azureuser/Fleet

# Setup environment
cat > .env.agent <<ENVFILE
OPENAI_API_KEY=$OPENAI_API_KEY
GEMINI_API_KEY=$GEMINI_API_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
TASK_NAME=$TASK_NAME
AI_ENGINE=$AI_ENGINE
AZURE_VM_NAME=$VM_NAME
ENVFILE

# Install project dependencies
npm install

# Create task-specific agent script
cat > /home/azureuser/agent-task.py <<PYEOF
import os
import json
import requests
from datetime import datetime

TASK_NAME = "$TASK_NAME"
AI_ENGINE = "$AI_ENGINE"
API_KEY = "$API_KEY"
MODEL = "$MODEL"

def execute_task():
    print(f"🤖 Starting task: {TASK_NAME} using {AI_ENGINE}")

    # Task-specific logic
    if TASK_NAME == "endpoint-monitor":
        from tasks import create_endpoint_monitor
        create_endpoint_monitor()
    elif TASK_NAME == "scrolling-optimizer":
        from tasks import optimize_scrolling
        optimize_scrolling()
    elif TASK_NAME == "darkmode-fixer":
        from tasks import fix_darkmode
        fix_darkmode()
    elif TASK_NAME == "reactive-drilldown":
        from tasks import implement_drilldown
        implement_drilldown()
    elif TASK_NAME == "responsive-designer":
        from tasks import make_responsive
        make_responsive()

    print(f"✅ Task completed: {TASK_NAME}")

if __name__ == "__main__":
    execute_task()
PYEOF

# Execute the task
python3 /home/azureuser/agent-task.py > /home/azureuser/agent.log 2>&1

# Report results back
echo "Task completed at \$(date)" >> /home/azureuser/agent.log
EOF

    # Copy and execute startup script
    echo "  📤 Copying startup script to VM..."
    scp -o StrictHostKeyChecking=no \
        "/tmp/agent-${TASK_NAME}.sh" \
        "azureuser@${VM_IP}:/home/azureuser/startup.sh"

    echo "  🚀 Executing agent task on VM..."
    ssh -o StrictHostKeyChecking=no "azureuser@${VM_IP}" \
        "chmod +x /home/azureuser/startup.sh && nohup /home/azureuser/startup.sh > /home/azureuser/startup.log 2>&1 &"

    echo "  ✅ Agent $TASK_NAME deployed and running on $VM_IP"
    echo "     Log: ssh azureuser@${VM_IP} 'tail -f /home/azureuser/agent.log'"
}

# Deploy all agents in parallel
echo ""
echo "🌊 Deploying All Agents in Parallel..."
echo "======================================="

for agent in "${!AGENTS[@]}"; do
    deploy_agent "$agent" "${AGENTS[$agent]}" &
done

# Wait for all deployments
wait

echo ""
echo "✅ All AI Agents Deployed Successfully!"
echo "======================================"
echo ""
echo "📊 Monitor Progress:"
echo "  • List VMs: az vm list -g $RESOURCE_GROUP -o table"
echo "  • Get IPs: az vm list-ip-addresses -g $RESOURCE_GROUP -o table"
echo ""
echo "🔍 Check Individual Agents:"
for agent in "${!AGENTS[@]}"; do
    VM_NAME="fleet-ui-agent-${agent}"
    VM_IP=$(az vm show -d -g "$RESOURCE_GROUP" -n "$VM_NAME" --query publicIps -o tsv 2>/dev/null || echo "pending")
    echo "  • $agent: ssh azureuser@${VM_IP} 'tail -f /home/azureuser/agent.log'"
done

echo ""
echo "🧹 Cleanup when done:"
echo "  az group delete --name $RESOURCE_GROUP --yes --no-wait"
