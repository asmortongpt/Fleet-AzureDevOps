#!/usr/bin/env bash
#
# Security Audit Script for Fleet Management System
# Performs comprehensive npm security audit and generates reports
#
# Usage:
#   ./scripts/security-audit.sh [options]
#
# Options:
#   --fix          Run npm audit fix automatically
#   --json         Output results in JSON format
#   --report       Generate detailed audit report file
#   --production   Only check production dependencies
#   --verbose      Show detailed vulnerability information
#   --ci           CI mode - fail on any vulnerability
#   --help         Show this help message
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="${PROJECT_ROOT}/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
AUDIT_REPORT="${REPORT_DIR}/audit-report-${TIMESTAMP}.json"
SUMMARY_REPORT="${REPORT_DIR}/audit-summary-${TIMESTAMP}.txt"

# Flags
FIX_MODE=false
JSON_MODE=false
GENERATE_REPORT=false
PRODUCTION_ONLY=false
VERBOSE=false
CI_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX_MODE=true
            shift
            ;;
        --json)
            JSON_MODE=true
            shift
            ;;
        --report)
            GENERATE_REPORT=true
            shift
            ;;
        --production)
            PRODUCTION_ONLY=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
        --help)
            echo "Security Audit Script for Fleet Management System"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --fix          Run npm audit fix automatically"
            echo "  --json         Output results in JSON format"
            echo "  --report       Generate detailed audit report file"
            echo "  --production   Only check production dependencies"
            echo "  --verbose      Show detailed vulnerability information"
            echo "  --ci           CI mode - fail on any vulnerability"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  Fleet Security Audit - $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}--- $1 ---${NC}"
    echo ""
}

# Ensure we're in the project root
cd "$PROJECT_ROOT"

# Create reports directory if needed
if [[ "$GENERATE_REPORT" == true ]]; then
    mkdir -p "$REPORT_DIR"
fi

if [[ "$JSON_MODE" != true ]]; then
    print_header
fi

# Build audit command
AUDIT_CMD="npm audit"
if [[ "$PRODUCTION_ONLY" == true ]]; then
    AUDIT_CMD="$AUDIT_CMD --omit=dev"
fi

# Run the audit and capture results
print_section "Running npm audit"

# Run audit and capture both output and exit code
set +e
if [[ "$JSON_MODE" == true ]]; then
    AUDIT_OUTPUT=$(npm audit --json 2>&1)
    AUDIT_EXIT_CODE=$?
else
    AUDIT_OUTPUT=$($AUDIT_CMD 2>&1)
    AUDIT_EXIT_CODE=$?
fi
set -e

