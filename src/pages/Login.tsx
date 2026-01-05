import { CarProfile, Sparkle, Truck, Gauge, MapPin, Users } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { signInWithMicrosoft, setAuthToken } from '@/lib/microsoft-auth'
import logger from '@/utils/logger'

/**
 * Login Page Component
 * Supports both traditional email/password login and Microsoft SSO
 *
 * DEV MODE: Automatically bypasses login with demo credentials
 */
export function Login() {
  const navigate = useNavigate()
  // Pre-fill credentials in DEV mode for quick access
  const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@fleet.local' : '')
  const [password, setPassword] = useState(import.meta.env.DEV ? 'demo123' : '')
  const [isLoaded, setIsLoaded] = useState(false)

  // Animation trigger on mount
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // AUTO-LOGIN in DEV mode - DISABLED for SSO-first production deployment
  // Users must authenticate via Microsoft SSO
  useEffect(() => {
    if (import.meta.env.DEV && false) { // Disabled - SSO required
      logger.debug('[LOGIN] DEV mode detected - auto-logging in with demo user')

      // Create a demo JWT token (not validated in DEV mode)
      const demoToken = btoa(JSON.stringify({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: {
          id: 1,
          email: 'admin@fleet.local',
          role: 'admin',
          tenant_id: 1,
          auth_provider: 'demo',
          exp: Date.now() + 86400000 // 24 hours
        }
      }))

      setAuthToken(demoToken)
      logger.debug('[LOGIN] Demo token set, redirecting to dashboard')
      navigate('/', { replace: true })
    }
  }, [navigate])

  // Handle Microsoft OAuth callback
  // SECURITY FIX P3 LOW-SEC-001: Use logger instead of console.log
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      logger.debug('[OAUTH] Authorization code received, exchanging for token...')

      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      fetch(`${apiUrl}/auth/microsoft/callback?code=${encodeURIComponent(code)}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to exchange authorization code')
          }
          return res.json()
        })
        .then(data => {
          if (data.token) {
            logger.debug('[OAUTH] Token received, storing and redirecting...')
            setAuthToken(data.token)
            navigate('/', { replace: true })
          } else {
            throw new Error('No token in response')
          }
        })
        .catch(error => {
          logger.error('[OAUTH] Callback error:', error)
          navigate('/login?error=oauth_failed&message=' + encodeURIComponent(error.message), { replace: true })
        })
    }
  }, [navigate])

  // Check for error messages in URL
  const params = new URLSearchParams(window.location.search)
  const urlError = params.get('error')
  const urlMessage = params.get('message') || params.get('error_description')

  // Email login mutation using TanStack Query
  const emailLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      return response.json()
    },
    onSuccess: (data) => {
      setAuthToken(data.token)
      navigate('/')
    }
  })

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    emailLoginMutation.mutate({ email, password })
  }

  function handleMicrosoftLogin() {
    signInWithMicrosoft()
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-300/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-tl from-teal-400/30 to-cyan-300/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-300/20 to-blue-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Floating vehicle illustrations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[Truck, Gauge, MapPin, Users].map((Icon, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: [0.1, 0.2, 0.1],
              y: [100, -100],
              x: [0, (i % 2 === 0 ? 50 : -50), 0],
              rotate: [0, (i % 2 === 0 ? 10 : -10), 0],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2,
            }}
            className="absolute"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + i * 15}%`,
            }}
          >
            <Icon className="w-32 h-32 text-white/10" weight="thin" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-md z-10"
      >
        <Card
          className="relative w-full backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden"
        >
          {/* Glass effect inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <CardHeader className="space-y-4 pb-4 sm:pb-6 relative">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="relative p-5 sm:p-6 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl shadow-lg shadow-black/20 border border-white/30">
                <CarProfile className="w-12 h-12 sm:w-14 sm:h-14 text-white" weight="bold" />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkle
                    className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300"
                    weight="fill"
                  />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-2 text-center"
            >
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Fleet Manager
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-white/80">
                Sign in with your @capitaltechalliance.com account
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-5 sm:space-y-6 relative">
            {/* Show URL errors */}
            <AnimatePresence>
              {urlError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive" className="bg-red-500/20 border-red-400/50 backdrop-blur-sm">
                    <AlertDescription className="text-white">
                      {urlMessage || 'Authentication failed. Please try again.'}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Show form errors from mutation */}
              {emailLoginMutation.isError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive" className="bg-red-500/20 border-red-400/50 backdrop-blur-sm">
                    <AlertDescription className="text-white">
                      {emailLoginMutation.error instanceof Error
                        ? emailLoginMutation.error.message
                        : 'An error occurred during login'}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Microsoft Sign-In Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:border-white/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                onClick={handleMicrosoftLogin}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Sign in with Microsoft
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="relative"
            >
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/10 backdrop-blur-sm px-3 text-white/70 font-medium">
                  Or continue with email
                </span>
              </div>
            </motion.div>

            {/* Email/Password Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              onSubmit={handleEmailLogin}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fleet.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={emailLoginMutation.isPending}
                  className="h-10 sm:h-11 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/50 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={emailLoginMutation.isPending}
                  className="h-10 sm:h-11 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/50 transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                disabled={emailLoginMutation.isPending}
              >
                {emailLoginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="text-center text-xs sm:text-sm text-white/60 pt-2"
            >
              <p>
                Need help? Contact your system administrator for credentials.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer branding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60 font-medium backdrop-blur-sm bg-white/5 px-4 py-2 rounded-full"
      >
        Fleet Management System v2.0
      </motion.div>
    </div>
  )
}

export default Login
