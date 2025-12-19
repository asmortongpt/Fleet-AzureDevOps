import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuthErrorFromUrl } from '@/lib/microsoft-auth'
import logger from '@/utils/logger'

/**
 * AuthCallback Component
 * Handles the OAuth callback from Microsoft Azure AD
 *
 * SECURITY: Uses httpOnly cookies for token storage (not localStorage)
 * Backend handles token exchange and sets secure cookie before redirecting here
 */
export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      // Check for OAuth errors first
      const oauthError = getAuthErrorFromUrl()
      if (oauthError) {
        setStatus('error')
        setErrorMessage(`Authentication failed: ${oauthError.description}`)
        return
      }

      // Check for URL error parameters (from backend redirect on failure)
      const params = new URLSearchParams(window.location.search)
      const urlError = params.get('error')
      const urlMessage = params.get('message')
      if (urlError) {
        setStatus('error')
        setErrorMessage(urlMessage || 'Authentication failed. Please try again.')
        return
      }

      // Verify the session was established via httpOnly cookie
      // Backend already exchanged the code and set the cookie before redirecting here
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin

      try {
        const response = await fetch(`${apiUrl}/api/v1/auth/verify`, {
          method: 'GET',
          credentials: 'include', // Send httpOnly cookie
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            // SECURITY FIX P3 LOW-SEC-001: Use logger instead of console.log
            logger.debug('[AUTH] Session verified via httpOnly cookie')
            setStatus('success')
            setTimeout(() => {
              navigate('/')
            }, 1500)
            return
          }
        }

        // If verification failed, check if we need to handle the auth code
        // (This shouldn't happen in normal flow, but handles edge cases)
        const authCode = params.get('code')
        if (authCode) {
          // SECURITY FIX P3 LOW-SEC-001: Use logger instead of console.log
          logger.debug('[AUTH] Auth code found, backend should have already processed it')
          setStatus('error')
          setErrorMessage('Authentication processing error. Please try signing in again.')
          return
        }

      } catch (apiError) {
        // SECURITY FIX P3 LOW-SEC-001: Use logger instead of console.error
        logger.error('[AUTH] Backend API not available:', apiError)
        setStatus('error')
        setErrorMessage('Unable to connect to authentication service. Please try again later.')
        return
      }

      // If we get here, no valid authentication found
      setStatus('error')
      setErrorMessage('No valid session found. Please try signing in again.')

    } catch (error: any) {
      // SECURITY FIX P3 LOW-SEC-001: Use logger instead of console.error
      logger.error('Authentication callback error:', error)
      setStatus('error')
      setErrorMessage(error.message || 'An unexpected error occurred during authentication')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
            <span>
              {status === 'loading' && 'Completing sign in...'}
              {status === 'success' && 'Sign in successful!'}
              {status === 'error' && 'Sign in failed'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <p className="text-muted-foreground">
              Please wait while we complete your authentication with Microsoft...
            </p>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You have been successfully authenticated. Redirecting to your dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCallback
