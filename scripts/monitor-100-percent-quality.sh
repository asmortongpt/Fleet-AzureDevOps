#!/bin/bash
##############################################################################
# Live Monitor for 100% Quality Achievement - All 3 Phases
# Real-time tracking of iterative refinement to 100% quality
##############################################################################

AZURE_VM_IP="172.191.51.49"
SSH_KEY="$HOME/.ssh/id_rsa"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   100% QUALITY ACHIEVEMENT - LIVE MONITOR (3 Phases)         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

while true; do
    clear
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   100% QUALITY ACHIEVEMENT - LIVE MONITOR (3 Phases)         ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}[$(date '+%H:%M:%S')] Monitoring 100% quality achievement...${NC}"
    echo ""

    # Check if process is running
    RUNNING=$(ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        "ps aux | grep achieve-100-percent-agent | grep -v grep" 2>/dev/null)

    if [ -n "$RUNNING" ]; then
        echo -e "${GREEN}● Agent Status: ACTIVE${NC}"
        CPU=$(echo "$RUNNING" | awk '{print $3}')
        MEM=$(echo "$RUNNING" | awk '{print $4}')
        echo -e "  CPU: ${MAGENTA}${CPU}%${NC} | Memory: ${MAGENTA}${MEM}%${NC}"
        echo ""
    else
        echo -e "${YELLOW}○ Agent Status: COMPLETED or IDLE${NC}"
        echo ""
    fi

    # Show recent activity (focusing on scores and iterations)
    echo -e "${CYAN}━━━ Recent Activity ━━━${NC}"
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        'tail -60 /tmp/100-percent-quality.log 2>/dev/null | grep -E "(Phase|Item|Iteration|score:|✓|✗|100%|COMPLETE)" | tail -25' || echo "No activity yet"

    echo ""
    echo -e "${CYAN}━━━ Progress Summary ━━━${NC}"

    # Count completed items at 100%
    HUNDRED_PERCENT=$(ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        'grep -c "achieved 100% quality" /tmp/100-percent-quality.log 2>/dev/null' || echo "0")

    # Count items in progress
    IN_PROGRESS=$(ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        'grep -c "Iteration" /tmp/100-percent-quality.log 2>/dev/null' || echo "0")

    echo -e "  Items at 100%: ${GREEN}${HUNDRED_PERCENT}${NC}"
    echo -e "  Iterations performed: ${MAGENTA}${IN_PROGRESS}${NC}"

    # Check current phase
    CURRENT_PHASE=$(ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        'tail -100 /tmp/100-percent-quality.log 2>/dev/null | grep -o "Starting Phase [ABC]" | tail -1' || echo "")

    if [ -n "$CURRENT_PHASE" ]; then
        echo -e "  Current: ${CYAN}${CURRENT_PHASE}${NC}"
    fi

    # Check for completion
    if ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
        'grep -q "100% QUALITY MISSION COMPLETE" /tmp/100-percent-quality.log 2>/dev/null'; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}         ✅ 100% QUALITY MISSION COMPLETE!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo ""

        # Show final results
        echo -e "${CYAN}Final Results:${NC}"
        ssh -i $SSH_KEY -o StrictHostKeyChecking=no azureuser@${AZURE_VM_IP} \
            'tail -30 /tmp/100-percent-quality.log 2>/dev/null | grep -E "(Total Completed|Average Quality|Execution Time)"'

        echo ""
        echo -e "${CYAN}Download results:${NC}"
        echo -e "  ./scripts/download-and-deploy-fortune50-code.sh"
        echo ""
        break
    fi

    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop monitoring (agents will continue running)${NC}"
    echo -e "${CYAN}Refreshing every 10 seconds...${NC}"

    sleep 10
done
