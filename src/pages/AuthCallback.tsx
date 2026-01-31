/**
 * Auth Callback Component
 * Handles Azure AD redirect after authentication
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { handleAuthCallback } from '@/lib/auth/auth.service'
import logger from '@/utils/logger'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function processAuthCallback() {
      try {
        logger.info('[Auth Callback] Processing authentication callback')

        const response = await handleAuthCallback()

        if (response && response.account) {
          logger.info('[Auth Callback] Authentication successful', {
            account: response.account.username
          })

          // Navigate to dashboard after successful authentication
          navigate('/dashboard', { replace: true })
        } else {
          // No auth response - user might have closed the login page
          logger.warn('[Auth Callback] No authentication response')
          navigate('/login', { replace: true })
        }
      } catch (error) {
        logger.error('[Auth Callback] Authentication callback failed:', error)

        // Redirect to login with error message
        navigate(
          `/login?error=callback_failed&error_description=${encodeURIComponent(
            error instanceof Error ? error.message : 'Authentication failed'
          )}`,
          { replace: true }
        )
      }
    }

    processAuthCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-600">Completing sign-in...</p>
      </div>
    </div>
  )
}
