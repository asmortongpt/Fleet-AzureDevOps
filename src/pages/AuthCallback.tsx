/**
 * Premium Auth Callback Component with ArchonY Branding
 * Handles Azure AD redirect after authentication
 *
 * Features:
 * - Official CTA Brand Colors (DAYTIME, BLUE SKIES, MIDNIGHT, NOON, GOLDEN HOUR)
 * - ArchonY logo with animated swoosh
 * - Premium loading animation
 * - Smooth transitions
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { handleAuthCallback } from '@/lib/auth/auth.service'
import logger from '@/utils/logger'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function processAuthCallback() {
      try {
        logger.info('[Auth Callback] Processing authentication callback')

        const response = await handleAuthCallback()

        if (response && response.account) {
          logger.info('[Auth Callback] Authentication successful', {
            account: response.account.username
          })

          // Navigate to dashboard after successful authentication
          navigate('/dashboard', { replace: true })
        } else {
          // No auth response - user might have closed the login page
          logger.warn('[Auth Callback] No authentication response')
          navigate('/login', { replace: true })
        }
      } catch (error) {
        logger.error('[Auth Callback] Authentication callback failed:', error)

        // Redirect to login with error message
        navigate(
          `/login?error=callback_failed&error_description=${encodeURIComponent(
            error instanceof Error ? error.message : 'Authentication failed'
          )}`,
          { replace: true }
        )
      }
    }

    processAuthCallback()
  }, [navigate])

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
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

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* ArchonY Logo with Swoosh - Smaller version for loading screen */}
        <div className="relative h-20 flex flex-col items-center justify-center mb-2">
          {/* Curved Swoosh Element - CTA Official Gradient */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 80 80"
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(253, 184, 19, 0.5))' }}
          >
            <defs>
              <linearGradient id="ctaGradientAuthCallback" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#FDB813' }} />
                <stop offset="100%" style={{ stopColor: '#FF5722' }} />
              </linearGradient>
            </defs>
            <path
              d="M 10 50 Q 25 20, 40 40 T 70 30"
              stroke="url(#ctaGradientAuthCallback)"
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
          <div className="relative z-10 mt-10">
            <div
              className="text-3xl font-bold tracking-wider"
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
          </div>
        </div>

        {/* Loading Spinner with CTA Brand Color */}
        <div className="flex items-center gap-3">
          <Loader2
            className="h-6 w-6 animate-spin"
            style={{
              color: '#00D4FF',
              filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))'
            }}
          />
          <p
            className="text-sm font-medium"
            style={{
              color: '#e8eaed',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}
          >
            Completing sign-in...
          </p>
        </div>

        {/* Official CTA Gradient Bar */}
        <div
          className="w-16 h-0.5 rounded-full mt-2"
          style={{
            background: 'linear-gradient(90deg, #FDB813 0%, #FF5722 100%)',
            boxShadow: '0 2px 8px rgba(253, 184, 19, 0.6)'
          }}
        />
      </div>

      <style jsx>{`
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
