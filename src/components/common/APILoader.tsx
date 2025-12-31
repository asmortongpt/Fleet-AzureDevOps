/**
 * APILoader Component - Display loading, error, and data states
 *
 * Created: 2025-12-31 (Agent 8)
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface APILoaderProps<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  loadingMessage?: string;
  children: (data: T) => React.ReactNode;
}

/**
 * Component to handle API loading, error, and success states
 */
export function APILoader<T>({
  loading,
  error,
  data,
  loadingMessage = 'Loading...',
  children,
}: APILoaderProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No data available to display.</AlertDescription>
      </Alert>
    );
  }

  return <>{children(data)}</>;
}
