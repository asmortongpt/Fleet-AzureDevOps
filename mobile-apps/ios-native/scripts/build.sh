#!/bin/bash
# build.sh - Build script for iOS app
# Usage: ./scripts/build.sh [configuration] [output_dir]

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
CONFIGURATION="${1:-Release}"
OUTPUT_DIR="${2:-${PROJECT_DIR}/builds}"
BUILD_DATE=$(date +%Y%m%d_%H%M%S)

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

print_header "🏗️  iOS Build Script"

print_message "$BLUE" "Configuration:"
print_message "$NC" "  Project: ${XCODE_PROJECT}"
print_message "$NC" "  Scheme: ${SCHEME_NAME}"
print_message "$NC" "  Configuration: ${CONFIGURATION}"
print_message "$NC" "  Output Directory: ${OUTPUT_DIR}"
echo ""

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    print_message "$RED" "❌ Error: xcodebuild not found. Please install Xcode."
    exit 1
fi

print_message "$GREEN" "✅ Xcode found: $(xcodebuild -version | head -n 1)"
echo ""

# Install dependencies if needed
if [ -f "Podfile" ]; then
    print_header "📦 Installing CocoaPods Dependencies"

    if ! command -v pod &> /dev/null; then
        print_message "$YELLOW" "⚠️  CocoaPods not found. Installing..."
        gem install cocoapods
    fi

    pod install --repo-update
    print_message "$GREEN" "✅ Dependencies installed"
    echo ""
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Determine workspace or project
if [ -f "$XCODE_WORKSPACE" ]; then
    BUILD_TARGET="-workspace $XCODE_WORKSPACE"
    print_message "$BLUE" "Using workspace: $XCODE_WORKSPACE"
else
    BUILD_TARGET="-project $XCODE_PROJECT"
    print_message "$BLUE" "Using project: $XCODE_PROJECT"
fi
echo ""

# Clean build folder
print_header "🧹 Cleaning Build Folder"
xcodebuild clean \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -configuration "$CONFIGURATION" \
    | xcpretty || true

print_message "$GREEN" "✅ Build folder cleaned"
echo ""

# Build for device
print_header "🔨 Building for Device"

xcodebuild archive \
    $BUILD_TARGET \
    -scheme "$SCHEME_NAME" \
    -configuration "$CONFIGURATION" \
    -archivePath "${OUTPUT_DIR}/${SCHEME_NAME}_${BUILD_DATE}.xcarchive" \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    | xcpretty

if [ $? -eq 0 ]; then
    print_message "$GREEN" "✅ Build successful!"
    print_message "$NC" "Archive location: ${OUTPUT_DIR}/${SCHEME_NAME}_${BUILD_DATE}.xcarchive"
else
    print_message "$RED" "❌ Build failed!"
    exit 1
fi
echo ""

# Build summary
print_header "📊 Build Summary"
print_message "$GREEN" "Configuration: ${CONFIGURATION}"
print_message "$GREEN" "Archive: ${SCHEME_NAME}_${BUILD_DATE}.xcarchive"
print_message "$GREEN" "Location: ${OUTPUT_DIR}"

# Calculate size
if [ -d "${OUTPUT_DIR}/${SCHEME_NAME}_${BUILD_DATE}.xcarchive" ]; then
    ARCHIVE_SIZE=$(du -sh "${OUTPUT_DIR}/${SCHEME_NAME}_${BUILD_DATE}.xcarchive" | cut -f1)
    print_message "$GREEN" "Size: ${ARCHIVE_SIZE}"
fi
echo ""

print_message "$GREEN" "✅ Build completed successfully!"
echo ""

# Export IPA (optional)
read -p "Do you want to export IPA? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_header "📦 Exporting IPA"

    # Check for ExportOptions.plist
    if [ ! -f "ExportOptions.plist" ]; then
        print_message "$YELLOW" "⚠️  ExportOptions.plist not found. Creating default..."

        cat > ExportOptions.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>FFC6NRQ5U5</string>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
EOF
    fi

    xcodebuild -exportArchive \
        -archivePath "${OUTPUT_DIR}/${SCHEME_NAME}_${BUILD_DATE}.xcarchive" \
        -exportPath "${OUTPUT_DIR}/IPA" \
        -exportOptionsPlist ExportOptions.plist \
        | xcpretty

    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✅ IPA exported successfully!"
        print_message "$NC" "IPA location: ${OUTPUT_DIR}/IPA"

        IPA_FILE=$(find "${OUTPUT_DIR}/IPA" -name "*.ipa" | head -n 1)
        if [ -n "$IPA_FILE" ]; then
            IPA_SIZE=$(du -sh "$IPA_FILE" | cut -f1)
            print_message "$GREEN" "IPA size: ${IPA_SIZE}"
        fi
    else
        print_message "$RED" "❌ IPA export failed!"
    fi
fi

echo ""
print_message "$GREEN" "🎉 All done!"
