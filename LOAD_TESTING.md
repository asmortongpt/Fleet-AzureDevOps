# Fleet Management System - Load Testing Guide

## Overview

This document provides comprehensive guidance on load testing the Fleet Management System API using k6. The load testing strategy validates system performance under various load conditions, from baseline to extreme scenarios.

## Load Test Scenarios

### 1. Baseline Test (25 Concurrent Users)

**Purpose**: Establish performance baseline and validate optimal response times

**File**: `tests/load/baseline-test.js`

**Configuration**:
- Ramp up: 30s to 10 users
- Sustain: 1m at 10 users
- Ramp up: 30s to 25 users
- Sustain: 2m at 25 users
- Ramp down: 30s to 0 users

**Thresholds**:
- P95 latency: <500ms
- Error rate: <1%
- Login success rate: >95%

**Usage**:
```bash
k6 run tests/load/baseline-test.js
```

**Expected Results**:
```
✅ P95 Latency: ~200-300ms
✅ Error Rate: <0.1%
✅ Throughput: 50-100 req/s
```

### 2. Stress Test (300 Concurrent Users)

**Purpose**: Find system breaking point and degradation threshold

**File**: `tests/load/stress-test.js`

**Configuration**:
- Ramp up: 1m to 50 users
- Ramp up: 2m to 100 users
- Ramp up: 2m to 200 users
- Ramp up: 2m to 300 users (breaking point)
- Ramp down: 1m to 0 users

**Thresholds**:
- P99 latency: <2000ms
- Success rate: >90%

**Usage**:
```bash
k6 run tests/load/stress-test.js
```

**Expected Results**:
```
⚠️ P95 Latency: ~800-1200ms
⚠️ Error Rate: 2-5%
⚠️ Throughput: 200-400 req/s
```

### 3. Target Load Test (1,000 Concurrent Users) ✅ CRITICAL

**Purpose**: Validate production capacity at target load

**File**: `tests/load/target-1000-users.js`

**Configuration**:
- Warm up: 2m to 100 users
- Ramp up: 3m to 500 users
- Ramp up: 2m to 1,000 users
- **Sustain: 5m at 1,000 users** ← Critical validation period
- Ramp down: 2m to 500 users
- Cool down: 1m to 0 users

**Thresholds (CRITICAL)**:
- ✅ **P95 latency: <500ms**
- ✅ **P99 latency: <1000ms**
- ✅ **Error rate: <1%**
- ✅ **Login success rate: >99%**
- ✅ **Throughput: >100 req/s**

**Usage**:
```bash
# Run against local API
k6 run tests/load/target-1000-users.js

# Run against production API
API_URL=https://fleet-api.capitaltechalliance.com k6 run tests/load/target-1000-users.js

# Run with HTML report
k6 run tests/load/target-1000-users.js

# View results
open tests/load/results/1k-users-report.html
```

**Expected Results**:
```
✅ P95 Latency: <500ms (PASS)
✅ P99 Latency: <1000ms (PASS)
✅ Error Rate: <1% (PASS)
✅ Throughput: >100 req/s (PASS)

TEST PASSED ✅
```

**User Workflows Tested**:
- 40% Dashboard viewers (read-only)
- 30% Fleet managers (CRUD operations)
- 20% Drivers (trip logging, fuel purchases)
- 10% Admins (system management)

### 4. Stretch Test (10,000 Concurrent Users) 🎯

**Purpose**: Validate extreme scalability (stretch goal)

**File**: `tests/load/stretch-10k-users.js`

**Configuration**:
- Warm up: 5m to 1,000 users
- Ramp up: 5m to 5,000 users
- Ramp up: 3m to 10,000 users
- Sustain: 5m at 10,000 users
- Ramp down: 3m to 5,000 users
- Cool down: 2m to 0 users

**Thresholds (Relaxed)**:
- P95 latency: <1000ms
- P99 latency: <2000ms
- Error rate: <5%
- Login success rate: >95%

**Usage**:
```bash
k6 run tests/load/stretch-10k-users.js
```

**Expected Results**:
```
🎯 P95 Latency: <1000ms
🎯 Error Rate: <5%
🎯 Throughput: >500 req/s
```

## Load Test Metrics

### Key Performance Indicators (KPIs)

| Metric | Description | Good | Acceptable | Poor |
|--------|-------------|------|------------|------|
| P95 Latency | 95th percentile response time | <300ms | <500ms | >500ms |
| P99 Latency | 99th percentile response time | <500ms | <1000ms | >1000ms |
| Error Rate | % of failed requests | <0.1% | <1% | >1% |
| Throughput | Requests per second | >200 | >100 | <100 |
| Login Success | % of successful logins | >99% | >95% | <95% |

