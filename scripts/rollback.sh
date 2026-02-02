#!/bin/bash

################################################################################
# Fleet Management System - Automated Rollback Script
################################################################################
# Description: Rollback to previous deployment version
# Author: Capital Tech Alliance - DevOps Team
# Version: 1.0.0
# Last Updated: 2025-12-31
################################################################################

set -euo pipefail

# ============================================================================
# ANSI Color Codes
# ============================================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'

# ============================================================================
# Configuration
# ============================================================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/logs/rollback"
readonly LOG_FILE="${LOG_DIR}/rollback-$(date +%Y%m%d-%H%M%S).log"

# Azure Configuration
readonly AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-fleet-management-rg}"
readonly AZURE_STATIC_WEB_APP_NAME="${AZURE_STATIC_WEB_APP_NAME:-fleet-management-app}"
readonly AZURE_CONTAINER_REGISTRY="${AZURE_CONTAINER_REGISTRY:-fleetmgmtacr}"
readonly AZURE_STATIC_WEB_APP_URL="${AZURE_STATIC_WEB_APP_URL}"

# Rollback Settings
readonly DRY_RUN="${DRY_RUN:-false}"
readonly AUTO_APPROVE="${AUTO_APPROVE:-false}"
readonly ROLLBACK_VERSION="${ROLLBACK_VERSION:-}"
readonly MAX_VERSIONS_TO_SHOW=10

# ============================================================================
# Utility Functions
# ============================================================================

log() {
    local level="$1"
    shift
    local message="$*"

    case "$level" in
        INFO)
            echo -e "${CYAN}[INFO]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
    esac
}

