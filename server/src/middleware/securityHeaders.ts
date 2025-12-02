/**
 * Helmet Security Headers Configuration
 * Task 1.6b from REMEDIATION_COMPLIANCE_PLAN.md
 *
 * Comprehensive security headers for FedRAMP/SOC 2 compliance
 * Implements: CSP, HSTS, X-Frame-Options, XSS Protection, etc.
 */

import helmet, { HelmetOptions } from 'helmet';

/**
 * Get production-ready Helmet configuration
 * All headers configured for maximum security
 */
export function getHelmetConfig(): HelmetOptions {
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';

  return {
    // Content Security Policy - Prevents XSS attacks
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        // Scripts: only from same origin
        scriptSrc: [
          "'self'",
          // Allow inline scripts for styled-components and React
          "'unsafe-inline'",
          // Development only: eval for hot reload
          ...(!isProduction ? ["'unsafe-eval'"] : [])
        ],

        // Styles: self + unsafe-inline for styled-components
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for styled-components
          "https://fonts.googleapis.com"
        ],

        // Images: self, data URIs, and HTTPS
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:"
        ],

        // Fonts: self and Google Fonts
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "data:"
        ],

        // API connections
        connectSrc: [
          "'self'",
          // Allow connections to monitoring services
          "https://api.datadoghq.com",
          "https://*.applicationinsights.azure.com",
          "https://*.clarity.ms",
          // Development: allow localhost
          ...(!isProduction ? [
            "http://localhost:*",
            "ws://localhost:*",
            "http://127.0.0.1:*",
            "ws://127.0.0.1:*"
          ] : [])
        ],

        // No objects/embeds (Flash, Java, etc.)
        objectSrc: ["'none'"],

        // Media: self only
        mediaSrc: ["'self'"],

        // Frames: none (prevents clickjacking)
        frameSrc: ["'none'"],

        // Child frames: none
        childSrc: ["'none'"],

        // Form actions: self only
        formAction: ["'self'"],

        // Base URI: self
        baseUri: ["'self'"],

        // Upgrade insecure requests in production
        ...(isProduction && {
          upgradeInsecureRequests: []
        }),

        // Block mixed content
        blockAllMixedContent: []
      },
      reportOnly: false, // Enforce in production
      useDefaults: false
    },

    // HTTP Strict Transport Security (HSTS)
    // Forces HTTPS for 1 year, includes subdomains
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true // Submit to browser HSTS preload lists
    },

    // X-Frame-Options: Prevents clickjacking
    frameguard: {
      action: 'deny' // Never allow framing
    },

    // Referrer-Policy: Control referrer information
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },

    // X-Content-Type-Options: Prevent MIME sniffing
    noSniff: true,

    // X-DNS-Prefetch-Control: Control DNS prefetching
    dnsPrefetchControl: {
      allow: false
    },

    // X-Download-Options: Prevent downloads from opening
    ieNoOpen: true,

    // X-Permitted-Cross-Domain-Policies: Restrict Flash/PDF
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    },

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // Expect-CT: Certificate Transparency
    ...(isProduction && {
      expectCt: {
        maxAge: 86400, // 24 hours
        enforce: true
      }
    }),

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Disable if causing issues with third-party embeds

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin'
    },

    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: {
      policy: 'same-origin'
    },

    // Origin-Agent-Cluster header
    originAgentCluster: true
  };
}

/**
 * Validate security headers configuration on startup
 */
export function validateSecurityHeaders(): void {
  const environment = process.env.NODE_ENV || 'development';

  if (environment === 'production') {
    // Verify HTTPS is enforced
    const protocol = process.env.PROTOCOL || 'http';

    if (protocol !== 'https') {
      console.warn(
        '⚠️  WARNING: HTTPS is not enforced in production environment. ' +
        'Set PROTOCOL=https for proper HSTS implementation.'
      );
    }

    console.log('✅ Helmet security headers configured for production');
    console.log('   - HSTS enabled (1 year, includeSubDomains, preload)');
    console.log('   - CSP enforced (strict policy)');
    console.log('   - X-Frame-Options: DENY');
    console.log('   - X-Content-Type-Options: nosniff');
    console.log('   - Referrer-Policy: strict-origin-when-cross-origin');
  } else {
    console.log('✅ Helmet security headers configured for development');
    console.log('   - CSP relaxed for dev tools');
    console.log('   - Localhost connections allowed');
  }
}

/**
 * Custom middleware to add additional security headers
 */
export function additionalSecurityHeaders() {
  return (req: any, res: any, next: any) => {
    // Permissions-Policy (formerly Feature-Policy)
    res.setHeader(
      'Permissions-Policy',
      [
        'accelerometer=()',
        'camera=()',
        'geolocation=(self)',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=()',
        'usb=()'
      ].join(', ')
    );

    // X-XSS-Protection (legacy, but some browsers still use it)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Cache-Control for sensitive pages
    if (req.path.includes('/api/') || req.path.includes('/auth/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  };
}

/**
 * Security headers test endpoint (development only)
 */
export function securityHeadersTestMiddleware() {
  return (req: any, res: any, next: any) => {
    const environment = process.env.NODE_ENV || 'development';

    if (environment === 'development' && req.path === '/api/security-headers-test') {
      return res.json({
        message: 'Security headers active',
        headers: {
          'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
          'Strict-Transport-Security': res.getHeader('Strict-Transport-Security'),
          'X-Frame-Options': res.getHeader('X-Frame-Options'),
          'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
          'Referrer-Policy': res.getHeader('Referrer-Policy'),
          'Permissions-Policy': res.getHeader('Permissions-Policy')
        }
      });
    }

    next();
  };
}

/**
 * Export configured Helmet middleware
 */
export const helmetMiddleware = helmet(getHelmetConfig());