### Custom Metrics

k6 load tests track additional custom metrics:

- `login_success` - Rate of successful authentications
- `api_response_time` - Detailed API response times
- `api_errors` - Count of API errors
- `active_users` - Gauge of concurrent active users
- `successful_requests` - Counter of 2xx responses

## Running Load Tests

### Prerequisites

1. **Install k6**:
   ```bash
   # macOS
   brew install k6

   # Linux
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Ensure API is running**:
   ```bash
   # Local development
   cd api && npm run dev

   # Or use production API
   API_URL=https://fleet-api.example.com
   ```

3. **Create results directory**:
   ```bash
   mkdir -p tests/load/results
   ```

### Execution Steps

#### 1. Baseline Validation

Run baseline test first to establish performance baseline:

```bash
k6 run tests/load/baseline-test.js
```

**Pass Criteria**:
- ✅ P95 < 500ms
- ✅ Error rate < 1%
- ✅ All thresholds green

#### 2. Target Load Validation (CRITICAL)

Run 1,000 concurrent user test:

```bash
k6 run tests/load/target-1000-users.js
```

**Pass Criteria**:
- ✅ P95 < 500ms @ 1,000 users
- ✅ Error rate < 1%
- ✅ Test duration: 15 minutes
- ✅ All thresholds green

**If test fails**:
1. Review API server logs
2. Check database query performance
3. Verify horizontal scaling configuration
4. Review rate limiting settings
5. Check connection pool sizes

#### 3. Stress Testing

Run stress test to find breaking point:

```bash
k6 run tests/load/stress-test.js
```

**Expected Outcome**:
- System should gracefully degrade
- Error rate should increase gradually
- No catastrophic failures

#### 4. Stretch Goal (Optional)

Run 10K user test if baseline and target pass:

```bash
k6 run tests/load/stretch-10k-users.js
```

### Interpreting Results

#### Successful Test Output

```
scenarios: (100.00%) 1 scenario, 1000 max VUs, 15m30s max duration
  default: Up to 1000 looping VUs for 15m0s over 6 stages

✓ login successful
✓ Get vehicles: status 200
✓ Get vehicles: response < 500ms

checks.........................: 99.8% ✓ 149700   ✗ 300
data_received..................: 1.2 GB 1.3 MB/s
data_sent......................: 89 MB  95 kB/s
http_req_duration..............: avg=287ms min=42ms med=265ms max=892ms p(95)=448ms p(99)=687ms
  { expected_response:true }...: avg=287ms min=42ms med=265ms max=892ms p(95)=448ms p(99)=687ms
http_req_failed................: 0.20% ✓ 300      ✗ 149700
http_reqs......................: 150000 166.66/s
login_success..................: 99.9% ✓ 14970    ✗ 30
api_response_time..............: avg=287ms min=42ms med=265ms max=892ms p(95)=448ms p(99)=687ms
api_errors.....................: 300
successful_requests............: 149700

✅ P95 Latency: 448ms (Target: <500ms) - PASS
✅ P99 Latency: 687ms (Target: <1000ms) - PASS
✅ Error Rate: 0.20% (Target: <1%) - PASS

✅ TEST PASSED
```

#### Failed Test Output

```
ERRO[0234] some thresholds have failed

✗ http_req_duration: p(95)=687ms (target <500ms)
✗ http_req_failed: rate=0.02 (target <0.01)

❌ P95 Latency: 687ms (Target: <500ms) - FAIL
❌ Error Rate: 2.0% (Target: <1%) - FAIL

❌ TEST FAILED
```

## Load Test Reports

### HTML Report

The target 1K user test generates an HTML report:

```bash
# Report location
tests/load/results/1k-users-report.html

# View report
open tests/load/results/1k-users-report.html
```

**Report Contents**:
- Performance graphs (latency over time)
- Throughput charts
- Error rate trends
- User load progression
- Detailed metrics breakdown

### JSON Summary

Raw test data is saved to JSON:

```bash
# Summary location
tests/load/results/1k-users-summary.json

