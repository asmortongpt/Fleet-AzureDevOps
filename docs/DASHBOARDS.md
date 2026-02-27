# Fleet-CTA Grafana Dashboards Guide

## Overview

This guide describes the Grafana dashboards for monitoring the Fleet Management API production environment. Dashboards provide visual representation of system health, performance, and business metrics.

## Main Production Dashboard

**Name**: Fleet Management API - Production Dashboard
**UID**: fleet-api-prod
**Location**: `config/grafana-dashboard.json`

### Dashboard Sections

#### 1. Health Overview (Top Left)
- **Widget Type**: Gauge
- **Metric**: `up{job="fleet-api"}`
- **Shows**: Service availability (UP/DOWN)
- **Alert**: Red if service is down
- **Action**: Click to view service status logs

#### 2. Request Rate (Top Center)
- **Widget Type**: Graph
- **Metric**: `sum(rate(http_requests_total[5m])) by (method)`
- **Shows**: Requests per second by HTTP method
- **Breakdown**: GET, POST, PUT, DELETE
- **Baseline**: Normal traffic volume
- **Alert**: Spike indicates traffic surge or DDoS

#### 3. Error Rate (Top Right)
- **Widget Type**: Graph
- **Metric**: `sum(rate(http_errors_total[5m]))`
- **Shows**: Errors per second
- **Threshold**: Line at 5% error rate
- **Alert**: Triggered if > 5% for 5 minutes
- **Action**: Drill down to specific endpoints

#### 4. Response Time Distribution (Middle Left)
- **Widget Type**: Graph
- **Metric**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- **Shows**: Response time by endpoint
- **Threshold**: 1 second line
- **Breakdown**: By route/endpoint
- **Action**: Identify slow endpoints

#### 5. Database Query Performance (Middle Right)
- **Widget Type**: Graph
- **Metric**: `histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))`
- **Shows**: Query latency by operation
- **Breakdown**: SELECT, INSERT, UPDATE, DELETE
- **Threshold**: 500ms line
- **Action**: Correlate with application errors

#### 6. Memory Usage (Bottom Left)
- **Widget Type**: Graph with Two Y-Axes
- **Metrics**:
  - `process_resident_memory_bytes / 1024 / 1024` (RSS in MB)
  - `process_resident_memory_bytes / nodejs_heap_size_limit_bytes * 100` (Heap %)
- **Shows**: Memory consumption over time
- **Threshold**: 80% warning, 90% critical
- **Action**: Investigate if trending up

#### 7. Database Connection Pool (Middle Bottom)
- **Widget Type**: Graph
- **Metrics**:
  - `db_connection_pool_size` (total connections)
  - `db_connection_pool_utilization` (percentage used)
- **Shows**: Connection pool health
- **Threshold**: 80% utilization warning
- **Action**: Increase pool size if consistently high

#### 8. Active Vehicles (Bottom Right)
- **Widget Type**: Gauge
- **Metric**: `fleet_active_vehicles`
- **Shows**: Real-time vehicle count
- **Range**: 0 to fleet size
- **Trend**: Should remain stable

#### 9. Job Queue Status (Bottom Far Left)
- **Widget Type**: Graph
- **Metric**: `job_queue_size` by queue_name
- **Shows**: Pending jobs by queue type
- **Queues**: Email, Notifications, Reports, Dispatch
- **Threshold**: Alert if > 1000 jobs
- **Action**: Investigate job processor

#### 10. Job Processing Rate (Bottom Far Right)
- **Widget Type**: Graph
- **Metric**: `sum(rate(jobs_processed_total[5m])) by (status)`
- **Shows**: Successful vs failed job processing
- **Ratio**: Should be mostly successful
- **Action**: Check job logs if failure rate high

#### 11. Cache Hit Rate (Very Bottom Left)
- **Widget Type**: Graph
- **Metric**: `cache_hit_rate` by cache_name
- **Shows**: Cache effectiveness percentage
- **Baseline**: Should be > 50%
- **Action**: Optimize cache strategy if low

#### 12. Driver Metrics (Very Bottom Middle)
- **Widget Type**: Stat boxes
- **Metrics**:
  - `fleet_drivers_online` (current drivers)
  - `fleet_completed_routes_total` (cumulative)
