# Query Performance Monitoring

This document describes the comprehensive query performance monitoring system implemented for the Fleet Management API.

## Overview

The query performance monitoring system provides:

- **Automatic query timing and tracking**
- **Slow query detection and logging**
- **N+1 query detection**
- **OpenTelemetry distributed tracing**
- **Application Insights integration**
- **Performance metrics and analytics**
- **Real-time monitoring APIs**

## Architecture

### Components

```
┌─────────────────┐
│  Application    │
│     Code        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  database.ts    │
│  Query Utils    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ query-monitor   │
│   Wrapper       │
└───┬─────────┬───┘
    │         │
    │         └──────────────────┐
    │                            │
    ▼                            ▼
┌─────────────────┐    ┌──────────────────┐
│  OpenTelemetry  │    │  Application     │
│   Tracing       │    │    Insights      │
└─────────────────┘    └──────────────────┘
```

### Query Monitoring Flow

1. **Query Execution**: All queries go through `monitoredQuery()` wrapper
2. **Performance Tracking**: Start time, end time, duration calculated
3. **Analysis**:
   - Slow query detection (> 500ms default)
   - N+1 query pattern detection
   - Error tracking
4. **Telemetry**:
   - OpenTelemetry span creation
   - Application Insights metrics
   - Custom events for slow queries
5. **Statistics**: Aggregate stats by query pattern

## Features

### 1. Automatic Query Monitoring

All database queries are automatically monitored via the updated `database.ts` utilities:

```typescript
import { query } from './utils/database';

// Automatically monitored
const result = await query('SELECT * FROM vehicles WHERE id = $1', [vehicleId]);
```

### 2. Slow Query Detection

Queries exceeding the threshold (default 500ms) are automatically logged:

```javascript
console.warn('🐌 SLOW QUERY DETECTED:', {
  query: 'SELECT * FROM ...',
  duration: 1234,
  threshold: 500,
  rowCount: 100,
  stackTrace: '...'
});
```

Slow queries are also sent to Application Insights as custom events:
- Event name: `SlowQueryDetected`
- Includes query text, duration, row count
- Metric: `Database.SlowQuery.Duration`

### 3. N+1 Query Detection

The system automatically detects potential N+1 query patterns:

```javascript
// Detects if same query pattern executed > 5 times in 1 second
console.warn('⚠️  POTENTIAL N+1 QUERY:', {
  query: 'SELECT * FROM ...',
  duration: 456,
  stackTrace: '...'
});
```

N+1 events are tracked in Application Insights:
- Event name: `NPlusOneQueryDetected`

### 4. OpenTelemetry Integration

Every query creates an OpenTelemetry span with attributes:

```javascript
span.setAttribute('db.system', 'postgresql');
span.setAttribute('db.statement', query);
span.setAttribute('db.operation', 'SELECT');
span.setAttribute('db.row_count', rowCount);
span.setAttribute('db.duration_ms', duration);
span.setAttribute('db.slow_query', true);  // If slow
span.setAttribute('db.n_plus_one', true);  // If N+1 detected
```

### 5. Application Insights Metrics

The following metrics are exported to Application Insights:

| Metric Name | Description |
|-------------|-------------|
| `Database.Query.Duration` | Individual query execution time |
| `Database.Queries.Total` | Total number of queries |
| `Database.Queries.Slow` | Number of slow queries |
| `Database.Queries.Errors` | Number of failed queries |
| `Database.Queries.SlowRate` | Percentage of slow queries |
| `Database.Queries.ErrorRate` | Percentage of failed queries |

### 6. Performance Statistics

The `QueryMonitor` class maintains statistics for each query pattern:

```typescript
interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  errorQueries: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
}
```

## API Endpoints

