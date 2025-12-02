#!/bin/bash
# test.sh - Test runner script for iOS app
# Usage: ./scripts/test.sh [device] [coverage]

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
XCODE_PROJECT="App.xcodeproj"
XCODE_WORKSPACE="App.xcworkspace"
SCHEME_NAME="App"
DEVICE_NAME="${1:-iPhone 15 Pro}"
ENABLE_COVERAGE="${2:-true}"
TEST_OUTPUT_DIR="${PROJECT_DIR}/test_output"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to print messages
print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

print_header() {
    echo ""
    print_message "$BLUE" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$BLUE" "$1"
    print_message "$BLUE" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Change to project directory
cd "$PROJECT_DIR"

print_header "🧪 iOS Test Runner"

print_message "$BLUE" "Configuration:"
print_message "$NC" "  Project: ${XCODE_PROJECT}"
print_message "$NC" "  Scheme: ${SCHEME_NAME}"
print_message "$NC" "  Device: ${DEVICE_NAME}"
print_message "$NC" "  Code Coverage: ${ENABLE_COVERAGE}"
print_message "$NC" "  Output Directory: ${TEST_OUTPUT_DIR}"
echo ""

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    print_message "$RED" "❌ Error: xcodebuild not found. Please install Xcode."
    exit 1
fi

print_message "$GREEN" "✅ Xcode found: $(xcodebuild -version | head -n 1)"
echo ""

# Install xcpretty if not available
if ! command -v xcpretty &> /dev/null; then
    print_message "$YELLOW" "⚠️  xcpretty not found. Installing..."
    gem install xcpretty
fi

# Install dependencies if needed
if [ -f "Podfile" ]; then
    print_header "📦 Installing Dependencies"

    if ! command -v pod &> /dev/null; then
        print_message "$YELLOW" "⚠️  CocoaPods not found. Installing..."
        gem install cocoapods
    fi

    pod install --repo-update
    print_message "$GREEN" "✅ Dependencies installed"
    echo ""
fi

# Create output directory
mkdir -p "$TEST_OUTPUT_DIR"

# Determine workspace or project
if [ -f "$XCODE_WORKSPACE" ]; then
    BUILD_TARGET="-workspace $XCODE_WORKSPACE"
    print_message "$BLUE" "Using workspace: $XCODE_WORKSPACE"
else
    BUILD_TARGET="-project $XCODE_PROJECT"
    print_message "$BLUE" "Using project: $XCODE_PROJECT"
fi
echo ""

# Check if simulator exists, create if not
print_header "📱 Checking Simulator"

SIMULATOR_ID=$(xcrun simctl list devices available | grep "$DEVICE_NAME" | head -n 1 | grep -o "[0-9A-F]\{8\}-[0-9A-F]\{4\}-[0-9A-F]\{4\}-[0-9A-F]\{4\}-[0-9A-F]\{12\}" || true)

if [ -z "$SIMULATOR_ID" ]; then
    print_message "$YELLOW" "⚠️  Simulator not found. Available simulators:"
    xcrun simctl list devices available | grep "iPhone"
    print_message "$RED" "❌ Please specify a valid simulator name."
    exit 1
else
    print_message "$GREEN" "✅ Simulator found: ${DEVICE_NAME} (${SIMULATOR_ID})"
fi
echo ""

# Boot simulator if needed
SIMULATOR_STATE=$(xcrun simctl list devices | grep "$SIMULATOR_ID" | grep -o "Booted\|Shutdown" || echo "Shutdown")

if [ "$SIMULATOR_STATE" != "Booted" ]; then
    print_message "$YELLOW" "⏳ Booting simulator..."
    xcrun simctl boot "$SIMULATOR_ID" || true
    sleep 5
    print_message "$GREEN" "✅ Simulator booted"
fi
echo ""

# Clean build folder
print_header "🧹 Cleaning Build Folder"
xcodebuild clean \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -destination "platform=iOS Simulator,name=${DEVICE_NAME}" \
    | xcpretty || true

print_message "$GREEN" "✅ Build folder cleaned"
echo ""

# Build for testing
print_header "🔨 Building for Testing"

xcodebuild build-for-testing \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -destination "platform=iOS Simulator,name=${DEVICE_NAME}" \
    -configuration Debug \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    ONLY_ACTIVE_ARCH=NO \
    | xcpretty

if [ $? -ne 0 ]; then
    print_message "$RED" "❌ Build for testing failed!"
    exit 1
fi

print_message "$GREEN" "✅ Build for testing completed"
echo ""

# Run tests
print_header "🧪 Running Tests"

COVERAGE_FLAG=""
if [ "$ENABLE_COVERAGE" = "true" ]; then
    COVERAGE_FLAG="-enableCodeCoverage YES"
fi

xcodebuild test-without-building \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -destination "platform=iOS Simulator,name=${DEVICE_NAME}" \
    -resultBundlePath "${TEST_OUTPUT_DIR}/TestResults_${TIMESTAMP}.xcresult" \
    $COVERAGE_FLAG \
    | tee "${TEST_OUTPUT_DIR}/test_output_${TIMESTAMP}.log" \
    | xcpretty --report junit --output "${TEST_OUTPUT_DIR}/junit_${TIMESTAMP}.xml"

TEST_EXIT_CODE=$?

echo ""

# Parse test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_message "$GREEN" "✅ All tests passed!"
else
    print_message "$RED" "❌ Some tests failed!"
fi
echo ""

# Generate code coverage report
if [ "$ENABLE_COVERAGE" = "true" ]; then
    print_header "📊 Generating Code Coverage Report"

    RESULT_BUNDLE="${TEST_OUTPUT_DIR}/TestResults_${TIMESTAMP}.xcresult"

    if [ -d "$RESULT_BUNDLE" ]; then
        # Generate JSON coverage report
        xcrun xccov view --report --json "$RESULT_BUNDLE" > "${TEST_OUTPUT_DIR}/coverage_${TIMESTAMP}.json" || true

        # Generate human-readable coverage report
        xcrun xccov view --report "$RESULT_BUNDLE" > "${TEST_OUTPUT_DIR}/coverage_${TIMESTAMP}.txt" || true

        if [ -f "${TEST_OUTPUT_DIR}/coverage_${TIMESTAMP}.txt" ]; then
            print_message "$GREEN" "Code Coverage Report:"
            echo ""
            head -n 20 "${TEST_OUTPUT_DIR}/coverage_${TIMESTAMP}.txt"
            echo ""
            print_message "$GREEN" "✅ Full coverage report saved to: ${TEST_OUTPUT_DIR}/coverage_${TIMESTAMP}.txt"
        fi

        # Calculate overall coverage percentage
        COVERAGE_PERCENTAGE=$(xcrun xccov view --report "$RESULT_BUNDLE" | grep "\.app" | awk '{print $3}' | head -n 1 || echo "N/A")
        print_message "$BLUE" "Overall Coverage: ${COVERAGE_PERCENTAGE}"
    else
        print_message "$YELLOW" "⚠️  Test result bundle not found"
    fi
    echo ""
fi

# Test summary
print_header "📊 Test Summary"

if [ -f "${TEST_OUTPUT_DIR}/junit_${TIMESTAMP}.xml" ]; then
    TOTAL_TESTS=$(grep -o "tests=\"[0-9]*\"" "${TEST_OUTPUT_DIR}/junit_${TIMESTAMP}.xml" | grep -o "[0-9]*" | head -n 1 || echo "0")
    FAILED_TESTS=$(grep -o "failures=\"[0-9]*\"" "${TEST_OUTPUT_DIR}/junit_${TIMESTAMP}.xml" | grep -o "[0-9]*" | head -n 1 || echo "0")
    PASSED_TESTS=$((TOTAL_TESTS - FAILED_TESTS))

    print_message "$GREEN" "Total Tests: ${TOTAL_TESTS}"
    print_message "$GREEN" "Passed: ${PASSED_TESTS}"

    if [ "$FAILED_TESTS" -gt 0 ]; then
        print_message "$RED" "Failed: ${FAILED_TESTS}"
    else
        print_message "$GREEN" "Failed: ${FAILED_TESTS}"
    fi

    if [ "$ENABLE_COVERAGE" = "true" ] && [ -n "$COVERAGE_PERCENTAGE" ] && [ "$COVERAGE_PERCENTAGE" != "N/A" ]; then
        print_message "$BLUE" "Coverage: ${COVERAGE_PERCENTAGE}"
    fi
fi
echo ""

print_message "$NC" "Test artifacts saved to: ${TEST_OUTPUT_DIR}"
print_message "$NC" "  - Test log: test_output_${TIMESTAMP}.log"
print_message "$NC" "  - JUnit report: junit_${TIMESTAMP}.xml"
print_message "$NC" "  - Result bundle: TestResults_${TIMESTAMP}.xcresult"

if [ "$ENABLE_COVERAGE" = "true" ]; then
    print_message "$NC" "  - Coverage JSON: coverage_${TIMESTAMP}.json"
    print_message "$NC" "  - Coverage report: coverage_${TIMESTAMP}.txt"
fi
echo ""

# Shutdown simulator (optional)
read -p "Do you want to shutdown the simulator? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    xcrun simctl shutdown "$SIMULATOR_ID" || true
    print_message "$GREEN" "✅ Simulator shutdown"
fi

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_message "$GREEN" "🎉 Testing completed successfully!"
else
    print_message "$RED" "❌ Testing completed with failures!"
fi

exit $TEST_EXIT_CODE
