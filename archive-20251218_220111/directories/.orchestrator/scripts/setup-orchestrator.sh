#!/bin/bash
set -euo pipefail

# Fleet Agent Orchestrator - VM Setup Script
# Target: fleet-agent-orchestrator (Standard_D8s_v3, 8 vCPUs, 32GB RAM)

echo "=================================="
echo "Fleet Agent Orchestrator Setup"
echo "=================================="
echo ""

# Update system
echo "[1/8] Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install Docker
echo "[2/8] Installing Docker..."
if ! command -v docker &> /dev/null; then
  sudo apt-get install -y -qq \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker $USER
else
  echo "   Docker already installed"
fi

# Install Docker Compose
echo "[3/8] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
else
  echo "   Docker Compose already installed"
fi

# Install PostgreSQL client tools
echo "[4/8] Installing PostgreSQL client..."
sudo apt-get install -y -qq postgresql-client redis-tools

# Install Node.js 20
echo "[5/8] Installing Node.js 20..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
else
  echo "   Node.js 20 already installed"
fi

# Install Git
echo "[6/8] Installing Git..."
sudo apt-get install -y -qq git

# Clone Fleet repository
echo "[7/8] Cloning Fleet repository..."
if [ ! -d "/opt/fleet" ]; then
  sudo mkdir -p /opt
  cd /opt
  sudo git clone https://github.com/asmortongpt/Fleet.git fleet
  sudo chown -R $USER:$USER /opt/fleet
else
  echo "   Fleet repository already exists, pulling latest..."
  cd /opt/fleet
  git pull origin main
fi

# Configure environment
echo "[8/8] Configuring environment..."
cd /opt/fleet/.orchestrator

# Create .env file (secrets will be injected)
cat > .env << 'EOF'
ORCHESTRATOR_DB_PASSWORD=__DB_PASSWORD__
GITHUB_PAT=__GITHUB_TOKEN__
NODE_ENV=production
LOG_LEVEL=info
EOF

# Start orchestrator services
echo ""
echo "Starting orchestrator services..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "Waiting for database to be ready..."
until docker exec fleet-orchestrator-db pg_isready -U orchestrator -d fleet_orchestrator &> /dev/null; do
  echo -n "."
  sleep 2
done
echo " Database ready!"

# Initialize database
echo "Initializing database schema..."
docker exec -i fleet-orchestrator-db psql -U orchestrator -d fleet_orchestrator < /opt/fleet/.orchestrator/db/schema.sql

echo ""
echo "=================================="
echo "Orchestrator Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Build orchestrator API: cd /opt/fleet/.orchestrator/api && npm install && npm run build"
echo "2. Start orchestrator: docker-compose up -d orchestrator"
echo "3. Build dashboard: cd /opt/fleet/.orchestrator/dashboard && npm install && npm run build"
echo "4. Start dashboard: docker-compose up -d dashboard"
echo ""
echo "Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Orchestrator API: http://localhost:3000"
echo "  - Dashboard: http://localhost:5173"
echo ""
