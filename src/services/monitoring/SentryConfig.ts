// Sentry Error Tracking & Performance Monitoring

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'production',
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    tracePropagationTargets: ['fleet.capitaltechalliance.com', /^\/api\//],

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of errors

    // Release tracking
    release: process.env.VITE_APP_VERSION || 'unknown',

    // Ignore specific errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],

    beforeSend(event, hint) {
      // Filter out low-severity errors
      if (event.level === 'warning' || event.level === 'info') {
        return null;
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        fleet: {
          tenantId: (window as any).__TENANT_ID__,
          userId: (window as any).__USER_ID__,
        },
      };

      return event;
    },
  });
}

// Error boundary for React
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Performance transaction helpers
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

export function captureException(error: Error, context?: any) {
  Sentry.captureException(error, {
    contexts: { custom: context },
  });
}
