#!/bin/bash
# Master Agent Orchestration Script
# Coordinates all 5 agents for Fleet Management System production upgrade
# Run this from Azure VM: ./scripts/start-agent-orchestration.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="/home/azure-vm/fleet-management"
LOG_DIR="$PROJECT_ROOT/agent-logs"
AGENT_DIR="$PROJECT_ROOT/deployment/vm-agent-tasks"

mkdir -p "$LOG_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Fleet Management System - Agent Orchestration            ║${NC}"
echo -e "${BLUE}║  Production Upgrade: 60% → 95% Enterprise-Grade           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Starting orchestration at: $(date)${NC}"
echo ""

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
  source "$PROJECT_ROOT/.env"
  echo -e "${GREEN}✓ Loaded environment variables${NC}"
else
  echo -e "${RED}✗ .env file not found!${NC}"
  exit 1
fi

# Verify required tools
check_tool() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}✗ $1 not found. Please install it first.${NC}"
    exit 1
  else
    echo -e "${GREEN}✓ $1 installed${NC}"
  fi
}

echo -e "\n${YELLOW}Verifying required tools...${NC}"
check_tool node
check_tool npm
check_tool psql
check_tool jq
check_tool git
check_tool az
check_tool kubectl
check_tool docker

# Check Node.js version (requires v18+)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js version must be >= 18 (current: $NODE_VERSION)${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js version $NODE_VERSION${NC}"

# Check database connectivity
echo -e "\n${YELLOW}Testing database connectivity...${NC}"
export PGPASSWORD="$AZURE_SQL_PASSWORD"
if psql -h "$AZURE_SQL_SERVER" -U "$AZURE_SQL_USERNAME" -d fleet_db -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Database connection successful${NC}"
else
  echo -e "${RED}✗ Cannot connect to database${NC}"
  exit 1
fi

# Check Azure CLI authentication
echo -e "\n${YELLOW}Verifying Azure authentication...${NC}"
if az account show > /dev/null 2>&1; then
  SUBSCRIPTION=$(az account show --query name -o tsv)
  echo -e "${GREEN}✓ Authenticated to Azure subscription: $SUBSCRIPTION${NC}"
else
  echo -e "${RED}✗ Not authenticated to Azure. Run 'az login' first.${NC}"
  exit 1
fi

# Check Kubernetes cluster access
echo -e "\n${YELLOW}Verifying Kubernetes access...${NC}"
if kubectl cluster-info > /dev/null 2>&1; then
  CLUSTER=$(kubectl config current-context)
  echo -e "${GREEN}✓ Connected to K8s cluster: $CLUSTER${NC}"
else
  echo -e "${YELLOW}! Kubernetes not configured. Will configure in Phase 4.${NC}"
fi

# Initialize orchestration state
STATE_FILE="$LOG_DIR/orchestration-state.json"
cat > "$STATE_FILE" << EOF
{
  "orchestration_started_at": "$(date -Iseconds)",
  "current_phase": 1,
  "phases": {
    "1": {"name": "Critical Fixes", "status": "pending", "agents": ["Agent-2-Backend"]},
    "2": {"name": "Database Partitioning", "status": "pending", "agents": ["Agent-1-Database"]},
    "3": {"name": "Caching & Performance", "status": "pending", "agents": ["Agent-2-Backend"]},
    "4": {"name": "CI/CD Pipeline", "status": "pending", "agents": ["Agent-4-DevOps"]},
    "5": {"name": "Real-Time Features", "status": "pending", "agents": ["Agent-2-Backend", "Agent-3-Frontend"]},
    "6": {"name": "ML Integration", "status": "pending", "agents": ["Agent-2-Backend"]},
    "7": {"name": "Testing & Validation", "status": "pending", "agents": ["Agent-5-QA"]},
    "8": {"name": "Production Deployment", "status": "pending", "agents": ["Agent-4-DevOps"]}
  },
  "agents": {
    "Agent-1-Database": {"status": "idle", "current_task": null},
    "Agent-2-Backend": {"status": "idle", "current_task": null},
    "Agent-3-Frontend": {"status": "idle", "current_task": null},
    "Agent-4-DevOps": {"status": "idle", "current_task": null},
    "Agent-5-QA": {"status": "idle", "current_task": null}
  }
}
EOF

# Function to update orchestration state
update_state() {
  local phase=$1
  local status=$2
  local agent=$3

  jq --arg phase "$phase" \
     --arg status "$status" \
     --arg agent "$agent" \
     '.phases[$phase].status = $status |
      .agents[$agent].status = $status |
      .last_updated = now | todate' \
     "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

# Function to check phase dependencies
check_dependencies() {
  local phase=$1

  case $phase in
    2)
      # Phase 2 depends on Phase 1
      local phase1_status=$(jq -r '.phases["1"].status' "$STATE_FILE")
      if [ "$phase1_status" != "complete" ]; then
        return 1
      fi
      ;;
    3|4|5|6|7)
      # Phases 3-7 depend on Phase 2
      local phase2_status=$(jq -r '.phases["2"].status' "$STATE_FILE")
      if [ "$phase2_status" != "complete" ]; then
        return 1
      fi
      ;;
    8)
      # Phase 8 depends on all previous phases
      for i in {1..7}; do
        local status=$(jq -r ".phases[\"$i\"].status" "$STATE_FILE")
        if [ "$status" != "complete" ]; then
          return 1
        fi
      done
      ;;
  esac

  return 0
}

