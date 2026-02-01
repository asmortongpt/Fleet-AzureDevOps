/**
 * Subresource Integrity (SRI) Implementation
 * Ensures external resources haven't been tampered with
 *
 * @module security/sri
 */

import logger from '@/utils/logger';

export interface SRIHash {
  algorithm: 'sha256' | 'sha384' | 'sha512';
  hash: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export interface SRIResource {
  url: string;
  type: 'script' | 'style' | 'link';
  integrity: string;
  crossOrigin: 'anonymous' | 'use-credentials';
}

/**
 * Known external resources with pre-computed SRI hashes
 */
export const EXTERNAL_RESOURCES: Record<string, SRIResource> = {
  // Add your CDN resources here with their SRI hashes
  // Example:
  // 'react': {
  //   url: 'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js',
  //   type: 'script',
  //   integrity: 'sha384-...',
  //   crossOrigin: 'anonymous',
  // },
};

/**
 * Generate SRI hash from content
 */
export async function generateSRIHash(
  content: string | ArrayBuffer,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-384'
): Promise<string> {
  const encoder = new TextEncoder();
  const data = typeof content === 'string' ? encoder.encode(content) : content;

  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  const algoName = algorithm.toLowerCase().replace('-', '');
  return `${algoName}-${hashBase64}`;
}

/**
 * Generate SRI hash from URL
 */
export async function generateSRIHashFromURL(
  url: string,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-384'
): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.statusText}`);
    }

    const content = await response.arrayBuffer();
    return await generateSRIHash(content, algorithm);
  } catch (error) {
    logger.error(`Failed to generate SRI hash for ${url}:`, error);
    throw error;
  }
}

/**
 * Verify SRI hash of a resource
 */
export async function verifySRIHash(
  content: string | ArrayBuffer,
  expectedHash: string
): Promise<boolean> {
  const [algorithm, expectedBase64] = expectedHash.split('-');

  const algoMap: Record<string, 'SHA-256' | 'SHA-384' | 'SHA-512'> = {
    sha256: 'SHA-256',
    sha384: 'SHA-384',
    sha512: 'SHA-512',
  };

  const cryptoAlgorithm = algoMap[algorithm];
  if (!cryptoAlgorithm) {
    throw new Error(`Unsupported SRI algorithm: ${algorithm}`);
  }

  const actualHash = await generateSRIHash(content, cryptoAlgorithm);
  return actualHash === expectedHash;
}

/**
 * Add SRI to script element
 */
export function addSRIToScript(
  script: HTMLScriptElement,
  integrity: string,
  crossOrigin: 'anonymous' | 'use-credentials' = 'anonymous'
): void {
  script.integrity = integrity;
  script.crossOrigin = crossOrigin;
}

/**
 * Add SRI to link element (for stylesheets)
 */
export function addSRIToLink(
  link: HTMLLinkElement,
  integrity: string,
  crossOrigin: 'anonymous' | 'use-credentials' = 'anonymous'
): void {
  link.integrity = integrity;
  link.crossOrigin = crossOrigin;
}

/**
 * Create script element with SRI
 */
export function createSecureScript(
  src: string,
  integrity: string,
  crossOrigin: 'anonymous' | 'use-credentials' = 'anonymous'
): HTMLScriptElement {
  const script = document.createElement('script');
  script.src = src;
  script.integrity = integrity;
  script.crossOrigin = crossOrigin;
  script.async = true;
  return script;
}

/**
 * Create link element with SRI
 */
export function createSecureLink(
  href: string,
  integrity: string,
  crossOrigin: 'anonymous' | 'use-credentials' = 'anonymous'
): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.integrity = integrity;
  link.crossOrigin = crossOrigin;
  return link;
}

/**
 * Load script with SRI verification
 */
export function loadSecureScript(
  src: string,
  integrity: string,
  crossOrigin: 'anonymous' | 'use-credentials' = 'anonymous'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = createSecureScript(src, integrity, crossOrigin);

    script.onload = () => {
      resolve();
    };

    script.onerror = (error) => {
      logger.error(`Failed to load script with SRI: ${src}`, error);
      reject(new Error(`SRI verification failed for ${src}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Load stylesheet with SRI verification
 */
