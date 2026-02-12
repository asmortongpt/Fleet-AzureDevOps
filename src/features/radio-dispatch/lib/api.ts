// Stub for getSession - this module doesn't use next-auth in this React/Vite app
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSession = async (): Promise<{ accessToken?: string } | null> => null;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// CSRF Configuration
const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
let csrfToken: string | null = null;

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  timeout?: number;
  retries?: number;
  skipRetry?: boolean;
}

// Helper function to create timeout promise
function createTimeoutPromise(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new ApiError(408, 'Request timeout', 'TIMEOUT'));
    }, timeout);
  });
}

// Helper function to implement exponential backoff delay
function delay(attempt: number): Promise<void> {
  const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

// Helper function to determine if error is retryable
function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.status >= 500 && error.status < 600)
    );
  }
  return false;
}

class ApiClient {
  private baseUrl: string;
  private csrfInitialized: boolean = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Initialize CSRF token by fetching from API
   * This should be called when the application loads
   */
  async initializeCSRF(): Promise<void> {
    if (this.csrfInitialized) {
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/csrf-token`, {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        csrfToken = data.csrf_token;
        this.csrfInitialized = true;

        // Store token in sessionStorage as backup
        if (typeof window !== 'undefined' && csrfToken) {
          sessionStorage.setItem(CSRF_TOKEN_KEY, csrfToken);
        }
      }
    } catch (error) {
      console.error('[API] Error initializing CSRF token:', error);
    }
  }

  /**
   * Get CSRF token from memory or sessionStorage
   */
  private getCSRFToken(): string | null {
    if (csrfToken) {
      return csrfToken;
    }

    // Fallback to sessionStorage
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(CSRF_TOKEN_KEY);
    }

    return null;
  }

  /**
   * Refresh CSRF token (e.g., after authentication)
   */
  async refreshCSRFToken(): Promise<void> {
    this.csrfInitialized = false;
    csrfToken = null;
    await this.initializeCSRF();
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    return headers;
  }

  /**
   * Add CSRF token to headers for state-changing requests
   */
  private addCSRFHeader(headers: HeadersInit, method: string): HeadersInit {
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (protectedMethods.includes(method.toUpperCase())) {
      const token = this.getCSRFToken();
      if (token) {
        return {
          ...headers,
          [CSRF_HEADER_NAME]: token,
        };
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      requireAuth = true,
      headers: customHeaders,
      timeout = DEFAULT_TIMEOUT,
      retries = MAX_RETRIES,
      skipRetry = false,
      ...fetchOptions
    } = options;

    // Initialize CSRF token if not already done
    if (!this.csrfInitialized) {
      await this.initializeCSRF();
    }

    let headers = requireAuth
      ? { ...(await this.getAuthHeaders()), ...customHeaders }
      : { 'Content-Type': 'application/json', ...customHeaders };

    // Add CSRF token for state-changing requests
    const method = fetchOptions.method || 'GET';
    headers = this.addCSRFHeader(headers, method);

    const url = `${this.baseUrl}${endpoint}`;

    let lastError: Error | null = null;
    const maxAttempts = skipRetry ? 1 : retries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Add delay before retry (except first attempt)
        if (attempt > 0) {
          await delay(attempt - 1);
        }

        // Create fetch request with timeout
        const fetchPromise = fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include', // Include cookies (required for CSRF)
        });

        // Race between fetch and timeout
        const response = await Promise.race([
          fetchPromise,
          createTimeoutPromise(timeout),
        ]);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            detail: response.statusText,
          }));

          // Create specific error based on status code
          let errorMessage = errorData?.detail || 'Request failed';
          let errorCode = 'API_ERROR';

          if (response.status === 401) {
            errorMessage = 'Authentication required. Please sign in.';
            errorCode = 'UNAUTHORIZED';
          } else if (response.status === 403) {
            // Check if it's a CSRF error
            const detail = errorData?.detail || '';
            if (detail.toLowerCase().includes('csrf')) {
              errorMessage = 'Security validation failed. Please refresh the page.';
              errorCode = 'CSRF_ERROR';
              // Attempt to refresh CSRF token
              await this.refreshCSRFToken();
            } else {
              errorMessage = 'You do not have permission to perform this action.';
              errorCode = 'FORBIDDEN';
            }
          } else if (response.status === 404) {
            errorMessage = 'The requested resource was not found.';
            errorCode = 'NOT_FOUND';
          } else if (response.status === 429) {
            errorMessage = 'Too many requests. Please try again later.';
            errorCode = 'RATE_LIMIT';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
            errorCode = 'SERVER_ERROR';
          }

          throw new ApiError(response.status, errorMessage, errorCode);
        }

        // Parse JSON response
        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;

        // If it's the last attempt or error is not retryable, throw immediately
        if (attempt === maxAttempts - 1 || !isRetryableError(error)) {
          if (error instanceof ApiError) {
            throw error;
          }
          // Network error or other unexpected error
          throw new ApiError(
            0,
            'Network error. Please check your internet connection.',
            'NETWORK_ERROR'
          );
        }
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new ApiError(500, 'Unknown error occurred');
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Helper method to check error type
  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }

  isAuthError(): boolean {
    return this.code === 'UNAUTHORIZED' || this.code === 'FORBIDDEN';
  }

  isServerError(): boolean {
    return this.code === 'SERVER_ERROR' || (this.status >= 500 && this.status < 600);
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500 && !this.isAuthError();
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Type definitions for API responses
export interface Incident {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_to?: string;
  metadata?: Record<string, unknown>;
}

export interface Task {
  id: string;
  incident_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface Asset {
  id: string;
  organization_id: string;
  call_sign: string;
  asset_type: 'vehicle' | 'crew' | 'equipment';
  status: 'active' | 'inactive' | 'maintenance';
  location?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    altitude?: number;
  };
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Transmission {
  id: string;
  organization_id: string;
  channel: string;
  timestamp: string;
  duration: number;
  audio_url?: string;
  transcript?: string;
  confidence_score?: number;
  speaker_id?: string;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'dispatcher' | 'supervisor' | 'viewer';
  organization_id: string;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}
