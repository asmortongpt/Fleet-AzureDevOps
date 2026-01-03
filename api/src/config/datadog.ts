/**
 * Datadog APM Initialization
 *
 * IMPORTANT: This module must be imported FIRST before any other imports
 * in the application entry point (server.ts) to properly instrument all
 * dependencies.
 */

import tracer from 'dd-trace';

// Initialize Datadog tracer
tracer.init({
  // Service name for APM
  service: 'fleet-api',

  // Environment (production, staging, development)
  env: process.env.NODE_ENV || 'production',

  // Version for deployments tracking
  version: process.env.APP_VERSION || '1.0.0',

  // Datadog agent configuration
  hostname: process.env.DD_AGENT_HOST || 'datadog-agent.fleet-management.svc.cluster.local',
  port: Number(process.env.DD_TRACE_AGENT_PORT) || 8126,

  // Logging configuration
  logInjection: true, // Inject trace IDs into logs

  // Runtime metrics
  runtimeMetrics: true,

  // Profiling
  profiling: true,

  // Sampling rate (100% for production monitoring)
  sampleRate: 1.0,

  // Tags for filtering in Datadog
  tags: {
    'cluster': 'aks-fleet',
    'team': 'fleet-management',
    'component': 'backend-api',
  },

  // Plugin configuration
  plugins: true,

  // Distributed tracing
  propagationStyle: 'datadog,tracecontext',
});

// Export tracer for custom instrumentation
export default tracer;

console.log('Datadog APM initialized:', {
  service: 'fleet-api',
  env: process.env.NODE_ENV || 'production',
  agent: `${process.env.DD_AGENT_HOST || 'datadog-agent.fleet-management.svc.cluster.local'}:${process.env.DD_TRACE_AGENT_PORT || 8126}`,
});
