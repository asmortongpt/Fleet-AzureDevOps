#!/usr/bin/env bash
#
# Production Rollback Script
# Safely rollback production deployment to previous version
#
# Usage:
#   ./scripts/rollback-production.sh [OPTIONS]
#
# Options:
#   --list           List recent deployments
#   --to VERSION     Rollback to specific version
#   --auto           Auto-confirm rollback (dangerous!)
#   --db-rollback    Include database rollback (requires confirmation)
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-fleet-management}"
AKS_CLUSTER="${AKS_CLUSTER:-fleet-aks-cluster}"
AKS_RESOURCE_GROUP="${AKS_RESOURCE_GROUP:-fleet-management-rg}"
ROLLBACK_REPORT="rollback-report-$(date +%Y%m%d-%H%M%S).txt"

# Flags
LIST_ONLY=false
AUTO_CONFIRM=false
DB_ROLLBACK=false
TARGET_VERSION=""

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_critical() { echo -e "${RED}[CRITICAL]${NC} $1"; }

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --list)
                LIST_ONLY=true
                shift
                ;;
            --to)
                TARGET_VERSION="$2"
                shift 2
                ;;
            --auto)
                AUTO_CONFIRM=true
                shift
                ;;
            --db-rollback)
                DB_ROLLBACK=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                echo "Usage: $0 [--list] [--to VERSION] [--auto] [--db-rollback]"
                exit 1
                ;;
        esac
    done
}

# Function to check prerequisites
check_prerequisites() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed"
        exit 1
    fi

    # Check Azure login
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Run: az login"
        exit 1
    fi

    # Get AKS credentials
    log_info "Getting AKS credentials..."
    az aks get-credentials \
        --resource-group "$AKS_RESOURCE_GROUP" \
        --name "$AKS_CLUSTER" \
        --overwrite-existing &> /dev/null

    log_success "Prerequisites checked"
}

# Function to list recent deployments
list_deployments() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "RECENT DEPLOYMENTS"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    # Get API deployment history
    echo "API Deployment History:"
    echo "─────────────────────────────────────────────────────────"
    kubectl rollout history deployment/fleet-api -n "$NAMESPACE" 2>/dev/null || echo "No deployment history found"

    echo ""
    echo "Frontend Deployment History:"
    echo "─────────────────────────────────────────────────────────"
    kubectl rollout history deployment/fleet-frontend -n "$NAMESPACE" 2>/dev/null || echo "No deployment history found"

    echo ""
    echo "Current Deployments:"
    echo "─────────────────────────────────────────────────────────"
    kubectl get deployments -n "$NAMESPACE" -o wide 2>/dev/null || echo "No deployments found"

    echo ""
    echo "Current Images:"
    echo "─────────────────────────────────────────────────────────"
    echo "API:"
    kubectl get deployment fleet-api -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "N/A"
    echo ""
    echo "Frontend:"
    kubectl get deployment fleet-frontend -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "N/A"
    echo ""
    echo ""
}

# Function to get current version info
get_current_version() {
    local api_image=$(kubectl get deployment fleet-api -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "unknown")
    local frontend_image=$(kubectl get deployment fleet-frontend -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "unknown")

    echo ""
    echo "Current Version Information:"
    echo "  API Image:      $api_image"
    echo "  Frontend Image: $frontend_image"
    echo ""
}

# Function to confirm rollback
confirm_rollback() {
    if [[ "$AUTO_CONFIRM" == "true" ]]; then
        log_warning "Auto-confirm enabled - skipping confirmation"
        return 0
    fi

    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}║  ⚠  WARNING: PRODUCTION ROLLBACK  ⚠                   ║${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}║  This will rollback the production deployment         ║${NC}"
    echo -e "${RED}║  This action affects live users                       ║${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""

    get_current_version

    echo -e "${YELLOW}Are you sure you want to proceed with the rollback?${NC}"
    echo -e "Type ${GREEN}ROLLBACK${NC} to confirm, or anything else to cancel:"
    read -r confirmation

    if [[ "$confirmation" != "ROLLBACK" ]]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi

    log_warning "Rollback confirmed by user"
}

# Function to create pre-rollback snapshot
create_snapshot() {
    log_info "Creating pre-rollback snapshot..."

    local snapshot_dir="rollback-snapshot-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$snapshot_dir"

    # Export current deployments
    kubectl get deployment fleet-api -n "$NAMESPACE" -o yaml > "$snapshot_dir/api-deployment.yaml" 2>/dev/null || true
    kubectl get deployment fleet-frontend -n "$NAMESPACE" -o yaml > "$snapshot_dir/frontend-deployment.yaml" 2>/dev/null || true

    # Export service configs
    kubectl get svc -n "$NAMESPACE" -o yaml > "$snapshot_dir/services.yaml" 2>/dev/null || true

    # Export pod status
    kubectl get pods -n "$NAMESPACE" -o yaml > "$snapshot_dir/pods.yaml" 2>/dev/null || true

    log_success "Snapshot created: $snapshot_dir"
    echo "$snapshot_dir" > .last-rollback-snapshot
}

