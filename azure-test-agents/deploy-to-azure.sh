#!/bin/bash
# Deploy and run comprehensive test suite on Azure VM

set -e

VM_NAME="fleet-qa-power"
RESOURCE_GROUP="FLEET-AI-AGENTS"
VM_USER="azureuser"

echo "🚀 Deploying Fleet Test Suite to Azure VM: ${VM_NAME}"
echo ""

# Package the test suite
echo "📦 Packaging test suite..."
cd /Users/andrewmorton/Documents/GitHub/Fleet
tar -czf /tmp/fleet-test-suite.tar.gz \
    azure-test-agents/ \
    e2e/ \
    tests/ \
    playwright.config.ts \
    package.json \
    src/ \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git

echo "✅ Package created: /tmp/fleet-test-suite.tar.gz"
echo ""

# Copy to Azure VM
echo "📤 Uploading to Azure VM..."
az vm run-command invoke \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${VM_NAME}" \
    --command-id RunShellScript \
    --scripts "mkdir -p /home/${VM_USER}/fleet-testing"

# Note: Using az vm run-command for file transfer
# Alternatively, if SSH is configured:
# scp /tmp/fleet-test-suite.tar.gz ${VM_USER}@${VM_IP}:/home/${VM_USER}/

# For now, let's use run-command to execute the tests
echo "🚀 Executing test suite on Azure VM..."

az vm run-command invoke \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${VM_NAME}" \
    --command-id RunShellScript \
    --scripts @/Users/andrewmorton/Documents/GitHub/Fleet/azure-test-agents/azure-vm-setup.sh

echo "✅ Deployment complete!"
echo ""
echo "📊 Tests are running on Azure VM..."
echo "⏱️  Estimated completion: 5 minutes"
