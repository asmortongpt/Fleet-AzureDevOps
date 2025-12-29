#!/bin/bash

################################################################################
# Production Deployment Automation Script
# =============================================================================
# Full production deployment with pre-checks, build, database migrations,
# Azure Static Web Apps deployment, health checks, and rollback capability.
#
# Usage: ./deploy-production.sh
# Environment: Requires .env.production file with Azure credentials
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
CURRENT_DEPLOYMENT_LOG="${SCRIPT_DIR}/deployment-$(date +%Y%m%d_%H%M%S).log"
ROLLBACK_FILE="${SCRIPT_DIR}/.last-deployment"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL_TO="${DEPLOYMENT_EMAIL_TO:-}"

# Azure configuration
AZURE_STATIC_WEB_APP_NAME="${AZURE_STATIC_WEB_APP_NAME:-fleet-production}"
AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-fleet-rg}"
AZURE_SUBSCRIPTION="${AZURE_SUBSCRIPTION:-}"

# Timeouts and retries
MAX_HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=10
ROLLBACK_TIMEOUT=300

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
    print_error "Deployment failed with exit code $exit_code"
    log "ERROR" "Deployment failed with exit code $exit_code"
    notify_slack "FAILED" "Deployment failed at $(date)"
    send_email_notification "FAILED" "$exit_code"
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
      "title": "Fleet Production Deployment - $status",
      "text": "$message",
      "fields": [
        {
          "title": "Timestamp",
          "value": "$(date)",
          "short": true
        },
        {
          "title": "Deployment Log",
          "value": "$CURRENT_DEPLOYMENT_LOG",
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

send_email_notification() {
  local status=$1
  local exit_code=${2:-0}

  if [ -z "$EMAIL_TO" ]; then
    return 0
  fi

  local subject="Fleet Deployment $status - $(date '+%Y-%m-%d %H:%M')"
  local body="Deployment Status: $status\nExit Code: $exit_code\nTime: $(date)\n\nSee log: $CURRENT_DEPLOYMENT_LOG"

  echo -e "$body" | mail -s "$subject" "$EMAIL_TO" 2>/dev/null || log "WARNING" "Failed to send email notification"
}

# ============================================================================
# Pre-Deployment Checks
# ============================================================================

check_environment() {
  print_header "Checking Environment Setup"
  log "INFO" "Starting pre-deployment environment checks"

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
  log "INFO" "All required commands found"

  # Check .env files
  if [ ! -f "$PROJECT_ROOT/.env.production" ]; then
    print_error ".env.production file not found"
    log "ERROR" ".env.production file not found at $PROJECT_ROOT/.env.production"
    exit 1
  fi

  print_success ".env.production file exists"
  log "INFO" ".env.production file found"

  # Check git status
  if [ -n "$(git -C "$PROJECT_ROOT" status -s)" ]; then
    print_warning "Git working directory has uncommitted changes"
    log "WARNING" "Git working directory has uncommitted changes"
  fi

  # Check git remote
  if ! git -C "$PROJECT_ROOT" remote get-url origin &>/dev/null; then
    print_error "No git remote configured"
    log "ERROR" "No git remote configured"
    exit 1
  fi

  print_success "Git configuration valid"
  log "INFO" "Git configuration validated"
}

run_tests() {
  print_header "Running Tests"
  log "INFO" "Starting test execution"

  cd "$PROJECT_ROOT/api"

  print_warning "Running linting checks..."
  if ! npm run lint 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Linting failed - aborting deployment"
    log "ERROR" "Linting checks failed"
    exit 1
  fi

  print_success "Linting passed"
  log "INFO" "Linting checks completed successfully"

  print_warning "Running unit tests..."
  if ! npm run test 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Unit tests failed - aborting deployment"
    log "ERROR" "Unit tests failed"
    exit 1
  fi

  print_success "Unit tests passed"
  log "INFO" "Unit tests completed successfully"

  print_warning "Running integration tests..."
  if ! npm run test:integration 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_warning "Integration tests failed - proceeding with caution"
    log "WARNING" "Integration tests failed but proceeding"
  else
    print_success "Integration tests passed"
    log "INFO" "Integration tests completed successfully"
  fi

  cd "$PROJECT_ROOT"
}

security_scan() {
  print_header "Running Security Scan"
  log "INFO" "Starting security vulnerability scan"

  cd "$PROJECT_ROOT/api"

  print_warning "Checking for vulnerable dependencies..."
  if npm audit --audit-level=moderate 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_success "No moderate/high severity vulnerabilities found"
    log "INFO" "Security audit passed"
  else
    print_warning "Security vulnerabilities found - review audit log"
    log "WARNING" "Security vulnerabilities detected"
  fi

  cd "$PROJECT_ROOT"
}

# ============================================================================
# Build Processes
# ============================================================================

build_backend() {
  print_header "Building Backend"
  log "INFO" "Starting backend TypeScript compilation"

  cd "$PROJECT_ROOT/api"

  print_warning "Cleaning previous build artifacts..."
  rm -rf dist/ 2>/dev/null || true
  log "INFO" "Cleaned build artifacts"

  print_warning "Running TypeScript compiler..."
  if ! npm run build 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Backend build failed"
    log "ERROR" "Backend TypeScript compilation failed"
    exit 1
  fi

  print_success "Backend build completed"
  log "INFO" "Backend built successfully"

  # Verify build output
  if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    print_error "Build output directory is empty"
    log "ERROR" "Build output directory is empty or missing"
    exit 1
  fi

  print_success "Build output verified"
  log "INFO" "Build output directory verified"

  cd "$PROJECT_ROOT"
}

build_frontend() {
  print_header "Building Frontend"
  log "INFO" "Starting frontend build"

  cd "$PROJECT_ROOT"

  print_warning "Cleaning previous build artifacts..."
  rm -rf dist/ 2>/dev/null || true
  log "INFO" "Cleaned build artifacts"

  print_warning "Installing dependencies..."
  if ! npm install --production 2>&1 | tail -20 >> "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Frontend dependency installation failed"
    log "ERROR" "Frontend npm install failed"
    exit 1
  fi

  print_success "Dependencies installed"
  log "INFO" "Dependencies installed successfully"

  print_warning "Running production build..."
  if ! npm run build 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Frontend build failed"
    log "ERROR" "Frontend build failed"
    exit 1
  fi

  print_success "Frontend build completed"
  log "INFO" "Frontend built successfully"

  # Verify build output
  if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    print_error "Frontend build output directory is empty"
    log "ERROR" "Frontend build output is empty"
    exit 1
  fi

  print_success "Frontend build output verified"
  log "INFO" "Frontend build output verified"
}

# ============================================================================
# Database Migrations
# ============================================================================

run_migrations() {
  print_header "Running Database Migrations"
  log "INFO" "Starting database migration execution"

  cd "$PROJECT_ROOT/api"

  # Source environment variables
  set -a
  source "$PROJECT_ROOT/.env.production"
  set +a

  if [ -z "${DATABASE_URL:-}" ]; then
    print_warning "DATABASE_URL not configured - skipping migrations"
    log "WARNING" "DATABASE_URL not set, skipping migrations"
    return 0
  fi

  print_warning "Checking database connectivity..."
  if ! npm run check:db 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Database connectivity check failed"
    log "ERROR" "Cannot connect to database"
    exit 1
  fi

  print_success "Database connectivity verified"
  log "INFO" "Database connection successful"

  print_warning "Running database migrations..."
  if ! npm run migrate 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Database migration failed"
    log "ERROR" "Database migrations failed"
    exit 1
  fi

  print_success "Database migrations completed"
  log "INFO" "Database migrations executed successfully"

  cd "$PROJECT_ROOT"
}

# ============================================================================
# Azure Deployment
# ============================================================================

deploy_to_azure() {
  print_header "Deploying to Azure Static Web Apps"
  log "INFO" "Starting Azure Static Web Apps deployment"

  # Source environment variables
  set -a
  source "$PROJECT_ROOT/.env.production"
  set +a

  if [ -z "${AZURE_STATIC_WEB_APPS_API_TOKEN:-}" ]; then
    print_error "AZURE_STATIC_WEB_APPS_API_TOKEN not set"
    log "ERROR" "Azure Static Web Apps API token not configured"
    exit 1
  fi

  # Install Azure CLI if not present
  if ! command -v az &> /dev/null; then
    print_warning "Azure CLI not found - installing..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    log "INFO" "Azure CLI installed"
  fi

  # Login to Azure
  print_warning "Authenticating with Azure..."
  if ! az login --service-principal -u "$AZURE_CLIENT_ID" -p "$AZURE_CLIENT_SECRET" \
       --tenant "$AZURE_TENANT_ID" 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
    print_error "Azure authentication failed"
    log "ERROR" "Azure authentication failed"
    exit 1
  fi

  print_success "Azure authentication successful"
  log "INFO" "Successfully authenticated with Azure"

  # Deploy using SWA CLI
  print_warning "Deploying frontend to Azure Static Web Apps..."

  if command -v swa &> /dev/null; then
    if ! swa deploy "$PROJECT_ROOT/dist" \
         --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN" 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
      print_error "Azure Static Web Apps deployment failed"
      log "ERROR" "SWA CLI deployment failed"
      exit 1
    fi
  else
    print_warning "SWA CLI not found - using az CLI for deployment"

    if ! az staticwebapp upload \
         --name "$AZURE_STATIC_WEB_APP_NAME" \
         --resource-group "$AZURE_RESOURCE_GROUP" \
         --source-dir "$PROJECT_ROOT/dist" 2>&1 | tee -a "$CURRENT_DEPLOYMENT_LOG"; then
      print_error "Azure deployment failed"
      log "ERROR" "Azure Static Web App deployment failed"
      exit 1
    fi
  fi

  print_success "Azure deployment completed"
  log "INFO" "Frontend deployed to Azure Static Web Apps"

  # Save deployment info for rollback
  save_deployment_checkpoint
}

save_deployment_checkpoint() {
  local commit_hash=$(git -C "$PROJECT_ROOT" rev-parse HEAD)
  local deployment_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  cat > "$ROLLBACK_FILE" <<EOF
{
  "deployment_time": "$deployment_time",
  "commit_hash": "$commit_hash",
  "branch": "$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD)",
  "azure_app": "$AZURE_STATIC_WEB_APP_NAME"
}
EOF

  log "INFO" "Deployment checkpoint saved for rollback capability"
}

# ============================================================================
# Health Checks
# ============================================================================

wait_for_deployment() {
  print_header "Waiting for Deployment Stability"
  log "INFO" "Waiting for services to stabilize"

  local max_attempts=5
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    sleep 15
    print_warning "Health check attempt $attempt/$max_attempts..."

    if perform_health_checks; then
      print_success "Health checks passed"
      log "INFO" "All health checks passed"
      return 0
    fi

    attempt=$((attempt + 1))

    if [ $attempt -le $max_attempts ]; then
      print_warning "Health check failed, retrying in 15 seconds..."
      sleep 15
    fi
  done

  print_error "Health checks failed after $max_attempts attempts"
  log "ERROR" "Health checks failed after $max_attempts attempts"
  return 1
}

perform_health_checks() {
  print_header "Running Comprehensive Health Checks"
  log "INFO" "Starting health check sequence"

  # Source environment variables
  set -a
  source "$PROJECT_ROOT/.env.production"
  set +a

  local all_passed=true

  # Check frontend reachability
  if check_frontend_health; then
    print_success "Frontend health check passed"
    log "INFO" "Frontend is healthy"
  else
    print_error "Frontend health check failed"
    log "ERROR" "Frontend health check failed"
    all_passed=false
  fi

  # Check backend API
  if check_backend_health; then
    print_success "Backend API health check passed"
    log "INFO" "Backend API is healthy"
  else
    print_warning "Backend API health check failed (may not be deployed)"
    log "WARNING" "Backend API health check failed"
  fi

  # Check database connectivity
  if check_database_health; then
    print_success "Database health check passed"
    log "INFO" "Database is healthy"
  else
    print_warning "Database health check failed"
    log "WARNING" "Database health check failed"
  fi

  # Check Redis connectivity
  if check_redis_health; then
    print_success "Redis health check passed"
    log "INFO" "Redis is healthy"
  else
    print_warning "Redis health check failed (optional service)"
    log "WARNING" "Redis health check failed"
  fi

  # Check SSL certificate
  if check_ssl_health; then
    print_success "SSL certificate is valid"
    log "INFO" "SSL certificate is valid"
  else
    print_warning "SSL certificate check failed"
    log "WARNING" "SSL certificate check failed"
  fi

  if [ "$all_passed" = true ]; then
    return 0
  else
    return 1
  fi
}

check_frontend_health() {
  local frontend_url="${FRONTEND_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"

  local http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$frontend_url" 2>/dev/null || echo "000")

  if [ "$http_code" = "200" ] || [ "$http_code" = "304" ]; then
    return 0
  else
    log "WARNING" "Frontend returned HTTP $http_code"
    return 1
  fi
}

check_backend_health() {
  local backend_url="${BACKEND_URL:-http://localhost:3000}"
  local health_endpoint="${backend_url}/api/health"

  local http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$health_endpoint" 2>/dev/null || echo "000")

  if [ "$http_code" = "200" ]; then
    return 0
  else
    log "WARNING" "Backend health endpoint returned HTTP $http_code"
    return 1
  fi
}

check_database_health() {
  if [ -z "${DATABASE_URL:-}" ]; then
    log "WARNING" "DATABASE_URL not set, skipping database check"
    return 1
  fi

  cd "$PROJECT_ROOT/api"
  npm run check:db &>/dev/null && return 0 || return 1
}

check_redis_health() {
  local redis_host="${REDIS_HOST:-localhost}"
  local redis_port="${REDIS_PORT:-6379}"

  if command -v redis-cli &> /dev/null; then
    redis-cli -h "$redis_host" -p "$redis_port" ping &>/dev/null && return 0 || return 1
  else
    # Try with netcat
    timeout 5 bash -c "echo PING | nc -w 1 $redis_host $redis_port" &>/dev/null && return 0 || return 1
  fi
}

check_ssl_health() {
  local frontend_url="${FRONTEND_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"

  if [[ "$frontend_url" == https* ]]; then
    echo | openssl s_client -servername "${frontend_url#https://}" -connect "${frontend_url#https://}:443" 2>/dev/null | \
      openssl x509 -noout -checkend 86400 &>/dev/null && return 0 || return 1
  else
    return 0
  fi
}

# ============================================================================
# Rollback Functionality
# ============================================================================

perform_rollback() {
  print_header "Executing Rollback"
  print_error "Deployment failed - initiating rollback"
  log "ERROR" "Initiating automatic rollback"

  if [ ! -f "$ROLLBACK_FILE" ]; then
    print_error "No previous deployment checkpoint found - cannot rollback"
    log "ERROR" "No rollback checkpoint available"
    return 1
  fi

  # Source environment variables
  set -a
  source "$PROJECT_ROOT/.env.production"
  set +a

  # Parse rollback checkpoint
  local prev_commit=$(grep -o '"commit_hash": "[^"]*"' "$ROLLBACK_FILE" | cut -d'"' -f4)

  print_warning "Rolling back to commit: $prev_commit"
  log "INFO" "Rolling back to previous commit: $prev_commit"

  # Reset to previous commit
  git -C "$PROJECT_ROOT" reset --hard "$prev_commit" || {
    print_error "Git reset failed"
    log "ERROR" "Cannot reset to previous commit"
    return 1
  }

  print_success "Repository rolled back"
  log "INFO" "Repository reset to previous commit"

  # Rebuild and redeploy previous version
  print_warning "Rebuilding previous version..."
  if ! build_backend || ! build_frontend; then
    print_error "Rollback build failed"
    log "ERROR" "Rollback build failed"
    return 1
  fi

  print_warning "Redeploying previous version..."
  if ! deploy_to_azure; then
    print_error "Rollback deployment failed"
    log "ERROR" "Rollback deployment failed"
    return 1
  fi

  print_success "Rollback completed successfully"
  log "INFO" "Rollback completed and verified"
  notify_slack "ROLLBACK_COMPLETE" "Deployment rolled back to $prev_commit"
}

# ============================================================================
# Main Deployment Flow
# ============================================================================

main() {
  print_header "FLEET PRODUCTION DEPLOYMENT"
  echo "Deployment started at: $(date)"
  echo "Deployment log: $CURRENT_DEPLOYMENT_LOG"
  echo ""

  log "INFO" "=========================================="
  log "INFO" "Fleet Production Deployment Started"
  log "INFO" "=========================================="

  # Step 1: Environment checks
  check_environment

  # Step 2: Run tests and security scans
  run_tests
  security_scan

  # Step 3: Build processes
  build_backend
  build_frontend

  # Step 4: Database operations
  run_migrations

  # Step 5: Deploy to Azure
  deploy_to_azure

  # Step 6: Health checks
  if ! wait_for_deployment; then
    print_error "Health checks failed - deployment may be unstable"
    log "ERROR" "Health checks failed after deployment"
    perform_rollback || exit 1
    exit 1
  fi

  # Success!
  print_header "DEPLOYMENT SUCCESSFUL"
  echo "Deployment completed at: $(date)"
  echo "Deployment log: $CURRENT_DEPLOYMENT_LOG"
  echo ""

  log "INFO" "=========================================="
  log "INFO" "Fleet Production Deployment Completed Successfully"
  log "INFO" "=========================================="

  notify_slack "SUCCESS" "Production deployment completed successfully at $(date)"
  send_email_notification "SUCCESS" 0

  return 0
}

# Run main function
main "$@"
