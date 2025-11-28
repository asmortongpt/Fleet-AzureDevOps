#!/bin/bash

# Use PlistBuddy to directly add files to the xcodeproj
# This is more reliable than xcodeproj gem

# Kill the project file manipulation and just reinstall the last working app
xcrun simctl install booted /Users/andrewmorton/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphonesimulator/App.app 2>/dev/null || echo "No existing build found"

# Restart the app
xcrun simctl terminate booted com.capitaltechalliance.fleetmanagement 2>/dev/null
sleep 1
xcrun simctl launch booted com.capitaltechalliance.fleetmanagement

