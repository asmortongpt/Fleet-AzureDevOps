/**
 * Enhanced Authentication Middleware - Production Ready
 * Task 1.6d from REMEDIATION_COMPLIANCE_PLAN.md
 *
 * Implements secure password hashing with bcrypt cost=13
 * For password-based authentication backup/fallback
 * FedRAMP/SOC 2 compliant
 */

import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../services/config';
import { logger } from '../services/logger';
import { db } from '../services/database';
import { JWTPayload, User } from '../types';

/**
 * Bcrypt cost factor - MUST be 13 or higher for FedRAMP/SOC 2 compliance
 * Cost of 13 = 2^13 = 8,192 iterations
 * Each increment doubles computation time (exponential security)
 */
const BCRYPT_ROUNDS = 13;

/**
 * Minimum password requirements for FedRAMP/SOC 2
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validate password meets security requirements
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Hash password with bcrypt cost=13
 * @param plainPassword - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    // Validate password strength first
    const validation = validatePasswordStrength(plainPassword);
    if (!validation.valid) {
      throw new Error(`Password does not meet requirements: ${validation.errors.join(', ')}`);
    }

    // Generate salt and hash password
    // bcrypt.hash automatically generates salt with specified rounds
    const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

    logger.info('Password hashed successfully', {
      bcryptRounds: BCRYPT_ROUNDS,
      hashLength: hashedPassword.length,
    });

    return hashedPassword;
  } catch (error) {
    logger.error('Password hashing failed', {
      error: error instanceof Error ? error.message : error,
    });
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify password against stored hash
 * @param plainPassword - Plain text password to verify
 * @param hashedPassword - Stored bcrypt hash
 * @returns True if password matches
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    if (isMatch) {
      // Check if password needs rehashing (cost factor changed)
      const needsRehash = await checkNeedsRehash(hashedPassword);
      if (needsRehash) {
        logger.info('Password hash needs upgrade to current cost factor');
      }
    }

    return isMatch;
  } catch (error) {
    logger.error('Password verification failed', {
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

/**
 * Check if password hash needs rehashing (cost factor changed)
 * @param hashedPassword - Stored bcrypt hash
 * @returns True if hash needs update
 */
async function checkNeedsRehash(hashedPassword: string): Promise<boolean> {
  try {
    // Extract cost from hash (bcrypt hash format: $2a$10$...)
    const hashParts = hashedPassword.split('$');
    if (hashParts.length < 4) {
      return true; // Invalid hash format, needs rehash
    }

    const currentCost = parseInt(hashParts[2], 10);
    return currentCost < BCRYPT_ROUNDS;
  } catch (error) {
    logger.error('Failed to check hash cost', {
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

/**
 * Middleware for password-based login
 * Backup authentication method alongside Microsoft OAuth
 */
export async function authenticateWithPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await db.findUserByEmail(email);
    if (!user || !user.password_hash) {
      // Don't reveal whether user exists
      logger.warn('Login attempt for non-existent or OAuth-only user', { email });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      logger.warn('Failed login attempt', { email, userId: user.id });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if password hash needs upgrade
    const needsRehash = await checkNeedsRehash(user.password_hash);
    if (needsRehash) {
      // Rehash password with current cost factor
      const newHash = await hashPassword(password);
      await db.updateUser(user.id, { password_hash: newHash } as any);
      logger.info('Password hash upgraded to current cost factor', { userId: user.id });
    }

    // Generate JWT token
    const jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtToken = jwt.sign(jwtPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string | number,
    } as jwt.SignOptions);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    // Create session in database
    await db.createSession(user.id, jwtToken, expiresAt);

    logger.info('User logged in with password successfully', { userId: user.id, email });

    // Return token
    res.json({
      token: jwtToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        tenantId: user.tenant_id,
      },
    });
  } catch (error) {
    logger.error('Password authentication error', {
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware for password registration/creation
 * Allows users to set password as backup authentication method
 */
export async function registerPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Password does not meet requirements',
        requirements: validation.errors,
      });
      return;
    }

    // Check if user already exists
    let user = await db.findUserByEmail(email);
    if (user) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with password
    user = await db.createUser(email, null, email.split('@')[0], hashedPassword);

    logger.info('User registered with password', { userId: user.id, email });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Password registration error', {
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * Middleware for password change
 * Allows authenticated users to change their password
 */
export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    // Fetch user with password hash
    const user = await db.findUserById(req.user.id);
    if (!user || !user.password_hash) {
      res.status(400).json({ error: 'Password authentication not enabled for this account' });
      return;
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      logger.warn('Failed password change attempt', { userId: user.id });
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Validate new password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      res.status(400).json({
        error: 'New password does not meet requirements',
        requirements: validation.errors,
      });
      return;
    }

    // Prevent password reuse
    if (await verifyPassword(newPassword, user.password_hash)) {
      res.status(400).json({ error: 'New password cannot be the same as current password' });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.updateUser(user.id, { password_hash: hashedPassword } as any);

    logger.info('Password changed successfully', { userId: user.id });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Password change error', {
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({ error: 'Password change failed' });
  }
}

/**
 * Validate bcrypt configuration on startup
 */
export function validateBcryptConfig(): void {
  if (BCRYPT_ROUNDS < 13) {
    throw new Error(
      `CRITICAL: bcrypt cost factor is ${BCRYPT_ROUNDS}, must be at least 13 for FedRAMP/SOC 2 compliance`
    );
  }

  console.log('✅ bcrypt configured with cost factor:', BCRYPT_ROUNDS);
  console.log('   - Iterations:', Math.pow(2, BCRYPT_ROUNDS).toLocaleString());
  console.log('   - Estimated time per hash: ~100-200ms');
  console.log('   - Password requirements: 12+ chars, uppercase, lowercase, numbers, special chars');
}

// Export constants for testing
export const __testing__ = {
  BCRYPT_ROUNDS,
  PASSWORD_REQUIREMENTS,
  checkNeedsRehash,
};
