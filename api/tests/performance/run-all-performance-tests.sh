#!/bin/bash

# Performance Testing Suite - Run All Tests
# This script runs all performance tests and generates a comprehensive report

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"
API_ROOT="$PROJECT_ROOT/api"
FRONTEND_ROOT="$PROJECT_ROOT"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="$SCRIPT_DIR/results_$TIMESTAMP"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fleet CTA - Performance Testing Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Results will be saved to: $RESULTS_DIR"
mkdir -p "$RESULTS_DIR"

# Check requirements
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js and npm found${NC}"

# Check if k6 is installed
if command -v k6 &> /dev/null; then
    echo -e "${GREEN}✓ k6 is installed${NC}"
    K6_AVAILABLE=true
else
    echo -e "${YELLOW}⚠ k6 is not installed${NC}"
    echo "   Load testing will be skipped"
    echo "   To install: brew install k6 (macOS) or https://k6.io/"
    K6_AVAILABLE=false
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Running Frontend Performance Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$FRONTEND_ROOT"

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
fi

echo -e "${YELLOW}Running Web Vitals Tests...${NC}"
npm run test:performance -- tests/performance/web-vitals.spec.ts 2>&1 | tee "$RESULTS_DIR/frontend-web-vitals.log" || true

echo ""
echo -e "${YELLOW}Running Component Rendering Tests...${NC}"
npm run test:performance -- tests/performance/component-rendering.spec.ts 2>&1 | tee "$RESULTS_DIR/frontend-component-rendering.log" || true

echo ""
echo -e "${YELLOW}Running Memory Profiling Tests...${NC}"
npm run test:performance -- tests/performance/memory-profiling.spec.ts 2>&1 | tee "$RESULTS_DIR/frontend-memory.log" || true

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Running Backend Performance Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$API_ROOT"

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo -e "${YELLOW}Running Endpoint Benchmarks...${NC}"
npm run test -- tests/performance/endpoint-benchmarks.test.ts 2>&1 | tee "$RESULTS_DIR/backend-endpoints.log" || true

echo ""
echo -e "${YELLOW}Running Database Query Benchmarks...${NC}"
npm run test -- tests/performance/database-query-benchmarks.test.ts 2>&1 | tee "$RESULTS_DIR/backend-database.log" || true

echo ""
echo -e "${YELLOW}Running Concurrent Request Tests...${NC}"
npm run test -- tests/performance/concurrent-requests.test.ts 2>&1 | tee "$RESULTS_DIR/backend-concurrent.log" || true

echo ""
echo -e "${YELLOW}Running Memory Profiling Tests...${NC}"
node --expose-gc node_modules/.bin/vitest run tests/performance/memory-profiling.test.ts 2>&1 | tee "$RESULTS_DIR/backend-memory.log" || true

# Load testing with k6 (if available)
if [ "$K6_AVAILABLE" = true ]; then
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Running k6 Load Tests${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    cd "$SCRIPT_DIR"

    echo -e "${YELLOW}Running Standard Load Test...${NC}"
    k6 run -o json="$RESULTS_DIR/load-test-results.json" load-test-k6.js 2>&1 | tee "$RESULTS_DIR/k6-load-test.log" || true

    echo ""
    echo -e "${YELLOW}Running Stress Test (this may take several minutes)...${NC}"
    echo -e "${YELLOW}You can cancel with Ctrl+C${NC}"
    k6 run -o json="$RESULTS_DIR/stress-test-results.json" stress-test-k6.js 2>&1 | tee "$RESULTS_DIR/k6-stress-test.log" || true
fi

# Generate summary report
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Generating Performance Report${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cat > "$RESULTS_DIR/PERFORMANCE_REPORT.md" << 'EOF'
# Performance Test Report

Generated: $(date)

## Summary

This report contains results from running the complete Fleet CTA performance testing suite.

### Test Categories

1. **Frontend Performance Tests**
   - Web Vitals measurements
   - Component rendering performance
   - Memory profiling and leak detection

2. **Backend Performance Tests**
   - API endpoint benchmarks
   - Database query performance
   - Concurrent request handling
   - Memory profiling

3. **Load Testing (k6)**
   - Standard load test (100 concurrent users)
   - Stress test (ramp to 1000 concurrent users)

## Log Files

### Frontend Tests
- `frontend-web-vitals.log` - Web Vitals test results
- `frontend-component-rendering.log` - Component rendering metrics
- `frontend-memory.log` - Frontend memory profiling

### Backend Tests
- `backend-endpoints.log` - API endpoint performance
- `backend-database.log` - Database query benchmarks
- `backend-concurrent.log` - Concurrent request handling
- `backend-memory.log` - Backend memory profiling

### Load Testing Results
- `k6-load-test.log` - Standard load test output
- `k6-stress-test.log` - Stress test output
- `load-test-results.json` - Load test JSON results
- `stress-test-results.json` - Stress test JSON results

## Baseline Comparison

Compare these results to the baselines in `PERFORMANCE_BASELINES.md`:

- Frontend Web Vitals targets
- API endpoint response time targets
- Database query performance targets
- Concurrent request handling limits
- Memory usage baselines

## Recommendations

1. **If tests are passing**: Great! Monitor these metrics over time.
2. **If tests are failing**: Investigate and fix regressions before merging.
3. **For slow endpoints**: Use query analysis to identify bottlenecks.
4. **For memory issues**: Use profiling data to identify leaks.

## Next Steps

1. Review each log file for detailed metrics
2. Compare against PERFORMANCE_BASELINES.md
3. File issues for any regressions
4. Commit changes if improvements are made

## References

- PERFORMANCE_BASELINES.md - Target metrics and baselines
- README.md - Detailed test documentation
EOF

echo -e "${GREEN}Report generated: $RESULTS_DIR/PERFORMANCE_REPORT.md${NC}"

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Performance Testing Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Results saved to: $RESULTS_DIR"
echo ""
echo "Log files generated:"
ls -lh "$RESULTS_DIR"/*.log 2>/dev/null || echo "  (No log files)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review results in: $RESULTS_DIR"
echo "2. Compare to baselines in: PERFORMANCE_BASELINES.md"
echo "3. For detailed info: README.md"
echo ""
