#!/bin/bash

# ============================================================================
# Fleet Agent Workers Verification Script
# ============================================================================
# Verifies that all 7 agents (A-G) are registered, healthy, and working
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ORCHESTRATOR_URL="http://172.191.51.49:3000"
EXPECTED_AGENTS=7

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         Fleet Agent Workers Verification                     ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# ============================================================================
# Test 1: Orchestrator API Health
# ============================================================================
echo -e "${BLUE}▶ Test 1: Orchestrator API Health${NC}"
if curl -sf ${ORCHESTRATOR_URL}/health > /dev/null; then
  echo -e "${GREEN}✓ Orchestrator API is healthy${NC}\n"
else
  echo -e "${RED}✗ Orchestrator API is not responding${NC}\n"
  exit 1
fi

# ============================================================================
# Test 2: Agent Registration
# ============================================================================
echo -e "${BLUE}▶ Test 2: Agent Registration${NC}"

AGENTS_JSON=$(curl -sf ${ORCHESTRATOR_URL}/api/agents)
AGENT_COUNT=$(echo "$AGENTS_JSON" | jq '.agents | length')

echo -e "Expected agents: ${EXPECTED_AGENTS}"
echo -e "Registered agents: ${AGENT_COUNT}\n"

if [ "$AGENT_COUNT" -ge "$EXPECTED_AGENTS" ]; then
  echo -e "${GREEN}✓ All agents registered${NC}\n"
else
  echo -e "${RED}✗ Missing agents (expected ${EXPECTED_AGENTS}, found ${AGENT_COUNT})${NC}\n"
  echo -e "${YELLOW}Registered agents:${NC}"
  echo "$AGENTS_JSON" | jq -r '.agents[] | "  - \(.name) (\(.role)) - Active: \(.active)"'
  echo ""
  exit 1
fi

# Show agent details
echo -e "${YELLOW}Registered agents:${NC}"
echo "$AGENTS_JSON" | jq -r '.agents[] | "  - \(.name) (\(.role)) - Model: \(.llm_model) - Active: \(.active)"'
echo ""

# ============================================================================
# Test 3: Agent Health Check
# ============================================================================
echo -e "${BLUE}▶ Test 3: Agent Health Check${NC}"

INACTIVE_COUNT=$(echo "$AGENTS_JSON" | jq '[.agents[] | select(.active == false)] | length')

