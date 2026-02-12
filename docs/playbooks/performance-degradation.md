# Performance Degradation Playbook

## Alert Definition

**Trigger:** P95 response time exceeds 3 seconds over a 15-minute window
**Severity:** Low-Medium (P3)
**SLA Response Time:** 1 hour

## Symptoms

- Slow page load times
- API response times > 3 seconds (P95)
- User complaints about application slowness
- Increased timeout errors
- High latency in monitoring dashboards

## Investigation Steps

### 1. Immediate Assessment (0-5 minutes)

```bash
# Check current performance metrics
curl -s https://api.fleet-management.com/metrics | jq '{
  avgResponseTime: .avgResponseTime,
  p95ResponseTime: .p95ResponseTime,
  p99ResponseTime: .p99ResponseTime
}'

# Quick health check
curl -w "@curl-format.txt" -o /dev/null -s https://api.fleet-management.com/health
```

**curl-format.txt:**
```
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
----------\n
time_total:  %{time_total}\n
```

### 2. Performance Metrics Analysis (5-15 minutes)

#### Application Insights Query
```kusto
requests
| where timestamp > ago(1h)
| summarize
    avg_duration = avg(duration),
    p50 = percentile(duration, 50),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99),
    count = count()
  by bin(timestamp, 5m), operation_Name
| order by timestamp desc
| render timechart
```

#### Database Query Performance
```kusto
dependencies
| where timestamp > ago(1h)
| where type == "SQL"
| summarize
    avg_duration = avg(duration),
    p95 = percentile(duration, 95),
    count = count()
  by name
| order by avg_duration desc
| take 20
```

#### Slow Endpoint Identification
```kusto
requests
| where timestamp > ago(1h)
| where duration > 3000  // > 3 seconds
| summarize
    count = count(),
    avg_duration = avg(duration)
  by operation_Name, resultCode
| order by count desc
```

### 3. System Resource Analysis (15-30 minutes)

#### Check CPU Usage
```kusto
performanceCounters
| where timestamp > ago(1h)
| where name == "% Processor Time"
| summarize avg(value), max(value) by bin(timestamp, 5m)
| render timechart
```

#### Check Memory Usage
```kusto
performanceCounters
| where timestamp > ago(1h)
| where name == "Available Bytes"
| summarize avg(value), min(value) by bin(timestamp, 5m)
| render timechart
```

#### Check Database Connections
```sql
-- PostgreSQL
SELECT count(*) as active_connections,
       max_conn,
       max_conn - count(*) as available_connections
FROM pg_stat_activity,
     (SELECT setting::int as max_conn FROM pg_settings WHERE name='max_connections') mc
GROUP BY max_conn;

-- Check slow queries
SELECT pid, usename, application_name, state, query, query_start
FROM pg_stat_activity
WHERE state != 'idle'
  AND query_start < now() - interval '30 seconds'
ORDER BY query_start;
```

### 4. Common Performance Bottlenecks

| Bottleneck | Indicators | Quick Check |
|------------|-----------|-------------|
| **Slow Database Queries** | High DB dependency duration | Check pg_stat_statements |
| **N+1 Queries** | Many small DB calls | Enable query logging, check request traces |
| **Missing Cache** | High DB load, repetitive queries | Check Redis hit rate |
| **Unoptimized API Calls** | High external dependency duration | Check external API traces |
| **Large Payload** | High network transfer time | Check response size |
| **Memory Pressure** | High GC time, low available memory | Check heap usage |
| **CPU Saturation** | High CPU usage (>80%) | Check process list |
| **Blocking Operations** | High wait times | Check for synchronous I/O |

## Resolution Steps

### Quick Wins (Immediate Impact)

#### 1. Enable/Clear Cache
```bash
# Check Redis cache status
redis-cli INFO stats

# Clear cache if corrupted
redis-cli FLUSHALL

# Restart Redis if needed
sudo systemctl restart redis
```

#### 2. Database Connection Pool Adjustment
```javascript
// Increase pool size temporarily
const pool = new Pool({
  max: 40,  // Increase from 20
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});
```

#### 3. Enable Response Compression
```javascript
// Add compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));
```

#### 4. Implement Request Throttling
```javascript
// Rate limiting for expensive endpoints
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/expensive-endpoint', limiter);
```

### Performance Optimization

#### 1. Database Query Optimization

```sql
-- Identify slow queries
SELECT query, calls, total_time, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND n_distinct > 100
  AND correlation < 0.1
ORDER BY n_distinct DESC;

-- Add indexes (run EXPLAIN ANALYZE first)
CREATE INDEX CONCURRENTLY idx_vehicles_user_status
  ON vehicles(user_id, status)
  WHERE deleted_at IS NULL;
```

#### 2. Implement Caching Strategy

```javascript
// Add Redis caching for frequently accessed data
const cacheMiddleware = async (req, res, next) => {
  const key = `cache:${req.originalUrl}`;
  const cached = await redisClient.get(key);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Store original res.json
  const originalJson = res.json;
  res.json = function(data) {
    // Cache for 5 minutes
    redisClient.setex(key, 300, JSON.stringify(data));
    originalJson.call(this, data);
  };

  next();
};

app.get('/api/vehicles', cacheMiddleware, getVehicles);
```

