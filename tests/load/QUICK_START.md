# Load Testing Quick Start Guide

Get started with Fleet-CTA load testing in 5 minutes.

## Installation (One-Time Setup)

```bash
# Install K6
brew install k6

# Install Artillery globally
npm install -g artillery

# Verify installations
k6 version
artillery --version
```

## Setup Backend

```bash
# Terminal 1: Start Backend
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api
npm run dev

# Terminal 2: Verify Backend is Ready
curl http://localhost:3001/api/health
# Should return 200 OK
```

## Run Your First Load Test

```bash
# Terminal 3: Run Normal Load Test (5 minutes)
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA
npm run load:normal

# Or run all tests in sequence
npm run load:all
```

## Check Results

```bash
# Analyze results
npm run load:analyze

# View all results files
ls -lah tests/load/results/

# View test logs
ls -lah tests/load/logs/
```

## Common Commands

```bash
# Run specific test
npm run load:normal          # Normal load (14 min)
npm run load:spike           # Spike test (2.5 min)
npm run load:stress          # Stress test (8.5 min)
npm run load:endurance       # Endurance test (70 min)

# Run API-specific tests
npm run load:api:vehicles    # Vehicle endpoints
npm run load:api:drivers     # Driver endpoints
npm run load:api:database    # Database performance

# Run Artillery tests
npm run load:artillery:normal # Artillery normal load
npm run load:artillery:spike  # Artillery spike test
npm run load:artillery:stress # Artillery stress test

# Analyze latest results
npm run load:analyze
```

## What to Expect

### Normal Load Test (Recommended for First Run)

```
Duration: 14 minutes
Users: 0 → 100 → 200
Success Criteria:
  ✓ p95 < 500ms
  ✓ p99 < 1000ms
  ✓ Error rate < 0.1%
```

**Example Output**:
```
http_req_duration
  p(50): 142ms
  p(95): 487ms
  p(99): 942ms

http_req_failed: 0%

Status: ✓ PASSED
```

### Spike Test

```
Duration: 2.5 minutes
Spike: 50 → 500 users in 30 seconds
Success Criteria:
  ✓ p95 < 1000ms
  ✓ Error rate < 1%
  ✓ Recovers in < 30 seconds
```

### Stress Test

```
Duration: 8.5 minutes
Max Users: 1000+
Success Criteria:
  ✓ p99 < 3000ms
  ✓ Error rate < 5%
  ✓ Graceful degradation
```

### Endurance Test

```
Duration: 70 minutes (1 hour)
Load: 100 sustained users
Success Criteria:
  ✓ Consistent p95 < 500ms
  ✓ No memory leaks
  ✓ Zero connection issues
```

## Troubleshooting

### Backend Not Responding

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# If not running, start it
cd api
npm run dev
```

### Database Connection Pool Exhausted

```bash
# Increase pool size
echo "DB_WEBAPP_POOL_SIZE=30" >> .env

# Restart backend
pkill -f "tsx watch"
cd api
npm run dev
```

### High Error Rate

```bash
# Check backend logs
tail -f api/logs/error.log

# Verify database
npm run check:db

# Check rate limiting
redis-cli KEYS "rate-limit:*"
```

### K6 Not Found

```bash
# Install K6
brew install k6

# Verify
k6 version
```

## Environment Variables

```bash
# Custom API URL
BASE_URL=http://staging-api:3001 npm run load:normal

# Custom think time (seconds between requests)
THINK_TIME=2 npm run load:normal

# Custom test duration
TEST_DURATION=30m npm run load:normal

