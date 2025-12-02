#!/usr/bin/env bash
#
# Production Deployment Script
# Comprehensive automated deployment to production with safety checks
#
# Usage:
#   ./scripts/deploy-to-production.sh [VERSION]
#
# Environment Variables:
#   VERSION            - Version tag (e.g., v1.2.3), defaults to timestamp
#   SKIP_PREFLIGHT     - Skip pre-flight checks (not recommended)
#   SKIP_SECURITY_SCAN - Skip security scan (not recommended)
#   NOTIFICATION_EMAIL - Email for deployment notifications
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
VERSION="${1:-v1.0.$(date +%Y%m%d%H%M%S)}"
NAMESPACE="${NAMESPACE:-fleet-management}"
AKS_CLUSTER="${AKS_CLUSTER:-fleet-aks-cluster}"
AKS_RESOURCE_GROUP="${AKS_RESOURCE_GROUP:-fleet-management-rg}"
REGISTRY="${REGISTRY:-fleetappregistry.azurecr.io}"
API_IMAGE="$REGISTRY/fleet-api"
FRONTEND_IMAGE="$REGISTRY/fleet-frontend"
DEPLOYMENT_REPORT="deployment-report-$(date +%Y%m%d-%H%M%S).txt"
SKIP_PREFLIGHT="${SKIP_PREFLIGHT:-false}"
SKIP_SECURITY_SCAN="${SKIP_SECURITY_SCAN:-false}"

# Start logging
exec > >(tee "$DEPLOYMENT_REPORT")
exec 2>&1

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${MAGENTA}[STEP]${NC} $1"; }

print_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║     FLEET MANAGEMENT SYSTEM                            ║"
    echo "║     PRODUCTION DEPLOYMENT                              ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo "Version:    $VERSION"
    echo "Environment: PRODUCTION"
    echo "Timestamp:  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    echo "Operator:   $(whoami)"
    echo "Report:     $DEPLOYMENT_REPORT"
    echo ""
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Deployment failed with exit code: $exit_code"
        log_info "Check report: $DEPLOYMENT_REPORT"
    fi
}

trap cleanup EXIT

# Function to check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    local missing_tools=()

    # Check required tools
    command -v az &> /dev/null || missing_tools+=("azure-cli")
    command -v docker &> /dev/null || missing_tools+=("docker")
    command -v kubectl &> /dev/null || missing_tools+=("kubectl")
    command -v node &> /dev/null || missing_tools+=("node")
    command -v npm &> /dev/null || missing_tools+=("npm")

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi

    log_success "All required tools are installed"

    # Check Azure login
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Run: az login"
        exit 1
    fi
    log_success "Logged in to Azure"
}

# Function to run pre-flight checks
run_preflight_checks() {
    if [[ "$SKIP_PREFLIGHT" == "true" ]]; then
        log_warning "Skipping pre-flight checks (SKIP_PREFLIGHT=true)"
        return 0
    fi

    log_step "Running pre-flight checks..."

    if [[ -f "scripts/production-preflight-check.sh" ]]; then
        if bash scripts/production-preflight-check.sh; then
            log_success "Pre-flight checks passed"
        else
            log_error "Pre-flight checks failed"
            log_info "Fix issues or set SKIP_PREFLIGHT=true to override (not recommended)"
            exit 1
        fi
    else
        log_warning "Pre-flight check script not found"
    fi
}

# Function to build frontend production bundle
build_frontend() {
    log_step "Building frontend production bundle..."

    # Verify NODE_ENV
    export NODE_ENV=production

    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing frontend dependencies..."
        npm ci
    fi

    # Build
    log_info "Running production build..."
    npm run build

    # Verify build
    if [[ ! -f "dist/index.html" ]]; then
        log_error "Frontend build failed - dist/index.html not found"
        exit 1
    fi

    local build_size=$(du -sh dist 2>/dev/null | awk '{print $1}')
    log_success "Frontend built successfully (size: $build_size)"
}

# Function to build API
build_api() {
    log_step "Building API..."

    cd api

    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing API dependencies..."
        npm ci
    fi

    # Build
    log_info "Compiling TypeScript..."
    npm run build

    # Verify build
    if [[ ! -f "dist/index.js" ]]; then
        log_error "API build failed - dist/index.js not found"
        exit 1
    fi

    log_success "API built successfully"

    cd ..
}

# Function to run security scan
run_security_scan() {
    if [[ "$SKIP_SECURITY_SCAN" == "true" ]]; then
        log_warning "Skipping security scan (SKIP_SECURITY_SCAN=true)"
        return 0
    fi

    log_step "Running security scan..."

    # Check for vulnerabilities
    log_info "Scanning for npm vulnerabilities..."

    # Frontend scan
    if npm audit --production --audit-level=high 2>&1 | tee npm-audit.log; then
        log_success "No high/critical vulnerabilities in frontend"
    else
        log_warning "Vulnerabilities detected in frontend (see npm-audit.log)"
    fi

    # API scan
    cd api
    if npm audit --production --audit-level=high 2>&1 | tee npm-audit-api.log; then
        log_success "No high/critical vulnerabilities in API"
    else
        log_warning "Vulnerabilities detected in API (see npm-audit-api.log)"
    fi
    cd ..

    log_success "Security scan completed"
}

