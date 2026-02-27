#!/bin/bash

#
# Fleet-CTA E2E Test Runner
# Runs comprehensive end-to-end tests and generates reports
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3001"
TEST_DIR="tests/e2e"
REPORT_DIR="playwright-report"
TEST_RESULTS_DIR="test-results"

# Functions
print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if servers are running
check_servers() {
  print_header "Checking Servers"

  # Check frontend
  if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    print_success "Frontend running at $FRONTEND_URL"
  else
    print_error "Frontend not running at $FRONTEND_URL"
    print_warning "Please start frontend: npm run dev"
    exit 1
  fi

  # Check backend
  if curl -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    print_success "Backend running at $BACKEND_URL"
  else
    print_error "Backend not running at $BACKEND_URL"
    print_warning "Please start backend: cd api && npm run dev"
    exit 1
  fi
}

# Run tests
run_tests() {
  local test_file=$1
  local suite_name=$2

  print_header "Running $suite_name"

  if [ -z "$test_file" ]; then
    # Run all tests
    npx playwright test \
      --reporter=html \
      --reporter=json \
      --reporter=junit \
      || true
  else
    # Run specific test file
    npx playwright test "$test_file" \
      --reporter=html \
      --reporter=json \
      --reporter=junit \
      || true
  fi

  print_success "Tests completed for $suite_name"
}

# Generate summary report
generate_summary() {
  print_header "Test Summary"

  if [ -f "$TEST_RESULTS_DIR/results.json" ]; then
    echo "Test Results: $TEST_RESULTS_DIR/results.json"

    # Parse JSON and display summary
    jq '
      {
        total: (.tests | length),
        passed: ([.tests[] | select(.status == "passed")] | length),
        failed: ([.tests[] | select(.status == "failed")] | length),
        skipped: ([.tests[] | select(.status == "skipped")] | length),
        duration: .stats.duration
      }
    ' "$TEST_RESULTS_DIR/results.json"
  else
    print_warning "Test results file not found"
  fi
}

# Open reports
open_reports() {
  print_header "Opening Reports"

  if [ -d "$REPORT_DIR" ]; then
    print_success "HTML Report: $REPORT_DIR/index.html"
    if command -v open &> /dev/null; then
      open "$REPORT_DIR/index.html"
    elif command -v xdg-open &> /dev/null; then
      xdg-open "$REPORT_DIR/index.html"
    else
      print_warning "Please open $REPORT_DIR/index.html manually"
    fi
  fi
}

# Parse command line arguments
run_all=false
run_specific=""
headed=false
debug=false
ui=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --all|-a)
      run_all=true
      shift
      ;;
    --file|-f)
      run_specific="$2"
      shift 2
      ;;
    --headed)
      headed=true
      shift
      ;;
    --debug)
      debug=true
      shift
      ;;
    --ui)
      ui=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --all, -a              Run all tests"
      echo "  --file, -f FILE        Run specific test file"
      echo "  --headed               Run with visible browser"
      echo "  --debug                Run in debug mode"
      echo "  --ui                   Run in UI mode (interactive)"
      echo "  --help, -h             Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 --all               # Run all tests"
      echo "  $0 --file 01-authentication-flows.spec.ts"
      echo "  $0 --headed --all      # Run all tests with visible browser"
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Main execution
print_header "Fleet-CTA E2E Test Suite"

# Check servers
check_servers

# Run tests based on arguments
if [ "$ui" = true ]; then
  print_header "Starting Playwright UI Mode"
  npx playwright test --ui
  exit $?
elif [ "$debug" = true ]; then
  print_header "Starting Debug Mode"
  npx playwright test --debug
  exit $?
elif [ ! -z "$run_specific" ]; then
  run_tests "$run_specific" "Specific Tests ($run_specific)"
elif [ "$run_all" = true ]; then
  run_tests "" "All Tests"
else
  # Default: run all tests
  print_warning "No specific tests requested, running all tests..."
  run_tests "" "All Tests"
fi

# Build command if using headed or other options
if [ "$headed" = true ]; then
  print_warning "Note: Headed mode requires browser to be visible"
fi

# Generate summary
generate_summary

# Offer to open reports
print_header "Next Steps"
echo ""
echo "Test results:"
echo "  HTML Report: file://$(pwd)/$REPORT_DIR/index.html"
echo "  JSON Results: $TEST_RESULTS_DIR/results.json"
echo "  JUnit XML: $TEST_RESULTS_DIR/junit.xml"
echo ""
echo "To view the HTML report, run:"
echo "  npx playwright show-report"
echo ""

# Success
print_success "E2E test suite execution completed!"
