import { CarProfile } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { signInWithMicrosoft, setAuthToken } from '@/lib/microsoft-auth'
import logger from '@/utils/logger'

/**
 * Login Page Component
 * Supports both traditional email/password login and Microsoft SSO
 *
 * DEV MODE: Automatically bypasses login with demo credentials
 */
export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // Pre-fill credentials in DEV mode for quick access
  const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@fleet.local' : '')
  const [password, setPassword] = useState(import.meta.env.DEV ? 'demo123' : '')

  // AUTO-LOGIN in DEV mode - ENABLED for bypass as requested
  // Users must authenticate via Microsoft SSO in PROD
  useEffect(() => {
    if (import.meta.env.DEV && true) { // Enabled for bypass
      logger.debug('[LOGIN] DEV mode detected - auto-logging in with demo user')

      // Create a demo JWT token (accepted by modified auth.middleware)
      const demoToken = btoa(JSON.stringify({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: {
          id: '34c5e071-2d8c-44d0-8f1f-90b58672dceb', // Real User ID
          email: 'toby.deckow@capitaltechalliance.com', // Real Email
          role: 'SuperAdmin',
          tenant_id: 'ee1e7320-b232-402e-b4f8-288998b5bff7', // Real Tenant ID
          auth_provider: 'demo',
          exp: Date.now() + 86400000 // 24 hours
        }
      }))

      setAuthToken(demoToken)
      logger.debug('[LOGIN] Demo token set, redirecting to dashboard')
      navigate('/', { replace: true })
    }
  }, [navigate])

  // Handle Microsoft OAuth callback
  // SECURITY FIX P3 LOW-SEC-001: Use logger instead of console.log
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      logger.debug('[OAUTH] Authorization code received, exchanging for token...')

      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      fetch(`${apiUrl}/auth/microsoft/callback?code=${encodeURIComponent(code)}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to exchange authorization code')
          }
          return res.json()
        })
        .then(data => {
          if (data.token) {
            logger.debug('[OAUTH] Token received, storing and redirecting...')
            setAuthToken(data.token)
            navigate('/', { replace: true })
          } else {
            throw new Error('No token in response')
          }
        })
        .catch(error => {
          logger.error('[OAUTH] Callback error:', error)
          navigate('/login?error=oauth_failed&message=' + encodeURIComponent(error.message), { replace: true })
        })
    }
  }, [navigate])

  // Check for error messages in URL
  const params = new URLSearchParams(window.location.search)
  const urlError = params.get('error')
  const urlMessage = params.get('message') || params.get('error_description')

  // Email login mutation using usage of AuthContext
  const emailLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      // Use the AuthContext login which handles cookies and state update correctly
      await login(credentials.email, credentials.password)
    },
    onSuccess: () => {
      // Auth wrapper handles redirect usually, but we can enforce navigation
      navigate('/')
    },
    onError: (error: Error) => {
      logger.error('Login failed', error)
    }
  })

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    emailLoginMutation.mutate({ email, password })
  }

  function handleMicrosoftLogin() {
    signInWithMicrosoft()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="p-3 bg-blue-600 rounded-xl">
                <CarProfile className="w-10 h-10 text-white" weight="bold" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Fleet Manager
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                Sign in with your @capitaltechalliance.com account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Show URL errors */}
            {urlError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {urlMessage || 'Authentication failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Show form errors from mutation */}
            {emailLoginMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {emailLoginMutation.error instanceof Error
                    ? emailLoginMutation.error.message
                    : 'An error occurred during login'}
                </AlertDescription>
              </Alert>
            )}

            {/* Microsoft Sign-In Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full font-medium border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={handleMicrosoftLogin}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Sign in with Microsoft
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase z-10">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium" data-testid="login-separator-text">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fleet.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={emailLoginMutation.isPending}
                  className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={emailLoginMutation.isPending}
                  className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                disabled={emailLoginMutation.isPending}
              >
                {emailLoginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2" data-testid="login-help-text">
              Need help? Contact your system administrator for credentials.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
          Fleet Management System v2.0
        </p>
      </div>
    </div>
  )
}

export default Login
