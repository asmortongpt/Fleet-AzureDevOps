#!/usr/bin/env bash
#
# Production Pre-Flight Check Script
# Validates all Azure resources and configurations before production deployment
#
# Exit codes:
#   0 - All checks passed, ready for production
#   1 - One or more critical checks failed
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
REPORT_FILE="${REPORT_FILE:-preflight-report.txt}"
NAMESPACE="${NAMESPACE:-fleet-management}"
AKS_CLUSTER="${AKS_CLUSTER:-fleet-aks-cluster}"
AKS_RESOURCE_GROUP="${AKS_RESOURCE_GROUP:-fleet-management-rg}"
REGISTRY="${REGISTRY:-fleetappregistry.azurecr.io}"

# Counters
PASSED=0
FAILED=0
WARNINGS=0
CRITICAL_FAILED=0

# Start report
exec > >(tee "$REPORT_FILE")
exec 2>&1

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

log_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
    ((CRITICAL_FAILED++))
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

log_section() {
    echo ""
    echo -e "${MAGENTA}========================================${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}========================================${NC}"
}

# Function to check Azure CLI is installed and logged in
check_azure_cli() {
    log_section "1. Azure CLI Verification"

    if ! command -v az &> /dev/null; then
        log_critical "Azure CLI is not installed"
        log_info "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
        return 1
    fi
    log_success "Azure CLI is installed"

    # Check if logged in
    if ! az account show &> /dev/null; then
        log_critical "Not logged in to Azure CLI"
        log_info "Run: az login"
        return 1
    fi
    log_success "Logged in to Azure CLI"

    # Display current subscription
    local sub_name=$(az account show --query name -o tsv 2>/dev/null)
    local sub_id=$(az account show --query id -o tsv 2>/dev/null)
    log_info "Active subscription: $sub_name ($sub_id)"

    return 0
}

# Function to verify Azure resources exist
check_azure_resources() {
    log_section "2. Azure Resources Verification"

    local all_exist=true

    # Check resource group
    log_info "Checking resource group: $AKS_RESOURCE_GROUP"
    if az group show --name "$AKS_RESOURCE_GROUP" &> /dev/null; then
        log_success "Resource group exists: $AKS_RESOURCE_GROUP"
    else
        log_critical "Resource group not found: $AKS_RESOURCE_GROUP"
        all_exist=false
    fi

    # Check AKS cluster
    log_info "Checking AKS cluster: $AKS_CLUSTER"
    if az aks show --resource-group "$AKS_RESOURCE_GROUP" --name "$AKS_CLUSTER" &> /dev/null; then
        log_success "AKS cluster exists: $AKS_CLUSTER"

        # Check cluster status
        local provisioning_state=$(az aks show --resource-group "$AKS_RESOURCE_GROUP" --name "$AKS_CLUSTER" --query provisioningState -o tsv 2>/dev/null)
        if [[ "$provisioning_state" == "Succeeded" ]]; then
            log_success "AKS cluster is in Succeeded state"
        else
            log_warning "AKS cluster state: $provisioning_state"
        fi

        # Check node count
        local node_count=$(az aks show --resource-group "$AKS_RESOURCE_GROUP" --name "$AKS_CLUSTER" --query agentPoolProfiles[0].count -o tsv 2>/dev/null)
        log_info "AKS node count: $node_count"
        if [[ "$node_count" -ge 2 ]]; then
            log_success "Sufficient nodes for production (>= 2)"
        else
            log_warning "Low node count: $node_count (recommended: >= 2)"
        fi
    else
        log_critical "AKS cluster not found: $AKS_CLUSTER"
        all_exist=false
    fi

    # Check container registry
    local registry_name=$(echo "$REGISTRY" | cut -d'.' -f1)
    log_info "Checking container registry: $registry_name"
    if az acr show --name "$registry_name" &> /dev/null; then
        log_success "Container registry exists: $registry_name"

        # Check if we can access it
        if az acr login --name "$registry_name" &> /dev/null; then
            log_success "Can authenticate to container registry"
        else
            log_failure "Cannot authenticate to container registry"
            all_exist=false
        fi
    else
        log_critical "Container registry not found: $registry_name"
        all_exist=false
    fi

    # Check Application Insights (optional but recommended)
    log_info "Checking Application Insights..."
    local app_insights_count=$(az monitor app-insights component list --resource-group "$AKS_RESOURCE_GROUP" --query "length(@)" -o tsv 2>/dev/null || echo "0")
    if [[ "$app_insights_count" -gt 0 ]]; then
        log_success "Application Insights configured"
    else
        log_warning "No Application Insights found (recommended for production)"
    fi

    $all_exist && return 0 || return 1
}

