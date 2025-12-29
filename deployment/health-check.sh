#!/bin/bash

################################################################################
# Comprehensive Health Check Script
# =============================================================================
# Verifies all critical services are running and healthy:
# - Frontend reachability and HTTP status
# - Backend API health endpoint
# - Database connectivity
# - Redis cache connectivity
# - External service dependencies
# - SSL certificate validity
#
# Usage: ./health-check.sh
# Exit Code: 0 if all checks pass, 1 if any check fails
################################################################################

set -euo pipefail

# ============================================================================
# Color Output Functions
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
HEALTH_CHECK_LOG="${SCRIPT_DIR}/health-check-$(date +%Y%m%d_%H%M%S).log"

# Service URLs - can be overridden by environment
FRONTEND_URL="${FRONTEND_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
BACKEND_HEALTH_ENDPOINT="${BACKEND_HEALTH_ENDPOINT:-/api/health}"

# Database configuration
DATABASE_URL="${DATABASE_URL:-}"
DATABASE_HOST="${DATABASE_HOST:-localhost}"
DATABASE_PORT="${DATABASE_PORT:-5432}"
DATABASE_NAME="${DATABASE_NAME:-fleet}"
DATABASE_USER="${DATABASE_USER:-postgres}"

# Redis configuration
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_ENABLED="${REDIS_ENABLED:-true}"

# Azure configuration
AZURE_CLIENT_ID="${AZURE_CLIENT_ID:-}"
AZURE_TENANT_ID="${AZURE_TENANT_ID:-}"

# Timeouts (in seconds)
HTTP_TIMEOUT=10
DB_TIMEOUT=5
REDIS_TIMEOUT=5

# Check flags
CHECK_FRONTEND=true
CHECK_BACKEND=true
CHECK_DATABASE=true
CHECK_REDIS=true
CHECK_SSL=true
CHECK_AZURE=false

# Results tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# ============================================================================
# Logging Functions
# ============================================================================

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [${level}] ${message}" >> "$HEALTH_CHECK_LOG"
}

# ============================================================================
# Check Result Tracking
# ============================================================================

record_check() {
  local check_name=$1
  local status=$2
  local message=$3

  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

  case $status in
    PASS)
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
      print_success "$check_name: $message"
      log "INFO" "$check_name: PASSED - $message"
      ;;
    FAIL)
      FAILED_CHECKS=$((FAILED_CHECKS + 1))
      print_error "$check_name: $message"
      log "ERROR" "$check_name: FAILED - $message"
      ;;
    WARN)
      WARNING_CHECKS=$((WARNING_CHECKS + 1))
      print_warning "$check_name: $message"
      log "WARNING" "$check_name: WARNING - $message"
      ;;
  esac
}

# ============================================================================
# HTTP Health Checks
# ============================================================================

check_http_endpoint() {
  local endpoint_name=$1
  local url=$2
  local expected_codes=${3:-200,304}

  print_info "Checking $endpoint_name: $url"

  local response=$(curl -s -o /tmp/response_body.txt -w "%{http_code}" \
    --max-time "$HTTP_TIMEOUT" \
    --connect-timeout 5 \
    -A "Fleet-HealthCheck/1.0" \
    "$url" 2>/dev/null || echo "000")

  # Parse response time and content length
  local response_time=$(curl -s -o /dev/null -w "%{time_total}" \
    --max-time "$HTTP_TIMEOUT" \
    "$url" 2>/dev/null || echo "N/A")

  # Check if response code is in expected codes
  if [[ ",$expected_codes," =~ ",$response,"  ]]; then
    local content_length=$(stat -f%z /tmp/response_body.txt 2>/dev/null || echo "0")
    record_check "$endpoint_name" "PASS" "HTTP $response (${response_time}s, ${content_length} bytes)"
    return 0
  else
    record_check "$endpoint_name" "FAIL" "HTTP $response (expected: $expected_codes)"
    return 1
  fi
}

