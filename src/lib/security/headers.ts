/**
import logger from '@/utils/logger';
 * Security Headers Configuration
 * Implements comprehensive security headers for defense-in-depth
 *
 * @module security/headers
 */

export interface SecurityHeadersConfig {
  enableHSTS?: boolean;
  hstsMaxAge?: number;
  hstsIncludeSubDomains?: boolean;
  hstsPreload?: boolean;
  enableCSP?: boolean;
  cspDirectives?: string;
  enableFrameOptions?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  enableReferrerPolicy?: boolean;
  referrerPolicy?: ReferrerPolicyValue;
  enablePermissionsPolicy?: boolean;
  permissionsPolicy?: string;
}

type ReferrerPolicyValue =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

/**
 * Security Headers
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature-Policy)
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), ' +
    'magnetometer=(), gyroscope=(), accelerometer=(), ' +
    'ambient-light-sensor=(), autoplay=(), encrypted-media=(self), ' +
    'fullscreen=(self), picture-in-picture=(self)',

  // HTTP Strict Transport Security (HSTS)
  // Only enable in production with HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',

  // Expect-CT (Certificate Transparency)
  'Expect-CT': 'max-age=86400, enforce',

  // X-Permitted-Cross-Domain-Policies
  'X-Permitted-Cross-Domain-Policies': 'none',

  // X-Download-Options (IE)
  'X-Download-Options': 'noopen',

  // X-DNS-Prefetch-Control
  'X-DNS-Prefetch-Control': 'off',
} as const;

/**
 * Development Security Headers (more permissive)
 */
export const DEV_SECURITY_HEADERS = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'no-referrer-when-downgrade',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  // Don't include HSTS in development
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
  'Cross-Origin-Opener-Policy': 'unsafe-none',
  'Cross-Origin-Resource-Policy': 'cross-origin',
} as const;

/**
 * Get security headers based on environment
 */
export function getSecurityHeaders(): Record<string, string> {
  const isDev = import.meta.env.DEV;
  const isHTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (isDev) {
    return { ...DEV_SECURITY_HEADERS };
  }

  const headers = { ...SECURITY_HEADERS };

  // Remove HSTS if not HTTPS
  if (!isHTTPS) {
    delete headers['Strict-Transport-Security'];
  }

  return headers;
}

/**
 * Apply security headers to Response object
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = getSecurityHeaders();

  Object.entries(headers).forEach(([header, value]) => {
    response.headers.set(header, value);
  });

  return response;
}

/**
 * Apply security headers to Headers object
 */
export function applySecurityHeadersToHeadersObject(headers: Headers): Headers {
  const securityHeaders = getSecurityHeaders();

  Object.entries(securityHeaders).forEach(([header, value]) => {
    headers.set(header, value);
  });

  return headers;
}

/**
 * Create security headers object for fetch requests
 */
export function createSecurityHeaders(): Record<string, string> {
  return getSecurityHeaders();
}

/**
 * Validate security headers on current page
 */
export interface SecurityHeadersAudit {
  present: string[];
  missing: string[];
  invalid: Array<{ header: string; reason: string }>;
  warnings: string[];
}

export async function auditSecurityHeaders(
  url: string = window.location.href
): Promise<SecurityHeadersAudit> {
  const audit: SecurityHeadersAudit = {
    present: [],
    missing: [],
    invalid: [],
    warnings: [],
  };

  try {
    const response = await fetch(url, { method: 'HEAD' });
    const headers = response.headers;

    const expectedHeaders = getSecurityHeaders();

    // Check each expected header
    Object.entries(expectedHeaders).forEach(([header, expectedValue]) => {
      const actualValue = headers.get(header);

      if (actualValue) {
        audit.present.push(header);

        // Validate value (basic validation)
        if (actualValue !== expectedValue) {
          audit.warnings.push(
            `${header} has different value than expected: ${actualValue}`
          );
        }
      } else {
        audit.missing.push(header);
      }
    });

    // Check for insecure values
    const xssProtection = headers.get('X-XSS-Protection');
    if (xssProtection === '0') {
      audit.invalid.push({
        header: 'X-XSS-Protection',
        reason: 'XSS protection is disabled',
      });
    }

    const frameOptions = headers.get('X-Frame-Options');
    if (frameOptions && !['DENY', 'SAMEORIGIN'].includes(frameOptions)) {
      audit.invalid.push({
        header: 'X-Frame-Options',
        reason: 'Invalid frame options value',
      });
    }

    // Check HSTS on HTTPS
    if (window.location.protocol === 'https:') {
      const hsts = headers.get('Strict-Transport-Security');
      if (!hsts) {
        audit.warnings.push('HSTS header missing on HTTPS connection');
      }
    }
  } catch (error) {
    logger.error('Failed to audit security headers:', error);
  }

  return audit;
}

