/**
 * Azure AD Token Validator Service
 *
 * Validates JWT tokens issued by Azure AD using JWKS (JSON Web Key Set)
 * - Fetches public keys from Azure AD discovery endpoint
 * - Caches keys for performance
 * - Verifies token signature using RS256
 * - Validates issuer, audience, expiration
 *
 * SECURITY:
 * - Uses jwks-rsa for automatic key rotation support
 * - Validates all critical JWT claims
 * - Provides detailed error messages for debugging
 */

import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

import logger from '../config/logger'

export interface AzureADTokenPayload {
  oid?: string // Object ID (user ID in Azure AD)
  sub?: string // Subject (alternative user identifier)
  email?: string
  preferred_username?: string
  name?: string
  given_name?: string
  family_name?: string
  roles?: string[]
  groups?: string[]
  iss?: string // Issuer
  aud?: string // Audience
  exp?: number // Expiration
  nbf?: number // Not before
  iat?: number // Issued at
  tid?: string // Tenant ID
  upn?: string // User Principal Name
  unique_name?: string
  [key: string]: any
}

export interface TokenValidationResult {
  valid: boolean
  payload?: AzureADTokenPayload
  error?: string
  errorCode?: string
}

export class AzureADTokenValidator {
  private static jwksClients: Map<string, jwksClient.JwksClient> = new Map()

  /**
   * Get or create a JWKS client for a specific tenant
   */
  private static getJwksClient(tenantId: string): jwksClient.JwksClient {
    const cacheKey = tenantId

    if (!this.jwksClients.has(cacheKey)) {
      const jwksUri = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`

      const client = jwksClient({
        jwksUri,
        cache: true,
        cacheMaxAge: 86400000, // 24 hours in milliseconds
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        timeout: 30000 // 30 seconds
      })

      this.jwksClients.set(cacheKey, client)
      logger.info(`[AzureADTokenValidator] Created JWKS client for tenant: ${tenantId}`)
    }

    return this.jwksClients.get(cacheKey)!
  }

  /**
   * Get signing key from JWKS endpoint
   */
  private static async getSigningKey(
    tenantId: string,
    kid: string
  ): Promise<string> {
    try {
      const client = this.getJwksClient(tenantId)
      const key = await client.getSigningKey(kid)
      return key.getPublicKey()
    } catch (error: any) {
      logger.error('[AzureADTokenValidator] Failed to get signing key:', {
        tenantId,
        kid,
        error: error.message
      })
      throw new Error(`Failed to get signing key: ${error.message}`)
    }
  }

  /**
   * Decode token header to extract kid (key ID) and algorithm
   */
  private static decodeTokenHeader(token: string): { kid?: string; alg?: string } {
    try {
      const decoded = jwt.decode(token, { complete: true })
      if (!decoded || typeof decoded === 'string') {
        throw new Error('Invalid token format')
      }
      return decoded.header
    } catch (error: any) {
      logger.error('[AzureADTokenValidator] Failed to decode token header:', {
        error: error.message
      })
      throw new Error(`Failed to decode token header: ${error.message}`)
    }
  }

  /**
   * Validate Azure AD JWT token
   *
   * @param token - JWT token from Azure AD
   * @param options - Validation options (tenant ID, audience, issuer)
   * @returns TokenValidationResult
   */
  static async validateToken(
    token: string,
    options: {
      tenantId?: string
      audience?: string
      issuer?: string
      allowedAlgorithms?: string[]
    } = {}
  ): Promise<TokenValidationResult> {
    const startTime = Date.now()

    try {
      // Step 1: Decode token header to get key ID
      const header = this.decodeTokenHeader(token)
      const { kid, alg } = header

      if (!kid) {
        logger.warn('[AzureADTokenValidator] Token missing kid (key ID) in header')
        return {
          valid: false,
          error: 'Token missing kid (key ID) in header',
          errorCode: 'MISSING_KID'
        }
      }

      if (!alg || alg !== 'RS256') {
        logger.warn('[AzureADTokenValidator] Invalid or missing algorithm:', { alg })
        return {
          valid: false,
          error: `Invalid algorithm: ${alg}. Only RS256 is supported.`,
          errorCode: 'INVALID_ALGORITHM'
        }
      }

      // Step 2: Decode token payload to extract tenant ID (if not provided)
      const decoded = jwt.decode(token) as AzureADTokenPayload | null
      if (!decoded) {
        return {
          valid: false,
          error: 'Failed to decode token payload',
          errorCode: 'INVALID_TOKEN'
        }
      }

      const tenantId = options.tenantId || decoded.tid
      if (!tenantId) {
        logger.warn('[AzureADTokenValidator] Token missing tenant ID (tid)')
        return {
          valid: false,
          error: 'Token missing tenant ID (tid)',
          errorCode: 'MISSING_TENANT_ID'
        }
      }

      // Step 3: Fetch signing key from Azure AD JWKS endpoint
      const signingKey = await this.getSigningKey(tenantId, kid)

      // Step 4: Verify token signature and claims
      const allowedAlgorithms = options.allowedAlgorithms || ['RS256']
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: allowedAlgorithms as jwt.Algorithm[],
        clockTolerance: 60 // Allow 60 seconds clock skew
      }

      // Add issuer validation if provided
      if (options.issuer) {
        verifyOptions.issuer = options.issuer
      } else {
        // Default Azure AD issuer format
        verifyOptions.issuer = [
          `https://login.microsoftonline.com/${tenantId}/v2.0`,
          `https://sts.windows.net/${tenantId}/`
        ]
      }

