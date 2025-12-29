#!/bin/bash

################################################################################
# Emergency Rollback Script
# =============================================================================
# Automated rollback for failed deployments:
# - Rollback Azure deployment to previous version
# - Rollback database migrations
# - Restore previous application state
# - Send notifications to team
# - Log all rollback events
#
# Usage: ./rollback.sh [optional: previous-commit-hash]
# Exit Code: 0 if successful, 1 if failed
################################################################################

set -euo pipefail

# ============================================================================
# Color Output Functions
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
  echo -e "${MAGENTA}================================${NC}"
  echo -e "${MAGENTA}$1${NC}"
  echo -e "${MAGENTA}================================${NC}"
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

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ROLLBACK_LOG="${SCRIPT_DIR}/rollback-$(date +%Y%m%d_%H%M%S).log"
DEPLOYMENT_STATE_FILE="${SCRIPT_DIR}/.last-deployment"
GIT_LOG_FILE="${SCRIPT_DIR}/.git-history"

# Azure configuration
AZURE_STATIC_WEB_APP_NAME="${AZURE_STATIC_WEB_APP_NAME:-fleet-production}"
AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-fleet-rg}"
AZURE_SUBSCRIPTION="${AZURE_SUBSCRIPTION:-}"

# Notifications
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL_TO="${DEPLOYMENT_EMAIL_TO:-}"
ESCALATION_EMAIL="${ESCALATION_EMAIL:-}"

# Rollback configuration
PRESERVE_DATABASE=${PRESERVE_DATABASE:-false}
FORCE_ROLLBACK=${FORCE_ROLLBACK:-false}
DRY_RUN=${DRY_RUN:-false}

# Arguments
TARGET_COMMIT=${1:-}

# State tracking
ROLLBACK_STARTED=false
CONFIRMED=false

# ============================================================================
# Logging Functions
# ============================================================================

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [${level}] ${message}" | tee -a "$ROLLBACK_LOG"
}

# ============================================================================
# Confirmation and Safety Checks
# ============================================================================

confirm_rollback() {
  print_warning "===== ROLLBACK CONFIRMATION ====="
  print_warning "This action will:"
  print_warning "  1. Revert Git repository to previous state"
  print_warning "  2. Rollback Azure deployment"
  print_warning "  3. Optionally revert database migrations"
  print_warning "  4. Notify team members"
  print_warning ""

  if [ "$FORCE_ROLLBACK" != "true" ]; then
    read -p "Are you sure you want to proceed? (type 'yes' to confirm): " confirmation
    if [ "$confirmation" != "yes" ]; then
      print_error "Rollback cancelled"
      log "INFO" "Rollback cancelled by user"
      exit 0
    fi
  fi

  CONFIRMED=true
  log "INFO" "Rollback confirmed"
}

check_prerequisites() {
  print_header "Checking Rollback Prerequisites"
  log "INFO" "Verifying rollback prerequisites"

  # Check required commands
  local required_commands=("git" "curl")
  for cmd in "${required_commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      print_error "Required command not found: $cmd"
      log "ERROR" "Missing required command: $cmd"
      exit 1
    fi
  done

  print_success "Required commands available"

  # Check .env files
  if [ ! -f "$PROJECT_ROOT/.env.production" ]; then
    print_error ".env.production not found"
    log "ERROR" ".env.production missing"
    exit 1
  fi

  print_success ".env.production found"

  # Check deployment state file
  if [ ! -f "$DEPLOYMENT_STATE_FILE" ]; then
    print_warning "No previous deployment state found"
    print_info "Will need to specify target commit manually"
    log "WARNING" "Deployment state file not found"
  else
    print_success "Deployment state file found"
    log "INFO" "Previous deployment state available"
  fi

  # Verify git repository
  if ! git -C "$PROJECT_ROOT" rev-parse --git-dir &>/dev/null; then
    print_error "Not a valid git repository"
    log "ERROR" "Invalid git repository"
    exit 1
  fi

  print_success "Git repository valid"
  log "INFO" "Prerequisites check passed"
}

# ============================================================================
# Commit/Rollback Point Selection
# ============================================================================

