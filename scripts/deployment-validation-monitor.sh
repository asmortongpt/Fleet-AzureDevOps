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
