import express, { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../config/database'
import { createAuditLog } from '../middleware/audit'
import { z } from 'zod'
import { loginLimiter, registrationLimiter } from '../config/rate-limiters'

const router = express.Router()

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
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    // Get user
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND is_active = true`,
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

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      // Increment failed attempts
      const newAttempts = user.failed_login_attempts + 1
      const lockAccount = newAttempts >= 3
      const lockedUntil = lockAccount ? new Date(Date.now() + 30 * 60 * 1000) : null // 30 minutes

      await pool.query(
        `UPDATE users
         SET failed_login_attempts = $1,
             account_locked_until = $2
         WHERE id = $3`,
        [newAttempts, lockedUntil, user.id]
      )

      await createAuditLog(
        user.tenant_id,
        user.id,
        'LOGIN',
        'users',
        user.id,
        { email, attempts: newAttempts },
        req.ip || null,
        req.get('User-Agent') || null,
        'failure',
        `Invalid password (attempt ${newAttempts}/3)`
      )

      return res.status(401).json({
        error: 'Invalid credentials',
        attempts_remaining: Math.max(0, 3 - newAttempts)
      })
    }

    // Reset failed attempts on successful login
    await pool.query(
      `UPDATE users
       SET failed_login_attempts = 0,
           account_locked_until = NULL,
           last_login_at = NOW()
       WHERE id = $1`,
      [user.id]
    )

    // SECURITY: Generate JWT token with validated secret
    // JWT_SECRET must be set and must be at least 32 characters
    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET environment variable is not set')
      return res.status(500).json({ error: 'Server configuration error - authentication unavailable' })
    }

    if (process.env.JWT_SECRET.length < 32) {
      console.error('FATAL: JWT_SECRET must be at least 32 characters')
      return res.status(500).json({ error: 'Server configuration error - authentication unavailable' })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
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

    res.json({
      token,
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
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/register
router.post('/register', registrationLimiter, async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body)

    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Get default tenant (or create one)
    let tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1')
    let tenantId: string

    if (tenantResult.rows.length === 0) {
      const newTenant = await pool.query(
        `INSERT INTO tenants (name, domain) VALUES ($1, $2) RETURNING id`,
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
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (token) {
    try {
      // SECURITY: Validate JWT_SECRET before attempting to verify token
      if (!process.env.JWT_SECRET) {
        console.error('FATAL: JWT_SECRET environment variable is not set')
        return res.status(500).json({ error: 'Server configuration error' })
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any

      await createAuditLog(
        decoded.tenant_id,
        decoded.id,
        'LOGOUT',
        'users',
        decoded.id,
        {},
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

export default router
