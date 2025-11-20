# Query Performance Monitoring Dashboard

This document contains Kusto queries for Azure Application Insights to create comprehensive query performance dashboards.

## Overview Metrics

### Total Queries Over Time
```kusto
customMetrics
| where name == "Database.Queries.Total"
| summarize TotalQueries = sum(value) by bin(timestamp, 5m)
| render timechart
```

### Slow Query Rate
```kusto
customMetrics
| where name == "Database.Queries.SlowRate"
| summarize SlowQueryRate = avg(value) by bin(timestamp, 5m)
| render timechart
```

### Error Rate
```kusto
customMetrics
| where name == "Database.Queries.ErrorRate"
| summarize ErrorRate = avg(value) by bin(timestamp, 5m)
| render timechart
```

## Top 10 Slowest Queries

### By Average Duration
```kusto
customMetrics
| where name == "Database.Query.Duration"
| extend query = tostring(customDimensions.query)
| summarize
    AvgDuration = avg(value),
    MaxDuration = max(value),
    MinDuration = min(value),
    QueryCount = count()
    by query
| where AvgDuration > 500  // Only queries slower than 500ms
| top 10 by AvgDuration desc
| project query, AvgDuration, MaxDuration, MinDuration, QueryCount
```

### Slow Query Events
```kusto
customEvents
| where name == "SlowQueryDetected"
| extend
    query = tostring(customDimensions.query),
    duration = todouble(customDimensions.duration),
    rowCount = toint(customDimensions.rowCount)
| summarize
    Count = count(),
    AvgDuration = avg(duration),
    MaxDuration = max(duration)
    by query
| top 10 by Count desc
| project query, Count, AvgDuration, MaxDuration
```

### Slow Queries in Last Hour
```kusto
customEvents
| where name == "SlowQueryDetected"
| where timestamp > ago(1h)
| extend
    query = tostring(customDimensions.query),
    duration = todouble(customDimensions.duration),
    threshold = todouble(customDimensions.threshold),
    rowCount = toint(customDimensions.rowCount)
| project timestamp, query, duration, threshold, rowCount
| order by duration desc
```

## Query Frequency Analysis

### Most Frequently Executed Queries
```kusto
customMetrics
| where name == "Database.Query.Duration"
| extend query = tostring(customDimensions.query)
| summarize
    ExecutionCount = count(),
    AvgDuration = avg(value)
    by query
| top 10 by ExecutionCount desc
| project query, ExecutionCount, AvgDuration
```

### Query Execution by Operation Type
```kusto
customMetrics
| where name == "Database.Query.Duration"
| extend operation = tostring(customDimensions.operation)
| summarize
    Count = count(),
    AvgDuration = avg(value)
    by operation
| render columnchart
```

## N+1 Query Detection

### N+1 Query Events
```kusto
customEvents
| where name == "NPlusOneQueryDetected"
| extend
    query = tostring(customDimensions.query),
    duration = todouble(customDimensions.duration)
| summarize Count = count() by query
| top 10 by Count desc
| project query, NPlusOneOccurrences = Count
```

### N+1 Queries Over Time
```kusto
customEvents
| where name == "NPlusOneQueryDetected"
| summarize NPlusOneCount = count() by bin(timestamp, 5m)
| render timechart
```

## Database Dependencies

### Query Dependencies Performance
```kusto
dependencies
| where type == "postgresql"
| extend query = name
| summarize
    Count = count(),
    AvgDuration = avg(duration),
    SuccessRate = avg(todouble(success)) * 100
    by query
| top 20 by Count desc
| project query, Count, AvgDuration, SuccessRate
```

### Failed Database Dependencies
```kusto
dependencies
| where type == "postgresql"
| where success == false
| extend query = name
| summarize FailureCount = count() by query
| top 10 by FailureCount desc
```

## Performance Percentiles

### Query Duration Percentiles
```kusto
customMetrics
| where name == "Database.Query.Duration"
| summarize
    p50 = percentile(value, 50),
    p75 = percentile(value, 75),
    p90 = percentile(value, 90),
    p95 = percentile(value, 95),
    p99 = percentile(value, 99)
    by bin(timestamp, 5m)
| render timechart
```

### Query Duration Distribution
```kusto
customMetrics
| where name == "Database.Query.Duration"
| summarize count() by bin(value, 100)
| render columnchart
```

## Error Analysis

### Query Errors Over Time
```kusto
exceptions
| where customDimensions.query != ""
| extend query = tostring(customDimensions.query)
| summarize ErrorCount = count() by bin(timestamp, 5m), query
| render timechart
```

