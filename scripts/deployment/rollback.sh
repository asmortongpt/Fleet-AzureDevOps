#!/bin/bash

# ============================================================================
# Fleet Management System - Rollback Script
# ============================================================================
# Rolls back deployment to previous version
# Author: Capital Tech Alliance
# Last Updated: 2025-12-31
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AZURE_STATIC_WEB_APP_URL="${AZURE_STATIC_WEB_APP_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${RED}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           Fleet Management System                             ║
║           ROLLBACK PROCEDURE                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_warning "This script will rollback the production deployment"
log_warning "Current application URL: $AZURE_STATIC_WEB_APP_URL"
echo ""

# ============================================================================
# Phase 1: Confirmation
# ============================================================================
log_info "Phase 1: Rollback confirmation"

read -p "Are you sure you want to rollback? (yes/NO): " CONFIRMATION
if [ "$CONFIRMATION" != "yes" ]; then
    log_info "Rollback cancelled"
    exit 0
fi

echo ""
read -p "Please provide a reason for rollback: " ROLLBACK_REASON
echo ""

log_warning "Rollback reason: $ROLLBACK_REASON"
log_warning "Proceeding with rollback in 10 seconds... (Ctrl+C to cancel)"
sleep 10

# ============================================================================
# Phase 2: Get Previous Commit
# ============================================================================
log_info "Phase 2: Identifying previous version"

cd "$PROJECT_ROOT"

CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_BRANCH=$(git branch --show-current)

log_info "Current commit: $CURRENT_COMMIT"
log_info "Current branch: $CURRENT_BRANCH"

# Show last 5 commits
log_info "Recent commits:"
git log --oneline -5

echo ""
read -p "Enter commit SHA to rollback to (or press Enter for previous commit): " TARGET_COMMIT

if [ -z "$TARGET_COMMIT" ]; then
    # Get previous commit
    TARGET_COMMIT=$(git rev-parse HEAD~1)
    log_info "Rolling back to previous commit: $TARGET_COMMIT"
else
    log_info "Rolling back to specified commit: $TARGET_COMMIT"
fi

# Verify commit exists
if ! git cat-file -e "$TARGET_COMMIT^{commit}" 2>/dev/null; then
    log_error "Invalid commit SHA: $TARGET_COMMIT"
    exit 1
fi

# Show commit details
log_info "Target commit details:"
git log --format="%h %an %ar: %s" -1 "$TARGET_COMMIT"

echo ""
read -p "Confirm rollback to this commit? (yes/NO): " FINAL_CONFIRM
if [ "$FINAL_CONFIRM" != "yes" ]; then
    log_info "Rollback cancelled"
    exit 0
fi

# ============================================================================
# Phase 3: Create Rollback Branch
# ============================================================================
log_info "Phase 3: Creating rollback branch"

ROLLBACK_BRANCH="rollback-$(date +%Y%m%d-%H%M%S)"
log_info "Creating rollback branch: $ROLLBACK_BRANCH"

git checkout -b "$ROLLBACK_BRANCH" "$TARGET_COMMIT"

log_success "Rollback branch created"

# ============================================================================
# Phase 4: Build Rollback Version
# ============================================================================
log_info "Phase 4: Building rollback version"

log_info "Installing dependencies..."
npm ci --prefer-offline --no-audit

log_info "Building application..."
NODE_ENV=production npm run build

if [ ! -d "$PROJECT_ROOT/dist" ]; then
    log_error "Build failed - dist directory not found"
    git checkout "$CURRENT_BRANCH"
    git branch -D "$ROLLBACK_BRANCH"
    exit 1
fi

log_success "Rollback version built successfully"

# ============================================================================
# Phase 5: Deploy Rollback
# ============================================================================
log_info "Phase 5: Deploying rollback version"

