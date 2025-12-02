#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║    ARCHITECT-PRIME Startup Script                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

set -e

# Change to workspace
cd /home/azureuser/agent-workspace

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install --quiet --upgrade pip
pip3 install --quiet openai anthropic google-generativeai

# Clone Fleet repository if not exists
if [ ! -d "/home/azureuser/Fleet" ]; then
    echo "📂 Cloning Fleet repository..."
    cd /home/azureuser
    git clone https://github.com/asmortongpt/Fleet.git
    cd Fleet

    # Add Azure DevOps remote
    git remote add azure https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet || true

    # Configure git
    git config user.name "ARCHITECT-PRIME"
    git config user.email "architect-prime@capitaltechalliance.com"

    echo "✅ Repository cloned"
else
    echo "✅ Repository already exists"
    cd /home/azureuser/Fleet
    git pull origin main || true
fi

# Return to workspace
cd /home/azureuser/agent-workspace

# Set up API keys
export OPENAI_API_KEY="${OPENAI_API_KEY}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
export GEMINI_API_KEY="${GEMINI_API_KEY}"

# Start ARCHITECT-PRIME
echo ""
echo "🚀 Starting ARCHITECT-PRIME orchestrator..."
echo ""

# Run in background and capture PID
nohup python3 architect-prime-orchestrator.py > architect-prime.log 2>&1 &
PRIME_PID=$!

# Save PID
echo $PRIME_PID > architect-prime.pid

echo "✅ ARCHITECT-PRIME started!"
echo "🔢 PID: $PRIME_PID"
echo "📋 Log: /home/azureuser/agent-workspace/architect-prime.log"
echo ""
echo "Monitor with:"
echo "  tail -f /home/azureuser/agent-workspace/architect-prime.log"
echo ""
echo "Check status:"
echo "  ps -p $PRIME_PID"
