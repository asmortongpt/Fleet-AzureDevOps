#!/bin/bash

# Fleet Management System - Automated Health Check
# This script performs comprehensive health checks on all system components

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="fleet-management"
TIMEOUT=10

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Fleet Management Health Check${NC}"
echo -e "${BLUE}$(date)${NC}"
echo -e "${BLUE}================================${NC}\n"

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNED++))
}

# 1. Check Kubernetes connectivity
echo -e "${YELLOW}[1/10]${NC} Checking Kubernetes connectivity..."
if kubectl cluster-info > /dev/null 2>&1; then
    check_pass "Kubernetes cluster accessible"
else
    check_fail "Cannot connect to Kubernetes cluster"
    exit 1
fi

# 2. Check namespace exists
echo -e "\n${YELLOW}[2/10]${NC} Checking namespace..."
if kubectl get namespace $NAMESPACE > /dev/null 2>&1; then
    check_pass "Namespace '$NAMESPACE' exists"
else
    check_fail "Namespace '$NAMESPACE' not found"
    exit 1
fi

# 3. Check pod status
echo -e "\n${YELLOW}[3/10]${NC} Checking pod status..."
PODS=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null)

if [ -z "$PODS" ]; then
    check_fail "No pods found in namespace"
else
    echo "$PODS" | while read -r line; do
        POD_NAME=$(echo "$line" | awk '{print $1}')
        POD_STATUS=$(echo "$line" | awk '{print $3}')
        POD_READY=$(echo "$line" | awk '{print $2}')

        if [ "$POD_STATUS" == "Running" ]; then
            if [[ "$POD_READY" == *"/"* ]]; then
                READY=$(echo "$POD_READY" | cut -d'/' -f1)
                TOTAL=$(echo "$POD_READY" | cut -d'/' -f2)
                if [ "$READY" -eq "$TOTAL" ]; then
                    check_pass "Pod $POD_NAME is Running and Ready ($POD_READY)"
                else
                    check_warn "Pod $POD_NAME is Running but not all containers ready ($POD_READY)"
                fi
            else
                check_pass "Pod $POD_NAME is Running"
            fi
        else
            check_fail "Pod $POD_NAME is $POD_STATUS (not Running)"
        fi
    done
fi

# 4. Check services
echo -e "\n${YELLOW}[4/10]${NC} Checking services..."
SERVICES="fleet-api-service fleet-app-service fleet-postgres-service fleet-redis-service"

for SVC in $SERVICES; do
    if kubectl get svc $SVC -n $NAMESPACE > /dev/null 2>&1; then
        CLUSTER_IP=$(kubectl get svc $SVC -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
        check_pass "Service $SVC exists (ClusterIP: $CLUSTER_IP)"
    else
        check_fail "Service $SVC not found"
    fi
done

# 5. Check API health endpoint
echo -e "\n${YELLOW}[5/10]${NC} Checking API health endpoint..."

# Start port-forward in background
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
kubectl port-forward -n $NAMESPACE svc/fleet-api-service 3000:3000 > /dev/null 2>&1 &
PF_PID=$!
sleep 2

# Test health endpoint
if curl -s --max-time $TIMEOUT http://localhost:3000/api/health > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s --max-time $TIMEOUT http://localhost:3000/api/health)
    STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d':' -f2 | tr -d '"')

    if [ "$STATUS" == "healthy" ]; then
        check_pass "API health endpoint responsive (status: healthy)"
    else
        check_warn "API health endpoint responsive (status: $STATUS)"
    fi
else
    check_fail "API health endpoint not responding"
fi

# Cleanup port-forward
kill $PF_PID 2>/dev/null || true

# 6. Check API pod logs for errors
echo -e "\n${YELLOW}[6/10]${NC} Checking API logs for recent errors..."
ERROR_COUNT=$(kubectl logs --tail=100 -n $NAMESPACE deployment/fleet-api 2>/dev/null | grep -i "error" | wc -l | tr -d ' ')