### GET /api/monitoring/query-performance/stats
Get overall query performance statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "query": {
      "totalQueries": 1234,
      "slowQueries": 45,
      "errorQueries": 3,
      "slowQueryRate": 3.65,
      "errorRate": 0.24,
      "avgDuration": 123.45
    },
    "database": {
      "totalConnections": 20,
      "idleConnections": 15,
      "waitingClients": 0
    },
    "pools": { /* Pool statistics */ }
  }
}
```

### GET /api/monitoring/query-performance/slow-queries
Get recent slow queries.

**Query Parameters:**
- `limit` (optional): Number of queries to return (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "queries": [
      {
        "query": "SELECT * FROM ...",
        "duration": 1234,
        "rowCount": 100,
        "stackTrace": "..."
      }
    ],
    "count": 5
  }
}
```

### GET /api/monitoring/query-performance/top-slow
Get top slowest queries by average duration.

**Query Parameters:**
- `limit` (optional): Number of queries to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "queries": [
      {
        "query": "SELECT * FROM ...",
        "stats": {
          "totalQueries": 100,
          "slowQueries": 80,
          "avgDuration": 1234,
          "maxDuration": 5000,
          "minDuration": 500
        }
      }
    ]
  }
}
```

### GET /api/monitoring/query-performance/frequency
Get most frequently executed queries.

**Query Parameters:**
- `limit` (optional): Number of queries to return (default: 10)

### GET /api/monitoring/query-performance/errors
Get queries with errors and their error rates.

### GET /api/monitoring/query-performance/health
Get database health status.

### GET /api/monitoring/query-performance/summary
Get comprehensive performance summary including top slow queries, frequent queries, and errors.

### POST /api/monitoring/query-performance/reset
Reset query performance statistics.

## Configuration

Add these environment variables to your `.env` file:

```bash
# Slow query threshold in milliseconds
SLOW_QUERY_THRESHOLD_MS=500

# Enable logging of all queries (development only)
LOG_ALL_QUERIES=false

# Enable N+1 query detection
DETECT_N_PLUS_ONE=true

# Database health check interval
DB_HEALTH_CHECK_INTERVAL=60000

# OpenTelemetry configuration
OTEL_SERVICE_NAME=fleet-management-api
API_VERSION=1.0.0

# Application Insights (already configured)
APPLICATIONINSIGHTS_CONNECTION_STRING=...
```

## Azure Application Insights Dashboard

See `docs/query-performance-dashboard.md` for complete Kusto queries to create dashboards.

### Quick Setup

1. Open Azure Portal → Application Insights → Logs
2. Run the following queries to verify data:

```kusto
// Check for slow query events
customEvents
| where name == "SlowQueryDetected"
| take 10

// Check query metrics
customMetrics
| where name startswith "Database."
| take 10

// Check dependencies
dependencies
| where type == "postgresql"
| take 10
```

### Recommended Dashboards

1. **Performance Overview**
   - Total queries over time
   - Slow query rate
   - Error rate

2. **Slow Query Analysis**
   - Top 10 slowest queries
   - Recent slow queries
   - Duration percentiles

3. **N+1 Detection**
   - N+1 query events
   - Patterns over time

4. **Error Analysis**
   - Queries with errors
   - Error rates by query

## Alerts

Set up alerts in Application Insights:

### High Slow Query Rate
- **Metric**: `Database.Queries.SlowRate`
- **Condition**: Greater than 10%
- **Time**: Average over 5 minutes
- **Action**: Email/SMS notification

### High Error Rate
- **Metric**: `Database.Queries.ErrorRate`
- **Condition**: Greater than 5%
- **Time**: Average over 5 minutes
- **Action**: Email/SMS notification

### Individual Slow Query
- **Metric**: `Database.Query.Duration`
- **Condition**: Greater than 5000ms
- **Time**: Maximum over 5 minutes
- **Action**: Log for investigation

### N+1 Detection
- **Event**: `NPlusOneQueryDetected`
- **Condition**: More than 5 events in 5 minutes
- **Action**: Developer notification

## Performance Baseline

### Establishing Baseline

Run queries over 7 days to establish performance baseline:

```kusto
customMetrics
| where name == "Database.Query.Duration"
| where timestamp > ago(7d)
| extend query = tostring(customDimensions.query)
| summarize
    BaselineAvg = avg(value),
    BaselineP95 = percentile(value, 95),
    BaselineP99 = percentile(value, 99)
    by query
