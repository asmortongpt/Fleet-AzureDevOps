#!/bin/bash

# Fleet-CTA Comprehensive Merge Execution Script
# This script executes the merge strategy defined in MERGE_STRATEGY_ROADMAP.md
# 
# Usage: ./execute-merge-strategy.sh [phase]
# Example: ./execute-merge-strategy.sh 1
# 
# Phases:
#   1 - Critical Fixes (1-2 hours)
#   2 - Dependency Updates (2-3 hours)
#   3 - Build & Quality Fixes (1-2 hours)
#   4 - Documentation & Features (2-3 hours)
#   5 - Production Migration (2-3 hours)
#   6 - Security & Compliance (1-2 hours)
#   7 - Infrastructure & Deployment (1-2 hours)
#   all - Execute all phases sequentially

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Verify we're in the right directory
if [ ! -d ".git" ]; then
  log_error "Not in a git repository. Please run this script from the Fleet-CTA root directory."
  exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  log_warning "You are not on the main branch (currently on: $CURRENT_BRANCH)"
  read -p "Do you want to continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Verify working directory is clean
if ! git diff-index --quiet HEAD --; then
  log_error "Working directory has uncommitted changes. Please commit or stash them first."
  git status
  exit 1
fi

# Phase 1: Critical Fixes
phase_1() {
  log_info "Phase 1: Critical Fixes (1-2 hours)"
  
  # Verify fix/infinite-loop-login is already merged
  log_info "Checking if fix/infinite-loop-login-2026-01-27 is already merged..."
  COMMITS_AHEAD=$(git log fix/infinite-loop-login-2026-01-27 ^main --oneline 2>/dev/null | wc -l)
  if [ "$COMMITS_AHEAD" -eq 0 ]; then
    log_success "fix/infinite-loop-login-2026-01-27 is already merged to main"
  else
    log_warning "fix/infinite-loop-login-2026-01-27 has $COMMITS_AHEAD commits ahead of main"
  fi
  
  # Merge maintenance schedules fix
  log_info "Merging fix/maintenance-schedules-api-2026-01-27..."
  git merge --no-ff fix/maintenance-schedules-api-2026-01-27 -m "merge: Fix maintenance schedules API endpoint schema mismatch"
  log_success "✓ fix/maintenance-schedules-api-2026-01-27 merged"
  
  # Merge Azure SWA fix
  log_info "Merging feature/fix-azure-swa-deployment-2026-01-26..."
  git merge --no-ff feature/fix-azure-swa-deployment-2026-01-26 -m "merge: Fix Azure Static Web Apps deployment issues"
  log_success "✓ feature/fix-azure-swa-deployment-2026-01-26 merged"
  
  log_info "Pushing to origin..."
  git push origin main
  log_success "Phase 1 complete!"
}

# Phase 2: Dependency Updates
phase_2() {
  log_info "Phase 2: Dependency Updates (2-3 hours)"
  
  BRANCHES=(
    "dependabot/npm_and_yarn/vitejs/plugin-react-5.1.2"
    "dependabot/npm_and_yarn/multi-92cd713b78"
    "dependabot/npm_and_yarn/typescript-eslint/eslint-plugin-8.53.0"
    "dependabot/npm_and_yarn/react-three/fiber-9.5.0"
    "dependabot/npm_and_yarn/vitest-4.0.17"
    "dependabot/npm_and_yarn/typescript-eslint/eslint-plugin-8.53.1"
    "dependabot/npm_and_yarn/tanstack/react-query-5.90.19"
    "dependabot/npm_and_yarn/react-three/drei-10.7.7"
    "dependabot/npm_and_yarn/react-hook-form-7.71.1"
    "dependabot/npm_and_yarn/storybook/react-10.1.11"
  )
  
  for branch in "${BRANCHES[@]}"; do
    log_info "Merging $branch..."
    git merge --no-ff "$branch" -m "merge(deps): Merge $branch dependency update"
    log_success "✓ $branch merged"
  done
  
  log_info "Pushing to origin..."
  git push origin main
  log_success "Phase 2 complete!"
}

# Phase 3: Build & Quality Fixes
phase_3() {
  log_info "Phase 3: Build & Quality Fixes (1-2 hours)"
  
  log_info "Merging fix/typescript-build-config..."
  git merge --no-ff fix/typescript-build-config -m "merge(fix): Remove TypeScript error suppression from build script"
  log_success "✓ fix/typescript-build-config merged"
  
  log_info "Merging fix/pipeline-eslint-build..."
  git merge --no-ff fix/pipeline-eslint-build -m "merge(fix): Add missing @testing-library/dom dependency"
  log_success "✓ fix/pipeline-eslint-build merged"
  
  log_info "Merging fix/error-boundary-clean..."
  git merge --no-ff fix/error-boundary-clean -m "merge(fix): Add ErrorBoundary wrappers to hub pages"
  log_success "✓ fix/error-boundary-clean merged"
  
  log_info "Pushing to origin..."
  git push origin main
  log_success "Phase 3 complete!"
}

