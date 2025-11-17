#!/bin/bash
#
# pre-deployment-checklist.sh
# Pre-Deployment Verification Checklist
#
# This script performs comprehensive pre-deployment verification including:
# - Build number verification and auto-increment
# - Environment variable validation
# - Info.plist completeness check
# - Debug symbols removal verification
# - Bitcode enablement check
# - Hardcoded credentials scan
# - App Store metadata validation
# - Code signing verification
# - Asset catalog validation
# - Localization completeness
#
# Exit Codes:
#   0 - All checks passed, ready for deployment
#   1 - One or more critical checks failed
#

set -u  # Exit on undefined variable

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
INFO_PLIST="${PROJECT_DIR}/App/Info.plist"
XCODE_PROJECT="${PROJECT_DIR}/App.xcodeproj"
XCODE_WORKSPACE="${PROJECT_DIR}/App.xcworkspace"
CHECKLIST_OUTPUT_DIR="${PROJECT_DIR}/deployment_output"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CHECKLIST_REPORT="${CHECKLIST_OUTPUT_DIR}/pre_deployment_${TIMESTAMP}.json"
LOG_FILE="${CHECKLIST_OUTPUT_DIR}/pre_deployment_${TIMESTAMP}.log"

# Tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0
declare -a CHECK_RESULTS=()

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}${BOLD}  $1${NC}"
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${CYAN}${BOLD}▶ $1${NC}"
    echo -e "${CYAN}$(printf '─%.0s' {1..70})${NC}"
}

print_success() {
    echo -e "${GREEN}  ✅ $1${NC}"
    ((PASSED_CHECKS++))
}