# Function to perform Kubernetes rollback
rollback_kubernetes() {
    log_info "Starting Kubernetes rollback..."

    # Rollback API
    log_info "Rolling back API deployment..."
    if [[ -n "$TARGET_VERSION" ]]; then
        log_info "Rolling back to specific version: $TARGET_VERSION"
        # Note: Kubernetes rollback uses revision numbers, not version tags
        # You may need to map version tags to revision numbers
        log_warning "Specific version rollback requires manual image update"
        log_info "Use: kubectl set image deployment/fleet-api fleet-api=image:$TARGET_VERSION -n $NAMESPACE"
    else
        kubectl rollout undo deployment/fleet-api -n "$NAMESPACE"
    fi

    # Wait for API rollback
    log_info "Waiting for API rollback to complete..."
    if kubectl rollout status deployment/fleet-api -n "$NAMESPACE" --timeout=10m; then
        log_success "API rollback completed"
    else
        log_error "API rollback failed or timed out"
        return 1
    fi

    # Rollback Frontend
    log_info "Rolling back frontend deployment..."
    if [[ -n "$TARGET_VERSION" ]]; then
        log_info "Use: kubectl set image deployment/fleet-frontend fleet-frontend=image:$TARGET_VERSION -n $NAMESPACE"
    else
        kubectl rollout undo deployment/fleet-frontend -n "$NAMESPACE"
    fi

    # Wait for frontend rollback
    log_info "Waiting for frontend rollback to complete..."
    if kubectl rollout status deployment/fleet-frontend -n "$NAMESPACE" --timeout=10m; then
        log_success "Frontend rollback completed"
    else
        log_error "Frontend rollback failed or timed out"
        return 1
    fi

    log_success "Kubernetes rollback completed"
}

# Function to verify rollback
verify_rollback() {
    log_info "Verifying rollback..."

    # Check pod status
    log_info "Checking pod status..."
    local running_pods=$(kubectl get pods -n "$NAMESPACE" --no-headers | grep -c "Running" || echo "0")
    local total_pods=$(kubectl get pods -n "$NAMESPACE" --no-headers | wc -l)

    log_info "Pods running: $running_pods/$total_pods"

    if [[ "$running_pods" == "$total_pods" ]] && [[ "$running_pods" -gt 0 ]]; then
        log_success "All pods are running"
    else
        log_warning "Not all pods are running ($running_pods/$total_pods)"
        kubectl get pods -n "$NAMESPACE"
    fi

    # Test application endpoints
    log_info "Testing application endpoints..."

    local app_url=""
    local external_ip=$(kubectl get svc fleet-frontend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

    if [[ -n "$external_ip" ]]; then
        app_url="http://$external_ip"
    fi

    if [[ -n "$app_url" ]]; then
        # Test frontend
        if curl -sf "$app_url" > /dev/null 2>&1; then
            log_success "Frontend is accessible"
        else
            log_warning "Frontend is not accessible yet (may still be starting)"
        fi

        # Test API health
        if curl -sf "$app_url/api/health" > /dev/null 2>&1; then
            log_success "API health endpoint responding"
        else
            log_warning "API health endpoint not responding yet"
        fi
    else
        log_warning "Cannot determine application URL for verification"
    fi
}

# Function to clear cache
clear_cache() {
    log_info "Clearing caches..."

    # Check if Redis is deployed
    local redis_pod=$(kubectl get pods -n "$NAMESPACE" -l app=fleet-redis -o name 2>/dev/null | head -1 || echo "")

    if [[ -n "$redis_pod" ]]; then
        log_info "Clearing Redis cache..."
        kubectl exec -n "$NAMESPACE" "$redis_pod" -- redis-cli FLUSHALL &> /dev/null || true
        log_success "Redis cache cleared"
    else
        log_info "No Redis cache found"
    fi

    # CDN cache purge (if applicable)
    log_info "CDN cache should be purged manually if applicable"
}

# Function to rollback database (DANGEROUS)
rollback_database() {
    if [[ "$DB_ROLLBACK" != "true" ]]; then
        log_info "Skipping database rollback (not requested)"
        return 0
    fi

    log_critical "DATABASE ROLLBACK REQUESTED"
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}║  ⚠  DANGER: DATABASE ROLLBACK  ⚠                      ║${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}║  This will restore database from backup               ║${NC}"
    echo -e "${RED}║  ALL DATA CHANGES SINCE BACKUP WILL BE LOST           ║${NC}"
    echo -e "${RED}║  This is IRREVERSIBLE                                  ║${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [[ "$AUTO_CONFIRM" != "true" ]]; then
        echo -e "Type ${RED}RESTORE DATABASE${NC} to confirm database rollback:"
        read -r db_confirmation

        if [[ "$db_confirmation" != "RESTORE DATABASE" ]]; then
            log_info "Database rollback cancelled"
            return 0
        fi
    fi

    log_warning "Database rollback confirmed"

    # List available backups
    log_info "Available database backups:"
    az postgres flexible-server backup list \
        --resource-group "$AKS_RESOURCE_GROUP" \
        --server-name fleet-postgres-server \
        --query "[].{Name:name, Time:completedTime}" \
        -o table 2>/dev/null || log_warning "Cannot list backups (manual restore may be required)"

    log_critical "Database rollback must be performed manually"
    log_info "Steps:"
    log_info "  1. Identify the backup to restore from above list"
    log_info "  2. Use Azure Portal or CLI to restore database"
    log_info "  3. Update connection strings if needed"
    echo ""
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2

    log_info "Sending rollback notification..."

    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"🔄 Fleet Management Rollback - $status: $message\"}" \
            &> /dev/null || true
    fi

    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        log_info "Email notification to: $NOTIFICATION_EMAIL"
    fi
}

