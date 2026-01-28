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
import { setAuthToken } from '@/lib/microsoft-auth'
import logger from '@/utils/logger'

/**
 * Login Page Component
 * Supports both traditional email/password login and Microsoft SSO
 *
 * DEV MODE: Automatically bypasses login with demo credentials
 */
export function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, setUser } = useAuth()

  // Pre-fill credentials in DEV mode for quick access
  const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@fleet.local' : '')
  const [password, setPassword] = useState(import.meta.env.DEV ? 'demo123' : '')

  // P0 FIX: Removed auto-login bypass to allow SSO testing
  // Auto-login in DEV mode was preventing users from testing Microsoft SSO
  // If auto-login is needed, use VITE_SKIP_AUTH=true in .env instead (controlled by AuthContext.tsx)

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

  const { loginWithMicrosoft } = useAuth()

  function handleMicrosoftLogin() {
    loginWithMicrosoft()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Company Branding */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg mb-4">
            <CarProfile className="w-12 h-12 text-white" weight="bold" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Capital Tech Alliance
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">
            Enterprise Fleet Management System
          </p>
        </div>

        <Card className="shadow-2xl border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="space-y-3 pb-6">
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                Sign in with your @capitaltechalliance.com account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
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

            {/* Microsoft Sign-In Button - Primary CTA */}
            <Button
              type="button"
              size="lg"
              className="w-full font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              onClick={handleMicrosoftLogin}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 23 23">
                <path fill="currentColor" fillOpacity="0.9" d="M1 1h10v10H1z" />
                <path fill="currentColor" fillOpacity="0.7" d="M12 1h10v10H12z" />
                <path fill="currentColor" fillOpacity="0.8" d="M1 12h10v10H1z" />
                <path fill="currentColor" fillOpacity="0.6" d="M12 12h10v10H12z" />
              </svg>
              Sign in with Microsoft
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase z-10">
                <span className="bg-white/90 dark:bg-slate-900/90 px-4 text-slate-500 dark:text-slate-400 font-medium backdrop-blur-sm" data-testid="login-separator-text">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-2">
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
                variant="outline"
                className="w-full font-semibold border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all"
                disabled={emailLoginMutation.isPending}
              >
                {emailLoginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in with Email'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4" data-testid="login-help-text">
              Need help? Contact your system administrator.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-2 animate-in fade-in slide-in-from-bottom duration-1000">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fleet Management System v2.0
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © 2026 Capital Tech Alliance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
