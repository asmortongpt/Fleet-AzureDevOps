#!/bin/bash

################################################################################
# Azure VM Deployment Script for Code Review Agents
# Deploys spot instance VM with all review tools pre-installed
################################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

################################################################################
# Configuration
################################################################################

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-fleet-code-review-rg}"
LOCATION="${AZURE_LOCATION:-eastus2}"
VM_NAME="fleet-review-vm-$(date +%s)"
VM_SIZE="Standard_D4s_v3"  # 4 vCPUs, 16 GB RAM
IMAGE="Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest"
ADMIN_USER="azurereviewer"
STORAGE_ACCOUNT="fleetreviewstorage$(date +%s | cut -c1-8)"

# Spot instance configuration (80% cost savings)
SPOT_MAX_PRICE=0.05  # Max $0.05/hour (~$36/month vs $180/month regular)
EVICTION_POLICY="Deallocate"

log_info "Starting Azure VM deployment for Fleet Code Review System..."
log_info "Resource Group: $RESOURCE_GROUP"
log_info "VM Name: $VM_NAME"
log_info "Using Spot Instance (max price: \$${SPOT_MAX_PRICE}/hour)"

################################################################################
# 1. Create Resource Group
################################################################################

log_info "Creating resource group..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --tags "Environment=CodeReview" "Project=FleetManagement" "CostCenter=Development" \
  || log_warning "Resource group may already exist"

log_success "Resource group ready"

################################################################################
# 2. Create Storage Account for Review Results
################################################################################

log_info "Creating storage account for review results..."
az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --tags "Purpose=ReviewResults" \
  --https-only true \
  --min-tls-version TLS1_2 \
  || log_warning "Storage account creation may have failed"

# Create container for results
STORAGE_KEY=$(az storage account keys list \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "$STORAGE_ACCOUNT" \
  --query '[0].value' -o tsv)

az storage container create \
  --name "review-results" \
  --account-name "$STORAGE_ACCOUNT" \
  --account-key "$STORAGE_KEY" \
  --public-access off \
  || log_warning "Container may already exist"

log_success "Storage account configured"

################################################################################
# 3. Generate SSH Key Pair
################################################################################

SSH_KEY_PATH="$HOME/.ssh/azure_fleet_review_key"
if [ ! -f "$SSH_KEY_PATH" ]; then
  log_info "Generating SSH key pair..."
  ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "fleet-review-vm"
  log_success "SSH key generated at $SSH_KEY_PATH"
else
  log_info "Using existing SSH key at $SSH_KEY_PATH"
fi

################################################################################
# 4. Create Cloud-Init Configuration
################################################################################

log_info "Creating cloud-init configuration..."
cat > /tmp/cloud-init-review.txt <<'CLOUDINIT'
#cloud-config

package_update: true
package_upgrade: true

packages:
  - git
  - curl
  - wget
  - jq
  - build-essential
  - python3
  - python3-pip
  - python3-venv
  - docker.io
  - nodejs
  - npm

runcmd:
  # Install Node.js 20.x LTS
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y nodejs

  # Install global npm packages for code review
  - npm install -g npm@latest
  - npm install -g eslint
  - npm install -g @typescript-eslint/parser
  - npm install -g @typescript-eslint/eslint-plugin
  - npm install -g eslint-plugin-security
  - npm install -g lighthouse
  - npm install -g pa11y
  - npm install -g axe-core
  - npm install -g npm-check-updates
  - npm install -g snyk
  - npm install -g webpack-bundle-analyzer

  # Install Python security tools
  - pip3 install bandit safety detect-secrets

  # Install Docker security scanning
  - wget https://github.com/aquasecurity/trivy/releases/download/v0.48.0/trivy_0.48.0_Linux-64bit.deb
  - dpkg -i trivy_0.48.0_Linux-64bit.deb
  - rm trivy_0.48.0_Linux-64bit.deb

  # Install GitLeaks for secrets detection
  - wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.1/gitleaks_8.18.1_linux_x64.tar.gz
  - tar -xzf gitleaks_8.18.1_linux_x64.tar.gz -C /usr/local/bin/
  - rm gitleaks_8.18.1_linux_x64.tar.gz

  # Install complexity analysis tools
  - npm install -g complexity-report jscpd

  # Configure Docker
  - systemctl enable docker
  - systemctl start docker
  - usermod -aG docker azurereviewer

  # Create workspace directory
  - mkdir -p /home/azurereviewer/fleet-review
  - chown -R azurereviewer:azurereviewer /home/azurereviewer/fleet-review

  # Install code quality tools
  - npm install -g madge # dependency analysis
  - npm install -g plato # complexity visualization

  # Create review scripts directory
  - mkdir -p /home/azurereviewer/review-agents
  - chown -R azurereviewer:azurereviewer /home/azurereviewer/review-agents

