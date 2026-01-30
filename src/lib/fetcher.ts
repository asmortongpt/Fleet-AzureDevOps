/**
import logger from '@/utils/logger';
 * Production-Ready Data Fetcher
 * Unified fetcher with retry logic, error handling, and proper typing
 */

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public url: string
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

interface FetcherOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Exponential backoff delay calculation
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  const maxDelay = 10000; // 10 seconds max
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return delay + jitter;
}

/**
 * Check if error is retryable (network errors, 5xx, 429)
 */
function isRetryableError(error: unknown, status?: number): boolean {
  // Network errors (no response)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // HTTP errors that should be retried
  if (status) {
    return status === 429 || status === 503 || status === 504 || (status >= 500 && status < 600);
  }

  return false;
}

/**
 * Production-ready fetch with retry logic and error handling
 * @param url - API endpoint URL (can be relative or absolute)
 * @param options - Fetch options with retry configuration
 * @returns Promise<T> - Parsed JSON response
 */
export async function fetcher<T = unknown>(
  url: string,
  options: FetcherOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
  } = options;

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Include cookies for authentication
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  let lastError: Error | FetchError | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check for HTTP errors
      if (!response.ok) {
        const errorMessage = await response.text().catch(() => response.statusText);

        const error = new FetchError(
          errorMessage || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          url
        );

        // Check if we should retry
        if (attempt < retries && isRetryableError(error, response.status)) {
          lastError = error;
          const delay = calculateBackoffDelay(attempt, retryDelay);
          logger.warn(
            `[Fetcher] Retry ${attempt + 1}/${retries} for ${url} after ${delay}ms (status: ${response.status})`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }

      // Parse and return successful response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json() as T;
      }

      // Handle non-JSON responses
      const text = await response.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        // If it's not JSON, return as-is (cast to T)
        return text as unknown as T;
      }

    } catch (error) {
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeout}ms: ${url}`);
      } else if (error instanceof FetchError) {
        lastError = error;
      } else if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error(`Unknown error: ${String(error)}`);
      }

      // Check if we should retry
      if (attempt < retries && isRetryableError(lastError)) {
        const delay = calculateBackoffDelay(attempt, retryDelay);
        logger.warn(
          `[Fetcher] Retry ${attempt + 1}/${retries} for ${url} after ${delay}ms (error: ${lastError.message})`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // No more retries, throw the error
      throw lastError;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Unknown error occurred');
}

/**
 * Simple GET fetcher for SWR (compatible signature)
 */
export const swrFetcher = <T = unknown>(url: string): Promise<T> => {
  return fetcher<T>(url, { method: 'GET' });
};

/**
 * Fetcher with custom retry configuration
 */
export function createFetcher(defaultOptions: Partial<FetcherOptions> = {}) {
  return <T = unknown>(url: string, options: FetcherOptions = {}): Promise<T> => {
    return fetcher<T>(url, { ...defaultOptions, ...options });
  };
}

/**
 * Check if the API is reachable
 */
export async function checkAPIHealth(baseURL: string = ''): Promise<boolean> {
  try {
    const response = await fetcher<{ status: string }>(`${baseURL}/health`, {
      retries: 1,
      timeout: 5000,
    });
    return response.status === 'ok';
  } catch {
    return false;
  }
}
