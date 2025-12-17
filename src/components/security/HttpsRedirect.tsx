/**
 * HTTPS Redirect Logic Component
 * Frontend Security - Task 5/8
 * Fortune 50 Security Standards
 */

import { useEffect } from 'react';

import logger from '@/utils/logger';
/**
 * Component that enforces HTTPS in production
 */
export function HttpsRedirect() {
  useEffect(() => {
    // Only enforce HTTPS in production
    if (import.meta.env.PROD) {
      enforceHttps();
    }
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Enforce HTTPS by redirecting HTTP requests
 */
function enforceHttps(): void {
  if (
    window.location.protocol === 'http:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    const httpsUrl = window.location.href.replace('http://', 'https://');

    logger.info('Redirecting to HTTPS:', httpsUrl);
    window.location.replace(httpsUrl);
  }
}

/**
 * Check if current connection is secure
 * @returns True if using HTTPS or localhost
 */
export function isSecureContext(): boolean {
  return (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.isSecureContext === true
  );
}

/**
 * Hook to check if app is running in secure context
 */
export function useSecureContext(): boolean {
  return isSecureContext();
}
