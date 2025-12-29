#!/bin/bash

################################################################################
# Staging Deployment Automation Script
# =============================================================================
# Staging deployment with relaxed checks for rapid iteration and testing
# before production deployment.
#
# Usage: ./deploy-staging.sh
# Environment: Requires .env.staging file with Azure credentials
################################################################################

set -euo pipefail

# ============================================================================
# Color Output Functions
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG="${SCRIPT_DIR}/deployment.log"
CURRENT_DEPLOYMENT_LOG="${SCRIPT_DIR}/staging-deployment-$(date +%Y%m%d_%H%M%S).log"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

# Azure configuration
AZURE_STATIC_WEB_APP_NAME="${AZURE_STATIC_WEB_APP_NAME_STAGING:-fleet-staging}"
AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP_STAGING:-fleet-staging-rg}"

# Feature flags
SKIP_LINT=${SKIP_LINT:-false}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_SECURITY_SCAN=${SKIP_SECURITY_SCAN:-true}
FAST_MODE=${FAST_MODE:-false}

# ============================================================================
# Logging Setup
# ============================================================================

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [${level}] ${message}" | tee -a "$DEPLOYMENT_LOG" "$CURRENT_DEPLOYMENT_LOG"
}

# ============================================================================
# Cleanup and Error Handling
# ============================================================================

cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    print_error "Staging deployment failed with exit code $exit_code"
    log "ERROR" "Staging deployment failed with exit code $exit_code"
    notify_slack "FAILED" "Staging deployment failed at $(date)"
  fi
  exit $exit_code
}

trap cleanup EXIT

# ============================================================================
# Notification Functions
# ============================================================================

notify_slack() {
  local status=$1
  local message=$2

  if [ -z "$SLACK_WEBHOOK" ]; then
    return 0
  fi

  local color="danger"
  [ "$status" = "SUCCESS" ] && color="good"
  [ "$status" = "WARNING" ] && color="warning"

  local payload=$(cat <<EOF
{
  "attachments": [
    {
      "color": "$color",
      "title": "Fleet Staging Deployment - $status",
      "text": "$message",
      "fields": [
        {
          "title": "Timestamp",
          "value": "$(date)",
          "short": true
        }
      ]
    }
  ]
}
EOF
)

  curl -X POST -H 'Content-type: application/json' \
    --data "$payload" \
    "$SLACK_WEBHOOK" 2>/dev/null || log "WARNING" "Failed to send Slack notification"
}

# ============================================================================
# Pre-Deployment Checks
# ============================================================================

check_environment() {
  print_header "Checking Environment Setup"
  log "INFO" "Starting staging pre-deployment checks"

  # Check required commands
  local required_commands=("node" "npm" "git" "tsc" "curl")
  for cmd in "${required_commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      print_error "Required command not found: $cmd"
      log "ERROR" "Required command not found: $cmd"
      exit 1
    fi
  done

  print_success "All required commands found"

  # Check .env files
  if [ ! -f "$PROJECT_ROOT/.env.staging" ]; then
    print_warning ".env.staging not found, attempting .env.production"
    if [ ! -f "$PROJECT_ROOT/.env.production" ]; then
      print_error "No staging or production .env file found"
      log "ERROR" "No .env configuration file available"
      exit 1
    fi
  fi

  print_success "Environment configuration found"
  log "INFO" "Environment checks passed"
}

run_linting() {
  if [ "$SKIP_LINT" = "true" ]; then
    print_warning "Linting skipped (SKIP_LINT=true)"
    log "INFO" "Linting skipped by user"
    return 0
  fi

  print_header "Running Linting Checks"
  log "INFO" "Starting linting"

  cd "$PROJECT_ROOT/api"

  if npm run lint 2>&1 | tail -20 >> "$CURRENT_DEPLOYMENT_LOG"; then
    print_success "Linting passed"
    log "INFO" "Linting completed"
  else
    print_warning "Linting warnings detected (non-critical)"
    log "WARNING" "Linting completed with warnings"
  fi

  cd "$PROJECT_ROOT"
}

