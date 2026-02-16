# Fleet-CTA Alerting Configuration Guide

## Overview

This guide explains how to configure, test, and maintain alerts for the Fleet Management API production environment. Alerts are defined in `config/alerting-rules.yml` and are evaluated by Prometheus every 30 seconds.

## Alert Architecture

### Alert Flow

```
Prometheus → Alert Rule → Alertmanager → Notification Channel → On-Call Team
    ↓
  Metrics
  Collected
   Every 15s
```

### Alert States

1. **Inactive** - Condition not met
2. **Pending** - Condition met but within evaluation period
3. **Firing** - Alert triggered, notifications sent
4. **Resolved** - Condition cleared, recovery notification sent

## Alert Categories

### 1. API/HTTP Alerts

#### HighErrorRate
- **Severity**: CRITICAL
- **Condition**: Error rate > 5% for 5 minutes
- **Triggers When**: More than 1 in 20 requests fail
- **Example**: `(http_errors_total / http_requests_total) > 0.05`
- **Action**:
  - Check API logs
  - Review recent deployments
  - Check database connectivity
  - Monitor error patterns

#### SlowAPIResponse
- **Severity**: WARNING
- **Condition**: 95th percentile latency > 1 second for 10 minutes
- **Triggers When**: API responses become sluggish
- **Action**:
  - Check database query performance
  - Review slow log
  - Check system resources (CPU, memory)
  - Identify slow endpoints

#### HighRequestVolume
- **Severity**: INFO
- **Condition**: Request rate > 1000 req/s for 5 minutes
- **Triggers When**: Unusual traffic spike
- **Action**:
  - Check for DDoS
  - Review legitimate traffic sources
  - Prepare to scale horizontally

#### APIDown
- **Severity**: CRITICAL
- **Condition**: Service unreachable for 1 minute
- **Triggers When**: Cannot connect to health endpoint
- **Action**:
  - Restart service immediately
  - Check logs for startup errors
  - Verify database connectivity
  - Escalate if persists

### 2. Database Alerts

#### DatabaseConnectionFailed
- **Severity**: CRITICAL
- **Condition**: Connection failures > 0 in 5 minutes
- **Triggers When**: Cannot establish database connections
- **Action**:
  - Check database server status
  - Review connection pool settings
  - Check firewall rules
  - Review database logs

#### SlowDatabaseQueries
- **Severity**: WARNING
- **Condition**: 95th percentile query time > 500ms for 10 minutes
- **Triggers When**: Queries taking too long
- **Action**:
  - Review EXPLAIN plans for slow queries
  - Check missing indexes
  - Review table statistics
  - Check for lock contention

#### HighDatabaseErrorRate
- **Severity**: CRITICAL
- **Condition**: Error rate > 1% for 5 minutes
- **Triggers When**: Many queries failing
- **Action**:
  - Check database error logs
  - Verify schema integrity
  - Check for deadlocks
  - Verify network connectivity

#### LowDatabaseConnectionPool
- **Severity**: WARNING
- **Condition**: < 5 connections available for 5 minutes
- **Triggers When**: Running out of connections
- **Action**:
  - Increase pool size: `DB_WEBAPP_POOL_SIZE`
  - Identify long-running queries
  - Review connection usage
  - Scale database replicas

#### HighDatabasePoolUtilization
- **Severity**: WARNING
- **Condition**: Pool usage > 80% for 5 minutes
- **Triggers When**: Using most of available connections
- **Action**:
  - Increase pool size
  - Optimize query performance
  - Implement connection pooling proxy (PgBouncer)
  - Review application connection handling

### 3. Memory Alerts

#### HighMemoryUsage
- **Severity**: WARNING
- **Condition**: Memory usage > 80% for 5 minutes
- **Triggers When**: Heap consumption high
- **Action**:
  - Check for memory leaks
  - Review object allocation patterns
  - Increase heap size
  - Scale horizontally

#### MemoryLeak
- **Severity**: WARNING
- **Condition**: Memory continuously increasing for 1 hour
- **Triggers When**: Suspected memory leak
- **Action**:
  - Collect heap dump: `node --inspect`
  - Analyze with Chrome DevTools
  - Review recent code changes
  - Use Clinic.js for profiling

