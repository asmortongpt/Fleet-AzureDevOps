#!/bin/bash

# Fleet Management System - Run Load Tests Locally
# This script runs k6 load tests against the Fleet API via port-forward

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Fleet Management System - Load Testing ===${NC}\n"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 is not installed${NC}"
    echo "Install with: brew install k6"
    exit 1
fi

# Check if kubectl is configured
if ! kubectl get ns fleet-management &> /dev/null; then
    echo -e "${RED}Error: kubectl not configured or fleet-management namespace not found${NC}"
    exit 1
fi

# Check if API pod is running
if ! kubectl get pods -n fleet-management | grep -q "fleet-api.*Running"; then
    echo -e "${RED}Error: fleet-api pod is not running${NC}"
    kubectl get pods -n fleet-management
    exit 1
fi

echo -e "${YELLOW}Starting port-forward to fleet-api service...${NC}"

# Kill any existing port-forwards on 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start port-forward in background
kubectl port-forward -n fleet-management svc/fleet-api-service 3000:3000 > /dev/null 2>&1 &
PORT_FORWARD_PID=$!

# Wait for port-forward to be ready
sleep 3

# Test API connectivity
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✓ API is accessible at http://localhost:3000${NC}\n"
else
    echo -e "${RED}Error: Cannot connect to API${NC}"
    kill $PORT_FORWARD_PID 2>/dev/null || true
    exit 1
fi

# Create results directory
mkdir -p /Users/andrewmorton/Documents/GitHub/Fleet/tests/load/results

# Run tests
cd /Users/andrewmorton/Documents/GitHub/Fleet/tests/load

echo -e "${YELLOW}[1/3] Running Baseline Performance Test...${NC}\n"

k6 run \
  --env API_URL=http://localhost:3000 \
  --out json=results/baseline-results.json \
  baseline-test.js \
  2>&1 | tee results/baseline-output.txt

BASELINE_EXIT_CODE=${PIPESTATUS[0]}

sleep 5

echo -e "\n${YELLOW}[2/3] Running Stress Test...${NC}\n"

k6 run \
  --env API_URL=http://localhost:3000 \
  --out json=results/stress-results.json \
  stress-test.js \
  2>&1 | tee results/stress-output.txt

STRESS_EXIT_CODE=${PIPESTATUS[0]}

sleep 5

echo -e "\n${YELLOW}[3/3] Running Spike Test...${NC}\n"

k6 run \
  --env API_URL=http://localhost:3000 \
  --out json=results/spike-results.json \
  spike-test.js \
  2>&1 | tee results/spike-output.txt

SPIKE_EXIT_CODE=${PIPESTATUS[0]}

# Cleanup
echo -e "\n${YELLOW}Stopping port-forward...${NC}"
kill $PORT_FORWARD_PID 2>/dev/null || true

# Summary
echo -e "\n${GREEN}=== Load Testing Complete ===${NC}\n"
echo "Results saved to: /Users/andrewmorton/Documents/GitHub/Fleet/tests/load/results/"
echo ""
echo "Test Results:"
echo "  Baseline Test: $([ $BASELINE_EXIT_CODE -eq 0 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  Stress Test:   $([ $STRESS_EXIT_CODE -eq 0 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  Spike Test:    $([ $SPIKE_EXIT_CODE -eq 0 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo ""
echo "View detailed results:"
echo "  cat results/baseline-output.txt"
echo "  cat results/stress-output.txt"
echo "  cat results/spike-output.txt"
