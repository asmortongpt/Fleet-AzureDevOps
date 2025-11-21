/**
 * Secure Redirect URL Validator
 *
 * Prevents open redirect vulnerabilities (CWE-601) by validating
 * all redirect URLs against a whitelist of allowed domains.
 *
 * Security principles:
 * - Only HTTPS protocol allowed in production
 * - Only whitelisted domains allowed
 * - Blocks dangerous schemes (javascript:, data:, file:)
 * - Blocks protocol-relative URLs (//)
 * - Validates internal paths must start with / but not //
 */

export interface RedirectValidatorConfig {
  allowedDomains: string[]
  allowHttp?: boolean // Only for development
  requireHttps?: boolean // Force HTTPS in production
}

/**
 * Default configuration for Fleet application
 */
const DEFAULT_CONFIG: RedirectValidatorConfig = {
  allowedDomains: [
    'fleet.capitaltechalliance.com',
    'capitaltechalliance.com',
    'localhost',
    '127.0.0.1',
    '68.220.148.2' // Current frontend IP
  ],
  allowHttp: process.env.NODE_ENV !== 'production',
  requireHttps: process.env.NODE_ENV === 'production'
}

/**
 * Validates an external redirect URL against whitelist
 *
 * @param url - The URL to validate
 * @param config - Optional configuration override
 * @returns true if URL is safe to redirect to
 */
export function validateRedirectUrl(
  url: string,
  config: RedirectValidatorConfig = DEFAULT_CONFIG
): boolean {
  try {
    // Parse the URL
    const target = new URL(url)

    // Block dangerous schemes
    const dangerousSchemes = ['javascript:', 'data:', 'file:', 'vbscript:', 'about:']
    if (dangerousSchemes.includes(target.protocol)) {
      console.warn(`Blocked redirect to dangerous scheme: ${target.protocol}`)
      return false
    }

    // In production, only allow HTTPS
    if (config.requireHttps && target.protocol !== 'https:') {
      console.warn(`Blocked non-HTTPS redirect in production: ${target.protocol}`)
      return false
    }

    // Allow HTTP only in development
    if (target.protocol === 'http:' && !config.allowHttp) {
      console.warn(`Blocked HTTP redirect when HTTP not allowed`)
      return false
    }

    // Only allow http: and https: protocols
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      console.warn(`Blocked redirect to non-HTTP(S) protocol: ${target.protocol}`)
      return false
    }

    // Check if hostname is in whitelist
    const hostname = target.hostname.toLowerCase()
    const isWhitelisted = config.allowedDomains.some(domain => {
      const normalizedDomain = domain.toLowerCase()
      // Exact match or subdomain match
      return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`)
    })

    if (!isWhitelisted) {
      console.warn(`Blocked redirect to non-whitelisted domain: ${hostname}`)
      return false
    }

    return true
  } catch (error) {
    // Invalid URL format
    console.warn(`Invalid redirect URL format: ${url}`)
    return false
  }
}

/**
 * Validates an internal path (relative URL)
 *
 * @param path - The path to validate (must start with /)
 * @returns true if path is safe for internal redirect
 */
export function validateInternalPath(path: string): boolean {
  // Must start with / but not // (protocol-relative URL)
  if (!path.startsWith('/')) {
    console.warn(`Internal path must start with /: ${path}`)
    return false
  }

  if (path.startsWith('//')) {
    console.warn(`Blocked protocol-relative URL: ${path}`)
    return false
  }

  // Block javascript: and other dangerous pseudo-protocols in paths
  const dangerousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /%2[fF]%2[fF]/, // Encoded //
    /%6[aA]avascript/i, // Encoded javascript
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(path)) {
      console.warn(`Blocked path with dangerous pattern: ${path}`)
      return false
    }
  }

  return true
}

/**
 * Sanitizes and validates a redirect URL, returning a safe default if invalid
 *
 * @param url - The URL or path to validate
 * @param defaultPath - Safe default path to use if validation fails
 * @param config - Optional configuration override
 * @returns A safe URL or path to redirect to
 */
export function safeRedirect(
  url: string | undefined | null,
  defaultPath: string = '/',
  config: RedirectValidatorConfig = DEFAULT_CONFIG
): string {
  // No URL provided, use default
  if (!url) {
    return defaultPath
  }

  // Trim whitespace
  const trimmedUrl = url.trim()

  // Check if it's an internal path
  if (trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) {
    return validateInternalPath(trimmedUrl) ? trimmedUrl : defaultPath
  }

  // Check if it's an external URL
  try {
    new URL(trimmedUrl) // Will throw if not a valid URL
    return validateRedirectUrl(trimmedUrl, config) ? trimmedUrl : defaultPath
  } catch {
    // Not a valid URL, treat as internal path
    return defaultPath
  }
}

/**
 * Gets the allowed frontend URL from environment with validation
 *
 * @returns Validated frontend URL
 * @throws Error if frontend URL is not configured or invalid
 */
export function getValidatedFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_API_URL

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL environment variable is not configured')
  }

  // Validate against whitelist
  if (!validateRedirectUrl(frontendUrl, DEFAULT_CONFIG)) {
    throw new Error(`FRONTEND_URL is not in allowed domains whitelist: ${frontendUrl}`)
  }

  return frontendUrl
}

/**
 * Build a safe redirect URL with query parameters
 *
 * @param basePath - Base path or URL
 * @param params - Query parameters to add
 * @returns Safe redirect URL with parameters
 */
export function buildSafeRedirectUrl(
  basePath: string,
  params?: Record<string, string>
): string {
  // Validate base path
  const safePath = safeRedirect(basePath, '/')

  if (!params || Object.keys(params).length === 0) {
    return safePath
  }

  // Build query string
  const queryString = new URLSearchParams(params).toString()

  // Append to path
  const separator = safePath.includes('?') ? '&' : '?'
  return `${safePath}${separator}${queryString}`
}

export default {
  validateRedirectUrl,
  validateInternalPath,
  safeRedirect,
  getValidatedFrontendUrl,
  buildSafeRedirectUrl,
  DEFAULT_CONFIG
}
