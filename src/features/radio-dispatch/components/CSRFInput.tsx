'use client';

import { useEffect, useState } from 'react';

/**
 * Fetches CSRF token from the server
 * Returns the token string or null if unavailable
 */
async function fetchCsrfToken(): Promise<string | null> {
  // Skip CSRF token in development mock mode
  if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
    return null;
  }

  const baseURL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/api$/, '');

  try {
    // Try primary endpoint first
    let response = await fetch(`${baseURL}/api/v1/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    });

    // Fallback to alternate endpoint if primary fails
    if (!response.ok) {
      response = await fetch(`${baseURL}/api/csrf`, {
        method: 'GET',
        credentials: 'include',
      });
    }

    if (response.ok) {
      const data = await response.json();
      return data.csrfToken || data.token || null;
    }
  } catch {
    // Silently fail - CSRF token may not be required in all environments
  }

  return null;
}

/**
 * CSRFInput Component
 *
 * Hidden input field that includes CSRF token in form submissions.
 * This component ensures CSRF protection for traditional HTML form submissions.
 *
 * Usage:
 * ```tsx
 * <form method="POST" action="/api/submit">
 *   <CSRFInput />
 *   <input name="data" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * Note: For API calls using fetch/axios, use the api client which
 * automatically includes CSRF tokens in headers.
 */
export function CSRFInput() {
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    // Fetch CSRF token directly from the server
    fetchCsrfToken().then((token) => {
      if (token) {
        setCsrfToken(token);
      }
    });
  }, []);

  if (!csrfToken) {
    // Don't render until we have a token
    return null;
  }

  return (
    <input
      type="hidden"
      name="csrf_token"
      value={csrfToken}
      data-testid="csrf-token-input"
    />
  );
}

/**
 * Hook to get CSRF token value programmatically
 *
 * Usage:
 * ```tsx
 * const csrfToken = useCSRFToken();
 * console.log('Current CSRF token:', csrfToken);
 * ```
 */
export function useCSRFToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Fetch CSRF token directly from the server
    fetchCsrfToken().then((csrfToken) => {
      setToken(csrfToken);
    });
  }, []);

  return token;
}
