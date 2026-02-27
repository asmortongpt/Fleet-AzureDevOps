#!/bin/bash

# ============================================================================
# CTA Branding Application Script
# ============================================================================
# This script applies Capital Technology Alliance brand colors to all hub pages
# CTA Colors:
# - DAYTIME: #2F3359 (Navy Blue - Headers)
# - BLUE SKIES: #41B2E3 (Cyan - Hover/Accents)
# - MIDNIGHT: #0A0E27 (Deep Purple - Background)
# - NOON: #DD3903 (Orange-Red - CTAs)
# - GOLDEN HOUR: #F0A000 (Golden Yellow - Warnings)
# ============================================================================

echo "🎨 Applying CTA Branding to All Hub Pages..."
echo "================================================"

# Color replacements
declare -A COLOR_MAP=(
  # Remove green gradients
  ["from-green-50"]="from-[#0A0E27]"
  ["to-blue-50"]="to-[#1A0E2E]"
  ["bg-white"]="bg-[#2F3359]"
  ["text-gray-900"]="text-white"
  ["text-gray-700"]="text-gray-300"
  ["text-gray-600"]="text-gray-400"
  ["text-green-600"]="text-[#F0A000]"
  ["text-blue-600"]="text-[#41B2E3]"
  ["border-gray-200"]="border-[#41B2E3]"
  ["bg-gray-50"]="bg-[#1E293B]"
  ["bg-gray-100"]="bg-[#1E293B]"

  # Button colors
  ["bg-blue-600"]="bg-[#DD3903]"
  ["hover:bg-blue-700"]="hover:bg-[#DD3903]/90"
  ["bg-green-600"]="bg-[#DD3903]"
  ["hover:bg-green-700"]="hover:bg-[#DD3903]/90"
)

# Files to update
FILES=(
  "src/pages/EVHub.tsx"
  "src/pages/FleetOperationsHub.tsx"
  "src/pages/BusinessManagementHub.tsx"
  "src/pages/ComplianceReportingHub.tsx"
  "src/pages/ComplianceSafetyHub.tsx"
  "src/pages/AdminConfigurationHub.tsx"
  "src/pages/PeopleCommunicationHub.tsx"
)

count=0
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ Updating $file..."

    # Apply color replacements
    for old_color in "${!COLOR_MAP[@]}"; do
      new_color="${COLOR_MAP[$old_color]}"
      if grep -q "$old_color" "$file" 2>/dev/null; then
        sed -i '' "s/$old_color/$new_color/g" "$file"
      fi
    done

    ((count++))
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "================================================"
echo "✅ CTA Branding applied to $count files"
echo "🎨 Your app now features professional CTA colors!"