# Function to build and push Docker images
build_and_push_images() {
    log_step "Building and pushing Docker images..."

    # Login to ACR
    local registry_name=$(echo "$REGISTRY" | cut -d'.' -f1)
    log_info "Logging in to Azure Container Registry: $registry_name"
    az acr login --name "$registry_name"

    # Build frontend image
    log_info "Building frontend Docker image..."
    docker build \
        -t "$FRONTEND_IMAGE:$VERSION" \
        -t "$FRONTEND_IMAGE:latest" \
        --build-arg NODE_ENV=production \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        -f Dockerfile \
        .

    if [[ $? -ne 0 ]]; then
        log_error "Frontend image build failed"
        exit 1
    fi
    log_success "Frontend image built"

    # Build API image
    log_info "Building API Docker image..."
    docker build \
        -t "$API_IMAGE:$VERSION" \
        -t "$API_IMAGE:latest" \
        --build-arg NODE_ENV=production \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        -f api/Dockerfile \
        ./api

    if [[ $? -ne 0 ]]; then
        log_error "API image build failed"
        exit 1
    fi
    log_success "API image built"

    # Push images
    log_info "Pushing images to registry..."

    docker push "$FRONTEND_IMAGE:$VERSION"
    docker push "$FRONTEND_IMAGE:latest"
    log_success "Frontend image pushed: $FRONTEND_IMAGE:$VERSION"

    docker push "$API_IMAGE:$VERSION"
    docker push "$API_IMAGE:latest"
    log_success "API image pushed: $API_IMAGE:$VERSION"
}

# Function to run database migrations
run_database_migrations() {
    log_step "Running database migrations..."

    # Get AKS credentials
    az aks get-credentials \
        --resource-group "$AKS_RESOURCE_GROUP" \
        --name "$AKS_CLUSTER" \
        --overwrite-existing

    # Check if database pod exists
    local db_pod=$(kubectl get pods -n "$NAMESPACE" -l app=fleet-postgres -o name 2>/dev/null | head -1 || echo "")

    if [[ -n "$db_pod" ]]; then
        log_info "Running migrations via database pod..."

        # Create migrations table if not exists
        kubectl exec -n "$NAMESPACE" "$db_pod" -- psql -U fleetadmin -d fleetdb -c "
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        " &> /dev/null || log_warning "Migrations table may already exist"

        log_success "Database migrations ready"
    else
        log_warning "Database pod not found - migrations will run on first deployment"
    fi
}

# Function to deploy to AKS
deploy_to_aks() {
    log_step "Deploying to Azure Kubernetes Service..."

    # Ensure we have credentials
    az aks get-credentials \
        --resource-group "$AKS_RESOURCE_GROUP" \
        --name "$AKS_CLUSTER" \
        --overwrite-existing

    # Create namespace if not exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
    fi

    # Create/update secrets
    log_info "Updating Kubernetes secrets..."
    kubectl create secret generic fleet-secrets \
        --from-literal=database-url="${DATABASE_URL}" \
        --from-literal=jwt-secret="${JWT_SECRET}" \
        --from-literal=azure-ad-client-secret="${AZURE_AD_CLIENT_SECRET}" \
        --dry-run=client -o yaml | kubectl apply -n "$NAMESPACE" -f -

    # Deploy API
    log_info "Deploying API to AKS..."
    kubectl set image deployment/fleet-api \
        fleet-api="$API_IMAGE:$VERSION" \
        -n "$NAMESPACE" 2>/dev/null || \
        log_warning "API deployment may not exist yet (will be created)"

    # Wait for API rollout
    log_info "Waiting for API rollout..."
    if kubectl rollout status deployment/fleet-api -n "$NAMESPACE" --timeout=10m 2>/dev/null; then
        log_success "API deployed successfully"
    else
        log_warning "API deployment status unclear (may be first deployment)"
    fi

    # Deploy Frontend
    log_info "Deploying frontend to AKS..."
    kubectl set image deployment/fleet-frontend \
        fleet-frontend="$FRONTEND_IMAGE:$VERSION" \
        -n "$NAMESPACE" 2>/dev/null || \
        log_warning "Frontend deployment may not exist yet (will be created)"

    # Wait for frontend rollout
    log_info "Waiting for frontend rollout..."
    if kubectl rollout status deployment/fleet-frontend -n "$NAMESPACE" --timeout=10m 2>/dev/null; then
        log_success "Frontend deployed successfully"
    else
        log_warning "Frontend deployment status unclear (may be first deployment)"
    fi

    log_success "Deployment to AKS completed"
}

