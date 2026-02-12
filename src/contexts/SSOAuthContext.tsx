/**
 * SSO Authentication Context
 * Brand new, clean implementation using Azure AD
 *
 * Features:
 * - Azure AD SSO via MSAL
 * - Automatic session management
 * - Production-ready error handling
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import {
  initializeMsal,
  isAuthenticated as checkIsAuthenticated,
  getUserProfile as getProfile,
  signInWithRedirect,
  signInWithPopup,
  signOut as performSignOut,
  getAccessToken as fetchAccessToken,
} from '@/lib/auth/auth.service'
import logger from '@/utils/logger'

/**
 * User profile from Azure AD
 */
export interface AuthUser {
  id: string
  email: string
  name: string
  username: string
  tenantId: string
}

/**
 * Auth Context Type
 */
interface SSOAuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: () => Promise<void>
  signInPopup: () => Promise<void>
  signOut: () => Promise<void>
  getAccessToken: (scopes?: string[]) => Promise<string>
}

const SSOAuthContext = createContext<SSOAuthContextType | undefined>(undefined)

/**
 * Hook to use auth context
 */
export function useSSOAuth() {
  const context = useContext(SSOAuthContext)
  if (!context) {
    throw new Error('useSSOAuth must be used within SSOAuthProvider')
  }
  return context
}

/**
 * SSO Auth Provider Component
 */
export function SSOAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize MSAL and check for existing session
  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        logger.info('[SSO Auth] Initializing authentication')

        // Initialize MSAL
        await initializeMsal()

        // Check if user is already authenticated
        if (checkIsAuthenticated()) {
          const profile = getProfile()
          if (profile && mounted) {
            setUser(profile)
            logger.info('[SSO Auth] User authenticated', { email: profile.email })
          }
        } else {
          logger.info('[SSO Auth] No authenticated session found')
        }
      } catch (error) {
        logger.error('[SSO Auth] Initialization failed:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [])

  /**
   * Sign in with redirect (recommended)
   */
  const signIn = async () => {
    setIsLoading(true)
    try {
      await signInWithRedirect()
      // User will be redirected, component will unmount
    } catch (error) {
      logger.error('[SSO Auth] Sign-in failed:', error)
      setIsLoading(false)
      throw error
    }
  }

  /**
   * Sign in with popup (alternative)
   */
  const signInPopup = async () => {
    setIsLoading(true)
    try {
      await signInWithPopup()

      // Get user profile after successful sign-in
      const profile = getProfile()
      if (profile) {
        setUser(profile)
        logger.info('[SSO Auth] User signed in', { email: profile.email })
      }
    } catch (error) {
      logger.error('[SSO Auth] Popup sign-in failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Sign out
   */
  const signOut = async () => {
    try {
      await performSignOut()
      setUser(null)
      logger.info('[SSO Auth] User signed out')
    } catch (error) {
      logger.error('[SSO Auth] Sign-out failed:', error)
      throw error
    }
  }

  /**
   * Get access token for API calls
   */
  const getAccessToken = async (scopes?: string[]): Promise<string> => {
    try {
      return await fetchAccessToken(scopes)
    } catch (error) {
      logger.error('[SSO Auth] Failed to get access token:', error)
      throw error
    }
  }

  const value: SSOAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signInPopup,
    signOut,
    getAccessToken,
  }

  return (
    <SSOAuthContext.Provider value={value}>
      {children}
    </SSOAuthContext.Provider>
  )
}

export default SSOAuthContext
