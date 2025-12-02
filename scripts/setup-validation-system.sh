#!/bin/bash

################################################################################
# Setup Deployment Validation System
# Purpose: Generate all validation scripts and configuration
################################################################################

set -euo pipefail

FLEET_ROOT="/Users/andrewmorton/Documents/GitHub/Fleet"
SCRIPTS_DIR="${FLEET_ROOT}/scripts"
AGENTS_DIR="${SCRIPTS_DIR}/validation-agents"

echo "Setting up Deployment Validation System..."
echo "Fleet Root: $FLEET_ROOT"
echo "Scripts Dir: $SCRIPTS_DIR"
echo "Agents Dir: $AGENTS_DIR"
echo ""

# Create directories
mkdir -p "$AGENTS_DIR"
mkdir -p "${FLEET_ROOT}/validation-results"
mkdir -p "${FLEET_ROOT}/incident-reports"

echo "✓ Created directories"

# Create deployment-validation-monitor.sh
cat > "${SCRIPTS_DIR}/deployment-validation-monitor.sh" <<'MONITOREOF'
#!/bin/bash
################################################################################
# Deployment Validation and Automatic Rollback Monitor
# Purpose: Collect validation results and trigger rollback if ANY test fails
################################################################################
set -euo pipefail
NAMESPACE="${NAMESPACE:-fleet-management}"
DEPLOYMENT_NAME="${DEPLOYMENT_NAME:-fleet-app}"
VALIDATION_TIMEOUT="${VALIDATION_TIMEOUT:-600}"
RESULTS_DIR="${RESULTS_DIR:-./validation-results}"
INCIDENT_REPORT_DIR="${INCIDENT_REPORT_DIR:-./incident-reports}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
mkdir -p "$RESULTS_DIR" "$INCIDENT_REPORT_DIR"
get_current_revision() {
    kubectl rollout status deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE" --timeout=5m >/dev/null 2>&1
    kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}'
}
check_validation_result() {
    local agent_name=$1
    local result_file="${RESULTS_DIR}/${agent_name}-result.json"
    if [ ! -f "$result_file" ]; then
        log_error "$agent_name: Result file not found"
        echo "FAILED"
        return 1
    fi
    local status=$(jq -r '.status // "UNKNOWN"' "$result_file" 2>/dev/null || echo "UNKNOWN")
    local passed=$(jq -r '.passed // false' "$result_file" 2>/dev/null || echo "false")
    if [ "$status" = "PASSED" ] || [ "$passed" = "true" ]; then
        log_success "$agent_name: PASSED"
        echo "PASSED"
        return 0
    else
        log_error "$agent_name: FAILED"
        echo "FAILED"
        return 1
    fi
}
execute_rollback() {
    log_error "Initiating automatic rollback..."
    if kubectl rollout undo deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE"; then
        log_success "Rollback executed successfully"
        kubectl rollout status deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE" --timeout=5m
        return 0
    else
        log_error "Rollback failed"
        return 1
    fi
}
main() {
    log_info "=== Starting Deployment Validation Monitor ==="
    declare -a failed_validations=()
    local all_passed=true
    for agent in pdca-validator visual-regression performance-tester smoke-tester; do
        if ! check_validation_result "$agent"; then
            failed_validations+=("$agent")
            all_passed=false
        fi
    done
    if [ "$all_passed" = true ]; then
        log_success "ALL TESTS PASSED"
        echo '{"status":"SUCCESS"}' > "${RESULTS_DIR}/deployment-success-${TIMESTAMP}.json"
        exit 0
    else
        log_error "VALIDATION FAILURES: ${failed_validations[*]}"
        execute_rollback
        echo "{\"status\":\"ROLLBACK\",\"failed\":[\"${failed_validations[*]}\"]}" > "${RESULTS_DIR}/deployment-rollback-${TIMESTAMP}.json"
        exit 1
    fi
}
main "$@"
MONITOREOF

echo "✓ Created deployment-validation-monitor.sh"

# Create submit-validation-result.sh
cat > "${SCRIPTS_DIR}/submit-validation-result.sh" <<'SUBMITEOF'
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
SUBMITEOF

echo "✓ Created submit-validation-result.sh"

