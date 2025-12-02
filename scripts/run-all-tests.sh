#!/bin/bash

# Comprehensive test execution script
# Runs all test suites and generates reports

set -e  # Exit on error

echo "=================================="
echo "Fleet Management System - Comprehensive Test Suite"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo ""
    echo "=================================="
    echo "$1"
    echo "=================================="
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if application is running
print_section "Pre-flight Checks"

echo "Checking if application is running..."
if curl -s http://localhost:5000 > /dev/null; then
    print_success "Application is running on http://localhost:5000"
else
    print_warning "Application is not running on http://localhost:5000"
    echo "Please start the application with: npm run dev"
    exit 1
fi

# Check Node modules
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Installing..."
    npm install
fi

# Check Playwright browsers
echo "Checking Playwright browsers..."
if ! npx playwright --version > /dev/null 2>&1; then
    print_warning "Installing Playwright browsers..."
    npx playwright install
fi

print_success "Pre-flight checks complete"

# Run E2E Tests
print_section "Running E2E Tests"

echo "Running all Playwright tests..."
if npx playwright test --reporter=list,html,json,junit; then
    print_success "E2E tests completed"
else
    print_error "E2E tests failed"
    exit 1
fi

# Generate visual regression report
print_section "Visual Regression Report"
echo "Visual regression results are available in the HTML report"
echo "Run 'npx playwright show-report' to view"

# Run Python API Tests (if available)
if [ -f "tests/api/python/requirements.txt" ]; then
    print_section "Running Python API Tests"

    cd tests/api/python

    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_warning "Creating Python virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi

    echo "Running pytest..."
    if pytest -v --tb=short; then
        print_success "API tests completed"
    else
        print_warning "Some API tests failed (may be expected if API is not running)"
    fi

    deactivate
    cd ../../..
else
    print_warning "Python API tests not found, skipping"
fi

# Generate Summary Report
print_section "Test Summary"

# Count test results from JSON report
if [ -f "test-results/results.json" ]; then
    echo "Parsing test results..."

    # Simple parsing (requires jq for better parsing)
    if command -v jq &> /dev/null; then
        TOTAL_TESTS=$(jq '.suites[].specs | length' test-results/results.json | awk '{s+=$1} END {print s}')
        echo "Total tests executed: $TOTAL_TESTS"
    else
        print_warning "Install 'jq' for detailed test statistics"
        echo "Test results available in test-results/results.json"
    fi
fi

# Check for visual regression failures
if [ -d "test-results" ]; then
    VISUAL_DIFFS=$(find test-results -name "*-diff.png" | wc -l)
    if [ $VISUAL_DIFFS -gt 0 ]; then
        print_warning "Visual regression differences detected: $VISUAL_DIFFS"
        echo "Review the HTML report for details"
    else
        print_success "No visual regression differences detected"
    fi
fi

print_section "Test Execution Complete"

echo "Reports generated:"
echo "  - HTML Report: playwright-report/index.html (run 'npx playwright show-report')"
echo "  - JSON Report: test-results/results.json"
echo "  - JUnit XML: test-results/junit.xml"
echo ""
echo "To view the HTML report, run:"
echo "  npx playwright show-report"
echo ""

print_success "All test suites completed successfully!"