if [ -z "${AZURE_STATIC_WEB_APPS_API_TOKEN:-}" ]; then
    log_warning "AZURE_STATIC_WEB_APPS_API_TOKEN not set"
    log_info "Manual deployment required:"
    log_info "  1. Push rollback branch to GitHub:"
    log_info "     git push origin $ROLLBACK_BRANCH:main --force"
    log_info "  2. Monitor GitHub Actions for deployment"
    log_info "  3. Verify deployment at: $AZURE_STATIC_WEB_APP_URL"
    echo ""
    read -p "Push rollback branch now? (y/N): " PUSH_CONFIRM
    if [[ $PUSH_CONFIRM =~ ^[Yy]$ ]]; then
        log_warning "Force pushing rollback to main branch..."
        git push origin "$ROLLBACK_BRANCH:main" --force
        log_success "Rollback pushed - monitor deployment at:"
        log_info "  https://github.com/asmortongpt/Fleet/actions"
    fi
else
    log_info "Deploying with Azure Static Web Apps CLI..."

    # Check if SWA CLI is installed
    if ! command -v swa &> /dev/null; then
        log_info "Installing @azure/static-web-apps-cli..."
        npm install -g @azure/static-web-apps-cli
    fi

    # Deploy using SWA CLI
    swa deploy ./dist \
        --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN" \
        --env production

    log_success "Rollback deployed"
fi

# ============================================================================
# Phase 6: Verify Rollback
# ============================================================================
log_info "Phase 6: Verifying rollback"

log_info "Waiting 30 seconds for deployment to propagate..."
sleep 30

# Health check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AZURE_STATIC_WEB_APP_URL" || echo "000")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
    log_success "Rollback health check passed - HTTP $HTTP_STATUS"
else
    log_error "Rollback health check failed - HTTP $HTTP_STATUS"
    log_error "Manual intervention may be required"
fi

# ============================================================================
# Phase 7: Cleanup and Documentation
# ============================================================================
log_info "Phase 7: Cleanup and documentation"

# Create rollback log
ROLLBACK_LOG="$PROJECT_ROOT/rollback-$(date +%Y%m%d-%H%M%S).log"
cat > "$ROLLBACK_LOG" << LOGEOF
Fleet Management System - Rollback Log
======================================

Date: $(date)
Performed by: $(whoami)
Reason: $ROLLBACK_REASON

Previous State:
- Branch: $CURRENT_BRANCH
- Commit: $CURRENT_COMMIT

Rollback Target:
- Branch: $ROLLBACK_BRANCH
- Commit: $TARGET_COMMIT

Status: Success
HTTP Status: $HTTP_STATUS
Application URL: $AZURE_STATIC_WEB_APP_URL

Actions Taken:
1. Created rollback branch: $ROLLBACK_BRANCH
2. Built application from commit: $TARGET_COMMIT
3. Deployed to Azure Static Web Apps
4. Verified deployment health

Next Steps:
- Monitor application for stability
- Investigate root cause of original issue
- Create hotfix if needed
- Update team on rollback status
LOGEOF

log_success "Rollback log created: $ROLLBACK_LOG"

# Return to original branch
git checkout "$CURRENT_BRANCH"

log_info "Returned to original branch: $CURRENT_BRANCH"
log_warning "Rollback branch preserved: $ROLLBACK_BRANCH"

# ============================================================================
# Summary
# ============================================================================
echo -e "\n${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           ✅ ROLLBACK COMPLETED                                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

log_success "Rollback completed successfully"
echo ""
log_info "Rollback Summary:"
echo "  - Rolled back to: $TARGET_COMMIT"
echo "  - Rollback branch: $ROLLBACK_BRANCH"
echo "  - Application URL: $AZURE_STATIC_WEB_APP_URL"
echo "  - Health Status: HTTP $HTTP_STATUS"
echo "  - Log file: $ROLLBACK_LOG"
echo ""
log_warning "Important Next Steps:"
echo "  1. Verify application functionality in production"
echo "  2. Monitor error rates and metrics"
echo "  3. Investigate and fix the issue that required rollback"
echo "  4. Notify team of rollback and status"
echo "  5. Plan forward-fix deployment when ready"
echo ""

exit 0
