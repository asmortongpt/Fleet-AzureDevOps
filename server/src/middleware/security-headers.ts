/**
 * Security Headers Middleware - Phase 2 Security Hardening
 * Implements comprehensive security headers using Helmet
 *
 * SECURITY: SEC-PHASE2-004, SEC-PHASE2-005
 * Priority: HIGH
 * CWE: CWE-16 (Configuration), CWE-693 (Protection Mechanism Failure)
 */

import helmet from 'helmet';
import { Express } from 'express';
import { logger } from '../services/logger';

/**
 * Content Security Policy configuration
 * Prevents XSS, clickjacking, and other code injection attacks
 */
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      // Remove 'unsafe-inline' in production after auditing all inline scripts
      "'unsafe-inline'",
      // Trusted CDNs for analytics/monitoring (review and minimize)
      'https://cdn.example.com'
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for some UI libraries, audit and remove if possible
      'https://fonts.googleapis.com'
    ],
    imgSrc: [
      "'self'",
      'data:', // Allow data URLs for inline images
      'https:', // Allow HTTPS images (tighten to specific domains in production)
      'blob:' // Allow blob URLs for dynamically generated images
    ],
    connectSrc: [
      "'self'",
      // API endpoints
      'https://api.fleet.com',
      'https://*.azure.com',
      // WebSocket for real-time updates
      'wss://api.fleet.com',
      // Application Insights
      'https://dc.services.visualstudio.com'
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    objectSrc: ["'none'"], // Disallow plugins
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"], // Prevent clickjacking
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"], // X-Frame-Options alternative
    upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
  },
};

/**
 * Apply comprehensive security headers to Express app
 */
export function applySecurityHeaders(app: Express): void {
  // Helmet - comprehensive security headers
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: cspConfig,

      // DNS Prefetch Control - control browser DNS prefetching
      dnsPrefetchControl: { allow: false },

      // Frameguard - X-Frame-Options (prevent clickjacking)
      frameguard: {
        action: 'deny' // DENY is most secure
      },

      // Hide X-Powered-By header
      hidePoweredBy: true,

      // HSTS - HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true // Submit to Chrome's HSTS preload list
      },

      // IE No Open - X-Download-Options for IE8+
      ieNoOpen: true,

      // No Sniff - X-Content-Type-Options
      noSniff: true,

      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      },

      // XSS Filter - X-XSS-Protection
      xssFilter: true,
    })
  );

  // Additional custom security headers
  app.use((req, res, next) => {
    // Permissions Policy (formerly Feature Policy)
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    // Cross-Origin policies
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Cache control for sensitive data
    if (req.path.includes('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  });

  logger.info('Security headers applied successfully');
}

/**
 * Validate security headers are present in response
 * Used for testing and monitoring
 */
export function validateSecurityHeaders(headers: Record<string, string>): {
  valid: boolean;
  missing: string[];
} {
  const requiredHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'content-security-policy',
    'referrer-policy',
  ];

  const missing = requiredHeaders.filter(header => !headers[header.toLowerCase()]);

  return {
    valid: missing.length === 0,
    missing
  };
}