#### OutOfMemory
- **Severity**: CRITICAL
- **Condition**: Memory usage > 95% for 1 minute
- **Triggers When**: OOM crash imminent
- **Action**:
  - Restart service immediately
  - Increase server memory
  - Enable garbage collection monitoring
  - Page SRE on-call

### 4. Job Queue Alerts

#### LargeJobQueue
- **Severity**: WARNING
- **Condition**: Queue size > 1000 for 10 minutes
- **Triggers When**: Jobs backing up
- **Action**:
  - Check job processor logs
  - Review job duration
  - Scale job worker instances
  - Check for job failures

#### HighJobFailureRate
- **Severity**: CRITICAL
- **Condition**: Failure rate > 10% for 5 minutes
- **Triggers When**: Many jobs failing
- **Action**:
  - Review job failure logs
  - Check external service dependencies
  - Verify database connectivity
  - Retry failed jobs

#### SlowJobProcessing
- **Severity**: WARNING
- **Condition**: 95th percentile job time > 30 seconds for 10 minutes
- **Triggers When**: Jobs taking longer than normal
- **Action**:
  - Profile job execution
  - Check for database locks
  - Review external service latency
  - Optimize job logic

### 5. Cache Alerts

#### LowCacheHitRate
- **Severity**: WARNING
- **Condition**: Hit rate < 50% for 15 minutes
- **Triggers When**: Cache not effective
- **Action**:
  - Review cache strategy
  - Check cache eviction policy
  - Increase cache size
  - Review query patterns

### 6. System Alerts

#### ServiceDown
- **Severity**: CRITICAL
- **Condition**: Service unreachable for 2 minutes
- **Triggers When**: Cannot reach service endpoint
- **Action**:
  - Check service status
  - Review logs for errors
  - Verify network connectivity
  - Restart if needed

#### ServiceHighCPU
- **Severity**: WARNING
- **Condition**: CPU usage > 80% for 5 minutes
- **Triggers When**: High CPU consumption
- **Action**:
  - Profile with `node --prof`
  - Check for infinite loops
  - Review CPU-intensive operations
  - Scale horizontally

### 7. Business Alerts

#### UnprocessedDispatchOrders
- **Severity**: WARNING
- **Condition**: Dispatch queue > 50 for 15 minutes
- **Triggers When**: Dispatch orders not being processed
- **Action**:
  - Check dispatch service logs
  - Review order processing logic
  - Scale dispatch workers
  - Notify dispatch team

#### AnomalousRouteData
- **Severity**: WARNING
- **Condition**: Location update rate < 1/sec for 10 minutes
- **Triggers When**: Vehicles not updating location
- **Action**:
  - Check GPS tracking service
  - Review vehicle connectivity
  - Check for update failures
  - Notify fleet operations

## Configuring Alertmanager

### 1. Install Alertmanager

```bash
# macOS
brew install alertmanager

# Docker
docker run -d -p 9093:9093 --name alertmanager prom/alertmanager

# Manual
wget https://github.com/prometheus/alertmanager/releases/download/v0.25.0/alertmanager-0.25.0.linux-amd64.tar.gz
```

### 2. Configuration (alertmanager.yml)

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  pagerduty_url: "https://events.pagerduty.com/v2/enqueue"

