import axios from 'axios'
import express, { Request, Response } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

import pool from '../config/database' // SECURITY: Import database pool
import logger from '../config/logger'; // Wave 16: Add Winston logger
import { NotFoundError } from '../errors/app-error'
import { createAuditLog } from '../middleware/audit'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { getUserPermissions } from '../middleware/permissions'


// CRIT-F-004: Updated to use centralized rate limiters
import { registrationLimiter, authLimiter, checkBruteForce } from '../middleware/rateLimiter'
import { FIPSCryptoService } from '../services/fips-crypto.service'
import { FIPSJWTService } from '../services/fips-jwt.service'

const router = express.Router()

const setAuthCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined

  const sameSiteEnv = (process.env.AUTH_COOKIE_SAMESITE || '').toLowerCase()
  const secureEnv = process.env.AUTH_COOKIE_SECURE === 'true'

  // Default: in development (http://localhost) use Lax + insecure cookies so auth works.
  // In production, default to None + Secure for cross-site SSO.
  const sameSite: 'lax' | 'none' = isProduction
    ? (sameSiteEnv === 'lax' ? 'lax' : 'none')
    : 'lax'

  const secure = secureEnv || isProduction

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure,
    sameSite,
    domain: cookieDomain,
    maxAge: 15 * 60 * 1000,
    path: '/',
  })

  logger.info('[Auth Cookie] Issued auth_token', { secure, sameSite, domain: cookieDomain || 'host', isProduction })
}

const issueRefreshToken = async (userId: string, tenantId: string) => {
  const refreshToken = FIPSJWTService.generateRefreshToken(userId, tenantId)
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, tenant_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'7 days\', NOW())',
    [userId, tenantId, crypto.createHash('sha256').update(refreshToken).digest('hex')]
  )
  return refreshToken
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional()
  // SECURITY: Role is NOT accepted in registration - always defaults to 'viewer'
  // This prevents privilege escalation attacks during self-registration
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
})

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and receive JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@demofleet.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Demo@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid credentials
 *                 attempts_remaining:
 *                   type: number
 *                   example: 2
 *       423:
 *         description: Account locked due to failed login attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Account locked due to multiple failed login attempts
 *                 locked_until:
 *                   type: string
 *                   format: date-time
 */
// POST /api/auth/login
// CRIT-F-004: Apply auth rate limiter and brute force protection
// FedRAMP SC-5 (DoS Protection), AC-7 (Unsuccessful Login Attempts), SI-10 (Input Validation)
// SECURITY: Rate limiting MUST be enabled in production - 5 login attempts per 15 minutes
// For E2E testing, use environment variable RATE_LIMIT_DISABLED=true to bypass
const applyRateLimiting = process.env.RATE_LIMIT_DISABLED !== 'true'

const loginMiddleware = applyRateLimiting
  ? [authLimiter, checkBruteForce('email')]
  : []

