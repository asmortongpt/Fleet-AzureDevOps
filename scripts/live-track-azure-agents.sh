#!/bin/bash
##############################################################################
# Live Tracking Dashboard for Azure Agent Remediation
# Monitors Azure VM and displays real-time progress
##############################################################################

set -euo pipefail

# Configuration
AZURE_VM_IP="172.191.51.49"
AZURE_VM_USER="azureuser"
SSH_KEY="$HOME/.ssh/id_rsa"
AGENT_WORKSPACE="/home/azureuser/agent-workspace"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Clear screen and move cursor to top
clear

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          AZURE AGENT REMEDIATION - LIVE TRACKER              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to get agent status
get_agent_status() {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${AZURE_VM_USER}@${AZURE_VM_IP} \
        "ps aux | grep 'run-fleet-remediation' | grep -v grep" 2>/dev/null || echo ""
}

# Function to tail logs
tail_logs() {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} \
        "tail -n 50 /home/azureuser/agent-workspace/remediation.log 2>/dev/null || echo 'No log file yet'"
}

# Function to get phase status
get_phase_status() {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} \
        "ls -1 /home/azureuser/agent-workspace/remediation-output/PHASE_*.md 2>/dev/null | wc -l" || echo "0"
}

# Function to get completion stats
get_stats() {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} << 'REMOTE'
cd /home/azureuser/agent-workspace/remediation-output 2>/dev/null || exit 0

# Count phases
PHASES=$(ls -1 PHASE_*.md 2>/dev/null | wc -l)

# Check if final report exists
if [ -f "FINAL_REMEDIATION_REPORT.md" ]; then
    echo "STATUS:COMPLETE"
    echo "PHASES:$PHASES"
else
    echo "STATUS:IN_PROGRESS"
    echo "PHASES:$PHASES"
fi
REMOTE
}

# Main monitoring loop
echo -e "${CYAN}Monitoring Azure VM: ${MAGENTA}$AZURE_VM_IP${NC}"
echo -e "${CYAN}Workspace: ${MAGENTA}$AGENT_WORKSPACE${NC}"
echo ""

REFRESH_INTERVAL=5  # seconds

while true; do
    # Save cursor position
    tput sc

    # Get current status
    STATS=$(get_stats)
    STATUS=$(echo "$STATS" | grep "STATUS:" | cut -d: -f2)
    PHASES=$(echo "$STATS" | grep "PHASES:" | cut -d: -f2)

    # Display header
    echo -e "${BLUE}[$(date '+%H:%M:%S')] Agent Status${NC}"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if agent is running
    AGENT_RUNNING=$(get_agent_status)

    if [ -n "$AGENT_RUNNING" ]; then
        echo -e "${GREEN}✓ Agent: RUNNING${NC}"
    else
        echo -e "${YELLOW}⚠ Agent: IDLE${NC}"
    fi

    # Display phase progress
    echo -e "${CYAN}Phases Completed: ${MAGENTA}$PHASES/6${NC}"

    # Status indicator
    if [ "$STATUS" = "COMPLETE" ]; then
        echo -e "${GREEN}Status: ✅ COMPLETE${NC}"
    else
        echo -e "${YELLOW}Status: 🔄 IN PROGRESS${NC}"
    fi

    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Display recent output
    echo -e "${CYAN}Recent Activity:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    tail_logs | tail -n 20
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Display available reports
    REPORTS=$(ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} \
        "ls -1 /home/azureuser/agent-workspace/remediation-output/*.md 2>/dev/null" || echo "")

    if [ -n "$REPORTS" ]; then
        echo -e "${CYAN}Available Reports:${NC}"
        echo "$REPORTS" | while read report; do
            filename=$(basename "$report")
            echo -e "  ${GREEN}✓${NC} $filename"
        done
        echo ""
    fi

    # Show instructions
    echo -e "${YELLOW}Press Ctrl+C to stop monitoring${NC}"
    echo -e "${CYAN}Refresh every $REFRESH_INTERVAL seconds${NC}"

    # Check if complete
    if [ "$STATUS" = "COMPLETE" ]; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}           REMEDIATION COMPLETE!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${CYAN}Download results:${NC}"
        echo -e "${BLUE}scp -r ${AZURE_VM_USER}@${AZURE_VM_IP}:${AGENT_WORKSPACE}/remediation-output/* ./remediation-output/${NC}"
        echo ""
        break
    fi

    # Wait before refresh
    sleep $REFRESH_INTERVAL

    # Clear screen for next update
    clear
done
