# Fleet CTA - Performance Testing Guide

Complete guide to the comprehensive performance benchmarking and load testing suite.

## Overview

This guide covers the performance testing infrastructure for Fleet CTA, which includes:

- **50+ Performance Tests** across frontend, backend, and database
- **Web Vitals Measurement** using Playwright
- **Component Performance Testing** for React components
- **Memory Profiling** for leak detection
- **API Endpoint Benchmarking**
- **Database Query Performance Testing**
- **Concurrent Request Handling**
- **Load Testing with k6** (100-1000 concurrent users)
- **Stress Testing** to find breaking points

## Quick Start

### For Frontend Performance

```bash
# Start the dev server
npm run dev

# In another terminal, run frontend tests
npm run test:performance

# Run specific test suite
npm run test:performance -- tests/performance/web-vitals.spec.ts
npm run test:performance -- tests/performance/component-rendering.spec.ts
npm run test:performance -- tests/performance/memory-profiling.spec.ts
```

### For Backend Performance

```bash
cd api

# Run API endpoint benchmarks
npm run test -- tests/performance/endpoint-benchmarks.test.ts

# Run database query benchmarks
npm run test -- tests/performance/database-query-benchmarks.test.ts

# Run concurrent request tests
npm run test -- tests/performance/concurrent-requests.test.ts

# Run memory profiling (with GC exposure)
node --expose-gc node_modules/.bin/vitest tests/performance/memory-profiling.test.ts

# Run all performance tests
npm run test -- tests/performance/
```

### For Load Testing

```bash
# Install k6 (if not already installed)
brew install k6  # macOS
# or visit https://k6.io/

cd api/tests/performance

# Standard load test (ramps to 100 concurrent users)
k6 run load-test-k6.js

# Stress test (ramps to 1000 concurrent users)
k6 run stress-test-k6.js

# Run comprehensive test script (all tests)
./run-all-performance-tests.sh
```

## Test Suites

### 1. Frontend Performance Tests

Located in: `tests/performance/`

#### Web Vitals Tests (`web-vitals.spec.ts`)
Measures Google's Core Web Vitals and page performance.

**Key Metrics:**
- LCP (Largest Contentful Paint) - < 2.5s
- FID (First Input Delay) - < 100ms
- CLS (Cumulative Layout Shift) - < 0.1
- FCP (First Contentful Paint) - < 1.8s
- TTFB (Time to First Byte) - < 600ms

**10 Tests included:**
- LCP measurement
- FCP timing
- CLS tracking
- TTFB measurement
- Navigation timing
- Resource timing
- Page load performance
- Paint timing
- Long task detection
- Performance report generation

#### Component Rendering Tests (`component-rendering.spec.ts`)
Tests React component rendering and interaction performance.

**Key Metrics:**
- Time to Interactive (TTI) - < 8s
- Initial render time - < 5s
- Component re-render latency - < 1s
- Large table rendering (1000 rows) - < 2s
- Interaction responsiveness - < 100ms
- Animation frame rate - > 30 FPS

**11 Tests included:**
- TTI measurement
- Dashboard render time
- Large table rendering
- Data change re-renders
- Button click responsiveness
- Dropdown opening speed
- Modal dialog opening
- Animation frame rate monitoring
- Form input responsiveness
- Navigation transitions
- Scroll jank detection

#### Memory Profiling Tests (`memory-profiling.spec.ts`)
Detects memory leaks and tracks heap usage.

**Key Metrics:**
- Initial heap size - < 100 MB
- Memory growth per operation - < 20 MB
- DOM node count - < 5000
- Garbage collection recovery - > 50%

**10 Tests included:**
- Initial heap measurement
- Navigation memory tracking
- DOM node growth monitoring
- Event listener memory impact
- Storage size monitoring
- Detached DOM detection
- Memory under heavy load
- Third-party script impact
- GC cycle effectiveness
- Memory statistics report

### 2. Backend Performance Tests

Located in: `api/tests/performance/`

#### Endpoint Benchmarks (`endpoint-benchmarks.test.ts`)
Measures API response times across all major endpoints.

