import logger from '@/utils/logger'

/**
 * CORS Preflight Handlers
 * Frontend Security - Task 8/8
 * Fortune 50 Security Standards
 */

/**
 * Allowed CORS origins (configured via environment)
 */
const ALLOWED_ORIGINS = import.meta.env.VITE_CORS_ORIGINS?.split(',') || [
  window.location.origin,
];

/**
 * Check if origin is allowed
 * @param origin - Origin to check
 * @returns True if origin is allowed
 */
export function isOriginAllowed(origin: string): boolean {
  if (!origin) {
    return false;
  }

  // Check exact matches
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check wildcard patterns
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    return false;
  });
}

/**
 * Handle CORS preflight OPTIONS request
 * @param origin - Request origin
 * @param requestMethod - HTTP method being requested
 * @param requestHeaders - Headers being requested
 * @returns CORS headers or null if not allowed
 */
export function handlePreflightRequest(
  origin: string,
  requestMethod: string = 'GET',
  requestHeaders: string[] = []
): Record<string, string> | null {
  if (!isOriginAllowed(origin)) {
    logger.warn('CORS: Origin not allowed:', origin);
    return null;
  }

  // Allowed methods
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  if (!allowedMethods.includes(requestMethod.toUpperCase())) {
    logger.warn('CORS: Method not allowed:', requestMethod);
    return null;
  }

  // Allowed headers
  const allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Origin',
  ];

  // Check if all requested headers are allowed
  const invalidHeaders = requestHeaders.filter(
    header => !allowedHeaders.includes(header)
  );
  if (invalidHeaders.length > 0) {
    logger.warn('CORS: Headers not allowed:', invalidHeaders);
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': allowedMethods.join(', '),
    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Get CORS headers for response
 * @param origin - Request origin
 * @returns CORS headers or null if not allowed
 */
export function getCorsHeaders(origin: string): Record<string, string> | null {
  if (!isOriginAllowed(origin)) {
    return null;
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

/**
 * Validate CORS request before processing
 * @param request - Fetch Request object
 * @returns True if CORS is valid
 */
export function validateCorsRequest(request: Request): boolean {
  const origin = request.headers.get('Origin');

  // Same-origin requests don't need CORS
  if (!origin || origin === window.location.origin) {
    return true;
  }

  // Check if origin is allowed
  return isOriginAllowed(origin);
}

/**
 * Create CORS-safe fetch wrapper
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function corsSafeFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const urlObj = new URL(url, window.location.origin);

  // Check if this is a cross-origin request
  const isCrossOrigin = urlObj.origin !== window.location.origin;

  if (isCrossOrigin) {
    // Ensure credentials are included for CORS
    options.credentials = 'include';
    options.mode = 'cors';

    // Add Origin header
    const headers = new Headers(options.headers);
    headers.set('Origin', window.location.origin);
    options.headers = headers;
  }

  return fetch(url, options);
}
