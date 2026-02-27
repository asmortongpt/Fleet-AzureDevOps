# Performance Testing Suite

Comprehensive performance benchmarking and load testing suite for Fleet CTA covering frontend, backend, and database performance.

## Quick Start

### Frontend Performance Tests

```bash
# Run all frontend performance tests
npm run test:performance

# Run specific test suite
npm run test:performance -- tests/performance/web-vitals.spec.ts
npm run test:performance -- tests/performance/component-rendering.spec.ts
npm run test:performance -- tests/performance/memory-profiling.spec.ts
```

### Backend Performance Tests

```bash
cd api

# Run endpoint benchmarks
npm run test -- tests/performance/endpoint-benchmarks.test.ts

# Run database query benchmarks
npm run test -- tests/performance/database-query-benchmarks.test.ts

# Run concurrent request tests
npm run test -- tests/performance/concurrent-requests.test.ts

# Run memory profiling (requires --expose-gc)
node --expose-gc node_modules/.bin/vitest tests/performance/memory-profiling.test.ts

# Run all performance tests
npm run test -- tests/performance/
```

### Load Testing with k6

```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io/

cd api/tests/performance

# Standard load test (ramps up to 100 users over 12 minutes)
k6 run load-test-k6.js

# Stress test (ramps up to 1000 users)
k6 run stress-test-k6.js

# Custom parameters
k6 run -u 250 -d 15m load-test-k6.js        # 250 users, 15 minutes
k6 run --vus 100 --duration 10m load-test-k6.js

# With custom base URL
k6 run -e BASE_URL=http://staging.local load-test-k6.js

# With authentication token
k6 run -e AUTH_TOKEN=your_token load-test-k6.js

# Export results to JSON
k6 run -o json=results.json load-test-k6.js

# Export results to Grafana
k6 run --out=influxdb=http://localhost:8086/k6 load-test-k6.js
```

## Test Suites Overview

### 1. Frontend Performance Tests

#### Web Vitals (`web-vitals.spec.ts`)
Measures Core Web Vitals and page performance metrics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s
- **TTFB** (Time to First Byte): < 600ms

**Tests include:**
- LCP measurement during page load
- FCP and FID tracking
- CLS monitoring
- Navigation timing metrics
- Resource timing analysis
- Paint timing
- Long task detection

#### Component Rendering (`component-rendering.spec.ts`)
Tests React component render performance:
- Time to Interactive (TTI)
- Dashboard initial render time
- Large table rendering (1000+ rows)
- Re-render performance on data changes
- Interactive responsiveness
- Animation frame rates
- Form input latency
- Navigation transitions
- Scroll jank detection

**Key metrics:**
- Initial render time
- Re-render latency
- Frame rate (FPS)
- Interaction delay

#### Memory Profiling (`memory-profiling.spec.ts`)
Detects memory leaks and measures heap usage:
- Initial heap size measurement
- Memory leak detection during navigation
- DOM node count growth
- Event listener memory impact
- Cache growth monitoring
- Detached DOM node detection
- Memory pressure under heavy load
- Third-party script impact
- Garbage collection cycles

**Metrics tracked:**
- Heap used/total
- Memory growth trends
- Garbage collection recovery
- Storage usage

### 2. Backend Performance Tests

#### Endpoint Benchmarks (`endpoint-benchmarks.test.ts`)
Measures API response times:

**Tested endpoints:**
- `/api/v1/vehicles` - Vehicle listing
- `/api/v1/drivers` - Driver listing
- `/api/v1/fleet` - Fleet information
- `/api/v1/gps/track` - GPS tracking data
- `/api/v1/telematics/current` - Current telematics
- `/api/v1/fuel/transactions` - Fuel data
- `/api/v1/maintenance/records` - Maintenance history
- `/api/v1/costs/summary` - Cost summaries
- `/api/v1/search` - Search functionality
- `/api/v1/health` - Health check

