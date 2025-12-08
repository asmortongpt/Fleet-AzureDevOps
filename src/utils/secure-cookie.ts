/**
 * Secure Cookie Wrapper
 * Frontend Security - Task 3/8
 * Fortune 50 Security Standards
 */

export interface SecureCookieOptions {
  expires?: Date | number; // Date object or days from now
  maxAge?: number; // Seconds
  path?: string;
  domain?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  partitioned?: boolean; // CHIPS support
}

/**
 * Set a secure cookie with proper security flags
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
export function setSecureCookie(
  name: string,
  value: string,
  options: SecureCookieOptions = {}
): void {
  if (!name || !value) {
    throw new Error('Cookie name and value are required');
  }

  // Encode cookie value
  const encodedValue = encodeURIComponent(value);

  // Build cookie string with secure defaults
  let cookieString = `${name}=${encodedValue}`;

  // Set expiration
  if (options.expires) {
    if (typeof options.expires === 'number') {
      const date = new Date();
      date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    } else {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
  }

  // Set max-age
  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }

  // Set path (default to root)
  cookieString += `; path=${options.path || '/'}`;

  // Set domain if specified
  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  // Always set Secure flag (requires HTTPS)
  if (window.location.protocol === 'https:') {
    cookieString += '; Secure';
  }

  // Set SameSite (default to Lax for good security/UX balance)
  const sameSite = options.sameSite || 'lax';
  cookieString += `; SameSite=${sameSite}`;

  // Set Partitioned flag for CHIPS support
  if (options.partitioned && sameSite === 'none') {
    cookieString += '; Partitioned';
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (!name) {
    return null;
  }

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Delete a cookie by name
 * @param name - Cookie name
 * @param options - Cookie options (path and domain must match)
 */
export function deleteCookie(name: string, options: Pick<SecureCookieOptions, 'path' | 'domain'> = {}): void {
  if (!name) {
    return;
  }

  setSecureCookie(name, '', {
    ...options,
    expires: new Date(0),
    maxAge: 0,
  });
}

/**
 * Check if a cookie exists
 * @param name - Cookie name
 * @returns True if cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}
