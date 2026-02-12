/**
 * MSAL Authentication Hook
 *
 * Custom React hook for MSAL browser authentication operations
 * Provides login, logout, token acquisition, and authentication status
 *
 * Features:
 * - Login with redirect flow (recommended for production)
 * - Login with popup flow (alternative method)
 * - Automatic token refresh
 * - Silent token acquisition with fallback
 * - Comprehensive error handling
 * - Debug logging for troubleshooting
 */

import {
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
  InteractionStatus
} from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useCallback, useEffect, useState } from 'react';

import { loginRequest } from '@/lib/msal-config';
import logger from '@/utils/logger';

export interface UseMsalAuthReturn {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  error: string | null;

  // Authentication methods
  login: () => Promise<void>;
  loginPopup: () => Promise<AuthenticationResult | null>;
  logout: () => Promise<void>;
  getAccessToken: (scopes?: string[]) => Promise<string | null>;

  // Helper methods
  clearError: () => void;
}

export function useMsalAuth(): UseMsalAuthReturn {
  const { instance, accounts, inProgress } = useMsal();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Log MSAL state changes for debugging
  useEffect(() => {
    logger.debug('[useMsalAuth] MSAL state changed', {
      accountsCount: accounts.length,
      inProgress,
      hasAccount: accounts.length > 0,
      account: accounts[0]?.username
    });
  }, [accounts, inProgress]);

  // Check if user is authenticated
  const isAuthenticated = accounts.length > 0;
  const account = accounts[0] || null;

  /**
   * Login with redirect flow (recommended for production)
   * Redirects user to Microsoft login page, then returns to /auth/callback
   */
  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.info('[useMsalAuth] Initiating login redirect', {
        redirectUri: loginRequest.redirectUri || window.location.origin + '/auth/callback',
        scopes: loginRequest.scopes
      });

      // Start redirect flow
      await instance.loginRedirect({
        ...loginRequest,
        redirectUri: loginRequest.redirectUri || window.location.origin + '/auth/callback'
      });

      // Note: Code after loginRedirect won't execute because browser redirects
      logger.debug('[useMsalAuth] Login redirect initiated (page will redirect)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      logger.error('[useMsalAuth] Login redirect failed', { error: err });
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [instance]);

  /**
   * Login with popup flow (alternative method)
   * Opens popup window for Microsoft login
   */
  const loginPopup = useCallback(async (): Promise<AuthenticationResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.info('[useMsalAuth] Initiating login popup', {
        scopes: loginRequest.scopes
      });

      const result = await instance.loginPopup(loginRequest);

      logger.info('[useMsalAuth] Login popup successful', {
        account: result.account?.username,
        scopes: result.scopes,
        expiresOn: result.expiresOn
      });

      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Popup login failed';
      logger.error('[useMsalAuth] Login popup failed', { error: err });
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [instance]);

  /**
   * Logout user and clear MSAL cache
   * Redirects to Microsoft logout page
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.info('[useMsalAuth] Initiating logout', {
        account: account?.username
      });

      // Logout with redirect
      await instance.logoutRedirect({
        account: account || undefined,
        postLogoutRedirectUri: window.location.origin
      });

      // Note: Code after logoutRedirect won't execute because browser redirects
      logger.debug('[useMsalAuth] Logout redirect initiated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      logger.error('[useMsalAuth] Logout failed', { error: err });
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [instance, account]);

  /**
   * Get access token silently
   * Attempts silent acquisition first, falls back to interactive if needed
   *
   * @param scopes - Optional array of scopes (defaults to loginRequest.scopes)
   * @returns Access token string or null if failed
   */
  const getAccessToken = useCallback(async (scopes?: string[]): Promise<string | null> => {
    try {
      if (!account) {
        logger.warn('[useMsalAuth] Cannot get access token - no account found');
        setError('Not authenticated');
        return null;
      }

      // Wait for any in-progress interactions to complete
      if (inProgress !== InteractionStatus.None) {
        logger.debug('[useMsalAuth] Waiting for interaction to complete', { inProgress });
        return null;
      }

      const tokenScopes = scopes || loginRequest.scopes;

      logger.debug('[useMsalAuth] Attempting silent token acquisition', {
        account: account.username,
        scopes: tokenScopes
      });

      // Try silent token acquisition first
      try {
        const result = await instance.acquireTokenSilent({
          scopes: tokenScopes,
          account: account,
          forceRefresh: false
        });

        logger.info('[useMsalAuth] Silent token acquisition successful', {
          scopes: result.scopes,
          expiresOn: result.expiresOn
        });

        return result.accessToken;
      } catch (silentError) {
        // If silent acquisition fails due to interaction required, try popup
        if (silentError instanceof InteractionRequiredAuthError) {
          logger.warn('[useMsalAuth] Silent token acquisition failed - interaction required', {
            error: silentError.message
          });

          logger.debug('[useMsalAuth] Attempting interactive token acquisition via popup');

          const result = await instance.acquireTokenPopup({
            scopes: tokenScopes,
            account: account
          });

          logger.info('[useMsalAuth] Interactive token acquisition successful', {
            scopes: result.scopes,
            expiresOn: result.expiresOn
          });

          return result.accessToken;
        }

        // Other errors - rethrow
        throw silentError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token acquisition failed';
      logger.error('[useMsalAuth] Failed to get access token', { error: err });
      setError(errorMessage);
      return null;
    }
  }, [instance, account, inProgress]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAuthenticated,
    isLoading: isLoading || inProgress !== InteractionStatus.None,
    account,
    error,
    login,
    loginPopup,
    logout,
    getAccessToken,
    clearError
  };
}
