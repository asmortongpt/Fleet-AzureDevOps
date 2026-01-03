/**
 * Login Page Component
 *
 * Provides Azure AD authentication with MFA enforcement
 * Supports both redirect and popup flows
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  loginWithRedirect,
  loginWithPopup,
  initializeMsal,
  isAuthenticated,
  getUserProfile
} from '@/lib/auth'
import logger from '@/utils/logger'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msalReady, setMsalReady] = useState(false)

  useEffect(() => {
    // Initialize MSAL on component mount
    const init = async () => {
      try {
        await initializeMsal()
        setMsalReady(true)

        // Check if already authenticated
        if (isAuthenticated()) {
          const user = getUserProfile()
          logger.info('User already authenticated', { user })
          navigate('/dashboard')
        }
      } catch (error) {
        logger.error('Failed to initialize authentication:', { error })
        setError('Failed to initialize authentication system. Please refresh the page.')
      }
    }

    init()
  }, [navigate])

  const handleLoginRedirect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await loginWithRedirect()
      // User will be redirected to Azure AD, then back to redirect_uri
    } catch (error: any) {
      logger.error('Login redirect failed:', { error })
      setError(error.message || 'Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleLoginPopup = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await loginWithPopup()
      logger.info('Login successful', {
        account: response.account.username,
        scopes: response.scopes
      })

      // Navigate to dashboard after successful login
      navigate('/dashboard')
    } catch (error: any) {
      logger.error('Login popup failed:', { error })
      setError(error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!msalReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing authentication...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md p-8 shadow-xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg
              className="w-16 h-16 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fleet Management System
          </h1>
          <p className="text-gray-600">
            Secure authentication with Microsoft Azure AD
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </Alert>
        )}

        {/* Login Methods */}
        <div className="space-y-4">
          {/* Primary Login Button (Redirect) */}
          <Button
            onClick={handleLoginRedirect}
            disabled={isLoading}
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.85 3.5h12.3c1.35 0 2.45 1.1 2.45 2.45v12.3c0 1.35-1.1 2.45-2.45 2.45H5.85c-1.35 0-2.45-1.1-2.45-2.45V5.95c0-1.35 1.1-2.45 2.45-2.45zm6.15 2.85c-3.45 0-6.3 2.85-6.3 6.3s2.85 6.3 6.3 6.3 6.3-2.85 6.3-6.3-2.85-6.3-6.3-6.3zm0 1.8c2.55 0 4.5 2.1 4.5 4.5s-2.1 4.5-4.5 4.5-4.5-2.1-4.5-4.5 2.1-4.5 4.5-4.5z" />
                </svg>
                Sign in with Microsoft
              </div>
            )}
          </Button>

          {/* Alternative Login Button (Popup) */}
          <Button
            onClick={handleLoginPopup}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Sign in with Popup
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Enterprise-Grade Security</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Multi-Factor Authentication (MFA) required</li>
                <li>OAuth 2.0 with PKCE flow</li>
                <li>Secure token management</li>
                <li>Session monitoring and audit logging</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          <p className="mt-2">
            Need help?{' '}
            <a href="mailto:support@capitaltechalliance.com" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
