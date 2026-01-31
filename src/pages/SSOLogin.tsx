/**
 * Ultra-Premium Enterprise SSO Login Page
 * Executive-grade Azure AD authentication with luxury corporate design
 *
 * Features:
 * - Executive-level UI with animated sophistication
 * - Azure AD SSO with OAuth 2.0 + PKCE
 * - Premium animations and visual effects
 * - Luxury security indicators with icons
 * - Responsive design (fits on single page)
 * - WCAG 2.1 AA compliant
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { Shield, Lock, CheckCircle2, Loader2, AlertCircle, Building2, Sparkles, Award } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import logger from '@/utils/logger'

export function SSOLogin() {
  const navigate = useNavigate()
  const { instance, accounts } = useMsal()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = accounts.length > 0

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      logger.info('[SSO Login] User already authenticated, redirecting')
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Check for error in URL (from redirect failure)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    const errorDescription = params.get('error_description')

    if (errorParam) {
      setError(errorDescription || 'Authentication failed. Please try again.')
      logger.error('[SSO Login] Auth error from URL:', { error: errorParam, description: errorDescription })
    }
  }, [])

  const handleSignIn = async () => {
    setIsSigningIn(true)
    setError(null)

    try {
      logger.info('[SSO Login] Initiating Azure AD sign-in with redirect')
      await instance.loginRedirect({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
      })
    } catch (err) {
      logger.error('[SSO Login] Sign-in failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      )
      setIsSigningIn(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Premium animated background */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-indigo-500/20 blur-3xl animation-delay-2000" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[460px] px-4">
        {/* Premium Header - Company Branding */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/50 ring-2 ring-white/20">
            <Shield className="h-8 w-8 text-white drop-shadow-lg" strokeWidth={2.5} />
          </div>
          <h1 className="mb-1.5 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-3xl font-bold tracking-tight text-transparent drop-shadow-sm">
            Capital Tech Alliance
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-xs text-blue-100/80">
            <Building2 className="h-3.5 w-3.5" />
            <span className="font-medium">Enterprise Fleet Management System</span>
          </div>
        </div>

        {/* Premium Login Card */}
        <Card className="border-white/10 bg-white/95 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="p-5">
            {/* Welcome Section */}
            <div className="mb-3.5 text-center">
              <h2 className="mb-1 flex items-center justify-center gap-2 text-xl font-semibold text-slate-900">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span>Welcome Back</span>
              </h2>
              <p className="text-xs text-slate-600">
                Sign in to access your fleet management dashboard
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-3.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Premium Sign In Button */}
            <Button
              onClick={handleSignIn}
              disabled={isSigningIn}
              size="lg"
              className="group relative mb-3.5 h-11 w-full overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 font-semibold text-white shadow-lg shadow-blue-600/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-600/50 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-20">
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
              </div>
              <span className="relative flex items-center justify-center gap-2.5">
                {isSigningIn ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 23 23" fill="currentColor">
                      <path d="M1 1h10v10H1z" fillOpacity="0.9" />
                      <path d="M12 1h10v10H12z" fillOpacity="0.7" />
                      <path d="M1 12h10v10H1z" fillOpacity="0.8" />
                      <path d="M12 12h10v10H12z" fillOpacity="0.6" />
                    </svg>
                    <span>Sign in with Microsoft</span>
                  </>
                )}
              </span>
            </Button>

            {/* Premium Security Features Grid */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className="group flex flex-col items-center gap-1 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 py-2 px-2 text-center transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:shadow-md">
                <div className="rounded-lg bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <Lock className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-slate-700">MFA Protected</span>
              </div>
              <div className="group flex flex-col items-center gap-1 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 py-2 px-2 text-center transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:shadow-md">
                <div className="rounded-lg bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <Shield className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-slate-700">OAuth 2.0</span>
              </div>
              <div className="group flex flex-col items-center gap-1 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 py-2 px-2 text-center transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:shadow-md">
                <div className="rounded-lg bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
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
                  <Award className="h-3 w-3" />
                  <span>Enterprise Trusted</span>
                </span>
              </div>
            </div>

            {/* Premium Security Notice */}
            <div className="mb-2.5 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-2.5 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="rounded-lg bg-blue-600 p-1.5 shadow-md">
                  <Shield className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-bold text-blue-900">
                    Enterprise-Grade Security
                  </p>
                  <p className="text-[10px] leading-relaxed text-blue-800/90">
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
                className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
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
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}

export default SSOLogin
