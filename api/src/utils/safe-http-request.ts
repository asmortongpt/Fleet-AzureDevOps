/**
 * Safe HTTP Request Utility
 *
 * Prevents Server-Side Request Forgery (SSRF) vulnerabilities by:
 * - Validating URLs before making requests
 * - Blocking private IP ranges (127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Blocking cloud metadata endpoints (169.254.169.254)
 * - Enforcing URL whitelists/allowlists
 * - Validating URL schemes (only http/https)
 * - Implementing request timeouts
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { URL } from 'url'

// Default allowed domains for external services
const DEFAULT_ALLOWED_DOMAINS = [
  // Mapbox
  'api.mapbox.com',
  'nominatim.openstreetmap.org',

  // Google
  'maps.googleapis.com',
  'geocode.arcgis.com',

  // Telematics providers
  'api.smartcar.com',
  'auth.smartcar.com',
  'management.smartcar.com',
  'api.samsara.com',

  // Microsoft services
  'graph.microsoft.com',
  'login.microsoftonline.com',
  'api.office.com',

  // Azure Storage (blob.core.windows.net subdomains)
  'blob.core.windows.net',

  // OpenStreetMap
  'openstreetmap.org'
]

// Private IP ranges (CIDR notation)
const PRIVATE_IP_RANGES = [
  { start: '10.0.0.0', end: '10.255.255.255' },      // 10.0.0.0/8
  { start: '172.16.0.0', end: '172.31.255.255' },    // 172.16.0.0/12
  { start: '192.168.0.0', end: '192.168.255.255' },  // 192.168.0.0/16
  { start: '127.0.0.0', end: '127.255.255.255' },    // 127.0.0.0/8 (localhost)
  { start: '169.254.0.0', end: '169.254.255.255' },  // 169.254.0.0/16 (link-local, AWS metadata)
  { start: '0.0.0.0', end: '0.255.255.255' },        // 0.0.0.0/8
]

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  '169.254.169.254', // AWS/Azure metadata endpoint
  'metadata.google.internal', // GCP metadata
  'metadata',
  '::1', // IPv6 localhost
]

export interface SafeRequestOptions extends AxiosRequestConfig {
  allowedDomains?: string[]
  allowPrivateIPs?: boolean
  maxRedirects?: number
}

export class SSRFError extends Error {
  constructor(message: string, public readonly url: string, public readonly reason: string) {
    super(`SSRF Protection: ${message}`)
    this.name = 'SSRFError'
  }
}

/**
 * Convert IP address string to number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number)
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}

/**
 * Check if IP is in private range
 */
function isPrivateIP(ip: string): boolean {
  // Handle IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true
  }

  // Only check IPv4
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return false
  }

  const ipNum = ipToNumber(ip)

  for (const range of PRIVATE_IP_RANGES) {
    const startNum = ipToNumber(range.start)
    const endNum = ipToNumber(range.end)

    if (ipNum >= startNum && ipNum <= endNum) {
      return true
    }
  }

  return false
}

/**
 * Validate URL before making HTTP request
 */
export function validateURL(
  urlString: string,
  options: { allowedDomains?: string[]; allowPrivateIPs?: boolean } = {}
): void {
  const { allowedDomains = DEFAULT_ALLOWED_DOMAINS, allowPrivateIPs = false } = options

  let url: URL

  // Parse URL
  try {
    url = new URL(urlString)
  } catch (error) {
    throw new SSRFError('Invalid URL format', urlString, 'malformed_url')
  }

  // Validate scheme
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new SSRFError(
      `Invalid URL scheme: ${url.protocol}. Only http and https are allowed.`,
      urlString,
      'invalid_scheme'
    )
  }

  // Get hostname
  const hostname = url.hostname.toLowerCase()

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new SSRFError(
      `Blocked hostname: ${hostname}`,
      urlString,
      'blocked_hostname'
    )
  }

  // Check for private IPs (unless explicitly allowed)
  if (!allowPrivateIPs && isPrivateIP(hostname)) {
    throw new SSRFError(
      `Private IP address not allowed: ${hostname}`,
      urlString,
      'private_ip'
    )
  }

  // Check domain whitelist
  const isAllowed = allowedDomains.some(allowedDomain => {
    // Exact match
    if (hostname === allowedDomain) {
      return true
    }

    // Subdomain match (e.g., *.blob.core.windows.net)
    if (allowedDomain.indexOf('*.') === 0) {
      const baseDomain = allowedDomain.substring(2)
      return hostname.indexOf('.' + baseDomain, hostname.length - baseDomain.length - 1) !== -1 || hostname === baseDomain
    }

    // Allow subdomains by default
    return hostname.indexOf('.' + allowedDomain, hostname.length - allowedDomain.length - 1) !== -1
  })

  if (!isAllowed) {
    throw new SSRFError(
      `Domain not in allowlist: ${hostname}`,
      urlString,
      'domain_not_allowed'
    )
  }
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
    allowPrivateIPs = false,
    maxRedirects = 5,
    timeout = 30000,
    ...axiosConfig
  } = options

  // Validate URL
  validateURL(url, { allowedDomains, allowPrivateIPs })

  // Make request with safety options
  return axios.get<T>(url, {
    ...axiosConfig,
    timeout,
    maxRedirects,
    validateStatus: (status) => status < 500, // Accept all non-5xx responses
  })
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
    allowPrivateIPs = false,
    maxRedirects = 5,
    timeout = 30000,
    ...axiosConfig
  } = options

  // Validate URL
  validateURL(url, { allowedDomains, allowPrivateIPs })

  // Make request with safety options
  return axios.post<T>(url, data, {
    ...axiosConfig,
    timeout,
    maxRedirects,
  })
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
    allowPrivateIPs = false,
    maxRedirects = 5,
    timeout = 30000,
    ...axiosConfig
  } = options

  // Validate URL
  validateURL(url, { allowedDomains, allowPrivateIPs })

  // Make request with safety options
  return axios.put<T>(url, data, {
    ...axiosConfig,
    timeout,
    maxRedirects,
  })
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
    allowPrivateIPs = false,
    maxRedirects = 5,
    timeout = 30000,
    ...axiosConfig
  } = options

  // Validate URL
  validateURL(url, { allowedDomains, allowPrivateIPs })

  // Make request with safety options
  return axios.delete<T>(url, {
    ...axiosConfig,
    timeout,
    maxRedirects,
  })
}

/**
 * Create a safe axios instance with SSRF protection
 */
export function createSafeAxiosInstance(
  baseURL: string,
  options: SafeRequestOptions = {}
): typeof axios {
  const { allowedDomains, allowPrivateIPs = false, ...axiosConfig } = options

  // Validate base URL
  validateURL(baseURL, { allowedDomains, allowPrivateIPs })

  // Create axios instance
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    maxRedirects: 5,
    ...axiosConfig,
  })

  // Add request interceptor to validate all URLs
  instance.interceptors.request.use((config) => {
    const url = config.url
    if (url) {
      // Construct full URL
      const fullURL = url.startsWith('http') ? url : `${baseURL}${url}`
      validateURL(fullURL, { allowedDomains, allowPrivateIPs })
    }
    return config
  })

  return instance
}

export default {
  validateURL,
  safeGet,
  safePost,
  safePut,
  safeDelete,
  createSafeAxiosInstance,
  SSRFError,
}
