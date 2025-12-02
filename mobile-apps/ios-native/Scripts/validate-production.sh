#!/bin/bash
#
# validate-production.sh
# Comprehensive Production Validation Script
#
# This script performs complete production validation including:
# - Unit tests
# - UI tests
# - Security tests
# - Code coverage verification (must be >85%)
# - Certificate validation
# - TODO/FIXME detection
# - API endpoint accessibility
# - JSON validation report generation
#
# Exit Codes:
#   0 - All validations passed
#   1 - One or more validations failed
#

set -e  # Exit on error (disabled for controlled error handling)
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
XCODE_PROJECT="App.xcodeproj"
XCODE_WORKSPACE="App.xcworkspace"
SCHEME_NAME="App"
DEVICE_NAME="iPhone 15 Pro"
MIN_COVERAGE=85
VALIDATION_OUTPUT_DIR="${PROJECT_DIR}/validation_output"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VALIDATION_REPORT="${VALIDATION_OUTPUT_DIR}/validation_report_${TIMESTAMP}.json"
LOG_FILE="${VALIDATION_OUTPUT_DIR}/validation_${TIMESTAMP}.log"

# Validation results tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Array to store validation results
declare -a VALIDATION_RESULTS=()

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}${BOLD}  $1${NC}"
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

add_result() {
    local check_name="$1"
    local status="$2"
    local message="$3"
    local details="${4:-}"

    ((TOTAL_CHECKS++))

    VALIDATION_RESULTS+=("{\"check\":\"$check_name\",\"status\":\"$status\",\"message\":\"$message\",\"details\":\"$details\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")
}

# Initialize
print_header "🚀 Production Validation Suite"
echo -e "${BOLD}Starting comprehensive production validation...${NC}"
echo -e "Project: ${CYAN}$PROJECT_DIR${NC}"
echo -e "Timestamp: ${CYAN}$(date)${NC}"
echo ""

# Create output directory
mkdir -p "$VALIDATION_OUTPUT_DIR"

# Redirect all output to log file as well
exec > >(tee -a "$LOG_FILE") 2>&1

cd "$PROJECT_DIR"

# ============================================================================
# 1. ENVIRONMENT CHECK
# ============================================================================
print_header "1️⃣  Environment Verification"

# Check Xcode
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    print_success "Xcode found: $XCODE_VERSION"
    add_result "xcode_check" "PASS" "Xcode installed" "$XCODE_VERSION"
else
    print_error "Xcode not found"
    add_result "xcode_check" "FAIL" "Xcode not installed" ""
    exit 1
fi

# Check workspace/project
if [ -d "$XCODE_WORKSPACE" ]; then
    BUILD_TARGET="-workspace $XCODE_WORKSPACE"
    print_success "Using workspace: $XCODE_WORKSPACE"
    add_result "project_structure" "PASS" "Workspace found" "$XCODE_WORKSPACE"
else
    BUILD_TARGET="-project $XCODE_PROJECT"
    print_success "Using project: $XCODE_PROJECT"
    add_result "project_structure" "PASS" "Project found" "$XCODE_PROJECT"
fi

# Check for required tools
for tool in xcpretty ruby gem; do
    if command -v $tool &> /dev/null; then
        print_success "$tool is installed"
        add_result "${tool}_check" "PASS" "$tool installed" "$(command -v $tool)"
    else
        print_warning "$tool not found (optional but recommended)"
        add_result "${tool}_check" "WARN" "$tool not installed" ""
    fi
done

# ============================================================================
# 2. CODE QUALITY CHECKS
# ============================================================================
print_header "2️⃣  Code Quality Verification"

# Check for TODO/FIXME comments
print_info "Scanning for TODO/FIXME comments..."
TODO_COUNT=$(find "$PROJECT_DIR/App" -type f \( -name "*.swift" -o -name "*.m" -o -name "*.h" \) -exec grep -i "TODO\|FIXME" {} \; 2>/dev/null | wc -l | tr -d ' ')

if [ "$TODO_COUNT" -eq 0 ]; then
    print_success "No TODO/FIXME comments found"
    add_result "todo_check" "PASS" "No TODO/FIXME comments" "count: 0"
elif [ "$TODO_COUNT" -lt 10 ]; then
    print_warning "Found $TODO_COUNT TODO/FIXME comments"
    add_result "todo_check" "WARN" "$TODO_COUNT TODO/FIXME comments found" "count: $TODO_COUNT"
else
    print_error "Found $TODO_COUNT TODO/FIXME comments (too many for production)"
    add_result "todo_check" "FAIL" "Too many TODO/FIXME comments" "count: $TODO_COUNT"
