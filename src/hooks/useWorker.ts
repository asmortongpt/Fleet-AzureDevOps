/**
 * useWorker Hook
 *
 * Custom React hook for using Web Workers with TypeScript support
 *
 * Features:
 * - Type-safe worker communication
 * - Automatic cleanup
 * - Loading states
 * - Error handling
 * - Promise-based API
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WorkerMessage<T = any> {
  id: string;
  action: string;
  data: T;
}

export interface WorkerResponse<R = any> {
  id: string;
  action: string;
  result?: R;
  error?: string;
}

export interface UseWorkerOptions {
  /**
   * Terminate worker on unmount
   * @default true
   */
  terminateOnUnmount?: boolean;

  /**
   * Maximum number of concurrent messages
   * @default 10
   */
  maxConcurrent?: number;

  /**
   * Timeout for worker responses (ms)
   * @default 30000
   */
  timeout?: number;
}

export interface UseWorkerReturn<T, R> {
  /**
   * Execute an action in the worker
   */
  execute: (action: string, data: T) => Promise<R>;

  /**
   * Whether a worker action is in progress
   */
  loading: boolean;

  /**
   * Latest error from worker
   */
  error: Error | null;

  /**
   * Latest result from worker
   */
  result: R | null;

  /**
   * Terminate the worker
   */
  terminate: () => void;

  /**
   * Check if worker is ready
   */
  isReady: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useWorker<T = any, R = any>(
  workerPath: string,
  options: UseWorkerOptions = {}
): UseWorkerReturn<T, R> {
  const {
    terminateOnUnmount = true,
    maxConcurrent = 10,
    timeout = 30000,
  } = options;

  const workerRef = useRef<Worker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<R | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Track pending requests
  const pendingRequests = useRef<Map<string, {
    resolve: (value: R) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
  }>>(new Map());

  // Active request count
  const activeCount = useRef(0);

  // Initialize worker
  useEffect(() => {
    try {
      // Create worker from URL
      workerRef.current = new Worker(
        new URL(workerPath, import.meta.url),
        { type: 'module' }
      );

      // Handle messages from worker
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse<R>>) => {
        const { id, result: workerResult, error: workerError } = event.data;

        const pending = pendingRequests.current.get(id);
        if (!pending) {
          logger.warn('[useWorker] Received response for unknown request:', id);
          return;
        }

        // Clear timeout
        clearTimeout(pending.timeoutId);

        // Remove from pending
        pendingRequests.current.delete(id);
        activeCount.current--;

        // Update loading state
        if (activeCount.current === 0) {
          setLoading(false);
        }

        if (workerError) {
          const error = new Error(workerError);
          setError(error);
          setResult(null);
          pending.reject(error);
        } else {
          setError(null);
          setResult(workerResult as R);
          pending.resolve(workerResult as R);
        }
      };

      // Handle worker errors
      workerRef.current.onerror = (event) => {
        const error = new Error(event.message || 'Worker error');
        logger.error('[useWorker] Worker error:', error);
        setError(error);
        setLoading(false);

        // Reject all pending requests
        pendingRequests.current.forEach((pending) => {
          clearTimeout(pending.timeoutId);
          pending.reject(error);
        });
        pendingRequests.current.clear();
        activeCount.current = 0;
      };

      // Worker is ready
      setIsReady(true);
      logger.info('[useWorker] Worker initialized:', workerPath);

      return () => {
        if (terminateOnUnmount && workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
          setIsReady(false);
          logger.info('[useWorker] Worker terminated');
        }
      };
    } catch (error) {
      logger.error('[useWorker] Failed to create worker:', error);
      setError(error as Error);
      setIsReady(false);
    }
  }, [workerPath, terminateOnUnmount]);

  /**
   * Execute an action in the worker
   */
  const execute = useCallback(
    (action: string, data: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        if (!isReady) {
          reject(new Error('Worker not ready'));
          return;
        }

        // Check concurrent limit
        if (activeCount.current >= maxConcurrent) {
          reject(new Error(`Maximum concurrent requests (${maxConcurrent}) reached`));
          return;
        }

        // Generate unique ID
        const id = `${action}-${Date.now()}-${Math.random()}`;

        // Create timeout
        const timeoutId = setTimeout(() => {
          pendingRequests.current.delete(id);
          activeCount.current--;

          if (activeCount.current === 0) {
            setLoading(false);
          }

          reject(new Error(`Worker timeout after ${timeout}ms`));
        }, timeout);

        // Store pending request
        pendingRequests.current.set(id, {
          resolve,
          reject,
          timeoutId,
        });

        // Update state
        activeCount.current++;
        setLoading(true);
        setError(null);

        // Send message to worker
        const message: WorkerMessage<T> = { id, action, data };
        workerRef.current.postMessage(message);
      });
    },
    [isReady, maxConcurrent, timeout]
  );

  /**
   * Terminate the worker
   */
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
      setLoading(false);

      // Reject all pending requests
      const error = new Error('Worker terminated');
      pendingRequests.current.forEach((pending) => {
        clearTimeout(pending.timeoutId);
        pending.reject(error);
      });
      pendingRequests.current.clear();
      activeCount.current = 0;

      logger.info('[useWorker] Worker manually terminated');
    }
  }, []);

  return {
    execute,
    loading,
    error,
    result,
    terminate,
    isReady,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for the data processor worker
 */
export function useDataProcessorWorker() {
  return useWorker('../workers/data-processor.worker.ts');
}

/**
 * Hook with automatic retries
 */
export function useWorkerWithRetry<T = any, R = any>(
  workerPath: string,
  options: UseWorkerOptions & { maxRetries?: number } = {}
) {
  const { maxRetries = 3, ...workerOptions } = options;
  const worker = useWorker<T, R>(workerPath, workerOptions);

  const executeWithRetry = useCallback(
    async (action: string, data: T, retryCount = 0): Promise<R> => {
      try {
        return await worker.execute(action, data);
      } catch (error) {
        if (retryCount < maxRetries) {
          logger.info(`[useWorker] Retrying (${retryCount + 1}/${maxRetries})...`);
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
          return executeWithRetry(action, data, retryCount + 1);
        }
        throw error;
      }
    },
    [worker, maxRetries]
  );

  return {
    ...worker,
    execute: executeWithRetry,
  };
}

/**
 * Hook for batching multiple worker requests
 */
export function useWorkerBatch<T = any, R = any>(
  workerPath: string,
  options: UseWorkerOptions = {}
) {
  const worker = useWorker<T, R>(workerPath, options);

  const executeBatch = useCallback(
    async (requests: Array<{ action: string; data: T }>): Promise<R[]> => {
      const promises = requests.map((req) => worker.execute(req.action, req.data));
      return Promise.all(promises);
    },
    [worker]
  );

  return {
    ...worker,
    executeBatch,
  };
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
import { useDataProcessorWorker } from '@/hooks/useWorker';
import logger from '@/utils/logger';

function MyComponent() {
  const { execute, loading, result, error } = useDataProcessorWorker();

  const handleProcess = async () => {
    try {
      const analytics = await execute('calculateAnalytics', {
        vehicles: [...],
      });
      logger.info('Analytics:', analytics);
    } catch (error) {
      logger.error('Processing failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleProcess} disabled={loading}>
        {loading ? 'Processing...' : 'Process Data'}
      </button>
      {error && <div>Error: {error.message}</div>}
      {result && <div>Result: {JSON.stringify(result)}</div>}
    </div>
  );
}
*/

export default useWorker;
