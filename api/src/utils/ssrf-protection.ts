/**
 * SSRF Protection Utility
 *
 * Comprehensive Server-Side Request Forgery (SSRF) protection with:
 * - URL validation before requests
 * - DNS resolution validation to prevent DNS rebinding attacks
 * - Private IP range blocking (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)
 * - Cloud metadata endpoint blocking (AWS, GCP, Azure)
 * - Domain allowlist enforcement
 * - IPv6 internal address blocking
 *
 * This is the enhanced version with DNS-based IP validation.
 */

import { URL } from 'url';
import dns from 'dns/promises';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../config/logger';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Default allowed domains for external services
 * Add domains here that are known, trusted external services
 */
const ALLOWED_HOSTS: string[] = [
  // Mapping services
  'api.mapbox.com',
  'nominatim.openstreetmap.org',
  'maps.googleapis.com',
  'geocode.arcgis.com',

  // Microsoft services
  'graph.microsoft.com',
  'login.microsoftonline.com',
  'api.office.com',
  'outlook.office.com',
  'outlook.office365.com',

  // Azure services (allow subdomains)
  'blob.core.windows.net',
  'queue.core.windows.net',
  'table.core.windows.net',
  'cognitiveservices.azure.com',
  'azurewebsites.net',
  'azure-api.net',

  // Telematics providers
  'api.smartcar.com',
  'auth.smartcar.com',
  'management.smartcar.com',
  'api.samsara.com',
  'samsara-fleet-videos.s3.amazonaws.com',
  'videos.samsara.com',

  // OpenStreetMap
  'openstreetmap.org',

  // AWS S3 (for video storage)
  's3.amazonaws.com',
  's3.us-east-1.amazonaws.com',
  's3.us-west-2.amazonaws.com',

  // Google services
  'googleapis.com',
  'accounts.google.com',
  'oauth2.googleapis.com',
  'www.googleapis.com',
  'calendar-json.googleapis.com',
];

/**
 * Blocked IP patterns (regex for flexibility)
 */
const BLOCKED_IP_PATTERNS: RegExp[] = [
  // IPv4 Loopback
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,

  // IPv4 Private Networks
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,             // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^192\.168\.\d{1,3}\.\d{1,3}$/,                 // 192.168.0.0/16

  // Link-local (AWS/Azure metadata)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,                 // 169.254.0.0/16

  // Zero network
  /^0\.0\.0\.0$/,
  /^0\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,               // 0.0.0.0/8

  // Broadcast
  /^255\.255\.255\.255$/,

  // IPv6 Loopback
  /^::1$/,
  /^::ffff:127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,     // IPv6 mapped loopback

  // IPv6 Link-local
  /^fe80:/i,

  // IPv6 Unique local addresses
  /^fc00:/i,
  /^fd00:/i,
];

/**
 * Explicitly blocked hostnames
 */
const BLOCKED_HOSTNAMES: string[] = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',

  // AWS metadata endpoints
  '169.254.169.254',
  'instance-data',

  // GCP metadata
  'metadata.google.internal',
  'metadata',
  'metadata.goog',

  // Azure metadata
  '169.254.169.254',

  // IPv6 loopback
  '::1',
  '[::1]',

  // Kubernetes internal
  'kubernetes.default',
  'kubernetes.default.svc',
];

// =============================================================================
// ERROR CLASSES
// =============================================================================

/**
 * Custom SSRF Error class
 */
export class SSRFError extends Error {
  public readonly url: string;
  public readonly reason: string;
  public readonly blockedIP?: string;

  constructor(message: string, url: string, reason: string, blockedIP?: string) {
    super(`SSRF Protection: ${message}`);
    this.name = 'SSRFError';
    this.url = url;
    this.reason = reason;
    this.blockedIP = blockedIP;
  }
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if an IP address is blocked (private/internal)
 */
function isBlockedIP(ip: string): boolean {
  return BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(ip));
}