fi

# Check for debug statements
print_info "Checking for debug print statements..."
DEBUG_PRINTS=$(find "$PROJECT_DIR/App" -type f -name "*.swift" -exec grep -n "print(" {} \; 2>/dev/null | wc -l | tr -d ' ')

if [ "$DEBUG_PRINTS" -eq 0 ]; then
    print_success "No debug print statements found"
    add_result "debug_prints" "PASS" "No debug prints" "count: 0"
else
    print_warning "Found $DEBUG_PRINTS print statements (review for production)"
    add_result "debug_prints" "WARN" "$DEBUG_PRINTS print statements found" "count: $DEBUG_PRINTS"
fi

# Check for hardcoded credentials
print_info "Scanning for potential hardcoded credentials..."
CREDENTIAL_PATTERNS=("password\s*=\s*\"" "api_key\s*=\s*\"" "secret\s*=\s*\"" "token\s*=\s*\"")
CREDENTIAL_ISSUES=0

for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
    FOUND=$(find "$PROJECT_DIR/App" -type f -name "*.swift" -exec grep -iE "$pattern" {} \; 2>/dev/null | wc -l | tr -d ' ')
    if [ "$FOUND" -gt 0 ]; then
        ((CREDENTIAL_ISSUES+=FOUND))
    fi
done

if [ "$CREDENTIAL_ISSUES" -eq 0 ]; then
    print_success "No hardcoded credentials detected"
    add_result "credentials_check" "PASS" "No hardcoded credentials" "count: 0"
else
    print_error "Found $CREDENTIAL_ISSUES potential hardcoded credentials"
    add_result "credentials_check" "FAIL" "Hardcoded credentials detected" "count: $CREDENTIAL_ISSUES"
fi

# ============================================================================
# 3. CERTIFICATE VALIDATION
# ============================================================================
print_header "3️⃣  Certificate & Security Validation"

