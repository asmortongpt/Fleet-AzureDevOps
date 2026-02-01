'use client';

import { useEffect, useState, useCallback } from 'react';

import { APIError as ApiError } from "@/lib/api-client";

export interface UseApiDataState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Custom React hook for fetching data from the API with loading/error states
 *
 * @template T - The type of data to be fetched
 * @param fetchFn - Async function that returns a Promise with the data
 * @param options - Optional configuration
 * @returns Object with data, loading, error, and refetch function
 *
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useApiData<Incident[]>(() => api.get('/incidents'));
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorPanel error={error} onRetry={refetch} />;
 * if (!data) return <EmptyState />;
 *
 * return data.map(incident => <IncidentCard key={incident.id} incident={incident} />);
 * ```
 */
export function useApiData<T>(
  fetchFn: () => Promise<T>,
  options?: {
    /**
     * If true, automatically fetches data on mount
     * @default true
     */
    autoFetch?: boolean;
    /**
     * Dependencies array for refetching when values change
     * Similar to useEffect dependencies
     */
    dependencies?: any[];
    /**
     * Callback fired when data is successfully fetched
     */
    onSuccess?: (data: T) => void;
    /**
     * Callback fired when an error occurs
     */
    onError?: (error: ApiError) => void;
  }
): UseApiDataState<T> {
  const {
    autoFetch = true,
    dependencies = [],
    onSuccess,
    onError,
  } = options || {};

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const apiError = err instanceof ApiError
        ? err
        : new ApiError('An unexpected error occurred', 500);

      setError(apiError);
      setData(null);

      if (onError) {
        onError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onSuccess, onError]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Variant of useApiData that returns an array of states for multiple API calls
 * Useful when you need to fetch multiple endpoints in parallel
 *
 * @template T - The type of data to be fetched
 * @param fetchFns - Array of async functions that return Promises with data
 * @returns Array of state objects, one for each fetch function
 *
 * @example
 * ```typescript
 * const [incidentsState, assetsState] = useApiDataMultiple([
 *   () => api.get<Incident[]>('/incidents'),
 *   () => api.get<Asset[]>('/assets')
 * ]);
 *
 * if (incidentsState.loading || assetsState.loading) return <LoadingSpinner />;
 * ```
 */
export function useApiDataMultiple<T extends any[]>(
  fetchFns: { [K in keyof T]: () => Promise<T[K]> }
): { [K in keyof T]: UseApiDataState<T[K]> } {
  const states = fetchFns.map((fetchFn) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useApiData(fetchFn)
  );

  return states as { [K in keyof T]: UseApiDataState<T[K]> };
}

/**
 * Hook for paginated API data
 * Adds page, pageSize, and pagination controls to the base useApiData hook
 *
 * @template T - The type of data items
 * @param fetchFn - Function that accepts page and pageSize and returns paginated data
 * @param options - Configuration options
 * @returns State object with pagination controls
 *
 * @example
 * ```typescript
 * const { data, loading, error, page, setPage, pageSize, setPageSize, hasMore } =
 *   useApiDataPaginated<Incident>(
 *     (page, pageSize) => api.get(`/incidents?page=${page}&size=${pageSize}`)
 *   );
 * ```
 */
export function useApiDataPaginated<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  options?: {
    initialPage?: number;
    initialPageSize?: number;
    autoFetch?: boolean;
  }
) {
  const { initialPage = 1, initialPageSize = 20, autoFetch = true } = options || {};

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const { data, loading, error, refetch } = useApiData(
    () => fetchFn(page, pageSize),
    {
      autoFetch,
      dependencies: [page, pageSize],
    }
  );

  const hasMore = data ? data.items.length < data.total : false;
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const nextPage = useCallback(() => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((targetPage: number) => {
    setPage(Math.max(1, Math.min(targetPage, totalPages)));
  }, [totalPages]);

  return {
    data: data?.items || null,
    total: data?.total || 0,
    loading,
    error,
    refetch,
    page,
    setPage,
    pageSize,
    setPageSize,
    hasMore,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
  };
}
