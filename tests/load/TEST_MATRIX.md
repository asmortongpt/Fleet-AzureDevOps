# Load Testing Matrix

Comprehensive matrix of all load testing scenarios, endpoints, and success criteria.

## Test Scenario Matrix

### Scenario 1: Normal Load (load-normal.js)

| Aspect | Details |
|--------|---------|
| **Duration** | 14 minutes |
| **User Ramp** | 0 → 100 → 200 users |
| **Think Time** | 1 second |
| **Purpose** | Validate daily operational load |
| **Priority** | HIGH - Run daily |
| **Command** | `npm run load:normal` |

**Stages**:
1. Warm up (2 min): 0 → 100 users
2. Normal (5 min): 100 users sustained
3. Ramp up (2 min): 100 → 200 users
4. Load (5 min): 200 users sustained
5. Cool down (1 min): 200 → 0 users

**Success Criteria**:
- ✓ p50 < 200ms
- ✓ p95 < 500ms
- ✓ p99 < 1000ms
- ✓ Error rate < 0.1%

---

### Scenario 2: Spike Test (load-spike.js)

| Aspect | Details |
|--------|---------|
| **Duration** | 2.5 minutes |
| **User Spike** | 50 → 500 users (10x) |
| **Spike Duration** | 30 seconds |
| **Think Time** | 0.5 seconds |
| **Purpose** | Validate spike handling |
| **Priority** | HIGH - Run before releases |
| **Command** | `npm run load:spike` |

**Stages**:
1. Baseline (1 min): 50 users
2. Spike (30s): 50 → 500 users
3. Recovery (1 min): 500 → 50 users

**Success Criteria**:
- ✓ p95 < 1000ms (degraded acceptable)
- ✓ p99 < 2000ms
- ✓ Error rate < 1%
- ✓ Recovery time < 30 seconds

---

### Scenario 3: Stress Test (load-stress.js)

| Aspect | Details |
|--------|---------|
| **Duration** | 8.5 minutes |
| **Max Users** | 1000+ concurrent |
| **Ramp Duration** | Progressive over 3 min |
| **Peak Duration** | 3 minutes |
| **Think Time** | 0.2 seconds |
| **Purpose** | Find breaking point |
| **Priority** | MEDIUM - Run pre-release |
| **Command** | `npm run load:stress` |

**Stages**:
1. Ramp (30s): 100 users
2. Increase (1 min): 500 users
3. Heavy (2 min): 1000 users
4. Maximum (3 min): 1000 users
5. Cool down (2 min): 1000 → 0 users

**Success Criteria**:
- ✓ p99 < 3000ms
- ✓ Error rate < 5%
- ✓ No cascading failures
- ✓ System recovers after load reduction

---

### Scenario 4: Endurance Test (load-endurance.js)

| Aspect | Details |
|--------|---------|
| **Duration** | 70 minutes |
| **Sustained Load** | 100 concurrent users |
| **Total Requests** | ~20,000+ |
| **Purpose** | Detect memory leaks |
| **Priority** | MEDIUM - Run weekly |
| **Command** | `npm run load:endurance` |

**Stages**:
1. Warm up (5 min): Ramp to 100 users
2. Sustained (60 min): 100 users constant
3. Cool down (5 min): Ramp to 0 users

**Success Criteria**:
- ✓ p95 < 500ms (consistent)
- ✓ Error rate < 0.1%
- ✓ Memory growth < 50MB/hour
- ✓ No connection leaks
- ✓ Cache remains effective

---

## Endpoint Test Matrix

### Fleet Management Endpoints

| Endpoint | Method | Scenario | Success |
|----------|--------|----------|---------|
| `/api/vehicles` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/vehicles?limit=20&offset=0` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/vehicles?search=term` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/vehicles?status=active` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/vehicles/:id` | GET | Normal, Spike, Stress, Endurance | 200 or 404 |
| `/api/vehicles/:id/telemetry` | GET | Normal, Spike, Stress, Endurance | 200 or 404 |
| `/api/vehicles/geofence/alerts` | GET | Normal, Spike, Stress, Endurance | 200 OK |

