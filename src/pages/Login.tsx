import { Eye, EyeOff } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

  // Empty credentials for security - no pre-filled test data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1A0B2E 0%, #2B3A67 50%, #1A0B2E 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Premium animated background with CTA brand colors */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {/* Animated gradient orbs - BLUE SKIES and NOON */}
        <div
          className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 212, 255, 0.25) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 87, 34, 0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDelay: '2s'
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Premium Header - Official CTA ArchonY Branding */}
        <div className="mb-5 text-center">
          {/* ArchonY Logo with Swoosh */}
          <div className="mx-auto mb-4 relative h-24 flex flex-col items-center justify-center">
            {/* Curved Swoosh Element - CTA Official Gradient */}
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              className="absolute top-0 left-1/2 -translate-x-1/2"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(253, 184, 19, 0.5))' }}
            >
              <defs>
                <linearGradient id="ctaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#FDB813' }} />
                  <stop offset="100%" style={{ stopColor: '#FF5722' }} />
                </linearGradient>
              </defs>
              <path
                d="M 10 50 Q 25 20, 40 40 T 70 30"
                stroke="url(#ctaGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                style={{
                  strokeDasharray: '1000',
                  strokeDashoffset: '0',
                  animation: 'dashAnimation 2s ease-in-out infinite'
                }}
              />
            </svg>

            {/* ArchonY Typography */}
            <div className="relative z-10 mt-12">
              <div
                className="text-4xl font-bold tracking-wider mb-1"
                style={{
                  fontFamily: '"Inter", -apple-system, sans-serif',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  color: '#ffffff',
                  textShadow: '0 2px 8px rgba(0, 212, 255, 0.6), 0 4px 12px rgba(253, 184, 19, 0.4)',
                  background: 'linear-gradient(90deg, #ffffff 0%, #00D4FF 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                ARCHON·Y
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  color: '#00D4FF',
                  textShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
                  fontWeight: 600
                }}
              >
                INTELLIGENT PERFORMANCE
              </div>
            </div>
          </div>

          {/* Capital Tech Alliance - Company Name */}
          <h1
            className="mb-2 text-2xl font-semibold tracking-tight"
            style={{
              color: '#e8eaed',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}
          >
            Capital Tech Alliance
          </h1>

          {/* Official CTA Gradient Bar */}
          <div
            className="mx-auto w-24 h-1 rounded-full mb-3"
            style={{
              background: 'linear-gradient(90deg, #FDB813 0%, #FF5722 100%)',
              boxShadow: '0 2px 8px rgba(253, 184, 19, 0.6)'
            }}
          />
        </div>

        {/* Premium Login Card */}
        <Card className="border-white/10 bg-white/95 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="p-5">
            {/* Welcome Section */}
            <div className="mb-3.5 text-center">
              <h2 className="mb-1 flex items-center justify-center gap-2 text-xl font-semibold text-slate-900">
                <svg className="h-5 w-5" style={{ color: '#00D4FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>Welcome Back</span>
              </h2>
              <p className="text-xs text-slate-600">
                Sign in to access your fleet management dashboard
              </p>
            </div>
            {/* Error Alert */}
            {(urlError || emailLoginMutation.isError) && (
              <Alert variant="destructive" className="mb-3.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <AlertDescription className="text-sm">
                  {urlMessage || (emailLoginMutation.error instanceof Error
                    ? emailLoginMutation.error.message
                    : 'Authentication failed. Please try again.')}
                </AlertDescription>
              </Alert>
            )}

            {/* Premium Sign In Button */}
            <Button
              onClick={handleMicrosoftLogin}
              disabled={false}
              size="lg"
              style={{
                background: 'linear-gradient(90deg, #FDB813 0%, #FF5722 100%)',
                boxShadow: '0 10px 20px rgba(253, 184, 19, 0.4)'
              }}
              className="group relative mb-3.5 h-11 w-full overflow-hidden font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: 'linear-gradient(90deg, #FF5722 0%, #FDB813 100%)' }}
              />
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-20">
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
              </div>
              <span className="relative flex items-center justify-center gap-2.5">
                <svg className="h-5 w-5" viewBox="0 0 23 23" fill="currentColor">
                  <path d="M1 1h10v10H1z" fillOpacity="0.9" />
                  <path d="M12 1h10v10H12z" fillOpacity="0.7" />
                  <path d="M1 12h10v10H1z" fillOpacity="0.8" />
                  <path d="M12 12h10v10H12z" fillOpacity="0.6" />
                </svg>
                <span>Sign in with Microsoft</span>
              </span>
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs z-10">
                <span className="bg-white/90 dark:bg-slate-900/90 px-4 text-slate-500 dark:text-slate-400 font-medium backdrop-blur-sm" data-testid="login-separator-text">
                  or continue with email
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
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={emailLoginMutation.isPending}
                  className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <Link
                    to="/reset-password"
                    className="text-xs font-medium hover:underline"
                    style={{ color: '#00D4FF' }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={emailLoginMutation.isPending}
                    className="h-11 pr-10 border-slate-300 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold bg-slate-800 hover:bg-slate-900 text-white border-2 border-slate-800 hover:border-slate-900 transition-all"
                disabled={emailLoginMutation.isPending}
              >
                {emailLoginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in with Email'
                )}
              </Button>
            </form>

            {/* Premium Security Features Grid */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className="group flex flex-col items-center gap-1 rounded-xl border py-2 px-2 text-center transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ borderColor: '#00D4FF20', background: 'linear-gradient(to bottom right, #00D4FF10, #FDB81310)' }}>
                <div className="rounded-lg bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <svg className="h-4 w-4" style={{ color: '#00D4FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold text-slate-700">MFA Protected</span>
              </div>
              <div className="group flex flex-col items-center gap-1 rounded-xl border py-2 px-2 text-center transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ borderColor: '#00D4FF20', background: 'linear-gradient(to bottom right, #00D4FF10, #FDB81310)' }}>
                <div className="rounded-lg bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <svg className="h-4 w-4" style={{ color: '#00D4FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold text-slate-700">OAuth 2.0</span>
              </div>
              <div className="group flex flex-col items-center gap-1 rounded-xl border py-2 px-2 text-center transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ borderColor: '#00D4FF20', background: 'linear-gradient(to bottom right, #00D4FF10, #FDB81310)' }}>
                <div className="rounded-lg bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <svg className="h-4 w-4" style={{ color: '#00D4FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold text-slate-700">Encrypted</span>
              </div>
            </div>

            {/* Premium Divider */}
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="flex items-center gap-1.5 bg-white px-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>Enterprise Trusted</span>
                </span>
              </div>
            </div>

            {/* Premium Security Notice */}
            <div className="mb-2.5 rounded-xl border p-2.5 shadow-sm" style={{ borderColor: '#00D4FF30', background: 'linear-gradient(to bottom right, #00D4FF15, #FDB81315)' }}>
              <div className="flex items-start gap-2">
                <div className="rounded-lg p-1.5 shadow-md" style={{ background: 'linear-gradient(90deg, #FDB813 0%, #FF5722 100%)' }}>
                  <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-bold" style={{ color: '#2B3A67' }}>
                    Enterprise-Grade Security
                  </p>
                  <p className="text-[10px] leading-relaxed text-slate-700">
                    Protected with multi-factor authentication, OAuth 2.0 with PKCE authorization,
                    and AES-256 encrypted session management.
                  </p>
                </div>
              </div>
            </div>

            {/* Support Link */}
            <p className="text-center text-[10px] text-slate-500">
              Need assistance?{' '}
              <a
                href="mailto:support@capitaltechalliance.com"
                className="font-semibold transition-colors hover:underline"
                style={{ color: '#00D4FF' }}
              >
                Contact Support
              </a>
            </p>
          </div>
        </Card>

        {/* Premium Footer */}
        <div className="mt-4 space-y-1 text-center">
          <p className="text-[10px] font-semibold text-white/70">
            Fleet Management System v2.0
          </p>
          <p className="text-[10px] text-white/50">
            © {new Date().getFullYear()} Capital Tech Alliance. All rights reserved.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes dashAnimation {
          0%, 100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          50% {
            stroke-dashoffset: 50;
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}

export default Login
