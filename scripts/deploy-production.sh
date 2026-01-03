#!/bin/bash

################################################################################
# Fleet Management System - Production Deployment Script
################################################################################
# Description: Complete end-to-end production deployment automation
# Author: Capital Tech Alliance - Deployment Automation Team
# Version: 1.0.0
# Last Updated: 2025-12-31
################################################################################

set -euo pipefail

# ============================================================================
# ANSI Color Codes for Output
# ============================================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

# ============================================================================
# Configuration
# ============================================================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/logs/deployment"
readonly LOG_FILE="${LOG_DIR}/deploy-$(date +%Y%m%d-%H%M%S).log"
readonly DEPLOYMENT_TAG="v$(date +%Y%m%d-%H%M%S)"

# Azure Configuration
readonly AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-fleet-management-rg}"
readonly AZURE_LOCATION="${AZURE_LOCATION:-eastus2}"
readonly AZURE_STATIC_WEB_APP_NAME="${AZURE_STATIC_WEB_APP_NAME:-fleet-management-app}"
readonly AZURE_CONTAINER_REGISTRY="${AZURE_CONTAINER_REGISTRY:-fleetmgmtacr}"
readonly DOCKER_IMAGE_NAME="fleet-management-system"

# Deployment Settings
readonly DRY_RUN="${DRY_RUN:-false}"
readonly SKIP_TESTS="${SKIP_TESTS:-false}"
readonly SKIP_BACKUP="${SKIP_BACKUP:-false}"
readonly AUTO_APPROVE="${AUTO_APPROVE:-false}"

# ============================================================================
# Utility Functions
# ============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp="$(date '+%Y-%m-%d %H:%M:%S')"

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
        DEBUG)
            echo -e "${MAGENTA}[DEBUG]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        *)
            echo -e "${message}" | tee -a "${LOG_FILE}"
            ;;
    esac
}

print_banner() {
    echo -e "${BOLD}${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Fleet Management System - Production Deployment            ║
║   Capital Tech Alliance                                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

check_prerequisites() {
    log INFO "Checking prerequisites..."

    local missing_tools=()

    # Check required tools
    for tool in git node npm az docker jq curl; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log ERROR "Missing required tools: ${missing_tools[*]}"
        log ERROR "Please install missing tools and try again"
        exit 1
    fi

    # Check Azure CLI login
    if ! az account show &> /dev/null; then
        log ERROR "Not logged in to Azure CLI"
        log ERROR "Please run: az login"
        exit 1
    fi

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log ERROR "Docker daemon is not running"
        log ERROR "Please start Docker and try again"
        exit 1
    fi

    log SUCCESS "All prerequisites satisfied"
}

check_environment_variables() {
    log INFO "Validating environment variables..."

    local required_vars=(
        "AZURE_CLIENT_ID"
        "AZURE_TENANT_ID"
        "AZURE_STATIC_WEB_APP_URL"
    )

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log ERROR "Missing required environment variables: ${missing_vars[*]}"
        log ERROR "Please set missing variables in ~/.env or export them"
        exit 1
    fi

    log SUCCESS "Environment variables validated"
}

prompt_confirmation() {
    if [ "$AUTO_APPROVE" = "true" ]; then
        return 0
    fi

    echo -e "${YELLOW}${BOLD}"
    echo "═══════════════════════════════════════════════════════════════"
    echo "  DEPLOYMENT CONFIRMATION"
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Environment:        PRODUCTION"
    echo "  Target:             ${AZURE_STATIC_WEB_APP_URL}"
    echo "  Git Branch:         $(git branch --show-current)"
    echo "  Git Commit:         $(git rev-parse --short HEAD)"
    echo "  Deployment Tag:     ${DEPLOYMENT_TAG}"
    echo "  Dry Run:            ${DRY_RUN}"
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${NC}"

    read -p "Do you want to proceed with this deployment? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log WARNING "Deployment cancelled by user"
        exit 0
    fi
}

pull_latest_code() {
    log INFO "Pulling latest code from GitHub..."

    cd "$PROJECT_ROOT"

    # Store current branch
    local current_branch
    current_branch=$(git branch --show-current)

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would pull latest from origin/${current_branch}"
        return 0
    fi

    # Fetch all changes
    git fetch --all --tags

    # Pull latest changes
    git pull origin "$current_branch"

    # Merge Azure changes if remote exists
    if git remote | grep -q azure; then
        git pull azure "$current_branch" || true
    fi

    log SUCCESS "Code updated to latest version"
    log INFO "Current commit: $(git log -1 --oneline)"
}

run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log WARNING "Skipping tests (SKIP_TESTS=true)"
        return 0
    fi

    log INFO "Running test suite..."

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would run: npm run typecheck && npm run lint && npm run test:smoke"
        return 0
    fi

    # Type checking
    log INFO "Running type checks..."
    npm run typecheck || {
        log ERROR "Type checking failed"
        exit 1
    }

    # Linting
    log INFO "Running linter..."
    npm run lint || {
        log ERROR "Linting failed"
        exit 1
    }

    # Smoke tests
    log INFO "Running smoke tests..."
    npm run test:smoke || {
        log ERROR "Smoke tests failed"
        exit 1
    }

    log SUCCESS "All tests passed"
}

