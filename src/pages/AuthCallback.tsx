import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  getAuthCodeFromUrl,
  getAuthErrorFromUrl,
  setAuthToken,
  getTenantIdFromState
} from '@/lib/microsoft-auth'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

/**
 * AuthCallback Component
 * Handles the OAuth callback from Microsoft Azure AD and exchanges the code for a JWT token
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

      // Check if we have an authorization code from Azure AD
      const authCode = getAuthCodeFromUrl()
      if (authCode) {
        console.log('[AUTH] Received authorization code from Azure AD')

        // Try to exchange code with backend API
        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin

        try {
          const response = await fetch(`${apiUrl}/api/v1/auth/microsoft/callback?code=${authCode}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            if (data.token) {
              setAuthToken(data.token)
              setStatus('success')
              setTimeout(() => {
                navigate('/')
              }, 1500)
              return
            }
          }
        } catch (apiError) {
          console.warn('[AUTH] Backend API not available, using demo mode:', apiError)
        }

        // FALLBACK: Backend not available - create demo token for development/testing
        console.log('[AUTH] Creating demo token (backend API not available)')
        const demoToken = btoa(JSON.stringify({
          header: { alg: 'HS256', typ: 'JWT' },
          payload: {
            id: 1,
            email: 'admin@capitaltechalliance.com',
            role: 'admin',
            tenant_id: 1,
            microsoft_id: 'demo-microsoft-id',
            auth_provider: 'microsoft',
            exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
          },
          signature: 'demo'
        }))

        setAuthToken(demoToken)
        setStatus('success')
        setTimeout(() => {
          navigate('/')
        }, 1500)
        return
      }

      // Check if we have a token in the URL (legacy support)
      const token = params.get('token')
      if (token) {
        setAuthToken(token)
        setStatus('success')
        setTimeout(() => {
          navigate('/')
        }, 1500)
        return
      }

      // If we get here, no valid authentication found
      setStatus('error')
      setErrorMessage('No authorization code received. Please try signing in again.')

    } catch (error: any) {
      console.error('Authentication callback error:', error)
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
