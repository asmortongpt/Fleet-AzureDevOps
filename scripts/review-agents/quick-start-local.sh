#!/bin/bash

################################################################################
# Quick Start - Local Execution
# Runs all 5 review agents on your local machine
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "BANNER"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║      Fleet Code Review System - Quick Start                   ║
║                                                                ║
║      Running 5 Autonomous Agents:                             ║
║      1. Security Auditor                                       ║
║      2. Performance Analyzer                                   ║
║      3. Code Quality Reviewer                                  ║
║      4. Architecture Reviewer                                  ║
║      5. Compliance Checker                                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}Repository:${NC} $REPO_DIR"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

MISSING=()
command -v node >/dev/null 2>&1 || MISSING+=("node")
command -v npm >/dev/null 2>&1 || MISSING+=("npm")
command -v jq >/dev/null 2>&1 || MISSING+=("jq")

if [ ${#MISSING[@]} -gt 0 ]; then
  echo -e "${YELLOW}Missing tools: ${MISSING[*]}${NC}"
  echo ""
  echo "Install missing tools:"
  echo "  macOS: brew install ${MISSING[*]}"
  echo "  Ubuntu: sudo apt-get install ${MISSING[*]}"
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo -e "${GREEN}✓${NC} Prerequisites checked"
echo ""

# Set environment variables
export REPO_DIR
export OUTPUT_DIR="/tmp/fleet-review-results"
export FINAL_REPORT="$REPO_DIR/COMPREHENSIVE_REVIEW_REPORT.md"

# Optional: Ask for app URL
read -p "Enter production URL for runtime testing (or press Enter to skip): " APP_URL
if [ -n "$APP_URL" ]; then
  export APP_URL
  echo -e "${GREEN}✓${NC} Will test $APP_URL"
else
  echo -e "${YELLOW}⊘${NC} Skipping runtime tests (Lighthouse, pa11y)"
fi
echo ""

# Install global tools if missing
echo -e "${YELLOW}Installing review tools (if needed)...${NC}"
npm list -g madge >/dev/null 2>&1 || npm install -g madge --silent || true
npm list -g jscpd >/dev/null 2>&1 || npm install -g jscpd --silent || true
npm list -g complexity-report >/dev/null 2>&1 || npm install -g complexity-report --silent || true
echo -e "${GREEN}✓${NC} Review tools ready"
echo ""

# Run agents
echo -e "${GREEN}Starting code review...${NC}"
echo ""

cd "$REPO_DIR"
bash "$SCRIPT_DIR/06-run-all-agents.sh"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ Code review complete!${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "📊 View comprehensive report:"
  echo "   cat $FINAL_REPORT"
  echo ""
  echo "📁 Detailed reports:"
  echo "   ls -lh $OUTPUT_DIR/"
  echo ""
  echo "🔍 Quick summary:"
  echo ""

  # Show summary stats
  if [ -f "$FINAL_REPORT" ]; then
    head -40 "$FINAL_REPORT" | grep -A 15 "Overall Assessment"
  fi

  echo ""
  echo "Next steps:"
  echo "  1. Review $FINAL_REPORT"
  echo "  2. Address critical issues first"
  echo "  3. Create GitHub issues for tracking"
  echo ""
else
  echo ""
  echo -e "${YELLOW}⚠ Code review completed with errors${NC}"
  echo "Check logs in: $OUTPUT_DIR/"
  echo ""
  exit $EXIT_CODE
fi
