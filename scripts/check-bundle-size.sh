#!/bin/bash

# ============================================================================
# Bundle Size Check Script
# Analyzes bundle size and compares against performance budget
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Performance budget thresholds (in KB)
INITIAL_BASELINE=500
INITIAL_WARNING=750
INITIAL_ERROR=1000
TOTAL_BASELINE=2500
TOTAL_WARNING=3500
TOTAL_ERROR=5000

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Bundle Size Analysis - Fleet Management System${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo -e "${RED}✗ Error: dist directory not found${NC}"
  echo -e "  Run 'npm run build' first"
  exit 1
fi

# Calculate bundle sizes
echo -e "${BLUE}📊 Calculating bundle sizes...${NC}"
echo ""

# Get main entry point size (uncompressed)
MAIN_SIZE=$(find dist/assets/js -name "main-*.js" -exec du -k {} \; | cut -f1 | head -1)
MAIN_SIZE_KB=$((MAIN_SIZE))

# Get total bundle size (uncompressed)
TOTAL_SIZE=$(du -sk dist/assets/js | cut -f1)
TOTAL_SIZE_KB=$((TOTAL_SIZE))

# Try to get gzipped sizes if gzip is available
if command -v gzip &> /dev/null; then
  # Create temporary directory for gzip analysis
  TEMP_DIR=$(mktemp -d)
  trap "rm -rf $TEMP_DIR" EXIT

  # Copy and gzip main file
  MAIN_FILE=$(find dist/assets/js -name "main-*.js" | head -1)
  if [ -f "$MAIN_FILE" ]; then
    cp "$MAIN_FILE" "$TEMP_DIR/main.js"
    gzip -9 "$TEMP_DIR/main.js"
    MAIN_GZIP_SIZE=$(du -k "$TEMP_DIR/main.js.gz" | cut -f1)
  else
    MAIN_GZIP_SIZE=0
  fi

  # Calculate total gzipped size
  TOTAL_GZIP_SIZE=0
  for file in dist/assets/js/*.js; do
    [ -f "$file" ] || continue
    cp "$file" "$TEMP_DIR/$(basename "$file")"
    gzip -9 "$TEMP_DIR/$(basename "$file")"
    SIZE=$(du -k "$TEMP_DIR/$(basename "$file").gz" | cut -f1)
    TOTAL_GZIP_SIZE=$((TOTAL_GZIP_SIZE + SIZE))
  done
else
  MAIN_GZIP_SIZE=0
  TOTAL_GZIP_SIZE=0
fi

# Display results
echo "┌─────────────────────────────────────────────────────────┐"
echo "│                    BUNDLE SIZES                         │"
echo "├─────────────────────────────────────────────────────────┤"
printf "│ Initial Bundle (main):                                  │\n"
printf "│   Uncompressed: %6d KB                                │\n" $MAIN_SIZE_KB
if [ $MAIN_GZIP_SIZE -gt 0 ]; then
  printf "│   Gzipped:      %6d KB                                │\n" $MAIN_GZIP_SIZE
fi
echo "├─────────────────────────────────────────────────────────┤"
printf "│ Total Bundle:                                           │\n"
printf "│   Uncompressed: %6d KB                                │\n" $TOTAL_SIZE_KB
if [ $TOTAL_GZIP_SIZE -gt 0 ]; then
  printf "│   Gzipped:      %6d KB                                │\n" $TOTAL_GZIP_SIZE
fi
echo "└─────────────────────────────────────────────────────────┘"
echo ""

# Check against budgets
echo -e "${BLUE}🎯 Performance Budget Check:${NC}"
echo ""

# Use gzipped size if available, otherwise uncompressed
CHECK_MAIN_SIZE=$MAIN_SIZE_KB
if [ $MAIN_GZIP_SIZE -gt 0 ]; then
  CHECK_MAIN_SIZE=$MAIN_GZIP_SIZE
fi

# Check initial bundle
if [ $CHECK_MAIN_SIZE -le $INITIAL_BASELINE ]; then
  echo -e "  ${GREEN}✓${NC} Initial bundle: ${GREEN}EXCELLENT${NC} (${CHECK_MAIN_SIZE}KB ≤ ${INITIAL_BASELINE}KB baseline)"
elif [ $CHECK_MAIN_SIZE -le $INITIAL_WARNING ]; then
  echo -e "  ${GREEN}✓${NC} Initial bundle: ${GREEN}GOOD${NC} (${CHECK_MAIN_SIZE}KB ≤ ${INITIAL_WARNING}KB warning)"
elif [ $CHECK_MAIN_SIZE -le $INITIAL_ERROR ]; then
  echo -e "  ${YELLOW}⚠${NC} Initial bundle: ${YELLOW}WARNING${NC} (${CHECK_MAIN_SIZE}KB ≤ ${INITIAL_ERROR}KB error threshold)"
else
  echo -e "  ${RED}✗${NC} Initial bundle: ${RED}ERROR${NC} (${CHECK_MAIN_SIZE}KB > ${INITIAL_ERROR}KB maximum)"
fi

# Check total bundle
CHECK_TOTAL_SIZE=$TOTAL_SIZE_KB
if [ $TOTAL_GZIP_SIZE -gt 0 ]; then
  CHECK_TOTAL_SIZE=$TOTAL_GZIP_SIZE
fi

if [ $CHECK_TOTAL_SIZE -le $TOTAL_BASELINE ]; then
  echo -e "  ${GREEN}✓${NC} Total bundle:   ${GREEN}EXCELLENT${NC} (${CHECK_TOTAL_SIZE}KB ≤ ${TOTAL_BASELINE}KB baseline)"
elif [ $CHECK_TOTAL_SIZE -le $TOTAL_WARNING ]; then
  echo -e "  ${GREEN}✓${NC} Total bundle:   ${GREEN}GOOD${NC} (${CHECK_TOTAL_SIZE}KB ≤ ${TOTAL_WARNING}KB warning)"
elif [ $CHECK_TOTAL_SIZE -le $TOTAL_ERROR ]; then
  echo -e "  ${YELLOW}⚠${NC} Total bundle:   ${YELLOW}WARNING${NC} (${CHECK_TOTAL_SIZE}KB ≤ ${TOTAL_ERROR}KB error threshold)"
else
  echo -e "  ${RED}✗${NC} Total bundle:   ${RED}ERROR${NC} (${CHECK_TOTAL_SIZE}KB > ${TOTAL_ERROR}KB maximum)"
fi

echo ""

# List largest chunks
echo -e "${BLUE}📦 Largest Chunks (Top 5):${NC}"
echo ""
echo "┌────────────────────────────────────────────┬──────────┐"
echo "│ Chunk                                      │ Size (KB)│"
echo "├────────────────────────────────────────────┼──────────┤"
find dist/assets/js -name "*.js" -exec du -k {} \; | \
  sort -rn | \
  head -5 | \
  while read -r size file; do
    filename=$(basename "$file" | cut -c1-42)
    printf "│ %-42s │ %8d │\n" "$filename" "$size"
  done
echo "└────────────────────────────────────────────┴──────────┘"
echo ""

# Recommendations
echo -e "${BLUE}💡 Recommendations:${NC}"
echo ""

if [ $CHECK_MAIN_SIZE -gt $INITIAL_WARNING ]; then
  echo "  • Consider lazy loading more components"
  echo "  • Check for unnecessary dependencies in main bundle"
  echo "  • Review vite.config.ts manual chunks configuration"
fi

if [ $CHECK_TOTAL_SIZE -gt $TOTAL_WARNING ]; then
  echo "  • Audit all dependencies for size"
  echo "  • Consider using lighter alternatives"
  echo "  • Enable tree shaking for all modules"
fi

echo "  • View detailed analysis: open dist/stats.html"
echo "  • Run 'npm run build:analyze' for interactive treemap"
echo ""

# Exit code based on budget
if [ $CHECK_MAIN_SIZE -gt $INITIAL_ERROR ] || [ $CHECK_TOTAL_SIZE -gt $TOTAL_ERROR ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}   Bundle size exceeds error threshold!${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 1
elif [ $CHECK_MAIN_SIZE -gt $INITIAL_WARNING ] || [ $CHECK_TOTAL_SIZE -gt $TOTAL_WARNING ]; then
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}   Bundle size exceeds warning threshold${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 0
else
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}   All bundle size checks passed! ✓${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 0
fi
