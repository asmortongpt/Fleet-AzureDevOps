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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="shadow-2xl border-white/20 dark:border-slate-700/50 backdrop-blur-sm bg-white/90 dark:bg-slate-800/90">
          <CardHeader className="space-y-4 pb-6 pt-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <CarProfile className="w-12 h-12 text-white" weight="bold" />
                </div>
              </div>
            </div>

            <div className="space-y-3 text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Fleet Manager
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-300 font-medium">
                Welcome to Capital Tech Alliance
              </CardDescription>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse"></div>
                <span>Secure Enterprise Access</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pb-8">
            {/* Show URL errors */}
            {urlError && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-800">
                <AlertDescription className="text-sm">
                  {urlMessage || 'Authentication failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Show form errors from mutation */}
            {emailLoginMutation.isError && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-800">
                <AlertDescription className="text-sm">
                  {emailLoginMutation.error instanceof Error
                    ? emailLoginMutation.error.message
                    : 'An error occurred during login'}
                </AlertDescription>
              </Alert>
            )}

            {/* Microsoft Sign-In Button - Primary CTA */}
            <Button
              type="button"
              size="lg"
              className="w-full h-14 font-semibold text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    @capitaltechalliance.com Access
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Sign in with your company Microsoft account to access the fleet management system.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase z-10">
                <span className="bg-white/90 dark:bg-slate-800/90 px-4 text-slate-500 dark:text-slate-400 font-semibold tracking-wide" data-testid="login-separator-text">
                  Development Access
                </span>
              </div>
            </div>

            {/* Email/Password Form - For Development Only */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fleet.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={emailLoginMutation.isPending}
                  className="h-12 border-slate-300 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
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
                  className="h-12 border-slate-300 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                variant="outline"
                className="w-full h-12 font-semibold border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-200"
                disabled={emailLoginMutation.isPending}
              >
                {emailLoginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-700 dark:border-t-slate-200 rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in with Email'
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed" data-testid="login-help-text">
                  <span className="font-semibold">Development Mode:</span> Email authentication is for testing only. Production users must use Microsoft SSO.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="mailto:support@capitaltechalliance.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Support</a>
          </div>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            Fleet Management System v2.0 • Capital Tech Alliance
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
