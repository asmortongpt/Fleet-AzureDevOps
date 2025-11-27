#!/bin/bash
set -e

# Multi-Agent Orchestrator Runner
# This script activates the virtual environment and runs the orchestrator

cd "$(dirname "$0")"

echo "================================================"
echo "Multi-Agent Fleet Deployment Orchestrator"
echo "================================================"
echo ""

# Activate virtual environment
if [ ! -d "agent_orch/venv" ]; then
    echo "Error: Virtual environment not found at agent_orch/venv"
    echo "Run: python3 -m venv agent_orch/venv && pip install -r agent_orch/requirements.txt"
    exit 1
fi

source agent_orch/venv/bin/activate

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Warning: OPENAI_API_KEY not set. Loading from ~/.env..."
    export $(grep -v '^#' ~/.env | xargs)
fi

# Run orchestrator
ENVIRONMENT=${1:-staging}

echo "Environment: $ENVIRONMENT"
echo "Starting orchestrator..."
echo ""

python agent_orch/orchestrator.py --environment "$ENVIRONMENT"

echo ""
echo "================================================"
echo "Orchestrator finished"
echo "Check logs at: agent_orch/logs/"
echo "================================================"