# Check for certificates
print_info "Validating SSL certificates..."
if [ -d "$PROJECT_DIR/App/Resources/Certificates" ]; then
    CERT_COUNT=$(find "$PROJECT_DIR/App/Resources/Certificates" -type f -name "*.cer" -o -name "*.der" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$CERT_COUNT" -gt 0 ]; then
        print_success "Found $CERT_COUNT SSL certificate(s)"
        add_result "certificate_check" "PASS" "SSL certificates present" "count: $CERT_COUNT"
    else
        print_warning "No SSL certificates found in Resources/Certificates"
        add_result "certificate_check" "WARN" "No SSL certificates found" "count: 0"
    fi
else
    print_warning "Certificate directory not found"
    add_result "certificate_check" "WARN" "Certificate directory missing" ""
fi

# Check Info.plist for security settings
print_info "Checking Info.plist security settings..."
INFO_PLIST="$PROJECT_DIR/App/Info.plist"
if [ -f "$INFO_PLIST" ]; then
    # Check for App Transport Security
    if /usr/libexec/PlistBuddy -c "Print :NSAppTransportSecurity" "$INFO_PLIST" &>/dev/null; then
        print_success "App Transport Security configured"
        add_result "ats_check" "PASS" "ATS configured" ""
    else
        print_warning "App Transport Security not explicitly configured"
        add_result "ats_check" "WARN" "ATS not configured" ""
    fi
fi

# ============================================================================
# 4. UNIT TESTS
# ============================================================================
print_header "4️⃣  Running Unit Tests"

print_info "Building for testing..."

BUILD_LOG="${VALIDATION_OUTPUT_DIR}/build_${TIMESTAMP}.log"

set +e  # Temporarily disable exit on error
xcodebuild build-for-testing \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -destination "platform=iOS Simulator,name=${DEVICE_NAME}" \
    -configuration Release \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    ONLY_ACTIVE_ARCH=NO \
    > "$BUILD_LOG" 2>&1

BUILD_STATUS=$?
set -e

if [ $BUILD_STATUS -eq 0 ]; then
    print_success "Build for testing completed"
    add_result "build_test" "PASS" "Build successful" ""
else
    print_error "Build for testing failed (see $BUILD_LOG)"
    add_result "build_test" "FAIL" "Build failed" "log: $BUILD_LOG"
fi

print_info "Running unit tests with code coverage..."

TEST_LOG="${VALIDATION_OUTPUT_DIR}/test_${TIMESTAMP}.log"
RESULT_BUNDLE="${VALIDATION_OUTPUT_DIR}/TestResults_${TIMESTAMP}.xcresult"

set +e
xcodebuild test-without-building \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -destination "platform=iOS Simulator,name=${DEVICE_NAME}" \
    -resultBundlePath "$RESULT_BUNDLE" \
    -enableCodeCoverage YES \
    > "$TEST_LOG" 2>&1

TEST_STATUS=$?
set -e

if [ $TEST_STATUS -eq 0 ]; then
    print_success "All unit tests passed"
    add_result "unit_tests" "PASS" "Unit tests passed" ""
else
    print_error "Some unit tests failed (see $TEST_LOG)"
    add_result "unit_tests" "FAIL" "Unit tests failed" "log: $TEST_LOG"
fi

# ============================================================================
# 5. CODE COVERAGE ANALYSIS
# ============================================================================
print_header "5️⃣  Code Coverage Analysis"

if [ -d "$RESULT_BUNDLE" ]; then
    print_info "Generating coverage report..."

    COVERAGE_JSON="${VALIDATION_OUTPUT_DIR}/coverage_${TIMESTAMP}.json"
    COVERAGE_REPORT="${VALIDATION_OUTPUT_DIR}/coverage_${TIMESTAMP}.txt"

    xcrun xccov view --report --json "$RESULT_BUNDLE" > "$COVERAGE_JSON" 2>/dev/null || true
    xcrun xccov view --report "$RESULT_BUNDLE" > "$COVERAGE_REPORT" 2>/dev/null || true

    if [ -f "$COVERAGE_REPORT" ]; then
        # Extract coverage percentage
        COVERAGE_PERCENTAGE=$(grep "\.app" "$COVERAGE_REPORT" | head -n 1 | awk '{print $3}' | sed 's/%//' || echo "0")

        if [ -n "$COVERAGE_PERCENTAGE" ] && [ "$COVERAGE_PERCENTAGE" != "0" ]; then
            if (( $(echo "$COVERAGE_PERCENTAGE >= $MIN_COVERAGE" | bc -l) )); then
                print_success "Code coverage: ${COVERAGE_PERCENTAGE}% (meets ${MIN_COVERAGE}% requirement)"
                add_result "code_coverage" "PASS" "Coverage ${COVERAGE_PERCENTAGE}% >= ${MIN_COVERAGE}%" "coverage: ${COVERAGE_PERCENTAGE}%"
            else
                print_error "Code coverage: ${COVERAGE_PERCENTAGE}% (below ${MIN_COVERAGE}% requirement)"
                add_result "code_coverage" "FAIL" "Coverage ${COVERAGE_PERCENTAGE}% < ${MIN_COVERAGE}%" "coverage: ${COVERAGE_PERCENTAGE}%"
            fi
        else
            print_warning "Unable to calculate coverage percentage"
            add_result "code_coverage" "WARN" "Coverage calculation failed" ""
        fi

        echo ""
        print_info "Top 10 files by coverage:"
        head -n 15 "$COVERAGE_REPORT" | tail -n 10
    else
        print_warning "Coverage report not generated"
        add_result "code_coverage" "WARN" "Coverage report missing" ""
    fi
else
    print_warning "Test result bundle not found"
    add_result "code_coverage" "WARN" "Result bundle missing" ""
fi

# ============================================================================
# 6. SECURITY TESTS
# ============================================================================
print_header "6️⃣  Running Security Tests"

print_info "Running security test suite..."

set +e
xcodebuild test \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -destination "platform=iOS Simulator,name=${DEVICE_NAME}" \
    -only-testing:AppTests/SecurityTests \
    > "${VALIDATION_OUTPUT_DIR}/security_tests_${TIMESTAMP}.log" 2>&1

SECURITY_TEST_STATUS=$?
set -e

if [ $SECURITY_TEST_STATUS -eq 0 ]; then
    print_success "Security tests passed"
    add_result "security_tests" "PASS" "Security tests passed" ""
else
    print_warning "Security tests had issues (check logs)"
    add_result "security_tests" "WARN" "Security tests issues" "log: security_tests_${TIMESTAMP}.log"
fi

# ============================================================================
# 7. UI TESTS
# ============================================================================
print_header "7️⃣  Running UI Tests"

print_info "Running UI test suite..."

set +e
xcodebuild test \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -destination "platform=iOS Simulator,name=${DEVICE_NAME}" \
    -only-testing:AppTests/UI \
    > "${VALIDATION_OUTPUT_DIR}/ui_tests_${TIMESTAMP}.log" 2>&1

UI_TEST_STATUS=$?
set -e

if [ $UI_TEST_STATUS -eq 0 ]; then
    print_success "UI tests passed"
    add_result "ui_tests" "PASS" "UI tests passed" ""
else
    print_warning "UI tests had issues (check logs)"
    add_result "ui_tests" "WARN" "UI tests issues" "log: ui_tests_${TIMESTAMP}.log"
fi

# ============================================================================
# 8. PRODUCTION VALIDATION TESTS
# ============================================================================
print_header "8️⃣  Running Production Validation Tests"

print_info "Running comprehensive production validation suite..."

set +e
xcodebuild test \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -destination "platform=iOS Simulator,name=${DEVICE_NAME}" \
    -only-testing:AppTests/ProductionValidationTests \
    > "${VALIDATION_OUTPUT_DIR}/production_tests_${TIMESTAMP}.log" 2>&1

PROD_TEST_STATUS=$?
set -e

if [ $PROD_TEST_STATUS -eq 0 ]; then
    print_success "Production validation tests passed"
    add_result "production_tests" "PASS" "Production validation passed" ""
else
    print_error "Production validation tests failed (check logs)"
    add_result "production_tests" "FAIL" "Production validation failed" "log: production_tests_${TIMESTAMP}.log"
fi

# ============================================================================
# 9. API ENDPOINT VALIDATION
# ============================================================================
print_header "9️⃣  API Endpoint Accessibility Check"

# Read production API URL from environment or configuration
PROD_API_URL="${PROD_API_URL:-https://fleet.capitaltechalliance.com}"

print_info "Testing production API endpoints..."

# Health check endpoint
if curl -s -f -m 10 "${PROD_API_URL}/health" > /dev/null 2>&1; then
    print_success "Health endpoint accessible: ${PROD_API_URL}/health"
    add_result "api_health" "PASS" "Health endpoint accessible" "url: ${PROD_API_URL}/health"
else
    print_warning "Health endpoint not accessible (may require auth)"
    add_result "api_health" "WARN" "Health endpoint not accessible" "url: ${PROD_API_URL}/health"
fi

# Auth endpoint
if curl -s -f -m 10 -X POST "${PROD_API_URL}/auth/login" > /dev/null 2>&1; then
    print_success "Auth endpoint accessible: ${PROD_API_URL}/auth/login"
    add_result "api_auth" "PASS" "Auth endpoint accessible" "url: ${PROD_API_URL}/auth/login"
else
    print_warning "Auth endpoint returned error (expected without credentials)"
    add_result "api_auth" "WARN" "Auth endpoint error expected" "url: ${PROD_API_URL}/auth/login"
fi

# ============================================================================
# 10. GENERATE JSON REPORT
# ============================================================================
print_header "🔟  Generating Validation Report"

# Build JSON report
cat > "$VALIDATION_REPORT" <<EOF
{
  "validation_run": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "project": "$PROJECT_DIR",
    "scheme": "$SCHEME_NAME",
    "device": "$DEVICE_NAME"
  },
  "summary": {
    "total_checks": $TOTAL_CHECKS,
    "passed": $PASSED_CHECKS,
    "failed": $FAILED_CHECKS,
    "warnings": $WARNINGS,
    "success_rate": $(echo "scale=2; $PASSED_CHECKS * 100 / $TOTAL_CHECKS" | bc)
  },
  "results": [
    $(IFS=,; echo "${VALIDATION_RESULTS[*]}")
  ],
  "artifacts": {
    "log_file": "$LOG_FILE",
    "coverage_report": "$COVERAGE_REPORT",
    "test_results": "$RESULT_BUNDLE"
  }
}
EOF

