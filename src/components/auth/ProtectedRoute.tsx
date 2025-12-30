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

import { useAuth } from '@/hooks/useAuth'
import {
  initializeMsal,
  isAuthenticated,
  getAccount,
  getAccessToken
} from '@/lib/auth'
import logger from '@/utils/logger'

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
  const { user, hasRole, hasPermission, canAccess } = useAuth()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Initialize MSAL if not already done
        await initializeMsal()

        // Check if user is authenticated
        const authenticated = isAuthenticated()

        if (!authenticated) {
          logger.warn('User not authenticated, redirecting to login')
          setIsCheckingAuth(false)
          return
        }

        // Get account and verify token
        const account = getAccount()
        if (!account) {
          logger.warn('No account found, redirecting to login')
          setIsCheckingAuth(false)
          return
        }

        try {
          // Get fresh access token (will use cache if valid)
          await getAccessToken()
        } catch (error) {
          logger.error('Failed to get access token:', { error })
          setIsCheckingAuth(false)
          return
        }

        // Check role and permission authorization
        if (requiredRole || requiredPermission) {
          // Validate requiredRole is string/string[] before passing
          const normalizedRole = requiredRole && (typeof requiredRole === 'string' || Array.isArray(requiredRole))
            ? requiredRole
            : undefined
          // Validate requiredPermission is string/string[] before passing
          const normalizedPermission = requiredPermission && (typeof requiredPermission === 'string' || Array.isArray(requiredPermission))
            ? requiredPermission
            : undefined
          const authorized = canAccess(normalizedRole, normalizedPermission)
          setIsAuthorized(authorized)

          if (!authorized) {
            logger.warn('User not authorized for this route', {
              requiredRole,
              requiredPermission,
              userRole: user?.role,
              userPermissions: user?.permissions
            })
          }
        } else {
          setIsAuthorized(true)
        }
      } catch (error) {
        logger.error('Authentication check failed:', { error })
        setIsAuthorized(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [requiredRole, requiredPermission, user, hasRole, hasPermission, canAccess])

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    logger.info('Redirecting to login', { from: location.pathname })
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          {requiredRole && (
            <p className="text-sm text-gray-500 mb-2">
              Required role: {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}
            </p>
          )}
          {requiredPermission && (
            <p className="text-sm text-gray-500 mb-6">
              Required permission: {Array.isArray(requiredPermission) ? requiredPermission.join(', ') : requiredPermission}
            </p>
          )}
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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