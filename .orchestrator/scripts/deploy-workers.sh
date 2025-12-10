#!/bin/bash

# ============================================================================
# Fleet Agent Workers Deployment Script
# ============================================================================
# Deploys worker agents to Azure VMs:
# - Agents D & E → fleet-dev-agent-01 (135.119.131.39)
# - Agents F & G → agent-settings (172.191.6.180)
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VM1_IP="135.119.131.39"
VM1_NAME="fleet-dev-agent-01"
VM2_IP="172.191.6.180"
VM2_NAME="agent-settings"
SSH_USER="azureuser"
WORKER_DIR="/home/azureuser/fleet-agent-worker"

# Environment variables
if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "${RED}Error: GITHUB_TOKEN not set${NC}"
  exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo -e "${RED}Error: ANTHROPIC_API_KEY not set${NC}"
  exit 1
fi

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         Fleet Agent Workers Deployment                       ║"
echo "║                                                              ║"
echo "║         VM1: ${VM1_NAME} (${VM1_IP})               ║"
echo "║         VM2: ${VM2_NAME} (${VM2_IP})                     ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# Function: Deploy to VM
# ============================================================================
deploy_to_vm() {
  local VM_IP=$1
  local VM_NAME=$2
  local COMPOSE_FILE=$3
  local AGENTS=$4

  echo -e "\n${BLUE}▶ Deploying to ${VM_NAME} (${VM_IP})${NC}"
  echo -e "${YELLOW}Agents: ${AGENTS}${NC}\n"

  # Test SSH connection
  echo -e "${YELLOW}→ Testing SSH connection...${NC}"
  if ! ssh -o ConnectTimeout=5 ${SSH_USER}@${VM_IP} "echo 'SSH OK'"; then
    echo -e "${RED}✗ SSH connection failed${NC}"
    return 1
  fi
  echo -e "${GREEN}✓ SSH connection successful${NC}"

  # Create directory structure
  echo -e "${YELLOW}→ Creating directory structure...${NC}"
  ssh ${SSH_USER}@${VM_IP} "mkdir -p ${WORKER_DIR}"
  echo -e "${GREEN}✓ Directory created${NC}"

  # Copy worker files
  echo -e "${YELLOW}→ Copying worker files...${NC}"
  scp -r ../worker/* ${SSH_USER}@${VM_IP}:${WORKER_DIR}/
  echo -e "${GREEN}✓ Files copied${NC}"

  # Create .env file
  echo -e "${YELLOW}→ Creating .env file...${NC}"
  ssh ${SSH_USER}@${VM_IP} "cat > ${WORKER_DIR}/.env << EOF
GITHUB_TOKEN=${GITHUB_TOKEN}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ORCHESTRATOR_URL=http://172.191.51.49:3000
EOF"
  echo -e "${GREEN}✓ Environment configured${NC}"

  # Stop existing containers
  echo -e "${YELLOW}→ Stopping existing containers...${NC}"
  ssh ${SSH_USER}@${VM_IP} "cd ${WORKER_DIR} && docker-compose -f ${COMPOSE_FILE} down || true"
  echo -e "${GREEN}✓ Containers stopped${NC}"

  # Build images
  echo -e "${YELLOW}→ Building Docker images...${NC}"
  ssh ${SSH_USER}@${VM_IP} "cd ${WORKER_DIR} && docker-compose -f ${COMPOSE_FILE} build"
  echo -e "${GREEN}✓ Images built${NC}"

  # Start containers
  echo -e "${YELLOW}→ Starting containers...${NC}"
  ssh ${SSH_USER}@${VM_IP} "cd ${WORKER_DIR} && docker-compose -f ${COMPOSE_FILE} up -d"
  echo -e "${GREEN}✓ Containers started${NC}"

  # Wait for containers to be healthy
  echo -e "${YELLOW}→ Waiting for containers to be healthy...${NC}"
  sleep 10

  # Check container status
  echo -e "${YELLOW}→ Checking container status...${NC}"
  ssh ${SSH_USER}@${VM_IP} "cd ${WORKER_DIR} && docker-compose -f ${COMPOSE_FILE} ps"

  # Show logs
  echo -e "${YELLOW}→ Showing logs (last 20 lines)...${NC}"
  ssh ${SSH_USER}@${VM_IP} "cd ${WORKER_DIR} && docker-compose -f ${COMPOSE_FILE} logs --tail=20"

  echo -e "\n${GREEN}✓ Deployment to ${VM_NAME} complete${NC}\n"
}

# ============================================================================
# Main Deployment
# ============================================================================

# Deploy to VM1 (fleet-dev-agent-01) - Agents D & E
deploy_to_vm "$VM1_IP" "$VM1_NAME" "docker-compose.yml" "D, E"

# Deploy to VM2 (agent-settings) - Agents F & G
deploy_to_vm "$VM2_IP" "$VM2_NAME" "docker-compose.fg.yml" "F, G"

# ============================================================================
# Verification
# ============================================================================

echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DEPLOYMENT COMPLETE                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}✓ All agents deployed successfully${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Verify agents registered: curl http://172.191.51.49:3000/api/agents"
echo -e "2. Check agent logs: ssh ${SSH_USER}@${VM1_IP} 'cd ${WORKER_DIR} && docker-compose logs -f'"
echo -e "3. Monitor task assignments: curl http://172.191.51.49:3000/api/assignments"
echo -e "4. View orchestrator dashboard: http://172.191.51.49:3000\n"

echo -e "${BLUE}VM Connection Commands:${NC}"
echo -e "VM1 (Agents D, E): ssh ${SSH_USER}@${VM1_IP}"
echo -e "VM2 (Agents F, G): ssh ${SSH_USER}@${VM2_IP}\n"
