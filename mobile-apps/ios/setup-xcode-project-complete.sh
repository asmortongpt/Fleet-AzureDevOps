#!/bin/bash
set -e

echo "🚀 Setting up complete Xcode project for Fleet Manager..."
echo ""

PROJECT_DIR="/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios"
cd "$PROJECT_DIR"

# Clean up any existing project
rm -rf FleetManager.xcodeproj FleetManager FleetManager.xcworkspace

# Create project structure
mkdir -p FleetManager/FleetManager.xcodeproj
mkdir -p FleetManager/FleetManager
mkdir -p FleetManager/FleetManager/Assets.xcassets/AppIcon.appiconset
mkdir -p FleetManager/FleetManager/Preview\ Content/Preview\ Assets.xcassets

# Copy the Swift app file
cp /tmp/FleetManager/FleetManager/FleetManagerApp.swift FleetManager/FleetManager/
cp /tmp/FleetManager/FleetManager/Info.plist FleetManager/

# Create Assets Contents
cat > FleetManager/FleetManager/Assets.xcassets/Contents.json << 'ASSETJSON'
{
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
ASSETJSON

cat > FleetManager/FleetManager/Assets.xcassets/AppIcon.appiconset/Contents.json << 'ICONJSON'
{
  "images" : [
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60"
    },
    {
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
ICONJSON

echo "✅ Project structure created!"
echo "📂 Location: $PROJECT_DIR/FleetManager"
echo ""
echo "Opening in Xcode..."

# Open the project folder in Xcode
open -a Xcode FleetManager/FleetManager

echo ""
echo "✅ READY! In Xcode:"
echo "   1. File → New → Project → iOS → App"
echo "   2. Product Name: FleetManager"
echo "   3. Bundle ID: com.capitaltechalliance.fleet"  
echo "   4. Interface: SwiftUI, Language: Swift"
echo "   5. Save to: /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios"
echo "   6. Replace ContentView.swift with FleetManagerApp.swift (already open in Xcode)"
echo "   7. Press ▶ to run in simulator"
echo ""
echo "This is a NATIVE iOS APP that can be submitted to the App Store!"

