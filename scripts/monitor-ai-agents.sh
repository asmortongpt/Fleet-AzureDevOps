#!/bin/bash
# Monitor AI Agent Progress on Azure VMs

RESOURCE_GROUP="fleet-fortune50-agents-rg"

echo "==================================="
echo "AI Agent Deployment Monitor"
echo "==================================="
echo ""

# List all VMs
echo "Deployed VMs:"
az vm list -g "$RESOURCE_GROUP" --query "[].{Name:name, State:provisioningState}" -o table 2>/dev/null
echo ""

# Get IP addresses
echo "VM IP Addresses:"
az vm list-ip-addresses -g "$RESOURCE_GROUP" -o table 2>/dev/null
echo ""

# Check each agent's progress
agents=("agent-settings" "agent-user-accounts" "agent-data-table" "agent-charts" "agent-forms" "agent-performance" "agent-storybook")

for agent in "${agents[@]}"; do
    echo "========================================"
    echo "Agent: $agent"
    echo "========================================"

    # Run command to check cloud-init log
    az vm run-command invoke \
        -g "$RESOURCE_GROUP" \
        -n "$agent" \
        --command-id RunShellScript \
        --scripts "tail -50 /var/log/cloud-init-output.log 2>/dev/null || echo 'Still initializing...'" \
        --query "value[0].message" \
        -o tsv 2>/dev/null || echo "VM not ready yet"

    echo ""
done

echo "==================================="
echo "Monitoring Complete"
echo "==================================="
echo ""
echo "To monitor a specific agent:"
echo "  az vm run-command invoke -g $RESOURCE_GROUP -n agent-settings --command-id RunShellScript --scripts 'tail -f /var/log/cloud-init-output.log'"
echo ""
echo "To collect generated code:"
echo "  ./scripts/collect-ai-agent-code.sh"
