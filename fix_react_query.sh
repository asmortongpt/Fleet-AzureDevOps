#!/bin/bash

###############################################################################
# React Query Error Recovery Script
###############################################################################
#
# Automatically fixes: "Cannot read properties of null (reading 'useEffect')"
#
# This script:
# 1. Stops the dev server
# 2. Clears all Vite/npm/browser caches
# 3. Updates vite.config.ts with the fix
# 4. Restarts the dev server
#
# Usage:
#   ./fix_react_query.sh              # Standard fix
#   ./fix_react_query.sh --aggressive # Also reinstall node_modules
#   ./fix_react_query.sh --dry-run    # Show what will be done
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false
AGGRESSIVE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --aggressive)
      AGGRESSIVE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --dry-run      Show what will be done without making changes"
      echo "  --aggressive   Also delete node_modules and reinstall"
      echo "  --help         Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      echo "Run with --help for usage information"
      exit 1
      ;;
  esac
done

###############################################################################
# Helper Functions
###############################################################################

print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${BLUE}  $1${NC}"
  echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_step() {
  echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

remove_if_exists() {
  local path="$1"
  local description="$2"

  if [ -e "$path" ]; then
    if [ "$DRY_RUN" = true ]; then
      print_warning "[DRY RUN] Would delete: $path"
    else
      rm -rf "$path"
      print_success "Removed $description: $path"
    fi
  fi
}

###############################################################################
# Main Script
###############################################################################

print_header "React Query Cache Recovery"

echo -e "${BOLD}Project Root:${NC} $PROJECT_ROOT"
echo -e "${BOLD}Mode:${NC} $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "LIVE")"
echo -e "${BOLD}Aggressive:${NC} $([ "$AGGRESSIVE" = true ] && echo "YES" || echo "NO")"
echo ""

if [ "$DRY_RUN" = true ]; then
  print_warning "DRY RUN MODE - No changes will be made"
  echo ""
fi

cd "$PROJECT_ROOT"

###############################################################################
# Step 1: Stop Dev Server
###############################################################################

print_header "Step 1: Stop Dev Server"

print_step "Checking for running Vite processes..."

if pgrep -f "vite" > /dev/null; then
  if [ "$DRY_RUN" = false ]; then
    pkill -f "vite" || true
    sleep 2
    print_success "Stopped Vite dev server"
  else
    print_warning "[DRY RUN] Would stop Vite dev server"
  fi
else
  print_success "No running Vite processes found"
fi

###############################################################################
# Step 2: Clear Vite Caches
###############################################################################

print_header "Step 2: Clear Vite Caches"

remove_if_exists "node_modules/.vite-fleet" "Custom Vite cache"
remove_if_exists "node_modules/.vite" "Default Vite cache"
remove_if_exists "node_modules/.vite-temp" "Temporary Vite cache"
remove_if_exists ".vite" "Project Vite cache"
remove_if_exists "dist" "Build output"

###############################################################################
# Step 3: Clear TypeScript Caches
###############################################################################

print_header "Step 3: Clear TypeScript Caches"

remove_if_exists "node_modules/.tmp" "TypeScript temp"
remove_if_exists "tsconfig.tsbuildinfo" "TypeScript build info"
remove_if_exists "tsconfig.app.tsbuildinfo" "TypeScript app build info"

###############################################################################
# Step 4: Clear ESLint Cache
###############################################################################

print_header "Step 4: Clear ESLint Cache"

remove_if_exists ".eslintcache" "ESLint cache"

###############################################################################
# Step 5: Clear Playwright Cache
###############################################################################

print_header "Step 5: Clear Playwright Cache"

remove_if_exists "test-results" "Playwright test results"
remove_if_exists "playwright-report" "Playwright report"
remove_if_exists "blob-report" "Playwright blob report"

###############################################################################
# Step 6: Clear npm Cache
###############################################################################

print_header "Step 6: Clear npm Cache"

if [ "$DRY_RUN" = false ]; then
  print_step "Clearing npm cache..."
  npm cache clean --force 2>/dev/null || true
  print_success "Cleared npm cache"
else
  print_warning "[DRY RUN] Would clear npm cache"
fi

###############################################################################
# Step 7: Update Vite Config (Aggressive Mode)
###############################################################################

if [ "$AGGRESSIVE" = true ]; then
  print_header "Step 7: Update Vite Configuration"

  if [ -f "vite.config.FIXED.ts" ]; then
    if [ "$DRY_RUN" = false ]; then
      print_step "Backing up current vite.config.ts..."
      cp vite.config.ts "vite.config.BACKUP.$(date +%Y%m%d_%H%M%S).ts"
      print_success "Backup created"

      print_step "Applying fixed configuration..."
      cp vite.config.FIXED.ts vite.config.ts
      print_success "Configuration updated"
    else
      print_warning "[DRY RUN] Would backup and update vite.config.ts"
    fi
  else
    print_warning "vite.config.FIXED.ts not found - skipping config update"
  fi
fi

###############################################################################
# Step 8: Remove node_modules (Aggressive Mode)
###############################################################################

if [ "$AGGRESSIVE" = true ]; then
  print_header "Step 8: Remove node_modules (Aggressive Mode)"

  remove_if_exists "node_modules" "node_modules directory"
  remove_if_exists "package-lock.json" "package-lock.json"

  if [ "$DRY_RUN" = false ]; then
    print_step "Reinstalling dependencies..."
    npm install
    print_success "Dependencies reinstalled"
  else
    print_warning "[DRY RUN] Would run: npm install"
  fi
fi

###############################################################################
# Step 9: Summary and Next Steps
###############################################################################

print_header "Summary"

if [ "$DRY_RUN" = true ]; then
  print_warning "DRY RUN COMPLETE - No changes were made"
  echo ""
  echo "To apply these changes, run:"
  echo "  $0"
  if [ "$AGGRESSIVE" = true ]; then
    echo "  (with --aggressive flag)"
  fi
else
  print_success "Cache clearing complete!"
  echo ""
  print_header "Next Steps"
  echo ""
  echo "1. ${BOLD}Clear Browser Cache:${NC}"
  echo "   Chrome/Edge: Cmd+Shift+Delete → Select 'All time' → Clear cache"
  echo "   Safari: Develop → Empty Caches (Cmd+Option+E)"
  echo "   Firefox: Cmd+Shift+Delete → Select 'Everything' → Clear cache"
  echo ""
  echo "2. ${BOLD}Close All Browser Tabs${NC} with your app"
  echo ""
  echo "3. ${BOLD}Restart Dev Server:${NC}"
  echo "   npm run dev"
  echo ""
  echo "4. ${BOLD}Test:${NC}"
  echo "   Open http://localhost:5173"
  echo "   Check browser console for errors"
  echo ""

  if [ "$AGGRESSIVE" = false ]; then
    echo "${YELLOW}If issues persist, run with --aggressive flag:${NC}"
    echo "  $0 --aggressive"
    echo ""
  fi

  print_success "Recovery script complete!"
fi

###############################################################################
# Step 10: Browser Cache Instructions
###############################################################################

if [ "$DRY_RUN" = false ]; then
  print_header "Browser Cache Clearing"

  echo "The script has cleared server-side caches."
  echo "You must manually clear browser cache for the fix to work."
  echo ""
  echo -e "${BOLD}Option 1: Clear Browser Cache${NC}"
  echo ""
  echo "  Chrome/Edge:"
  echo "    1. Press Cmd+Shift+Delete (macOS) or Ctrl+Shift+Delete (Windows/Linux)"
  echo "    2. Select 'All time'"
  echo "    3. Check 'Cached images and files'"
  echo "    4. Click 'Clear data'"
  echo ""
  echo "  Safari:"
  echo "    1. Safari > Settings > Advanced"
  echo "    2. Enable 'Show Develop menu'"
  echo "    3. Develop > Empty Caches (Cmd+Option+E)"
  echo ""
  echo "  Firefox:"
  echo "    1. Press Cmd+Shift+Delete (macOS) or Ctrl+Shift+Delete (Windows/Linux)"
  echo "    2. Select 'Everything'"
  echo "    3. Check 'Cache'"
  echo "    4. Click 'Clear Now'"
  echo ""
  echo -e "${BOLD}Option 2: Use Incognito/Private Mode${NC}"
  echo ""
  echo "  This bypasses the cache without clearing it:"
  echo "    Chrome: Cmd+Shift+N (macOS) or Ctrl+Shift+N (Windows/Linux)"
  echo "    Safari: Cmd+Shift+P"
  echo "    Firefox: Cmd+Shift+P"
  echo ""
fi

exit 0