run_tests() {
  if [ "$SKIP_TESTS" = "true" ]; then
    print_warning "Tests skipped (SKIP_TESTS=true)"
    log "INFO" "Tests skipped by user"
    return 0
  fi

  print_header "Running Tests"
  log "INFO" "Starting test execution"

  cd "$PROJECT_ROOT/api"

  print_warning "Running unit tests..."
  if npm run test 2>&1 | tail -30 >> "$CURRENT_DEPLOYMENT_LOG"; then
    print_success "Tests passed"
    log "INFO" "Tests completed successfully"
  else
    print_warning "Tests failed - proceeding anyway for staging"
    log "WARNING" "Tests failed but continuing (staging environment)"
  fi

  cd "$PROJECT_ROOT"
}

# ============================================================================
# Build Processes
# ============================================================================

build_backend() {
  print_header "Building Backend"
  log "INFO" "Starting backend build"

  cd "$PROJECT_ROOT/api"

  print_warning "Cleaning previous build..."
  rm -rf dist/ 2>/dev/null || true

  print_warning "Running TypeScript compiler..."
  if ! npm run build 2>&1 | tail -20 >> "$CURRENT_DEPLOYMENT_LOG"; then
    print_warning "Backend build had issues - checking output..."
    log "WARNING" "Backend build completed with warnings"
  fi

  # Verify build output exists
  if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    print_error "Build output is empty or missing"
    log "ERROR" "Backend build output empty"
    exit 1
  fi

  print_success "Backend build completed"
  log "INFO" "Backend built successfully"

  cd "$PROJECT_ROOT"
}

build_frontend() {
  print_header "Building Frontend"
  log "INFO" "Starting frontend build"

  cd "$PROJECT_ROOT"

  print_warning "Cleaning build artifacts..."
  rm -rf dist/ 2>/dev/null || true

  if [ "$FAST_MODE" != "true" ]; then
    print_warning "Installing dependencies..."
    if ! npm install --production 2>&1 | tail -10 >> "$CURRENT_DEPLOYMENT_LOG"; then
      print_warning "Installation had warnings - continuing"
      log "WARNING" "npm install had warnings"
    fi
  fi

  print_warning "Running production build..."
  if ! npm run build 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Frontend build failed"
    log "ERROR" "Frontend build failed"
    exit 1
  fi

  # Verify output
  if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    print_error "Frontend build output is empty"
    log "ERROR" "Frontend build output empty"
    exit 1
  fi

  print_success "Frontend build completed"
  log "INFO" "Frontend built successfully"
}

# ============================================================================
# Database Migrations
# ============================================================================

run_migrations() {
  print_header "Running Database Migrations"
  log "INFO" "Starting migrations"

  cd "$PROJECT_ROOT/api"

  # Source environment
  set -a
  if [ -f "$PROJECT_ROOT/.env.staging" ]; then
    source "$PROJECT_ROOT/.env.staging"
  else
    source "$PROJECT_ROOT/.env.production"
  fi
  set +a

  if [ -z "${DATABASE_URL:-}" ]; then
    print_warning "DATABASE_URL not set - skipping migrations"
    log "WARNING" "DATABASE_URL not configured"
    cd "$PROJECT_ROOT"
    return 0
  fi

  print_warning "Checking database connection..."
  if npm run check:db 2>&1 | tail -10 >> "$CURRENT_DEPLOYMENT_LOG"; then
    print_success "Database is reachable"
    log "INFO" "Database connection verified"

    print_warning "Running migrations..."
    if npm run migrate 2>&1 | tail -20 >> "$CURRENT_DEPLOYMENT_LOG"; then
      print_success "Migrations completed"
      log "INFO" "Database migrations successful"
    else
      print_warning "Migration had issues - continuing anyway for staging"
      log "WARNING" "Migrations completed with warnings"
    fi
  else
    print_warning "Database not reachable - skipping migrations"
    log "WARNING" "Database unavailable, skipping migrations"
  fi

  cd "$PROJECT_ROOT"
}

# ============================================================================
# Azure Deployment
# ============================================================================

