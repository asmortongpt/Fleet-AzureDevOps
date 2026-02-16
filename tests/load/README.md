# Load and Stress Testing Suite

Comprehensive load and stress testing for Fleet-CTA using K6 and Artillery.

## Overview

This directory contains performance testing scripts to validate Fleet-CTA's production readiness under various load conditions.

## Tools

- **K6** - Modern load testing tool (JavaScript-based)
- **Artillery** - YAML-configured load testing
- **Custom Metrics** - Real-time performance tracking

## Quick Start

### Install Dependencies

```bash
# Install K6 (macOS)
brew install k6

# Install Artillery globally
npm install -g artillery

# Or use npm locally (if node_modules k6/artillery installed)
npx k6 version
npx artillery --version
```

### Run Tests

```bash
# Run normal load test (5 min, 0-200 users)
k6 run tests/load/scenarios/load-normal.js

# Run spike test (sudden 10x traffic increase)
k6 run tests/load/scenarios/load-spike.js

# Run stress test (ramp to breaking point)
k6 run tests/load/scenarios/load-stress.js

# Run endurance test (1 hour sustained load)
k6 run tests/load/scenarios/load-endurance.js

# Run all tests in sequence
./tests/load/run-all-tests.sh

# Run specific API test
k6 run tests/load/api/vehicles.js
k6 run tests/load/api/drivers.js
k6 run tests/load/api/dashboard.js
```

## Test Scenarios

### 1. Normal Load (load-normal.js)
- Simulates realistic daily load
- 0 → 100 → 200 users over 14 minutes
- Validates response times under normal conditions
- **Thresholds**: p95 < 500ms, p99 < 1000ms, error rate < 0.1%

### 2. Spike Test (load-spike.js)
- Sudden 10x traffic increase
- 50 → 500 users over 30 seconds
- Tests queue handling and rate limiting
- **Thresholds**: p95 < 1000ms, error rate < 1%

### 3. Stress Test (load-stress.js)
- Ramps up to breaking point
- 0 → 1000+ users progressively
- Identifies system limits
- **Thresholds**: p99 < 3000ms, error rate < 5%

### 4. Endurance Test (load-endurance.js)
- Sustained load for 1 hour
- 100 concurrent users throughout
- Tests memory leaks and connection stability
- **Thresholds**: p95 < 500ms, no memory growth

## API Tests

### Fleet Management (vehicles.js)
- List vehicles (paginated)
- Search vehicles
- Add vehicle
- Update vehicle
- Delete vehicle
- Concurrent operations

### Driver Management (drivers.js)
- List drivers
- Search drivers
- Add driver
- Update driver
- Performance metrics
- Compliance checks

### Dashboard (dashboard.js)
- Fleet metrics
- Driver performance
- Telematics data
- Real-time tracking

### Authentication (auth.js)
- JWT validation
- RBAC checks
- Session management
- Token refresh

### Database (database.js)
- Connection pool limits
- Query performance
- Concurrent transactions
- Large result sets

## Test Results

Results are saved to:
- `tests/load/results/` - K6 JSON summaries
- `tests/load/reports/` - HTML reports
- `tests/load/metrics/` - Detailed metrics

Example:
```bash
k6 run tests/load/scenarios/load-normal.js \
  --out json=results/normal-$(date +%Y%m%d-%H%M%S).json
```

## Interpreting Results

### Key Metrics

**Response Time Percentiles**:
- p50 (median): Target < 200ms
- p95: Target < 500ms
- p99: Target < 1000ms

**Error Rate**:
- Normal load: < 0.1%
- Spike: < 1%
- Stress: < 5%

**Throughput**:
- Requests per second at various user counts
- Should be relatively linear up to bottleneck

**Resource Usage**:
- CPU utilization
- Memory usage
- Database connections
- Redis connections

### Common Issues

**High Response Times**:
- Check database query performance
- Verify Redis cache hit rate
- Review rate limiting configuration
- Check connection pool size

**High Error Rate**:
- Review error logs: `api/logs/error.log`
- Check database connectivity
- Verify rate limit thresholds
- Review RBAC permission checks