**Response Time Targets**:
- List: < 500ms (p95)
- Detail: < 300ms (p95)
- Telemetry: < 500ms (p95)

---

### Driver Management Endpoints

| Endpoint | Method | Scenario | Success |
|----------|--------|----------|---------|
| `/api/drivers` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/drivers?limit=20&offset=0` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/drivers?search=term` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/drivers?status=active` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/drivers/:id` | GET | Normal, Spike, Stress, Endurance | 200 or 404 |
| `/api/drivers/:id/performance` | GET | Normal, Spike, Stress, Endurance | 200 or 404 |
| `/api/drivers/:id/violations` | GET | Normal, Spike, Stress, Endurance | 200 or 404 |
| `/api/drivers/summary` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/compliance/drivers/:id` | GET | Normal, Spike, Stress, Endurance | 200 or 404 |

**Response Time Targets**:
- List: < 500ms (p95)
- Detail: < 300ms (p95)
- Performance: < 500ms (p95)
- Compliance: < 500ms (p95)

---

### Analytics & Dashboard Endpoints

| Endpoint | Method | Scenario | Success |
|----------|--------|----------|---------|
| `/api/analytics/fleet-metrics` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/vehicles/telemetry/current` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/compliance/summary` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/alerts?limit=20` | GET | Normal, Spike, Stress, Endurance | 200 OK |
| `/api/alerts/active` | GET | Normal, Spike, Stress, Endurance | 200 or 404 |

**Response Time Targets**:
- Fleet metrics: < 1000ms (p95) - complex aggregation
- Telemetry: < 500ms (p95)
- Compliance: < 500ms (p95)
- Alerts: < 500ms (p95)

---

## API-Specific Test Scenarios

### Vehicles API Test (vehicles.js)

| Operation | Test Count | Load | Success |
|-----------|-----------|------|---------|
| List vehicles | 1 | 50-100 users | 200 OK |
| Search vehicles | 1 | 50-100 users | 200 OK |
| Filter by status | 1 | 50-100 users | 200 OK |
| Get vehicle detail | 1 | 50-100 users | 200/404 |
| Get telemetry | 1 | 50-100 users | 200/404 |
| Get geofence alerts | 1 | 50-100 users | 200 OK |
| **Total Requests** | **~6,000** | **7 minutes** | **100%** |

---

### Drivers API Test (drivers.js)

| Operation | Test Count | Load | Success |
|-----------|-----------|------|---------|
| List drivers | 1 | 50-100 users | 200 OK |
| Search drivers | 1 | 50-100 users | 200 OK |
| Filter by status | 1 | 50-100 users | 200 OK |
| Get driver detail | 1 | 50-100 users | 200/404 |
| Get performance | 1 | 50-100 users | 200/404 |
| Get compliance | 1 | 50-100 users | 200/404 |
| Get violations | 1 | 50-100 users | 200/404 |
| Get summary | 1 | 50-100 users | 200 OK |
| **Total Requests** | **~8,000** | **8 minutes** | **100%** |

---

### Database Test (database.js)

| Operation | Purpose | Load | Success |
|-----------|---------|------|---------|
| Large result set | Pagination stress | 30-60 users | 200 OK |
| Complex aggregation | Dashboard metrics | 30-60 users | 200 OK |
| Concurrent requests | Connection pool | 30-60 users | 200 OK |
| Sorted/filtered | Index usage | 30-60 users | 200 OK |
| Mixed patterns | Real-world | 30-60 users | 200 OK |
| Index stress | Query optimization | 30-60 users | 200/404 |
| **Total Requests** | **~3,000** | **8 minutes** | **100%** |

---

## Resource Limits Matrix

### Expected Resource Usage at Load Levels