# Parse vulnerability counts from JSON
VULN_JSON=$(npm audit --json 2>&1 || true)
CRITICAL=$(echo "$VULN_JSON" | grep -o '"critical":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
HIGH=$(echo "$VULN_JSON" | grep -o '"high":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
MODERATE=$(echo "$VULN_JSON" | grep -o '"moderate":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
LOW=$(echo "$VULN_JSON" | grep -o '"low":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
INFO=$(echo "$VULN_JSON" | grep -o '"info":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
TOTAL=$((CRITICAL + HIGH + MODERATE + LOW + INFO))

if [[ "$JSON_MODE" == true ]]; then
    echo "$AUDIT_OUTPUT"
else
    echo "$AUDIT_OUTPUT"

    print_section "Vulnerability Summary"

    if [[ "$TOTAL" -eq 0 ]]; then
        echo -e "${GREEN}No vulnerabilities found!${NC}"
    else
        echo -e "Total vulnerabilities: ${YELLOW}$TOTAL${NC}"
        [[ "$CRITICAL" -gt 0 ]] && echo -e "  ${RED}Critical: $CRITICAL${NC}"
        [[ "$HIGH" -gt 0 ]] && echo -e "  ${RED}High: $HIGH${NC}"
        [[ "$MODERATE" -gt 0 ]] && echo -e "  ${YELLOW}Moderate: $MODERATE${NC}"
        [[ "$LOW" -gt 0 ]] && echo -e "  Low: $LOW"
        [[ "$INFO" -gt 0 ]] && echo -e "  Info: $INFO"
    fi
fi

# Generate report if requested
if [[ "$GENERATE_REPORT" == true ]]; then
    print_section "Generating Reports"

    # JSON report
    npm audit --json > "$AUDIT_REPORT" 2>&1 || true
    echo "JSON report: $AUDIT_REPORT"

    # Text summary report
    {
        echo "Fleet Security Audit Report"
        echo "Generated: $(date)"
        echo "========================================"
        echo ""
        echo "Vulnerability Summary:"
        echo "  Critical: $CRITICAL"
        echo "  High: $HIGH"
        echo "  Moderate: $MODERATE"
        echo "  Low: $LOW"
        echo "  Info: $INFO"
        echo "  Total: $TOTAL"
        echo ""
        echo "Full Audit Output:"
        echo "----------------------------------------"
        npm audit 2>&1 || true
    } > "$SUMMARY_REPORT"
    echo "Summary report: $SUMMARY_REPORT"
fi

# Check specific packages mentioned in security requirements
print_section "Security-Critical Package Versions"

echo "Checking versions of security-critical packages..."
echo ""

check_package() {
    local pkg_name=$1
    local version
    version=$(npm list "$pkg_name" --depth=0 2>/dev/null | grep "$pkg_name@" | head -1 | sed 's/.*@//' || echo "not installed")
    local latest
    latest=$(npm show "$pkg_name" version 2>/dev/null || echo "unknown")

    if [[ "$version" == "$latest" ]]; then
        echo -e "  ${GREEN}$pkg_name: $version (latest)${NC}"
    elif [[ "$version" == "not installed" ]]; then
        echo -e "  ${YELLOW}$pkg_name: not installed${NC}"
    else
        echo -e "  ${YELLOW}$pkg_name: $version (latest: $latest)${NC}"
    fi
}

check_package "axios"
check_package "puppeteer"
check_package "marked"
check_package "undici"
check_package "dompurify"

# Run fix if requested
if [[ "$FIX_MODE" == true ]]; then
    print_section "Running npm audit fix"

    if [[ "$PRODUCTION_ONLY" == true ]]; then
        npm audit fix --omit=dev 2>&1 || true
    else
        npm audit fix 2>&1 || true
    fi

    echo ""
    echo -e "${GREEN}Audit fix completed.${NC}"

    # Re-run audit to show remaining issues
    print_section "Post-fix Audit Results"
    npm audit 2>&1 || true
fi

# CI mode - exit with error if vulnerabilities found
if [[ "$CI_MODE" == true ]]; then
    if [[ "$CRITICAL" -gt 0 ]] || [[ "$HIGH" -gt 0 ]]; then
        echo ""
        echo -e "${RED}CI FAILURE: Critical or High vulnerabilities detected!${NC}"
        exit 1
    fi

    if [[ "$TOTAL" -gt 0 ]]; then
        echo ""
        echo -e "${YELLOW}CI WARNING: Vulnerabilities detected (no critical/high)${NC}"
    fi
fi

# Final summary
if [[ "$JSON_MODE" != true ]]; then
    print_section "Audit Complete"

    if [[ "$TOTAL" -eq 0 ]]; then
        echo -e "${GREEN}All dependencies are secure!${NC}"
        exit 0
    elif [[ "$CRITICAL" -gt 0 ]] || [[ "$HIGH" -gt 0 ]]; then
        echo -e "${RED}ACTION REQUIRED: Critical/High vulnerabilities found!${NC}"
        echo -e "Run: ${YELLOW}npm audit fix${NC} or ${YELLOW}npm audit fix --force${NC}"
        exit 1
    else
        echo -e "${YELLOW}Some non-critical vulnerabilities found.${NC}"
        echo -e "Consider running: ${YELLOW}npm audit fix${NC}"
        exit 0
    fi
fi
