/**
 * Multi-Factor Authentication (MFA) Provider
 * Uses backend MFA endpoints (no mock data).
 */

import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react'

import { secureFetch } from '@/hooks/use-api'
import { useAuth } from '@/contexts'
import { logger } from '@/utils/logger'

export type MFAMethod = 'sms' | 'email' | 'totp' | 'okta_verify' | 'google_authenticator' | 'microsoft_authenticator'

export interface MFAFactor {
  id: string
  type: MFAMethod
  status: 'active' | 'pending' | 'inactive' | 'expired'
  displayName: string
  maskedIdentifier: string
  enrolledAt: string
  lastUsedAt?: string
  isPrimary: boolean
  backupCodes?: string[]
  qrCodeUrl?: string
  secretKey?: string
}

export interface MFAChallenge {
  challengeId: string
  factorId: string
  method: MFAMethod
  expiresAt: string
  attemptsRemaining: number
  deliveryDestination?: string
  challengeType: 'verification' | 'enrollment' | 'recovery'
}

export interface MFAHistoryEntry {
  id: string
  timestamp: string
  action: 'enroll' | 'verify' | 'challenge' | 'remove' | 'backup_used' | 'recovery_initiated'
  method: MFAMethod
  success: boolean
  ipAddress: string
  userAgent: string
  riskScore?: number
  notes?: string
}

export interface MFAContextType {
  isMFARequired: boolean
  isMFAEnabled: boolean
  isEnrolled: boolean
  factors: MFAFactor[]
  pendingChallenge: MFAChallenge | null
  enrollFactor: (method: MFAMethod, contact?: string) => Promise<MFAFactor>
  verifyEnrollment: (factorId: string, code: string) => Promise<boolean>
  sendChallenge: (factorId: string) => Promise<MFAChallenge>
  verifyChallenge: (challengeId: string, code: string) => Promise<boolean>
  removeFactor: (factorId: string) => Promise<boolean>
  setPrimaryFactor: (factorId: string) => Promise<boolean>
  generateBackupCodes: (factorId: string) => Promise<string[]>
  verifyBackupCode: (code: string) => Promise<boolean>
  initiateRecovery: (email: string) => Promise<boolean>
  getAvailableMethods: () => MFAMethod[]
  refreshFactors: () => Promise<void>
  getMFAHistory: () => Promise<MFAHistoryEntry[]>
  exportMFAReport: () => Promise<string>
}

const MFAContext = createContext<MFAContextType | null>(null)

export const MFAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [pendingChallenge, setPendingChallenge] = useState<MFAChallenge | null>(null)

  const isMFAEnabled = Boolean((user as any)?.mfa_enabled ?? (user as any)?.mfaEnabled)
  const isEnrolled = factors.length > 0

  const enrollFactor = async (method: MFAMethod): Promise<MFAFactor> => {
    if (method !== 'totp' && method !== 'google_authenticator' && method !== 'microsoft_authenticator') {
      throw new Error('Only TOTP enrollment is supported by the current backend')
    }

    const res = await secureFetch('/api/auth/mfa/setup', {
      method: 'POST',
      body: JSON.stringify({ method })
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      throw new Error(payload?.error || 'Failed to setup MFA')
    }

    const payload = await res.json()
    const data = payload?.data || payload

    const factor: MFAFactor = {
      id: `totp-${user?.id || 'user'}`,
      type: method,
      status: 'pending',
      displayName: 'Authenticator App',
      maskedIdentifier: user?.email ? `${user.email.slice(0, 2)}***` : '***',
      enrolledAt: new Date().toISOString(),
      isPrimary: true,
      qrCodeUrl: data.qrCodeUrl,
      secretKey: data.secret,
      backupCodes: data.backupCodes
    }

    setFactors([factor])
    return factor
  }

  const verifyEnrollment = async (_factorId: string, code: string): Promise<boolean> => {
    const res = await secureFetch('/api/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ code })
    })

    if (!res.ok) {
      return false
    }

    setFactors((prev) => prev.map((factor) => ({ ...factor, status: 'active', lastUsedAt: new Date().toISOString() })))
    return true
  }

  const sendChallenge = async () => {
    throw new Error('MFA challenge endpoint not implemented on backend')
  }

  const verifyChallenge = async () => {
    throw new Error('MFA challenge endpoint not implemented on backend')
  }

  const removeFactor = async () => {
    throw new Error('MFA removal endpoint not implemented on backend')
  }

  const setPrimaryFactor = async () => {
    throw new Error('MFA primary factor endpoint not implemented on backend')
  }

  const generateBackupCodes = async (factorId: string) => {
    const factor = factors.find((f) => f.id === factorId)
    if (!factor?.backupCodes) return []
    return factor.backupCodes
  }

  const verifyBackupCode = async () => {
    throw new Error('Backup code verification endpoint not implemented on backend')
  }

  const initiateRecovery = async () => {
    throw new Error('Recovery endpoint not implemented on backend')
  }

  const getAvailableMethods = () => ['totp', 'google_authenticator', 'microsoft_authenticator'] as MFAMethod[]

  const refreshFactors = async () => {
    logger.debug('[MFA] refreshFactors called; backend does not expose factor list yet')
  }

  const getMFAHistory = async () => [] as MFAHistoryEntry[]

  const exportMFAReport = async () => ''

  const value = useMemo<MFAContextType>(() => ({
    isMFARequired: Boolean((user as any)?.mfa_required ?? (user as any)?.mfaRequired),
    isMFAEnabled,
    isEnrolled,
    factors,
    pendingChallenge,
    enrollFactor,
    verifyEnrollment,
    sendChallenge,
    verifyChallenge,
    removeFactor,
    setPrimaryFactor,
    generateBackupCodes,
    verifyBackupCode,
    initiateRecovery,
    getAvailableMethods,
    refreshFactors,
    getMFAHistory,
    exportMFAReport
  }), [factors, pendingChallenge, isMFAEnabled, isEnrolled, user])

  return <MFAContext.Provider value={value}>{children}</MFAContext.Provider>
}

export const useMFA = (): MFAContextType => {
  const ctx = useContext(MFAContext)
  if (!ctx) {
    throw new Error('useMFA must be used within an MFAProvider')
  }
  return ctx
}

export default MFAProvider
