#!/bin/bash

###############################################################################
# Fleet Management - Production Deployment Script
###############################################################################
#
# This script handles deployment of the Fleet Management application to
# production environment including:
# - Database migrations
# - API server deployment
# - Frontend build and deployment
# - Health checks and rollback
#
# Prerequisites:
# - Azure CLI installed and authenticated
# - Docker installed
# - PostgreSQL client (psql) for migrations
# - Environment variables configured in .env.production
#
# Usage:
#   ./deploy/production.sh
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
ENV_FILE="${SCRIPT_DIR}/.env.production"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/deploy/logs/production_${TIMESTAMP}.log"

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

    # Check if .env.production exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env.production file not found at ${ENV_FILE}"
        log_info "Please create .env.production from .env.production.template"
        exit 1
    fi

    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a

    # Check required environment variables
    local required_vars=(
        "DATABASE_URL"
        "AZURE_STATIC_WEB_APP_URL"
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
    log "Running database migrations..."

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
    log "Building and pushing API Docker image..."

    cd "${PROJECT_ROOT}"

    local IMAGE_TAG="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${API_IMAGE_NAME}:${TIMESTAMP}"
    local IMAGE_LATEST="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${API_IMAGE_NAME}:latest"

    # Build API Docker image
    docker build \
        --platform linux/amd64 \
        --build-arg NODE_ENV=production \
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
        log_error "Failed to push image with latest tag"
        exit 1
    }

    log "✅ API Docker image built and pushed: $IMAGE_TAG"
}

###############################################################################
# Deploy to Azure
###############################################################################

deploy_to_azure() {
    log "Deploying to Azure..."

    # Deploy API to Azure Container Instances or App Service
    local IMAGE_LATEST="${AZURE_CONTAINER_REGISTRY}.azurecr.io/${API_IMAGE_NAME}:latest"

    az container create \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --name "fleet-api-production" \
        --image "$IMAGE_LATEST" \
        --cpu 2 \
        --memory 4 \
        --registry-login-server "${AZURE_CONTAINER_REGISTRY}.azurecr.io" \
        --registry-username "$(az acr credential show --name $AZURE_CONTAINER_REGISTRY --query username -o tsv)" \
        --registry-password "$(az acr credential show --name $AZURE_CONTAINER_REGISTRY --query passwords[0].value -o tsv)" \
        --dns-name-label "fleet-api-prod" \
        --ports 3000 \
        --environment-variables \
            NODE_ENV=production \
            DATABASE_URL="$DATABASE_URL" \
        --restart-policy Always || {
        log_error "Failed to deploy API to Azure"
        exit 1
    }

    log "✅ Deployed to Azure"
}

###############################################################################
# Health Checks
###############################################################################

health_check() {
    log "Running health checks..."

    local API_URL="${API_ENDPOINT:-http://fleet-api-prod.azurecontainer.io:3000}"
    local MAX_RETRIES=30
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
# Rollback
###############################################################################

rollback() {
    log_error "Deployment failed, initiating rollback..."

    # TODO: Implement rollback logic
    # - Restore previous container version
    # - Restore database backup if needed

    log_warning "Rollback not yet implemented"
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    log "======================================================================"
    log "Fleet Management - Production Deployment"
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
        rollback
        exit 1
    fi

    log "======================================================================"
    log "✅ Production deployment completed successfully!"
    log "======================================================================"
    log "API Endpoint: ${API_ENDPOINT:-http://fleet-api-prod.azurecontainer.io:3000}"
    log "Frontend URL: ${AZURE_STATIC_WEB_APP_URL}"
    log "Deployment Log: $LOG_FILE"
}

# Trap errors and perform cleanup
trap 'log_error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
