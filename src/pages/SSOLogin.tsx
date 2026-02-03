/**
 * SSO Login Page - Official ArchonY Fleet Management Solution
 * Based on ADELE Brand Guidelines - January 26, 2026
 *
 * Official ArchonY Product Logo Features:
 * - Modern, technology-forward typography
 * - Flowing curve representing "intelligent pivot"
 * - "INTELLIGENT PERFORMANCE" tagline
 * - Greek "archon" meaning "presiding officer" or "ruler"
 *
 * CTA Official Color Palette:
 * - DAYTIME: #2F3359 (Navy)
 * - BLUE SKIES: #41B2E3 (Cyan)
 * - MIDNIGHT: #1A0B2E (Deep Purple)
 * - NOON: #DD3903 (Orange)
 * - GOLDEN HOUR: #F0A000 (Yellow)
 * - Gradient Bar: #F0A000 → #DD3903
 */

import { useState, useEffect } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import logger from '@/utils/logger'

export function SSOLogin() {
  const { loginWithMicrosoft } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AUTO-LOGIN in DEV mode - DISABLED to show login page
  // Enable this for automatic authentication in development
  // useEffect(() => {
  //   if (import.meta.env.DEV) {
  //     logger.debug('[SSO LOGIN] DEV mode detected - auto-logging in with demo user')
  //     const demoToken = btoa(JSON.stringify({
  //       header: { alg: 'HS256', typ: 'JWT' },
  //       payload: {
  //         id: '34c5e071-2d8c-44d0-8f1f-90b58672dceb',
  //         email: 'toby.deckow@capitaltechalliance.com',
  //         role: 'SuperAdmin',
  //         tenant_id: 'ee1e7320-b232-402e-b4f8-288998b5bff7',
  //         auth_provider: 'demo',
  //         exp: Date.now() + 86400000
  //       }
  //     }))
  //     setAuthToken(demoToken)
  //     logger.debug('[SSO LOGIN] Demo token set, redirecting to dashboard')
  //     navigate('/', { replace: true })
  //   }
  // }, [navigate])

  // Check for error in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    const errorDescription = params.get('error_description')

    if (errorParam) {
      setError(errorDescription || 'Authentication failed. Please try again.')
      logger.error('[SSO LOGIN] Auth error from URL:', { error: errorParam, description: errorDescription })
    }
  }, [])

  const handleSignIn = async () => {
    setIsSigningIn(true)
    setError(null)

    try {
      logger.info('[SSO LOGIN] Initiating Microsoft sign-in')
      await loginWithMicrosoft()
    } catch (err) {
      logger.error('[SSO LOGIN] Sign-in failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      )
      setIsSigningIn(false)
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1A0B2E 0%, #2F3359 50%, #1A0B2E 100%)'
      }}
    >
      {/* Premium background effects - MIDNIGHT to DAYTIME gradient */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated gradient orbs - BLUE SKIES and GOLDEN HOUR */}
        <div
          className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(253, 184, 19, 0.12) 0%, transparent 70%)',
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

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Official ArchonY Product Branding */}
        <div className="mb-8 text-center">
          {/* ArchonY Logo - Official from ADELE Branding Package */}
          <div className="flex justify-center mb-6">
            <img
              src="/logos/png/archony-logo-reverse-600px.png"
              alt="ArchonY - Intelligent Performance"
              className="h-24 w-auto"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(255, 255, 255, 0.15))' }}
            />
          </div>

          {/* Company Name & CTA Lockup */}
          <h1
            className="mb-3 text-xl font-medium tracking-tight"
            style={{
              color: '#e8eaed',
              fontFamily: '"Inter", -apple-system, sans-serif'
            }}
          >
            Capital Tech Alliance
          </h1>

          {/* Official Gradient Bar - GOLDEN HOUR to NOON */}
          <div
            className="mx-auto w-24 h-1 rounded-full mb-4"
            style={{
              background: 'linear-gradient(90deg, #F0A000 0%, #DD3903 100%)',
              boxShadow: '0 2px 8px rgba(253, 184, 19, 0.4)'
            }}
          />

          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Fleet Management Solution
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-white/10 bg-white/95 shadow-2xl backdrop-blur-xl">
          <div className="p-6">
            {/* Welcome Header */}
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-xl font-semibold text-slate-900">
                Welcome
              </h2>
              <p className="text-sm" style={{ color: '#475569' }}>
                Sign in to access your fleet dashboard
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Microsoft Sign-In Button - Official Gradient */}
            <Button
              onClick={handleSignIn}
              disabled={isSigningIn}
              size="lg"
              style={{
                background: 'linear-gradient(90deg, #F0A000 0%, #DD3903 100%)',
                boxShadow: '0 4px 12px rgba(253, 184, 19, 0.3)'
              }}
              className="group relative mb-4 h-12 w-full overflow-hidden font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: 'linear-gradient(90deg, #DD3903 0%, #F0A000 100%)' }}
              />
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

            <p className="text-center text-xs text-slate-500 mt-4">
              Need assistance?{' '}
              <a
                href="mailto:support@capitaltechalliance.com"
                className="font-semibold transition-colors hover:underline"
                style={{ color: '#2F3359' }}
              >
                Contact Support
              </a>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-6 space-y-1 text-center">
          <p className="text-xs font-semibold text-white/70">
            ArchonY Enterprise Solutions v2.0
          </p>
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Capital Tech Alliance. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  )
}

export default SSOLogin
