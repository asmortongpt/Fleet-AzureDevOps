#!/bin/bash
# Rename all component files to PascalCase
find src/components -name "*.tsx" | while read file; do
dir=$(dirname "$file")
base=$(basename "$file" .tsx)

# Convert kebab-case to PascalCase
pascal=$(echo "$base" | sed -r 's/(^|-)([a-z])/(\1)?\U\2/g')

if [ "$base" != "$pascal" ]; then
  mv "$file" "$dir/$pascal.tsx"
  echo "Renamed: $base.tsx -> $pascal.tsx"
fi
done