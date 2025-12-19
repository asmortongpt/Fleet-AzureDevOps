#!/bin/bash
# Deploy Azure AI Agents within Quota Limits (3 Spot vCPU total)
# Using Standard_D1_v2 (1 vCPU each) to maximize agent count

set -e

SUBSCRIPTION_ID="021415c2-2f52-4a73-ae77-f8363165a5e1"
RESOURCE_GROUP="fleet-ai-agents"
LOCATION="eastus2"

# API keys from environment
OPENAI_KEY="${OPENAI_API_KEY}"
GEMINI_KEY="${GEMINI_API_KEY}"

echo "🚀 DEPLOYING AI AGENTS (Quota-Optimized)"
echo "========================================"
echo "Quota: 3 Spot vCPUs total"
echo "VM Size: Standard_D1_v2 (1 vCPU, 3.5GB RAM)"
echo "Max Agents: 3 (within quota)"
echo ""

# Deploy 3 agents that fit within quota (3 vCPUs total)
# Agent 1: OpenAI Codex - SSO Backend Builder
echo "Deploying Agent 1: OpenAI SSO Backend Builder..."
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name openai-sso-agent \
  --image Ubuntu2204 \
  --size Standard_D1_v2 \
  --priority Spot \
  --max-price 0.03 \
  --eviction-policy Deallocate \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data @- <<'EOF' &
#!/bin/bash
export OPENAI_API_KEY="$OPENAI_KEY"
export TASK="Build complete Azure AD SSO login backend with OAuth callback endpoints"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
git clone https://github.com/andrewmorton/fleet-local.git /home/azureuser/fleet-local
cd /home/azureuser/fleet-local/api
npm install
echo "✅ OpenAI SSO Agent Ready"
EOF

# Agent 2: OpenAI Codex - Weather Integration Builder
echo "Deploying Agent 2: OpenAI Weather Integration Builder..."
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name openai-weather-agent \
  --image Ubuntu2204 \
  --size Standard_D1_v2 \
  --priority Spot \
  --max-price 0.03 \
  --eviction-policy Deallocate \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data @- <<'EOF' &
#!/bin/bash
export OPENAI_API_KEY="$OPENAI_KEY"
export TASK="Build NWS Weather API integration for real-time map overlays"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
git clone https://github.com/andrewmorton/fleet-local.git /home/azureuser/fleet-local
cd /home/azureuser/fleet-local/api
npm install
echo "✅ OpenAI Weather Agent Ready"
EOF

# Agent 3: Gemini - Code Review & Quality
echo "Deploying Agent 3: Gemini Code Review Agent..."
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name gemini-review-agent \
  --image Ubuntu2204 \
  --size Standard_D1_v2 \
  --priority Spot \
  --max-price 0.03 \
  --eviction-policy Deallocate \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data @- <<'EOF' &
#!/bin/bash
export GEMINI_API_KEY="$GEMINI_KEY"
export TASK="Review all code changes and ensure quality standards"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git python3 python3-pip
git clone https://github.com/andrewmorton/fleet-local.git /home/azureuser/fleet-local
echo "✅ Gemini Review Agent Ready"
EOF

wait
echo ""
echo "✅ ALL 3 AGENTS DEPLOYED!"
echo "======================================"
echo "Agent 1: OpenAI SSO Backend Builder"
echo "Agent 2: OpenAI Weather Integration"
echo "Agent 3: Gemini Code Review"
echo ""
echo "Total vCPUs Used: 3 (100% of Spot quota)"
