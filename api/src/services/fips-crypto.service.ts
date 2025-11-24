/**
 * FIPS 140-2 Compliant Cryptography Service
 *
 * This service provides FIPS-validated cryptographic operations:
 * - PBKDF2 for password hashing (NIST SP 800-132)
 * - HMAC-SHA-256 for message authentication (FIPS 198-1)
 * - SHA-256/384/512 for hashing (FIPS 180-4)
 *
 * SECURITY:
 * - Only uses FIPS-approved algorithms
 * - Parameterized operations (no string concatenation)
 * - Secure random salt generation
 * - Timing-safe comparison
 */

import crypto from 'crypto'

/**
 * FIPS 140-2 Password Hashing Service
 * Uses PBKDF2 (Password-Based Key Derivation Function 2)
 *
 * NIST SP 800-132 Recommendations:
 * - Minimum 10,000 iterations (we use 100,000 for enhanced security)
 * - SHA-256 or stronger (we use SHA-256)
 * - Minimum 128-bit salt (we use 256-bit)
 * - Minimum 128-bit output (we use 256-bit)
 */
export class FIPSCryptoService {
  // PBKDF2 configuration (NIST SP 800-132 compliant)
  private static readonly PBKDF2_ITERATIONS = 100000 // 100,000 iterations
  private static readonly PBKDF2_KEY_LENGTH = 32 // 256 bits
  private static readonly PBKDF2_DIGEST = 'sha256' // FIPS 180-4 approved
  private static readonly SALT_LENGTH = 32 // 256 bits

  /**
   * Hash a password using PBKDF2
   *
   * @param password - Plain text password to hash
   * @returns Promise<string> - Encoded hash string (salt:hash format)
   *
   * Format: iterations$salt$hash
   * Example: 100000$a1b2c3d4...$e5f6g7h8...
   */
  static async hashPassword(password: string): Promise<string> {
    // SECURITY: Generate cryptographically secure random salt
    const salt = crypto.randomBytes(this.SALT_LENGTH)

    // SECURITY: Use PBKDF2 with FIPS-approved parameters
    const hash = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        this.PBKDF2_ITERATIONS,
        this.PBKDF2_KEY_LENGTH,
        this.PBKDF2_DIGEST,
        (err, derivedKey) => {
          if (err) reject(err)
          else resolve(derivedKey)
        }
      )
    })

    // Encode as: iterations$salt$hash (base64)
    const saltBase64 = salt.toString('base64')
    const hashBase64 = hash.toString('base64')

    return `${this.PBKDF2_ITERATIONS}$${saltBase64}$${hashBase64}`
  }

  /**
   * Verify a password against a PBKDF2 hash
   *
   * @param password - Plain text password to verify
   * @param storedHash - Stored hash string (iterations$salt$hash format)
   * @returns Promise<boolean> - True if password matches, false otherwise
   */
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
      // Parse stored hash
      const parts = storedHash.split('$')
      if (parts.length !== 3) {
        throw new Error('Invalid hash format')
      }

      const iterations = parseInt(parts[0], 10)
      const salt = Buffer.from(parts[1], 'base64')
      const storedHashBuffer = Buffer.from(parts[2], 'base64')

      // Derive key from provided password
      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        crypto.pbkdf2(
          password,
          salt,
          iterations,
          storedHashBuffer.length,
          this.PBKDF2_DIGEST,
          (err, key) => {
            if (err) reject(err)
            else resolve(key)
          }
        )
      })

      // SECURITY: Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(storedHashBuffer, derivedKey)
    } catch (error) {
      // Log error for debugging but don't expose details to caller
      console.error('Password verification error:', error)
      return false
    }
  }

  /**
   * Migrate a bcrypt hash to PBKDF2
   *
   * This is a helper function for migration. When a user logs in with
   * a bcrypt hash, this function can be used to rehash their password
   * with PBKDF2 during the next successful login.
   *
   * @param password - Plain text password
   * @returns Promise<string> - New PBKDF2 hash
   */
  static async migrateBcryptHash(password: string): Promise<string> {
    return this.hashPassword(password)
  }

  /**
   * Generate HMAC-SHA-256 signature (FIPS 198-1)
   *
   * @param data - Data to sign
   * @param key - Secret key for signing
   * @returns string - HMAC signature (hex encoded)
   */
  static hmacSHA256(data: string, key: string): string {
    return crypto
      .createHmac('sha256', key)
      .update(data)
      .digest('hex')
  }

  /**
   * Generate SHA-256 hash (FIPS 180-4)
   *
   * @param data - Data to hash
   * @returns string - SHA-256 hash (hex encoded)
   */
  static sha256(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
  }

  /**
   * Generate SHA-512 hash (FIPS 180-4)
   *
   * @param data - Data to hash
   * @returns string - SHA-512 hash (hex encoded)
   */
  static sha512(data: string): string {
    return crypto
      .createHash('sha512')
      .update(data)
      .digest('hex')
  }

  /**
   * Generate cryptographically secure random bytes
   *
   * @param length - Number of bytes to generate
   * @returns Buffer - Random bytes
   */
  static randomBytes(length: number): Buffer {
    return crypto.randomBytes(length)
  }

  /**
   * Generate random token (hex encoded)
   *
   * @param length - Number of bytes (default 32)
   * @returns string - Random token (hex encoded)
   */
  static generateToken(length: number = 32): string {
    return this.randomBytes(length).toString('hex')
  }

  /**
   * Check if FIPS mode is enabled
   *
   * @returns boolean - True if FIPS mode is enabled
   */
  static isFIPSEnabled(): boolean {
    return crypto.getFips() === 1
  }

  /**
   * Get FIPS status information
   *
   * @returns object - FIPS status information
   */
  static getFIPSStatus() {
    const fipsEnabled = this.isFIPSEnabled()
    return {
      enabled: fipsEnabled,
      mode: fipsEnabled ? 'FIPS 140-2' : 'Standard',
      openSSLVersion: process.versions.openssl,
      nodeVersion: process.version,
      algorithms: {
        passwordHashing: 'PBKDF2-HMAC-SHA256',
        hashing: 'SHA-256, SHA-384, SHA-512',
        mac: 'HMAC-SHA-256',
        randomNumberGenerator: 'DRBG (Deterministic Random Bit Generator)'
      }
    }
  }
}

/**
 * Export singleton instance
 */
export const fipsCrypto = FIPSCryptoService
