#!/bin/bash
# Batch fix remaining accessibility violations

cd "$(dirname "$0")/.."

echo "🔧 Fixing remaining accessibility violations..."

# Fix all md:block overflow elements (scrollable regions)
find src -type f -name "*.tsx" -exec sed -i '' \
  's/className="\([^"]*\bmd:block[^"]*\boverview-y-auto[^"]*\)"/className="\1" tabIndex={0} role="region" aria-label="Scrollable content"/g' {} \;

find src -type f -name "*.tsx" -exec sed -i '' \
  's/className="\([^"]*\bmd:block[^"]*\boverflow-auto[^"]*\)"/className="\1" tabIndex={0} role="region" aria-label="Scrollable content"/g' {} \;

# Fix hidden md:block overflow
find src -type f -name "*.tsx" -exec sed -i '' \
  's/className="\([^"]*\bhidden md:block[^"]*\boverflow[^"]*\)"/className="\1" tabIndex={0} role="region" aria-label="Scrollable content"/g' {} \;

echo "✅ Scrollable region fixes applied"
echo "✅ Accessibility improvements complete"
