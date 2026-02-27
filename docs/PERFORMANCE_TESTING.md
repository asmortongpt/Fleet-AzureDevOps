# Performance Testing Guide

Complete guide for load, stress, and endurance testing of Fleet-CTA.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Scenarios](#test-scenarios)
3. [Running Tests](#running-tests)
4. [Interpreting Results](#interpreting-results)
5. [Bottleneck Identification](#bottleneck-identification)
6. [Optimization Strategies](#optimization-strategies)
7. [CI/CD Integration](#cicd-integration)

## Quick Start

### Prerequisites

```bash
# Install K6
brew install k6

# Install Artillery globally
npm install -g artillery

# Or use with npm
npm install --save-dev k6 artillery
```

### Verify Backend

```bash
# Start backend
cd api
npm run dev

# In another terminal, verify it's running
curl http://localhost:3001/api/health
# Should return 200 OK
```

### Run Your First Test

```bash
# Run normal load test (5 minutes)
npm run load:normal

# Or run all tests
npm run load:all
```

## Test Scenarios

### 1. Normal Load Test (load-normal.js)

**Purpose**: Validate system performance under realistic daily load

**Configuration**:
- Duration: 14 minutes
- User ramp-up: 0 → 100 → 200 users
- Think time: 1 second between requests

**Success Criteria**:
- p95 response time: < 500ms
- p99 response time: < 1000ms
- Error rate: < 0.1%

**What it Tests**:
- Vehicle list/search
- Driver list/search
- Dashboard metrics
- Real-time tracking
- Compliance checks

**Run with**:
```bash
npm run load:normal
# OR
k6 run tests/load/scenarios/load-normal.js
```

### 2. Spike Test (load-spike.js)

**Purpose**: Validate system behavior during sudden traffic surge

**Configuration**:
- Duration: 2.5 minutes
- Spike: 50 → 500 users in 30 seconds
- Recovery: Back to 50 users

**Success Criteria**:
- p95 response time: < 1000ms (degraded but acceptable)
- Error rate: < 1% (allows some failures)

**What it Tests**:
- Rate limiting effectiveness
- Queue handling
- Connection pool pressure
- Recovery time

**Run with**:
```bash
npm run load:spike
```

### 3. Stress Test (load-stress.js)

**Purpose**: Identify system breaking point and failure modes

**Configuration**:
- Duration: 8.5 minutes
- Progressive ramp: 0 → 100 → 500 → 1000+ users
- Heavy load period: 1000 users for 3 minutes

**Success Criteria**:
- p99 response time: < 3000ms
- Error rate: < 5% (allows failures under extreme stress)
- System recovers after load reduction

**What it Tests**:
- Breaking point
- Graceful degradation
- Error handling
- Recovery mechanisms

**Run with**:
```bash
npm run load:stress
```

### 4. Endurance Test (load-endurance.js)

**Purpose**: Validate stability over extended periods

**Configuration**:
- Duration: 70 minutes
- Sustained load: 100 concurrent users
- Varied request patterns

**Success Criteria**:
- p95 response time: < 500ms (consistent)
- Error rate: < 0.1%
- No memory leaks (< 50MB growth/hour)
- Connection stability

**What it Tests**:
- Memory leaks
- Connection pool exhaustion
- Cache coherency
- Long-running stability

**Run with**:
```bash
npm run load:endurance
# Note: This takes ~70 minutes to complete
```

## Running Tests

### Command Reference

```bash
# Run all tests in sequence
npm run load:all

# Run specific scenario tests
npm run load:normal          # Normal load
npm run load:spike           # Traffic spike
npm run load:stress          # Maximum stress
npm run load:endurance       # 1 hour sustained

# Run specific API tests
npm run load:api:vehicles    # Vehicles API
npm run load:api:drivers     # Drivers API
npm run load:api:database    # Database performance

# Artillery tests
npm run load:artillery:normal # Artillery normal load
npm run load:artillery:spike  # Artillery spike test
npm run load:artillery:stress # Artillery stress test

# Analyze results
npm run load:analyze
```

### Environment Variables

```bash
# Override base URL
BASE_URL=https://api.example.com npm run load:normal

# Set think time (seconds between requests)
THINK_TIME=2 npm run load:normal

# Set test duration
TEST_DURATION=30m npm run load:normal
```

### Running Tests with Custom Configuration

```bash
# Run with custom base URL
BASE_URL=http://staging-api:3001 npm run load:normal

# Run with reduced think time for more aggressive load
THINK_TIME=0.5 npm run load:normal

# Run specific test file directly
k6 run tests/load/scenarios/load-normal.js \
  --out json=results/custom-test.json \
  --env BASE_URL=http://staging-api:3001
```

## Interpreting Results

### Key Metrics

**Response Time Percentiles**:
- **p50 (median)**: 50% of requests finish in this time
- **p95**: 95% of requests finish in this time (SLA target)
- **p99**: 99% of requests finish in this time (worst case)

**Example**:
```
p50: 100ms   → Most users experience fast responses
p95: 450ms   → 95% of users have good experience
p99: 950ms   → Worst 1% still reasonable
```

**Error Rate**:
- Normal operation: < 0.1%
- Spike/stress: < 1-5% acceptable
- Above 5%: Serious issues

**Throughput**:
- Requests per second (RPS)
- Should scale linearly until bottleneck
- Target: > 1000 RPS at 100 users

### Example Results Output

```
=== Test Summary ===
http_req_duration
  p(50): 142ms
  p(95): 487ms
  p(99): 942ms

http_req_failed
  0 failed (0%)

http_errors
  rate: 0.0%

Recommendations:
  ✓ Performance is excellent
  ✓ Error rates are acceptable
  ✓ System is ready for production
```

### Performance Assessment Matrix

| Metric | Excellent | Good | Acceptable | Poor | Unacceptable |
|--------|-----------|------|-----------|------|-------------|
| p95 Response Time | < 200ms | 200-400ms | 400-800ms | 800-1500ms | > 1500ms |
| p99 Response Time | < 500ms | 500-800ms | 800-1500ms | 1500-3000ms | > 3000ms |
| Error Rate | < 0.01% | 0.01-0.1% | 0.1-1% | 1-5% | > 5% |
| Memory Leak | None | < 10MB/hr | < 50MB/hr | < 200MB/hr | > 200MB/hr |

## Bottleneck Identification

### High Response Times (p95 > 500ms)

**Possible Causes**:

1. **Database Bottleneck**
   - Check slow query log: `api/logs/error.log`
   - Review query performance: `EXPLAIN ANALYZE`
   - Verify indexes: `SELECT * FROM pg_indexes`
   - Check connection pool: Monitor `DB_WEBAPP_POOL_SIZE`

   **Solution**:
   ```sql
   -- Identify slow queries
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   WHERE mean_time > 100
   ORDER BY mean_time DESC;

   -- Create missing indexes
   CREATE INDEX idx_vehicle_status ON vehicles(status);
   CREATE INDEX idx_driver_status ON drivers(status);
   ```

2. **Redis Cache Misses**
   - Monitor cache hit rate
   - Check eviction policy: `CONFIG GET maxmemory-policy`
   - Verify TTL settings

   **Solution**:
   ```bash
   # Check Redis stats
   redis-cli INFO stats

   # Monitor cache performance
   redis-cli MONITOR
   ```

3. **Rate Limiting**
   - Review rate limit configuration: `src/middleware/rate-limit.ts`
   - Check Redis rate limit keys: `redis-cli KEYS "rate-limit:*"`

   **Solution**:
   ```javascript
   // Adjust in rate-limit.ts
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,  // 15 minutes
     max: 1000,                  // 1000 requests per window
   });
   ```

4. **Application Code**
   - Check backend logs: `api/logs/application.log`
   - Review CPU usage during test
   - Check memory usage

   **Solution**:
   ```bash
   # Monitor system resources
   top -l 1 | grep "node"

   # Check detailed logs
   tail -f api/logs/error.log
   ```

### High Error Rate (> 1%)

**Possible Causes**:

1. **Database Connection Pool Exhausted**
   ```bash
   # Check pool status
   curl http://localhost:3001/api/health

   # Increase pool size in .env
   DB_WEBAPP_POOL_SIZE=30
   ```

2. **Rate Limiting Triggered**
   ```bash
   # Check rate limit counters
   redis-cli KEYS "rate-limit:*" | wc -l

   # Reduce user ramp-up speed in test script
   ```

3. **Authentication Failures**
   ```bash
   # Check JWT validation in logs
   grep "JWT" api/logs/error.log

   # Verify token generation
   npm run check:auth
   ```

### Memory Leaks (Endurance Test)

**Detection**:
```bash
# Monitor memory during test
watch -n 1 'ps aux | grep node | grep -v grep'

# Check V8 memory
node --expose-gc api/src/scripts/check-memory.js
```

**Common Causes**:
1. Event listeners not cleaned up
2. Database connections not closed
3. Cache growing unbounded
4. Circular references in objects

**Solution**:
```javascript
// Ensure cleanup in server shutdown
process.on('SIGTERM', async () => {
  await db.pool.end();
  await redis.disconnect();
  process.exit(0);
});
```

## Optimization Strategies

### 1. Query Optimization

**Identify Slow Queries**:
```bash
# Enable slow query log
npm run db:slow-queries

# Or check PostgreSQL stats
psql -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Optimize**:
```sql
-- Add indexes
CREATE INDEX idx_vehicles_status_created ON vehicles(status, created_at DESC);

-- Use EXPLAIN to verify
EXPLAIN ANALYZE SELECT * FROM vehicles WHERE status = 'active';

-- Check index usage
SELECT indexname, idx_scan FROM pg_stat_user_indexes;
```

### 2. Caching Strategy

**Implement Redis Caching**:
```typescript
// src/middleware/cache.ts
const cacheKey = `vehicles:list:${limit}:${offset}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return res.json(JSON.parse(cached));
}

const data = await vehiclesRepository.list();
await redis.setex(cacheKey, 3600, JSON.stringify(data)); // 1 hour TTL
```

**Cache Invalidation**:
```typescript
// Invalidate on write
await vehiclesRepository.update(id, data);
await redis.del('vehicles:*');  // Pattern deletion
```

### 3. Connection Pool Tuning

**Adjust Pool Size**:
```env
# For load testing
DB_WEBAPP_POOL_SIZE=30      # Increased from default 10

# For high-traffic production
DB_WEBAPP_POOL_SIZE=50
```

**Monitor Pool**:
```javascript
// Add to api/src/config/connection-manager.ts
setInterval(() => {
  const poolSize = pool.totalCount;
  const idleSize = pool.idleCount;
  const usedSize = poolSize - idleSize;

  logger.info(`Connection Pool: ${usedSize}/${poolSize} (${idleSize} idle)`);
}, 60000); // Every minute
```

### 4. Rate Limiting Tuning

**Adjust for Load Tests**:
```javascript
// api/src/middleware/rate-limit.ts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minute window
  max: 10000,                 // 10k requests per window
  keyGenerator: (req) => {
    // Rate limit per IP or user
    return req.user?.id || req.ip;
  },
});
```

### 5. Response Compression

**Enable Compression**:
```typescript
// api/src/server.ts
import compression from 'compression';

app.use(compression({
  level: 6,  // 0-9 compression level
  threshold: 100 * 1000,  // Only compress > 100KB
}));
```

### 6. Pagination Optimization

**Implement Efficient Pagination**:
```typescript
// Instead of OFFSET
SELECT * FROM vehicles
WHERE created_at < ?
ORDER BY created_at DESC
LIMIT 20;

// Rather than
SELECT * FROM vehicles
OFFSET 1000 LIMIT 20;  // Slow for large offsets
```

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/load-testing.yml`:

```yaml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: fleet_db
          POSTGRES_USER: fleet_user
          POSTGRES_PASSWORD: fleet_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install K6
        run: |
          sudo apt-get update
          sudo apt-get install -y k6

      - name: Install dependencies
        run: npm install

      - name: Seed database
        run: |
          cd api
          npm install
          npm run db:seed
        env:
          DATABASE_URL: postgresql://fleet_user:fleet_password@localhost:5432/fleet_db

      - name: Start backend
        run: |
          cd api
          npm run dev &
          sleep 5
        env:
          DATABASE_URL: postgresql://fleet_user:fleet_password@localhost:5432/fleet_db
          REDIS_URL: redis://localhost:6379

      - name: Run load tests
        run: npm run load:normal
        env:
          BASE_URL: http://localhost:3001

      - name: Analyze results
        run: npm run load:analyze

      - name: Upload results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: load-test-results
          path: tests/load/results/

      - name: Upload logs
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: load-test-logs
          path: tests/load/logs/

      - name: Notify on failure
        if: failure()
        run: |
          echo "Load test failed"
          exit 1
```

### Local Test Before Commit

```bash
#!/bin/bash
# .git/hooks/pre-push

echo "Running performance tests..."
npm run load:normal || exit 1

echo "Tests passed, proceeding with push"
```

## Monitoring During Tests

### Watch Logs

```bash
# Terminal 1: Backend logs
tail -f api/logs/error.log

# Terminal 2: Application logs
tail -f api/logs/application.log

# Terminal 3: System resources
top -l 1 -stats pid,command,cpu,mem
```

### Monitor Database

```bash
# Terminal 1: PostgreSQL connections
watch -n 1 "psql -c 'SELECT count(*) FROM pg_stat_activity WHERE state = 'active''"

# Terminal 2: Slow queries
psql -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Monitor Redis

```bash
# Terminal 1: Redis statistics
watch -n 1 "redis-cli INFO stats"

# Terminal 2: Memory usage
watch -n 1 "redis-cli INFO memory"

# Terminal 3: Key count
watch -n 1 "redis-cli DBSIZE"
```

## Troubleshooting

### K6 Test Fails Immediately

**Problem**: `Error: Connection refused at 127.0.0.1:3001`

**Solution**:
```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Start backend if not running
cd api
npm run dev
```

### Database Connection Pool Exhausted

**Problem**: Test fails with "no connection available"

**Solution**:
```bash
# Increase pool size
echo "DB_WEBAPP_POOL_SIZE=30" >> .env

# Restart backend
pkill -f "tsx watch"
cd api
npm run dev
```

### Out of Memory Error

**Problem**: `JavaScript heap out of memory`

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run load:endurance
```

### High Error Rate During Test

**Problem**: 10%+ of requests failing

**Solution**:
1. Check backend logs: `tail -f api/logs/error.log`
2. Reduce user ramp-up speed: Modify test scenario
3. Verify database connectivity: `npm run check:db`
4. Check rate limiting: `redis-cli KEYS "rate-limit:*"`

## Performance Baselines

**Fleet-CTA Target Metrics** (Based on stress testing):

| Scenario | p50 | p95 | p99 | Error Rate | Throughput |
|----------|-----|-----|-----|------------|-----------|
| Normal (100 users) | 100ms | 300ms | 500ms | 0.05% | 1500 RPS |
| Normal (200 users) | 150ms | 450ms | 800ms | 0.1% | 2000 RPS |
| Spike (500 users) | 200ms | 800ms | 1500ms | 0.5% | 1000 RPS |
| Stress (1000 users) | 300ms | 1500ms | 2500ms | 1-2% | 600 RPS |
| Endurance (100 users, 1hr) | 100ms | 300ms | 500ms | 0.05% | 1500 RPS |

## Additional Resources

- K6 Documentation: https://k6.io/docs/
- Artillery Documentation: https://artillery.io/docs
- PostgreSQL Performance Tuning: https://wiki.postgresql.org/wiki/Performance_Optimization
- Redis Optimization: https://redis.io/topics/optimization
- Node.js Performance: https://nodejs.org/en/docs/guides/nodejs-performance/

## Questions & Support

For issues or questions:
1. Check logs: `tests/load/logs/`
2. Review results: `tests/load/results/`
3. Check troubleshooting section above
4. Contact: performance-team@capitaltechalliance.com
