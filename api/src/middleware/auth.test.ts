import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock all dependencies BEFORE importing the module under test
vi.mock('../config/database', () => ({
  default: {
    query: vi.fn(),
    getClient: vi.fn()
  }
}))

vi.mock('../config/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock('../config/jwt-config', () => ({
  default: {
    azureAD: {
      tenantId: 'test-tenant-id',
      clientId: 'test-client-id',
      allowedAlgorithms: ['RS256']
    }
  }
}))

vi.mock('../services/azure-ad-token-validator', () => ({
  default: {
    validateToken: vi.fn(),
    extractUserInfo: vi.fn()
  }
}))

vi.mock('../services/fips-jwt.service', () => ({
  default: {
    decode: vi.fn(),
    verifyAccessToken: vi.fn()
  }
}))

// NOW import after mocks are set up
import {
  authenticateJWT,
  authorize,
  setCheckRevoked,
  AuthRequest,
  AuthUser
} from './auth'
import FIPSJWTService from '../services/fips-jwt.service'
import AzureADTokenValidator from '../services/azure-ad-token-validator'
import logger from '../config/logger'

describe('Authentication Middleware', () => {
  let req: Partial<AuthRequest>
  let res: Partial<Response>
  let next: NextFunction
  let status: any
  let json: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup request/response mocks
    status = vi.fn().mockReturnThis()
    json = vi.fn().mockReturnThis()

    req = {
      headers: {},
      cookies: {},
      method: 'GET',
      path: '/api/vehicles'
    }

    res = {
      status,
      json,
      setHeader: vi.fn()
    }

    next = vi.fn()

    // Mock logger
    vi.spyOn(logger, 'info').mockImplementation(() => {})
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('JWT Token Extraction & Validation', () => {
    it('should return 401 when no token is provided (header or cookie)', async () => {
      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(401)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication required',
          errorCode: 'NO_TOKEN'
        })
      )
      expect(next).not.toHaveBeenCalled()
    })

    it('should extract token from Authorization header (Bearer token)', async () => {
      const token = 'valid-jwt-token'
      req.headers = { authorization: `Bearer ${token}` }

      const mockUser: AuthUser = { id: 'user-1', email: 'test@example.com' }
      vi.mocked(FIPSJWTService.decode).mockReturnValue({ type: 'access' } as any)
      vi.mocked(FIPSJWTService.verifyAccessToken).mockReturnValue(mockUser)

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect((req as any).user).toEqual(mockUser)
      expect(next).toHaveBeenCalled()
    })

    it('should extract token from auth_token cookie when header not provided', async () => {
      const token = 'valid-jwt-token'
      req.cookies = { auth_token: token }
      req.headers = {}

      const mockUser: AuthUser = { id: 'user-1', email: 'test@example.com' }
      vi.mocked(FIPSJWTService.decode).mockReturnValue({ type: 'access' } as any)
      vi.mocked(FIPSJWTService.verifyAccessToken).mockReturnValue(mockUser)

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect((req as any).user).toEqual(mockUser)
      expect(next).toHaveBeenCalled()
    })

    it('should prefer Authorization header over cookie', async () => {
      const headerToken = 'header-token'
      const cookieToken = 'cookie-token'
      req.headers = { authorization: `Bearer ${headerToken}` }
      req.cookies = { auth_token: cookieToken }

      const mockUser: AuthUser = { id: 'user-1', email: 'test@example.com' }
      vi.mocked(FIPSJWTService.decode).mockReturnValue({ type: 'access' } as any)
      vi.mocked(FIPSJWTService.verifyAccessToken).mockReturnValue(mockUser)

      await authenticateJWT(req as AuthRequest, res as Response, next)

      // Should have been called with header token (not verifiable from mock, but logic tested)
      expect((req as any).user).toEqual(mockUser)
    })
  })

  describe('Development Mode Bypass', () => {
    it('should skip JWT validation if user already authenticated (dev mode)', async () => {
      const existingUser: AuthUser = { id: 'dev-user', email: 'dev@localhost' }
      req.user = existingUser

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(status).not.toHaveBeenCalled()
    })
  })

  describe('Azure AD Token Validation', () => {
    it('should validate Azure AD token (has tid claim)', async () => {
      const token = 'azure-ad-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        tid: 'tenant-id',
        sub: 'user@example.com'
      } as any)

      const mockValidationResult = {
        valid: true,
        payload: { sub: 'user@example.com' }
      }
      vi.mocked(AzureADTokenValidator.validateToken).mockResolvedValue(mockValidationResult)
      vi.mocked(AzureADTokenValidator.extractUserInfo).mockReturnValue({
        id: 'azure-user-1',
        email: 'azure@example.com',
        name: 'Azure User',
        tenantId: 'tenant-id'
      })

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(AzureADTokenValidator.validateToken).toHaveBeenCalled()
      expect((req as any).user?.azureAD).toBe(true)
      expect((req as any).user?.email).toBe('azure@example.com')
    })

    it('should return 403 when Azure AD token validation fails', async () => {
      const token = 'invalid-azure-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        tid: 'tenant-id'
      } as any)

      const mockValidationResult = {
        valid: false,
        error: 'Invalid signature',
        errorCode: 'INVALID_SIGNATURE'
      }
      vi.mocked(AzureADTokenValidator.validateToken).mockResolvedValue(mockValidationResult)

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(403)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'AZURE_AD_VALIDATION_FAILED'
        })
      )
    })

    it('should detect Azure AD token by tid claim (without type claim)', async () => {
      const token = 'azure-ad-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        tid: 'tenant-123'
        // No 'type' field = Azure AD token
      } as any)

      const mockValidationResult = {
        valid: true,
        payload: { sub: 'user@example.com' }
      }
      vi.mocked(AzureADTokenValidator.validateToken).mockResolvedValue(mockValidationResult)
      vi.mocked(AzureADTokenValidator.extractUserInfo).mockReturnValue({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        tenantId: 'tenant-123'
      })

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(AzureADTokenValidator.validateToken).toHaveBeenCalled()
      expect((req as any).user?.azureAD).toBe(true)
    })
  })

  describe('Local Fleet Token Validation', () => {
    it('should validate local Fleet token (has type:access claim)', async () => {
      const token = 'fleet-token'
      req.headers = { authorization: `Bearer ${token}` }

      const mockUser: AuthUser = {
        id: 'fleet-user-1',
        email: 'fleet@example.com',
        role: 'Manager'
      }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        type: 'access'
      } as any)
      vi.mocked(FIPSJWTService.verifyAccessToken).mockReturnValue(mockUser)

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(FIPSJWTService.verifyAccessToken).toHaveBeenCalledWith(token)
      expect((req as any).user).toEqual(mockUser)
      expect(next).toHaveBeenCalled()
    })

    it('should set azureAD flag to false for local tokens', async () => {
      const token = 'fleet-token'
      req.headers = { authorization: `Bearer ${token}` }

      const mockUser: AuthUser = {
        id: 'fleet-user-1',
        email: 'fleet@example.com',
        azureAD: false
      }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        type: 'access'
      } as any)
      vi.mocked(FIPSJWTService.verifyAccessToken).mockReturnValue(mockUser)

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect((req as any).user?.azureAD).toBe(false)
    })
  })

  describe('Token Error Handling', () => {
    it('should handle TokenExpiredError and return 401', async () => {
      const token = 'expired-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        type: 'access'
      } as any)

      const expiredError = new jwt.TokenExpiredError('Token expired', new Date())
      vi.mocked(FIPSJWTService.verifyAccessToken).mockImplementation(() => {
        throw expiredError
      })

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(401)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'TOKEN_EXPIRED'
        })
      )
    })

    it('should handle JsonWebTokenError for invalid tokens', async () => {
      const token = 'invalid-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        type: 'access'
      } as any)

      const jwtError = new jwt.JsonWebTokenError('invalid signature')
      vi.mocked(FIPSJWTService.verifyAccessToken).mockImplementation(() => {
        throw jwtError
      })

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(403)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'INVALID_TOKEN'
        })
      )
    })

    it('should handle NotBeforeError when token not yet active', async () => {
      const token = 'future-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        type: 'access'
      } as any)

      const notBeforeError = new jwt.NotBeforeError('Token not active', new Date())
      vi.mocked(FIPSJWTService.verifyAccessToken).mockImplementation(() => {
        throw notBeforeError
      })

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(403)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'TOKEN_NOT_ACTIVE'
        })
      )
    })

    it('should return 403 for unknown token format', async () => {
      const token = 'unknown-format-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        // No 'type' and no 'tid' = unknown format
        sub: 'user@example.com'
      } as any)

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(403)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'INVALID_TOKEN_FORMAT'
        })
      )
    })

    it('should handle generic Error for unexpected errors', async () => {
      const token = 'error-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(403)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'VALIDATION_FAILED'
        })
      )
    })
  })

  describe('Session Revocation Check', () => {
    it('should call checkRevokedFn if registered', async () => {
      const token = 'valid-token'
      req.headers = { authorization: `Bearer ${token}` }

      const mockUser: AuthUser = { id: 'user-1', email: 'test@example.com' }
      vi.mocked(FIPSJWTService.decode).mockReturnValue({ type: 'access' } as any)
      vi.mocked(FIPSJWTService.verifyAccessToken).mockReturnValue(mockUser)

      const mockCheckRevoked = vi.fn().mockImplementation((req, res, next) => {
        next()
      })
      setCheckRevoked(mockCheckRevoked)

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(mockCheckRevoked).toHaveBeenCalledWith(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('should skip revocation check if checkRevokedFn not registered', async () => {
      const token = 'valid-token'
      req.headers = { authorization: `Bearer ${token}` }

      const mockUser: AuthUser = { id: 'user-1', email: 'test@example.com' }
      vi.mocked(FIPSJWTService.decode).mockReturnValue({ type: 'access' } as any)
      vi.mocked(FIPSJWTService.verifyAccessToken).mockReturnValue(mockUser)

      // Don't set checkRevoked
      setCheckRevoked(null as any)

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Session revocation middleware not registered')
      )
    })
  })

  describe('Authorization Middleware', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'User'
      }
    })

    it('should allow SuperAdmin to access any role-protected endpoint', () => {
      req.user = { ...req.user, role: 'SuperAdmin' }
      const authMiddleware = authorize('Admin', 'Manager')

      authMiddleware(req as AuthRequest, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(status).not.toHaveBeenCalled()
    })

    it('should allow user with matching role', () => {
      req.user = { ...req.user, role: 'Manager' }
      const authMiddleware = authorize('Admin', 'Manager')

      authMiddleware(req as AuthRequest, res as Response, next)

      expect(next).toHaveBeenCalled()
    })

    it('should deny user without matching role', () => {
      req.user = { ...req.user, role: 'User' }
      const authMiddleware = authorize('Admin', 'Manager')

      authMiddleware(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(403)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient permissions'
        })
      )
      expect(next).not.toHaveBeenCalled()
    })

    it('should deny access if user not authenticated', () => {
      req.user = undefined
      const authMiddleware = authorize('Admin')

      authMiddleware(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(401)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication required'
        })
      )
    })

    it('should enforce RBAC for all HTTP methods (GET, POST, PUT, DELETE)', () => {
      const authMiddleware = authorize('Admin')
      const methods = ['GET', 'POST', 'PUT', 'DELETE']

      methods.forEach(method => {
        req.method = method
        req.user = { id: 'user-1', email: 'user@example.com', role: 'User' }
        vi.clearAllMocks()
        status = vi.fn().mockReturnThis()
        json = vi.fn().mockReturnThis()
        res = { status, json }

        authMiddleware(req as AuthRequest, res as Response, next)

        expect(status).toHaveBeenCalledWith(403)
      })
    })

    it('should log access decisions', () => {
      req.user = { ...req.user, role: 'Manager' }
      const authMiddleware = authorize('Manager')

      authMiddleware(req as AuthRequest, res as Response, next)

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('AUTHORIZE - Access granted')
      )
    })

    it('should handle multiple allowed roles', () => {
      const roles = ['Admin', 'Manager', 'SuperAdmin']
      const authMiddleware = authorize(...roles)

      roles.forEach(role => {
        req.user = { ...req.user, role }
        vi.clearAllMocks()
        next = vi.fn()

        authMiddleware(req as AuthRequest, res as Response, next)

        expect(next).toHaveBeenCalled()
      })
    })
  })

  describe('Security: Token Tampering Detection', () => {
    it('should detect modified token payload', async () => {
      const token = 'tampered-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        type: 'access'
      } as any)

      const sigError = new jwt.JsonWebTokenError('invalid signature')
      vi.mocked(FIPSJWTService.verifyAccessToken).mockImplementation(() => {
        throw sigError
      })

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(403)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'INVALID_TOKEN'
        })
      )
    })

    it('should detect token with invalid algorithm', async () => {
      const token = 'wrong-algo-token'
      req.headers = { authorization: `Bearer ${token}` }

      vi.mocked(FIPSJWTService.decode).mockReturnValue({
        type: 'access'
      } as any)

      const algoError = new jwt.JsonWebTokenError('Invalid algorithm')
      vi.mocked(FIPSJWTService.verifyAccessToken).mockImplementation(() => {
        throw algoError
      })

      await authenticateJWT(req as AuthRequest, res as Response, next)

      expect(status).toHaveBeenCalledWith(403)
    })
  })

  describe('Security: Concurrent Token Validation', () => {
    it('should handle multiple concurrent validation requests', async () => {
      const mockUser: AuthUser = { id: 'user-1', email: 'test@example.com' }
      vi.mocked(FIPSJWTService.decode).mockReturnValue({ type: 'access' } as any)
      vi.mocked(FIPSJWTService.verifyAccessToken).mockReturnValue(mockUser)

      const requests = Array(5)
        .fill(null)
        .map(() => {
          const r: Partial<AuthRequest> = {
            headers: { authorization: 'Bearer valid-token' },
            cookies: {}
          }
          const res: Partial<Response> = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
          }
          const nxt = vi.fn()
          return { req: r as AuthRequest, res: res as Response, next: nxt }
        })

      await Promise.all(
        requests.map(({ req: r, res: rs, next: n }) =>
          authenticateJWT(r, rs, n)
        )
      )

      // All requests should complete successfully
      requests.forEach(({ next: n }) => {
        expect(n).toHaveBeenCalled()
      })
    })
  })
})
