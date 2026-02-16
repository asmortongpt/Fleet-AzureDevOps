# Load Testing Suite - File Index

Complete reference to all load testing files and documentation.

## Quick Navigation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[README.md](./README.md)** - Complete documentation
- **[../LOAD_TESTING_SETUP_SUMMARY.md](../LOAD_TESTING_SETUP_SUMMARY.md)** - Implementation summary

### In-Depth Guides
- **[TEST_MATRIX.md](./TEST_MATRIX.md)** - Test specifications and criteria
- **[../docs/PERFORMANCE_TESTING.md](../docs/PERFORMANCE_TESTING.md)** - Advanced performance guide

### Test Scenarios (K6)

#### Primary Scenarios
- **[scenarios/load-normal.js](./scenarios/load-normal.js)** (100 lines)
  - Normal load test: 0 → 100 → 200 users over 14 minutes
  - Daily operational validation
  - Run: `npm run load:normal`

- **[scenarios/load-spike.js](./scenarios/load-spike.js)** (90 lines)
  - Spike test: 50 → 500 users in 30 seconds
  - Traffic surge handling
  - Run: `npm run load:spike`

- **[scenarios/load-stress.js](./scenarios/load-stress.js)** (100 lines)
  - Stress test: Progressive ramp to 1000+ users
  - Breaking point identification
  - Run: `npm run load:stress`

- **[scenarios/load-endurance.js](./scenarios/load-endurance.js)** (150 lines)
  - Endurance test: 100 users for 70 minutes
  - Memory leak detection
  - Run: `npm run load:endurance`

#### API-Specific Tests
- **[api/vehicles.js](./api/vehicles.js)** (130 lines)
  - Vehicles API: List, search, filter, detail, telemetry
  - Load: 50-100 concurrent users
  - Run: `npm run load:api:vehicles`

- **[api/drivers.js](./api/drivers.js)** (150 lines)
  - Drivers API: List, search, performance, compliance
  - Load: 50-100 concurrent users
  - Run: `npm run load:api:drivers`

- **[api/database.js](./api/database.js)** (130 lines)
  - Database performance: Large results, aggregations, concurrent
  - Load: 30-60 concurrent users
  - Run: `npm run load:api:database`

### Artillery Configurations (YAML)

- **[artillery-normal.yml](./artillery-normal.yml)** (70 lines)
  - Normal load config with 4 weighted scenarios
  - Uses Artillery framework
  - Run: `npm run load:artillery:normal`

- **[artillery-spike.yml](./artillery-spike.yml)** (50 lines)
  - Spike test configuration
  - Allows 2% errors during spike
  - Run: `npm run load:artillery:spike`

- **[artillery-stress.yml](./artillery-stress.yml)** (60 lines)
  - Stress test configuration with progressive ramp
  - Allows 5% errors during stress
  - Run: `npm run load:artillery:stress`

### Utilities & Scripts

- **[run-all-tests.sh](./run-all-tests.sh)** (160 lines)
  - Automated test orchestrator
  - Runs tests in sequence with monitoring
  - Creates results and logs directories
  - Run: `./tests/load/run-all-tests.sh`

- **[analyze-results.js](./analyze-results.js)** (170 lines)
  - Results analyzer and formatter
  - Parses K6 JSON output
  - Generates performance assessment
  - Run: `npm run load:analyze`

- **[processor.js](./processor.js)** (50 lines)
  - Artillery processor for hooks
  - Tracks custom metrics
  - Logs slow requests
  - Used by: Artillery configurations

### Output Directories

- **[results/](./results/)** - Test results (JSON format)
  - Created automatically on test run
  - Files named: `{type}-{timestamp}.json`
  - Example: `normal-20240215-143022.json`

- **[logs/](./logs/)** - Test execution logs
  - Created automatically on test run
  - Files named: `{type}-{timestamp}.log`
  - Example: `normal-20240215-143022.log`

## Command Reference

### Quick Commands
```bash
npm run load:all              # Run all tests sequentially
npm run load:normal           # Normal load test (14 min)
npm run load:spike            # Spike test (2.5 min)
npm run load:stress           # Stress test (8.5 min)
npm run load:endurance        # Endurance test (70 min)
```

### API-Specific
```bash
npm run load:api:vehicles     # Vehicles API test
npm run load:api:drivers      # Drivers API test
npm run load:api:database     # Database test
```

### Artillery
```bash
npm run load:artillery:normal  # Artillery normal load
npm run load:artillery:spike   # Artillery spike test
npm run load:artillery:stress  # Artillery stress test
```

### Analysis
```bash
npm run load:analyze          # Analyze latest results
```

## Documentation Map

### Setup & Quick Start
```
QUICK_START.md          ← Start here (5 minutes)
README.md               ← Full documentation
INDEX.md                ← This file
```

### Test Specifications
```
TEST_MATRIX.md          ← Test details and criteria
LOAD_TESTING_SETUP_SUMMARY.md ← Implementation summary
```

### Performance Guide
```
../docs/PERFORMANCE_TESTING.md  ← In-depth guide (800+ lines)
  - Bottleneck identification
  - Optimization strategies
  - Monitoring guide
  - Troubleshooting
```

## File Statistics

