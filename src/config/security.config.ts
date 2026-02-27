/**
 * Security configuration settings.
 */
export const securityConfig = {
  referrerPolicy: (import.meta.env.VITE_REFERRER_POLICY as string) || 'no-referrer',
  cspDirectives: {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", 'data:', 'https:'],
    "object-src": ["'none'"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "media-src": ["'self'"],
    "frame-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
    "script-src-attr": ["'none'"],
    "upgrade-insecure-requests": []
  }
};