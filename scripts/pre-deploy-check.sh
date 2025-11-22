#!/usr/bin/env bash
#
# Pre-Deployment Check Script
# Validates environment and security requirements before deployment
#
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DIST_DIR="dist"

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

log_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to verify NODE_ENV is set to production
verify_node_env() {
    log_section "Verifying Environment"

    if [[ "${NODE_ENV:-}" == "production" ]]; then
        log_success "NODE_ENV is set to 'production'"
        return 0
    elif [[ -n "${NODE_ENV:-}" ]]; then
        log_failure "NODE_ENV is set to '${NODE_ENV}' (expected 'production')"
        log_info "Set NODE_ENV=production before deploying to production"
        return 1
    else
        log_failure "NODE_ENV is not set (expected 'production')"
        log_info "Run: export NODE_ENV=production"
        return 1
    fi
}

# Function to check for .env files in dist
check_no_env_in_dist() {
    log_section "Checking for .env Files in dist/"

    if [[ ! -d "$DIST_DIR" ]]; then
        log_warning "dist/ directory does not exist - run build first"
        return 0
    fi

    # Find all .env files in dist
    local env_files
    env_files=$(find "$DIST_DIR" -name ".env*" -type f 2>/dev/null || true)

    if [[ -z "$env_files" ]]; then
        log_success "No .env files found in dist/"
        return 0
    else
        log_failure "Found .env files in dist/ - these should NOT be deployed!"
        echo "$env_files" | while read -r file; do
            echo -e "  ${RED}SECURITY RISK:${NC} $file"
        done
        log_info "Remove these files before deploying to production"
        return 1
    fi
}

# Function to check for other sensitive files in dist
check_no_sensitive_files() {
    log_section "Checking for Sensitive Files in dist/"

    if [[ ! -d "$DIST_DIR" ]]; then
        log_warning "dist/ directory does not exist - run build first"
        return 0
    fi

    local sensitive_patterns=(
        "*.pem"
        "*.key"
        "*.cert"
        "*.p12"
        "*.pfx"
        "credentials*.json"
        "secrets*.json"
        "config.local.*"
        ".npmrc"
        ".yarnrc"
        "*.log"
        ".git"
        ".gitignore"
        ".DS_Store"
        "Thumbs.db"
    )

    local found_sensitive=0

    for pattern in "${sensitive_patterns[@]}"; do
        local matches
        matches=$(find "$DIST_DIR" -name "$pattern" -type f 2>/dev/null | head -5 || true)

        if [[ -n "$matches" ]]; then
            if [[ $found_sensitive -eq 0 ]]; then
                log_failure "Found sensitive files in dist/:"
                found_sensitive=1
            fi
            echo "$matches" | while read -r file; do
                echo -e "  ${RED}SECURITY RISK:${NC} $file"
            done
        fi
    done

    if [[ $found_sensitive -eq 0 ]]; then
        log_success "No sensitive files found in dist/"
        return 0
    else
        return 1
    fi
}

# Function to validate Service Worker cache version
validate_sw_cache_version() {
    log_section "Validating Service Worker Cache Version"

    local sw_file="$DIST_DIR/sw.js"

    if [[ ! -f "$sw_file" ]]; then
        log_warning "Service Worker not found - skipping cache version check"
        return 0
    fi

    # Check for CACHE_VERSION constant
    if grep -q "CACHE_VERSION" "$sw_file" 2>/dev/null; then
        local cache_version
        cache_version=$(grep -o "CACHE_VERSION.*=.*['\"][^'\"]*['\"]" "$sw_file" | head -1 || echo "")

        if [[ -n "$cache_version" ]]; then
            log_success "Service Worker cache version is set"
            log_info "Found: $cache_version"

            # Check if version contains a meaningful identifier
            if echo "$cache_version" | grep -qE "v[0-9]+\.[0-9]+|[0-9]{4}|[a-f0-9]{8}"; then
                log_success "Cache version appears to have proper versioning"
            else
                log_warning "Consider using semantic versioning or timestamps in cache version"
            fi

            return 0
        else
            log_failure "CACHE_VERSION is defined but appears empty or malformed"
            return 1
        fi
    else
        log_failure "CACHE_VERSION constant not found in Service Worker"
        log_info "Add a CACHE_VERSION constant to manage cache invalidation"
        return 1
    fi
}

