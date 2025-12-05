#!/bin/bash
##############################################################################
# Setup Azure Agent Environment for Fleet Review
##############################################################################

set -euo pipefail

AZURE_VM_IP="172.191.51.49"
AZURE_VM_USER="azureuser"
AGENT_WORKSPACE="/home/azureuser/agent-workspace"
LOCAL_PROJECT_DIR="/Users/andrewmorton/Documents/GitHub/fleet-local"
SSH_KEY="$HOME/.ssh/id_rsa"

echo "🚀 Setting up Azure Agent Environment..."

# 1. Create directories
echo "Creating directories..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} << 'REMOTE'
mkdir -p /home/azureuser/agent-workspace/{tasks,analysis-input,analysis-output,codebase}
REMOTE

# 2. Upload task configuration
echo "Uploading task configuration..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no \
    "$LOCAL_PROJECT_DIR/azure-agent-orchestrator/tasks/fleet-completion-review-task.json" \
    "${AZURE_VM_USER}@${AZURE_VM_IP}:$AGENT_WORKSPACE/tasks/"

# 3. Upload analysis files
echo "Uploading analysis files..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no \
    "$LOCAL_PROJECT_DIR/analysis-output/backend_analysis.json" \
    "$LOCAL_PROJECT_DIR/analysis-output/frontend_analysis.json" \
    "${AZURE_VM_USER}@${AZURE_VM_IP}:$AGENT_WORKSPACE/analysis-input/"

# 4. Clone codebase
echo "Cloning Fleet codebase..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} << 'REMOTE'
cd /home/azureuser/agent-workspace/codebase
if [ ! -d ".git" ]; then
    git clone /Users/andrewmorton/Documents/GitHub/fleet-local . 2>/dev/null || \
    echo "Note: Will need to upload codebase manually or use local path"
fi
REMOTE

# 5. Install Python dependencies
echo "Installing Python dependencies..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} << 'REMOTE'
cd /home/azureuser/agent-workspace

# Create venv if needed
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet anthropic openai google-generativeai rich pandas openpyxl python-dotenv gitpython asyncio

echo "✅ Dependencies installed"
REMOTE

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. SSH to VM: ssh azureuser@172.191.51.49"
echo "  2. Activate venv: cd agent-workspace && source venv/bin/activate"
echo "  3. Run review: python3 run-fleet-review.py"
