#!/bin/bash

# Comprehensive fix for template literal syntax errors in TypeScript files
# This script fixes common patterns that cause TS errors

set -e

echo "🔧 Starting comprehensive template literal fix..."

# Find all TypeScript files in src directory
find src -name "*.ts" -type f | while read file; do
  echo "Processing: $file"

  # Fix pattern: 'text ${variable} text' -> `text ${variable} text`
  # This handles single quotes that should be backticks when containing ${...}

  # Create backup
  cp "$file" "$file.bak"

  # Use Python for more sophisticated fixing
  python3 <<EOF
import re
import sys

file_path = "$file"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

original_content = content

# Pattern 1: Fix 'text \${var}...' to use backticks
# Match single-quoted strings containing \${...}
pattern1 = r"'([^']*\\\$\{[^}]+\}[^']*)'"
content = re.sub(pattern1, r'`\1`', content)

# Pattern 2: Fix strings like 'text '${var}' text' (mixed quotes)
# This is trickier - look for patterns like: 'text '\${var}' text'
pattern2 = r"'([^']*)'(\\\$\{[^}]+\})'([^']*)'"
content = re.sub(pattern2, r'`\1\2\3`', content)

# Pattern 3: Fix console.log with template strings wrongly quoted
# Pattern: console.log('   - Text: \${var}');
pattern3 = r"(console\.[a-z]+\()\\s*'([^']*\\\$\{[^}]+\}[^']*)'\\s*\)"
content = re.sub(pattern3, r'\1`\2`)', content)

# Save if changed
if content != original_content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ Fixed template literals in {file_path}", file=sys.stderr)
else:
    print(f"  ℹ️  No changes needed in {file_path}", file=sys.stderr)

EOF

done

echo ""
echo "🔍 Running TypeScript compiler to check remaining errors..."
npx tsc --noEmit 2>&1 | head -50

echo ""
echo "✅ Template literal fix complete!"
echo "📊 Check the output above for any remaining errors"
