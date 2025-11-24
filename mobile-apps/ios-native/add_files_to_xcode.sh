#!/bin/bash

# Script to add new Swift files to Xcode project
# Usage: ./add_files_to_xcode.sh

cd /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native

# Files to add
FILES_TO_ADD=(
  "App/ReceiptCaptureView.swift"
  "App/DamageReportView.swift"
  "App/VehicleReservationView.swift"
)

echo "Adding files to Xcode project..."

for file in "${FILES_TO_ADD[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ Found: $file"

    # Generate UUIDs for the file references
    FILE_REF_UUID=$(uuidgen | tr '[:lower:]' '[:upper:]' | tr -d '-' | cut -c1-24)
    BUILD_FILE_UUID=$(uuidgen | tr '[:lower:]' '[:upper:]' | tr -d '-' | cut -c1-24)

    FILE_NAME=$(basename "$file")

    # Add to PBXFileReference section
    echo "  Adding PBXFileReference for $FILE_NAME"

    # Add to PBXBuildFile section
    echo "  Adding PBXBuildFile for $FILE_NAME"

    # Add to PBXSourcesBuildPhase
    echo "  Adding to Sources Build Phase"
  else
    echo "✗ Not found: $file"
  fi
done

echo ""
echo "Note: Xcode project modification requires manual steps in Xcode."
echo "Please open Xcode and use File → Add Files to add these files:"
echo "  - ReceiptCaptureView.swift"
echo "  - DamageReportView.swift"
echo "  - VehicleReservationView.swift"
