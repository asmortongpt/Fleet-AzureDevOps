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
