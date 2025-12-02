/**
 * FIPS 140-2 Compliant JWT Service
 *
 * Uses RS256 (RSA with SHA-256) instead of HS256:
 * - RSA is FIPS-approved (FIPS 186-4)
 * - SHA-256 is FIPS-approved (FIPS 180-4)
 * - Asymmetric cryptography provides better key separation
 *
 * SECURITY:
 * - Private key used for signing (kept secret on server)
 * - Public key used for verification (can be shared)
 * - 2048-bit RSA keys (NIST recommended minimum)
 */

import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

export class FIPSJWTService {
  private static privateKey: string | null = null
  private static publicKey: string | null = null

  /**
   * Load RSA keys from filesystem
   */
  private static loadKeys() {
    if (!this.privateKey || !this.publicKey) {
      try {
        const basePath = path.join(process.cwd(), 'api')
        const privateKeyPath = path.join(basePath, 'jwt-private.pem')
        const publicKeyPath = path.join(basePath, 'jwt-public.pem')

        // Try base path first, then fall back to current directory
        if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
          this.privateKey = fs.readFileSync(privateKeyPath, 'utf8')
          this.publicKey = fs.readFileSync(publicKeyPath, 'utf8')
        } else {
          // Fallback: try current directory
          const localPrivateKeyPath = path.join(process.cwd(), 'jwt-private.pem')
          const localPublicKeyPath = path.join(process.cwd(), 'jwt-public.pem')

          if (fs.existsSync(localPrivateKeyPath) && fs.existsSync(localPublicKeyPath)) {
            this.privateKey = fs.readFileSync(localPrivateKeyPath, 'utf8')
            this.publicKey = fs.readFileSync(localPublicKeyPath, 'utf8')
          } else {
            throw new Error('RSA keys not found. Run: openssl genrsa -out jwt-private.pem 2048 && openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem')
          }
        }

        console.log('✅ FIPS JWT Service: RSA keys loaded successfully')
      } catch (error) {
        console.error('❌ Failed to load RSA keys:', error)
        throw error
      }
    }
  }

  /**
   * Sign a JWT token using RS256 (FIPS-compliant)
   *
   * @param payload - Token payload
   * @param options - JWT sign options
   * @returns string - Signed JWT token
   */
  static sign(payload: object, options?: jwt.SignOptions): string {
    this.loadKeys()

    if (!this.privateKey) {
      throw new Error('Private key not loaded')
    }

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256', // FIPS-approved RSA with SHA-256
      ...options
    })
  }

  /**
   * Verify a JWT token using RS256 (FIPS-compliant)
   *
   * @param token - JWT token to verify
   * @param options - JWT verify options
   * @returns object - Decoded token payload
   */
  static verify(token: string, options?: jwt.VerifyOptions): any {
    this.loadKeys()

    if (!this.publicKey) {
      throw new Error('Public key not loaded')
    }

    return jwt.verify(token, this.publicKey, {
      algorithms: ['RS256'], // Only accept RS256
      ...options
    })
  }

  /**
   * Decode a JWT token without verification
   *
   * @param token - JWT token to decode
   * @returns object - Decoded token payload (not verified)
   */
  static decode(token: string): any {
    return jwt.decode(token)
  }

  /**
   * Get public key for external verification
   *
   * @returns string - Public key PEM
   */
  static getPublicKey(): string {
    this.loadKeys()

    if (!this.publicKey) {
      throw new Error('Public key not loaded')
    }

    return this.publicKey
  }

  /**
   * Generate access token (short-lived: 15 minutes)
   *
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @param tenantId - Tenant ID
   * @returns string - JWT access token
   */
  static generateAccessToken(
    userId: string,
    email: string,
    role: string,
    tenantId: string
  ): string {
    return this.sign(
      {
        id: userId,
        email,
        role,
        tenant_id: tenantId,
        type: 'access'
      },
      {
        expiresIn: '15m',
        issuer: 'fleet-management-api',
        audience: 'fleet-management-app'
      }
    )
  }

  /**
   * Generate refresh token (long-lived: 7 days)
   *
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @returns string - JWT refresh token
   */
  static generateRefreshToken(userId: string, tenantId: string): string {
    return this.sign(
      {
        id: userId,
        tenant_id: tenantId,
        type: 'refresh',
        jti: `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}` // Unique token ID
      },
      {
        expiresIn: '7d',
        issuer: 'fleet-management-api',
        audience: 'fleet-management-app'
      }
    )
  }

  /**
   * Verify access token
   *
   * @param token - Access token to verify
   * @returns object - Decoded token payload
   */
  static verifyAccessToken(token: string): any {
    const decoded = this.verify(token, {
      issuer: 'fleet-management-api',
      audience: 'fleet-management-app'
    })

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type')
    }

    return decoded
  }

  /**
   * Verify refresh token
   *
   * @param token - Refresh token to verify
   * @returns object - Decoded token payload
   */
  static verifyRefreshToken(token: string): any {
    const decoded = this.verify(token, {
      issuer: 'fleet-management-api',
      audience: 'fleet-management-app'
    })

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type')
    }

    return decoded
  }
}

/**
 * Export singleton instance
 */
export const fipsJWT = FIPSJWTService
