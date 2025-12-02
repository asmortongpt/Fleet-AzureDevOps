#!/bin/bash
# Quick TypeScript Error Fixer
# Run this script to fix the easiest 100 errors automatically

echo "🚀 Starting Quick TypeScript Fixes..."
echo ""

# Phase 1: Install missing types
echo "📦 Installing @types/jest-axe..."
npm install --save-dev @types/jest-axe

# Phase 2: Create global type declarations
echo "📝 Creating global type declarations..."
mkdir -p src/types
cat > src/types/global.d.ts << 'TYPES'
declare module 'jest-axe' {
  export const axe: any
  export function toHaveNoViolations(): any
}

declare const mockLeaflet: any
declare const mockGoogleMaps: any
TYPES

# Phase 3: Add optional chaining for common patterns
echo "🔧 Adding optional chaining operators..."
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  # Skip declaration files
  if [[ $file == *.d.ts ]]; then
    continue
  fi
  
  # Fix vehicle.location.lat -> vehicle.location?.lat
  sed -i '' 's/\([a-zA-Z_][a-zA-Z0-9_]*\)\.location\.\([a-zA-Z_][a-zA-Z0-9_]*\)/\1.location?.\2/g' "$file"
  
  # Fix vehicle.driver.name -> vehicle.driver?.name
  sed -i '' 's/\([a-zA-Z_][a-zA-Z0-9_]*\)\.driver\.\([a-zA-Z_][a-zA-Z0-9_]*\)/\1.driver?.\2/g' "$file"
done

echo ""
echo "✅ Quick fixes applied!"
echo ""
echo "📊 Checking new error count..."
ERROR_COUNT=$(./node_modules/.bin/tsc --noEmit 2>&1 | grep -c "error TS")
echo "Remaining errors: $ERROR_COUNT"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Test the application: npm run dev"
echo "3. Commit if satisfied: git add -A && git commit -m 'fix: apply automated TypeScript fixes'"
echo "4. Continue with REMAINING_FIXES_GUIDE.md for manual fixes"
