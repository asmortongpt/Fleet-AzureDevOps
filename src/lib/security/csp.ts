/**
 * Content Security Policy (CSP) Configuration
 * Implements enterprise-grade CSP to prevent XSS, clickjacking, and other attacks
 *
 * @module security/csp
 */

export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'font-src': string[];
  'img-src': string[];
  'connect-src': string[];
  'media-src': string[];
  'object-src': string[];
  'frame-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
  'manifest-src': string[];
  'worker-src': string[];
  'upgrade-insecure-requests': string[];
}

/**
 * Development CSP - More permissive for HMR and debugging
 */
export const DEV_CSP_DIRECTIVES: Partial<CSPDirectives> = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite HMR
    "'unsafe-eval'", // Required for dev tools
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'http://localhost:*',
  ],
  'connect-src': [
    "'self'",
    'ws://localhost:*',
    'wss://localhost:*',
    'http://localhost:*',
    'https://localhost:*',
    'https://api.fleet-management.com',
    'https://*.azure.com',
    'https://*.microsoft.com',
    'https://login.microsoftonline.com',
    'https://graph.microsoft.com',
  ],
  'media-src': [
    "'self'",
    'blob:',
    'data:',
  ],
  'object-src': ["'none'"],
  'frame-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
};

/**
 * Production CSP - Strict security policies
 */
export const PROD_CSP_DIRECTIVES: Partial<CSPDirectives> = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    // Add specific script hashes here for inline scripts
    // "'sha256-...'" will be added via SRI
  ],
  'style-src': [
    "'self'",
    'https://fonts.googleapis.com',
    // Add specific style hashes for critical CSS
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
  ],
  'connect-src': [
    "'self'",
    'wss://api.fleet-management.com',
    'https://api.fleet-management.com',
    'https://*.azure.com',
    'https://*.microsoft.com',
    'https://login.microsoftonline.com', // Azure AD OAuth
    'https://graph.microsoft.com', // Microsoft Graph API
    'https://*.ingest.sentry.io', // Sentry error reporting
    'https://*.google-analytics.com', // Analytics
  ],
  'media-src': [
    "'self'",
    'blob:',
  ],
  'object-src': ["'none'"],
  'frame-src': [
    "'self'",
    'https://login.microsoftonline.com', // Azure AD
  ],
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header string from directives
 */
export function generateCSP(
  directives: Partial<CSPDirectives> = PROD_CSP_DIRECTIVES
): string {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (!sources || sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Get CSP directives based on environment
 */
export function getCSPDirectives(): Partial<CSPDirectives> {
  const isDev = import.meta.env.DEV;
  return isDev ? DEV_CSP_DIRECTIVES : PROD_CSP_DIRECTIVES;
}

/**
 * Generate CSP meta tag content
 */
export function getCSPMetaContent(): string {
  return generateCSP(getCSPDirectives());
}

/**
 * Add nonce to script elements for CSP
 */
export function addCSPNonce(nonce: string): void {
  if (typeof window === 'undefined') return;

  const scripts = document.querySelectorAll('script[data-csp-nonce]');
  scripts.forEach((script) => {
    script.setAttribute('nonce', nonce);
  });

  const styles = document.querySelectorAll('style[data-csp-nonce]');
  styles.forEach((style) => {
    style.setAttribute('nonce', nonce);
  });
}

/**
 * Report CSP violations
 */
export interface CSPViolationReport {
  documentURI: string;
  violatedDirective: string;
  effectiveDirective: string;
  originalPolicy: string;
  blockedURI: string;
  statusCode: number;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * Handle CSP violation reports
 */
export function handleCSPViolation(event: SecurityPolicyViolationEvent): void {
  const report: CSPViolationReport = {
    documentURI: event.documentURI,
    violatedDirective: event.violatedDirective,
    effectiveDirective: event.effectiveDirective,
    originalPolicy: event.originalPolicy,
    blockedURI: event.blockedURI,
    statusCode: event.statusCode,
    sourceFile: event.sourceFile,
    lineNumber: event.lineNumber,
    columnNumber: event.columnNumber,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.warn('[CSP Violation]', report);
  }

  // Send to monitoring service in production
  if (import.meta.env.PROD) {
    sendCSPViolationReport(report);
  }
}

/**
 * Send CSP violation to monitoring service
 */
async function sendCSPViolationReport(report: CSPViolationReport): Promise<void> {
  try {
    await fetch('/api/v1/security/csp-violations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...report,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.error('Failed to send CSP violation report:', error);
  }
}

/**
 * Initialize CSP violation reporting
 */
export function initCSPReporting(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('securitypolicyviolation', handleCSPViolation);
}

/**
 * Check if CSP is supported by the browser
 */
export function isCSPSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'SecurityPolicyViolationEvent' in window ||
    'onSecurityPolicyViolation' in document
  );
}

/**
 * Validate CSP configuration
 */
export function validateCSPConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const directives = getCSPDirectives();

  // Check for unsafe-inline in production
  if (import.meta.env.PROD) {
    if (directives['script-src']?.includes("'unsafe-inline'")) {
      errors.push("Production CSP should not include 'unsafe-inline' for script-src");
    }
    if (directives['script-src']?.includes("'unsafe-eval'")) {
      errors.push("Production CSP should not include 'unsafe-eval' for script-src");
    }
  }

  // Check for frame-ancestors
  if (!directives['frame-ancestors'] || directives['frame-ancestors'].length === 0) {
    warnings.push("Consider setting 'frame-ancestors' to prevent clickjacking");
  }

  // Check for upgrade-insecure-requests
  if (import.meta.env.PROD && !directives['upgrade-insecure-requests']) {
    warnings.push("Consider enabling 'upgrade-insecure-requests' in production");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate inline script hash for CSP
 */
export async function generateScriptHash(script: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(script);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  return `'sha256-${hashBase64}'`;
}

/**
 * CSP Builder for dynamic policy creation
 */
export class CSPBuilder {
  private directives: Partial<CSPDirectives>;

  constructor(baseDirectives?: Partial<CSPDirectives>) {
    this.directives = baseDirectives || { ...getCSPDirectives() };
  }

  addDirective(directive: keyof CSPDirectives, sources: string[]): this {
    this.directives[directive] = [
      ...(this.directives[directive] || []),
      ...sources,
    ];
    return this;
  }

  removeDirective(directive: keyof CSPDirectives): this {
    delete this.directives[directive];
    return this;
  }

  addSource(directive: keyof CSPDirectives, source: string): this {
    if (!this.directives[directive]) {
      this.directives[directive] = [];
    }
    const directiveSources = this.directives[directive];
    if (directiveSources && !directiveSources.includes(source)) {
      directiveSources.push(source);
    }
    return this;
  }

  removeSource(directive: keyof CSPDirectives, source: string): this {
    const directiveSources = this.directives[directive];
    if (directiveSources) {
      this.directives[directive] = directiveSources.filter(
        (s) => s !== source
      );
    }
    return this;
  }

  build(): string {
    return generateCSP(this.directives);
  }

  getDirectives(): Partial<CSPDirectives> {
    return { ...this.directives };
  }
}
