#!/bin/bash
# Fix SQL quote issues in migrated document services

# Find all lines that have single-quoted SQL with embedded single quotes
# and convert them to backtick strings

for file in src/services/document-*.service.ts src/services/Document*.ts; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Use perl to fix quote issues - replace '...' with `...` for SQL queries
    perl -i -pe "s/'(UPDATE|INSERT|DELETE|SELECT)([^']*)'([^,])/\`\$1\$2\`\$3/g" "$file"
    perl -i -pe "s/'(UPDATE|INSERT|DELETE|SELECT)([^']*)'$/\`\$1\$2\`/g" "$file"
  fi
done

echo "Done fixing SQL quotes!"
