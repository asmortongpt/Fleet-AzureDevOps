# Fleet Management System - Production Monitoring Setup

## Overview

This document provides comprehensive documentation for the production monitoring infrastructure of the Fleet Management System. Our monitoring stack provides complete observability across errors, performance, user analytics, and infrastructure metrics.

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Fleet Management System                       │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)           │        Backend (Node.js)          │
│  - PostHog Analytics        │        - Sentry Errors            │
│  - Sentry Error Tracking    │        - Application Insights     │
│  - Session Replay           │        - Custom Metrics           │
└──────────────┬──────────────┴────────────────┬─────────────────┘
               │                                │
               ▼                                ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│   Sentry                 │    │   Azure Application Insights    │
│   - Error Tracking       │    │   - Performance Monitoring      │
│   - Performance Monitoring│    │   - Log Analytics              │
│   - Session Replay       │    │   - Infrastructure Metrics      │
│   - Alerts & Notifications│   │   - Availability Tests          │
└──────────────────────────┘    └─────────────────────────────────┘
               │                                │
               │                                │
               ▼                                ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│   PostHog                │    │   Alert Manager                 │
│   - User Analytics       │    │   - Email Notifications         │
│   - Feature Flags        │    │   - Slack Integration           │
│   - Session Recording    │    │   - PagerDuty (optional)        │
│   - A/B Testing          │    │   - SMS Alerts                  │
└──────────────────────────┘    └─────────────────────────────────┘
```

## Quick Start

### 1. Prerequisites

- Azure CLI installed and authenticated
- Node.js 18+ installed
- Access to Sentry, PostHog accounts
- Admin access to Azure subscription

### 2. Initial Setup

```bash
# Clone repository
cd /Users/andrewmorton/Documents/GitHub/fleet-local

# Make scripts executable
chmod +x scripts/setup-*.sh scripts/test-monitoring.sh

# Run all setup scripts
./scripts/setup-sentry.sh
./scripts/setup-posthog.sh
./scripts/setup-azure-monitor.sh

# Test all monitoring services
./scripts/test-monitoring.sh
```

### 3. Verify Setup

Visit the following dashboards to verify setup:

- **Sentry:** https://sentry.io/organizations/fleet-management/
- **PostHog:** https://app.posthog.com/
- **Azure Portal:** https://portal.azure.com/

## Monitoring Services

### 1. Sentry Error Tracking

**Purpose:** Real-time error tracking, performance monitoring, and session replay

#### Configuration

```javascript
// API (Node.js)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% in production
  profilesSampleRate: 0.1
});

// Frontend (React)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true
    })
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
```

#### Features Enabled

- ✅ Error tracking with full stack traces
- ✅ Performance monitoring (transactions, spans)
- ✅ Session replay (10% sample, 100% on errors)
- ✅ Source maps for minified code
- ✅ Release tracking
- ✅ User context and breadcrumbs
- ✅ Email and Slack alerts

#### Dashboard URLs

- **Organization:** https://sentry.io/organizations/fleet-management/
- **API Project:** https://sentry.io/organizations/fleet-management/projects/fleet-api/
- **Web Project:** https://sentry.io/organizations/fleet-management/projects/fleet-web/

#### Alert Rules

| Alert | Condition | Severity | Notifications |
|-------|-----------|----------|---------------|
| High Error Rate | > 100 errors in 15 min | Medium | Email, Slack |
| New Error | First occurrence | Low | Email |
| Performance Degradation | P95 > 3s | Low | Email |
| Release Health | Crash rate > 5% | High | Email, Slack |

### 2. PostHog Product Analytics

**Purpose:** User analytics, feature flags, session recording, A/B testing

#### Configuration

```javascript
// Frontend
import posthog from 'posthog-js';

