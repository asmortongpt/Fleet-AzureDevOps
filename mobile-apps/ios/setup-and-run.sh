#!/bin/bash
set -e

echo "========================================="
echo "Fleet Manager iOS App - Simulator Setup"
echo "========================================="
echo ""

# Project directory
PROJECT_DIR="/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios"
APP_NAME="FleetManager"

cd "$PROJECT_DIR"

# Get first available iPhone simulator
echo "Finding available iOS simulator..."
SIMULATOR_ID=$(xcrun simctl list devices available | grep -E "iPhone 1[5-7]" | head -1 | grep -o '[0-9A-F\-]\{36\}')

if [ -z "$SIMULATOR_ID" ]; then
    echo "Error: No iOS simulator found"
    exit 1
fi

SIMULATOR_NAME=$(xcrun simctl list devices | grep "$SIMULATOR_ID" | sed 's/(.*//' | xargs)
echo "Using simulator: $SIMULATOR_NAME"
echo ""

# Boot simulator if not already running
echo "Starting iOS Simulator..."
xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || true
open -a Simulator

# Wait for simulator to boot
echo "Waiting for simulator to boot..."
sleep 5

echo ""
echo "========================================="
echo "To run the app in Xcode:"
echo "========================================="
echo ""
echo "1. In Xcode, go to: File > New > Project"
echo ""
echo "2. Choose: iOS > App"
echo ""
echo "3. Fill in:"
echo "   - Product Name: FleetManager"
echo "   - Organization Identifier: com.capitaltechalliance"
echo "   - Interface: SwiftUI"
echo "   - Language: Swift"
echo "   - Save location: $PROJECT_DIR"
echo ""
echo "4. When project opens:"
echo "   - Delete the default ContentView.swift"
echo "   - Drag FleetMobileApp.swift into the project"
echo "   - Make sure it's in the FleetManager target"
echo ""
echo "5. Add Info.plist entries (already created at FleetManager/Info.plist)"
echo ""
echo "6. Select '$SIMULATOR_NAME' from the device menu"
echo ""
echo "7. Press ⌘R to run!"
echo ""
echo "========================================="
echo ""
echo "Files ready at:"
echo "  Swift Code: $PROJECT_DIR/FleetManager/FleetMobileApp.swift"
echo "  Info.plist: $PROJECT_DIR/FleetManager/Info.plist"
echo ""
