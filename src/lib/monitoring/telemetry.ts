/**
 * OpenTelemetry Integration
 * Comprehensive observability with distributed tracing and metrics
 *
 * @module monitoring/telemetry
 */

import React from 'react';

// Define OpenTelemetry-compatible types locally to avoid dependency on @opentelemetry/api
export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

// Span interface for type safety
interface Span {
  setAttributes(attributes: Record<string, unknown>): void;
  setAttribute(key: string, value: unknown): void;
  setStatus(status: { code: SpanStatusCode; message?: string }): void;
  addEvent(name: string, attributes?: Record<string, unknown>): void;
  recordException(error: Error): void;
  end(): void;
}

// Stub implementations for when @opentelemetry/api is not available
const trace = {
  getTracer: (_name: string, _version?: string) => ({
    startSpan: () => null,
    startActiveSpan: <T>(_name: string, _options: unknown, fn: (span: unknown) => T) => fn(null),
  }),
  getActiveSpan: (): Span | null => null,
};

const context = {};

/**
 * Telemetry Configuration
 */
export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  endpoint?: string;
  enabled: boolean;
  sampleRate: number;
}

/**
 * Default Telemetry Configuration
 */
const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  serviceName: 'fleet-management-frontend',
  serviceVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE,
  endpoint: import.meta.env.VITE_OTEL_EXPORTER_URL || 'http://localhost:4318/v1/traces',
  enabled: !!import.meta.env.VITE_OTEL_EXPORTER_URL,
  sampleRate: import.meta.env.PROD ? 0.1 : 1.0,
};

/**
 * Telemetry Service
 */
