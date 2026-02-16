# Performance Baselines - Fleet CTA

Document Last Updated: 2026-02-15

## Overview

This document establishes performance baselines for the Fleet CTA application. These baselines serve as reference points for identifying regressions and tracking improvements over time.

## Frontend Performance Metrics

### Web Vitals (Core Web Vitals)

| Metric | Baseline | Target | Status |
|--------|----------|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | < 2.5s | ✓ Good |
| FID (First Input Delay) | < 100ms | < 100ms | ✓ Good |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.1 | ✓ Good |
| FCP (First Contentful Paint) | < 1.8s | < 1.8s | ✓ Good |
| TTFB (Time to First Byte) | < 600ms | < 600ms | ✓ Good |

### Page Load Performance

| Page | Cold Load | Warm Load | TTI | Target |
|------|-----------|-----------|-----|--------|
| Dashboard | 8-15s | 2-5s | 8s | < 15s |
| Vehicles List | 5-8s | 1-3s | 6s | < 10s |
| Drivers | 5-8s | 1-3s | 6s | < 10s |
| GPS Tracking | 4-6s | 1-2s | 5s | < 8s |
| Reports | 6-10s | 2-4s | 7s | < 12s |

### Component Rendering

| Component | Initial Render | Re-render | Target |
|-----------|---|---|---|
| Vehicle List (100 items) | 50-100ms | 20-50ms | < 200ms |
| Driver Table (1000 rows) | 100-200ms | 50-100ms | < 500ms |
| Map (with markers) | 200-400ms | 100-200ms | < 1s |
| Modal/Dialog | 20-50ms | 10-30ms | < 100ms |
| Dropdown (100 items) | 30-80ms | 15-40ms | < 200ms |

### Memory Profiling

| Scenario | Metric | Baseline | Target |
|----------|--------|----------|--------|
| Initial Heap | Used | 20-30 MB | < 100 MB |
| After Navigation (5x) | Growth | < 10 MB | < 20 MB |
| DOM Nodes | Count | 1000-2000 | < 5000 |
| Detached Nodes | Count | 0 | < 100 |
| Local Storage | Size | < 1 MB | < 5 MB |

### Resource Metrics

| Resource Type | Target Size | Target Count | Status |
|---|---|---|---|
| JavaScript | < 500 KB | < 10 files | ✓ |
| CSS | < 100 KB | < 5 files | ✓ |
| Images | < 2 MB | < 50 | ✓ |
| Fonts | < 200 KB | < 3 | ✓ |
| Third-party Scripts | < 100 KB | < 3 | ✓ |

## API Performance Metrics

### Endpoint Response Times

| Endpoint | Method | Baseline | Target | Status |
|----------|--------|----------|--------|--------|
| `/api/v1/vehicles` | GET | 150-300ms | < 500ms | ✓ |
| `/api/v1/drivers` | GET | 150-300ms | < 500ms | ✓ |
| `/api/v1/fleet` | GET | 200-400ms | < 500ms | ✓ |
| `/api/v1/gps/track` | GET | 100-200ms | < 300ms | ✓ |
| `/api/v1/telematics/current` | GET | 200-400ms | < 500ms | ✓ |
| `/api/v1/fuel/transactions` | GET | 200-400ms | < 500ms | ✓ |
| `/api/v1/maintenance/records` | GET | 200-400ms | < 500ms | ✓ |
| `/api/v1/costs/summary` | GET | 300-500ms | < 500ms | ⚠ Monitor |
| `/api/v1/search` | GET | 400-800ms | < 1000ms | ✓ |
| `/api/v1/health` | GET | 10-50ms | < 100ms | ✓ |

### Load Test Results (100 concurrent users, 5min duration)

| Metric | Baseline | Target | Status |
|--------|----------|--------|--------|
| Requests/sec | 200-400 | > 150 | ✓ |
| Avg Latency | 200-400ms | < 500ms | ✓ |
| P95 Latency | 500-1000ms | < 1000ms | ✓ |
| P99 Latency | 1000-2000ms | < 2000ms | ✓ |
| Error Rate | < 1% | < 1% | ✓ |
| Throughput | 500-800 KB/s | > 400 KB/s | ✓ |

### Stress Test Results (1000 concurrent users)

| Metric | Baseline | Target |
|--------|----------|--------|
| Requests/sec | 100-200 | > 50 |
| Avg Latency | 1000-3000ms | < 5000ms |
| Error Rate | < 10% | < 20% |
| Connection Breaks | < 5 | < 50 |

## Database Performance Metrics

### Query Execution Times

| Query Type | Baseline | Target | Status |
|-----------|----------|--------|--------|
| Simple SELECT | 5-20ms | < 100ms | ✓ |
| List Query (1000 rows) | 50-150ms | < 200ms | ✓ |
| JOIN (2 tables) | 100-300ms | < 300ms | ✓ |
| JOIN (3+ tables) | 200-500ms | < 500ms | ✓ |
| Aggregation | 100-300ms | < 300ms | ✓ |
| GROUP BY | 100-200ms | < 200ms | ✓ |
| Text Search | 150-300ms | < 300ms | ✓ |
| Pagination | 100-200ms | < 200ms | ✓ |
| Window Functions | 200-400ms | < 400ms | ✓ |

