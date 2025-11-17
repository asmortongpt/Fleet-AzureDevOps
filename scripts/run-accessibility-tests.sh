#!/bin/bash

#######################################################################
# Fleet Management Platform - Accessibility Testing Script
# WCAG 2.2 Level AA Compliance Validation
#
# This script runs comprehensive accessibility tests and generates
# detailed HTML reports showing WCAG compliance status.
#
# Usage:
#   ./scripts/run-accessibility-tests.sh [options]
#
# Options:
#   --headed          Run tests in headed mode (visible browser)
#   --ui              Run tests in UI mode (interactive)
#   --debug           Run with debug output
#   --quick           Run quick scan (fewer pages)
#   --report-only     Generate report from existing results
#   --help            Show this help message
#
# Examples:
#   ./scripts/run-accessibility-tests.sh
#   ./scripts/run-accessibility-tests.sh --headed
#   ./scripts/run-accessibility-tests.sh --ui
#   ./scripts/run-accessibility-tests.sh --report-only
#######################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
PRODUCTION_URL="${PRODUCTION_URL:-http://68.220.148.2}"
REPORT_DIR="$PROJECT_DIR/test-results/accessibility"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parse command line arguments
HEADED_MODE=""
UI_MODE=""
DEBUG_MODE=""
QUICK_MODE=""
REPORT_ONLY=false
SHOW_HELP=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --headed)
      HEADED_MODE="--headed"
      shift
      ;;
    --ui)
      UI_MODE="--ui"
      shift
      ;;
    --debug)
      DEBUG_MODE="--debug"
      shift
      ;;
    --quick)
      QUICK_MODE="--grep quick"
      shift
      ;;
    --report-only)
      REPORT_ONLY=true
      shift
      ;;
    --help)
      SHOW_HELP=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      SHOW_HELP=true
      shift
      ;;
  esac
done

# Show help
if [ "$SHOW_HELP" = true ]; then
  cat << EOF
${CYAN}Fleet Management Platform - Accessibility Testing Script${NC}

${YELLOW}Usage:${NC}
  ./scripts/run-accessibility-tests.sh [options]

${YELLOW}Options:${NC}
  --headed          Run tests in headed mode (visible browser)
  --ui              Run tests in UI mode (interactive)
  --debug           Run with debug output
  --quick           Run quick scan (fewer pages)
  --report-only     Generate report from existing results
  --help            Show this help message

${YELLOW}Examples:${NC}
  # Run full accessibility test suite
  ./scripts/run-accessibility-tests.sh

  # Run with visible browser
  ./scripts/run-accessibility-tests.sh --headed

  # Run in interactive UI mode
  ./scripts/run-accessibility-tests.sh --ui

  # Generate report from existing test results
  ./scripts/run-accessibility-tests.sh --report-only

