To refactor the `auth.ts` file to use the repository pattern, we'll need to create and import the necessary repositories. We'll replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


import axios from 'axios';
import express, { Request, Response } from 'express';
import { z } from 'zod';

import logger from '../config/logger';
import { NotFoundError } from '../errors/app-error';
import { createAuditLog } from '../middleware/audit';
import { csrfProtection } from '../middleware/csrf';
import { authLimiter, registrationLimiter, checkBruteForce, bruteForce } from '../middleware/rateLimiter';
import { FIPSCryptoService } from '../services/fips-crypto.service';
import { FIPSJWTService } from '../services/fips-jwt.service';

// Import repositories
import { UserRepository } from '../repositories/user.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';

const router = express.Router();

// Initialize repositories
const userRepository = new UserRepository();
const auditLogRepository = new AuditLogRepository();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

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
});

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
router.post('/login', csrfProtection, authLimiter, checkBruteForce('email'), async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // SECURITY: Development backdoor removed (CRIT-SEC-001)
    // All authentication must go through database verification
    // No NODE_ENV bypasses allowed - violates FedRAMP AC-2

    // Get user from repository
    const user = await userRepository.getUserByEmail(email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isPasswordValid = await FIPSCryptoService.comparePassword(password, user.password);

    if (!isPasswordValid) {
      await bruteForce('email', email, req);
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = FIPSJWTService.generateToken(user);

    // Log successful login
    await auditLogRepository.createAuditLog({
      action: 'login',
      userId: user.id,
      details: `User ${user.email} logged in successfully`
    });

    res.json({ token, user });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(401).json({ error: error.message });
    }
  }
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user account
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
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@demofleet.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Secure@123
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid input or User already exists
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Too many requests, please try again later
 */
// POST /api/auth/register
// CRIT-F-004: Apply registration rate limiter
router.post('/register', csrfProtection, registrationLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, phone } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await userRepository.getUserByEmail(email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await FIPSCryptoService.hashPassword(password);

    // Create new user
    const newUser = await userRepository.createUser({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      phone,
      role: 'viewer' // SECURITY: Always set to 'viewer' to prevent privilege escalation
    });

    // Log successful registration
    await auditLogRepository.createAuditLog({
      action: 'register',
      userId: newUser.id,
      details: `New user ${newUser.email} registered`
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

export default router;


In this refactored version:

1. We've imported the necessary repositories at the top of the file:
   
   import { UserRepository } from '../repositories/user.repository';
   import { AuditLogRepository } from '../repositories/audit-log.repository';
   

2. We've initialized the repositories:
   
   const userRepository = new UserRepository();
   const auditLogRepository = new AuditLogRepository();
   

3. We've replaced all `pool.query` calls with repository methods:
   - `getUserByEmail` method of `UserRepository` replaces the query to fetch a user by email.
   - `createUser` method of `UserRepository` replaces the query to insert a new user.
   - `createAuditLog` method of `AuditLogRepository` replaces the query to insert a new audit log entry.

4. We've kept all the route handlers intact, maintaining the same functionality as before.

5. The OpenAPI documentation and error handling remain unchanged.

This refactored version adheres to the repository pattern, improving the separation of concerns and making the code more maintainable and testable.