build_application() {
    log INFO "Building production bundle..."

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would run: npm run build"
        return 0
    fi

    # Clean previous builds
    rm -rf dist

    # Install dependencies (ensure they're up to date)
    npm ci --prefer-offline

    # Build production bundle
    NODE_ENV=production npm run build

    # Check build output
    if [ ! -d "dist" ]; then
        log ERROR "Build failed - dist directory not found"
        exit 1
    fi

    # Display bundle size
    local bundle_size
    bundle_size=$(du -sh dist | cut -f1)
    log SUCCESS "Build complete - Bundle size: ${bundle_size}"
}

build_docker_image() {
    log INFO "Building Docker image..."

    cd "$PROJECT_ROOT"

    # Get git commit SHA for tagging
    local git_sha
    git_sha=$(git rev-parse --short HEAD)

    local image_tag="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${DOCKER_IMAGE_NAME}:${git_sha}"
    local latest_tag="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${DOCKER_IMAGE_NAME}:latest"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would build: ${image_tag}"
        log INFO "[DRY RUN] Would tag: ${latest_tag}"
        return 0
    fi

    # Build multi-stage Docker image
    docker build \
        --tag "$image_tag" \
        --tag "$latest_tag" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$git_sha" \
        --build-arg VERSION="${DEPLOYMENT_TAG}" \
        .

    log SUCCESS "Docker image built: ${image_tag}"

    # Security scan with Trivy (if available)
    if command -v trivy &> /dev/null; then
        log INFO "Running security scan..."
        trivy image --severity HIGH,CRITICAL "$image_tag" || log WARNING "Security scan found issues"
    fi
}

push_docker_image() {
    log INFO "Pushing Docker image to Azure Container Registry..."

    local git_sha
    git_sha=$(git rev-parse --short HEAD)

    local image_tag="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${DOCKER_IMAGE_NAME}:${git_sha}"
    local latest_tag="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${DOCKER_IMAGE_NAME}:latest"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would push: ${image_tag}"
        log INFO "[DRY RUN] Would push: ${latest_tag}"
        return 0
    fi

    # Login to Azure Container Registry
    az acr login --name "$AZURE_CONTAINER_REGISTRY"

    # Push images
    docker push "$image_tag"
    docker push "$latest_tag"

    log SUCCESS "Docker images pushed to registry"
}

deploy_to_azure() {
    log INFO "Deploying to Azure Static Web Apps..."

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would deploy dist/ to Azure Static Web Apps"
        return 0
    fi

    # Deploy using Azure CLI
    az staticwebapp deploy \
        --name "$AZURE_STATIC_WEB_APP_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --source ./dist \
        --no-wait

    log SUCCESS "Deployment initiated"
    log INFO "Waiting for deployment to complete..."

    # Wait for deployment
    sleep 30
}

