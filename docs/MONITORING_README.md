# Fleet-CTA Monitoring and Observability - Quick Start

## What's Been Set Up

This comprehensive monitoring setup provides production-grade observability for the Fleet Management API with:

### Core Components

1. **Application Metrics** (`api/src/monitoring/prometheus.ts`)
   - HTTP request metrics (latency, throughput, errors)
   - Database query metrics (duration, volume, errors)
   - Business metrics (vehicles, drivers, routes, orders)
   - Cache metrics (hit rate, efficiency)
   - Job queue metrics (size, processing rate)
   - System metrics (memory, CPU, GC)

2. **Health Checks** (`api/src/monitoring/health-check.ts`)
   - Liveness probe: Is the service running?
   - Readiness probe: Is the service ready for traffic?
   - Startup probe: Did initialization succeed?
   - Full health report with service details

3. **Structured Logging** (`api/src/monitoring/structured-logging.ts`)
   - JSON-formatted logs for parsing
   - Log rotation (14-30 day retention)
   - Multiple log levels (ERROR, WARN, INFO, DEBUG)
   - Automatic categorization (HTTP, database, business, audit)

4. **Error Tracking** (`api/src/monitoring/sentry.ts`)
   - Automatic exception capture
   - Performance monitoring
   - Session tracking
   - Sensitive data filtering

5. **Azure Application Insights** (`api/src/monitoring/applicationInsights.ts`)
   - Request and performance tracking
   - Custom event tracking
   - Dependency monitoring
   - Availability monitoring

6. **Memory Monitoring** (`api/src/monitoring/memory.ts`)
   - Real-time heap usage tracking
   - Memory leak detection
   - GC monitoring
   - Alerts on high usage

### Configuration Files

```
config/
  ├── prometheus.yml              # Prometheus scrape config
  ├── alerting-rules.yml          # 50+ pre-configured alert rules
  ├── recording-rules.yml         # 60+ pre-computed metric rules
  ├── alertmanager.yml            # (template) Alertmanager config
  └── grafana-dashboard.json      # Pre-built Grafana dashboard
```

### Documentation

```
docs/
  ├── MONITORING_SETUP.md         # Complete setup and usage guide
  ├── ALERTING_GUIDE.md           # Alert configuration and tuning
  ├── DASHBOARDS.md               # Grafana dashboard guide
  └── TROUBLESHOOTING_MONITORING.md # Common issues and solutions
```

## Quick Start

### 1. Enable Monitoring in Your Server

Add to `api/src/server.ts`:

```typescript
import {
  initializeMonitoring,
  addMonitoringMiddleware,
  startMetricsCollection
} from './monitoring/monitoring-setup';

// In your app initialization
const app = express();

// Add monitoring middleware early
addMonitoringMiddleware(app);

// Initialize all monitoring components
await initializeMonitoring(app, {
  enableMetrics: true,
  enableHealthChecks: true,
  enableStructuredLogging: true,
  enableSentry: process.env.NODE_ENV === 'production'
});

// Start metrics collection
startMetricsCollection(60000);
```

### 2. Set Environment Variables

```bash
# .env
# Sentry (optional, for production)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Application Insights (optional, for production)
APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Log level
LOG_LEVEL=info
```

### 3. Verify Monitoring

```bash
# Start your API
npm run dev

# Test health check
curl http://localhost:3001/health

# Test metrics endpoint
curl http://localhost:3001/metrics | head -20

# View logs
tail -f logs/application-*.log
```

### 4. Set Up Prometheus

```bash
# Copy config
cp config/prometheus.yml /etc/prometheus/

# Start Prometheus (if not running)
docker run -d -p 9090:9090 \
  -v $(pwd)/config/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Access UI
open http://localhost:9090
```

### 5. Set Up Grafana

```bash
# Start Grafana (if not running)
docker run -d -p 3000:3000 \
  --name=grafana \
  grafana/grafana

# Import dashboard
# 1. Open http://localhost:3000 (admin/admin)
# 2. Dashboards → Import
# 3. Upload config/grafana-dashboard.json
# 4. Select Prometheus data source

# Access dashboard
open http://localhost:3000
```

## Key Metrics

### Available Endpoints

| Endpoint | Purpose | Usage |
|----------|---------|-------|
| `/health` | Full health report | General health checks |
| `/health/live` | Liveness probe | K8s liveness probe |
| `/health/ready` | Readiness probe | K8s readiness probe |
| `/health/startup` | Startup probe | K8s startup probe |
| `/metrics` | Prometheus metrics | Metric scraping |

### Important Metrics to Monitor

**API Performance**:
- `http_request_duration_seconds` (p95, p99)
- `http_errors_total` (error rate)
- `http_requests_total` (throughput)

