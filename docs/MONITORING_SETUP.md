# Fleet-CTA Monitoring, Logging, and Observability Setup

## Overview

This document describes the comprehensive monitoring, logging, and observability setup for the Fleet Management API production environment. The setup includes application metrics collection, structured logging, health checks, error tracking, and distributed tracing.

## Architecture Components

### 1. Application Monitoring (Prometheus)

**File**: `api/src/monitoring/prometheus.ts`

Prometheus metrics collection with the following metric types:

#### HTTP/API Metrics
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total request counter
- `http_requests_in_progress` - Active request gauge
- `http_errors_total` - Error counter by type

#### Database Metrics
- `db_query_duration_seconds` - Query execution time
- `db_queries_total` - Query count by type
- `db_connection_pool_size` - Active pool connections
- `db_connection_pool_utilization` - Pool utilization percentage
- `db_query_errors_total` - Failed queries

#### Business Metrics
- `fleet_active_vehicles` - Number of active vehicles
- `fleet_completed_routes_total` - Completed routes counter
- `fleet_drivers_online` - Online drivers gauge
- `fleet_dispatched_orders_total` - Dispatched orders counter

#### Cache Metrics
- `cache_hits_total` - Cache hit counter
- `cache_misses_total` - Cache miss counter
- `cache_hit_rate` - Hit rate percentage

#### Job Queue Metrics
- `job_queue_size` - Pending jobs in queue
- `jobs_processed_total` - Processed job counter
- `jobs_failed_total` - Failed job counter
- `job_duration_seconds` - Job processing time

#### System Metrics
- `process_uptime_seconds` - Application uptime
- `process_cpu_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_heap_size_limit_bytes` - Heap limit
- `gc_duration_seconds` - Garbage collection duration

### 2. Health Checks

**File**: `api/src/monitoring/health-check.ts`

Four Kubernetes-compatible health check endpoints:

- **`/health`** - Full health report with all services
- **`/health/live`** (Liveness Probe) - Is the process running?
- **`/health/ready`** (Readiness Probe) - Is the service ready for traffic?
- **`/health/startup`** (Startup Probe) - Did the service start successfully?

### 3. Structured Logging

**File**: `api/src/monitoring/structured-logging.ts`

JSON-structured logging with:
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Log Rotation**: Daily rotation with 14-30 day retention
- **Output**: Console (development) and file (production)
- **Formats**:
  - JSON for file-based logs (parseable by ELK/Azure Log Analytics)
  - Human-readable for console

### 4. Error Tracking

**File**: `api/src/monitoring/sentry.ts`

Comprehensive error tracking via Sentry with:
- Automatic exception capture
- Performance monitoring
- Session tracking
- Breadcrumb collection
- Sensitive data filtering

### 5. Application Insights

**File**: `api/src/monitoring/applicationInsights.ts`

Azure Application Insights integration for:
- Request tracking
- Dependency monitoring
- Performance metrics
- Custom events
- Availability monitoring

### 6. Memory Monitoring

**File**: `api/src/monitoring/memory.ts`

Real-time memory usage monitoring:
- Heap usage tracking
- Garbage collection monitoring
- Memory leak detection
- Alerts on > 80% usage

## Installation and Setup

### Step 1: Dependencies

All required dependencies are already in `package.json`:
```bash
npm install  # Installs prom-client, winston, applicationinsights, @sentry/node, etc.
```

### Step 2: Initialize Monitoring in Your Server

Add to your `server.ts` or application initialization:

```typescript
import { initializeMonitoring, addMonitoringMiddleware, startMetricsCollection } from './monitoring/monitoring-setup';

// In your app initialization
const app = express();

// Add monitoring middleware early in the chain
addMonitoringMiddleware(app);

// Initialize all monitoring components
await initializeMonitoring(app, {
  enableMetrics: true,
  enableHealthChecks: true,
  enableStructuredLogging: true,
  enableSentry: process.env.NODE_ENV === 'production',
  enableApplicationInsights: process.env.NODE_ENV === 'production',
  enableMemoryMonitoring: true,
  metricsPath: '/metrics',
  healthCheckPath: '/health'
});

// Start periodic metrics collection
startMetricsCollection(60000); // Every 60 seconds
```

### Step 3: Environment Variables

Configure monitoring services via environment variables:

```bash
# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_RELEASE=fleet-api@1.0.0
SENTRY_ENVIRONMENT=production

# Application Insights
APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key;IngestionEndpoint=https://...

# Optional: Custom log level
LOG_LEVEL=info

# Optional: Enable/disable components
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true
ENABLE_SENTRY=true
```

## Accessing Metrics and Health

### Health Check Endpoints

```bash
# Full health report
curl http://localhost:3001/health

# Liveness probe (is process running?)
curl http://localhost:3001/health/live

# Readiness probe (ready for traffic?)
curl http://localhost:3001/health/ready

# Startup probe (initialization complete?)
curl http://localhost:3001/health/startup
```

### Prometheus Metrics

