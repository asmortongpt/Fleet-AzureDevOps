# Monitoring Troubleshooting Guide

## Quick Diagnostics

### Step 1: Check Service Health

```bash
# Test health endpoint
curl -v http://localhost:3001/health

# Test metrics endpoint
curl http://localhost:3001/metrics | head -20

# Test liveness
curl http://localhost:3001/health/live

# Test readiness
curl http://localhost:3001/health/ready
```

### Step 2: Check Logs

```bash
# View latest errors
tail -f logs/error-*.log | jq .

# View application logs
tail -f logs/application-*.log | jq '.message, .status'

# View specific time range
cat logs/error-*.log | jq 'select(.timestamp > "2024-01-15T10:00:00")'

# Search for errors
grep -i "error\|exception" logs/application-*.log
```

### Step 3: Check Metrics Collection

```bash
# Verify Prometheus can scrape metrics
curl -s http://localhost:3001/metrics | grep "http_requests_total"

# Check if specific metric exists
curl -s http://localhost:3001/metrics | grep "db_query_duration"

# View metric count
curl -s http://localhost:3001/metrics | wc -l
```

## Common Issues

### 1. No Metrics Being Collected

**Symptoms**:
- Empty Prometheus graphs
- No data in Grafana
- `/metrics` endpoint returns empty or minimal data

**Diagnosis**:

```bash
# Check if metrics endpoint is accessible
curl -v http://localhost:3001/metrics

# Check if prometheus is running
curl http://localhost:9090/-/healthy

# Verify prometheus.yml configuration
cat config/prometheus.yml | grep -A5 "fleet-api"

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[0]'
```

**Solutions**:

```bash
# 1. Restart metrics collection
# In your server.ts:
import { prometheusMetrics } from './monitoring/prometheus';
prometheusMetrics.initialize();

# 2. Check monitoring initialization
curl http://localhost:3001/health | jq '.monitoring'

# 3. Verify firewall rules
netstat -tlnp | grep 3001

# 4. Check Prometheus scrape logs
tail -f /var/log/prometheus/prometheus.log

# 5. Force Prometheus reload
curl -X POST http://localhost:9090/-/reload
```

### 2. Health Checks Failing

**Symptoms**:
- `/health` returns HTTP 503
- Database health check shows unhealthy
- Kubernetes probes failing

**Diagnosis**:

```bash
# Check database connectivity
curl http://localhost:3001/health | jq '.services.database'

# Check memory status
curl http://localhost:3001/health | jq '.services.memory'

# Check connection pool
curl http://localhost:3001/health | grep "pool"

# Test database directly
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "SELECT 1"
```

**Solutions**:

```bash
# 1. Restart database connection
# In your server.ts:
import { pool } from './db';
await pool.query('SELECT 1');

# 2. Increase database connection pool timeout
# In .env:
DB_POOL_IDLE_TIMEOUT=30000

# 3. Check database server
systemctl status postgresql
# or
docker ps | grep postgres

# 4. Verify network connectivity
ping $DB_HOST
nc -zv $DB_HOST 5432

# 5. Check database logs
tail -f /var/log/postgresql/postgresql.log
```

### 3. High Memory Usage Alerts

**Symptoms**:
- Memory usage > 80%
- Heap warnings in logs
- OutOfMemory errors

**Diagnosis**:

```bash
# Check memory status
curl http://localhost:3001/health | jq '.services.memory'

# Get memory snapshot
node --expose-gc -e "
  const v8 = require('v8');
  const fs = require('fs');
  v8.writeHeapSnapshot();
  console.log('Heap snapshot written');
"

# Check Node.js memory
ps aux | grep "node.*server"

# Get detailed memory info
node -e "console.log(process.memoryUsage())"
```

**Solutions**:

```bash
# 1. Check for memory leaks with Clinic.js
npm install -g clinic
clinic doctor -- node src/server.ts

# 2. Analyze heap snapshot with DevTools
# Open chrome://inspect in Chrome
# node --inspect src/server.ts

# 3. Increase heap size
node --max-old-space-size=2048 src/server.ts
# or in production
NODE_OPTIONS="--max-old-space-size=2048" npm start

# 4. Force garbage collection
curl http://localhost:3001/gc

# 5. Check for common leak sources
grep -r "setInterval\|setTimeout" src/ | head -20

# 6. Review recent code changes
git log --oneline -20

# 7. Restart service
systemctl restart fleet-api
# or
docker restart fleet-api
```

### 4. Database Connection Pool Exhaustion

**Symptoms**:
- "no more connections available" errors
- High pool utilization (> 90%)
- Connection timeout errors

**Diagnosis**:

```bash
# Check pool metrics
curl http://localhost:3001/metrics | grep "db_connection_pool"

# Check pool status
curl http://localhost:3001/health | jq '.services.database'

# Check active connections on database
psql -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname"

# Check long-running queries
psql -c "
  SELECT pid, usename, query_start, state, query
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY query_start DESC
  LIMIT 10
"
```

