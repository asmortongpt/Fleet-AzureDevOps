#!/bin/bash
# deploy-testflight.sh - Deploy to TestFlight (Staging)
# Usage: ./scripts/deploy-testflight.sh [skip-tests]

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
SKIP_TESTS="${1:-false}"

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

print_header "🚀 TestFlight Deployment Script"

print_message "$BLUE" "This script will deploy the iOS app to TestFlight for internal testing."
echo ""

# Check for required tools
print_header "🔍 Checking Prerequisites"

MISSING_TOOLS=()

if ! command -v fastlane &> /dev/null; then
    print_message "$YELLOW" "⚠️  Fastlane not found"
    MISSING_TOOLS+=("fastlane")
else
    print_message "$GREEN" "✅ Fastlane found: $(fastlane --version | head -n 1)"
fi

if ! command -v xcodebuild &> /dev/null; then
    print_message "$RED" "❌ Xcode not found"
    exit 1
else
    print_message "$GREEN" "✅ Xcode found: $(xcodebuild -version | head -n 1)"
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    print_message "$YELLOW" "Installing missing tools..."

    for tool in "${MISSING_TOOLS[@]}"; do
        if [ "$tool" = "fastlane" ]; then
            gem install fastlane
            print_message "$GREEN" "✅ Installed fastlane"
        fi
    done
fi
echo ""

# Check environment variables
print_header "🔐 Checking Authentication"

if [ -z "${APPLE_ID:-}" ]; then
    print_message "$YELLOW" "⚠️  APPLE_ID not set"
    read -p "Enter your Apple ID: " APPLE_ID
    export APPLE_ID
fi

if [ -z "${FASTLANE_PASSWORD:-}" ]; then
    print_message "$YELLOW" "⚠️  FASTLANE_PASSWORD not set"
    print_message "$NC" "Using app-specific password from keychain or prompting..."
fi

if [ -z "${MATCH_PASSWORD:-}" ]; then
    print_message "$YELLOW" "⚠️  MATCH_PASSWORD not set (optional, may be prompted)"
fi

print_message "$GREEN" "✅ Apple ID: ${APPLE_ID}"
echo ""

# Extract version info
print_header "📱 App Information"

VERSION=$(grep -A1 "CFBundleShortVersionString" App/Info.plist | grep string | sed 's/.*<string>\(.*\)<\/string>.*/\1/')
BUILD=$(grep -A1 "CFBundleVersion" App/Info.plist | grep string | sed 's/.*<string>\(.*\)<\/string>.*/\1/')

print_message "$BLUE" "Version: ${VERSION}"
print_message "$BLUE" "Build: ${BUILD}"
echo ""

# Confirm deployment
print_message "$YELLOW" "⚠️  This will deploy to TestFlight!"
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_message "$RED" "❌ Deployment cancelled"
    exit 1
fi
echo ""

# Run tests (unless skipped)
if [ "$SKIP_TESTS" != "true" ] && [ "$SKIP_TESTS" != "skip-tests" ]; then
    print_header "🧪 Running Tests"

    if [ -f "${SCRIPT_DIR}/test.sh" ]; then
        bash "${SCRIPT_DIR}/test.sh" || {
            print_message "$RED" "❌ Tests failed!"
            read -p "Continue anyway? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        }
    else
        print_message "$YELLOW" "⚠️  Test script not found, skipping tests"
    fi
    echo ""
else
    print_message "$YELLOW" "⚠️  Skipping tests as requested"
    echo ""
fi

# Install dependencies
print_header "📦 Installing Dependencies"

if [ -f "Podfile" ]; then
    if ! command -v pod &> /dev/null; then
        print_message "$YELLOW" "⚠️  CocoaPods not found. Installing..."
        gem install cocoapods
    fi

    pod install --repo-update
    print_message "$GREEN" "✅ Dependencies installed"
else
    print_message "$BLUE" "ℹ️  No Podfile found, skipping CocoaPods"
fi
echo ""

# Deploy to TestFlight using Fastlane
print_header "🚀 Deploying to TestFlight"

print_message "$BLUE" "Building and uploading to TestFlight..."
echo ""

# Export authentication
export FASTLANE_USER="${APPLE_ID}"

# Run Fastlane beta lane
if fastlane beta; then
    print_message "$GREEN" "✅ Successfully deployed to TestFlight!"
else
    print_message "$RED" "❌ TestFlight deployment failed!"
    exit 1
fi
echo ""

# Deployment summary
print_header "📊 Deployment Summary"

print_message "$GREEN" "App: DCF Fleet Management"
print_message "$GREEN" "Version: ${VERSION}"
print_message "$GREEN" "Build: ${BUILD}"
print_message "$GREEN" "Environment: Staging"
print_message "$GREEN" "Destination: TestFlight (Internal Testing)"
echo ""

print_message "$BLUE" "Next Steps:"
print_message "$NC" "1. Wait for Apple to process the build (5-15 minutes)"
print_message "$NC" "2. Check App Store Connect for build status"
print_message "$NC" "3. Add the build to internal testing group"
print_message "$NC" "4. Notify testers"
echo ""

print_message "$BLUE" "Links:"
print_message "$NC" "App Store Connect: https://appstoreconnect.apple.com"
print_message "$NC" "TestFlight: https://testflight.apple.com"
echo ""

print_message "$GREEN" "🎉 Deployment completed successfully!"
echo ""

# Open App Store Connect (optional)
if command -v open &> /dev/null; then
    read -p "Do you want to open App Store Connect? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://appstoreconnect.apple.com/apps"
    fi
fi
