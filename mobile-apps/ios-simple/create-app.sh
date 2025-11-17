#!/bin/bash

echo "Creating simple native iOS app..."

# This will open Xcode with a template that we'll modify
osascript << 'APPLESCRIPT'
tell application "Xcode"
    activate
end tell

tell application "System Events"
    tell process "Xcode"
        -- Wait for Xcode to be ready
        delay 2
        
        -- File menu -> New -> Project
        click menu item "Project..." of menu "New" of menu item "New" of menu "File" of menu bar 1
        
        -- Wait for template chooser
        delay 2
    end tell
end tell
APPLESCRIPT

echo ""
echo "✅ Xcode opened!"
echo ""
echo "Please follow these steps in Xcode:"
echo "1. Select: iOS → App"
echo "2. Product Name: FleetManager"
echo "3. Organization Identifier: com.capitaltechalliance"
echo "4. Interface: SwiftUI"
echo "5. Language: Swift"
echo "6. Save to: /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-simple"
echo ""
echo "After creating, replace the generated ContentView.swift with this code:"
echo "/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios/FleetMobileApp.swift"

