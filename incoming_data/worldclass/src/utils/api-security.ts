/**
 * Security Headers for API Calls
 * Frontend Security - Task 6/8
 * Fortune 50 Security Standards
 */

import { getAuthToken } from './secure-storage';

/**
 * Get secure headers for API requests
 * @param includeAuth - Include authentication token
 * @param customHeaders - Additional custom headers
 * @returns Headers object with security headers
 */
export function getSecureHeaders(
  includeAuth: boolean = true,
  customHeaders: Record<string, string> = {}
): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    ...customHeaders,
  };

  // Add authentication token if requested
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Add CSRF token if available
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

/**
 * Get CSRF token from meta tag or cookie
 * @returns CSRF token or null
 */
function getCsrfToken(): string | null {
  // Try meta tag first (server-rendered)
  const metaTag = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
  if (metaTag?.content) {
    return metaTag.content;
  }

  // Fallback to cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Secure fetch wrapper with automatic security headers
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Fetch response promise
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Validate URL
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL');
  }

  // Ensure HTTPS in production
  if (import.meta.env.PROD && !url.startsWith('https://') && !url.startsWith('/')) {
    throw new Error('HTTPS required in production');
  }

  // Merge secure headers
  const secureHeaders = getSecureHeaders();
  const mergedHeaders = {
    ...secureHeaders,
    ...options.headers,
  };

  // Make request
  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
    credentials: 'same-origin', // Send cookies only to same origin
  });

  // Check for authentication errors
  if (response.status === 401 || response.status === 403) {
    // Trigger auth refresh or redirect
    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: response }));
  }

  return response;
}

/**
 * Secure API client with retry logic and error handling
 */
export class SecureApiClient {
  private baseUrl: string;
  private maxRetries: number;

  constructor(baseUrl: string = '/api', maxRetries: number = 3) {
    this.baseUrl = baseUrl;
    this.maxRetries = maxRetries;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(`${this.baseUrl}${endpoint}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(`${this.baseUrl}${endpoint}`, { method: 'DELETE' });
  }

  private async request<T>(url: string, options: RequestInit, retries: number = 0): Promise<T> {
    try {
      const response = await secureFetch(url, options);

      if (!response.ok) {
        if (response.status >= 500 && retries < this.maxRetries) {
          // Retry on server errors
          await this.delay(Math.pow(2, retries) * 1000);
          return this.request<T>(url, options, retries + 1);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retries < this.maxRetries && this.isNetworkError(error)) {
        await this.delay(Math.pow(2, retries) * 1000);
        return this.request<T>(url, options, retries + 1);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isNetworkError(error: any): boolean {
    return error instanceof TypeError && error.message === 'Failed to fetch';
  }
}
