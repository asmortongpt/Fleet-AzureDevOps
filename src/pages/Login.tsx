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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-20" />
        <div className="absolute top-1/4 -left-12 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 -right-12 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and brand section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300" />
              <div className="relative p-4 bg-white rounded-2xl shadow-2xl">
                <CarProfile className="w-12 h-12 text-blue-600" weight="bold" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Fleet Manager
          </h1>
          <p className="text-blue-100 text-lg">
            Enterprise Fleet Management Platform
          </p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95">
          <CardHeader className="space-y-4 pb-6">
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                Sign in with your @capitaltechalliance.com account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Show URL errors */}
            {urlError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {urlMessage || 'Authentication failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Show form errors from mutation */}
            {emailLoginMutation.isError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {emailLoginMutation.error instanceof Error
                    ? emailLoginMutation.error.message
                    : 'An error occurred during login'}
                </AlertDescription>
              </Alert>
            )}

            {/* Microsoft Sign-In Button */}
            <Button
              type="button"
              size="lg"
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              onClick={handleMicrosoftLogin}
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Sign in with Microsoft
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white dark:bg-slate-900 px-4 text-slate-500 dark:text-slate-400 font-medium" data-testid="login-separator-text">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@capitaltechalliance.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={emailLoginMutation.isPending}
                  className="h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:focus:border-blue-500 transition-all"
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
                  className="h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:focus:border-blue-500 transition-all"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                disabled={emailLoginMutation.isPending}
              >
                {emailLoginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in with Email'
                )}
              </Button>
            </form>

            {/* Help section */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-sm text-slate-600 dark:text-slate-400" data-testid="login-help-text">
                Need help accessing your account?<br />
                <a href="mailto:support@capitaltechalliance.com" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  Contact IT Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/80 mb-2">
            Fleet Management System v2.0
          </p>
          <p className="text-xs text-white/60">
            Secured by Azure Active Directory • Enterprise SSO
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default Login
