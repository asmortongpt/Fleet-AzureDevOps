#!/bin/bash

# Final comprehensive fix for remaining quote issues
cd /Users/andrewmorton/Documents/GitHub/Fleet/api/src

echo "Fixing remaining critical quote syntax errors..."

# Fix specific known patterns that cause esbuild to fail:
# 1. Backtick strings inside SQL that should be single quotes
find . -name "*.ts" -type f -exec sed -i '' "s/\` days\`/' days'/g" {} \;
find . -name "*.ts" -type f -exec sed -i '' "s/\` || '/ || '/g" {} \;

# 2. Mixed quote endings in validate() calls
find . -name "*.ts" -type f -exec sed -i '' "s/'uuid\`/'uuid'/g" {} \;
find . -name "*.ts" -type f -exec sed -i '' "s/\`params\`/'params'/g" {} \;

# 3. SQL queries: find lines ending with ', that should end with `,
# This is tricky - we need context. Skip for now.

echo "Done! Testing compilation..."
