#!/bin/bash
#
# Agent 1: Comprehensive Feature Testing Runner
# Tests ALL application features on production URLs
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==========================================="
echo "AGENT 1: Comprehensive Feature Testing"
echo "==========================================="
echo -e "Testing ALL application features"
echo -e "Production URLs:"
echo -e "  - http://20.161.96.87"
echo -e "  - https://fleet.capitaltechalliance.com"
echo -e "===========================================${NC}"

# Production URLs to test
PRODUCTION_URLS=(
  "http://20.161.96.87"
  "https://fleet.capitaltechalliance.com"
)

# Test each production URL
for url in "${PRODUCTION_URLS[@]}"; do
  echo -e "\n${BLUE}Testing: $url${NC}"

  # Check if URL is accessible
  if curl -s --head --max-time 5 "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ URL is accessible${NC}"

    # Run tests
    cd "$PROJECT_DIR"

    echo -e "${YELLOW}Running comprehensive tests...${NC}"
    TEST_URL="$url" npx playwright test tests/e2e/agent1-comprehensive-testing.spec.ts \
      --project=chromium \
      --reporter=list,json,html \
      --output=test-results/agent1 \
      2>&1 || {
        echo -e "${RED}❌ Tests failed for $url${NC}"
      }

  else
    echo -e "${RED}❌ URL not accessible${NC}"
  fi
done

# Find latest report
LATEST_REPORT=$(find "$PROJECT_DIR/agent1-test-evidence" -name "AGENT1_COMPREHENSIVE_REPORT.json" -type f 2>/dev/null | sort -r | head -1)

if [[ -f "$LATEST_REPORT" ]]; then
  echo -e "\n${GREEN}==========================================="
  echo "📊 Test Results Summary"
  echo -e "===========================================${NC}"

  # Extract key metrics
  TOTAL_FEATURES=$(jq -r '.totalFeatures' "$LATEST_REPORT" 2>/dev/null || echo "0")
  PASSED_FEATURES=$(jq -r '.passedFeatures' "$LATEST_REPORT" 2>/dev/null || echo "0")
  FAILED_FEATURES=$(jq -r '.failedFeatures' "$LATEST_REPORT" 2>/dev/null || echo "0")
  TOTAL_ISSUES=$(jq -r '.totalIssues' "$LATEST_REPORT" 2>/dev/null || echo "0")
  CRITICAL_ISSUES=$(jq -r '.issuesBySeverity.critical' "$LATEST_REPORT" 2>/dev/null || echo "0")
  HIGH_ISSUES=$(jq -r '.issuesBySeverity.high' "$LATEST_REPORT" 2>/dev/null || echo "0")

  echo -e "Features Tested: $TOTAL_FEATURES"
  echo -e "${GREEN}Passed: $PASSED_FEATURES${NC}"
  echo -e "${RED}Failed: $FAILED_FEATURES${NC}"
  echo -e "\nTotal Issues: $TOTAL_ISSUES"
  echo -e "  ${RED}Critical: $CRITICAL_ISSUES${NC}"
  echo -e "  ${YELLOW}High: $HIGH_ISSUES${NC}"

  # Display report location
  REPORT_DIR=$(dirname "$LATEST_REPORT")
  echo -e "\n${BLUE}📁 Full Report: $REPORT_DIR${NC}"
  echo -e "   JSON: AGENT1_COMPREHENSIVE_REPORT.json"
  echo -e "   Markdown: AGENT1_REPORT.md"
  echo -e "   Screenshots: screenshots/"

  # Check if critical issues exist
  if [[ "$CRITICAL_ISSUES" -gt 0 ]]; then
    echo -e "\n${RED}⚠️  CRITICAL ISSUES FOUND!${NC}"
    echo -e "Review the report for details."
    exit 1
  elif [[ "$FAILED_FEATURES" -gt 0 ]]; then
    echo -e "\n${YELLOW}⚠️  Some features failed tests${NC}"
    exit 1
  else
    echo -e "\n${GREEN}✅ All features passed!${NC}"
    exit 0
  fi
else
  echo -e "\n${RED}❌ No test report found${NC}"
  exit 1
fi