# Function to check database connectivity
check_database() {
    log_section "3. Database Connectivity"

    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_failure "DATABASE_URL environment variable not set"
        return 1
    fi
    log_success "DATABASE_URL is set"

    # Check kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl not found - skipping pod-based database check"
        return 0
    fi

    # Get AKS credentials
    log_info "Getting AKS credentials..."
    if az aks get-credentials --resource-group "$AKS_RESOURCE_GROUP" --name "$AKS_CLUSTER" --overwrite-existing &> /dev/null; then
        log_success "Got AKS credentials"

        # Check if database pod exists
        local db_pod=$(kubectl get pods -n "$NAMESPACE" -l app=fleet-postgres -o name 2>/dev/null | head -1 || echo "")
        if [[ -n "$db_pod" ]]; then
            log_info "Testing database connection via pod..."
            if kubectl exec -n "$NAMESPACE" "$db_pod" -- psql -U fleetadmin -d fleetdb -c "SELECT 1" &> /dev/null; then
                log_success "Database connection successful"

                # Check database size
                local db_size=$(kubectl exec -n "$NAMESPACE" "$db_pod" -- psql -U fleetadmin -d fleetdb -t -c "SELECT pg_size_pretty(pg_database_size('fleetdb'));" 2>/dev/null | xargs || echo "unknown")
                log_info "Database size: $db_size"

                return 0
            else
                log_failure "Cannot connect to database"
                return 1
            fi
        else
            log_warning "Database pod not found (may not be deployed yet)"
        fi
    else
        log_warning "Could not get AKS credentials"
    fi

    return 0
}