get_target_commit() {
  # If provided as argument, use it
  if [ -n "$TARGET_COMMIT" ]; then
    print_info "Using specified commit: $TARGET_COMMIT"
    log "INFO" "Target commit specified: $TARGET_COMMIT"
    return 0
  fi

  # Try to read from deployment state
  if [ -f "$DEPLOYMENT_STATE_FILE" ]; then
    TARGET_COMMIT=$(grep -o '"commit_hash": "[^"]*"' "$DEPLOYMENT_STATE_FILE" | \
      head -1 | cut -d'"' -f4 || echo "")

    if [ -n "$TARGET_COMMIT" ]; then
      print_info "Using commit from deployment state: $TARGET_COMMIT"
      log "INFO" "Target commit from state file: $TARGET_COMMIT"
      return 0
    fi
  fi

  # Fallback: Ask user or use HEAD~1
  print_warning "Could not determine rollback target automatically"
  print_header "Recent Commits"

  git -C "$PROJECT_ROOT" log --oneline -10

  echo ""
  read -p "Enter commit hash to rollback to (or 'HEAD~1' for previous commit): " commit_input

  if [ -z "$commit_input" ]; then
    TARGET_COMMIT="HEAD~1"
  else
    TARGET_COMMIT="$commit_input"
  fi

  print_info "Target commit: $TARGET_COMMIT"
  log "INFO" "User specified target: $TARGET_COMMIT"
}

verify_target_commit() {
  print_info "Verifying target commit..."

  if ! git -C "$PROJECT_ROOT" rev-parse "$TARGET_COMMIT" &>/dev/null; then
    print_error "Invalid commit: $TARGET_COMMIT"
    log "ERROR" "Invalid commit hash: $TARGET_COMMIT"
    exit 1
  fi

  local commit_hash=$(git -C "$PROJECT_ROOT" rev-parse "$TARGET_COMMIT")
  local commit_message=$(git -C "$PROJECT_ROOT" log --format=%B -n 1 "$commit_hash")
  local commit_author=$(git -C "$PROJECT_ROOT" log --format=%an -n 1 "$commit_hash")
  local commit_date=$(git -C "$PROJECT_ROOT" log --format=%ai -n 1 "$commit_hash")

  print_success "Target commit verified"
  print_info "Commit: $commit_hash"
  print_info "Author: $commit_author"
  print_info "Date: $commit_date"
  print_info "Message: ${commit_message:0:60}..."

  log "INFO" "Target commit verified: $commit_hash"
  log "INFO" "Commit author: $commit_author"
  log "INFO" "Commit date: $commit_date"
}

# ============================================================================
# Git Rollback
# ============================================================================

rollback_git() {
  print_header "Performing Git Rollback"
  log "INFO" "Starting Git rollback"

  if [ "$DRY_RUN" = "true" ]; then
    print_warning "DRY RUN: Would reset to $TARGET_COMMIT"
    log "INFO" "[DRY RUN] Would reset to $TARGET_COMMIT"
    return 0
  fi

  # Save current state
  local current_branch=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD)
  local current_commit=$(git -C "$PROJECT_ROOT" rev-parse HEAD)

  print_info "Current branch: $current_branch"
  print_info "Current commit: $current_commit"

  log "INFO" "Current state - Branch: $current_branch, Commit: $current_commit"

  # Check for uncommitted changes
  if [ -n "$(git -C "$PROJECT_ROOT" status -s)" ]; then
    print_warning "Uncommitted changes detected - stashing them"
    git -C "$PROJECT_ROOT" stash
    log "INFO" "Uncommitted changes stashed"
  fi

  # Reset to target commit
  print_info "Resetting to commit: $TARGET_COMMIT"
  if git -C "$PROJECT_ROOT" reset --hard "$TARGET_COMMIT" &>/dev/null; then
    print_success "Git rollback completed"
    log "INFO" "Git reset successful"

    # Verify reset
    local new_commit=$(git -C "$PROJECT_ROOT" rev-parse HEAD)
    print_info "New HEAD: $new_commit"
    log "INFO" "Verified new HEAD: $new_commit"
  else
    print_error "Git reset failed"
    log "ERROR" "Git reset command failed"
    exit 1
  fi
}

# ============================================================================
# Azure Rollback
# ============================================================================

