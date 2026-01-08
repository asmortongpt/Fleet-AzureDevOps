'use client';

import { useEffect } from 'react';

import { ErrorFallback } from '@/components/ErrorFallback';

/**
 * Error boundary for the incidents route
 * Next.js automatically wraps this in an error boundary
 *
 * This provides route-level error handling specific to incidents
 */
export default function IncidentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Incidents route error:', error);
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      errorInfo={{ componentStack: error.stack || '' } as any}
      onReset={reset}
    />
  );
}
