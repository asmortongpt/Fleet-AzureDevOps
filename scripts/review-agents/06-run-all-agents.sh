#!/bin/bash

################################################################################
# Run All Review Agents
# Orchestrates all 5 agents in parallel and aggregates results
################################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_agent() { echo -e "${MAGENTA}[AGENT]${NC} $1"; }

################################################################################
# Configuration
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${REPO_DIR:-$(pwd)}"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/fleet-review-results}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FINAL_REPORT="${FINAL_REPORT:-$REPO_DIR/COMPREHENSIVE_REVIEW_REPORT.md}"

# Optional: Application URL for runtime testing
APP_URL="${APP_URL:-}"

mkdir -p "$OUTPUT_DIR"

log_info "Fleet Management System - Comprehensive Code Review"
log_info "============================================"
log_info "Repository: $REPO_DIR"
log_info "Output Directory: $OUTPUT_DIR"
log_info "Timestamp: $TIMESTAMP"
log_info ""

################################################################################
# Pre-flight Checks
################################################################################

log_info "Performing pre-flight checks..."

# Check if we're in a valid repo
if [ ! -f "$REPO_DIR/package.json" ]; then
  log_error "Not a valid Node.js project (package.json not found)"
  exit 1
fi

# Check required tools
MISSING_TOOLS=()
for tool in node npm jq; do
  if ! command -v $tool &> /dev/null; then
    MISSING_TOOLS+=("$tool")
  fi
done

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  log_error "Missing required tools: ${MISSING_TOOLS[*]}"
  log_error "Please install missing tools before running agents"
  exit 1
fi

log_success "Pre-flight checks passed"

################################################################################
# Export Environment Variables
################################################################################

export REPO_DIR
export OUTPUT_DIR
export APP_URL

################################################################################
# Run Agents in Parallel
################################################################################

log_info ""
log_info "Starting 5 autonomous review agents..."
log_info "============================================"

START_TIME=$(date +%s)

# Array to track PIDs
AGENT_PIDS=()

# Agent 1: Security Auditor
log_agent "Starting Agent 1: Security Auditor"
bash "$SCRIPT_DIR/01-agent-security-auditor.sh" > "$OUTPUT_DIR/agent-1-security.log" 2>&1 &
AGENT_PIDS+=($!)

# Agent 2: Performance Analyzer
log_agent "Starting Agent 2: Performance Analyzer"
bash "$SCRIPT_DIR/02-agent-performance-analyzer.sh" > "$OUTPUT_DIR/agent-2-performance.log" 2>&1 &
AGENT_PIDS+=($!)

# Agent 3: Code Quality Reviewer
log_agent "Starting Agent 3: Code Quality Reviewer"
bash "$SCRIPT_DIR/03-agent-code-quality.sh" > "$OUTPUT_DIR/agent-3-quality.log" 2>&1 &
AGENT_PIDS+=($!)

# Agent 4: Architecture Reviewer
log_agent "Starting Agent 4: Architecture Reviewer"
bash "$SCRIPT_DIR/04-agent-architecture-reviewer.sh" > "$OUTPUT_DIR/agent-4-architecture.log" 2>&1 &
AGENT_PIDS+=($!)

# Agent 5: Compliance Checker
log_agent "Starting Agent 5: Compliance Checker"
bash "$SCRIPT_DIR/05-agent-compliance-checker.sh" > "$OUTPUT_DIR/agent-5-compliance.log" 2>&1 &
AGENT_PIDS+=($!)

log_info ""
log_info "All agents started. Monitoring progress..."
log_info ""

################################################################################
# Monitor Agent Progress
################################################################################

AGENT_NAMES=(
  "Security Auditor"
  "Performance Analyzer"
  "Code Quality Reviewer"
  "Architecture Reviewer"
  "Compliance Checker"
)

AGENT_STATUS=(0 0 0 0 0)
COMPLETED=0

# Monitor agents
while [ $COMPLETED -lt 5 ]; do
  sleep 5
  COMPLETED=0

  for i in {0..4}; do
    PID=${AGENT_PIDS[$i]}

    if [ ${AGENT_STATUS[$i]} -eq 0 ]; then
      if ! kill -0 $PID 2>/dev/null; then
        # Agent completed
        wait $PID
        EXIT_CODE=$?

        if [ $EXIT_CODE -eq 0 ]; then
          log_success "Agent $((i+1)) (${AGENT_NAMES[$i]}) completed successfully"
          AGENT_STATUS[$i]=1
        else
          log_error "Agent $((i+1)) (${AGENT_NAMES[$i]}) failed with exit code $EXIT_CODE"
          AGENT_STATUS[$i]=2
        fi
      fi
    fi

    if [ ${AGENT_STATUS[$i]} -gt 0 ]; then
      COMPLETED=$((COMPLETED + 1))
    fi
  done

  # Show progress
  echo -ne "\rProgress: $COMPLETED/5 agents completed"