**Endpoints Tested (10):**
- GET `/api/v1/vehicles` - < 500ms
- GET `/api/v1/drivers` - < 500ms
- GET `/api/v1/fleet` - < 500ms
- GET `/api/v1/gps/track` - < 300ms
- GET `/api/v1/telematics/current` - < 500ms
- GET `/api/v1/fuel/transactions` - < 500ms
- GET `/api/v1/maintenance/records` - < 500ms
- GET `/api/v1/costs/summary` - < 500ms
- GET `/api/v1/search` - < 1000ms
- GET `/api/v1/health` - < 100ms

**Metrics per endpoint:**
- Average response time
- Min/Max times
- P95/P99 percentiles
- Error rate
- Performance report

#### Database Query Benchmarks (`database-query-benchmarks.test.ts`)
Analyzes SQL query performance with 15 different query types.

**Query Types:**
- Simple SELECT
- List queries (1000 rows)
- JOIN operations (2-3+ tables)
- Aggregations
- GROUP BY
- Filtered queries
- Ordered queries
- Subqueries
- DISTINCT operations
- UNION operations
- Index lookups
- Text search
- Pagination
- Window functions
- Complex queries

**Targets:**
- Simple selects: < 100ms
- JOINs: < 300-500ms
- Aggregations: < 300ms
- Complex queries: < 500ms

#### Concurrent Request Tests (`concurrent-requests.test.ts`)
Tests API behavior under concurrent load.

**Concurrency Levels (10 tests):**
- 10 concurrent users
- 50 concurrent users
- 100 concurrent users
- 200 concurrent users
- Sustained load (50 users, 5 iterations)
- Mixed endpoint concurrency
- Connection pooling efficiency
- Burst traffic
- Per-endpoint limits
- Scaling patterns

**Metrics:**
- Success/failure rates
- Average latency
- P95/P99 latency
- Error rates at each level

#### Memory Profiling (`memory-profiling.test.ts`)
Backend Node.js memory analysis.

**Tests (8):**
- Initial heap measurement
- Memory during repeated operations
- Object creation/destruction cycles
- Large buffer allocation
- Event listener memory leaks
- Garbage collection cycles
- Memory statistics
- Leak detection

**Requirements:**
```bash
node --expose-gc node_modules/.bin/vitest tests/performance/memory-profiling.test.ts
```

### 3. Load Testing (k6)

Located in: `api/tests/performance/`

#### Standard Load Test (`load-test-k6.js`)
Ramps load up to 100 concurrent users over 13 minutes.

**Load Profile:**
```
0-1min:   ramp to 10 VUs
1-4min:   ramp to 50 VUs
4-9min:   sustain 100 VUs
9-12min:  ramp down to 50 VUs
12-13min: ramp down to 0 VUs
```

**Endpoints Tested:**
- Vehicle endpoints (list, detail)
- Driver endpoints
- GPS tracking
- Fuel transactions
- Maintenance records
- Search
- Health check

**Thresholds:**
- Error rate < 10%
- P95 latency < 1000ms
- P99 latency < 2000ms

#### Stress Test (`stress-test-k6.js`)
Aggressive ramp-up to 1000 concurrent users to find breaking points.

**Load Profile:**
```
0-1min:   ramp to 10 VUs
1-2min:   ramp to 50 VUs
2-3min:   ramp to 100 VUs
3-4min:   ramp to 200 VUs
4-5min:   ramp to 500 VUs
5-6min:   ramp to 1000 VUs
6-7min:   ramp down to 0 VUs
```

**Objectives:**
- Find maximum throughput
- Identify breaking point
- Measure error rate under extreme load
- Count connection breaks

## Performance Baselines

See `api/tests/performance/PERFORMANCE_BASELINES.md` for detailed baseline metrics.

**Quick Summary:**

| Metric | Baseline | Target | Status |
|--------|----------|--------|--------|
| LCP | 1.2-2.5s | < 2.5s | ✓ |
| FCP | 0.8-1.8s | < 1.8s | ✓ |
| API avg | 150-400ms | < 500ms | ✓ |
| P99 latency | 1000-2000ms | < 2000ms | ✓ |
| Error rate | < 1% | < 1% | ✓ |
| Memory growth | < 10 MB | < 20 MB | ✓ |

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

### Specific Test Suite

```bash
npm run test:performance -- tests/performance/web-vitals.spec.ts
npm run test:performance -- tests/performance/component-rendering.spec.ts
npm run test:performance -- tests/performance/memory-profiling.spec.ts

cd api && npm run test -- tests/performance/endpoint-benchmarks.test.ts
cd api && npm run test -- tests/performance/database-query-benchmarks.test.ts
cd api && npm run test -- tests/performance/concurrent-requests.test.ts
```