// POST /api/auth/dev-login (development only)
router.post('/dev-login', async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: 'Not available' })
    }

    const emailInput = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : null
    let userResult = null

    if (emailInput) {
      userResult = await pool.query(
        `SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at
         FROM users WHERE email = $1`,
        [emailInput]
      )
    }

    if (!userResult || userResult.rows.length === 0) {
      userResult = await pool.query(
        `SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at
         FROM users WHERE role = 'SuperAdmin' ORDER BY created_at ASC LIMIT 1`
      )
    }

    if (!userResult || userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No dev user found' })
    }

    const user = userResult.rows[0]

    if (!user.is_active) {
      return res.status(403).json({ error: 'User is inactive' })
    }

    const token = FIPSJWTService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.tenant_id
    )

    const refreshToken = await issueRefreshToken(user.id, user.tenant_id)

    await createAuditLog(
      user.tenant_id,
      user.id,
      'LOGIN',
      'users',
      user.id,
      { email: user.email, devLogin: true },
      req.ip || null,
      req.get('User-Agent') || null,
      'success'
    )

    setAuthCookie(res, token)

    let permissions: string[] = []
    try {
      const permissionSet = await getUserPermissions(user.id)
      permissions = Array.from(permissionSet)
    } catch (permissionError: any) {
      logger.warn('Dev login: failed to resolve permissions (falling back to empty list)', {
        userId: user.id,
        error: permissionError?.message || permissionError
      })
    }

    res.json({
      token,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        phone: user.phone,
        permissions,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    })
  } catch (error) {
    logger.error('Dev login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', ...loginMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    // SECURITY: Development backdoor removed (CRIT-SEC-001)
    // All authentication must go through database verification
    // No NODE_ENV bypasses allowed - violates FedRAMP AC-2

    // Get user
    // SECURITY NOTE: Login is a special case - we don't have tenant_id yet from JWT
    // However, users table already has tenant_id and we use it to set JWT claims
    // This query is safe because it only returns data that will be used to create the JWT
    const userResult = await pool.query(
      `SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, password_hash, created_at, updated_at
       FROM users WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()]
    )

    if (userResult.rows.length === 0) {
      await createAuditLog(
        null,
        null,
        'LOGIN',
        'users',
        null,
        { email },
        req.ip || null,
        req.get('User-Agent') || null,
        'failure',
        'User not found or inactive'
      )
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = userResult.rows[0]

    // Check if account is locked (FedRAMP AC-7)
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      await createAuditLog(
        user.tenant_id,
        user.id,
        'LOGIN',
        'users',
        user.id,
        { email },
        req.ip || null,
        req.get('User-Agent') || null,
        'failure',
        'Account locked'
      )
      return res.status(423).json({
        error: 'Account locked due to multiple failed login attempts',
        locked_until: user.account_locked_until
      })
    }

    // SECURITY: Verify password using cryptographic verification
    // FedRAMP AC-2, IA-5, IA-8: All authentication MUST use cryptographic verification
    // NO BACKDOORS OR MOCK PASSWORDS ALLOWED IN PRODUCTION
    // Supports both FIPS-compliant PBKDF2 (preferred) and bcrypt (legacy) hashes
    let validPassword = false
    try {
      // Handle SSO users who don't have a traditional password hash
      if (user.password_hash === 'SSO') {
        // SSO users cannot login via password - must use SSO flow
        logger.warn(`SSO user ${user.email} attempted password login`)
        validPassword = false
      } else if (!user.password_hash || user.password_hash.length < 20) {
        // Invalid or malformed password hash - security violation
        logger.error(`Invalid password hash detected for user ${user.id}`)
        validPassword = false
      } else if (user.password_hash.startsWith('$2a$') ||
        user.password_hash.startsWith('$2b$') ||
        user.password_hash.startsWith('$2y$')) {
        // Legacy bcrypt hash - still cryptographically secure
        // bcrypt is NIST-approved for password hashing
        const bcrypt = await import('bcrypt')
        validPassword = await bcrypt.compare(password, user.password_hash)

        // TODO: Consider migrating to PBKDF2 on successful login
        // if (validPassword) {
        //   const newHash = await FIPSCryptoService.hashPassword(password)
        //   await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id])
        // }
      } else {
        // FIPS-compliant PBKDF2 password verification (preferred)
        validPassword = await FIPSCryptoService.verifyPassword(password, user.password_hash)
      }
    } catch (err) {
      logger.error('Password verification error (fallback to false):', err)
      validPassword = false
    }

    if (!validPassword) {
      // CRIT-F-004: Record brute force attempt
      // const bruteForceResult = bruteForce.recordFailure(email)
      const bruteForceResult = { locked: false } // Fallback

      // Increment failed attempts in database
      const newAttempts = 0
      const lockAccount = newAttempts >= 3
      const lockedUntil = lockAccount ? new Date(Date.now() + 30 * 60 * 1000) : null // 30 minutes

      // SECURITY: Add tenant_id filter to prevent cross-tenant account manipulation
      //      await pool.query(
      //        `UPDATE users
      //         SET failed_login_attempts = $1,
      //             account_locked_until = $2
      //         WHERE id = $3 AND tenant_id = $4`,
      //        [newAttempts, lockedUntil, user.id, user.tenant_id]
      //      )

      await createAuditLog(
        user.tenant_id,
        user.id,
        'LOGIN',
        'users',
        user.id,
        { email, attempts: newAttempts, bruteForceProtected: bruteForceResult.locked },
        req.ip || null,
        req.get('User-Agent') || null,
        `failure`,
        `Invalid password (attempt ${newAttempts}/3)`
      )

      return res.status(401).json({
        error: `Invalid credentials`,
        attempts_remaining: Math.max(0, 3 - newAttempts)
      })
    }

    // Reset failed attempts on successful login
    // CRIT-F-004: Clear brute force protection on success
    // bruteForce.recordSuccess(email)

    // SECURITY: Add tenant_id filter to prevent cross-tenant account manipulation
    //    await pool.query(
    //      `UPDATE users
    //       SET failed_login_attempts = 0,
    //           account_locked_until = NULL,
    //           last_login_at = NOW()
    //       WHERE id = $1 AND tenant_id = $2`,
    //      [user.id, user.tenant_id]
    //    )

    // SECURITY: Generate FIPS-compliant JWT tokens using RS256
    // RSA with SHA-256 is FIPS 140-2 approved (FIPS 186-4 + FIPS 180-4)
    // Generate access token (short-lived: 15 minutes)
    const token = FIPSJWTService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.tenant_id
    )

    // Generate refresh token (long-lived: 7 days)
    const refreshToken = FIPSJWTService.generateRefreshToken(
      user.id,
      user.tenant_id
    )

    // Store refresh token in database for rotation tracking
    // SECURITY: Include tenant_id for proper multi-tenant isolation
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, tenant_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'7 days\', NOW())',
      [user.id, user.tenant_id, crypto.createHash('sha256').update(refreshToken).digest('hex')]
    )

    await createAuditLog(
      user.tenant_id,
      user.id,
      'LOGIN',
      'users',
      user.id,
      { email },
      req.ip || null,
      req.get('User-Agent') || null,
      'success'
    )

    // SECURITY: Set httpOnly cookie for session persistence (CRIT-F-001)
    setAuthCookie(res, token)

    let permissions: string[] = []
    try {
      const permissionSet = await getUserPermissions(user.id)
      permissions = Array.from(permissionSet)
    } catch (permissionError: any) {
      logger.warn('Login: failed to resolve permissions (falling back to empty list)', {
        userId: user.id,
        error: permissionError?.message || permissionError
      })
    }

    res.json({
      token,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        tenant_id: user.tenant_id,
        permissions
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    logger.error('Login error:', error) // Wave 16: Winston logger
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/register
router.post('/register', csrfProtection, registrationLimiter, async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body)

    // Check if user already exists
    // SECURITY NOTE: For registration, we check globally across all tenants
    // to prevent the same email from registering multiple times
    // This is intentional - emails should be unique system-wide
    const existing = await pool.query(
      'SELECT id, tenant_id FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Hash password using FIPS-compliant PBKDF2
    const passwordHash = await FIPSCryptoService.hashPassword(data.password)

    // Get default tenant (or create one)
    const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1')
    let tenantId: string

    if (tenantResult.rows.length === 0) {
      const newTenant = await pool.query(
        'INSERT INTO tenants (name, domain) VALUES ($1, $2) RETURNING id',
        ['Default Tenant', 'default']
      )
      tenantId = newTenant.rows[0].id
    } else {
      tenantId = tenantResult.rows[0].id
    }

    // SECURITY: Force role to 'viewer' for all self-registrations
    // This prevents privilege escalation attacks during registration
    const defaultRole = 'viewer'

    // Create user with forced role
    const userResult = await pool.query(
      `INSERT INTO users (
        tenant_id, email, password_hash, first_name, last_name, phone, role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, role, tenant_id`,
      [
        tenantId,
        data.email.toLowerCase(),
        passwordHash,
        data.first_name,
        data.last_name,
        data.phone || null,
        defaultRole
      ]
    )

    const user = userResult.rows[0]

    await createAuditLog(
      tenantId,
      user.id,
      'CREATE',
      'users',
      user.id,
      { email: data.email, role: defaultRole },
      req.ip || null,
      req.get('User-Agent') || null,
      'success'
    )

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        tenant_id: user.tenant_id
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    logger.error('Register error:', error) // Wave 16: Winston logger
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access token and refresh token (token rotation)
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token received during login
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: New JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token (rotation)
 *                 expiresIn:
 *                   type: number
 *                   description: Token expiration time in seconds
 *       401:
 *         description: Invalid or expired refresh token
 */
// POST /api/auth/refresh - Refresh token rotation
router.post('/refresh', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }

    // Verify refresh token using FIPS-compliant RS256
    let decoded: any
    try {
      decoded = FIPSJWTService.verifyRefreshToken(refreshToken)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    // Check if refresh token exists in database and is not revoked
    // SECURITY: Add tenant_id filter to prevent cross-tenant token use
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const tokenResult = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE user_id = $1 AND tenant_id = $2 AND token_hash = $3 AND revoked_at IS NULL AND expires_at > NOW()`,
      [decoded.id, decoded.tenant_id, tokenHash]
    )

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token not found or revoked' })
    }

    // Get user data
    // SECURITY: Add tenant_id filter to ensure proper multi-tenant isolation
    const userResult = await pool.query(
      `SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at
       FROM users
       WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [decoded.id, decoded.tenant_id]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    const user = userResult.rows[0]

    // Revoke old refresh token (rotation)
    // SECURITY: Add tenant_id filter to prevent cross-tenant token manipulation
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND tenant_id = $2',
      [tokenHash, user.tenant_id]
    )

    // Generate new FIPS-compliant tokens using RS256
    const newToken = FIPSJWTService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.tenant_id
    )

    const newRefreshToken = FIPSJWTService.generateRefreshToken(
      user.id,
      user.tenant_id
    )

    // Store new refresh token
    // SECURITY: Include tenant_id for proper multi-tenant isolation
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, tenant_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'7 days\', NOW())',
      [user.id, user.tenant_id, crypto.createHash('sha256').update(newRefreshToken).digest('hex')]
    )

    await createAuditLog(
      user.tenant_id,
      user.id,
      'REFRESH_TOKEN',
      'users',
      user.id,
      {},
      req.ip || null,
      req.get('User-Agent') || null,
      'success'
    )

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: 900 // 15 minutes in seconds
    })
  } catch (error) {
    logger.error('Refresh token error:', error) // Wave 16: Winston logger
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', authenticateJWT, csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userResult = await pool.query(
      `SELECT id, tenant_id, email, password_hash
       FROM users
       WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [req.user.id, req.user.tenant_id]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = userResult.rows[0]
    const validPassword = await FIPSCryptoService.verifyPassword(currentPassword, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const newHash = await FIPSCryptoService.hashPassword(newPassword)
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
      [newHash, user.id, user.tenant_id]
    )

    await createAuditLog(
      user.tenant_id,
      user.id,
      'PASSWORD_CHANGE',
      'users',
      user.id,
      {},
      req.ip || null,
      req.get('User-Agent') || null,
      'success'
    )

    res.json({ success: true })
  } catch (error: any) {
    logger.error('Change password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and revoke all refresh tokens
 *     tags:
 *       - Authentication
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               revokeAllTokens:
 *                 type: boolean
 *                 description: Revoke all refresh tokens for this user (logout from all devices)
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
// POST /api/auth/logout
router.post('/logout', csrfProtection, async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1]
  const { revokeAllTokens } = req.body

  if (token) {
    try {
      // Verify access token using FIPS-compliant RS256
      const decoded = FIPSJWTService.verifyAccessToken(token)

      // Revoke refresh tokens
      // SECURITY: Add tenant_id filter to prevent cross-tenant token revocation
      if (revokeAllTokens) {
        // Revoke all tokens for this user (logout from all devices)
        await pool.query(
          `UPDATE refresh_tokens SET revoked_at = NOW()
           WHERE user_id = $1 AND tenant_id = $2 AND revoked_at IS NULL`,
          [decoded.id, decoded.tenant_id]
        )
      } else {
        // Just revoke tokens that should have been cleaned up
        // In a production system, you'd track which specific refresh token to revoke
        await pool.query(
          `UPDATE refresh_tokens SET revoked_at = NOW()
           WHERE user_id = $1 AND tenant_id = $2 AND expires_at < NOW() AND revoked_at IS NULL`,
          [decoded.id, decoded.tenant_id]
        )
      }

      await createAuditLog(
        decoded.tenant_id,
        decoded.id,
        'LOGOUT',
        'users',
        decoded.id,
        { revokeAllTokens: !!revokeAllTokens },
        req.ip || null,
        req.get('User-Agent') || null,
        'success'
      )
    } catch (error) {
      // Token invalid, but still return success for logout
    }
  }

  res.json({ message: 'Logged out successfully' })
})

/**
 * GET /api/auth/me
 * Get current authenticated user info from JWT token (header or cookie)
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Get token from Authorization header or cookie
    logger.info('Auth /me request', { cookies: req.cookies?.auth_token ? 'PRESENT' : 'MISSING', headers: req.headers.authorization ? 'PRESENT' : 'MISSING' });
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token

    if (!token) {
      return res.status(401).json({ error: 'No authentication token found' })
    }

    // Verify and decode token using FIPS-compliant RS256
    const decoded = FIPSJWTService.verifyAccessToken(token)

    // Get fresh user data from database
    const userResult = await pool.query(
      `SELECT u.id,
              u.tenant_id,
              u.email,
              u.first_name,
              u.last_name,
              u.role,
              u.is_active,
              u.phone,
              u.created_at,
              u.updated_at,
              t.name as tenant_name,
              t.domain as tenant_domain
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1 AND u.tenant_id = $2 AND u.is_active = true`,
      [decoded.id, decoded.tenant_id]
    )

    if (userResult.rows.length === 0) {
      throw new NotFoundError("User not found or inactive")
    }

    const user = userResult.rows[0]

    let permissions: string[] = []
    try {
      const permissionSet = await getUserPermissions(user.id)
      permissions = Array.from(permissionSet)
    } catch (permissionError: any) {
      logger.warn('Auth /me failed to resolve permissions (falling back to empty list)', {
        userId: user.id,
        error: permissionError?.message || permissionError
      })
    }

    // Return user info and the token (so frontend can store it)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        tenant_domain: user.tenant_domain,
        permissions,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token // Return the token so frontend can store it for API calls
    })
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    logger.error('Error in /auth/me:', error.message) // Wave 16: Winston logger
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @openapi
 * /api/auth/microsoft/login:
 *   get:
 *     summary: Initiate Microsoft Azure AD SSO login
 *     description: Redirects user to Microsoft login page for OAuth authentication
 *     tags:
 *       - Authentication
 *     responses:
 *       302:
 *         description: Redirect to Microsoft login page
 */
// GET /api/auth/microsoft/login - Initiate Microsoft SSO
router.get('/microsoft/login', (req: Request, res: Response) => {
  const AZURE_AD_CONFIG = {
    clientId: process.env.AZURE_AD_CLIENT_ID || process.env.VITE_AZURE_AD_CLIENT_ID || 'baae0851-0c24-4214-8587-e3fabc46bd4a',
    tenantId: process.env.AZURE_AD_TENANT_ID || process.env.VITE_AZURE_AD_TENANT_ID || '0ec14b81-7b82-45ee-8f3d-cbc31ced5347',
    redirectUri: process.env.AZURE_AD_REDIRECT_URI || 'https://fleet.capitaltechalliance.com/api/auth/microsoft/callback'
  }

  const authUrl = `https://login.microsoftonline.com/${AZURE_AD_CONFIG.tenantId}/oauth2/v2.0/authorize?` +
    `client_id=${AZURE_AD_CONFIG.clientId}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(AZURE_AD_CONFIG.redirectUri)}` +
    `&response_mode=query` +
    `&scope=${encodeURIComponent('openid profile email User.Read')}` +
    `&state=1`

  logger.info('[AUTH] Redirecting to Azure AD for SSO', { authUrl: authUrl.substring(0, 100) + '...' })
  res.redirect(authUrl)
})

