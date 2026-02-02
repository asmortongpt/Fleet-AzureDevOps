#!/bin/bash

################################################################################
# Fleet Management System - Docker Build and Push Script
################################################################################
# Description: Build, scan, and push Docker images to Azure Container Registry
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
readonly NC='\033[0m'

# ============================================================================
# Configuration
# ============================================================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/logs/docker"
readonly LOG_FILE="${LOG_DIR}/build-$(date +%Y%m%d-%H%M%S).log"

# Docker Configuration
readonly DOCKER_IMAGE_NAME="${DOCKER_IMAGE_NAME:-fleet-management-system}"
readonly AZURE_CONTAINER_REGISTRY="${AZURE_CONTAINER_REGISTRY:-fleetmgmtacr}"
readonly DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"

# Build Settings
readonly DRY_RUN="${DRY_RUN:-false}"
readonly SKIP_SCAN="${SKIP_SCAN:-false}"
readonly SKIP_PUSH="${SKIP_PUSH:-false}"
readonly PLATFORM="${PLATFORM:-linux/amd64}"

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

check_prerequisites() {
    log INFO "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log ERROR "Docker not found. Please install Docker"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log ERROR "Docker daemon not running. Please start Docker"
        exit 1
    fi

    if ! command -v az &> /dev/null; then
        log ERROR "Azure CLI not found. Please install Azure CLI"
        exit 1
    fi

    log SUCCESS "Prerequisites satisfied"
}

get_version_tags() {
    cd "$PROJECT_ROOT"

    # Get git commit SHA
    local git_sha
    git_sha=$(git rev-parse --short HEAD)

    # Get version from package.json
    local version
    version=$(grep -o '"version": *"[^"]*"' package.json | cut -d'"' -f4)

    # Generate timestamp
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)

    # Export for use in other functions
    export GIT_SHA="$git_sha"
    export VERSION="$version"
    export TIMESTAMP="$timestamp"

    log INFO "Version: ${VERSION}"
    log INFO "Git SHA: ${GIT_SHA}"
    log INFO "Timestamp: ${TIMESTAMP}"
}

build_docker_image() {
    log INFO "Building Docker image..."

    cd "$PROJECT_ROOT"

    local registry_url="${AZURE_CONTAINER_REGISTRY}.azurecr.io"
    local image_name="${DOCKER_IMAGE_NAME}"

    # Define all tags
    local tag_commit="${registry_url}/${image_name}:${GIT_SHA}"
    local tag_version="${registry_url}/${image_name}:${VERSION}"
    local tag_latest="${registry_url}/${image_name}:latest"
    local tag_timestamp="${registry_url}/${image_name}:${TIMESTAMP}"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would build image with tags:"
        log INFO "  - ${tag_commit}"
        log INFO "  - ${tag_version}"
        log INFO "  - ${tag_latest}"
        log INFO "  - ${tag_timestamp}"
        return 0
    fi

    log INFO "Building multi-stage Docker image..."
    log INFO "Platform: ${PLATFORM}"

    # Build with Docker BuildKit
    DOCKER_BUILDKIT=1 docker build \
        --platform "${PLATFORM}" \
        --tag "$tag_commit" \
        --tag "$tag_version" \
        --tag "$tag_latest" \
        --tag "$tag_timestamp" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="${GIT_SHA}" \
        --build-arg VERSION="${VERSION}" \
        --build-arg NODE_ENV=production \
        --label "org.opencontainers.image.created=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --label "org.opencontainers.image.revision=${GIT_SHA}" \
        --label "org.opencontainers.image.version=${VERSION}" \
        --label "org.opencontainers.image.source=https://github.com/capitaltechalliance/fleet-local" \
        --label "org.opencontainers.image.title=Fleet Management System" \
        --label "org.opencontainers.image.description=Production-ready fleet management application" \
        --progress=plain \
        .

    # Check build success
    if docker images "${tag_latest}" | grep -q "${DOCKER_IMAGE_NAME}"; then
        log SUCCESS "Docker image built successfully"
    else
        log ERROR "Docker build failed"
        exit 1
    fi

    # Get image size
    local image_size
    image_size=$(docker images "${tag_latest}" --format "{{.Size}}")
    log INFO "Image size: ${image_size}"

    # Export tags for other functions
    export TAG_COMMIT="$tag_commit"
    export TAG_VERSION="$tag_version"
    export TAG_LATEST="$tag_latest"
    export TAG_TIMESTAMP="$tag_timestamp"
}