- **Shows**: Real-time operational metrics
- **Trend**: Drivers online varies by time
- **Action**: Correlate with dispatch workload

## Query Examples

### PromQL Queries Used in Dashboards

#### Request Rate by Method
```promql
sum(rate(http_requests_total[5m])) by (method)
```

#### Error Rate Percentage
```promql
(
  sum(rate(http_errors_total[5m])) /
  sum(rate(http_requests_total[5m]))
) * 100
```

#### Response Time Percentiles
```promql
# 50th percentile (median)
histogram_quantile(0.5, rate(http_request_duration_seconds_bucket[5m]))

# 95th percentile
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

#### Database Performance
```promql
# Slow queries
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m])) > 0.5

# Query count
sum(rate(db_queries_total[5m])) by (query_type)

# Error rate
sum(rate(db_query_errors_total[5m])) by (query_type)
```

#### Memory Trend
```promql
# Memory leak detection
rate(process_resident_memory_bytes[1h]) > 0

# Heap utilization
process_resident_memory_bytes / nodejs_heap_size_limit_bytes * 100
```

#### Business Metrics
```promql
# Active vehicles
fleet_active_vehicles

# Route completion rate
rate(fleet_completed_routes_total[1h])

# Dispatch efficiency
job_queue_size{queue_name="dispatch"} / fleet_drivers_online
```

## Creating Custom Dashboards

### Dashboard 1: Performance Deep Dive

Focus: API latency and database performance

```json
{
  "title": "Fleet API - Performance Deep Dive",
  "panels": [
    {
      "title": "Response Time by Endpoint",
      "targets": [{
        "expr": "histogram_quantile(0.95, sum by(route) (rate(http_request_duration_seconds_bucket[5m])))"
      }]
    },
    {
      "title": "Database Load",
      "targets": [{
        "expr": "sum(rate(db_queries_total[5m])) by (query_type)"
      }]
    },
    {
      "title": "Slow Query Details",
      "targets": [{
        "expr": "sort_desc(topk(10, histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m])) by (query_type, table)))"
      }]
    }
  ]
}
```

### Dashboard 2: Business Operations

Focus: Fleet operations and dispatch

```json
{
  "title": "Fleet Operations Dashboard",
  "panels": [
    {
      "title": "Fleet Status",
      "targets": [{
        "expr": "fleet_active_vehicles"
      }]
    },
    {
      "title": "Driver Availability",
      "targets": [{
        "expr": "fleet_drivers_online"
      }]
    },
    {
      "title": "Dispatch Queue",
      "targets": [{
        "expr": "job_queue_size{queue_name=\"dispatch\"}"
      }]
    },
    {
      "title": "Route Completion",
      "targets": [{
        "expr": "rate(fleet_completed_routes_total[1h])"
      }]
    }
  ]
}
```

### Dashboard 3: Infrastructure Health

Focus: System resources and connectivity

```json
{
  "title": "Infrastructure Health",
  "panels": [
    {
      "title": "CPU Usage",
      "targets": [{
        "expr": "rate(process_cpu_seconds_total[5m]) * 100"
      }]
    },
    {
      "title": "Memory Usage",
      "targets": [{
        "expr": "process_resident_memory_bytes / 1024 / 1024 / 1024"
      }]
    },
    {
      "title": "Database Connection Pool",
      "targets": [{
        "expr": "db_connection_pool_utilization{pool_name=\"webapp\"}"
      }]
    },
    {
      "title": "Cache Efficiency",
      "targets": [{
        "expr": "cache_hit_rate"
      }]
    }
  ]
}
```

### Dashboard 4: Error Analysis

Focus: Errors and failures

```json
{
  "title": "Error Analysis Dashboard",
  "panels": [
    {
      "title": "Error Rate",
      "targets": [{
        "expr": "sum(rate(http_errors_total[5m])) by (status_code)"
      }]
    },
    {
      "title": "Database Errors",
      "targets": [{
        "expr": "sum(rate(db_query_errors_total[5m])) by (error_type)"
      }]
    },
    {
      "title": "Job Failures",
      "targets": [{
        "expr": "sum(rate(jobs_failed_total[5m])) by (queue_name)"
      }]
    },
    {
      "title": "Error Trend",
      "targets": [{
        "expr": "sum(rate(http_errors_total[1m]))"
      }]
    }
  ]
}
```

## Dashboard Variables (Templating)

### Using Dashboard Variables

Variables allow dynamic filtering without editing queries:

```json
"templating": {
  "list": [
    {
      "name": "job",
      "type": "query",
      "datasource": "Prometheus",
      "query": "label_values(up, job)",
      "includeAll": false,
      "refresh": 1
    },
    {
      "name": "instance",
      "type": "query",
      "query": "label_values(up{job=\"$job\"}, instance)",
      "refresh": 1
    },
    {
      "name": "route",
      "type": "query",
      "query": "label_values(http_requests_total, route)",
      "refresh": 1
    }
  ]
}
```

### Using Variables in Queries

```promql
# Filter by job variable
up{job="$job"}