class TelemetryService {
  private config: TelemetryConfig;
  private tracer: any;
  private initialized: boolean = false;

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = { ...DEFAULT_TELEMETRY_CONFIG, ...config };
  }

  /**
   * Initialize OpenTelemetry
   * Note: Full initialization requires OpenTelemetry SDK packages
   * This is a simplified version for the frontend
   */
  init(): void {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Get tracer
      this.tracer = trace.getTracer(
        this.config.serviceName,
        this.config.serviceVersion
      );

      this.initialized = true;
    } catch (error) {
      console.error('[Telemetry] Failed to initialize:', error);
    }
  }

  /**
   * Create a new span
   */
  startSpan(
    name: string,
    options?: {
      kind?: SpanKind;
      attributes?: Record<string, any>;
    }
  ): any {
    if (!this.initialized || !this.tracer) {
      return null;
    }

    try {
      return this.tracer.startSpan(name, {
        kind: options?.kind || SpanKind.INTERNAL,
        attributes: options?.attributes,
      });
    } catch (error) {
      console.error('[Telemetry] Failed to start span:', error);
      return null;
    }
  }

  /**
   * Start an active span
   */
  startActiveSpan<T>(
    name: string,
    fn: (span: any) => T,
    options?: {
      kind?: SpanKind;
      attributes?: Record<string, any>;
    }
  ): T {
    if (!this.initialized || !this.tracer) {
      return fn(null);
    }

    try {
      return this.tracer.startActiveSpan(
        name,
        {
          kind: options?.kind || SpanKind.INTERNAL,
          attributes: options?.attributes,
        },
        fn
      );
    } catch (error) {
      console.error('[Telemetry] Failed to start active span:', error);
      return fn(null);
    }
  }

  /**
   * Trace an async function
   */
  async traceAsync<T>(
    name: string,
    fn: () => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    if (!this.initialized || !this.tracer) {
      return fn();
    }

    return this.startActiveSpan(
      name,
      async (span) => {
        if (attributes && span) {
          span.setAttributes(attributes);
        }

        try {
          const result = await fn();

          if (span) {
            span.setStatus({ code: SpanStatusCode.OK });
          }

          return result;
        } catch (error) {
          if (span) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error instanceof Error ? error.message : 'Unknown error',
            });
            span.recordException(error as Error);
          }
          throw error;
        } finally {
          if (span) {
            span.end();
          }
        }
      },
      {
        kind: SpanKind.INTERNAL,
        attributes,
      }
    );
  }

  /**
   * Trace a synchronous function
   */
  traceSync<T>(
    name: string,
    fn: () => T,
    attributes?: Record<string, any>
  ): T {
    if (!this.initialized || !this.tracer) {
      return fn();
    }

    return this.startActiveSpan(
      name,
      (span) => {
        if (attributes && span) {
          span.setAttributes(attributes);
        }

        try {
          const result = fn();

          if (span) {
            span.setStatus({ code: SpanStatusCode.OK });
          }

          return result;
        } catch (error) {
          if (span) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error instanceof Error ? error.message : 'Unknown error',
            });
            span.recordException(error as Error);
          }
          throw error;
        } finally {
          if (span) {
            span.end();
          }
        }
      },
      {
        kind: SpanKind.INTERNAL,
        attributes,
      }
    );
  }

  /**
   * Trace HTTP requests
   */
  async traceHTTPRequest<T>(
    method: string,
    url: string,
    fn: () => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const spanAttributes = {
      'http.method': method,
      'http.url': url,
      ...attributes,
    };

    return this.traceAsync(
      `HTTP ${method} ${url}`,
      fn,
      spanAttributes
    );
  }

  /**
   * Trace component renders (React)
   */
  traceComponentRender(
    componentName: string,
    props?: Record<string, any>
  ): () => void {
    const span = this.startSpan(`Render: ${componentName}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'component.name': componentName,
        'component.props': props ? JSON.stringify(props) : undefined,
      },
    });

    return () => {
      if (span) {
        span.end();
      }
    };
  }

  /**
   * Trace database operations
   */
  async traceDatabaseOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const spanAttributes = {
      'db.operation': operation,
      'db.table': table,
      ...attributes,
    };

    return this.traceAsync(
      `DB ${operation} ${table}`,
      fn,
      spanAttributes
    );
  }

  /**
   * Add event to current span
   */
  addEvent(name: string, attributes?: Record<string, any>): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Set attribute on current span
   */
  setAttribute(key: string, value: any): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute(key, value);
    }
  }

  /**
   * Set attributes on current span
   */
  setAttributes(attributes: Record<string, any>): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Record exception on current span
   */
  recordException(error: Error): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Check if telemetry is enabled
   */
  isEnabled(): boolean {
    return this.initialized;
  }
}

/**
 * Global telemetry instance
 */
export const telemetry = new TelemetryService();

/**
 * Initialize telemetry
 */
export function initTelemetry(config?: Partial<TelemetryConfig>): void {
  telemetry.init();
}

/**
 * Trace decorator for methods
 */
export function Trace(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = spanName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return telemetry.traceAsync(
        name,
        () => originalMethod.apply(this, args),
        {
          'method.name': propertyKey,
          'method.args': JSON.stringify(args).substring(0, 100),
        }
      );
    };

    return descriptor;
  };
}

/**
 * Trace HTTP fetch requests
 */
export function traceFetch(
  fetch: typeof window.fetch
): typeof window.fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();
    const method = init?.method || 'GET';

    return telemetry.traceHTTPRequest(
      method,
      url,
      async () => {
        const response = await fetch(input, init);

        // Record response status
        telemetry.setAttributes({
          'http.status_code': response.status,
          'http.status_text': response.statusText,
        });

        return response;
      },
      {
        'http.request_content_length': init?.body?.toString().length,
      }
    );
  };
}

/**
 * Performance observer for automatic instrumentation
 */
export function startPerformanceObserver(): void {
  if (!('PerformanceObserver' in window)) {
    return;
  }

  // Observe navigation timing
  const navObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;

        telemetry.traceSync(
          'Page Load',
          () => {
            telemetry.setAttributes({
              'navigation.type': navEntry.type,
              'navigation.redirectCount': navEntry.redirectCount,
              'timing.dns': navEntry.domainLookupEnd - navEntry.domainLookupStart,
              'timing.tcp': navEntry.connectEnd - navEntry.connectStart,
              'timing.request': navEntry.responseStart - navEntry.requestStart,
              'timing.response': navEntry.responseEnd - navEntry.responseStart,
              'timing.dom': navEntry.domComplete - navEntry.domInteractive,
            });
          },
          {
            'entry.type': 'navigation',
          }
        );
      }
    }
  });

  navObserver.observe({ entryTypes: ['navigation'] });

  // Observe resource timing
  const resObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        const resEntry = entry as PerformanceResourceTiming;

        // Only trace slow resources
        if (resEntry.duration > 1000) {
          telemetry.addEvent('Slow Resource', {
            'resource.name': resEntry.name,
            'resource.type': resEntry.initiatorType,
            'resource.duration': resEntry.duration,
            'resource.size': resEntry.transferSize,
          });
        }
      }
    }
  });

  resObserver.observe({ entryTypes: ['resource'] });
}

/**
 * React hook for tracing component renders
 */
export function useTraceRender(componentName: string, props?: any): void {
  React.useEffect(() => {
    const endTrace = telemetry.traceComponentRender(componentName, props);
    return endTrace;
  });
}

/**
 * Export telemetry utilities
 */
export {
  trace,
  context,
};

/**
 * Metrics collection (basic implementation)
 */
export class Metrics {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Record a metric value
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    const key = tags
      ? `${name}:${JSON.stringify(tags)}`
      : name;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metricValues = this.metrics.get(key);
    if (metricValues) {
      metricValues.push(value);
    }

    // Send to telemetry
    telemetry.addEvent(`metric.${name}`, {
      value,
      ...tags,
    });
  }

  /**
   * Get metric statistics
   */
  getStats(name: string, tags?: Record<string, string>): {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
  } | null {
    const key = tags
      ? `${name}:${JSON.stringify(tags)}`
      : name;

    const values = this.metrics.get(key);
    if (!values || values.length === 0) {
      return null;
    }

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      sum: values.reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

export const metrics = new Metrics();
