import { Shield } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EmailButton } from '@/components/email/EmailButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Password Reset Page Component
 * Allows users to request a password reset link via email
 */
export function PasswordReset() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Call password reset API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email')
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0D0320 0%, #1A0648 50%, #0D0320 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Premium animated background with CTA brand colors */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {/* Animated gradient orbs - BLUE SKIES and NOON */}
        <div
          className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,204,254,0.25) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,67,0,0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDelay: '2s'
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(0,204,254,0.08) 1px, transparent 1px), linear-gradient(rgba(0,204,254,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
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
              style={{ filter: 'drop-shadow(0 4px 8px rgba(0,204,254,0.5))' }}
            >
              <defs>
                <linearGradient id="ctaGradientPasswordReset" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#00CCFE' }} />
                  <stop offset="100%" style={{ stopColor: '#FF4300' }} />
                </linearGradient>
              </defs>
              <path
                d="M 10 50 Q 25 20, 40 40 T 70 30"
                stroke="url(#ctaGradientPasswordReset)"
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
                  color: 'white',
                  textShadow: '0 2px 8px rgba(0,204,254,0.6), 0 4px 12px rgba(0,204,254,0.4)',
                  background: 'linear-gradient(90deg, white 0%, #00CCFE 50%, white 100%)',
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
                  color: '#00CCFE',
                  textShadow: '0 0 10px rgba(0,204,254,0.8)',
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
              color: 'white',
              textShadow: '0 2px 4px rgba(255,255,255,0.5)'
          }}
        >
          Capital Tech Alliance
        </h1>

          {/* Official CTA Gradient Bar */}
          <div
            className="mx-auto w-24 h-1 rounded-full mb-3"
            style={{
              background: 'linear-gradient(90deg, #00CCFE 0%, #FF4300 100%)',
              boxShadow: '0 2px 8px rgba(0,204,254,0.6)'
            }}
          />
        </div>

        {/* Premium Password Reset Card */}
        <Card className="border-[rgba(0,204,254,0.08)] bg-[#1A0648]/90 shadow-2xl shadow-black/20 backdrop-blur-xl text-white">
          <div className="p-5">
            {/* Card Title Section */}
            <div className="mb-3.5 text-center">
              <h2 className="mb-1 flex items-center justify-center gap-2 text-xl font-semibold text-white">
                <Shield className="h-5 w-5 text-[#00CCFE]" />
                <span>Reset Password</span>
              </h2>
              <p className="text-xs text-[rgba(255,255,255,0.40)] mb-2">
                Enter your email address and we'll send you a link to reset your password
              </p>
              <div className="text-[10px] text-white bg-[#221060]/40 border border-[rgba(0,204,254,0.08)] rounded-md p-2">
                <strong>Note:</strong> If you sign in with Microsoft, please use{' '}
                <a
                  href="https://aka.ms/sspr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline text-[#00CCFE]"
                >
                  Microsoft Self-Service Password Reset
                </a> instead.
              </div>
            </div>
            {!isSubmitted ? (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-sm font-medium text-white">
                      Email Address
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 border-[rgba(0,204,254,0.08)] focus:border-[#00CCFE]/60"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    style={{
                      background: 'linear-gradient(90deg, #00CCFE 0%, #FF4300 100%)',
                      boxShadow: '0 10px 20px rgba(0,204,254,0.4)'
                    }}
                    className="group relative mb-3.5 h-11 w-full overflow-hidden font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    disabled={isLoading}
                  >
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: 'linear-gradient(90deg, #FF4300 0%, #00CCFE 100%)' }}
                    />
                    <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-20">
                      <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
                    </div>
                    <span className="relative flex items-center justify-center gap-2.5">
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </span>
                  </Button>
                </form>

                <div className="text-center pt-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium hover:underline"
                    style={{ color: '#00CCFE' }}
                  >
                    ← Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Alert className="border-[#10B981]/40 bg-[#10B981]/10">
                  <AlertDescription className="text-[#10B981]">
                    <strong>Check your email!</strong>
                    <br />
                    If an account exists for {email}, you will receive a password reset link shortly.
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-3">
                  <p className="text-sm text-[rgba(255,255,255,0.40)]">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => {
                        setIsSubmitted(false)
                        setEmail('')
                      }}
                      className="font-medium hover:underline text-[#00CCFE]"
                    >
                      try again
                    </button>
                  </p>
                  <Link
                    to="/login"
                    className="block text-sm font-medium hover:underline text-[#00CCFE]"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </div>
            )}

            {/* Support Link */}
            <p className="text-center text-[10px] text-[rgba(255,255,255,0.40)] inline-flex items-center justify-center gap-1 w-full">
              Need assistance?{' '}
              <EmailButton
                to="support@capitaltechalliance.com"
                context={{ type: 'general', recipientName: 'Support Team', details: 'Password reset assistance request' }}
                label="Contact Support"
                variant="link"
                size="sm"
                className="h-auto p-0 text-[10px] font-semibold text-[#00CCFE]"
              />
            </p>
          </div>
        </Card>

        {/* Premium Footer */}
        <div className="mt-4 space-y-1 text-center">
          <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.40)]">
            Fleet Management System v2.0
          </p>
          <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
            © {new Date().getFullYear()} Capital Tech Alliance. All rights reserved.
          </p>
        </div>
      </div>

      {/* Static CSS keyframe animations - safe to render as plain style children */}
      <style>{`
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

export default PasswordReset
