# Application Insights Setup Guide

## Overview

Application Insights is now fully integrated into the Fleet Management System for production telemetry, performance monitoring, and error tracking.

## Configuration

### 1. Azure Application Insights Resource

The Application Insights resource is automatically created by the Azure deployment templates:

```bicep
// In azure/deploy-production.bicep
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 90
    IngestionMode: 'LogAnalytics'
  }
}
```

**Resource Details:**
- **Name**: `${environment}-fleet-insights`
- **Retention**: 90 days
- **Ingestion**: Log Analytics workspace
- **Application Type**: Web

### 2. Environment Variables

Add the connection string to your environment files:

**`.env.production`:**
```bash
VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx-xxx-xxx;IngestionEndpoint=https://eastus2-3.in.applicationinsights.azure.com/
```

**`.env.development` (optional - for dev environment tracking):**
```bash
VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=dev-key;IngestionEndpoint=https://eastus2-3.in.applicationinsights.azure.com/
```

### 3. Get Connection String from Azure

```bash
# After deployment, get the connection string:
az monitor app-insights component show \
  --app production-fleet-insights \
  --resource-group fleet-production-rg \
  --query connectionString \
  --output tsv
```

## Features

### Automatic Tracking

Application Insights is initialized in `src/main.tsx` and automatically tracks:

- ✅ **Page Views**: All route changes via React Router
- ✅ **AJAX Calls**: All API requests with timing
- ✅ **Errors & Exceptions**: Unhandled errors and React ErrorBoundary catches
- ✅ **Performance**: Page load time, TTFB, DOM ready time
- ✅ **User Sessions**: Anonymous user tracking (GDPR compliant)
- ✅ **Custom Events**: Business-specific user actions

### Custom Event Tracking

The telemetry service provides specialized tracking methods:

```typescript
import telemetryService from '@/lib/telemetry';

// Track button clicks
telemetryService.trackButtonClick('SaveVehicle', {
  vehicleId: vehicle.id,
  formSection: 'maintenance'
});

// Track form submissions
telemetryService.trackFormSubmission('VehicleRegistration', true, {
  validationErrors: 0,
  timeToComplete: 45 // seconds
});

// Track search operations
telemetryService.trackSearch('Tesla Model 3', 12, {
  filterApplied: 'make=Tesla',
  sortOrder: 'newest'
});

// Track vehicle selection
telemetryService.trackVehicleSelected('VEH-12345', {
  source: 'dashboard',
  action: 'view-details'
});

// Track API performance
telemetryService.trackApiCall('/api/vehicles', 'GET', 200, 145);

// Track custom metrics
telemetryService.trackMetric('VehicleLoadTime', 230, {
  cacheHit: false,
  dataSize: 1024
});
```

### Error Tracking Integration

Errors are automatically tracked via `EnhancedErrorBoundary.tsx`:

```typescript
// Errors caught by ErrorBoundary are sent to:
// 1. Application Insights (production telemetry)
// 2. Sentry (if configured)
// 3. LogRocket (if configured)
// 4. Custom API endpoint /api/errors
// 5. localStorage (last 10 errors for debugging)
```

## Monitored Metrics

### Frontend Performance

| Metric | Description | Target |
|--------|-------------|--------|
| PageLoadTime | Full page load (fetchStart to loadEventEnd) | < 3000ms |
| DOMReadyTime | DOM content loaded | < 1500ms |
| TimeToFirstByte | Server response time | < 200ms |
| JSHeapUsed | JavaScript memory usage | < 100MB |
| API_Response_Time | Backend API response time | < 500ms |

### User Behavior

| Event | Description |
|-------|-------------|
| FrontendStartup | App initialization with environment details |
| ButtonClick | All button interactions with context |
| FormSubmission | Form submissions with validation results |
| Search | Search operations with result counts |
| FilterApplied | Data filtering actions |
| VehicleSelected | Vehicle detail view access |
| APICall | All API requests with status and timing |

### Error Monitoring

| Metric | Description |
|--------|-------------|
| Exception Count | Total exceptions per hour |
| Error Rate | Percentage of failed requests |
| Top Errors | Most frequent error messages |
| Error by Component | React component error breakdown |
| API Failures | Failed API calls by endpoint |

## Querying Data

### Kusto Query Language (KQL)

Access Application Insights data using KQL queries in Azure Portal:

**View Recent Errors:**
```kusto
exceptions
| where timestamp > ago(1h)
| project timestamp, type, outerMessage, operation_Name
| order by timestamp desc
| take 50
```

**API Performance Analysis:**
```kusto
customEvents
| where name == "APICall"
| extend endpoint = tostring(customDimensions.endpoint)
| extend duration = todouble(customDimensions.duration)
| summarize
    AvgDuration = avg(duration),
    P95Duration = percentile(duration, 95),
    P99Duration = percentile(duration, 99),
    Count = count()
  by endpoint
| order by P95Duration desc
```

