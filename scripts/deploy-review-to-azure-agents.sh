#!/bin/bash
##############################################################################
# Deploy Fleet Completion Review Task to Azure Agent Orchestrator
# Submits the analysis task to ARCHITECT-PRIME ULTRA with RAG/MCP capabilities
##############################################################################

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Deploy Fleet Review to Azure Agent Orchestrator         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
AZURE_VM_IP="172.191.51.49"
AZURE_VM_USER="azureuser"
AGENT_WORKSPACE="/home/azureuser/agent-workspace"
LOCAL_PROJECT_DIR="/Users/andrewmorton/Documents/GitHub/fleet-local"
TASK_FILE="$LOCAL_PROJECT_DIR/azure-agent-orchestrator/tasks/fleet-completion-review-task.json"
ANALYSIS_OUTPUT_DIR="$LOCAL_PROJECT_DIR/analysis-output"

# Check if task file exists
if [ ! -f "$TASK_FILE" ]; then
    echo -e "${RED}ERROR: Task file not found: $TASK_FILE${NC}"
    exit 1
fi

# Check if analysis files exist
if [ ! -f "$ANALYSIS_OUTPUT_DIR/backend_analysis.json" ]; then
    echo -e "${RED}ERROR: Backend analysis not found${NC}"
    exit 1
fi

if [ ! -f "$ANALYSIS_OUTPUT_DIR/frontend_analysis.json" ]; then
    echo -e "${RED}ERROR: Frontend analysis not found${NC}"
    exit 1
fi

echo -e "${CYAN}Configuration:${NC}"
echo -e "  Azure VM: ${MAGENTA}$AZURE_VM_IP${NC}"
echo -e "  Agent Workspace: ${MAGENTA}$AGENT_WORKSPACE${NC}"
echo -e "  Task File: ${MAGENTA}$TASK_FILE${NC}"
echo ""

# Step 1: Check SSH connectivity
echo -e "${BLUE}[1/7] Testing SSH connection to Azure VM...${NC}"

# Try to find SSH key
SSH_KEY_PATHS=(
    "$HOME/.ssh/id_rsa"
    "$HOME/.ssh/fleet-agents-key"
    "$HOME/.ssh/azure_vm_key"
    "$HOME/.ssh/id_ed25519"
)

SSH_KEY=""
for KEY_PATH in "${SSH_KEY_PATHS[@]}"; do
    if [ -f "$KEY_PATH" ]; then
        if ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=5 "${AZURE_VM_USER}@${AZURE_VM_IP}" "echo 'SSH OK'" 2>/dev/null | grep -q "SSH OK"; then
            SSH_KEY="$KEY_PATH"
            echo -e "${GREEN}✓ SSH connection successful using $KEY_PATH${NC}"
            break
        fi
    fi
done

if [ -z "$SSH_KEY" ]; then
    echo -e "${YELLOW}⚠ Could not connect with SSH keys. Trying password auth...${NC}"
    if ! ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${AZURE_VM_USER}@${AZURE_VM_IP}" "echo 'SSH OK'" 2>/dev/null | grep -q "SSH OK"; then
        echo -e "${RED}ERROR: Cannot connect to Azure VM${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "  1. Check VM is running: az vm list -g <resource-group> --query \"[?powerState=='VM running']\""
        echo "  2. Check SSH key permissions: chmod 600 ~/.ssh/id_rsa"
        echo "  3. Check NSG rules allow SSH from your IP"
        echo "  4. Manually SSH: ssh -i ~/.ssh/id_rsa ${AZURE_VM_USER}@${AZURE_VM_IP}"
        exit 1
    fi
    SSH_CMD="ssh -o StrictHostKeyChecking=no"
    SCP_CMD="scp -o StrictHostKeyChecking=no"
else
    SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"
    SCP_CMD="scp -i $SSH_KEY -o StrictHostKeyChecking=no"
fi
echo ""

# Step 2: Upload task file and analysis documents
echo -e "${BLUE}[2/7] Uploading task configuration and analysis files...${NC}"

