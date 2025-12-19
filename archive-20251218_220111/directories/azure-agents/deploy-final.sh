#!/bin/bash
# Deploy 3 Azure AI Agents - NO UNICODE

set -e

SUBSCRIPTION_ID="021415c2-2f52-4a73-ae77-f8363165a5e1"
RESOURCE_GROUP="fleet-ai-agents"
LOCATION="eastus2"

OPENAI_KEY="${OPENAI_API_KEY}"
GEMINI_KEY="${GEMINI_API_KEY}"

echo "Deploying 3 AI Agents to Azure..."
echo "VM Size: Standard_D1_v2 (1 vCPU each, 3 total)"
echo ""

# Agent 1: SSO Builder
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name openai-sso \
  --image Ubuntu2204 \
  --size Standard_D1_v2 \
  --priority Spot \
  --max-price 0.03 \
  --eviction-policy Deallocate \
  --admin-username azureuser \
  --generate-ssh-keys \
  --no-wait &

# Agent 2: Weather Integration
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name openai-weather \
  --image Ubuntu2204 \
  --size Standard_D1_v2 \
  --priority Spot \
  --max-price 0.03 \
  --eviction-policy Deallocate \
  --admin-username azureuser \
  --generate-ssh-keys \
  --no-wait &

# Agent 3: Code Review
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name gemini-review \
  --image Ubuntu2204 \
  --size Standard_D1_v2 \
  --priority Spot \
  --max-price 0.03 \
  --eviction-policy Deallocate \
  --admin-username azureuser \
  --generate-ssh-keys \
  --no-wait &

wait
echo ""
echo "All 3 agents deployed! Waiting for VMs to provision..."
sleep 30

# Check status
az vm list --resource-group $RESOURCE_GROUP --output table --query "[].{Name:name, State:provisioningState, Size:hardwareProfile.vmSize}"
