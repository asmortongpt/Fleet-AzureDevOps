#!/bin/bash
##############################################################################
# Live Production Remediation Monitor
# Real-time tracking of Fortune 50 grade AI code generation
##############################################################################

set -euo pipefail

# Configuration
AZURE_VM_IP="172.191.51.49"
AZURE_VM_USER="azureuser"
SSH_KEY="$HOME/.ssh/id_rsa"
WORKSPACE="/home/azureuser/agent-workspace"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     FORTUNE 50 PRODUCTION REMEDIATION - LIVE MONITOR        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to get RAG status
get_rag_status() {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} \
        "if [ -f ${WORKSPACE}/rag-index/index_metadata.json ]; then cat ${WORKSPACE}/rag-index/index_metadata.json; else echo '{}'; fi" 2>/dev/null || echo "{}"
}

# Function to get remediation status
get_remediation_status() {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} \
        "ps aux | grep 'run-production-remediation' | grep -v grep" 2>/dev/null || echo ""
}

# Function to get phase count
get_phase_count() {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} \
        "ls -1 ${WORKSPACE}/remediation-output/PHASE_*.md 2>/dev/null | wc -l" || echo "0"
}

# Function to tail logs
tail_logs() {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} \
        "tail -n 30 ${WORKSPACE}/remediation-output/remediation.log 2>/dev/null || tail -n 30 /tmp/production-remediation.log 2>/dev/null || echo 'No logs yet'"
}

# Function to get current activity
get_current_activity() {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${AZURE_VM_USER}@${AZURE_VM_IP} \
        "tail -n 5 ${WORKSPACE}/remediation-output/remediation.log 2>/dev/null | grep -E '(Remediating|Phase|RAG search|Architectural planning|Code generation|Code review|Quality score|completed successfully)' | tail -n 1" || echo "Initializing..."
}

echo -e "${CYAN}Connected to: ${MAGENTA}$AZURE_VM_IP${NC}"
echo -e "${CYAN}Workspace: ${MAGENTA}$WORKSPACE${NC}"
echo ""

# Check RAG system status
echo -e "${BLUE}━━━ RAG System Status ━━━${NC}"
RAG_STATUS=$(get_rag_status)
if echo "$RAG_STATUS" | grep -q "total_chunks"; then
    CHUNKS=$(echo "$RAG_STATUS" | grep -o '"total_chunks":[^,}]*' | cut -d: -f2)
    FILES=$(echo "$RAG_STATUS" | grep -o '"total_files":[^,}]*' | cut -d: -f2)
    echo -e "${GREEN}✓ RAG Index Ready${NC}"
    echo -e "  Files indexed: ${CYAN}$FILES${NC}"
    echo -e "  Chunks created: ${CYAN}$CHUNKS${NC}"
else
    echo -e "${YELLOW}⏳ RAG indexing in progress...${NC}"
fi

echo ""
echo -e "${BLUE}━━━ Production Remediation Status ━━━${NC}"

REFRESH_INTERVAL=5

while true; do
    # Get status
    AGENT_RUNNING=$(get_remediation_status)
    PHASES_COMPLETED=$(get_phase_count)
    CURRENT_ACTIVITY=$(get_current_activity)

    # Display status
    echo -ne "\r${CYAN}[$(date '+%H:%M:%S')]${NC} "

    if [ -n "$AGENT_RUNNING" ]; then
        echo -ne "${GREEN}● Running${NC} │ "
    else
        echo -ne "${YELLOW}○ Idle${NC}    │ "
    fi

    echo -ne "Phases: ${MAGENTA}${PHASES_COMPLETED}/6${NC} │ "
    echo -ne "${CYAN}${CURRENT_ACTIVITY}${NC}"
    echo -ne "                    "  # Clear rest of line

    # Check for completion
    if [ -f /tmp/remediation-complete ]; then
        echo -e "\n\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}           PRODUCTION REMEDIATION COMPLETE!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${CYAN}Download results:${NC}"
        echo -e "${BLUE}scp -r ${AZURE_VM_USER}@${AZURE_VM_IP}:${WORKSPACE}/remediation-output/* ./remediation-output/${NC}"
        break
    fi

    sleep $REFRESH_INTERVAL
done