/**
 * Security Headers Builder
 */
export class SecurityHeadersBuilder {
  private headers: Map<string, string> = new Map();

  constructor(baseHeaders?: Record<string, string>) {
    if (baseHeaders) {
      Object.entries(baseHeaders).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }

  /**
   * Set X-Frame-Options
   */
  setFrameOptions(value: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'): this {
    this.headers.set('X-Frame-Options', value);
    return this;
  }

  /**
   * Set Content-Security-Policy
   */
  setCSP(csp: string): this {
    this.headers.set('Content-Security-Policy', csp);
    return this;
  }

  /**
   * Set Referrer-Policy
   */
  setReferrerPolicy(policy: ReferrerPolicyValue): this {
    this.headers.set('Referrer-Policy', policy);
    return this;
  }

  /**
   * Set HSTS
   */
  setHSTS(
    maxAge: number = 31536000,
    includeSubDomains: boolean = true,
    preload: boolean = false
  ): this {
    let value = `max-age=${maxAge}`;
    if (includeSubDomains) value += '; includeSubDomains';
    if (preload) value += '; preload';

    this.headers.set('Strict-Transport-Security', value);
    return this;
  }

  /**
   * Set Permissions-Policy
   */
  setPermissionsPolicy(policy: string): this {
    this.headers.set('Permissions-Policy', policy);
    return this;
  }

  /**
   * Set Cross-Origin policies
   */
  setCrossOriginPolicies(
    embedderPolicy: 'require-corp' | 'unsafe-none' = 'require-corp',
    openerPolicy: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none' = 'same-origin',
    resourcePolicy: 'same-origin' | 'same-site' | 'cross-origin' = 'same-origin'
  ): this {
    this.headers.set('Cross-Origin-Embedder-Policy', embedderPolicy);
    this.headers.set('Cross-Origin-Opener-Policy', openerPolicy);
    this.headers.set('Cross-Origin-Resource-Policy', resourcePolicy);
    return this;
  }

  /**
   * Set custom header
   */
  setHeader(name: string, value: string): this {
    this.headers.set(name, value);
    return this;
  }

  /**
   * Remove header
   */
  removeHeader(name: string): this {
    this.headers.delete(name);
    return this;
  }

  /**
   * Build headers object
   */
  build(): Record<string, string> {
    const result: Record<string, string> = {};
    this.headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Build Headers object
   */
  buildHeaders(): Headers {
    const headers = new Headers();
    this.headers.forEach((value, key) => {
      headers.set(key, value);
    });
    return headers;
  }
}

/**
 * Create security headers builder with defaults
 */
export function createSecurityHeadersBuilder(): SecurityHeadersBuilder {
  return new SecurityHeadersBuilder(getSecurityHeaders());
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
}

export const DEFAULT_CORS_CONFIG: CORSConfig = {
  allowedOrigins: ['https://api.fleet-management.com'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400,
  credentials: true,
};

/**
 * Apply CORS headers
 */
export function applyCORSHeaders(
  headers: Headers,
  origin: string,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): Headers {
  // Check if origin is allowed
  if (
    config.allowedOrigins.includes('*') ||
    config.allowedOrigins.includes(origin)
  ) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(', '));
  headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));

  if (config.exposedHeaders && config.exposedHeaders.length > 0) {
    headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
  }

  if (config.maxAge) {
    headers.set('Access-Control-Max-Age', config.maxAge.toString());
  }

  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return headers;
}

/**
 * Security headers middleware for fetch
 */
export function securityHeadersMiddleware(
  fetch: typeof window.fetch
): typeof window.fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);

    // Apply security headers
    applySecurityHeadersToHeadersObject(headers);

    const response = await fetch(input, {
      ...init,
      headers,
    });

    return response;
  };
}

/**
 * Initialize security headers
 */
export function initSecurityHeaders(): void {
  // Log security headers status in development
  if (import.meta.env.DEV) {
    logger.info('[Security Headers] Initialized');
    logger.info('[Security Headers] Configuration:', getSecurityHeaders());
  }

  // Audit headers in production
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    auditSecurityHeaders().then((audit) => {
      if (audit.missing.length > 0) {
        logger.warn('[Security Headers] Missing headers:', audit.missing);
      }
      if (audit.invalid.length > 0) {
        logger.warn('[Security Headers] Invalid headers:', audit.invalid);
      }
    });
  }
}
