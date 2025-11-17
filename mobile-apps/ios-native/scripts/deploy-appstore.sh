#!/bin/bash
# deploy-appstore.sh - Deploy to App Store (Production)
# Usage: ./scripts/deploy-appstore.sh [submit-for-review]

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SUBMIT_FOR_REVIEW="${1:-false}"

# Function to print messages
print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

print_header() {
    echo ""
    print_message "$MAGENTA" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$MAGENTA" "$1"
    print_message "$MAGENTA" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Change to project directory
cd "$PROJECT_DIR"

print_header "🚀 App Store Production Deployment"

print_message "$RED" "⚠️  WARNING: This will deploy to the PRODUCTION App Store!"
print_message "$RED" "⚠️  This action should only be performed for official releases."
echo ""

# Check current git branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    print_message "$RED" "❌ Error: Production deployments must be from main/master branch"
    print_message "$RED" "Current branch: ${CURRENT_BRANCH}"
    exit 1
fi

print_message "$GREEN" "✅ On main branch: ${CURRENT_BRANCH}"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_message "$RED" "❌ Error: Uncommitted changes detected"
    print_message "$RED" "Please commit or stash your changes before deploying."
    git status --short
    exit 1
fi

print_message "$GREEN" "✅ No uncommitted changes"
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
    print_message "$NC" "You may be prompted for your app-specific password"
fi

if [ -z "${MATCH_PASSWORD:-}" ]; then
    print_message "$YELLOW" "⚠️  MATCH_PASSWORD not set (optional)"
fi

print_message "$GREEN" "✅ Apple ID: ${APPLE_ID}"
echo ""

# Extract version info
print_header "📱 App Information"

VERSION=$(grep -A1 "CFBundleShortVersionString" App/Info.plist | grep string | sed 's/.*<string>\(.*\)<\/string>.*/\1/')
BUILD=$(grep -A1 "CFBundleVersion" App/Info.plist | grep string | sed 's/.*<string>\(.*\)<\/string>.*/\1/')

print_message "$BLUE" "App Name: DCF Fleet Management"
print_message "$BLUE" "Version: ${VERSION}"
print_message "$BLUE" "Build: ${BUILD}"
print_message "$BLUE" "Branch: ${CURRENT_BRANCH}"
print_message "$BLUE" "Commit: $(git rev-parse --short HEAD)"
echo ""

# Check for git tag
GIT_TAG="v${VERSION}-${BUILD}"
if git rev-parse "$GIT_TAG" >/dev/null 2>&1; then
    print_message "$YELLOW" "⚠️  Tag ${GIT_TAG} already exists"
else
    print_message "$BLUE" "ℹ️  Will create tag: ${GIT_TAG}"
fi
echo ""

# Check changelog
print_header "📝 Release Notes"

if [ -f "CHANGELOG.md" ]; then
    print_message "$GREEN" "✅ CHANGELOG.md found"
    echo ""
    print_message "$BLUE" "Recent changelog entries:"
    head -n 15 CHANGELOG.md
else
    print_message "$YELLOW" "⚠️  No CHANGELOG.md found"
fi
echo ""

# Pre-flight checklist
print_header "✅ Pre-flight Checklist"

echo "Please confirm the following:"
echo ""
echo "  [ ] All features are complete and tested"
echo "  [ ] App Store assets are up to date (screenshots, description, etc.)"
echo "  [ ] Version number is correct: ${VERSION}"
echo "  [ ] Release notes are prepared"
echo "  [ ] All team members have been notified"
echo "  [ ] Compliance and legal requirements are met"
echo "  [ ] Privacy policy is current"
echo "  [ ] This release is approved for production"
echo ""

read -p "Have you completed the above checklist? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_message "$RED" "❌ Deployment cancelled"
    print_message "$YELLOW" "Please complete the checklist before deploying."
    exit 1
fi
echo ""

# Final confirmation
print_message "$RED" "⚠️  FINAL CONFIRMATION"
print_message "$RED" "⚠️  You are about to deploy version ${VERSION} (build ${BUILD}) to the App Store."
print_message "$RED" "⚠️  This action cannot be undone."
echo ""

if [ "$SUBMIT_FOR_REVIEW" = "true" ] || [ "$SUBMIT_FOR_REVIEW" = "submit-for-review" ]; then
    print_message "$RED" "⚠️  The app will be AUTOMATICALLY SUBMITTED FOR REVIEW."
fi
echo ""

read -p "Type 'DEPLOY' to confirm production deployment: " -r
echo
if [ "$REPLY" != "DEPLOY" ]; then
    print_message "$RED" "❌ Deployment cancelled"
    exit 1
fi
echo ""

# Run comprehensive tests
print_header "🧪 Running Production Tests"

if [ -f "${SCRIPT_DIR}/test.sh" ]; then
    bash "${SCRIPT_DIR}/test.sh" || {
        print_message "$RED" "❌ Tests failed!"
        print_message "$RED" "Production deployment requires all tests to pass."
        read -p "Override and continue anyway? (yes/no) " -r
        echo
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            exit 1
        fi
        print_message "$YELLOW" "⚠️  Continuing despite test failures..."
    }
else
    print_message "$YELLOW" "⚠️  Test script not found, skipping tests"
fi
echo ""

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

# Deploy to App Store using Fastlane
print_header "🚀 Deploying to App Store"

print_message "$BLUE" "Building and uploading to App Store Connect..."
echo ""

# Export authentication
export FASTLANE_USER="${APPLE_ID}"

# Run Fastlane release lane
if fastlane release; then
    print_message "$GREEN" "✅ Successfully uploaded to App Store!"
else
    print_message "$RED" "❌ App Store deployment failed!"
    exit 1
fi
echo ""

# Submit for review if requested
if [ "$SUBMIT_FOR_REVIEW" = "true" ] || [ "$SUBMIT_FOR_REVIEW" = "submit-for-review" ]; then
    print_header "📮 Submitting for App Store Review"

    if fastlane submit_review; then
        print_message "$GREEN" "✅ Successfully submitted for review!"
    else
        print_message "$RED" "❌ Review submission failed!"
        print_message "$YELLOW" "You can submit manually from App Store Connect."
    fi
    echo ""
fi

# Create git tag
print_header "🏷️  Creating Git Tag"

if ! git rev-parse "$GIT_TAG" >/dev/null 2>&1; then
    git tag -a "$GIT_TAG" -m "Release v${VERSION} (${BUILD})"
    git push origin "$GIT_TAG"
    print_message "$GREEN" "✅ Created and pushed tag: ${GIT_TAG}"
else
    print_message "$YELLOW" "⚠️  Tag ${GIT_TAG} already exists"
fi
echo ""

# Deployment summary
print_header "📊 Deployment Summary"

print_message "$GREEN" "═══════════════════════════════════════════════════"
print_message "$GREEN" "  🎉 Production Deployment Successful!"
print_message "$GREEN" "═══════════════════════════════════════════════════"
echo ""
print_message "$BLUE" "App: DCF Fleet Management"
print_message "$BLUE" "Version: ${VERSION}"
print_message "$BLUE" "Build: ${BUILD}"
print_message "$BLUE" "Environment: Production"
print_message "$BLUE" "Git Tag: ${GIT_TAG}"
print_message "$BLUE" "Commit: $(git rev-parse --short HEAD)"
echo ""

if [ "$SUBMIT_FOR_REVIEW" = "true" ] || [ "$SUBMIT_FOR_REVIEW" = "submit-for-review" ]; then
    print_message "$GREEN" "✅ Submitted for App Store review"
    echo ""
    print_message "$BLUE" "Next Steps:"
    print_message "$NC" "1. Wait for Apple's review (typically 1-3 days)"
    print_message "$NC" "2. Respond to any review questions promptly"
    print_message "$NC" "3. Monitor App Store Connect for status updates"
    print_message "$NC" "4. Prepare support team for release"
else
    print_message "$YELLOW" "ℹ️  Not submitted for review"
    echo ""
    print_message "$BLUE" "Next Steps:"
    print_message "$NC" "1. Wait for Apple to process the build (5-15 minutes)"
    print_message "$NC" "2. Check App Store Connect for build status"
    print_message "$NC" "3. Complete App Store listing information"
    print_message "$NC" "4. Submit for review when ready"
fi
echo ""

print_message "$BLUE" "Links:"
print_message "$NC" "App Store Connect: https://appstoreconnect.apple.com/apps"
print_message "$NC" "App Analytics: https://analytics.appstoreconnect.apple.com"
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

# Send notification (if configured)
if command -v osascript &> /dev/null; then
    osascript -e "display notification \"Version ${VERSION} deployed to App Store\" with title \"Deployment Successful\" sound name \"Glass\""
fi