/**
 * Check if hostname is explicitly blocked
 */
function isBlockedHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return BLOCKED_HOSTNAMES.some(
    (blocked) => normalizedHostname === blocked.toLowerCase()
  );
}

/**
 * Check if hostname matches allowed domains
 * Supports exact matches and subdomain matching
 */
function isAllowedHost(hostname: string, allowedHosts: string[]): boolean {
  const normalizedHostname = hostname.toLowerCase();

  return allowedHosts.some((allowedDomain) => {
    const normalizedAllowed = allowedDomain.toLowerCase();

    // Exact match
    if (normalizedHostname === normalizedAllowed) {
      return true;
    }

    // Wildcard subdomain match (e.g., *.blob.core.windows.net)
    if (normalizedAllowed.startsWith('*.')) {
      const baseDomain = normalizedAllowed.substring(2);
      return (
        normalizedHostname.endsWith(`.${baseDomain}`) ||
        normalizedHostname === baseDomain
      );
    }

    // Standard subdomain matching (e.g., anything.blob.core.windows.net for blob.core.windows.net)
    return normalizedHostname.endsWith(`.${normalizedAllowed}`);
  });
}

/**
 * Resolve hostname to IP addresses using DNS
 * Validates that resolved IPs are not internal/private
 */
async function validateResolvedIPs(hostname: string): Promise<void> {
  // Skip DNS resolution for IP addresses
  const ipv4Pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const ipv6Pattern = /^[\da-fA-F:]+$/;

  if (ipv4Pattern.test(hostname)) {
    if (isBlockedIP(hostname)) {
      throw new SSRFError(
        `IP address blocked: ${hostname}`,
        hostname,
        'blocked_ip',
        hostname
      );
    }
    return;
  }

  if (ipv6Pattern.test(hostname) || hostname.startsWith('[')) {
    if (isBlockedIP(hostname)) {
      throw new SSRFError(
        `IPv6 address blocked: ${hostname}`,
        hostname,
        'blocked_ipv6',
        hostname
      );
    }
    return;
  }

  // Perform DNS resolution
  try {
    // Resolve IPv4 addresses
    const ipv4Addresses = await dns.resolve4(hostname).catch(() => []);

    for (const ip of ipv4Addresses) {
      if (isBlockedIP(ip)) {
        logger.warn('SSRF Protection: DNS rebinding attack detected', {
          hostname,
          resolvedIP: ip,
        });
        throw new SSRFError(
          `DNS resolves to blocked IP: ${ip}`,
          hostname,
          'dns_rebinding',
          ip
        );
      }
    }

    // Resolve IPv6 addresses
    const ipv6Addresses = await dns.resolve6(hostname).catch(() => []);

    for (const ip of ipv6Addresses) {
      if (isBlockedIP(ip)) {
        logger.warn('SSRF Protection: DNS rebinding attack detected (IPv6)', {
          hostname,
          resolvedIP: ip,
        });
        throw new SSRFError(
          `DNS resolves to blocked IPv6: ${ip}`,
          hostname,
          'dns_rebinding_ipv6',
          ip
        );
      }
    }
  } catch (error) {
    if (error instanceof SSRFError) {
      throw error;
    }
    // DNS resolution failed - could be legitimate (new domain, temporary issue)
    // Log but don't block
    logger.debug('DNS resolution failed for hostname', {
      hostname,
      error: (error as Error).message,
    });
  }
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

export interface ValidateUrlOptions {
  /** Custom list of allowed domains (defaults to ALLOWED_HOSTS) */
  allowedDomains?: string[];
  /** Allow private IPs (dangerous - only for internal services) */
  allowPrivateIPs?: boolean;
  /** Skip DNS resolution check (faster but less secure) */
  skipDnsCheck?: boolean;
}

/**
 * Validate a URL for SSRF vulnerabilities
 *
 * @param urlString - The URL to validate
 * @param options - Validation options
 * @throws SSRFError if the URL is not allowed
 */
export async function validateOutboundUrl(
  urlString: string,
  options: ValidateUrlOptions = {}
): Promise<void> {
  const {
    allowedDomains = ALLOWED_HOSTS,
    allowPrivateIPs = false,
    skipDnsCheck = false,
  } = options;

  let url: URL;

  // Parse URL
  try {
    url = new URL(urlString);
  } catch (error) {
    throw new SSRFError('Invalid URL format', urlString, 'malformed_url');
  }

  // Validate scheme (only http/https allowed)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new SSRFError(
      `Invalid URL scheme: ${url.protocol}. Only http and https are allowed.`,
      urlString,
      'invalid_scheme'
    );
  }

  const hostname = url.hostname.toLowerCase();

  // Check blocked hostnames
  if (isBlockedHostname(hostname)) {
    throw new SSRFError(`Blocked hostname: ${hostname}`, urlString, 'blocked_hostname');
  }

  // Check private IPs in hostname (unless explicitly allowed)
  if (!allowPrivateIPs && isBlockedIP(hostname)) {
    throw new SSRFError(
      `Private IP address not allowed: ${hostname}`,
      urlString,
      'private_ip',
      hostname
    );
  }

  // Check domain allowlist
  if (!isAllowedHost(hostname, allowedDomains)) {
    throw new SSRFError(
      `Host not allowed: ${hostname}`,
      urlString,
      'host_not_allowed'
    );
  }

  // Perform DNS resolution check (to prevent DNS rebinding attacks)
  if (!skipDnsCheck && !allowPrivateIPs) {
    await validateResolvedIPs(hostname);
  }
}

