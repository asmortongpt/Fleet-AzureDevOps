import { Shield } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

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
        background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 50%, hsl(var(--background)) 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Premium animated background with CTA brand colors */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {/* Animated gradient orbs - BLUE SKIES and NOON */}
        <div
          className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--chart-5) / 0.25) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--chart-6) / 0.2) 0%, transparent 70%)',
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
              style={{ filter: 'drop-shadow(0 4px 8px hsl(var(--chart-3) / 0.5))' }}
            >
              <defs>
                <linearGradient id="ctaGradientPasswordReset" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: 'hsl(var(--chart-3))' }} />
                  <stop offset="100%" style={{ stopColor: 'hsl(var(--chart-6))' }} />
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
                  color: 'hsl(var(--foreground))',
                  textShadow: '0 2px 8px hsl(var(--chart-5) / 0.6), 0 4px 12px hsl(var(--chart-3) / 0.4)',
                  background: 'linear-gradient(90deg, hsl(var(--foreground)) 0%, hsl(var(--chart-1)) 50%, hsl(var(--foreground)) 100%)',
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
                  color: 'hsl(var(--chart-1))',
                  textShadow: '0 0 10px hsl(var(--chart-5) / 0.8)',
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
              color: 'hsl(var(--foreground))',
              textShadow: '0 2px 4px hsl(var(--foreground) / 0.5)'
          }}
        >
          Capital Tech Alliance
        </h1>

          {/* Official CTA Gradient Bar */}
          <div
            className="mx-auto w-24 h-1 rounded-full mb-3"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--chart-3)) 0%, hsl(var(--chart-6)) 100%)',
              boxShadow: '0 2px 8px hsl(var(--chart-3) / 0.6)'
            }}
          />
        </div>

        {/* Premium Password Reset Card */}
        <Card className="border-border/50 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur-xl text-card-foreground">
          <div className="p-5">
            {/* Card Title Section */}
            <div className="mb-3.5 text-center">
              <h2 className="mb-1 flex items-center justify-center gap-2 text-xl font-semibold text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span>Reset Password</span>
              </h2>
              <p className="text-xs text-muted-foreground mb-2">
                Enter your email address and we'll send you a link to reset your password
              </p>
              <div className="text-[10px] text-foreground bg-muted/40 border border-border/50 rounded-md p-2">
                <strong>Note:</strong> If you sign in with Microsoft, please use{' '}
                <a
                  href="https://aka.ms/sspr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline text-primary"
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
                    <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">
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
                      className="h-11 border-border/50 focus:border-primary/60"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    style={{
                      background: 'linear-gradient(90deg, hsl(var(--chart-3)) 0%, hsl(var(--chart-6)) 100%)',
                      boxShadow: '0 10px 20px hsl(var(--chart-3) / 0.4)'
                    }}
                    className="group relative mb-3.5 h-11 w-full overflow-hidden font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    disabled={isLoading}
                  >
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: 'linear-gradient(90deg, hsl(var(--chart-6)) 0%, hsl(var(--chart-3)) 100%)' }}
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
                    style={{ color: 'hsl(var(--chart-1))' }}
                  >
                    ← Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Alert className="border-emerald-400/40 bg-emerald-500/10">
                  <AlertDescription className="text-emerald-100">
                    <strong>Check your email!</strong>
                    <br />
                    If an account exists for {email}, you will receive a password reset link shortly.
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => {
                        setIsSubmitted(false)
                        setEmail('')
                      }}
                      className="font-medium hover:underline text-primary"
                    >
                      try again
                    </button>
                  </p>
                  <Link
                    to="/login"
                    className="block text-sm font-medium hover:underline text-primary"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </div>
            )}

            {/* Support Link */}
            <p className="text-center text-[10px] text-muted-foreground">
              Need assistance?{' '}
              <a
                href="mailto:support@capitaltechalliance.com"
                className="font-semibold transition-colors hover:underline text-primary"
              >
                Contact Support
              </a>
            </p>
          </div>
        </Card>

        {/* Premium Footer */}
        <div className="mt-4 space-y-1 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground">
            Fleet Management System v2.0
          </p>
          <p className="text-[10px] text-muted-foreground">
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
