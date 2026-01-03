#!/bin/bash
#############################################################################
# Fleet Management System - Load Test Runner
#############################################################################
# Runs k6 load tests from inside a Kubernetes pod to access internal services
#############################################################################

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Fleet Management Load Testing${NC}"
echo "======================================"
echo ""

# Configuration
NAMESPACE="fleet-management"
API_SERVICE="http://fleet-api-service:3000"
RESULTS_DIR="/Users/andrewmorton/Documents/GitHub/Fleet/tests/load/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to run test in pod
run_test() {
    local test_name=$1
    local test_file=$2

    echo -e "${YELLOW}Running ${test_name}...${NC}"

    # Create a temporary pod with k6
    kubectl run k6-test-$TIMESTAMP \
        --image=grafana/k6:latest \
        --restart=Never \
        --namespace=$NAMESPACE \
        --env="API_URL=$API_SERVICE" \
        --command -- sleep 3600 &

    # Wait for pod to be ready
    sleep 10
    kubectl wait --for=condition=Ready pod/k6-test-$TIMESTAMP -n $NAMESPACE --timeout=60s

    # Copy test file to pod
    kubectl cp "$test_file" $NAMESPACE/k6-test-$TIMESTAMP:/tmp/test.js

    # Run the test
    kubectl exec -n $NAMESPACE k6-test-$TIMESTAMP -- k6 run /tmp/test.js

    # Get results
    echo -e "${GREEN}Test completed: ${test_name}${NC}"
    echo ""

    # Cleanup
    kubectl delete pod k6-test-$TIMESTAMP -n $NAMESPACE --wait=false

    sleep 2
}

# Run tests
echo "Test Suite: Fleet Management API Load Tests"
echo "API URL: $API_SERVICE"
echo "Timestamp: $TIMESTAMP"
echo ""

# Test 1: Baseline
if [ "${RUN_BASELINE:-yes}" = "yes" ]; then
    run_test "Baseline Performance Test" "/Users/andrewmorton/Documents/GitHub/Fleet/tests/load/baseline-test.js"
fi

# Test 2: Stress (optional)
if [ "${RUN_STRESS:-no}" = "yes" ]; then
    run_test "Stress Test" "/Users/andrewmorton/Documents/GitHub/Fleet/tests/load/stress-test.js"
fi

# Test 3: Spike (optional)
if [ "${RUN_SPIKE:-no}" = "yes" ]; then
    run_test "Spike Test" "/Users/andrewmorton/Documents/GitHub/Fleet/tests/load/spike-test.js"
fi

echo ""
echo -e "${GREEN}All load tests completed!${NC}"
echo "Results saved to: $RESULTS_DIR"
