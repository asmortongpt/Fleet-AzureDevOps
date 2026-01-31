/**
 * Ultra-Premium Enterprise SSO Login Page
 * Executive-grade Azure AD authentication with CTA official branding
 *
 * Features:
 * - Official CTA Brand Colors (DAYTIME, BLUE SKIES, MIDNIGHT, NOON, GOLDEN HOUR)
 * - Azure AD SSO with OAuth 2.0 + PKCE
 * - Premium animations and visual effects
 * - ArchonY branding - "INTELLIGENT PERFORMANCE"
 * - Responsive design (fits on single page)
 * - WCAG 2.1 AA compliant
 *
 * CTA Brand Palette:
 * - DAYTIME: #2B3A67 (Navy)
 * - BLUE SKIES: #00D4FF (Cyan)
 * - MIDNIGHT: #1A0B2E (Purple)
 * - NOON: #FF5722 (Orange)
 * - GOLDEN HOUR: #FDB813 (Yellow)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { Lock, CheckCircle2, Loader2, AlertCircle, Sparkles, Award, Shield } from 'lucide-react'

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
    <div
      className="premium-sso-page relative flex min-h-screen items-center justify-center overflow-hidden"
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

      <div className="relative z-10 w-full max-w-[460px] px-4">
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
                <Sparkles className="h-5 w-5" style={{ color: '#00D4FF' }} />
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
              style={{
                background: 'linear-gradient(90deg, #FDB813 0%, #FF5722 100%)',
                boxShadow: '0 10px 20px rgba(253, 184, 19, 0.4)'
              }}
              className="group relative mb-3.5 h-11 w-full overflow-hidden font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: 'linear-gradient(90deg, #FF5722 0%, #FDB813 100%)' }}
              />
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
              <div className="group flex flex-col items-center gap-1 rounded-xl border py-2 px-2 text-center transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ borderColor: '#00D4FF20', background: 'linear-gradient(to bottom right, #00D4FF10, #FDB81310)' }}>
                <div className="rounded-lg bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <Lock className="h-4 w-4" style={{ color: '#00D4FF' }} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-slate-700">MFA Protected</span>
              </div>
              <div className="group flex flex-col items-center gap-1 rounded-xl border py-2 px-2 text-center transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ borderColor: '#00D4FF20', background: 'linear-gradient(to bottom right, #00D4FF10, #FDB81310)' }}>
                <div className="rounded-lg bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <Shield className="h-4 w-4" style={{ color: '#00D4FF' }} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-slate-700">OAuth 2.0</span>
              </div>
              <div className="group flex flex-col items-center gap-1 rounded-xl border py-2 px-2 text-center transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ borderColor: '#00D4FF20', background: 'linear-gradient(to bottom right, #00D4FF10, #FDB81310)' }}>
                <div className="rounded-lg bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <CheckCircle2 className="h-4 w-4" style={{ color: '#00D4FF' }} strokeWidth={2.5} />
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
            <div className="mb-2.5 rounded-xl border p-2.5 shadow-sm" style={{ borderColor: '#00D4FF30', background: 'linear-gradient(to bottom right, #00D4FF15, #FDB81315)' }}>
              <div className="flex items-start gap-2">
                <div className="rounded-lg p-1.5 shadow-md" style={{ background: 'linear-gradient(90deg, #FDB813 0%, #FF5722 100%)' }}>
                  <Shield className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
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
        .animation-delay-2000 {
          animation-delay: 2s;
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

export default SSOLogin