# Create directories on VM
$SSH_CMD "${AZURE_VM_USER}@${AZURE_VM_IP}" "mkdir -p $AGENT_WORKSPACE/tasks $AGENT_WORKSPACE/analysis-input $AGENT_WORKSPACE/analysis-output"

# Upload task file
$SCP_CMD "$TASK_FILE" "${AZURE_VM_USER}@${AZURE_VM_IP}:$AGENT_WORKSPACE/tasks/"
echo -e "${GREEN}✓ Task file uploaded${NC}"

# Upload analysis files
$SCP_CMD "$ANALYSIS_OUTPUT_DIR/backend_analysis.json" "${AZURE_VM_USER}@${AZURE_VM_IP}:$AGENT_WORKSPACE/analysis-input/"
$SCP_CMD "$ANALYSIS_OUTPUT_DIR/frontend_analysis.json" "${AZURE_VM_USER}@${AZURE_VM_IP}:$AGENT_WORKSPACE/analysis-input/"
echo -e "${GREEN}✓ Analysis files uploaded${NC}"
echo ""

# Step 3: Upload codebase (optional - for full RAG analysis)
echo -e "${BLUE}[3/7] Uploading Fleet codebase for RAG analysis...${NC}"
read -p "Upload full codebase (~500MB)? This enables RAG search. (y/n): " UPLOAD_CODEBASE

if [ "$UPLOAD_CODEBASE" = "y" ] || [ "$UPLOAD_CODEBASE" = "Y" ]; then
    echo -e "${CYAN}Creating codebase archive...${NC}"

    # Create tar excluding node_modules, .git, and other large dirs
    tar -czf /tmp/fleet-codebase.tar.gz \
        -C "$LOCAL_PROJECT_DIR" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='build' \
        --exclude='*.log' \
        --exclude='.vite' \
        .

    echo -e "${CYAN}Uploading codebase (this may take a few minutes)...${NC}"
    $SCP_CMD /tmp/fleet-codebase.tar.gz "${AZURE_VM_USER}@${AZURE_VM_IP}:$AGENT_WORKSPACE/"

    # Extract on VM
    $SSH_CMD "${AZURE_VM_USER}@${AZURE_VM_IP}" "cd $AGENT_WORKSPACE && tar -xzf fleet-codebase.tar.gz -C codebase/"

    # Clean up
    rm /tmp/fleet-codebase.tar.gz

    echo -e "${GREEN}✓ Codebase uploaded and extracted${NC}"
else
    echo -e "${YELLOW}⚠ Skipping codebase upload - agents will use git clone instead${NC}"

    # Create git clone script
    cat > /tmp/clone-fleet.sh << 'EOF'
#!/bin/bash
cd /home/azureuser/agent-workspace
if [ ! -d "codebase/.git" ]; then
    echo "Cloning Fleet repository..."
    git clone https://github.com/YourOrg/fleet-local.git codebase
fi
EOF

    $SCP_CMD /tmp/clone-fleet.sh "${AZURE_VM_USER}@${AZURE_VM_IP}:$AGENT_WORKSPACE/"
    $SSH_CMD "${AZURE_VM_USER}@${AZURE_VM_IP}" "chmod +x $AGENT_WORKSPACE/clone-fleet.sh && $AGENT_WORKSPACE/clone-fleet.sh"

    rm /tmp/clone-fleet.sh
fi
echo ""

# Step 4: Check agent status
echo -e "${BLUE}[4/7] Checking ARCHITECT-PRIME ULTRA status...${NC}"

AGENT_STATUS=$($SSH_CMD "${AZURE_VM_USER}@${AZURE_VM_IP}" "cd $AGENT_WORKSPACE && source venv/bin/activate && python3 -c 'print(\"READY\")' 2>&1" || echo "NOT_READY")

if echo "$AGENT_STATUS" | grep -q "READY"; then
    echo -e "${GREEN}✓ Agent environment ready${NC}"
