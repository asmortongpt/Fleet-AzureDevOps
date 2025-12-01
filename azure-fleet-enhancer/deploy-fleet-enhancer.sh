#!/bin/bash
set -e

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║     Fleet Application Enhancement System - VM Setup               ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo

# Install dependencies
echo "📦 Installing dependencies..."
pip install -q openai anthropic google-generativeai

# Clone existing Fleet repository
echo "📂 Cloning Fleet repository..."
cd /home/azureuser
if [ -d "Fleet" ]; then
  echo "⚠️  Fleet directory exists, removing..."
  rm -rf Fleet
fi

git clone https://github.com/asmortongpt/Fleet.git
cd Fleet

# Add Azure DevOps as second remote
echo "🔗 Setting up dual remotes (GitHub + Azure DevOps)..."
git remote add azure https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet || true
git fetch azure

# Set up git config
git config user.name "Fleet AI Enhancer"
git config user.email "ai@capitaltechalliance.com"

echo
echo "✅ Repository cloned and configured"
echo "📍 Path: /home/azureuser/Fleet"
echo "🔗 Remotes configured:"
git remote -v

echo
echo "🚀 Starting Fleet Enhancement Orchestrator..."
cd /home/azureuser

# Set environment variables from Azure Key Vault or direct export
export OPENAI_API_KEY="${OPENAI_API_KEY}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
export GEMINI_API_KEY="${GEMINI_API_KEY}"

# Run orchestrator
nohup python3 fleet-app-orchestrator.py > fleet-enhancer.log 2>&1 &
ENHANCER_PID=$!
echo $ENHANCER_PID > fleet-enhancer.pid

echo
echo "✅ Fleet Enhancer started"
echo "🔢 PID: $ENHANCER_PID"
echo "📋 Log: /home/azureuser/fleet-enhancer.log"
echo
echo "Monitor progress with: tail -f /home/azureuser/fleet-enhancer.log"