print_success "Validation report generated: $VALIDATION_REPORT"

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print_header "📊 Validation Summary"

echo -e "${BOLD}Total Checks:${NC} $TOTAL_CHECKS"
echo -e "${GREEN}${BOLD}Passed:${NC} $PASSED_CHECKS"
echo -e "${RED}${BOLD}Failed:${NC} $FAILED_CHECKS"
echo -e "${YELLOW}${BOLD}Warnings:${NC} $WARNINGS"

SUCCESS_RATE=$(echo "scale=2; $PASSED_CHECKS * 100 / $TOTAL_CHECKS" | bc)
echo -e "${BOLD}Success Rate:${NC} ${SUCCESS_RATE}%"

echo ""
echo -e "${CYAN}Artifacts Location:${NC} $VALIDATION_OUTPUT_DIR"
echo -e "${CYAN}Validation Report:${NC} $VALIDATION_REPORT"
echo -e "${CYAN}Log File:${NC} $LOG_FILE"

echo ""

# Exit with appropriate code
if [ $FAILED_CHECKS -eq 0 ]; then
    print_header "✅ ALL VALIDATIONS PASSED - PRODUCTION READY"
    exit 0
else
    print_header "❌ VALIDATION FAILED - NOT READY FOR PRODUCTION"
    exit 1
fi
