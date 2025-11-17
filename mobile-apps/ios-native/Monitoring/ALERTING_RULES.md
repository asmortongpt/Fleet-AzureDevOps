# Fleet Manager iOS - Alerting Rules

This document defines comprehensive alerting rules for the Fleet Manager iOS mobile application, including conditions, thresholds, severity levels, escalation paths, and runbook links.

## Table of Contents

1. [Critical Alerts (PagerDuty)](#critical-alerts-pagerduty)
2. [Warning Alerts (Slack)](#warning-alerts-slack)
3. [Info Alerts (Email)](#info-alerts-email)
4. [Alert Configuration](#alert-configuration)
5. [Escalation Policies](#escalation-policies)

---

## Critical Alerts (PagerDuty)

Critical alerts trigger immediate PagerDuty notifications to on-call engineers. These represent issues that significantly impact user experience or app availability.

### 1. High Crash Rate

**Condition:**
```
(crash_count / session_count) * 100 > 1%
```

**Threshold:** 1% crash rate over 5-minute window

**Severity:** Critical

**Escalation Path:**
1. Primary: On-call Mobile Engineer (immediate)
2. Secondary: Mobile Team Lead (after 15 minutes)
3. Tertiary: Engineering Manager (after 30 minutes)

**Runbook:** [High Crash Rate Runbook](#runbook-high-crash-rate)

**Alert Message:**
```
CRITICAL: iOS App Crash Rate Exceeded
Current Rate: {crash_rate}%
Threshold: 1%
Affected Versions: {app_versions}
Time Window: Last 5 minutes
Action Required: Investigate immediately
Runbook: https://wiki.fleet.com/runbooks/high-crash-rate
```

---

### 2. High API Error Rate

**Condition:**
```
(api_errors / api_requests) * 100 > 5%
```

**Threshold:** 5% API error rate over 5-minute window

**Severity:** Critical

**Escalation Path:**
1. Primary: On-call Backend Engineer (immediate)
2. Secondary: On-call Mobile Engineer (immediate)
3. Tertiary: Backend Team Lead (after 10 minutes)

**Runbook:** [High API Error Rate Runbook](#runbook-high-api-error-rate)

**Alert Message:**
```
CRITICAL: High API Error Rate Detected
Current Rate: {error_rate}%
Threshold: 5%
Affected Endpoints: {endpoints}
Error Types: {error_types}
Action Required: Check backend services and API gateway
Runbook: https://wiki.fleet.com/runbooks/high-api-error-rate
```

---

### 3. Authentication Failure Rate High

**Condition:**
```
(auth_failures / (auth_successes + auth_failures)) * 100 > 10%
```

**Threshold:** 10% authentication failure rate over 5-minute window

**Severity:** Critical

**Escalation Path:**
1. Primary: On-call Security Engineer (immediate)
2. Secondary: On-call Backend Engineer (immediate)
3. Tertiary: Security Team Lead (after 15 minutes)

**Runbook:** [Authentication Failure Runbook](#runbook-authentication-failure)

**Alert Message:**
```
CRITICAL: High Authentication Failure Rate
Current Rate: {failure_rate}%
Threshold: 10%
Failure Reasons: {failure_reasons}
Potential Security Issue: Yes
Action Required: Investigate authentication service and check for attacks
Runbook: https://wiki.fleet.com/runbooks/auth-failure
```

---

### 4. Complete Service Outage

**Condition:**
```
active_users < 5 AND time_of_day BETWEEN 6:00 AND 22:00
```

**Threshold:** Less than 5 active users during business hours

**Severity:** Critical

**Escalation Path:**
1. Primary: On-call Mobile Engineer (immediate)
2. Primary: On-call Backend Engineer (immediate)
3. Secondary: Engineering Director (after 5 minutes)

**Runbook:** [Service Outage Runbook](#runbook-service-outage)

**Alert Message:**
```
CRITICAL: Potential Complete Service Outage
Active Users: {active_users}
Expected: > 50 during business hours
Last Successful Request: {last_request_time}
Action Required: Check backend services, API gateway, and DNS
Runbook: https://wiki.fleet.com/runbooks/service-outage
```

---

### 5. Database Connection Failures

**Condition:**
```
database_connection_errors > 10 per minute
```

**Threshold:** 10 database connection errors per minute

**Severity:** Critical

**Escalation Path:**
1. Primary: On-call Mobile Engineer (immediate)
2. Secondary: Database Administrator (after 10 minutes)

**Runbook:** [Database Connection Failure Runbook](#runbook-database-connection-failure)

**Alert Message:**
```
CRITICAL: High Database Connection Error Rate
Errors/min: {error_rate}
Threshold: 10/min
Affected Operations: {operations}
Action Required: Check database configuration and connection pool
Runbook: https://wiki.fleet.com/runbooks/database-connection-failure
```

---

### 6. Severe Memory Leak

**Condition:**
```
memory_usage_p95 > 250 MB AND memory_growth_rate > 10 MB/min
```

**Threshold:** P95 memory > 250MB with growth rate > 10MB/min

**Severity:** Critical

**Escalation Path:**
1. Primary: On-call Mobile Engineer (immediate)
2. Secondary: Mobile Team Lead (after 20 minutes)

**Runbook:** [Severe Memory Leak Runbook](#runbook-severe-memory-leak)

**Alert Message:**
```
CRITICAL: Severe Memory Leak Detected
Current P95 Memory: {memory_usage} MB
Growth Rate: {growth_rate} MB/min
Affected Screens: {screens}
Action Required: Identify and fix memory leak, may need hotfix
Runbook: https://wiki.fleet.com/runbooks/severe-memory-leak
```

---

## Warning Alerts (Slack)

Warning alerts are sent to the #mobile-alerts Slack channel. These represent degraded performance or approaching thresholds.

### 7. API Response Time Degradation

**Condition:**
```
api_response_time_p95 > 500ms
```

**Threshold:** P95 API response time > 500ms for 10 minutes

**Severity:** Warning

**Escalation Path:**
1. Slack: #mobile-alerts channel
2. If persists > 30 min: On-call Mobile Engineer

**Runbook:** [Slow API Response Runbook](#runbook-slow-api-response)

**Alert Message:**
```
WARNING: API Response Times Degraded
Current P95: {response_time}ms
Threshold: 500ms
Affected Endpoints: {endpoints}
Recommendation: Monitor closely, investigate if persists
Runbook: https://wiki.fleet.com/runbooks/slow-api
```

---

### 8. High Memory Usage

**Condition:**
```
memory_usage_p95 > 150 MB
```

**Threshold:** P95 memory usage > 150MB for 15 minutes

**Severity:** Warning

**Escalation Path:**
1. Slack: #mobile-alerts channel
2. If persists > 1 hour: Mobile Team Lead

**Runbook:** [High Memory Usage Runbook](#runbook-high-memory-usage)

**Alert Message:**
```
WARNING: High Memory Usage Detected
Current P95: {memory_usage} MB
Threshold: 150 MB
Affected Screens: {screens}
Recommendation: Review memory optimization opportunities
Runbook: https://wiki.fleet.com/runbooks/high-memory
```

---

### 9. Offline Sync Queue Buildup

**Condition:**
```
sync_queue_depth > 100
```

**Threshold:** Sync queue > 100 items for 10 minutes

**Severity:** Warning

**Escalation Path:**
1. Slack: #mobile-alerts channel
2. If > 500 items: On-call Mobile Engineer

**Runbook:** [High Sync Queue Runbook](#runbook-high-sync-queue)

**Alert Message:**
```
WARNING: Offline Sync Queue Building Up
Current Depth: {queue_depth} items
Threshold: 100 items
Oldest Item Age: {oldest_item_age}
Recommendation: Check network connectivity and sync service
Runbook: https://wiki.fleet.com/runbooks/high-sync-queue
```

---

### 10. GPS Accuracy Degradation

**Condition:**
```
avg(gps_accuracy) > 30 meters
```

**Threshold:** Average GPS accuracy > 30 meters for 15 minutes

**Severity:** Warning

**Escalation Path:**
1. Slack: #mobile-alerts channel
2. If persists > 1 hour: Mobile Team Lead

**Runbook:** [GPS Accuracy Degradation Runbook](#runbook-gps-accuracy-degradation)

**Alert Message:**
```
WARNING: GPS Accuracy Degraded
Current Avg Accuracy: {accuracy} meters
Threshold: 30 meters
Affected Users: {user_count}
Recommendation: Investigate location service configuration
Runbook: https://wiki.fleet.com/runbooks/gps-accuracy
```

---

### 11. Low Battery Efficiency

**Condition:**
```
battery_drain_rate > 10% per hour
```

**Threshold:** Battery drain > 10%/hour for 30 minutes

**Severity:** Warning

**Escalation Path:**
1. Slack: #mobile-alerts channel
2. Create JIRA ticket for investigation

**Runbook:** [High Battery Drain Runbook](#runbook-high-battery-drain)

**Alert Message:**
```
WARNING: High Battery Drain Detected
Current Drain Rate: {drain_rate}%/hr
Threshold: 10%/hr
Likely Causes: Background location, OBD2 scanning
Recommendation: Review background service efficiency
Runbook: https://wiki.fleet.com/runbooks/battery-drain
```

---

### 12. OBD2 Connection Success Rate Low

**Condition:**
```
(obd2_connected / obd2_attempts) * 100 < 70%
```

**Threshold:** OBD2 connection success rate < 70% for 20 minutes

**Severity:** Warning

**Escalation Path:**
1. Slack: #mobile-alerts channel
2. If < 50%: On-call Mobile Engineer

**Runbook:** [OBD2 Connection Issues Runbook](#runbook-obd2-connection-issues)

**Alert Message:**
```
WARNING: Low OBD2 Connection Success Rate
Current Rate: {success_rate}%
Threshold: 70%
Device Types: {device_types}
Recommendation: Review OBD2 connection logic and device compatibility
Runbook: https://wiki.fleet.com/runbooks/obd2-connection
```

---

### 13. Elevated Error Rate (Non-Critical)

**Condition:**
```
error_rate > 2% AND < 5%
```

**Threshold:** Error rate between 2-5% for 15 minutes

**Severity:** Warning

**Escalation Path:**
1. Slack: #mobile-alerts channel
2. Create JIRA ticket for investigation

**Runbook:** [Elevated Error Rate Runbook](#runbook-elevated-error-rate)

**Alert Message:**
```
WARNING: Elevated Error Rate
Current Rate: {error_rate}%
Normal Range: < 2%
Critical Threshold: 5%
Error Types: {error_types}
Recommendation: Monitor and investigate if trending upward
Runbook: https://wiki.fleet.com/runbooks/elevated-errors
```

---

### 14. Slow App Launch Time

**Condition:**
```
app_launch_time_p95 > 3 seconds
```

**Threshold:** P95 app launch time > 3 seconds for 30 minutes

**Severity:** Warning

**Escalation Path:**
1. Slack: #mobile-alerts channel
2. Create JIRA ticket for performance optimization

**Runbook:** [Slow App Launch Runbook](#runbook-slow-app-launch)

**Alert Message:**
```
WARNING: Slow App Launch Times
Current P95: {launch_time}s
Target: < 2s
Threshold: 3s
Launch Type: {launch_type} (cold/warm)
Recommendation: Profile app startup and optimize initialization
Runbook: https://wiki.fleet.com/runbooks/slow-launch
```

---

### 15. Network Request Timeout Rate High

**Condition:**
```
(network_timeouts / network_requests) * 100 > 3%
```

**Threshold:** Network timeout rate > 3% for 10 minutes

**Severity:** Warning

**Escalation Path:**
1. Slack: #mobile-alerts channel
2. If > 10%: On-call Backend Engineer

**Runbook:** [Network Timeout Runbook](#runbook-network-timeout)

**Alert Message:**
```
WARNING: High Network Timeout Rate
Current Rate: {timeout_rate}%
Threshold: 3%
Affected Endpoints: {endpoints}
Recommendation: Check network conditions and backend response times
Runbook: https://wiki.fleet.com/runbooks/network-timeout
```

---

## Info Alerts (Email)

Info alerts are sent via email to the mobile team distribution list. These are informational and don't require immediate action.

### 16. New App Version Detected

**Condition:**
```
new_app_version_detected == true
```

**Threshold:** New version appears in production metrics

**Severity:** Info

**Escalation Path:**
1. Email: mobile-team@fleet-manager.com

**Runbook:** N/A

**Alert Message:**
```
INFO: New App Version Detected in Production
Version: {new_version}
First Seen: {timestamp}
Active Users: {user_count}
Note: Monitor for any anomalies with new version
```

---

### 17. Daily Metrics Summary

**Condition:**
```
time == 09:00 UTC (daily)
```

**Threshold:** Daily scheduled report

**Severity:** Info

**Escalation Path:**
1. Email: mobile-team@fleet-manager.com
2. Dashboard: https://grafana.fleet.com/daily-summary

**Runbook:** N/A

**Alert Message:**
```
INFO: Daily iOS App Metrics Summary

Active Users (24h): {active_users}
Sessions: {session_count}
Crash-Free Rate: {crash_free_rate}%
Avg Session Duration: {avg_session_duration}
API Success Rate: {api_success_rate}%
Memory Usage (P95): {memory_p95} MB
Top Features Used: {top_features}

View Full Report: https://grafana.fleet.com/daily-summary
```

---

### 18. Feature Adoption Milestone

**Condition:**
```
feature_usage_count crosses milestone (100, 1000, 10000, etc.)
```

**Threshold:** Feature usage milestone reached

**Severity:** Info

**Escalation Path:**
1. Email: mobile-team@fleet-manager.com
2. Slack: #mobile-team (celebratory)

**Runbook:** N/A

**Alert Message:**
```
INFO: Feature Adoption Milestone Reached
Feature: {feature_name}
Milestone: {milestone} total uses
Time to Reach: {days_since_launch} days
Current Daily Usage: {daily_usage}
Congratulations to the team!
```

---

### 19. Deployment Success Notification

**Condition:**
```
deployment_completed == true AND error_rate < 2%
```

**Threshold:** Deployment completed with low error rate

**Severity:** Info

**Escalation Path:**
1. Email: mobile-team@fleet-manager.com
2. Slack: #deployments

**Runbook:** N/A

**Alert Message:**
```
INFO: iOS App Deployment Successful
Version: {app_version}
Deployed At: {timestamp}
Current Error Rate: {error_rate}%
Current Crash Rate: {crash_rate}%
Active Users: {active_users}
Status: Healthy
```

---

### 20. Weekly Performance Report

**Condition:**
```
day == Monday AND time == 09:00 UTC
```

**Threshold:** Weekly scheduled report

**Severity:** Info

**Escalation Path:**
1. Email: mobile-team@fleet-manager.com
2. Email: engineering-leads@fleet-manager.com

**Runbook:** N/A

**Alert Message:**
```
INFO: Weekly iOS App Performance Report

Week: {week_start} - {week_end}

Performance Metrics:
- Crash-Free Rate: {crash_free_rate}% (Target: 99.5%)
- API P95 Response Time: {api_p95}ms (Target: 500ms)
- App Launch P95: {launch_p95}s (Target: 2s)
- Memory P95: {memory_p95}MB (Target: 150MB)

User Engagement:
- Active Users: {active_users}
- Avg Session Duration: {avg_session}
- Sessions per User: {sessions_per_user}

Top Issues:
1. {issue_1}
2. {issue_2}
3. {issue_3}

View Full Report: https://grafana.fleet.com/weekly-report
```

---

## Alert Configuration

### Alert Channels

| Severity | Channel | Response Time | Notification Method |
|----------|---------|---------------|---------------------|
| Critical | PagerDuty | Immediate | Phone call, SMS, Push |
| Warning | Slack | 15 minutes | Slack message, Mobile push |
| Info | Email | Next business day | Email |

### Alert Timing

- **Critical Alerts**: 24/7 monitoring, immediate notification
- **Warning Alerts**: 24/7 monitoring, batched every 5 minutes
- **Info Alerts**: Business hours only, daily/weekly batching

### Alert Suppression

Alerts can be suppressed during:
- Scheduled maintenance windows
- Deployment periods (first 30 minutes)
- Known incidents (while resolution is in progress)

### Alert Dependencies

Some alerts have dependencies to prevent alert storms:

```yaml
dependencies:
  - alert: HighAPIErrorRate
    depends_on: CompleteServiceOutage
    action: suppress_if_parent_firing

  - alert: SlowAPIResponse
    depends_on: HighAPIErrorRate
    action: suppress_if_parent_firing

  - alert: GPSAccuracyDegradation
    depends_on: NetworkRequestTimeoutRate
    action: annotate_if_parent_firing
```

---

## Escalation Policies

### Critical Alert Escalation

1. **Immediate (0 min):** Page on-call engineer(s)
2. **15 minutes:** Escalate to team lead if not acknowledged
3. **30 minutes:** Escalate to engineering manager
4. **60 minutes:** Escalate to VP Engineering

### Warning Alert Escalation

1. **Immediate:** Post to Slack channel
2. **30 minutes:** Create JIRA ticket if not resolved
3. **2 hours:** Escalate to team lead
4. **24 hours:** Escalate to engineering manager

### Info Alert Escalation

1. **Immediate:** Send email notification
2. **No escalation required**

---

## Alert Testing

All alerts should be tested regularly:

1. **Monthly:** Test critical alert paths
2. **Quarterly:** Test all escalation paths
3. **After changes:** Test modified alerts immediately

Test command:
```bash
./scripts/test-alert.sh --alert-name "HighCrashRate" --test-value "2.5%"
```

---

## Alert Maintenance

- Review alert thresholds quarterly
- Update runbooks when alerts fire repeatedly
- Archive unused alerts after 90 days
- Document false positive patterns

---

## Contact Information

- **Mobile Team Lead:** mobile-lead@fleet-manager.com
- **On-Call Rotation:** https://pagerduty.fleet.com/schedules/mobile
- **Alert Dashboard:** https://grafana.fleet.com/alerts
- **Runbook Repository:** https://wiki.fleet.com/runbooks/

---

*Last Updated: 2025-11-11*
*Version: 1.0*
*Owner: Mobile Engineering Team*
