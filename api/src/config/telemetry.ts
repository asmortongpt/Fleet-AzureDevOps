/**
 * OpenTelemetry Configuration
 *
 * Configures distributed tracing for the Fleet Management API
 * Exports traces to Azure Application Insights or any OTLP-compatible backend
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { detectResources, defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// Configuration
const serviceName = process.env.OTEL_SERVICE_NAME || 'fleet-management-api';
const serviceVersion = process.env.API_VERSION || '1.0.0';
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
const environment = process.env.NODE_ENV || 'development';

// Azure Application Insights Connection String
// Format: InstrumentationKey=<key>;IngestionEndpoint=https://<region>.in.applicationinsights.azure.com/
const azureConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

// Create trace exporter
let traceExporter: OTLPTraceExporter;

if (azureConnectionString) {
  // Extract ingestion endpoint from connection string
  const match = azureConnectionString.match(/IngestionEndpoint=([^;]+)/);
  const ingestionEndpoint = match ? `${match[1]}v2.1/track` : otlpEndpoint;

  traceExporter = new OTLPTraceExporter({
    url: ingestionEndpoint,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('OpenTelemetry: Configured for Azure Application Insights');
} else {
  // Use generic OTLP endpoint (Jaeger, Tempo, etc.)
  traceExporter = new OTLPTraceExporter({
    url: otlpEndpoint,
  });

  console.log(`OpenTelemetry: Configured for OTLP endpoint: ${otlpEndpoint}`);
}

// Create resource with service information
const resource = defaultResource().merge(
  resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': environment,
    'service.namespace': 'fleet-management',
  })
);

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Automatically instrument common libraries
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (request: any) => {
          // Don't trace health checks
          return request.url?.includes('/health') || false;
        },
        requestHook: (span: any, request: any) => {
          // Add custom attributes
          if (request.headers) {
            span.setAttribute('http.user_agent', request.headers['user-agent'] || 'unknown');
            span.setAttribute('http.client_ip', request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown');
          }
        },
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
        requestHook: (span, requestInfo) => {
          // Add route information
          if (requestInfo.route) {
            span.setAttribute('http.route', requestInfo.route);
          }
        },
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
        enhancedDatabaseReporting: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
    }),
  ],
});

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down successfully'))
    .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
    .finally(() => process.exit(0));
});

export default sdk;

/**
 * Custom span creation helper
 * Use this to create manual spans for business logic
 */
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

export const tracer = trace.getTracer(serviceName, serviceVersion);

/**
 * Decorator to automatically trace async functions
 *
 * Usage:
 * @traced('operation-name')
 * async function myFunction() { ... }
 */
export function traced(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return tracer.startActiveSpan(name, async (span) => {
        try {
          const result = await originalMethod.apply(this, args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error: any) {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          throw error;
        } finally {
          span.end();
        }
      });
    };

    return descriptor;
  };
}

/**
 * Helper to trace an async operation
 *
 * Usage:
 * await traceAsync('database-query', async () => {
 *   return await db.query(...);
 * });
 */
export async function traceAsync<T>(
  spanName: string,
  operation: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return tracer.startActiveSpan(spanName, async (span) => {
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }

    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
