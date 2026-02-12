#!/bin/bash

# ============================================================================
# Fleet Management System - Docker Build & Push Script
# ============================================================================
# Builds production Docker images and pushes to Azure Container Registry
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
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD)
VERSION="${VERSION:-1.0.${GITHUB_RUN_NUMBER:-0}}"

# Azure Container Registry
ACR_NAME="${ACR_NAME:-ctafleetregistry}"
ACR_REGISTRY="${ACR_REGISTRY:-${ACR_NAME}.azurecr.io}"
IMAGE_NAME="${IMAGE_NAME:-fleet-management}"
IMAGE_TAG="${IMAGE_TAG:-${VERSION}}"

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

error_handler() {
    log_error "Docker build failed at line $1"
    exit 1
}

trap 'error_handler $LINENO' ERR

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           Fleet Management System                             ║
║           Docker Build & Push                                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_info "Starting Docker build process"
log_info "Project: $IMAGE_NAME"
log_info "Version: $VERSION"
log_info "Git SHA: $VCS_REF"
log_info "Build Date: $BUILD_DATE"
log_info "Registry: $ACR_REGISTRY"

cd "$PROJECT_ROOT"

# ============================================================================
# Phase 1: Pre-Build Validation
# ============================================================================
log_info "Phase 1: Pre-build validation"

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

log_success "Docker found: $(docker --version)"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    log_error "Docker daemon is not running"
    exit 1
fi

log_success "Docker daemon is running"

# Check Dockerfile exists
if [ ! -f "$PROJECT_ROOT/Dockerfile" ]; then
    log_error "Dockerfile not found at $PROJECT_ROOT/Dockerfile"
    exit 1
fi

log_success "Dockerfile found"

# ============================================================================
# Phase 2: Build Docker Image
# ============================================================================
log_info "Phase 2: Building Docker image"

FULL_IMAGE_NAME="${ACR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
LATEST_IMAGE_NAME="${ACR_REGISTRY}/${IMAGE_NAME}:latest"

log_info "Building image: $FULL_IMAGE_NAME"

docker build \
    --build-arg NODE_ENV=production \
    --build-arg BUILD_DATE="$BUILD_DATE" \
    --build-arg VCS_REF="$VCS_REF" \
    --target production \
    --tag "$FULL_IMAGE_NAME" \
    --tag "$LATEST_IMAGE_NAME" \
    --file "$PROJECT_ROOT/Dockerfile" \
    "$PROJECT_ROOT"

log_success "Docker image built successfully"

# ============================================================================
# Phase 3: Image Analysis
# ============================================================================
log_info "Phase 3: Analyzing Docker image"

# Get image size
IMAGE_SIZE=$(docker images "$FULL_IMAGE_NAME" --format "{{.Size}}")
log_info "Image size: $IMAGE_SIZE"

# Get image layers
log_info "Image layers:"
docker history "$FULL_IMAGE_NAME" --human --format "table {{.Size}}\t{{.CreatedBy}}" | head -10

# Security scan (if available)
if command -v trivy &> /dev/null; then
    log_info "Running Trivy security scan..."
    trivy image --severity HIGH,CRITICAL "$FULL_IMAGE_NAME" || log_warning "Security vulnerabilities detected"
elif command -v docker &> /dev/null && docker scan --help &> /dev/null; then
    log_info "Running Docker scan..."
    docker scan "$FULL_IMAGE_NAME" || log_warning "Security vulnerabilities detected"
else
    log_warning "No security scanner found (trivy or docker scan)"
fi

log_success "Image analysis completed"

# ============================================================================
# Phase 4: Test Docker Image
# ============================================================================
log_info "Phase 4: Testing Docker image"

log_info "Starting test container..."
CONTAINER_ID=$(docker run -d -p 8080:8080 "$FULL_IMAGE_NAME")

log_info "Container ID: $CONTAINER_ID"
log_info "Waiting for container to start..."
sleep 10

# Health check
if curl -f http://localhost:8080/health.txt &> /dev/null; then
    log_success "Container health check passed"
else
    log_error "Container health check failed"
    docker logs "$CONTAINER_ID"
    docker stop "$CONTAINER_ID" &> /dev/null || true
    docker rm "$CONTAINER_ID" &> /dev/null || true
    exit 1
fi

# Stop test container
log_info "Stopping test container..."
docker stop "$CONTAINER_ID" &> /dev/null || true
docker rm "$CONTAINER_ID" &> /dev/null || true

log_success "Container test completed"

# ============================================================================
# Phase 5: Login to Azure Container Registry
# ============================================================================
log_info "Phase 5: Azure Container Registry authentication"

if [ -n "${AZURE_CLIENT_ID:-}" ] && [ -n "${AZURE_CLIENT_SECRET:-}" ] && [ -n "${AZURE_TENANT_ID:-}" ]; then
    log_info "Logging in with service principal..."
    echo "$AZURE_CLIENT_SECRET" | docker login "$ACR_REGISTRY" \
        --username "$AZURE_CLIENT_ID" \
        --password-stdin
    log_success "Logged into ACR with service principal"
elif command -v az &> /dev/null; then
    log_info "Logging in with Azure CLI..."
    az acr login --name "$ACR_NAME"
    log_success "Logged into ACR with Azure CLI"
else
    log_warning "Azure credentials not found and Azure CLI not available"
    log_warning "Skipping push to ACR"
    log_info "To push manually later:"
    log_info "  az acr login --name $ACR_NAME"
    log_info "  docker push $FULL_IMAGE_NAME"
    log_info "  docker push $LATEST_IMAGE_NAME"
    exit 0
fi

# ============================================================================
# Phase 6: Push to Azure Container Registry
# ============================================================================
log_info "Phase 6: Pushing to Azure Container Registry"

log_info "Pushing versioned image: $FULL_IMAGE_NAME"
docker push "$FULL_IMAGE_NAME"

log_info "Pushing latest image: $LATEST_IMAGE_NAME"
docker push "$LATEST_IMAGE_NAME"

log_success "Images pushed successfully"

# ============================================================================
# Phase 7: Verify Push
# ============================================================================
log_info "Phase 7: Verifying pushed images"

if command -v az &> /dev/null; then
    log_info "Listing repository tags..."
    az acr repository show-tags \
        --name "$ACR_NAME" \
        --repository "$IMAGE_NAME" \
        --orderby time_desc \
        --output table | head -10

    log_success "Images verified in ACR"
fi

# ============================================================================
# Summary
# ============================================================================
echo -e "\n${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           🎉 DOCKER BUILD SUCCESSFUL 🎉                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

log_success "Docker build and push completed successfully"
echo ""
log_info "Build Summary:"
echo "  - Image: $FULL_IMAGE_NAME"
echo "  - Latest: $LATEST_IMAGE_NAME"
echo "  - Size: $IMAGE_SIZE"
echo "  - Version: $VERSION"
echo "  - Git SHA: $VCS_REF"
echo "  - Build Date: $BUILD_DATE"
echo ""
log_info "Images available at:"
echo "  - $ACR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
echo "  - $ACR_REGISTRY/$IMAGE_NAME:latest"
echo ""

exit 0
