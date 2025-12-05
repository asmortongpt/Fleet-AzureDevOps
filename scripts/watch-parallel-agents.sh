#!/bin/bash
##############################################################################
# Live Monitor for 6 Parallel Fortune 50 Remediation Agents
# Real-time tracking of o3-mini + Claude Sonnet 4 + Gemini 2.0
##############################################################################

AZURE_VM_IP="172.191.51.49"
SSH_KEY="$HOME/.ssh/id_rsa"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   FORTUNE 50 PARALLEL AGENTS - LIVE MONITOR (o3 + Claude)   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

while true; do
    clear
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   FORTUNE 50 PARALLEL AGENTS - LIVE MONITOR (o3 + Claude)   ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}[$(date '+%H:%M:%S')] Monitoring 6 parallel agents...${NC}"
    echo ""

    # Check if process is running
    RUNNING=$(ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        "ps aux | grep parallel-remediation-agent | grep -v grep" 2>/dev/null)

    if [ -n "$RUNNING" ]; then
        echo -e "${GREEN}● Agents Status: ACTIVE${NC}"
        CPU=$(echo "$RUNNING" | awk '{print $3}')
        MEM=$(echo "$RUNNING" | awk '{print $4}')
        echo -e "  CPU: ${MAGENTA}${CPU}%${NC} | Memory: ${MAGENTA}${MEM}%${NC}"
        echo ""
    else
        echo -e "${YELLOW}○ Agents Status: COMPLETED or IDLE${NC}"
        echo ""
    fi

    # Show recent activity
    echo -e "${CYAN}━━━ Recent Activity ━━━${NC}"
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        'tail -40 /tmp/parallel-remediation.log 2>/dev/null | grep -E "(Agent|Phase|✓|✗|score:|Using|COMPLETE)" | tail -20' || echo "No activity yet"

    echo ""
    echo -e "${CYAN}━━━ Progress Summary ━━━${NC}"

    # Count completed phases
    PHASE_REPORTS=$(ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        'ls /home/azureuser/agent-workspace/remediation-output/*.md 2>/dev/null | wc -l' || echo "0")

    echo -e "  Reports generated: ${MAGENTA}${PHASE_REPORTS}${NC}"

    # Check for completion
    if ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        'grep -q "PARALLEL REMEDIATION COMPLETE" /tmp/parallel-remediation.log 2>/dev/null'; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}         ✅ ALL 6 AGENTS COMPLETED!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${CYAN}Download results:${NC}"
        echo -e "scp -r azureuser@${AZURE_VM_IP}:/home/azureuser/agent-workspace/remediation-output/* ./remediation-output/"
        echo ""
        break
    fi

    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop monitoring (agents will continue running)${NC}"
    echo -e "${CYAN}Refreshing every 5 seconds...${NC}"

    sleep 5
done