**Solutions**:

```bash
# 1. Increase pool size in .env
DB_WEBAPP_POOL_SIZE=40

# 2. Decrease idle timeout
DB_POOL_IDLE_TIMEOUT=10000

# 3. Implement connection pooling proxy
# Install PgBouncer
apt-get install pgbouncer

# Configure PgBouncer
cat > /etc/pgbouncer/pgbouncer.ini << 'EOF'
[databases]
fleet_db = host=db.internal port=5432 dbname=fleet_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
EOF

systemctl restart pgbouncer

# 4. Kill long-running queries
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state != 'idle'"

# 5. Optimize queries to reduce pool hold time
# Review slow query log
tail -f /var/log/postgresql/slow.log

# 6. Scale to multiple database replicas
# Add read replicas for SELECT-heavy workloads
```

### 5. Prometheus Storage Issues

**Symptoms**:
- Prometheus crashes
- "unexpected end of WAL" error
- High disk usage

**Diagnosis**:

```bash
# Check Prometheus data directory size
du -sh /prometheus/data

# Check disk usage
df -h

# Check Prometheus logs
tail -f /var/log/prometheus/prometheus.log | grep -i "error\|wal"

# Check WAL status
ls -lah /prometheus/data/wal/
```

**Solutions**:

```bash
# 1. Clean up old metrics
# In prometheus.yml:
global:
  retention: 7d  # Keep 7 days of data instead of 15

# 2. Reduce scrape interval
global:
  scrape_interval: 30s  # Instead of 15s

# 3. Clean up corrupted WAL
systemctl stop prometheus
rm -rf /prometheus/data/wal/
systemctl start prometheus

# 4. Increase disk space
# Add new volume or expand existing partition

# 5. Archive old metrics
# Use Prometheus remote storage (Thanos, Cortex)
```

### 6. Grafana Dashboards Empty

**Symptoms**:
- Dashboard loads but shows no data
- "No data" on all panels
- Prometheus connection works but no data

**Diagnosis**:

```bash
# Verify Prometheus data source
curl http://localhost:9090/api/v1/query?query=up

# Test dashboard query manually
curl 'http://localhost:9090/api/v1/query?query=http_requests_total'

# Check Grafana logs
docker logs grafana  # If using Docker
tail -f /var/log/grafana/grafana.log

# Test metric availability
curl http://localhost:3001/metrics | grep "http_requests_total"
```

**Solutions**:

```bash
# 1. Verify Prometheus data source in Grafana
# Settings → Data sources → Prometheus
# Click "Test" button

# 2. Check query syntax
# Paste query in Prometheus UI first
curl 'http://localhost:9090/graph'

# 3. Verify metric labels
# Query: {__name__="http_requests_total"}

# 4. Check time range
# Ensure dashboard time range has data
# Try "Last 24 hours" or "Last 7 days"

# 5. Restart Grafana
docker restart grafana
# or
systemctl restart grafana-server

# 6. Re-import dashboard
# Delete and re-import JSON
```

### 7. Alerts Not Firing

**Symptoms**:
- Alert rules defined but not triggering
- Alertmanager not sending notifications
- Prometheus shows rules but no alerts

**Diagnosis**:

```bash
# Check alert rule status
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.state=="firing")'

# Check alert status
curl http://localhost:9090/api/v1/alerts | jq '.data | length'

# Check Alertmanager
curl http://localhost:9093/api/v1/alerts | jq '.data | length'

# View Prometheus logs for rule evaluation
tail -f /var/log/prometheus/prometheus.log | grep -i "alert\|rule"

# View Alertmanager logs
docker logs alertmanager
# or
tail -f /var/log/alertmanager/alertmanager.log
```

**Solutions**:

```bash
# 1. Verify alert rule syntax
promtool check rules config/alerting-rules.yml

# 2. Test alert expression manually
# In Prometheus UI at http://localhost:9090/graph
# Paste: http_errors_total > 0

# 3. Check alert threshold
# Rule might be too strict or too lenient
# Review alert condition

# 4. Verify evaluation interval
# In prometheus.yml:
global:
  evaluation_interval: 15s

# 5. Restart Prometheus
systemctl restart prometheus

# 6. Reload Prometheus config
curl -X POST http://localhost:9090/-/reload

# 7. Check Alertmanager configuration
promtool check config config/alertmanager.yml

# 8. Verify notification channel (Slack, email, etc.)
# Test webhook manually
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK \
  -d '{"text":"Test alert"}' \
  -H "Content-Type: application/json"
```

### 8. Slow API Responses

**Symptoms**:
- Response times > 1 second
- Timeout errors
- High response time percentiles

**Diagnosis**:

```bash
# Check response time metrics
curl http://localhost:3001/metrics | grep http_request_duration

# View slow endpoints
curl 'http://localhost:9090/api/v1/query?query=topk(10,histogram_quantile(0.95,http_request_duration_seconds_bucket))'

# Check database performance
curl 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,db_query_duration_seconds_bucket)'

# View request logs
tail -f logs/application-*.log | jq 'select(.durationMs > 1000)'
```