# Create PDCA validator
cat > "${AGENTS_DIR}/pdca-validator.sh" <<'PDCAEOF'
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="${NAMESPACE:-fleet-management}"
DEPLOYMENT_NAME="${DEPLOYMENT_NAME:-fleet-app}"
log_info() { echo "[PDCA] $*"; }
validate_deployment() {
    kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" >/dev/null 2>&1 || return 1
    local ready=$(kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    [ "$ready" -gt 0 ] || return 1
    return 0
}
main() {
    log_info "Starting PDCA validation..."
    if validate_deployment; then
        log_info "PDCA validation PASSED"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" "pdca-validator" "PASSED"
        exit 0
    else
        log_info "PDCA validation FAILED"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" "pdca-validator" "FAILED" "Deployment not healthy"
        exit 1
    fi
}
main "$@"
PDCAEOF

echo "✓ Created pdca-validator.sh"

# Create visual regression validator
cat > "${AGENTS_DIR}/visual-regression-validator.sh" <<'VISUALEOF'
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${BASE_URL:-https://fleet.capitaltechalliance.com}"
log_info() { echo "[VISUAL] $*"; }
test_homepage() {
    curl -f -s "${BASE_URL}/" >/dev/null 2>&1 || return 1
    return 0
}
main() {
    log_info "Starting visual regression validation..."
    if test_homepage; then
        log_info "Visual regression PASSED"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" "visual-regression" "PASSED"
        exit 0
    else
        log_info "Visual regression FAILED"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" "visual-regression" "FAILED" "Homepage test failed"
        exit 1
    fi
}
main "$@"
VISUALEOF

echo "✓ Created visual-regression-validator.sh"

# Create performance validator
cat > "${AGENTS_DIR}/performance-validator.sh" <<'PERFEOF'
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${BASE_URL:-https://fleet.capitaltechalliance.com}"
log_info() { echo "[PERFORMANCE] $*"; }
test_response_time() {
    local start=$(date +%s%N)
    curl -f -s "${BASE_URL}/api/health" >/dev/null 2>&1 || return 1
    local end=$(date +%s%N)
    local duration_ms=$(( (end - start) / 1000000 ))
    log_info "Response time: ${duration_ms}ms"
    [ $duration_ms -lt 5000 ] || return 1
    return 0
}
main() {
    log_info "Starting performance validation..."
    if test_response_time; then
        log_info "Performance validation PASSED"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" "performance-tester" "PASSED"
        exit 0
    else
        log_info "Performance validation FAILED"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" "performance-tester" "FAILED" "Response time exceeded threshold"
        exit 1
    fi
}
main "$@"
PERFEOF

echo "✓ Created performance-validator.sh"

# Update smoke-test-validator if it exists or create new one
cat > "${AGENTS_DIR}/smoke-test-validator.sh" <<'SMOKEEOF'
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${BASE_URL:-https://fleet.capitaltechalliance.com}"
NAMESPACE="${NAMESPACE:-fleet-management}"
log_info() { echo "[SMOKE-TEST] $*"; }
test_health() {
    curl -f -s "${BASE_URL}/api/health" >/dev/null 2>&1 || return 1
    return 0
}
test_pods_running() {
    local running=$(kubectl get pods -n "$NAMESPACE" -l app=fleet --field-selector=status.phase=Running 2>/dev/null | wc -l)
    [ "$running" -gt 1 ] || return 1
    return 0
}
main() {
    log_info "Starting smoke test validation..."
    local all_passed=true
    if ! test_health; then
        log_info "Health check FAILED"
        all_passed=false
    fi
    if ! test_pods_running; then
        log_info "Pods check FAILED"
        all_passed=false
    fi
    if [ "$all_passed" = true ]; then
        log_info "Smoke tests PASSED"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" "smoke-tester" "PASSED"
        exit 0
    else
        log_info "Smoke tests FAILED"
        bash "${SCRIPT_DIR}/../submit-validation-result.sh" "smoke-tester" "FAILED" "Smoke tests failed"
        exit 1
    fi
}
main "$@"
SMOKEEOF

echo "✓ Created smoke-test-validator.sh"

# Make all scripts executable
chmod +x "${SCRIPTS_DIR}/deployment-validation-monitor.sh"
chmod +x "${SCRIPTS_DIR}/submit-validation-result.sh"
chmod +x "${SCRIPTS_DIR}/orchestrate-deployment-validation.sh"
chmod +x "${AGENTS_DIR}"/*.sh

echo "✓ Made all scripts executable"

echo ""
echo "========================================"
echo "Deployment Validation System Setup Complete!"
echo "========================================"
echo ""
echo "Scripts created:"
echo "  - ${SCRIPTS_DIR}/deployment-validation-monitor.sh"
echo "  - ${SCRIPTS_DIR}/submit-validation-result.sh"
echo "  - ${SCRIPTS_DIR}/orchestrate-deployment-validation.sh"
echo "  - ${AGENTS_DIR}/pdca-validator.sh"
echo "  - ${AGENTS_DIR}/visual-regression-validator.sh"
echo "  - ${AGENTS_DIR}/performance-validator.sh"
echo "  - ${AGENTS_DIR}/smoke-test-validator.sh"
echo ""
echo "To run validation:"
echo "  cd $FLEET_ROOT"
echo "  ./scripts/orchestrate-deployment-validation.sh"
echo ""
