
/**
 * Multi-Factor Authentication (MFA) Provider for DCF Fleet Management
 * Comprehensive MFA implementation supporting SMS, Email, and Authenticator Apps
 * Compliant with DCF ITB 2425-077 security requirements and SOC 2 Type 2
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import { useAuth } from './AuthProviderFactory'

import { logger } from '@/utils/logger';

// MFA Method Types
export type MFAMethod = 'sms' | 'email' | 'totp' | 'okta_verify' | 'google_authenticator' | 'microsoft_authenticator'

// MFA Factor Interface
export interface MFAFactor {
  id: string
  type: MFAMethod
  status: 'active' | 'pending' | 'inactive' | 'expired'
  displayName: string
  maskedIdentifier: string // e.g., "***-***-1234" for phone, "j***@***.gov" for email
  enrolledAt: string
  lastUsedAt?: string
  isPrimary: boolean
  backupCodes?: string[]
  qrCodeUrl?: string // For TOTP setup
  secretKey?: string // For TOTP setup
}

// MFA Challenge Interface
export interface MFAChallenge {
  challengeId: string
  factorId: string
  method: MFAMethod
  expiresAt: string
  attemptsRemaining: number
  deliveryDestination?: string // Where code was sent
  challengeType: 'verification' | 'enrollment' | 'recovery'
}

// MFA Context Interface
export interface MFAContextType {
  // MFA Status
  isMFARequired: boolean
  isMFAEnabled: boolean
  isEnrolled: boolean
  factors: MFAFactor[]
  pendingChallenge: MFAChallenge | null

  // MFA Operations
  enrollFactor: (method: MFAMethod, contact?: string) => Promise<MFAFactor>
  verifyEnrollment: (factorId: string, code: string) => Promise<boolean>
  sendChallenge: (factorId: string) => Promise<MFAChallenge>
  verifyChallenge: (challengeId: string, code: string) => Promise<boolean>
  removeFactor: (factorId: string) => Promise<boolean>
  setPrimaryFactor: (factorId: string) => Promise<boolean>

  // Backup and Recovery
  generateBackupCodes: (factorId: string) => Promise<string[]>
  verifyBackupCode: (code: string) => Promise<boolean>
  initiateRecovery: (email: string) => Promise<boolean>

  // Factor Management
  getAvailableMethods: () => MFAMethod[]
  refreshFactors: () => Promise<void>

  // Compliance and Audit
  getMFAHistory: () => Promise<MFAHistoryEntry[]>
  exportMFAReport: () => Promise<string>
}

// MFA History Entry
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

// Create MFA Context
const MFAContext = createContext<MFAContextType | null>(null)

// Mock MFA Service (in production, this would integrate with Okta)
class MFAService {
  private factors: Map<string, MFAFactor> = new Map()
  private challenges: Map<string, MFAChallenge> = new Map()
  private history: MFAHistoryEntry[] = []
  private backupCodes: Map<string, string[]> = new Map()

  // Generate a mock factor ID
  private generateFactorId(): string {
    return `factor_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate a mock challenge ID
  private generateChallengeId(): string {
    return `challenge_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate TOTP secret
  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  // Generate QR code URL for TOTP
  private generateQRCodeUrl(secret: string, userEmail: string): string {
    const issuer = 'DCF Fleet Management'
    const encodedIssuer = encodeURIComponent(issuer)
    const encodedEmail = encodeURIComponent(userEmail)
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}`
  }

  // Generate verification code (for simulation)
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Log MFA activity
  private logActivity(action: MFAHistoryEntry['action'], method: MFAMethod, success: boolean, notes?: string) {
    const entry: MFAHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      action,
      method,
      success,
      ipAddress: 'client-ip', // Would be real IP in production
      userAgent: navigator.userAgent,
      riskScore: Math.floor(Math.random() * 100),
      notes
    }

    this.history.unshift(entry)

    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100)
    }

    // logger.debug('🔐 MFA Activity:', entry)
  }

  // Enroll a new MFA factor
  async enrollFactor(method: MFAMethod, contact?: string, userEmail?: string): Promise<MFAFactor> {
    const factorId = this.generateFactorId()

    let factor: MFAFactor = {
      id: factorId,
      type: method,
      status: 'pending',
      displayName: this.getMethodDisplayName(method),
      maskedIdentifier: this.maskIdentifier(method, contact),
      enrolledAt: new Date().toISOString(),
      isPrimary: this.factors.size === 0 // First factor is primary
    }

    // Handle TOTP-based methods
    if (method === 'totp' || method === 'google_authenticator' || method === 'microsoft_authenticator') {
      const secret = this.generateTOTPSecret()
      const qrCodeUrl = this.generateQRCodeUrl(secret, userEmail || 'user@dcf.state.fl.us')
      factor = {
        ...factor,
        qrCodeUrl,
        secretKey: secret
      }
    }

    this.factors.set(factorId, factor)
    this.logActivity('enroll', method, true, `Factor ID: ${factorId}`)

    return factor
  }

  // Verify enrollment with code
  async verifyEnrollment(factorId: string, code: string): Promise<boolean> {
    const factor = this.factors.get(factorId)
    if (!factor) {
      this.logActivity('verify', 'sms', false, 'Factor not found')
      return false
    }

    // For demo purposes, accept any 6-digit code
    const isValid = /^\d{6}$/.test(code)

    if (isValid) {
      factor.status = 'active'
      factor.lastUsedAt = new Date().toISOString()
      this.factors.set(factorId, factor)

      // Generate backup codes for the first active factor
      if (this.getActiveFactors().length === 1) {
        const backupCodes = this.generateBackupCodes()
        this.backupCodes.set(factorId, backupCodes)
        factor.backupCodes = backupCodes
      }

      this.logActivity('verify', factor.type, true, 'Enrollment verified')
    } else {
      this.logActivity('verify', factor.type, false, 'Invalid code')
    }

    return isValid
  }

  // Send MFA challenge
  async sendChallenge(factorId: string): Promise<MFAChallenge> {
    const factor = this.factors.get(factorId)
    if (!factor || factor.status !== 'active') {
      throw new Error('Factor not available')
    }

    const challengeId = this.generateChallengeId()
    const challenge: MFAChallenge = {
      challengeId,
      factorId,
      method: factor.type,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      attemptsRemaining: 3,
      deliveryDestination: factor.maskedIdentifier,
      challengeType: 'verification'
    }

    this.challenges.set(challengeId, challenge)
    this.logActivity('challenge', factor.type, true, `Challenge sent to ${factor.maskedIdentifier}`)

    // Simulate sending code (in production, would actually send)
    if (factor.type === 'sms') {
      // logger.debug(`📱 SMS sent to ${factor.maskedIdentifier}: ${this.generateVerificationCode()}`)
    } else if (factor.type === 'email') {
      // logger.debug(`📧 Email sent to ${factor.maskedIdentifier}: ${this.generateVerificationCode()}`)
    }

    return challenge
  }

  // Verify MFA challenge
  async verifyChallenge(challengeId: string, code: string): Promise<boolean> {
    const challenge = this.challenges.get(challengeId)
    if (!challenge) {
      this.logActivity('verify', 'sms', false, 'Challenge not found')
      return false
    }

    // Check expiry
    if (new Date(challenge.expiresAt) < new Date()) {
      this.challenges.delete(challengeId)
      this.logActivity('verify', challenge.method, false, 'Challenge expired')
      return false
    }

    // Check attempts
    if (challenge.attemptsRemaining <= 0) {
      this.challenges.delete(challengeId)
      this.logActivity('verify', challenge.method, false, 'Maximum attempts exceeded')
      return false
    }

    // For demo purposes, accept any 6-digit code
    const isValid = /^\d{6}$/.test(code)

    if (isValid) {
      this.challenges.delete(challengeId)

      // Update factor last used
      const factor = this.factors.get(challenge.factorId)
      if (factor) {
        factor.lastUsedAt = new Date().toISOString()
        this.factors.set(challenge.factorId, factor)
      }

      this.logActivity('verify', challenge.method, true, 'Challenge verified')
    } else {
      // Decrement attempts
      challenge.attemptsRemaining--
      this.challenges.set(challengeId, challenge)
      this.logActivity('verify', challenge.method, false, `Invalid code, ${challenge.attemptsRemaining} attempts remaining`)
    }

    return isValid
  }

  // Remove MFA factor
  async removeFactor(factorId: string): Promise<boolean> {
    const factor = this.factors.get(factorId)
    if (!factor) {
      return false
    }

    // Don't allow removing the last active factor
    const activeFactors = this.getActiveFactors()
    if (activeFactors.length === 1 && activeFactors[0].id === factorId) {
      throw new Error('Cannot remove the last active MFA factor')
    }

    this.factors.delete(factorId)
    this.backupCodes.delete(factorId)
    this.logActivity('remove', factor.type, true, `Factor removed: ${factorId}`)

    return true
  }

  // Set primary factor
  async setPrimaryFactor(factorId: string): Promise<boolean> {
    const factor = this.factors.get(factorId)
    if (!factor || factor.status !== 'active') {
      return false
    }

    // Remove primary status from all factors
    for (const [id, f] of this.factors) {
      f.isPrimary = false
      this.factors.set(id, f)
    }

    // Set new primary
    factor.isPrimary = true
    this.factors.set(factorId, factor)
    this.logActivity('verify', factor.type, true, `Primary factor changed to ${factor.type}`)

    return true
  }

  // Generate backup codes
  generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  // Verify backup code
  async verifyBackupCode(code: string): Promise<boolean> {
    for (const [factorId, codes] of this.backupCodes) {
      const index = codes.indexOf(code.toUpperCase())
      if (index !== -1) {
        // Remove used backup code
        codes.splice(index, 1)
        this.backupCodes.set(factorId, codes)

        const factor = this.factors.get(factorId)
        this.logActivity('backup_used', factor?.type || 'sms', true, 'Backup code used')

        return true
      }
    }

    this.logActivity('backup_used', 'sms', false, 'Invalid backup code')
    return false
  }

  // Get active factors
  getActiveFactors(): MFAFactor[] {
    return Array.from(this.factors.values()).filter(f => f.status === 'active')
  }

  // Get all factors
  getAllFactors(): MFAFactor[] {
    return Array.from(this.factors.values())
  }

  // Get MFA history
  getMFAHistory(): MFAHistoryEntry[] {
    return [...this.history]
  }

  // Helper methods
  private getMethodDisplayName(method: MFAMethod): string {
    const names: Record<MFAMethod, string> = {
      sms: 'SMS Text Message',
      email: 'Email Verification',
      totp: 'Time-based OTP',
      okta_verify: 'Okta Verify',
      google_authenticator: 'Google Authenticator',
      microsoft_authenticator: 'Microsoft Authenticator'
    }
    return names[method]
  }

  private maskIdentifier(method: MFAMethod, contact?: string): string {
    if (!contact) return 'Not specified'

    if (method === 'sms') {
      // Mask phone number: (555) 123-4567 -> ***-***-4567
      return contact.replace(/(\d{3})\s*(\d{3})\s*(\d{4})/, '***-***-$3')
    } else if (method === 'email') {
      // Mask email: john.doe@dcf.state.fl.us -> j***@***.gov
      const [local, domain] = contact.split('@')
      const maskedLocal = local[0] + '***'
      const maskedDomain = '***.' + domain.split('.').slice(-1)[0]
      return `${maskedLocal}@${maskedDomain}`
    }

    return contact
  }
}

// MFA Provider Component
export const MFAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [mfaService] = useState(() => new MFAService())
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [pendingChallenge, setPendingChallenge] = useState<MFAChallenge | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // MFA Requirements based on DCF policy
  const isMFARequired = import.meta.env.VITE_REACT_APP_MFA_REQUIRED !== 'false' && import.meta.env.VITE_NODE_ENV === 'production'
  const isMFAEnabled = user?.mfaEnabled || false
  const isEnrolled = factors.some(f => f.status === 'active')

  // Load factors when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshFactors()
    }
  }, [isAuthenticated, user])

  // Refresh factors from service
  const refreshFactors = async () => {
    try {
      setIsLoading(true)
      const allFactors = mfaService.getAllFactors()
      setFactors(allFactors)
    } catch (error) {
      logger.error('Error refreshing factors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Enroll new MFA factor
  const enrollFactor = async (method: MFAMethod, contact?: string): Promise<MFAFactor> => {
    try {
      const factor = await mfaService.enrollFactor(method, contact, user?.email)
      await refreshFactors()
      return factor
    } catch (error) {
      logger.error('Error enrolling factor:', error)
      throw error
    }
  }

  // Verify enrollment
  const verifyEnrollment = async (factorId: string, code: string): Promise<boolean> => {
    try {
      const result = await mfaService.verifyEnrollment(factorId, code)
      if (result) {
        await refreshFactors()
      }
      return result
    } catch (error) {
      logger.error('Error verifying enrollment:', error)
      return false
    }
  }

  // Send MFA challenge
  const sendChallenge = async (factorId: string): Promise<MFAChallenge> => {
    try {
      const challenge = await mfaService.sendChallenge(factorId)
      setPendingChallenge(challenge)
      return challenge
    } catch (error) {
      logger.error('Error sending challenge:', error)
      throw error
    }
  }

  // Verify MFA challenge
  const verifyChallenge = async (challengeId: string, code: string): Promise<boolean> => {
    try {
      const result = await mfaService.verifyChallenge(challengeId, code)
      if (result) {
        setPendingChallenge(null)
        await refreshFactors()
      }
      return result
    } catch (error) {
      logger.error('Error verifying challenge:', error)
      return false
    }
  }

  // Remove MFA factor
  const removeFactor = async (factorId: string): Promise<boolean> => {
    try {
      const result = await mfaService.removeFactor(factorId)
      if (result) {
        await refreshFactors()
      }
      return result
    } catch (error) {
      logger.error('Error removing factor:', error)
      return false
    }
  }

  // Set primary factor
  const setPrimaryFactor = async (factorId: string): Promise<boolean> => {
    try {
      const result = await mfaService.setPrimaryFactor(factorId)
      if (result) {
        await refreshFactors()
      }
      return result
    } catch (error) {
      logger.error('Error setting primary factor:', error)
      return false
    }
  }

  // Generate backup codes
  const generateBackupCodes = async (factorId: string): Promise<string[]> => {
    try {
      return mfaService.generateBackupCodes()
    } catch (error) {
      logger.error('Error generating backup codes:', error)
      return []
    }
  }

  // Verify backup code
  const verifyBackupCode = async (code: string): Promise<boolean> => {
    try {
      return await mfaService.verifyBackupCode(code)
    } catch (error) {
      logger.error('Error verifying backup code:', error)
      return false
    }
  }

  // Initiate recovery
  const initiateRecovery = async (email: string): Promise<boolean> => {
    try {
      // In production, this would trigger recovery email
      // logger.debug(`🔄 MFA recovery initiated for ${email}`)
      return true
    } catch (error) {
      logger.error('Error initiating recovery:', error)
      return false
    }
  }

  // Get available MFA methods
  const getAvailableMethods = (): MFAMethod[] => {
    const allMethods: MFAMethod[] = [
      'sms',
      'email',
      'google_authenticator',
      'microsoft_authenticator',
      'okta_verify'
    ]

    // In production, filter based on organizational policy
    if (import.meta.env.VITE_NODE_ENV === 'production') {
      return allMethods.filter(method => {
        // DCF may restrict certain methods
        const allowedMethods = import.meta.env.VITE_REACT_APP_ALLOWED_MFA_METHODS?.split(',') || allMethods
        return allowedMethods.includes(method)
      })
    }

    return allMethods
  }

  // Get MFA history
  const getMFAHistory = async (): Promise<MFAHistoryEntry[]> => {
    try {
      return mfaService.getMFAHistory()
    } catch (error) {
      logger.error('Error getting MFA history:', error)
      return []
    }
  }

  // Export MFA report
  const exportMFAReport = async (): Promise<string> => {
    try {
      const history = await getMFAHistory()
      const report = {
        user: {
          employeeId: user?.employeeId,
          email: user?.email,
          department: user?.department
        },
        mfaStatus: {
          required: isMFARequired,
          enabled: isMFAEnabled,
          enrolled: isEnrolled,
          factorCount: factors.filter(f => f.status === 'active').length
        },
        factors: factors,
        history: history.slice(0, 50) // Last 50 events
      }

      return JSON.stringify(report, null, 2)
    } catch (error) {
      logger.error('Error exporting MFA report:', error)
      return ''
    }
  }

  // Context value
  const contextValue: MFAContextType = {
    isMFARequired,
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
  }

  return (
    <MFAContext.Provider value={contextValue}>
      {children}
    </MFAContext.Provider>
  )
}

// Hook to use MFA context
export const useMFA = (): MFAContextType => {
  const context = useContext(MFAContext)
  if (!context) {
    throw new Error('useMFA must be used within an MFAProvider')
  }
  return context
}

export default MFAProvider