### Load Testing

```bash
cd api/tests/performance

# Standard load test
k6 run load-test-k6.js

# Stress test
k6 run stress-test-k6.js

# With custom parameters
k6 run -u 250 -d 15m load-test-k6.js
k6 run -e BASE_URL=http://production.example.com load-test-k6.js
```

### Run All Tests (Comprehensive)

```bash
cd api/tests/performance
./run-all-performance-tests.sh
```

Results saved to: `results_TIMESTAMP/`

## Interpreting Results

### Green (Good Performance)
- Frontend: LCP < 2.5s, FCP < 1.8s, CLS < 0.1
- Backend: avg < 300ms, P99 < 1s
- Load test: error rate < 1%, no drops
- Memory: stable, < 5% growth per operation

### Yellow (Monitor)
- Frontend: LCP 2.5-4s, P99 > 1s
- Backend: avg 300-500ms
- Load test: error rate 1-5%
- Memory: 5-10% growth per operation

### Red (Investigate)
- Frontend: LCP > 4s, FCP > 3s, error rate rising
- Backend: avg > 500ms, P99 > 2s
- Load test: error rate > 5%, connection breaks
- Memory: > 10% growth, poor GC recovery

## Configuration Files

### Frontend
- `tests/performance/web-vitals.spec.ts` - Web Vitals tests
- `tests/performance/component-rendering.spec.ts` - Component tests
- `tests/performance/memory-profiling.spec.ts` - Memory tests
- `tests/performance/metrics-collector.ts` - Metrics utility
- `tests/performance/README.md` - Detailed documentation

### Backend
- `api/tests/performance/endpoint-benchmarks.test.ts` - API tests
- `api/tests/performance/database-query-benchmarks.test.ts` - DB tests
- `api/tests/performance/concurrent-requests.test.ts` - Concurrency tests
- `api/tests/performance/memory-profiling.test.ts` - Memory tests
- `api/tests/performance/load-test-k6.js` - Load test script
- `api/tests/performance/stress-test-k6.js` - Stress test script
- `api/tests/performance/PERFORMANCE_BASELINES.md` - Baselines
- `api/tests/performance/README.md` - Documentation
- `api/tests/performance/run-all-performance-tests.sh` - Test runner

## CI/CD Integration

Add to `.github/workflows/performance.yml`:

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: password

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - run: npm ci

      - run: npm run test:performance
        timeout-minutes: 15

      - run: cd api && npm run test -- tests/performance/
        timeout-minutes: 15
```

## Troubleshooting

### Tests Timing Out
```bash
npm run test:performance -- --testTimeout=60000
```

### Memory Tests Need GC
```bash
node --expose-gc node_modules/.bin/vitest tests/performance/memory-profiling.test.ts
```

### k6 Not Found
```bash
brew install k6  # macOS
curl https://dl.k6.io/install.sh | sudo bash  # Linux
```

### Database Connection Failed
```bash
npm run db:reset
npm run db:seed
```

## Performance Optimization Checklist

- [ ] Web Vitals within targets
- [ ] API responses < 500ms
- [ ] Memory stable (< 10MB growth per operation)
- [ ] Load test error rate < 1%
- [ ] No long tasks detected
- [ ] Database queries optimized
- [ ] Connection pool sized correctly
- [ ] No memory leaks detected
- [ ] GC recovery > 50%
- [ ] P99 latency acceptable

## Documentation

- **Full Frontend Guide**: `tests/performance/README.md`
- **Full Backend Guide**: `api/tests/performance/README.md`
- **Baselines & Targets**: `api/tests/performance/PERFORMANCE_BASELINES.md`

## Support

For issues or questions about performance testing:

1. Check the relevant README.md for your test type
2. Review PERFORMANCE_BASELINES.md for targets
3. Run tests in isolation to debug
4. Check logs in `results_*` directory

## Total Test Count

- **Frontend Tests**: 31
- **Backend Tests**: 38
- **Load Tests**: 2 (standard + stress)
- **Total**: 50+ comprehensive performance tests

All metrics are documented and baselines are established for monitoring and regression detection.