**Page Load Performance:**
```kusto
customMetrics
| where name == "PageLoadTime"
| extend url = tostring(customDimensions.url)
| summarize
    AvgLoadTime = avg(value),
    P95LoadTime = percentile(value, 95)
  by url
| order by P95LoadTime desc
```

**User Activity Funnel:**
```kusto
customEvents
| where timestamp > ago(24h)
| where name in ("FrontendStartup", "VehicleSelected", "FormSubmission")
| summarize Count = count() by name
```

**Error Rate by Hour:**
```kusto
union
  (requests | where success == false),
  (exceptions)
| where timestamp > ago(24h)
| summarize ErrorCount = count() by bin(timestamp, 1h)
| order by timestamp desc
```

## Alerts Configuration

Set up alerts in Azure Portal for critical issues:

### Recommended Alerts

1. **High Error Rate**
   - Metric: `exceptions/count`
   - Threshold: > 10 errors in 5 minutes
   - Action: Email + Slack notification

2. **Slow API Performance**
   - Metric: `customMetrics` where `name == "API_Response_Time"`
   - Threshold: > 1000ms (95th percentile)
   - Action: Email to DevOps team

3. **Page Load Degradation**
   - Metric: `customMetrics` where `name == "PageLoadTime"`
   - Threshold: > 5000ms (95th percentile)
   - Action: Incident ticket creation

4. **High Memory Usage**
   - Metric: `customMetrics` where `name == "JSHeapUsed"`
   - Threshold: > 200MB
   - Action: Investigation required

## Privacy & Data Sanitization

Application Insights automatically sanitizes sensitive data:

```typescript
// Masked in telemetry:
// - Authorization headers
// - Cookies
// - CSRF tokens
// - API keys in URLs (key=***)
// - Tokens in URLs (token=***)
// - User IDs in paths (/users/***)
// - Email addresses (***@***.***)
```

**User Identification:**
- Anonymous by default
- User context set on login (non-PII identifier)
- GDPR compliant - no personal data tracked

## Development vs Production

**Development:**
- Connection string optional
- Telemetry disabled if not configured
- Console warnings if missing: `⚠️ Application Insights connection string not found`

**Production:**
- Connection string required in environment variables
- Full telemetry enabled
- Data retention: 90 days
- Sampling: 100% (no sampling)

## Cost Estimation

**Data Ingestion:**
- Estimated: ~500MB/day for typical usage
- Cost: ~$2.50/GB ingested (after 5GB free tier)
- Monthly estimate: ~$40 (15GB × $2.50)

**Data Retention:**
- First 90 days: Included
- Extended retention: $0.12/GB/month

**Total Estimated Cost:** ~$40-60/month

## Troubleshooting

### Telemetry Not Appearing

1. **Check connection string:**
   ```bash
   echo $VITE_APPLICATION_INSIGHTS_CONNECTION_STRING
   ```

2. **Verify initialization:**
   - Open browser console
   - Look for: `✅ Frontend Application Insights initialized`
   - Or warning: `⚠️ Application Insights connection string not found`

3. **Check network requests:**
   - Open DevTools → Network tab
   - Filter for `dc.services.visualstudio.com` or `dc.applicationinsights.azure.com`
   - Should see POST requests with telemetry data

4. **Data delay:**
   - Telemetry data can take 2-5 minutes to appear in Azure Portal
   - Use Live Metrics for real-time monitoring

### Common Issues

**Issue:** "Module not found: @microsoft/applicationinsights-web"
- **Solution:** Run `npm install`

**Issue:** Telemetry not tracking page views
- **Solution:** Ensure `enableAutoRouteTracking: true` in config (already set)

**Issue:** Excessive data ingestion costs
- **Solution:** Reduce sampling percentage in `src/lib/telemetry.ts` line 46

## Integration with CI/CD

Add connection string to GitHub Secrets:

```bash
# GitHub repository → Settings → Secrets → New secret
Name: VITE_APPLICATION_INSIGHTS_CONNECTION_STRING
Value: InstrumentationKey=xxx;IngestionEndpoint=https://...
```

**GitHub Actions workflow:**
```yaml
- name: Build with Application Insights
  env:
    VITE_APPLICATION_INSIGHTS_CONNECTION_STRING: ${{ secrets.VITE_APPLICATION_INSIGHTS_CONNECTION_STRING }}
  run: npm run build
```

## Next Steps

1. ✅ Deploy Azure infrastructure: `cd azure && ./deploy.sh production eastus`
2. ✅ Get connection string from deployed Application Insights resource
3. ✅ Add connection string to `.env.production`
4. ✅ Build and deploy application
5. ✅ Verify telemetry in Azure Portal → Application Insights → Live Metrics
6. ⏳ Configure alerts for critical metrics
7. ⏳ Create dashboards for business KPIs
8. ⏳ Set up integration with Azure Monitor

## Resources

- [Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [KQL Query Reference](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [React Plugin Documentation](https://github.com/microsoft/applicationinsights-react-js)
- [Telemetry Service Implementation](../src/lib/telemetry.ts)

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
**Owner**: Fleet Engineering Team
