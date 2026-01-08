#!/bin/bash
# Add ErrorBoundary wrappers to all Hub pages
# This script wraps the default export of each hub page with ErrorBoundary

set -e

echo "🛡️  Adding ErrorBoundary wrappers to Hub pages..."

# List of hub files to update
HUB_FILES=(
  "src/pages/CommandCenter.tsx"
  "src/pages/SafetyHub.tsx"
  "src/pages/AnalyticsHub.tsx"
  "src/pages/AdminDashboard.tsx"
  "src/pages/MaintenanceHub.tsx"
  "src/pages/OperationsHub.tsx"
  "src/pages/DriversHub.tsx"
  "src/pages/FinancialHub.tsx"
  "src/pages/ComplianceHub.tsx"
  "src/pages/DocumentsHub.tsx"
)

# Function to add ErrorBoundary wrapper
add_error_boundary() {
  local file=$1
  local filename=$(basename "$file" .tsx)

  echo "  Processing $filename..."

  # Check if ErrorBoundary already imported
  if grep -q "from '@/components/common/ErrorBoundary'" "$file"; then
    echo "    ✓ ErrorBoundary already imported"
    return 0
  fi

  # Backup original file
  cp "$file" "${file}.boundary-backup"

  # Add import at the top (after existing imports)
  perl -i -pe 'print "import { ErrorBoundary } from '\''@/components/common/ErrorBoundary'\''\nimport { logger } from '\''@/utils/logger'\''\n\n" if $. == 1 && !/ErrorBoundary/' "$file"

  # Find the default export and wrap it
  # Pattern: export default ComponentName
  if grep -q "export default " "$file"; then
    local component_name=$(grep "export default " "$file" | sed 's/export default //' | sed 's/;//' | tr -d '\n')

    # Replace the default export with wrapped version
    perl -i -pe "s/export default ${component_name}/const Wrapped${component_name} = () => (\n  <ErrorBoundary\n    onError={(error, errorInfo) => {\n      logger.error('${filename} error', error, {\n        component: '${filename}',\n        errorInfo\n      })\n    }}\n  >\n    <${component_name} \/>\n  <\/ErrorBoundary>\n)\n\nexport default Wrapped${component_name}/" "$file"

    echo "    ✓ ErrorBoundary wrapper added"
  else
    echo "    ⚠  No default export found"
  fi
}

# Process each file
for file in "${HUB_FILES[@]}"; do
  if [ -f "$file" ]; then
    add_error_boundary "$file"
  else
    echo "  ⚠  File not found: $file"
  fi
done

echo ""
echo "✅ ErrorBoundary wrappers added to all Hub pages"
echo ""
echo "📋 Summary:"
echo "   - Created backups: *.boundary-backup"
echo "   - Added ErrorBoundary imports"
echo "   - Wrapped default exports with ErrorBoundary"
echo ""
echo "🧪 Test with:"
echo "   npm run dev"
echo "   # Visit each hub and verify error boundaries work"