# Combine multiple
BASE_URL=http://staging:3001 THINK_TIME=1 npm run load:spike
```

## Performance Expectations

### Good Performance
```
✓ p95 < 500ms
✓ p99 < 1000ms
✓ Error rate < 0.1%
✓ Throughput > 1000 RPS
→ System is ready for production
```

### Acceptable Performance
```
⚠ p95 < 800ms
⚠ p99 < 1500ms
⚠ Error rate < 0.5%
⚠ Throughput > 500 RPS
→ Review and optimize before high-load production
```

### Poor Performance
```
✗ p95 > 1000ms
✗ p99 > 2000ms
✗ Error rate > 1%
✗ Throughput < 300 RPS
→ Investigate bottlenecks before production
```

## Monitoring During Tests

### Real-Time Monitoring

```bash
# Terminal 1: Backend logs
tail -f api/logs/error.log

# Terminal 2: Database connections
watch -n 1 "redis-cli DBSIZE"

# Terminal 3: System resources
top -l 1 -stats pid,command,cpu,mem

# Terminal 4: Run test
npm run load:normal
```

## Next Steps

1. **Run normal load test**: `npm run load:normal`
2. **Check results**: `npm run load:analyze`
3. **Run spike test**: `npm run load:spike`
4. **Review bottlenecks**: See `docs/PERFORMANCE_TESTING.md`
5. **Optimize**: Make improvements and re-test
6. **Archive results**: Compare trends over time

## Full Documentation

For detailed information, see:
- `tests/load/README.md` - Complete setup and usage
- `docs/PERFORMANCE_TESTING.md` - In-depth guide
- `tests/load/TEST_MATRIX.md` - Test matrix and criteria

## Support

**Issues?**
1. Check: `tests/load/logs/` for error logs
2. Review: `tests/load/results/` for detailed metrics
3. Read: `docs/PERFORMANCE_TESTING.md` Troubleshooting section
4. Contact: performance-team@capitaltechalliance.com

## Key Files

```
tests/load/
├── README.md                          # Complete documentation
├── QUICK_START.md                     # This file
├── TEST_MATRIX.md                     # Test matrix and criteria
├── scenarios/
│   ├── load-normal.js                 # Normal load test
│   ├── load-spike.js                  # Spike test
│   ├── load-stress.js                 # Stress test
│   └── load-endurance.js              # 1-hour sustained
├── api/
│   ├── vehicles.js                    # Vehicles API test
│   ├── drivers.js                     # Drivers API test
│   └── database.js                    # Database test
├── artillery-*.yml                    # Artillery configs
├── run-all-tests.sh                   # Test runner script
├── analyze-results.js                 # Results analyzer
├── processor.js                       # Artillery processor
├── results/                           # Test results (JSON)
└── logs/                              # Test logs
```

## Tips & Tricks

### Run with Custom Configuration

```bash
# Run at staging environment
BASE_URL=https://staging-api.example.com npm run load:normal

# Run with increased load
THINK_TIME=0.5 npm run load:spike

# Run multiple tests
npm run load:normal && npm run load:spike && npm run load:stress
```

### Capture Performance Baseline

```bash
# Run and save results
k6 run tests/load/scenarios/load-normal.js \
  --out json=results/baseline-$(date +%Y%m%d-%H%M%S).json

# Compare with new test
npm run load:analyze results/baseline-20240215-120000.json
```

### Monitor Specific Endpoint

```bash
# Run just vehicles API test
npm run load:api:vehicles

# Run just drivers API test
npm run load:api:drivers

# Run just database test
npm run load:api:database
```

### Debug Failed Requests

```bash
# Check logs for errors
grep "failed\|error\|500" tests/load/logs/*.log

# Review backend logs
grep "ERROR\|WARN" api/logs/error.log

# Check database logs
grep "ERROR" api/logs/application.log
```

## Performance Targets

| Metric | Target | Target | Target |
|--------|--------|--------|--------|
| | Normal | Peak | Stress |
| **Load** | 100 users | 500 users | 1000 users |
| **p95** | < 400ms | < 800ms | < 1500ms |
| **p99** | < 800ms | < 1500ms | < 2500ms |
| **Error Rate** | < 0.1% | < 0.5% | < 2% |
| **Throughput** | > 1500 RPS | > 500 RPS | > 200 RPS |

---

**Ready to test? Run**: `npm run load:normal`
