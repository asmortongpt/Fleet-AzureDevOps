#!/bin/bash
##############################################################################
# VM Initialization Template for AI Agents
# This script is customized and deployed to each VM
##############################################################################

set -euo pipefail

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

log "Starting VM initialization..."

# Update system
log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install Node.js 20
log "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
log "Node.js installed: $node_version"
log "npm installed: $npm_version"

# Install Python 3 and pip
log "Installing Python 3..."
sudo apt-get install -y python3 python3-pip python3-venv

# Verify Python installation
python_version=$(python3 --version)
log "Python installed: $python_version"

# Install Git
log "Installing Git..."
sudo apt-get install -y git
git_version=$(git --version)
log "Git installed: $git_version"

# Install Azure CLI
log "Installing Azure CLI..."
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az_version=$(az --version | head -n1)
log "Azure CLI installed: $az_version"

# Install additional tools
log "Installing additional tools..."
sudo apt-get install -y htop vim curl wget jq

# Create working directory
log "Creating working directory..."
mkdir -p ~/fleet-agent
cd ~/fleet-agent

# Clone repository
log "Cloning Fleet repository..."
# Repository URL will be injected by deployment script
git clone REPO_URL fleet
cd fleet

# Configure git
log "Configuring git..."
git config user.name "Fleet AI Agent"
git config user.email "ai-agent@capitaltechalliance.com"

# Install npm dependencies
log "Installing npm dependencies (this may take a few minutes)..."
npm install --legacy-peer-deps

log "npm install completed"

# Create Python virtual environment
log "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies for AI agent
log "Installing Python dependencies..."
pip install --upgrade pip
pip install anthropic openai google-generativeai python-dotenv gitpython

log "Python dependencies installed"

# Create environment file (will be populated by deployment script)
cat > .env <<'ENVFILE'
# AI Agent Environment Variables
ENV_CONTENT
ENVFILE

log "Environment file created"

# Copy agent script (will be populated by deployment script)
cat > agent.py <<'AGENT_SCRIPT'
AGENT_SCRIPT_CONTENT
AGENT_SCRIPT

log "Agent script created"

# Make agent script executable
chmod +x agent.py

# Create systemd service for agent (optional, for automatic restart)
sudo tee /etc/systemd/system/fleet-agent.service > /dev/null <<EOF
[Unit]
Description=Fleet AI Agent
After=network.target

[Service]
Type=simple
User=azureuser
WorkingDirectory=/home/azureuser/fleet-agent/fleet
Environment="PATH=/home/azureuser/fleet-agent/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/home/azureuser/fleet-agent/venv/bin/python agent.py
Restart=on-failure
RestartSec=10
StandardOutput=append:/home/azureuser/agent.log
StandardError=append:/home/azureuser/agent.log

[Install]
WantedBy=multi-user.target
EOF

log "Systemd service created"

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable fleet-agent.service
sudo systemctl start fleet-agent.service

log "Fleet AI Agent service started"

# Display status
sleep 2
sudo systemctl status fleet-agent.service --no-pager || true

log "VM initialization completed successfully"
log "Agent is running. Check logs: journalctl -u fleet-agent.service -f"
log "Or: tail -f ~/agent.log"
