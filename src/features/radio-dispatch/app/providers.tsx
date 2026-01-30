'use client';

import { SessionProvider } from 'next-auth/react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider, ToastViewport } from '@/components/common/Toast';
import { useCSRFProtection } from '@/lib/use-csrf';
import logger from '@/utils/logger';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize CSRF protection when app loads
  useCSRFProtection();

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Application Error:', error);
      logger.error('Error Info:', errorInfo);
    }

    // In production, you could send to error tracking service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <SessionProvider>
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