**Memory Leaks**:
- Check endurance test results
- Compare memory usage start vs end
- Review event listener cleanup
- Check database connection closure

## Prerequisites

### Environment Setup

1. **Backend running**: `npm run dev` from `/api`
2. **Database ready**: PostgreSQL with tables seeded
3. **Redis running**: For caching and rate limiting
4. **Pool size**: Set `DB_WEBAPP_POOL_SIZE=30` in `.env`
5. **Auth bypass** (optional): Set `SKIP_AUTH=true` for test simplicity

### Configuration

Edit test files to adjust:
- `BASE_URL` - API endpoint
- User ramp-up rates
- Threshold values
- Test duration

## Advanced Usage

### Custom Metrics

Tests track:
- Response time distribution
- Error rates and types
- Request throughput
- Custom business metrics

Example custom metric:
```javascript
const vehicleListDuration = new Trend('vehicle_list_duration');
const vehicleListErrors = new Counter('vehicle_list_errors');

const res = http.get(`${BASE_URL}/api/vehicles`);
vehicleListDuration.add(res.timings.duration);
if (res.status !== 200) {
  vehicleListErrors.add(1);
}
```

### Generate HTML Reports

```bash
# Run test and generate report
k6 run tests/load/scenarios/load-normal.js \
  --out json=results/normal.json

# Convert JSON to HTML
npm run load:report results/normal.json
```

## CI/CD Integration

### GitHub Actions

Automated load tests run nightly:
- Repository: `.github/workflows/load-testing.yml`
- Schedule: Daily at 2 AM UTC
- Artifacts: Results stored for trend analysis

### Running in CI

```yaml
- name: Run Load Tests
  run: |
    npm run load:normal
    npm run load:spike
    npm run load:database
```

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| p50 Response Time | < 200ms | < 500ms |
| p95 Response Time | < 500ms | < 1000ms |
| p99 Response Time | < 1000ms | < 3000ms |
| Error Rate (normal) | < 0.1% | < 1% |
| Error Rate (spike) | < 1% | < 5% |
| Throughput @ 100 users | > 1000 req/s | > 500 req/s |
| Throughput @ 500 users | > 500 req/s | > 200 req/s |
| Memory Leak | None | < 50MB/hour |

## Troubleshooting

### K6 Connection Refused

**Problem**: `Error: Connection refused`

**Solution**:
```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Check if port changed
lsof -i :3001
```

### Database Connection Pool Exhausted

**Problem**: Test fails with connection pool exhaustion

**Solution**:
```bash
# Increase pool size in .env
DB_WEBAPP_POOL_SIZE=30

# Restart backend
pkill -f "tsx watch"
npm run dev
```

### High Error Rate During Test

**Problem**: Errors spike during load test

**Solution**:
1. Check backend logs: `api/logs/error.log`
2. Review rate limiting: Check `src/middleware/rate-limit.ts`
3. Verify database: `npm run check:db`
4. Reduce user ramp-up speed in test script

### Memory Usage Growing

**Problem**: Memory increases during endurance test

**Solution**:
1. Check for event listener leaks
2. Verify connection closure
3. Review cache eviction policy
4. Check for circular references

## Best Practices

1. **Run in isolated environment** - Use dedicated test database
2. **Baseline first** - Establish baseline before optimization
3. **One variable at a time** - Change one thing per test
4. **Reproduce issues** - Run twice to confirm results
5. **Monitor resources** - Watch CPU, memory, disk during tests
6. **Archive results** - Keep historical data for trending

## Additional Resources

- K6 Documentation: https://k6.io/docs/
- Artillery Documentation: https://artillery.io/docs
- Performance Testing Guide: docs/PERFORMANCE_TESTING.md
- Monitoring Guide: docs/MONITORING_SETUP.md

## Support

For issues or questions:
1. Review test logs in `tests/load/logs/`
2. Check troubleshooting section
3. Review GitHub issues: https://github.com/yourorg/fleet-cta/issues
4. Contact: performance-team@capitaltechalliance.com
