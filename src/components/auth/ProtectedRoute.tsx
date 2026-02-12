/**
 * Protected Route Component
 *
 * Wraps routes that require authentication
 * Automatically redirects to login if user is not authenticated
 *
 * Usage:
 * <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 * <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
 * <Route path="/vehicles" element={<ProtectedRoute requiredPermission="vehicles:read"><VehicleList /></ProtectedRoute>} />
 */

import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useMsalAuth } from '@/hooks/use-msal-auth'
import { useAuth } from '@/hooks/useAuth'
import logger from '@/utils/logger'

// Development auth bypass flag (reads from environment variable)
// WARNING: ONLY set VITE_SKIP_AUTH=true in local development/testing
// NEVER enable in production - enforced by production check below
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true' || import.meta.env.VITE_BYPASS_AUTH === 'true';

// Safety check: NEVER allow auth bypass in production
if (SKIP_AUTH && import.meta.env.PROD) {
  console.error('[SECURITY] Auth bypass attempted in production environment - BLOCKED');
  throw new Error('Auth bypass is not allowed in production');
}

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string | string[]
  requiredPermission?: string | string[]
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  requiredPermission
}: ProtectedRouteProps) => {
  const location = useLocation()
  const auth = useAuth()
  const msalAuth = useMsalAuth()
  const { user, isLoading: authLoading, canAccess } = auth
  const { isAuthenticated: msalAuthenticated, isLoading: msalLoading, account } = msalAuth
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Wait for both auth systems to finish loading
    if (authLoading || msalLoading) {
      logger.debug('[ProtectedRoute] Waiting for auth to initialize', {
        authLoading,
        msalLoading
      })
      return
    }

    const checkAuth = async () => {
      try {
        logger.debug('[ProtectedRoute] Checking authentication', {
          hasUser: !!user,
          hasMsalAccount: !!account,
          msalAuthenticated,
          requiredRole,
          requiredPermission
        })

        // DEV: Skip authentication if VITE_SKIP_AUTH=true
        if (SKIP_AUTH) {
          logger.info('[ProtectedRoute] SKIP_AUTH enabled - auto-authorizing');
          setIsAuthorized(true);
          setIsCheckingAuth(false);
          return;
        }

        // Check 1: AuthContext user (email/password login or MSAL-synced session via httpOnly cookies)
        if (user) {
          logger.debug('[ProtectedRoute] User found in AuthContext', {
            userId: user.id,
            role: user.role,
            email: user.email
          })

          if (requiredRole || requiredPermission) {
            const normalizedRole = requiredRole && (typeof requiredRole === 'string' || Array.isArray(requiredRole))
              ? requiredRole
              : undefined
            const normalizedPermission = requiredPermission && (typeof requiredPermission === 'string' || Array.isArray(requiredPermission))
              ? requiredPermission
              : undefined
            const authorized = canAccess(normalizedRole as any, normalizedPermission as any)
            setIsAuthorized(authorized)

            if (!authorized) {
              logger.warn('[ProtectedRoute] User not authorized for this route', {
                requiredRole,
                requiredPermission,
                userRole: user?.role,
                userPermissions: user?.permissions
              })
            } else {
              logger.debug('[ProtectedRoute] User authorized for this route')
            }
          } else {
            setIsAuthorized(true)
            logger.debug('[ProtectedRoute] No role/permission requirements - user authorized')
          }
          setIsCheckingAuth(false)
          return
        }

        // Check 2: MSAL authentication only (no backend session yet)
        if (msalAuthenticated && account) {
          logger.info('[ProtectedRoute] MSAL authenticated but no backend session', {
            account: account.username
          })

          // Allow access for MSAL-authenticated users
          // The AuthContext will sync the session in the background
          setIsAuthorized(true)
          setIsCheckingAuth(false)
          return
        }

        // No authentication found
        logger.warn('[ProtectedRoute] User not authenticated', {
          hasUser: !!user,
          msalAuthenticated,
          path: location.pathname
        })
        setIsAuthorized(false)
        setIsCheckingAuth(false)
      } catch (error) {
        logger.error('[ProtectedRoute] Authentication check failed:', { error })
        setIsAuthorized(false)
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [
    authLoading,
    msalLoading,
    requiredRole,
    requiredPermission,
    user,
    canAccess,
    msalAuthenticated,
    account,
    location.pathname
  ])

  // Show loading spinner while checking authentication
  if (isCheckingAuth || authLoading || msalLoading) {
    logger.debug('[ProtectedRoute] Showing loading spinner', {
      isCheckingAuth,
      authLoading,
      msalLoading
    })
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-slate-700">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated (check both AuthContext and MSAL)
  if (!user && !msalAuthenticated) {
    logger.info('[ProtectedRoute] Redirecting to login', { from: location.pathname })
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-3 text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-sm font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-slate-700 mb-3">
            You don't have permission to access this page.
          </p>
          {requiredRole && (
            <p className="text-sm text-gray-700 mb-2">
              Required role: {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}
            </p>
          )}
          {requiredPermission && (
            <p className="text-sm text-gray-700 mb-3">
              Required permission: {Array.isArray(requiredPermission) ? requiredPermission.join(', ') : requiredPermission}
            </p>
          )}
          <button
            onClick={() => window.history.back()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // User is authenticated and authorized
  return <>{children}</>
}