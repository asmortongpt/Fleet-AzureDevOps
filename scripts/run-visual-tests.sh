#!/bin/bash

# Visual Testing Script for Percy.io Integration
# Usage: ./scripts/run-visual-tests.sh [options]
#
# Options:
#   --help           Show this help message
#   --dev            Run visual tests in development mode (headless)
#   --headed         Run with visible browser
#   --components     Test only UI components
#   --pages          Test only main pages
#   --update         Update baselines (requires Percy token)
#   --ci             Run in CI mode (optimized)
#   --debug          Run in debug mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    cat << EOF
Visual Testing Script for Fleet-CTA

Usage: ./scripts/run-visual-tests.sh [options]

Options:
  --help              Show this help message
  --dev               Run in development mode (default)
  --headed            Run with visible browser
  --components        Test only UI components (tests/visual/components/)
  --pages             Test only main pages (tests/visual/pages/)
  --update            Update baselines (requires PERCY_TOKEN)
  --ci                Run in CI mode (optimized for GitHub Actions)
  --debug             Run in debug mode with interactive browser

Examples:
  # Run all tests in dev mode
  ./scripts/run-visual-tests.sh

  # Run with visible browser
  ./scripts/run-visual-tests.sh --headed

  # Test only components
  ./scripts/run-visual-tests.sh --components --headed

  # Run in CI mode with Percy
  PERCY_TOKEN=xxx ./scripts/run-visual-tests.sh --ci

Requirements:
  - Node.js 20.x or higher
  - npm packages installed (npm ci --legacy-peer-deps)
  - Playwright browsers installed (npx playwright install)
  - Dev server running on http://localhost:5173

Setup:
  1. npm ci --legacy-peer-deps
  2. npx playwright install --with-deps
  3. npm run dev (in another terminal)
  4. ./scripts/run-visual-tests.sh

Percy Integration:
  1. Get PERCY_TOKEN from percy.io
  2. Export: export PERCY_TOKEN=<your-token>
  3. Run with Percy: npx percy exec -- npx playwright test tests/visual/

EOF
}

# Default values
TEST_PATH="tests/visual/"
HEADED=false
UPDATE=false
CI_MODE=false
DEBUG=false
PERCY_ENABLED=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            exit 0
            ;;
        --headed)
            HEADED=true
            shift
            ;;
        --components)
            TEST_PATH="tests/visual/components/"
            shift
            ;;
        --pages)
            TEST_PATH="tests/visual/pages/"
            shift
            ;;
        --update)
            UPDATE=true
            shift
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check prerequisites
print_header "Checking Prerequisites"

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js $(node --version) found"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm --version) found"

# Check if dev server is running
print_header "Checking Dev Server"

if curl -s http://localhost:5173 > /dev/null; then
    print_success "Dev server is running on http://localhost:5173"
else
    print_warning "Dev server is not running on http://localhost:5173"
    print_warning "Starting dev server in background..."
    npm run dev > /dev/null 2>&1 &
    sleep 5
    if ! curl -s http://localhost:5173 > /dev/null; then
        print_error "Failed to start dev server"
        exit 1
    fi
    print_success "Dev server started"
fi

# Check Percy token if CI mode
if [ "$CI_MODE" = true ] && [ -z "$PERCY_TOKEN" ]; then
    print_warning "PERCY_TOKEN not set, running without Percy cloud integration"
    PERCY_ENABLED=false
else
    if [ -n "$PERCY_TOKEN" ]; then
        PERCY_ENABLED=true
        print_success "PERCY_TOKEN found, enabling Percy cloud integration"
    fi
fi

# Build test command
print_header "Building Test Command"

TEST_CMD="npx playwright test $TEST_PATH"

if [ "$HEADED" = true ]; then
    TEST_CMD="$TEST_CMD --headed"
    print_success "Running with visible browser"
fi

if [ "$DEBUG" = true ]; then
    TEST_CMD="$TEST_CMD --debug"
    print_success "Running in debug mode"
fi

if [ "$UPDATE" = true ]; then
    TEST_CMD="$TEST_CMD --update"
    print_success "Updating baselines"
fi

if [ "$CI_MODE" = true ]; then
    TEST_CMD="$TEST_CMD --workers=1"
    print_success "Running in CI mode"
fi

# Add Percy if enabled
if [ "$PERCY_ENABLED" = true ]; then
    TEST_CMD="npx percy exec -- $TEST_CMD"
    print_success "Percy cloud integration enabled"
fi

# Add reporters
TEST_CMD="$TEST_CMD --reporter=html,list"

echo -e "${YELLOW}Command: $TEST_CMD${NC}\n"

# Run tests
print_header "Running Visual Tests"

if [ "$CI_MODE" = true ]; then
    # CI mode - strict error handling
    set -e
    eval "$TEST_CMD" || {
        print_error "Visual tests failed"
        exit 1
    }
else
    # Dev mode - more lenient
    eval "$TEST_CMD" || {
        print_warning "Visual tests completed with warnings"
    }
fi

# Print results
print_header "Test Results"

if [ -f "playwright-report/index.html" ]; then
    print_success "HTML report generated"
    echo "📊 Report: playwright-report/index.html"
fi

if [ -d ".percy" ]; then
    print_success "Percy build data available"
    echo "Percy Dashboard: https://percy.io/dashboard"
fi

if [ -d "test-results" ]; then
    SCREENSHOT_COUNT=$(find test-results -name "*.png" 2>/dev/null | wc -l || echo 0)
    if [ "$SCREENSHOT_COUNT" -gt 0 ]; then
        print_success "Generated $SCREENSHOT_COUNT screenshots"
        echo "📸 Screenshots: test-results/"
    fi
fi

print_header "Next Steps"

echo "1. Review screenshots in test-results/"
echo "2. Check HTML report: playwright-report/"
echo "3. If using Percy, visit: https://percy.io/dashboard"
echo "4. Approve changes or request modifications"
echo ""

if [ "$HEADED" = false ] && [ "$DEBUG" = false ]; then
    echo "💡 Tips:"
    echo "  - Use --headed to see the browser during test execution"
    echo "  - Use --debug for interactive debugging"
    echo "  - Use --update to update baselines"
    echo "  - Export PERCY_TOKEN to use Percy cloud integration"
    echo ""
fi

print_success "Visual testing complete!"
