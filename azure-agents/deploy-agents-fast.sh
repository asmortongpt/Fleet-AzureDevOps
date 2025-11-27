#!/bin/bash
# Fast Azure Agent Deployment - Skip Key Vault, use env vars directly

set -e

SUBSCRIPTION_ID="021415c2-2f52-4a73-ae77-f8363165a5e1"
RESOURCE_GROUP="fleet-ai-agents"
LOCATION="eastus2"

# API keys from environment
OPENAI_KEY="${OPENAI_API_KEY}"
GEMINI_KEY="${GEMINI_API_KEY}"

echo "🚀 FAST DEPLOYMENT - 15 AI Agents"
echo "=================================="

# Deploy all 15 agents in parallel
echo "Deploying all agents in parallel..."

# OpenAI Agents (use Spot VMs for cost savings)
for i in {1..8}; do
  (
    VM_NAME="openai-agent-$i"
    az vm create \
      --resource-group $RESOURCE_GROUP \
      --name $VM_NAME \
      --image Ubuntu2204 \
      --size Standard_D4s_v3 \
      --priority Spot \
      --max-price 0.05 \
      --eviction-policy Deallocate \
      --admin-username azureuser \
      --generate-ssh-keys \
      --custom-data @- <<EOF
#!/bin/bash
export OPENAI_API_KEY="$OPENAI_KEY"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
git clone https://github.com/yourrepo/fleet-local.git /home/azureuser/fleet-local
cd /home/azureuser/fleet-local/api
npm install
echo "OpenAI Agent $i ready"
EOF
  ) &
done

# Gemini Agents (use Spot VMs)
for i in {1..7}; do
  (
    VM_NAME="gemini-agent-$i"
    az vm create \
      --resource-group $RESOURCE_GROUP \
      --name $VM_NAME \
      --image Ubuntu2204 \
      --size Standard_D4s_v3 \
      --priority Spot \
      --max-price 0.05 \
      --eviction-policy Deallocate \
      --admin-username azureuser \
      --generate-ssh-keys \
      --custom-data @- <<EOF
#!/bin/bash
export GEMINI_API_KEY="$GEMINI_KEY"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git python3 python3-pip
echo "Gemini Agent $i ready"
EOF
  ) &
done

wait
echo "✅ All 15 agents deployed!"