# Filter by instance variable
process_resident_memory_bytes{instance="$instance"}

# Filter by route variable
http_requests_total{route="$route"}
```

## Annotations

Mark important events on dashboards:

```json
{
  "annotations": [
    {
      "datasource": "Prometheus",
      "enable": true,
      "expr": "ALERTS{alertstate=\"firing\"}",
      "name": "Alerts",
      "tagKeys": "alertname",
      "textFormat": "Alert: {{ alertname }}"
    }
  ]
}
```

## Dashboard Sharing

### Share Snapshot
1. Panel menu → More → Share
2. Share snapshot (anonymized)
3. Expires in 90 days

### Embed in Wiki
```html
<iframe
  src="http://grafana.fleet.internal/d-solo/fleet-api-prod?var-job=fleet-api&panelId=2"
  width="100%" height="400"></iframe>
```

## Dashboard Best Practices

### Design Principles

1. **One Purpose**: Each dashboard should answer one question
2. **Logical Flow**: Top to bottom = overview to detail
3. **Color Coding**: Red=bad, yellow=warning, green=good
4. **Consistent Scale**: Use same Y-axis ranges for comparison

### Panel Selection

| Metric Type | Best Panel |
|-----------|-----------|
| Percentage | Gauge |
| Trend over time | Graph/Time series |
| Multiple series | Graph |
| Single value | Stat |
| Correlation | Heatmap |
| Distribution | Histogram |
| Status | Gauge |

### Query Optimization

```promql
# Inefficient - high cardinality
rate(http_request_duration_seconds_bucket[5m])

# Better - aggregated
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (route)

# Best - further aggregated
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
```

## Common Dashboard Issues

### Metric Not Showing
1. Verify metric exists: http://prometheus:9090/graph
2. Check metric name (case-sensitive)
3. Verify labels match

### Slow Dashboard
1. Reduce data retention
2. Aggregate metrics before Grafana
3. Use recording rules for complex queries
4. Increase Prometheus max query time

### Stale Data
1. Check Prometheus scrape interval
2. Verify metric freshness
3. Check for gaps in metric collection

## Dashboard Maintenance

### Weekly
- [ ] Verify all panels show recent data
- [ ] Check for missing/stale metrics
- [ ] Test alert annotations

### Monthly
- [ ] Review dashboard usage (click counts)
- [ ] Update title/descriptions if needed
- [ ] Archive unused dashboards

### Quarterly
- [ ] Full dashboard audit
- [ ] Remove obsolete metrics
- [ ] Update threshold lines
- [ ] Gather team feedback

## Integration with Tools

### Pagerduty Integration

```json
"links": [
  {
    "title": "View in PagerDuty",
    "url": "https://pagerduty.com/incidents?query=fleet-api",
    "targetBlank": true
  }
]
```

### Slack Notifications

```json
"notifications": [
  {
    "name": "slack",
    "type": "slack",
    "settings": {
      "url": "${SLACK_WEBHOOK}"
    }
  }
]
```

## References

- [Grafana Dashboard Guide](https://grafana.com/docs/grafana/latest/dashboards/)
- [PromQL Documentation](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Variables](https://grafana.com/docs/grafana/latest/variables/)
- [Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/manage-dashboards/#dashboard-best-practices)