      // Add audience validation if provided
      if (options.audience) {
        verifyOptions.audience = options.audience
      }

      const payload = jwt.verify(token, signingKey, verifyOptions) as AzureADTokenPayload

      const duration = Date.now() - startTime
      logger.info('[AzureADTokenValidator] Token validated successfully', {
        tenantId,
        userId: payload.oid || payload.sub,
        email: payload.email || payload.preferred_username,
        duration: `${duration}ms`
      })

      return {
        valid: true,
        payload
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      logger.error('[AzureADTokenValidator] Token validation failed:', {
        error: error.message,
        name: error.name,
        duration: `${duration}ms`
      })

      let errorCode = 'VALIDATION_FAILED'
      let errorMessage = error.message

      // Map JWT errors to specific error codes
      if (error.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED'
        errorMessage = 'Token has expired'
      } else if (error.name === 'JsonWebTokenError') {
        errorCode = 'INVALID_TOKEN'
        errorMessage = error.message
      } else if (error.name === 'NotBeforeError') {
        errorCode = 'TOKEN_NOT_ACTIVE'
        errorMessage = 'Token not yet valid'
      }

      return {
        valid: false,
        error: errorMessage,
        errorCode
      }
    }
  }

  /**
   * Extract user information from Azure AD token
   *
   * @param token - JWT token from Azure AD
   * @returns User information object
   */
  static extractUserInfo(payload: AzureADTokenPayload): {
    id: string
    email: string
    name?: string
    firstName?: string
    lastName?: string
    roles?: string[]
    tenantId?: string
  } {
    const email =
      payload.email ||
      payload.preferred_username ||
      payload.upn ||
      payload.unique_name ||
      ''

    const userId = payload.oid || payload.sub || ''

    return {
      id: userId,
      email,
      name: payload.name,
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles: payload.roles || [],
      tenantId: payload.tid
    }
  }

  /**
   * Validate token expiration
   *
   * @param payload - Decoded token payload
   * @returns boolean - True if token is not expired
   */
  static isTokenExpired(payload: AzureADTokenPayload): boolean {
    if (!payload.exp) {
      return true // Consider expired if no expiration
    }

    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
  }

  /**
   * Validate token not before (nbf) claim
   *
   * @param payload - Decoded token payload
   * @returns boolean - True if token is active
   */
  static isTokenActive(payload: AzureADTokenPayload): boolean {
    if (!payload.nbf) {
      return true // No nbf claim means token is immediately active
    }

    const now = Math.floor(Date.now() / 1000)
    return payload.nbf <= now
  }

  /**
   * Clear cached JWKS clients (useful for testing or forced key refresh)
   */
  static clearCache(): void {
    this.jwksClients.clear()
    logger.info('[AzureADTokenValidator] JWKS client cache cleared')
  }
}

export default AzureADTokenValidator
