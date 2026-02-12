/**
 * Login Page Component
 *
 * Provides Azure AD authentication with MFA enforcement
 * Supports both redirect and popup flows
 * Updated with Premium ArchonY Design System
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Truck, ChevronRight, AlertCircle, Fingerprint } from 'lucide-react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  loginWithRedirect,
  loginWithPopup,
  initializeMsal,
  isAuthenticated,
  getUserProfile
} from "@/lib/auth/index"
import logger from '@/utils/logger'
import { cn } from '@/lib/utils'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msalReady, setMsalReady] = useState(false)

  useEffect(() => {
    // Initialize MSAL on component mount
    const init = async () => {
      try {
        await initializeMsal()
        setMsalReady(true)

        // Check if already authenticated
        if (isAuthenticated()) {
          const user = getUserProfile()
          logger.info('User already authenticated', { user })
          navigate('/dashboard')
        }
      } catch (error) {
        logger.error('Failed to initialize authentication:', { error })
        setError('Failed to initialize authentication system. Please refresh the page.')
      }
    }

    init()
  }, [navigate])

  const handleLoginRedirect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await loginWithRedirect()
      // User will be redirected to Azure AD, then back to redirect_uri
    } catch (error: any) {
      logger.error('Login redirect failed:', { error })
      setError(error.message || 'Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleLoginPopup = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await loginWithPopup()
      logger.info('Login successful', {
        account: response.account.username,
        scopes: response.scopes
      })

      // Navigate to dashboard after successful login
      navigate('/dashboard')
    } catch (error: any) {
      logger.error('Login popup failed:', { error })
      setError(error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!msalReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0E27] text-white">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#41B2E3] mb-4"></div>
          <p className="text-white/60 text-sm tracking-wide">INITIALIZING SECURE SESSION</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-[#0A0E27] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#41B2E3]/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#7342F9]/10 blur-[100px]" />

      <div className="w-full h-full flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[1000px] grid md:grid-cols-2 gap-0 overflow-hidden rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/10 bg-[#0F1535]/80 backdrop-blur-xl">

          {/* Left Side - Brand & Info */}
          <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-[#1A1F45] to-[#0A0E27] relative overflow-hidden">
            {/* Overlay grid pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            {/* Glowing Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F0A000] via-[#FF8A00] to-[#DD3903]" />

            <div>
              <div className="inline-flex items-center gap-2 mb-2 p-1.5 pr-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                <div className="bg-[#41B2E3] rounded-full p-1">
                  <Truck className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold tracking-wider text-[#41B2E3] uppercase">Fleet Command</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Capital Technology Alliance
              </h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                Next-generation fleet management system powered by AI analytics and real-time telemetry.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                  <Shield className="w-5 h-5 text-[#41B2E3]" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-semibold">Enterprise Security</h3>
                  <p className="text-white/40 text-xs">MFA-enforced access control</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                  <Fingerprint className="w-5 h-5 text-[#7342F9]" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-semibold">Biometric Ready</h3>
                  <p className="text-white/40 text-xs">Seamless FIDO2 integration</p>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-white/30 font-mono mt-8">
              SYSTEM_ID: ARCHON-Y-2026<br />
              SECURE_GATEWAY_V4.2
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-white/[0.02]">
            <div className="text-center mb-10 md:hidden">
              <h2 className="text-xl font-bold text-white">Fleet Connect</h2>
              <p className="text-white/40 text-sm">Secure Access Portal</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-white/50 text-sm">
                Please authenticate using your organizational account to access the command center.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <span className="ml-2">{error}</span>
              </Alert>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleLoginRedirect}
                disabled={isLoading}
                className={cn(
                  "w-full h-12 text-sm font-semibold relative overflow-hidden group transition-all duration-300",
                  "bg-[#0078D4] hover:bg-[#006cbd] text-white border-none shadow-[0_0_20px_rgba(0,120,212,0.3)]"
                )}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 215 215" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path d="M102.5 0H0V102.5H102.5V0Z" fill="#F25022" />
                    <path d="M215 0H112.5V102.5H215V0Z" fill="#7FBA00" />
                    <path d="M102.5 112.5H0V215H102.5V112.5Z" fill="#00A4EF" />
                    <path d="M215 112.5H112.5V215H215V112.5Z" fill="#FFB900" />
                  </svg>
                  <span>{isLoading ? 'Connecting...' : 'Sign in with Microsoft'}</span>
                  {!isLoading && <ChevronRight className="w-4 h-4 opacity-60" />}
                </div>
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0F1535] px-2 text-white/30">Alternative Methods</span>
                </div>
              </div>

              <Button
                onClick={handleLoginPopup}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white"
              >
                <Lock className="w-4 h-4 mr-2 text-white/40" />
                Use Browser Popup
              </Button>
            </div>

            <div className="mt-10 text-center">
              <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 uppercase tracking-widest hover:text-white/40 transition-colors cursor-help">
                <Shield className="w-3 h-3" />
                <span>Protected by Azure Sentinel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
