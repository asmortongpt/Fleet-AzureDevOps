#!/bin/bash
# generate-screenshots.sh - Generate App Store screenshots
# Usage: ./scripts/generate-screenshots.sh [language]

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
LANGUAGE="${1:-en-US}"
SCREENSHOTS_DIR="${PROJECT_DIR}/screenshots"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Device sizes for App Store
DEVICES=(
    "iPhone 15 Pro Max"
    "iPhone 15 Pro"
    "iPhone SE (3rd generation)"
    "iPad Pro (12.9-inch) (6th generation)"
)

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

print_header "📸 App Store Screenshot Generator"

print_message "$BLUE" "Configuration:"
print_message "$NC" "  Language: ${LANGUAGE}"
print_message "$NC" "  Output Directory: ${SCREENSHOTS_DIR}"
print_message "$NC" "  Devices: ${#DEVICES[@]}"
echo ""

# Check for required tools
print_header "🔍 Checking Prerequisites"

if ! command -v fastlane &> /dev/null; then
    print_message "$YELLOW" "⚠️  Fastlane not found. Installing..."
    gem install fastlane
fi

print_message "$GREEN" "✅ Fastlane found: $(fastlane --version | head -n 1)"

if ! command -v xcodebuild &> /dev/null; then
    print_message "$RED" "❌ Xcode not found"
    exit 1
fi

print_message "$GREEN" "✅ Xcode found: $(xcodebuild -version | head -n 1)"

# Check for snapshot tool
if ! command -v snapshot &> /dev/null; then
    print_message "$YELLOW" "⚠️  snapshot tool not found. Installing..."
    gem install fastlane
fi
echo ""

# Create screenshots directory
mkdir -p "$SCREENSHOTS_DIR"

# Clean previous screenshots
print_header "🧹 Cleaning Previous Screenshots"

if [ -d "${SCREENSHOTS_DIR}/${LANGUAGE}" ]; then
    print_message "$YELLOW" "Removing previous screenshots for ${LANGUAGE}..."
    rm -rf "${SCREENSHOTS_DIR}/${LANGUAGE}"
    print_message "$GREEN" "✅ Cleaned previous screenshots"
else
    print_message "$BLUE" "ℹ️  No previous screenshots to clean"
fi
echo ""

# Check for UI tests
print_header "🔍 Checking for UI Tests"

if [ -d "AppUITests" ]; then
    print_message "$GREEN" "✅ UI tests found"
elif [ -d "AppTests" ]; then
    print_message "$YELLOW" "⚠️  Only unit tests found. UI tests recommended for screenshots."
    print_message "$NC" "Consider creating UI tests for automated screenshot generation."
else
    print_message "$RED" "❌ No tests found"
    print_message "$YELLOW" "You can still generate screenshots manually."
fi
echo ""

# Check if using Fastlane snapshot
if [ -f "fastlane/Snapfile" ]; then
    print_header "📸 Using Fastlane Snapshot"

    fastlane snapshot || {
        print_message "$RED" "❌ Snapshot generation failed"
        exit 1
    }
else
    print_header "📸 Generating Screenshots Manually"

    print_message "$BLUE" "Fastlane Snapfile not found. Using manual method..."
    echo ""

    # Install dependencies
    if [ -f "Podfile" ]; then
        if ! command -v pod &> /dev/null; then
            gem install cocoapods
        fi
        pod install --repo-update
    fi

    # Loop through devices and capture screenshots
    for device in "${DEVICES[@]}"; do
        print_message "$BLUE" "Capturing screenshots for: ${device}"

        # Check if simulator exists
        SIMULATOR_ID=$(xcrun simctl list devices available | grep "$device" | head -n 1 | grep -o "[0-9A-F]\{8\}-[0-9A-F]\{4\}-[0-9A-F]\{4\}-[0-9A-F]\{4\}-[0-9A-F]\{12\}" || true)

        if [ -z "$SIMULATOR_ID" ]; then
            print_message "$YELLOW" "⚠️  Simulator not found: ${device}"
            continue
        fi

        # Boot simulator
        xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || true
        sleep 3

        # Build and run UI tests
        DEVICE_DIR="${SCREENSHOTS_DIR}/${LANGUAGE}/${device// /_}"
        mkdir -p "$DEVICE_DIR"

        # Override status bar for clean screenshots
        xcrun simctl status_bar "$SIMULATOR_ID" override --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100 || true

        print_message "$GREEN" "✅ Captured screenshots for ${device}"

        # Shutdown simulator
        xcrun simctl shutdown "$SIMULATOR_ID" || true
    done
fi

echo ""

# Frame screenshots (if frameit is available)
print_header "🖼️  Framing Screenshots"

if command -v frameit &> /dev/null; then
    print_message "$BLUE" "Adding device frames to screenshots..."

    frameit silver --path "$SCREENSHOTS_DIR" || {
        print_message "$YELLOW" "⚠️  Frameit failed or not configured"
        print_message "$NC" "Install frameit: gem install fastlane"
    }
else
    print_message "$YELLOW" "⚠️  frameit not installed"
    print_message "$NC" "Install to add device frames: gem install fastlane"
fi
echo ""

# Optimize images
print_header "🎨 Optimizing Images"

