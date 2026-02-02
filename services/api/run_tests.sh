#!/bin/bash
# Script to run API unit tests with coverage

set -e  # Exit on error

echo "=================================================="
echo "Radio Fleet Dispatch API - Test Runner"
echo "=================================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "requirements.txt" ] || [ ! -d "tests" ]; then
    echo "❌ Error: Must be run from the API service directory"
    echo "   Expected: /Users/andrewmorton/Documents/GitHub/radio-fleet-dispatch/services/api"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found"
    exit 1
fi

echo "✓ Directory check passed"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Create one? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
        echo "✓ Virtual environment created"
    else
        echo "Please create a virtual environment first:"
        echo "  python3 -m venv venv"
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Parse command line arguments
COVERAGE=true
VERBOSE=false
MARKER=""
TEST_PATH="tests/"

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-coverage)
            COVERAGE=false
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -m|--marker)
            MARKER="$2"
            shift 2
            ;;
        -p|--path)
            TEST_PATH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-coverage       Skip coverage report"
            echo "  -v, --verbose       Verbose output"
            echo "  -m, --marker MARKER Run tests with specific marker (e.g., unit, integration)"
            echo "  -p, --path PATH     Run tests from specific path"
            echo "  -h, --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                              # Run all tests with coverage"
            echo "  $0 --no-coverage                # Run tests without coverage"
            echo "  $0 -v                           # Run with verbose output"
            echo "  $0 -m unit                      # Run only unit tests"
            echo "  $0 -p tests/unit/test_models.py # Run specific test file"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build pytest command
PYTEST_CMD="pytest"

if [ "$VERBOSE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -v"
fi

if [ -n "$MARKER" ]; then
    PYTEST_CMD="$PYTEST_CMD -m $MARKER"
fi

if [ "$COVERAGE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=app --cov-report=html --cov-report=term-missing --cov-report=json"
fi

PYTEST_CMD="$PYTEST_CMD $TEST_PATH"

# Run tests
echo "=================================================="
echo "Running Tests"
echo "=================================================="
echo "Command: $PYTEST_CMD"
echo ""

$PYTEST_CMD

# Check exit code
TEST_EXIT_CODE=$?

echo ""
echo "=================================================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✓ All tests passed!"
else
    echo "❌ Some tests failed (exit code: $TEST_EXIT_CODE)"
fi

# Show coverage report location if generated
if [ "$COVERAGE" = true ] && [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "Coverage reports generated:"
    echo "  • HTML: htmlcov/index.html"
    echo "  • JSON: coverage.json"
    echo ""
    echo "View HTML report:"
    echo "  open htmlcov/index.html"
fi

echo "=================================================="

exit $TEST_EXIT_CODE