**Metrics:**
- Average response time
- Min/max response time
- P95/P99 percentiles
- Error rate

#### Database Query Benchmarks (`database-query-benchmarks.test.ts`)
Analyzes SQL query performance:

**Query types tested:**
- Simple SELECT statements
- Complex JOIN operations (2-3+ tables)
- Aggregation queries
- GROUP BY queries
- Filtered queries
- Ordered queries
- Subqueries
- DISTINCT operations
- UNION operations
- Index performance
- Text search
- Pagination
- Window functions

**Baselines:**
- Simple selects: < 100ms
- Complex joins: < 500ms
- Aggregations: < 1000ms

#### Concurrent Requests (`concurrent-requests.test.ts`)
Tests API under concurrent load:

**Concurrency levels:**
- 10 concurrent users
- 50 concurrent users
- 100 concurrent users
- 200 concurrent users
- Sustained load (50 users, 5 iterations)

**Metrics:**
- Success/failure rates
- Average latency
- P95/P99 latency
- Connection pooling efficiency
- Burst traffic handling

#### Memory Profiling (`memory-profiling.test.ts`)
Backend Node.js memory analysis:

**Tests:**
- Initial heap size
- Memory during repeated operations
- Object creation/destruction cycles
- Large buffer allocation
- Event listener memory leaks
- Garbage collection cycles

**Requirements:**
```bash
# Run with --expose-gc flag
node --expose-gc node_modules/.bin/vitest tests/performance/memory-profiling.test.ts
```

### 3. Load Testing (k6)

#### Standard Load Test (`load-test-k6.js`)

**Load profile:**
```
0-1min:   ramp up to 10 VUs
1-4min:   ramp up to 50 VUs
4-9min:   stay at 100 VUs
9-12min:  ramp down to 50 VUs
12-13min: ramp down to 0 VUs
```

**Endpoints tested:**
- Vehicle list endpoints
- Driver operations
- GPS tracking
- Fuel transactions
- Maintenance records
- Search functionality
- Health checks

**Thresholds:**
- Error rate < 10%
- P95 latency < 1000ms
- P99 latency < 2000ms

#### Stress Test (`stress-test-k6.js`)

**Load profile:**
Aggressive ramp-up to identify breaking points:
```
0-1min:   ramp to 10 VUs
1-2min:   ramp to 50 VUs
2-3min:   ramp to 100 VUs
3-4min:   ramp to 200 VUs
4-5min:   ramp to 500 VUs
5-6min:   ramp to 1000 VUs
6-7min:   ramp down to 0 VUs
```

**Test objectives:**
- Identify maximum throughput
- Find breaking point
- Measure error rate under extreme load
- Monitor connection breaks

## Interpreting Results

### Frontend Metrics

**Good Performance:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Initial render < 2s

**Acceptable:**
- LCP 2.5-4s
- FID 100-300ms
- CLS 0.1-0.25
- Initial render 2-5s

**Poor (investigate):**
- LCP > 4s
- FID > 300ms
- CLS > 0.25
- Initial render > 5s

### API Response Times

**Excellent:**
- GET endpoints: < 200ms
- LIST endpoints: < 300ms
- SEARCH: < 800ms

**Good:**
- GET endpoints: 200-500ms
- LIST endpoints: 300-800ms
- SEARCH: 800-1500ms

**Acceptable:**
- GET endpoints: 500-1000ms
- LIST endpoints: 800-1500ms
- SEARCH: 1500-2500ms

### Load Test Results

**Healthy System:**
- Error rate < 1%
- P95 latency < 1s
- Throughput > 200 req/s

**Acceptable:**
- Error rate < 5%
- P95 latency < 3s
- Throughput > 100 req/s

**At Risk:**
- Error rate > 5%
- P95 latency > 3s
- Throughput < 100 req/s

### Memory Metrics

**Healthy:**
- Initial heap < 100 MB
- Growth per operation < 5 MB
- GC recovery > 70%

