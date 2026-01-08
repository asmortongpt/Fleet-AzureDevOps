#!/bin/bash
# Azure VM Quick Fix Script
# Creates missing directories and prepares VM for agent deployment

set -e

AZURE_VM_NAME="fleet-qa-power"
AZURE_RG="fleet-ai-agents"

echo "🔧 Azure VM Quick Fix"
echo "===================="
echo ""

echo "[1/3] Creating missing directories on Azure VM..."
az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
    # Create all required directories
    mkdir -p /home/azureuser/fleet-db-deployment/agents
    mkdir -p /home/azureuser/fleet-db-deployment/logs
    mkdir -p /home/azureuser/fleet-complete-deployment/agents
    mkdir -p /home/azureuser/fleet-complete-deployment/logs
    
    # Set proper permissions
    chown -R azureuser:azureuser /home/azureuser/fleet-db-deployment
    chown -R azureuser:azureuser /home/azureuser/fleet-complete-deployment
    chmod -R 755 /home/azureuser/fleet-db-deployment
    chmod -R 755 /home/azureuser/fleet-complete-deployment
    
    echo 'Directories created successfully'
    ls -la /home/azureuser/
  " | jq -r '.value[0].message'

echo ""
echo "[2/3] Verifying Python environment..."
az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
    python3 --version
    pip3 --version
    pip3 install psycopg2-binary kubernetes python-dotenv --quiet
    echo 'Python environment ready'
  " | jq -r '.value[0].message'

echo ""
echo "[3/3] Verifying Kubernetes connection..."
az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
    kubectl cluster-info 2>&1 || echo 'Kubernetes not configured - will configure during deployment'
  " | jq -r '.value[0].message'

echo ""
echo "✅ Quick fix completed!"
echo ""
echo "Next steps:"
echo "1. Run fixed deployment scripts"
echo "2. Monitor agent execution"
echo "3. Verify database migrations"