else
    echo -e "${YELLOW}⚠ Agent environment needs setup. Installing dependencies...${NC}"

    $SSH_CMD "${AZURE_VM_USER}@${AZURE_VM_IP}" << 'REMOTE_SETUP'
cd /home/azureuser/agent-workspace

# Create virtual environment if needed
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install anthropic openai google-generativeai rich pandas openpyxl python-dotenv gitpython

echo "Dependencies installed"
REMOTE_SETUP

    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi
echo ""

# Step 5: Create execution script
echo -e "${BLUE}[5/7] Creating task execution script...${NC}"

cat > /tmp/run-fleet-review.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
"""
Execute Fleet Completion Review using ARCHITECT-PRIME ULTRA
"""

import sys
import json
import asyncio
from pathlib import Path

# Add agent workspace to path
sys.path.insert(0, '/home/azureuser/agent-workspace')

# Import the orchestrator
from architect_prime_ultra import *

async def main():
    # Load task configuration
    task_file = Path("/home/azureuser/agent-workspace/tasks/fleet-completion-review-task.json")
    with open(task_file) as f:
        task_config = json.load(f)

    console.print(Panel.fit(
        "[bold green]FLEET COMPLETION REVIEW TASK[/bold green]\n\n"
        f"Task ID: {task_config['task_id']}\n"
        f"Items to Review: 71 (37 backend + 34 frontend)\n"
        f"Required Capabilities: RAG, MCP, Multi-Model Consensus\n"
        f"Quality Threshold: 95%+\n"
        f"Honesty Policy: ZERO TOLERANCE FOR EXAGGERATION",
        title="🚀 ARCHITECT-PRIME ULTRA",
        border_style="green"
    ))

    # Initialize orchestrator
    orchestrator = UltraOrchestrator()

    # Execute task with full validation
    result = await orchestrator.execute_comprehensive_review(task_config)

    # Display results
    console.print("\n")
    console.print(Panel.fit(
        f"[bold green]✓ REVIEW COMPLETE[/bold green]\n\n"
        f"Items Reviewed: {result['items_reviewed']}\n"
        f"Average Quality Score: {result['avg_quality_score']}/100\n"
        f"Completion Percentage: {result['completion_pct']}%\n"
        f"Blocking Issues Found: {result['blocking_issues_count']}\n"
        f"Files Generated: {len(result['output_files'])}\n"
        f"Execution Time: {result['execution_time_minutes']} minutes\n"
        f"Total Cost: ${result['total_cost_usd']:.2f}",
        title="📊 Results Summary",
        border_style="green"
    ))

    console.print(f"\n[bold cyan]Output files:[/bold cyan]")
    for file in result['output_files']:
        console.print(f"  • {file}")

    return result

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0)
    except Exception as e:
        console.print(f"[bold red]ERROR: {str(e)}[/bold red]")
        sys.exit(1)
PYTHON_SCRIPT

$SCP_CMD /tmp/run-fleet-review.py "${AZURE_VM_USER}@${AZURE_VM_IP}:$AGENT_WORKSPACE/"
$SSH_CMD "${AZURE_VM_USER}@${AZURE_VM_IP}" "chmod +x $AGENT_WORKSPACE/run-fleet-review.py"

rm /tmp/run-fleet-review.py

echo -e "${GREEN}✓ Execution script created${NC}"
echo ""

# Step 6: Start the task
echo -e "${BLUE}[6/7] Starting ARCHITECT-PRIME ULTRA review task...${NC}"
echo ""

read -p "Start the review now? This will take ~3-4 hours. (y/n): " START_NOW