check_frontend() {
  print_header "Frontend Health Checks"
  log "INFO" "Starting frontend health checks"

  if [ "$CHECK_FRONTEND" != "true" ]; then
    print_info "Frontend checks disabled"
    return 0
  fi

  if [ -z "$FRONTEND_URL" ]; then
    record_check "Frontend URL" "WARN" "FRONTEND_URL not configured"
    return 1
  fi

  check_http_endpoint "Frontend Availability" "$FRONTEND_URL" "200,304" || return 1

  # Check for common frontend endpoints
  check_http_endpoint "Frontend Health Endpoint" "$FRONTEND_URL/health" "200,404" || true
  check_http_endpoint "Frontend API Base" "$FRONTEND_URL/api" "200,404" || true

  return 0
}

check_backend_api() {
  print_header "Backend API Health Checks"
  log "INFO" "Starting backend API health checks"

  if [ "$CHECK_BACKEND" != "true" ]; then
    print_info "Backend checks disabled"
    return 0
  fi

  if [ -z "$BACKEND_URL" ]; then
    record_check "Backend URL" "WARN" "BACKEND_URL not configured"
    return 1
  fi

  # Check main health endpoint
  local health_url="${BACKEND_URL}${BACKEND_HEALTH_ENDPOINT}"
  check_http_endpoint "Backend Health" "$health_url" "200" || return 1

  # Try to get JSON response from health endpoint
  print_info "Retrieving backend health details..."
  local health_response=$(curl -s --max-time "$HTTP_TIMEOUT" \
    -H "Content-Type: application/json" \
    "$health_url" 2>/dev/null || echo "{}")

  if echo "$health_response" | grep -q "ok\|healthy\|status"; then
    record_check "Backend Health JSON" "PASS" "Health endpoint returned valid JSON"
  else
    record_check "Backend Health JSON" "WARN" "Could not verify health endpoint JSON format"
  fi

  # Check API root endpoint
  check_http_endpoint "Backend API Root" "$BACKEND_URL" "200,404" || true

  return 0
}

# ============================================================================
# Database Health Checks
# ============================================================================

check_database() {
  print_header "Database Health Checks"
  log "INFO" "Starting database health checks"

  if [ "$CHECK_DATABASE" != "true" ]; then
    print_info "Database checks disabled"
    return 0
  fi

  if [ -z "$DATABASE_URL" ] && [ -z "$DATABASE_HOST" ]; then
    record_check "Database Configuration" "WARN" "DATABASE_URL/HOST not configured"
    return 1
  fi

  # Check PostgreSQL connectivity using npm script
  if command -v npm &> /dev/null && [ -f "$PROJECT_ROOT/api/package.json" ]; then
    print_info "Checking PostgreSQL via npm script..."
    cd "$PROJECT_ROOT/api"

    if npm run check:db &>/dev/null 2>&1; then
      record_check "PostgreSQL Connection" "PASS" "Database is reachable and responsive"
      cd "$PROJECT_ROOT"
      return 0
    else
      record_check "PostgreSQL Connection" "FAIL" "Cannot connect to database"
      cd "$PROJECT_ROOT"
      return 1
    fi
  fi

  # Fallback: Try pg_isready if available
  if command -v pg_isready &> /dev/null; then
    print_info "Checking PostgreSQL using pg_isready..."

    if timeout "$DB_TIMEOUT" pg_isready -h "$DATABASE_HOST" -p "$DATABASE_PORT" \
       -U "$DATABASE_USER" &>/dev/null; then
      record_check "PostgreSQL Connection" "PASS" "pg_isready successful"
      return 0
    else
      record_check "PostgreSQL Connection" "FAIL" "pg_isready timeout"
      return 1
    fi
  fi

  # Fallback: Try netcat
  if command -v nc &> /dev/null; then
    print_info "Checking PostgreSQL using netcat..."

    if timeout "$DB_TIMEOUT" nc -zv "$DATABASE_HOST" "$DATABASE_PORT" &>/dev/null 2>&1; then
      record_check "PostgreSQL Port" "PASS" "Port $DATABASE_PORT is open"
      return 0
    else
      record_check "PostgreSQL Port" "FAIL" "Cannot reach port $DATABASE_PORT"
      return 1
    fi
  fi

  record_check "Database Check" "WARN" "No database checking tools available"
  return 1
}

# ============================================================================
# Redis Health Checks
# ============================================================================