```bash
# Get Prometheus metrics in text format
curl http://localhost:3001/metrics

# Filter specific metrics
curl http://localhost:3001/metrics | grep http_requests_total
```

## Prometheus Setup

### 1. Install Prometheus

```bash
# macOS
brew install prometheus

# Docker
docker run -d -p 9090:9090 -v $(pwd)/config/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus --config.file=/etc/prometheus/prometheus.yml

# Manual download
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
```

### 2. Configure Prometheus

Copy the configuration file:
```bash
cp config/prometheus.yml /etc/prometheus/prometheus.yml
```

Key configuration:
- Scrapes metrics from `/metrics` endpoint
- 15-second scrape interval
- 15-second evaluation interval for alerting rules

### 3. Start Prometheus

```bash
# macOS
prometheus --config.file=config/prometheus.yml

# Docker
docker start prometheus

# Systemd
systemctl restart prometheus
```

Access Prometheus UI: http://localhost:9090

## Grafana Setup

### 1. Install Grafana

```bash
# macOS
brew install grafana

# Docker
docker run -d -p 3000:3000 --name=grafana grafana/grafana

# Manual
wget https://dl.grafana.com/oss/release/grafana-9.5.0.linux-amd64.tar.gz
```

### 2. Add Prometheus Data Source

1. Open Grafana: http://localhost:3000 (default: admin/admin)
2. Configuration → Data Sources → Add data source
3. Choose Prometheus
4. URL: `http://localhost:9090`
5. Click "Save & Test"

### 3. Import Dashboard

Option A: Upload JSON
1. Dashboards → Import
2. Upload `config/grafana-dashboard.json`
3. Select Prometheus data source

Option B: Manual Creation
Use the dashboard ID or import the provided JSON configuration

### 4. Configure Alerting (Optional)

1. Alerting → Notification channels
2. Add channel for PagerDuty, Slack, email, etc.
3. Assign notification channels to alert rules

## Alerting Rules

**File**: `config/alerting-rules.yml`

Pre-configured alert rules monitor:

### Critical Alerts
- API error rate > 5%
- API response time > 1 second (95th percentile)
- Database connection failures
- Service down
- Out of memory (> 95%)

### Warning Alerts
- Slow database queries (> 500ms)
- High database pool utilization (> 80%)
- High memory usage (> 80%)
- Large job queue (> 1000 jobs)
- High job failure rate (> 10%)
- Low cache hit rate (< 50%)

### Info Alerts
- High request volume (> 1000 req/s)
- Low online drivers (< 5)
- No active vehicles

### Severity Levels

```yaml
severity: critical  # Immediate action required (page on-call)
severity: warning   # Monitor and plan action
severity: info      # Informational only
```

## Structured Logging

### Usage Examples

```typescript
import { getLogger, logHttpRequest, logDatabaseOperation } from './monitoring/structured-logging';

// HTTP request logging
logHttpRequest({
  requestId: req.id,
  method: req.method,
  url: req.url,
  status: res.statusCode,
  duration: responseTime,
  userId: user?.id,
  userAgent: req.get('user-agent'),
  ip: req.ip,
  error: err // If request failed
});

// Database operation logging
logDatabaseOperation({
  operation: 'SELECT',
  table: 'vehicles',
  duration: queryTime,
  rowsAffected: result.rowCount,
  userId: user?.id,
  tenantId: user?.tenantId,
  error: err // If query failed
});

// Business event logging
logBusinessEvent({
  eventType: 'DRIVER_COMPLETED_ROUTE',
  userId: driver.id,
  tenantId: driver.tenantId,
  metadata: {
    routeId: route.id,
    distance: route.distance,
    duration: route.duration
  }
});

// Audit event logging
logAuditEvent({
  action: 'UPDATE',
  resource: 'VEHICLE',
  userId: user.id,
  tenantId: user.tenantId,
  status: 'success',
  changes: {
    status: { old: 'available', new: 'dispatched' }
  }
});
```

### Log Files

```
logs/
  ├── application-YYYY-MM-DD.log        # All logs (JSON)
  ├── error-YYYY-MM-DD.log              # Errors only (JSON, 30-day retention)
  └── debug-YYYY-MM-DD.log              # Debug logs (development only, 7-day retention)
```

### Log Aggregation (ELK Stack Example)

```yaml
# Filebeat configuration
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /app/logs/*.log
    json.message_key: message
    json.keys_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]

processors:
  - add_kubernetes_metadata:
  - add_docker_metadata:
```

### Azure Log Analytics Integration

Logs automatically sent to Application Insights (Azure Monitor) when configured:

```bash
# Query logs in Azure
az monitor log-analytics query --workspace-id <workspace-id> \
  --analytics-query 'customEvents | where name == "ApplicationError" | count'
```

## Performance Tuning

### Prometheus Scraping

```yaml
# Adjust in prometheus.yml
global:
  scrape_interval: 30s    # Increase for less frequent scraping
  evaluation_interval: 30s
```

### Log Retention

Adjust in `monitoring/structured-logging.ts`:
```typescript
maxDays: '14d'    // Application logs
maxDays: '30d'    // Error logs
maxDays: '7d'     // Debug logs
```

