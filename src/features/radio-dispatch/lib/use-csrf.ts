/**
 * CSRF Token Management Hook
 *
 * This hook manages CSRF token initialization and refresh for React components.
 * It should be used in the root layout or provider component to initialize
 * CSRF protection when the application loads.
 *
 * Usage:
 * ```tsx
 * function RootLayout() {
 *   useCSRFProtection();
 *   return <div>...</div>;
 * }
 * ```
 */
import { useEffect } from 'react';
import { api } from './api';

/**
 * Hook to initialize CSRF protection on application load
 */
export function useCSRFProtection() {
  useEffect(() => {
    // Initialize CSRF token when component mounts
    api.initializeCSRF().catch((error) => {
      console.error('[useCSRFProtection] Failed to initialize CSRF token:', error);
    });
  }, []);
}

/**
 * Hook to refresh CSRF token (e.g., after authentication)
 */
export function useCSRFRefresh() {
  return async () => {
    try {
      await api.refreshCSRFToken();
      console.log('[useCSRFRefresh] CSRF token refreshed');
    } catch (error) {
      console.error('[useCSRFRefresh] Failed to refresh CSRF token:', error);
    }
  };
}
