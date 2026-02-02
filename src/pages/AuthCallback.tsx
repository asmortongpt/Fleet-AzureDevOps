/**
 * AuthCallback - Identity Synchronization V3
 *
 * Cinematic transition screen for session establishment.
 * Aligned with ArchonY's ultra-premium design language.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ShieldCheck, Zap } from 'lucide-react'

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
          // Small delay for visual impact
          setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
        } else {
          logger.warn('[Auth Callback] No authentication response')
          navigate('/login', { replace: true })
        }
      } catch (error) {
        logger.error('[Auth Callback] Authentication callback failed:', error)
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
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center bg-[#0A0E27]">
      {/* CINEMATIC BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1A2251_0%,#0A0E27_100%)]" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#41B2E3] rounded-full blur-[180px] pointer-events-none opacity-10"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-20" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* BRANDING HUB */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-16 flex flex-col items-center"
        >
          <img
            src="/logos/png/archony-logo-reverse-300px.png"
            alt="ArchonY"
            className="h-12 w-auto mb-6 drop-shadow-[0_0_20px_rgba(65,178,227,0.4)] mix-blend-lighten"
          />
          <div className="flex items-center gap-3">
            <div className="h-px w-6 bg-white/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Secure Synchronization</span>
            <div className="h-px w-6 bg-white/20" />
          </div>
        </motion.div>

        {/* LOADING CORE */}
        <div className="flex flex-col items-center gap-8 glass-premium p-10 rounded-[32px] border-white/5 shadow-2xl">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#41B2E3] border-b-2 border-l-2 border-white/5"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </div>
            <div className="absolute -inset-4 bg-blue-500/10 blur-2xl rounded-full" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <h3 className="text-sm font-black text-white uppercase tracking-widest text-shadow-premium">Establishing Protocol</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">Verified by Microsoft Azure AD</p>
          </div>

          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[#41B2E3] to-transparent shadow-[0_0_10px_#41B2E3]"
            />
          </div>
        </div>

        {/* SECURITY FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex items-center gap-6 text-white/20"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Safe Redirection</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">ArchonY V3</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