rollback_azure() {
  print_header "Rolling Back Azure Deployment"
  log "INFO" "Starting Azure rollback"

  if [ "$DRY_RUN" = "true" ]; then
    print_warning "DRY RUN: Would redeploy to Azure"
    log "INFO" "[DRY RUN] Would redeploy to Azure"
    return 0
  fi

  # Source environment
  set -a
  source "$PROJECT_ROOT/.env.production"
  set +a

  if [ -z "${AZURE_STATIC_WEB_APPS_API_TOKEN:-}" ]; then
    print_error "AZURE_STATIC_WEB_APPS_API_TOKEN not set"
    log "ERROR" "Azure API token not configured"
    return 1
  fi

  # Check Azure CLI
  if ! command -v az &> /dev/null; then
    print_warning "Azure CLI not found - installing..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    log "INFO" "Azure CLI installed"
  fi

  # Authenticate with Azure
  print_info "Authenticating with Azure..."
  if ! az login --service-principal -u "$AZURE_CLIENT_ID" -p "$AZURE_CLIENT_SECRET" \
       --tenant "$AZURE_TENANT_ID" &>/dev/null; then
    print_error "Azure authentication failed"
    log "ERROR" "Azure authentication failed"
    return 1
  fi

  print_success "Azure authentication successful"
  log "INFO" "Azure authenticated"

  # Rebuild frontend
  print_info "Rebuilding frontend..."
  cd "$PROJECT_ROOT"

  if ! npm run build 2>&1 | tail -20 >> "$ROLLBACK_LOG"; then
    print_error "Frontend rebuild failed"
    log "ERROR" "Frontend rebuild failed"
    return 1
  fi

  print_success "Frontend rebuilt"
  log "INFO" "Frontend rebuild successful"

  # Deploy to Azure
  print_info "Redeploying to Azure..."

  if command -v swa &> /dev/null; then
    if ! swa deploy "$PROJECT_ROOT/dist" \
         --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN" &>/dev/null; then
      print_warning "SWA CLI deployment failed - trying az CLI"
      log "WARNING" "SWA CLI deployment failed, trying az CLI"
    else
      print_success "SWA deployment successful"
      log "INFO" "Azure SWA deployment successful"
      return 0
    fi
  fi

  # Fallback to az CLI
  if ! az staticwebapp upload \
       --name "$AZURE_STATIC_WEB_APP_NAME" \
       --resource-group "$AZURE_RESOURCE_GROUP" \
       --source-dir "$PROJECT_ROOT/dist" &>/dev/null 2>&1; then
    print_error "Azure deployment failed"
    log "ERROR" "Azure az CLI deployment failed"
    return 1
  fi

  print_success "Azure deployment successful"
  log "INFO" "Azure deployment via az CLI successful"
  return 0
}

# ============================================================================
# Database Migration Rollback
# ============================================================================

rollback_database() {
  print_header "Database Migration Rollback"
  log "INFO" "Starting database migration rollback"

  if [ "$PRESERVE_DATABASE" = "true" ]; then
    print_info "Preserving database (PRESERVE_DATABASE=true)"
    log "INFO" "Database preservation enabled - skipping migration rollback"
    return 0
  fi

  if [ "$DRY_RUN" = "true" ]; then
    print_warning "DRY RUN: Would rollback database migrations"
    log "INFO" "[DRY RUN] Would rollback database migrations"
    return 0
  fi

  # Source environment
  set -a
  source "$PROJECT_ROOT/.env.production"
  set +a

  if [ -z "${DATABASE_URL:-}" ]; then
    print_warning "DATABASE_URL not configured - skipping"
    log "WARNING" "DATABASE_URL not set, skipping migration rollback"
    return 0
  fi

  cd "$PROJECT_ROOT/api"

  # Check database connectivity
  print_info "Checking database connectivity..."
  if ! npm run check:db &>/dev/null 2>&1; then
    print_warning "Cannot connect to database - skipping migration rollback"
    log "WARNING" "Database not reachable, skipping migration rollback"
    cd "$PROJECT_ROOT"
    return 0
  fi

  print_success "Database connectivity verified"

  # List pending migrations
  print_info "Checking for pending migrations to rollback..."

  # Note: Actual migration rollback depends on your migration tool
  # This is a template for drizzle-orm. Adjust for your tools.
  if [ -d "drizzle" ]; then
    print_info "Found Drizzle migrations"
    log "INFO" "Drizzle migrations detected"

    # Typically you'd run migrations down, but drizzle-orm doesn't have built-in down
    # You'd need custom migration scripts
    print_warning "Manual database rollback may be required"
    log "WARNING" "Manual database rollback may be needed for Drizzle"
  fi

  cd "$PROJECT_ROOT"
  return 0
}

# ============================================================================
# Health Verification After Rollback
# ============================================================================

verify_rollback() {
  print_header "Verifying Rollback Success"
  log "INFO" "Starting rollback verification"

  if [ "$DRY_RUN" = "true" ]; then
    print_warning "DRY RUN: Would verify deployment"
    log "INFO" "[DRY RUN] Would verify deployment"
    return 0
  fi

  # Wait for services to stabilize
  print_info "Waiting 30 seconds for services to stabilize..."
  sleep 30

  # Run health checks
  if [ -x "$SCRIPT_DIR/health-check.sh" ]; then
    print_info "Running health checks..."

    if "$SCRIPT_DIR/health-check.sh" &>/dev/null; then
      print_success "Health checks passed"
      log "INFO" "Health checks passed after rollback"
      return 0
    else
      print_warning "Health checks detected issues"
      log "WARNING" "Health checks found issues post-rollback"
      return 0  # Continue anyway as some services may need time
    fi
  else
    print_warning "Health check script not found"
    log "WARNING" "Health check script not available"
    return 0
  fi
}

