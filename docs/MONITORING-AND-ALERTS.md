# Monitoring & Alerts for Validation Framework

## Key Metrics to Monitor

### Framework-Level Metrics

| Metric | Target | Warning | Critical | Description |
|--------|--------|---------|----------|-------------|
| **Quality Score** | > 85 | 60-85 | < 60 | Overall application quality (0-100) |
| **Agents Running** | 6/6 | 5/6 | < 5 | Number of operational agents |
| **Validation Runs** | Daily | < Daily | No runs | Frequency of validation execution |
| **Average Run Time** | < 45s | 45-60s | > 60s | Total validation execution time |
| **Health Check Status** | healthy | degraded | unhealthy | System component health |
| **Readiness Status** | ready | checking | not ready | System deployment readiness |

### Agent-Specific Metrics

| Agent | Key Metric | Target | Warning | Critical |
|-------|-----------|--------|---------|----------|
| **VisualQAAgent** | Execution time | < 10s | 10-15s | > 15s |
| **ResponsiveDesignAgent** | Execution time | < 15s | 15-20s | > 20s |
| **ScrollingAuditAgent** | Execution time | < 8s | 8-12s | > 12s |
| **TypographyAgent** | Execution time | < 5s | 5-8s | > 8s |
| **InteractionQualityAgent** | Execution time | < 15s | 15-20s | > 20s |
| **DataIntegrityAgent** | Execution time | < 5s | 5-8s | > 8s |

### Issue Metrics

| Metric | Target | Action |
|--------|--------|--------|
| **Critical Issues** | 0 | Investigate immediately |
| **High Severity Issues** | < 5 | Address within 24 hours |
| **Medium Severity Issues** | < 20 | Address within 1 week |
| **Issue Resolution Rate** | > 80% | Improve process if below |
| **Mean Time to Resolution** | < 4 hours | Escalate if exceeding |

### Performance Metrics

| Metric | Target | Acceptable | Warning | Critical |
|--------|--------|-----------|---------|----------|
| **API Response Time** | < 100ms | < 200ms | 200-500ms | > 500ms |
| **Database Query Time** | < 50ms | < 100ms | 100-200ms | > 200ms |
| **Cache Hit Rate** | > 90% | > 80% | 60-80% | < 60% |
| **Memory Usage** | < 50% | < 70% | 70-85% | > 85% |
| **CPU Usage** | < 40% | < 60% | 60-80% | > 80% |

---

## Logging Integration

### Winston Logging Configuration

```typescript
// api/src/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'validation-framework' },
  transports: [
    // File logging
    new winston.transports.File({
      filename: 'logs/validation-error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/validation-combined.log',
      maxsize: 5242880,
      maxFiles: 5
    }),
    // Console logging (development)
    ...(process.env.NODE_ENV !== 'production'
      ? [new winston.transports.Console({
        format: winston.format.simple()
      })]
      : [])
  ]
});

export { logger };
```

### Log Levels

- **ERROR**: Critical issues requiring attention (errors, failures, crashes)
- **WARN**: Degraded performance, threshold breaches
- **INFO**: Informational events, validation starts/ends
- **DEBUG**: Detailed diagnostic info for troubleshooting
- **TRACE**: Function-level execution details

### Sample Log Entries

**Agent Execution:**
```json
{
  "timestamp": "2026-02-25T12:35:22.000Z",
  "level": "info",
  "service": "validation-framework",
  "event": "agent_execution_started",
  "agent": "VisualQAAgent",
  "runId": "val-20260225-123500",
  "memory_usage_mb": 156
}
```

**Issue Detected:**
```json
{
  "timestamp": "2026-02-25T12:35:45.123Z",
  "level": "warn",
  "service": "validation-framework",
  "event": "issue_detected",
  "severity": "high",
  "agent": "ResponsiveDesignAgent",
  "issue_type": "button_touch_target_too_small",
  "component": "PrimaryButton",
  "details": "Touch target 36x36px < minimum 44x44px"
}
```

