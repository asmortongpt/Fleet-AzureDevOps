#!/bin/bash
#=============================================================================
# Monitor ACR Build Progress
#=============================================================================
# Monitors Azure Container Registry build tasks and waits for completion
#
# USAGE:
#   ./monitor-acr-build.sh [BUILD_ID]
#   ./monitor-acr-build.sh latest
#
# If BUILD_ID is not provided, monitors the most recent build
#=============================================================================

set -euo pipefail

ACR_NAME="fleetappregistry"
BUILD_ID="${1:-}"
TIMEOUT=1200  # 20 minutes

#=============================================================================
# Utility Functions
#=============================================================================

log() {
  echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - $*"
}

#=============================================================================
# Get Latest Build ID
#=============================================================================

get_latest_build() {
  log "Fetching latest ACR build..."

  local latest_build=$(az acr task list-runs \
    --registry "${ACR_NAME}" \
    --top 1 \
    --query "[0].runId" \
    -o tsv 2>/dev/null)

  if [ -z "${latest_build}" ]; then
    log "ERROR: No builds found in ACR"
    exit 1
  fi

  echo "${latest_build}"
}

#=============================================================================
# Monitor Build Progress
#=============================================================================

monitor_build() {
  local build_id="$1"
  local elapsed=0

  log "Monitoring build: ${build_id}"
  log "ACR: ${ACR_NAME}"
  log "Timeout: ${TIMEOUT}s"
  echo ""

  while [ $elapsed -lt $TIMEOUT ]; do
    # Get build status
    local status=$(az acr task list-runs \
      --registry "${ACR_NAME}" \
      --run-id "${build_id}" \
      --query "[0].status" \
      -o tsv 2>/dev/null)

    case "${status}" in
      Succeeded)
        log "✅ BUILD SUCCESSFUL"
        echo ""
        log "Build completed: ${build_id}"

        # Show build details
        az acr task list-runs \
          --registry "${ACR_NAME}" \
          --run-id "${build_id}" \
          --output table

        # List generated images
        echo ""
        log "Images generated:"
        az acr repository show-tags \
          --name "${ACR_NAME}" \
          --repository fleet-frontend \
          --top 5 \
          --orderby time_desc \
          --output table

        az acr repository show-tags \
          --name "${ACR_NAME}" \
          --repository fleet-api \
          --top 5 \
          --orderby time_desc \
          --output table

        return 0
        ;;

      Failed)
        log "❌ BUILD FAILED"
        echo ""

        # Show error logs
        log "Fetching build logs..."
        az acr task logs \
          --registry "${ACR_NAME}" \
          --run-id "${build_id}" 2>&1 | tail -50

        return 1
        ;;

      Running|Queued|Started)
        if [ $((elapsed % 30)) -eq 0 ]; then
          log "Build ${status}... (${elapsed}s / ${TIMEOUT}s)"

          # Show progress if available
          az acr task list-runs \
            --registry "${ACR_NAME}" \
            --run-id "${build_id}" \
            --query "[0].{Status:status,StartTime:startTime,UpdateTime:updateTime}" \
            -o table 2>/dev/null || true
        fi
        ;;

      Canceled|Timeout)
        log "❌ BUILD ${status}"
        return 1
        ;;

      *)
        log "⚠️  Unknown build status: ${status}"
        ;;
    esac

    sleep 10
    elapsed=$((elapsed + 10))
  done

  log "❌ BUILD TIMEOUT after ${TIMEOUT}s"
  return 1
}

#=============================================================================
# Main
#=============================================================================

main() {
  # Verify Azure CLI
  if ! command -v az &> /dev/null; then
    log "ERROR: Azure CLI not found"
    exit 1
  fi

  # Verify authentication
  if ! az account show &> /dev/null; then
    log "ERROR: Not authenticated to Azure. Run: az login"
    exit 1
  fi

  # Get build ID
  if [ -z "${BUILD_ID}" ]; then
    BUILD_ID=$(get_latest_build)
    log "Monitoring latest build: ${BUILD_ID}"
  else
    log "Monitoring specified build: ${BUILD_ID}"
  fi

  # Monitor build
  if monitor_build "${BUILD_ID}"; then
    echo ""
    log "✅ Build monitoring complete - build succeeded"
    exit 0
  else
    echo ""
    log "❌ Build monitoring complete - build failed"
    exit 1
  fi
}

main "$@"