### Top Queries by Error Count
```kusto
exceptions
| where customDimensions.query != ""
| extend query = tostring(customDimensions.query)
| summarize
    ErrorCount = count(),
    UniqueErrors = dcount(problemId)
    by query
| top 10 by ErrorCount desc
```

## Connection Pool Health

### Active Connections Over Time
```kusto
customMetrics
| where name == "Database.Queries.Total"
| summarize TotalQueries = sum(value) by bin(timestamp, 1m)
| render timechart
```

## Alerting Queries

### High Slow Query Rate Alert
```kusto
customMetrics
| where name == "Database.Queries.SlowRate"
| where timestamp > ago(5m)
| summarize AvgSlowRate = avg(value)
| where AvgSlowRate > 10  // Alert if more than 10% of queries are slow
```

### Query Error Rate Alert
```kusto
customMetrics
| where name == "Database.Queries.ErrorRate"
| where timestamp > ago(5m)
| summarize AvgErrorRate = avg(value)
| where AvgErrorRate > 5  // Alert if more than 5% of queries fail
```

### Individual Query Performance Alert
```kusto
customMetrics
| where name == "Database.Query.Duration"
| where value > 5000  // Alert on queries taking more than 5 seconds
| extend query = tostring(customDimensions.query)
| project timestamp, query, duration = value
```

## Performance Baseline

### Establish Baseline Performance
```kusto
customMetrics
| where name == "Database.Query.Duration"
| where timestamp > ago(7d)
| extend query = tostring(customDimensions.query)
| summarize
    BaselineAvg = avg(value),
    BaselineP95 = percentile(value, 95),
    BaselineP99 = percentile(value, 99),
    TotalExecutions = count()
    by query
| where TotalExecutions > 100  // Only queries executed frequently
| project query, BaselineAvg, BaselineP95, BaselineP99, TotalExecutions
```

### Detect Performance Degradation
```kusto
let baseline = customMetrics
| where name == "Database.Query.Duration"
| where timestamp between(ago(7d) .. ago(1d))
| extend query = tostring(customDimensions.query)
| summarize BaselineAvg = avg(value) by query;
customMetrics
| where name == "Database.Query.Duration"
| where timestamp > ago(1h)
| extend query = tostring(customDimensions.query)
| summarize CurrentAvg = avg(value) by query
| join kind=inner (baseline) on query
| extend PerformanceDegradation = (CurrentAvg - BaselineAvg) / BaselineAvg * 100
| where PerformanceDegradation > 50  // Alert if 50% slower than baseline
| project query, BaselineAvg, CurrentAvg, PerformanceDegradation
| order by PerformanceDegradation desc
```

## Dashboard Layout Recommendations

### 1. Overview Dashboard
- Total Queries Over Time (timechart)
- Slow Query Rate (timechart)
- Error Rate (timechart)
- Performance Summary (scorecard)

### 2. Slow Query Analysis Dashboard
- Top 10 Slowest Queries (table)
- Slow Query Events (timechart)
- Query Duration Percentiles (timechart)
- Recent Slow Queries (table)

### 3. Query Frequency Dashboard
- Most Frequently Executed Queries (table)
- Query Execution by Operation Type (columnchart)
- Query Frequency Heatmap (timechart)

### 4. Error Analysis Dashboard
- Top Queries by Error Count (table)
- Query Errors Over Time (timechart)
- Failed Database Dependencies (table)

### 5. N+1 Detection Dashboard
- N+1 Query Events (table)
- N+1 Queries Over Time (timechart)
- Potential N+1 Patterns (table)

### 6. Performance Health Dashboard
- Query Duration Distribution (histogram)
- Performance Baseline vs Current (comparison)
- Active Connections (timechart)
- Database Health Status (scorecard)

## Alert Rules Setup

1. **Slow Query Rate Alert**
   - Metric: `Database.Queries.SlowRate`
   - Condition: Greater than 10%
   - Time aggregation: Average over 5 minutes
   - Severity: Warning

2. **Error Rate Alert**
   - Metric: `Database.Queries.ErrorRate`
   - Condition: Greater than 5%
   - Time aggregation: Average over 5 minutes
   - Severity: Error

3. **Individual Slow Query Alert**
   - Metric: `Database.Query.Duration`
   - Condition: Greater than 5000ms
   - Time aggregation: Maximum over 5 minutes
   - Severity: Warning

4. **N+1 Query Detection Alert**
   - Event: `NPlusOneQueryDetected`
   - Condition: More than 5 events in 5 minutes
   - Severity: Warning

5. **Performance Degradation Alert**
   - Custom query comparing baseline vs current
   - Condition: More than 50% slower than 7-day baseline
   - Time aggregation: 1 hour
   - Severity: Warning
