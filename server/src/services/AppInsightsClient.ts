/**
 * Application Insights Client Service
 * Centralized telemetry tracking for Azure Application Insights
 */

import * as appInsights from 'applicationinsights';

let appInsightsClient: appInsights.TelemetryClient | null = null;

// Initialize Application Insights if connection string is provided
const connectionString = process.env.APPLICATION_INSIGHTS_CONNECTION_STRING ||
                         process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

if (connectionString) {
  appInsights.setup(connectionString)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .setAutoCollectPreAggregatedMetrics(true)
    .setSendLiveMetrics(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start();

  appInsightsClient = appInsights.defaultClient;
  appInsightsClient.context.tags[appInsightsClient.context.keys.cloudRole] = 'fleet-api';

  console.log('✅ Application Insights client initialized');
} else {
  console.warn('⚠️ Application Insights not configured');
}

/**
 * Get the Application Insights client instance
 */
export function getAppInsightsClient(): appInsights.TelemetryClient | null {
  return appInsightsClient;
}

/**
 * Track custom event
 */
export function trackEvent(name: string, properties?: Record<string, any>): void {
  if (appInsightsClient) {
    appInsightsClient.trackEvent({ name, properties });
  }
}

/**
 * Track custom metric
 */
export function trackMetric(name: string, value: number, properties?: Record<string, any>): void {
  if (appInsightsClient) {
    appInsightsClient.trackMetric({ name, value, properties });
  }
}

/**
 * Track exception
 */
export function trackException(
  error: Error,
  properties?: Record<string, any>,
  severity?: appInsights.Contracts.SeverityLevel
): void {
  if (appInsightsClient) {
    appInsightsClient.trackException({
      exception: error,
      properties,
      severity: severity || appInsights.Contracts.SeverityLevel.Error
    });
  }
}

/**
 * Track dependency call
 */
export function trackDependency(
  target: string,
  name: string,
  duration: number,
  success: boolean,
  resultCode?: number
): void {
  if (appInsightsClient) {
    appInsightsClient.trackDependency({
      target,
      name,
      duration,
      success,
      resultCode: resultCode || 0,
      dependencyTypeName: 'HTTP'
    });
  }
}

/**
 * Track trace/log message
 */
export function trackTrace(
  message: string,
  severity?: appInsights.Contracts.SeverityLevel,
  properties?: Record<string, any>
): void {
  if (appInsightsClient) {
    appInsightsClient.trackTrace({
      message,
      severity: severity || appInsights.Contracts.SeverityLevel.Information,
      properties
    });
  }
}

/**
 * Flush all pending telemetry
 */
export async function flush(): Promise<void> {
  return new Promise((resolve) => {
    if (appInsightsClient) {
      appInsightsClient.flush({ callback: () => resolve() });
    } else {
      resolve();
    }
  });
}

// Export the client instance
export { appInsightsClient };
export default appInsightsClient;