# Function to check for console.log statements in production code
check_no_debug_statements() {
    log_section "Checking for Debug Statements"

    if [[ ! -d "$DIST_DIR" ]]; then
        log_warning "dist/ directory does not exist - run build first"
        return 0
    fi

    local js_dir="$DIST_DIR/assets/js"

    if [[ ! -d "$js_dir" ]]; then
        log_warning "No JavaScript assets found"
        return 0
    fi

    # Check for console.log in minified code (usually these are stripped by build tools)
    local debug_count
    debug_count=$(grep -r "console\.log" "$js_dir" 2>/dev/null | wc -l | tr -d ' ')

    # In minified production builds, some console statements may be intentional
    if [[ "$debug_count" -eq 0 ]]; then
        log_success "No console.log statements found in production JavaScript"
    elif [[ "$debug_count" -lt 5 ]]; then
        log_warning "Found $debug_count console.log statement(s) in production JavaScript"
        log_info "Consider removing debug statements for production"
    else
        log_warning "Found $debug_count console.log statements in production JavaScript"
        log_info "Many debug statements detected - consider configuring build to strip console logs"
    fi

    return 0
}

# Function to verify build artifacts are present
verify_build_artifacts() {
    log_section "Verifying Build Artifacts"

    if [[ ! -d "$DIST_DIR" ]]; then
        log_failure "dist/ directory does not exist - run 'npm run build' first"
        return 1
    fi

    local required_files=(
        "index.html"
    )

    local required_dirs=(
        "assets"
        "assets/js"
        "assets/css"
    )

    local all_present=true

    # Check required files
    for file in "${required_files[@]}"; do
        if [[ -f "$DIST_DIR/$file" ]]; then
            log_success "$file exists"
        else
            log_failure "$file is missing"
            all_present=false
        fi
    done

    # Check required directories
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$DIST_DIR/$dir" ]]; then
            log_success "$dir/ exists"
        else
            log_failure "$dir/ is missing"
            all_present=false
        fi
    done

    if $all_present; then
        return 0
    else
        return 1
    fi
}

# Function to check git status for uncommitted changes
check_git_status() {
    log_section "Checking Git Status"

    if ! command -v git &> /dev/null; then
        log_warning "git not found - skipping git status check"
        return 0
    fi

    if [[ ! -d ".git" ]]; then
        log_warning "Not a git repository - skipping git status check"
        return 0
    fi

    # Check for uncommitted changes
    if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
        log_success "No uncommitted changes detected"
    else
        log_warning "Uncommitted changes detected"
        log_info "Consider committing changes before deploying"
        git status --short 2>/dev/null | head -10
    fi

    # Check current branch
    local branch
    branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    log_info "Current branch: $branch"

    if [[ "$branch" == "main" || "$branch" == "master" ]]; then
        log_success "Deploying from main branch"
    elif [[ "$branch" == "staging" || "$branch" == "stage"* ]]; then
        log_info "Deploying from staging branch"
    else
        log_warning "Deploying from non-main branch: $branch"
    fi

    return 0
}

# Function to verify npm dependencies are installed
verify_dependencies() {
    log_section "Verifying Dependencies"

    if [[ ! -d "node_modules" ]]; then
        log_failure "node_modules not found - run 'npm install' first"
        return 1
    fi

    # Check if package-lock.json exists
    if [[ -f "package-lock.json" ]]; then
        log_success "package-lock.json exists"
    else
        log_warning "package-lock.json not found - dependencies may not be locked"
    fi

    # Check npm ci would succeed (just verify, don't run)
    log_success "node_modules directory exists"

    return 0
}

# Main check flow
main() {
    log_section "Pre-Deployment Check"
    echo "Running pre-deployment checks..."
    echo "Date: $(date)"
    echo ""

    # Run all checks
    verify_node_env || true
    verify_dependencies || true
    verify_build_artifacts || true
    check_no_env_in_dist || true
    check_no_sensitive_files || true
    validate_sw_cache_version || true
    check_no_debug_statements || true
    check_git_status || true

    # Print summary
    log_section "Check Summary"
    echo -e "${GREEN}Passed:${NC}   $PASSED"
    echo -e "${RED}Failed:${NC}   $FAILED"
    echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
    echo ""

    if [[ $FAILED -gt 0 ]]; then
        echo -e "${RED}Pre-deployment checks FAILED${NC}"
        echo "Please fix the issues above before deploying."
        exit 1
    else
        echo -e "${GREEN}Pre-deployment checks PASSED${NC}"
        if [[ $WARNINGS -gt 0 ]]; then
            echo -e "${YELLOW}There are $WARNINGS warning(s) to review.${NC}"
        fi
        echo ""
        echo "Ready for deployment!"
        exit 0
    fi
}

# Run main function
main "$@"
