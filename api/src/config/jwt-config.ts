import logger from './logger';

/**
 * JWT Configuration
 *
 * Centralized JWT configuration for both:
 * - Local Fleet tokens (RS256 using local RSA keys)
 * - Azure AD tokens (RS256 using Azure AD public keys via JWKS)
 *
 * SECURITY:
 * - All tokens use RS256 algorithm (FIPS-compliant)
 * - Audience and issuer validation enforced
 * - Clock tolerance for time-based claims
 */

export interface JWTConfig {
  // Token types
  tokenTypes: {
    access: string
    refresh: string
  }

  // Local Fleet JWT configuration
  local: {
    issuer: string
    audience: string
    accessTokenExpiry: string
    refreshTokenExpiry: string
    algorithm: string
  }

  // Azure AD JWT configuration
  azureAD: {
    tenantId: string
    clientId: string
    issuerUrls: string[]
    audience: string[]
    allowedAlgorithms: string[]
  }

  // Verification options
  verify: {
    clockTolerance: number // seconds
    ignoreExpiration: boolean
    ignoreNotBefore: boolean
  }
}

/**
 * Get JWT configuration from environment variables
 */
export function getJWTConfig(): JWTConfig {
  const azureTenantId =
    process.env.AZURE_AD_TENANT_ID ||
    process.env.VITE_AZURE_AD_TENANT_ID ||
    '0ec14b81-7b82-45ee-8f3d-cbc31ced5347'

  const azureClientId =
    process.env.AZURE_AD_CLIENT_ID ||
    process.env.VITE_AZURE_AD_CLIENT_ID ||
    'baae0851-0c24-4214-8587-e3fabc46bd4a'

  return {
    tokenTypes: {
      access: 'access',
      refresh: 'refresh'
    },

    local: {
      issuer: process.env.JWT_ISSUER || 'fleet-management-api',
      audience: process.env.JWT_AUDIENCE || 'fleet-management-app',
      accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
      refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
      algorithm: 'RS256'
    },

    azureAD: {
      tenantId: azureTenantId,
      clientId: azureClientId,
      issuerUrls: [
        `https://login.microsoftonline.com/${azureTenantId}/v2.0`,
        `https://sts.windows.net/${azureTenantId}/`,
        `https://login.microsoftonline.com/${azureTenantId}/`
      ],
      audience: [
        azureClientId,
        `api://${azureClientId}`,
        'https://graph.microsoft.com'
      ],
      allowedAlgorithms: ['RS256']
    },

    verify: {
      clockTolerance: 60, // 60 seconds clock skew tolerance
      ignoreExpiration: false,
      ignoreNotBefore: false
    }
  }
}

/**
 * Validate JWT configuration at startup
 */
export function validateJWTConfig(config: JWTConfig): void {
  const errors: string[] = []

  // Validate local configuration
  if (!config.local.issuer) {
    errors.push('Local JWT issuer is not configured')
  }

  if (!config.local.audience) {
    errors.push('Local JWT audience is not configured')
  }

  // Validate Azure AD configuration
  if (!config.azureAD.tenantId) {
    errors.push('Azure AD tenant ID is not configured')
  }

  if (!config.azureAD.clientId) {
    errors.push('Azure AD client ID is not configured')
  }

  if (config.azureAD.issuerUrls.length === 0) {
    errors.push('Azure AD issuer URLs are not configured')
  }

  if (config.azureAD.audience.length === 0) {
    errors.push('Azure AD audience is not configured')
  }

  // Validate algorithm
  if (!config.azureAD.allowedAlgorithms.includes('RS256')) {
    errors.push('RS256 algorithm must be allowed for FIPS compliance')
  }

  if (errors.length > 0) {
    logger.warn('JWT Configuration Warnings', { warnings: errors })
  } else {
    logger.info('JWT Configuration validated successfully')
  }
}

/**
 * Export singleton configuration
 */
export const jwtConfig = getJWTConfig()

// Validate configuration at module load
validateJWTConfig(jwtConfig)

export default jwtConfig
