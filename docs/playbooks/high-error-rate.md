# High Error Rate Playbook

## Alert Definition

**Trigger:** Error rate exceeds 1% over a 15-minute window
**Severity:** Medium (P2)
**SLA Response Time:** 30 minutes

## Symptoms

- Error rate > 1% in the last 15 minutes
- Multiple failed requests across different endpoints
- Potential user-facing impact
- Alert triggered via Sentry, Application Insights, or monitoring dashboard

## Investigation Steps

### 1. Immediate Assessment (0-5 minutes)

```bash
# Check current error rate
curl -s https://api.fleet-management.com/health | jq '.errorRate'

# Check Sentry for recent errors
open "https://sentry.io/organizations/fleet-management/issues/?query=is:unresolved"

# Check Application Insights
open "https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/logs"
```

**Key Questions:**
- What is the current error rate?
- Which endpoints are affected?
- Is this impacting all users or specific segments?
- When did the error rate start increasing?

### 2. Error Pattern Analysis (5-10 minutes)

**Query Application Insights:**
```kusto
exceptions
| where timestamp > ago(1h)
| summarize count() by type, outerMessage, operation_Name
| order by count_ desc
| take 20
```

**Query Sentry:**
- Filter by time range (last hour)
- Group by error type and message
- Check error frequency and affected users
- Review error stack traces

**Check for:**
- Common error types (500, 503, timeout, etc.)
- Specific API endpoints failing
- Database connection errors
- External service failures
- Rate limiting or quota issues

### 3. Root Cause Identification (10-20 minutes)

#### A. Check System Health

```bash
# Check API server health
curl -s https://api.fleet-management.com/health

# Check database connectivity
curl -s https://api.fleet-management.com/health/database

# Check external dependencies
curl -s https://api.fleet-management.com/health/dependencies
```

#### B. Check Resource Utilization

**Azure Portal:**
```kusto
performanceCounters
| where timestamp > ago(1h)
| where name in ("% Processor Time", "Available Bytes")
| summarize avg(value) by name, bin(timestamp, 5m)
| render timechart
```

**Check for:**
- High CPU usage (> 80%)
- Low memory availability (< 20%)
- High disk I/O
- Network latency

#### C. Check Recent Deployments

```bash
# Check recent deployments
git log --oneline -10

# Check Azure deployment history
az webapp deployment list-publishing-profiles \
  --name fleet-management-api \
  --resource-group fleet-management-rg
```

**Questions:**
- Was there a recent deployment?
- Did configuration change?
- Were dependencies updated?

#### D. Check External Dependencies

```bash
# Check Azure services status
open "https://status.azure.com"

# Check third-party service status
curl -s https://status.openai.com/api/v2/status.json | jq '.status.description'
```

### 4. Common Root Causes

| Root Cause | Indicators | Resolution |
|------------|-----------|------------|
| **Database Issues** | Connection timeouts, slow queries | Check connection pool, optimize queries, scale database |
| **Memory Leak** | Gradual memory increase, OOM errors | Restart service, investigate code, add monitoring |
| **External API Failure** | Specific endpoint failures, timeouts | Enable circuit breaker, add retries, use fallback |
| **Bad Deployment** | Errors started after deployment | Rollback deployment, fix and redeploy |
| **Rate Limiting** | 429 errors, quota exceeded | Increase limits, implement backoff, optimize calls |
| **Configuration Error** | Missing env vars, wrong settings | Fix configuration, redeploy |

## Resolution Steps

### Quick Fixes (Immediate Impact)

#### 1. Rollback Recent Deployment
```bash
# Rollback to previous version
cd /Users/andrewmorton/Documents/GitHub/fleet-local
git checkout <previous-commit>
npm run build
npm run deploy
```

#### 2. Restart Services
```bash
# Restart API server
az webapp restart \
  --name fleet-management-api \
  --resource-group fleet-management-rg

# Verify health
sleep 30
curl -s https://api.fleet-management.com/health
```