print_banner() {
    echo -e "${BOLD}${RED}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Fleet Management System - Automated Rollback               ║
║   Capital Tech Alliance                                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

check_prerequisites() {
    log INFO "Checking prerequisites..."

    if ! command -v az &> /dev/null; then
        log ERROR "Azure CLI not found"
        exit 1
    fi

    if ! az account show &> /dev/null; then
        log ERROR "Not logged in to Azure CLI"
        exit 1
    fi

    if ! command -v git &> /dev/null; then
        log ERROR "Git not found"
        exit 1
    fi

    log SUCCESS "Prerequisites satisfied"
}

get_current_deployment() {
    log INFO "Detecting current deployment..."

    # Try to get current version from deployment manifest
    local manifest_file="${PROJECT_ROOT}/deployment/manifest.json"

    if [ -f "$manifest_file" ]; then
        local current_version
        current_version=$(jq -r '.version' "$manifest_file" 2>/dev/null || echo "unknown")

        local current_sha
        current_sha=$(jq -r '.gitSha' "$manifest_file" 2>/dev/null || echo "unknown")

        log INFO "Current Version: ${current_version}"
        log INFO "Current Git SHA: ${current_sha}"

        export CURRENT_VERSION="$current_version"
        export CURRENT_SHA="$current_sha"
    else
        log WARNING "Deployment manifest not found"
        export CURRENT_VERSION="unknown"
        export CURRENT_SHA="unknown"
    fi
}

list_available_versions() {
    log INFO "Fetching available versions..."

    cd "$PROJECT_ROOT"

    # Get git tags (deployments)
    local tags
    tags=$(git tag -l 'v*' --sort=-version:refname | head -n "$MAX_VERSIONS_TO_SHOW")

    if [ -z "$tags" ]; then
        log ERROR "No deployment tags found"
        exit 1
    fi

    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  AVAILABLE VERSIONS FOR ROLLBACK${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""

    local index=1
    while IFS= read -r tag; do
        # Get tag info
        local tag_date
        tag_date=$(git log -1 --format=%ai "$tag" 2>/dev/null | cut -d' ' -f1,2 || echo "unknown")

        local tag_message
        tag_message=$(git tag -l --format='%(contents:subject)' "$tag" 2>/dev/null || echo "")

        # Highlight current version
        if [ "$tag" = "v${CURRENT_VERSION}" ]; then
            echo -e "  ${GREEN}[$index]${NC} ${BOLD}${tag}${NC} ${CYAN}(CURRENT)${NC} - ${tag_date}"
        else
            echo -e "  [$index] ${tag} - ${tag_date}"
        fi

        if [ -n "$tag_message" ]; then
            echo -e "      ${MAGENTA}${tag_message}${NC}"
        fi
        echo ""

        ((index++))
    done <<< "$tags"

    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Store tags for selection
    export AVAILABLE_TAGS="$tags"
}

select_rollback_version() {
    if [ -n "$ROLLBACK_VERSION" ]; then
        log INFO "Using specified version: ${ROLLBACK_VERSION}"
        export SELECTED_VERSION="$ROLLBACK_VERSION"
        return 0
    fi

    # Interactive selection
    echo -e "${YELLOW}Select version to rollback to:${NC}"
    read -p "Enter number (1-${MAX_VERSIONS_TO_SHOW}): " -r selection

    # Validate input
    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "$MAX_VERSIONS_TO_SHOW" ]; then
        log ERROR "Invalid selection"
        exit 1
    fi

    # Get selected tag
    local selected_tag
    selected_tag=$(echo "$AVAILABLE_TAGS" | sed -n "${selection}p")

    if [ -z "$selected_tag" ]; then
        log ERROR "Invalid selection"
        exit 1
    fi

    export SELECTED_VERSION="$selected_tag"
    log INFO "Selected version: ${SELECTED_VERSION}"
}

confirm_rollback() {
    if [ "$AUTO_APPROVE" = "true" ]; then
        log WARNING "Auto-approve enabled, skipping confirmation"
        return 0
    fi

    echo ""
    echo -e "${BOLD}${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${RED}  ROLLBACK CONFIRMATION${NC}"
    echo -e "${BOLD}${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "  Current Version:    ${CURRENT_VERSION} (${CURRENT_SHA})"
    echo -e "  Rollback To:        ${SELECTED_VERSION}"
    echo -e "  Target URL:         ${AZURE_STATIC_WEB_APP_URL}"
    echo -e "  Dry Run:            ${DRY_RUN}"
    echo -e "${BOLD}${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""

    echo -e "${YELLOW}${BOLD}WARNING: This will rollback the production deployment!${NC}"
    echo ""
    read -p "Do you want to proceed with rollback? (type 'yes' to confirm): " -r

    if [[ ! $REPLY = "yes" ]]; then
        log WARNING "Rollback cancelled by user"
        exit 0
    fi
}

checkout_version() {
    log INFO "Checking out version: ${SELECTED_VERSION}..."

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would checkout: ${SELECTED_VERSION}"
        return 0
    fi

    # Stash any uncommitted changes
    git stash push -m "Pre-rollback stash $(date +%Y%m%d-%H%M%S)" || true

    # Checkout the tag
    git checkout "$SELECTED_VERSION" || {
        log ERROR "Failed to checkout version ${SELECTED_VERSION}"
        exit 1
    }

    log SUCCESS "Checked out version: ${SELECTED_VERSION}"
}

build_rollback_version() {
    log INFO "Building rollback version..."

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would build version: ${SELECTED_VERSION}"
        return 0
    fi

    # Clean previous build
    rm -rf dist

    # Install dependencies
    log INFO "Installing dependencies..."
    npm ci --prefer-offline

    # Build production bundle
    log INFO "Building production bundle..."
    NODE_ENV=production npm run build

    if [ ! -d "dist" ]; then
        log ERROR "Build failed - dist directory not found"
        exit 1
    fi

    log SUCCESS "Build complete"
}

deploy_rollback() {
    log INFO "Deploying rollback version..."

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would deploy to: ${AZURE_STATIC_WEB_APP_NAME}"
        return 0
    fi

    # Deploy to Azure Static Web Apps
    az staticwebapp deploy \
        --name "$AZURE_STATIC_WEB_APP_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --source ./dist \
        --no-wait

    log SUCCESS "Rollback deployment initiated"
    log INFO "Waiting for deployment to complete..."

    # Wait for deployment
    sleep 30
}

verify_rollback() {
    log INFO "Verifying rollback deployment..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would verify: ${AZURE_STATIC_WEB_APP_URL}"
        return 0
    fi

    # Health check
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "${AZURE_STATIC_WEB_APP_URL}")

    if [ "$http_code" = "200" ]; then
        log SUCCESS "Rollback verification passed (HTTP ${http_code})"
    else
        log ERROR "Rollback verification failed (HTTP ${http_code})"
        log ERROR "Manual intervention may be required"
        exit 1
    fi

    # Run health checks if available
    if [ -f "${SCRIPT_DIR}/health-check.sh" ]; then
        log INFO "Running comprehensive health checks..."
        bash "${SCRIPT_DIR}/health-check.sh" || {
            log WARNING "Health checks detected issues"
        }
    fi
}

