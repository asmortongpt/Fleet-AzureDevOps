#!/bin/bash

# Fix TypeScript files that have markdown code fence markers
# This script removes ```typescript from the beginning and ``` from the end

echo "Fixing TypeScript files with markdown code fences..."

# List of files to fix
files=(
  "api/src/services/cache.service.ts"
  "api/src/services/config/ConfigurationManagementService.ts"
  "api/src/middleware/rbac.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Check if file starts with ```typescript
    first_line=$(head -1 "$file")
    if [ "$first_line" = '```typescript' ]; then
      echo "  - Removing opening code fence (```typescript)"
      # Use sed to remove first line
      sed -i.bak '1d' "$file"
      rm -f "$file.bak"
    else
      echo "  - No opening code fence found"
    fi
    
    # Check if file ends with ```
    last_line=$(tail -1 "$file")
    if [ "$last_line" = '```' ]; then
      echo "  - Removing closing code fence (```)"
      # Use sed to remove last line (macOS compatible)
      sed -i.bak '$ d' "$file"
      rm -f "$file.bak"
    else
      echo "  - No closing code fence found"
    fi
    
    echo "  ✓ Fixed: $file"
  else
    echo "  ✗ File not found: $file"
  fi
done

echo ""
echo "Done! Processed ${#files[@]} files."
echo ""
echo "Verifying files..."
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "$file: $(wc -l < "$file") lines"
  fi
done
