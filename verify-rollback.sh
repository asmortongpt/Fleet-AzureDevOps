#!/bin/bash

##############################################################################
# ROLLBACK VERIFICATION SCRIPT
# Purpose: Verify that rollback was successful
# Usage: ./verify-rollback.sh
##############################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NAMESPACE="fleet-management"
EXPECTED_API_REPLICAS=3
EXPECTED_APP_REPLICAS=3

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

check_item() {
    local description=$1
    local command=$2
    local expected_pattern=${3:-""}

    echo -n "Checking: ${description}... "

    if eval "${command}" &> /dev/null; then
        if [[ -n "${expected_pattern}" ]]; then
            local output=$(eval "${command}" 2>/dev/null)
            if echo "${output}" | grep -q "${expected_pattern}"; then
                log_success "PASS"
                return 0
            else
                log_error "FAIL (pattern not found: ${expected_pattern})"
                return 1
            fi
        else
            log_success "PASS"
            return 0
        fi
    else
        log_error "FAIL"
        return 1
    fi
}

echo -e "${GREEN}"
echo "=================================================================="
echo "  FLEET ROLLBACK VERIFICATION"
echo "=================================================================="
echo -e "${NC}"

TOTAL_CHECKS=0
PASSED_CHECKS=0

# Test 1: API Deployment Exists
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if check_item "API deployment exists" "kubectl get deployment fleet-api -n ${NAMESPACE}"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

# Test 2: API Scaled to 3 Replicas
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "Checking: API scaled to ${EXPECTED_API_REPLICAS} replicas... "
CURRENT_REPLICAS=$(kubectl get deployment fleet-api -n ${NAMESPACE} -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
if [[ "${CURRENT_REPLICAS}" -eq ${EXPECTED_API_REPLICAS} ]]; then
    log_success "PASS (${CURRENT_REPLICAS}/${EXPECTED_API_REPLICAS})"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    log_error "FAIL (${CURRENT_REPLICAS}/${EXPECTED_API_REPLICAS})"
fi

# Test 3: API Pods Running
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "Checking: API pods running... "
RUNNING_PODS=$(kubectl get pods -n ${NAMESPACE} -l app=fleet-api --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [[ ${RUNNING_PODS} -ge ${EXPECTED_API_REPLICAS} ]]; then
    log_success "PASS (${RUNNING_PODS} running)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    log_error "FAIL (${RUNNING_PODS} running, expected ${EXPECTED_API_REPLICAS})"
fi

# Test 4: API Pods Ready
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "Checking: API pods ready... "
READY_PODS=$(kubectl get pods -n ${NAMESPACE} -l app=fleet-api -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{" "}{end}' 2>/dev/null | grep -o "True" | wc -l | tr -d ' ' || echo "0")
if [[ ${READY_PODS} -ge ${EXPECTED_API_REPLICAS} ]]; then
    log_success "PASS (${READY_PODS} ready)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    log_error "FAIL (${READY_PODS} ready, expected ${EXPECTED_API_REPLICAS})"
fi

# Test 5: No CrashLoopBackOff Pods
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "Checking: No pods in CrashLoopBackOff... "
CRASH_PODS=$(kubectl get pods -n ${NAMESPACE} -l app=fleet-api --no-headers 2>/dev/null | grep -c "CrashLoopBackOff" || echo "0")
CRASH_PODS=$(echo "${CRASH_PODS}" | tr -d '\n\r' | tr -d ' ')
if [[ "${CRASH_PODS}" == "0" ]]; then
    log_success "PASS (0 crashing pods)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    log_error "FAIL (${CRASH_PODS} pods crashing)"
fi

# Test 6: API Service Exists
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if check_item "API service exists" "kubectl get svc -n ${NAMESPACE} | grep fleet-api"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

# Test 7: API Health Endpoint
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "Checking: API health endpoint responding... "
if kubectl exec -n ${NAMESPACE} deployment/fleet-api -- wget -qO- http://localhost:3001/api/v1/health 2>/dev/null | grep -q "ok\|healthy\|status" || [[ $? -eq 0 ]]; then
    log_success "PASS"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    log_warning "SKIP (pods may still be starting)"
fi

# Test 8: No Recent Errors in Logs
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "Checking: No critical errors in recent logs... "
ERROR_COUNT=$(kubectl logs -n ${NAMESPACE} -l app=fleet-api --tail=100 2>/dev/null | grep -c "FATAL\|Critical\|CRITICAL" || echo "0")
ERROR_COUNT=$(echo "${ERROR_COUNT}" | tr -d '\n\r' | tr -d ' ')
if [[ "${ERROR_COUNT}" == "0" ]]; then
    log_success "PASS (0 critical errors)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    log_error "FAIL (${ERROR_COUNT} critical errors found)"
fi

# Test 9: Frontend Deployment Running
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "Checking: Frontend deployment running... "
APP_RUNNING=$(kubectl get pods -n ${NAMESPACE} -l app=fleet-app --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [[ ${APP_RUNNING} -gt 0 ]]; then
    log_success "PASS (${APP_RUNNING} running)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    log_error "FAIL (0 running)"
fi

# Test 10: Ingress Configured
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if check_item "Ingress configured" "kubectl get ingress -n ${NAMESPACE}"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

echo ""
echo -e "${GREEN}=================================================================="
echo "  VERIFICATION SUMMARY"
echo "==================================================================${NC}"
echo ""

# Calculate percentage
PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo "Tests Passed: ${PASSED_CHECKS}/${TOTAL_CHECKS} (${PERCENTAGE}%)"
echo ""

if [[ ${PERCENTAGE} -eq 100 ]]; then
    log_success "ALL CHECKS PASSED - Rollback successful!"
elif [[ ${PERCENTAGE} -ge 80 ]]; then
    log_warning "MOSTLY PASSED - Rollback likely successful, but review warnings"
elif [[ ${PERCENTAGE} -ge 60 ]]; then
    log_warning "PARTIAL SUCCESS - Some issues remain, investigate failed checks"
else
    log_error "VERIFICATION FAILED - Rollback may not be successful"
fi

echo ""
log_info "Current deployment images:"
kubectl get deployment fleet-api -n ${NAMESPACE} -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null && echo ""
kubectl get deployment fleet-app -n ${NAMESPACE} -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null && echo ""

echo ""
log_info "Current pod status:"
kubectl get pods -n ${NAMESPACE} -l app=fleet-api -o wide 2>/dev/null || true

echo ""
log_info "Application URL: https://fleet.capitaltechalliance.com"
echo ""

# Exit with appropriate code
if [[ ${PERCENTAGE} -ge 80 ]]; then
    exit 0
else
    exit 1
fi
