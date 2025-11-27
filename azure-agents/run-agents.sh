#!/bin/bash
# Run autonomous AI agents on Azure VM
# This script runs Claude Codex agents to build all missing features

set -e

cd /home/azureuser/fleet-local/api

echo "=========================================="
echo "Starting Autonomous AI Agents"
echo "=========================================="
echo ""

# Install dependencies first
echo "[1/2] Installing dependencies..."
npm install

# Set environment variables
export OPENAI_API_KEY="${OPENAI_API_KEY}"
export GEMINI_API_KEY="${GEMINI_API_KEY}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"

echo "[2/2] Starting autonomous agents with PM2..."

# Agent 1: SSO Backend Builder
pm2 start --name="sso-builder" --interpreter=bash -- -c "
cd /home/azureuser/fleet-local
npx tsx azure-agents/agents/sso-builder.ts
"

# Agent 2: Weather Integration Builder
pm2 start --name="weather-builder" --interpreter=bash -- -c "
cd /home/azureuser/fleet-local
npx tsx azure-agents/agents/weather-builder.ts
"

# Agent 3: Traffic Camera Builder
pm2 start --name="camera-builder" --interpreter=bash -- -c "
cd /home/azureuser/fleet-local
npx tsx azure-agents/agents/camera-builder.ts
"

echo ""
echo "=========================================="
echo "All agents started!"
echo "=========================================="
echo ""
echo "Monitor agents:"
echo "  pm2 list"
echo "  pm2 logs"
echo "  pm2 monit"
echo ""
echo "Stop agents:"
echo "  pm2 stop all"
