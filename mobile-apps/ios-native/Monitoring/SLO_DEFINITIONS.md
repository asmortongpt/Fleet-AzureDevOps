# Fleet Manager iOS - Service Level Objectives (SLOs)

This document defines the Service Level Objectives (SLOs) for the Fleet Manager iOS mobile application, including targets, measurements, error budgets, and tracking procedures.

## Table of Contents

1. [SLO Overview](#slo-overview)
2. [Availability SLO](#availability-slo)
3. [Performance SLO](#performance-slo)
4. [Error Rate SLO](#error-rate-slo)
5. [Crash-Free Rate SLO](#crash-free-rate-slo)
6. [Authentication Success Rate SLO](#authentication-success-rate-slo)
7. [Data Sync Success Rate SLO](#data-sync-success-rate-slo)
8. [Error Budget Calculations](#error-budget-calculations)
9. [SLO Tracking and Reporting](#slo-tracking-and-reporting)
10. [SLO Review Process](#slo-review-process)

---

## SLO Overview

Service Level Objectives (SLOs) are target values or ranges for service quality metrics that represent our commitment to users. These SLOs guide our engineering priorities and help us make data-driven decisions about reliability vs. feature velocity.

### Key Principles

1. **User-Centric:** SLOs reflect what matters to users
2. **Measurable:** All SLOs have clear, quantifiable metrics
3. **Achievable:** Targets are realistic and sustainable
4. **Actionable:** SLO violations trigger specific responses
5. **Reviewed Regularly:** Quarterly review and adjustment

### SLO Hierarchy

```
Availability (99.9%) - System can handle requests
    ├── Performance (p95 < 500ms) - System responds quickly
    ├── Error Rate (< 1%) - System responds correctly
    └── Crash-Free (> 99%) - System stays stable
```

---

## Availability SLO

### Definition

The percentage of time the Fleet Manager iOS app can successfully connect to backend services and perform core functions.

### Target

**99.9% availability** over a 30-day rolling window

### Measurement

```
Availability = (Total Requests - Failed Requests) / Total Requests × 100%

Where Failed Requests include:
- HTTP 5xx errors
- Network timeouts (> 30s)
- DNS resolution failures
- SSL/TLS errors
```

### Error Budget

```
Monthly Error Budget = (1 - 0.999) × 30 days × 24 hours × 60 minutes
                     = 43.2 minutes of downtime per month
```

### Monitoring

- **Primary Metric:** `availability_rate`
- **Dashboard:** [Grafana Availability Dashboard](https://grafana.fleet.com/availability)
- **Alert Threshold:** < 99.5% over 1 hour
- **Query:**
  ```promql
  sum(rate(http_requests_total{app="fleet-ios",status!~"5.."}[5m])) /
  sum(rate(http_requests_total{app="fleet-ios"}[5m])) * 100
  ```

### Dependencies

- Backend API availability
- Azure cloud infrastructure
- CDN availability
- DNS service availability

### Exclusions

- Planned maintenance windows (announced 7 days in advance)
- User network connectivity issues
- Client-side errors (4xx except 429)

### Response Actions

| Availability | Action |
|-------------|---------|
| ≥ 99.9% | Normal operations |
| 99.5-99.9% | Monitor closely, investigate if trending down |
| 99.0-99.5% | Create incident, engage on-call engineer |
| < 99.0% | Critical incident, page engineering leadership |

---

## Performance SLO

### Definition

The response time for API requests from the mobile app, measured at the 95th percentile.

### Target

**P95 API response time < 500ms** over a 30-day rolling window

### Measurement

```
P95 Response Time = 95th percentile of all API request durations

Measured from:
- Request initiation in mobile app
- To response received (excluding local processing)
```

### Error Budget

```
Performance Budget = 5% of requests can exceed 500ms
Monthly Volume = ~10M requests
Budget = 500,000 slow requests per month
```

### Monitoring

- **Primary Metric:** `api_request_duration_p95`
- **Dashboard:** [Grafana Performance Dashboard](https://grafana.fleet.com/performance)
- **Alert Threshold:** > 600ms for 15 minutes
- **Query:**
  ```promql
  histogram_quantile(0.95,
    rate(api_request_duration_seconds_bucket{app="fleet-ios"}[5m])
  ) * 1000
  ```

### Breakdown by Endpoint

| Endpoint | P95 Target | Critical Threshold |
|----------|------------|-------------------|
| /api/auth/login | 300ms | 500ms |
| /api/vehicles | 400ms | 700ms |
| /api/trips | 500ms | 800ms |
| /api/sync | 800ms | 1200ms |
| /api/diagnostics | 600ms | 1000ms |

### Dependencies

- Backend API performance
- Database query performance
- Network latency
- CDN performance

### Exclusions

- Requests during deployments (first 10 minutes)
- Requests from poor network conditions (< 2G)
- Large file uploads/downloads

### Response Actions

| P95 Latency | Action |
|------------|---------|
| < 500ms | Normal operations |
| 500-600ms | Monitor, optimize if possible |
| 600-800ms | Investigate, engage backend team |
| > 800ms | Critical issue, implement performance fixes |

---

## Error Rate SLO

### Definition

The percentage of API requests that result in errors (excluding user errors like 400 Bad Request).

### Target

**Error rate < 1%** over a 30-day rolling window

### Measurement

```
Error Rate = (Error Requests / Total Requests) × 100%

Where Error Requests include:
- HTTP 5xx (server errors)
- HTTP 429 (rate limiting)
- Network errors
- Timeout errors
```

### Error Budget

```
Monthly Error Budget = 1% × Total Requests
Monthly Volume = ~10M requests
Budget = 100,000 errors per month
```

### Monitoring

- **Primary Metric:** `api_error_rate`
- **Dashboard:** [Grafana Error Dashboard](https://grafana.fleet.com/errors)
- **Alert Threshold:** > 2% for 10 minutes
- **Query:**
  ```promql
  sum(rate(api_request_errors_total{app="fleet-ios"}[5m])) /
  sum(rate(api_request_total{app="fleet-ios"}[5m])) * 100
  ```

### Error Categories

| Category | Target | Weight |
|----------|--------|--------|
| Server Errors (5xx) | < 0.5% | High |
| Timeout Errors | < 0.3% | High |
| Rate Limiting (429) | < 0.1% | Medium |
| Network Errors | < 0.1% | Medium |

### Dependencies

- Backend service reliability
- API gateway stability
- Database availability
- Third-party service reliability

### Exclusions

- Client validation errors (400)
- Authentication failures due to invalid credentials (401)
- Authorization failures (403)
- Not found errors (404)

### Response Actions

| Error Rate | Action |
|-----------|---------|
| < 1% | Normal operations |
| 1-2% | Monitor, investigate trending errors |
| 2-5% | Create incident, engage backend team |
| > 5% | Critical incident, consider rollback |

---

## Crash-Free Rate SLO

### Definition

The percentage of user sessions that do not experience an app crash.

### Target

**99% crash-free rate** over a 30-day rolling window

### Measurement

```
Crash-Free Rate = (Total Sessions - Crashed Sessions) / Total Sessions × 100%

Where Crashed Session = any session ending in app crash
```

### Error Budget

```
Monthly Error Budget = 1% × Total Sessions
Monthly Sessions = ~500,000
Budget = 5,000 crashed sessions per month
```

### Monitoring

- **Primary Metric:** `crash_free_rate`
- **Dashboard:** [Firebase Crashlytics Dashboard](https://console.firebase.google.com/crashlytics)
- **Alert Threshold:** < 99.5% over 1 hour
- **Query:**
  ```promql
  100 - (
    sum(rate(app_crashes_total{app="fleet-ios"}[1h])) /
    sum(rate(session_start{app="fleet-ios"}[1h])) * 100
  )
  ```

### Crash Categories

| Category | Target | Priority |
|----------|--------|----------|
| Fatal Crashes | < 0.5% | Critical |
| Memory Crashes | < 0.3% | High |
| Threading Crashes | < 0.1% | High |
| UI Crashes | < 0.1% | Medium |

### Dependencies

- iOS SDK stability
- Third-party library reliability
- Memory management
- Thread safety

### Exclusions

- Crashes during beta testing
- Crashes on unsupported iOS versions (< iOS 14)
- Force-quit by user (not counted as crash)

### Response Actions

| Crash-Free Rate | Action |
|----------------|---------|
| ≥ 99.5% | Normal operations |
| 99.0-99.5% | Monitor, fix top crashes |
| 98.0-99.0% | Create incident, prepare hotfix |
| < 98.0% | Critical incident, emergency rollback |

---

## Authentication Success Rate SLO

### Definition

The percentage of authentication attempts that succeed.

### Target

**95% authentication success rate** over a 30-day rolling window

### Measurement

```
Auth Success Rate = (Successful Logins / Total Login Attempts) × 100%

Excluding:
- Invalid credentials (user error)
- Locked accounts (policy-based)
```

### Error Budget

```
Monthly Error Budget = 5% × Total Auth Attempts
Monthly Attempts = ~100,000
Budget = 5,000 failed authentications per month
```

### Monitoring

- **Primary Metric:** `auth_success_rate`
- **Dashboard:** [Grafana Auth Dashboard](https://grafana.fleet.com/auth)
- **Alert Threshold:** < 90% for 10 minutes
- **Query:**
  ```promql
  sum(rate(auth_success_total{app="fleet-ios"}[5m])) /
  (sum(rate(auth_success_total{app="fleet-ios"}[5m])) +
   sum(rate(auth_failure_total{app="fleet-ios",reason!="invalid_credentials"}[5m]))) * 100
  ```

### Breakdown by Auth Method

| Method | Success Rate Target |
|--------|-------------------|
| Email/Password | 96% |
| Biometric | 98% |
| SSO | 97% |
| Token Refresh | 99% |

### Dependencies

- Authentication service availability
- Token service reliability
- Keychain access
- Network connectivity

### Exclusions

- Invalid credentials (user error)
- Expired passwords (policy)
- Locked accounts (security)
- First-time setup failures

### Response Actions

| Success Rate | Action |
|-------------|---------|
| ≥ 95% | Normal operations |
| 90-95% | Monitor, check auth service |
| 85-90% | Create incident, engage security team |
| < 85% | Critical incident, check for attacks |

---

## Data Sync Success Rate SLO

### Definition

The percentage of offline data sync operations that complete successfully.

### Target

**98% sync success rate** over a 30-day rolling window

### Measurement

```
Sync Success Rate = (Successful Syncs / Total Sync Attempts) × 100%

Where Successful Sync = data successfully sent to backend
```

### Error Budget

```
Monthly Error Budget = 2% × Total Sync Operations
Monthly Syncs = ~200,000
Budget = 4,000 failed syncs per month
```

### Monitoring

- **Primary Metric:** `sync_success_rate`
- **Dashboard:** [Grafana Sync Dashboard](https://grafana.fleet.com/sync)
- **Alert Threshold:** < 95% for 30 minutes
- **Query:**
  ```promql
  sum(rate(sync_operation_total{app="fleet-ios",result="success"}[5m])) /
  sum(rate(sync_operation_total{app="fleet-ios"}[5m])) * 100
  ```

### Sync Categories

| Category | Success Rate Target |
|----------|-------------------|
| Trip Data | 99% |
| Vehicle Data | 98% |
| Maintenance Records | 97% |
| Media Files | 95% |

### Dependencies

- Backend sync service
- Network connectivity
- Storage availability
- Conflict resolution logic

### Exclusions

- Sync attempts during airplane mode
- Sync of corrupted local data
- Sync during app updates

### Response Actions

| Success Rate | Action |
|-------------|---------|
| ≥ 98% | Normal operations |
| 95-98% | Monitor, investigate failures |
| 90-95% | Create incident, check sync service |
| < 90% | Critical issue, risk of data loss |

---

## Error Budget Calculations

### Error Budget Policy

Error budgets represent the acceptable level of unreliability. When error budgets are exhausted, feature development slows in favor of reliability work.

### Budget Calculation

```
Error Budget = (1 - SLO Target) × Total Requests/Sessions

Example for 99.9% availability:
- SLO: 99.9%
- Error Budget: 0.1%
- Monthly Requests: 10,000,000
- Budget: 10,000 errors allowed per month
```

### Budget Tracking

Error budgets are tracked in real-time and reviewed weekly:

```bash
# Check current error budget status
curl -X GET "https://api.fleet.com/slo/error-budget?slo=availability&window=30d"

# Response:
{
  "slo": "availability",
  "target": 99.9,
  "current": 99.94,
  "error_budget": 0.1,
  "consumed": 0.06,
  "remaining": 0.04,
  "status": "healthy"
}
```

### Budget Status Levels

| Budget Remaining | Status | Action |
|-----------------|--------|---------|
| > 50% | Healthy | Normal development pace |
| 25-50% | Warning | Prioritize reliability fixes |
| 10-25% | Alert | Slow feature development |
| < 10% | Critical | Feature freeze, reliability only |
| 0% | Exhausted | Emergency mode, all hands on reliability |

### Budget Reset

Error budgets reset on a rolling 30-day window. This means:
- No monthly "reset" where budgets suddenly become available
- Continuous tracking of service quality
- Historical performance always matters

---

## SLO Tracking and Reporting

### Real-Time Monitoring

**Dashboards:**
- Grafana: https://grafana.fleet.com/slo-overview
- DataDog: https://datadog.fleet.com/slo
- Custom: https://slo.fleet.com

**Metrics Collection:**
- Prometheus metrics exported every 30 seconds
- DataDog APM traces for detailed analysis
- Firebase Analytics for user-centric metrics

### Weekly SLO Report

Sent every Monday at 9:00 AM UTC to mobile-team@fleet-manager.com

**Contents:**
```markdown
# Weekly SLO Report - Week of [Date]

## Summary
- Availability: 99.95% ✓ (Target: 99.9%)
- Performance: 450ms ✓ (Target: 500ms)
- Error Rate: 0.8% ✓ (Target: 1%)
- Crash-Free: 99.3% ✓ (Target: 99%)

## Error Budget Status
- Availability: 40% consumed (60% remaining)
- Performance: 15% consumed (85% remaining)
- Error Rate: 80% consumed (20% remaining) ⚠️
- Crash-Free: 30% consumed (70% remaining)

## Notable Events
- Elevated error rate on Tuesday (API deployment issue)
- Performance improved after caching optimization
- 1 P1 incident: High crash rate (resolved in 45 min)

## Recommendations
1. Focus on reducing error rate (budget running low)
2. Continue performance optimizations
3. Monitor new iOS 17 adoption for crash trends
```

### Monthly SLO Review

Conducted on the first Thursday of each month

**Attendees:**
- Mobile Team Lead
- Backend Team Lead
- Product Manager
- Engineering Manager
- SRE Representative

**Agenda:**
1. Review SLO performance vs targets
2. Analyze error budget consumption
3. Discuss SLO violations and root causes
4. Review and update SLO targets if needed
5. Plan reliability improvements

### Quarterly SLO Adjustment

SLO targets should be reviewed quarterly and adjusted based on:
- User feedback and expectations
- Business requirements
- Technical capabilities
- Industry benchmarks
- Historical performance

---

## SLO Violation Response

### Immediate Response

When an SLO is violated:

1. **Acknowledge** (within 5 minutes)
   - On-call engineer acknowledges alert
   - Create incident ticket
   - Post in #incidents channel

2. **Assess** (within 15 minutes)
   - Determine severity and impact
   - Check error budget status
   - Identify affected users

3. **Communicate** (within 30 minutes)
   - Update status page
   - Notify affected teams
   - Post updates every 30 minutes

4. **Mitigate** (within 1 hour)
   - Implement immediate fixes
   - Consider rollback if needed
   - Monitor for improvement

### Post-Incident Review

Within 48 hours of SLO violation:

1. **Document Timeline**
   - What happened and when
   - Who was involved
   - What actions were taken

2. **Root Cause Analysis**
   - Why did the violation occur
   - What were contributing factors
   - Could it have been prevented

3. **Action Items**
   - Preventative measures
   - Monitoring improvements
   - Process changes
   - Runbook updates

4. **Follow-Up**
   - Track action items
   - Update SLOs if needed
   - Share learnings with team

---

## SLO Best Practices

### 1. Start Simple

Begin with 3-5 key SLOs that matter most to users:
- Availability
- Performance
- Error Rate

Add more SLOs as monitoring matures.

### 2. Make SLOs Visible

- Display on team dashboard
- Include in sprint reviews
- Share in company all-hands
- Make part of performance reviews

### 3. Use SLOs for Decision Making

**Questions SLOs help answer:**
- Should we deploy this risky change?
- Can we afford this outage for maintenance?
- Should we prioritize this bug fix?
- Is our reliability improving?

### 4. Balance Reliability and Velocity

- 100% reliability is neither achievable nor necessary
- Error budgets allow for innovation
- Reliability work should be planned, not reactive
- Feature development and reliability work should be balanced

### 5. Iterate and Improve

- Start with achievable targets
- Gradually increase targets as systems mature
- Learn from violations
- Adjust based on user feedback

---

## Useful Queries

### Check Current SLO Status

```bash
# Availability
curl "https://prometheus.fleet.com/api/v1/query?query=availability_rate"

# Performance
curl "https://prometheus.fleet.com/api/v1/query?query=api_request_duration_p95"

# Error Rate
curl "https://prometheus.fleet.com/api/v1/query?query=api_error_rate"

# Crash-Free Rate
curl "https://prometheus.fleet.com/api/v1/query?query=crash_free_rate"
```

### Error Budget Queries

```promql
# Availability Error Budget Consumed
(1 - (availability_rate / 99.9)) * 100

# Performance Error Budget Consumed
(api_request_duration_p95 / 500) * 100

# Error Rate Budget Consumed
(api_error_rate / 1.0) * 100
```

### Historical Trends

```promql
# 30-day availability trend
avg_over_time(availability_rate[30d])

# 30-day performance trend
avg_over_time(api_request_duration_p95[30d])
```

---

## References

- [Google SRE Book - SLOs](https://sre.google/sre-book/service-level-objectives/)
- [Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)

---

## Appendix: SLO Summary Table

| SLO | Target | Window | Error Budget | Alert Threshold | Priority |
|-----|--------|--------|--------------|-----------------|----------|
| Availability | 99.9% | 30d | 43.2 min/month | < 99.5% | P0 |
| Performance (P95) | < 500ms | 30d | 5% slow | > 600ms | P1 |
| Error Rate | < 1% | 30d | 100k errors | > 2% | P0 |
| Crash-Free Rate | > 99% | 30d | 5k crashes | < 99.5% | P0 |
| Auth Success | > 95% | 30d | 5k failures | < 90% | P1 |
| Sync Success | > 98% | 30d | 4k failures | < 95% | P1 |

---

*Last Updated: 2025-11-11*
*Version: 1.0*
*Owner: Mobile Engineering Team*
*Next Review: 2025-12-11*
