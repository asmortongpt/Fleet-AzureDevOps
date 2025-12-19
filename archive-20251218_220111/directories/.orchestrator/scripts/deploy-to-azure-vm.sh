#!/bin/bash
set -euo pipefail

# Fleet Orchestrator - Azure VM Deployment Script
# This script deploys the orchestration infrastructure to Azure VMs

# Configuration
ORCHESTRATOR_VM="fleet-agent-orchestrator"
ORCHESTRATOR_RG="FLEET-AI-AGENTS"
ORCHESTRATOR_IP="172.191.51.49"

WORKER_VM_1="fleet-dev-agent-01"
WORKER_RG_1="FLEET-DEV-AGENTS-RG"
WORKER_IP_1="135.119.131.39"

WORKER_VM_2="agent-settings"
WORKER_RG_2="FLEET-FORTUNE50-AGENTS-RG"
WORKER_IP_2="172.191.6.180"

GITHUB_REPO="https://github.com/asmortongpt/Fleet.git"
DB_PASSWORD="${ORCHESTRATOR_DB_PASSWORD:-FleetOrch2025!}"

echo "========================================="
echo "Fleet Orchestrator - Azure VM Deployment"
echo "========================================="
echo ""

# Function to deploy to VM using Azure run-command
deploy_orchestrator() {
  echo "[1/3] Deploying orchestrator to ${ORCHESTRATOR_VM}..."

  # Create deployment script
  cat > /tmp/deploy-orchestrator.sh << 'EOFSCRIPT'
#!/bin/bash
set -euo pipefail

# Update system
echo "Updating system..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install Docker
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker $USER
  sudo systemctl enable docker
  sudo systemctl start docker
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
  echo "Installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js 20
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 20 ]]; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi

# Install Git
sudo apt-get install -y -qq git postgresql-client

# Clone Fleet repository
if [ ! -d "/opt/fleet" ]; then
  echo "Cloning Fleet repository..."
  sudo git clone ${GITHUB_REPO} /opt/fleet
  sudo chown -R $USER:$USER /opt/fleet
else
  echo "Updating Fleet repository..."
  cd /opt/fleet
  git fetch origin
  git checkout main
  git pull origin main
fi

cd /opt/fleet/.orchestrator

# Create .env file
cat > .env << EOF
ORCHESTRATOR_DB_PASSWORD=${DB_PASSWORD}
GITHUB_PAT=${GITHUB_PAT}
GITHUB_REPO=asmortongpt/Fleet
GITHUB_DEFAULT_BRANCH=main
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
EOF

# Start database and Redis
echo "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for database
echo "Waiting for database..."
sleep 10

# Install API dependencies
echo "Installing API dependencies..."
cd api
npm install --legacy-peer-deps

# Build API
echo "Building API..."
npm run build

# Seed database
echo "Seeding database..."
npm run seed || echo "Seed failed (may already be seeded)"

# Start orchestrator API
echo "Starting orchestrator API..."
cd ..
docker-compose up -d orchestrator

echo ""
echo "Orchestrator deployment complete!"
echo "Services running:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
EOFSCRIPT

  # Upload and execute script
  echo "Uploading deployment script to ${ORCHESTRATOR_VM}..."

  az vm run-command invoke \
    --resource-group "${ORCHESTRATOR_RG}" \
    --name "${ORCHESTRATOR_VM}" \
    --command-id RunShellScript \
    --scripts @/tmp/deploy-orchestrator.sh \
    --parameters \
      "GITHUB_REPO=${GITHUB_REPO}" \
      "DB_PASSWORD=${DB_PASSWORD}" \
      "GITHUB_PAT=${GITHUB_PAT}" \
    --output table

  echo "✓ Orchestrator deployed to ${ORCHESTRATOR_VM}"
  echo ""
}

# Function to verify deployment
verify_deployment() {
  echo "[2/3] Verifying orchestrator deployment..."

  # Test API health endpoint
  echo "Testing API health endpoint..."

  if curl -f "http://${ORCHESTRATOR_IP}:3000/health" 2>/dev/null; then
    echo "✓ Orchestrator API is healthy"
  else
    echo "⚠ Orchestrator API not responding (may need port forwarding)"
  fi

  echo ""
}

# Function to display next steps
display_next_steps() {
  echo "[3/3] Deployment Summary"
  echo "========================="
  echo ""
  echo "Orchestrator VM: ${ORCHESTRATOR_VM}"
  echo "  - IP: ${ORCHESTRATOR_IP}"
  echo "  - API: http://${ORCHESTRATOR_IP}:3000"
  echo "  - Database: ${ORCHESTRATOR_IP}:5432"
  echo "  - Redis: ${ORCHESTRATOR_IP}:6379"
  echo ""
  echo "Next Steps:"
  echo "  1. SSH to orchestrator: az vm run-command invoke --resource-group ${ORCHESTRATOR_RG} --name ${ORCHESTRATOR_VM} --command-id RunShellScript --scripts 'docker ps'"
  echo "  2. Check logs: docker-compose logs orchestrator"
  echo "  3. Deploy worker agents to VMs"
  echo "  4. Build and deploy dashboard"
  echo ""
  echo "To deploy worker agents, run:"
  echo "  ./deploy-worker-agents.sh"
  echo ""
}

# Main execution
main() {
  if [ -z "${GITHUB_PAT:-}" ]; then
    echo "ERROR: GITHUB_PAT environment variable not set"
    echo "Please set it with: export GITHUB_PAT=your_token"
    exit 1
  fi

  deploy_orchestrator
  verify_deployment
  display_next_steps
}

main
