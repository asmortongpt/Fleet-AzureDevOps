#!/bin/bash

# ============================================================================
# Fleet Management System - Production Deployment Script
# ============================================================================
# This script orchestrates a complete production deployment to Azure
# Author: Capital Tech Alliance
# Last Updated: 2025-12-31
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_LOG="$PROJECT_ROOT/deployment-$(date +%Y%m%d-%H%M%S).log"
AZURE_STATIC_WEB_APP_URL="${AZURE_STATIC_WEB_APP_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"
ENVIRONMENT="production"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# Error handler
error_handler() {
    local line_number=$1
    log_error "Deployment failed at line $line_number"
    log_error "Check log file: $DEPLOYMENT_LOG"
    exit 1
}

trap 'error_handler $LINENO' ERR

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           Fleet Management System Deployment                  ║
║           Production Environment                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_info "Starting production deployment at $(date)"
log_info "Environment: $ENVIRONMENT"
log_info "Target URL: $AZURE_STATIC_WEB_APP_URL"
log_info "Project root: $PROJECT_ROOT"

# ============================================================================
# Phase 1: Pre-flight Checks
# ============================================================================
log_info "Phase 1: Pre-flight checks"

cd "$PROJECT_ROOT"

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_warning "Current branch is '$CURRENT_BRANCH', not 'main'"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled by user"
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Uncommitted changes detected"
    git status --short
    read -p "Commit changes before deployment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Committing changes..."
        git add .
        git commit -m "chore: Pre-deployment commit $(date +%Y-%m-%d)"
    fi
fi

# Verify Azure CLI is installed
if ! command -v az &> /dev/null; then
    log_warning "Azure CLI not installed - some features may be limited"
else
    log_success "Azure CLI found"
    # Check Azure login status
    if az account show &>/dev/null; then
        AZURE_ACCOUNT=$(az account show --query name -o tsv)
        log_success "Logged into Azure account: $AZURE_ACCOUNT"
    else
        log_warning "Not logged into Azure CLI"
        log_info "Run 'az login' to enable Azure CLI features"
    fi
fi

# Check Node.js version
NODE_VERSION=$(node -v)
log_info "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm -v)
log_info "npm version: $NPM_VERSION"

log_success "Pre-flight checks completed"

# ============================================================================
# Phase 2: Install Dependencies
# ============================================================================
log_info "Phase 2: Installing dependencies"

log_info "Running npm ci for clean install..."
npm ci --prefer-offline --no-audit 2>&1 | tee -a "$DEPLOYMENT_LOG"

log_success "Dependencies installed successfully"

# ============================================================================
# Phase 3: Quality Gates
# ============================================================================
log_info "Phase 3: Running quality gates"

# TypeScript check
log_info "Running TypeScript compilation check..."
if npm run typecheck 2>&1 | tee -a "$DEPLOYMENT_LOG"; then
    log_success "TypeScript check passed"
else
    log_error "TypeScript check failed"
    exit 1
fi

# Linting
log_info "Running ESLint..."
if npm run lint 2>&1 | tee -a "$DEPLOYMENT_LOG"; then
    log_success "Linting passed"
else
    log_warning "Linting issues detected - review above"
    read -p "Continue deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Security audit
log_info "Running security audit..."
if npm audit --audit-level=high --production 2>&1 | tee -a "$DEPLOYMENT_LOG"; then
    log_success "Security audit passed"
else
    log_warning "Security vulnerabilities detected - review above"
    read -p "Continue deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log_success "Quality gates completed"

# ============================================================================
# Phase 4: Build Production Bundle
# ============================================================================
log_info "Phase 4: Building production bundle"

# Load production environment
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    log_info "Loading production environment variables"
    set -a
    source "$PROJECT_ROOT/.env.production"
    set +a
fi

# Build
log_info "Running production build..."
NODE_ENV=production npm run build 2>&1 | tee -a "$DEPLOYMENT_LOG"

# Check build output
if [ ! -d "$PROJECT_ROOT/dist" ]; then
    log_error "Build failed - dist directory not found"
    exit 1
fi

# Calculate bundle size
BUNDLE_SIZE=$(du -sh "$PROJECT_ROOT/dist" | cut -f1)
log_info "Bundle size: $BUNDLE_SIZE"

# Check bundle size (warn if > 10MB)
BUNDLE_SIZE_KB=$(du -sk "$PROJECT_ROOT/dist" | cut -f1)
if [ "$BUNDLE_SIZE_KB" -gt 10240 ]; then
    log_warning "Bundle size ($BUNDLE_SIZE) exceeds 10MB"
