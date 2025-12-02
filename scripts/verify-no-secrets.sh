#!/bin/bash
#
# Secret Verification Script
#
# Quick verification that no secrets exist in tracked files.
# Run this before committing sensitive changes.
#
# Usage: ./scripts/verify-no-secrets.sh
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Fleet Secret Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$(git rev-parse --show-toplevel)"

VIOLATIONS=0

# Function to check for patterns
check_pattern() {
    local name="$1"
    local pattern="$2"
    local exclude="$3"

    echo -n "  Checking for ${name}... "

    if [ -z "$exclude" ]; then
        result=$(git grep -E "$pattern" -- '*.py' '*.js' '*.ts' '*.tsx' '*.json' '*.yaml' '*.yml' \
            ':!package-lock.json' ':!node_modules' ':!*.md' 2>/dev/null || true)
    else
        result=$(git grep -E "$pattern" -- '*.py' '*.js' '*.ts' '*.tsx' '*.json' '*.yaml' '*.yml' \
            ':!package-lock.json' ':!node_modules' ':!*.md' 2>/dev/null | grep -vE "$exclude" || true)
    fi

    if [ -z "$result" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo ""
        echo -e "${RED}Found potential secrets:${NC}"
        echo "$result" | head -5
        if [ $(echo "$result" | wc -l) -gt 5 ]; then
            echo "  ... and $(($(echo "$result" | wc -l) - 5)) more"
        fi
        echo ""
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
}

echo "Running secret scans..."
echo ""

# Check for API keys
check_pattern "OpenAI API keys" "sk-proj-[a-zA-Z0-9]{20,}" ""
check_pattern "Anthropic API keys" "sk-ant-[a-zA-Z0-9]{20,}" ""
check_pattern "X.AI API keys" "xai-[a-zA-Z0-9]{20,}" ""
check_pattern "Google API keys" "AIzaSy[a-zA-Z0-9_-]{33}" ""

# Check for tokens
check_pattern "GitHub PATs" "ghp_[a-zA-Z0-9]{36}" ""
check_pattern "Slack tokens" "xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}" ""
check_pattern "AWS access keys" "AKIA[0-9A-Z]{16}" ""

# Check for connection strings
check_pattern "Azure Storage conn strings" "DefaultEndpointsProtocol=.*AccountKey=" ""
check_pattern "Database URLs with passwords" "(postgresql|mysql|mongodb)://[^:]+:[^@]{8,}@" "(PASSWORD|password|test_password|changeme)"

# Check for private keys
check_pattern "Private keys" "-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----" ""

# Check for hardcoded secrets in env files (should only be in .env.example files)
echo -n "  Checking for .env files in git... "
env_files=$(git ls-files | grep -E "^\.env$|^\.env\.[^.]*$" | grep -v "example" | grep -v "template" || true)
if [ -z "$env_files" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo ""
    echo -e "${RED}Found .env files in git (should be in .gitignore):${NC}"
    echo "$env_files"
    echo ""
    VIOLATIONS=$((VIOLATIONS + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}✅ Verification PASSED - No secrets detected${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Verification FAILED - $VIOLATIONS issue(s) found${NC}"
    echo ""
    echo "Please:"
    echo "  1. Remove actual secrets from files"
    echo "  2. Use environment variables: process.env.VARIABLE_NAME"
    echo "  3. Store secrets in Azure Key Vault"
    echo "  4. Add .env files to .gitignore"
    echo ""
    echo "For more information:"
    echo "  • SECRETS_AUDIT_RESULTS.md"
    echo "  • SECRET_MANAGEMENT.md"
    echo ""
    exit 1
fi
