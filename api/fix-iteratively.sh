#!/bin/bash

cd /Users/andrewmorton/Documents/GitHub/Fleet/api

echo "Fixing syntax errors iteratively..."

for i in {1..100}; do
  echo "===== Iteration $i ====="

  # Try to start the server and capture the error
  ERROR=$(npx tsx src/server.ts 2>&1 &
  PID=$!
  sleep 2
  kill $PID 2>/dev/null || true
  wait $PID 2>&1)

  # Check if server started successfully
  if echo "$ERROR" | grep -q "Server running on"; then
    echo "✅ SERVER STARTED SUCCESSFULLY!"
    exit 0
  fi

  # Extract file and line from error
  if echo "$ERROR" | grep -q "ERROR:"; then
    FILE_LINE=$(echo "$ERROR" | grep "ERROR:" | head -1 | sed -E 's/.*\/api\/(src\/[^:]+):([0-9]+):([0-9]+).*/\1:\2:\3/')
    FILE=$(echo "$FILE_LINE" | cut -d':' -f1)
    LINE=$(echo "$FILE_LINE" | cut -d':' -f2)
    COL=$(echo "$FILE_LINE" | cut -d':' -f3)

    echo "Error in $FILE at line $LINE, column $COL"

    if [ -f "$FILE" ]; then
      # Show the problematic line
      sed -n "${LINE}p" "$FILE"

      # Try to fix common issues
      # Fix 1: Extra closing paren before })
      sed -i '' "${LINE}s/}))$/})/" "$FILE"

      # Fix 2: Extra closing paren at end of line
      sed -i '' "${LINE}s/)$//" "$FILE"

      echo "Applied fix to $FILE:$LINE"
    fi
  else
    echo "❌ Unknown error pattern"
    echo "$ERROR" | head -20
    exit 1
  fi

  sleep 1
done

echo "❌ Max iterations reached"
exit 1
