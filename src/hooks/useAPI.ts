/**
 * useAPI Hook - React hook for API calls with loading states
 *
 * Created: 2025-12-31 (Agent 8)
 */

import { useState, useCallback } from 'react';

import { APIClientError } from '@/lib/api-client';

export interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface APIHook<T> extends APIState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for managing API calls with loading and error states
 */
export function useAPI<T>(
  apiFunction: (...args: any[]) => Promise<any>
): APIHook<T> {
  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await apiFunction(...args);
        const data = response.data;

        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof APIClientError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'Unknown error occurred';

        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