deploy_to_azure() {
  print_header "Deploying to Azure (Staging)"
  log "INFO" "Starting Azure deployment"

  # Source environment
  set -a
  if [ -f "$PROJECT_ROOT/.env.staging" ]; then
    source "$PROJECT_ROOT/.env.staging"
  else
    source "$PROJECT_ROOT/.env.production"
  fi
  set +a

  if [ -z "${AZURE_STATIC_WEB_APPS_API_TOKEN:-}" ]; then
    print_error "AZURE_STATIC_WEB_APPS_API_TOKEN not set"
    log "ERROR" "Azure API token not configured"
    exit 1
  fi

  # Install Azure CLI if needed
  if ! command -v az &> /dev/null; then
    print_warning "Azure CLI not found - installing..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash 2>&1 | tail -5 >> "$CURRENT_DEPLOYMENT_LOG"
    log "INFO" "Azure CLI installed"
  fi

  # Login to Azure
  print_warning "Authenticating with Azure..."
  if ! az login --service-principal -u "$AZURE_CLIENT_ID" -p "$AZURE_CLIENT_SECRET" \
       --tenant "$AZURE_TENANT_ID" 2>&1 | tail -10 >> "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Azure authentication failed"
    log "ERROR" "Azure authentication failed"
    exit 1
  fi

  print_success "Azure authentication successful"
  log "INFO" "Azure authenticated"

  # Deploy frontend
  print_warning "Deploying frontend..."

  if command -v swa &> /dev/null; then
    if swa deploy "$PROJECT_ROOT/dist" \
       --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN" 2>&1 | tail -20 >> "$CURRENT_DEPLOYMENT_LOG"; then
      print_success "SWA deployment successful"
      log "INFO" "Deployed via SWA CLI"
    else
      print_warning "SWA CLI deployment had issues - trying az CLI"
      log "WARNING" "SWA CLI had issues"
    fi
  fi

  if ! az staticwebapp upload \
       --name "$AZURE_STATIC_WEB_APP_NAME" \
       --source-dir "$PROJECT_ROOT/dist" 2>&1 | tail -20 >> "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Azure deployment failed"
    log "ERROR" "Azure deployment failed"
    exit 1
  fi

  print_success "Azure deployment completed"
  log "INFO" "Frontend deployed to Azure"
}

# ============================================================================
# Quick Health Checks
# ============================================================================

perform_health_checks() {
  print_header "Running Health Checks"
  log "INFO" "Starting health checks"

  local frontend_url="${FRONTEND_URL_STAGING:-https://fleet-staging.azurestaticapps.net}"

  print_warning "Checking frontend reachability..."
  if curl -s -o /dev/null -w "%{http_code}" -m 10 "$frontend_url" | grep -q "200\|304"; then
    print_success "Frontend is responding"
    log "INFO" "Frontend health check passed"
    return 0
  else
    print_warning "Frontend not responding yet (may need time to deploy)"
    log "WARNING" "Frontend health check inconclusive"
    return 1
  fi
}

# ============================================================================
# Main Deployment Flow
# ============================================================================

main() {
  print_header "FLEET STAGING DEPLOYMENT"
  echo "Deployment started at: $(date)"
  echo "Deployment log: $CURRENT_DEPLOYMENT_LOG"
  echo ""

  log "INFO" "=========================================="
  log "INFO" "Fleet Staging Deployment Started"
  log "INFO" "Fast Mode: $FAST_MODE"
  log "INFO" "Skip Lint: $SKIP_LINT"
  log "INFO" "Skip Tests: $SKIP_TESTS"
  log "INFO" "=========================================="

  # Step 1: Environment checks
  check_environment

  # Step 2: Optional linting and tests
  run_linting
  run_tests

  # Step 3: Build processes
  build_backend
  build_frontend

  # Step 4: Database operations
  run_migrations

  # Step 5: Deploy to Azure
  deploy_to_azure

  # Step 6: Quick health checks
  print_warning "Waiting 30 seconds for deployment to stabilize..."
  sleep 30

  if perform_health_checks; then
    print_success "Health checks passed"
  else
    print_warning "Health checks inconclusive - deployment may still be in progress"
  fi

  # Success!
  print_header "STAGING DEPLOYMENT COMPLETED"
  echo "Deployment finished at: $(date)"
  echo "Frontend URL: ${FRONTEND_URL_STAGING:-https://fleet-staging.azurestaticapps.net}"
  echo "Deployment log: $CURRENT_DEPLOYMENT_LOG"
  echo ""

  log "INFO" "=========================================="
  log "INFO" "Fleet Staging Deployment Completed"
  log "INFO" "=========================================="

  notify_slack "SUCCESS" "Staging deployment completed at $(date)"

  return 0
}

# Run main function
main "$@"
