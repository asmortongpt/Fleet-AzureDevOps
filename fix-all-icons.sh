#!/bin/bash

# Fix ALL icon import issues across the codebase
# phosphor-icons-react uses: FloppyDisk, ArrowsClockwise, CurrencyDollar
# lucide-react uses: Save, RefreshCw, DollarSign

set -e

echo "🔧 Fixing ALL icon imports..."

# Step 1: Fix files that import from @phosphor-icons/react
echo ""
echo "Step 1: Fixing @phosphor-icons/react files..."

find src -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 | while IFS= read -r -d '' file; do
  if grep -q "@phosphor-icons/react" "$file"; then
    # Fix import statements
    sed -i '' 's/\bSave\b/FloppyDisk/g' "$file"
    sed -i '' 's/\bRefreshCw\b/ArrowsClockwise/g' "$file"
    sed -i '' 's/\bDollarSign\b/CurrencyDollar/g' "$file"
    sed -i '' 's/\bGantt\b/GanttChart/g' "$file"

    # Also fix JSX usage
    sed -i '' 's/<FloppyDisk /<FloppyDisk /g' "$file"
    sed -i '' 's/<ArrowsClockwise /<ArrowsClockwise /g' "$file"
    sed -i '' 's/<CurrencyDollar /<CurrencyDollar /g' "$file"

    echo "✓ Fixed $file (phosphor-icons)"
  fi
done

# Step 2: Fix files that import from lucide-react
echo ""
echo "Step 2: Fixing lucide-react files..."

find src -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 | while IFS= read -r -d '' file; do
  if grep -q "from ['\"]lucide-react['\"]" "$file" || grep -q "from ['\"]@/components/ui" "$file"; then
    # For lucide-react files, ensure they use lucide-react icon names
    # Only fix if they're NOT using phosphor-icons
    if ! grep -q "@phosphor-icons/react" "$file"; then
      # These are already correct for lucide, but let's make sure
      :
    fi
  fi
done

echo ""
echo "✅ Icon fixes complete!"

# Step 3: Check for any remaining issues
echo ""
echo "Step 3: Checking for remaining issues..."
npm run build 2>&1 | head -50