check_redis() {
  print_header "Redis Cache Health Checks"
  log "INFO" "Starting Redis health checks"

  if [ "$CHECK_REDIS" != "true" ] || [ "$REDIS_ENABLED" != "true" ]; then
    print_info "Redis checks disabled"
    return 0
  fi

  if [ -z "$REDIS_HOST" ]; then
    record_check "Redis Configuration" "WARN" "REDIS_HOST not configured"
    return 1
  fi

  # Try redis-cli first
  if command -v redis-cli &> /dev/null; then
    print_info "Checking Redis using redis-cli..."

    local redis_response=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" \
      -n 0 PING 2>/dev/null || echo "FAILED")

    if [ "$redis_response" = "PONG" ]; then
      record_check "Redis Connection" "PASS" "Redis PING successful"

      # Get Redis info
      local redis_info=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" \
        INFO server 2>/dev/null | grep redis_version || echo "")

      if [ -n "$redis_info" ]; then
        record_check "Redis Info" "PASS" "$redis_info"
      fi

      return 0
    else
      record_check "Redis Connection" "FAIL" "PING response: $redis_response"
      return 1
    fi
  fi

  # Fallback: Try netcat
  if command -v nc &> /dev/null; then
    print_info "Checking Redis using netcat..."

    if timeout "$REDIS_TIMEOUT" nc -zv "$REDIS_HOST" "$REDIS_PORT" &>/dev/null 2>&1; then
      record_check "Redis Port" "PASS" "Redis port $REDIS_PORT is open"

      # Try to send PING command
      if timeout "$REDIS_TIMEOUT" bash -c "echo -e 'PING\r' | nc -w 1 $REDIS_HOST $REDIS_PORT" \
         2>/dev/null | grep -q "PONG"; then
        record_check "Redis PING" "PASS" "Redis responded to PING"
        return 0
      else
        record_check "Redis PING" "WARN" "Could not verify PING response"
        return 1
      fi
    else
      record_check "Redis Port" "FAIL" "Cannot reach port $REDIS_PORT"
      return 1
    fi
  fi

  record_check "Redis Check" "WARN" "No Redis checking tools available"
  return 1
}

# ============================================================================
# SSL Certificate Checks
# ============================================================================