done

echo ""
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_info ""
log_success "All agents completed in ${DURATION}s"
log_info ""

################################################################################
# Check for Failed Agents
################################################################################

FAILED_AGENTS=()
for i in {0..4}; do
  if [ ${AGENT_STATUS[$i]} -eq 2 ]; then
    FAILED_AGENTS+=("${AGENT_NAMES[$i]}")
  fi
done

if [ ${#FAILED_AGENTS[@]} -gt 0 ]; then
  log_warning "Some agents failed: ${FAILED_AGENTS[*]}"
  log_warning "Review logs in $OUTPUT_DIR/"
fi

################################################################################
# Generate Comprehensive Report
################################################################################

log_info "Generating comprehensive review report..."

bash "$SCRIPT_DIR/07-generate-report.sh"

if [ $? -eq 0 ]; then
  log_success "Comprehensive report generated: $FINAL_REPORT"
else
  log_error "Failed to generate comprehensive report"
  exit 1
fi

################################################################################
# Summary
################################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Code Review Complete                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Review Summary:"
echo "   • Duration: ${DURATION}s"
echo "   • Agents Run: 5"
echo "   • Successful: $((5 - ${#FAILED_AGENTS[@]}))"
echo "   • Failed: ${#FAILED_AGENTS[@]}"
echo ""
echo "📁 Outputs:"
echo "   • Detailed Reports: $OUTPUT_DIR/"
echo "   • Comprehensive Report: $FINAL_REPORT"
echo ""
echo "📝 Individual Agent Reports:"
echo "   1. Security Audit: $OUTPUT_DIR/01-security-audit-report.json"
echo "   2. Performance: $OUTPUT_DIR/02-performance-report.json"
echo "   3. Code Quality: $OUTPUT_DIR/03-code-quality-report.json"
echo "   4. Architecture: $OUTPUT_DIR/04-architecture-report.json"
echo "   5. Compliance: $OUTPUT_DIR/05-compliance-report.json"
echo ""
echo "🔍 Next Steps:"
echo "   1. Review comprehensive report: $FINAL_REPORT"
echo "   2. Prioritize critical and high severity issues"
echo "   3. Create remediation plan"
echo "   4. Track progress with GitHub Issues"
echo ""

# Calculate total issues
TOTAL_CRITICAL=0
TOTAL_HIGH=0
TOTAL_MEDIUM=0
TOTAL_LOW=0

for report in "$OUTPUT_DIR"/0*-report.json; do
  if [ -f "$report" ]; then
    CRITICAL=$(jq '.summary.criticalCount // 0' "$report")
    HIGH=$(jq '.summary.highCount // 0' "$report")
    MEDIUM=$(jq '.summary.mediumCount // 0' "$report")
    LOW=$(jq '.summary.lowCount // 0' "$report")

    TOTAL_CRITICAL=$((TOTAL_CRITICAL + CRITICAL))
    TOTAL_HIGH=$((TOTAL_HIGH + HIGH))
    TOTAL_MEDIUM=$((TOTAL_MEDIUM + MEDIUM))
    TOTAL_LOW=$((TOTAL_LOW + LOW))
  fi
done

TOTAL_ISSUES=$((TOTAL_CRITICAL + TOTAL_HIGH + TOTAL_MEDIUM + TOTAL_LOW))

echo "⚠️  Issues Found:"
echo "   • Critical: $TOTAL_CRITICAL"
echo "   • High: $TOTAL_HIGH"
echo "   • Medium: $TOTAL_MEDIUM"
echo "   • Low: $TOTAL_LOW"
echo "   • Total: $TOTAL_ISSUES"
echo ""

if [ $TOTAL_CRITICAL -gt 0 ]; then
  echo -e "${RED}⚠️  CRITICAL ISSUES REQUIRE IMMEDIATE ATTENTION${NC}"
  echo ""
fi

log_success "Code review complete!"

exit 0