/**
 * Synchronous URL validation (without DNS check)
 * Use this when async validation is not possible
 */
export function validateOutboundUrlSync(
  urlString: string,
  options: Omit<ValidateUrlOptions, 'skipDnsCheck'> = {}
): void {
  const { allowedDomains = ALLOWED_HOSTS, allowPrivateIPs = false } = options;

  let url: URL;

  try {
    url = new URL(urlString);
  } catch (error) {
    throw new SSRFError('Invalid URL format', urlString, 'malformed_url');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new SSRFError(
      `Invalid URL scheme: ${url.protocol}`,
      urlString,
      'invalid_scheme'
    );
  }

  const hostname = url.hostname.toLowerCase();

  if (isBlockedHostname(hostname)) {
    throw new SSRFError(`Blocked hostname: ${hostname}`, urlString, 'blocked_hostname');
  }

  if (!allowPrivateIPs && isBlockedIP(hostname)) {
    throw new SSRFError(
      `Private IP address not allowed: ${hostname}`,
      urlString,
      'private_ip',
      hostname
    );
  }

  if (!isAllowedHost(hostname, allowedDomains)) {
    throw new SSRFError(
      `Host not allowed: ${hostname}`,
      urlString,
      'host_not_allowed'
    );
  }
}

// =============================================================================
// SAFE HTTP REQUEST FUNCTIONS
// =============================================================================

export interface SafeRequestOptions extends AxiosRequestConfig {
  /** Custom allowed domains */
  allowedDomains?: string[];
  /** Allow private IPs (dangerous) */
  allowPrivateIPs?: boolean;
  /** Skip DNS resolution check */
  skipDnsCheck?: boolean;
}

/**
 * Make a safe HTTP GET request with SSRF protection
 */
export async function safeGet<T = any>(
  url: string,
  options: SafeRequestOptions = {}
): Promise<AxiosResponse<T>> {
  const {
    allowedDomains,
    allowPrivateIPs,
    skipDnsCheck,
    timeout = 30000,
    maxRedirects = 5,
    ...axiosConfig
  } = options;

  // Validate URL
  await validateOutboundUrl(url, { allowedDomains, allowPrivateIPs, skipDnsCheck });

  return axios.get<T>(url, {
    ...axiosConfig,
    timeout,
    maxRedirects,
  });
}

