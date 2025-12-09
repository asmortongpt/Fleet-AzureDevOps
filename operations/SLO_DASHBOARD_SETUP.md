# Fleet Management System - SLO Dashboard Setup Guide

## Overview

This guide provides step-by-step instructions to set up comprehensive SLO (Service Level Objective) monitoring dashboards in Azure Monitor.

## Prerequisites

- Azure CLI installed and authenticated
- Application Insights instance created
- Log Analytics workspace configured
- Appropriate Azure permissions (Monitoring Contributor)

## SLO Definitions

### 1. Availability SLO: 99.9%

**Target**: 99.9% uptime (max 43.8 minutes downtime per month)

**Measurement**: Percentage of successful requests vs total requests

**Query**:
```kusto
requests
| where timestamp > ago(30d)
| summarize
    total = count(),
    successful = countif(success == true),
    failed = countif(success == false)
| extend
    availability_percent = round((successful * 100.0) / total, 2),
    downtime_minutes = round((failed / total) * 43800, 2)  // 43800 min in 30 days
| project
    availability_percent,
    slo_target = 99.9,
    slo_met = iff(availability_percent >= 99.9, "✅ YES", "❌ NO"),
    downtime_minutes,
    downtime_budget = 43.8,
    budget_remaining = round(43.8 - downtime_minutes, 2)
```

### 2. Latency SLO: p95 < 500ms, p99 < 1000ms

**Target**: 95th percentile under 500ms, 99th percentile under 1000ms

**Measurement**: API response time percentiles

**Query**:
```kusto
requests
| where timestamp > ago(1h)
| summarize
    p50 = round(percentile(duration, 50), 0),
    p95 = round(percentile(duration, 95), 0),
    p99 = round(percentile(duration, 99), 0),
    avg = round(avg(duration), 0),
    max = round(max(duration), 0),
    count = count()
| extend
    p95_met = iff(p95 <= 500, "✅ YES", "❌ NO"),
    p99_met = iff(p99 <= 1000, "✅ YES", "❌ NO")
| project
    p50, p95, p95_target = 500, p95_met,
    p99, p99_target = 1000, p99_met,
    avg, max, count
```

### 3. Error Rate SLO: < 1%

**Target**: Less than 1% of requests result in errors

**Measurement**: Failed requests / total requests

**Query**:
```kusto
requests
| where timestamp > ago(1h)
| summarize
    total = count(),
    errors = countif(success == false),
    http_5xx = countif(resultCode >= 500 and resultCode < 600),
    http_4xx = countif(resultCode >= 400 and resultCode < 500)
| extend
    error_rate = round((errors * 100.0) / total, 2),
    error_budget = 1.0,
    budget_remaining = round(1.0 - ((errors * 100.0) / total), 2)
| extend
    slo_met = iff(error_rate <= 1.0, "✅ YES", "❌ NO")
| project
    error_rate,
    error_budget,
    slo_met,
    budget_remaining,
    total_requests = total,
    total_errors = errors,
    http_5xx,
    http_4xx
```

## Dashboard Creation

### Step 1: Create Dashboard in Azure Portal

```bash
# Create resource group for monitoring (if not exists)
az group create \
  --name fleet-monitoring-rg \
  --location eastus

# The dashboard will be created through the Azure Portal UI
```

### Step 2: Add SLO Tiles

1. Navigate to Azure Portal > Dashboards
2. Create new dashboard: "Fleet Management - SLO Dashboard"
3. Add tiles for each SLO metric

### Dashboard JSON Template

Save this as `fleet-slo-dashboard.json`:

```json
{
  "lenses": {
    "0": {
      "order": 0,
      "parts": {
        "0": {
          "position": {
            "x": 0,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "ComponentId",
                "value": "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Insights/components/{app-insights-name}"
              },
              {
                "name": "Query",
                "value": "requests\n| where timestamp > ago(30d)\n| summarize total = count(), successful = countif(success == true)\n| extend availability = round((successful * 100.0) / total, 2)\n| project availability, target = 99.9, met = iff(availability >= 99.9, '✅', '❌')"
              },
              {
                "name": "TimeRange",
                "value": "P30D"
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "timestamp",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Average"
                }
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
          }
        }
      }
    }
  },
  "metadata": {
    "model": {
      "timeRange": {
        "value": {
          "relative": {
            "duration": 24,
            "timeUnit": 1
          }
        },
        "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
      }
    }
  }
}
```

## Kusto Queries for Dashboard Tiles

### Tile 1: Availability Over Time (30 Days)

```kusto
requests
| where timestamp > ago(30d)
| summarize
    total = count(),
    successful = countif(success == true)
    by bin(timestamp, 1h)
| extend availability = (successful * 100.0) / total
| project timestamp, availability, target = 99.9
| render timechart
```

### Tile 2: Current Availability Status

```kusto
requests
| where timestamp > ago(30d)
| summarize
    total = count(),
    successful = countif(success == true)
| extend
    availability = round((successful * 100.0) / total, 3),
    status = case(
        (successful * 100.0) / total >= 99.9, "✅ Healthy",
        (successful * 100.0) / total >= 99.0, "⚠️ Degraded",
        "❌ Critical"
    )
| project availability, target = 99.9, status
```

### Tile 3: Error Budget Burn Rate

```kusto
requests
| where timestamp > ago(30d)
| summarize total = count(), errors = countif(success == false) by bin(timestamp, 1d)
| extend daily_error_rate = (errors * 100.0) / total
| extend budget_burn = daily_error_rate * 100  // % of daily budget used
| project timestamp, budget_burn, threshold = 100
| render timechart
```

### Tile 4: Latency Percentiles (p50, p95, p99)

