#!/bin/bash
#############################################################################
# Fleet Management System - Azure VM Deployment Script
# Production-ready deployment automation with rollback support
#############################################################################

set -euo pipefail

# Color output for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fleet-management"
APP_DIR="/opt/${APP_NAME}"
BACKUP_DIR="/opt/${APP_NAME}-backups"
LOG_FILE="/var/log/${APP_NAME}-deploy.log"
DEPLOY_USER="${DEPLOY_USER:-fleetapp}"
NODE_VERSION="20"
MAX_BACKUPS=5

# Git configuration
GIT_REPO="${GIT_REPO:-https://github.com/CapitalTechHub/Fleet.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"

# Service ports
API_PORT=3001
FRONTEND_PORT=3000

#############################################################################
# Utility Functions
#############################################################################

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "${LOG_FILE}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*" | tee -a "${LOG_FILE}"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $*" | tee -a "${LOG_FILE}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
        exit 1
    fi
}

#############################################################################
# Prerequisite Checks
#############################################################################

check_prerequisites() {
    log "Checking prerequisites..."

    # Check for required commands
    local required_commands=("git" "node" "npm" "pm2" "nginx" "psql")
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            error "Required command '$cmd' not found"
            exit 1
        fi
    done

    # Check Node.js version
    local node_version=$(node --version | sed 's/v//' | cut -d. -f1)
    if [[ "$node_version" -lt "$NODE_VERSION" ]]; then
        error "Node.js version must be >= ${NODE_VERSION}, current: v${node_version}"
        exit 1
    fi

    # Check disk space (require at least 5GB free)
    local free_space=$(df -BG "${APP_DIR%/*}" | tail -1 | awk '{print $4}' | sed 's/G//')
    if [[ "$free_space" -lt 5 ]]; then
        error "Insufficient disk space. At least 5GB required, found ${free_space}GB"
        exit 1
    fi

    log "Prerequisites check passed"
}

#############################################################################
# Backup Current Deployment
#############################################################################

create_backup() {
    log "Creating backup of current deployment..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/${timestamp}"

    mkdir -p "${backup_path}"

    if [[ -d "${APP_DIR}" ]]; then
        # Backup application files
        cp -r "${APP_DIR}" "${backup_path}/app"

        # Backup PM2 processes
        if pm2 list | grep -q "${APP_NAME}"; then
            pm2 save
            cp ~/.pm2/dump.pm2 "${backup_path}/pm2-dump.pm2" 2>/dev/null || true
        fi

        # Backup Nginx configuration
        if [[ -f "/etc/nginx/sites-available/${APP_NAME}" ]]; then
            cp "/etc/nginx/sites-available/${APP_NAME}" "${backup_path}/nginx.conf"
        fi

        log "Backup created at ${backup_path}"
        echo "${backup_path}" > "${BACKUP_DIR}/latest"
    else
        warning "No existing deployment to backup"
    fi

    # Clean old backups
    cleanup_old_backups
}