export function loadSecureStylesheet(
  href: string,
  integrity: string,
  crossOrigin: 'anonymous' | 'use-credentials' = 'anonymous'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = createSecureLink(href, integrity, crossOrigin);

    link.onload = () => {
      resolve();
    };

    link.onerror = (error) => {
      logger.error(`Failed to load stylesheet with SRI: ${href}`, error);
      reject(new Error(`SRI verification failed for ${href}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Audit existing resources for SRI
 */
export interface SRIAuditResult {
  total: number;
  withSRI: number;
  withoutSRI: number;
  violations: Array<{
    element: string;
    src: string;
    type: 'script' | 'link';
  }>;
}

export function auditResourceSRI(): SRIAuditResult {
  const result: SRIAuditResult = {
    total: 0,
    withSRI: 0,
    withoutSRI: 0,
    violations: [],
  };

  // Audit script elements
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    if (!src) return;

    // Skip same-origin scripts
    if (src.startsWith('/') || src.startsWith(window.location.origin)) {
      return;
    }

    result.total++;

    const integrity = script.getAttribute('integrity');
    if (integrity) {
      result.withSRI++;
    } else {
      result.withoutSRI++;
      result.violations.push({
        element: 'script',
        src,
        type: 'script',
      });
    }
  });

  // Audit link elements (stylesheets)
  const links = document.querySelectorAll('link[rel="stylesheet"][href]');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Skip same-origin stylesheets
    if (href.startsWith('/') || href.startsWith(window.location.origin)) {
      return;
    }

    result.total++;

    const integrity = link.getAttribute('integrity');
    if (integrity) {
      result.withSRI++;
    } else {
      result.withoutSRI++;
      result.violations.push({
        element: 'link',
        src: href,
        type: 'link',
      });
    }
  });

  return result;
}

/**
 * Monitor for new resources without SRI
 */
export function monitorResourceSRI(): void {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
    return;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const element = node as Element;

        // Check scripts
        if (element.tagName === 'SCRIPT') {
          const script = element as HTMLScriptElement;
          const src = script.getAttribute('src');

          if (src && !src.startsWith('/') && !src.startsWith(window.location.origin)) {
            if (!script.getAttribute('integrity')) {
              logger.warn(`[SRI] Script loaded without integrity check: ${src}`);
            }
          }
        }

        // Check links
        if (element.tagName === 'LINK') {
          const link = element as HTMLLinkElement;
          const href = link.getAttribute('href');
          const rel = link.getAttribute('rel');

          if (rel === 'stylesheet' && href && !href.startsWith('/') && !href.startsWith(window.location.origin)) {
            if (!link.getAttribute('integrity')) {
              logger.warn(`[SRI] Stylesheet loaded without integrity check: ${href}`);
            }
          }
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

/**
 * Generate SRI hashes for build assets
 */
export async function generateBuildAssetHashes(
  assetPaths: string[]
): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};

  for (const path of assetPaths) {
    try {
      const hash = await generateSRIHashFromURL(path);
      hashes[path] = hash;
    } catch (error) {
      logger.error(`Failed to generate hash for ${path}:`, error);
    }
  }

  return hashes;
}

/**
 * SRI Configuration
 */
export interface SRIConfig {
  enabled: boolean;
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
  crossOrigin: 'anonymous' | 'use-credentials';
  enforceForCDN: boolean;
  monitorViolations: boolean;
}

export const DEFAULT_SRI_CONFIG: SRIConfig = {
  enabled: true,
  algorithm: 'SHA-384',
  crossOrigin: 'anonymous',
  enforceForCDN: true,
  monitorViolations: true,
};

/**
 * Initialize SRI monitoring and enforcement
 */
export function initSRI(config: Partial<SRIConfig> = {}): void {
  const finalConfig = { ...DEFAULT_SRI_CONFIG, ...config };

  if (!finalConfig.enabled) {
    return;
  }

  // Audit existing resources
  const auditResult = auditResourceSRI();

  if (auditResult.withoutSRI > 0) {
    logger.warn(
      `[SRI] ${auditResult.withoutSRI} external resources loaded without integrity checks`,
      auditResult.violations
    );
  }

  // Monitor for new resources
  if (finalConfig.monitorViolations) {
    monitorResourceSRI();
  }

  // Log SRI status
  if (import.meta.env.DEV) {
    logger.info('[SRI] Initialized with config:', finalConfig);
    logger.info('[SRI] Audit result:', auditResult);
  }
}
