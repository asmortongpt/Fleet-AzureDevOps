#!/bin/bash
#=============================================================================
# Complete CI/CD Pipeline - Build, Deploy, Validate
#=============================================================================
# This script orchestrates the complete deployment pipeline:
# 1. Trigger ACR build (via Azure DevOps or direct ACR build)
# 2. Wait for build completion
# 3. Deploy to Kubernetes
# 4. Validate with Playwright
# 5. Auto-rollback on failure or promote on success
#
# USAGE:
#   ./deploy-complete-pipeline.sh [ENVIRONMENT]
#
# EXAMPLES:
#   ./deploy-complete-pipeline.sh staging
#   ./deploy-complete-pipeline.sh production
#=============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENT="${1:-staging}"

# Configuration
ACR_NAME="fleetappregistry"
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
BUILD_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="${GIT_BRANCH}-${GIT_COMMIT}-${BUILD_TIMESTAMP}"

log() {
  echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - $*"
}

#=============================================================================
# Step 1: Trigger ACR Build
#=============================================================================

trigger_acr_build() {
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Step 1: Triggering ACR Build"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  cd /Users/andrewmorton/Documents/GitHub/Fleet

  log "Building frontend image..."
  local frontend_build=$(az acr build \
    --registry "${ACR_NAME}" \
    --image "fleet-frontend:${IMAGE_TAG}" \
    --file Dockerfile \
    . \
    --no-logs \
    --query runId \
    -o tsv)

  log "Frontend build ID: ${frontend_build}"

  log "Building API image..."
  local api_build=$(az acr build \
    --registry "${ACR_NAME}" \
    --image "fleet-api:${IMAGE_TAG}" \
    --file api/Dockerfile \
    api \
    --no-logs \
    --query runId \
    -o tsv)

  log "API build ID: ${api_build}"

  # Monitor both builds in parallel
  log "Waiting for builds to complete..."

  "${SCRIPT_DIR}/monitor-acr-build.sh" "${frontend_build}" &
  local frontend_pid=$!

  "${SCRIPT_DIR}/monitor-acr-build.sh" "${api_build}" &
  local api_pid=$!

  # Wait for both
  local frontend_result=0
  local api_result=0

  wait $frontend_pid || frontend_result=$?
  wait $api_pid || api_result=$?

  if [ $frontend_result -ne 0 ]; then
    log "❌ Frontend build failed"
    return 1
  fi

  if [ $api_result -ne 0 ]; then
    log "❌ API build failed"
    return 1
  fi

  log "✅ All builds completed successfully"
  return 0
}

#=============================================================================
# Step 2: Deploy with Validation
#=============================================================================

deploy_with_validation() {
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Step 2: Deploying with Validation"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  "${SCRIPT_DIR}/deploy-with-validation.sh" "${ENVIRONMENT}" "${IMAGE_TAG}"
  return $?
}

#=============================================================================
# Step 3: Post-Deployment Actions
#=============================================================================

post_deployment_actions() {
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Step 3: Post-Deployment Actions"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Tag git commit
  local deploy_tag="${ENVIRONMENT}-${BUILD_TIMESTAMP}"

  if git rev-parse "${deploy_tag}" >/dev/null 2>&1; then
    log "Tag ${deploy_tag} already exists, skipping"
  else
    git tag -a "${deploy_tag}" -m "Deployed to ${ENVIRONMENT} at ${BUILD_TIMESTAMP}"
    log "Created git tag: ${deploy_tag}"

    # Push tag to remote
    if git push origin "${deploy_tag}" 2>/dev/null; then
      log "Pushed tag to remote: ${deploy_tag}"
    else
      log "⚠️  Failed to push tag (continuing anyway)"
    fi
  fi

  # Create deployment record
  cat > "/tmp/deployment-${ENVIRONMENT}-${BUILD_TIMESTAMP}.json" <<EOF
{
  "environment": "${ENVIRONMENT}",
  "image_tag": "${IMAGE_TAG}",
  "git_commit": "${GIT_COMMIT}",
  "git_branch": "${GIT_BRANCH}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployed_by": "$(whoami)",
  "status": "SUCCESS"
}
EOF

  log "Deployment record: /tmp/deployment-${ENVIRONMENT}-${BUILD_TIMESTAMP}.json"
}

#=============================================================================
# Main Pipeline
#=============================================================================

main() {
  log "╔══════════════════════════════════════════════════════════════════╗"
  log "║     Fleet Management - Complete Deployment Pipeline             ║"
  log "╚══════════════════════════════════════════════════════════════════╝"
  echo ""
  log "Environment:  ${ENVIRONMENT}"
  log "Git Branch:   ${GIT_BRANCH}"
  log "Git Commit:   ${GIT_COMMIT}"
  log "Image Tag:    ${IMAGE_TAG}"
  echo ""

  # Validate environment
  if [[ ! "${ENVIRONMENT}" =~ ^(dev|staging|production)$ ]]; then
    log "❌ Invalid environment: ${ENVIRONMENT}"
    log "   Valid options: dev, staging, production"
    exit 1
  fi

  # Production safety check
  if [ "${ENVIRONMENT}" = "production" ]; then
    echo ""
    log "⚠️  WARNING: PRODUCTION DEPLOYMENT"
    log "   This will deploy to the live production environment"
    echo ""
    read -p "   Are you sure you want to continue? (yes/no): " confirm

    if [ "${confirm}" != "yes" ]; then
      log "Deployment cancelled by user"
      exit 0
    fi
  fi

  # Execute pipeline
  local start_time=$(date +%s)

  # Step 1: Build
  if ! trigger_acr_build; then
    log "❌ Pipeline failed at: ACR Build"
    exit 1
  fi

  # Step 2: Deploy & Validate
  if ! deploy_with_validation; then
    log "❌ Pipeline failed at: Deployment/Validation"
    exit 1
  fi

  # Step 3: Post-deployment
  if ! post_deployment_actions; then
    log "⚠️  Post-deployment actions failed (non-critical)"
  fi

  # Success summary
  local duration=$(($(date +%s) - start_time))
  local minutes=$((duration / 60))
  local seconds=$((duration % 60))

  echo ""
  log "╔══════════════════════════════════════════════════════════════════╗"
  log "║  ✅ COMPLETE PIPELINE SUCCESSFUL                                 ║"
  log "╚══════════════════════════════════════════════════════════════════╝"
  echo ""
  log "Environment:    ${ENVIRONMENT}"
  log "Image Tag:      ${IMAGE_TAG}"
  log "Duration:       ${minutes}m ${seconds}s"
  log "Application:    https://fleet.capitaltechalliance.com"
  echo ""

  exit 0
}

main "$@"
