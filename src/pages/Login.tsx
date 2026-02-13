/**
 * Login Page - Professional Authentication Interface
 *
 * Simple, clean design focused on Microsoft SSO with optional email fallback
 */
import { useMutation } from '@tanstack/react-query'
import { AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import logger from '@/utils/logger'

export function Login() {
  const navigate = useNavigate()
  const { login, loginWithMicrosoft, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showEmailLogin, setShowEmailLogin] = useState(false)

  const params = new URLSearchParams(window.location.search)
  const urlError = params.get('error')
  const urlMessage = params.get('message') || params.get('error_description')

  const emailLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      await login(credentials.email, credentials.password)
    },
    onSuccess: () => navigate('/'),
    onError: (error: Error) => logger.error('Login failed', error)
  })

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    emailLoginMutation.mutate({ email, password })
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 cta-hub">
      {/* CTA background pattern */}
      <div className="absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-[#F0A000] to-[#DD3903] shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Fleet Management
          </h1>
          <p className="text-muted-foreground">
            Secure access to your fleet operations
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card/90 text-card-foreground rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
          <div className="p-10">
            {/* Error Alert */}
            {(urlError || emailLoginMutation.isError) && (
              <Alert className="mb-6 border-destructive/40 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm text-destructive-foreground">
                  {urlMessage || emailLoginMutation.error?.message || 'Authentication failed'}
                </AlertDescription>
              </Alert>
            )}

            {!showEmailLogin ? (
              <div className="space-y-4">
                {/* Primary: Microsoft SSO */}
                <Button
                  onClick={() => loginWithMicrosoft()}
                  size="lg"
                  className="w-full h-14 bg-[#0078D4] hover:bg-[#106EBE] text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 23 23">
                    <path fill="#ffffff" d="M1 1h10v10H1z" opacity="0.9" />
                    <path fill="#ffffff" d="M12 1h10v10H12z" opacity="0.7" />
                    <path fill="#ffffff" d="M1 12h10v10H1z" opacity="0.7" />
                    <path fill="#ffffff" d="M12 12h10v10H12z" opacity="0.5" />
                  </svg>
                  Sign in with Microsoft
                </Button>

                {/* Secondary: Email Login */}
                <button
                  onClick={() => setShowEmailLogin(true)}
                  className="w-full mt-4 py-3 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center justify-center gap-2 group"
                >
                  <span>Use email and password instead</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Back Button */}
                <button
                  onClick={() => setShowEmailLogin(false)}
                  className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1.5 font-medium"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Back
                </button>

                {/* Email Login Form */}
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground mb-2 block">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 pl-11 text-base border-border/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-semibold text-foreground mb-2 block">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-11 text-base border-border/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={emailLoginMutation.isPending}
                    size="lg"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-6"
                  >
                    {emailLoginMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Security Footer */}
          <div className="bg-muted/40 px-10 py-4 border-t border-border/50">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span className="font-medium">256-bit encrypted connection</span>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="mt-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 opacity-70 hover:opacity-90 transition-opacity">
            <span className="text-xs text-muted-foreground font-medium">Powered by</span>
            <img
              src="/logos/png/cta-logo-primary-lockup-reverse-300px.png"
              alt="Capital Tech Alliance"
              className="h-3.5 w-auto opacity-70"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Capital Tech Alliance
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
