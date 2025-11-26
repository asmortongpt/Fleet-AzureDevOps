#!/bin/bash

###############################################################################
# Quick Build Configuration Verification
# Checks if all React load order fixes are in place
###############################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Fleet Production Build - Configuration Verification"
echo "===================================================="
echo ""

ISSUES=0

# Check vite.config.ts
echo "Checking vite.config.ts..."

if ! grep -q "fixModulePreloadOrder" vite.config.ts; then
    echo -e "${RED}✗ Missing: fixModulePreloadOrder plugin${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✓ fixModulePreloadOrder plugin present${NC}"
fi

if ! grep -q "react-vendor" vite.config.ts; then
    echo -e "${RED}✗ Missing: react-vendor chunk strategy${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✓ react-vendor chunk strategy present${NC}"
fi

if ! grep -q "react-utils" vite.config.ts; then
    echo -e "${RED}✗ Missing: react-utils chunk strategy${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✓ react-utils chunk strategy present${NC}"
fi

if ! grep -q "dedupe.*react" vite.config.ts; then
    echo -e "${RED}✗ Missing: React dedupe configuration${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✓ React dedupe configured${NC}"
fi

if ! grep -q "'react'.*resolve.*node_modules/react" vite.config.ts; then
    echo -e "${RED}✗ Missing: React alias configuration${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✓ React alias configured${NC}"
fi

echo ""
echo "Checking main.tsx..."

if ! grep -q "^import React from 'react'" src/main.tsx; then
    echo -e "${RED}✗ Missing: React import at top of main.tsx${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✓ React imported first in main.tsx${NC}"
fi

echo ""
echo "Checking QueryProvider.tsx..."

if ! grep -q "^import React" src/components/providers/QueryProvider.tsx; then
    echo -e "${RED}✗ Missing: React import in QueryProvider${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✓ React imported in QueryProvider${NC}"
fi

echo ""
echo "Checking package.json versions..."

REACT_VERSION=$(node -p "require('./package.json').dependencies.react" 2>/dev/null)
QUERY_VERSION=$(node -p "require('./package.json').dependencies['@tanstack/react-query']" 2>/dev/null)

echo "  React: $REACT_VERSION"
echo "  React Query: $QUERY_VERSION"

echo ""
echo "===================================================="

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All configuration checks passed!${NC}"
    echo ""
    echo "Ready to build production bundle:"
    echo "  ./fix-production-build.sh"
    exit 0
else
    echo -e "${RED}✗ Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Your configuration is missing critical fixes."
    echo "Please review PRODUCTION_FIX_ANALYSIS.md for details."
    exit 1
fi
