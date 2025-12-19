#!/bin/bash
################################################################################
# Fleet Security Remediation - Quick Start Script
# This script sets up and runs the security remediation system
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root (assumes script is in security-remediation/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMEDIATION_DIR="$PROJECT_ROOT/security-remediation"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Fleet Security Remediation System - Quick Start              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

################################################################################
# Step 1: Verify Prerequisites
################################################################################

echo -e "${YELLOW}Step 1: Verifying prerequisites...${NC}\n"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
echo -e "${GREEN}✓ Python version: $PYTHON_VERSION${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js version: $NODE_VERSION${NC}"

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git not found. Please install Git${NC}"
    exit 1
fi

GIT_VERSION=$(git --version | cut -d' ' -f3)
echo -e "${GREEN}✓ Git version: $GIT_VERSION${NC}"

echo ""

################################################################################
# Step 2: Install Dependencies
################################################################################

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}\n"

# Python dependencies
if [ -f "$REMEDIATION_DIR/requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip3 install -q -r "$REMEDIATION_DIR/requirements.txt"
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ requirements.txt not found, skipping...${NC}"
fi

# Node dependencies (if not already installed)
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo "Installing Node.js dependencies..."
    cd "$PROJECT_ROOT"
    npm install --silent
    echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Node.js dependencies already installed${NC}"
fi

# Make scripts executable
chmod +x "$REMEDIATION_DIR/master-orchestrator.py"
chmod +x "$REMEDIATION_DIR/agents"/*.py 2>/dev/null || true
echo -e "${GREEN}✓ Scripts made executable${NC}"

echo ""

################################################################################
# Step 3: Create Backup
################################################################################

echo -e "${YELLOW}Step 3: Creating backup...${NC}\n"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BRANCH="backup-before-remediation-$TIMESTAMP"

cd "$PROJECT_ROOT"

# Check if we're in a git repository
if [ -d ".git" ]; then
    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo "Current branch: $CURRENT_BRANCH"

    # Create backup branch
    git branch "$BACKUP_BRANCH"
    echo -e "${GREEN}✓ Created backup branch: $BACKUP_BRANCH${NC}"

    # Create tag
    git tag "pre-remediation-$TIMESTAMP" -m "State before security remediation"
    echo -e "${GREEN}✓ Created tag: pre-remediation-$TIMESTAMP${NC}"
else
    echo -e "${YELLOW}⚠ Not a git repository, skipping backup${NC}"
fi

echo ""

################################################################################
# Step 4: Run Dry-Run
################################################################################

echo -e "${YELLOW}Step 4: Running dry-run analysis...${NC}\n"
echo -e "${BLUE}This will scan for vulnerabilities without making changes.${NC}\n"

cd "$PROJECT_ROOT"

python3 "$REMEDIATION_DIR/master-orchestrator.py" \
    --phase all \
    --dry-run \
    --project-root "$PROJECT_ROOT"

echo ""
echo -e "${GREEN}✓ Dry-run complete!${NC}\n"

################################################################################
# Step 5: Review Results
################################################################################

echo -e "${YELLOW}Step 5: Reviewing results...${NC}\n"

REPORT_FILE="$REMEDIATION_DIR/reports/remediation-report.json"
DASHBOARD_FILE="$REMEDIATION_DIR/reports/progress-dashboard.html"

if [ -f "$REPORT_FILE" ]; then
    echo "Report location: $REPORT_FILE"

    # Extract summary from JSON report
    TOTAL_TASKS=$(grep -o '"total_tasks": [0-9]*' "$REPORT_FILE" | head -1 | cut -d':' -f2 | tr -d ' ')

    echo ""
    echo -e "${BLUE}Vulnerabilities found:${NC}"
    echo "  Total issues: $TOTAL_TASKS"
    echo ""
fi

if [ -f "$DASHBOARD_FILE" ]; then
    echo "Dashboard location: $DASHBOARD_FILE"

    # Open dashboard in browser (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo ""
        echo -e "${GREEN}Opening dashboard in browser...${NC}"
        open "$DASHBOARD_FILE"
    else
        echo ""
        echo -e "${YELLOW}Open this file in your browser:${NC}"
        echo "  file://$DASHBOARD_FILE"
    fi
fi

echo ""

################################################################################
# Step 6: Prompt for Execution
################################################################################

echo -e "${YELLOW}Step 6: Execute remediation?${NC}\n"
echo -e "${BLUE}The dry-run analysis is complete.${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the dashboard and report"
echo "  2. Decide whether to proceed with automatic fixes"
echo ""
echo -e "${YELLOW}Do you want to execute the remediation now? (y/N)${NC} "
read -r PROCEED

if [[ "$PROCEED" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Starting remediation...${NC}\n"

    # Ask which phase to run
    echo "Which phase do you want to run?"
    echo "  1) Phase 1 - Critical Security (XSS, CSRF, SQL Injection)"
    echo "  2) Phase 2 - High Priority (Tenant Isolation, Repository Pattern)"
    echo "  3) All phases"
    echo ""
    echo -e "${YELLOW}Enter choice (1-3):${NC} "
    read -r PHASE_CHOICE

    case $PHASE_CHOICE in
        1)
            PHASE="1"
            ;;
        2)
            PHASE="2"
            ;;
        3)
            PHASE="all"
            ;;
        *)
            echo -e "${RED}Invalid choice. Exiting.${NC}"
            exit 1
            ;;
    esac

    echo ""
    echo -e "${GREEN}Executing Phase $PHASE...${NC}\n"
    echo -e "${BLUE}This may take several hours. Monitor progress in the dashboard.${NC}\n"

    # Run remediation
    python3 "$REMEDIATION_DIR/master-orchestrator.py" \
        --phase "$PHASE" \
        --project-root "$PROJECT_ROOT" \
        2>&1 | tee "$REMEDIATION_DIR/remediation-output.log"

    echo ""
    echo -e "${GREEN}✓ Remediation complete!${NC}\n"

    # Show final report
    if [ -f "$REPORT_FILE" ]; then
        echo -e "${BLUE}Final Report Summary:${NC}"

        COMPLETED=$(grep -o '"completed": [0-9]*' "$REPORT_FILE" | head -1 | cut -d':' -f2 | tr -d ' ')
        FAILED=$(grep -o '"failed": [0-9]*' "$REPORT_FILE" | head -1 | cut -d':' -f2 | tr -d ' ')

        echo "  Completed: $COMPLETED"
        echo "  Failed: $FAILED"
        echo ""
    fi

    # Next steps
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Review changes: git diff"
    echo "  2. Run tests: npm test"
    echo "  3. Review commits: git log --oneline -n 50"
    echo "  4. Push changes: git push origin main"
    echo ""

else
    echo ""
    echo -e "${BLUE}Remediation cancelled.${NC}"
    echo ""
    echo "To run remediation manually:"
    echo "  cd $PROJECT_ROOT"
    echo "  python3 security-remediation/master-orchestrator.py --phase all"
    echo ""
fi

################################################################################
# Summary
################################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Setup Complete                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Files created:"
echo "  • Backup branch: $BACKUP_BRANCH"
echo "  • Report: $REPORT_FILE"
echo "  • Dashboard: $DASHBOARD_FILE"
echo "  • Log: $REMEDIATION_DIR/remediation-output.log"
echo ""
echo "For more information:"
echo "  • Architecture: $REMEDIATION_DIR/SECURITY_REMEDIATION_ARCHITECTURE.md"
echo "  • Deployment: $REMEDIATION_DIR/DEPLOYMENT_PLAYBOOK.md"
echo "  • README: $REMEDIATION_DIR/README.md"
echo ""
echo -e "${GREEN}✓ All done!${NC}"
echo ""