route:
  receiver: "default"
  group_by: ["alertname", "cluster"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h

  routes:
    # Critical alerts -> PagerDuty
    - match:
        severity: critical
      receiver: "pagerduty"
      repeat_interval: 15m

    # Warnings -> Slack
    - match:
        severity: warning
      receiver: "slack-warnings"
      repeat_interval: 2h

    # Info -> Slack
    - match:
        severity: info
      receiver: "slack-info"
      repeat_interval: 4h

receivers:
  - name: "default"
    slack_configs:
      - channel: "#alerts"
        title: "Alert: {{ .GroupLabels.alertname }}"
        text: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"

  - name: "pagerduty"
    pagerduty_configs:
      - routing_key: "YOUR-ROUTING-KEY"
        description: "{{ .GroupLabels.alertname }}"
        details:
          firing: "{{ .Alerts.Firing | len }}"
          resolved: "{{ .Alerts.Resolved | len }}"

  - name: "slack-warnings"
    slack_configs:
      - channel: "#fleet-warnings"
        color: "warning"

  - name: "slack-info"
    slack_configs:
      - channel: "#fleet-info"
        color: "good"

inhibit_rules:
  # Inhibit warning if critical is firing
  - source_match:
      severity: "critical"
    target_match:
      severity: "warning"
    equal: ["alertname", "cluster"]

  # Inhibit info if warning is firing
  - source_match:
      severity: "warning"
    target_match:
      severity: "info"
    equal: ["alertname"]
```

### 3. Enable in Prometheus

Add to `prometheus.yml`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ["localhost:9093"]

rule_files:
  - "config/alerting-rules.yml"
```

## Creating Custom Alerts

### Alert Rule Format

```yaml
- alert: MyAlertName
  expr: |
    # Prometheus query expression
    http_requests_total > 1000
  for: 5m  # Duration before alerting
  labels:
    severity: warning
    component: api
  annotations:
    summary: "Short description"
    description: "Detailed description with {{ $value }}"
```

### Custom Alert Examples

#### Alert on specific error type

```yaml
- alert: AuthenticationFailures
  expr: |
    sum(rate(http_errors_total{error_type="authentication"}[5m])) > 10
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High authentication failure rate"
    description: "{{ $value | humanize }} auth failures per second"
```

#### Alert on business metric

```yaml
- alert: NoDispatchersAvailable
  expr: |
    count(count by(dispatcher_id) (dispatcher_status == "available")) == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "No dispatchers available"
    description: "All dispatchers are offline"
```

#### Alert on SLO breach

```yaml
- alert: SLOBreach
  expr: |
    # Availability SLO: 99.9%
    (
      sum(rate(http_requests_total{status=~"5.."}[5m])) /
      sum(rate(http_requests_total[5m]))
    ) > 0.001
  for: 10m
  labels:
    severity: critical
  annotations:
    summary: "SLO breach - error rate too high"
    description: "Error rate {{ $value | humanizePercentage }} exceeds SLO"
```

## Alert Testing

### Test Alert Rules

```bash
# Check alert syntax
promtool check rules config/alerting-rules.yml

# Test specific rule
promtool query instant --config.file prometheus.yml 'ALERT HighErrorRate'
```

### Test in Prometheus UI

1. Go to http://localhost:9090
2. Go to Alerts
3. Check rule status and values
4. Verify expressions in Graph tab

### Manual Alert Triggering

For testing notification channels:

```bash
# Send test alert to Alertmanager
curl -XPOST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "critical"
  },
  "annotations": {
    "summary": "Test alert",
    "description": "This is a test alert"
  },
  "generatorURL": "http://localhost:9090/test"
}]
EOF
```

## Alert Tuning

### Reducing False Positives

**Problem**: Alert firing for temporary blips

**Solutions**:
1. Increase `for` duration: `for: 10m` instead of `for: 5m`
2. Use rate() function to smooth: `rate(metric[5m])`
3. Adjust threshold: Make thresholds based on baselines

```yaml
# Before (too sensitive)
- alert: HighErrorRate
  expr: http_errors_total > 1
  for: 1m

# After (better)
- alert: HighErrorRate
  expr: rate(http_errors_total[5m]) > 0.05
  for: 5m
```

### Reducing Alert Fatigue

**Problem**: Too many alerts causing alert numbness

**Solutions**:
1. Remove low-value alerts
2. Increase repeat intervals for non-critical
3. Group related alerts
4. Implement alert suppression

```yaml
# Suppress non-critical alerts during deployments
inhibit_rules:
  - source_match:
      alertname: "Deployment"
    target_match_re:
      severity: "warning|info"
    equal: ["cluster"]
```

### Setting Appropriate Thresholds

1. **Collect baseline data** - Run system for 2-4 weeks
2. **Calculate percentiles** - Use p95 or p99
3. **Add safety margin** - Use baseline + 20-30%
4. **Review quarterly** - Adjust as system evolves

```bash
# Query historical data
curl 'http://localhost:9090/api/v1/query_range?query=rate(http_request_duration_seconds[5m])&start=2024-01-01&end=2024-01-31&step=1h'
```

## On-Call Runbooks

Create a runbook for each alert. Example:

### Alert: HighErrorRate

**Severity**: CRITICAL
**On-Call**: Check PagerDuty escalation policy

**What this means**:
- More than 5% of API requests are failing
- Users cannot use the application
- Revenue impact expected

**Investigation Steps**:
1. Go to Grafana Fleet dashboard
2. Check "Error Rate" panel for trends
3. Click drill-down to see error types
4. Check application logs:
   ```bash
   tail -f logs/error-*.log | grep -i error
   ```
5. Check if recent deployment:
   ```bash
   curl https://api.github.com/repos/fleet-cta/fleet-api/deployments | jq '.[0].created_at'
   ```

**Quick Fixes** (in order):
1. Check database connectivity:
   ```bash
   curl http://localhost:3001/health
   ```
2. If DB is down, contact Database team
3. Check for DDoS:
   ```bash
   tail -f logs/application-*.log | awk '{print $NF}' | sort | uniq -c | sort -rn
   ```
4. Review recent changes in Git
5. Consider rollback if recent deployment

**Escalation**:
- Wait 5 minutes for automatic recovery
- If persists, page SRE on-call
- If SRE unavailable, page engineering lead

**Links**:
- Dashboard: http://grafana.fleet.internal/d/fleet-api-prod
- Logs: https://logs.fleet.internal (search for `error_rate`)
- Deployment History: https://github.com/fleet-cta/fleet-api/deployments
- Runbook: https://wiki.fleet.internal/runbooks/high-error-rate

## Alert Response Automation

### PagerDuty Integration

```yaml
pagerduty_configs:
  - routing_key: "YOUR-INTEGRATION-KEY"
    description: "{{ .GroupLabels.alertname }}"
    details:
      "Firing Alerts": "{{ range .Alerts.Firing }}{{ .Labels.alertname }}\n{{ end }}"
      "Resolved": "{{ range .Alerts.Resolved }}{{ .Labels.alertname }}\n{{ end }}"
    client: "Prometheus"
    client_url: "{{ .ExternalURL }}"
    severity: "{{ if eq .GroupLabels.severity \"critical\" }}critical{{ else }}warning{{ end }}"
```

### Slack Integration

```yaml
slack_configs:
  - channel: "#fleet-alerts"
    title: "{{ .GroupLabels.alertname }}"
    text: |
      {{ range .Alerts.Firing }}
      Metric: {{ .Labels.job }}
      Value: {{ .Annotations.description }}
      Runbook: {{ .Annotations.runbook_url }}
      {{ end }}
    actions:
      - type: button
        text: "Acknowledge"
        url: "{{ .AlertURL }}"
      - type: button
        text: "Runbook"
        url: "https://wiki.fleet.internal/runbooks/{{ .GroupLabels.alertname }}"
```

## Monitoring Alerts

### Alert SLO

Track alert system health:

```
- Alert detection latency < 2 minutes (SLO: 99%)
- Alert delivery success > 99.5%
- Alert rule accuracy > 95% (true positives)
- False positive rate < 5%
```

### Metrics

```yaml
alertmanager_notifications_total  # Total notifications sent
alertmanager_notifications_failed_total  # Failed notifications
prometheus_rule_evaluation_duration_seconds  # Rule evaluation time
prometheus_rule_evaluation_failures_total  # Failed evaluations
```

## Maintenance

### Weekly

- [ ] Review new alerts
- [ ] Check alert accuracy
- [ ] Verify notification channels working

### Monthly

- [ ] Review alert SLOs
- [ ] Adjust thresholds based on trends
- [ ] Update runbooks
- [ ] Conduct alert fire drill

### Quarterly

- [ ] Remove obsolete alerts
- [ ] Comprehensive threshold review
- [ ] Update alert documentation
- [ ] Review on-call feedback

## References

- [Prometheus Alerting](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [PagerDuty Integration](https://www.pagerduty.com/docs/guides/prometheus-integration-guide/)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
