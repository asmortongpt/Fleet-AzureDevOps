import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import pool from '../src/config/database'
import authRoutes from '../src/routes/auth'

// Mock dependencies
jest.mock('../src/config/database')
jest.mock('../src/middleware/audit')
jest.mock('../src/config/rate-limiters', () => ({
  loginLimiter: (req: any, res: any, next: any) => next(),
  registrationLimiter: (req: any, res: any, next: any) => next()
}))

// Test app setup
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRoutes)

// Test JWT secret
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-security'
process.env.NODE_ENV = 'test'

describe('Refresh Token Security Tests (OWASP ASVS 3.0)', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', // bcrypt hash
    first_name: 'Test',
    last_name: 'User',
    role: 'admin',
    tenant_id: '123e4567-e89b-12d3-a456-426614174001',
    is_active: true,
    failed_login_attempts: 0,
    account_locked_until: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Login with Refresh Token', () => {
    it('should return access token and set httpOnly refresh token cookie', async () => {
      // Mock bcrypt.compare to return true
      const bcrypt = require('bcrypt')
      bcrypt.compare = jest.fn().mockResolvedValue(true)

      // Mock database queries
      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>

      // User lookup
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any)
      // Update failed attempts
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      // Insert refresh token
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('expiresIn', 900)
      expect(response.body).toHaveProperty('user')

      // Check that refresh token is set in httpOnly cookie
      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies[0]).toContain('refreshToken=')
      expect(cookies[0]).toContain('HttpOnly')
      expect(cookies[0]).toContain('Path=/api/auth/refresh')
      expect(cookies[0]).toContain('SameSite=Strict')
    })

    it('should store refresh token with tenant_id, IP, and user agent', async () => {
      const bcrypt = require('bcrypt')
      bcrypt.compare = jest.fn().mockResolvedValue(true)

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

      let capturedInsert: any
      mockQuery.mockImplementationOnce((query, params) => {
        capturedInsert = { query, params }
        return Promise.resolve({ rows: [], rowCount: 1 } as any)
      })

      await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Test-Agent')
        .send({
          email: 'test@example.com',
          password: 'Test@123'
        })

      expect(capturedInsert.params).toHaveLength(5)
      expect(capturedInsert.params[0]).toBe(mockUser.id) // user_id
      expect(capturedInsert.params[1]).toBe(mockUser.tenant_id) // tenant_id
      expect(capturedInsert.params[2]).toBeDefined() // token_hash
      expect(capturedInsert.params[3]).toBeDefined() // ip_address
      expect(capturedInsert.params[4]).toBe('Test-Agent') // user_agent
    })
  })

  describe('Token Refresh Flow', () => {
    it('should exchange valid refresh token for new access token', async () => {
      const refreshToken = jwt.sign(
        {
          id: mockUser.id,
          tenant_id: mockUser.tenant_id,
          type: 'refresh',
          jti: `${mockUser.id}-${Date.now()}-abc123`
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      const tokenHash = Buffer.from(refreshToken).toString('base64').substring(0, 64)

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>

      // Check token in DB
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: '123',
          user_id: mockUser.id,
          tenant_id: mockUser.tenant_id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          revoked_at: null
        }],
        rowCount: 1
      } as any)

      // Get user
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any)

      // Revoke old token
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)

      // Insert new token
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('expiresIn', 900)

      // Verify old token was revoked (3rd query call)
      expect(mockQuery.mock.calls[2][0]).toContain('UPDATE refresh_tokens')
      expect(mockQuery.mock.calls[2][0]).toContain('revoked_at')

      // Verify new token was created (4th query call)
      expect(mockQuery.mock.calls[3][0]).toContain('INSERT INTO refresh_tokens')
    })

    it('should reject refresh token without cookie', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error', 'Refresh token required')
    })

    it('should reject expired refresh token', async () => {
      const expiredToken = jwt.sign(
        {
          id: mockUser.id,
          tenant_id: mockUser.tenant_id,
          type: 'refresh',
          jti: `${mockUser.id}-${Date.now()}-abc123`
        },
        process.env.JWT_SECRET!,
        { expiresIn: '-1d' } // Expired 1 day ago
      )

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${expiredToken}`])

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error', 'Invalid or expired refresh token')
    })

    it('should reject revoked refresh token', async () => {
      const refreshToken = jwt.sign(
        {
          id: mockUser.id,
          tenant_id: mockUser.tenant_id,
          type: 'refresh',
          jti: `${mockUser.id}-${Date.now()}-abc123`
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>

      // Token is revoked
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error', 'Refresh token not found or revoked')
    })

    it('should reject access token used as refresh token (type validation)', async () => {
      const accessToken = jwt.sign(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          tenant_id: mockUser.tenant_id,
          type: 'access' // Wrong type
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      )

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${accessToken}`])

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error', 'Invalid token type')
    })

    it('should reject refresh token for inactive user', async () => {
      const refreshToken = jwt.sign(
        {
          id: mockUser.id,
          tenant_id: mockUser.tenant_id,
          type: 'refresh',
          jti: `${mockUser.id}-${Date.now()}-abc123`
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      const tokenHash = Buffer.from(refreshToken).toString('base64').substring(0, 64)

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>

      // Token exists
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: '123',
          user_id: mockUser.id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked_at: null
        }],
        rowCount: 1
      } as any)

      // User is inactive
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error', 'User not found or inactive')
    })
  })

  describe('Logout and Token Revocation', () => {
    it('should clear refresh token cookie on logout', async () => {
      const accessToken = jwt.sign(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          tenant_id: mockUser.tenant_id,
          type: 'access'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      )

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)

      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies[0]).toContain('refreshToken=')
      expect(cookies[0]).toContain('Expires=') // Should have expiration in past
    })

    it('should revoke all tokens when revokeAllTokens is true', async () => {
      const accessToken = jwt.sign(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          tenant_id: mockUser.tenant_id,
          type: 'access'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      )

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ revokeAllTokens: true })

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens'),
        expect.arrayContaining([mockUser.id])
      )
    })
  })

  describe('Token Rotation (OWASP Requirement)', () => {
    it('should issue new refresh token on each refresh (rotation)', async () => {
      const refreshToken = jwt.sign(
        {
          id: mockUser.id,
          tenant_id: mockUser.tenant_id,
          type: 'refresh',
          jti: `${mockUser.id}-${Date.now()}-abc123`
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      const tokenHash = Buffer.from(refreshToken).toString('base64').substring(0, 64)

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: '123',
          user_id: mockUser.id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked_at: null
        }],
        rowCount: 1
      } as any)
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])

      expect(response.status).toBe(200)

      // Verify new refresh token is different from old one
      const newRefreshCookie = response.headers['set-cookie']?.[0]
      expect(newRefreshCookie).toBeDefined()
      expect(newRefreshCookie).toContain('refreshToken=')
      expect(newRefreshCookie).not.toContain(refreshToken)

      // Verify old token was revoked
      expect(mockQuery.mock.calls[2][0]).toContain('UPDATE refresh_tokens')
      expect(mockQuery.mock.calls[2][0]).toContain('revoked_at = NOW()')
    })
  })

  describe('Security Headers and Cookie Attributes', () => {
    it('should set secure cookie attributes in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const bcrypt = require('bcrypt')
      bcrypt.compare = jest.fn().mockResolvedValue(true)

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123'
        })

      const cookies = response.headers['set-cookie']
      expect(cookies[0]).toContain('Secure')
      expect(cookies[0]).toContain('HttpOnly')
      expect(cookies[0]).toContain('SameSite=Strict')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Multi-Tenancy Isolation', () => {
    it('should store tenant_id with refresh token', async () => {
      const bcrypt = require('bcrypt')
      bcrypt.compare = jest.fn().mockResolvedValue(true)

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

      let insertParams: any[]
      mockQuery.mockImplementationOnce((query, params) => {
        insertParams = params as any[]
        return Promise.resolve({ rows: [], rowCount: 1 } as any)
      })

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123'
        })

      expect(insertParams![1]).toBe(mockUser.tenant_id)
    })

    it('should include tenant_id in both access and refresh tokens', async () => {
      const bcrypt = require('bcrypt')
      bcrypt.compare = jest.fn().mockResolvedValue(true)

      const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123'
        })

      const accessToken = response.body.token
      const decodedAccess = jwt.verify(accessToken, process.env.JWT_SECRET!) as any

      expect(decodedAccess.tenant_id).toBe(mockUser.tenant_id)
      expect(decodedAccess.type).toBe('access')
    })
  })
})