posthog.init(
  import.meta.env.VITE_POSTHOG_API_KEY,
  {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    autocapture: true,
    capture_pageview: true,
    session_recording: {
      maskAllInputs: true,
      maskAllText: true
    }
  }
);
```

#### Feature Flags

| Flag Key | Name | Description | Rollout | Status |
|----------|------|-------------|---------|--------|
| `enable_ai_assistant` | AI Assistant | AI-powered virtual assistant | 25% | Active |
| `enable_realtime_updates` | Real-time Updates | WebSocket real-time tracking | 50% | Active |
| `enable_advanced_analytics` | Advanced Analytics | Predictive insights dashboard | 0% | Manual |
| `enable_video_telematics` | Video Telematics | Dashcam integration | 0% | Manual |
| `enable_predictive_maintenance` | Predictive Maintenance | AI maintenance alerts | 10% | Active |
| `enable_beta_features` | Beta Features | Beta feature access | 5% | Active |

#### Dashboard URLs

- **Main Dashboard:** https://app.posthog.com/project/{PROJECT_ID}/dashboard
- **Feature Flags:** https://app.posthog.com/project/{PROJECT_ID}/feature_flags
- **Session Recordings:** https://app.posthog.com/project/{PROJECT_ID}/session_recordings
- **Insights:** https://app.posthog.com/project/{PROJECT_ID}/insights

#### Key Metrics Tracked

- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- User retention and churn
- Feature adoption rates
- Page views and navigation patterns
- Custom events (vehicle tracking, route optimization, etc.)
- Funnel analysis (onboarding, maintenance scheduling)

### 3. Azure Application Insights

**Purpose:** Infrastructure monitoring, logging, availability testing, and alerting

#### Configuration

```javascript
// API (Node.js)
import * as appInsights from 'applicationinsights';

appInsights.setup(process.env.APPLICATION_INSIGHTS_CONNECTION_STRING)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .start();
```

#### Resources

- **Resource Group:** fleet-management-rg
- **Application Insights:** fleet-management-insights
- **Log Analytics Workspace:** fleet-management-logs
- **Action Group:** fleet-management-alerts

#### Dashboard URLs

- **Application Insights:** https://portal.azure.com/#@/resource/{RESOURCE_ID}
- **Log Analytics:** https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/logs
- **Alerts:** https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/alertsV2
- **Dashboards:** https://portal.azure.com/#dashboard

#### Alert Rules

| Alert | Condition | Window | Severity | Action |
|-------|-----------|--------|----------|--------|
| High Error Rate | > 1% failed requests | 15 min | Medium | Email, Slack |
| High Response Time | P95 > 3 seconds | 15 min | Low | Email |
| High Memory Usage | > 80% memory used | 15 min | Medium | Email, Slack |
| Service Downtime | Availability < 99% | 5 min | Critical | Email, Slack, SMS |

#### Key Performance Indicators

```kusto
// Average Response Time
requests
| where timestamp > ago(1h)
| summarize avg(duration) by bin(timestamp, 5m)

// Error Rate
requests
| where timestamp > ago(1h)
| summarize
    total = count(),
    failed = countif(success == false),
    error_rate = 100.0 * countif(success == false) / count()

// P95 Response Time
requests
| where timestamp > ago(1h)
| summarize p95 = percentile(duration, 95) by bin(timestamp, 5m)

// Top 10 Slowest Endpoints
requests
| where timestamp > ago(1h)
| summarize avg_duration = avg(duration) by operation_Name
| order by avg_duration desc
| take 10
```

## Environment Variables

### API (.env)

```bash
# Sentry
SENTRY_DSN=https://[key]@sentry.io/[project-id]
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=fleet-api@1.0.0

# Azure Application Insights
APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=[key];IngestionEndpoint=...
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=[key];IngestionEndpoint=...
APPLICATION_INSIGHTS_INSTRUMENTATION_KEY=[key]
```

### Frontend (.env.local)

```bash
# Sentry
VITE_SENTRY_DSN=https://[key]@sentry.io/[project-id]
VITE_SENTRY_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0

