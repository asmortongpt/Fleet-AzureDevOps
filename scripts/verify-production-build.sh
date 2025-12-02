#!/usr/bin/env bash
#
# Production Build Verification Script
# Verifies that the production build meets all quality and security requirements
#
# Exit codes:
#   0 - All verifications passed
#   1 - One or more verifications failed
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
MAX_BUNDLE_SIZE_MB=2
PREVIEW_PORT=4173
PREVIEW_TIMEOUT=10

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

# Function to run the production build
run_production_build() {
    log_section "Running Production Build"

    if npm run build; then
        log_success "Production build completed successfully"
        return 0
    else
        log_failure "Production build failed"
        return 1
    fi
}

# Function to verify dist directory exists
verify_dist_exists() {
    log_section "Verifying dist/ Directory"

    if [[ -d "$DIST_DIR" ]]; then
        log_success "dist/ directory exists"
        return 0
    else
        log_failure "dist/ directory does not exist"
        return 1
    fi
}

# Function to verify index.html exists
verify_index_html() {
    log_info "Checking for index.html..."

    if [[ -f "$DIST_DIR/index.html" ]]; then
        local size
        size=$(stat -f%z "$DIST_DIR/index.html" 2>/dev/null || stat --printf="%s" "$DIST_DIR/index.html" 2>/dev/null)
        if [[ "$size" -gt 0 ]]; then
            log_success "index.html exists (${size} bytes)"
            return 0
        else
            log_failure "index.html exists but is empty"
            return 1
        fi
    else
        log_failure "index.html not found in dist/"
        return 1
    fi
}

# Function to verify JavaScript assets
verify_js_assets() {
    log_info "Checking for JavaScript assets..."

    local js_dir="$DIST_DIR/assets/js"

    if [[ -d "$js_dir" ]]; then
        local js_count
        js_count=$(find "$js_dir" -name "*.js" -type f 2>/dev/null | wc -l | tr -d ' ')

        if [[ "$js_count" -gt 0 ]]; then
            log_success "Found $js_count JavaScript file(s) in assets/js/"

            # List main bundle files
            log_info "JavaScript files:"
            find "$js_dir" -name "*.js" -type f -exec basename {} \; | head -5 | while read -r file; do
                echo "  - $file"
            done

            return 0
        else
            log_failure "No JavaScript files found in assets/js/"
            return 1
        fi
    else
        log_failure "assets/js/ directory does not exist"
        return 1
    fi
}

# Function to verify CSS assets
verify_css_assets() {
    log_info "Checking for CSS stylesheets..."

    local css_dir="$DIST_DIR/assets/css"

    if [[ -d "$css_dir" ]]; then
        local css_count
        css_count=$(find "$css_dir" -name "*.css" -type f 2>/dev/null | wc -l | tr -d ' ')

        if [[ "$css_count" -gt 0 ]]; then
            log_success "Found $css_count CSS file(s) in assets/css/"

            # List CSS files
            log_info "CSS files:"
            find "$css_dir" -name "*.css" -type f -exec basename {} \; | head -5 | while read -r file; do
                echo "  - $file"
            done

            return 0
        else
            log_failure "No CSS files found in assets/css/"
            return 1
        fi
    else
        log_failure "assets/css/ directory does not exist"
        return 1
    fi
}

# Function to verify Service Worker
verify_service_worker() {
    log_info "Checking for Service Worker..."

    local sw_file="$DIST_DIR/sw.js"

    if [[ -f "$sw_file" ]]; then
        local size
        size=$(stat -f%z "$sw_file" 2>/dev/null || stat --printf="%s" "$sw_file" 2>/dev/null)

        if [[ "$size" -gt 0 ]]; then
            log_success "Service Worker (sw.js) exists (${size} bytes)"

            # Check for cache version
            if grep -q "CACHE_VERSION" "$sw_file" 2>/dev/null; then
                local cache_version
                cache_version=$(grep -o "CACHE_VERSION.*=.*['\"].*['\"]" "$sw_file" | head -1 || echo "unknown")
                log_info "Cache version: $cache_version"
            fi

            return 0
        else
            log_failure "Service Worker exists but is empty"
            return 1
        fi
    else
        log_failure "Service Worker (sw.js) not found in dist/"
        return 1
    fi
}

# Function to check total bundle size
check_bundle_size() {
    log_section "Checking Bundle Size"

    local total_size_bytes
    local total_size_mb
    local max_size_bytes

    # Calculate total size of dist directory
    total_size_bytes=$(du -s "$DIST_DIR" 2>/dev/null | awk '{print $1}')

    # Convert to MB (du returns size in 512-byte blocks on macOS, 1K blocks on Linux)
    if [[ "$(uname)" == "Darwin" ]]; then
        total_size_mb=$(echo "scale=2; $total_size_bytes * 512 / 1048576" | bc)
    else
        total_size_mb=$(echo "scale=2; $total_size_bytes / 1024" | bc)
    fi

    max_size_bytes=$((MAX_BUNDLE_SIZE_MB * 1024 * 1024))

    log_info "Total bundle size: ${total_size_mb}MB (limit: ${MAX_BUNDLE_SIZE_MB}MB)"

    # Compare using bc for floating point
    if (( $(echo "$total_size_mb < $MAX_BUNDLE_SIZE_MB" | bc -l) )); then
        log_success "Bundle size is within limit (${total_size_mb}MB < ${MAX_BUNDLE_SIZE_MB}MB)"
        return 0
    else
        log_failure "Bundle size exceeds limit (${total_size_mb}MB > ${MAX_BUNDLE_SIZE_MB}MB)"

        # Show largest files
        log_info "Largest files in bundle:"
        find "$DIST_DIR" -type f -exec ls -lh {} \; 2>/dev/null | sort -k5 -h -r | head -10 | awk '{print "  " $5 " " $9}'

        return 1
    fi
}