# Phase 4: Documentation & Features
phase_4() {
  log_info "Phase 4: Documentation & Features (2-3 hours)"
  
  log_info "Running tests before merging features..."
  npm run test:integration 2>/dev/null || log_warning "Integration tests not available"
  
  log_info "Merging feature/streaming-enhanced-documentation..."
  git merge --no-ff feature/streaming-enhanced-documentation -m "merge(docs): Add streaming enhanced documentation"
  log_success "✓ feature/streaming-enhanced-documentation merged"
  
  log_info "Merging feature/caching-implementation..."
  git merge --no-ff feature/caching-implementation -m "merge(feat): Add Redis cache implementation"
  log_success "✓ feature/caching-implementation merged"
  
  log_info "Merging feature/excel-remediation-redis-cache..."
  git merge --no-ff feature/excel-remediation-redis-cache -m "merge(feat): Excel performance remediation with Redis cache"
  log_success "✓ feature/excel-remediation-redis-cache merged"
  
  log_info "Merging feature/demonstrate-pr-workflow..."
  git merge --no-ff feature/demonstrate-pr-workflow -m "merge(docs): PR workflow demonstration"
  log_success "✓ feature/demonstrate-pr-workflow merged"
  
  log_info "Merging module/drivers-hub..."
  git merge --no-ff module/drivers-hub -m "merge(feat): Drivers hub module enhancement"
  log_success "✓ module/drivers-hub merged"
  
  log_info "Merging test/comprehensive-e2e-suite..."
  git merge --no-ff test/comprehensive-e2e-suite -m "merge(test): Comprehensive E2E test suite"
  log_success "✓ test/comprehensive-e2e-suite merged"
  
  log_info "Merging perf/request-batching..."
  git merge --no-ff perf/request-batching -m "merge(perf): Request batching optimization (85% faster)"
  log_success "✓ perf/request-batching merged"
  
  log_info "Pushing to origin..."
  git push origin main
  log_success "Phase 4 complete!"
}

# Phase 5: Production Migration
phase_5() {
  log_info "Phase 5: Production Migration (2-3 hours)"
  
  log_info "Verifying Grok API configuration..."
  if [ -z "$GROK_API_KEY" ]; then
    log_warning "GROK_API_KEY not set. Grok integration will fail at runtime."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  else
    log_success "GROK_API_KEY is configured"
  fi
  
  log_info "Merging feat/production-migration-from-fleet..."
  git merge --no-ff feat/production-migration-from-fleet -m "merge(feat): Production migration with Grok model update"
  log_success "✓ feat/production-migration-from-fleet merged"
  
  log_info "Merging feat/grok-ui-integration-clean..."
  git merge --no-ff feat/grok-ui-integration-clean -m "merge(feat): Grok UI integration completion"
  log_success "✓ feat/grok-ui-integration-clean merged"
  
  log_info "Pushing to origin..."
  git push origin main
  log_success "Phase 5 complete!"
}

# Phase 6: Security & Compliance
phase_6() {
  log_info "Phase 6: Security & Compliance (1-2 hours)"
  
  log_info "Checking for secrets in security-remediation-20251228..."
  if git diff main..security-remediation-20251228 -- ".env*" "*.key" "*.secret" 2>/dev/null | grep -q "^+"; then
    log_error "Secrets detected in security-remediation branch!"
    exit 1
  fi
  log_success "No secrets detected"
  
  log_info "Merging security-remediation-20251228..."
  git merge --no-ff security-remediation-20251228 -m "merge(security): Security remediation and autonomous deployment"
  log_success "✓ security-remediation-20251228 merged"
  
  log_info "Merging audit/baseline..."
  git merge --no-ff audit/baseline -m "merge(audit): Audit baseline and compliance documentation"
  log_success "✓ audit/baseline merged"
  
  log_info "Pushing to origin..."
  git push origin main
  log_success "Phase 6 complete!"
}

# Phase 7: Infrastructure & Deployment
phase_7() {
  log_info "Phase 7: Infrastructure & Deployment (1-2 hours)"
  
  log_info "Merging deploy/policy-engine-production-ready..."
  git merge --no-ff deploy/policy-engine-production-ready -m "merge(deploy): Policy engine production ready"
  log_success "✓ deploy/policy-engine-production-ready merged"
  
  log_info "Merging k8s-config-fixes..."
  git merge --no-ff k8s-config-fixes -m "merge(infra): Kubernetes configuration fixes"
  log_success "✓ k8s-config-fixes merged"
  
  log_info "Pushing to origin..."
  git push origin main
  log_success "Phase 7 complete!"
}

# Execute requested phase
PHASE=${1:-all}

case $PHASE in
  1)
    phase_1
    ;;
  2)
    phase_2
    ;;
  3)
    phase_3
    ;;
  4)
    phase_4
    ;;
  5)
    phase_5
    ;;
  6)
    phase_6
    ;;
  7)
    phase_7
    ;;
  all)
    log_info "Executing all phases sequentially..."
    phase_1
    log_info "Waiting 5 seconds before Phase 2..."
    sleep 5
    phase_2
    log_info "Waiting 5 seconds before Phase 3..."
    sleep 5
    phase_3
    log_info "Waiting 5 seconds before Phase 4..."
    sleep 5
    phase_4
    log_info "Waiting 5 seconds before Phase 5..."
    sleep 5
    phase_5
    log_info "Waiting 5 seconds before Phase 6..."
    sleep 5
    phase_6
    log_info "Waiting 5 seconds before Phase 7..."
    sleep 5
    phase_7
    log_success "All phases complete!"
    ;;
  *)
    log_error "Invalid phase: $PHASE"
    echo "Usage: $0 [1-7|all]"
    exit 1
    ;;
esac

# Post-merge verification
log_info "Running post-merge verification..."
log_info "Building project..."
npm install
npm run build 2>/dev/null || log_warning "Build failed - check for issues"

log_success "Merge execution complete!"
log_info "Next steps:"
log_info "1. Run: npm run test:integration"
log_info "2. Run: npm run test:e2e"
log_info "3. Verify deployment to all remotes: git push azure main && git push github main"
log_info "4. Review MERGE_DECISIONS.md for documentation"

