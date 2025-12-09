# Fleet Management System - Operations Runbook

## Table of Contents
1. [Overview](#overview)
2. [Monitoring & Observability](#monitoring--observability)
3. [Health Checks](#health-checks)
4. [Alerting & Escalation](#alerting--escalation)
5. [Incident Response](#incident-response)
6. [Common Issues & Resolutions](#common-issues--resolutions)
7. [Deployment Procedures](#deployment-procedures)
8. [Rollback Procedures](#rollback-procedures)
9. [Database Operations](#database-operations)
10. [SLOs & SLIs](#slos--slis)

---

## Overview

### System Architecture
- **Frontend**: React SPA hosted on Azure Static Web Apps
- **Backend API**: Node.js/Express on Azure App Service
- **Database**: PostgreSQL on Azure Database for PostgreSQL
- **Cache**: Redis on Azure Cache for Redis
- **Monitoring**: Application Insights + Sentry

### Key Contacts
| Role | Name | Email | Phone | Escalation Level |
|------|------|-------|-------|------------------|
| On-Call Engineer | Rotating | ops@capitaltechalliance.com | - | L1 |
| Team Lead | Andrew Morton | andrew.m@capitaltechalliance.com | - | L2 |
| Platform Owner | CTA Leadership | - | - | L3 |

### On-Call Rotation
- **Schedule**: Weekly rotation (Monday 9 AM - Monday 9 AM EST)
- **Response Time**:
  - Critical (P0): 15 minutes
  - High (P1): 1 hour
  - Medium (P2): 4 hours
  - Low (P3): Next business day

---

## Monitoring & Observability

### Dashboard URLs

#### Application Insights
```
https://portal.azure.com/#@{tenantId}/resource/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Insights/components/{appInsightsName}/overview
```

**Key Dashboards:**
- Application Map: Shows dependencies and health
- Live Metrics: Real-time telemetry
- Failures: Error analysis and trends
- Performance: Response times and bottlenecks
- Users: User behavior and sessions

#### Sentry
```
https://sentry.io/organizations/capitaltechalliance/projects/fleet-management/
```

**Key Views:**
- Issues: Active errors with stack traces
- Releases: Error tracking per deployment
- Performance: Transaction monitoring
- Replays: Session recordings for errors

#### Log Analytics Queries

**Recent Errors (Last Hour)**
```kusto
traces
| where timestamp > ago(1h)
| where severityLevel >= 3
| summarize count() by message, severityLevel
| order by count_ desc
```

**API Performance (p95, p99)**
```kusto
requests
| where timestamp > ago(1h)
| summarize
    p95=percentile(duration, 95),
    p99=percentile(duration, 99),
    avg=avg(duration),
    count=count()
    by name
| order by p95 desc
```

**Failed Dependencies**
```kusto
dependencies
| where timestamp > ago(1h)
| where success == false
| summarize count() by target, resultCode
| order by count_ desc
```

**User Activity**
```kusto
pageViews
| where timestamp > ago(24h)
| summarize users=dcount(user_Id), sessions=dcount(session_Id), views=count()
| extend avgViewsPerUser = views / users
```

---

## Health Checks

### Endpoints

| Endpoint | Purpose | Expected Response | Timeout |
|----------|---------|-------------------|---------|
| `/health` | Detailed health | 200 OK with JSON | 5s |
| `/health/liveness` | Kubernetes liveness | 200 OK | 1s |
| `/health/readiness` | Kubernetes readiness | 200 OK | 3s |
| `/health/startup` | Kubernetes startup | 200 OK | 10s |
| `/health/metrics` | Prometheus metrics | 200 OK | 2s |

### Health Check Response Example

**Healthy System:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-09T19:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connection healthy",
      "latency": 15,
      "details": {
        "totalConnections": 10,
        "idleConnections": 8,
        "waitingConnections": 0
      }
    },
    "redis": {
      "status": "ok",
      "message": "Redis connection healthy",
      "latency": 5
    },
    "memory": {
      "status": "ok",
      "message": "Memory usage: 45.2%",
      "details": {
        "heapUsed": 452,
        "heapTotal": 1000,
        "rss": 600,
        "external": 50
      }
    }
  }
}
```

**Degraded System:**
```json
{
  "status": "degraded",
  "timestamp": "2025-12-09T19:00:00.000Z",
  "checks": {
    "database": {
      "status": "degraded",
      "message": "Database responding slowly",
      "latency": 1200
    }
  }
}
```

### Manual Health Check

```bash
# Production
curl -s https://fleet-api.capitaltechalliance.com/health | jq

# Check specific probe
curl -s https://fleet-api.capitaltechalliance.com/health/readiness | jq

# Check metrics
curl -s https://fleet-api.capitaltechalliance.com/health/metrics
```

---

## Alerting & Escalation

### Alert Rules

| Alert Name | Threshold | Window | Severity | Action |
|------------|-----------|--------|----------|--------|
| High Error Rate | >1% errors | 5 min | Warning | Email + Slack |
| High Response Time | p95 >1s | 5 min | Warning | Email + Slack |
| Application Down | 0 requests | 2 min | Critical | Email + SMS + PagerDuty |
| High Memory | >85% | 10 min | Warning | Email |
| Database Failures | >5 failures | 5 min | Error | Email + Slack |
| Failed Requests | >10 failures | 5 min | Warning | Email |

### Alert Response Procedures

#### P0 - Critical (Application Down)
1. **Acknowledge** alert within 15 minutes
2. **Check** health endpoint and Azure Portal status
3. **Verify** if planned maintenance or known issue
4. **Investigate** Application Insights for errors
5. **Execute** rollback if recent deployment
6. **Escalate** to L2 if not resolved in 30 minutes
7. **Document** incident in post-mortem template

#### P1 - High (Performance Degradation)
1. **Acknowledge** alert within 1 hour
2. **Check** Application Insights performance metrics
3. **Identify** bottleneck (database, API, external service)
4. **Scale** resources if needed (horizontal/vertical)
5. **Optimize** if specific query/endpoint identified
6. **Monitor** for resolution
7. **Document** root cause

#### P2 - Medium (Elevated Errors)
1. **Acknowledge** alert within 4 hours
2. **Review** Sentry for error patterns
3. **Triage** based on user impact
4. **Create** issue in backlog if needed
5. **Apply** hotfix if critical business impact

### Escalation Path

```
L1 (On-Call Engineer)
  ↓ (30 minutes for P0, 2 hours for P1)
L2 (Team Lead)
  ↓ (1 hour for P0, 4 hours for P1)
L3 (Platform Owner)
```

---

## Incident Response

### Incident Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| P0 | Complete outage | 15 min | API down, database unreachable |
| P1 | Partial outage | 1 hour | Major feature broken, severe performance |
| P2 | Degraded service | 4 hours | Minor feature broken, slow response |
| P3 | Minor issue | Next day | UI glitch, non-critical bug |

### Incident Response Checklist

#### Step 1: Detect & Acknowledge
- [ ] Alert received via email/SMS/Slack
- [ ] Acknowledged in monitoring system
- [ ] Incident created in tracking system
- [ ] Initial assessment completed

#### Step 2: Investigate
- [ ] Check Application Insights dashboard
- [ ] Review recent deployments (last 24h)
- [ ] Check health endpoints
- [ ] Review error logs in Sentry
- [ ] Check Azure service health
- [ ] Query Log Analytics for patterns

#### Step 3: Communicate
- [ ] Post in #incidents Slack channel
- [ ] Update status page if customer-facing
- [ ] Notify stakeholders if P0/P1
- [ ] Provide ETA if known

#### Step 4: Mitigate
- [ ] Execute rollback if recent deployment
- [ ] Scale resources if capacity issue
- [ ] Apply hotfix if code issue identified
- [ ] Restart services if transient issue
- [ ] Enable feature flag if feature-specific

#### Step 5: Resolve
- [ ] Confirm service restored
- [ ] Monitor for 15+ minutes
- [ ] Update stakeholders
- [ ] Close incident ticket
- [ ] Schedule post-mortem if P0/P1

#### Step 6: Post-Mortem (P0/P1 only)
- [ ] Schedule meeting within 48 hours
- [ ] Document timeline of events
- [ ] Identify root cause
- [ ] List action items
- [ ] Assign owners and due dates
- [ ] Share with team and stakeholders

---

## Common Issues & Resolutions

### Issue: High Response Times

**Symptoms:**
- Alert: "fleet-high-response-time"
- p95 latency >1 second
- User complaints about slowness

**Investigation:**
```bash
# Check Application Insights performance
# Look for slow dependencies (database, external APIs)

# Query slow requests
az monitor app-insights query \
  --app {appInsightsName} \
  --analytics-query "requests | where duration > 1000 | top 10 by duration desc"
```

**Common Causes:**
1. **Database queries** - Check query performance
2. **External API calls** - Check dependency latency
3. **Memory pressure** - Check memory usage
4. **CPU throttling** - Check App Service metrics

**Resolution:**
```bash
# Scale up App Service
az appservice plan update \
  --name {planName} \
  --resource-group {resourceGroup} \
  --sku P2V2

# Or scale out (add instances)
az appservice plan update \
  --name {planName} \
  --resource-group {resourceGroup} \
  --number-of-workers 3
```

---

### Issue: Database Connection Pool Exhausted

**Symptoms:**
- Error: "Connection pool exhausted"
- Health check shows high waiting connections
- Database status: degraded

**Investigation:**
```bash
# Check health endpoint
curl https://fleet-api.capitaltechalliance.com/health | jq '.checks.database'
```

**Resolution:**
```typescript
// Increase pool size in server configuration
const pool = new Pool({
  max: 30, // Increase from 20
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
})
```

Or identify and fix connection leaks:
```kusto
// Query for long-running database queries
dependencies
| where type == "SQL"
| where duration > 5000
| summarize count() by name
| order by count_ desc
```

---

### Issue: Redis Connection Failures

**Symptoms:**
- Health check: redis status "down"
- Errors: "Redis connection refused"

**Investigation:**
```bash
# Check Redis status
az redis show \
  --name {redisName} \
  --resource-group {resourceGroup} \
  --query provisioningState

# Check firewall rules
az redis firewall-rules list \
  --name {redisName} \
  --resource-group {resourceGroup}
```

**Resolution:**
1. Verify Redis is running
2. Check firewall rules allow App Service IPs
3. Restart Redis if needed
4. Check connection string is correct

---

### Issue: Memory Leak

**Symptoms:**
- Alert: "fleet-high-memory"
- Memory usage climbing over time
- Application restarts frequently

**Investigation:**
```kusto
// Query memory trends
performanceCounters
| where name == "% Process\\Private Bytes"
| summarize avg(value) by bin(timestamp, 1h)
| render timechart
```

**Resolution:**
```bash
# Take heap snapshot (in dev/staging first)
node --inspect server.js
# Connect Chrome DevTools
# Memory > Take Heap Snapshot

# Temporary: Restart application
az webapp restart \
  --name {appName} \
  --resource-group {resourceGroup}

# Long-term: Fix memory leak in code
```

---

## Deployment Procedures

### Pre-Deployment Checklist
- [ ] Code reviewed and approved
- [ ] Tests passing (unit, integration, E2E)
- [ ] Staging deployment successful
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Deployment window scheduled

### Deployment Steps

```bash
# 1. Create deployment tag
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin v1.2.3

# 2. Build and push Docker image
docker build -t fleet-api:1.2.3 .
docker tag fleet-api:1.2.3 {registry}.azurecr.io/fleet-api:1.2.3
docker push {registry}.azurecr.io/fleet-api:1.2.3

# 3. Update Kubernetes deployment
kubectl set image deployment/fleet-api \
  fleet-api={registry}.azurecr.io/fleet-api:1.2.3

# 4. Monitor rollout
kubectl rollout status deployment/fleet-api

# 5. Verify health
curl https://fleet-api.capitaltechalliance.com/health

# 6. Monitor Application Insights for errors
# Check for 10 minutes post-deployment
```

### Post-Deployment Checklist
- [ ] Health checks passing
- [ ] No new errors in Sentry
- [ ] Response times normal
- [ ] Smoke tests passed
- [ ] User acceptance confirmed
- [ ] Deployment documented
- [ ] Monitoring continued for 24h

---

## Rollback Procedures

### When to Rollback
- Error rate >5% for >5 minutes
- Critical feature broken
- Database corruption detected
- Security vulnerability introduced

### Rollback Steps

```bash
# 1. Identify previous working version
kubectl rollout history deployment/fleet-api

# 2. Rollback to previous version
kubectl rollout undo deployment/fleet-api

# Or rollback to specific revision
kubectl rollout undo deployment/fleet-api --to-revision=2

# 3. Monitor rollback
kubectl rollout status deployment/fleet-api

# 4. Verify health
curl https://fleet-api.capitaltechalliance.com/health

# 5. Communicate rollback to team
```

### Database Rollback

```bash
# If database migrations were applied
# Run down migrations (if reversible)
npm run migrate:down

# Or restore from backup (if not reversible)
az postgres flexible-server restore \
  --resource-group {resourceGroup} \
  --name {serverName}-restore \
  --source-server {serverName} \
  --restore-point-in-time "2025-12-09T18:00:00Z"
```

---

## Database Operations

### Backup Procedures

**Automated Backups:**
- Azure PostgreSQL: Daily automated backups (retained 7-35 days)
- Point-in-time restore available

**Manual Backup:**
```bash
# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to Azure Blob Storage
az storage blob upload \
  --account-name {storageAccount} \
  --container-name backups \
  --file backup_*.sql \
  --name backup_$(date +%Y%m%d_%H%M%S).sql
```

### Migration Procedures

```bash
# 1. Test migration in staging
npm run migrate:up -- --env=staging

# 2. Take backup before production migration
pg_dump $DATABASE_URL > pre_migration_backup.sql

# 3. Apply migration in production (during maintenance window)
npm run migrate:up -- --env=production

# 4. Verify migration
npm run migrate:status -- --env=production

# 5. Monitor application after migration
```

---

## SLOs & SLIs

### Service Level Objectives

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Availability** | 99.9% | Uptime (43.8 min downtime/month max) |
| **Latency (p95)** | <500ms | API response time |
| **Latency (p99)** | <1000ms | API response time |
| **Error Rate** | <1% | Failed requests / total requests |
| **Database Latency** | <100ms | Query response time (p95) |

### Service Level Indicators (SLIs)

#### Availability SLI
```kusto
requests
| where timestamp > ago(30d)
| summarize
    total = count(),
    successful = countif(success == true)
| extend availability = (successful * 100.0) / total
| project availability
```

#### Latency SLI
```kusto
requests
| where timestamp > ago(1h)
| summarize
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99)
| project p95, p99
```

#### Error Rate SLI
```kusto
requests
| where timestamp > ago(1h)
| summarize
    total = count(),
    errors = countif(success == false)
| extend error_rate = (errors * 100.0) / total
| project error_rate
```

### Error Budget

**Monthly Error Budget:**
- 99.9% availability = 43.8 minutes of downtime allowed
- 1% error rate = 1,000 errors per 100,000 requests

**Error Budget Dashboard:**
```kusto
requests
| where timestamp > startofmonth(now())
| summarize
    total_minutes = count() / 60,  // Approximate
    down_minutes = countif(success == false) / 60
| extend
    budget_minutes = 43.8,
    remaining_budget = 43.8 - down_minutes,
    budget_used_percent = (down_minutes / 43.8) * 100
| project remaining_budget, budget_used_percent
```

---

## Maintenance Windows

### Scheduled Maintenance
- **Day**: Sunday
- **Time**: 2:00 AM - 4:00 AM EST
- **Frequency**: Monthly (first Sunday)
- **Notification**: 7 days advance notice

### Emergency Maintenance
- **Approval**: Team Lead or Platform Owner
- **Notification**: Minimum 1 hour notice
- **Communication**: Email + Slack + Status page

---

## Contact Information

### Internal Teams
- **Engineering**: engineering@capitaltechalliance.com
- **Operations**: ops@capitaltechalliance.com
- **Support**: support@capitaltechalliance.com

### External Vendors
- **Azure Support**: Portal support ticket
- **Sentry**: support@sentry.io
- **GitHub**: support@github.com

---

## Appendix

### Useful Commands

```bash
# Check Kubernetes pod status
kubectl get pods -l app=fleet-api

# View pod logs
kubectl logs -f deployment/fleet-api --tail=100

# Execute command in pod
kubectl exec -it deployment/fleet-api -- /bin/sh

# Port forward for local debugging
kubectl port-forward deployment/fleet-api 3001:3001

# Check resource usage
kubectl top pods -l app=fleet-api

# Describe pod for events
kubectl describe pod <pod-name>
```

### Log Search Patterns

```kusto
-- Find authentication errors
traces
| where message contains "authentication" and severityLevel >= 3
| take 50

-- Find slow database queries
dependencies
| where type == "SQL" and duration > 1000
| project timestamp, name, duration, success
| order by duration desc
| take 20

-- Find user-reported errors
customEvents
| where name == "UserReportedError"
| summarize count() by message
| order by count_ desc
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-09
**Owner**: Operations Team
**Review Frequency**: Quarterly
