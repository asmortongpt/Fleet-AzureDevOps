/**
 * Login Page - ArchonY Fleet Command
 *
 * Dark ambient background with glass-morphism card.
 * Microsoft SSO primary, email fallback secondary.
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#0D0320]">
      {/* Animated background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,204,254,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
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
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo and Branding */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl border border-[rgba(0,204,254,0.15)]"
            style={{ background: 'linear-gradient(135deg, #1F3076, #1A0648)' }}
          >
            <span
              className="text-white text-lg font-extrabold tracking-wider"
              style={{ fontFamily: '"Cinzel", Georgia, serif' }}
            >
              CTA
            </span>
          </div>
          <h1
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: '"Cinzel", Georgia, serif' }}
          >
            Fleet Command
          </h1>
          {/* Gradient bar */}
          <div className="mx-auto w-24 h-[3px] rounded-full mt-3 mb-3 bg-gradient-to-r from-[#00CCFE] via-[#1F3076] to-transparent" />
          <p className="text-[rgba(255,255,255,0.65)]">
            Secure access to your fleet operations
          </p>
        </div>

        {/* Login Card - Glass morphism */}
        <div
          className="rounded-2xl border border-[rgba(0,204,254,0.15)] overflow-hidden shadow-[0_8px_24px_rgba(26,6,72,0.5)]"
          style={{ background: 'rgba(34,16,96,0.6)', backdropFilter: 'blur(20px)' }}
        >
          <div className="p-10">
            {/* Error Alert */}
            {(urlError || emailLoginMutation.isError) && (
              <Alert className="mb-6 border-[#FF4300]/40 bg-[#FF4300]/10">
                <AlertCircle className="h-4 w-4 text-[#FF4300]" />
                <AlertDescription className="text-sm text-white">
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
                  className="w-full h-14 bg-[#1F3076] hover:bg-[#2A1878] text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 23 23">
                    <path fill="white" d="M1 1h10v10H1z" opacity="0.9" />
                    <path fill="white" d="M12 1h10v10H12z" opacity="0.7" />
                    <path fill="white" d="M1 12h10v10H1z" opacity="0.7" />
                    <path fill="white" d="M12 12h10v10H12z" opacity="0.5" />
                  </svg>
                  Sign in with Microsoft
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-[rgba(0,204,254,0.08)]" />
                  <span className="text-xs text-[rgba(255,255,255,0.40)]">or</span>
                  <div className="flex-1 h-px bg-[rgba(0,204,254,0.08)]" />
                </div>

                {/* Secondary: Email Login */}
                <button
                  onClick={() => setShowEmailLogin(true)}
                  className="w-full py-3.5 rounded-lg border border-[rgba(0,204,254,0.15)] bg-[#2A1878] text-sm text-[rgba(255,255,255,0.65)] hover:text-white font-medium transition-all flex items-center justify-center gap-2 group hover:bg-[#332090]"
                >
                  <span>Use email and password</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Back Button */}
                <button
                  onClick={() => setShowEmailLogin(false)}
                  className="text-sm text-[rgba(255,255,255,0.40)] hover:text-white mb-2 flex items-center gap-1.5 font-medium"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Back
                </button>

                {/* Email Login Form */}
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-white mb-2 block">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.40)]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 pl-11 text-base"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-semibold text-white mb-2 block">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.40)]" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-11 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <button type="button" className="text-xs text-[#00CCFE] hover:text-white transition-colors">
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={emailLoginMutation.isPending}
                    size="lg"
                    className="w-full h-12 bg-[#1F3076] hover:bg-[#2A1878] text-white font-semibold"
                  >
                    {emailLoginMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[rgba(0,204,254,0.3)] border-t-[#00CCFE] rounded-full animate-spin" />
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
          <div className="bg-[#1A0648]/50 px-10 py-4 border-t border-[rgba(0,204,254,0.08)]">
            <div className="flex items-center justify-center gap-2 text-xs text-[rgba(255,255,255,0.40)]">
              <Lock className="w-3.5 h-3.5" />
              <span className="font-medium">256-bit encrypted connection</span>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="mt-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 opacity-70 hover:opacity-90 transition-opacity">
            <span className="text-xs text-[rgba(255,255,255,0.40)] font-medium">Powered by</span>
            <img
              src="/logos/png/cta-logo-primary-lockup-reverse-300px.png"
              alt="Capital Tech Alliance"
              className="h-3.5 w-auto opacity-70"
            />
          </div>
          <p className="text-xs text-[rgba(255,255,255,0.40)]">
            © {new Date().getFullYear()} Capital Tech Alliance
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