scan_image_vulnerabilities() {
    if [ "$SKIP_SCAN" = "true" ]; then
        log WARNING "Skipping vulnerability scan (SKIP_SCAN=true)"
        return 0
    fi

    log INFO "Scanning Docker image for vulnerabilities..."

    # Check if Trivy is installed
    if ! command -v trivy &> /dev/null; then
        log WARNING "Trivy not installed. Skipping security scan"
        log INFO "Install Trivy: https://aquasecurity.github.io/trivy/"
        return 0
    fi

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would scan image: ${TAG_LATEST}"
        return 0
    fi

    local scan_results="${LOG_DIR}/trivy-scan-${TIMESTAMP}.json"

    # Run Trivy scan
    log INFO "Running Trivy security scan..."

    trivy image \
        --severity HIGH,CRITICAL \
        --format json \
        --output "$scan_results" \
        "${TAG_LATEST}" || {
            log WARNING "Trivy scan completed with findings"
        }

    # Parse results
    local critical_count
    local high_count

    critical_count=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' "$scan_results" 2>/dev/null || echo "0")
    high_count=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="HIGH")] | length' "$scan_results" 2>/dev/null || echo "0")

    log INFO "Scan Results:"
    log INFO "  Critical vulnerabilities: ${critical_count}"
    log INFO "  High vulnerabilities: ${high_count}"
    log INFO "  Full report: ${scan_results}"

    # Fail if critical vulnerabilities found
    if [ "$critical_count" -gt 0 ]; then
        log ERROR "Critical vulnerabilities found! Review before deploying"
        log ERROR "Report: ${scan_results}"
        exit 1
    fi

    if [ "$high_count" -gt 0 ]; then
        log WARNING "High severity vulnerabilities found. Review recommended"
    else
        log SUCCESS "No critical or high vulnerabilities found"
    fi
}

test_docker_image() {
    log INFO "Testing Docker image..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would test image: ${TAG_LATEST}"
        return 0
    fi

    # Start container in background
    local container_id
    container_id=$(docker run -d -p 8080:80 "${TAG_LATEST}")

    log INFO "Started test container: ${container_id:0:12}"

    # Wait for container to start
    sleep 5

    # Test HTTP endpoint
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 || echo "000")

    # Stop and remove container
    docker stop "$container_id" > /dev/null
    docker rm "$container_id" > /dev/null

    if [ "$http_code" = "200" ]; then
        log SUCCESS "Container test passed (HTTP ${http_code})"
    else
        log ERROR "Container test failed (HTTP ${http_code})"
        exit 1
    fi
}

login_to_acr() {
    log INFO "Logging in to Azure Container Registry..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would login to: ${AZURE_CONTAINER_REGISTRY}"
        return 0
    fi

    # Login to ACR using Azure CLI
    az acr login --name "$AZURE_CONTAINER_REGISTRY" || {
        log ERROR "Failed to login to Azure Container Registry"
        log ERROR "Make sure you're logged in to Azure CLI: az login"
        exit 1
    }

    log SUCCESS "Logged in to ACR: ${AZURE_CONTAINER_REGISTRY}"
}

push_docker_images() {
    if [ "$SKIP_PUSH" = "true" ]; then
        log WARNING "Skipping image push (SKIP_PUSH=true)"
        return 0
    fi

    log INFO "Pushing Docker images to Azure Container Registry..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would push images:"
        log INFO "  - ${TAG_COMMIT}"
        log INFO "  - ${TAG_VERSION}"
        log INFO "  - ${TAG_LATEST}"
        log INFO "  - ${TAG_TIMESTAMP}"
        return 0
    fi

    # Login to ACR
    login_to_acr

    # Push all tags
    log INFO "Pushing tag: ${GIT_SHA}"
    docker push "${TAG_COMMIT}"

    log INFO "Pushing tag: ${VERSION}"
    docker push "${TAG_VERSION}"

    log INFO "Pushing tag: latest"
    docker push "${TAG_LATEST}"

    log INFO "Pushing tag: ${TIMESTAMP}"
    docker push "${TAG_TIMESTAMP}"

    log SUCCESS "All images pushed successfully"
}