**Performance Warning:**
```json
{
  "timestamp": "2026-02-25T12:36:10.000Z",
  "level": "warn",
  "service": "validation-framework",
  "event": "performance_threshold_exceeded",
  "metric": "validation_run_time",
  "threshold_ms": 60000,
  "actual_ms": 65432,
  "agents": {
    "VisualQAAgent": 12000,
    "ResponsiveDesignAgent": 18000,
    "InteractionQualityAgent": 35000
  }
}
```

---

## Sentry Error Tracking

### Sentry Configuration

```typescript
// api/src/server.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.VERSION,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
  tracesSampleRate: 0.1,
  beforeSend: (event, hint) => {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error?.message?.includes('ENOTFOUND')) {
        return null; // Don't send DNS errors
      }
    }
    return event;
  }
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Error Categories to Track

**Framework Errors:**
- Agent execution failures
- Database connection errors
- Redis connection errors
- Validation orchestration failures

**Business Logic Errors:**
- Issue detection failures
- Quality score calculation errors
- Data integrity check failures

**Infrastructure Errors:**
- Out of memory conditions
- Database timeout errors
- Slow query warnings

### Alerting on Sentry

```bash
# Create alert for critical validation errors
POST https://sentry.io/api/0/projects/{org}/{project}/alerts/rules/

{
  "name": "Validation Framework Critical Error",
  "conditions": [
    {
      "id": "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
      "value": 10,
      "match": "gt"
    },
    {
      "id": "sentry.rules.conditions.event_attribute.EventAttributeCondition",
      "match": "eq",
      "attribute": "tags.service",
      "value": "validation-framework"
    },
    {
      "id": "sentry.rules.conditions.event_attribute.EventAttributeCondition",
      "match": "eq",
      "attribute": "level",
      "value": "error"
    }
  ],
  "actions": [
    {
      "id": "sentry.integrations.slack.notify_action.SlackNotifyServiceAction",
      "service": "slack",
      "channel_id": "C123456"
    }
  ]
}
```

---

## Dashboard Setup

### Grafana Validation Dashboard

**Dashboard JSON Configuration:**
```json
{
  "dashboard": {
    "title": "Validation Framework Status",
    "tags": ["validation", "fleet"],
    "panels": [
      {
        "title": "Quality Score Trend",
        "targets": [
          {
            "expr": "validation_framework_quality_score",
            "legendFormat": "Quality Score"
          }
        ],
        "thresholds": [
          { "value": 60, "color": "red" },
          { "value": 85, "color": "yellow" },
          { "value": 100, "color": "green" }
        ]
      },
      {
        "title": "Agents Status",
        "targets": [
          {
            "expr": "validation_agents_operational"
          }
        ]
      },
      {
        "title": "Issues by Severity",
        "targets": [
          {
            "expr": "validation_issues_critical",
            "legendFormat": "Critical"
          },
          {
            "expr": "validation_issues_high",
            "legendFormat": "High"
          },
          {
            "expr": "validation_issues_medium",
            "legendFormat": "Medium"
          }
        ]
      }
    ]
  }
}
```

### Key Dashboard Panels

**Panel 1: Quality Score Gauge**
- Type: Gauge
- Range: 0-100
- Thresholds: Red <60, Yellow 60-85, Green ≥85
- Update every: 1 minute

**Panel 2: Agent Status Grid**
- Type: Table
- Columns: Agent Name, Status, Last Run, Issue Count
- Highlight failing agents in red
- Update every: 30 seconds

**Panel 3: Issues Over Time**
- Type: Time Series
- Stacked: By Severity
- Range: Last 7 days
- Update every: 5 minutes

**Panel 4: Validation Run Duration**
- Type: Time Series
- Show: Min, Max, Average
- Target: 45 seconds average
- Update every: 1 hour

---

## Health Check Endpoints

### Kubernetes Liveness Probe

```yaml
# Kubernetes deployment config
livenessProbe:
  httpGet:
    path: /api/validation/status/health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