write_files:
  - path: /etc/motd
    content: |
      ╔════════════════════════════════════════════════════════════════╗
      ║       Fleet Management Code Review System - Azure VM           ║
      ║                                                                ║
      ║  This VM is configured with 5 autonomous review agents:        ║
      ║  1. Security Auditor                                           ║
      ║  2. Performance Analyzer                                       ║
      ║  3. Code Quality Reviewer                                      ║
      ║  4. Architecture Reviewer                                      ║
      ║  5. Compliance Checker                                         ║
      ║                                                                ║
      ║  Workspace: /home/azurereviewer/fleet-review                   ║
      ║  Scripts: /home/azurereviewer/review-agents                    ║
      ╚════════════════════════════════════════════════════════════════╝

final_message: "Fleet Code Review VM setup complete! Ready for agent deployment."
CLOUDINIT

log_success "Cloud-init configuration created"

################################################################################
# 5. Deploy Spot Instance VM
################################################################################

log_info "Deploying Azure Spot VM (this may take 5-10 minutes)..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --image "$IMAGE" \
  --size "$VM_SIZE" \
  --admin-username "$ADMIN_USER" \
  --ssh-key-values "@${SSH_KEY_PATH}.pub" \
  --priority Spot \
  --max-price "$SPOT_MAX_PRICE" \
  --eviction-policy "$EVICTION_POLICY" \
  --custom-data /tmp/cloud-init-review.txt \
  --public-ip-sku Standard \
  --storage-sku Premium_LRS \
  --os-disk-size-gb 128 \
  --tags "Purpose=CodeReview" "Project=Fleet" "AutoShutdown=Enabled" \
  --output json > /tmp/vm-output.json

if [ $? -ne 0 ]; then
  log_error "VM creation failed"
  exit 1
fi

VM_PUBLIC_IP=$(jq -r '.publicIpAddress' /tmp/vm-output.json)
VM_ID=$(jq -r '.id' /tmp/vm-output.json)

log_success "VM deployed successfully!"
log_info "Public IP: $VM_PUBLIC_IP"
log_info "VM ID: $VM_ID"

################################################################################
# 6. Configure Auto-Shutdown (8 hours runtime)
################################################################################

log_info "Configuring auto-shutdown after 8 hours..."
SHUTDOWN_TIME=$(date -u -d "+8 hours" +"%H%M")

az vm auto-shutdown \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --time "$SHUTDOWN_TIME" \
  || log_warning "Auto-shutdown configuration may have failed"

log_success "Auto-shutdown configured for $SHUTDOWN_TIME UTC"

################################################################################
# 7. Open Required Ports
################################################################################

log_info "Configuring network security group..."
NSG_NAME="${VM_NAME}-nsg"

# Allow SSH (22)
az network nsg rule create \
  --resource-group "$RESOURCE_GROUP" \
  --nsg-name "$NSG_NAME" \
  --name "AllowSSH" \
  --priority 1000 \
  --source-address-prefixes '*' \
  --destination-port-ranges 22 \
  --access Allow \
  --protocol Tcp \
  || log_warning "SSH rule may already exist"

