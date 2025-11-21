#!/bin/bash
#
# Fleet API - Pre-Commit Hook Installation Script
# This script installs gitleaks and sets up pre-commit secret scanning
#
# Usage: ./setup-pre-commit-hook.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fleet API - Pre-Commit Hook Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a Git repository${NC}"
    echo "Please run this script from the repository root"
    exit 1
fi

# ============================================================================
# Step 1: Install gitleaks
# ============================================================================

echo -e "${YELLOW}Step 1: Installing gitleaks...${NC}"

if command -v gitleaks &> /dev/null; then
    INSTALLED_VERSION=$(gitleaks version 2>&1 | head -n 1)
    echo -e "${GREEN}✓ gitleaks already installed: ${INSTALLED_VERSION}${NC}"
else
    echo "gitleaks not found. Installing..."

    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Using Homebrew to install gitleaks..."
            brew install gitleaks
        else
            echo -e "${YELLOW}Homebrew not found. Installing manually...${NC}"
            curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_$(uname -s)_x64.tar.gz | tar -xz
            sudo mv gitleaks /usr/local/bin/
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Installing gitleaks for Linux..."
        curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_$(uname -s)_x64.tar.gz | tar -xz
        sudo mv gitleaks /usr/local/bin/
    else
        echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
        echo "Please install gitleaks manually from: https://github.com/gitleaks/gitleaks/releases"
        exit 1
    fi

    echo -e "${GREEN}✓ gitleaks installed successfully${NC}"
fi

echo ""

# ============================================================================
# Step 2: Verify .gitleaks.toml configuration
# ============================================================================

echo -e "${YELLOW}Step 2: Verifying gitleaks configuration...${NC}"

if [ ! -f ".gitleaks.toml" ]; then
    echo -e "${RED}Error: .gitleaks.toml not found${NC}"
    echo "Please ensure .gitleaks.toml exists in the repository root"
    exit 1
fi

echo -e "${GREEN}✓ .gitleaks.toml configuration found${NC}"
echo ""

# ============================================================================
# Step 3: Create pre-commit hook
# ============================================================================

echo -e "${YELLOW}Step 3: Creating pre-commit hook...${NC}"

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create the pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
#
# Fleet API - Pre-Commit Secret Scanning Hook
# Prevents commits with exposed secrets
#

echo "🔒 Running secret scan with gitleaks..."

# Run gitleaks on staged files
if ! gitleaks protect --staged --verbose --redact; then
    echo ""
    echo "❌ COMMIT REJECTED - Secrets detected!"
    echo ""
    echo "⚠️  You attempted to commit files containing secrets or API keys."
    echo ""
    echo "What to do:"
    echo "1. Remove the secret from the file"
    echo "2. Replace with environment variable reference: \${SECRET_NAME}"
    echo "3. Add actual secret to .env file (which is in .gitignore)"
    echo "4. Stage the cleaned file: git add <file>"
    echo "5. Try committing again"
    echo ""
    echo "If this is a false positive:"
    echo "1. Review the .gitleaks.toml allowlist"
    echo "2. Add the file path or regex pattern to allowlist"
    echo "3. Use caution - only allowlist if you're certain it's safe"
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo "✅ No secrets detected - commit allowed"
echo ""
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo -e "${GREEN}✓ Pre-commit hook installed${NC}"
echo ""

# ============================================================================
# Step 4: Test the hook
# ============================================================================

echo -e "${YELLOW}Step 4: Testing gitleaks configuration...${NC}"

if gitleaks detect --source . --verbose --no-git; then
    echo -e "${GREEN}✅ No secrets detected in current repository${NC}"
else
    echo -e "${RED}⚠️  WARNING: Secrets detected in repository!${NC}"
    echo ""
    echo "Action required:"
    echo "1. Review the gitleaks output above"
    echo "2. Remove or rotate any exposed secrets"
    echo "3. See SECURITY_AUDIT_SECRET_ROTATION_REPORT.md for details"
    echo ""
fi

echo ""

# ============================================================================
# Step 5: Additional security recommendations
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Installation Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ gitleaks installed and configured${NC}"
echo -e "${GREEN}✓ Pre-commit hook activated${NC}"
echo ""
echo "Additional security recommendations:"
echo ""
echo "1. ${YELLOW}Review existing secrets:${NC}"
echo "   Run: gitleaks detect --source . --report-path gitleaks-report.json"
echo ""
echo "2. ${YELLOW}Scan Git history for leaked secrets:${NC}"
echo "   Run: gitleaks detect --source . --log-opts=\"--all\" --verbose"
echo ""
echo "3. ${YELLOW}Add secrets to Azure Key Vault:${NC}"
echo "   See: SECURITY_AUDIT_SECRET_ROTATION_REPORT.md"
echo ""
echo "4. ${YELLOW}Clean Git history if secrets found:${NC}"
echo "   Use: git-filter-repo or BFG Repo-Cleaner"
echo "   See: SECURITY_AUDIT_SECRET_ROTATION_REPORT.md Section 8"
echo ""
echo "5. ${YELLOW}Verify .env is ignored:${NC}"
echo "   Run: git status (should not show .env files)"
echo ""
echo "6. ${YELLOW}Test the pre-commit hook:${NC}"
echo "   Try: echo 'JWT_SECRET=test123' > test.txt && git add test.txt && git commit -m 'test'"
echo "   (It should be blocked)"
echo ""
echo -e "${BLUE}========================================${NC}"
echo ""
