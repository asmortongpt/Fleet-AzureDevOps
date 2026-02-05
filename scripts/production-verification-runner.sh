#!/bin/bash
#
# Production Verification Runner
# Orchestrates the full verification loop with cryptographic evidence
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EVIDENCE_BASE="$PROJECT_DIR/verification-evidence"
MAX_ITERATIONS=10
STABILITY_REQUIRED=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==========================================="
echo "PRODUCTION VERIFICATION RUNNER"
echo "==========================================="
echo -e "Max Iterations: $MAX_ITERATIONS"
echo -e "Stability Required: $STABILITY_REQUIRED"
echo -e "===========================================${NC}"

# Get current commit SHA
COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
echo -e "${YELLOW}Commit SHA: $COMMIT_SHA${NC}"

# Initialize counters
stability_counter=0
iteration=0
last_stable_sha=""

# Create evidence base directory
mkdir -p "$EVIDENCE_BASE/manifests" "$EVIDENCE_BASE/signatures"

# Function to run verification
run_verification() {
    local run_id="run-$(date +%s)"
    local run_dir="$EVIDENCE_BASE/$run_id"

    echo -e "\n${BLUE}--- Starting verification run: $run_id ---${NC}"

    # Run Playwright tests
    cd "$PROJECT_DIR"

    # Start dev server in background if not running
    if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "Starting dev server..."
        npm run dev &
        DEV_PID=$!
        sleep 10
    fi

    # Run verification tests
    # Note: use the repo-local Playwright CLI to avoid network calls via npx.
    ./node_modules/.bin/playwright test tests/e2e/production-verification-suite.spec.ts \
        --project=chromium \
        --reporter=json \
        --output="$run_dir" 2>&1 || true

    # Find the gate.json from the run
    local gate_file=$(find "$run_dir" -name "gate.json" 2>/dev/null | head -1)

    if [[ -f "$gate_file" ]]; then
        local gate_score=$(jq -r '.gateScore' "$gate_file" 2>/dev/null || echo "0/10")
        local passed=$(jq -r '.passed' "$gate_file" 2>/dev/null || echo "false")

        echo -e "${YELLOW}Gate Score: $gate_score${NC}"

        if [[ "$passed" == "true" ]]; then
            echo -e "${GREEN}✅ All gates passed!${NC}"
            return 0
        else
            echo -e "${RED}❌ Some gates failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}Gate file not found${NC}"
        return 1
    fi
}

# Main loop
while [[ $iteration -lt $MAX_ITERATIONS ]]; do
    ((iteration++))
    echo -e "\n${BLUE}========== ITERATION $iteration of $MAX_ITERATIONS ==========${NC}"

    current_sha=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

    # Check if SHA changed - reset stability
    if [[ "$current_sha" != "$last_stable_sha" && -n "$last_stable_sha" ]]; then
        echo -e "${YELLOW}SHA changed, resetting stability counter${NC}"
        stability_counter=0
    fi

    if run_verification; then
        ((stability_counter++))
        last_stable_sha="$current_sha"
        echo -e "${GREEN}Stability: $stability_counter/$STABILITY_REQUIRED${NC}"

        if [[ $stability_counter -ge $STABILITY_REQUIRED ]]; then
            echo -e "\n${GREEN}==========================================="
            echo "🎉 PRODUCTION VERIFICATION COMPLETE!"
            echo "Stability achieved: $stability_counter consecutive passes"
            echo "Commit SHA: $current_sha"
            echo -e "===========================================${NC}"
            exit 0
        fi
    else
        echo -e "${YELLOW}Verification failed, stability reset${NC}"
        stability_counter=0
    fi
done

echo -e "\n${RED}==========================================="
echo "❌ MAX ITERATIONS REACHED"
echo "Could not achieve stability after $MAX_ITERATIONS iterations"
echo -e "===========================================${NC}"
exit 1