${YELLOW}Environment Variables:${NC}
  PRODUCTION_URL    Base URL for testing (default: http://68.220.148.2)

${YELLOW}Output:${NC}
  Reports are saved to: test-results/accessibility/
  - accessibility-report.html  Interactive HTML report
  - summary.json               JSON summary of all violations
  - *.json                     Individual page reports

${YELLOW}WCAG Standards:${NC}
  This script tests against WCAG 2.2 Level AA compliance standards.

EOF
  exit 0
fi

# Print header
print_header() {
  echo ""
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║                                                            ║${NC}"
  echo -e "${CYAN}║        Fleet Management Platform                          ║${NC}"
  echo -e "${CYAN}║        Accessibility Testing Suite                        ║${NC}"
  echo -e "${CYAN}║        WCAG 2.2 Level AA Compliance                       ║${NC}"
  echo -e "${CYAN}║                                                            ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# Print section
print_section() {
  echo ""
  echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${MAGENTA}  $1${NC}"
  echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Print step
print_step() {
  echo -e "${BLUE}▶${NC} $1"
}

# Print success
print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

# Print warning
print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Print error
print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Check if production URL is accessible
check_production_url() {
  print_step "Checking production URL: $PRODUCTION_URL"

  if curl -s --head --fail "$PRODUCTION_URL" > /dev/null; then
    print_success "Production URL is accessible"
    return 0
  else
    print_error "Production URL is not accessible: $PRODUCTION_URL"
    echo ""
    echo -e "${YELLOW}Please ensure the production server is running or update PRODUCTION_URL environment variable.${NC}"
    echo ""
    exit 1
  fi
}

# Ensure report directory exists
prepare_report_directory() {
  print_step "Preparing report directory"

  mkdir -p "$REPORT_DIR"

  # Create backup of previous reports if they exist
  if [ -f "$REPORT_DIR/accessibility-report.html" ]; then
    BACKUP_DIR="$REPORT_DIR/backups/$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    cp -r "$REPORT_DIR"/*.{html,json} "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Previous reports backed up to: $BACKUP_DIR"
  else
    print_success "Report directory ready: $REPORT_DIR"
  fi
}

# Install dependencies if needed
check_dependencies() {
  print_step "Checking dependencies"

  cd "$PROJECT_DIR"

  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    print_warning "Dependencies not installed. Installing..."
    npm install
    print_success "Dependencies installed"
  else
    # Check if @axe-core/playwright is installed
    if [ ! -d "node_modules/@axe-core/playwright" ]; then
      print_warning "@axe-core/playwright not found. Installing..."
      npm install --save-dev @axe-core/playwright
      print_success "@axe-core/playwright installed"
    else
      print_success "Dependencies are up to date"
    fi
  fi
}

# Run accessibility tests
run_tests() {
  print_step "Running accessibility tests"

  cd "$PROJECT_DIR"

  # Build test command
  TEST_CMD="npx playwright test e2e/07-accessibility/comprehensive-accessibility.spec.ts"

  # Add options
  if [ -n "$HEADED_MODE" ]; then
    TEST_CMD="$TEST_CMD $HEADED_MODE"
  fi

  if [ -n "$UI_MODE" ]; then
    TEST_CMD="$TEST_CMD $UI_MODE"
  fi

  if [ -n "$DEBUG_MODE" ]; then
    TEST_CMD="$TEST_CMD $DEBUG_MODE"
  fi

  if [ -n "$QUICK_MODE" ]; then
    TEST_CMD="$TEST_CMD $QUICK_MODE"
  fi

  # Add reporter for HTML output
  TEST_CMD="$TEST_CMD --reporter=html,list"

  echo ""
  echo -e "${CYAN}Running command:${NC} $TEST_CMD"
  echo ""

  # Run tests
  if eval "$TEST_CMD"; then
    print_success "Accessibility tests completed"
    return 0
  else
    print_warning "Some accessibility tests failed (this is expected if violations were found)"
    return 1
  fi
}

# Generate summary report
generate_summary() {
  print_step "Generating accessibility summary"

  if [ -f "$REPORT_DIR/summary.json" ]; then
    # Parse summary JSON and display
    TOTAL_PAGES=$(jq -r '.totalPages // 0' "$REPORT_DIR/summary.json")
    CRITICAL=$(jq -r '.critical // 0' "$REPORT_DIR/summary.json")
    SERIOUS=$(jq -r '.serious // 0' "$REPORT_DIR/summary.json")
    MODERATE=$(jq -r '.moderate // 0' "$REPORT_DIR/summary.json")
    MINOR=$(jq -r '.minor // 0' "$REPORT_DIR/summary.json")
    TOTAL=$(jq -r '.totalViolations // 0' "$REPORT_DIR/summary.json")

    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           ACCESSIBILITY TEST SUMMARY                      ║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  Pages Tested:       ${GREEN}$TOTAL_PAGES${NC}"
    echo -e "${CYAN}║${NC}  Critical Issues:    ${RED}$CRITICAL${NC}"
    echo -e "${CYAN}║${NC}  Serious Issues:     ${YELLOW}$SERIOUS${NC}"
    echo -e "${CYAN}║${NC}  Moderate Issues:    ${BLUE}$MODERATE${NC}"
    echo -e "${CYAN}║${NC}  Minor Issues:       ${BLUE}$MINOR${NC}"
    echo -e "${CYAN}║${NC}  Total Issues:       ${MAGENTA}$TOTAL${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Compliance status
    if [ "$CRITICAL" -eq 0 ] && [ "$SERIOUS" -eq 0 ]; then
      print_success "WCAG 2.2 AA Compliance: PASS (no critical or serious violations)"
    elif [ "$CRITICAL" -eq 0 ]; then
      print_warning "WCAG 2.2 AA Compliance: WARNING ($SERIOUS serious violations to fix)"
    else
      print_error "WCAG 2.2 AA Compliance: FAIL ($CRITICAL critical violations must be fixed)"
    fi

  else
    print_warning "Summary JSON not found. Tests may not have completed successfully."
  fi
}

# Open HTML report
open_report() {
  if [ -f "$REPORT_DIR/accessibility-report.html" ]; then
    print_step "Opening HTML report"

    # Detect OS and open report
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      open "$REPORT_DIR/accessibility-report.html"
      print_success "Report opened in default browser"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux
      xdg-open "$REPORT_DIR/accessibility-report.html" 2>/dev/null || print_warning "Could not auto-open report. Please open manually: $REPORT_DIR/accessibility-report.html"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
      # Windows
      start "$REPORT_DIR/accessibility-report.html"
      print_success "Report opened in default browser"
    else
      print_warning "Could not auto-open report. Please open manually: $REPORT_DIR/accessibility-report.html"
    fi
  else
    print_warning "HTML report not found at: $REPORT_DIR/accessibility-report.html"
  fi
}

# Show report location
show_report_location() {
  echo ""
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║           ACCESSIBILITY REPORTS GENERATED                 ║${NC}"
  echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}║${NC}  HTML Report:        $REPORT_DIR/accessibility-report.html"
  echo -e "${CYAN}║${NC}  JSON Summary:       $REPORT_DIR/summary.json"
  echo -e "${CYAN}║${NC}  Individual Reports: $REPORT_DIR/*.json"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# Main execution
main() {
  print_header

  # Change to project directory
  cd "$PROJECT_DIR"

  print_section "Pre-Flight Checks"
  check_production_url
  check_dependencies
  prepare_report_directory

  # Run tests or just generate report
  if [ "$REPORT_ONLY" = false ]; then
    print_section "Running Accessibility Tests"
    run_tests
  else
    print_section "Generating Report from Existing Results"
  fi

  # Generate and display summary
  print_section "Test Results"
  generate_summary
  show_report_location

  # Open report in browser
  echo ""
  read -p "$(echo -e ${CYAN}Open HTML report in browser? [Y/n]: ${NC})" -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    open_report
  fi

  # Print next steps
  echo ""
  print_section "Next Steps"
  echo -e "${BLUE}1.${NC} Review the HTML report for detailed violation information"
  echo -e "${BLUE}2.${NC} Fix critical and serious violations first"
  echo -e "${BLUE}3.${NC} Re-run tests to verify fixes: ${CYAN}./scripts/run-accessibility-tests.sh${NC}"
  echo -e "${BLUE}4.${NC} Consult the manual testing guide: ${CYAN}docs/ACCESSIBILITY_TESTING_GUIDE.md${NC}"
  echo ""

  # Exit with appropriate code
  if [ -f "$REPORT_DIR/summary.json" ]; then
    CRITICAL=$(jq -r '.critical // 0' "$REPORT_DIR/summary.json")
    if [ "$CRITICAL" -gt 0 ]; then
      exit 1
    fi
  fi

  exit 0
}

# Run main function
main
