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
 * - DAYTIME (Navy)
 * - BLUE SKIES (Cyan)
 * - MIDNIGHT (Deep Purple)
 * - NOON (Orange)
 * - GOLDEN HOUR (Yellow)
 * - Gradient Bar (Golden Hour → Noon)
 */

import { AlertCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmailButton } from '@/components/email/EmailButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMsalAuth } from '@/hooks/use-msal-auth'
import logger from '@/utils/logger'

export function SSOLogin() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading, error: msalError, clearError } = useMsalAuth()
  const [localError, setLocalError] = useState<string | null>(null)

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      logger.info('[SSO LOGIN] User already authenticated, redirecting to home')
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Check for error in URL parameters
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

  // Combine MSAL error and local error
  const displayError = msalError || localError

  const handleSignIn = async () => {
    try {
      // Clear any previous errors
      setLocalError(null)
      clearError()

      logger.info('[SSO LOGIN] Initiating MSAL login redirect', {
        redirectUri: window.location.origin + '/auth/callback'
      })

      // This will redirect the page to Microsoft login
      await login()

      // Note: Code below won't execute because login() redirects the page
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
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 50%, hsl(var(--background)) 100%)'
      }}
    >
      {/* Premium background effects - MIDNIGHT to DAYTIME gradient */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated gradient orbs - BLUE SKIES and GOLDEN HOUR */}
        <div
          className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--chart-5) / 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--chart-3) / 0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDelay: '2s'
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(90deg, hsl(var(--border) / 0.08) 1px, transparent 1px), linear-gradient(hsl(var(--border) / 0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
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
              style={{ filter: 'drop-shadow(0 4px 8px hsl(var(--foreground) / 0.15))' }}
            />
          </div>

          {/* Company Name & CTA Lockup */}
          <h1
            className="mb-3 text-xl font-medium tracking-tight"
            style={{
              color: 'hsl(var(--foreground))',
              fontFamily: '"Inter", -apple-system, sans-serif'
            }}
          >
            Capital Tech Alliance
          </h1>

          {/* Official Gradient Bar - GOLDEN HOUR to NOON */}
          <div
            className="mx-auto w-24 h-1 rounded-full mb-4"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--chart-3)) 0%, hsl(var(--chart-6)) 100%)',
              boxShadow: '0 2px 8px hsl(var(--chart-3) / 0.4)'
            }}
          />

          <p className="text-sm text-muted-foreground">
            Fleet Management Solution
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 bg-card/90 shadow-2xl backdrop-blur-xl text-card-foreground">
          <div className="p-6">
            {/* Welcome Header */}
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Welcome
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in to access your fleet dashboard
              </p>
            </div>

            {/* Error Alert */}
            {displayError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{displayError}</AlertDescription>
              </Alert>
            )}

            {/* Microsoft Sign-In Button - Official Gradient */}
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              size="lg"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--chart-3)) 0%, hsl(var(--chart-6)) 100%)',
                boxShadow: '0 4px 12px hsl(var(--chart-3) / 0.3)'
              }}
              className="group relative mb-4 h-12 w-full overflow-hidden font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: 'linear-gradient(90deg, hsl(var(--chart-6)) 0%, hsl(var(--chart-3)) 100%)' }}
              />
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

            <p className="text-center text-xs text-muted-foreground mt-4 inline-flex items-center justify-center gap-1 w-full">
              Need assistance?{' '}
              <EmailButton
                to="support@capitaltechalliance.com"
                context={{ type: 'general', recipientName: 'Support Team', details: 'SSO login assistance request' }}
                label="Contact Support"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs font-semibold text-primary"
              />
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-6 space-y-1 text-center">
          <p className="text-xs font-semibold text-muted-foreground">
            ArchonY Enterprise Solutions v2.0
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Capital Tech Alliance. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  )
}

export default SSOLogin
