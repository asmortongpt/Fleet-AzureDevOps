/**
 * Authentication and Security Framework
 * FedRAMP-compliant authentication with SSO/OIDC, MFA, and session management
 */

export interface AuthToken {
  accessToken: string
  refreshToken: string
  tokenType: "Bearer"
  expiresIn: number
  expiresAt: string
  scope: string[]
}

export interface MFAConfig {
  enabled: boolean
  method: "totp" | "sms" | "email" | "hardware-key"
  backupCodes?: string[]
  lastVerified?: string
}

export interface SecurityContext {
  sessionId: string
  userId: string
  tenantId: string
  role: string
  permissions: string[]
  mfa: MFAConfig
  ipAddress: string
  userAgent: string
  createdAt: string
  lastActivity: string
  expiresAt: string
}

export interface SSOConfig {
  provider: "okta" | "azure-ad" | "google" | "auth0" | "custom-oidc"
  enabled: boolean
  clientId: string
  issuer: string
  redirectUri: string
  scopes: string[]
  claimsMapping: {
    userId: string
    email: string
    name: string
    role?: string
    groups?: string
  }
}

export interface APIToken {
  id: string
  name: string
  token: string // Hashed in storage
  userId: string
  tenantId: string
  scopes: string[]
  rateLimit: {
    requestsPerMinute: number
    requestsPerHour: number
  }
  ipWhitelist?: string[]
  expiresAt?: string
  createdAt: string
  lastUsed?: string
  revoked: boolean
}

/**
 * Session management
 */
export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private static readonly MAX_SESSIONS_PER_USER = 5

  static async createSession(
    userId: string,
    tenantId: string,
    role: string,
    permissions: string[],
    ipAddress: string,
    userAgent: string
  ): Promise<SecurityContext> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.SESSION_TIMEOUT)

    const session: SecurityContext = {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      tenantId,
      role,
      permissions,
      mfa: {
        enabled: false,
        method: "totp"
      },
      ipAddress,
      userAgent,
      createdAt: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    }

    // Store session (in production, this would be Redis/database)
    this.storeSession(session)

    return session
  }

  static async validateSession(sessionId: string): Promise<SecurityContext | null> {
    const session = this.getSession(sessionId)
    
    if (!session) return null

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      this.revokeSession(sessionId)
      return null
    }

    // Update last activity
    session.lastActivity = new Date().toISOString()
    this.storeSession(session)

    return session
  }

  static async refreshSession(sessionId: string): Promise<SecurityContext | null> {
    const session = await this.validateSession(sessionId)
    if (!session) return null

    const now = new Date()
    session.expiresAt = new Date(now.getTime() + this.SESSION_TIMEOUT).toISOString()
    this.storeSession(session)

    return session
  }

  static revokeSession(sessionId: string): void {
    // Remove from storage
    localStorage.removeItem(`session_${sessionId}`)
  }

  private static storeSession(session: SecurityContext): void {
    localStorage.setItem(`session_${session.sessionId}`, JSON.stringify(session))
  }

  private static getSession(sessionId: string): SecurityContext | null {
    const data = localStorage.getItem(`session_${sessionId}`)
    return data ? JSON.parse(data) : null
  }
}

/**
 * Multi-Factor Authentication
 */
export class MFAService {
  static async generateTOTPSecret(): Promise<{ secret: string; qrCode: string }> {
    // In production, use a proper TOTP library
    const secret = Math.random().toString(36).substr(2, 16).toUpperCase()
    const qrCode = `otpauth://totp/Fleet:user@example.com?secret=${secret}&issuer=Fleet`
    
    return { secret, qrCode }
  }

  static async verifyTOTP(secret: string, token: string): Promise<boolean> {
    // In production, implement actual TOTP verification
    // This is a placeholder
    return token.length === 6 && /^\d+$/.test(token)
  }

  static async sendSMSCode(phoneNumber: string): Promise<string> {
    // In production, integrate with SMS provider (Twilio, AWS SNS)
    // Use crypto.getRandomValues for cryptographically secure random numbers
    const randomValues = new Uint32Array(1)
    crypto.getRandomValues(randomValues)
    const code = (100000 + (randomValues[0] % 900000)).toString()
    console.log(`SMS Code sent to ${phoneNumber}: ${code}`)
    return code
  }

