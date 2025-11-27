#!/bin/bash
# Setup script to run ON the Azure VM
# Installs Node.js, Python, Git, and sets up autonomous agent processes

set -e

echo "=========================================="
echo "Fleet AI Agent Orchestrator Setup"
echo "=========================================="
echo ""

# Update system
echo "[1/8] Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install Node.js 20
echo "[2/8] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.11
echo "[3/8] Installing Python 3.11..."
sudo apt-get install -y python3 python3-pip python3-venv

# Install Git
echo "[4/8] Installing Git..."
sudo apt-get install -y git

# Install PM2 for process management
echo "[5/8] Installing PM2 process manager..."
sudo npm install -g pm2

# Clone repository
echo "[6/8] Cloning fleet-local repository..."
cd /home/azureuser
if [ -d "fleet-local" ]; then
    echo "Repository already exists, pulling latest..."
    cd fleet-local
    git pull
else
    git clone https://github.com/andrewmorton/fleet-local.git
    cd fleet-local
fi

# Install API dependencies
echo "[7/8] Installing API dependencies..."
cd /home/azureuser/fleet-local/api
npm install --production=false

# Set up environment variables
echo "[8/8] Setting up environment..."
cat > /home/azureuser/.env <<'EOF'
OPENAI_API_KEY=${OPENAI_API_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
EOF

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "VM is ready to run autonomous agents."
echo ""
echo "Available resources:"
echo "  - 8 vCPUs"
echo "  - 32GB RAM"
echo "  - Node.js $(node --version)"
echo "  - Python $(python3 --version)"
echo "  - Git $(git --version)"
echo ""
echo "Next: Run autonomous development agents"
