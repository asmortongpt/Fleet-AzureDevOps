#!/bin/bash
# Deploy 5 Azure VM Agents for Fleet API Remediation

set -e

echo "====================================================================="
echo "Deploying 5 Azure VM Agents for Fleet Remediation"
echo "====================================================================="

VM_NAME="fleet-build-test-vm"
RESOURCE_GROUP="FLEET-AI-AGENTS"

# Copy remediation script to VM
echo "Copying remediation script to Azure VM..."
scp -o StrictHostKeyChecking=no \
  /Users/andrewmorton/Documents/GitHub/Fleet/azure-vm-remediation.sh \
  azureuser@$(az vm show -d -g $RESOURCE_GROUP -n $VM_NAME --query publicIps -o tsv):/tmp/

# Copy entire Fleet directory to VM
echo "Copying Fleet repository to Azure VM..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  /Users/andrewmorton/Documents/GitHub/Fleet/ \
  azureuser@$(az vm show -d -g $RESOURCE_GROUP -n $VM_NAME --query publicIps -o tsv):/home/azureuser/Fleet/

# Execute on VM with 5 parallel agents
echo "Executing remediation with 5 agents on Azure VM..."
az vm run-command invoke \
  -g $RESOURCE_GROUP \
  -n $VM_NAME \
  --command-id RunShellScript \
  --scripts @/tmp/azure-vm-agent-tasks.sh \
  --parameters \
    "grokApiKey=$GROK_API_KEY" \
    "anthropicApiKey=$ANTHROPIC_API_KEY"

echo "✅ Azure VM agents deployment complete!"
echo "Check progress: az vm run-command invoke -g $RESOURCE_GROUP -n $VM_NAME --command-id RunShellScript --scripts 'tail -100 /tmp/fleet-remediation.log'"
