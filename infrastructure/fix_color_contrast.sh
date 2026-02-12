#!/bin/bash
# Fix color contrast violations by upgrading light text colors to darker, more accessible versions

cd "$(dirname "$0")/.."

echo "🎨 Fixing color contrast violations..."

# Fix text-gray-400 -> text-gray-600 (better contrast)
find src -type f -name "*.tsx" -exec sed -i '' 's/text-gray-400/text-gray-600/g' {} \;

# Fix text-emerald-400 -> text-emerald-600
find src -type f -name "*.tsx" -exec sed -i '' 's/text-emerald-400/text-emerald-600/g' {} \;

# Fix text-blue-400 -> text-blue-600
find src -type f -name "*.tsx" -exec sed -i '' 's/text-blue-400/text-blue-600/g' {} \;

# Fix specific small text that needs higher contrast
# tracking-wider with light colors -> darker versions
find src -type f -name "*.tsx" -exec sed -i '' 's/tracking-wider text-gray-500/tracking-wider text-gray-700/g' {} \;
find src -type f -name "*.tsx" -exec sed -i '' 's/tracking-wider text-gray-600/tracking-wider text-gray-700/g' {} \;

# Fix tiny text (10px and smaller) to use darker colors
find src -type f -name "*.tsx" -exec sed -i '' 's/text-\[10px\] text-gray-500/text-[10px] text-gray-700/g' {} \;
find src -type f -name "*.tsx" -exec sed -i '' 's/text-\[10px\] text-gray-600/text-[10px] text-gray-700/g' {} \;

echo "✅ Color contrast fixes applied"
echo "   - Upgraded text-gray-400 -> text-gray-600"
echo "   - Upgraded text-emerald-400 -> text-emerald-600"
echo "   - Upgraded text-blue-400 -> text-blue-600"
echo "   - Enhanced contrast for tracking-wider text"
echo "   - Enhanced contrast for tiny (10px) text"