### Memory Monitoring

Adjust in `monitoring/memory.ts`:
```typescript
const HIGH_MEMORY_THRESHOLD = 85;  // Increase threshold
const MEMORY_CHECK_INTERVAL = 10 * 60 * 1000;  // Every 10 minutes
```

## Kubernetes Deployment

### Health Check Configuration

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

### Prometheus Scraping

```yaml
apiVersion: v1
kind: Service
metadata:
  name: fleet-api
  labels:
    app: fleet-api
spec:
  selector:
    app: fleet-api
  ports:
    - name: metrics
      port: 3001
      targetPort: 3001
  type: ClusterIP
```

### ServiceMonitor (for Prometheus Operator)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: fleet-api
spec:
  selector:
    matchLabels:
      app: fleet-api
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

## Troubleshooting

### Prometheus Not Scraping

1. Check metrics endpoint: `curl http://localhost:3001/metrics`
2. Verify prometheus.yml configuration
3. Check Prometheus targets: http://localhost:9090/targets
4. Review Prometheus logs: `tail -f /var/log/prometheus.log`

### High Memory Usage

1. Check memory metrics: `curl http://localhost:3001/health`
2. Enable debug logging: `LOG_LEVEL=debug`
3. Review garbage collection: Run with `node --expose-gc`
4. Check for memory leaks: Use Clinic.js or node-inspector

### Missing Logs

1. Verify logs directory exists: `ls -la logs/`
2. Check file permissions: `chmod 755 logs/`
3. Verify log level: `curl http://localhost:3001/health | grep logLevel`
4. Check disk space: `df -h`

### Sentry Not Capturing Errors

1. Verify DSN is set: `echo $SENTRY_DSN`
2. Check network connectivity to Sentry
3. Test with manual error: Make request that triggers error
4. Review Sentry dashboard: https://sentry.io

## Best Practices

### 1. Alert Tuning

- Set thresholds based on historical baseline
- Use alert severity levels appropriately
- Avoid alert fatigue (too many false positives)
- Review and update alerts quarterly

### 2. Log Management

- Use structured logging for all operations
- Include request IDs for tracing
- Log business events separately
- Implement log retention policies

### 3. Metric Collection

- Use consistent label names
- Keep cardinality reasonable (avoid unbounded labels)
- Record metrics at operation boundaries
- Use appropriate histogram buckets

### 4. Dashboard Maintenance

- Keep dashboards focused on key metrics
- Update dashboards when system changes
- Share dashboards with ops and dev teams
- Set up dashboard annotations for deployments

### 5. On-Call Runbooks

Create runbooks for each alert:
- What does the alert mean?
- What's the impact?
- How to investigate?
- How to fix?
- Who to escalate to?

Example:
```markdown
## Alert: HighErrorRate

**Severity**: Critical
**Impact**: Users experiencing failures

### Investigation
1. Check Grafana dashboard
2. Review error logs
3. Check recent deployments

### Remediation
1. Rollback if recent deployment
2. Scale up instances
3. Contact database team if DB errors
```

## Monitoring Metrics

### Key Performance Indicators (KPIs)

Track these metrics in dashboards:
- **Availability**: Uptime percentage (target: 99.95%)
- **Latency**: p95 response time (target: < 1 second)
- **Error Rate**: Percentage of failed requests (target: < 0.5%)
- **Throughput**: Requests per second (target: > 100 req/s)
- **Saturation**: Resource utilization (target: < 80%)

### SLOs (Service Level Objectives)

Define SLOs based on KPIs:
- Availability SLO: 99.9% uptime
- Latency SLO: 95% of requests < 500ms
- Error Rate SLO: 99.9% success rate

## Integration with CI/CD

### Pre-Deployment Checks

```bash
# Health check before deploying
curl --fail http://localhost:3001/health/ready || exit 1

# Verify monitoring is active
curl --fail http://localhost:3001/metrics > /dev/null || exit 1
```

### Post-Deployment Validation

```yaml
# In CI/CD pipeline
steps:
  - name: Verify Monitoring
    run: |
      # Wait for metrics to start flowing
      sleep 30

      # Check error rate
      ERROR_RATE=$(curl -s http://localhost:3001/metrics | grep http_errors_total)
      if [ -z "$ERROR_RATE" ]; then
        echo "No error metrics collected"
        exit 1
      fi
```

## Security Considerations

### Sensitive Data Filtering

The monitoring setup automatically filters:
- Passwords and API keys
- Authorization headers
- Cookies and session tokens
- Credit card information
- Social security numbers

### Access Control

Restrict access to monitoring endpoints:
```typescript
// Add authentication middleware
app.use('/metrics', authenticateToken);
app.use('/health', rateLimit({ windowMs: 60000, max: 100 }));
```

### Data Retention

- Logs: 14-30 days
- Metrics: 15 days (Prometheus default)
- Errors (Sentry): 90 days
- Application Insights: 90 days

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [winston Logger](https://github.com/winstonjs/winston)
- [prom-client](https://github.com/siimon/prom-client)
