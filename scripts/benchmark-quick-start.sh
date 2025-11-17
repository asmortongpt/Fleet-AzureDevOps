#!/bin/bash

# Quick Start Script for Performance Benchmarks
# Runs a complete benchmark suite and opens the HTML report

set -e

echo "🚀 Fleet Management Performance Benchmark Suite"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${RED}Error: node_modules not found. Please run 'npm install' first.${NC}"
  exit 1
fi

# Create reports directory if it doesn't exist
mkdir -p benchmarks/reports

echo -e "${BLUE}Step 1/4:${NC} Running benchmarks..."
npm run bench || {
  echo -e "${RED}Benchmarks failed!${NC}"
  exit 1
}
echo -e "${GREEN}✓ Benchmarks completed${NC}"
echo ""

echo -e "${BLUE}Step 2/4:${NC} Running regression tests..."
npm run bench:regression || {
  echo -e "${YELLOW}⚠ Regression detected (check report for details)${NC}"
}
echo ""

echo -e "${BLUE}Step 3/4:${NC} Generating HTML report..."
npm run bench:report || {
  echo -e "${RED}Report generation failed!${NC}"
  exit 1
}
echo -e "${GREEN}✓ HTML report generated${NC}"
echo ""

echo -e "${BLUE}Step 4/4:${NC} Checking performance budget..."
npm run bench:budget || {
  echo -e "${YELLOW}⚠ Performance budget exceeded (check report for details)${NC}"
}
echo ""

echo "================================================"
echo -e "${GREEN}✓ Benchmark suite completed!${NC}"
echo ""
echo "📊 Reports generated:"
echo "  - HTML: benchmarks/reports/latest.html"
echo "  - JSON: benchmarks/reports/latest-results.json"
echo "  - Regression: benchmarks/reports/regression-report.json"
echo "  - Budget: benchmarks/reports/budget-report.json"
echo ""

# Try to open HTML report in browser
REPORT_PATH="benchmarks/reports/latest.html"
if [ -f "$REPORT_PATH" ]; then
  echo "🌐 Opening report in browser..."

  # Detect OS and open browser
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$REPORT_PATH"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
      xdg-open "$REPORT_PATH"
    else
      echo "  (Could not auto-open browser. Please open $REPORT_PATH manually)"
    fi
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start "$REPORT_PATH"
  else
    echo "  (Could not auto-open browser. Please open $REPORT_PATH manually)"
  fi
else
  echo -e "${RED}Warning: HTML report not found at $REPORT_PATH${NC}"
fi

echo ""
echo "🎯 Next steps:"
echo "  - Review the HTML report for detailed insights"
echo "  - Check regression report if warnings appeared"
echo "  - Review performance budget violations if any"
echo "  - Read docs/PERFORMANCE_OPTIMIZATION.md for optimization tips"
echo ""
