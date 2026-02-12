/**
 * AuthCallback - Identity Synchronization V3
 *
 * Handles MSAL redirect callback after Microsoft authentication
 * Exchanges access token with backend and establishes session
 */
import { useMsal } from '@azure/msal-react'
import { Loader2, ShieldCheck, Zap } from 'lucide-react'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// motion removed - React 19 incompatible

import { loginRequest } from '@/lib/msal-config'
import logger from '@/utils/logger'

export function AuthCallback() {
  const navigate = useNavigate()
  const [hasProcessed, setHasProcessed] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const { instance, accounts } = useMsal()

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed) return
    let mounted = true

    async function processAuthCallback() {
      try {
        setHasProcessed(true)
        logger.info('[Auth Callback] Processing MSAL redirect callback', {
          url: window.location.href,
          accountsCount: accounts.length
        })

        // Step 1: Handle the redirect promise from MSAL
        logger.debug('[Auth Callback] Calling handleRedirectPromise()...')
        const redirectResponse = await instance.handleRedirectPromise()

        logger.info('[Auth Callback] Redirect promise resolved', {
          hasResponse: !!redirectResponse,
          hasAccount: !!redirectResponse?.account,
          account: redirectResponse?.account?.username,
          scopes: redirectResponse?.scopes,
          expiresOn: redirectResponse?.expiresOn
        })

        // Step 2: Get the authenticated account
        const account = redirectResponse?.account || accounts[0] || instance.getAllAccounts()[0]

        if (!account) {
          logger.error('[Auth Callback] No account found after redirect')
          setErrorMessage('No account found. Please try logging in again.')
          setTimeout(() => {
            if (!mounted) return
            navigate('/login?error=no_account', { replace: true })
          }, 2000)
          return
        }

        logger.info('[Auth Callback] Account verified', {
          username: account.username,
          name: account.name,
          tenantId: account.tenantId
        })

        // Step 3: Get access token and ID token (from response or acquire silently)
        let accessToken = redirectResponse?.accessToken
        let idToken = redirectResponse?.idToken

        if (!accessToken || !idToken) {
          logger.debug('[Auth Callback] No tokens in redirect response, acquiring silently...')
          try {
            const tokenResult = await instance.acquireTokenSilent({
              ...loginRequest,
              account,
            })
            accessToken = tokenResult.accessToken
            idToken = tokenResult.idToken
            logger.info('[Auth Callback] Tokens acquired silently', {
              scopes: tokenResult.scopes,
              expiresOn: tokenResult.expiresOn,
              hasIdToken: !!idToken
            })
          } catch (tokenError) {
            logger.error('[Auth Callback] Failed to acquire token silently', { error: tokenError })
            setErrorMessage('Failed to acquire access token')
            setTimeout(() => {
              if (!mounted) return
              navigate('/login?error=token_acquisition_failed', { replace: true })
            }, 2000)
            return
          }
        }

        // Step 4: Exchange token with backend (send ID token for user info)
        logger.debug('[Auth Callback] Exchanging tokens with backend...', {
          hasAccessToken: !!accessToken,
          hasIdToken: !!idToken
        })
        const exchangeResponse = await fetch('/api/auth/microsoft/exchange', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken,
            idToken // Send ID token for user info extraction
          }),
        })

        if (!exchangeResponse.ok) {
          const errorText = await exchangeResponse.text()
          logger.error('[Auth Callback] Token exchange failed', {
            status: exchangeResponse.status,
            statusText: exchangeResponse.statusText,
            error: errorText
          })
          setErrorMessage('Backend authentication failed')
          setTimeout(() => {
            if (!mounted) return
            navigate('/login?error=sso_exchange_failed', { replace: true })
          }, 2000)
          return
        }

        const exchangeData = await exchangeResponse.json()
        logger.info('[Auth Callback] Token exchange successful', {
          hasUser: !!exchangeData.user,
          userId: exchangeData.user?.id
        })

        // Step 5: Verify the session cookie is actually usable before redirecting.
        // If this fails, the user will get stuck in a login loop (SSO succeeds, but the app can't see the session).
        try {
          const meResponse = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          })
          if (!meResponse.ok) {
            const body = await meResponse.text()
            logger.error('[Auth Callback] Session verification failed after exchange', {
              status: meResponse.status,
              body: body.slice(0, 500)
            })
            setErrorMessage('Session could not be verified after login (cookie not established).')
            setTimeout(() => {
              if (!mounted) return
              navigate('/login?error=session_not_established', { replace: true })
            }, 2000)
            return
          }
          logger.info('[Auth Callback] Session verified via /api/auth/me')
        } catch (verifyError) {
          logger.error('[Auth Callback] Session verification request failed', { error: verifyError })
          setErrorMessage('Session verification failed after login.')
          setTimeout(() => {
            if (!mounted) return
            navigate('/login?error=session_verification_failed', { replace: true })
          }, 2000)
          return
        }

        // Step 6: Notify the AuthProvider to refresh the session
        if (typeof window !== 'undefined') {
          logger.debug('[Auth Callback] Dispatching auth refresh event')
          window.dispatchEvent(new Event('fleet-auth-refresh'))
        }

        // Step 7: Redirect to home after a brief delay
        setTimeout(() => {
          if (!mounted) return
          logger.info('[Auth Callback] Authentication complete, redirecting to home')
          navigate('/', { replace: true })
        }, 500)

      } catch (error) {
        logger.error('[Auth Callback] Authentication callback failed:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        setHasProcessed(false) // Allow retry on error
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed')

        setTimeout(() => {
          if (!mounted) return
          navigate(
            `/login?error=callback_failed&error_description=${encodeURIComponent(
              error instanceof Error ? error.message : 'Authentication failed'
            )}`,
            { replace: true }
          )
        }, 2000)
      }
    }

    processAuthCallback()

    return () => {
      mounted = false
    }
  }, [instance, accounts, navigate, hasProcessed])

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center bg-[#0A0E27]">
      {/* CINEMATIC BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1A2251_0%,#0A0E27_100%)]" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#41B2E3] rounded-full blur-[180px] pointer-events-none opacity-10"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-20" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* BRANDING HUB */}
        <div
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
        </div>

        {/* LOADING CORE */}
        <div className="flex flex-col items-center gap-8 glass-premium p-10 rounded-[32px] border-white/5 shadow-2xl">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#41B2E3] border-b-2 border-l-2 border-white/5 animate-spin"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </div>
            <div className="absolute -inset-4 bg-blue-500/10 blur-2xl rounded-full" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <h3 className="text-sm font-black text-white uppercase tracking-widest text-shadow-premium">
              {errorMessage ? 'Authentication Error' : 'Establishing Protocol'}
            </h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">
              {errorMessage || 'Verified by Microsoft Azure AD'}
            </p>
          </div>

          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
            <div
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[#41B2E3] to-transparent shadow-[0_0_10px_#41B2E3] animate-pulse"
            />
          </div>
        </div>

        {/* SECURITY FOOTER */}
        <div
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
        </div>
      </div>
    </div>
  )
}
