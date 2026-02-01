#!/bin/bash

# Script to resolve all merge conflicts by accepting incoming changes
# This is safe for Dependabot dependency update merges where incoming = newer versions

set -e

# Find all files with merge conflicts
FILES=$(grep -rl "<<<<<<< HEAD" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -z "$FILES" ]; then
    echo "No merge conflicts found!"
    exit 0
fi

echo "Found merge conflicts in $(echo "$FILES" | wc -l | tr -d ' ') files"
echo "Resolving by accepting incoming changes (fix/pipeline-eslint-build branch)..."

# Process each file
for file in $FILES; do
    echo "Processing: $file"

    # Use sed to remove conflict markers and keep incoming changes
    # This removes lines between <<<<<<< HEAD and ======= (inclusive)
    # and removes the >>>>>>> branch-name marker

    # Create a temporary file
    tmpfile=$(mktemp)

    # Process the file:
    # - Remove lines from <<<<<<< HEAD through =======
    # - Remove >>>>>>> branch-name lines
    awk '
        BEGIN { in_conflict = 0; in_incoming = 0 }
        /^<<<<<<< HEAD/ { in_conflict = 1; next }
        /^=======/ && in_conflict { in_conflict = 0; in_incoming = 1; next }
        /^>>>>>>> / && in_incoming { in_incoming = 0; next }
        !in_conflict || in_incoming { print }
    ' "$file" > "$tmpfile"

    # Replace original with processed file
    mv "$tmpfile" "$file"
done

echo "✓ All merge conflicts resolved!"
echo "Run 'npm run typecheck' to verify the resolution."
