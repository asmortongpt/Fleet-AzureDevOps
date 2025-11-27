#!/bin/bash
# Deploy SINGLE Azure VM to run all autonomous agents as processes
# Bypasses Spot VM quota by using one regular VM with multiple agent processes

set -e

SUBSCRIPTION_ID="021415c2-2f52-4a73-ae77-f8363165a5e1"
RESOURCE_GROUP="fleet-ai-agents"
LOCATION="eastus"  # Using East US instead of eastus2
VM_NAME="fleet-agent-orchestrator"
VM_SIZE="Standard_D8s_v3"  # 8 vCPUs, 32GB RAM - enough for all agents

echo "Deploying Single AI Agent Orchestrator VM"
echo "=========================================="
echo "VM: $VM_NAME"
echo "Size: $VM_SIZE (8 vCPUs, 32GB RAM)"
echo "Location: $LOCATION"
echo ""

# Create VM (regular priority, not Spot - more reliable)
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image Ubuntu2204 \
  --size $VM_SIZE \
  --location $LOCATION \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --output json > /tmp/vm-create-output.json

echo ""
echo "VM Created! Getting connection details..."
echo ""

# Get VM IP address
VM_IP=$(az vm show --resource-group $RESOURCE_GROUP --name $VM_NAME --show-details --query publicIps -o tsv)

echo "VM IP Address: $VM_IP"
echo ""
echo "Next steps:"
echo "1. SSH into VM: ssh azureuser@$VM_IP"
echo "2. Run setup script on VM to install all agents"
echo ""
echo "VM details saved to: /tmp/vm-create-output.json"
