#!/bin/bash
set -euo pipefail
RESULTS_DIR="${RESULTS_DIR:-./validation-results}"
AGENT_NAME="${1:-unknown-agent}"
STATUS="${2:-UNKNOWN}"
ERROR_MESSAGE="${3:-}"
SCREENSHOT_PATH="${4:-}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
RESULT_FILE="${RESULTS_DIR}/${AGENT_NAME}-result.json"
mkdir -p "$RESULTS_DIR"
PASSED=false
[ "$STATUS" = "PASSED" ] && PASSED=true
cat > "$RESULT_FILE" <<EOF
{
  "agent": "$AGENT_NAME",
  "status": "$STATUS",
  "timestamp": "$TIMESTAMP",
  "passed": $PASSED,
  "error": "${ERROR_MESSAGE}",
  "screenshot": "${SCREENSHOT_PATH}"
}
EOF
echo "Result submitted: $RESULT_FILE"