# PostHog
VITE_POSTHOG_API_KEY=[key]
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_POSTHOG_AUTOCAPTURE=true
VITE_POSTHOG_CAPTURE_PAGEVIEW=true

# Azure Application Insights
VITE_APP_INSIGHTS_CONNECTION_STRING=InstrumentationKey=[key];IngestionEndpoint=...
VITE_APP_INSIGHTS_INSTRUMENTATION_KEY=[key]
```

## Alert Playbooks

Detailed incident response playbooks are available in `/docs/playbooks/`:

- **[High Error Rate](./docs/playbooks/high-error-rate.md)** - Response to elevated error rates
- **[Performance Degradation](./docs/playbooks/performance-degradation.md)** - Handling slow response times
- **[Service Outage](./docs/playbooks/service-outage.md)** - Complete service unavailability
- **[Security Incident](./docs/playbooks/security-incident.md)** - Security breaches and attacks

## Testing Monitoring

### Manual Testing

```bash
# Run comprehensive test suite
./scripts/test-monitoring.sh

# Test individual services
node /tmp/test-sentry-monitoring.js
node /tmp/test-appinsights-monitoring.js
```

### Automated Testing

```javascript
// Example: Trigger test error
Sentry.captureException(new Error('Test error from monitoring setup'));

// Example: Track test event
posthog.capture('monitoring_test_event', {
  test: true,
  timestamp: new Date().toISOString()
});

// Example: Send test metric
appInsights.defaultClient.trackMetric({
  name: 'test_metric',
  value: 42
});
```

## Unified Dashboard

The unified dashboard combines data from all monitoring sources:

**Configuration:** `/monitoring/unified-dashboard-config.json`

### Dashboard Sections

1. **System Health Overview** - Overall system status, availability, error rates
2. **Error Tracking** - Top errors, error trends, affected users
3. **Performance Monitoring** - Response times, slow queries, transactions
4. **User Analytics** - DAU/WAU/MAU, feature usage, funnels
5. **Infrastructure Metrics** - CPU, memory, database connections
6. **Business Metrics** - Active vehicles, routes optimized, maintenance
7. **Alerts & Incidents** - Active alerts, incident timeline

## Notification Channels

### Email Notifications

- **Primary:** andrew.m@capitaltechalliance.com
- **Team:** engineering@fleet-management.com
- **On-Call:** oncall@fleet-management.com

### Slack Integration

```bash
# Configure Slack webhook for alerts
az monitor action-group create \
  --name fleet-slack-alerts \
  --resource-group fleet-management-rg \
  --action webhook fleet-slack "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Channels:**
- `#production-alerts` - All production alerts
- `#incidents` - Active incidents
- `#security` - Security-related alerts
- `#on-call-engineering` - Critical alerts

### PagerDuty (Optional)

For 24/7 on-call rotation:

```bash
# Add PagerDuty integration
az monitor action-group update \
  --name fleet-management-alerts \
  --resource-group fleet-management-rg \
  --add-action pagerduty fleet-pd [integration-key]
```

## Monitoring Best Practices

### 1. Error Handling

```javascript
// ✅ Good: Contextual error reporting
try {
  await processVehicleData(vehicleId);
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: 'vehicle_processing' },
    extra: { vehicleId, userId: req.user.id },
    level: 'error'
  });
  throw error;
}

// ❌ Bad: Generic error reporting
try {
  await processVehicleData(vehicleId);
} catch (error) {
  console.error(error);
}
```

### 2. Performance Monitoring

```javascript
// ✅ Good: Track custom transactions
const transaction = Sentry.startTransaction({
  op: 'route_optimization',
  name: 'Optimize Delivery Route'
});

try {
  const result = await optimizeRoute(routeParams);
  transaction.setStatus('ok');
  return result;
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

### 3. User Context

```javascript
// ✅ Good: Set user context early
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name
});

posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  plan: user.subscription.plan
});
```

### 4. Custom Metrics

```javascript
// ✅ Good: Track business metrics
appInsights.defaultClient.trackMetric({
  name: 'vehicles_tracked',
  value: activeVehicleCount,
  properties: { organization: orgId }
});

posthog.capture('route_optimized', {
  vehicle_count: vehicles.length,
  optimization_time: duration,
  fuel_saved: fuelSavings
});
```

## Troubleshooting

### Sentry Not Receiving Events

```bash
# Check DSN configuration
echo $SENTRY_DSN

# Test connection
curl -X POST "$SENTRY_DSN" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Check Sentry CLI
sentry-cli info
```

### PostHog Events Not Appearing

```bash
# Verify API key
echo $VITE_POSTHOG_API_KEY

# Test event capture
curl -X POST "https://app.posthog.com/capture/" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "'$VITE_POSTHOG_API_KEY'",
    "event": "test_event",
    "properties": {"distinct_id": "test"}
  }'
```

### Application Insights No Data

```bash
# Check connection string
az monitor app-insights component show \
  --app fleet-management-insights \
  --resource-group fleet-management-rg

# Check if data is being received
az monitor app-insights metrics show \
  --app fleet-management-insights \
  --resource-group fleet-management-rg \
  --metric requests/count
```

## Maintenance

### Weekly Tasks

- [ ] Review error trends in Sentry
- [ ] Check feature flag adoption in PostHog
- [ ] Verify alert thresholds are appropriate
- [ ] Review slow queries and performance

### Monthly Tasks

- [ ] Update monitoring thresholds based on traffic
- [ ] Review and rotate API keys/secrets
- [ ] Analyze user behavior trends
- [ ] Update runbooks with new learnings
- [ ] Performance baseline review

### Quarterly Tasks

- [ ] Comprehensive monitoring audit
- [ ] Review and update alert playbooks
- [ ] Capacity planning based on metrics
- [ ] Security review of monitoring access
- [ ] Test disaster recovery procedures

## Cost Optimization

### Sentry

- Free tier: 5,000 errors/month
- Sample rates: 10% for transactions/profiling in production
- Estimated cost: ~$26/month (Developer plan)

### PostHog

- Free tier: 1M events/month
- Session recording: 25% sample rate
- Estimated cost: ~$0/month (within free tier)

### Azure Application Insights

- Free tier: 5 GB data ingestion/month
- Data retention: 90 days
- Estimated cost: ~$100/month

**Total Monitoring Cost: ~$126/month**

### Cost Reduction Tips

1. Adjust sample rates in production (currently 10%)
2. Use log filtering to reduce noise
3. Archive old data to cheaper storage
4. Review and remove unused custom metrics

## Security

### Access Control

- Monitoring dashboards: Engineering team only
- Alert configuration: DevOps and Engineering Leads
- PII data masking: Enabled in all services
- Audit logging: All configuration changes logged

### Data Privacy

- ✅ PII masking enabled in session replays
- ✅ Sensitive data filtered from error reports
- ✅ User consent for analytics tracking
- ✅ GDPR-compliant data retention
- ✅ Secure storage of monitoring credentials

## Support & Resources

### Documentation

- Sentry: https://docs.sentry.io/
- PostHog: https://posthog.com/docs
- Azure Monitor: https://docs.microsoft.com/azure/azure-monitor/

### Internal Resources

- Runbooks: `/docs/playbooks/`
- Configuration: `/monitoring/`
- Scripts: `/scripts/`
- Team Wiki: [Internal Link]

### Contact

- **On-Call Engineering:** Slack: #on-call-engineering
- **DevOps Team:** Slack: #devops
- **Monitoring Issues:** monitoring@fleet-management.com

---

**Document Version:** 1.0
**Last Updated:** 2025-12-31
**Owner:** Platform Engineering Team
**Next Review:** 2026-03-31