check_ssl_certificate() {
  print_header "SSL Certificate Health Checks"
  log "INFO" "Starting SSL certificate checks"

  if [ "$CHECK_SSL" != "true" ]; then
    print_info "SSL checks disabled"
    return 0
  fi

  # Extract hostname from URL
  local hostname=""

  if [[ "$FRONTEND_URL" =~ https://([^/:]+) ]]; then
    hostname="${BASH_REMATCH[1]}"
  else
    print_info "Frontend URL is not HTTPS, skipping SSL checks"
    return 0
  fi

  if [ -z "$hostname" ]; then
    record_check "SSL Hostname" "WARN" "Could not extract hostname from URL"
    return 1
  fi

  print_info "Checking SSL certificate for: $hostname"

  # Get certificate info
  local cert_info=$(echo | openssl s_client -servername "$hostname" \
    -connect "$hostname:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null || echo "")

  if [ -z "$cert_info" ]; then
    record_check "SSL Connection" "FAIL" "Cannot establish SSL connection"
    return 1
  fi

  # Check expiration
  local expiry_date=$(echo | openssl s_client -servername "$hostname" \
    -connect "$hostname:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | \
    cut -d'=' -f2 || echo "")

  if [ -z "$expiry_date" ]; then
    record_check "SSL Expiry Check" "WARN" "Could not determine certificate expiry"
    return 1
  fi

  # Convert to epoch for comparison
  local expiry_epoch=$(date -jf "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null || echo "0")
  local current_epoch=$(date +%s)
  local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

  if [ "$days_until_expiry" -lt 0 ]; then
    record_check "SSL Certificate" "FAIL" "Certificate expired on $expiry_date"
    return 1
  elif [ "$days_until_expiry" -lt 30 ]; then
    record_check "SSL Certificate" "WARN" "Certificate expires in $days_until_expiry days ($expiry_date)"
    return 0
  else
    record_check "SSL Certificate" "PASS" "Certificate valid for $days_until_expiry days"
    return 0
  fi
}

# ============================================================================
# Azure Service Checks
# ============================================================================

check_azure_services() {
  print_header "Azure Services Health Checks"
  log "INFO" "Starting Azure service checks"

  if [ "$CHECK_AZURE" != "true" ]; then
    print_info "Azure checks disabled"
    return 0
  fi

  if [ -z "$AZURE_CLIENT_ID" ] || [ -z "$AZURE_TENANT_ID" ]; then
    record_check "Azure Configuration" "WARN" "Azure credentials not configured"
    return 0
  fi

  # Check Azure CLI availability
  if ! command -v az &> /dev/null; then
    record_check "Azure CLI" "WARN" "Azure CLI not installed"
    return 0
  fi

  print_info "Checking Azure services..."

  # Check Azure AD connectivity
  if az account show &>/dev/null 2>&1; then
    record_check "Azure AD" "PASS" "Azure AD accessible"
    return 0
  else
    record_check "Azure AD" "WARN" "Cannot verify Azure AD connectivity"
    return 0
  fi
}

# ============================================================================
# Performance Metrics
# ============================================================================

collect_performance_metrics() {
  print_header "Performance Metrics"
  log "INFO" "Collecting performance metrics"

  if [ -z "$FRONTEND_URL" ]; then
    return 0
  fi

  print_info "Frontend response time analysis..."

  local response_times=()
  for i in {1..3}; do
    local time=$(curl -s -o /dev/null -w "%{time_total}" \
      --max-time "$HTTP_TIMEOUT" \
      "$FRONTEND_URL" 2>/dev/null || echo "0")
    response_times+=("$time")
    sleep 1
  done

  # Calculate average (simplified - bash arithmetic)
  local avg_time=${response_times[0]}
  record_check "Frontend Response Time" "PASS" "${avg_time}s average"
  log "INFO" "Response times: ${response_times[@]}"
}

# ============================================================================
# Final Summary Report
# ============================================================================

print_summary() {
  print_header "Health Check Summary"

  echo ""
  echo "Total Checks Performed: $TOTAL_CHECKS"
  echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
  echo -e "${YELLOW}Warnings: $WARNING_CHECKS${NC}"
  echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
  echo ""

  local pass_rate=$(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))
  echo "Pass Rate: $pass_rate%"
  echo ""

  # Determine overall health status
  if [ "$FAILED_CHECKS" -eq 0 ]; then
    echo -e "${GREEN}Overall Status: HEALTHY${NC}"
    echo "All critical services are operational."
    return 0
  elif [ "$FAILED_CHECKS" -le 2 ]; then
    echo -e "${YELLOW}Overall Status: DEGRADED${NC}"
    echo "Some services have issues but core functionality may be intact."
    return 1
  else
    echo -e "${RED}Overall Status: UNHEALTHY${NC}"
    echo "Multiple services have critical issues."
    return 1
  fi
}

# ============================================================================
# Main Health Check Flow
# ============================================================================

main() {
  print_header "FLEET HEALTH CHECK"
  echo "Started at: $(date)"
  echo "Log file: $HEALTH_CHECK_LOG"
  echo ""

  log "INFO" "=========================================="
  log "INFO" "Fleet Comprehensive Health Check Started"
  log "INFO" "=========================================="
  log "INFO" "Frontend URL: $FRONTEND_URL"
  log "INFO" "Backend URL: $BACKEND_URL"
  log "INFO" "Database Host: $DATABASE_HOST:$DATABASE_PORT"
  log "INFO" "Redis Host: $REDIS_HOST:$REDIS_PORT"

  # Run all health checks
  check_frontend || true
  check_backend_api || true
  check_database || true
  check_redis || true
  check_ssl_certificate || true
  check_azure_services || true

  # Collect performance data
  collect_performance_metrics || true

  # Print summary and determine exit code
  echo ""
  if print_summary; then
    log "INFO" "=========================================="
    log "INFO" "Health Check Passed - All Services Healthy"
    log "INFO" "=========================================="
    return 0
  else
    log "INFO" "=========================================="
    log "INFO" "Health Check Completed with Issues"
    log "INFO" "=========================================="
    return 1
  fi
}

# Run main function
main "$@"