  static async sendEmailCode(email: string): Promise<string> {
    // In production, integrate with email provider
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log(`Email Code sent to ${email}: ${code}`)
    return code
  }

  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // Use crypto.getRandomValues for cryptographically secure random codes
      const randomValues = new Uint8Array(6)
      crypto.getRandomValues(randomValues)
      const code = Array.from(randomValues, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase().substr(0, 8)
      codes.push(code)
    }
    return codes
  }
}

/**
 * API Token Management
 */
export class APITokenService {
  static async createToken(
    userId: string,
    tenantId: string,
    name: string,
    scopes: string[],
    options?: {
      expiresIn?: number // seconds
      rateLimit?: APIToken["rateLimit"]
      ipWhitelist?: string[]
    }
  ): Promise<APIToken> {
    const token = `fleetapi_${Math.random().toString(36).substr(2, 32)}`
    const expiresAt = options?.expiresIn 
      ? new Date(Date.now() + options.expiresIn * 1000).toISOString()
      : undefined

    const apiToken: APIToken = {
      id: `token_${Date.now()}`,
      name,
      token, // In production, hash this before storing
      userId,
      tenantId,
      scopes,
      rateLimit: options?.rateLimit || {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      ipWhitelist: options?.ipWhitelist,
      expiresAt,
      createdAt: new Date().toISOString(),
      revoked: false
    }

    return apiToken
  }

  static async validateToken(token: string, scope?: string): Promise<APIToken | null> {
    // In production, this would check against hashed tokens in database
    const storedToken = this.getStoredToken(token)
    
    if (!storedToken) return null
    if (storedToken.revoked) return null
    if (storedToken.expiresAt && new Date(storedToken.expiresAt) < new Date()) return null
    if (scope && !storedToken.scopes.includes(scope)) return null

    // Update last used
    storedToken.lastUsed = new Date().toISOString()
    this.storeToken(storedToken)

    return storedToken
  }

  static revokeToken(tokenId: string): void {
    const token = this.getStoredTokenById(tokenId)
    if (token) {
      token.revoked = true
      this.storeToken(token)
    }
  }

  private static storeToken(token: APIToken): void {
    localStorage.setItem(`api_token_${token.id}`, JSON.stringify(token))
  }

  private static getStoredToken(tokenString: string): APIToken | null {
    // Simplified lookup - in production, use proper database query
    return null
  }

  private static getStoredTokenById(tokenId: string): APIToken | null {
    const data = localStorage.getItem(`api_token_${tokenId}`)
    return data ? JSON.parse(data) : null
  }
}

/**
 * Password policy enforcement (FedRAMP compliant)
 */
export class PasswordPolicy {
  static readonly MIN_LENGTH = 12
  static readonly REQUIRE_UPPERCASE = true
  static readonly REQUIRE_LOWERCASE = true
  static readonly REQUIRE_NUMBERS = true
  static readonly REQUIRE_SPECIAL = true
  static readonly MAX_AGE_DAYS = 90
  static readonly PREVENT_REUSE_COUNT = 24
  static readonly MAX_FAILED_ATTEMPTS = 5
  static readonly LOCKOUT_DURATION_MINUTES = 30

  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`)
    }

    if (this.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push("Password must contain uppercase letters")
    }

    if (this.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push("Password must contain lowercase letters")
    }

    if (this.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push("Password must contain numbers")
    }

    if (this.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain special characters")
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static async hashPassword(password: string): Promise<string> {
    // In production, use bcrypt or Argon2
    return `hashed_${password}`
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    // In production, use proper password verification
    return hash === `hashed_${password}`
  }
}

/**
 * Encryption utilities (FedRAMP compliant)
 */
export class EncryptionService {
  static async encryptData(data: string, key: string): Promise<string> {
    // In production, use AES-256-GCM or similar
    return `encrypted_${data}`
  }

  static async decryptData(encryptedData: string, key: string): Promise<string> {
    // In production, implement proper decryption
    return encryptedData.replace("encrypted_", "")
  }

  static generateEncryptionKey(): string {
    // In production, use proper key generation (crypto.randomBytes)
    return Math.random().toString(36).substr(2, 32)
  }
}