fi

log_success "Production bundle built successfully"

# ============================================================================
# Phase 5: Run Tests
# ============================================================================
log_info "Phase 5: Running test suite"

read -p "Run smoke tests before deployment? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    log_info "Running smoke tests..."
    if npm run test:smoke 2>&1 | tee -a "$DEPLOYMENT_LOG"; then
        log_success "Smoke tests passed"
    else
        log_error "Smoke tests failed"
        read -p "Continue deployment anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    log_warning "Skipping smoke tests"
fi

# ============================================================================
# Phase 6: Deploy to Azure
# ============================================================================
log_info "Phase 6: Deploying to Azure Static Web Apps"

# Check if we have the Azure Static Web Apps API token
if [ -z "${AZURE_STATIC_WEB_APPS_API_TOKEN:-}" ]; then
    log_warning "AZURE_STATIC_WEB_APPS_API_TOKEN not set"
    log_info "Deployment will need to be completed via GitHub Actions"
    log_info "Pushing to GitHub will trigger automatic deployment"

    read -p "Push to GitHub now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Pushing to GitHub..."
        git push origin "$CURRENT_BRANCH"
        log_success "Pushed to GitHub - deployment will be triggered automatically"
        log_info "Monitor deployment at: https://github.com/asmortongpt/Fleet/actions"
    fi
else
    log_info "Deploying using Azure Static Web Apps CLI..."

    # Check if SWA CLI is installed
    if ! command -v swa &> /dev/null; then
        log_warning "Azure Static Web Apps CLI not installed"
        log_info "Installing @azure/static-web-apps-cli..."
        npm install -g @azure/static-web-apps-cli
    fi

    # Deploy using SWA CLI
    log_info "Deploying with SWA CLI..."
    swa deploy ./dist \
        --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN" \
        --env production \
        2>&1 | tee -a "$DEPLOYMENT_LOG"

    log_success "Deployment to Azure completed"
fi

# ============================================================================
# Phase 7: Post-Deployment Verification
# ============================================================================
log_info "Phase 7: Post-deployment verification"

log_info "Waiting 30 seconds for deployment to propagate..."
sleep 30

# Health check
log_info "Running health check on $AZURE_STATIC_WEB_APP_URL"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AZURE_STATIC_WEB_APP_URL" || echo "000")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
    log_success "Health check passed - HTTP $HTTP_STATUS"
else
    log_error "Health check failed - HTTP $HTTP_STATUS"
    exit 1
fi

# Check response time
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$AZURE_STATIC_WEB_APP_URL")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
log_info "Response time: ${RESPONSE_MS}ms"

if [ "$(echo "$RESPONSE_TIME > 5" | bc -l)" -eq 1 ]; then
    log_warning "Response time (${RESPONSE_MS}ms) exceeds 5s threshold"
else
    log_success "Response time check passed"
fi

# Check SSL certificate
log_info "Checking SSL certificate..."
if openssl s_client -connect "proud-bay-0fdc8040f.3.azurestaticapps.net:443" -servername "proud-bay-0fdc8040f.3.azurestaticapps.net" </dev/null 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1; then
    log_success "SSL certificate is valid"
else
    log_warning "Could not verify SSL certificate"
fi

log_success "Post-deployment verification completed"

# ============================================================================
# Phase 8: Deployment Summary
# ============================================================================
echo -e "\n${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           🎉 DEPLOYMENT SUCCESSFUL 🎉                          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

log_success "Deployment completed successfully at $(date)"
echo ""
log_info "Deployment Summary:"
echo "  - Environment: $ENVIRONMENT"
echo "  - URL: $AZURE_STATIC_WEB_APP_URL"
echo "  - Bundle Size: $BUNDLE_SIZE"
echo "  - Response Time: ${RESPONSE_MS}ms"
echo "  - Health Status: HTTP $HTTP_STATUS"
echo "  - Git Commit: $(git rev-parse --short HEAD)"
echo "  - Git Branch: $CURRENT_BRANCH"
echo ""
log_info "Deployment log saved to: $DEPLOYMENT_LOG"
echo ""
log_success "Application is live at: $AZURE_STATIC_WEB_APP_URL"
echo ""

# Open browser
read -p "Open application in browser? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "$AZURE_STATIC_WEB_APP_URL"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$AZURE_STATIC_WEB_APP_URL"
    else
        log_info "Please open $AZURE_STATIC_WEB_APP_URL in your browser"
    fi
fi

exit 0
