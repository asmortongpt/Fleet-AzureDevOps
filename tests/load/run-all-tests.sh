#!/bin/bash

# Fleet-CTA Load Testing Suite
# Comprehensive load and stress testing runner

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3001}"
RESULTS_DIR="$(dirname "$0")/results"
REPORTS_DIR="$(dirname "$0")/reports"
LOGS_DIR="$(dirname "$0")/logs"

# Create directories
mkdir -p "$RESULTS_DIR" "$REPORTS_DIR" "$LOGS_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fleet-CTA Load Testing Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Results: $RESULTS_DIR"
echo "  Reports: $REPORTS_DIR"
echo ""

# Function to run a test
run_test() {
  local test_name=$1
  local test_file=$2
  local test_type=${3:-"normal"}

  echo -e "${YELLOW}Running: $test_name${NC}"
  echo "File: $test_file"
  echo "Start time: $(date)"

  local timestamp=$(date +%Y%m%d-%H%M%S)
  local result_file="$RESULTS_DIR/${test_type}-${timestamp}.json"

  # Check if file is K6 or Artillery
  if [[ $test_file == *.js ]]; then
    # K6 test
    if ! command -v k6 &> /dev/null; then
      echo -e "${RED}Error: k6 not found. Please install K6 first.${NC}"
      echo "Installation: brew install k6"
      return 1
    fi

    echo "Running K6 test: $test_file"
    k6 run "$test_file" \
      --out json="$result_file" \
      --env BASE_URL="$BASE_URL" \
      2>&1 | tee "$LOGS_DIR/${test_type}-${timestamp}.log"
  else
    # Artillery test
    if ! command -v artillery &> /dev/null; then
      echo -e "${RED}Error: Artillery not found. Please install Artillery first.${NC}"
      echo "Installation: npm install -g artillery"
      return 1
    fi

    echo "Running Artillery test: $test_file"
    BASE_URL="$BASE_URL" artillery run "$test_file" \
      --output "$result_file" \
      2>&1 | tee "$LOGS_DIR/${test_type}-${timestamp}.log"
  fi

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test passed: $test_name${NC}"
    return 0
  else
    echo -e "${RED}✗ Test failed: $test_name${NC}"
    return 1
  fi
}

# Pre-flight checks
echo -e "${YELLOW}Pre-flight Checks${NC}"
echo "Checking backend connectivity..."
if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
  echo -e "${RED}Error: Backend not responding at $BASE_URL${NC}"
  echo "Please start the backend: npm run dev"
  exit 1
fi
echo -e "${GREEN}✓ Backend is responding${NC}"
echo ""

# Parse command line arguments
if [ $# -eq 0 ]; then
  # Run all tests in sequence
  echo -e "${BLUE}Running all tests in sequence${NC}"
  echo ""

  # Scenario tests
  echo -e "${BLUE}=== Scenario Tests ===${NC}"
  run_test "Normal Load Test" "$(dirname "$0")/scenarios/load-normal.js" "normal"
  sleep 30

  run_test "Spike Test" "$(dirname "$0")/scenarios/load-spike.js" "spike"
  sleep 30

  run_test "Stress Test" "$(dirname "$0")/scenarios/load-stress.js" "stress"
  sleep 30

  run_test "Endurance Test" "$(dirname "$0")/scenarios/load-endurance.js" "endurance"
  sleep 30

  # API tests
  echo ""
  echo -e "${BLUE}=== API Tests ===${NC}"
  run_test "Vehicles API Test" "$(dirname "$0")/api/vehicles.js" "api-vehicles"
  sleep 10

  run_test "Drivers API Test" "$(dirname "$0")/api/drivers.js" "api-drivers"
  sleep 10

  run_test "Database Test" "$(dirname "$0")/api/database.js" "api-database"
  sleep 10

else
  # Run specific test
  case "$1" in
    normal)
      run_test "Normal Load Test" "$(dirname "$0")/scenarios/load-normal.js" "normal"
      ;;
    spike)
      run_test "Spike Test" "$(dirname "$0")/scenarios/load-spike.js" "spike"
      ;;
    stress)
      run_test "Stress Test" "$(dirname "$0")/scenarios/load-stress.js" "stress"
      ;;
    endurance)
      run_test "Endurance Test" "$(dirname "$0")/scenarios/load-endurance.js" "endurance"
      ;;
    api-vehicles)
      run_test "Vehicles API Test" "$(dirname "$0")/api/vehicles.js" "api-vehicles"
      ;;
    api-drivers)
      run_test "Drivers API Test" "$(dirname "$0")/api/drivers.js" "api-drivers"
      ;;
    api-database)
      run_test "Database Test" "$(dirname "$0")/api/database.js" "api-database"
      ;;
    *)
      echo -e "${RED}Unknown test: $1${NC}"
      echo "Available tests:"
      echo "  normal         - Normal load test (gradual ramp)"
      echo "  spike          - Spike test (sudden traffic increase)"
      echo "  stress         - Stress test (ramp to breaking point)"
      echo "  endurance      - Endurance test (1 hour sustained)"
      echo "  api-vehicles   - Vehicles API test"
      echo "  api-drivers    - Drivers API test"
      echo "  api-database   - Database load test"
      exit 1
      ;;
  esac
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Execution Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Results directory: $RESULTS_DIR"
echo "Logs directory: $LOGS_DIR"
echo ""
echo "Next steps:"
echo "  1. Review results: ls -lah $RESULTS_DIR"
echo "  2. Check logs: ls -lah $LOGS_DIR"
echo "  3. Analyze metrics: npm run load:analyze"
echo ""
