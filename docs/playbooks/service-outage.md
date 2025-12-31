# Service Outage Playbook

## Alert Definition

**Trigger:** Service availability < 99% or complete service unavailability
**Severity:** Critical (P1)
**SLA Response Time:** Immediate (< 5 minutes)

## Symptoms

- HTTP 5xx errors for all requests
- Service completely unreachable
- Health check failures
- Azure/monitoring alerts showing service down
- Multiple user reports of inability to access application

## Immediate Response (0-5 minutes)

### 1. Acknowledge Alert

```bash
# Acknowledge in PagerDuty/monitoring system
# Post in incident channel
```

**Slack Message Template:**
```
🚨 CRITICAL: SERVICE OUTAGE
Time: [timestamp]
Services Affected: [API/Web/Both]
Responder: [Your Name]
Status: Investigating
```

### 2. Quick Status Check

```bash
# Check if services are accessible
curl -I https://api.fleet-management.com/health
curl -I https://fleet-management.com

# Check Azure status
az webapp show \
  --name fleet-management-api \
  --resource-group fleet-management-rg \
  --query state

# Check if it's DNS issue
nslookup fleet-management.com
dig fleet-management.com
```

### 3. Check Azure Service Health

```bash
# Check Azure status page
open "https://status.azure.com"

# Check service health in portal
az servicehealth event list --query "[?properties.impactedServices[?ImpactedRegion=='East US 2']]"
```

## Investigation (5-15 minutes)

### 1. Service Status Verification

#### Check Application Logs
```bash
# Stream recent logs
az webapp log tail \
  --name fleet-management-api \
  --resource-group fleet-management-rg

# Download logs
az webapp log download \
  --name fleet-management-api \
  --resource-group fleet-management-rg \
  --log-file app-logs.zip
```

#### Check Application Insights
```kusto
traces
| where timestamp > ago(30m)
| where severityLevel >= 3  // Warning or higher
| order by timestamp desc
| take 100
```

### 2. Common Outage Causes

| Cause | Quick Check | Immediate Action |
|-------|------------|------------------|
| **App Crash** | Check logs for exceptions | Restart app service |
| **Deployment Failure** | Check recent deployments | Rollback to last known good |
| **Configuration Error** | Check recent config changes | Revert configuration |
| **Database Down** | Check DB connectivity | Restart database, check credentials |
| **SSL Certificate** | Check cert expiration | Renew certificate |
| **DDoS Attack** | Check request rate | Enable DDoS protection, block IPs |
| **Resource Exhaustion** | Check CPU/memory | Scale up/out |
| **Azure Outage** | Check Azure status | Wait or failover to backup region |

### 3. Deployment History Check

```bash
# Check recent deployments
az webapp deployment list \
  --name fleet-management-api \
  --resource-group fleet-management-rg \
  --output table

# Check Git deployment history
cd /Users/andrewmorton/Documents/GitHub/fleet-local
git log --oneline -10
git log --all --since="1 hour ago" --oneline
```

## Resolution Steps

### Option 1: Restart Services

```bash
# Restart API service
az webapp restart \
  --name fleet-management-api \
  --resource-group fleet-management-rg

# Restart web service
az webapp restart \
  --name fleet-management-web \
  --resource-group fleet-management-rg

# Wait and verify
sleep 60
curl https://api.fleet-management.com/health
```

### Option 2: Rollback Deployment

```bash
# Identify last successful deployment
LAST_GOOD_COMMIT=$(git log --grep="deployed successfully" -1 --format="%H")

# Rollback code
git checkout $LAST_GOOD_COMMIT

# Rebuild and deploy
npm run build
npm run deploy

# Or use Azure deployment slots
az webapp deployment slot swap \
  --name fleet-management-api \
  --resource-group fleet-management-rg \
  --slot staging
```

### Option 3: Fix Configuration Error

```bash
# Revert environment variables
az webapp config appsettings set \
  --name fleet-management-api \
  --resource-group fleet-management-rg \
  --settings @previous-config.json

# Or fix specific setting
az webapp config appsettings set \
  --name fleet-management-api \
  --resource-group fleet-management-rg \
  --settings DATABASE_URL="postgresql://..."
```

### Option 4: Database Recovery

```bash
# Check database status
az postgres server show \
  --resource-group fleet-management-rg \
  --name fleet-db-server \
  --query userVisibleState

# Restart database if needed
az postgres server restart \
  --resource-group fleet-management-rg \
  --name fleet-db-server

# Check connectivity
psql $DATABASE_URL -c "SELECT 1;"
```

### Option 5: Scale Resources

```bash
# Emergency scale-up
az appservice plan update \
  --name fleet-management-plan \
  --resource-group fleet-management-rg \
  --sku P3V2 \
  --number-of-workers 5
```

### Option 6: Enable Maintenance Mode

```javascript
// If service needs extended downtime
// Create maintenance.html page
az webapp config set \
  --name fleet-management-api \
  --resource-group fleet-management-rg \
  --startup-file "maintenance.html"
```

## Verification (Post-Fix)

### 1. Health Check Validation

```bash
# Basic health check
curl -f https://api.fleet-management.com/health || echo "Health check failed"

# Detailed health check
curl -s https://api.fleet-management.com/health | jq '.'

# Test key endpoints
curl -s https://api.fleet-management.com/api/vehicles?limit=1
curl -s https://api.fleet-management.com/api/drivers?limit=1
```

### 2. Synthetic Transaction Test

