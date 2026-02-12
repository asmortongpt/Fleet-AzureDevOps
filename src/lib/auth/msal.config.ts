/**
 * MSAL Configuration for Azure AD Authentication
 * Production-ready SSO implementation
 *
 * Security Features:
 * - PKCE flow for enhanced security
 * - Token caching in browser storage
 * - Automatic token refresh
 * - MFA support
 */

import { Configuration, LogLevel } from '@azure/msal-browser'

// Azure AD Configuration from environment variables
const AZURE_AD_CLIENT_ID = import.meta.env.VITE_AZURE_AD_CLIENT_ID
const AZURE_AD_TENANT_ID = import.meta.env.VITE_AZURE_AD_TENANT_ID
const AZURE_AD_REDIRECT_URI = import.meta.env.VITE_AZURE_AD_REDIRECT_URI || `${window.location.origin}/auth/callback`

// Validate required environment variables
if (!AZURE_AD_CLIENT_ID) {
  throw new Error('VITE_AZURE_AD_CLIENT_ID is not configured')
}

if (!AZURE_AD_TENANT_ID) {
  throw new Error('VITE_AZURE_AD_TENANT_ID is not configured')
}

/**
 * MSAL Configuration Object
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}`,
    redirectUri: AZURE_AD_REDIRECT_URI,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage', // Use localStorage for persistence across tabs
  },
  system: {
    loggerOptions: {
      logLevel: import.meta.env.DEV ? LogLevel.Verbose : LogLevel.Warning,
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) return // Never log PII

        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL]', message)
            break
          case LogLevel.Warning:
            console.warn('[MSAL]', message)
            break
        }
      },
      piiLoggingEnabled: false,
    },
  },
}

/**
 * Scopes to request during login
 */
export const loginScopes = {
  scopes: [
    'openid',
    'profile',
    'email',
    'User.Read', // Microsoft Graph - read user profile
  ],
}

/**
 * Protected resource scopes (if needed for API calls)
 */
export const apiScopes = {
  scopes: [
    `api://${AZURE_AD_CLIENT_ID}/access_as_user`,
  ],
}
