# Fleet Management System - Observability & Distributed Tracing

## Overview

The Fleet Management API is fully instrumented with **OpenTelemetry** for distributed tracing, providing deep insights into:
- Request flows across microservices
- Database query performance
- External API call latencies
- Error tracking and debugging
- Performance bottlenecks

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌───────────────┐
│   Client    │─────▶│  Fleet API   │─────▶│  PostgreSQL   │
│  (Browser)  │      │ (Instrumented)│      │   Database    │
└─────────────┘      └───────┬──────┘      └───────────────┘
                             │
                             │ Traces
                             ▼
                     ┌───────────────┐
                     │ Azure App     │
                     │ Insights  OR  │
                     │ Jaeger/Tempo  │
                     └───────────────┘
```

## Features

### Automatic Instrumentation

The API automatically instruments:

1. **HTTP Requests** - All incoming and outgoing HTTP calls
   - Request duration
   - Status codes
   - Headers (user-agent, IP)
   - Route information

2. **Database Queries** - PostgreSQL operations via `pg` library
   - Query text (sanitized)
   - Execution time
   - Connection pool metrics
   - Transaction tracking

3. **Express Middleware** - Full request lifecycle
   - Route matching
   - Middleware execution order
   - Error handling

4. **Redis Operations** (if using Redis caching)
   - Cache hits/misses
   - Command execution time

### Manual Instrumentation

For business logic, use the provided helpers:

\`\`\`typescript
import { traceAsync, tracer } from './config/telemetry';

// Method 1: Trace an async function
async function processVehicleData(vehicleId: string) {
  return await traceAsync('process-vehicle-data', async () => {
    const vehicle = await db.query('SELECT * FROM vehicles WHERE id = $1', [vehicleId]);
    // ... processing logic
    return vehicle;
  }, {
    'vehicle.id': vehicleId,
    'operation.type': 'data-processing'
  });
}

// Method 2: Manual span creation
async function complexOperation() {
  const span = tracer.startSpan('complex-operation');

  try {
    span.setAttribute('custom.attribute', 'value');

    // Do work
    const result = await doSomething();

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}
\`\`\`

## Configuration

### Environment Variables

\`\`\`bash
# Service identification
OTEL_SERVICE_NAME=fleet-management-api
API_VERSION=1.0.0
NODE_ENV=production

# Azure Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=<key>;IngestionEndpoint=https://<region>.in.applicationinsights.azure.com/

# OR generic OTLP endpoint (Jaeger, Tempo, etc.)
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger-collector:4318/v1/traces
\`\`\`

### Azure Application Insights Setup

1. **Create Application Insights Resource**:
   \`\`\`bash
   az monitor app-insights component create \\
     --app fleet-management-api \\
     --location eastus2 \\
     --resource-group fleet-production-rg \\
     --workspace /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.OperationalInsights/workspaces/<workspace>
   \`\`\`

2. **Get Connection String**:
   \`\`\`bash
   az monitor app-insights component show \\
     --app fleet-management-api \\
     --resource-group fleet-production-rg \\
     --query connectionString -o tsv
   \`\`\`

3. **Configure in Kubernetes**:
   \`\`\`bash
   kubectl create secret generic fleet-api-secrets \\
     --from-literal=APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>" \\
     -n fleet-management
   \`\`\`

### Jaeger (Alternative)

For local development or self-hosted tracing:

1. **Run Jaeger**:
   \`\`\`bash
   docker run -d --name jaeger \\
     -p 16686:16686 \\
     -p 4318:4318 \\
     jaegertracing/all-in-one:latest
   \`\`\`

2. **Configure API**:
   \`\`\`bash
   export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
   \`\`\`

3. **View traces**: http://localhost:16686

## Viewing Traces

### Azure Application Insights

1. Navigate to Azure Portal → Application Insights → fleet-management-api

2. **Transaction Search**:
   - Click "Transaction search"
   - Filter by time range, operation name, or result code

3. **Application Map**:
   - Click "Application map"
   - Visualize dependencies and latencies

4. **Performance**:
   - Click "Performance"
   - See operation duration percentiles
   - Identify slow operations

5. **Failures**:
   - Click "Failures"
   - See error rates by operation
   - Drill into failed traces

### KQL Queries

Example queries for Azure Monitor:

\`\`\`kusto
// Find slow database queries
dependencies
| where type == "SQL"
| where duration > 1000  // > 1 second
| project timestamp, name, duration, resultCode, customDimensions
| order by duration desc

// Track login attempts
requests
| where name contains "POST /api/auth/login"
| summarize count(), avg(duration) by resultCode
| order by count_ desc

// Error rate over time
requests
| where timestamp > ago(24h)
| summarize Total = count(), Failed = countif(success == false) by bin(timestamp, 5m)
| extend ErrorRate = (Failed * 100.0) / Total
| render timechart

// Top 10 slowest operations
requests
| where timestamp > ago(1h)
| top 10 by duration desc
| project timestamp, name, duration, resultCode, url
\`\`\`

## Trace Attributes

### Standard Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `http.method` | HTTP method | GET, POST |
| `http.route` | Route template | /api/vehicles/:id |
| `http.status_code` | Response status | 200, 404, 500 |
| `http.url` | Full URL | /api/vehicles?page=1 |
| `http.user_agent` | Client user agent | Mozilla/5.0... |
| `db.statement` | SQL query | SELECT * FROM vehicles |
| `db.name` | Database name | fleetdb |

### Custom Attributes

| Attribute | Description |
|-----------|-------------|
| `user.id` | Authenticated user ID |
| `user.role` | User role (admin, driver, etc.) |
| `tenant.id` | Multi-tenant ID |
| `vehicle.id` | Vehicle identifier |
| `operation.type` | Business operation type |

## Performance Impact

OpenTelemetry adds minimal overhead:

- **Latency**: ~0.1-0.5ms per traced operation
- **CPU**: < 2% additional CPU usage
- **Memory**: ~20MB for SDK
- **Network**: Batch export every 5s (configurable)

## Sampling (Production)

For high-traffic production environments, enable sampling:

\`\`\`typescript
// In telemetry.ts
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

const sdk = new NodeSDK({
  // ... other config
  sampler: new TraceIdRatioBasedSampler(0.1), // Sample 10% of traces
});
\`\`\`

## Troubleshooting

### No traces appearing

1. **Check exporter config**:
   \`\`\`bash
   kubectl logs deployment/fleet-api -n fleet-management | grep -i opentelemetry
   \`\`\`

2. **Verify network connectivity**:
   \`\`\`bash
   kubectl exec deployment/fleet-api -n fleet-management -- \\
     wget -O- http://jaeger-collector:4318/v1/traces
   \`\`\`

3. **Check Application Insights connection**:
   - Verify connection string is valid
   - Ensure ingestion endpoint is reachable

### High cardinality warnings

If you see warnings about high cardinality:

- Don't use user IDs or transaction IDs in **span names**
- Put them in **attributes** instead
- Use sampling in production

### Traces incomplete

- Check if async operations are completing
- Verify all await statements are present
- Use `span.end()` in finally blocks

## Integration with Other Tools

### Metrics (Future)

Combine with Prometheus for metrics:

\`\`\`typescript
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const prometheusExporter = new PrometheusExporter({
  port: 9464,
});

// Add to SDK
\`\`\`

### Logs (Structured Logging)

Correlate logs with traces using Winston:

\`\`\`typescript
import winston from 'winston';
import { context, trace } from '@opentelemetry/api';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => {
      const span = trace.getSpan(context.active());
      const traceId = span?.spanContext().traceId || 'no-trace';
      const spanId = span?.spanContext().spanId || 'no-span';

      return JSON.stringify({
        ...info,
        traceId,
        spanId,
      });
    })
  ),
  transports: [new winston.transports.Console()],
});
\`\`\`

## Best Practices

1. **Meaningful Span Names**: Use operation type, not IDs
   - Good: `get-vehicle`, `update-work-order`
   - Bad: `get-vehicle-123`, `update-wo-abc-456`

2. **Add Context**: Include relevant business context in attributes
   \`\`\`typescript
   span.setAttribute('vehicle.type', 'electric');
   span.setAttribute('work_order.priority', 'high');
   \`\`\`

3. **Record Exceptions**: Always record exceptions in spans
   \`\`\`typescript
   try {
     // operation
   } catch (error) {
     span.recordException(error);
     throw error;
   }
   \`\`\`

4. **Measure What Matters**: Focus on user-facing operations
   - API endpoints
   - Database queries
   - External service calls
   - Not internal utility functions

5. **Use Sampling Wisely**:
   - Development: 100% sampling
   - Staging: 50% sampling
   - Production: 10-20% sampling (depending on traffic)

## Monitoring Checklist

- [ ] Traces visible in Azure Application Insights / Jaeger
- [ ] Database queries showing execution time
- [ ] HTTP requests traced end-to-end
- [ ] Error traces include full stack traces
- [ ] P95 latency under SLA (< 500ms)
- [ ] Alerts configured for error rate spikes
- [ ] Weekly performance review using trace data

## Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Azure Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)