```

### Detecting Degradation

Compare current performance to baseline:

```kusto
let baseline = customMetrics
| where timestamp between(ago(7d) .. ago(1d))
| summarize BaselineAvg = avg(value) by query;
customMetrics
| where timestamp > ago(1h)
| summarize CurrentAvg = avg(value) by query
| join (baseline) on query
| where CurrentAvg > BaselineAvg * 1.5  // 50% slower
```

## Best Practices

### 1. Development
- Enable `LOG_ALL_QUERIES=true` for debugging
- Monitor N+1 query warnings
- Fix slow queries before production

### 2. Production
- Keep `LOG_ALL_QUERIES=false`
- Monitor Application Insights dashboards daily
- Set up alerts for slow query rate > 10%
- Review slow queries weekly

### 3. Optimization Workflow
1. Identify slow queries via dashboard
2. Analyze query execution plan
3. Add indexes or optimize query
4. Verify improvement in metrics
5. Document optimization

### 4. N+1 Query Prevention
- Use eager loading with JOINs
- Batch queries when possible
- Use DataLoader pattern for GraphQL
- Monitor N+1 detection events

### 5. Monitoring
- Review weekly performance reports
- Track performance trends
- Compare against baseline
- Investigate degradations immediately

## Troubleshooting

### No Data in Application Insights

1. Verify `APPLICATIONINSIGHTS_CONNECTION_STRING` is set
2. Check Application Insights is initialized:
   ```typescript
   import * as appInsights from 'applicationinsights';
   console.log(appInsights.defaultClient ? 'Connected' : 'Not connected');
   ```
3. Check network connectivity to Azure

### High Slow Query Rate

1. Check recent slow queries: `GET /api/monitoring/query-performance/slow-queries`
2. Review top slow queries: `GET /api/monitoring/query-performance/top-slow`
3. Analyze query patterns
4. Add database indexes
5. Optimize queries

### N+1 Queries Detected

1. Review N+1 events in Application Insights
2. Check stack traces to identify source
3. Refactor to use JOINs or batch loading
4. Verify fix with monitoring

### Memory Issues

If query monitoring uses too much memory:
1. Reduce `maxSlowQueriesHistory` (default 100)
2. Reset stats more frequently
3. Monitor statistics collection

## Performance Impact

The query monitoring system is designed to have minimal overhead:

- **Per-query overhead**: < 1ms (timing and logging)
- **Memory**: ~100KB for statistics storage
- **Network**: Metrics batched to Application Insights every 60 seconds
- **Production impact**: Negligible (< 0.1% performance impact)

## Integration with Existing Code

All existing code using `database.ts` utilities automatically gets monitoring:

```typescript
// All these are automatically monitored:
import { query, queryOne, queryMany, transaction } from './utils/database';

// No code changes needed!
const vehicles = await queryMany('SELECT * FROM vehicles');
const vehicle = await queryOne('SELECT * FROM vehicles WHERE id = $1', [id]);
await transaction(async (client) => {
  // Transaction queries also monitored
  await clientQuery(client, 'INSERT INTO ...', [...]);
});
```

## Future Enhancements

Potential improvements:
- Query execution plan analysis
- Automatic index recommendations
- Performance regression testing
- Query caching recommendations
- Real-time alerting webhooks
- Machine learning for anomaly detection

## Support

For questions or issues:
1. Check Application Insights logs
2. Review API endpoint responses
3. Check query statistics: `GET /api/monitoring/query-performance/stats`
4. Consult this documentation
5. Contact DevOps team

## References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Application Insights Kusto Query Language](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [N+1 Query Problem](https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-object-relational-mapping)
