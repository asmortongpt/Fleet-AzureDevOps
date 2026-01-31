/**
 * Enterprise SSO Login Page
 * Professional Azure AD authentication with polished corporate design
 *
 * Features:
 * - Executive-grade UI with sophisticated CTA branding
 * - Azure AD SSO with OAuth 2.0 + PKCE
 * - Polished animations and micro-interactions
 * - Enterprise security indicators
 * - Responsive design (fits on single page)
 * - WCAG 2.1 AA compliant
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { Shield, Lock, CheckCircle2, Loader2, AlertCircle, Building2 } from 'lucide-react'

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50">
      {/* Sophisticated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient gradients */}
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-blue-400/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-indigo-400/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[460px] px-4">
        {/* Header - Company Branding */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-xl shadow-blue-600/20 ring-4 ring-blue-100">
            <Shield className="h-8 w-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="mb-1.5 text-3xl font-bold tracking-tight text-slate-900">
            Capital Tech Alliance
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
            <Building2 className="h-3.5 w-3.5" />
            <span className="font-medium">Enterprise Fleet Management System</span>
          </div>
        </div>

        {/* Main Login Card */}
        <Card className="border-slate-200 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-sm">
          <div className="p-6">
            {/* Welcome Section */}
            <div className="mb-4 text-center">
              <h2 className="mb-1.5 text-xl font-semibold text-slate-900">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-600">
                Sign in to access your fleet management dashboard
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Sign In Button */}
            <Button
              onClick={handleSignIn}
              disabled={isSigningIn}
              size="lg"
              className="group relative mb-4 h-11 w-full overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative flex items-center justify-center gap-2.5">
                {isSigningIn ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4.5 w-4.5" viewBox="0 0 23 23" fill="currentColor">
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

            {/* Security Features - Compact Grid */}
            <div className="mb-3.5 grid grid-cols-3 gap-2.5">
              <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2 text-center transition-colors hover:border-blue-200 hover:bg-blue-50/50">
                <Lock className="h-4.5 w-4.5 text-blue-600" strokeWidth={2} />
                <span className="text-[10px] font-medium text-slate-700 leading-tight">MFA</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2 text-center transition-colors hover:border-blue-200 hover:bg-blue-50/50">
                <Shield className="h-4.5 w-4.5 text-blue-600" strokeWidth={2} />
                <span className="text-[10px] font-medium text-slate-700 leading-tight">OAuth 2.0</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2 text-center transition-colors hover:border-blue-200 hover:bg-blue-50/50">
                <CheckCircle2 className="h-4.5 w-4.5 text-blue-600" strokeWidth={2} />
                <span className="text-[10px] font-medium text-slate-700 leading-tight">Secure</span>
              </div>
            </div>

            {/* Divider */}
            <div className="relative mb-3.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2.5 text-slate-500">Trusted by enterprises</span>
              </div>
            </div>

            {/* Security Notice - Minimalist */}
            <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
              <p className="mb-1.5 text-xs font-semibold text-blue-900">
                Enterprise-Grade Security
              </p>
              <p className="text-[10px] leading-relaxed text-blue-800">
                Protected with multi-factor authentication, OAuth 2.0 with PKCE authorization,
                and encrypted session management.
              </p>
            </div>

            {/* Support Link */}
            <p className="text-center text-[10px] text-slate-500">
              Need help?{' '}
              <a
                href="mailto:support@capitaltechalliance.com"
                className="font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                Contact Support
              </a>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-4 space-y-1 text-center">
          <p className="text-[10px] font-medium text-slate-500">
            Fleet Management System v2.0
          </p>
          <p className="text-[10px] text-slate-400">
            © {new Date().getFullYear()} Capital Tech Alliance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SSOLogin
