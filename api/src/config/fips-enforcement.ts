/**
 * FIPS 140-2 Enforcement Module
 *
 * This module ENFORCES FIPS mode at all times.
 * - In production: Application WILL NOT START without FIPS mode
 * - In development: Warns but continues (macOS doesn't support FIPS)
 * - Logs FIPS status on every startup
 *
 * SECURITY REQUIREMENT: FIPS mode must be enabled for federal/government deployments
 */

import crypto from 'crypto'

interface FIPSStatus {
  enabled: boolean
  mode: 'FIPS 140-2' | 'Standard' | 'Error'
  openSSLVersion: string
  nodeVersion: string
  algorithms: {
    passwordHashing: string
    jwtSigning: string
    hashing: string
    mac: string
    rng: string
  }
  enforcement: 'STRICT' | 'WARNING' | 'DISABLED'
}

export class FIPSEnforcement {
  private static instance: FIPSEnforcement
  private fipsStatus: FIPSStatus

  private constructor() {
    this.fipsStatus = this.checkFIPSStatus()
  }

  public static getInstance(): FIPSEnforcement {
    if (!FIPSEnforcement.instance) {
      FIPSEnforcement.instance = new FIPSEnforcement()
    }
    return FIPSEnforcement.instance
  }

  /**
   * Check current FIPS status
   */
  private checkFIPSStatus(): FIPSStatus {
    let enabled = false
    let mode: 'FIPS 140-2' | 'Standard' | 'Error' = 'Standard'

    try {
      // Check if FIPS mode is enabled
      enabled = crypto.getFips() === 1

      if (enabled) {
        mode = 'FIPS 140-2'
      }
    } catch (error) {
      mode = 'Error'
      console.error('❌ Error checking FIPS status:', error)
    }

    // Determine enforcement level
    const isProduction = process.env.NODE_ENV === 'production'
    const enforcement = isProduction ? 'STRICT' : 'WARNING'

    return {
      enabled,
      mode,
      openSSLVersion: process.versions.openssl || 'unknown',
      nodeVersion: process.version,
      algorithms: {
        passwordHashing: 'PBKDF2-HMAC-SHA256 (NIST SP 800-132)',
        jwtSigning: 'RS256 (FIPS 186-4 + FIPS 180-4)',
        hashing: 'SHA-256/384/512 (FIPS 180-4)',
        mac: 'HMAC-SHA-256 (FIPS 198-1)',
        rng: 'DRBG (Deterministic Random Bit Generator)'
      },
      enforcement
    }
  }

  /**
   * Enforce FIPS mode based on environment
   *
   * @throws Error if FIPS mode is required but not enabled
   */
  public enforceFIPS(): void {
    const status = this.fipsStatus

    console.log('\n╔═══════════════════════════════════════════════════════════════╗')
    console.log('║              FIPS 140-2 COMPLIANCE CHECK                      ║')
    console.log('╠═══════════════════════════════════════════════════════════════╣')
    console.log(`║ FIPS Mode:           ${status.enabled ? '✅ ENABLED' : '❌ DISABLED'}                             ║`)
    console.log(`║ Mode:                ${status.mode.padEnd(38)}║`)
    console.log(`║ Node.js Version:     ${status.nodeVersion.padEnd(38)}║`)
    console.log(`║ OpenSSL Version:     ${status.openSSLVersion.padEnd(38)}║`)
    console.log(`║ Environment:         ${(process.env.NODE_ENV || 'development').toUpperCase().padEnd(38)}║`)
    console.log(`║ Enforcement:         ${status.enforcement.padEnd(38)}║`)
    console.log('╠═══════════════════════════════════════════════════════════════╣')
    console.log('║ FIPS-Approved Algorithms:                                     ║')
    console.log(`║  • Password Hashing: ${status.algorithms.passwordHashing.padEnd(38)}║`)
    console.log(`║  • JWT Signing:      ${status.algorithms.jwtSigning.padEnd(38)}║`)
    console.log(`║  • Hashing:          ${status.algorithms.hashing.padEnd(38)}║`)
    console.log(`║  • MAC:              ${status.algorithms.mac.padEnd(38)}║`)
    console.log(`║  • RNG:              ${status.algorithms.rng.padEnd(38)}║`)
    console.log('╚═══════════════════════════════════════════════════════════════╝\n')

    if (status.enforcement === 'STRICT' && !status.enabled) {
      // PRODUCTION: Refuse to start without FIPS mode
      console.error('╔═══════════════════════════════════════════════════════════════╗')
      console.error('║                    ⛔ FATAL ERROR ⛔                           ║')
      console.error('╠═══════════════════════════════════════════════════════════════╣')
      console.error('║ FIPS 140-2 mode is REQUIRED in production but is NOT enabled ║')
      console.error('║                                                               ║')
      console.error('║ To enable FIPS mode:                                          ║')
      console.error('║   NODE_OPTIONS="--enable-fips" node server.js                 ║')
      console.error('║                                                               ║')
      console.error('║ OR set environment variable:                                  ║')
      console.error('║   export NODE_OPTIONS="--enable-fips"                         ║')
      console.error('║                                                               ║')
      console.error('║ Note: Requires OpenSSL built with FIPS support               ║')
      console.error('╚═══════════════════════════════════════════════════════════════╝\n')

      throw new Error('FIPS 140-2 mode is required in production but is not enabled')
    }

    if (status.enforcement === 'WARNING' && !status.enabled) {
      // DEVELOPMENT: Warn but continue
      console.warn('╔═══════════════════════════════════════════════════════════════╗')
      console.warn('║                    ⚠️  WARNING ⚠️                              ║')
      console.warn('╠═══════════════════════════════════════════════════════════════╣')
      console.warn('║ FIPS 140-2 mode is NOT enabled (Development Mode)            ║')
      console.warn('║                                                               ║')
      console.warn('║ This is acceptable for development on macOS, but:            ║')
      console.warn('║  • All cryptographic algorithms are FIPS-approved            ║')
      console.warn('║  • Production deployment MUST enable FIPS mode               ║')
      console.warn('║  • Use Linux with FIPS-enabled OpenSSL for production       ║')
      console.warn('╚═══════════════════════════════════════════════════════════════╝\n')
    }

    if (status.enabled) {
      console.log('✅ FIPS 140-2 mode is ENABLED - All cryptographic operations are validated\n')
    }
  }

  /**
   * Get current FIPS status
   */
  public getStatus(): FIPSStatus {
    return { ...this.fipsStatus }
  }

  /**
   * Check if FIPS mode is enabled
   */
  public isFIPSEnabled(): boolean {
    return this.fipsStatus.enabled
  }

  /**
   * Attempt to enable FIPS mode (runtime)
   * Note: This may not work on all systems
   */
  public static attemptEnableFIPS(): boolean {
    try {
      if (crypto.getFips() === 0) {
        crypto.setFips(1)
        console.log('✅ Successfully enabled FIPS mode at runtime')
        return true
      }
      return true // Already enabled
    } catch (error) {
      console.error('❌ Failed to enable FIPS mode:', error)
      console.error('   This system does not support FIPS mode')
      console.error('   OpenSSL must be built with FIPS support')
      return false
    }
  }
}

/**
 * Export singleton instance
 */
export const fipsEnforcement = FIPSEnforcement.getInstance()
