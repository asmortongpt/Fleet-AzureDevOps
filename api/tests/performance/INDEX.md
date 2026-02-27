# Performance Testing Suite - File Index

## Overview
Complete performance benchmarking and load testing suite for Fleet CTA with 50+ tests covering frontend, backend, database, and load testing.

## Test Files

### Frontend Performance Tests (11 tests in 3 files)
Located: `/tests/performance/`

1. **web-vitals.spec.ts** (10 tests)
   - Measures Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
   - Navigation timing breakdown
   - Resource timing analysis
   - Paint timing metrics
   - Long task detection
   - Performance report generation

2. **component-rendering.spec.ts** (11 tests)
   - Time to Interactive (TTI)
   - Dashboard initial render
   - Large table rendering (1000 rows)
   - Re-render performance
   - Interaction responsiveness
   - Dropdown/select opening speed
   - Modal dialog opening
   - Animation frame rate monitoring
   - Form input latency
   - Page navigation timing
   - Scroll jank detection

3. **memory-profiling.spec.ts** (10 tests)
   - Initial heap measurement
   - Navigation memory tracking
   - DOM node count monitoring
   - Event listener memory impact
   - Cache growth monitoring
   - Detached DOM detection
   - Memory pressure under load
   - Third-party script impact
   - Garbage collection cycles
   - Memory statistics report

### Backend Performance Tests (20 tests in 4 files)
Located: `/api/tests/performance/`

1. **endpoint-benchmarks.test.ts** (10 tests)
   - Vehicles list endpoint (< 500ms)
   - Drivers list endpoint (< 500ms)
   - Fleet endpoint (< 500ms)
   - GPS tracking endpoint (< 300ms)
   - Telematics endpoint (< 500ms)
   - Fuel transactions endpoint (< 500ms)
   - Maintenance records endpoint (< 500ms)
   - Costs summary endpoint (< 500ms)
   - Search endpoint (< 1000ms)
   - Health check endpoint (< 100ms)
   - Performance report generation

2. **database-query-benchmarks.test.ts** (15 tests)
   - Simple SELECT queries
   - Vehicles table SELECT
   - Drivers table SELECT
   - Vehicle-driver JOINs
   - Multi-table JOINs
   - Aggregation queries
   - GROUP BY queries
   - Filtered queries
   - Ordered queries
   - Subqueries
   - DISTINCT operations
   - UNION operations
   - Index performance
   - Text search
   - Window functions
   - Performance report generation

3. **concurrent-requests.test.ts** (10 tests)
   - 10 concurrent users
   - 50 concurrent users
   - 100 concurrent users
   - 200 concurrent users
   - Sustained concurrent load
   - Mixed endpoint concurrency
   - Connection pooling efficiency
   - Burst traffic handling
   - Per-endpoint concurrency limits
   - Scaling patterns
   - Request timeout behavior

4. **memory-profiling.test.ts** (8 tests)
   - Initial heap footprint
   - Memory during repeated operations
   - Object creation/destruction cycles
   - Large buffer allocations
   - Event listener memory leaks
   - Cache growth monitoring
   - Detached DOM nodes
   - Garbage collection cycles
   - Memory statistics report

### Load Testing (k6 Scripts)
Located: `/api/tests/performance/`

1. **load-test-k6.js**
   - Standard load test
   - Ramps to 100 concurrent users
   - Tests vehicle, driver, GPS, fuel, maintenance, search endpoints
   - Measures response times, error rates, thresholds
   - Custom metrics: error rate, request duration, active connections

2. **stress-test-k6.js**
   - Stress test to find breaking points
   - Ramps to 1000 concurrent users
   - Tests all major endpoints
   - Identifies maximum throughput
   - Measures connection breaks and extreme load behavior

## Documentation Files

### Performance Baselines
**File**: `/api/tests/performance/PERFORMANCE_BASELINES.md`
- Established baseline metrics for all tests
- Performance targets (good, acceptable, poor)
- Regression thresholds (critical, warning, monitor)
- Testing methodology and execution guides
- CI/CD integration instructions

### Backend Performance README
**File**: `/api/tests/performance/README.md`
- Comprehensive guide to all backend performance tests
- Configuration and setup instructions
- Interpreting results guide
- Advanced testing techniques
- CI/CD integration examples
- Troubleshooting section