if [ "$ERROR_COUNT" -eq 0 ]; then
    check_pass "No errors in recent API logs"
elif [ "$ERROR_COUNT" -lt 5 ]; then
    check_warn "Found $ERROR_COUNT error(s) in recent API logs"
else
    check_fail "Found $ERROR_COUNT errors in recent API logs (review needed)"
fi

# 7. Check database connectivity
echo -e "\n${YELLOW}[7/10]${NC} Checking database connectivity..."
DB_CHECK=$(kubectl exec -n $NAMESPACE deployment/fleet-api -- \
    node -e "const {Pool}=require('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL});pool.query('SELECT NOW()').then(r=>console.log('OK')).catch(e=>{console.log('FAIL');process.exit(1)});" 2>/dev/null)

if echo "$DB_CHECK" | grep -q "OK"; then
    check_pass "Database connectivity OK"
else
    check_fail "Cannot connect to database"
fi

# 8. Check Redis connectivity
echo -e "\n${YELLOW}[8/10]${NC} Checking Redis connectivity..."
REDIS_CHECK=$(kubectl exec -n $NAMESPACE fleet-redis-0 -- redis-cli ping 2>/dev/null || echo "FAIL")

if [ "$REDIS_CHECK" == "PONG" ]; then
    check_pass "Redis connectivity OK"
else
    check_fail "Cannot connect to Redis"
fi

# 9. Check resource usage
echo -e "\n${YELLOW}[9/10]${NC} Checking resource usage..."
if kubectl top pods -n $NAMESPACE > /dev/null 2>&1; then
    kubectl top pods -n $NAMESPACE | tail -n +2 | while read -r line; do
        POD_NAME=$(echo "$line" | awk '{print $1}')
        CPU=$(echo "$line" | awk '{print $2}' | sed 's/m//')
        MEMORY=$(echo "$line" | awk '{print $3}' | sed 's/Mi//')

        # Check if CPU is numeric
        if [[ "$CPU" =~ ^[0-9]+$ ]]; then
            if [ "$CPU" -lt 450 ]; then
                check_pass "Pod $POD_NAME: CPU ${CPU}m (healthy)"
            else
                check_warn "Pod $POD_NAME: CPU ${CPU}m (high usage)"
            fi
        fi

        # Check if Memory is numeric
        if [[ "$MEMORY" =~ ^[0-9]+$ ]]; then
            if [ "$MEMORY" -lt 450 ]; then
                check_pass "Pod $POD_NAME: Memory ${MEMORY}Mi (healthy)"
            else
                check_warn "Pod $POD_NAME: Memory ${MEMORY}Mi (high usage)"
            fi
        fi
    done
else
    check_warn "Metrics server not available (cannot check resource usage)"
fi

# 10. Check Application Insights connectivity
echo -e "\n${YELLOW}[10/10]${NC} Checking Application Insights configuration..."
AI_CONNECTION=$(kubectl get secret fleet-api-secrets -n $NAMESPACE -o jsonpath='{.data.APPLICATIONINSIGHTS_CONNECTION_STRING}' 2>/dev/null | base64 -d || echo "NOT_CONFIGURED")

if [[ "$AI_CONNECTION" == *"InstrumentationKey"* ]]; then
    check_pass "Application Insights connection string configured"
else
    check_warn "Application Insights not configured"
fi

# Summary
echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}Health Check Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Passed:${NC}  $CHECKS_PASSED"
echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNED"
echo -e "${RED}Failed:${NC}  $CHECKS_FAILED"
echo -e "${BLUE}================================${NC}"

# Overall status
if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNED -eq 0 ]; then
        echo -e "\n${GREEN}✓ Overall Status: HEALTHY${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}⚠ Overall Status: DEGRADED (warnings present)${NC}"
        exit 0
    fi
else
    echo -e "\n${RED}✗ Overall Status: UNHEALTHY (action required)${NC}"
    exit 1
fi
