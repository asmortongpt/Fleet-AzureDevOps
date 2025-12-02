#!/bin/bash
#=============================================================================
# Fleet Management - Automated Deployment with Validation & Auto-Rollback
#=============================================================================
# This script implements a complete PDCA loop for deployment:
# - PLAN: Verify prerequisites and prepare deployment
# - DO: Execute deployment to AKS
# - CHECK: Run Playwright tests against production URL
# - ACT: Auto-rollback on failure, promote on success
#
# USAGE:
#   ./deploy-with-validation.sh [ENVIRONMENT] [IMAGE_TAG]
#
# EXAMPLES:
#   ./deploy-with-validation.sh staging stage-a-requirements-inception-12345
#   ./deploy-with-validation.sh production v1.2.3
#
# PREREQUISITES:
#   - Azure CLI authenticated (az login)
#   - kubectl configured for AKS cluster
#   - ACR image already built and pushed
#   - Playwright installed (npm install -g playwright)
#=============================================================================

set -euo pipefail

#=============================================================================
# Configuration
#=============================================================================
ENVIRONMENT="${1:-staging}"
IMAGE_TAG="${2:-latest}"

# Azure Resources
ACR_NAME="fleetappregistry"
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
AKS_CLUSTER="fleet-aks-cluster"
AKS_RESOURCE_GROUP="fleet-production-rg"

# Deployment Configuration
NAMESPACE="fleet-management-${ENVIRONMENT}"
DEPLOYMENT_NAME="fleet-app"
API_DEPLOYMENT_NAME="fleet-api"
FRONTEND_IMAGE="${ACR_LOGIN_SERVER}/fleet-frontend:${IMAGE_TAG}"
API_IMAGE="${ACR_LOGIN_SERVER}/fleet-api:${IMAGE_TAG}"

# Timeouts (in seconds)
BUILD_TIMEOUT=1200      # 20 minutes for ACR build
ROLLOUT_TIMEOUT=600     # 10 minutes for K8s rollout
HEALTH_TIMEOUT=300      # 5 minutes for health checks
TEST_TIMEOUT=900        # 15 minutes for Playwright tests

# URLs
case "${ENVIRONMENT}" in
  production)
    APP_URL="https://fleet.capitaltechalliance.com"
    ;;
  staging)
    APP_URL="https://fleet-staging.capitaltechalliance.com"
    ;;
  dev)
    APP_URL="https://fleet-dev.capitaltechalliance.com"
    ;;
  *)
    echo "❌ Error: Invalid environment '${ENVIRONMENT}'"
    echo "   Valid options: production, staging, dev"
    exit 1
    ;;
esac

# Rollback Configuration
ROLLBACK_ENABLED=true
PREVIOUS_REVISION=""
DEPLOYMENT_START_TIME=""

# Logging
LOG_DIR="/tmp/fleet-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/deployment.log"
VALIDATION_LOG="${LOG_DIR}/validation.log"
INCIDENT_REPORT="${LOG_DIR}/incident-report.json"

#=============================================================================
# Utility Functions
#=============================================================================

log() {
  local level="$1"
  shift
  local message="$*"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  case "${level}" in
    INFO)  echo "🔵 [INFO]  ${message}" ;;
    WARN)  echo "🟡 [WARN]  ${message}" ;;
    ERROR) echo "🔴 [ERROR] ${message}" ;;
    SUCCESS) echo "✅ [SUCCESS] ${message}" ;;
    STEP) echo "" && echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && echo "▶ ${message}" && echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" ;;
  esac

  echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"
}

create_incident_report() {
  local failure_stage="$1"
  local error_message="$2"

  cat > "${INCIDENT_REPORT}" <<EOF
{
  "incident_id": "DEPLOY-$(date +%s)",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "${ENVIRONMENT}",
  "image_tag": "${IMAGE_TAG}",
  "failure_stage": "${failure_stage}",
  "error_message": "${error_message}",
  "deployment_duration": "$(($(date +%s) - DEPLOYMENT_START_TIME)) seconds",
  "rollback_executed": "${ROLLBACK_ENABLED}",
  "logs": {
    "deployment_log": "${LOG_FILE}",
    "validation_log": "${VALIDATION_LOG}"
  }
}
EOF

  log ERROR "Incident report created: ${INCIDENT_REPORT}"
  cat "${INCIDENT_REPORT}"
}