cleanup_old_backups() {
    local backup_count=$(ls -1d "${BACKUP_DIR}"/*/ 2>/dev/null | wc -l)

    if [[ "$backup_count" -gt "$MAX_BACKUPS" ]]; then
        info "Cleaning old backups (keeping last ${MAX_BACKUPS})"
        ls -1dt "${BACKUP_DIR}"/*/ | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -rf
    fi
}

#############################################################################
# Rollback Function
#############################################################################

rollback() {
    error "Deployment failed! Rolling back to previous version..."

    if [[ ! -f "${BACKUP_DIR}/latest" ]]; then
        error "No backup found for rollback"
        return 1
    fi

    local backup_path=$(cat "${BACKUP_DIR}/latest")

    if [[ ! -d "${backup_path}" ]]; then
        error "Backup directory not found: ${backup_path}"
        return 1
    fi

    # Stop current services
    pm2 delete all || true

    # Restore application files
    rm -rf "${APP_DIR}"
    cp -r "${backup_path}/app" "${APP_DIR}"

    # Restore PM2 processes
    if [[ -f "${backup_path}/pm2-dump.pm2" ]]; then
        cp "${backup_path}/pm2-dump.pm2" ~/.pm2/dump.pm2
        pm2 resurrect
    fi

    # Restore Nginx configuration
    if [[ -f "${backup_path}/nginx.conf" ]]; then
        cp "${backup_path}/nginx.conf" "/etc/nginx/sites-available/${APP_NAME}"
        nginx -t && systemctl reload nginx
    fi

    log "Rollback completed successfully"
}

#############################################################################
# Clone/Update Repository
#############################################################################

update_repository() {
    log "Updating repository..."

    if [[ -d "${APP_DIR}/.git" ]]; then
        cd "${APP_DIR}"
        git fetch origin
        git reset --hard "origin/${GIT_BRANCH}"
        git clean -fdx
    else
        rm -rf "${APP_DIR}"
        git clone --branch "${GIT_BRANCH}" "${GIT_REPO}" "${APP_DIR}"
        cd "${APP_DIR}"
    fi

    local commit_hash=$(git rev-parse --short HEAD)
    log "Updated to commit: ${commit_hash}"

    # Set ownership
    chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"
}

#############################################################################
# Install Dependencies
#############################################################################

install_dependencies() {
    log "Installing dependencies..."

    cd "${APP_DIR}"

    # Install API dependencies
    if [[ -f "api/package.json" ]]; then
        info "Installing API dependencies..."
        cd api
        sudo -u "${DEPLOY_USER}" npm ci --production
        cd ..
    fi

    # Install frontend dependencies
    if [[ -f "package.json" ]]; then
        info "Installing frontend dependencies..."
        sudo -u "${DEPLOY_USER}" npm ci --production
    fi

    log "Dependencies installed successfully"
}

#############################################################################
# Run Database Migrations
#############################################################################

run_migrations() {
    log "Running database migrations..."

    cd "${APP_DIR}/api"

    # Check database connection
    if ! sudo -u "${DEPLOY_USER}" npm run check:db; then
        error "Database connection failed"
        return 1
    fi

    # Run migrations
    if [[ -d "src/migrations" ]]; then
        sudo -u "${DEPLOY_USER}" npm run migrate || {
            error "Database migration failed"
            return 1
        }
    fi

    log "Database migrations completed"
}

#############################################################################
# Build Application
#############################################################################

build_application() {
    log "Building application..."

    cd "${APP_DIR}"

    # Build API
    if [[ -f "api/package.json" ]] && grep -q '"build"' api/package.json; then
        info "Building API..."
        cd api
        sudo -u "${DEPLOY_USER}" npm run build || {
            error "API build failed"
            return 1
        }
        cd ..
    fi

    # Build Frontend
    if grep -q '"build"' package.json; then
        info "Building frontend..."
        sudo -u "${DEPLOY_USER}" npm run build || {
            error "Frontend build failed"
            return 1
        }
    fi

    log "Application built successfully"
}

#############################################################################
# Configure PM2
#############################################################################

configure_pm2() {
    log "Configuring PM2..."

    cd "${APP_DIR}"

    # Stop existing PM2 processes
    pm2 delete all 2>/dev/null || true

    # Start services using ecosystem file
    if [[ -f "ecosystem.config.js" ]]; then
        sudo -u "${DEPLOY_USER}" pm2 start ecosystem.config.js
    else
        error "ecosystem.config.js not found"
        return 1
    fi

    # Save PM2 process list
    sudo -u "${DEPLOY_USER}" pm2 save

    # Setup PM2 startup script
    pm2 startup systemd -u "${DEPLOY_USER}" --hp "/home/${DEPLOY_USER}"

    log "PM2 configured successfully"
}

#############################################################################
# Configure Nginx
#############################################################################

configure_nginx() {
    log "Configuring Nginx..."

    local nginx_conf="/etc/nginx/sites-available/${APP_NAME}"

    # Copy Nginx configuration
    if [[ -f "${APP_DIR}/nginx/fleet.conf" ]]; then
        cp "${APP_DIR}/nginx/fleet.conf" "${nginx_conf}"

        # Enable site
        ln -sf "${nginx_conf}" "/etc/nginx/sites-enabled/${APP_NAME}"

        # Test Nginx configuration
        if nginx -t; then
            systemctl reload nginx
            log "Nginx configured successfully"
        else
            error "Nginx configuration test failed"
            return 1
        fi
    else
        warning "Nginx configuration not found in repository"
    fi
}

#############################################################################
# Health Checks
#############################################################################

run_health_checks() {
    log "Running health checks..."

    local max_attempts=30
    local attempt=0

    # Wait for services to start
    sleep 10

    # Check API health
    info "Checking API health..."
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -sf "http://localhost:${API_PORT}/health" >/dev/null 2>&1; then
            log "API health check passed"
            break
        fi
        ((attempt++))
        sleep 2
    done

    if [[ $attempt -eq $max_attempts ]]; then
        error "API health check failed"
        return 1
    fi

    # Check frontend
    info "Checking frontend..."
    attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -sf "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1; then
            log "Frontend health check passed"
            break
        fi
        ((attempt++))
        sleep 2
    done

    if [[ $attempt -eq $max_attempts ]]; then
        error "Frontend health check failed"
        return 1
    fi

    # Run detailed health check script
    if [[ -x "${APP_DIR}/scripts/health-check.sh" ]]; then
        "${APP_DIR}/scripts/health-check.sh" || {
            error "Detailed health check failed"
            return 1
        }
    fi

    log "All health checks passed"
}

#############################################################################
# Post-Deployment Tasks
#############################################################################

post_deployment() {
    log "Running post-deployment tasks..."

    # Clear application cache if needed
    if [[ -d "${APP_DIR}/api/.cache" ]]; then
        rm -rf "${APP_DIR}/api/.cache"
    fi

    # Restart monitoring services
    if systemctl is-active --quiet datadog-agent; then
        systemctl restart datadog-agent
    fi

    # Log deployment information
    cat >> "${LOG_FILE}" <<EOF

==========================================================
Deployment completed successfully
Date: $(date)
Commit: $(cd "${APP_DIR}" && git rev-parse HEAD)
Branch: ${GIT_BRANCH}
==========================================================

EOF

    log "Post-deployment tasks completed"
}

#############################################################################
# Main Deployment Flow
#############################################################################

main() {
    log "Starting Fleet Management deployment to Azure VM"
    log "=========================================="

    # Check permissions
    check_permissions

    # Check prerequisites
    check_prerequisites || exit 1

    # Create backup
    create_backup

    # Set up trap for rollback on error
    trap 'rollback' ERR

    # Deployment steps
    update_repository || exit 1
    install_dependencies || exit 1
    run_migrations || exit 1
    build_application || exit 1
    configure_pm2 || exit 1
    configure_nginx || exit 1
    run_health_checks || exit 1
    post_deployment

    # Remove trap
    trap - ERR

    log "=========================================="
    log "Deployment completed successfully!"
    log "API: http://localhost:${API_PORT}"
    log "Frontend: http://localhost:${FRONTEND_PORT}"
    log "=========================================="
}

# Run main function
main "$@"