**Database**:
- `db_query_duration_seconds` (query latency)
- `db_connection_pool_utilization` (connection usage)
- `db_query_errors_total` (query errors)

**Business**:
- `fleet_active_vehicles` (fleet status)
- `fleet_drivers_online` (driver availability)
- `fleet_completed_routes_total` (business throughput)
- `job_queue_size` (job backlog)

**System**:
- `process_resident_memory_bytes` (memory usage)
- `process_cpu_seconds_total` (CPU usage)

## Pre-Configured Alerts

50+ alert rules covering:

### Critical (Immediate Action)
- High error rate (> 5%)
- API service down
- Database connection failures
- Out of memory

### Warning (Monitor & Plan)
- Slow responses (> 1 sec)
- Slow database queries (> 500ms)
- High database pool utilization (> 80%)
- High memory usage (> 80%)
- Large job queue (> 1000 items)

### Info (Notification Only)
- High request volume (> 1000 req/s)
- Low driver availability
- Anomalous patterns

## Log Files

```
logs/
  ├── application-YYYY-MM-DD.log    # All logs (JSON, 14 days)
  ├── error-YYYY-MM-DD.log          # Errors only (JSON, 30 days)
  └── debug-YYYY-MM-DD.log          # Debug logs (dev only, 7 days)
```

Query logs:
```bash
# View recent errors
tail -f logs/error-*.log | jq .

# Search for specific error
grep "vehicle_not_found" logs/error-*.log

# View application events
jq 'select(.type == "business_event")' logs/application-*.log
```

## Performance Thresholds

Target metrics for production SLO:

| Metric | Target | Alert |
|--------|--------|-------|
| Availability | 99.9% | < 99% |
| Error Rate | < 0.1% | > 0.5% |
| P95 Latency | < 500ms | > 1s |
| P99 Latency | < 1s | > 2s |
| Memory Usage | < 70% | > 80% |
| DB Pool | < 70% | > 80% |
| Job Queue | < 100 | > 1000 |
| Cache Hit Rate | > 60% | < 50% |

## Integration Examples

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-api
spec:
  template:
    spec:
      containers:
        - name: fleet-api
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
          startupProbe:
            httpGet:
              path: /health/startup
              port: 3001
            failureThreshold: 30
            periodSeconds: 10
```

### Docker Compose

```yaml
services:
  fleet-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      SENTRY_DSN: ${SENTRY_DSN}
      LOG_LEVEL: info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health/ready"]
      interval: 30s
      timeout: 10s
      retries: 3

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./config/alerting-rules.yml:/etc/prometheus/alerting-rules.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
```

## Common Commands

```bash
# Check health
curl http://localhost:3001/health | jq .

# View metrics
curl http://localhost:3001/metrics | grep "http_requests_total"

# View logs
tail -f logs/application-*.log | jq .

# Check specific metrics in Prometheus
curl 'http://localhost:9090/api/v1/query?query=up'

# Force garbage collection
node --expose-gc src/server.ts

# Profile CPU
node --prof src/server.ts
node --prof-process isolate-*.log > profile.txt

# Check memory
ps aux | grep "node.*server"
```

## Next Steps

1. **Read Full Documentation**
   - Start with `docs/MONITORING_SETUP.md` for detailed setup
   - Review `docs/ALERTING_GUIDE.md` for alert configuration
   - Check `docs/DASHBOARDS.md` for dashboard customization

2. **Configure Alerting**
   - Set up Alertmanager for notifications
   - Configure Slack/PagerDuty/email channels
   - Create on-call runbooks

3. **Customize Dashboards**
   - Adjust thresholds based on your baseline
   - Add custom panels for business metrics
   - Share dashboards with team

4. **Monitor and Tune**
   - Review metrics baseline over 2-4 weeks
   - Adjust alert thresholds based on patterns
   - Implement SLO tracking

5. **Document**
   - Create runbooks for each alert
   - Document escalation procedures
   - Train team on monitoring tools

## Support Resources

- **Prometheus Docs**: https://prometheus.io/docs/
- **Grafana Docs**: https://grafana.com/docs/
- **Sentry Docs**: https://docs.sentry.io/
- **Azure Insights**: https://docs.microsoft.com/en-us/azure/azure-monitor/
- **Node.js Diagnostics**: https://nodejs.org/en/docs/guides/diagnostics/

## Troubleshooting

For common issues, see `docs/TROUBLESHOOTING_MONITORING.md`:
- No metrics being collected
- Health checks failing
- High memory usage
- Database connection issues
- Alerts not firing
- And more...

---

**Version**: 1.0.0
**Last Updated**: February 2026
**Status**: Production-Ready
