/**
 * Content Security Policy Meta Tags
 * Frontend Security - Task 1/8
 * Fortune 50 Security Standards
 */

import { useEffect } from 'react';

import logger from '@/utils/logger';
/**
 * CSP Configuration
 * Defines allowed sources for different resource types
 */
const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React dev mode, remove in production
    import.meta.env.PROD ? '' : "'unsafe-eval'", // Required for dev hot reload
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
  ].filter(Boolean),
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components/emotion
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    import.meta.env.VITE_API_URL || window.location.origin,
    'https://api.applicationinsights.io',
    'wss:',
  ].filter(Boolean),
  'media-src': ["'self'", 'data:', 'blob:'],
  'object-src': ["'none'"],
  'frame-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

/**
 * Build CSP header value from policy object
 */
function buildCspHeader(): string {
  return Object.entries(CSP_POLICY)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Component that sets CSP meta tag and other security headers
 */
export function CspMetaTags() {
  useEffect(() => {
    const cspContent = buildCspHeader();

    // Set CSP meta tag
    const existingCspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCspMeta) {
      existingCspMeta.setAttribute('content', cspContent);
    } else {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = cspContent;
      document.head.appendChild(cspMeta);
    }

    // Set X-Content-Type-Options
    setMetaTag('http-equiv', 'X-Content-Type-Options', 'nosniff');

    // Set X-Frame-Options
    setMetaTag('http-equiv', 'X-Frame-Options', 'DENY');

    // Set X-XSS-Protection
    setMetaTag('http-equiv', 'X-XSS-Protection', '1; mode=block');

    // Set Referrer-Policy
    setMetaTag('name', 'referrer', 'strict-origin-when-cross-origin');

    // Set Permissions-Policy
    setMetaTag(
      'http-equiv',
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    logger.info('Security headers applied:', {
      csp: cspContent,
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'DENY',
      xXssProtection: '1; mode=block',
    });

    // Cleanup function
    return () => {
      // Meta tags persist across route changes, no cleanup needed
    };
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Helper function to set or update meta tag
 */
function setMetaTag(
  attribute: 'name' | 'http-equiv',
  key: string,
  content: string
): void {
  const selector = `meta[${attribute}="${key}"]`;
  const existingMeta = document.querySelector(selector);

  if (existingMeta) {
    existingMeta.setAttribute('content', content);
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
}

/**
 * Get current CSP policy (for debugging)
 */
export function getCurrentCspPolicy(): string {
  const metaTag = document.querySelector<HTMLMetaElement>(
    'meta[http-equiv="Content-Security-Policy"]'
  );
  return metaTag?.content || 'No CSP policy found';
}
