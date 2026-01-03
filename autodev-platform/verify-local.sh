#!/bin/bash

##############################################################################
# Local Verification Script
# Verifies platform structure and configuration before Azure deployment
##############################################################################

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        FAILED=$((FAILED + 1))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        FAILED=$((FAILED + 1))
    fi
}

echo "AutoDev Platform - Local Verification"
echo "======================================"
echo ""

echo "Core Infrastructure:"
check_file "docker-compose.yml"
check_file "Makefile"
check_file "README.md"
check_file ".env.example"
check_file "deploy-to-azure-vm.sh"
echo ""

echo "Database Setup:"
check_file "scripts/init-db.sql"
echo ""

echo "MCP Servers:"
check_dir "mcp/repo_tools"
check_file "mcp/repo_tools/server.py"
check_file "mcp/repo_tools/Dockerfile"
check_file "mcp/repo_tools/requirements.txt"
echo ""

check_dir "mcp/test_tools"
check_file "mcp/test_tools/server.py"
echo ""

check_dir "mcp/browser_tools"
check_dir "mcp/security_tools"
check_dir "mcp/devops_tools"
echo ""

echo "Orchestrator:"
check_dir "orchestrator"
echo ""

echo "Scripts:"
check_dir "scripts"
check_dir "scripts/gates"
echo ""

echo ""
echo "Verification Summary:"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC} Ready for deployment."
    exit 0
else
    echo -e "${RED}Some checks failed.${NC} Please fix before deploying."
    exit 1
fi