| Category | Files | Lines | Purpose |
|----------|-------|-------|---------|
| **Scenarios** | 4 | 440 | K6 test scripts |
| **API Tests** | 3 | 410 | API-specific tests |
| **Artillery** | 3 | 180 | YAML configurations |
| **Scripts** | 2 | 330 | Orchestration & analysis |
| **Documentation** | 5 | 2500+ | Guides & references |
| **Total** | 17 | 3860+ | Complete test suite |

## Performance Targets

### Normal Operations
- Load: 100-200 concurrent users
- p95: < 400ms
- Error rate: < 0.1%
- Throughput: > 1500 RPS

### Peak Load
- Load: 500 concurrent users
- p95: < 800ms
- Error rate: < 0.5%
- Throughput: > 500 RPS

### Maximum Stress
- Load: 1000+ concurrent users
- p99: < 3000ms
- Error rate: < 2%
- Throughput: > 200 RPS

### Sustained (1 Hour)
- Load: 100 concurrent users
- p95: < 400ms (consistent)
- Error rate: < 0.1%
- Memory leak: < 50MB/hour

## Integration Points

### GitHub Actions
- **File**: `.github/workflows/load-testing.yml`
- **Schedule**: Daily at 2 AM UTC
- **Trigger**: Push to main, manual dispatch
- **Services**: PostgreSQL 16, Redis 7

### Package.json
- **12 npm scripts** for test execution
- **Located**: Root `package.json`
- **Prefix**: `load:`

## Endpoints Under Test

### Fleet Management
- `/api/vehicles` - List, search, filter
- `/api/vehicles/:id` - Detail
- `/api/vehicles/:id/telemetry` - Real-time data

### Driver Management
- `/api/drivers` - List, search, filter
- `/api/drivers/:id` - Detail
- `/api/drivers/:id/performance` - Metrics
- `/api/compliance/drivers/:id` - Compliance status

### Analytics & Dashboard
- `/api/analytics/fleet-metrics` - Complex aggregation
- `/api/vehicles/telemetry/current` - Real-time tracking
- `/api/compliance/summary` - Summary data
- `/api/alerts` - Alert management

## Getting Started

### 1. Install Tools (One-time)
```bash
brew install k6
npm install -g artillery
```

### 2. Start Backend
```bash
cd api
npm run dev
```

### 3. Run First Test
```bash
npm run load:normal
```

### 4. Check Results
```bash
npm run load:analyze
```

### 5. Review Guide
- Read: `docs/PERFORMANCE_TESTING.md`
- Reference: `tests/load/TEST_MATRIX.md`

## Key Features

✅ **4 Scenario Types**: Normal, spike, stress, endurance
✅ **3 API Tests**: Vehicles, drivers, database
✅ **K6 + Artillery**: Flexible testing frameworks
✅ **Custom Metrics**: Response times, errors, throughput
✅ **Automated Analysis**: Trend detection and alerts
✅ **CI/CD Integration**: Nightly automated testing
✅ **Comprehensive Docs**: 2000+ lines of guides
✅ **Slack Notifications**: Test result alerts

## File Locations

```
Fleet-CTA/
├── tests/load/
│   ├── INDEX.md                   ← You are here
│   ├── QUICK_START.md             ← 5-min guide
│   ├── README.md                  ← Full docs
│   ├── TEST_MATRIX.md             ← Specifications
│   ├── scenarios/
│   │   ├── load-normal.js
│   │   ├── load-spike.js
│   │   ├── load-stress.js
│   │   └── load-endurance.js
│   ├── api/
│   │   ├── vehicles.js
│   │   ├── drivers.js
│   │   └── database.js
│   ├── artillery-*.yml
│   ├── run-all-tests.sh
│   ├── analyze-results.js
│   ├── processor.js
│   ├── results/                   ← Auto-created
│   └── logs/                      ← Auto-created
├── .github/workflows/
│   └── load-testing.yml
├── docs/
│   └── PERFORMANCE_TESTING.md
├── LOAD_TESTING_SETUP_SUMMARY.md
└── package.json
```

## Support & Troubleshooting

### Common Issues
1. **Backend not responding**
   - See: `QUICK_START.md` → Troubleshooting
   - Or: `docs/PERFORMANCE_TESTING.md` → Troubleshooting

2. **Database connection pool exhausted**
   - See: `docs/PERFORMANCE_TESTING.md` → Connection Pool

3. **High error rate**
   - See: `docs/PERFORMANCE_TESTING.md` → Error Handling

4. **Memory leaks**
   - See: `docs/PERFORMANCE_TESTING.md` → Memory Monitoring

## Next Steps

1. **Quick Start**: `npm run load:normal`
2. **Review Results**: `npm run load:analyze`
3. **Deep Dive**: Read `docs/PERFORMANCE_TESTING.md`
4. **Optimization**: Follow recommendations in guide
5. **CI/CD**: Configure Slack webhook (optional)

## Additional Resources

- **K6 Documentation**: https://k6.io/docs/
- **Artillery Documentation**: https://artillery.io/docs
- **PostgreSQL Performance**: https://wiki.postgresql.org/wiki/Performance_Optimization
- **Node.js Performance**: https://nodejs.org/en/docs/guides/nodejs-performance/

---

**Last Updated**: February 15, 2026
**Status**: ✅ Production Ready
**Commit**: `838ba9603`

For quick start: See `QUICK_START.md`
For full guide: See `README.md`
For specifications: See `TEST_MATRIX.md`
