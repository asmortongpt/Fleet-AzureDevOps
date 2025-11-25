#!/bin/bash
#=============================================================================
# Watch Deployment Progress - Real-time Monitoring Dashboard
#=============================================================================
# Provides a real-time view of deployment status, pod health, and logs
#
# USAGE:
#   ./watch-deployment.sh [ENVIRONMENT]
#=============================================================================

set -euo pipefail

ENVIRONMENT="${1:-staging}"
NAMESPACE="fleet-management-${ENVIRONMENT}"
DEPLOYMENT_NAME="fleet-app"
API_DEPLOYMENT_NAME="fleet-api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}ℹ${NC} $*"
}

log_success() {
  echo -e "${GREEN}✅${NC} $*"
}

log_warn() {
  echo -e "${YELLOW}⚠️${NC} $*"
}

log_error() {
  echo -e "${RED}❌${NC} $*"
}

#=============================================================================
# Display Functions
#=============================================================================

display_header() {
  clear
  echo "╔══════════════════════════════════════════════════════════════════╗"
  echo "║       Fleet Management - Deployment Monitor                      ║"
  echo "╚══════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Environment:   ${ENVIRONMENT}"
  echo "  Namespace:     ${NAMESPACE}"
  echo "  Updated:       $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
}

display_deployment_status() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "DEPLOYMENT STATUS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Frontend deployment
  local frontend_status=$(kubectl get deployment "${DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    -o jsonpath='{.status.conditions[?(@.type=="Progressing")].status}' 2>/dev/null || echo "Unknown")

  local frontend_ready=$(kubectl get deployment "${DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

  local frontend_desired=$(kubectl get deployment "${DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0")

  echo "Frontend: ${frontend_ready}/${frontend_desired} ready"

  # API deployment
  local api_ready=$(kubectl get deployment "${API_DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

  local api_desired=$(kubectl get deployment "${API_DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0")

  echo "API:      ${api_ready}/${api_desired} ready"
  echo ""
}

display_pod_status() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "POD STATUS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  kubectl get pods -n "${NAMESPACE}" \
    -l "app in (${DEPLOYMENT_NAME},${API_DEPLOYMENT_NAME})" \
    --sort-by=.metadata.creationTimestamp 2>/dev/null || echo "No pods found"

  echo ""
}

display_recent_events() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "RECENT EVENTS (last 10)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  kubectl get events \
    -n "${NAMESPACE}" \
    --sort-by='.lastTimestamp' \
    --field-selector involvedObject.kind=Pod \
    2>/dev/null | tail -10 || echo "No events found"

  echo ""
}

display_rollout_status() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "ROLLOUT STATUS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Frontend rollout status
  echo "Frontend:"
  kubectl rollout status deployment/"${DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    --timeout=1s 2>/dev/null || echo "  Rollout in progress..."

  echo ""
  echo "API:"
  kubectl rollout status deployment/"${API_DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    --timeout=1s 2>/dev/null || echo "  Rollout in progress..."

  echo ""
}

display_recent_logs() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "RECENT LOGS (last 15 lines)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Get most recent pod
  local pod=$(kubectl get pods -n "${NAMESPACE}" \
    -l app="${DEPLOYMENT_NAME}" \
    --sort-by=.metadata.creationTimestamp \
    -o jsonpath='{.items[-1:].metadata.name}' 2>/dev/null)

  if [ -n "${pod}" ]; then
    echo "Pod: ${pod}"
    kubectl logs "${pod}" -n "${NAMESPACE}" --tail=15 2>/dev/null || echo "No logs available"
  else
    echo "No pods available"
  fi

  echo ""
}

display_help() {
  cat <<EOF
Controls:
  Press Ctrl+C to exit
  Updates every 5 seconds

Namespace: ${NAMESPACE}
EOF
}

#=============================================================================
# Main Monitoring Loop
#=============================================================================

main() {
  # Verify namespace exists
  if ! kubectl get namespace "${NAMESPACE}" &> /dev/null; then
    log_error "Namespace ${NAMESPACE} does not exist"
    exit 1
  fi

  log_info "Starting deployment monitor for ${ENVIRONMENT}"
  log_info "Press Ctrl+C to exit"
  sleep 2

  # Monitor loop
  while true; do
    display_header
    display_deployment_status
    display_pod_status
    display_rollout_status
    display_recent_events
    display_recent_logs
    display_help

    # Wait before refresh
    sleep 5
  done
}

# Cleanup on exit
cleanup() {
  clear
  echo "Deployment monitor stopped"
}

trap cleanup EXIT INT TERM

main "$@"