```kusto
requests
| where timestamp > ago(24h)
| summarize
    p50 = percentile(duration, 50),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99)
    by bin(timestamp, 5m)
| render timechart
```

### Tile 5: Error Rate Trend

```kusto
requests
| where timestamp > ago(24h)
| summarize
    total = count(),
    errors = countif(success == false)
    by bin(timestamp, 5m)
| extend error_rate = (errors * 100.0) / total
| project timestamp, error_rate, target = 1.0
| render timechart
```

### Tile 6: Request Volume

```kusto
requests
| where timestamp > ago(24h)
| summarize count() by bin(timestamp, 5m)
| render timechart
```

### Tile 7: Top Errors

```kusto
exceptions
| where timestamp > ago(24h)
| summarize count() by problemId, outerMessage
| order by count_ desc
| take 10
```

### Tile 8: Slowest Endpoints

```kusto
requests
| where timestamp > ago(24h)
| summarize p95_duration = percentile(duration, 95), count = count() by name
| order by p95_duration desc
| take 10
```

### Tile 9: Dependency Health

```kusto
dependencies
| where timestamp > ago(1h)
| summarize
    total = count(),
    failures = countif(success == false)
    by target
| extend failure_rate = round((failures * 100.0) / total, 2)
| project target, total, failures, failure_rate
| order by failure_rate desc
```

### Tile 10: User Impact

```kusto
requests
| where timestamp > ago(24h) and success == false
| summarize affected_users = dcount(user_Id), failed_requests = count()
| project affected_users, failed_requests
```

## Deployment Script

Save as `deploy-slo-dashboard.sh`:

```bash
#!/bin/bash

# Configuration
SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP="fleet-monitoring-rg"
APP_INSIGHTS_NAME="fleet-app-insights"
DASHBOARD_NAME="fleet-slo-dashboard"

# Set subscription
az account set --subscription $SUBSCRIPTION_ID

# Create dashboard
az portal dashboard create \
  --resource-group $RESOURCE_GROUP \
  --name $DASHBOARD_NAME \
  --input-path fleet-slo-dashboard.json \
  --location eastus

echo "✅ SLO Dashboard created successfully"
echo "📊 View at: https://portal.azure.com/#dashboard"
```

## Alerts Based on SLOs

### Create SLO Breach Alerts

```bash
# Alert when availability drops below 99.9%
az monitor metrics alert create \
  --name "SLO-Availability-Breach" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME" \
  --condition "avg requests/count < 99.9" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 1 \
  --description "Availability SLO breached (below 99.9%)"

# Alert when p95 latency exceeds 500ms
az monitor metrics alert create \
  --name "SLO-Latency-p95-Breach" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME" \
  --condition "avg requests/duration > 500" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --description "p95 latency SLO breached (above 500ms)"

# Alert when error rate exceeds 1%
az monitor metrics alert create \
  --name "SLO-ErrorRate-Breach" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME" \
  --condition "avg requests/failed > 1" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 1 \
  --description "Error rate SLO breached (above 1%)"
```

## Grafana Dashboard (Alternative)

If you prefer Grafana over Azure Dashboard:

### Install Grafana Plugin

```bash
# Install Azure Monitor plugin
grafana-cli plugins install grafana-azure-monitor-datasource
```

### Grafana Dashboard JSON

Save as `fleet-slo-grafana.json` and import into Grafana.

## Power BI Dashboard (Executive View)

For executive-level reporting:

1. Connect Power BI to Azure Log Analytics
2. Create visualizations using the SLO queries above
3. Schedule automatic refresh (daily)
4. Share with stakeholders

## Monitoring Best Practices

### 1. Error Budget Policy

**If error budget is exhausted:**
- Freeze all non-critical feature releases
- Focus 100% on reliability improvements
- Conduct incident review
- Implement preventive measures

**Error budget tracking:**
```kusto
// Calculate remaining error budget for the month
requests
| where timestamp > startofmonth(now())
| summarize
    total_requests = count(),
    failed_requests = countif(success == false)
| extend
    current_availability = round((total_requests - failed_requests) * 100.0 / total_requests, 3),
    target_availability = 99.9,
    error_budget_consumed = round((100 - current_availability) / (100 - target_availability) * 100, 1)
| project
    current_availability,
    target_availability,
    error_budget_consumed,
    budget_status = case(
        error_budget_consumed < 50, "✅ Healthy",
        error_budget_consumed < 90, "⚠️ Warning",
        "❌ Exhausted"
    )
```

### 2. SLO Review Cadence

- **Daily**: Check SLO dashboard during standup
- **Weekly**: Review trends and near-misses
- **Monthly**: Calculate SLO attainment and error budget
- **Quarterly**: Review and adjust SLO targets

### 3. SLI Data Quality

Ensure accurate SLI measurements:
- Validate telemetry completeness
- Check for sampling issues
- Verify clock synchronization
- Monitor data pipeline health

## Troubleshooting

### Dashboard Not Showing Data

```bash
# Verify Application Insights is receiving data
az monitor app-insights query \
  --app $APP_INSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --analytics-query "requests | summarize count() by bin(timestamp, 1h) | order by timestamp desc | take 24"
```

### Incorrect SLO Calculations

- Check time zone settings (use UTC)
- Verify query time ranges
- Ensure telemetry sampling is accounted for
- Validate data retention settings

## Additional Resources

- [Azure Monitor Best Practices](https://docs.microsoft.com/azure/azure-monitor/best-practices)
- [SRE Book - SLO Chapter](https://sre.google/sre-book/service-level-objectives/)
- [Implementing SLOs](https://sre.google/workbook/implementing-slos/)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-09
**Owner**: Operations Team