```bash
# Run automated test suite
npm run test:e2e:production

# Or manual verification
# 1. Login
# 2. View vehicles
# 3. Create/update record
# 4. Generate report
```

### 3. Monitor for Stability

```bash
# Watch for errors (10 minutes)
watch -n 30 "curl -s https://api.fleet-management.com/metrics | jq '{errorRate, uptime}'"
```

### 4. Check Monitoring Dashboards

- **Sentry:** Verify no new errors
- **Application Insights:** Check request success rate
- **PostHog:** Verify user activity resumed
- **Azure Portal:** Check all resources healthy

## Communication

### During Outage

#### Internal (Slack #incidents)
```
🚨 SERVICE OUTAGE - INVESTIGATING
Time Started: [timestamp]
Services Down: API, Web
Impact: All users unable to access application
Estimated Users Affected: ~500
Responder: [Name]
Next Update: 10 minutes
```

#### Status Page
```
🔴 Major Outage
We are currently experiencing a service outage.
All services are unavailable.
Our team is actively working on resolution.
Updates will be posted every 10 minutes.

Last Updated: [timestamp]
```

#### Customer Support Email
```
Subject: Service Outage Notification

We are currently experiencing a service outage affecting all users.
Our engineering team has been notified and is working to resolve the issue.

We will provide updates every 10 minutes at: https://status.fleet-management.com

We apologize for the inconvenience.
```

### After Resolution

#### Internal
```
✅ SERVICE RESTORED
Downtime: 23 minutes
Root Cause: Database connection pool exhausted
Resolution: Restarted application, increased connection pool
Post-Mortem: Will be completed within 24 hours
```

#### Status Page
```
✅ All Systems Operational
The service outage has been resolved.
All systems are now operating normally.

Downtime: 23 minutes (14:37 - 15:00 EST)
Root Cause: Database connection pool exhaustion

Post-mortem will be published within 24 hours.
We apologize for the disruption.
```

## Post-Incident

### 1. Timeline Documentation (Immediately)

```markdown
## Incident Timeline

**14:37:** Alert triggered - service unavailable
**14:38:** On-call engineer acknowledged, began investigation
**14:42:** Identified database connection pool exhaustion
**14:45:** Attempted restart of application
**14:50:** Restart completed but issue persisted
**14:52:** Increased connection pool size
**14:55:** Restarted application with new configuration
**14:57:** Service restored, monitoring for stability
**15:00:** Confirmed stable, incident resolved
```

### 2. Post-Mortem (Within 24 hours)

Create post-mortem document:

```markdown
# Post-Mortem: Service Outage - 2025-12-31

## Summary
Database connection pool exhaustion caused complete service outage for 23 minutes.

## Impact
- Duration: 23 minutes
- Users affected: ~500
- Revenue impact: ~$2,000
- Services down: API, Web application

## Root Cause
Connection pool configuration (max: 20) insufficient for current load.
High traffic spike + slow queries led to connection exhaustion.

## Contributing Factors
1. Connection pool size not scaled with user growth
2. No alerting on connection pool usage
3. Slow queries consuming connections longer than expected

## Resolution
1. Increased connection pool from 20 to 40
2. Added connection pool monitoring
3. Optimized slow queries

## Prevention
1. [ ] Implement connection pool monitoring with alerts
2. [ ] Set up auto-scaling for connection pool
3. [ ] Regular query performance review
4. [ ] Load testing before major feature releases
5. [ ] Database connection health checks

## Action Items
- [ ] Add connection pool metrics to dashboard (Owner: DevOps, Due: 2026-01-03)
- [ ] Implement query performance monitoring (Owner: Backend, Due: 2026-01-07)
- [ ] Schedule monthly capacity planning review (Owner: Eng Manager, Due: Ongoing)
```

### 3. Follow-up Actions

- [ ] Update monitoring thresholds
- [ ] Improve alerting
- [ ] Add automated remediation
- [ ] Update runbooks
- [ ] Team training/knowledge share

## Escalation Path

### Level 1: On-Call Engineer (0-5 minutes)
- Acknowledge alert
- Initial investigation
- Attempt quick fixes (restart, rollback)

### Level 2: Engineering Lead (5-15 minutes)
- If Level 1 unable to resolve
- Complex infrastructure issues
- Require architectural decisions

### Level 3: Engineering Manager (15-30 minutes)
- Prolonged outage
- Customer communication
- Resource allocation

### Level 4: CTO/Executive (> 30 minutes)
- Extended outage
- Major business impact
- External communication required

## Emergency Contacts

- **On-Call Engineer:** Slack: #on-call-engineering, PagerDuty
- **Engineering Lead:** andrew.m@capitaltechalliance.com
- **DevOps Team:** Slack: #devops
- **Customer Support:** Slack: #customer-support
- **Executive On-Call:** [Executive contact]

## Related Resources

- [High Error Rate Playbook](./high-error-rate.md)
- [Performance Degradation Playbook](./performance-degradation.md)
- [Database Issues Playbook](./database-issues.md)
- [Incident Response Process](../processes/incident-response.md)
- [Post-Mortem Template](../templates/post-mortem.md)

## Tools & Dashboards

- **Azure Portal:** https://portal.azure.com
- **Application Insights:** https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/
- **Sentry:** https://sentry.io/organizations/fleet-management/
- **Status Page:** https://status.fleet-management.com/
- **PagerDuty:** https://fleetmanagement.pagerduty.com/

---

**Last Updated:** 2025-12-31
**Version:** 1.0
**Owner:** Platform Engineering Team
**Review Frequency:** After each incident, minimum quarterly
