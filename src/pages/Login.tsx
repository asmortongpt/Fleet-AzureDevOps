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
 * Login Page Component - CTA Branded Professional Design
 * Supports both traditional email/password login and Microsoft SSO
 * Features: CTA brand colors, smooth animations, glassmorphism effects
 */
export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* CTA BRANDED ANIMATED GRADIENT BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A0B2E] via-[#2F3359] to-[#1A0B2E]">
        {/* Animated gradient orbs using CTA brand colors */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#41B2E3] opacity-20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#DD3903] opacity-15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#F0A000] opacity-10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwRDRGRiIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
      </div>

      {/* MAIN LOGIN CONTAINER */}
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* COMPANY BRANDING SECTION */}
        <div className="text-center mb-10 space-y-6">
          {/* Logo with gradient border and glow effect */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-[#F0A000] to-[#DD3903] rounded-2xl blur-xl opacity-40 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center p-4 bg-gradient-to-br from-[#41B2E3] to-[#2F3359] rounded-2xl shadow-2xl">
              <CarProfile className="w-16 h-16 text-white drop-shadow-lg" weight="bold" />
            </div>
          </div>

          {/* Company Name with CTA gradient */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#41B2E3] via-[#F0A000] to-[#DD3903] bg-clip-text text-transparent animate-fade-in">
              Capital Tech Alliance
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-[#F0A000] to-[#DD3903] rounded-full shadow-lg"></div>
          </div>

          {/* Tagline */}
          <p className="text-base text-[#41B2E3] font-medium tracking-wide">
            Intelligent Technology. Integrated Partnership.
          </p>
          <p className="text-sm text-gray-300 font-light">
            Enterprise Fleet Management Platform
          </p>
        </div>

        {/* GLASSMORPHISM LOGIN CARD */}
        <Card className="relative backdrop-blur-2xl bg-white/10 border-2 border-[#41B2E3]/20 shadow-2xl rounded-3xl overflow-hidden animate-scale-in">
          {/* Card gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

          {/* Accent border gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F0A000] via-[#DD3903] to-[#41B2E3]"></div>

          <CardHeader className="space-y-4 pb-6 pt-8 relative z-10">
            <div className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold text-white">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-gray-300">
                Sign in to access your fleet command center
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pb-8 relative z-10">
            {/* ERROR ALERTS */}
            {urlError && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 backdrop-blur-sm animate-fade-in">
                <AlertDescription className="text-white">
                  {urlMessage || 'Authentication failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {emailLoginMutation.isError && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 backdrop-blur-sm animate-fade-in">
                <AlertDescription className="text-white">
                  {emailLoginMutation.error instanceof Error
                    ? emailLoginMutation.error.message
                    : 'An error occurred during login'}
                </AlertDescription>
              </Alert>
            )}

            {/* MICROSOFT SSO BUTTON - Primary CTA with CTA NOON color */}
            <Button
              type="button"
              size="lg"
              className="w-full h-14 font-bold text-lg bg-gradient-to-r from-[#DD3903] to-[#F0A000] hover:from-[#F0A000] hover:to-[#DD3903] text-white shadow-2xl hover:shadow-[0_0_40px_rgba(253,184,19,0.5)] transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 rounded-xl border-2 border-white/20"
              onClick={handleMicrosoftLogin}
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 23 23">
                <path fill="currentColor" d="M1 1h10v10H1z" />
                <path fill="currentColor" d="M12 1h10v10H12z" />
                <path fill="currentColor" d="M1 12h10v10H1z" />
                <path fill="currentColor" d="M12 12h10v10H12z" />
              </svg>
              Sign in with Microsoft
            </Button>

            {/* ELEGANT SEPARATOR */}
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-gradient-to-r from-transparent via-[#41B2E3]/30 to-transparent" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#2F3359]/80 backdrop-blur-sm px-6 py-2 text-[#41B2E3] font-bold rounded-full border border-[#41B2E3]/30 shadow-lg" data-testid="login-separator-text">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* EMAIL/PASSWORD FORM */}
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-[#41B2E3] uppercase tracking-wide">
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
                  className="h-12 bg-white/10 backdrop-blur-sm border-2 border-[#41B2E3]/30 focus:border-[#41B2E3] text-white placeholder:text-gray-400 rounded-xl transition-all duration-300 hover:bg-white/15 focus:bg-white/15 shadow-lg"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-[#41B2E3] uppercase tracking-wide">
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
                  className="h-12 bg-white/10 backdrop-blur-sm border-2 border-[#41B2E3]/30 focus:border-[#41B2E3] text-white placeholder:text-gray-400 rounded-xl transition-all duration-300 hover:bg-white/15 focus:bg-white/15 shadow-lg"
                />
              </div>

              {/* EMAIL LOGIN BUTTON - Secondary style */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-14 font-bold text-lg bg-white/10 backdrop-blur-sm border-2 border-[#41B2E3]/50 hover:bg-[#41B2E3]/20 hover:border-[#41B2E3] text-white shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 rounded-xl"
                disabled={emailLoginMutation.isPending}
              >
                {emailLoginMutation.isPending ? (
                  <span className="flex items-center gap-3">
                    <span className="w-5 h-5 border-3 border-[#41B2E3]/30 border-t-[#41B2E3] rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in with Email'
                )}
              </Button>
            </form>

            {/* HELP TEXT */}
            <p className="text-center text-sm text-gray-400 pt-4" data-testid="login-help-text">
              Need help? Contact your system administrator.
            </p>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <div className="mt-10 text-center space-y-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-xs text-gray-400 font-medium">
            ArchonY Fleet Management System v2.0
          </p>
          <p className="text-xs text-gray-500">
            © 2026 Capital Tech Alliance. All rights reserved.
          </p>
          <div className="flex justify-center gap-2 items-center">
            <div className="w-2 h-2 rounded-full bg-[#41B2E3] animate-pulse"></div>
            <span className="text-xs text-[#41B2E3] font-semibold">Intelligent Performance</span>
            <div className="w-2 h-2 rounded-full bg-[#F0A000] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