run_smoke_tests_production() {
    log INFO "Running production smoke tests..."

    local target_url="${AZURE_STATIC_WEB_APP_URL}"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would test: ${target_url}"
        return 0
    fi

    # Basic health check
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "${target_url}")

    if [ "$http_code" = "200" ]; then
        log SUCCESS "Production health check passed (HTTP ${http_code})"
    else
        log ERROR "Production health check failed (HTTP ${http_code})"
        exit 1
    fi

    # Run comprehensive health checks
    if [ -f "${SCRIPT_DIR}/health-check.sh" ]; then
        bash "${SCRIPT_DIR}/health-check.sh" || {
            log ERROR "Production health checks failed"
            exit 1
        }
    fi
}

create_deployment_tag() {
    log INFO "Creating deployment tag..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would create git tag: ${DEPLOYMENT_TAG}"
        return 0
    fi

    git tag -a "${DEPLOYMENT_TAG}" -m "Production deployment ${DEPLOYMENT_TAG}"
    git push origin "${DEPLOYMENT_TAG}"

    log SUCCESS "Created deployment tag: ${DEPLOYMENT_TAG}"
}

notify_deployment_complete() {
    log SUCCESS "═══════════════════════════════════════════════════════════════"
    log SUCCESS "  DEPLOYMENT COMPLETE"
    log SUCCESS "═══════════════════════════════════════════════════════════════"
    log SUCCESS "  Environment:        PRODUCTION"
    log SUCCESS "  URL:                ${AZURE_STATIC_WEB_APP_URL}"
    log SUCCESS "  Deployment Tag:     ${DEPLOYMENT_TAG}"
    log SUCCESS "  Git Commit:         $(git rev-parse --short HEAD)"
    log SUCCESS "  Deployed At:        $(date '+%Y-%m-%d %H:%M:%S')"
    log SUCCESS "  Log File:           ${LOG_FILE}"
    log SUCCESS "═══════════════════════════════════════════════════════════════"
}

cleanup_on_error() {
    log ERROR "Deployment failed. Rolling back..."

    # Run rollback script if available
    if [ -f "${SCRIPT_DIR}/rollback.sh" ]; then
        bash "${SCRIPT_DIR}/rollback.sh" --auto-approve
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Setup
    mkdir -p "$LOG_DIR"
    exec > >(tee -a "${LOG_FILE}")
    exec 2>&1

    # Trap errors
    trap cleanup_on_error ERR

    # Print banner
    print_banner

    # Pre-flight checks
    check_prerequisites
    check_environment_variables

    # Confirmation
    prompt_confirmation

    # Deployment steps
    log INFO "Starting deployment process..."

    pull_latest_code
    run_tests
    build_application
    build_docker_image
    push_docker_image
    deploy_to_azure
    run_smoke_tests_production
    create_deployment_tag

    # Success
    notify_deployment_complete

    exit 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Show usage
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    cat << EOF
Usage: $0 [OPTIONS]

Production deployment script for Fleet Management System.

OPTIONS:
    --dry-run           Simulate deployment without making changes
    --skip-tests        Skip running tests
    --skip-backup       Skip creating backup
    --auto-approve      Skip confirmation prompt
    -h, --help          Show this help message

ENVIRONMENT VARIABLES:
    AZURE_CLIENT_ID              Azure AD Client ID
    AZURE_TENANT_ID              Azure AD Tenant ID
    AZURE_STATIC_WEB_APP_URL     Azure Static Web App URL
    AZURE_RESOURCE_GROUP         Azure Resource Group (default: fleet-management-rg)
    AZURE_LOCATION               Azure Location (default: eastus2)
    DRY_RUN                      Set to 'true' for dry run
    SKIP_TESTS                   Set to 'true' to skip tests
    AUTO_APPROVE                 Set to 'true' to skip confirmation

EXAMPLES:
    # Standard deployment
    $0

    # Dry run
    $0 --dry-run

    # Skip tests (not recommended)
    $0 --skip-tests

    # Fully automated
    $0 --auto-approve --skip-tests

EOF
    exit 0
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --auto-approve)
            AUTO_APPROVE=true
            shift
            ;;
        *)
            log ERROR "Unknown option: $1"
            log ERROR "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main
main
