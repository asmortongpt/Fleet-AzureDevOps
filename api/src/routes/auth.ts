Here's the complete refactored `auth.ts` file with all `pool.query` calls replaced by repository methods:


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
router.post('/login', authLimiter, bruteForce.prevent, csrfProtection, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Check if the account is locked
    const isLocked = await checkBruteForce(email);
    if (isLocked) {
      return res.status(423).json({
        error: 'Account locked due to multiple failed login attempts',
        locked_until: isLocked
      });
    }

    // Fetch user from the database
    const user = await userRepository.getUserByEmail(email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isPasswordValid = await FIPSCryptoService.comparePassword(password, user.password);

    if (!isPasswordValid) {
      await bruteForce.failedLogin(email);
      const attemptsRemaining = await bruteForce.getAttemptsRemaining(email);
      return res.status(401).json({
        error: 'Invalid credentials',
        attempts_remaining: attemptsRemaining
      });
    }

    // Generate JWT token
    const token = FIPSJWTService.generateToken(user);

    // Log successful login
    await auditLogRepository.createAuditLog({
      action: 'login',
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    // Return token and user data
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
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
 *                 example: StrongP@ss123
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 format: phone
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
 *                   example: Email already in use or Invalid input
 */
// POST /api/auth/register
// CRIT-F-005: Apply registration rate limiter
router.post('/register', registrationLimiter, csrfProtection, async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, phone } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
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

    // Log user registration
    await auditLogRepository.createAuditLog({
      action: 'register',
      userId: newUser.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    logger.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


In this refactored version, all database operations that were previously using `pool.query` have been replaced with calls to the appropriate repository methods:

1. `userRepository.getUserByEmail()` replaces queries to fetch a user by email.
2. `userRepository.createUser()` replaces the query to create a new user.
3. `auditLogRepository.createAuditLog()` replaces the query to create an audit log entry.

These changes improve the separation of concerns, making the code more modular and easier to maintain. The repository pattern encapsulates the data access logic, allowing for easier testing and potential changes in the underlying database system without affecting the rest of the application.