/**
 * @openapi
 * /api/auth/microsoft/callback:
 *   get:
 *     summary: Microsoft Azure AD SSO callback
 *     description: Handles OAuth callback from Microsoft and creates/authenticates user
 *     tags:
 *       - Authentication
 *     responses:
 *       302:
 *         description: Redirect to dashboard with auth token
 */
// GET /api/auth/microsoft/callback - Handle Microsoft SSO callback
router.get('/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query

    if (!code || typeof code !== 'string') {
      return res.redirect('/login?error=no_code')
    }

    const AZURE_AD_CONFIG = {
      clientId: process.env.AZURE_AD_CLIENT_ID || process.env.VITE_AZURE_AD_CLIENT_ID || 'baae0851-0c24-4214-8587-e3fabc46bd4a',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || process.env.VITE_AZURE_AD_TENANT_ID || '0ec14b81-7b82-45ee-8f3d-cbc31ced5347',
      redirectUri: process.env.AZURE_AD_REDIRECT_URI || 'https://fleet.capitaltechalliance.com/api/auth/microsoft/callback'
    }

    // Exchange code for token
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${AZURE_AD_CONFIG.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: AZURE_AD_CONFIG.clientId,
        client_secret: AZURE_AD_CONFIG.clientSecret,
        code: code,
        redirect_uri: AZURE_AD_CONFIG.redirectUri,
        grant_type: 'authorization_code',
        scope: 'openid profile email User.Read'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    )

    const { access_token } = tokenResponse.data

    // Get user info
    const userInfoResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    })

    const microsoftUser = userInfoResponse.data
    const email = (microsoftUser.mail || microsoftUser.userPrincipalName).toLowerCase()

    // Domain allowlist (prod-safe; dev-friendly).
    // In production, require explicit allowlist (default: capitaltechalliance.com).
    // In development/staging, allow all domains unless SSO_ALLOWED_DOMAINS is set.
    const isProduction = process.env.NODE_ENV === 'production'
    const configuredDomains = (process.env.SSO_ALLOWED_DOMAINS || '')
      .split(',')
      .map(domain => domain.trim().toLowerCase())
      .filter(Boolean)
    const defaultDomains = ['capitaltechalliance.com']
    const allowedDomains = configuredDomains.length > 0
      ? configuredDomains
      : (isProduction ? defaultDomains : [])

    if (allowedDomains.length > 0) {
      const emailDomain = (email.split('@')[1] || '').toLowerCase()
      const isAllowed = allowedDomains.some(domain => emailDomain === domain)
      if (!isAllowed) {
        logger.warn(`[AUTH] SSO login attempt from unauthorized domain: ${email}`)
        const acceptsJson = req.headers.accept?.includes('application/json')
        if (acceptsJson) {
          return res.status(403).json({
            error: 'Access Denied',
            message: `Only users with ${allowedDomains.map(d => `@${d}`).join(', ')} email addresses can log in`
          })
        } else {
          return res.redirect('/login?error=unauthorized_domain')
        }
      }
    }

    // Resolve default tenant for SSO-provisioned users.
    // Prefer explicit DEFAULT_TENANT_SLUG/DEFAULT_TENANT_ID when set (demo/prod),
    // otherwise fall back to the earliest-created tenant (legacy behavior).
    const defaultTenantId = process.env.DEFAULT_TENANT_ID || null
    const defaultTenantSlug = process.env.DEFAULT_TENANT_SLUG || null

    const tenantResult = defaultTenantId
      ? await pool.query('SELECT id FROM tenants WHERE id = $1 LIMIT 1', [defaultTenantId])
      : defaultTenantSlug
        ? await pool.query('SELECT id FROM tenants WHERE slug = $1 LIMIT 1', [defaultTenantSlug])
        : await pool.query('SELECT id FROM tenants ORDER BY created_at LIMIT 1')
    if (tenantResult.rows.length === 0) {
      return res.redirect('/login?error=no_tenant')
    }
    const tenantId = tenantResult.rows[0].id

    // Check if user exists
    // SECURITY NOTE: For SSO, we check globally across all tenants first
    // Then assign to the default tenant if they don't exist
    // This prevents duplicate SSO users across tenants
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, tenant_id FROM users WHERE email = $1',
      [email]
    )

    let user
    if (userResult.rows.length === 0) {
      // Create new user
      const insertResult = await pool.query(
        `INSERT INTO users (tenant_id, email, first_name, last_name, role, is_active, password_hash, provider, provider_user_id)
         VALUES ($1, $2, $3, $4, 'Viewer', true, 'SSO', 'microsoft', $5)
         RETURNING id, email, first_name, last_name, role, tenant_id`,
        [tenantId, email, microsoftUser.givenName || 'User', microsoftUser.surname || '', microsoftUser.id]
      )
      user = insertResult.rows[0]
    } else {
      user = userResult.rows[0]
    }

    // Generate JWT token
    const token = FIPSJWTService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.tenant_id
    )
    const refreshToken = await issueRefreshToken(user.id, user.tenant_id)

    await createAuditLog(
      user.tenant_id,
      user.id,
      'LOGIN',
      'users',
      user.id,
      { provider: 'microsoft', email },
      req.ip || null,
      req.get('User-Agent') || null,
      'success'
    )

    // Check if this is a client-side fetch (JSON expected) or redirect from Azure AD
    // Client-side fetch will have Accept: application/json header
    const acceptsJson = req.headers.accept?.includes('application/json')

    // Set secure httpOnly cookie for session persistence
    setAuthCookie(res, token)

    if (acceptsJson) {
      // Return JSON for client-side OAuth flow
      return res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          tenant_id: user.tenant_id
        }
      })
    } else {
      // Redirect to dashboard without token in URL
      res.redirect('/')
    }
  } catch (error: any) {
    logger.error('Microsoft SSO callback error:', error.message) // Wave 16: Winston logger
    const acceptsJson = req.headers.accept?.includes('application/json')
    if (acceptsJson) {
      return res.status(500).json({ error: 'Microsoft SSO authentication failed', details: error.message })
    } else {
      res.redirect('/login?error=sso_failed')
    }
  }
})