# Function to validate Azure AD configuration
check_azure_ad() {
    log_section "4. Azure AD Configuration"

    local all_set=true

    # Check required environment variables
    local required_vars=(
        "AZURE_AD_CLIENT_ID"
        "AZURE_AD_CLIENT_SECRET"
        "AZURE_AD_TENANT_ID"
        "VITE_AZURE_AD_CLIENT_ID"
        "VITE_AZURE_AD_TENANT_ID"
    )

    for var in "${required_vars[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            log_success "$var is set"
        else
            log_failure "$var is not set"
            all_set=false
        fi
    done

    # Validate redirect URIs are production URLs
    if [[ -n "${AZURE_AD_REDIRECT_URI:-}" ]]; then
        if [[ "$AZURE_AD_REDIRECT_URI" =~ ^https:// ]]; then
            log_success "AZURE_AD_REDIRECT_URI uses HTTPS"
        else
            log_warning "AZURE_AD_REDIRECT_URI should use HTTPS in production"
        fi
    fi

    $all_set && return 0 || return 1
}

# Function to check environment variables
check_environment_variables() {
    log_section "5. Environment Variables"

    local all_set=true

    # Check NODE_ENV
    if [[ "${NODE_ENV:-}" == "production" ]]; then
        log_success "NODE_ENV is set to 'production'"
    else
        log_failure "NODE_ENV must be 'production' (current: ${NODE_ENV:-not set})"
        all_set=false
    fi

    # Check JWT_SECRET
    if [[ -n "${JWT_SECRET:-}" ]]; then
        local jwt_length=${#JWT_SECRET}
        if [[ $jwt_length -ge 32 ]]; then
            log_success "JWT_SECRET is set (length: $jwt_length chars)"
        else
            log_warning "JWT_SECRET should be at least 32 characters (current: $jwt_length)"
        fi
    else
        log_failure "JWT_SECRET is not set"
        all_set=false
    fi

    # Check VITE_API_URL
    if [[ -n "${VITE_API_URL:-}" ]]; then
        if [[ "$VITE_API_URL" =~ ^https:// ]]; then
            log_success "VITE_API_URL is set and uses HTTPS"
        else
            log_warning "VITE_API_URL should use HTTPS in production: $VITE_API_URL"
        fi
    else
        log_warning "VITE_API_URL is not set"
    fi

    $all_set && return 0 || return 1
}

# Function to check SSL certificates
check_ssl_certificates() {
    log_section "6. SSL Certificates"

    # Check if ingress is configured with TLS
    if command -v kubectl &> /dev/null && az aks get-credentials --resource-group "$AKS_RESOURCE_GROUP" --name "$AKS_CLUSTER" --overwrite-existing &> /dev/null; then
        local ingress_tls=$(kubectl get ingress -n "$NAMESPACE" -o json 2>/dev/null | grep -o '"tls"' | wc -l || echo "0")
        if [[ "$ingress_tls" -gt 0 ]]; then
            log_success "Ingress has TLS configuration"
        else
            log_warning "No TLS configuration found in ingress (check manual setup)"
        fi

        # Check cert-manager if installed
        if kubectl get namespace cert-manager &> /dev/null; then
            log_success "cert-manager is installed"

            # Check for ClusterIssuers
            local issuers=$(kubectl get clusterissuers 2>/dev/null | wc -l || echo "0")
            if [[ "$issuers" -gt 1 ]]; then
                log_success "Certificate issuers configured"
            else
                log_warning "No certificate issuers found"
            fi
        else
            log_warning "cert-manager not found (manual SSL setup may be required)"
        fi
    else
        log_warning "Cannot check SSL configuration (kubectl or AKS access issue)"
    fi

    return 0
}

# Function to check DNS configuration
check_dns_configuration() {
    log_section "7. DNS Configuration"

    # Check if production domain is set
    if [[ -n "${PRODUCTION_DOMAIN:-}" ]]; then
        log_info "Checking DNS for: $PRODUCTION_DOMAIN"

        # Try to resolve DNS
        if host "$PRODUCTION_DOMAIN" &> /dev/null; then
            local resolved_ip=$(host "$PRODUCTION_DOMAIN" | grep "has address" | awk '{print $4}' | head -1)
            log_success "DNS resolves: $PRODUCTION_DOMAIN -> $resolved_ip"

            # Check if it's an Azure IP (optional)
            if [[ -n "$resolved_ip" ]] && [[ "$resolved_ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                log_info "Resolved IP: $resolved_ip"
            fi
        else
            log_warning "Cannot resolve DNS for: $PRODUCTION_DOMAIN"
        fi
    else
        log_warning "PRODUCTION_DOMAIN not set (skipping DNS check)"
    fi

    return 0
}

# Function to test API health endpoints
check_api_health_endpoints() {
    log_section "8. API Health Endpoints"

    # Build and check for health routes
    if [[ -f "api/src/routes/health.routes.ts" ]]; then
        log_success "Health routes file exists"
    else
        log_warning "Health routes file not found"
    fi

    # Check if API is built
    if [[ -f "api/dist/index.js" ]]; then
        log_success "API is built (dist/index.js exists)"
    else
        log_warning "API not built (run: cd api && npm run build)"
    fi

    return 0
}

# Function to check Application Insights
check_application_insights() {
    log_section "9. Application Insights"

    if [[ -n "${APPLICATION_INSIGHTS_CONNECTION_STRING:-}" ]]; then
        log_success "APPLICATION_INSIGHTS_CONNECTION_STRING is set"

        # Validate format (should start with InstrumentationKey=)
        if [[ "$APPLICATION_INSIGHTS_CONNECTION_STRING" =~ ^InstrumentationKey= ]]; then
            log_success "Connection string format is valid"
        else
            log_warning "Connection string format may be invalid"
        fi
    else
        log_warning "APPLICATION_INSIGHTS_CONNECTION_STRING not set"
        log_info "Application Insights provides critical monitoring for production"
    fi

    return 0
}

# Function to check Docker images exist
check_docker_images() {
    log_section "10. Docker Images"

    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found - skipping image checks"
        return 0
    fi

    # Check if images are built locally (optional)
    log_info "Checking for local Docker images..."

    if docker images | grep -q "fleet-api"; then
        log_success "fleet-api image found locally"
    else
        log_info "fleet-api image not found locally (will be built during deployment)"
    fi

    if docker images | grep -q "fleet-frontend"; then
        log_success "fleet-frontend image found locally"
    else
        log_info "fleet-frontend image not found locally (will be built during deployment)"
    fi

    return 0
}

# Function to verify Kubernetes namespace
check_kubernetes_namespace() {
    log_section "11. Kubernetes Namespace"

    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl not found - skipping namespace check"
        return 0
    fi

    if az aks get-credentials --resource-group "$AKS_RESOURCE_GROUP" --name "$AKS_CLUSTER" --overwrite-existing &> /dev/null; then
        if kubectl get namespace "$NAMESPACE" &> /dev/null; then
            log_success "Namespace exists: $NAMESPACE"

            # Check resource quotas
            local quota_count=$(kubectl get resourcequota -n "$NAMESPACE" 2>/dev/null | wc -l || echo "0")
            if [[ "$quota_count" -gt 1 ]]; then
                log_info "Resource quotas configured: $((quota_count - 1))"
            else
                log_info "No resource quotas configured"
            fi

            # Check network policies
            local netpol_count=$(kubectl get networkpolicies -n "$NAMESPACE" 2>/dev/null | wc -l || echo "0")
            if [[ "$netpol_count" -gt 1 ]]; then
                log_info "Network policies configured: $((netpol_count - 1))"
            else
                log_info "No network policies configured"
            fi
        else
            log_warning "Namespace does not exist: $NAMESPACE (will be created during deployment)"
        fi
    else
        log_warning "Cannot access AKS cluster"
    fi

    return 0
}

# Function to check secrets are not in code
check_no_hardcoded_secrets() {
    log_section "12. Security - Hardcoded Secrets Check"

    log_info "Scanning for potential hardcoded secrets..."

    local secret_patterns=(
        "password.*=.*['\"][^'\"]{8,}"
        "secret.*=.*['\"][^'\"]{8,}"
        "api[_-]?key.*=.*['\"][^'\"]{8,}"
        "token.*=.*['\"][^'\"]{8,}"
    )

    local found_secrets=0
    local files_to_scan="api/src api/dist"

    for pattern in "${secret_patterns[@]}"; do
        if grep -rE "$pattern" $files_to_scan 2>/dev/null | grep -v "node_modules" | grep -v ".test." | head -3; then
            ((found_secrets++))
        fi
    done

    if [[ $found_secrets -eq 0 ]]; then
        log_success "No obvious hardcoded secrets found"
    else
        log_warning "Potential hardcoded secrets detected (review output above)"
    fi

    return 0
}

# Function to verify build is production-ready
check_production_build() {
    log_section "13. Production Build Verification"

    # Check if frontend is built
    if [[ -d "dist" ]]; then
        log_success "Frontend build directory exists"

        # Check for index.html
        if [[ -f "dist/index.html" ]]; then
            log_success "dist/index.html exists"
        else
            log_failure "dist/index.html not found"
        fi

        # Check bundle size
        if [[ -d "dist/assets/js" ]]; then
            local total_size=$(du -sh dist/assets/js 2>/dev/null | awk '{print $1}')
            log_info "JavaScript bundle size: $total_size"

            # Count chunks (should have multiple for code splitting)
            local chunk_count=$(ls dist/assets/js/*.js 2>/dev/null | wc -l)
            if [[ $chunk_count -gt 5 ]]; then
                log_success "Code splitting active ($chunk_count chunks)"
            else
                log_warning "Few chunks detected ($chunk_count) - verify code splitting"
            fi
        fi
    else
        log_failure "Frontend not built (run: npm run build)"
        return 1
    fi

    return 0
}

# Function to check git status
check_git_status() {
    log_section "14. Git Status"

    if ! command -v git &> /dev/null || [[ ! -d ".git" ]]; then
        log_warning "Not a git repository - skipping"
        return 0
    fi

    local branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    log_info "Current branch: $branch"

    # Check for uncommitted changes
    if git diff --quiet && git diff --cached --quiet; then
        log_success "No uncommitted changes"
    else
        log_warning "Uncommitted changes detected"
        git status --short | head -10
    fi

    # Check if latest commit is tagged
    local latest_tag=$(git describe --tags --exact-match 2>/dev/null || echo "")
    if [[ -n "$latest_tag" ]]; then
        log_info "Current commit is tagged: $latest_tag"
    else
        log_info "No tag on current commit"
    fi

    return 0
}

# Main check flow
main() {
    log_section "FLEET MANAGEMENT - PRODUCTION PRE-FLIGHT CHECK"
    echo "Starting comprehensive pre-deployment validation..."
    echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    echo "Report: $REPORT_FILE"
    echo ""

    # Run all checks (don't exit on failure, collect all results)
    check_azure_cli || true
    check_azure_resources || true
    check_database || true
    check_azure_ad || true
    check_environment_variables || true
    check_ssl_certificates || true
    check_dns_configuration || true
    check_api_health_endpoints || true
    check_application_insights || true
    check_docker_images || true
    check_kubernetes_namespace || true
    check_no_hardcoded_secrets || true
    check_production_build || true
    check_git_status || true

    # Print summary
    log_section "PRE-FLIGHT CHECK SUMMARY"
    echo ""
    echo -e "  ${GREEN}✓ Passed:${NC}           $PASSED"
    echo -e "  ${RED}✗ Failed:${NC}           $FAILED"
    echo -e "  ${RED}✗ Critical Failed:${NC}  $CRITICAL_FAILED"
    echo -e "  ${YELLOW}⚠ Warnings:${NC}         $WARNINGS"
    echo ""

    # Determine readiness
    if [[ $CRITICAL_FAILED -gt 0 ]]; then
        echo -e "${RED}╔════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ✗ NOT READY FOR PRODUCTION           ║${NC}"
        echo -e "${RED}║  Critical issues must be resolved     ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo "Critical issues detected. Please fix the issues above before deploying."
        echo "Report saved to: $REPORT_FILE"
        exit 1
    elif [[ $FAILED -gt 0 ]]; then
        echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  ⚠ CAUTION - Issues Detected          ║${NC}"
        echo -e "${YELLOW}║  Review failures before deploying     ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo "Non-critical issues detected. Review carefully."
        echo "Report saved to: $REPORT_FILE"
        exit 1
    elif [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  ⚠ READY WITH WARNINGS                ║${NC}"
        echo -e "${YELLOW}║  $WARNINGS warning(s) to review            ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo "Warnings detected, but ready for deployment."
        echo "Report saved to: $REPORT_FILE"
        exit 0
    else
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✓ READY FOR PRODUCTION DEPLOYMENT    ║${NC}"
        echo -e "${GREEN}║  All checks passed successfully       ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo "All pre-flight checks passed!"
        echo "Report saved to: $REPORT_FILE"
        echo ""
        echo "Next step: Run deployment script"
        echo "  ./scripts/deploy-to-production.sh"
        exit 0
    fi
}

# Run main function
main "$@"
