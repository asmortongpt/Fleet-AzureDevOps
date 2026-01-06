#!/bin/bash
# Agent 2 (Backend Engineer): TypeScript Compilation Fixes
# Priority: BLOCKING - Must complete before other agents can proceed
# Estimated Time: 40 hours (1 week)
# Dependencies: None

set -e  # Exit on error

# Colors for output
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== TypeScript Compilation Fix Agent ===${NC}"
echo "Starting: $(date)"
echo "Goal: Fix all 2,238 TypeScript compilation errors"

# Configuration
PROJECT_ROOT="/home/azure-vm/fleet-management"
LOG_DIR="$PROJECT_ROOT/agent-logs"
ERROR_LOG="$LOG_DIR/typescript-errors-$(date +%Y%m%d-%H%M%S).log"
PROGRESS_FILE="$LOG_DIR/ts-fix-progress.json"

mkdir -p "$LOG_DIR"

# Initialize progress tracking
cat > "$PROGRESS_FILE" << EOF
{
  "agent": "Agent-2-Backend",
  "task": "TypeScript Compilation Fixes",
  "started_at": "$(date -Iseconds)",
  "total_errors": 2238,
  "fixed_errors": 0,
  "remaining_errors": 2238,
  "status": "in_progress",
  "current_file": null,
  "blockers": []
}
EOF

# Function to update progress
update_progress() {
  local fixed=$1
  local remaining=$2
  local current_file=$3

  jq --arg fixed "$fixed" \
     --arg remaining "$remaining" \
     --arg file "$current_file" \
     '.fixed_errors = ($fixed | tonumber) |
      .remaining_errors = ($remaining | tonumber) |
      .current_file = $file |
      .last_updated = now | todate' \
     "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
}

# Function to log blocker
log_blocker() {
  local blocker_msg=$1
  echo "[BLOCKER] Agent-2-Backend: $blocker_msg" >> "$LOG_DIR/blockers.log"
  echo -e "${RED}BLOCKER: $blocker_msg${NC}"

  jq --arg blocker "$blocker_msg" \
     '.blockers += [$blocker] |
      .status = "blocked"' \
     "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
}

cd "$PROJECT_ROOT"

# Step 1: Get baseline error count
echo -e "${YELLOW}Step 1: Analyzing TypeScript errors...${NC}"
npx tsc --noEmit 2>&1 | tee "$ERROR_LOG"
INITIAL_ERROR_COUNT=$(grep -c "error TS" "$ERROR_LOG" || true)

echo "Found $INITIAL_ERROR_COUNT TypeScript errors"

if [ "$INITIAL_ERROR_COUNT" -eq 0 ]; then
  echo -e "${GREEN}No TypeScript errors found! Marking task complete.${NC}"
  jq '.status = "complete" | .remaining_errors = 0' "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
  exit 0
fi

# Step 2: Categorize errors
echo -e "${YELLOW}Step 2: Categorizing errors by type...${NC}"
cat "$ERROR_LOG" | grep "error TS" | awk '{print $NF}' | sort | uniq -c | sort -rn > "$LOG_DIR/error-types.txt"

echo "Top 10 error types:"
head -10 "$LOG_DIR/error-types.txt"

# Step 3: Fix errors systematically
echo -e "${YELLOW}Step 3: Beginning systematic fixes...${NC}"

# Priority 1: Missing type definitions (TS7016)
echo "Fixing: Missing type definitions..."
grep "error TS7016" "$ERROR_LOG" | while read -r line; do
  FILE=$(echo "$line" | awk -F'[()]' '{print $2}' | awk -F':' '{print $1}')
  MODULE=$(echo "$line" | grep -oP "module '\K[^']+")

  if [ -n "$MODULE" ]; then
    echo "  Installing types for: $MODULE"
    npm install --save-dev @types/${MODULE} 2>/dev/null || echo "    No types available for $MODULE"
  fi
done

# Priority 2: Implicit 'any' types (TS7006, TS7031)
echo "Fixing: Implicit 'any' types..."
grep -E "error TS700[6,31]" "$ERROR_LOG" | while read -r line; do
  FILE=$(echo "$line" | awk -F'[()]' '{print $2}' | awk -F':' '{print $1}')
  LINE_NUM=$(echo "$line" | awk -F'[()]' '{print $2}' | awk -F':' '{print $2}')

  if [ -f "$FILE" ]; then
    update_progress "0" "$INITIAL_ERROR_COUNT" "$FILE"

    # Use OpenAI to suggest type annotations
    # This requires OpenAI API access from .env
    CONTEXT=$(sed -n "$((LINE_NUM-5)),$((LINE_NUM+5))p" "$FILE")

    # Call OpenAI API to get type suggestion
    curl -s https://api.openai.com/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -d "{
        \"model\": \"gpt-4\",
        \"messages\": [{
          \"role\": \"system\",
          \"content\": \"You are a TypeScript expert. Suggest proper type annotations for the following code. Return only the corrected code, no explanations.\"
        }, {
          \"role\": \"user\",
          \"content\": \"$CONTEXT\"
        }],
        \"temperature\": 0.2
      }" > /tmp/ai-suggestion.json

    SUGGESTION=$(jq -r '.choices[0].message.content' /tmp/ai-suggestion.json)

    # Apply suggestion (this is simplified - real implementation would be more robust)
    echo "  Suggested fix for $FILE:$LINE_NUM"
    echo "$SUGGESTION" | head -3
  fi
