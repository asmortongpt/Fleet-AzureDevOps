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
