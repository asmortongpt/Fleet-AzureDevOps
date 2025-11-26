#!/bin/bash

# Simple regex-based fixes for remaining quote issues

cd /Users/andrewmorton/Documents/GitHub/Fleet/api/src

# Fix all remaining backtick-quoted simple strings to single quotes
# But preserve template literals with ${...}

echo "Fixing remaining quote issues..."

# Fix type unions with backticks
find . -type f -name "*.ts" -exec perl -i -pe "s/\| \`(\w+)\`/| '\1'/g" {} \;

# Fix assignment of backtick strings that don't contain ${
find . -type f -name "*.ts" -exec perl -i -pe "s/= \`([\w\s]+)\`(?!\s*\$\{)/= '\1'/g" {} \;

# Fix ternary expressions with mixed quotes (simple cases)
find . -type f -name "*.ts" -exec perl -i -pe "s/\? \`(\w+)\`/? '\1'/g" {} \;
find . -type f -name "*.ts" -exec perl -i -pe "s/: \`(\w+)\`/: '\1'/g" {} \;

echo "Done!"
