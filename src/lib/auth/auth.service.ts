/**
 * Azure AD Authentication Service
 * Clean, production-ready SSO implementation using MSAL
 */

import {
  PublicClientApplication,
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
  BrowserAuthError,
} from '@azure/msal-browser'

import { msalConfig, loginScopes } from './msal.config'

import logger from '@/utils/logger'

// Singleton MSAL instance
let msalInstance: PublicClientApplication | null = null

/**
 * Initialize MSAL Public Client Application
 * Should be called once at app startup
 */
export async function initializeMsal(): Promise<PublicClientApplication> {
  if (msalInstance) {
    return msalInstance
  }

  try {
    msalInstance = new PublicClientApplication(msalConfig)
    await msalInstance.initialize()

    // Handle redirect promise on page load
    await msalInstance.handleRedirectPromise()

    logger.info('[Auth Service] MSAL initialized successfully')
    return msalInstance
  } catch (error) {
    logger.error('[Auth Service] Failed to initialize MSAL:', error)
    throw new Error('Authentication system initialization failed')
  }
}

/**
 * Get MSAL instance (must be initialized first)
 */
export function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    throw new Error('MSAL not initialized. Call initializeMsal() first.')
  }
  return msalInstance
}

/**
 * Sign in with redirect flow
 * Recommended for production (better UX, avoids popup blockers)
 */
export async function signInWithRedirect(): Promise<void> {
  try {
    const instance = getMsalInstance()
    await instance.loginRedirect(loginScopes)
  } catch (error) {
    logger.error('[Auth Service] Sign-in redirect failed:', error)
    throw error
  }
}

/**
 * Sign in with popup flow
 * Alternative method if redirect is not desired
 */
export async function signInWithPopup(): Promise<AuthenticationResult> {
  try {
    const instance = getMsalInstance()
    const result = await instance.loginPopup(loginScopes)
    logger.info('[Auth Service] Sign-in successful', {
      account: result.account?.username
    })
    return result
  } catch (error) {
    if (error instanceof BrowserAuthError) {
      logger.error('[Auth Service] Popup was blocked or closed:', error)
      throw new Error('Sign-in popup was blocked. Please allow popups or use the redirect method.')
    }
    logger.error('[Auth Service] Sign-in popup failed:', error)
    throw error
  }
}

/**
 * Sign out (clears all accounts)
 */
export async function signOut(): Promise<void> {
  try {
    const instance = getMsalInstance()
    const account = instance.getAllAccounts()[0]

    if (account) {
      await instance.logoutRedirect({ account })
    } else {
      await instance.logoutRedirect()
    }

    logger.info('[Auth Service] Sign-out initiated')
  } catch (error) {
    logger.error('[Auth Service] Sign-out failed:', error)
    throw error
  }
}

/**
 * Get current authenticated account
 */
export function getCurrentAccount(): AccountInfo | null {
  try {
    const instance = getMsalInstance()
    const accounts = instance.getAllAccounts()

    if (accounts.length === 0) {
      return null
    }

    // Return the first account (single account scenario)
    // In multi-account scenarios, you'd need additional logic here
    return accounts[0]
  } catch (error) {
    logger.error('[Auth Service] Failed to get current account:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentAccount() !== null
}

/**
 * Get access token silently
 * Will attempt silent acquisition, fall back to interaction if needed
 */
export async function getAccessToken(scopes: string[] = loginScopes.scopes): Promise<string> {
  try {
    const instance = getMsalInstance()
    const account = getCurrentAccount()

    if (!account) {
      throw new Error('No authenticated account found')
    }

    // Try silent token acquisition first
    try {
      const response = await instance.acquireTokenSilent({
        scopes,
        account,
      })
      return response.accessToken
    } catch (silentError) {
      // If silent acquisition fails due to interaction required, fall back to popup
      if (silentError instanceof InteractionRequiredAuthError) {
        logger.warn('[Auth Service] Silent token acquisition failed, requiring interaction')
        const response = await instance.acquireTokenPopup({
          scopes,
          account,
        })
        return response.accessToken
      }
      throw silentError
    }
  } catch (error) {
    logger.error('[Auth Service] Failed to get access token:', error)
    throw error
  }
}

/**
 * Get user profile information from the account
 */
export function getUserProfile(): {
  id: string
  email: string
  name: string
  username: string
  tenantId: string
} | null {
  const account = getCurrentAccount()

  if (!account) {
    return null
  }

  return {
    id: account.localAccountId,
    email: account.username,
    name: account.name || account.username,
    username: account.username,
    tenantId: account.tenantId,
  }
}

/**
 * Handle auth callback after redirect
 * Should be called in callback route component
 */
export async function handleAuthCallback(): Promise<AuthenticationResult | null> {
  try {
    const instance = getMsalInstance()
    const response = await instance.handleRedirectPromise()

    if (response) {
      logger.info('[Auth Service] Auth callback successful', {
        account: response.account?.username,
      })
      return response
    }

    return null
  } catch (error) {
    logger.error('[Auth Service] Auth callback failed:', error)
    throw error
  }
}
