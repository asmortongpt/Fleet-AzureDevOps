/**
 * Sentry Error Tracking - Re-exports from real implementation
 *
 * This module provides backward-compatible exports wrapping the full
 * @sentry/react implementation at @/lib/monitoring/sentry.
 */

import * as Sentry from '@sentry/react';

import {
  initSentry,
  captureException,
  captureMessage,
  setUserContext,
} from './monitoring/sentry';

export { initSentry, captureException, captureMessage };

/**
 * Set user context (backward-compatible alias)
 */
export const setUser = setUserContext;

/**
 * Add breadcrumb - accepts both object form and individual params
 */
export function addBreadcrumb(
  messageOrBreadcrumb:
    | string
    | {
        message?: string;
        category?: string;
        level?: string;
        data?: Record<string, unknown>;
      },
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, unknown>
): void {
  if (typeof messageOrBreadcrumb === 'object') {
    Sentry.addBreadcrumb({
      message: messageOrBreadcrumb.message,
      category: messageOrBreadcrumb.category,
      level: messageOrBreadcrumb.level as Sentry.SeverityLevel,
      data: messageOrBreadcrumb.data,
    });
  } else {
    Sentry.addBreadcrumb({
      message: messageOrBreadcrumb,
      category,
      level,
      data,
    });
  }
}

/**
 * Show Sentry user feedback dialog
 */
export function showFeedbackWidget(): void {
  try {
    Sentry.showReportDialog();
  } catch {
    // Feedback widget not available
  }
}

/**
 * Log error to Sentry (backward-compatible alias)
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  captureException(error, context);
}

/**
 * Start a performance transaction (legacy alias)
 */
export function startTransaction(context: { name: string; op?: string }) {
  return Sentry.startInactiveSpan({
    name: context.name,
    op: context.op,
  });
}

/**
 * Get current scope (replaces deprecated getCurrentHub)
 */
export function getCurrentHub() {
  const scope = Sentry.getCurrentScope();
  return {
    getScope: () => scope,
  };
}