#### 3. Optimize N+1 Queries

```javascript
// Before: N+1 query
const vehicles = await Vehicle.findAll();
for (const vehicle of vehicles) {
  vehicle.driver = await Driver.findById(vehicle.driverId);
}

// After: Eager loading
const vehicles = await Vehicle.findAll({
  include: [{ model: Driver }]
});
```

#### 4. Implement Pagination

```javascript
// Add pagination for large datasets
app.get('/api/vehicles', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const { rows, count } = await Vehicle.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
});
```

#### 5. Background Job Processing

```javascript
// Move heavy processing to background jobs
const Queue = require('bull');
const reportQueue = new Queue('reports', process.env.REDIS_URL);

// API endpoint - returns immediately
app.post('/api/reports', async (req, res) => {
  const job = await reportQueue.add({
    userId: req.user.id,
    type: req.body.type,
    params: req.body.params
  });

  res.json({ jobId: job.id, status: 'processing' });
});

// Worker - processes in background
reportQueue.process(async (job) => {
  const report = await generateReport(job.data);
  await saveReport(report);
  await notifyUser(job.data.userId, report.id);
});
```

### Infrastructure Scaling

#### 1. Horizontal Scaling (Add Instances)

```bash
# Scale Azure App Service
az appservice plan update \
  --name fleet-management-plan \
  --resource-group fleet-management-rg \
  --number-of-workers 3

# Or use autoscaling
az monitor autoscale create \
  --resource-group fleet-management-rg \
  --resource fleet-management-api \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-fleet \
  --min-count 2 \
  --max-count 5 \
  --count 2
```

#### 2. Vertical Scaling (Upgrade Instance)

```bash
# Upgrade to higher SKU
az appservice plan update \
  --name fleet-management-plan \
  --resource-group fleet-management-rg \
  --sku P2V2
```

#### 3. Database Scaling

```bash
# Scale Azure SQL Database
az sql db update \
  --resource-group fleet-management-rg \
  --server fleet-db-server \
  --name fleet-db \
  --service-objective S3

# Or enable autoscaling
az sql db update \
  --resource-group fleet-management-rg \
  --server fleet-db-server \
  --name fleet-db \
  --auto-pause-delay 60 \
  --min-capacity 0.5 \
  --max-capacity 4
```

## Monitoring & Validation

### Verify Performance Improvement

```bash
# Test endpoint performance
ab -n 1000 -c 10 https://api.fleet-management.com/api/vehicles

# Monitor response times
watch -n 5 "curl -w '%{time_total}' -o /dev/null -s https://api.fleet-management.com/health"
```

### Application Insights Validation
```kusto
requests
| where timestamp > ago(30m)
| summarize
    avg_duration = avg(duration),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99)
  by bin(timestamp, 5m)
| render timechart
```

### Expected Results
- P95 response time < 2 seconds
- P99 response time < 3 seconds
- No user complaints
- Stable resource utilization

## Prevention

### 1. Performance Budgets
```javascript
// Set performance budgets in tests
describe('API Performance', () => {
  it('should respond within 1 second', async () => {
    const start = Date.now();
    await request(app).get('/api/vehicles');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
```

### 2. Automated Performance Testing
```yaml
# .github/workflows/performance-test.yml
name: Performance Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run performance tests
        run: |
          npm install -g artillery
          artillery run tests/performance/load-test.yml
      - name: Fail if P95 > 2s
        run: |
          p95=$(cat artillery-report.json | jq '.aggregate.latency.p95')
          if [ $p95 -gt 2000 ]; then exit 1; fi
```

### 3. Database Monitoring
```sql
-- Create monitoring view
CREATE VIEW slow_queries AS
SELECT query, calls, total_time, mean_time, max_time
FROM pg_stat_statements
WHERE mean_time > 1000  -- queries averaging > 1 second
ORDER BY mean_time DESC;

-- Schedule daily review
SELECT * FROM slow_queries;
```

### 4. Regular Performance Reviews
- [ ] Weekly: Review P95/P99 metrics
- [ ] Monthly: Analyze query performance
- [ ] Quarterly: Load testing and capacity planning

## Communication

### Internal
```
⚠️ PERFORMANCE DEGRADATION
Current P95: [X] seconds (Target: < 2s)
Affected Endpoints: [List]
Impact: [Description]
Action: [Steps being taken]
```

### User-Facing
```
We're experiencing slower than normal response times.
Our team is working to resolve this.
Expected resolution: [ETA]
```

## Escalation

- **Level 1:** On-Call Engineer (0-1 hour)
- **Level 2:** Senior Engineer (1-2 hours)
- **Level 3:** Performance Team Lead (> 2 hours)

## Related Playbooks

- [High Error Rate](./high-error-rate.md)
- [Database Issues](./database-issues.md)
- [Service Outage](./service-outage.md)

---

**Last Updated:** 2025-12-31
**Version:** 1.0
**Owner:** Platform Engineering Team
