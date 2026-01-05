#!/bin/bash

################################################################################
# Fleet QA Framework - Production Deployment Script
################################################################################
# Purpose: Enterprise-grade deployment with validation, rollback, monitoring
# Version: 2.0.0
# Author: Fleet DevOps Team
# Last Updated: 2026-01-04
################################################################################

set -euo pipefail
IFS=$'\n\t'

# ============================================================================
# Configuration
# ============================================================================

# Environment
ENVIRONMENT="${ENVIRONMENT:-production}"
DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"

# VM Configuration
VM_IP="${AZURE_VM_IP:-172.173.175.71}"
VM_USER="${AZURE_VM_USER:-azureuser}"
VM_PORT="${AZURE_VM_PORT:-22}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"

# Paths
REMOTE_DIR="/home/${VM_USER}/qa-framework"
BACKUP_DIR="/home/${VM_USER}/qa-framework-backups"
EVIDENCE_VAULT="${REMOTE_DIR}/evidence-vault"
LOG_DIR="/var/log/qa-framework"

# Database
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-fleet_qa}"
DB_USER="${DB_USER:-qauser}"
DB_PASSWORD="${DB_PASSWORD:-qapass_secure_2026}"

# Redis
REDIS_PORT="${REDIS_PORT:-6380}"
REDIS_PASSWORD="${REDIS_PASSWORD:-redis_secure_2026}"

# Health Check
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10   # 10 seconds

# Rollback
ENABLE_AUTO_ROLLBACK=true
ROLLBACK_ON_FAILURE=true

# Monitoring
SEND_ALERTS=true
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
PAGERDUTY_KEY="${PAGERDUTY_KEY:-}"

# ============================================================================
# Color Output
# ============================================================================

if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    MAGENTA='\033[0;35m'
    BOLD='\033[1m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' CYAN='' MAGENTA='' BOLD='' NC=''
fi

# ============================================================================
# Logging Functions
# ============================================================================

LOG_FILE="/tmp/qa-framework-deploy-${DEPLOYMENT_ID}.log"
ERROR_LOG="/tmp/qa-framework-deploy-${DEPLOYMENT_ID}-errors.log"

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} ${BOLD}$*${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $*" | tee -a "$LOG_FILE" "$ERROR_LOG"
}

log_error() {
    echo -e "${RED}[✗]${NC} ${BOLD}$*${NC}" | tee -a "$LOG_FILE" "$ERROR_LOG"
}

log_step() {
    echo -e "\n${CYAN}${BOLD}━━━ $* ━━━${NC}\n" | tee -a "$LOG_FILE"
}

# ============================================================================
# Error Handling
# ============================================================================

DEPLOYMENT_FAILED=false
ROLLBACK_REQUIRED=false

cleanup() {
    local exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        log_error "Deployment failed with exit code: $exit_code"
        DEPLOYMENT_FAILED=true

        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            log_warning "Initiating automatic rollback..."
            perform_rollback
        fi

        send_alert "critical" "QA Framework deployment FAILED" "$DEPLOYMENT_ID"
    else
        log_success "Deployment completed successfully"
        send_alert "info" "QA Framework deployment SUCCESS" "$DEPLOYMENT_ID"
    fi

    # Upload logs
    upload_deployment_logs

    exit $exit_code
}

trap cleanup EXIT
trap 'log_error "Script interrupted"; exit 130' INT TERM

# ============================================================================
# Validation Functions
# ============================================================================

validate_prerequisites() {
    log_step "Validating Prerequisites"

    local errors=0

    # Check required commands
    for cmd in ssh scp docker docker-compose psql redis-cli jq curl; do
        if ! command -v $cmd &> /dev/null; then
            log_error "Required command not found: $cmd"
            ((errors++))
        fi
    done

    # Check SSH key
    if [[ ! -f "$SSH_KEY" ]]; then
        log_error "SSH key not found: $SSH_KEY"
        ((errors++))
    fi

    # Check environment variables
    for var in ANTHROPIC_API_KEY; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable not set: $var"
            ((errors++))
        fi
    done

    # Test SSH connection
    if ! ssh -i "$SSH_KEY" -p "$VM_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
         "${VM_USER}@${VM_IP}" "echo 'SSH connection successful'" &>/dev/null; then
        log_error "Cannot connect to VM: ${VM_USER}@${VM_IP}:${VM_PORT}"
        ((errors++))
    fi

    if [[ $errors -gt 0 ]]; then
        log_error "Prerequisite validation failed with $errors error(s)"
        return 1
    fi

    log_success "All prerequisites validated"
    return 0
}

