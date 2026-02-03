/**
 * Login Page - Fleet Management System
 *
 * Clean, professional login interface with SSO support
 */
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Building2, Lock, Mail } from 'lucide-react'

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
  const [devLoginLoading, setDevLoginLoading] = useState(false)

  // Handle errors from URL parameters
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

  async function handleDevLogin() {
    try {
      setDevLoginLoading(true)
      const devLoginEmail = email || 'admin@fleet.local'
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: devLoginEmail })
      })

      if (!response.ok) {
        throw new Error('Dev login failed')
      }

      window.location.href = '/'
    } catch (error) {
      logger.error('Dev login failed', error)
    } finally {
      setDevLoginLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

      <div className="relative w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/logos/png/archony-logo-reverse-300px.png"
              alt="ArchonY Fleet Management"
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Fleet Management System</h1>
          <p className="text-slate-400 text-sm">Sign in to access your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Error Alert */}
            {(urlError || emailLoginMutation.isError) && (
              <Alert className="mb-6 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {urlMessage || emailLoginMutation.error?.message || 'Authentication failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {!showEmailLogin ? (
              <div className="space-y-4">
                {/* Microsoft SSO Button */}
                <Button
                  onClick={() => loginWithMicrosoft()}
                  className="w-full h-12 bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white font-medium transition-colors"
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 23 23">
                      <path fill="#f25022" d="M1 1h10v10H1z" />
                      <path fill="#7fba00" d="M12 1h10v10H12z" />
                      <path fill="#00a4ef" d="M1 12h10v10H1z" />
                      <path fill="#ffb900" d="M12 12h10v10H12z" />
                    </svg>
                    <span>Sign in with Microsoft</span>
                  </div>
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500">Or continue with email</span>
                  </div>
                </div>

                {/* Email Login Toggle */}
                <Button
                  onClick={() => setShowEmailLogin(true)}
                  variant="outline"
                  className="w-full h-12 border-slate-300 hover:bg-slate-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Sign in with Email
                </Button>

                {import.meta.env.DEV && (
                  <Button
                    onClick={handleDevLogin}
                    variant="outline"
                    className="w-full h-12 border-slate-300 hover:bg-slate-50"
                    disabled={devLoginLoading}
                  >
                    {devLoginLoading ? 'Signing in...' : 'Dev Login (Local)'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Back Button */}
                <button
                  onClick={() => setShowEmailLogin(false)}
                  className="text-sm text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-1"
                >
                  ← Back to sign in options
                </button>

                {/* Email Login Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={emailLoginMutation.isPending}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    {emailLoginMutation.isPending ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
              <Lock className="w-3 h-3" />
              <span>Secure encrypted connection</span>
            </div>
          </div>
        </div>

        {/* Company Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 opacity-60 hover:opacity-100 transition-opacity">
            <Building2 className="w-4 h-4 text-slate-400" />
            <img
              src="/logos/png/cta-logo-primary-lockup-reverse-300px.png"
              alt="Capital Tech Alliance"
              className="h-3 w-auto opacity-70"
            />
          </div>
          <p className="text-xs text-slate-500">
            © 2026 Capital Tech Alliance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
