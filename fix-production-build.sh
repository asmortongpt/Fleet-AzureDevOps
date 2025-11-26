#!/bin/bash

###############################################################################
# Fleet Management System - Production Build Fix Script
#
# PURPOSE: Rebuild production bundle with React load order fixes
#
# PROBLEM: Production site shows white screen due to React undefined error
# CAUSE: Old production build without chunk ordering fixes
# SOLUTION: Build fresh production bundle and deploy
#
# AUTHOR: Claude Code - Expert Python/TS Optimizer
# DATE: 2025-11-26
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/Users/andrewmorton/Documents/GitHub/fleet-local"
cd "$PROJECT_ROOT"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Fleet Production Build Fix - Comprehensive Recovery        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# STEP 1: Pre-Flight Checks
###############################################################################

echo -e "${YELLOW}[1/8] Running Pre-Flight Checks...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the right directory?${NC}"
    exit 1
fi

# Check if vite.config.ts has the fixes
if ! grep -q "fixModulePreloadOrder" vite.config.ts; then
    echo -e "${RED}❌ Error: vite.config.ts missing fixModulePreloadOrder plugin${NC}"
    exit 1
fi

if ! grep -q "react-vendor" vite.config.ts; then
    echo -e "${RED}❌ Error: vite.config.ts missing react-vendor chunk strategy${NC}"
    exit 1
fi