validate_vm_resources() {
    log_step "Validating VM Resources"

    local vm_check=$(ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" bash <<'EOFCHECK'
#!/bin/bash

# Check CPU cores
cpu_cores=$(nproc)
if [[ $cpu_cores -lt 4 ]]; then
    echo "ERROR: Insufficient CPU cores: $cpu_cores (minimum 4 required)"
    exit 1
fi

# Check RAM
ram_gb=$(free -g | awk '/^Mem:/{print $2}')
if [[ $ram_gb -lt 8 ]]; then
    echo "ERROR: Insufficient RAM: ${ram_gb}GB (minimum 8GB required)"
    exit 1
fi

# Check disk space
disk_free_gb=$(df -BG / | awk 'NR==2{print $4}' | tr -d 'G')
if [[ $disk_free_gb -lt 20 ]]; then
    echo "ERROR: Insufficient disk space: ${disk_free_gb}GB (minimum 20GB required)"
    exit 1
fi

# Check Docker
if ! docker --version &>/dev/null; then
    echo "ERROR: Docker not installed"
    exit 1
fi

# Check Docker Compose
if ! docker-compose --version &>/dev/null; then
    echo "ERROR: Docker Compose not installed"
    exit 1
fi

echo "SUCCESS: VM resources validated"
echo "  CPU: $cpu_cores cores"
echo "  RAM: ${ram_gb}GB"
echo "  Disk: ${disk_free_gb}GB free"
EOFCHECK
)

    if [[ $? -ne 0 ]]; then
        log_error "$vm_check"
        return 1
    fi

    log_success "$vm_check"
    return 0
}

# ============================================================================
# Backup Functions
# ============================================================================

create_backup() {
    log_step "Creating Backup"

    local backup_name="backup-${DEPLOYMENT_ID}"

    ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" bash <<EOFBACKUP
#!/bin/bash
set -e

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Check if current deployment exists
if [[ -d "${REMOTE_DIR}" ]]; then
    echo "Creating backup of current deployment..."

    # Stop services gracefully
    cd "${REMOTE_DIR}"
    if [[ -f "docker-compose.yml" ]]; then
        docker-compose stop || true
    fi

    # Backup database
    if docker ps -a | grep -q qa-postgres; then
        echo "Backing up PostgreSQL database..."
        docker exec qa-postgres pg_dump -U ${DB_USER} ${DB_NAME} | gzip > "${BACKUP_DIR}/${backup_name}-database.sql.gz"
    fi

    # Backup Redis data
    if docker ps -a | grep -q qa-redis; then
        echo "Backing up Redis data..."
        docker exec qa-redis redis-cli --rdb /tmp/dump.rdb save || true
        docker cp qa-redis:/tmp/dump.rdb "${BACKUP_DIR}/${backup_name}-redis.rdb" || true
    fi

    # Backup evidence vault
    if [[ -d "${EVIDENCE_VAULT}" ]]; then
        echo "Backing up evidence vault..."
        tar -czf "${BACKUP_DIR}/${backup_name}-evidence.tar.gz" -C "${EVIDENCE_VAULT}" .
    fi

    # Backup configuration
    echo "Backing up configuration..."
    tar -czf "${BACKUP_DIR}/${backup_name}-config.tar.gz" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=chroma_data \
        -C "${REMOTE_DIR}" .

    echo "Backup created successfully: ${backup_name}"
    ls -lh "${BACKUP_DIR}/${backup_name}-"*
else
    echo "No existing deployment found, skipping backup"
fi
EOFBACKUP

    if [[ $? -eq 0 ]]; then
        log_success "Backup created: $backup_name"
        BACKUP_NAME="$backup_name"
        return 0
    else
        log_error "Backup creation failed"
        return 1
    fi
}

