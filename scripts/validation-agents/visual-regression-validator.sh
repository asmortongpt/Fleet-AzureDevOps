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
