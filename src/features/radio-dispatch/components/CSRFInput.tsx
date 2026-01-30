'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import logger from '@/utils/logger';

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
    // Get CSRF token from sessionStorage (set by api.initializeCSRF())
    const token = sessionStorage.getItem('csrf_token');
    if (token) {
      setCsrfToken(token);
    } else {
      // If token not yet initialized, initialize it
      api.initializeCSRF().then(() => {
        const newToken = sessionStorage.getItem('csrf_token');
        if (newToken) {
          setCsrfToken(newToken);
        }
      });
    }
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
 * logger.info('Current CSRF token:', csrfToken);
 * ```
 */
export function useCSRFToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get from sessionStorage
    const storedToken = sessionStorage.getItem('csrf_token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      // Initialize if needed
      api.initializeCSRF().then(() => {
        const newToken = sessionStorage.getItem('csrf_token');
        setToken(newToken);
      });
    }
  }, []);

  return token;
}