**Expected Response (Healthy):**
```json
{
  "status": 200,
  "body": {
    "success": true,
    "data": {
      "healthy": true,
      "checks": {
        "database": { "status": "healthy", "responseTime": 12 },
        "redis": { "status": "healthy", "responseTime": 2 },
        "agentFramework": { "status": "healthy", "responseTime": 5 }
      }
    }
  }
}
```

**Failure Response:**
```json
{
  "status": 503,
  "body": {
    "success": false,
    "error": "Database connection failed"
  }
}
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /api/validation/status/ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

**Expected Response (Ready):**
```json
{
  "status": 200,
  "body": {
    "success": true,
    "data": {
      "ready": true,
      "agentsReady": ["VisualQAAgent", "ResponsiveDesignAgent", ...],
      "agentsFailing": [],
      "schemaReady": true,
      "cachesWarmed": true
    }
  }
}
```

---

## Alert Thresholds & Responses

### Critical Alerts (Page On-Call)

**1. All Agents Failed**
```
Condition: agents_operational == 0
Threshold: Immediate
Action: PagerDuty critical alert → Page on-call engineer
Response: Verify database/Redis connectivity, restart framework
```

**2. Quality Score Critical**
```
Condition: quality_score < 50
Threshold: Immediate
Action: Slack alert → Notify dev team
Response: Review new critical issues, coordinate emergency fix
```

**3. Framework Unresponsive**
```
Condition: health_check_fails > 2 consecutive
Threshold: Immediate
Action: PagerDuty alert → Page DevOps
Response: SSH into server, check service status, restart if needed
```

**4. Database Unreachable**
```
Condition: database_health == unhealthy
Threshold: Immediate
Action: PagerDuty alert → Page database admin
Response: Verify PostgreSQL service, check connections, failover if needed
```

### High Alerts (Notify Team)

**1. Validation Not Running**
```
Condition: last_run_time > 2 hours ago
Threshold: Warning for 30 minutes → High
Action: Slack notification → Dev team
Response: Check scheduler job, verify logs, restart if needed
```

**2. Slow Validation Runs**
```
Condition: average_run_time > 60 seconds (3 consecutive runs)
Threshold: Warning
Action: Slack notification → Eng lead
Response: Profile agents, identify slow components, optimize if possible
```

**3. High Issue Count**
```
Condition: new_critical_issues > 10 in last run
Threshold: Warning
Action: Slack notification → Dev team
Response: Investigate recent changes, prepare hotfix
```

**4. Cache Hit Rate Low**
```
Condition: cache_hit_rate < 60%
Threshold: Warning
Action: Slack notification → DevOps
Response: Check cache size, TTL settings, memory pressure
```

### Info Alerts (Log Only)

**1. Agent Starting**
- Log to validation-combined.log
- No external notification needed

**2. Issue Resolved**
- Log to validation-combined.log
- Update dashboard metrics

**3. Regular Status Updates**
- Hourly status summary log
- No notifications needed

---

## On-Call Procedures

### On-Call Rotation

**Weekly rotation:** Monday-Sunday, 9 AM → 9 AM next day

**On-Call Engineer Responsibilities:**
- Monitor Slack #validation-alerts channel
- Respond to PagerDuty alerts within 5 minutes
- Escalate to manager after 15 minutes if unresolved
- Document all incidents in incident tracker
- Prepare handoff notes for next on-call

### On-Call Checklist

At start of shift:
- [ ] Verify PagerDuty notifications enabled
- [ ] Check Grafana dashboard accessible
- [ ] Verify Slack notifications working
- [ ] Review yesterday's incidents
- [ ] Confirm runbook location

Every 4 hours:
- [ ] Check framework health status
- [ ] Review recent logs for warnings
- [ ] Verify no silent failures
- [ ] Test escalation procedures

End of shift:
- [ ] Document any issues encountered
- [ ] Update runbook if procedures changed
- [ ] Brief next on-call engineer
- [ ] Update incident tracker with resolutions

### Incident Response

1. **Alert Received** (0 min)
   - Acknowledge alert in PagerDuty
   - Open relevant dashboard/logs
   - Post in Slack #incidents channel

2. **Initial Investigation** (0-5 min)
   - Check framework health status
   - Review recent logs and errors
   - Identify affected components
   - Determine severity (P1/P2/P3)

3. **Mitigation** (5-15 min)
   - Quick fix if obvious (config, restart)
   - Escalate if complex investigation needed
   - Communicate status to team
   - Activate war room if P1

4. **Resolution** (15+ min)
   - Deep dive investigation
   - Implement fix
   - Verify resolution
   - Update ticket with resolution

5. **Post-Incident** (Next day)
   - Write incident summary
   - Schedule post-mortem if needed
   - Update runbook
   - Share learnings with team

---

## Incident Response Procedures

### P1: Critical Outage (Framework Down)

**Timeline: 0-60 minutes**

```
0 min:  Alert fires → On-call acknowledges → Slack #incidents notification
2 min:  Assess: Is production impacted? Yes → Declare P1
5 min:  Immediate action: Check health status, try restart
10 min: If not resolved: Begin rollback procedure
15 min: Escalate to engineering lead if still unresolved
30 min: Post status to leadership
60 min: Target resolution or full rollback
```

### P2: High Issue (Degraded Performance)

**Timeline: 0-4 hours**

```
0 min:  Alert fires → On-call acknowledges
5 min:  Assess: Performance degraded but functional → P2
10 min: Investigate root cause
30 min: Brief team on findings
60 min: Begin fix implementation
4 hours: Target resolution
```

### P3: Low Severity (Minor Issue)

**Timeline: Can wait until business hours**

```
0 min:  Alert fires → On-call logs issue
30 min: Brief investigation
4 hours: Can escalate to day shift if not resolved
24 hours: Target resolution
```

---

## Monitoring Checklist

### Daily (Automated)

- [ ] Health check runs every 10 seconds
- [ ] Readiness probe runs every 5 seconds
- [ ] Metrics collected every 1 minute
- [ ] Logs aggregated continuously
- [ ] Alerts evaluated every 5 minutes

### Weekly (Manual)

- [ ] Review metrics for trends
- [ ] Check dashboard for accuracy
- [ ] Verify alert thresholds appropriate
- [ ] Review incident logs
- [ ] Update runbook if needed

### Monthly (Planning)

- [ ] Capacity planning review
- [ ] Alert tuning review
- [ ] Incident post-mortems
- [ ] Performance optimization review
- [ ] Monitoring tool updates

---

## Monitoring Troubleshooting

### Metrics Not Updating

```bash
# Verify Prometheus scrape
curl http://prometheus:9090/api/v1/targets

# Check validation framework exporting metrics
curl http://localhost:3001/metrics

# Restart Prometheus if needed
systemctl restart prometheus
```

### Dashboard Not Showing Data

```bash
# Verify Grafana data source
curl http://grafana:3000/api/datasources

# Check query syntax
# View raw query results in Prometheus UI

# Restart Grafana if needed
systemctl restart grafana-server
```

### Alerts Not Firing

```bash
# Verify alert rules loaded
curl http://prometheus:9090/api/v1/rules

# Check alert manager
curl http://alertmanager:9093/api/v1/alerts

# Manual test: Trigger test alert
curl -X POST http://alertmanager:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"TestAlert"}}]'
```

---

## Documentation References

- [Validation Framework Guide](./VALIDATION-FRAMEWORK-GUIDE.md) - User guide
- [Deployment Procedures](./DEPLOYMENT-PROCEDURES.md) - Deployment guide
- [Automation Setup](./VALIDATION-AUTOMATION.md) - Scheduling guide
