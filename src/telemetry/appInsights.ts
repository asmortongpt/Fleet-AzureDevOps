/**
 * Azure Application Insights - STUB IMPLEMENTATION
 *
 * DISABLED: ApplicationInsights SDK is incompatible with React 19
 * Error: "Cannot set properties of undefined (setting 'Activity')"
 *
 * This file re-exports stubs from the main index to maintain backwards compatibility.
 */

export {
  SeverityLevel,
  initializeAppInsights,
  getAppInsights,
  setAuthenticatedUser,
  clearAuthenticatedUser,
  trackPageView,
  trackEvent,
  trackException,
  trackTrace,
  trackMetric,
  startOperation,
  flushTelemetry,
  isTelemetryEnabled,
} from './index';

export type {
  TelemetryConfig,
  AuthenticatedUser,
  IExceptionTelemetry,
  IPageViewTelemetry,
  ITraceTelemetry,
  IMetricTelemetry,
  IEventTelemetry,
} from './index';

// NOTE: waitForAppInsights is no longer needed since telemetry is disabled
export async function waitForAppInsights(): Promise<null> {
  return null;
}