#=============================================================================
# Phase 1: PLAN - Verify Prerequisites
#=============================================================================

verify_prerequisites() {
  log STEP "Phase 1: PLAN - Verifying Prerequisites"

  # Check Azure CLI
  if ! command -v az &> /dev/null; then
    log ERROR "Azure CLI not found. Install from: https://aka.ms/installazurecli"
    exit 1
  fi
  log INFO "Azure CLI: $(az version --query '\"azure-cli\"' -o tsv)"

  # Check kubectl
  if ! command -v kubectl &> /dev/null; then
    log ERROR "kubectl not found. Install from: https://kubernetes.io/docs/tasks/tools/"
    exit 1
  fi
  log INFO "kubectl: $(kubectl version --client -o json 2>/dev/null | grep -o '"gitVersion":"[^"]*"' | cut -d'"' -f4)"

  # Check Playwright
  if ! command -v npx playwright &> /dev/null && ! command -v playwright &> /dev/null; then
    log WARN "Playwright not found. Installing..."
    npm install -g playwright
    npx playwright install chromium
  fi
  log INFO "Playwright: Available"

  # Verify Azure authentication
  if ! az account show &> /dev/null; then
    log ERROR "Not authenticated to Azure. Run: az login"
    exit 1
  fi
  log SUCCESS "Azure authentication verified"

  # Verify AKS access
  if ! kubectl cluster-info &> /dev/null; then
    log WARN "Getting AKS credentials..."
    az aks get-credentials \
      --resource-group "${AKS_RESOURCE_GROUP}" \
      --name "${AKS_CLUSTER}" \
      --overwrite-existing
  fi
  log SUCCESS "Kubernetes cluster access verified"

  # Check namespace exists
  if ! kubectl get namespace "${NAMESPACE}" &> /dev/null; then
    log ERROR "Namespace ${NAMESPACE} does not exist"
    exit 1
  fi
  log SUCCESS "Namespace ${NAMESPACE} exists"
}

#=============================================================================
# Phase 2: Wait for ACR Build (if needed)
#=============================================================================

wait_for_acr_build() {
  log STEP "Phase 2: Waiting for ACR Build Completion"

  local build_id="${IMAGE_TAG}"
  local elapsed=0

  log INFO "Checking if image exists: ${FRONTEND_IMAGE}"

  # Check if image exists in ACR
  if az acr repository show-tags \
      --name "${ACR_NAME}" \
      --repository fleet-frontend \
      --output tsv 2>/dev/null | grep -q "^${IMAGE_TAG}$"; then
    log SUCCESS "Frontend image found in ACR: ${IMAGE_TAG}"
  else
    log WARN "Frontend image not found in ACR: ${IMAGE_TAG}"
    log INFO "Waiting for ACR build to complete (timeout: ${BUILD_TIMEOUT}s)..."

    while [ $elapsed -lt $BUILD_TIMEOUT ]; do
      if az acr repository show-tags \
          --name "${ACR_NAME}" \
          --repository fleet-frontend \
          --output tsv 2>/dev/null | grep -q "^${IMAGE_TAG}$"; then
        log SUCCESS "Frontend image build completed: ${IMAGE_TAG}"
        break
      fi

      sleep 10
      elapsed=$((elapsed + 10))

      if [ $((elapsed % 60)) -eq 0 ]; then
        log INFO "Still waiting... (${elapsed}s / ${BUILD_TIMEOUT}s)"
      fi
    done

    if [ $elapsed -ge $BUILD_TIMEOUT ]; then
      create_incident_report "ACR_BUILD_TIMEOUT" "Frontend image not available after ${BUILD_TIMEOUT}s"
      exit 1
    fi
  fi

  # Check API image
  log INFO "Checking if API image exists: ${API_IMAGE}"

  if az acr repository show-tags \
      --name "${ACR_NAME}" \
      --repository fleet-api \
      --output tsv 2>/dev/null | grep -q "^${IMAGE_TAG}$"; then
    log SUCCESS "API image found in ACR: ${IMAGE_TAG}"
  else
    log ERROR "API image not found in ACR: ${IMAGE_TAG}"
    create_incident_report "ACR_BUILD_MISSING" "API image not found: ${IMAGE_TAG}"
    exit 1
  fi
}

#=============================================================================
# Phase 3: DO - Execute Deployment
#=============================================================================

capture_current_state() {
  log INFO "Capturing current deployment state for rollback..."

  # Get current revision
  PREVIOUS_REVISION=$(kubectl get deployment "${DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}' 2>/dev/null || echo "0")

  log INFO "Current deployment revision: ${PREVIOUS_REVISION}"

  # Save current deployment spec
  kubectl get deployment "${DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    -o yaml > "${LOG_DIR}/deployment-before.yaml" 2>/dev/null || true

  kubectl get deployment "${API_DEPLOYMENT_NAME}" \
    -n "${NAMESPACE}" \
    -o yaml > "${LOG_DIR}/api-deployment-before.yaml" 2>/dev/null || true
}

execute_deployment() {
  log STEP "Phase 3: DO - Executing Deployment"

  DEPLOYMENT_START_TIME=$(date +%s)

  # Capture state before deployment
  capture_current_state

  # Update Frontend deployment
  log INFO "Updating frontend deployment with image: ${FRONTEND_IMAGE}"
  kubectl set image deployment/"${DEPLOYMENT_NAME}" \
    fleet-app="${FRONTEND_IMAGE}" \
    -n "${NAMESPACE}" \
    --record 2>&1 | tee -a "${LOG_FILE}"

  # Update API deployment
  log INFO "Updating API deployment with image: ${API_IMAGE}"
  kubectl set image deployment/"${API_DEPLOYMENT_NAME}" \
    fleet-api="${API_IMAGE}" \
    -n "${NAMESPACE}" \
    --record 2>&1 | tee -a "${LOG_FILE}"

  log SUCCESS "Deployment initiated"
}

#=============================================================================
# Phase 4: Monitor Rollout
#=============================================================================

monitor_rollout() {
  log STEP "Phase 4: Monitoring Kubernetes Rollout"

  # Monitor frontend rollout
  log INFO "Waiting for frontend rollout (timeout: ${ROLLOUT_TIMEOUT}s)..."
  if ! timeout "${ROLLOUT_TIMEOUT}" kubectl rollout status deployment/"${DEPLOYMENT_NAME}" \
      -n "${NAMESPACE}" 2>&1 | tee -a "${LOG_FILE}"; then
    log ERROR "Frontend rollout failed or timed out"
    create_incident_report "ROLLOUT_FAILED" "Frontend deployment rollout failed"
    return 1
  fi
  log SUCCESS "Frontend rollout completed"

  # Monitor API rollout
  log INFO "Waiting for API rollout (timeout: ${ROLLOUT_TIMEOUT}s)..."
  if ! timeout "${ROLLOUT_TIMEOUT}" kubectl rollout status deployment/"${API_DEPLOYMENT_NAME}" \
      -n "${NAMESPACE}" 2>&1 | tee -a "${LOG_FILE}"; then
    log ERROR "API rollout failed or timed out"
    create_incident_report "ROLLOUT_FAILED" "API deployment rollout failed"
    return 1
  fi
  log SUCCESS "API rollout completed"

  # Wait for pods to be fully ready
  log INFO "Waiting for pods to be ready..."
  sleep 10

  # Verify pod status
  local ready_pods=$(kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT_NAME}" \
    -o jsonpath='{.items[?(@.status.phase=="Running")].metadata.name}' | wc -w)

  log INFO "Ready pods: ${ready_pods}"

  if [ "${ready_pods}" -eq 0 ]; then
    log ERROR "No pods are running after rollout"
    kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT_NAME}" | tee -a "${LOG_FILE}"
    create_incident_report "NO_RUNNING_PODS" "No pods running after rollout"
    return 1
  fi

  log SUCCESS "Pods are running (${ready_pods} ready)"
  return 0
}

#=============================================================================
# Phase 5: Health Checks
#=============================================================================

perform_health_checks() {
  log STEP "Phase 5: Performing Health Checks"

  local elapsed=0
  local max_wait=${HEALTH_TIMEOUT}

  log INFO "Testing production URL: ${APP_URL}"
  log INFO "Waiting for application to be healthy (timeout: ${max_wait}s)..."

  while [ $elapsed -lt $max_wait ]; do
    # Test health endpoint with curl
    if curl -sf --max-time 10 "${APP_URL}/health" > /dev/null 2>&1; then
      log SUCCESS "Health endpoint responding: ${APP_URL}/health"
      return 0
    fi

    # Also try API health endpoint
    if curl -sf --max-time 10 "${APP_URL}/api/health" > /dev/null 2>&1; then
      log SUCCESS "API health endpoint responding: ${APP_URL}/api/health"
      return 0
    fi

    sleep 5
    elapsed=$((elapsed + 5))

    if [ $((elapsed % 30)) -eq 0 ]; then
      log INFO "Still waiting for health endpoint... (${elapsed}s / ${max_wait}s)"
    fi
  done

  log ERROR "Health checks failed after ${max_wait}s"
  create_incident_report "HEALTH_CHECK_FAILED" "Application not healthy after ${max_wait}s"
  return 1
}

#=============================================================================
# Phase 6: CHECK - Run Playwright Validation Tests
#=============================================================================

run_validation_tests() {
  log STEP "Phase 6: CHECK - Running Playwright Validation Tests"

  # Change to project root for Playwright tests
  cd /Users/andrewmorton/Documents/GitHub/Fleet

  # Create test configuration
  cat > "${LOG_DIR}/test-config.json" <<EOF
{
  "testDir": "./e2e",
  "timeout": 60000,
  "retries": 2,
  "workers": 1,
  "reporter": [
    ["list"],
    ["json", { "outputFile": "${LOG_DIR}/test-results.json" }],
    ["html", { "outputFolder": "${LOG_DIR}/html-report", "open": "never" }]
  ],
  "use": {
    "baseURL": "${APP_URL}",
    "trace": "on-first-retry",
    "screenshot": "only-on-failure",
    "video": "retain-on-failure"
  }
}
EOF

  log INFO "Running smoke tests against ${APP_URL}..."
  log INFO "Test results will be saved to: ${LOG_DIR}"

  # Run Playwright smoke tests
  if timeout "${TEST_TIMEOUT}" npx playwright test \
      --config="${LOG_DIR}/test-config.json" \
      e2e/00-smoke-tests.spec.ts \
      e2e/production-verification.spec.ts \
      2>&1 | tee "${VALIDATION_LOG}"; then

    log SUCCESS "All validation tests passed"

    # Check for warnings in test output
    if grep -q "expected.*to be.*but got" "${VALIDATION_LOG}"; then
      log WARN "Some test assertions had warnings - review logs"
    fi

    return 0
  else
    local exit_code=$?
    log ERROR "Validation tests failed (exit code: ${exit_code})"

    # Extract failure details
    local failed_tests=$(grep -c "FAILED" "${VALIDATION_LOG}" 2>/dev/null || echo "unknown")
    log ERROR "Failed tests: ${failed_tests}"

    create_incident_report "VALIDATION_FAILED" "Playwright tests failed: ${failed_tests} test(s)"
    return 1
  fi
}

#=============================================================================
# Phase 7: ACT - Rollback or Promote
#=============================================================================

execute_rollback() {
  log STEP "Phase 7: ACT - Executing Rollback"

  if [ "${ROLLBACK_ENABLED}" != "true" ]; then
    log WARN "Rollback is disabled - skipping"
    return 1
  fi

  if [ "${PREVIOUS_REVISION}" = "0" ] || [ -z "${PREVIOUS_REVISION}" ]; then
    log ERROR "Cannot rollback - no previous revision found"
    return 1
  fi

  log WARN "Rolling back to revision: ${PREVIOUS_REVISION}"

  # Rollback frontend
  if kubectl rollout undo deployment/"${DEPLOYMENT_NAME}" \
      -n "${NAMESPACE}" \
      --to-revision="${PREVIOUS_REVISION}" 2>&1 | tee -a "${LOG_FILE}"; then
    log INFO "Frontend rollback initiated"
  else
    log ERROR "Frontend rollback failed"
    return 1
  fi

  # Rollback API
  if kubectl rollout undo deployment/"${API_DEPLOYMENT_NAME}" \
      -n "${NAMESPACE}" 2>&1 | tee -a "${LOG_FILE}"; then
    log INFO "API rollback initiated"
  else
    log ERROR "API rollback failed"
    return 1
  fi

  # Wait for rollback to complete
  log INFO "Waiting for rollback to complete..."
  kubectl rollout status deployment/"${DEPLOYMENT_NAME}" -n "${NAMESPACE}" --timeout=5m
  kubectl rollout status deployment/"${API_DEPLOYMENT_NAME}" -n "${NAMESPACE}" --timeout=5m

  log SUCCESS "Rollback completed successfully"

  # Verify rolled-back version is healthy
  if perform_health_checks; then
    log SUCCESS "Previous version is healthy after rollback"
    return 0
  else
    log ERROR "WARNING: Previous version is also unhealthy after rollback!"
    return 1
  fi
}

promote_deployment() {
  log STEP "Phase 7: ACT - Promoting Deployment"

  log SUCCESS "Deployment validated successfully"
  log INFO "Creating deployment tag for successful release..."

  # Tag images as stable
  local stable_tag="${ENVIRONMENT}-stable"

  log INFO "Tagging images as ${stable_tag}..."

  # Tag frontend image
  az acr import \
    --name "${ACR_NAME}" \
    --source "${FRONTEND_IMAGE}" \
    --image "fleet-frontend:${stable_tag}" \
    --force 2>&1 | tee -a "${LOG_FILE}" || log WARN "Failed to tag frontend image"

  # Tag API image
  az acr import \
    --name "${ACR_NAME}" \
    --source "${API_IMAGE}" \
    --image "fleet-api:${stable_tag}" \
    --force 2>&1 | tee -a "${LOG_FILE}" || log WARN "Failed to tag API image"

  log SUCCESS "Deployment promoted to ${stable_tag}"
}

#=============================================================================
# Retry Logic with Exponential Backoff
#=============================================================================

retry_deployment() {
  log STEP "Retry Logic - Attempting Deployment Recovery"

  local max_retries=2
  local retry=0

  while [ $retry -lt $max_retries ]; do
    retry=$((retry + 1))
    log INFO "Retry attempt ${retry}/${max_retries}..."

    # Wait with exponential backoff
    local backoff=$((retry * 30))
    log INFO "Waiting ${backoff}s before retry..."
    sleep $backoff

    # Re-attempt deployment
    if execute_deployment && monitor_rollout && perform_health_checks && run_validation_tests; then
      log SUCCESS "Deployment succeeded on retry ${retry}"
      promote_deployment
      return 0
    fi

    log WARN "Retry ${retry} failed"
  done

  log ERROR "All retry attempts exhausted"
  return 1
}

#=============================================================================
# Deployment Status Summary
#=============================================================================

print_deployment_summary() {
  local status="$1"
  local duration=$(($(date +%s) - DEPLOYMENT_START_TIME))

  log STEP "Deployment Summary"

  cat <<EOF | tee -a "${LOG_FILE}"

╔══════════════════════════════════════════════════════════════════╗
║           FLEET MANAGEMENT DEPLOYMENT SUMMARY                    ║
╚══════════════════════════════════════════════════════════════════╝

  Status:           ${status}
  Environment:      ${ENVIRONMENT}
  Image Tag:        ${IMAGE_TAG}
  Application URL:  ${APP_URL}
  Duration:         ${duration}s
  Timestamp:        $(date -u +"%Y-%m-%d %H:%M:%S UTC")

  Frontend Image:   ${FRONTEND_IMAGE}
  API Image:        ${API_IMAGE}

  Logs Directory:   ${LOG_DIR}
  - Deployment Log: ${LOG_FILE}
  - Validation Log: ${VALIDATION_LOG}
  - Incident Report: ${INCIDENT_REPORT}

EOF

  # Show pod status
  echo "  Pod Status:" | tee -a "${LOG_FILE}"
  kubectl get pods -n "${NAMESPACE}" -l app="${DEPLOYMENT_NAME}" 2>&1 | tee -a "${LOG_FILE}"

  echo "" | tee -a "${LOG_FILE}"

  if [ "${status}" = "SUCCESS" ]; then
    cat <<EOF | tee -a "${LOG_FILE}"
╔══════════════════════════════════════════════════════════════════╗
║  ✅ DEPLOYMENT SUCCESSFUL - All Tests Passed                     ║
╚══════════════════════════════════════════════════════════════════╝

  Next Steps:
    1. Verify application: ${APP_URL}
    2. Monitor logs: kubectl logs -f -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME}
    3. Check metrics: kubectl top pods -n ${NAMESPACE}

EOF
  else
    cat <<EOF | tee -a "${LOG_FILE}"
╔══════════════════════════════════════════════════════════════════╗
║  ❌ DEPLOYMENT FAILED - Rollback Executed                        ║
╚══════════════════════════════════════════════════════════════════╝

  Failure Details:
    - See incident report: ${INCIDENT_REPORT}
    - Check validation logs: ${VALIDATION_LOG}
    - Review deployment logs: ${LOG_FILE}

  Next Steps:
    1. Review incident report
    2. Fix identified issues
    3. Test in staging before re-deploying
    4. Re-run deployment: $0 ${ENVIRONMENT} [NEW_TAG]

EOF
  fi
}