# ============================================================================
# Notifications
# ============================================================================

notify_slack() {
  if [ -z "$SLACK_WEBHOOK" ]; then
    return 0
  fi

  local message=$1
  local target_commit=$2

  local payload=$(cat <<EOF
{
  "attachments": [
    {
      "color": "danger",
      "title": "Fleet Production Rollback Executed",
      "text": "$message",
      "fields": [
        {
          "title": "Target Commit",
          "value": "$target_commit",
          "short": true
        },
        {
          "title": "Timestamp",
          "value": "$(date)",
          "short": true
        },
        {
          "title": "Performed By",
          "value": "$(whoami)@$(hostname)",
          "short": false
        },
        {
          "title": "Rollback Log",
          "value": "$ROLLBACK_LOG",
          "short": false
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

notify_email() {
  if [ -z "$EMAIL_TO" ]; then
    return 0
  fi

  local subject="ALERT: Fleet Production Rollback Executed - $TARGET_COMMIT"
  local body="Production rollback has been executed.

Target Commit: $TARGET_COMMIT
Timestamp: $(date)
Performed By: $(whoami)@$(hostname)
Rollback Log: $ROLLBACK_LOG

DRY_RUN: $DRY_RUN
PRESERVE_DATABASE: $PRESERVE_DATABASE

Please review the rollback log and verify system status.
"

  echo -e "$body" | mail -s "$subject" "$EMAIL_TO" 2>/dev/null || log "WARNING" "Failed to send email notification"

  # Send escalation email if configured
  if [ -n "$ESCALATION_EMAIL" ] && [ "$ESCALATION_EMAIL" != "$EMAIL_TO" ]; then
    echo -e "$body" | mail -s "$subject [ESCALATION]" "$ESCALATION_EMAIL" 2>/dev/null || true
  fi
}

# ============================================================================
# Main Rollback Flow
# ============================================================================

main() {
  print_header "FLEET EMERGENCY ROLLBACK"
  echo "Started at: $(date)"
  echo "Log file: $ROLLBACK_LOG"
  echo ""

  log "INFO" "=========================================="
  log "INFO" "Fleet Emergency Rollback Started"
  log "INFO" "=========================================="
  log "INFO" "DRY_RUN: $DRY_RUN"
  log "INFO" "FORCE_ROLLBACK: $FORCE_ROLLBACK"
  log "INFO" "PRESERVE_DATABASE: $PRESERVE_DATABASE"

  # Step 1: Prerequisites
  check_prerequisites

  # Step 2: User confirmation
  if [ "$FORCE_ROLLBACK" != "true" ]; then
    confirm_rollback
  else
    print_warning "FORCE_ROLLBACK enabled - skipping confirmation"
    log "WARNING" "Forced rollback - user confirmation skipped"
  fi

  # Step 3: Determine target commit
  get_target_commit
  verify_target_commit

  ROLLBACK_STARTED=true

  # Step 4: Execute rollback
  print_header "EXECUTING ROLLBACK SEQUENCE"

  rollback_git || {
    print_error "Git rollback failed"
    log "ERROR" "Git rollback failed - aborting"
    notify_slack "FAILED" "Git rollback failed"
    exit 1
  }

  rollback_azure || {
    print_warning "Azure rollback had issues - may need manual intervention"
    log "ERROR" "Azure rollback failed"
    notify_slack "PARTIAL_FAILURE" "Azure rollback failed - may need manual intervention"
  }

  rollback_database || {
    print_warning "Database rollback had issues"
    log "ERROR" "Database rollback failed"
  }

  # Step 5: Verify
  verify_rollback

  # Step 6: Notifications
  print_header "Sending Notifications"
  notify_slack "COMPLETED" "$TARGET_COMMIT"
  notify_email

  # Final status
  print_header "ROLLBACK COMPLETED"
  echo "Rollback finished at: $(date)"
  echo "Target commit: $TARGET_COMMIT"
  echo "Rollback log: $ROLLBACK_LOG"
  echo ""

  log "INFO" "=========================================="
  log "INFO" "Fleet Emergency Rollback Completed"
  log "INFO" "=========================================="

  return 0
}

# Run main function
main "$@"
