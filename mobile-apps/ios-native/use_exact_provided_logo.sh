#!/bin/bash

# This script uses the EXACT logo image provided by the user
# No modifications, no recreations - just the exact image

ICON_DIR="/Users/andrewmorton/Documents/GitHub/fleet-management/fleet-management-system/ios/App/App/Assets.xcassets/AppIcon.appiconset"

# The user's exact logo should be saved as dcf_official_logo.png
# We'll use sips to resize it to all required sizes

echo "Using YOUR exact DCF Fleet logo without any modifications..."

# Generate all required sizes from the original
sips -z 60 60 your_exact_logo.png --out "$ICON_DIR/60x60.png"
sips -z 120 120 your_exact_logo.png --out "$ICON_DIR/60x60@2x.png"
sips -z 180 180 your_exact_logo.png --out "$ICON_DIR/60x60@3x.png"
sips -z 76 76 your_exact_logo.png --out "$ICON_DIR/76x76.png"
sips -z 152 152 your_exact_logo.png --out "$ICON_DIR/76x76@2x.png"
sips -z 167 167 your_exact_logo.png --out "$ICON_DIR/83.5x83.5@2x.png"
sips -z 1024 1024 your_exact_logo.png --out "$ICON_DIR/1024x1024.png"

echo "Done - using YOUR exact logo!"