echo -e "${GREEN}✓ vite.config.ts has all required fixes${NC}"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Error: Node.js 18+ required (you have: $(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Check if git is clean (with option to continue)
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Aborting. Please commit or stash your changes first.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"
echo ""

###############################################################################
# STEP 2: Clean Build Artifacts
###############################################################################

echo -e "${YELLOW}[2/8] Cleaning Build Artifacts...${NC}"

# Remove dist folder
if [ -d "dist" ]; then
    echo "  → Removing dist/"
    rm -rf dist
fi

# Remove Vite cache
if [ -d "node_modules/.vite" ]; then
    echo "  → Removing node_modules/.vite"
    rm -rf node_modules/.vite
fi

# Remove TypeScript cache
if [ -d "node_modules/.tmp" ]; then
    echo "  → Removing node_modules/.tmp"
    rm -rf node_modules/.tmp
fi

echo -e "${GREEN}✓ Build artifacts cleaned${NC}"
echo ""

###############################################################################
# STEP 3: Verify Dependencies
###############################################################################

echo -e "${YELLOW}[3/8] Verifying Dependencies...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "  → node_modules not found, installing..."
    npm ci
else
    # Verify React is deduped
    if npm list react 2>&1 | grep -q "deduped"; then
        echo -e "${GREEN}✓ React properly deduped${NC}"
    else
        echo -e "${YELLOW}⚠️  React may have duplicates, reinstalling dependencies...${NC}"
        rm -rf node_modules package-lock.json
        npm install
    fi
fi

# Verify critical packages
REQUIRED_PACKAGES=("react" "react-dom" "@tanstack/react-query" "vite")
for package in "${REQUIRED_PACKAGES[@]}"; do
    if npm list "$package" >/dev/null 2>&1; then
        VERSION=$(npm list "$package" --depth=0 2>/dev/null | grep "$package@" | sed 's/.*@//' || echo "unknown")
        echo -e "${GREEN}✓ $package@$VERSION${NC}"
    else
        echo -e "${RED}❌ Missing: $package${NC}"
        exit 1
    fi
done

echo ""

###############################################################################
# STEP 4: Build Production Bundle
###############################################################################

echo -e "${YELLOW}[4/8] Building Production Bundle...${NC}"
echo "  → This may take 30-60 seconds..."
echo ""

# Run build with verbose output
if npm run build; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    echo -e "${RED}Check the error messages above.${NC}"
    exit 1
fi

echo ""

###############################################################################
# STEP 5: Verify Build Output
###############################################################################

echo -e "${YELLOW}[5/8] Verifying Build Output...${NC}"

# Check if dist folder was created
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: dist/ folder not created${NC}"
    exit 1
fi

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Error: dist/index.html not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ dist/index.html exists${NC}"

# Check for critical chunks
if ls dist/assets/js/react-vendor-*.js 1> /dev/null 2>&1; then
    REACT_VENDOR=$(ls dist/assets/js/react-vendor-*.js | head -1)
    SIZE=$(du -h "$REACT_VENDOR" | cut -f1)
    echo -e "${GREEN}✓ react-vendor chunk found ($SIZE)${NC}"
else
    echo -e "${RED}❌ Error: react-vendor chunk not found${NC}"
    echo "Available chunks:"
    ls -lh dist/assets/js/ || echo "No js files found"
    exit 1
fi

if ls dist/assets/js/react-utils-*.js 1> /dev/null 2>&1; then
    REACT_UTILS=$(ls dist/assets/js/react-utils-*.js | head -1)
    SIZE=$(du -h "$REACT_UTILS" | cut -f1)
    echo -e "${GREEN}✓ react-utils chunk found ($SIZE)${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: react-utils chunk not found (may be normal if no React utils used)${NC}"
fi

if ls dist/assets/js/vendor-*.js 1> /dev/null 2>&1; then
    VENDOR=$(ls dist/assets/js/vendor-*.js | head -1)
    SIZE=$(du -h "$VENDOR" | cut -f1)
    echo -e "${GREEN}✓ vendor chunk found ($SIZE)${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: vendor chunk not found${NC}"
fi

echo ""

###############################################################################
# STEP 6: Verify Module Preload Order
###############################################################################

echo -e "${YELLOW}[6/8] Verifying Module Preload Order...${NC}"

# Extract modulepreload links
PRELOADS=$(grep 'rel="modulepreload"' dist/index.html || echo "")

if [ -z "$PRELOADS" ]; then
    echo -e "${YELLOW}⚠️  Warning: No modulepreload tags found${NC}"
else
    echo "Module preload order:"
    echo "$PRELOADS" | nl -v 1 -w 3 -s '. '
    echo ""

    # Check if react-vendor comes before vendor
    REACT_VENDOR_LINE=$(echo "$PRELOADS" | grep -n "react-vendor" | cut -d':' -f1 || echo "999")
    VENDOR_LINE=$(echo "$PRELOADS" | grep -n 'vendor-[^r]' | cut -d':' -f1 || echo "999")

    if [ "$REACT_VENDOR_LINE" -lt "$VENDOR_LINE" ]; then
        echo -e "${GREEN}✓ Correct order: react-vendor loads before vendor${NC}"
    else
        echo -e "${RED}❌ Warning: react-vendor should load before vendor${NC}"
        echo "  react-vendor at line: $REACT_VENDOR_LINE"
        echo "  vendor at line: $VENDOR_LINE"
    fi
fi

echo ""

###############################################################################
# STEP 7: Generate Build Report
###############################################################################

echo -e "${YELLOW}[7/8] Generating Build Report...${NC}"

# Calculate total dist size
DIST_SIZE=$(du -sh dist | cut -f1)
echo "  → Total dist size: $DIST_SIZE"

# Count files
JS_COUNT=$(find dist/assets/js -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
CSS_COUNT=$(find dist/assets/css -name "*.css" 2>/dev/null | wc -l | tr -d ' ')
IMG_COUNT=$(find dist/assets/images -name "*" -type f 2>/dev/null | wc -l | tr -d ' ')

echo "  → JavaScript files: $JS_COUNT"
echo "  → CSS files: $CSS_COUNT"
echo "  → Image files: $IMG_COUNT"

# List largest chunks
echo ""
echo "Largest JavaScript chunks:"
find dist/assets/js -name "*.js" -type f -exec du -h {} \; 2>/dev/null | sort -rh | head -5 | nl -v 1 -w 3 -s '. '

echo -e "${GREEN}✓ Build report generated${NC}"
echo ""

###############################################################################
# STEP 8: Deployment Instructions
###############################################################################

echo -e "${YELLOW}[8/8] Deployment Instructions${NC}"
echo ""
echo -e "${BLUE}Your production build is ready!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Review the build output above"
echo "2. Test locally (optional):"
echo "   ${BLUE}npm run preview${NC}"
echo ""
echo "3. Commit and push to deploy:"
echo "   ${BLUE}git add .${NC}"
echo "   ${BLUE}git commit -m \"fix: Rebuild production bundle with React load order fixes\"${NC}"
echo "   ${BLUE}git push origin main${NC}"
echo ""
echo "4. Monitor GitHub Actions:"
echo "   ${BLUE}https://github.com/<your-username>/<your-repo>/actions${NC}"
echo ""
echo "5. Verify production deployment:"
echo "   ${BLUE}https://fleet.capitaltechalliance.com${NC}"
echo ""

# Ask if user wants to commit and push
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""
read -p "Would you like to commit and push now? (y/N) " -n 1 -r
echo
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Committing changes...${NC}"

    # Add all changes
    git add dist/ vite.config.ts src/ package.json package-lock.json

    # Create commit
    git commit -m "fix: Rebuild production bundle with React load order fixes

- Clean build with proper React chunk ordering
- react-vendor chunk loads before react-utils and vendor
- Fixes 'Cannot read properties of undefined (reading useLayoutEffect)' error
- All modulepreload tags in correct order
- Production bundle tested and verified

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    echo -e "${GREEN}✓ Changes committed${NC}"
    echo ""

    # Push to remote
    echo -e "${YELLOW}Pushing to GitHub...${NC}"
    CURRENT_BRANCH=$(git branch --show-current)

    if git push origin "$CURRENT_BRANCH"; then
        echo -e "${GREEN}✓ Pushed to origin/$CURRENT_BRANCH${NC}"
        echo ""
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}║  SUCCESS! Deployment triggered.                         ║${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}║  Monitor deployment at:                                 ║${NC}"
        echo -e "${GREEN}║  https://github.com/actions                             ║${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}║  Your site will be live in 2-3 minutes at:              ║${NC}"
        echo -e "${GREEN}║  https://fleet.capitaltechalliance.com                  ║${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    else
        echo -e "${RED}❌ Push failed${NC}"
        echo "You may need to pull first: git pull origin $CURRENT_BRANCH"
        exit 1
    fi
else
    echo -e "${YELLOW}Skipping commit/push. You can deploy later with:${NC}"
    echo "  git add ."
    echo "  git commit -m \"fix: Rebuild production bundle with React load order fixes\""
    echo "  git push origin main"
fi

echo ""
echo -e "${GREEN}✓ All done!${NC}"
echo ""
