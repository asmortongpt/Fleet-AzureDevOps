/**
 * Login Page - System Gateway V3
 *
 * Ultra-premium entry point for the ArchonY Fleet Management Platform.
 * Features cinematic atmospheric effects, glassmorphic optics, and 
 * SSO-first authentication flow aligned with CTA brand directives.
 */
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ShieldCheck, Zap, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import logger from '@/utils/logger'

export function Login() {
  const navigate = useNavigate()
  const { login, loginWithMicrosoft } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isFormVisible, setIsFormVisible] = useState(false)

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

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-[#0A0E27]">
      {/* CINEMATIC BACKGROUND SYSTEM */}
      <div className="absolute inset-0 z-0">
        {/* Deep Galaxy Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1A2251_0%,#0A0E27_100%)]" />

        {/* Atmospheric Orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] sm:w-[60%] sm:h-[60%] bg-[#41B2E3] rounded-full blur-[150px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] sm:w-[70%] sm:h-[70%] bg-[#DD3903] rounded-full blur-[180px] pointer-events-none"
        />

        {/* Data Grid Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-20" />
      </div>

      {/* SYSTEM ACCESS INTERFACE */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-xl flex flex-col items-center">

        {/* MASTER BRANDING */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center mb-6 sm:mb-8 lg:mb-12 text-center"
        >
          <div className="relative mb-8 group">
            <div className="absolute inset-x-[-20px] top-full h-[2px] bg-gradient-to-r from-transparent via-[#41B2E3] to-transparent opacity-40" />
            <img
              src="/logos/png/archony-logo-reverse-300px.png"
              alt="ArchonY"
              className="h-10 sm:h-12 lg:h-16 w-auto drop-shadow-[0_0_30px_rgba(65,178,227,0.4)] mix-blend-lighten"
            />
          </div>

          <h2 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/40 mb-2">
            Intelligence Performance System
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-8 bg-white/10" />
            <span className="text-xs font-bold text-white/60 tracking-widest uppercase">Gateway Access</span>
            <div className="h-[1px] w-8 bg-white/10" />
          </div>
        </motion.div>

        {/* AUTHENTICATION CORE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full glass-premium rounded-2xl sm:rounded-[28px] lg:rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
        >
          {/* Top Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#F0A000] via-[#FF8A00] to-[#DD3903]" />

          <div className="p-6 sm:p-10 lg:p-14">
            <AnimatePresence mode="wait">
              {!isFormVisible ? (
                <motion.div
                  key="sso-view"
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="text-center space-y-3">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight uppercase">System Entrance</h3>
                    <p className="text-sm text-white/45 font-medium">Verify your identity via Enterprise Gateway</p>
                  </div>

                  {(urlError || emailLoginMutation.isError) && (
                    <Alert className="bg-red-500/10 border-red-500/30 text-red-200 py-3 rounded-2xl animate-fade-in">
                      <AlertDescription>
                        {urlMessage || emailLoginMutation.error?.message || 'Authentication failed. Please retry.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-6">
                    <Button
                      onClick={() => loginWithMicrosoft()}
                      className="group relative w-full h-14 sm:h-16 bg-gradient-to-r from-[#DD3903] to-[#F0A000] text-white rounded-2xl border-none overflow-hidden shadow-[0_20px_40px_rgba(221,57,3,0.3)] hover:shadow-[0_20px_60px_rgba(221,57,3,0.5)] transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center justify-center gap-4 px-6">
                        <div className="bg-white p-2 text-black rounded-lg flex-shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 23 23">
                            <path fill="#f25022" d="M1 1h10v10H1z" />
                            <path fill="#7fba00" d="M12 1h10v10H12z" />
                            <path fill="#00a4ef" d="M1 12h10v10H1z" />
                            <path fill="#ffb900" d="M12 12h10v10H12z" />
                          </svg>
                        </div>
                        <span className="text-sm sm:text-base lg:text-lg font-black uppercase tracking-wider whitespace-nowrap">Microsoft Identity</span>
                        <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-2 transition-transform hidden sm:block" />
                      </div>
                    </Button>

                    <button
                      onClick={() => setIsFormVisible(true)}
                      className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-3"
                    >
                      <div className="w-8 h-px bg-white/5" />
                      Alternative Protocol
                      <div className="w-8 h-px bg-white/5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <button
                      onClick={() => setIsFormVisible(false)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Manual Bypass</h3>
                  </div>

                  <form onSubmit={handleEmailLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#41B2E3] ml-1">Terminal ID</Label>
                      <Input
                        type="email"
                        placeholder="identity@ctafleet.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 bg-white/5 border-white/10 focus:border-[#41B2E3]/50 text-white rounded-2xl px-6 placeholder:text-white/10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#41B2E3] ml-1">Access Cipher</Label>
                      <Input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 bg-white/5 border-white/10 focus:border-[#41B2E3]/50 text-white rounded-2xl px-6 placeholder:text-white/10"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={emailLoginMutation.isPending}
                      className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#41B2E3]/30 rounded-2xl font-black uppercase tracking-widest transition-all"
                    >
                      {emailLoginMutation.isPending ? "Syncing..." : "Execute Login"}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Security Badge */}
          <div className="bg-white/[0.03] px-10 py-6 border-t border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400/60">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Quantum Encryption Active</span>
            </div>
            <div className="flex items-center gap-4 text-white/20">
              <Zap className="w-3.5 h-3.5" />
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        </motion.div>

        {/* EXTERNAL BRAND FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 sm:mt-8 lg:mt-12 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-8 opacity-40 hover:opacity-100 transition-opacity duration-700">
            <img src="/logos/png/cta-logo-primary-lockup-reverse-300px.png" alt="CTA" className="h-3 sm:h-4 w-auto grayscale contrast-125" />
          </div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
            © 2026 Capital Tech Alliance. All Rights Reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