update_deployment_manifest() {
    log INFO "Updating deployment manifest..."

    local manifest_file="${PROJECT_ROOT}/deployment/manifest.json"

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would update: ${manifest_file}"
        return 0
    fi

    # Create deployment directory if it doesn't exist
    mkdir -p "${PROJECT_ROOT}/deployment"

    # Create manifest
    cat > "$manifest_file" << EOF
{
  "version": "${VERSION}",
  "gitSha": "${GIT_SHA}",
  "timestamp": "${TIMESTAMP}",
  "buildDate": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "images": {
    "commit": "${TAG_COMMIT}",
    "version": "${TAG_VERSION}",
    "latest": "${TAG_LATEST}",
    "timestamp": "${TAG_TIMESTAMP}"
  },
  "registry": "${AZURE_CONTAINER_REGISTRY}.azurecr.io",
  "platform": "${PLATFORM}"
}
EOF

    log SUCCESS "Deployment manifest updated: ${manifest_file}"
}

cleanup_old_images() {
    log INFO "Cleaning up old Docker images..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "[DRY RUN] Would cleanup old images"
        return 0
    fi

    # Remove dangling images
    docker image prune -f || true

    log SUCCESS "Cleanup complete"
}

print_summary() {
    log SUCCESS "═══════════════════════════════════════════════════════════════"
    log SUCCESS "  DOCKER BUILD COMPLETE"
    log SUCCESS "═══════════════════════════════════════════════════════════════"
    log SUCCESS "  Version:           ${VERSION}"
    log SUCCESS "  Git SHA:           ${GIT_SHA}"
    log SUCCESS "  Registry:          ${AZURE_CONTAINER_REGISTRY}.azurecr.io"
    log SUCCESS "  Image Name:        ${DOCKER_IMAGE_NAME}"
    log SUCCESS "═══════════════════════════════════════════════════════════════"
    log SUCCESS "  Tags Created:"
    log SUCCESS "    - ${GIT_SHA}"
    log SUCCESS "    - ${VERSION}"
    log SUCCESS "    - latest"
    log SUCCESS "    - ${TIMESTAMP}"
    log SUCCESS "═══════════════════════════════════════════════════════════════"
    log SUCCESS "  Log File:          ${LOG_FILE}"
    log SUCCESS "═══════════════════════════════════════════════════════════════"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Setup
    mkdir -p "$LOG_DIR"
    exec > >(tee -a "${LOG_FILE}")
    exec 2>&1

    log INFO "Starting Docker build process..."

    # Steps
    check_prerequisites
    get_version_tags
    build_docker_image
    scan_image_vulnerabilities
    test_docker_image
    push_docker_images
    update_deployment_manifest
    cleanup_old_images

    # Summary
    print_summary

    exit 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    cat << EOF
Usage: $0 [OPTIONS]

Build and push Docker images for Fleet Management System.

OPTIONS:
    --dry-run           Simulate build without actual changes
    --skip-scan         Skip vulnerability scanning
    --skip-push         Build only, don't push to registry
    --platform PLATFORM Set target platform (default: linux/amd64)
    -h, --help          Show this help message

ENVIRONMENT VARIABLES:
    AZURE_CONTAINER_REGISTRY    Container Registry name
    DOCKER_IMAGE_NAME           Docker image name
    DRY_RUN                     Set to 'true' for dry run
    SKIP_SCAN                   Set to 'true' to skip scanning
    SKIP_PUSH                   Set to 'true' to skip push
    PLATFORM                    Target platform (default: linux/amd64)

EXAMPLES:
    # Standard build and push
    $0

    # Build only (no push)
    $0 --skip-push

    # Build without scanning
    $0 --skip-scan

    # Dry run
    $0 --dry-run

    # Multi-platform build
    $0 --platform linux/amd64,linux/arm64

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
        --skip-scan)
            SKIP_SCAN=true
            shift
            ;;
        --skip-push)
            SKIP_PUSH=true
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        *)
            log ERROR "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main
main
