// Azure Application Insights Integration

import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const reactPlugin = new ReactPlugin();

export const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.VITE_APPINSIGHTS_CONNECTION_STRING || '',
    enableAutoRouteTracking: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    enableCorsCorrelation: true,
    enableAjaxErrorStatusText: true,
    disableFetchTracking: false,
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: {
        history: undefined, // Will be set in app initialization
      },
    },
  },
});

export function initAppInsights(history: any) {
  // Configure history in the extension config before loading
  appInsights.config.extensionConfig = {
    ...appInsights.config.extensionConfig,
    [reactPlugin.identifier]: { history },
  };

  appInsights.loadAppInsights();

  // Track custom properties
  appInsights.addTelemetryInitializer((envelope) => {
    envelope.data = envelope.data || {};
    envelope.data.tenantId = (window as any).__TENANT_ID__;
    envelope.data.userId = (window as any).__USER_ID__;
    envelope.data.appVersion = process.env.VITE_APP_VERSION;
  });
}

// Custom event tracking
export function trackEvent(name: string, properties?: any) {
  appInsights.trackEvent({ name }, properties);
}

// Custom metric tracking
export function trackMetric(name: string, value: number) {
  appInsights.trackMetric({ name, average: value });
}

// Track page views
export function trackPageView(name: string, uri?: string) {
  appInsights.trackPageView({ name, uri });
}

// Track exceptions
export function trackException(error: Error, severityLevel?: number) {
  appInsights.trackException({ exception: error, severityLevel });
}

export { reactPlugin };