# Function to run agent script
run_agent() {
  local agent_name=$1
  local script_path=$2

  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Starting: $agent_name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Make script executable
  chmod +x "$script_path"

  # Run script and capture output
  LOG_FILE="$LOG_DIR/${agent_name}-$(date +%Y%m%d-%H%M%S).log"

  if bash "$script_path" 2>&1 | tee "$LOG_FILE"; then
    echo -e "${GREEN}✓ $agent_name completed successfully${NC}"
    return 0
  else
    echo -e "${RED}✗ $agent_name failed. Check log: $LOG_FILE${NC}"
    return 1
  fi
}

# === PHASE 1: CRITICAL FIXES (BLOCKING) ===
echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 1: CRITICAL FIXES (TypeScript Compilation)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

update_state "1" "in_progress" "Agent-2-Backend"

if run_agent "Agent-2-Backend-TypeScript" "$AGENT_DIR/01-typescript-fixes-agent.sh"; then
  update_state "1" "complete" "Agent-2-Backend"
  echo -e "${GREEN}✅ Phase 1 complete${NC}"
else
  echo -e "${RED}❌ Phase 1 failed. Cannot proceed.${NC}"
  exit 1
fi

# === PHASE 2: DATABASE PARTITIONING ===
echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 2: DATABASE PARTITIONING${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

if check_dependencies 2; then
  update_state "2" "in_progress" "Agent-1-Database"

  if run_agent "Agent-1-Database-Partitioning" "$AGENT_DIR/02-database-partitioning-agent.sh"; then
    update_state "2" "complete" "Agent-1-Database"
    echo -e "${GREEN}✅ Phase 2 complete${NC}"
  else
    echo -e "${RED}❌ Phase 2 failed${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ Phase 2 dependencies not met. Skipping.${NC}"
fi

# === PHASE 3-8: REMAINING PHASES ===
# These would be implemented similarly, but for now we'll create placeholder scripts

echo -e "\n${YELLOW}Phase 3-8 agent scripts will be executed next...${NC}"
echo -e "${YELLOW}To continue, run the individual agent scripts in order:${NC}"
echo ""
echo "  3. ./deployment/vm-agent-tasks/03-caching-agent.sh"
echo "  4. ./deployment/vm-agent-tasks/04-cicd-agent.sh"
echo "  5. ./deployment/vm-agent-tasks/05-realtime-agent.sh"
echo "  6. ./deployment/vm-agent-tasks/06-ml-integration-agent.sh"
echo "  7. ./deployment/vm-agent-tasks/07-testing-agent.sh"
echo "  8. ./deployment/vm-agent-tasks/08-deployment-agent.sh"
echo ""

# Generate final report
cat > "$LOG_DIR/orchestration-report.md" << EOF
# Agent Orchestration Report
**Generated:** $(date)
**Orchestration Started:** $(jq -r '.orchestration_started_at' "$STATE_FILE")

## Phase Summary

$(for i in {1..8}; do
  name=$(jq -r ".phases[\"$i\"].name" "$STATE_FILE")
  status=$(jq -r ".phases[\"$i\"].status" "$STATE_FILE")
  agents=$(jq -r ".phases[\"$i\"].agents | join(\", \")" "$STATE_FILE")

  if [ "$status" == "complete" ]; then
    echo "✅ **Phase $i: $name** - COMPLETE"
  elif [ "$status" == "in_progress" ]; then
    echo "⏳ **Phase $i: $name** - IN PROGRESS"
  elif [ "$status" == "failed" ]; then
    echo "❌ **Phase $i: $name** - FAILED"
  else
    echo "⏸️  **Phase $i: $name** - PENDING"
  fi
  echo "   - Agents: $agents"
  echo ""
done)

## Agent Status

$(for agent in "Agent-1-Database" "Agent-2-Backend" "Agent-3-Frontend" "Agent-4-DevOps" "Agent-5-QA"; do
  status=$(jq -r ".agents[\"$agent\"].status" "$STATE_FILE")
  task=$(jq -r ".agents[\"$agent\"].current_task // \"None\"" "$STATE_FILE")

  echo "- **$agent**: $status (Task: $task)"
done)

## Logs & Artifacts

$(ls -1 $LOG_DIR/*.log 2>/dev/null | tail -10 | while read log; do
  echo "- $(basename $log) ($(du -h $log | awk '{print $1}'))"
done)

## Next Steps

1. Review agent logs in: \`$LOG_DIR\`
2. Check progress: \`cat $STATE_FILE | jq\`
3. Continue with Phase 3-8 execution
4. Monitor for blockers: \`grep BLOCKER $LOG_DIR/blockers.log\`

## Metrics Dashboard

Run: \`cat $LOG_DIR/metrics.json | jq\`

EOF

cat "$LOG_DIR/orchestration-report.md"

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Orchestration report saved: $LOG_DIR/orchestration-report.md${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "\nCompleted: $(date)"
