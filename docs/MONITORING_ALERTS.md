# Fleet Management System - Monitoring & Alerts

## Overview

The Fleet Management System has comprehensive production monitoring configured through Azure Application Insights with automated alerting, performance dashboards, and operational procedures.

## Table of Contents

- [Alert Rules](#alert-rules)
- [Application Insights Dashboards](#application-insights-dashboards)
- [KQL Queries](#kql-queries)
- [Alert Response Procedures](#alert-response-procedures)
- [Dashboard Access](#dashboard-access)
- [Troubleshooting](#troubleshooting)

---

## Alert Rules

### Action Group Configuration

**Name**: `fleet-critical-alerts`
**Email**: admin@capitaltechalliance.com
**Resource ID**: `/subscriptions/021415C2-2F52-4A73-AE77-F8363165A5E1/resourceGroups/fleet-production-rg/providers/microsoft.insights/actionGroups/fleet-critical-alerts`

### Configured Alerts (5 Total)

#### 1. High Error Rate (Critical - Severity 1)

**Description**: Triggers when API error rate exceeds 5% over 5 minutes

**Query**:
```kusto
requests
| where timestamp > ago(5m)
| summarize Total = count(), Failed = countif(success == false)
| extend Perc = (Failed * 100.0) / Total
| where Perc > 5
| project Perc
```

**Configuration**:
- Evaluation Frequency: 5 minutes
- Window Size: 5 minutes
- Severity: 1 (Error)
- Threshold: > 5%

**Response Procedure**:
1. Check Application Insights for error details
2. Review recent deployments (last 24 hours)
3. Verify database connectivity
4. Check external service dependencies
5. Review pod logs: `kubectl logs deployment/fleet-api -n fleet-management`
6. If persistent, rollback to previous deployment

#### 2. Slow Response Time (Warning - Severity 2)

**Description**: Triggers when P95 API latency exceeds 2 seconds

**Query**:
```kusto
requests
| where timestamp > ago(5m)
| summarize p95 = percentile(duration, 95)
| where p95 > 2000
| project p95
```

**Configuration**:
- Evaluation Frequency: 5 minutes
- Window Size: 5 minutes
- Severity: 2 (Warning)
- Threshold: > 2000ms

**Response Procedure**:
1. Identify slow endpoints in Application Insights Performance view
2. Check database query performance
3. Review AKS node resource utilization
4. Run load test to reproduce: `cd tests/load && ./run-load-tests.sh baseline`
5. Consider horizontal pod scaling
6. Review distributed traces for bottlenecks

#### 3. Database Connection Failures (Critical - Severity 0)

**Description**: Triggers when database connection failures exceed 5 in 5 minutes

**Query**:
```kusto
dependencies
| where type == 'SQL'
| where success == false
| where timestamp > ago(5m)
| summarize FailedConnections = count()
| where FailedConnections > 5
| project FailedConnections
```

**Configuration**:
- Evaluation Frequency: 5 minutes
- Window Size: 5 minutes
- Severity: 0 (Critical)
- Threshold: > 5 failures

**Response Procedure**:
1. **IMMEDIATE ACTION REQUIRED**
2. Check PostgreSQL pod status: `kubectl get pods -n fleet-management | grep postgres`
3. Verify database connectivity: `kubectl exec -n fleet-management deployment/fleet-api -- pg_isready`
4. Check connection pool settings in API configuration
5. Review database disk space: `kubectl exec -n fleet-management <postgres-pod> -- df -h`
6. Verify network policies allow API → Database traffic
7. Escalate to on-call DBA if database is down

#### 4. Authentication Failures (Warning - Severity 1)

**Description**: Triggers when failed login attempts exceed 10 in 5 minutes

**Query**:
```kusto
requests
| where name contains 'login'
| where resultCode == '401' or resultCode == '423'
| where timestamp > ago(5m)
| summarize FailedLogins = count()
| where FailedLogins > 10
| project FailedLogins
```

**Configuration**:
- Evaluation Frequency: 5 minutes
- Window Size: 5 minutes
- Severity: 1 (Error)
- Threshold: > 10 failures

**Response Procedure**:
1. Check for brute-force attack patterns
2. Review client IP addresses in Application Insights
3. Verify account lockout mechanism is working
4. Consider rate limiting adjustments
5. Alert security team if attack suspected
6. Review Azure Front Door WAF logs

#### 5. System Down / No Requests (Critical - Severity 0)

**Description**: Triggers when no requests received in 5 minutes

**Query**:
```kusto
requests
| where timestamp > ago(5m)
| summarize RequestCount = count()
| where RequestCount < 1
| project RequestCount
```

**Configuration**:
- Evaluation Frequency: 5 minutes
- Window Size: 5 minutes
- Severity: 0 (Critical)
- Threshold: < 1 request

**Response Procedure**:
1. **IMMEDIATE ACTION REQUIRED**
2. Check AKS cluster health: `az aks show -g fleet-production-rg -n fleet-aks-cluster --query 'powerState'`
3. Verify pod status: `kubectl get pods -n fleet-management`
4. Check ingress/load balancer: `kubectl get svc,ingress -n fleet-management`
5. Test external connectivity: `curl http://68.220.148.2`
6. Review Azure Service Health for regional outages
7. Escalate to infrastructure team immediately

---

## Application Insights Dashboards

### Dashboard 1: System Health

**Purpose**: Real-time system health monitoring

**Tiles**:

1. **Request Rate (Requests/Minute)**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(1h)
     | summarize RequestsPerMinute = count() by bin(timestamp, 1m)
     | render timechart
     ```
   - **Use**: Monitor traffic patterns and detect anomalies

2. **Response Time Percentiles (ms)**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(1h)
     | summarize p50 = percentile(duration, 50),
                 p95 = percentile(duration, 95),
                 p99 = percentile(duration, 99)
       by bin(timestamp, 5m)
     | render timechart
     ```
   - **Use**: Track latency trends and SLA compliance

3. **Error Rate (%)**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(1h)
     | summarize Total = count(), Failed = countif(success == false)
       by bin(timestamp, 5m)
     | extend ErrorRate = (Failed * 100.0) / Total
     | project timestamp, ErrorRate
     | render timechart
     ```
   - **Use**: Identify error spikes

4. **Database Query Performance (ms)**
   - **Query**:
     ```kusto
     dependencies
     | where type == 'SQL'
     | where timestamp > ago(1h)
     | summarize AvgDuration = avg(duration),
                 p95 = percentile(duration, 95)
       by bin(timestamp, 5m)
     | render timechart
     ```
   - **Use**: Monitor database performance

5. **System Health Status**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(5m)
     | summarize RequestCount = count()
     | project RequestCount, Status = iff(RequestCount > 0, 'Healthy', 'Down')
     ```
   - **Use**: At-a-glance health indicator

6. **Uptime % (24h)**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(24h)
     | summarize SuccessCount = countif(success == true), TotalCount = count()
     | extend Uptime = (SuccessCount * 100.0) / TotalCount
     | project Uptime
     ```
   - **Use**: SLA tracking

7. **Exceptions (Last Hour)**
   - **Query**:
     ```kusto
     exceptions
     | where timestamp > ago(1h)
     | summarize ExceptionCount = count()
     | project ExceptionCount
     ```
   - **Use**: Monitor unhandled exceptions

### Dashboard 2: Business Metrics

**Purpose**: Business intelligence and feature usage analytics

**Tiles**:

1. **Top 10 API Endpoints by Usage**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(24h)
     | extend endpoint = strcat(tostring(split(url, '?')[0]))
     | summarize Requests = count(), AvgDuration = avg(duration) by endpoint
     | top 10 by Requests desc
     | project endpoint, Requests, AvgDuration
     ```
   - **Use**: Understand feature adoption

2. **Active Users (24h)**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(24h)
     | where customDimensions.userId != ''
     | summarize UniqueUsers = dcount(tostring(customDimensions.userId))
     | project UniqueUsers
     ```
   - **Use**: Track daily active users

3. **Slowest API Endpoints**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(24h)
     | extend endpoint = strcat(tostring(split(url, '?')[0]))
     | summarize Requests = count(), AvgDuration = avg(duration) by endpoint
     | top 10 by AvgDuration desc
     | project endpoint, AvgDuration, Requests
     ```
   - **Use**: Identify optimization targets

4. **Error Breakdown by HTTP Status**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(24h)
     | where success == false
     | summarize ErrorCount = count() by resultCode
     | order by ErrorCount desc
     | project resultCode, ErrorCount
     ```
   - **Use**: Categorize errors for remediation

5. **Login Activity (7 days)**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(7d)
     | where name contains 'login'
     | summarize LoginAttempts = count() by bin(timestamp, 1h)
     | render timechart
     ```
   - **Use**: Monitor user engagement and security

6. **Feature Usage Distribution**
   - **Query**:
     ```kusto
     requests
     | where timestamp > ago(24h)
     | extend Module = case(
         url contains '/vehicles', 'Vehicles',
         url contains '/drivers', 'Drivers',
         url contains '/work-orders', 'Work Orders',
         url contains '/maintenance', 'Maintenance',
         url contains '/fuel', 'Fuel',
         url contains '/routes', 'Routes',
         url contains '/geofences', 'Geofences',
         url contains '/charging', 'EV Charging',
         url contains '/inspections', 'Inspections',
         url contains '/safety', 'Safety',
         'Other'
     )
     | summarize Requests = count() by Module
     | render piechart
     ```
   - **Use**: Feature usage analytics

7. **Slowest Database Queries**
   - **Query**:
     ```kusto
     dependencies
     | where type == 'SQL'
     | where timestamp > ago(24h)
     | extend Query = substring(data, 0, 100)
     | summarize Count = count(),
                 AvgDuration = avg(duration),
                 MaxDuration = max(duration) by Query
     | top 10 by AvgDuration desc
     | project Query, Count, AvgDuration, MaxDuration
     ```
   - **Use**: Database optimization

---

## KQL Queries

### Performance Analysis

#### Find Slow Requests
```kusto
requests
| where timestamp > ago(24h)
| where duration > 2000  // > 2 seconds
| project timestamp, name, url, duration, resultCode
| order by duration desc
| take 100
```

#### Request Duration by Endpoint
```kusto
requests
| where timestamp > ago(24h)
| extend endpoint = strcat(tostring(split(url, '?')[0]))
| summarize avg(duration), percentile(duration, 95), percentile(duration, 99) by endpoint
| order by percentile_duration_95 desc
```

#### Database Query Performance
```kusto
dependencies
| where type == 'SQL'
| where timestamp > ago(24h)
| summarize Count = count(),
            AvgDuration = avg(duration),
            P95 = percentile(duration, 95)
  by tostring(data)
| order by P95 desc
| take 20
```

### Error Analysis

#### Error Rate by Hour
```kusto
requests
| where timestamp > ago(7d)
| summarize Total = count(), Failed = countif(success == false)
  by bin(timestamp, 1h)
| extend ErrorRate = (Failed * 100.0) / Total
| render timechart
```

#### Failed Requests with Details
```kusto
requests
| where timestamp > ago(24h)
| where success == false
| project timestamp, name, url, resultCode, duration, customDimensions
| order by timestamp desc
```

#### Exception Details
```kusto
exceptions
| where timestamp > ago(24h)
| project timestamp, type, outerMessage, innermostMessage, problemId, details
| order by timestamp desc
```

### User Activity

#### Login Success vs Failure
```kusto
requests
| where name contains 'login'
| where timestamp > ago(7d)
| summarize Total = count(),
            Success = countif(resultCode == '200'),
            Failed = countif(resultCode == '401' or resultCode == '423')
  by bin(timestamp, 1h)
| render timechart
```

#### Active Users by Hour
```kusto
requests
| where timestamp > ago(24h)
| where customDimensions.userId != ''
| summarize Users = dcount(tostring(customDimensions.userId))
  by bin(timestamp, 1h)
| render timechart
```

---

## Alert Response Procedures

### Severity Levels

| Severity | Response Time | Escalation | Examples |
|----------|--------------|------------|----------|
| 0 - Critical | Immediate (5 min) | On-call + Team Lead | System down, DB failure |
| 1 - Error | 15 minutes | On-call engineer | High error rate, auth failures |
| 2 - Warning | 1 hour | Team notification | Slow performance, high resource usage |
| 3 - Info | Next business day | Log only | Config changes, scaling events |

### General Response Workflow

1. **Acknowledge Alert** (within response time)
   - Check alert details in email
   - Verify alert is still firing in Azure Portal

2. **Initial Assessment**
   - Access Application Insights: https://portal.azure.com → fleet-management-insights
   - Review recent changes: deployments, config updates
   - Check pod status: `kubectl get pods -n fleet-management`

3. **Gather Context**
   - Review distributed traces for affected requests
   - Check pod logs: `kubectl logs -n fleet-management <pod-name> --tail=100`
   - Review metrics in System Health dashboard

4. **Execute Mitigation**
   - Follow alert-specific response procedure (see above)
   - Document actions taken
   - Monitor for resolution

5. **Post-Resolution**
   - Verify alert auto-resolved
   - Update incident log
   - Schedule post-mortem if Severity 0 or 1

### Escalation Path

1. **Tier 1**: On-call engineer (email)
2. **Tier 2**: Team lead (email + SMS)
3. **Tier 3**: Engineering manager (phone call)
4. **Tier 4**: CTO (for extended outages > 1 hour)

---

## Dashboard Access

### Azure Portal

1. Navigate to: https://portal.azure.com
2. Sign in with Azure credentials
3. Search for "fleet-management-insights"
4. Click on the Application Insights resource

### Dashboards

**System Health Dashboard**:
```
Azure Portal → Dashboards → "Fleet Management - System Health"
```

**Business Metrics Dashboard**:
```
Azure Portal → Dashboards → "Fleet Management - Business Metrics"
```

### Direct Links

- **Application Insights**: https://portal.azure.com/#@/resource/subscriptions/021415c2-2f52-4a73-ae77-f8363165a5e1/resourceGroups/fleet-production-rg/providers/microsoft.insights/components/fleet-management-insights
- **Alert Rules**: https://portal.azure.com/#@/resource/subscriptions/021415c2-2f52-4a73-ae77-f8363165a5e1/resourceGroups/fleet-production-rg/providers/Microsoft.Insights/scheduledQueryRules
- **Action Group**: https://portal.azure.com/#@/resource/subscriptions/021415C2-2F52-4A73-AE77-F8363165A5E1/resourceGroups/fleet-production-rg/providers/microsoft.insights/actionGroups/fleet-critical-alerts

---

## Troubleshooting

### Alert Not Firing

**Issue**: Expected alert but notification not received

**Resolution**:
1. Check alert is enabled: `az monitor scheduled-query show --name <alert-name> -g fleet-production-rg --query enabled`
2. Verify action group email is correct
3. Check spam folder for alert emails
4. Test query manually in Application Insights Logs
5. Review alert evaluation history in Azure Portal

### Dashboard Not Showing Data

**Issue**: Dashboard tiles are empty

**Resolution**:
1. Verify time range is appropriate (last 24 hours default)
2. Check Application Insights is receiving data: `az monitor app-insights component show --app fleet-management-insights -g fleet-production-rg`
3. Verify API is instrumented and sending telemetry
4. Check connection string is configured: `kubectl get secret -n fleet-management fleet-api-secrets -o jsonpath='{.data.APPLICATIONINSIGHTS_CONNECTION_STRING}' | base64 -d`
5. Restart API pods: `kubectl rollout restart deployment/fleet-api -n fleet-management`

### No Telemetry Data

**Issue**: Application Insights shows no recent data

**Resolution**:
1. Verify API pods are running: `kubectl get pods -n fleet-management`
2. Check API logs for OpenTelemetry errors: `kubectl logs deployment/fleet-api -n fleet-management | grep -i otel`
3. Verify connection string is correct in secret
4. Test API endpoints manually to generate traffic
5. Check Azure Application Insights ingestion endpoint is reachable

### False Positive Alerts

**Issue**: Alerts firing incorrectly

**Resolution**:
1. Review query logic in Azure Portal
2. Adjust thresholds based on baseline performance
3. Increase evaluation window if needed
4. Consider adding filters to exclude test traffic
5. Update alert rules: `az deployment group create --template-file monitoring/alerts/alert-rules.json`

---

## Maintenance

### Weekly Tasks

- [ ] Review alert firing history
- [ ] Check for false positives
- [ ] Verify dashboard data accuracy
- [ ] Test alert notifications

### Monthly Tasks

- [ ] Review and update alert thresholds
- [ ] Analyze performance trends
- [ ] Update contact information
- [ ] Review escalation procedures

### Quarterly Tasks

- [ ] Conduct alert fire drill
- [ ] Review and update runbooks
- [ ] Validate disaster recovery procedures
- [ ] Performance baseline review

---

## Additional Resources

- [Azure Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [KQL Query Language Reference](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [Observability Guide](./OBSERVABILITY.md)
- [Load Testing Guide](../tests/load/README.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**Last Updated**: November 8, 2025
**Maintained By**: Fleet Management DevOps Team