#=============================================================================
# Main Execution Flow
#=============================================================================

main() {
  log STEP "Fleet Management - Automated Deployment with Validation"
  log INFO "Environment: ${ENVIRONMENT}"
  log INFO "Image Tag: ${IMAGE_TAG}"
  log INFO "Production URL: ${APP_URL}"
  echo ""

  # Phase 1: PLAN
  if ! verify_prerequisites; then
    log ERROR "Prerequisites check failed"
    exit 1
  fi

  # Phase 2: Wait for Build
  if ! wait_for_acr_build; then
    log ERROR "ACR build check failed"
    exit 1
  fi

  # Phase 3: DO
  if ! execute_deployment; then
    log ERROR "Deployment execution failed"
    exit 1
  fi

  # Phase 4: Monitor
  if ! monitor_rollout; then
    log ERROR "Rollout monitoring failed - attempting rollback"
    if execute_rollback; then
      print_deployment_summary "ROLLED BACK"
      exit 1
    else
      print_deployment_summary "ROLLBACK FAILED"
      exit 2
    fi
  fi

  # Phase 5: Health Checks
  if ! perform_health_checks; then
    log ERROR "Health checks failed - attempting rollback"
    if execute_rollback; then
      print_deployment_summary "ROLLED BACK"
      exit 1
    else
      print_deployment_summary "ROLLBACK FAILED"
      exit 2
    fi
  fi

  # Phase 6: CHECK - Validation Tests
  if ! run_validation_tests; then
    log ERROR "Validation tests failed - attempting rollback"

    # Try rollback
    if execute_rollback; then
      print_deployment_summary "ROLLED BACK"
      exit 1
    else
      log ERROR "Rollback failed - trying retry logic"

      # If rollback fails, try retry
      if retry_deployment; then
        print_deployment_summary "SUCCESS (after retry)"
        exit 0
      else
        print_deployment_summary "FAILED (rollback and retry failed)"
        exit 2
      fi
    fi
  fi

  # Phase 7: ACT - Promote
  promote_deployment

  # Success!
  print_deployment_summary "SUCCESS"

  log SUCCESS "Deployment completed successfully!"
  log INFO "Access your application at: ${APP_URL}"

  exit 0
}

#=============================================================================
# Cleanup on Exit
#=============================================================================

cleanup() {
  local exit_code=$?

  if [ $exit_code -ne 0 ]; then
    log ERROR "Deployment failed with exit code: ${exit_code}"
    log INFO "Logs available at: ${LOG_DIR}"
  fi

  # Archive logs
  if [ -d "${LOG_DIR}" ]; then
    tar -czf "${LOG_DIR}.tar.gz" -C "$(dirname "${LOG_DIR}")" "$(basename "${LOG_DIR}")" 2>/dev/null || true
    log INFO "Logs archived: ${LOG_DIR}.tar.gz"
  fi
}

trap cleanup EXIT

#=============================================================================
# Execute Main
#=============================================================================

main "$@"
