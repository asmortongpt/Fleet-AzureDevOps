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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a]"
    >
      {/* Minimal background */}

      <div className="relative z-10 w-full max-w-[460px] px-4">
        {/* Premium Header - Official CTA Fleet Branding */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold tracking-wider mb-1 text-white">
              CTA FLEET
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              FLEET COMMAND
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">
            Capital Tech Alliance
          </h1>

          <div className="mx-auto w-24 h-1 rounded-full mb-3 bg-emerald-500" />
        </div>

        {/* Premium Password Reset Card */}
        <Card className="border-white/[0.04] bg-[#111111] text-white">
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
                    className="group relative mb-3.5 h-11 w-full overflow-hidden font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-all duration-200 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <span className="flex items-center justify-center gap-2.5">
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
            <p className="text-center text-[10px] text-muted-foreground inline-flex items-center justify-center gap-1 w-full">
              Need assistance?{' '}
              <EmailButton
                to="support@capitaltechalliance.com"
                context={{ type: 'general', recipientName: 'Support Team', details: 'Password reset assistance request' }}
                label="Contact Support"
                variant="link"
                size="sm"
                className="h-auto p-0 text-[10px] font-semibold text-primary"
              />
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