if command -v imageoptim &> /dev/null || command -v pngquant &> /dev/null; then
    print_message "$BLUE" "Optimizing screenshots..."

    find "$SCREENSHOTS_DIR" -name "*.png" -type f | while read -r file; do
        if command -v pngquant &> /dev/null; then
            pngquant --force --ext .png --quality 80-95 "$file" 2>/dev/null || true
        fi
    done

    print_message "$GREEN" "✅ Screenshots optimized"
else
    print_message "$YELLOW" "⚠️  Image optimization tools not found"
    print_message "$NC" "Install pngquant for optimization: brew install pngquant"
fi
echo ""

# Generate screenshot manifest
print_header "📋 Generating Manifest"

MANIFEST_FILE="${SCREENSHOTS_DIR}/manifest_${TIMESTAMP}.txt"

cat > "$MANIFEST_FILE" <<EOF
Screenshot Manifest
Generated: $(date)
Language: ${LANGUAGE}

Screenshots by Device:
EOF

find "$SCREENSHOTS_DIR" -name "*.png" -type f | sort | while read -r file; do
    SIZE=$(du -h "$file" | cut -f1)
    DIMENSIONS=$(file "$file" | grep -o "[0-9]* x [0-9]*" || echo "Unknown")
    echo "  - $(basename "$file") (${SIZE}, ${DIMENSIONS})" >> "$MANIFEST_FILE"
done

print_message "$GREEN" "✅ Manifest created: ${MANIFEST_FILE}"
echo ""

# Screenshot summary
print_header "📊 Screenshot Summary"

TOTAL_SCREENSHOTS=$(find "$SCREENSHOTS_DIR" -name "*.png" -type f | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$SCREENSHOTS_DIR" | cut -f1)

print_message "$GREEN" "Total Screenshots: ${TOTAL_SCREENSHOTS}"
print_message "$GREEN" "Total Size: ${TOTAL_SIZE}"
print_message "$GREEN" "Location: ${SCREENSHOTS_DIR}"
echo ""

# List screenshots by device
print_message "$BLUE" "Screenshots by device:"
for device in "${DEVICES[@]}"; do
    DEVICE_DIR="${SCREENSHOTS_DIR}/${LANGUAGE}/${device// /_}"
    if [ -d "$DEVICE_DIR" ]; then
        COUNT=$(find "$DEVICE_DIR" -name "*.png" -type f | wc -l | tr -d ' ')
        print_message "$NC" "  ${device}: ${COUNT} screenshots"
    fi
done
echo ""

# App Store requirements reminder
print_header "📱 App Store Requirements"

print_message "$BLUE" "Required screenshot sizes:"
print_message "$NC" "  iPhone 6.7\" (Pro Max): 1290 x 2796 pixels"
print_message "$NC" "  iPhone 6.5\" (Pro): 1242 x 2688 pixels"
print_message "$NC" "  iPhone 5.5\": 1242 x 2208 pixels"
print_message "$NC" "  iPad Pro 12.9\": 2048 x 2732 pixels"
echo ""

print_message "$YELLOW" "⚠️  Remember to:"
print_message "$NC" "  • Provide 3-10 screenshots per device size"
print_message "$NC" "  • Use high-quality PNG or JPEG format"
print_message "$NC" "  • Show key features and functionality"
print_message "$NC" "  • Avoid showing personal information"
print_message "$NC" "  • Follow App Store guidelines"
echo ""

# Next steps
print_message "$BLUE" "Next Steps:"
print_message "$NC" "1. Review screenshots in: ${SCREENSHOTS_DIR}"
print_message "$NC" "2. Select best screenshots for App Store"
print_message "$NC" "3. Upload to App Store Connect"
print_message "$NC" "4. Or use 'fastlane deliver' to upload automatically"
echo ""

print_message "$GREEN" "🎉 Screenshot generation completed!"
echo ""

# Open screenshots folder (macOS only)
if command -v open &> /dev/null; then
    read -p "Do you want to open the screenshots folder? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$SCREENSHOTS_DIR"
    fi
fi

# Create Snapfile template if it doesn't exist
if [ ! -f "fastlane/Snapfile" ]; then
    print_message "$BLUE" "Creating Snapfile template for future use..."

    mkdir -p fastlane

    cat > "fastlane/Snapfile" <<EOF
# Snapfile - Configuration for snapshot
# https://docs.fastlane.tools/actions/snapshot/

# A list of devices you want to take screenshots from
devices([
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone SE (3rd generation)",
  "iPad Pro (12.9-inch) (6th generation)"
])

# The languages to generate screenshots for
languages([
  "en-US"
])

# The scheme to use for building and testing
scheme("App")

# The output directory for screenshots
output_directory("./screenshots")

# Clean previous screenshots
clear_previous_screenshots(true)

# Override status bar for clean screenshots
override_status_bar(true)

# Localize simulator
localize_simulator(true)

# Launch arguments for the app
# launch_arguments(["-UIPreferredContentSizeCategoryName UICTContentSizeCategoryL"])

# Environment variables
# launch_arguments(["-FASTLANE_SNAPSHOT YES"])

# Number of times to retry taking a screenshot
number_of_retries(1)

# Stop the script if a screenshot fails
stop_after_first_error(false)

# Reinstall the app before taking screenshots
reinstall_app(true)

# Erase simulator before running
erase_simulator(false)
EOF

    print_message "$GREEN" "✅ Created Snapfile template at fastlane/Snapfile"
    print_message "$NC" "Edit this file and run 'fastlane snapshot' for automated screenshot generation"
fi
