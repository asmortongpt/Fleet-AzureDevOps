/**
 * JWT Validation Test Suite
 *
 * Tests for:
 * - Local Fleet token validation (RS256)
 * - Azure AD token validation (RS256 with JWKS)
 * - Error handling for invalid tokens
 * - /api/auth/verify endpoint
 * - /api/auth/userinfo endpoint
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'

import { FIPSJWTService } from '../../services/fips-jwt.service'

// Note: These tests require a running server
// Run with: npm run test:integration

describe('JWT Token Validation', () => {
  let localToken: string
  let invalidToken: string
  let expiredToken: string

  beforeAll(() => {
    // Generate test tokens
    localToken = FIPSJWTService.generateAccessToken(
      'test-user-id',
      'test@example.com',
      'admin',
      'test-tenant-id'
    )

    // Generate an invalid token (malformed)
    invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'

    // Generate an expired token (expired 1 hour ago)
    const expiredPayload = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'admin',
      tenant_id: 'test-tenant-id',
      type: 'access',
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
    }
    expiredToken = FIPSJWTService.sign(expiredPayload)
  })

  describe('Local Fleet Token Validation', () => {
    it('should validate a valid local Fleet token', async () => {
      const decoded = FIPSJWTService.verifyAccessToken(localToken)

      expect(decoded).toBeDefined()
      expect(decoded.id).toBe('test-user-id')
      expect(decoded.email).toBe('test@example.com')
      expect(decoded.role).toBe('admin')
      expect(decoded.tenant_id).toBe('test-tenant-id')
      expect(decoded.type).toBe('access')
    })

    it('should reject an expired token', async () => {
      expect(() => {
        FIPSJWTService.verifyAccessToken(expiredToken)
      }).toThrow('jwt expired')
    })

    it('should reject an invalid token', async () => {
      expect(() => {
        FIPSJWTService.verifyAccessToken(invalidToken)
      }).toThrow()
    })

    it('should reject a token with wrong type', async () => {
      const refreshToken = FIPSJWTService.generateRefreshToken(
        'test-user-id',
        'test-tenant-id'
      )

      expect(() => {
        FIPSJWTService.verifyAccessToken(refreshToken)
      }).toThrow('Invalid token type')
    })
  })

  describe('Token Decoding', () => {
    it('should decode a token without verification', () => {
      const decoded = FIPSJWTService.decode(localToken)

      expect(decoded).toBeDefined()
      expect(decoded.id).toBe('test-user-id')
      expect(decoded.email).toBe('test@example.com')
      expect(decoded.type).toBe('access')
    })

    it('should detect token type correctly', () => {
      const decoded = FIPSJWTService.decode(localToken)
      const isLocalToken = !!(decoded && decoded.type === 'access')
      const isAzureADToken = !!(decoded && decoded.tid && !decoded.type)

      expect(isLocalToken).toBe(true)
      expect(isAzureADToken).toBe(false)
    })
  })

  describe('JWT Configuration', () => {
    it('should load JWT configuration', async () => {
      const { default: jwtConfig } = await import('../../config/jwt-config')

      expect(jwtConfig).toBeDefined()
      expect(jwtConfig.local.issuer).toBe('fleet-management-api')
      expect(jwtConfig.local.audience).toBe('fleet-management-app')
      expect(jwtConfig.local.algorithm).toBe('RS256')
      expect(jwtConfig.azureAD.tenantId).toBeDefined()
      expect(jwtConfig.azureAD.clientId).toBeDefined()
    })
  })
})

describe('Azure AD Token Validator', () => {
  it('should create JWKS client for tenant', async () => {
    const { default: AzureADTokenValidator } = await import(
      '../../services/azure-ad-token-validator'
    )

    // This will create the JWKS client but won't make any requests
    expect(AzureADTokenValidator).toBeDefined()
    expect(AzureADTokenValidator.validateToken).toBeDefined()
    expect(AzureADTokenValidator.extractUserInfo).toBeDefined()
  })

  it('should detect expired token', async () => {
    const expiredPayload = {
      exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
    }

    const { default: AzureADTokenValidator } = await import(
      '../../services/azure-ad-token-validator'
    )
    const isExpired = AzureADTokenValidator.isTokenExpired(expiredPayload)

    expect(isExpired).toBe(true)
  })

  it('should detect active token', async () => {
    const validPayload = {
      exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
    }

    const { default: AzureADTokenValidator } = await import(
      '../../services/azure-ad-token-validator'
    )
    const isExpired = AzureADTokenValidator.isTokenExpired(validPayload)

    expect(isExpired).toBe(false)
  })

  it('should extract user info from Azure AD token payload', async () => {
    const azurePayload = {
      oid: 'azure-user-id',
      email: 'user@example.com',
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      roles: ['Admin', 'User'],
      tid: 'azure-tenant-id'
    }

    const { default: AzureADTokenValidator } = await import(
      '../../services/azure-ad-token-validator'
    )
    const userInfo = AzureADTokenValidator.extractUserInfo(azurePayload)

    expect(userInfo).toBeDefined()
    expect(userInfo.id).toBe('azure-user-id')
    expect(userInfo.email).toBe('user@example.com')
    expect(userInfo.name).toBe('Test User')
    expect(userInfo.firstName).toBe('Test')
    expect(userInfo.lastName).toBe('User')
    expect(userInfo.roles).toEqual(['Admin', 'User'])
    expect(userInfo.tenantId).toBe('azure-tenant-id')
  })
})

// Note: The following tests require a running server
// Uncomment when running integration tests
/*
describe('Auth Endpoints - /api/auth/verify', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000'

  it('should verify a valid local token', async () => {
    const token = FIPSJWTService.generateAccessToken(
      'test-user-id',
      'test@example.com',
      'admin',
      'test-tenant-id'
    )

    const response = await request(API_URL)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.authenticated).toBe(true)
    expect(response.body.tokenType).toBe('local')
    expect(response.body.user.id).toBe('test-user-id')
  })

  it('should reject missing token', async () => {
    const response = await request(API_URL).get('/api/auth/verify')

    expect(response.status).toBe(401)
    expect(response.body.authenticated).toBe(false)
    expect(response.body.errorCode).toBe('NO_TOKEN')
  })

  it('should reject invalid token', async () => {
    const response = await request(API_URL)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(401)
    expect(response.body.authenticated).toBe(false)
  })
})

describe('Auth Endpoints - /api/auth/userinfo', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000'

  it('should extract user info from valid token', async () => {
    const token = FIPSJWTService.generateAccessToken(
      'test-user-id',
      'test@example.com',
      'admin',
      'test-tenant-id'
    )

    const response = await request(API_URL)
      .get('/api/auth/userinfo')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.user).toBeDefined()
    expect(response.body.user.id).toBe('test-user-id')
    expect(response.body.user.email).toBe('test@example.com')
    expect(response.body.tokenInfo).toBeDefined()
    expect(response.body.tokenInfo.type).toBe('local')
  })

  it('should reject missing token', async () => {
    const response = await request(API_URL).get('/api/auth/userinfo')

    expect(response.status).toBe(401)
    expect(response.body.errorCode).toBe('NO_TOKEN')
  })
})
*/