#### 3. Enable Fallback/Degraded Mode
```javascript
// Enable degraded mode in configuration
await redisClient.set('system:degraded_mode', 'true', 'EX', 3600);
```

### Permanent Fixes

#### 1. Database Query Optimization
```sql
-- Identify slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_vehicles_status ON vehicles(status);
```

#### 2. Memory Leak Fix
```javascript
// Add proper cleanup
class ResourceManager {
  cleanup() {
    this.connections.forEach(conn => conn.close());
    this.timers.forEach(timer => clearInterval(timer));
    this.connections = [];
    this.timers = [];
  }
}
```

#### 3. Circuit Breaker Implementation
```javascript
// Add circuit breaker for external calls
const circuitBreaker = new CircuitBreaker(externalApiCall, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});
```

## Monitoring & Validation

### Verify Resolution

```bash
# Check error rate has decreased
curl -s https://api.fleet-management.com/metrics | jq '.errorRate'

# Monitor for 15 minutes
watch -n 60 "curl -s https://api.fleet-management.com/health"
```

### Application Insights Query
```kusto
requests
| where timestamp > ago(30m)
| summarize
    total = count(),
    failed = countif(success == false),
    errorRate = 100.0 * countif(success == false) / count()
  by bin(timestamp, 5m)
| render timechart
```

### Expected Results
- Error rate < 0.5%
- No user reports of issues
- All health checks passing
- Response times within SLA

## Communication

### Internal (Slack/Teams)
```
🔴 HIGH ERROR RATE ALERT
Status: [Investigating/Identified/Resolved]
Impact: [Description]
Affected: [Users/Endpoints]
ETA: [Estimated resolution time]
```

### User-Facing (Status Page)
```
⚠️ We're experiencing elevated error rates on some API endpoints.
Our team is investigating and working on a resolution.
Last updated: [timestamp]
```

### Post-Incident
```
✅ Issue Resolved
Root Cause: [Description]
Resolution: [Actions taken]
Prevention: [Steps to prevent recurrence]
```

## Post-Incident Actions

### 1. Create Post-Mortem (within 24 hours)
- [ ] Document timeline of events
- [ ] Identify root cause
- [ ] List contributing factors
- [ ] Document resolution steps
- [ ] Identify preventive measures

### 2. Implement Preventive Measures
- [ ] Add monitoring for specific error pattern
- [ ] Improve alerting thresholds
- [ ] Add automated remediation
- [ ] Update runbooks
- [ ] Conduct team training

### 3. Update Documentation
- [ ] Update this playbook with lessons learned
- [ ] Add new monitoring queries
- [ ] Document new tools or procedures
- [ ] Share knowledge with team

## Escalation

### Level 1: On-Call Engineer (0-30 minutes)
- Initial investigation
- Quick fixes and restarts
- Basic troubleshooting

### Level 2: Senior Engineer (30-60 minutes)
- Deep system analysis
- Database optimization
- Architecture decisions

### Level 3: Engineering Manager (> 60 minutes)
- User communication
- Resource allocation
- Executive updates

## Contact Information

- **On-Call Engineer:** Slack: #on-call-engineering
- **Engineering Manager:** andrew.m@capitaltechalliance.com
- **DevOps Team:** Slack: #devops
- **Security Team:** Slack: #security (for security-related errors)

## Related Playbooks

- [Performance Degradation](./performance-degradation.md)
- [Service Outage](./service-outage.md)
- [Database Issues](./database-issues.md)
- [Security Incident](./security-incident.md)

## Tools & Links

- **Sentry Dashboard:** https://sentry.io/organizations/fleet-management/
- **Application Insights:** https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/
- **PostHog Analytics:** https://app.posthog.com/
- **Azure Portal:** https://portal.azure.com/
- **Status Page:** https://status.fleet-management.com/
- **Runbook Repository:** /docs/playbooks/

---

**Last Updated:** 2025-12-31
**Version:** 1.0
**Owner:** Platform Engineering Team
