import { Request, Response, NextFunction } from 'express';

interface HSTSConfig {
  maxAge: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

interface CSPDirectives {
  [key: string]: string[];
}

interface CSPConfig {
  directives: CSPDirectives;
}

interface SecurityHeadersConfig {
  hsts?: HSTSConfig;
  csp?: CSPConfig;
  frameOptions?: string;
  contentTypeOptions?: boolean;
  xssProtection?: boolean;
  referrerPolicy?: string;
}

/**
 * Security Headers Middleware Factory
 * Returns configured middleware that implements OWASP security headers best practices
 */
export function securityHeaders(config: SecurityHeadersConfig = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Content Security Policy
    if (config.csp && config.csp.directives) {
      const cspDirectives = Object.entries(config.csp.directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
      res.setHeader('Content-Security-Policy', cspDirectives);
    }

    // HTTP Strict Transport Security (only in production or if explicitly configured)
    if (config.hsts && (isProduction || config.hsts.maxAge)) {
      let hstsValue = `max-age=${config.hsts.maxAge}`;
      if (config.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (config.hsts.preload) {
        hstsValue += '; preload';
      }
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // Prevent clickjacking
    if (config.frameOptions) {
      res.setHeader('X-Frame-Options', config.frameOptions);
    }

    // Prevent MIME type sniffing
    if (config.contentTypeOptions !== false) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // XSS Protection (legacy but still useful)
    if (config.xssProtection !== false) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // Referrer Policy
    if (config.referrerPolicy) {
      res.setHeader('Referrer-Policy', config.referrerPolicy);
    }

    // Permissions Policy (formerly Feature Policy)
    const permissions = [
      'geolocation=(self)',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ];
    res.setHeader('Permissions-Policy', permissions.join(', '));

    // Cross-Origin Policies
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

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