### Connection Pool Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Pool Size | 20 connections | 20-30 |
| Idle Timeout | 30s | 30s |
| Connection Timeout | 2s | 2s |
| Max Wait Time | 100ms | < 500ms |
| Stale Connection Ratio | < 1% | < 1% |

## Memory Profiling (Backend)

### Process Memory

| Metric | Baseline | Target | Status |
|--------|----------|--------|--------|
| Initial Heap | 30-50 MB | < 200 MB | ✓ |
| Peak Heap | 80-150 MB | < 300 MB | ✓ |
| After Heavy Load | 100-200 MB | < 300 MB | ✓ |
| Memory Growth (operations) | < 20 MB | < 50 MB | ✓ |

### Memory Leak Detection

| Test | Baseline | Target |
|------|----------|--------|
| Repeated Operations | Growth < 5% | < 10% |
| Navigation Cycles | Growth < 10 MB | < 20 MB |
| Event Listeners | Growth < 5 MB | < 20 MB |
| Buffer Allocation/Release | Recovery > 70% | > 50% |

## Concurrent Request Handling

| Scenario | Concurrency | Error Rate | Avg Latency | P99 Latency |
|----------|-------------|-----------|-------------|------------|
| Normal Load | 10 | < 1% | 100-200ms | 300-500ms |
| Peak Load | 50 | < 5% | 200-400ms | 1000-1500ms |
| High Load | 100 | < 10% | 300-600ms | 2000-3000ms |
| Extreme Load | 200 | < 15% | 500-1000ms | 3000-5000ms |
| Sustained Load | 50 (5 iterations) | < 5% | 200-400ms | 1000-1500ms |

## Large Dataset Handling

| Operation | Dataset Size | Time | Status |
|-----------|---|---|---|
| Load 10,000 vehicles | 10k | 2-5s | ✓ |
| Render 1000-item list | 1k | 100-200ms | ✓ |
| Filter/search 50k records | 50k | 500-1000ms | ✓ |
| Export CSV (1000 rows) | 1k | 500-1500ms | ✓ |
| Import batch (500 items) | 500 | 1-3s | ✓ |

## Performance Regression Thresholds

When running performance tests, use these thresholds to identify regressions:

### Critical (> 30% degradation)
- API endpoint response time > 150% of baseline
- Page load time > 150% of baseline
- Error rate > 5% above baseline
- Memory growth > 50 MB above baseline

### Warning (20-30% degradation)
- API endpoint response time > 120% of baseline
- Page load time > 120% of baseline
- Error rate > 3% above baseline
- Memory growth > 30 MB above baseline

### Monitor (10-20% degradation)
- P99 latency > 120% of baseline
- Individual endpoint > 120% of baseline
- Memory consumption trending up

## Testing Methodology

### Frontend Performance Tests

Run Web Vitals tests:
```bash
npm run test:performance -- tests/performance/web-vitals.spec.ts
```

Run component rendering tests:
```bash
npm run test:performance -- tests/performance/component-rendering.spec.ts
```

Run memory profiling:
```bash
npm run test:performance -- tests/performance/memory-profiling.spec.ts
```

### Backend Performance Tests

Run endpoint benchmarks:
```bash
cd api
npm run test -- tests/performance/endpoint-benchmarks.test.ts
```

Run database benchmarks:
```bash
cd api
npm run test -- tests/performance/database-query-benchmarks.test.ts
```

Run memory profiling with GC exposure:
```bash
cd api
node --expose-gc node_modules/.bin/vitest tests/performance/memory-profiling.test.ts
```

Run concurrent request tests:
```bash
cd api
npm run test -- tests/performance/concurrent-requests.test.ts
```

### Load Testing with k6

Install k6:
```bash
brew install k6  # macOS
# or
curl https://dl.k6.io/install.sh | sudo bash  # Linux
```

Run load test:
```bash
cd api/tests/performance
k6 run load-test-k6.js
```

Run stress test:
```bash
cd api/tests/performance
k6 run stress-test-k6.js
```

With custom parameters:
```bash
k6 run -u 200 -d 10m load-test-k6.js  # 200 users, 10 minute duration
k6 run -e BASE_URL=https://production.example.com stress-test-k6.js
```

## CI/CD Integration

### GitHub Actions Setup

Add to `.github/workflows/performance.yml`:

```yaml
name: Performance Tests
on: [push, pull_request]
jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:performance
      - run: cd api && npm run test -- tests/performance/
```

## Maintenance Schedule

- **Weekly**: Run performance tests on main branch
- **Before Release**: Run full load and stress tests
- **Monthly**: Review trends and update baselines if needed
- **Quarterly**: Comprehensive performance audit

## Known Issues and Workarounds

1. **Cold Load Variation**: First load is slower due to browser caching. Always test cold and warm scenarios.
2. **Database Slow Queries**: Text search on unit_number may need indexing in high-concurrency scenarios.
3. **Memory Spikes**: Google Maps integration can cause memory spikes on first load.

## Performance Optimization Opportunities

1. Code splitting for route-based components
2. Image lazy loading and optimization
3. Database query optimization (add missing indexes)
4. Implement caching strategies (Redis)
5. Consider CDN for static assets
6. Reduce bundle size with tree shaking
7. Optimize database connection pool sizing

## References

- [Web Vitals by Google](https://web.dev/vitals/)
- [k6 Documentation](https://k6.io/docs/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance.html)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)