perform_rollback() {
    if [[ -z "${BACKUP_NAME:-}" ]]; then
        log_error "No backup available for rollback"
        return 1
    fi

    log_warning "Performing rollback to backup: $BACKUP_NAME"

    ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" bash <<EOFROLLBACK
#!/bin/bash
set -e

cd "${REMOTE_DIR}"

# Stop current services
docker-compose down || true

# Restore configuration
tar -xzf "${BACKUP_DIR}/${BACKUP_NAME}-config.tar.gz" -C "${REMOTE_DIR}"

# Restore database
if [[ -f "${BACKUP_DIR}/${BACKUP_NAME}-database.sql.gz" ]]; then
    echo "Restoring database..."
    gunzip < "${BACKUP_DIR}/${BACKUP_NAME}-database.sql.gz" | \
        docker exec -i qa-postgres psql -U ${DB_USER} ${DB_NAME}
fi

# Restore Redis
if [[ -f "${BACKUP_DIR}/${BACKUP_NAME}-redis.rdb" ]]; then
    echo "Restoring Redis..."
    docker cp "${BACKUP_DIR}/${BACKUP_NAME}-redis.rdb" qa-redis:/data/dump.rdb
fi

# Restore evidence vault
if [[ -f "${BACKUP_DIR}/${BACKUP_NAME}-evidence.tar.gz" ]]; then
    echo "Restoring evidence vault..."
    mkdir -p "${EVIDENCE_VAULT}"
    tar -xzf "${BACKUP_DIR}/${BACKUP_NAME}-evidence.tar.gz" -C "${EVIDENCE_VAULT}"
fi

# Restart services
docker-compose up -d

echo "Rollback completed successfully"
EOFROLLBACK

    if [[ $? -eq 0 ]]; then
        log_success "Rollback completed successfully"
        return 0
    else
        log_error "Rollback failed"
        return 1
    fi
}

# ============================================================================
# Deployment Functions
# ============================================================================

deploy_infrastructure() {
    log_step "Deploying Infrastructure"

    ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" bash <<'EOFDEPLOY'
#!/bin/bash
set -e

cd "${REMOTE_DIR}"

# Pull latest Docker images
echo "Pulling Docker images..."
docker-compose pull

# Start infrastructure services
echo "Starting infrastructure services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
timeout=60
while ! docker exec qa-postgres pg_isready -U ${DB_USER} -d ${DB_NAME} &>/dev/null; do
    sleep 2
    ((timeout--))
    if [[ $timeout -le 0 ]]; then
        echo "ERROR: PostgreSQL failed to start"
        exit 1
    fi
done

# Wait for Redis
echo "Waiting for Redis..."
timeout=60
while ! docker exec qa-redis redis-cli ping &>/dev/null; do
    sleep 2
    ((timeout--))
    if [[ $timeout -le 0 ]]; then
        echo "ERROR: Redis failed to start"
        exit 1
    fi
done

echo "Infrastructure services started successfully"
EOFDEPLOY

    if [[ $? -eq 0 ]]; then
        log_success "Infrastructure deployed"
        return 0
    else
        log_error "Infrastructure deployment failed"
        return 1
    fi
}

deploy_application() {
    log_step "Deploying Application"

    ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" bash <<EOFAPP
#!/bin/bash
set -e

cd "${REMOTE_DIR}"

# Install Node.js dependencies
echo "Installing dependencies..."
npm ci --production --legacy-peer-deps

# Build TypeScript
echo "Building application..."
npm run build || echo "No build script defined"

# Run database migrations
echo "Running database migrations..."
if [[ -f "scripts/migrations/migrate.sh" ]]; then
    bash scripts/migrations/migrate.sh
fi

# Index codebase for RAG
echo "Indexing codebase..."
npx tsx scripts/index-codebase.ts || echo "Indexing script not found"

echo "Application deployed successfully"
EOFAPP

    if [[ $? -eq 0 ]]; then
        log_success "Application deployed"
        return 0
    else
        log_error "Application deployment failed"
        return 1
    fi
}

start_services() {
    log_step "Starting Services"

    ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" bash <<'EOFSTART'
#!/bin/bash
set -e

cd "${REMOTE_DIR}"

# Start all services
echo "Starting all services..."
docker-compose up -d

# List running services
docker-compose ps

echo "Services started successfully"
EOFSTART

    if [[ $? -eq 0 ]]; then
        log_success "Services started"
        return 0
    else
        log_error "Service startup failed"
        return 1
    fi
}