| Metric | 100 Users | 200 Users | 500 Users | 1000 Users |
|--------|-----------|-----------|-----------|-----------|
| **CPU** | 20-30% | 40-50% | 70-80% | 90%+ |
| **Memory** | 200-300MB | 300-400MB | 500-700MB | 800MB-1GB |
| **DB Connections** | 10-15 | 15-20 | 20-25 | 25-30 |
| **Redis Memory** | 50-100MB | 100-150MB | 200-300MB | 300-400MB |
| **Network In** | 5-10 Mbps | 10-20 Mbps | 30-50 Mbps | 60-100 Mbps |
| **Network Out** | 2-5 Mbps | 5-10 Mbps | 15-30 Mbps | 40-70 Mbps |

---

## Acceptance Criteria by Scenario

### Normal Load Acceptance

✓ All endpoints return 200/404 as expected
✓ p95 response time < 500ms
✓ p99 response time < 1000ms
✓ Error rate < 0.1%
✓ No timeout errors
✓ Memory stable (< 50MB growth)

### Spike Test Acceptance

✓ System handles 10x traffic increase
✓ p95 response time < 1000ms (acceptable degradation)
✓ p99 response time < 2000ms
✓ Error rate < 1% (some failures expected)
✓ Recovery within 30 seconds
✓ No hanging connections

### Stress Test Acceptance

✓ System degrades gracefully
✓ p99 response time < 3000ms
✓ Error rate < 5%
✓ No cascading failures
✓ Rate limiting kicks in at configured threshold
✓ System recovers after load reduction
✓ No resource leaks

### Endurance Test Acceptance

✓ Consistent response times throughout
✓ p95 response time < 500ms (1-hour average)
✓ Error rate < 0.1% (1-hour average)
✓ Memory growth < 50MB/hour
✓ No connection pool exhaustion
✓ Cache hit rate remains > 80%
✓ All 20k+ requests complete successfully

---

## Performance Baseline Targets

### Fleet-CTA Production Targets

**Normal Operations (100-200 concurrent users)**:
- Throughput: > 1500 RPS
- p50: < 150ms
- p95: < 400ms
- p99: < 800ms
- Error rate: < 0.1%

**Peak Load (500 concurrent users)**:
- Throughput: > 500 RPS
- p50: < 300ms
- p95: < 800ms
- p99: < 1500ms
- Error rate: < 0.5%

**Maximum Stress (1000+ concurrent users)**:
- Throughput: > 200 RPS
- p50: < 500ms
- p95: < 1500ms
- p99: < 2500ms
- Error rate: < 2%

**24-hour Sustained (100 users)**:
- Consistent response times
- Memory leak rate: < 50MB/hour
- Connection stability: No leaks
- Cache efficiency: > 80% hit rate

---

## Test Execution Checklist

### Before Running Tests

- [ ] Backend is running: `curl http://localhost:3001/api/health`
- [ ] Database is ready: `npm run check:db`
- [ ] Redis is running: `redis-cli PING`
- [ ] Pool size set: `DB_WEBAPP_POOL_SIZE=30`
- [ ] Auth bypass enabled: `SKIP_AUTH=true` (optional)
- [ ] Logs directory exists: `tests/load/logs/`
- [ ] Results directory exists: `tests/load/results/`

### During Tests

- [ ] Monitor backend logs: `tail -f api/logs/error.log`
- [ ] Watch system resources: `top` or `Activity Monitor`
- [ ] Check database: `psql -c "SELECT count(*) FROM pg_stat_activity"`
- [ ] Monitor Redis: `redis-cli INFO stats`
- [ ] Verify no OOM errors
- [ ] No connection pool exhaustion

### After Tests

- [ ] Review results: `npm run load:analyze`
- [ ] Check for errors: `grep -i error tests/load/logs/*.log`
- [ ] Analyze trends: Compare with previous runs
- [ ] Document findings
- [ ] Archive results

---

## Regression Detection

**Alert Thresholds** (compared to baseline):

| Metric | Alert Threshold |
|--------|-----------------|
| p95 Response Time | +20% increase |
| p99 Response Time | +30% increase |
| Error Rate | +0.5% increase |
| Memory Usage | +100MB increase |
| CPU Usage | +50% increase |

When alerts trigger:
1. Compare current results to previous baseline
2. Identify changes since last good run
3. Revert problematic code or optimize
4. Re-run test to confirm fix
