/**
 * SSO Login Page - ArchonY Fleet Command
 *
 * Official ArchonY branding with ambient background effects.
 * Microsoft SSO authentication flow.
 *
 * CTA Official Color Palette:
 * - DAYTIME (#1F3076) - Navy
 * - BLUE SKIES (#00CCFE) - Cyan accent
 * - MIDNIGHT (#1A0648) - Deep Purple
 * - NOON (#FF4300) - Orange
 * - GOLDEN HOUR (#FDC016) - Yellow
 */

import { AlertCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmailButton } from '@/components/email/EmailButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useMsalAuth } from '@/hooks/use-msal-auth'
import logger from '@/utils/logger'

export function SSOLogin() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading, error: msalError, clearError } = useMsalAuth()
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      logger.info('[SSO LOGIN] User already authenticated, redirecting to home')
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    const errorDescription = params.get('error_description')

    if (errorParam) {
      const errorMsg = errorDescription || 'Authentication failed. Please try again.'
      setLocalError(errorMsg)
      logger.error('[SSO LOGIN] Auth error from URL:', {
        error: errorParam,
        description: errorDescription
      })
    }
  }, [])

  const displayError = msalError || localError

  const handleSignIn = async () => {
    try {
      setLocalError(null)
      clearError()

      logger.info('[SSO LOGIN] Initiating MSAL login redirect', {
        redirectUri: window.location.origin + '/auth/callback'
      })

      await login()

      logger.debug('[SSO LOGIN] Login redirect in progress...')
    } catch (err) {
      logger.error('[SSO LOGIN] Login initiation failed:', err)
      setLocalError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      )
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0320]">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(31,48,118,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'float 60s ease-in-out infinite'
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,204,254,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'float 60s ease-in-out infinite reverse'
          }}
        />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,204,254,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-4">
        {/* Official ArchonY Product Branding */}
        <div className="mb-8 text-center">
          {/* ArchonY Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/logos/png/archony-logo-reverse-600px.png"
              alt="ArchonY - Intelligent Performance"
              className="h-24 w-auto"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(0,204,254,0.15))' }}
            />
          </div>

          {/* Company Name */}
          <h1
            className="mb-3 text-xl font-medium tracking-tight text-white"
            style={{ fontFamily: '"Cinzel", Georgia, serif' }}
          >
            Capital Tech Alliance
          </h1>

          {/* Gradient Bar */}
          <div className="mx-auto w-24 h-[3px] rounded-full mb-4 bg-gradient-to-r from-[#00CCFE] via-[#1F3076] to-transparent" />

          <p className="text-sm text-[rgba(255,255,255,0.65)]">
            Fleet Management Solution
          </p>
        </div>

        {/* Login Card - Glass morphism */}
        <div
          className="rounded-2xl border border-[rgba(0,204,254,0.15)] shadow-[0_8px_24px_rgba(26,6,72,0.5)] overflow-hidden"
          style={{ background: 'rgba(34,16,96,0.6)', backdropFilter: 'blur(20px)' }}
        >
          <div className="p-6">
            {/* Welcome Header */}
            <div className="mb-6 text-center">
              <h2
                className="mb-2 text-xl font-semibold text-white"
                style={{ fontFamily: '"Montserrat", sans-serif' }}
              >
                Welcome
              </h2>
              <p className="text-sm text-[rgba(255,255,255,0.65)]">
                Sign in to access your fleet dashboard
              </p>
            </div>

            {/* Error Alert */}
            {displayError && (
              <Alert className="mb-4 border-[#FF4300]/40 bg-[#FF4300]/10">
                <AlertCircle className="h-4 w-4 text-[#FF4300]" />
                <AlertDescription className="text-sm text-white">{displayError}</AlertDescription>
              </Alert>
            )}

            {/* Microsoft Sign-In Button */}
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              size="lg"
              className="group relative mb-4 h-12 w-full overflow-hidden bg-[#1F3076] hover:bg-[#2A1878] font-semibold text-white transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              <span className="relative flex items-center justify-center gap-2.5">
                {isLoading ? (
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

            <p className="text-center text-xs text-[rgba(255,255,255,0.40)] mt-4 inline-flex items-center justify-center gap-1 w-full">
              Need assistance?{' '}
              <EmailButton
                to="support@capitaltechalliance.com"
                context={{ type: 'general', recipientName: 'Support Team', details: 'SSO login assistance request' }}
                label="Contact Support"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs font-semibold text-[#00CCFE]"
              />
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 space-y-1 text-center">
          <p className="text-xs font-semibold text-[rgba(255,255,255,0.65)]">
            ArchonY Enterprise Solutions v2.0
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.40)]">
            © {new Date().getFullYear()} Capital Tech Alliance. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  )
}

export default SSOLogin
