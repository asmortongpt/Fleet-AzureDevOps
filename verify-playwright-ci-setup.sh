#!/bin/bash

# Playwright CI/CD Setup Verification Script
# This script verifies that all components are properly configured

set -e

echo "🔍 Verifying Playwright CI/CD Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        echo "   Missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        echo "   Missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️${NC} $2"
        echo "   Command not found: $1"
        ((WARNINGS++))
        return 1
    fi
}

# Function to validate YAML
validate_yaml() {
    if python3 -c "import yaml; yaml.safe_load(open('$1'))" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        echo "   Invalid YAML: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check npm package
check_npm_package() {
    if npm list "$1" --depth=0 &> /dev/null; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        echo "   Missing package: $1"
        ((FAILED++))
        return 1
    fi
}

echo "📁 Checking Required Files..."
echo "─────────────────────────────────────────"
check_file ".github/workflows/playwright-production.yml" "Workflow file exists"
check_file "playwright.config.ts" "Playwright config exists"
check_file "package.json" "Package.json exists"
check_file "README.md" "README exists"
check_file ".github/workflows/PLAYWRIGHT_TESTING_GUIDE.md" "Testing guide exists"
check_file ".github/workflows/QUICK_REFERENCE.md" "Quick reference exists"
check_file "PLAYWRIGHT_CI_SETUP_SUMMARY.md" "Setup summary exists"
echo ""

echo "📂 Checking Directories..."
echo "─────────────────────────────────────────"
check_dir ".github/workflows" "GitHub workflows directory"
check_dir "e2e" "E2E test directory"
check_dir "tests" "Tests directory"
echo ""

echo "🔧 Checking Dependencies..."
echo "─────────────────────────────────────────"
check_npm_package "@playwright/test" "Playwright installed"
check_npm_package "@axe-core/playwright" "Axe Core installed"
echo ""

echo "⚙️ Checking Commands..."
echo "─────────────────────────────────────────"
check_command "node" "Node.js installed"
check_command "npm" "npm installed"
check_command "npx" "npx available"
check_command "gh" "GitHub CLI installed (optional)"
echo ""

echo "📝 Validating Configuration..."
echo "─────────────────────────────────────────"
validate_yaml ".github/workflows/playwright-production.yml" "Workflow YAML is valid"

# Check if playwright.config.ts has required settings
if grep -q "testDir.*e2e" playwright.config.ts; then
    echo -e "${GREEN}✅${NC} Playwright config points to e2e directory"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC} Playwright config might not point to e2e directory"
    ((WARNINGS++))
fi

# Check if package.json has test scripts
if grep -q "\"test\":" package.json; then
    echo -e "${GREEN}✅${NC} Test script defined in package.json"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} Test script missing in package.json"
    ((FAILED++))
fi
echo ""

echo "🧪 Checking Test Files..."
echo "─────────────────────────────────────────"
TEST_COUNT=$(find e2e -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | wc -l)
if [ "$TEST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅${NC} Found $TEST_COUNT test files"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} No test files found in e2e directory"
    ((FAILED++))
fi
echo ""

echo "🔗 Checking README Updates..."
echo "─────────────────────────────────────────"
if grep -q "Playwright Production Tests" README.md; then
    echo -e "${GREEN}✅${NC} README has Playwright badge"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC} README might be missing Playwright badge"
    ((WARNINGS++))
fi

if grep -q "## 🧪 Testing" README.md; then
    echo -e "${GREEN}✅${NC} README has Testing section"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC} README might be missing Testing section"
    ((WARNINGS++))
fi
echo ""

echo "🌐 Checking Production Server..."
echo "─────────────────────────────────────────"
if curl -f -s -o /dev/null -w "%{http_code}" "http://68.220.148.2" 2>/dev/null | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅${NC} Production server is accessible (http://68.220.148.2)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC} Production server might not be accessible"
    echo "   URL: http://68.220.148.2"
    echo "   This is normal if server is currently down or behind firewall"
    ((WARNINGS++))
fi
echo ""

echo "📊 Verification Summary"
echo "═════════════════════════════════════════"
echo -e "${GREEN}✅ Passed:${NC}   $PASSED"
echo -e "${RED}❌ Failed:${NC}   $FAILED"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
echo ""

# Final status
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical checks passed!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Push changes to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'feat: Add Playwright CI/CD automation'"
    echo "   git push origin main"
    echo ""
    echo "2. Verify workflow runs at:"
    echo "   https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml"
    echo ""
    echo "3. Run manual test:"
    echo "   gh workflow run playwright-production.yml -f test_suite=smoke"
    echo ""
    echo "📚 Documentation:"
    echo "   - Setup Summary: PLAYWRIGHT_CI_SETUP_SUMMARY.md"
    echo "   - Full Guide: .github/workflows/PLAYWRIGHT_TESTING_GUIDE.md"
    echo "   - Quick Reference: .github/workflows/QUICK_REFERENCE.md"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi
