#!/bin/bash
echo "🔍 Finding SELECT * instances in repository code..."

cd /Users/andrewmorton/Documents/GitHub/Fleet/api/src

# Find all SELECT * in .ts files
grep -rn "SELECT \*" . --include="*.ts" | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)
  echo "📄 $file:$linenum"
done

count=$(grep -r "SELECT \*" . --include="*.ts" | wc -l | tr -d ' ')
echo ""
echo "Total SELECT * found: $count"
echo ""
echo "⚠️  These should be replaced with specific column lists:"
echo "   SELECT id, name, status FROM vehicles"
echo "   instead of"
echo "   SELECT * FROM vehicles"