print_error() {
    echo -e "${RED}  ❌ $1${NC}"
    ((FAILED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}  ⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${CYAN}  ℹ️  $1${NC}"
}

add_check_result() {
    local check_name="$1"
    local status="$2"
    local message="$3"
    local details="${4:-}"
    local critical="${5:-false}"

    ((TOTAL_CHECKS++))

    CHECK_RESULTS+=("{\"check\":\"$check_name\",\"status\":\"$status\",\"message\":\"$message\",\"details\":\"$details\",\"critical\":$critical,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")
}

# Initialize
print_header "📋 Pre-Deployment Checklist"
echo -e "${BOLD}Fleet Manager iOS App - Deployment Verification${NC}"
echo -e "Project: ${CYAN}$PROJECT_DIR${NC}"
echo -e "Timestamp: ${CYAN}$(date)${NC}"
echo ""

mkdir -p "$CHECKLIST_OUTPUT_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

cd "$PROJECT_DIR"

# ============================================================================
# 1. BUILD NUMBER VERIFICATION
# ============================================================================
print_header "1️⃣  Build Number & Version Check"

if [ -f "$INFO_PLIST" ]; then
    CURRENT_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST" 2>/dev/null || echo "")
    CURRENT_BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST" 2>/dev/null || echo "")

    print_info "Current Version: $CURRENT_VERSION"
    print_info "Current Build: $CURRENT_BUILD"

    # Validate version format (X.Y.Z)
    if [[ "$CURRENT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_success "Version format valid: $CURRENT_VERSION"
        add_check_result "version_format" "PASS" "Valid version format" "$CURRENT_VERSION" "true"
    else
        print_error "Invalid version format: $CURRENT_VERSION (should be X.Y.Z)"
        add_check_result "version_format" "FAIL" "Invalid version format" "$CURRENT_VERSION" "true"
    fi

    # Validate build number (should be integer and incrementing)
    if [[ "$CURRENT_BUILD" =~ ^[0-9]+$ ]]; then
        print_success "Build number format valid: $CURRENT_BUILD"
        add_check_result "build_format" "PASS" "Valid build number" "$CURRENT_BUILD" "true"

        # Check if we should increment
        LAST_BUILD_FILE="${PROJECT_DIR}/.last_build_number"
        if [ -f "$LAST_BUILD_FILE" ]; then
            LAST_BUILD=$(cat "$LAST_BUILD_FILE")
            if [ "$CURRENT_BUILD" -gt "$LAST_BUILD" ]; then
                print_success "Build number incremented: $LAST_BUILD → $CURRENT_BUILD"
                add_check_result "build_increment" "PASS" "Build incremented" "from $LAST_BUILD to $CURRENT_BUILD" "true"
            elif [ "$CURRENT_BUILD" -eq "$LAST_BUILD" ]; then
                print_warning "Build number not incremented (same as last: $LAST_BUILD)"
                add_check_result "build_increment" "WARN" "Build not incremented" "$CURRENT_BUILD" "false"

                # Auto-increment option
                read -p "Auto-increment build number? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    NEW_BUILD=$((CURRENT_BUILD + 1))
                    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" "$INFO_PLIST"
                    echo "$NEW_BUILD" > "$LAST_BUILD_FILE"
                    print_success "Build number incremented to: $NEW_BUILD"
                fi
            else
                print_error "Build number decreased: $LAST_BUILD → $CURRENT_BUILD"
                add_check_result "build_increment" "FAIL" "Build decreased" "from $LAST_BUILD to $CURRENT_BUILD" "true"
            fi
        else
            # Create baseline
            echo "$CURRENT_BUILD" > "$LAST_BUILD_FILE"
            print_info "Created build number baseline: $CURRENT_BUILD"
        fi
    else
        print_error "Invalid build number format: $CURRENT_BUILD"
        add_check_result "build_format" "FAIL" "Invalid build format" "$CURRENT_BUILD" "true"
    fi
else
    print_error "Info.plist not found at: $INFO_PLIST"
    add_check_result "info_plist_exists" "FAIL" "Info.plist not found" "$INFO_PLIST" "true"
fi

# ============================================================================
# 2. ENVIRONMENT VARIABLES
# ============================================================================
print_header "2️⃣  Environment Variables Validation"

print_section "Checking Required Environment Variables"

# Required environment variables for production
REQUIRED_ENV_VARS=(
    "PROD_API_BASE_URL"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_API_KEY"
)

OPTIONAL_ENV_VARS=(
    "SENTRY_DSN"
    "MIXPANEL_TOKEN"
    "APP_STORE_CONNECT_API_KEY"
)

# Check for .env file
if [ -f "${PROJECT_DIR}/.env.production" ]; then
    print_success ".env.production file found"
    add_check_result "env_file" "PASS" "Production env file exists" ".env.production" "false"

    source "${PROJECT_DIR}/.env.production"

    # Check required variables
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if [ -n "${!var:-}" ]; then
            print_success "$var is set"
            add_check_result "env_${var}" "PASS" "$var configured" "length: ${#!var}" "true"
        else
            print_error "$var is not set"
            add_check_result "env_${var}" "FAIL" "$var not configured" "" "true"
        fi
    done

    # Check optional variables
    for var in "${OPTIONAL_ENV_VARS[@]}"; do
        if [ -n "${!var:-}" ]; then
            print_success "$var is set (optional)"
            add_check_result "env_${var}" "PASS" "$var configured" "length: ${#!var}" "false"
        else
            print_warning "$var not set (optional)"
            add_check_result "env_${var}" "WARN" "$var not configured" "" "false"
        fi
    done
else
    print_warning ".env.production file not found"
    add_check_result "env_file" "WARN" "No .env.production file" "" "false"
fi

# ============================================================================
# 3. INFO.PLIST COMPLETENESS
# ============================================================================
print_header "3️⃣  Info.plist Completeness Check"

if [ -f "$INFO_PLIST" ]; then
    print_section "Checking Required Info.plist Keys"

    REQUIRED_PLIST_KEYS=(
        "CFBundleDisplayName:Bundle Display Name"
        "CFBundleIdentifier:Bundle Identifier"
        "CFBundleShortVersionString:Version"
        "CFBundleVersion:Build Number"
        "NSLocationWhenInUseUsageDescription:Location Permission"
        "NSLocationAlwaysAndWhenInUseUsageDescription:Background Location"
        "NSBluetoothPeripheralUsageDescription:Bluetooth Permission"
        "NSCameraUsageDescription:Camera Permission"
        "NSPhotoLibraryUsageDescription:Photo Library Permission"
        "UILaunchStoryboardName:Launch Storyboard"
        "UIRequiredDeviceCapabilities:Required Capabilities"
    )

    for key_pair in "${REQUIRED_PLIST_KEYS[@]}"; do
        IFS=':' read -r key desc <<< "$key_pair"

        if /usr/libexec/PlistBuddy -c "Print :$key" "$INFO_PLIST" &>/dev/null; then
            value=$(/usr/libexec/PlistBuddy -c "Print :$key" "$INFO_PLIST" 2>/dev/null | head -n 1)
            print_success "$desc ($key): $value"
            add_check_result "plist_${key}" "PASS" "$desc present" "$value" "true"
        else
            print_error "$desc ($key) is missing"
            add_check_result "plist_${key}" "FAIL" "$desc missing" "" "true"
        fi
    done

    # Check for development-only keys that should be removed
    print_section "Checking for Development Keys"

    DEV_KEYS=(
        "NSAllowsArbitraryLoads"
        "UIFileSharingEnabled"
    )

    for key in "${DEV_KEYS[@]}"; do
        if /usr/libexec/PlistBuddy -c "Print :$key" "$INFO_PLIST" &>/dev/null; then
            print_warning "$key found (should be removed for production)"
            add_check_result "dev_key_${key}" "WARN" "Development key present" "$key" "false"
        else
            print_success "$key not present (good)"
            add_check_result "dev_key_${key}" "PASS" "Development key removed" "$key" "false"
        fi
    done
fi

# ============================================================================
# 4. DEBUG SYMBOLS CHECK
# ============================================================================
print_header "4️⃣  Debug Symbols & Build Configuration"

print_section "Checking Build Settings"

# This would typically check the actual build output
# For now, we check project settings

if [ -d "$XCODE_PROJECT" ]; then
    PROJECT_FILE="${XCODE_PROJECT}/project.pbxproj"

    if [ -f "$PROJECT_FILE" ]; then
        # Check for debug settings in Release configuration
        if grep -q "DEBUG_INFORMATION_FORMAT = \"dwarf-with-dsym\"" "$PROJECT_FILE"; then
            print_success "dSYM generation enabled for Release build"
            add_check_result "dsym_enabled" "PASS" "dSYM generation enabled" "" "false"
        else
            print_warning "dSYM generation may not be configured"
            add_check_result "dsym_enabled" "WARN" "dSYM configuration unclear" "" "false"
        fi

        # Check optimization level
        if grep -q "GCC_OPTIMIZATION_LEVEL.*-Os\|GCC_OPTIMIZATION_LEVEL.*-O2\|GCC_OPTIMIZATION_LEVEL.*-O3" "$PROJECT_FILE"; then
            print_success "Optimization enabled for Release build"
            add_check_result "optimization" "PASS" "Optimization enabled" "" "false"
        else
            print_warning "Optimization level not detected"
            add_check_result "optimization" "WARN" "Optimization unclear" "" "false"
        fi

        # Check Swift optimization
        if grep -q "SWIFT_OPTIMIZATION_LEVEL.*-O" "$PROJECT_FILE"; then
            print_success "Swift optimization enabled"
            add_check_result "swift_optimization" "PASS" "Swift optimization enabled" "" "false"
        fi
    fi
fi

# ============================================================================
# 5. BITCODE VERIFICATION
# ============================================================================
print_header "5️⃣  Bitcode & Build Options"

print_section "Checking Bitcode Settings"

if [ -f "$PROJECT_FILE" ]; then
    # Note: Bitcode is deprecated in Xcode 14+, check if present
    if grep -q "ENABLE_BITCODE.*YES" "$PROJECT_FILE"; then
        print_info "Bitcode enabled (deprecated in Xcode 14+)"
        add_check_result "bitcode" "INFO" "Bitcode enabled" "deprecated" "false"
    else
        print_info "Bitcode not enabled (expected for modern Xcode)"
        add_check_result "bitcode" "INFO" "Bitcode disabled" "modern xcode" "false"
    fi

    # Check app thinning
    if /usr/libexec/PlistBuddy -c "Print :UIDeviceFamily" "$INFO_PLIST" &>/dev/null; then
        print_success "Device family configured for app thinning"
        add_check_result "app_thinning" "PASS" "Device family set" "" "false"
    fi
fi

# ============================================================================
# 6. HARDCODED CREDENTIALS SCAN
# ============================================================================
print_header "6️⃣  Security: Hardcoded Credentials Scan"

print_section "Scanning for Hardcoded Secrets"

# Comprehensive credential patterns
CREDENTIAL_PATTERNS=(
    "password\s*=\s*['\"][^'\"]{6,}"
    "api[_-]?key\s*=\s*['\"][^'\"]{6,}"
    "secret\s*=\s*['\"][^'\"]{6,}"
    "token\s*=\s*['\"][^'\"]{20,}"
    "aws[_-]?access[_-]?key"
    "private[_-]?key"
    "-----BEGIN.*PRIVATE KEY-----"
    "sk_live_[a-zA-Z0-9]+"
    "pk_live_[a-zA-Z0-9]+"
)

TOTAL_CREDENTIAL_ISSUES=0

for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
    FOUND=$(find "$PROJECT_DIR/App" -type f \( -name "*.swift" -o -name "*.m" -o -name "*.h" \) -exec grep -iE "$pattern" {} \; 2>/dev/null | wc -l | tr -d ' ')

    if [ "$FOUND" -gt 0 ]; then
        print_error "Found $FOUND matches for pattern: $pattern"
        ((TOTAL_CREDENTIAL_ISSUES+=FOUND))
    fi
done

if [ "$TOTAL_CREDENTIAL_ISSUES" -eq 0 ]; then
    print_success "No hardcoded credentials detected"
    add_check_result "credentials_scan" "PASS" "No credentials found" "" "true"
else
    print_error "Found $TOTAL_CREDENTIAL_ISSUES potential hardcoded credentials"
    add_check_result "credentials_scan" "FAIL" "Credentials detected" "count: $TOTAL_CREDENTIAL_ISSUES" "true"
fi

# Check for .env in version control
if git ls-files --error-unmatch .env &>/dev/null 2>&1; then
    print_error ".env file is tracked in git (should be in .gitignore)"
    add_check_result "env_git" "FAIL" ".env tracked in git" "" "true"
else
    print_success ".env files not tracked in git"
    add_check_result "env_git" "PASS" ".env ignored" "" "true"
fi

# ============================================================================
# 7. APP STORE METADATA VALIDATION
# ============================================================================
print_header "7️⃣  App Store Metadata Validation"

print_section "Checking App Store Metadata"

METADATA_DIR="${PROJECT_DIR}/fastlane/metadata"

if [ -d "$METADATA_DIR" ]; then
    print_success "Metadata directory found"
    add_check_result "metadata_dir" "PASS" "Metadata directory exists" "" "false"

    # Check for required metadata files
    REQUIRED_METADATA=(
        "en-US/name.txt:App Name"
        "en-US/subtitle.txt:App Subtitle"
        "en-US/description.txt:Description"
        "en-US/keywords.txt:Keywords"
        "en-US/marketing_url.txt:Marketing URL"
        "en-US/privacy_url.txt:Privacy Policy URL"
    )

    for file_pair in "${REQUIRED_METADATA[@]}"; do
        IFS=':' read -r file desc <<< "$file_pair"

        if [ -f "${METADATA_DIR}/${file}" ]; then
            size=$(wc -c < "${METADATA_DIR}/${file}" | tr -d ' ')
            print_success "$desc found (${size} bytes)"
            add_check_result "metadata_${desc// /_}" "PASS" "$desc exists" "size: ${size}" "false"
        else
            print_warning "$desc missing: ${file}"
            add_check_result "metadata_${desc// /_}" "WARN" "$desc missing" "$file" "false"
        fi
    done

    # Check for screenshots
    SCREENSHOT_DIR="${METADATA_DIR}/en-US/screenshots"
    if [ -d "$SCREENSHOT_DIR" ]; then
        SCREENSHOT_COUNT=$(find "$SCREENSHOT_DIR" -type f \( -name "*.png" -o -name "*.jpg" \) 2>/dev/null | wc -l | tr -d ' ')
        if [ "$SCREENSHOT_COUNT" -ge 2 ]; then
            print_success "Screenshots found: $SCREENSHOT_COUNT"
            add_check_result "screenshots" "PASS" "Screenshots present" "count: $SCREENSHOT_COUNT" "false"
        else
            print_warning "Only $SCREENSHOT_COUNT screenshots found (need at least 2)"
            add_check_result "screenshots" "WARN" "Insufficient screenshots" "count: $SCREENSHOT_COUNT" "false"
        fi
    else
        print_warning "Screenshot directory not found"
        add_check_result "screenshots" "WARN" "No screenshots" "" "false"
    fi
else
    print_warning "Metadata directory not found at: $METADATA_DIR"
    add_check_result "metadata_dir" "WARN" "Metadata directory missing" "" "false"
fi

# ============================================================================
# 8. CODE SIGNING VERIFICATION
# ============================================================================
print_header "8️⃣  Code Signing Configuration"

print_section "Checking Code Signing Settings"

# Check for provisioning profiles
PROFILES_DIR="${HOME}/Library/MobileDevice/Provisioning Profiles"

if [ -d "$PROFILES_DIR" ]; then
    PROFILE_COUNT=$(find "$PROFILES_DIR" -name "*.mobileprovision" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$PROFILE_COUNT" -gt 0 ]; then
        print_success "Found $PROFILE_COUNT provisioning profile(s)"
        add_check_result "provisioning_profiles" "PASS" "Profiles found" "count: $PROFILE_COUNT" "false"
    else
        print_warning "No provisioning profiles found"
        add_check_result "provisioning_profiles" "WARN" "No profiles" "" "false"
    fi
fi

# Check for valid certificates
if security find-identity -v -p codesigning | grep -q "iPhone Distribution"; then
    print_success "Distribution certificate found"
    add_check_result "distribution_cert" "PASS" "Distribution cert present" "" "false"
else
    print_warning "Distribution certificate not found (may need to be installed)"
    add_check_result "distribution_cert" "WARN" "No distribution cert" "" "false"
fi

# ============================================================================
# 9. ASSET CATALOG VALIDATION
# ============================================================================
print_header "9️⃣  Asset Catalog Validation"

print_section "Checking App Icons and Assets"

ASSETS_DIR="${PROJECT_DIR}/App/Assets.xcassets"

if [ -d "$ASSETS_DIR" ]; then
    print_success "Assets catalog found"
    add_check_result "assets_catalog" "PASS" "Assets catalog exists" "" "true"

    # Check for app icon
    if [ -d "${ASSETS_DIR}/AppIcon.appiconset" ]; then
        ICON_COUNT=$(find "${ASSETS_DIR}/AppIcon.appiconset" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')

        if [ "$ICON_COUNT" -ge 1 ]; then
            print_success "App icons found: $ICON_COUNT"
            add_check_result "app_icons" "PASS" "App icons present" "count: $ICON_COUNT" "true"
        else
            print_error "No app icons found"
            add_check_result "app_icons" "FAIL" "No app icons" "" "true"
        fi

        # Check Contents.json
        if [ -f "${ASSETS_DIR}/AppIcon.appiconset/Contents.json" ]; then
            print_success "App icon Contents.json found"
            add_check_result "icon_manifest" "PASS" "Icon manifest exists" "" "false"
        else
            print_warning "App icon Contents.json missing"
            add_check_result "icon_manifest" "WARN" "Icon manifest missing" "" "false"
        fi
    else
        print_error "AppIcon.appiconset not found"
        add_check_result "app_icons" "FAIL" "AppIcon set missing" "" "true"
    fi

    # Check for launch images
    if [ -d "${ASSETS_DIR}/LaunchImage.launchimage" ] || [ -f "${PROJECT_DIR}/App/Resources/LaunchScreen.storyboard" ]; then
        print_success "Launch screen configured"
        add_check_result "launch_screen" "PASS" "Launch screen exists" "" "false"
    else
        print_warning "Launch screen not found"
        add_check_result "launch_screen" "WARN" "Launch screen missing" "" "false"
    fi
else
    print_error "Assets catalog not found"
    add_check_result "assets_catalog" "FAIL" "Assets catalog missing" "" "true"
fi

# ============================================================================
# 10. LOCALIZATION VALIDATION
# ============================================================================
print_header "🔟  Localization Validation"

print_section "Checking Localization Files"

RESOURCES_DIR="${PROJECT_DIR}/App/Resources"

if [ -d "$RESOURCES_DIR" ]; then
    # Find all .lproj directories
    LPROJ_COUNT=$(find "$RESOURCES_DIR" -name "*.lproj" -type d 2>/dev/null | wc -l | tr -d ' ')

    if [ "$LPROJ_COUNT" -gt 0 ]; then
        print_success "Found $LPROJ_COUNT localization(s)"
        add_check_result "localizations" "PASS" "Localizations present" "count: $LPROJ_COUNT" "false"

        # Check for en.lproj
        if [ -d "${RESOURCES_DIR}/en.lproj" ]; then
            if [ -f "${RESOURCES_DIR}/en.lproj/Localizable.strings" ]; then
                STRING_COUNT=$(grep -c "=" "${RESOURCES_DIR}/en.lproj/Localizable.strings" 2>/dev/null || echo "0")
                print_success "English localization found: $STRING_COUNT strings"
                add_check_result "en_localization" "PASS" "English strings present" "count: $STRING_COUNT" "false"
            else
                print_warning "Localizable.strings not found in en.lproj"
                add_check_result "en_localization" "WARN" "English strings missing" "" "false"
            fi
        fi
    else
        print_warning "No localizations found"
        add_check_result "localizations" "WARN" "No localizations" "" "false"
    fi
fi

# ============================================================================
# GENERATE JSON REPORT
# ============================================================================
print_header "📊 Generating Checklist Report"

# Count critical failures
CRITICAL_FAILURES=0
for result in "${CHECK_RESULTS[@]}"; do
    if echo "$result" | grep -q "\"status\":\"FAIL\"" && echo "$result" | grep -q "\"critical\":true"; then
        ((CRITICAL_FAILURES++))
    fi
done

# Build JSON report
cat > "$CHECKLIST_REPORT" <<EOF
{
  "deployment_checklist": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "project": "$PROJECT_DIR",
    "version": "$CURRENT_VERSION",
    "build": "$CURRENT_BUILD"
  },
  "summary": {
    "total_checks": $TOTAL_CHECKS,
    "passed": $PASSED_CHECKS,
    "failed": $FAILED_CHECKS,
    "warnings": $WARNINGS,
    "critical_failures": $CRITICAL_FAILURES,
    "ready_for_deployment": $([ $CRITICAL_FAILURES -eq 0 ] && echo "true" || echo "false")
  },
  "checks": [
    $(IFS=,; echo "${CHECK_RESULTS[*]}")
  ],
  "artifacts": {
    "log_file": "$LOG_FILE",
    "info_plist": "$INFO_PLIST"
  }
}
EOF

print_success "Checklist report generated: $CHECKLIST_REPORT"

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print_header "📋 Pre-Deployment Summary"

echo -e "${BOLD}Version:${NC} $CURRENT_VERSION"
echo -e "${BOLD}Build:${NC} $CURRENT_BUILD"
echo ""
echo -e "${BOLD}Total Checks:${NC} $TOTAL_CHECKS"
echo -e "${GREEN}${BOLD}Passed:${NC} $PASSED_CHECKS"
echo -e "${RED}${BOLD}Failed:${NC} $FAILED_CHECKS"
echo -e "${YELLOW}${BOLD}Warnings:${NC} $WARNINGS"
echo -e "${RED}${BOLD}Critical Failures:${NC} $CRITICAL_FAILURES"

echo ""
echo -e "${CYAN}Report Location:${NC} $CHECKLIST_REPORT"
echo -e "${CYAN}Log File:${NC} $LOG_FILE"

echo ""

# Final decision
if [ $CRITICAL_FAILURES -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        print_header "✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT"
        exit 0
    else
        print_header "⚠️  PASSED WITH WARNINGS - REVIEW BEFORE DEPLOYMENT"
        echo -e "${YELLOW}Please review $WARNINGS warning(s) before deploying${NC}"
        exit 0
    fi
else
    print_header "❌ CRITICAL FAILURES - NOT READY FOR DEPLOYMENT"
    echo -e "${RED}Fix $CRITICAL_FAILURES critical issue(s) before deploying${NC}"
    exit 1
fi
