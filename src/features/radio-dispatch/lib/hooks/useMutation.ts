'use client';

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';

/**
 * State interface for mutation operations
 */
export interface UseMutationState<TData, TVariables> {
  data: TData | null;
  loading: boolean;
  error: ApiError | null;
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

/**
 * Options for useMutation hook
 */
interface UseMutationOptions<TData, TVariables> {
  /**
   * Callback fired when mutation succeeds
   */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;

  /**
   * Callback fired when mutation fails
   */
  onError?: (error: ApiError, variables: TVariables) => void;

  /**
   * Callback fired when mutation completes (success or error)
   */
  onSettled?: (data: TData | null, error: ApiError | null, variables: TVariables) => void;
}

/**
 * Custom hook for mutations (POST, PUT, PATCH, DELETE)
 *
 * Automatically handles CSRF tokens through the API client.
 *
 * @template TData - The type of data returned by the mutation
 * @template TVariables - The type of variables passed to the mutation
 * @param mutationFn - Async function that performs the mutation
 * @param options - Configuration options
 * @returns Mutation state and mutate function
 *
 * @example
 * ```typescript
 * // Creating an incident
 * const createIncident = useMutation<Incident, CreateIncidentInput>(
 *   (data) => api.post('/api/incidents', data),
 *   {
 *     onSuccess: (incident) => {
 *       console.log('Incident created:', incident.id);
 *       refetchIncidents();
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   }
 * );
 *
 * // Usage in component
 * const handleSubmit = async (formData) => {
 *   await createIncident.mutate(formData);
 * };
 *
 * if (createIncident.loading) return <Spinner />;
 * ```
 */
export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TVariables>
): UseMutationState<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setLoading(true);
      setError(null);

      try {
        // The mutationFn uses api.post/put/patch/delete which automatically
        // includes CSRF tokens in headers for state-changing requests
        const result = await mutationFn(variables);
        setData(result);

        // Call success callback
        if (options?.onSuccess) {
          await options.onSuccess(result, variables);
        }

        // Call settled callback
        if (options?.onSettled) {
          options.onSettled(result, null, variables);
        }

        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError(500, 'An unexpected error occurred');

        setError(apiError);
        setData(null);

        // Call error callback
        if (options?.onError) {
          options.onError(apiError, variables);
        }

        // Call settled callback
        if (options?.onSettled) {
          options.onSettled(null, apiError, variables);
        }

        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
}

/**
 * Optimistic update helper for mutations
 *
 * @example
 * ```typescript
 * const updateIncident = useMutation(
 *   (data) => api.put(`/api/incidents/${data.id}`, data),
 *   {
 *     onSuccess: (updated) => {
 *       // Optimistically update local state
 *       setIncidents(incidents =>
 *         incidents.map(inc => inc.id === updated.id ? updated : inc)
 *       );
 *     }
 *   }
 * );
 * ```
 */
export function useOptimisticMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TVariables> & {
    /**
     * Function to optimistically update local state before mutation completes
     */
    onMutate?: (variables: TVariables) => void | Promise<void>;
  }
): UseMutationState<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setLoading(true);
      setError(null);

      try {
        // Call onMutate for optimistic updates
        if (options?.onMutate) {
          await options.onMutate(variables);
        }

        const result = await mutationFn(variables);
        setData(result);

        if (options?.onSuccess) {
          await options.onSuccess(result, variables);
        }

        if (options?.onSettled) {
          options.onSettled(result, null, variables);
        }

        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError(500, 'An unexpected error occurred');

        setError(apiError);
        setData(null);

        if (options?.onError) {
          options.onError(apiError, variables);
        }

        if (options?.onSettled) {
          options.onSettled(null, apiError, variables);
        }

        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
}