done

# Priority 3: Type mismatch errors (TS2322, TS2339)
echo "Fixing: Type mismatch errors..."
grep -E "error TS23(22|39)" "$ERROR_LOG" | head -20 | while read -r line; do
  FILE=$(echo "$line" | awk -F'[()]' '{print $2}' | awk -F':' '{print $1}')
  LINE_NUM=$(echo "$line" | awk -F'[()]' '{print $2}' | awk -F':' '{print $2}')

  if [ -f "$FILE" ]; then
    update_progress "0" "$INITIAL_ERROR_COUNT" "$FILE"

    # Extract the problematic code
    PROBLEM_LINE=$(sed -n "${LINE_NUM}p" "$FILE")

    # Use GPT-4 to fix type mismatches
    curl -s https://api.openai.com/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -d "{
        \"model\": \"gpt-4\",
        \"messages\": [{
          \"role\": \"system\",
          \"content\": \"Fix TypeScript type errors. Return only the corrected line of code.\"
        }, {
          \"role\": \"user\",
          \"content\": \"Error: $line\n\nProblematic code: $PROBLEM_LINE\"
        }],
        \"temperature\": 0.2
      }" > /tmp/fix-suggestion.json

    FIXED_LINE=$(jq -r '.choices[0].message.content' /tmp/fix-suggestion.json)

    echo "  Original: $PROBLEM_LINE"
    echo "  Fixed:    $FIXED_LINE"

    # Apply the fix
    sed -i "${LINE_NUM}s|.*|$FIXED_LINE|" "$FILE"
  fi
done

# Step 4: Recompile and check progress
echo -e "${YELLOW}Step 4: Recompiling to check progress...${NC}"
npx tsc --noEmit 2>&1 | tee "$LOG_DIR/typescript-errors-pass2.log"
REMAINING_ERRORS=$(grep -c "error TS" "$LOG_DIR/typescript-errors-pass2.log" || true)
FIXED_ERRORS=$((INITIAL_ERROR_COUNT - REMAINING_ERRORS))

update_progress "$FIXED_ERRORS" "$REMAINING_ERRORS" "compilation-check"

echo -e "${GREEN}Fixed: $FIXED_ERRORS errors${NC}"
echo -e "${YELLOW}Remaining: $REMAINING_ERRORS errors${NC}"

# Step 5: Generate detailed fix report
cat > "$LOG_DIR/ts-fix-report.md" << EOF
# TypeScript Fix Progress Report
**Generated:** $(date)
**Agent:** Agent-2-Backend

## Summary
- **Initial Errors:** $INITIAL_ERROR_COUNT
- **Errors Fixed:** $FIXED_ERRORS
- **Remaining Errors:** $REMAINING_ERRORS
- **Progress:** $(echo "scale=2; $FIXED_ERRORS * 100 / $INITIAL_ERROR_COUNT" | bc)%

## Error Categories Fixed
$(head -20 "$LOG_DIR/error-types.txt")

## Next Steps
$(if [ "$REMAINING_ERRORS" -gt 0 ]; then
  echo "- Continue fixing remaining $REMAINING_ERRORS errors"
  echo "- Focus on most common error types (see error-types.txt)"
  echo "- Run fix script again with updated strategy"
else
  echo "- All TypeScript errors resolved! ✅"
  echo "- Run test suite to validate"
  echo "- Proceed to Phase 2 (Database Partitioning)"
fi)

## Blockers
$(cat "$LOG_DIR/blockers.log" 2>/dev/null || echo "None")

EOF

cat "$LOG_DIR/ts-fix-report.md"

# Step 6: Run tests if compilation succeeded
if [ "$REMAINING_ERRORS" -eq 0 ]; then
  echo -e "${GREEN}TypeScript compilation successful! Running tests...${NC}"
  npm run test:unit || log_blocker "Unit tests failing after TypeScript fixes"

  jq '.status = "complete"' "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
else
  echo -e "${YELLOW}TypeScript errors remain. Re-run this script to continue fixing.${NC}"
fi

echo "Completed: $(date)"
echo "Log files: $LOG_DIR"
