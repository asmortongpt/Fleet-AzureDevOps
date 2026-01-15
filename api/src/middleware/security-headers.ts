import { Request, Response, NextFunction } from 'express';

interface HSTSConfig {
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

interface CSPDirectives {
  [key: string]: string[];
}

interface CSPConfig {
  directives?: CSPDirectives;
  reportOnly?: boolean;
  reportUri?: string;
}

interface PermissionsDirectives {
  [key: string]: string[];
}

interface SecurityHeadersConfig {
  hsts?: HSTSConfig;
  csp?: CSPConfig;
  frameOptions?: string;
  contentTypeOptions?: boolean;
  xssProtection?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string | PermissionsDirectives;
  customHeaders?: Record<string, string>;
}

/**
 * Default CSP directives for FedRAMP-compliant security
 */
const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  'default-src': ["'self'"],
  'base-uri': ["'self'"],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'script-src': ["'self'"],
  'upgrade-insecure-requests': []
};

/**
 * Security Headers Middleware Factory
 * Returns configured middleware that implements OWASP security headers best practices
 */
export function securityHeaders(config: SecurityHeadersConfig = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Content Security Policy
    const cspConfig = config.csp || {};
    const cspDirectives = cspConfig.directives
      ? { ...DEFAULT_CSP_DIRECTIVES, ...cspConfig.directives }
      : DEFAULT_CSP_DIRECTIVES;

    let cspValue = Object.entries(cspDirectives)
      .map(([key, values]) => {
        if (values.length === 0) return key;
        return `${key} ${values.join(' ')}`;
      })
      .join('; ');

    if (cspConfig.reportUri) {
      cspValue += `; report-uri ${cspConfig.reportUri}`;
    }

    // Use report-only mode if reportUri is provided (unless explicitly set to false)
    const cspHeaderName = (cspConfig.reportOnly || cspConfig.reportUri)
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
    res.setHeader(cspHeaderName, cspValue);

    // HTTP Strict Transport Security (only in production by default)
    if (isProduction || config.hsts) {
      const hstsConfig = config.hsts || {};
      const maxAge = hstsConfig.maxAge ?? 31536000; // 1 year default
      const includeSubDomains = hstsConfig.includeSubDomains !== false;

      let hstsValue = `max-age=${maxAge}`;
      if (includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (hstsConfig.preload) {
        hstsValue += '; preload';
      }
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // Prevent clickjacking
    const frameOptions = config.frameOptions ?? 'DENY';
    res.setHeader('X-Frame-Options', frameOptions);

    // Prevent MIME type sniffing
    if (config.contentTypeOptions !== false) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // XSS Protection (legacy but still useful)
    if (config.xssProtection !== false) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // Referrer Policy
    const referrerPolicy = config.referrerPolicy ?? 'strict-origin-when-cross-origin';
    res.setHeader('Referrer-Policy', referrerPolicy);

    // Permissions Policy (formerly Feature Policy)
    let permissionsPolicy: string;
    if (typeof config.permissionsPolicy === 'string') {
      permissionsPolicy = config.permissionsPolicy;
    } else if (config.permissionsPolicy) {
      // Object form: { camera: ["'self'"], microphone: ["'self'"] }
      permissionsPolicy = Object.entries(config.permissionsPolicy)
        .map(([key, values]) => {
          if (values.length === 0) return `${key}=()`;
          return `${key}=(${values.join(' ')})`;
        })
        .join(', ');
    } else {
      // Default permissions
      permissionsPolicy = [
        "geolocation=('self')",
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()'
      ].join(', ');
    }
    res.setHeader('Permissions-Policy', permissionsPolicy);

    // Additional security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Cross-Origin Policies
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove X-Powered-By header (security through obscurity)
    res.removeHeader('X-Powered-By');

    // Custom headers
    if (config.customHeaders) {
      Object.entries(config.customHeaders).forEach(([name, value]) => {
        res.setHeader(name, value);
      });
    }

    next();
  };
}

/**
 * CORS Headers Middleware
 * Configures Cross-Origin Resource Sharing
 */
export function corsHeaders(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = [
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL || '',
    process.env.AZURE_STATIC_WEB_APP_URL || ''
  ].filter(Boolean);

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

/**
 * Rate Limit Headers
 * Provides rate limit information to clients
 */
export function rateLimitHeaders(req: Request, res: Response, next: NextFunction): void {
  // These would typically be set by a rate limiting middleware
  // This is a placeholder for the header structure
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', '99');
  res.setHeader('X-RateLimit-Reset', String(Date.now() + 3600000));

  next();
}

/**
 * Cache Control Headers
 * Sets appropriate caching headers based on resource type
 */
export function cacheControl(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;

  // API endpoints - no cache
  if (path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Static assets - aggressive caching
  else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // HTML - short cache with revalidation
  else if (path.match(/\.html$/)) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }

  next();
}

/**
 * Strict Security Headers
 * Ultra-restrictive headers for maximum security
 */
export function strictSecurityHeaders() {
  return securityHeaders({
    csp: {
      directives: {
        'default-src': ["'none'"],
        'script-src': ["'none'"],
        'style-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'object-src': ["'none'"]
      }
    },
    frameOptions: 'DENY',
    permissionsPolicy: [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', ')
  });
}

/**
 * API Security Headers
 * Security headers optimized for API endpoints
 */
export function apiSecurityHeaders() {
  return securityHeaders({
    csp: {
      directives: {
        'default-src': ["'none'"],
        'frame-ancestors': ["'none'"]
      }
    },
    frameOptions: 'DENY'
  });
}

/**
 * Download Security Headers
 * Security headers for file downloads
 */
export function downloadSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // Force download if Content-Disposition not already set
    if (!res.getHeader('Content-Disposition')) {
      res.setHeader('Content-Disposition', 'attachment');
    }

    next();
  };
}