create_rollback_tag() {
    log INFO "Creating rollback tag..."

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would create rollback tag"
        return 0
    fi

    local rollback_tag="rollback-to-${SELECTED_VERSION}-$(date +%Y%m%d-%H%M%S)"

    git tag -a "$rollback_tag" -m "Rollback to ${SELECTED_VERSION}"
    git push origin "$rollback_tag" || true

    log SUCCESS "Created rollback tag: ${rollback_tag}"
}

notify_team() {
    log WARNING "═══════════════════════════════════════════════════════════════"
    log WARNING "  ROLLBACK COMPLETE - NOTIFY TEAM"
    log WARNING "═══════════════════════════════════════════════════════════════"
    log WARNING "  Previous Version:   ${CURRENT_VERSION}"
    log WARNING "  Rolled Back To:     ${SELECTED_VERSION}"
    log WARNING "  Production URL:     ${AZURE_STATIC_WEB_APP_URL}"
    log WARNING "  Completed At:       $(date '+%Y-%m-%d %H:%M:%S')"
    log WARNING "═══════════════════════════════════════════════════════════════"
    log WARNING ""
    log WARNING "  ACTION REQUIRED:"
    log WARNING "  1. Verify application is working correctly"
    log WARNING "  2. Notify team of rollback"
    log WARNING "  3. Investigate root cause of issue"
    log WARNING "  4. Plan fix for next deployment"
    log WARNING "═══════════════════════════════════════════════════════════════"
}

return_to_main_branch() {
    log INFO "Returning to main branch..."

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would return to main branch"
        return 0
    fi

    # Get main branch name
    local main_branch
    main_branch=$(git remote show origin | grep 'HEAD branch' | cut -d' ' -f5)

    if [ -z "$main_branch" ]; then
        main_branch="main"
    fi

    # Checkout main branch
    git checkout "$main_branch" || true

    # Pop stashed changes if any
    git stash pop || true

    log SUCCESS "Returned to branch: ${main_branch}"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Setup
    mkdir -p "$LOG_DIR"
    exec > >(tee -a "${LOG_FILE}")
    exec 2>&1

    # Print banner
    print_banner

    # Pre-flight checks
    check_prerequisites

    # Rollback workflow
    log INFO "Starting rollback process..."

    get_current_deployment
    list_available_versions
    select_rollback_version
    confirm_rollback
    checkout_version
    build_rollback_version
    deploy_rollback
    verify_rollback
    create_rollback_tag
    return_to_main_branch

    # Notify
    notify_team

    log INFO "Log file: ${LOG_FILE}"

    exit 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    cat << EOF
Usage: $0 [OPTIONS]

Automated rollback script for Fleet Management System.

OPTIONS:
    --version VERSION   Specific version to rollback to (e.g., v20251231-120000)
    --dry-run           Simulate rollback without making changes
    --auto-approve      Skip confirmation prompt
    -h, --help          Show this help message

ENVIRONMENT VARIABLES:
    AZURE_RESOURCE_GROUP         Azure Resource Group
    AZURE_STATIC_WEB_APP_NAME    Static Web App name
    AZURE_STATIC_WEB_APP_URL     Production URL
    ROLLBACK_VERSION             Version to rollback to
    DRY_RUN                      Set to 'true' for dry run
    AUTO_APPROVE                 Set to 'true' to skip confirmation

EXAMPLES:
    # Interactive rollback (select from list)
    $0

    # Rollback to specific version
    $0 --version v20251231-120000

    # Dry run
    $0 --dry-run

    # Automated rollback (CI/CD)
    $0 --version v20251231-120000 --auto-approve

EOF
    exit 0
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            ROLLBACK_VERSION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --auto-approve)
            AUTO_APPROVE=true
            shift
            ;;
        *)
            log ERROR "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main
main