**Solutions**:

```bash
# 1. Identify slow endpoints
grep "durationMs" logs/application-*.log | \
  jq -s 'group_by(.route) | map({route: .[0].route, avgDuration: (map(.durationMs) | add / length)})' | \
  jq 'sort_by(-.avgDuration) | .[0:5]'

# 2. Check database query performance
curl 'http://localhost:9090/api/v1/query?query=topk(10,db_query_duration_seconds_bucket)'

# 3. Enable query logging
# In postgresql.conf:
log_min_duration_statement = 500  # Log queries > 500ms

# 4. Analyze slow queries with EXPLAIN
psql -c "EXPLAIN ANALYZE SELECT ..."

# 5. Add missing indexes
psql -c "CREATE INDEX idx_name ON table(column)"

# 6. Check connection pool exhaustion
curl http://localhost:3001/metrics | grep db_connection_pool

# 7. Scale horizontally
# Add more API instances
# Use load balancer (nginx, HAProxy)

# 8. Enable caching
# Implement Redis caching
# Cache query results
```

### 9. Service Restart Loop

**Symptoms**:
- Service crashes immediately after start
- "health check failed" messages
- Pods crashing in Kubernetes

**Diagnosis**:

```bash
# Check startup logs
docker logs fleet-api 2>&1 | head -50

# Check process status
systemctl status fleet-api

# Check system logs
journalctl -u fleet-api -n 50

# Try manual start with verbose output
node --trace-warnings src/server.ts
```

**Solutions**:

```bash
# 1. Check health status
curl http://localhost:3001/health/startup

# 2. Verify database connection
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "SELECT 1"

# 3. Check environment variables
printenv | grep -E "DATABASE|NODE"

# 4. Review recent code changes
git diff HEAD~5..HEAD

# 5. Rollback if recent deployment
git revert <commit>

# 6. Check logs in detail
LOG_LEVEL=debug npm start

# 7. Verify all dependencies are installed
npm install

# 8. Build from scratch
npm run build && npm start
```

### 10. Sentry Errors Not Captured

**Symptoms**:
- No errors appearing in Sentry dashboard
- Errors logged locally but not in Sentry
- Error budget warnings

**Diagnosis**:

```bash
# Check Sentry DSN
echo $SENTRY_DSN

# Verify connectivity to Sentry
curl -I https://sentry.io

# Check Sentry initialization
curl http://localhost:3001/health | jq '.sentry'

# View application logs for Sentry errors
grep -i "sentry" logs/application-*.log
```

**Solutions**:

```bash
# 1. Verify Sentry DSN is set
# In .env:
SENTRY_DSN=https://key@sentry.io/project-id

# 2. Check network connectivity
curl -v https://sentry.io

# 3. Test Sentry integration
# Manually trigger an error:
curl http://localhost:3001/api/test-error

# 4. Check Sentry configuration
# In monitoring/sentry.ts, verify:
# - DSN is read
# - Environment is set correctly
# - Sample rates are not 0

# 5. Verify Sentry project is active
# Check Sentry dashboard

# 6. Review error filtering
# Some errors may be filtered by:
# - ignoreErrors array
# - beforeSend function
# - Sample rate settings

# 7. Increase sample rate in development
# In monitoring/sentry.ts:
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
```

## Performance Debugging

### CPU Profiling

```bash
# Install clinic
npm install -g clinic

# Profile with clinic
clinic doctor -- node src/server.ts

# Profile with node built-in
node --prof src/server.ts
node --prof-process isolate-*.log > processed.txt
```

### Memory Profiling

```bash
# Use node --expose-gc and heapdump
npm install heapdump

# In code:
const heapdump = require('heapdump');
heapdump.writeSnapshot('./heap-' + Date.now() + '.heapsnapshot');

# Analyze with Chrome DevTools
chrome://inspect
```

### Trace Analysis

```bash
# Enable OpenTelemetry tracing
NODE_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 npm start

# View traces in Jaeger UI
http://localhost:16686
```

## Escalation Contacts

**For different severity levels:**

- **CRITICAL**: Page SRE on-call immediately
- **WARNING**: Create incident in JIRA, notify team lead
- **INFO**: Log in Slack #fleet-monitoring channel

**Contacts**:
- SRE On-Call: PagerDuty (https://pagerduty.com)
- Team Lead: fleet-team@company.com
- Database Team: database-team@company.com
- DevOps Team: devops-team@company.com

## Further Reading

- [Node.js Diagnostics](https://nodejs.org/en/docs/guides/diagnostics/)
- [Prometheus Troubleshooting](https://prometheus.io/docs/prometheus/latest/troubleshooting/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [Grafana Troubleshooting](https://grafana.com/docs/grafana/latest/troubleshooting/)
