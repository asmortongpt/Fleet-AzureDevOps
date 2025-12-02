#!/bin/bash
#
# Git-Secrets Setup Script for Fleet Management System
#
# This script installs and configures git-secrets to prevent committing secrets.
# It adds patterns for common secret formats and enables pre-commit scanning.
#
# Usage:
#   cd /Users/andrewmorton/Documents/GitHub/Fleet
#   chmod +x scripts/setup-git-secrets.sh
#   ./scripts/setup-git-secrets.sh
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Git-Secrets Setup for Fleet Management System${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if git-secrets is installed
if ! command -v git-secrets &> /dev/null; then
    echo -e "${YELLOW}⚠️  git-secrets is not installed${NC}"
    echo ""
    echo "Installing git-secrets..."
    echo ""

    # Try to install via Homebrew on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            echo "Installing via Homebrew..."
            brew install git-secrets
        else
            echo -e "${YELLOW}Homebrew not found. Installing manually...${NC}"
            # Manual installation
            TEMP_DIR=$(mktemp -d)
            cd "$TEMP_DIR"
            git clone https://github.com/awslabs/git-secrets.git
            cd git-secrets
            sudo make install
            cd -
            rm -rf "$TEMP_DIR"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Installing manually for Linux..."
        TEMP_DIR=$(mktemp -d)
        cd "$TEMP_DIR"
        git clone https://github.com/awslabs/git-secrets.git
        cd git-secrets
        sudo make install
        cd -
        rm -rf "$TEMP_DIR"
    else
        echo -e "${RED}❌ Unsupported OS: $OSTYPE${NC}"
        echo "Please install git-secrets manually:"
        echo "  https://github.com/awslabs/git-secrets"
        exit 1
    fi

    echo -e "${GREEN}✅ git-secrets installed${NC}"
else
    echo -e "${GREEN}✅ git-secrets is already installed${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Initialize git-secrets for this repository
echo "Configuring git-secrets for Fleet repository..."

cd "$(git rev-parse --show-toplevel)"

# Install hooks
echo "  Installing git hooks..."
git secrets --install -f

# Add AWS patterns (built-in)
echo "  Adding AWS secret patterns..."
git secrets --register-aws

# Add custom patterns for Fleet
echo "  Adding Fleet-specific patterns..."

# OpenAI API Keys
git secrets --add 'sk-[a-zA-Z0-9]{20,}'

# Anthropic/Claude API Keys
git secrets --add 'sk-ant-api03-[a-zA-Z0-9_-]{95}'

# X.AI/Grok API Keys
git secrets --add 'xai-[a-zA-Z0-9]{20,}'

# Google API Keys
git secrets --add 'AIzaSy[a-zA-Z0-9_-]{33}'

# GitHub PATs
git secrets --add 'ghp_[a-zA-Z0-9]{36}'
git secrets --add 'github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}'

# Slack Tokens
git secrets --add 'xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}'

# Azure Storage Connection Strings
git secrets --add 'DefaultEndpointsProtocol=.*AccountKey=[a-zA-Z0-9+/=]{88}'

# Private Keys
git secrets --add -- '-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----'

# Stripe Keys
git secrets --add 'sk_live_[0-9a-zA-Z]{24,}'
git secrets --add 'pk_live_[0-9a-zA-Z]{24,}'

# SendGrid API Keys
git secrets --add 'SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}'

# Database URLs with passwords (excluding templates)
git secrets --add '(postgresql|mysql|mongodb)://[^:]+:[^@]{8,}@'

# Add allowed patterns (for documentation)
echo "  Adding allowed patterns for documentation..."
git secrets --add -a 'sk-proj-YOUR'
git secrets --add -a 'sk-ant-YOUR'
git secrets --add -a 'your_actual_'
git secrets --add -a 'YOUR_KEY'
git secrets --add -a 'example.com'
git secrets --add -a 'placeholder'
git secrets --add -a '<PASSWORD>'
git secrets --add -a 'your_password'
git secrets --add -a 'changeme'

echo -e "${GREEN}✅ Patterns configured${NC}"
echo ""

# Scan current repository for secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Running initial scan of repository..."
echo ""

if git secrets --scan -r .; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ No secrets detected in repository${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  Secrets detected in repository!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please review the output above and:"
    echo "  1. Remove any actual secrets from files"
    echo "  2. Add false positives to allowed patterns using:"
    echo "     git secrets --add -a 'pattern-to-allow'"
    echo "  3. Re-run this script to verify"
    echo ""
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Git-secrets setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  • All commits will now be scanned for secrets"
echo "  • To scan manually: git secrets --scan"
echo "  • To scan history: git secrets --scan-history"
echo "  • To bypass (NOT RECOMMENDED): git commit --no-verify"
echo ""
echo "Documentation:"
echo "  • See SECRETS_AUDIT_RESULTS.md for full audit results"
echo "  • See SECRET_MANAGEMENT.md for Key Vault usage"
echo "  • Pattern file: .git-secrets-patterns"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
