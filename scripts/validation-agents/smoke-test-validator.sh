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