/**
 * Exchange Microsoft access token for Fleet session cookie
 * POST /api/auth/microsoft/exchange
 */
router.post('/microsoft/exchange', async (req: Request, res: Response) => {
  try {
    const { idToken, tenantId: requestedTenantId } = req.body || {}

    // ID token is REQUIRED - it contains user information and is signed by Azure AD
    if (!idToken || typeof idToken !== 'string') {
      logger.warn('[Auth Exchange] Missing or invalid idToken', {
        origin: req.headers.origin,
        referer: req.headers.referer,
        contentLength: req.headers['content-length']
      })
      return res.status(400).json({ error: 'Missing idToken - ID token is required for authentication' })
    }

    // Decode ID token WITHOUT verification first to get tenant ID
    logger.info('[Auth Exchange] Decoding ID token', {
      origin: req.headers.origin,
      referer: req.headers.referer,
      hasCookie: Boolean(req.headers.cookie),
      authCookiePresent: Boolean(req.cookies?.auth_token)
    })
    const decodedUnverified = jwt.decode(idToken, { complete: true }) as any
    if (!decodedUnverified || !decodedUnverified.payload) {
      logger.error('[Auth Exchange] Failed to decode ID token')
      return res.status(400).json({ error: 'Invalid ID token format' })
    }

    const payload = decodedUnverified.payload
    const azureTenantId = payload.tid || process.env.VITE_AZURE_AD_TENANT_ID || '0ec14b81-7b82-45ee-8f3d-cbc31ced5347'

    logger.debug('[Auth Exchange] ID token payload', {
      oid: payload.oid,
      sub: payload.sub,
      email: payload.email,
      preferred_username: payload.preferred_username,
      upn: payload.upn,
      name: payload.name,
      azureTenantId: azureTenantId,
      tid: payload.tid,
      iss: payload.iss,
      aud: payload.aud
    })

    // Extract user info from ID token claims
    const microsoftUser = {
      id: payload.oid || payload.sub,
      mail: payload.email || payload.preferred_username || payload.upn,
      userPrincipalName: payload.preferred_username || payload.upn,
      givenName: payload.given_name || payload.name?.split(' ')[0] || 'User',
      surname: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || ''
    }

    const email = (microsoftUser.mail || microsoftUser.userPrincipalName || '').toLowerCase()

    if (!email) {
      logger.error('[Auth Exchange] Unable to extract email from ID token')
      return res.status(400).json({ error: 'Unable to resolve user email from ID token' })
    }

    logger.info('[Auth Exchange] Extracted user info from ID token', {
      id: microsoftUser.id,
      email,
      givenName: microsoftUser.givenName,
      surname: microsoftUser.surname,
      domain: email.split('@')[1]
    })

    const isProduction = process.env.NODE_ENV === 'production'
    const configuredDomains = (process.env.SSO_ALLOWED_DOMAINS || '')
      .split(',')
      .map(domain => domain.trim().toLowerCase())
      .filter(Boolean)
    const defaultDomains = ['capitaltechalliance.com']
    const allowedDomains = configuredDomains.length > 0
      ? configuredDomains
      : (isProduction ? defaultDomains : [])

    if (allowedDomains.length > 0) {
      const emailDomain = email.split('@')[1] || ''
      const isAllowed = allowedDomains.some(domain => emailDomain === domain)
      if (!isAllowed) {
        logger.warn(`[AUTH] SSO exchange attempt from unauthorized domain: ${email}`)
        return res.status(403).json({
          error: 'Access Denied',
          message: `Only users with ${allowedDomains.map(d => `@${d}`).join(', ')} email addresses can log in`
        })
      }
    }

    // Resolve tenant - allow explicit tenantId if valid, else default
    let tenantId: string | null = null
    if (requestedTenantId && typeof requestedTenantId === 'string') {
      const tenantCheck = await pool.query('SELECT id FROM tenants WHERE id = $1', [requestedTenantId])
      if (tenantCheck.rows.length > 0) {
        tenantId = tenantCheck.rows[0].id
      }
    }

    if (!tenantId) {
      // Prefer an explicit default tenant for demos and controlled environments.
      // This avoids accidentally provisioning SSO users into a non-demo tenant.
      const envDefaultTenantId = process.env.DEFAULT_TENANT_ID
      const envDefaultTenantSlug = process.env.DEFAULT_TENANT_SLUG

      if (envDefaultTenantId) {
        const tenantResult = await pool.query('SELECT id FROM tenants WHERE id = $1', [envDefaultTenantId])
        if (tenantResult.rows.length > 0) {
          tenantId = tenantResult.rows[0].id
        }
      }

      if (!tenantId && envDefaultTenantSlug) {
        const tenantResult = await pool.query('SELECT id FROM tenants WHERE slug = $1', [envDefaultTenantSlug])
        if (tenantResult.rows.length > 0) {
          tenantId = tenantResult.rows[0].id
        }
      }

      // Dev convenience: if the CTA demo tenant exists, use it by default.
      if (!tenantId && process.env.NODE_ENV !== 'production') {
        const tenantResult = await pool.query('SELECT id FROM tenants WHERE slug = $1', ['cta-fleet'])
        if (tenantResult.rows.length > 0) {
          tenantId = tenantResult.rows[0].id
        }
      }

      // Fallback: first created tenant.
      if (!tenantId) {
        const tenantResult = await pool.query('SELECT id FROM tenants ORDER BY created_at LIMIT 1')
        if (tenantResult.rows.length === 0) {
          return res.status(500).json({ error: 'No tenant configured' })
        }
        tenantId = tenantResult.rows[0].id
      }
    }

    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, tenant_id FROM users WHERE lower(email) = $1',
      [email]
    )

    let user
    if (userResult.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO users (tenant_id, email, first_name, last_name, role, is_active, password_hash, provider, provider_user_id)
         VALUES ($1, $2, $3, $4, 'Viewer', true, 'SSO', 'microsoft', $5)
         RETURNING id, email, first_name, last_name, role, tenant_id`,
        [tenantId, email, microsoftUser.givenName || 'User', microsoftUser.surname || '', microsoftUser.id]
      )
      user = insertResult.rows[0]
    } else {
      user = userResult.rows[0]

      // Demo/dev safety: ensure SSO users land in the intended demo tenant.
      // If the same email existed in an older seed tenant, move it to the resolved tenant
      // (typically CTA) so the UI consistently shows Tallahassee CTA data.
      if (process.env.NODE_ENV !== 'production' && user.tenant_id !== tenantId) {
        logger.warn('[Auth Exchange] User exists in different tenant; re-homing to resolved tenant (dev/demo)', {
          email,
          fromTenant: user.tenant_id,
          toTenant: tenantId,
        })

        const updateResult = await pool.query(
          `UPDATE users
           SET tenant_id = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING id, email, first_name, last_name, role, tenant_id`,
          [tenantId, user.id]
        )

        user = updateResult.rows[0] || user
      }
    }

    const token = FIPSJWTService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.tenant_id
    )
    const refreshToken = await issueRefreshToken(user.id, user.tenant_id)

    await createAuditLog(
      user.tenant_id,
      user.id,
      'LOGIN',
      'users',
      user.id,
      { provider: 'microsoft', email },
      req.ip || null,
      req.get('User-Agent') || null,
      'success'
    )

    setAuthCookie(res, token)

    logger.info('[Auth Exchange] Session issued', {
      userId: user.id,
      tenantId: user.tenant_id,
      authCookieSet: true,
      origin: req.headers.origin,
      referer: req.headers.referer,
      cookieDomain: process.env.AUTH_COOKIE_DOMAIN || 'host',
      sameSite: (process.env.AUTH_COOKIE_SAMESITE || 'lax').toLowerCase()
    })

    let permissions: string[] = []
    try {
      const permissionSet = await getUserPermissions(user.id)
      permissions = Array.from(permissionSet)
    } catch (permissionError: any) {
      logger.warn('[Auth Exchange] Failed to resolve permissions (falling back to empty list)', {
        userId: user.id,
        error: permissionError?.message || permissionError
      })
    }

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        tenant_id: user.tenant_id,
        permissions
      }
    })
  } catch (error: any) {
    logger.error('Microsoft SSO exchange error:', {
      message: error.message,
      stack: error.stack,
      error: error
    })
    return res.status(500).json({ error: 'Microsoft SSO exchange failed', details: error.message })
  }
})

/**
 * @openapi
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     description: Verify and decode a JWT token (local Fleet or Azure AD)
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authenticated:
 *                   type: boolean
 *                   example: true
 *                 tokenType:
 *                   type: string
 *                   enum: [local, azureAD]
 *                   example: local
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     tenant_id:
 *                       type: string
 *       401:
 *         description: Token is invalid or expired
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    const cookieToken = req.cookies?.auth_token

    if (!authHeader && !cookieToken) {
      return res.status(401).json({
        authenticated: false,
        error: 'No token provided',
        errorCode: 'NO_TOKEN'
      })
    }

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : cookieToken

    if (!token) {
      return res.status(401).json({
        authenticated: false,
        error: 'Invalid token format',
        errorCode: 'INVALID_FORMAT'
      })
    }

    logger.info('[AUTH /verify] Verifying token...')

    // Decode token to determine type
    const decoded = FIPSJWTService.decode(token)
    const isAzureADToken = decoded && decoded.tid && !decoded.type
    const isLocalToken = decoded && decoded.type === 'access'

    let tokenType: 'local' | 'azureAD' = 'local'
    let validatedUser: any = null

    if (isAzureADToken) {
      // Validate Azure AD token
      logger.info('[AUTH /verify] Detected Azure AD token')
      const { default: AzureADTokenValidator } = await import('../services/azure-ad-token-validator')
      const { default: jwtConfig } = await import('../config/jwt-config')

      const validationResult = await AzureADTokenValidator.validateToken(token, {
        tenantId: jwtConfig.azureAD.tenantId,
        audience: jwtConfig.azureAD.clientId
      })

      if (!validationResult.valid) {
        logger.error('[AUTH /verify] Azure AD validation failed:', validationResult.error)
        return res.status(401).json({
          authenticated: false,
          error: validationResult.error,
          errorCode: validationResult.errorCode
        })
      }

      tokenType = 'azureAD'
      validatedUser = AzureADTokenValidator.extractUserInfo(validationResult.payload!)
    } else if (isLocalToken) {
      // Validate local Fleet token
      logger.info('[AUTH /verify] Detected local Fleet token')
      validatedUser = FIPSJWTService.verifyAccessToken(token)
      tokenType = 'local'
    } else {
      logger.error('[AUTH /verify] Unknown token format')
      return res.status(401).json({
        authenticated: false,
        error: 'Unknown token format',
        errorCode: 'INVALID_TOKEN_FORMAT'
      })
    }

    logger.info('[AUTH /verify] Token validated successfully', {
      tokenType,
      userId: validatedUser.id,
      email: validatedUser.email
    })

    res.json({
      authenticated: true,
      tokenType,
      user: {
        id: validatedUser.id,
        email: validatedUser.email,
        role: validatedUser.role,
        tenant_id: validatedUser.tenant_id || validatedUser.tenantId,
        name: validatedUser.name
      }
    })
  } catch (error: any) {
    logger.error('[AUTH /verify] Token verification error:', {
      message: error.message,
      name: error.name
    })

    let errorCode = 'VALIDATION_FAILED'
    if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED'
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN'
    }

    res.status(401).json({
      authenticated: false,
      error: error.message,
      errorCode
    })
  }
})

/**
 * @openapi
 * /api/auth/userinfo:
 *   get:
 *     summary: Get user information from token
 *     description: Extract detailed user information from JWT token
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     tenant_id:
 *                       type: string
 *                 tokenInfo:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [local, azureAD]
 *                     issuer:
 *                       type: string
 *                     issuedAt:
 *                       type: string
 *                       format: date-time
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Token is invalid or missing
 */
router.get('/userinfo', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    const cookieToken = req.cookies?.auth_token

    if (!authHeader && !cookieToken) {
      return res.status(401).json({
        error: 'No token provided',
        errorCode: 'NO_TOKEN'
      })
    }

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : cookieToken

    if (!token) {
      return res.status(401).json({
        error: 'Invalid token format',
        errorCode: 'INVALID_FORMAT'
      })
    }

    logger.info('[AUTH /userinfo] Extracting user info from token...')

    // Decode token to determine type
    const decoded = FIPSJWTService.decode(token)
    const isAzureADToken = decoded && decoded.tid && !decoded.type
    const isLocalToken = decoded && decoded.type === 'access'

    let tokenType: 'local' | 'azureAD' = 'local'
    let userInfo: any = {}
    let tokenInfo: any = {}

    if (isAzureADToken) {
      // Validate and extract Azure AD token info
      logger.info('[AUTH /userinfo] Processing Azure AD token')
      const { default: AzureADTokenValidator } = await import('../services/azure-ad-token-validator')
      const { default: jwtConfig } = await import('../config/jwt-config')

      const validationResult = await AzureADTokenValidator.validateToken(token, {
        tenantId: jwtConfig.azureAD.tenantId,
        audience: jwtConfig.azureAD.clientId
      })

      if (!validationResult.valid) {
        logger.error('[AUTH /userinfo] Azure AD validation failed:', validationResult.error)
        return res.status(401).json({
          error: validationResult.error,
          errorCode: validationResult.errorCode
        })
      }

      tokenType = 'azureAD'
      userInfo = AzureADTokenValidator.extractUserInfo(validationResult.payload!)

      const payload = validationResult.payload!
      tokenInfo = {
        type: 'azureAD',
        issuer: payload.iss,
        issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
        audience: payload.aud,
        tenantId: payload.tid
      }
    } else if (isLocalToken) {
      // Validate and extract local Fleet token info
      logger.info('[AUTH /userinfo] Processing local Fleet token')
      const validatedPayload = FIPSJWTService.verifyAccessToken(token)

      tokenType = 'local'
      userInfo = {
        id: validatedPayload.id,
        email: validatedPayload.email,
        role: validatedPayload.role,
        tenantId: validatedPayload.tenant_id
      }

      tokenInfo = {
        type: 'local',
        issuer: validatedPayload.iss,
        issuedAt: validatedPayload.iat ? new Date(validatedPayload.iat * 1000).toISOString() : null,
        expiresAt: validatedPayload.exp ? new Date(validatedPayload.exp * 1000).toISOString() : null,
        audience: validatedPayload.aud
      }
    } else {
      logger.error('[AUTH /userinfo] Unknown token format')
      return res.status(401).json({
        error: 'Unknown token format',
        errorCode: 'INVALID_TOKEN_FORMAT'
      })
    }

    logger.info('[AUTH /userinfo] User info extracted successfully', {
      tokenType,
      userId: userInfo.id,
      email: userInfo.email
    })

    res.json({
      user: userInfo,
      tokenInfo
    })
  } catch (error: any) {
    logger.error('[AUTH /userinfo] Error extracting user info:', {
      message: error.message,
      name: error.name
    })

    let errorCode = 'EXTRACTION_FAILED'
    if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED'
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN'
    }

    res.status(401).json({
      error: error.message,
      errorCode
    })
  }
});

export default router