log_success "Network security configured"

################################################################################
# 8. Wait for VM to be Ready
################################################################################

log_info "Waiting for VM to complete initialization (2-3 minutes)..."
sleep 120

# Test SSH connection
log_info "Testing SSH connection..."
for i in {1..10}; do
  if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i "$SSH_KEY_PATH" \
    "${ADMIN_USER}@${VM_PUBLIC_IP}" "echo 'SSH connection successful'" 2>/dev/null; then
    log_success "SSH connection established"
    break
  fi
  log_info "Waiting for SSH (attempt $i/10)..."
  sleep 10
done

################################################################################
# 9. Create Connection Script
################################################################################

CONNECTION_SCRIPT="/tmp/connect-review-vm.sh"
cat > "$CONNECTION_SCRIPT" <<CONNECT
#!/bin/bash
# Connect to Fleet Code Review VM
ssh -i "$SSH_KEY_PATH" "${ADMIN_USER}@${VM_PUBLIC_IP}"
CONNECT

chmod +x "$CONNECTION_SCRIPT"
log_success "Connection script created: $CONNECTION_SCRIPT"

################################################################################
# 10. Save VM Configuration
################################################################################

CONFIG_FILE="/tmp/fleet-review-vm-config.json"
cat > "$CONFIG_FILE" <<CONFIG
{
  "resourceGroup": "$RESOURCE_GROUP",
  "vmName": "$VM_NAME",
  "location": "$LOCATION",
  "publicIp": "$VM_PUBLIC_IP",
  "adminUser": "$ADMIN_USER",
  "sshKeyPath": "$SSH_KEY_PATH",
  "storageAccount": "$STORAGE_ACCOUNT",
  "storageKey": "$STORAGE_KEY",
  "vmSize": "$VM_SIZE",
  "spotPrice": "$SPOT_MAX_PRICE",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "autoShutdownTime": "$SHUTDOWN_TIME"
}
CONFIG

log_success "VM configuration saved: $CONFIG_FILE"

################################################################################
# 11. Display Summary
################################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           Azure VM Deployment Complete!                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 VM Details:"
echo "   • Name: $VM_NAME"
echo "   • Public IP: $VM_PUBLIC_IP"
echo "   • SSH User: $ADMIN_USER"
echo "   • SSH Key: $SSH_KEY_PATH"
echo ""
echo "💰 Cost Optimization:"
echo "   • Spot Instance: Yes (up to 80% savings)"
echo "   • Max Price: \$${SPOT_MAX_PRICE}/hour"
echo "   • Auto-shutdown: ${SHUTDOWN_TIME} UTC (8 hours)"
echo "   • Estimated Cost: \$0.30-0.40 per review cycle"
echo ""
echo "🔌 Connection:"
echo "   ssh -i $SSH_KEY_PATH ${ADMIN_USER}@${VM_PUBLIC_IP}"
echo ""
echo "📝 Or use the connection script:"
echo "   $CONNECTION_SCRIPT"
echo ""
echo "📦 Storage Account:"
echo "   • Name: $STORAGE_ACCOUNT"
echo "   • Container: review-results"
echo ""
echo "🚀 Next Steps:"
echo "   1. Upload review agent scripts to VM"
echo "   2. Clone Fleet repository"
echo "   3. Run agents with 02-run-all-agents.sh"
echo ""
echo "🛑 To delete all resources when done:"
echo "   az group delete --name $RESOURCE_GROUP --yes --no-wait"
echo ""

# Export variables for next scripts
export FLEET_REVIEW_VM_IP="$VM_PUBLIC_IP"
export FLEET_REVIEW_SSH_KEY="$SSH_KEY_PATH"
export FLEET_REVIEW_USER="$ADMIN_USER"
export FLEET_REVIEW_STORAGE="$STORAGE_ACCOUNT"
export FLEET_REVIEW_STORAGE_KEY="$STORAGE_KEY"

log_success "Deployment complete! VM is ready for agent deployment."