# View summary
cat tests/load/results/1k-users-summary.json | jq '.metrics'
```

## Performance Tuning

### API Server Optimization

If load tests fail, optimize API server:

1. **Horizontal Scaling**:
   ```yaml
   # Kubernetes deployment
   replicas: 5  # Scale to 5+ pods for 1K users
   ```

2. **Connection Pooling**:
   ```typescript
   // api/src/database.ts
   const pool = new Pool({
     max: 20,  // Increase pool size
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

3. **Rate Limiting**:
   ```typescript
   // api/src/middleware/rate-limit.ts
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100,  // Adjust based on load test results
   });
   ```

4. **Caching**:
   ```typescript
   // Enable Redis caching for frequently accessed data
   const cache = new Redis({
     host: process.env.REDIS_HOST,
     port: 6379,
     ttl: 300,  // 5 minute cache
   });
   ```

5. **Database Indexing**:
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_vehicles_tenant_id ON vehicles(tenant_id);
   CREATE INDEX idx_vehicles_status ON vehicles(status);
   CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
   ```

### Database Optimization

1. **Query Optimization**:
   - Use `EXPLAIN ANALYZE` to identify slow queries
   - Add indexes on foreign keys
   - Limit `SELECT *` queries
   - Use pagination for large result sets

2. **Connection Pooling**:
   ```typescript
   // Increase max connections
   max_connections = 200  // PostgreSQL config
   ```

3. **Read Replicas**:
   - Route read-only queries to read replicas
   - Use write replica for CRUD operations

## CI/CD Integration

### GitHub Actions Workflow

Add load testing to CI/CD pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Testing

on:
  push:
    branches: [main, feat/*]
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2 AM UTC

jobs:
  baseline-load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          sudo apt-get update
          sudo apt-get install k6

      - name: Run baseline test
        run: k6 run tests/load/baseline-test.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: tests/load/results/
          retention-days: 30
```

### Manual Validation

Before production deployment:

```bash
# 1. Run baseline test
k6 run tests/load/baseline-test.js

# 2. Run target 1K user test
k6 run tests/load/target-1000-users.js

# 3. Verify all thresholds pass
# 4. Review HTML report
# 5. Approve deployment
```

## Troubleshooting

### High Latency (P95 > 500ms)

**Possible Causes**:
- Insufficient database connection pool
- Missing database indexes
- Slow API queries
- Network latency
- Insufficient horizontal scaling

**Solutions**:
1. Run `EXPLAIN ANALYZE` on slow queries
2. Add database indexes
3. Increase connection pool size
4. Scale API pods horizontally
5. Enable caching for read-heavy endpoints

### High Error Rate (>1%)

**Possible Causes**:
- Database connection exhaustion
- Rate limiting too aggressive
- Application crashes
- Memory leaks

**Solutions**:
1. Check API server logs for errors
2. Verify database connection pool settings
3. Adjust rate limiting configuration
4. Monitor memory usage during test
5. Check for connection leaks

### Low Throughput (<100 req/s)

**Possible Causes**:
- Insufficient API replicas
- Database bottleneck
- Network bandwidth limits

**Solutions**:
1. Scale API horizontally (add more pods)
2. Optimize database queries
3. Enable database read replicas
4. Increase network bandwidth

## Best Practices

### Before Running Load Tests

1. ✅ Run in non-production environment first
2. ✅ Notify team before running tests
3. ✅ Ensure monitoring/logging is enabled
4. ✅ Have rollback plan ready
5. ✅ Review API server resources (CPU, memory, disk)

### During Load Tests

1. 📊 Monitor API server metrics (CPU, memory, connections)
2. 📊 Monitor database metrics (connections, query time, locks)
3. 📊 Monitor network metrics (bandwidth, latency)
4. 📊 Watch for errors in application logs
5. 📊 Track custom business metrics

### After Load Tests

1. 📈 Review HTML reports
2. 📈 Analyze performance trends
3. 📈 Document any issues found
4. 📈 Create optimization tickets
5. 📈 Update performance baselines

## Success Criteria

### Team 4 Completion Requirements

- ✅ Baseline test passes (P95 <500ms @ 25 users)
- ✅ **Target test passes (P95 <500ms @ 1,000 users)** ← CRITICAL
- ✅ Error rate <1% at target load
- ✅ Load test automation configured in CI/CD
- ✅ HTML reports generated
- ✅ Documentation complete

### Evidence Package

Required artifacts for Team 4 completion:

1. ✅ Load test scripts (`tests/load/*.js`)
2. ✅ Test execution logs
3. ✅ HTML reports (`tests/load/results/*.html`)
4. ✅ JSON summaries (`tests/load/results/*.json`)
5. ✅ Performance graphs
6. ✅ This documentation (LOAD_TESTING.md)

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/performance-testing/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [k6 Metrics](https://k6.io/docs/using-k6/metrics/)

---

**Last Updated**: 2025-12-09
**Load Testing Version**: 1.0.0
**Target Validation**: P95 <500ms @ 1,000 concurrent users ✅
