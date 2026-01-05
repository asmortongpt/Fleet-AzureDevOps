import { CarProfile, Sparkle } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
  // Pre-fill credentials in DEV mode for quick access
  const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@fleet.local' : '')
  const [password, setPassword] = useState(import.meta.env.DEV ? 'demo123' : '')
  const [isLoaded, setIsLoaded] = useState(false)

  // Animation trigger on mount
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // AUTO-LOGIN in DEV mode - DISABLED for SSO-first production deployment
  // Users must authenticate via Microsoft SSO
  useEffect(() => {
    if (import.meta.env.DEV && false) { // Disabled - SSO required
      logger.debug('[LOGIN] DEV mode detected - auto-logging in with demo user')

      // Create a demo JWT token (not validated in DEV mode)
      const demoToken = btoa(JSON.stringify({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: {
          id: 1,
          email: 'admin@fleet.local',
          role: 'admin',
          tenant_id: 1,
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

  // Email login mutation using TanStack Query
  const emailLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      return response.json()
    },
    onSuccess: (data) => {
      setAuthToken(data.token)
      navigate('/')
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <Card
        className={`
          relative w-full max-w-md
          bg-card/95 backdrop-blur-xl
          border border-border/50
          shadow-2xl shadow-primary/5
          rounded-2xl
          transition-all duration-700 ease-out
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <CardHeader className="space-y-4 pb-4 sm:pb-6">
          <div className="flex justify-center">
            <div
              className={`
                relative p-4 sm:p-5
                bg-gradient-to-br from-primary to-primary/80
                text-primary-foreground
                rounded-2xl
                shadow-lg shadow-primary/25
                transition-all duration-500 delay-200
                ${isLoaded ? 'scale-100' : 'scale-90'}
              `}
            >
              <CarProfile className="w-10 h-10 sm:w-12 sm:h-12" weight="bold" />
              <Sparkle
                className="absolute -top-1 -right-1 w-4 h-4 text-warning animate-pulse"
                weight="fill"
              />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              Fleet Manager
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">
              Sign in with your @capitaltechalliance.com account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 sm:space-y-6">
          {/* Show URL errors */}
          {urlError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertDescription>
                {urlMessage || 'Authentication failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Show form errors from mutation */}
          {emailLoginMutation.isError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
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
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium hover:bg-muted/50 transition-all duration-200"
            onClick={handleMicrosoftLogin}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" viewBox="0 0 23 23">
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
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
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
                className="h-10 sm:h-11 bg-background/50 focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
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
                className="h-10 sm:h-11 bg-background/50 focus:bg-background transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              disabled={emailLoginMutation.isPending}
            >
              {emailLoginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
            <p>
              Need help? Contact your system administrator for credentials.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer branding */}
      <div
        className={`
          absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2
          text-xs text-muted-foreground/60
          transition-all duration-700 delay-500
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
      >
        Fleet Management System v2.0
      </div>
    </div>
  )
}

export default Login