**Investigate:**
- Initial heap 100-200 MB
- Growth per operation 5-20 MB
- GC recovery 50-70%

**Critical:**
- Initial heap > 200 MB
- Growth per operation > 20 MB
- GC recovery < 50%

## Configuration

### Environment Variables

```bash
# Frontend tests
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=your_key

# Backend tests
DATABASE_URL=postgres://user:password@localhost:5432/fleet
API_URL=http://localhost:3001
TEST_AUTH_TOKEN=your_token

# k6 tests
BASE_URL=http://localhost:3001
AUTH_TOKEN=your_token
```

### Database Setup for Performance Tests

```bash
cd api

# Ensure database has test data
npm run db:seed

# Reset and prepare for performance testing
npm run db:reset

# Take baseline snapshot
npm run db:snapshot baseline
```

## Advanced Testing

### Profiling Individual Endpoints

```bash
# Add custom k6 script
cat > custom-load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m30s', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  let res = http.get('http://localhost:3001/api/v1/vehicles');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
EOF

k6 run custom-load-test.js
```

### Performance Comparison

```bash
# Run baseline
k6 run -o json=baseline.json load-test-k6.js

# Make changes...

# Run new test
k6 run -o json=new.json load-test-k6.js

# Compare results
npx k6-summary baseline.json new.json
```

### Real User Monitoring (RUM)

The memory profiling test captures user-centric metrics that approximate real-world performance.

## CI/CD Integration

### GitHub Actions

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
          POSTGRES_DB: fleet_test
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

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

### Tests timing out

```bash
# Increase timeout
npm run test:performance -- --testTimeout=60000

# For k6
k6 run -d 30m load-test-k6.js
```

### Memory tests showing high baseline

```bash
# Ensure running with GC enabled
node --expose-gc --max-old-space-size=4096 node_modules/.bin/vitest
```

### Database connection errors

```bash
# Verify database is running
npm run check:db

# Reset database
npm run db:reset

# Check connection string
echo $DATABASE_URL
```

### k6 not found

```bash
# macOS
brew install k6

# Linux
curl https://dl.k6.io/install.sh | sudo bash

# Docker
docker run -i loadimpact/k6 run - < load-test-k6.js
```

## Performance Optimization Tips

1. **Frontend:**
   - Code splitting by route
   - Image optimization and lazy loading
   - Virtual scrolling for large lists
   - Memoization of expensive components

2. **Backend:**
   - Add database indexes for frequently queried columns
   - Implement query result caching with Redis
   - Use pagination for large datasets
   - Optimize N+1 query problems with JOINs

3. **Database:**
   - Analyze slow queries with EXPLAIN
   - Create indexes on foreign keys
   - Partition large tables if needed
   - Archive old data periodically

4. **Infrastructure:**
   - Use CDN for static assets
   - Enable compression (gzip)
   - Configure proper database pool sizing
   - Monitor and alert on performance degradation

## References

- **Web Vitals**: https://web.dev/vitals/
- **k6 Documentation**: https://k6.io/docs/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **PostgreSQL Performance**: https://www.postgresql.org/docs/current/performance-tips.html
- **Node.js Diagnostics**: https://nodejs.org/en/docs/guides/simple-profiling/
- **React Performance**: https://react.dev/reference/react/useMemo

## Performance Baselines

See [PERFORMANCE_BASELINES.md](./PERFORMANCE_BASELINES.md) for detailed baseline metrics and target values.

## Contributing

When submitting performance improvements:

1. Run the full test suite before and after
2. Document the changes made
3. Show improvement metrics
4. Ensure no regressions in other areas

```bash
# Before optimization
npm run test:performance > before.txt
k6 run load-test-k6.js > before-k6.txt

# After optimization
npm run test:performance > after.txt
k6 run load-test-k6.js > after-k6.txt

# Compare results
diff before.txt after.txt
```
