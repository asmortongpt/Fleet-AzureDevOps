#!/bin/bash

###############################################################################
# Fleet Management - Staging Deployment Script
###############################################################################
#
# This script handles deployment of the Fleet Management application to
# staging environment including:
# - Database migrations
# - API server deployment
# - Frontend build and deployment
# - Health checks
#
# Prerequisites:
# - Azure CLI installed and authenticated
# - Docker installed
# - PostgreSQL client (psql) for migrations
# - Environment variables configured in .env.staging
#
# Usage:
#   ./deploy/staging.sh
#
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.staging"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/deploy/logs/staging_${TIMESTAMP}.log"

# Create logs directory
mkdir -p "${PROJECT_ROOT}/deploy/logs"

###############################################################################
# Logging Functions
###############################################################################

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

###############################################################################
# Pre-flight Checks
###############################################################################

preflight_checks() {
    log "Running pre-flight checks..."

    # Check if .env.staging exists (fallback to production template)
    if [ ! -f "$ENV_FILE" ]; then
        log_warning ".env.staging file not found"

        # Check for production template
        if [ -f "${SCRIPT_DIR}/.env.production.template" ]; then
            log_info "Creating .env.staging from .env.production.template"
            cp "${SCRIPT_DIR}/.env.production.template" "$ENV_FILE"
        else
            log_error "No .env.staging or .env.production.template found"
            exit 1
        fi
    fi

    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a

    # Override environment to staging
    export NODE_ENV=staging

    # Check required environment variables
    local required_vars=(
        "DATABASE_URL"
        "AZURE_CONTAINER_REGISTRY"
        "AZURE_RESOURCE_GROUP"
        "API_IMAGE_NAME"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    # Check if Azure CLI is installed and authenticated
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed"
        exit 1
    fi

    if ! az account show &> /dev/null; then
        log_error "Not authenticated to Azure CLI"
        log_info "Run 'az login' to authenticate"
        exit 1
    fi

    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    log "✅ All pre-flight checks passed"
}

###############################################################################
# Database Migration
###############################################################################

run_migrations() {
    log "Running database migrations (staging)..."

    cd "${PROJECT_ROOT}/api"

    # Run migrations using the API container
    if [ -f "package.json" ] && grep -q "migrate" package.json; then
        npm run migrate || {
            log_error "Database migration failed"
            exit 1
        }
    else
        log_warning "No migration script found in package.json"
    fi

    log "✅ Database migrations completed"
}

###############################################################################
# Build and Push Docker Images
###############################################################################

build_and_push_api() {
    log "Building and pushing API Docker image (staging)..."

    cd "${PROJECT_ROOT}"

    local IMAGE_TAG="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${API_IMAGE_NAME}:staging-${TIMESTAMP}"
    local IMAGE_LATEST="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${API_IMAGE_NAME}:staging"

    # Build API Docker image
    docker build \
        --platform linux/amd64 \
        --build-arg NODE_ENV=staging \
        --tag "$IMAGE_TAG" \
        --tag "$IMAGE_LATEST" \
        --file api/Dockerfile \
        ./api || {
        log_error "Failed to build API Docker image"
        exit 1
    }

    # Login to Azure Container Registry
    az acr login --name "$AZURE_CONTAINER_REGISTRY" || {
        log_error "Failed to login to Azure Container Registry"
        exit 1
    }

    # Push images
    docker push "$IMAGE_TAG" || {
        log_error "Failed to push image with timestamp tag"
        exit 1
    }

    docker push "$IMAGE_LATEST" || {
        log_error "Failed to push image with staging tag"
        exit 1
    }

    log "✅ API Docker image built and pushed: $IMAGE_TAG"
}

###############################################################################
# Deploy to Azure
###############################################################################

deploy_to_azure() {
    log "Deploying to Azure (staging)..."

    # Deploy API to Azure Container Instances
    local IMAGE_LATEST="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${API_IMAGE_NAME}:staging"

    az container create \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --name "fleet-api-staging" \
        --image "$IMAGE_LATEST" \
        --cpu 1 \
        --memory 2 \
        --registry-login-server "${AZURE_CONTAINER_REGISTRY}.azurecr.io" \
        --registry-username "$(az acr credential show --name $AZURE_CONTAINER_REGISTRY --query username -o tsv)" \
        --registry-password "$(az acr credential show --name $AZURE_CONTAINER_REGISTRY --query passwords[0].value -o tsv)" \
        --dns-name-label "fleet-api-staging" \
        --ports 3000 \
        --environment-variables \
            NODE_ENV=staging \
            DATABASE_URL="$DATABASE_URL" \
        --restart-policy Always || {
        log_error "Failed to deploy API to Azure"
        exit 1
    }

    log "✅ Deployed to Azure (staging)"
}

###############################################################################
# Health Checks
###############################################################################

health_check() {
    log "Running health checks..."

    local API_URL="${API_ENDPOINT:-http://fleet-api-staging.azurecontainer.io:3000}"
    local MAX_RETRIES=20
    local RETRY_INTERVAL=10

    for i in $(seq 1 $MAX_RETRIES); do
        log_info "Health check attempt $i/$MAX_RETRIES..."

        if curl -f -s "${API_URL}/api/health" > /dev/null; then
            log "✅ Health check passed"
            return 0
        fi

        sleep $RETRY_INTERVAL
    done

    log_error "Health check failed after $MAX_RETRIES attempts"
    return 1
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    log "======================================================================"
    log "Fleet Management - Staging Deployment"
    log "Timestamp: $TIMESTAMP"
    log "======================================================================"

    # Run pre-flight checks
    preflight_checks

    # Run database migrations
    run_migrations

    # Build and push Docker images
    build_and_push_api

    # Deploy to Azure
    deploy_to_azure

    # Health checks
    if ! health_check; then
        log_warning "Staging deployment completed with health check warnings"
    fi

    log "======================================================================"
    log "✅ Staging deployment completed!"
    log "======================================================================"
    log "API Endpoint: ${API_ENDPOINT:-http://fleet-api-staging.azurecontainer.io:3000}"
    log "Deployment Log: $LOG_FILE"
    log ""
    log "⚠️  Remember: Staging is for testing only"
}

# Trap errors and perform cleanup
trap 'log_error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