/**
 * Make a safe HTTP POST request with SSRF protection
 */
export async function safePost<T = any>(
  url: string,
  data?: any,
  options: SafeRequestOptions = {}
): Promise<AxiosResponse<T>> {
  const {
    allowedDomains,
    allowPrivateIPs,
    skipDnsCheck,
    timeout = 30000,
    maxRedirects = 5,
    ...axiosConfig
  } = options;

  await validateOutboundUrl(url, { allowedDomains, allowPrivateIPs, skipDnsCheck });

  return axios.post<T>(url, data, {
    ...axiosConfig,
    timeout,
    maxRedirects,
  });
}

/**
 * Make a safe HTTP PUT request with SSRF protection
 */
export async function safePut<T = any>(
  url: string,
  data?: any,
  options: SafeRequestOptions = {}
): Promise<AxiosResponse<T>> {
  const {
    allowedDomains,
    allowPrivateIPs,
    skipDnsCheck,
    timeout = 30000,
    maxRedirects = 5,
    ...axiosConfig
  } = options;

  await validateOutboundUrl(url, { allowedDomains, allowPrivateIPs, skipDnsCheck });

  return axios.put<T>(url, data, {
    ...axiosConfig,
    timeout,
    maxRedirects,
  });
}

/**
 * Make a safe HTTP PATCH request with SSRF protection
 */
export async function safePatch<T = any>(
  url: string,
  data?: any,
  options: SafeRequestOptions = {}
): Promise<AxiosResponse<T>> {
  const {
    allowedDomains,
    allowPrivateIPs,
    skipDnsCheck,
    timeout = 30000,
    maxRedirects = 5,
    ...axiosConfig
  } = options;

  await validateOutboundUrl(url, { allowedDomains, allowPrivateIPs, skipDnsCheck });

  return axios.patch<T>(url, data, {
    ...axiosConfig,
    timeout,
    maxRedirects,
  });
}

/**
 * Make a safe HTTP DELETE request with SSRF protection
 */
export async function safeDelete<T = any>(
  url: string,
  options: SafeRequestOptions = {}
): Promise<AxiosResponse<T>> {
  const {
    allowedDomains,
    allowPrivateIPs,
    skipDnsCheck,
    timeout = 30000,
    maxRedirects = 5,
    ...axiosConfig
  } = options;

  await validateOutboundUrl(url, { allowedDomains, allowPrivateIPs, skipDnsCheck });

  return axios.delete<T>(url, {
    ...axiosConfig,
    timeout,
    maxRedirects,
  });
}

/**
 * Create a safe axios instance with SSRF protection interceptor
 */
export function createSafeAxiosInstance(
  baseURL: string,
  options: SafeRequestOptions = {}
): ReturnType<typeof axios.create> {
  const { allowedDomains, allowPrivateIPs, skipDnsCheck, ...axiosConfig } = options;

  // Validate base URL synchronously
  validateOutboundUrlSync(baseURL, { allowedDomains, allowPrivateIPs });

  const instance = axios.create({
    baseURL,
    timeout: 30000,
    maxRedirects: 5,
    ...axiosConfig,
  });

  // Add request interceptor for URL validation
  instance.interceptors.request.use(async (config) => {
    const url = config.url || '';
    const fullURL = url.startsWith('http') ? url : `${baseURL}${url}`;

    await validateOutboundUrl(fullURL, { allowedDomains, allowPrivateIPs, skipDnsCheck });

    return config;
  });

  return instance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  validateOutboundUrl,
  validateOutboundUrlSync,
  safeGet,
  safePost,
  safePut,
  safePatch,
  safeDelete,
  createSafeAxiosInstance,
  SSRFError,
  ALLOWED_HOSTS,
};