# Function to generate rollback report
generate_report() {
    echo "" | tee -a "$ROLLBACK_REPORT"
    echo "═══════════════════════════════════════════════════════════" | tee -a "$ROLLBACK_REPORT"
    echo "ROLLBACK REPORT" | tee -a "$ROLLBACK_REPORT"
    echo "═══════════════════════════════════════════════════════════" | tee -a "$ROLLBACK_REPORT"
    echo "" | tee -a "$ROLLBACK_REPORT"
    echo "Date:           $(date -u '+%Y-%m-%d %H:%M:%S UTC')" | tee -a "$ROLLBACK_REPORT"
    echo "Operator:       $(whoami)" | tee -a "$ROLLBACK_REPORT"
    echo "Namespace:      $NAMESPACE" | tee -a "$ROLLBACK_REPORT"
    echo "Cluster:        $AKS_CLUSTER" | tee -a "$ROLLBACK_REPORT"
    echo "" | tee -a "$ROLLBACK_REPORT"

    get_current_version | tee -a "$ROLLBACK_REPORT"

    echo "Kubernetes Status:" | tee -a "$ROLLBACK_REPORT"
    kubectl get deployments,pods,svc -n "$NAMESPACE" 2>/dev/null | tee -a "$ROLLBACK_REPORT" || echo "  (Unable to fetch)" | tee -a "$ROLLBACK_REPORT"
    echo "" | tee -a "$ROLLBACK_REPORT"
    echo "Report saved to: $ROLLBACK_REPORT" | tee -a "$ROLLBACK_REPORT"
    echo "═══════════════════════════════════════════════════════════" | tee -a "$ROLLBACK_REPORT"
}

# Main rollback flow
main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "FLEET MANAGEMENT - PRODUCTION ROLLBACK"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    parse_args "$@"

    check_prerequisites

    # If list only, show deployments and exit
    if [[ "$LIST_ONLY" == "true" ]]; then
        list_deployments
        exit 0
    fi

    # Show current state
    list_deployments

    # Confirm rollback
    confirm_rollback

    # Start rollback process
    log_info "Starting rollback process..."
    echo ""

    # Create snapshot
    create_snapshot

    # Perform rollback
    if rollback_kubernetes; then
        log_success "Kubernetes rollback successful"
    else
        log_error "Kubernetes rollback failed"
        send_notification "FAILED" "Kubernetes rollback failed"
        exit 1
    fi

    # Verify rollback
    verify_rollback

    # Clear caches
    clear_cache

    # Database rollback (if requested)
    rollback_database

    # Generate report
    generate_report

    # Send notification
    send_notification "SUCCESS" "Rollback completed successfully"

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}║  ✓ ROLLBACK COMPLETED SUCCESSFULLY                    ║${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify application is working: ./scripts/validate-production-deployment.sh"
    echo "  2. Monitor logs: kubectl logs -f deployment/fleet-api -n $NAMESPACE"
    echo "  3. Check for errors in Application Insights"
    echo "  4. Communicate rollback to team"
    echo ""
}

# Run main function
main "$@"
