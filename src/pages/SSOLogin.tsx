/**
 * SSO Login Page
 * Modern, production-ready Azure AD authentication
 *
 * Features:
 * - Clean, professional UI with CTA branding
 * - Azure AD SSO with redirect flow
 * - Loading states and error handling
 * - Responsive design
 * - Accessibility compliant
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Loader2, AlertCircle } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSSOAuth } from '@/contexts/SSOAuthContext'
import logger from '@/utils/logger'

export function SSOLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, signIn } = useSSOAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      logger.info('[SSO Login] User already authenticated, redirecting')
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

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
      logger.info('[SSO Login] Initiating Azure AD sign-in')
      await signIn()
      // User will be redirected, no need to do anything else
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

  // Show loading spinner while checking auth status
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600">Checking authentication status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Company Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-3xl font-bold text-transparent">
            Capital Tech Alliance
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Enterprise Fleet Management System
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200/50 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-6 text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Sign in with your enterprise account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Sign In Button */}
            <Button
              onClick={handleSignIn}
              disabled={isSigningIn}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5"
            >
              {isSigningIn ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 23 23" fill="currentColor">
                    <path d="M1 1h10v10H1z" fillOpacity="0.9" />
                    <path d="M12 1h10v10H12z" fillOpacity="0.7" />
                    <path d="M1 12h10v10H1z" fillOpacity="0.8" />
                    <path d="M12 12h10v10H12z" fillOpacity="0.6" />
                  </svg>
                  Sign in with Microsoft
                </span>
              )}
            </Button>

            {/* Security Notice */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="text-sm text-blue-900">
                  <p className="mb-2 font-semibold">Enterprise-Grade Security</p>
                  <ul className="space-y-1 text-blue-800">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Multi-Factor Authentication (MFA) enforced</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>OAuth 2.0 with PKCE authorization flow</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Secure token management and session handling</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Support Contact */}
            <p className="text-center text-sm text-slate-500">
              Need assistance?{' '}
              <a
                href="mailto:support@capitaltechalliance.com"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Contact Support
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 space-y-2 text-center">
          <p className="text-xs text-slate-500">
            Fleet Management System v2.0
          </p>
          <p className="text-xs text-slate-400">
            © 2026 Capital Tech Alliance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SSOLogin
