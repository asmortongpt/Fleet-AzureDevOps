/**
 * Secure Auth Token Storage Utilities
 * Frontend Security - Task 7/8
 * Fortune 50 Security Standards
 */

import { setSecureCookie, getCookie, deleteCookie } from './secure-cookie';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

/**
 * Store authentication token securely
 * @param token - JWT access token
 * @param expiresIn - Token expiration in seconds
 */
export function storeAuthToken(token: string, expiresIn: number = 3600): void {
  if (!token) {
    throw new Error('Token is required');
  }

  // Calculate expiry timestamp
  const expiryTime = Date.now() + expiresIn * 1000;

  // Store in secure cookie (httpOnly would be set by server)
  setSecureCookie(TOKEN_KEY, token, {
    maxAge: expiresIn,
    sameSite: 'strict',
    path: '/',
  });

  // Store expiry in sessionStorage for client-side checks
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Store refresh token securely
 * @param refreshToken - JWT refresh token
 * @param expiresIn - Refresh token expiration in seconds (default 7 days)
 */
export function storeRefreshToken(refreshToken: string, expiresIn: number = 604800): void {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  setSecureCookie(REFRESH_TOKEN_KEY, refreshToken, {
    maxAge: expiresIn,
    sameSite: 'strict',
    path: '/',
  });
}

/**
 * Get authentication token
 * @returns Auth token or null if not found/expired
 */
export function getAuthToken(): string | null {
  const token = getCookie(TOKEN_KEY);

  if (!token) {
    return null;
  }

  // Check if token is expired
  const expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (expiryStr) {
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() >= expiry) {
      clearAuthTokens();
      return null;
    }
  }

  return token;
}

/**
 * Get refresh token
 * @returns Refresh token or null if not found
 */
export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_KEY);
}

/**
 * Check if user is authenticated
 * @returns True if valid auth token exists
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  deleteCookie(TOKEN_KEY, { path: '/' });
  deleteCookie(REFRESH_TOKEN_KEY, { path: '/' });
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Get time until token expiry in seconds
 * @returns Seconds until expiry or null if no token
 */
export function getTokenExpiryTime(): number | null {
  const expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!expiryStr) {
    return null;
  }

  const expiry = parseInt(expiryStr, 10);
  const secondsRemaining = Math.floor((expiry - Date.now()) / 1000);

  return secondsRemaining > 0 ? secondsRemaining : 0;
}
