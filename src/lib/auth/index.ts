/**
 * Auth Module Entry Point
 * Re-exports authentication functions from auth.service.ts
 * Provides compatibility with existing import patterns
 */

export {
  initializeMsal,
  getMsalInstance,
  signInWithRedirect as loginWithRedirect,
  signInWithPopup as loginWithPopup,
  signOut as logout,
  getCurrentAccount as getAccount,
  isAuthenticated,
  getAccessToken,
  getUserProfile,
  handleAuthCallback
} from './auth.service'

// Export types from MSAL
export type { AccountInfo, AuthenticationResult } from '@azure/msal-browser'
