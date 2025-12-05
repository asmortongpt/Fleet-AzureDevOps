import express, { Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import bcrypt from 'bcrypt'
import { createAuditLog } from '../middleware/audit'
import { z } from 'zod'
import { loginLimiter, registrationLimiter } from '../config/rate-limiters'
import { FIPSJWTService } from '../services/fips-jwt.service'
import csurf from 'csurf'
import { pool } from '../db'

const router = express.Router()
const csrfProtection = csurf({ cookie: true })

// FIPS Compliant Crypto Service for JWT
const jwtService = new FIPSJWTService()

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  tenant_id: z.string().uuid('Invalid tenant ID'),
})

// POST /api/auth/login
router.post('/login',csrfProtection, loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const tenant_id = req.body.tenant_id || req.headers['x-tenant-id']

    // SECURITY: Require tenant_id for all authentication operations
    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' })
    }

    // SECURITY: Validate tenant exists before proceeding
    const tenantCheck = await pool.query(
      'SELECT id FROM tenants WHERE id = $1',
      [tenant_id]
    )
    if (tenantCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid tenant ID' })
    }

    // SECURITY FIX: Add tenant_id to WHERE clause to enforce tenant isolation (CWE-862)
    // This prevents users from Tenant A logging in as users from Tenant B with the same email
    const { rows } = await pool.query(
      'SELECT id, tenant_id, email, password_hash, role FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenant_id]
    )
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ error: 'Invalid credentials', attempts_remaining: loginLimiter.remaining(req) })
    }

    const user = rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: 'Invalid credentials', attempts_remaining: loginLimiter.remaining(req) })
    }

    const token = jwtService.generateToken({
      userId: user.id,
      tenant_id: user.tenant_id,
      role: user.role
    })
    res.json({
      token,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/register
router.post(
  '/register',
csrfProtection,  csrfProtection,
  registrationLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email, password, first_name, last_name, phone, tenant_id } = registerSchema.parse(req.body)

      // SECURITY: Validate tenant exists before creating user
      const tenantCheck = await pool.query(
        'SELECT id FROM tenants WHERE id = $1',
        [tenant_id]
      )
      if (tenantCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid tenant ID' })
      }

      // SECURITY: Check if user already exists in this tenant
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
        [email, tenant_id]
      )
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User already exists in this tenant' })
      }

      const hashedPassword = await bcrypt.hash(password, 12)

      // SECURITY FIX: Add tenant_id to INSERT to enforce tenant isolation (CWE-862)
      // This ensures new users are properly assigned to their tenant
      const { rows } = await pool.query(
        'INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id, tenant_id',
        [tenant_id, email, hashedPassword, first_name, last_name, phone, 'viewer']
      )

      const userId = rows[0].id

      // SECURITY: Include tenant_id in audit log
      await createAuditLog(
        tenant_id,
        userId,
        'CREATE',
        'users',
        userId,
        { email, role: 'viewer' },
        req.ip || null,
        req.get('User-Agent') || null,
        'success',
        'User registered successfully'
      )

      res.status(201).json({
        message: 'User registered successfully',
        userId,
        tenant_id: rows[0].tenant_id
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