if [ "$START_NOW" = "y" ] || [ "$START_NOW" = "Y" ]; then
    echo -e "${CYAN}Launching task on Azure VM...${NC}"
    echo ""

    # Option 1: Run in foreground (watch progress)
    read -p "Run in foreground (watch progress) or background? (f/b): " RUN_MODE

    if [ "$RUN_MODE" = "f" ] || [ "$RUN_MODE" = "F" ]; then
        echo -e "${CYAN}Running in foreground - you'll see real-time progress${NC}"
        echo -e "${YELLOW}Press Ctrl+C to detach (task will continue)${NC}"
        echo ""

        $SSH_CMD -t "${AZURE_VM_USER}@${AZURE_VM_IP}" "cd $AGENT_WORKSPACE && source venv/bin/activate && python3 run-fleet-review.py"
    else
        echo -e "${CYAN}Running in background - task will run independently${NC}"

        $SSH_CMD "${AZURE_VM_USER}@${AZURE_VM_IP}" "cd $AGENT_WORKSPACE && source venv/bin/activate && nohup python3 run-fleet-review.py > review.log 2>&1 & echo \$! > review.pid"

        PID=$($SSH_CMD "${AZURE_VM_USER}@${AZURE_VM_IP}" "cat $AGENT_WORKSPACE/review.pid")

        echo -e "${GREEN}✓ Task started in background (PID: $PID)${NC}"
        echo ""
        echo -e "${CYAN}Monitor progress:${NC}"
        echo -e "  ${BLUE}ssh ${AZURE_VM_USER}@${AZURE_VM_IP} 'tail -f $AGENT_WORKSPACE/review.log'${NC}"
        echo ""
        echo -e "${CYAN}Check if still running:${NC}"
        echo -e "  ${BLUE}ssh ${AZURE_VM_USER}@${AZURE_VM_IP} 'ps aux | grep run-fleet-review'${NC}"
    fi
else
    echo -e "${YELLOW}Task uploaded but not started. Start manually:${NC}"
    echo -e "  ${BLUE}ssh ${AZURE_VM_USER}@${AZURE_VM_IP}${NC}"
    echo -e "  ${BLUE}cd $AGENT_WORKSPACE${NC}"
    echo -e "  ${BLUE}source venv/bin/activate${NC}"
    echo -e "  ${BLUE}python3 run-fleet-review.py${NC}"
fi
echo ""

# Step 7: Instructions for retrieving results
echo -e "${BLUE}[7/7] Results Retrieval Instructions${NC}"
echo ""

cat << EOF
${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}
${GREEN}║                TASK DEPLOYMENT COMPLETE                      ║${NC}
${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}

${CYAN}Expected Outputs:${NC}

1. ${MAGENTA}backend_analysis_UPDATED.xlsx${NC}
   - 37 items with honest status
   - Quality scores (0-100)
   - Evidence (file paths)
   - Realistic hours remaining

2. ${MAGENTA}frontend_analysis_UPDATED.xlsx${NC}
   - 34 items with honest status
   - Implementation quality scores
   - Technical debt notes

3. ${MAGENTA}HONEST_STATUS_REPORT.md${NC}
   - Executive summary
   - Completion percentages
   - Top blocking issues
   - Realistic timeline

4. ${MAGENTA}DETAILED_EVIDENCE.json${NC}
   - File paths for each item
   - Code snippets
   - Test results

5. ${MAGENTA}PRIORITIZED_ACTION_PLAN.md${NC}
   - Week-by-week roadmap
   - Resource allocation
   - Budget estimates

${CYAN}Estimated Completion:${NC} 3-4 hours

${CYAN}Download Results When Complete:${NC}

${BLUE}scp -r ${AZURE_VM_USER}@${AZURE_VM_IP}:$AGENT_WORKSPACE/analysis-output/* ${LOCAL_PROJECT_DIR}/analysis-output/${NC}

${CYAN}Azure VM Access:${NC}

${BLUE}ssh ${AZURE_VM_USER}@${AZURE_VM_IP}${NC}

${CYAN}Agent Capabilities:${NC}

✅ RAG Search - Semantic codebase understanding
✅ MCP Servers - Holistic context awareness
✅ Multi-Model Consensus - OpenAI o1, Claude Sonnet 4, Gemini 2.0
✅ Quality Gates - 10 validation checkpoints
✅ Zero-Tolerance Honesty - No exaggeration allowed
✅ Evidence-Based Status - All claims backed by code

${GREEN}═══════════════════════════════════════════════════════════════${NC}
EOF
