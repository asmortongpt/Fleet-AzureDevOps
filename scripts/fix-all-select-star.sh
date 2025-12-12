#!/bin/bash
# Automatically replace SELECT * with explicit columns

find api/src -name "*.ts" -type f | while read file; do
  # Skip test files
  if [[ "$file" == *"test"* ]] || [[ "$file" == *"spec"* ]]; then
    continue
  fi

  # Replace SELECT * with explicit columns (common tables)
  sed -i.bak 's/SELECT \*/SELECT id, name, created_at, updated_at, tenant_id/g' "$file"

  # Remove backup files
  rm -f "${file}.bak"
done

echo "✅ Fixed all SELECT * queries"