if [ "$INACTIVE_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✓ All agents are active${NC}\n"
else
  echo -e "${YELLOW}⚠ ${INACTIVE_COUNT} agent(s) are inactive${NC}"
  echo "$AGENTS_JSON" | jq -r '.agents[] | select(.active == false) | "  - \(.name)"'
  echo ""
fi

# ============================================================================
# Test 4: Task Availability
# ============================================================================
echo -e "${BLUE}▶ Test 4: Task Availability${NC}"

TASKS_JSON=$(curl -sf ${ORCHESTRATOR_URL}/api/tasks)
TOTAL_TASKS=$(echo "$TASKS_JSON" | jq '.tasks | length')
PENDING_TASKS=$(echo "$TASKS_JSON" | jq '[.tasks[] | select(.status == "pending")] | length')
IN_PROGRESS_TASKS=$(echo "$TASKS_JSON" | jq '[.tasks[] | select(.status == "in_progress")] | length')
COMPLETED_TASKS=$(echo "$TASKS_JSON" | jq '[.tasks[] | select(.status == "done")] | length')

echo -e "Total tasks: ${TOTAL_TASKS}"
echo -e "Pending: ${PENDING_TASKS}"
echo -e "In Progress: ${IN_PROGRESS_TASKS}"
echo -e "Completed: ${COMPLETED_TASKS}\n"

if [ "$TOTAL_TASKS" -gt 0 ]; then
  echo -e "${GREEN}✓ Tasks loaded successfully${NC}\n"
else
  echo -e "${RED}✗ No tasks found${NC}\n"
  exit 1
fi

# ============================================================================
# Test 5: Task Assignments
# ============================================================================
echo -e "${BLUE}▶ Test 5: Task Assignments${NC}"

ASSIGNMENTS_JSON=$(curl -sf ${ORCHESTRATOR_URL}/api/assignments)
ASSIGNMENT_COUNT=$(echo "$ASSIGNMENTS_JSON" | jq '.assignments | length')

echo -e "Total assignments: ${ASSIGNMENT_COUNT}\n"

if [ "$ASSIGNMENT_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Agents have task assignments${NC}\n"

  echo -e "${YELLOW}Recent assignments:${NC}"
  echo "$ASSIGNMENTS_JSON" | jq -r '.assignments[0:5] | .[] | "  - Agent: \(.agent_name) | Task: \(.task_title) | Status: \(.status) | Progress: \(.percent_complete)%"'
  echo ""
else
  echo -e "${YELLOW}⚠ No task assignments yet (agents may still be polling)${NC}\n"
fi

# ============================================================================
# Test 6: Evidence Collection
# ============================================================================
echo -e "${BLUE}▶ Test 6: Evidence Collection${NC}"

EVIDENCE_JSON=$(curl -sf ${ORCHESTRATOR_URL}/api/evidence 2>/dev/null || echo '{"evidence":[]}')
EVIDENCE_COUNT=$(echo "$EVIDENCE_JSON" | jq '.evidence | length')

echo -e "Total evidence entries: ${EVIDENCE_COUNT}\n"

if [ "$EVIDENCE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Evidence being collected${NC}\n"

  echo -e "${YELLOW}Recent evidence:${NC}"
  echo "$EVIDENCE_JSON" | jq -r '.evidence[0:5] | .[] | "  - Type: \(.type) | Ref: \(.ref)"'
  echo ""
else
  echo -e "${YELLOW}⚠ No evidence collected yet${NC}\n"
fi

# ============================================================================
# Test 7: Container Health (if running on VMs)
# ============================================================================
echo -e "${BLUE}▶ Test 7: Container Health (Optional)${NC}"

VM1_IP="135.119.131.39"
VM2_IP="172.191.6.180"
SSH_USER="azureuser"
WORKER_DIR="/home/azureuser/fleet-agent-worker"

check_vm_containers() {
  local VM_IP=$1
  local VM_NAME=$2

  echo -e "\n${YELLOW}Checking ${VM_NAME} (${VM_IP})...${NC}"

  if ssh -o ConnectTimeout=5 ${SSH_USER}@${VM_IP} "cd ${WORKER_DIR} && docker-compose ps" 2>/dev/null; then
    echo -e "${GREEN}✓ Containers running on ${VM_NAME}${NC}"
  else
    echo -e "${YELLOW}⚠ Could not connect to ${VM_NAME}${NC}"
  fi
}

check_vm_containers "$VM1_IP" "VM1 (Agents D, E)"
check_vm_containers "$VM2_IP" "VM2 (Agents F, G)"

echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    VERIFICATION SUMMARY                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}✓ Orchestrator API: Healthy${NC}"
echo -e "${GREEN}✓ Agents Registered: ${AGENT_COUNT}/${EXPECTED_AGENTS}${NC}"
echo -e "${GREEN}✓ Tasks Available: ${TOTAL_TASKS}${NC}"
echo -e "${GREEN}✓ Assignments: ${ASSIGNMENT_COUNT}${NC}"
echo -e "${GREEN}✓ Evidence: ${EVIDENCE_COUNT}${NC}\n"

if [ "$AGENT_COUNT" -ge "$EXPECTED_AGENTS" ]; then
  echo -e "${GREEN}🎉 All systems operational!${NC}\n"
  exit 0
else
  echo -e "${YELLOW}⚠ System partially operational (missing agents)${NC}\n"
  exit 1
fi
