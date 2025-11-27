import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { createAuditLog } from '../middleware/audit';
import { z } from 'zod';
import { loginLimiter, registrationLimiter } from '../config/rate-limiters';
import { FIPSJWTService } from '../services/fips-jwt.service';
import csurf from 'csurf';

const router = express.Router();
const csrfProtection = csurf({ cookie: true });

// FIPS Compliant Crypto Service for JWT
const jwtService = new FIPSJWTService();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  phone: z.string().optional(),
});

// POST /api/auth/login
router.post('/login', csrfProtection, loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { rows } = await pool.query('SELECT id, email, password, role FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials', attempts_remaining: loginLimiter.remaining(req) });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials', attempts_remaining: loginLimiter.remaining(req) });
    }

    const token = jwtService.generateToken({ userId: user.id, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', csrfProtection, registrationLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, phone } = registerSchema.parse(req.body);

    const hashedPassword = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [email, hashedPassword, first_name, last_name, phone, 'viewer']
    );

    const userId = rows[0].id;
    createAuditLog(userId, 'register');

    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;