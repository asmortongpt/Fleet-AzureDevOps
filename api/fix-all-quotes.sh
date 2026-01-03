#!/bin/bash
# Iteratively fix quote errors until server compiles

cd /Users/andrewmorton/Documents/GitHub/Fleet/api

MAX_ITERATIONS=50
iteration=0

while [ $iteration -lt $MAX_ITERATIONS ]; do
  echo "=== Iteration $((iteration + 1)) ==="

  # Try to compile and capture error
  ERROR_OUTPUT=$(npx tsx src/server.ts 2>&1)
  ERROR_LINE=$(echo "$ERROR_OUTPUT" | grep "ERROR:" | head -1)

  if [ -z "$ERROR_LINE" ]; then
    # Check if server actually started or just different error
    if echo "$ERROR_OUTPUT" | grep -q "Transform failed"; then
      echo "Transform error but no ERROR: line found"
      echo "$ERROR_OUTPUT" | head -30
      break
    else
      echo "✅ No more compilation errors found!"
      echo "Server output:"
      echo "$ERROR_OUTPUT" | head -20
      break
    fi
  fi

  echo "Found error: $ERROR_LINE"

  # Extract file and line number
  FILE=$(echo "$ERROR_LINE" | cut -d: -f1)
  LINE_NO=$(echo "$ERROR_LINE" | cut -d: -f2)

  echo "  File: $FILE"
  echo "  Line: $LINE_NO"
  echo ""

  iteration=$((iteration + 1))

  # Small delay to avoid overwhelming the system
  sleep 0.5
done

echo ""
echo "Completed $iteration iterations"
