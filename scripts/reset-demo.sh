#!/bin/bash

#############################################################################
# Fleet Management System - Demo Reset Script
#############################################################################
# This script resets the demo environment to a fresh state
# - Backs up current demo state
# - Reloads fresh demo data
# - Verifies data integrity
# - Reports status
#############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups/demo}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-fleetmanagement}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run SQL command
run_sql() {
    local sql="$1"
    if [ -n "$DB_PASSWORD" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql"
    fi
}

# Function to run SQL file
run_sql_file() {
    local file="$1"
    if [ -n "$DB_PASSWORD" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
    fi
}

# Function to backup current demo state
backup_demo_state() {
    print_info "Backing up current demo state..."

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    local backup_file="${BACKUP_DIR}/demo_backup_${TIMESTAMP}.sql"

    # Backup demo tenant data only
    if [ -n "$DB_PASSWORD" ]; then
        PGPASSWORD="$DB_PASSWORD" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --data-only \
            --inserts \
            -t "tenants" \
            -t "users" \
            -t "drivers" \
            -t "facilities" \
            -t "vehicles" \
            -t "work_orders" \
            -t "maintenance_schedules" \
            -t "fuel_transactions" \
            -t "routes" \
            -t "vendors" \
            -t "charging_stations" \
            -t "charging_sessions" \
            -t "geofences" \
            -t "policies" \
            -t "safety_incidents" \
            -t "inspections" \
            -t "inspection_forms" \
            -t "notifications" \
            > "$backup_file"
    else
        pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --data-only \
            --inserts \
            -t "tenants" \
            -t "users" \
            -t "drivers" \
            -t "facilities" \
            -t "vehicles" \
            -t "work_orders" \
            -t "maintenance_schedules" \
            -t "fuel_transactions" \
            -t "routes" \
            -t "vendors" \
            -t "charging_stations" \
            -t "charging_sessions" \
            -t "geofences" \
            -t "policies" \
            -t "safety_incidents" \
            -t "inspections" \
            -t "inspection_forms" \
            -t "notifications" \
            > "$backup_file"
    fi

    # Compress backup
    gzip "$backup_file"

    print_success "Backup created: ${backup_file}.gz"

    # Keep only last 10 backups
    print_info "Cleaning old backups (keeping last 10)..."
    ls -t "${BACKUP_DIR}"/demo_backup_*.sql.gz | tail -n +11 | xargs -r rm
}

# Function to verify database connection
verify_connection() {
    print_info "Verifying database connection..."

    if run_sql "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection verified"
        return 0
    else
        print_error "Cannot connect to database"
        print_error "Host: $DB_HOST, Port: $DB_PORT, Database: $DB_NAME, User: $DB_USER"
        return 1
    fi
}

# Function to load demo data
load_demo_data() {
    print_info "Loading fresh demo data..."

    local demo_data_file="${SCRIPT_DIR}/seed-demo-data.sql"

    if [ ! -f "$demo_data_file" ]; then
        print_error "Demo data file not found: $demo_data_file"
        return 1
    fi

    run_sql_file "$demo_data_file"

    print_success "Demo data loaded successfully"
}

# Function to verify data integrity
verify_data() {
    print_info "Verifying data integrity..."

    # Check counts
    local vehicle_count=$(run_sql "SELECT COUNT(*) FROM vehicles WHERE tenant_id = '11111111-1111-1111-1111-111111111111';" -t | xargs)
    local user_count=$(run_sql "SELECT COUNT(*) FROM users WHERE tenant_id = '11111111-1111-1111-1111-111111111111';" -t | xargs)
    local work_order_count=$(run_sql "SELECT COUNT(*) FROM work_orders WHERE tenant_id = '11111111-1111-1111-1111-111111111111';" -t | xargs)
    local fuel_count=$(run_sql "SELECT COUNT(*) FROM fuel_transactions WHERE tenant_id = '11111111-1111-1111-1111-111111111111';" -t | xargs)
    local route_count=$(run_sql "SELECT COUNT(*) FROM routes WHERE tenant_id = '11111111-1111-1111-1111-111111111111';" -t | xargs)

    echo ""
    print_info "Demo Data Summary:"
    echo "  Vehicles:          $vehicle_count (expected: 50)"
    echo "  Users:             $user_count (expected: 7)"
    echo "  Work Orders:       $work_order_count (expected: 30)"
    echo "  Fuel Transactions: $fuel_count (expected: ~100)"
    echo "  Routes:            $route_count (expected: 15)"
    echo ""

    # Verify expected counts
    if [ "$vehicle_count" -eq 50 ] && \
       [ "$user_count" -eq 7 ] && \
       [ "$work_order_count" -eq 30 ] && \
       [ "$route_count" -eq 15 ]; then
        print_success "Data integrity verified"
        return 0
    else
        print_warning "Data counts don't match expected values"
        return 1
    fi
}

# Function to clear old sessions
clear_sessions() {
    print_info "Clearing old user sessions..."

    # Reset failed login attempts
    run_sql "UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE tenant_id = '11111111-1111-1111-1111-111111111111';" > /dev/null

    print_success "User sessions cleared"
}

# Function to display demo credentials
show_credentials() {
    echo ""
    print_success "Demo Environment Ready!"
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}                  DEMO LOGIN CREDENTIALS                   ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Admin:${NC}"
    echo "  Email:    admin@demofleet.com"
    echo "  Password: Demo@123"
    echo ""
    echo -e "${GREEN}Fleet Manager:${NC}"
    echo "  Email:    manager@demofleet.com"
    echo "  Password: Demo@123"
    echo ""
    echo -e "${GREEN}Technician:${NC}"
    echo "  Email:    tech@demofleet.com"
    echo "  Password: Demo@123"
    echo ""
    echo -e "${GREEN}Drivers:${NC}"
    echo "  Email:    driver1@demofleet.com"
    echo "  Password: Demo@123"
    echo ""
    echo "  (driver2, driver3, driver4 also available)"
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Tip:${NC} See docs/DEMO_GUIDE.md for complete walkthrough"
    echo ""
}

# Main execution
main() {
    echo ""
    print_info "Fleet Management System - Demo Reset"
    echo ""

    # Parse command line arguments
    SKIP_BACKUP=false
    SKIP_VERIFY=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-verify)
                SKIP_VERIFY=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-backup    Skip backing up current data"
                echo "  --skip-verify    Skip data verification after load"
                echo "  --help, -h       Show this help message"
                echo ""
                echo "Environment Variables:"
                echo "  DB_HOST          Database host (default: localhost)"
                echo "  DB_PORT          Database port (default: 5432)"
                echo "  DB_NAME          Database name (default: fleetmanagement)"
                echo "  DB_USER          Database user (default: postgres)"
                echo "  DB_PASSWORD      Database password"
                echo "  BACKUP_DIR       Backup directory (default: ./backups/demo)"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Verify database connection
    if ! verify_connection; then
        exit 1
    fi

    # Backup current state (unless skipped)
    if [ "$SKIP_BACKUP" = false ]; then
        backup_demo_state
    else
        print_warning "Skipping backup (--skip-backup flag set)"
    fi

    # Load demo data
    if ! load_demo_data; then
        print_error "Failed to load demo data"
        exit 1
    fi

    # Clear sessions
    clear_sessions

    # Verify data (unless skipped)
    if [ "$SKIP_VERIFY" = false ]; then
        verify_data
    else
        print_warning "Skipping verification (--skip-verify flag set)"
    fi

    # Show credentials
    show_credentials

    print_success "Demo reset complete!"
    echo ""
}

# Run main function
main "$@"