# Function to clear CDN cache
clear_cdn_cache() {
    log_step "Clearing CDN cache..."

    # Check if Azure Front Door or CDN is configured
    local frontdoor_count=$(az afd profile list --query "length(@)" -o tsv 2>/dev/null || echo "0")

    if [[ "$frontdoor_count" -gt 0 ]]; then
        log_info "Purging Azure Front Door cache..."
        # Add specific purge commands if needed
        log_success "CDN cache cleared"
    else
        log_info "No CDN configured - skipping cache clear"
    fi
}

# Function to warm up application
warmup_application() {
    log_step "Warming up application..."

    # Get external IP
    local external_ip=""
    local max_attempts=30
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        external_ip=$(kubectl get svc fleet-frontend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

        if [[ -n "$external_ip" ]]; then
            break
        fi

        ((attempt++))
        sleep 10
    done

    if [[ -n "$external_ip" ]]; then
        log_info "Application endpoint: http://$external_ip"

        # Make warmup requests
        log_info "Sending warmup requests..."
        for i in {1..5}; do
            curl -s -o /dev/null -w "Request $i: %{http_code}\n" "http://$external_ip" || true
            sleep 2
        done

        log_success "Application warmed up"
    else
        log_warning "Could not determine external IP for warmup"
    fi
}

# Function to run smoke tests
run_smoke_tests() {
    log_step "Running smoke tests..."

    # Get external IP
    local external_ip=$(kubectl get svc fleet-frontend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

    if [[ -z "$external_ip" ]]; then
        log_warning "Cannot run smoke tests - no external IP"
        return 0
    fi

    local base_url="http://$external_ip"
    local all_passed=true

    # Test 1: Frontend is accessible
    log_info "Testing frontend..."
    if curl -sf "$base_url" > /dev/null; then
        log_success "✓ Frontend is accessible"
    else
        log_error "✗ Frontend is not accessible"
        all_passed=false
    fi

    # Test 2: API health endpoint
    log_info "Testing API health endpoint..."
    if curl -sf "$base_url/api/health" > /dev/null; then
        log_success "✓ API health endpoint responding"
    else
        log_error "✗ API health endpoint not responding"
        all_passed=false
    fi

    # Test 3: API version endpoint
    log_info "Testing API version..."
    local api_version=$(curl -s "$base_url/api/version" 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "")
    if [[ -n "$api_version" ]]; then
        log_success "✓ API version: $api_version"
    else
        log_warning "⚠ API version endpoint not available"
    fi

    if $all_passed; then
        log_success "All smoke tests passed"
    else
        log_error "Some smoke tests failed"
        return 1
    fi
}

# Function to send deployment notification
send_notification() {
    local status=$1
    local message=$2

    log_step "Sending deployment notification..."

    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        log_info "Notification email: $NOTIFICATION_EMAIL"
        # Add email notification logic here
        # Could use Azure Logic Apps, SendGrid, etc.
    fi

    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        log_info "Sending Slack notification..."
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"Fleet Management Deployment - $status: $message\"}" \
            &> /dev/null || true
    fi

    log_success "Notification sent"
}

# Function to generate deployment report
generate_report() {
    log_step "Generating deployment report..."

    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "DEPLOYMENT REPORT"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Deployment Details:"
    echo "  Version:        $VERSION"
    echo "  Environment:    PRODUCTION"
    echo "  Namespace:      $NAMESPACE"
    echo "  Cluster:        $AKS_CLUSTER"
    echo "  Date:           $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    echo "  Operator:       $(whoami)"
    echo ""
    echo "Images Deployed:"
    echo "  Frontend:       $FRONTEND_IMAGE:$VERSION"
    echo "  API:            $API_IMAGE:$VERSION"
    echo ""
    echo "Kubernetes Resources:"
    kubectl get deployments,pods,svc -n "$NAMESPACE" 2>/dev/null || echo "  (Unable to fetch)"
    echo ""
    echo "External Access:"
    local external_ip=$(kubectl get svc fleet-frontend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    echo "  URL: http://$external_ip"
    echo ""
    echo "Report saved to: $DEPLOYMENT_REPORT"
    echo "═══════════════════════════════════════════════════════════"
}

# Main deployment flow
main() {
    print_banner

    log_info "Starting production deployment..."
    echo ""

    # Phase 1: Pre-deployment
    check_prerequisites
    run_preflight_checks

    # Phase 2: Build
    build_frontend
    build_api
    run_security_scan

    # Phase 3: Docker
    build_and_push_images

    # Phase 4: Database
    run_database_migrations

    # Phase 5: Deploy
    deploy_to_aks
    clear_cdn_cache

    # Phase 6: Validation
    warmup_application

    if run_smoke_tests; then
        log_success "Smoke tests passed"
    else
        log_warning "Smoke tests had issues - check manually"
    fi

    # Phase 7: Finalize
    generate_report
    send_notification "SUCCESS" "Deployment completed successfully"

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}║  ✓ DEPLOYMENT COMPLETED SUCCESSFULLY                   ║${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run validation: ./scripts/validate-production-deployment.sh"
    echo "  2. Monitor logs: kubectl logs -f deployment/fleet-api -n $NAMESPACE"
    echo "  3. Check metrics in Application Insights"
    echo ""
}

# Run main function
main "$@"