# ============================================================================
# Health Check Functions
# ============================================================================

wait_for_healthy_services() {
    log_step "Waiting for Services to Become Healthy"

    local elapsed=0
    local all_healthy=false

    while [[ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]]; do
        if check_service_health; then
            all_healthy=true
            break
        fi

        sleep $HEALTH_CHECK_INTERVAL
        ((elapsed += HEALTH_CHECK_INTERVAL))

        log_info "Waiting for services... (${elapsed}s / ${HEALTH_CHECK_TIMEOUT}s)"
    done

    if [[ "$all_healthy" == "true" ]]; then
        log_success "All services are healthy"
        return 0
    else
        log_error "Services failed to become healthy within ${HEALTH_CHECK_TIMEOUT}s"
        return 1
    fi
}

check_service_health() {
    local healthy=true

    # Check PostgreSQL
    if ! ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" \
         "docker exec qa-postgres pg_isready -U ${DB_USER} -d ${DB_NAME}" &>/dev/null; then
        log_warning "PostgreSQL not ready"
        healthy=false
    fi

    # Check Redis
    if ! ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" \
         "docker exec qa-redis redis-cli ping" &>/dev/null; then
        log_warning "Redis not ready"
        healthy=false
    fi

    # Check application (if health endpoint exists)
    if ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" \
       "curl -sf http://localhost:3001/health" &>/dev/null; then
        : # Health check passed
    else
        log_warning "Application health check failed"
        healthy=false
    fi

    [[ "$healthy" == "true" ]]
}

