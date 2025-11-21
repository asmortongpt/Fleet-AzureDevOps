#!/bin/bash

# Fix Import Path Issues - Replace backend imports with frontend imports
# This fixes TS2307 and TS2305 errors

set -e

echo "🔧 Fixing import paths across the codebase..."
echo ""

# Files with import errors from the previous analysis
files_with_errors=(
  "src/components/damage/DamageAnalysisResults.tsx"
  "src/components/documents/DocumentExplorer.tsx"
  "src/components/documents/DocumentGrid.tsx"
  "src/components/documents/DocumentList.tsx"
  "src/components/documents/DocumentMap.tsx"
  "src/components/documents/DocumentMapCluster.tsx"
  "src/components/documents/DocumentProperties.tsx"
  "src/components/documents/search/SavedSearches.tsx"
  "src/components/drilldown/VehicleDetailPanel.tsx"
  "src/components/filters/AssetTypeFilter.tsx"
  "src/components/modules/AIAssistant.tsx"
  "src/components/modules/EnhancedTaskManagement.tsx"
  "src/components/modules/MobileEmployeeDashboard.tsx"
  "src/components/RouteOptimizer.tsx"
  "src/lib/data-transformers.ts"
  "src/lib/mobile/components/OBD2AdapterScanner.tsx"
  "src/lib/mobile/services/OBD2Service.ts"
)

# Common backend import patterns to fix
declare -A import_replacements=(
  ["../../api/src/types/asset.types"]="@/types/asset.types"
  ["../../../api/src/types/asset.types"]="@/types/asset.types"
  ["../../../../api/src/types/asset.types"]="@/types/asset.types"
  ["../../api/src/types"]="@/types"
  ["../../../api/src/types"]="@/types"
  ["../../api/src/services"]="@/services"
  ["../../../api/src/services"]="@/services"
)

fixed_count=0

for file in "${files_with_errors[@]}"; do
  if [ ! -f "$file" ]; then
    continue
  fi

  echo "Checking: $file"

  for old_import in "${!import_replacements[@]}"; do
    new_import="${import_replacements[$old_import]}"

    if grep -q "$old_import" "$file" 2>/dev/null; then
      echo "  ✓ Fixing: $old_import → $new_import"
      sed -i '' "s|$old_import|$new_import|g" "$file"
      ((fixed_count++))
    fi
  done
done

echo ""
echo "✅ Fixed $fixed_count import paths"
echo ""

# Count remaining errors
REMAINING=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
echo "📊 Remaining TypeScript errors: $REMAINING"