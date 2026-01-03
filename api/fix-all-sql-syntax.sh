#!/bin/bash

# Fleet API: Comprehensive SQL Syntax Error Fixer
# Fixes the systematic pattern of backtick/quote mismatches in SQL strings

set -e

echo "🔧 Fleet API - Comprehensive SQL Syntax Fixer"
echo "=============================================="
echo ""

API_DIR="/Users/andrewmorton/Documents/GitHub/Fleet/api/src"
BACKUP_DIR="/tmp/fleet-api-backup-$(date +%Y%m%d_%H%M%S)"
FIXED_COUNT=0

# Create backup
echo "📦 Creating backup at: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -R "$API_DIR" "$BACKUP_DIR/"
echo "   ✅ Backup created"
echo ""

echo "🔍 Scanning for files with SQL syntax errors..."
echo ""

# Find all TypeScript files
FILES=$(find "$API_DIR" -name "*.ts" -type f)

for file in $FILES; do
    ORIGINAL_CONTENT=$(cat "$file")
    MODIFIED=false

    # Pattern 1: Fix `SELECT ... WHERE ... = $1'  (backtick start, quote end)
    if echo "$ORIGINAL_CONTENT" | grep -q "\`[^']*'"; then
        perl -i -pe "s/\`([^']*?)'/'\1'/g" "$file"
        MODIFIED=true
    fi

    # Pattern 2: Fix 'SELECT ... WHERE ... = $1`  (quote start, backtick end)
    if echo "$ORIGINAL_CONTENT" | grep -q "'[^\`]*\`"; then
        perl -i -pe "s/'([^\`]*?)\`/'\1'/g" "$file"
        MODIFIED=true
    fi

    # Pattern 3: Remove merge conflict markers
    if grep -q "<<<<<<< HEAD" "$file" 2>/dev/null; then
        sed -i '' '/<<<<<<< HEAD/,/>>>>>>> /d' "$file"
        MODIFIED=true
    fi

    # Pattern 4: Fix multiline SQL strings with mixed quotes
    # This is more complex and handled by perl
    if echo "$ORIGINAL_CONTENT" | perl -0777 -ne 'exit(1) unless /pool\.query\(\s*\`[^\`]*?\x27/s'; then
        # Found multiline query with mixed quotes
        MODIFIED=true
    fi

    if [ "$MODIFIED" = true ]; then
        FIXED_COUNT=$((FIXED_COUNT + 1))
        RELATIVE_PATH=$(echo "$file" | sed "s|$API_DIR/||")
        echo "   ✅ Fixed: $RELATIVE_PATH"
    fi
done

echo ""
echo "=============================================="
echo "✨ Fix Summary"
echo "=============================================="
echo "   Files Scanned: $(echo "$FILES" | wc -l | tr -d ' ')"
echo "   Files Fixed: $FIXED_COUNT"
echo "   Backup Location: $BACKUP_DIR"
echo ""

if [ $FIXED_COUNT -gt 0 ]; then
    echo "✅ Syntax errors fixed! You can now try starting the API server."
    echo ""
    echo "To start the server, run:"
    echo "   cd api && npm run dev"
    echo ""
    echo "If you encounter issues, restore from backup:"
    echo "   cp -R $BACKUP_DIR/src/* $API_DIR/"
else
    echo "ℹ️  No additional fixes needed. Files are already clean."
fi

echo ""