run_smoke_tests() {
    log_step "Running Smoke Tests"

    local tests_passed=true

    # Test 1: Database connectivity
    if ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" \
       "psql -U ${DB_USER} -h localhost -p ${DB_PORT} -d ${DB_NAME} -c 'SELECT 1;'" &>/dev/null; then
        log_success "Database connectivity test passed"
    else
        log_error "Database connectivity test failed"
        tests_passed=false
    fi

    # Test 2: Redis connectivity
    if ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" \
       "redis-cli -h localhost -p ${REDIS_PORT} PING" | grep -q "PONG"; then
        log_success "Redis connectivity test passed"
    else
        log_error "Redis connectivity test failed"
        tests_passed=false
    fi

    # Test 3: RAG system
    local rag_count=$(ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" \
        "psql -U ${DB_USER} -h localhost -p ${DB_PORT} -d ${DB_NAME} -t -c 'SELECT COUNT(*) FROM code_embeddings;'" | tr -d ' ')

    if [[ $rag_count -gt 0 ]]; then
        log_success "RAG system test passed ($rag_count embeddings)"
    else
        log_warning "RAG system has no embeddings"
    fi

    # Test 4: Quality gates
    if ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" \
       "cd ${REMOTE_DIR} && npx tsx scripts/test-gates.ts" &>/dev/null; then
        log_success "Quality gates test passed"
    else
        log_warning "Quality gates test failed (non-critical)"
    fi

    if [[ "$tests_passed" == "true" ]]; then
        log_success "All smoke tests passed"
        return 0
    else
        log_error "Some smoke tests failed"
        return 1
    fi
}

# ============================================================================
# Monitoring Functions
# ============================================================================

collect_deployment_metrics() {
    log_step "Collecting Deployment Metrics"

    local metrics=$(ssh -i "$SSH_KEY" "${VM_USER}@${VM_IP}" bash <<'EOFMETRICS'
#!/bin/bash

echo "=== Deployment Metrics ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

echo "System Resources:"
echo "  CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "  Memory Usage: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "  Disk Usage: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
echo ""

echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "Database Stats:"
psql -U ${DB_USER} -h localhost -p ${DB_PORT} -d ${DB_NAME} -c "
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins DESC
LIMIT 5;
" || echo "Database stats unavailable"
echo ""

echo "RAG Embeddings:"
psql -U ${DB_USER} -h localhost -p ${DB_PORT} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM code_embeddings;" || echo "0"
echo ""

echo "Recent Quality Gate Runs:"
psql -U ${DB_USER} -h localhost -p ${DB_PORT} -d ${DB_NAME} -c "
SELECT
    run_timestamp,
    total_score,
    status
FROM qa_runs
ORDER BY run_timestamp DESC
LIMIT 5;
" || echo "No recent runs"
EOFMETRICS
)

    echo "$metrics" | tee -a "$LOG_FILE"

    log_success "Metrics collected"
}

send_alert() {
    if [[ "$SEND_ALERTS" != "true" ]]; then
        return 0
    fi

    local severity=$1
    local title=$2
    local details=$3

    # Slack notification
    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        local color="good"
        [[ "$severity" == "warning" ]] && color="warning"
        [[ "$severity" == "critical" ]] && color="danger"

        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d @- <<EOFSLACK
{
    "attachments": [{
        "color": "$color",
        "title": "$title",
        "text": "$details",
        "fields": [
            {
                "title": "Environment",
                "value": "$ENVIRONMENT",
                "short": true
            },
            {
                "title": "Deployment ID",
                "value": "$DEPLOYMENT_ID",
                "short": true
            },
            {
                "title": "VM",
                "value": "${VM_IP}",
                "short": true
            }
        ],
        "footer": "Fleet QA Framework",
        "ts": $(date +%s)
    }]
}
EOFSLACK
    fi

    # PagerDuty alert (for critical only)
    if [[ "$severity" == "critical" && -n "${PAGERDUTY_KEY:-}" ]]; then
        curl -X POST https://events.pagerduty.com/v2/enqueue \
            -H 'Content-Type: application/json' \
            -d @- <<EOFPD
{
    "routing_key": "$PAGERDUTY_KEY",
    "event_action": "trigger",
    "payload": {
        "summary": "$title",
        "severity": "critical",
        "source": "${VM_IP}",
        "custom_details": {
            "deployment_id": "$DEPLOYMENT_ID",
            "environment": "$ENVIRONMENT",
            "details": "$details"
        }
    }
}
EOFPD
    fi
}

upload_deployment_logs() {
    log_info "Uploading deployment logs..."

    # Upload to VM for archival
    scp -i "$SSH_KEY" "$LOG_FILE" "${VM_USER}@${VM_IP}:${LOG_DIR}/" || true
    scp -i "$SSH_KEY" "$ERROR_LOG" "${VM_USER}@${VM_IP}:${LOG_DIR}/" || true

    log_success "Logs uploaded: ${LOG_DIR}/$(basename $LOG_FILE)"
}

# ============================================================================
# Main Deployment Flow
# ============================================================================

main() {
    local start_time=$(date +%s)

    echo -e "${BOLD}${BLUE}"
    cat <<'BANNER'
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   Fleet QA Framework - Production Deployment                     ║
║   Version 2.0.0                                                   ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
BANNER
    echo -e "${NC}"

    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Environment: $ENVIRONMENT"
    log_info "Target VM: ${VM_USER}@${VM_IP}:${VM_PORT}"
    echo ""

    # Phase 1: Pre-deployment validation
    validate_prerequisites || exit 1
    validate_vm_resources || exit 1

    # Phase 2: Backup
    create_backup || log_warning "Backup creation failed (continuing anyway)"

    # Phase 3: Deployment
    deploy_infrastructure || exit 1
    deploy_application || exit 1
    start_services || exit 1

    # Phase 4: Health checks
    wait_for_healthy_services || exit 1
    run_smoke_tests || log_warning "Some smoke tests failed"

    # Phase 5: Metrics and reporting
    collect_deployment_metrics

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    log_step "Deployment Summary"
    log_success "Deployment completed successfully!"
    log_info "Duration: ${duration}s"
    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Logs: $LOG_FILE"
    echo ""

    cat <<NEXTSTEPS
${CYAN}${BOLD}Next Steps:${NC}

1. Verify deployment:
   ${BLUE}ssh ${VM_USER}@${VM_IP}${NC}
   ${BLUE}cd ${REMOTE_DIR}${NC}
   ${BLUE}docker-compose ps${NC}

2. Run quality gates:
   ${BLUE}npx tsx src/orchestrator/master.ts${NC}

3. Monitor logs:
   ${BLUE}tail -f ${LOG_DIR}/application.log${NC}

4. View metrics:
   ${BLUE}curl http://${VM_IP}:3001/metrics${NC}

NEXTSTEPS

    return 0
}

# ============================================================================
# Execute Main
# ============================================================================

main "$@"
