#!/bin/bash

###############################################################################
# Fleet Management Production Test Suite Runner
###############################################################################
#
# This script helps you run the Playwright tests against the production
# Fleet Management System at http://68.220.148.2
#
# Usage:
#   ./run-production-tests.sh [command]
#
# Commands:
#   auth       - Run manual authentication (first time setup)
#   test       - Run all tests with saved authentication
#   test-one   - Run a specific test file
#   discover   - Discover app structure and module names
#   report     - Open the latest HTML test report
#   clean      - Clean test results and saved authentication
#   help       - Show this help message
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AUTH_FILE="$SCRIPT_DIR/test-results/auth-state.json"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════════"
    echo "$1"
    echo "═══════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_auth() {
    if [ ! -f "$AUTH_FILE" ]; then
        return 1
    fi
    return 0
}

command_auth() {
    print_header "STEP 1: MANUAL AUTHENTICATION"
    echo ""
    print_info "This will open a browser window for you to log in manually."
    echo ""
    print_info "Instructions:"
    echo "  1. A browser window will open showing the Fleet Manager login page"
    echo "  2. Log in using ANY method that works for you:"
    echo "     - Email/Password (if you have working credentials)"
    echo "     - Microsoft SSO (if you have a Microsoft account)"
    echo "  3. Wait for the dashboard to load with the sidebar navigation"
    echo "  4. The script will automatically save your authentication"
    echo ""
    read -p "Press ENTER to continue or Ctrl+C to cancel..."
    echo ""

    npx playwright test manual-auth.spec.ts --project=chromium --headed --timeout=300000

    if check_auth; then
        echo ""
        print_success "Authentication saved successfully!"
        print_info "You can now run tests with: $0 test"
    else
        echo ""
        print_error "Authentication failed or was cancelled"
        exit 1
    fi
}

command_test() {
    print_header "RUNNING PRODUCTION TEST SUITE"

    if ! check_auth; then
        echo ""
        print_error "No saved authentication found!"
        print_info "Please run authentication first: $0 auth"
        exit 1
    fi

    echo ""
    print_info "Running tests against: http://68.220.148.2"
    print_info "Using saved authentication from: $AUTH_FILE"
    echo ""

    STORAGE_STATE="$AUTH_FILE" npx playwright test --project=chromium "$@"

    echo ""
    print_success "Test run complete!"
    print_info "View HTML report with: $0 report"
}

command_test_one() {
    if ! check_auth; then
        echo ""
        print_error "No saved authentication found!"
        print_info "Please run authentication first: $0 auth"
        exit 1
    fi

    if [ -z "$1" ]; then
        print_error "Please specify a test file"
        echo ""
        echo "Available test files:"
        echo "  - vehicles.spec.ts"
        echo "  - dispatch.spec.ts"
        echo "  - accessibility.spec.ts"
        echo "  - performance.spec.ts"
        echo "  - component_matrix.spec.ts"
        echo ""
        echo "Usage: $0 test-one vehicles.spec.ts"
        exit 1
    fi

    print_header "RUNNING TEST: $1"
    echo ""

    STORAGE_STATE="$AUTH_FILE" npx playwright test "$1" --project=chromium

    echo ""
    print_success "Test complete!"
}

command_discover() {
    print_header "DISCOVERING APP STRUCTURE"

    if ! check_auth; then
        print_warning "No saved authentication found - discovery may not work"
        print_info "Consider running: $0 auth first"
        echo ""
    fi

    echo ""
    print_info "This will analyze the production app and identify:"
    echo "  - Available navigation modules"
    echo "  - Correct module names"
    echo "  - Recommended selectors"
    echo ""

    if check_auth; then
        STORAGE_STATE="$AUTH_FILE" npx playwright test inspect-app-v3.spec.ts --project=chromium
    else
        npx playwright test inspect-app-v3.spec.ts --project=chromium
    fi

    echo ""
    print_success "Discovery complete!"
    print_info "Results saved to:"
    echo "  - test-results/full-navigation-analysis.json"
    echo "  - test-results/screenshots/"
    echo ""
    echo "To view the results:"
    echo "  cat test-results/full-navigation-analysis.json | jq '.moduleResults'"
}

command_report() {
    print_header "OPENING TEST REPORT"

    if [ ! -d "test-results/html-report" ]; then
        print_error "No test report found"
        print_info "Run tests first with: $0 test"
        exit 1
    fi

    npx playwright show-report test-results/html-report
}

command_clean() {
    print_header "CLEANING TEST RESULTS"

    echo ""
    print_warning "This will delete:"
    echo "  - Saved authentication (you'll need to log in again)"
    echo "  - All test results and reports"
    echo "  - Screenshots and videos"
    echo ""
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        rm -rf test-results/
        print_success "Cleaned successfully!"
        print_info "Run '$0 auth' to authenticate again"
    else
        print_info "Cancelled"
    fi
}

command_help() {
    cat << EOF

Fleet Management Production Test Suite Runner

Usage:
    $0 [command]

Commands:
    auth       Run manual authentication (first time setup)
               Opens a browser for you to log in manually

    test       Run all tests with saved authentication
               Requires authentication to be completed first

    test-one   Run a specific test file
               Example: $0 test-one vehicles.spec.ts

    discover   Discover app structure and module names
               Helps identify correct selectors for tests

    report     Open the latest HTML test report
               Shows detailed results from last test run

    clean      Clean test results and saved authentication
               Removes all cached data

    help       Show this help message

Examples:
    # First time setup
    $0 auth

    # Run all tests
    $0 test

    # Run specific test
    $0 test-one vehicles.spec.ts

    # Run tests in headed mode (see browser)
    $0 test --headed

    # Discover module names
    $0 discover

    # View results
    $0 report

For more information, see:
    - README-PRODUCTION-TESTING.md
    - IMPLEMENTATION-SUMMARY.md

EOF
}

# Main command dispatcher
case "${1:-help}" in
    auth)
        command_auth
        ;;
    test)
        shift
        command_test "$@"
        ;;
    test-one)
        shift
        command_test_one "$@"
        ;;
    discover)
        command_discover
        ;;
    report)
        command_report
        ;;
    clean)
        command_clean
        ;;
    help|--help|-h|"")
        command_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        command_help
        exit 1
        ;;
esac