### Frontend Performance README
**File**: `/tests/performance/README.md`
- Comprehensive guide to frontend tests
- Web Vitals explanation and targets
- Component rendering performance details
- Memory profiling techniques
- Debugging performance issues
- Optimization tips

### Main Performance Testing Guide
**File**: `/PERFORMANCE_TESTING_GUIDE.md` (Root level)
- Quick start guide
- Overview of all test suites
- Test statistics (50+ tests)
- Running tests instructions
- Interpreting results
- CI/CD integration
- Performance optimization checklist

## Utility Files

### Metrics Collector
**File**: `/tests/performance/metrics-collector.ts`
- TypeScript utility for collecting performance metrics
- Methods for marking and measuring code sections
- Web Vitals collection
- Memory metrics collection
- Resource metrics collection
- Reporting and comparison functions
- CSV/JSON export functionality

### Test Runner Script
**File**: `/api/tests/performance/run-all-performance-tests.sh`
- Bash script to run all performance tests
- Runs frontend tests
- Runs backend tests
- Runs k6 load tests (if k6 is installed)
- Generates comprehensive report
- Saves results with timestamp
- Executable with shell commands

## Test Statistics

### Total Tests: 50+

**Frontend Tests**: 31
- Web Vitals: 10 tests
- Component Rendering: 11 tests
- Memory Profiling: 10 tests

**Backend Tests**: 38
- Endpoint Benchmarks: 10 tests
- Database Queries: 15 tests
- Concurrent Requests: 10 tests
- Memory Profiling: 8 tests

**Load Tests**: 2 (Comprehensive scripts)
- Standard Load Test
- Stress Test

## Running Tests

### All Frontend Tests
```bash
npm run test:performance
```

### All Backend Tests
```bash
cd api
npm run test -- tests/performance/
```

### Load Testing
```bash
cd api/tests/performance
k6 run load-test-k6.js
k6 run stress-test-k6.js
```

### Run Everything
```bash
cd api/tests/performance
./run-all-performance-tests.sh
```

## Performance Targets (Summary)

### Frontend
- LCP: < 2.5s
- FCP: < 1.8s
- CLS: < 0.1
- TTFB: < 600ms
- Initial Heap: < 100 MB

### API Endpoints
- List endpoints: < 500ms
- Detail endpoints: < 300ms
- Search: < 1000ms
- Health check: < 100ms

### Database
- Simple SELECT: < 100ms
- JOINs: < 300-500ms
- Aggregations: < 300ms
- Complex queries: < 500ms

### Load Testing
- Concurrent users: up to 1000
- Target error rate: < 1%
- P95 latency: < 1000ms
- P99 latency: < 2000ms

## Files Created Summary

```
tests/performance/
├── web-vitals.spec.ts           (10 tests)
├── component-rendering.spec.ts  (11 tests)
├── memory-profiling.spec.ts     (10 tests)
├── metrics-collector.ts         (Utility)
└── README.md                    (Documentation)

api/tests/performance/
├── endpoint-benchmarks.test.ts        (10 tests)
├── database-query-benchmarks.test.ts  (15 tests)
├── concurrent-requests.test.ts        (10 tests)
├── memory-profiling.test.ts           (8 tests)
├── load-test-k6.js                    (Load test)
├── stress-test-k6.js                  (Stress test)
├── run-all-performance-tests.sh       (Test runner)
├── PERFORMANCE_BASELINES.md           (Baselines)
├── README.md                          (Documentation)
└── INDEX.md                           (This file)

/
└── PERFORMANCE_TESTING_GUIDE.md       (Main guide)
```

## Next Steps

1. Start with `PERFORMANCE_TESTING_GUIDE.md` for overview
2. Review `PERFORMANCE_BASELINES.md` for target metrics
3. Run frontend tests: `npm run test:performance`
4. Run backend tests: `cd api && npm run test -- tests/performance/`
5. Run load tests: `cd api/tests/performance && k6 run load-test-k6.js`
6. Monitor metrics and track improvements over time

## Maintenance

- **Weekly**: Run tests on main branch
- **Before Release**: Run full load and stress tests
- **Monthly**: Review trends and update baselines
- **Quarterly**: Comprehensive performance audit

