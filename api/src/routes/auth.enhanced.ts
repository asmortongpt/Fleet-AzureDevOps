Here's the complete refactored `auth.enhanced.ts` file with all `pool.query` calls replaced by repository methods:


import bcrypt from 'bcrypt'
import csurf from 'csurf'
import express, { Request, Response } from 'express'
import { z } from 'zod'

import { loginLimiter, registrationLimiter } from '../config/rate-limiters'
import { UserRepository } from '../repositories/user.repository'
import { TenantRepository } from '../repositories/tenant.repository'
import { createAuditLog } from '../middleware/audit'
import { FIPSJWTService } from '../services/fips-jwt.service'

const router = express.Router()
const csrfProtection = csurf({ cookie: true })

// FIPS Compliant Crypto Service for JWT
const jwtService = new FIPSJWTService()

// Initialize repositories
const userRepository = new UserRepository()
const tenantRepository = new TenantRepository()

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
router.post('/login', csrfProtection, loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const tenant_id = req.body.tenant_id || req.headers['x-tenant-id']

    // SECURITY: Require tenant_id for all authentication operations
    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' })
    }

    // SECURITY: Validate tenant exists before proceeding
    const tenantExists = await tenantRepository.getTenantById(tenant_id)
    if (!tenantExists) {
      return res.status(400).json({ error: 'Invalid tenant ID' })
    }

    // SECURITY FIX: Add tenant_id to WHERE clause to enforce tenant isolation (CWE-862)
    // This prevents users from Tenant A logging in as users from Tenant B with the same email
    const user = await userRepository.getUserByEmailAndTenant(email, tenant_id)
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Invalid credentials', attempts_remaining: loginLimiter.remaining(req) })
    }

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
  csrfProtection,
  registrationLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email, password, first_name, last_name, phone, tenant_id } = registerSchema.parse(req.body)

      // SECURITY: Validate tenant exists before creating user
      const tenantExists = await tenantRepository.getTenantById(tenant_id)
      if (!tenantExists) {
        return res.status(400).json({ error: 'Invalid tenant ID' })
      }

      // SECURITY: Check if user already exists in this tenant
      const existingUser = await userRepository.getUserByEmailAndTenant(email, tenant_id)
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' })
      }

      // Hash the password
      const saltRounds = 10
      const password_hash = await bcrypt.hash(password, saltRounds)

      // Create the user
      const newUser = await userRepository.createUser({
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        tenant_id
      })

      // Generate JWT token
      const token = jwtService.generateToken({
        userId: newUser.id,
        tenant_id: newUser.tenant_id,
        role: newUser.role
      })

      // Log the registration event
      await createAuditLog({
        action: 'user_registration',
        userId: newUser.id,
        tenantId: newUser.tenant_id,
        details: { email: newUser.email }
      })

      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          tenant_id: newUser.tenant_id,
          email: newUser.email,
          role: newUser.role
        }
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router


This refactored version of `auth.enhanced.ts` replaces all `pool.query` calls with repository methods from `UserRepository` and `TenantRepository`. The file now uses the following repository methods:

- `userRepository.getUserByEmailAndTenant(email, tenant_id)`
- `userRepository.createUser(userData)`
- `tenantRepository.getTenantById(tenant_id)`

These repository methods encapsulate the database operations, improving the separation of concerns and making the code more maintainable and testable. The rest of the file remains unchanged, maintaining the existing functionality and security measures.