# Function to verify no sourcemaps in production
verify_no_sourcemaps() {
    log_section "Checking for Sourcemaps"

    local sourcemap_count
    sourcemap_count=$(find "$DIST_DIR" -name "*.map" -type f 2>/dev/null | wc -l | tr -d ' ')

    if [[ "$sourcemap_count" -eq 0 ]]; then
        log_success "No sourcemap files found in production build"
        return 0
    else
        log_failure "Found $sourcemap_count sourcemap file(s) in production build"
        log_info "Sourcemaps should not be included in production for security"

        # List sourcemap files
        find "$DIST_DIR" -name "*.map" -type f 2>/dev/null | head -5 | while read -r file; do
            echo "  - $file"
        done

        return 1
    fi
}

# Function to test preview server accessibility
test_preview_server() {
    log_section "Testing Preview Server"

    local pid=""
    local server_started=false

    # Start preview server in background
    log_info "Starting preview server on port $PREVIEW_PORT..."
    npm run preview -- --port "$PREVIEW_PORT" &
    pid=$!

    # Wait for server to start
    local attempts=0
    while [[ $attempts -lt $PREVIEW_TIMEOUT ]]; do
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PREVIEW_PORT" 2>/dev/null | grep -q "200"; then
            server_started=true
            break
        fi
        sleep 1
        ((attempts++))
    done

    local result=0

    if $server_started; then
        log_success "Preview server is accessible on port $PREVIEW_PORT"

        # Test that index.html is served
        local http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PREVIEW_PORT" 2>/dev/null)

        if [[ "$http_code" == "200" ]]; then
            log_success "Server responds with HTTP 200"
        else
            log_warning "Server responds with HTTP $http_code"
        fi

        # Test that assets are accessible
        if curl -s "http://localhost:$PREVIEW_PORT" 2>/dev/null | grep -q "<script"; then
            log_success "HTML contains script references"
        else
            log_warning "HTML may be missing script references"
        fi
    else
        log_failure "Preview server failed to start within ${PREVIEW_TIMEOUT}s"
        result=1
    fi

    # Clean up - kill preview server
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
        log_info "Preview server stopped"
    fi

    return $result
}

# Function to verify additional production artifacts
verify_additional_artifacts() {
    log_section "Verifying Additional Artifacts"

    # Check for manifest.json (PWA)
    if [[ -f "$DIST_DIR/manifest.json" ]]; then
        log_success "manifest.json exists (PWA support)"
    else
        log_warning "manifest.json not found (PWA may not work properly)"
    fi

    # Check for offline.html
    if [[ -f "$DIST_DIR/offline.html" ]]; then
        log_success "offline.html exists (offline support)"
    else
        log_warning "offline.html not found"
    fi

    # Check for icons directory
    if [[ -d "$DIST_DIR/icons" ]]; then
        local icon_count
        icon_count=$(find "$DIST_DIR/icons" -type f 2>/dev/null | wc -l | tr -d ' ')
        log_success "icons/ directory exists with $icon_count file(s)"
    else
        log_warning "icons/ directory not found"
    fi

    return 0
}


# Parse command line arguments
SKIP_BUILD=false
for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-build    Skip the build step (use existing dist/)"
            echo "  --help, -h      Show this help message"
            exit 0
            ;;
    esac
done

# Run main function with skip-build awareness
main_with_options() {
    log_section "Production Build Verification"
    echo "Starting production build verification..."
    echo "Date: $(date)"
    echo ""

    # Run the build first (unless --skip-build is set)
    if [[ "$SKIP_BUILD" == "false" ]]; then
        if ! run_production_build; then
            log_failure "Build failed - cannot proceed with verification"
            exit 1
        fi
    else
        log_info "Skipping build step (--skip-build flag set)"
    fi

    # Verify dist directory exists
    if ! verify_dist_exists; then
        log_failure "dist/ directory missing - cannot proceed"
        exit 1
    fi

    # Run all verifications
    verify_index_html || true
    verify_js_assets || true
    verify_css_assets || true
    verify_service_worker || true
    check_bundle_size || true
    verify_no_sourcemaps || true
    verify_additional_artifacts || true

    # Test preview server (optional - may fail in CI)
    if [[ "${SKIP_PREVIEW_TEST:-}" != "true" ]]; then
        test_preview_server || true
    else
        log_info "Skipping preview server test (SKIP_PREVIEW_TEST=true)"
    fi

    # Print summary
    log_section "Verification Summary"
    echo -e "${GREEN}Passed:${NC}   $PASSED"
    echo -e "${RED}Failed:${NC}   $FAILED"
    echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
    echo ""

    if [[ $FAILED -gt 0 ]]; then
        echo -e "${RED}Production build verification FAILED${NC}"
        echo "Please fix the issues above before deploying."
        exit 1
    else
        echo -e "${GREEN}Production build verification PASSED${NC}"
        if [[ $WARNINGS -gt 0 ]]; then
            echo -e "${YELLOW}There are $WARNINGS warning(s) to review.${NC}"
        fi
        exit 0
    fi
}

# Run main function
main_with_options
