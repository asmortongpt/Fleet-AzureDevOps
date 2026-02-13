/**
 * PRODUCTION-READY AUTHENTICATION & AUTHORIZATION
 * JWT-based authentication with bcrypt password hashing and RBAC
 */

import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { db } from '../db/connection';
import { schema } from '../schemas/production.schema';
import { logger } from '../utils/logger';


// ============================================================================
// JWT TOKEN GENERATION & VERIFICATION
// ============================================================================

export interface ProductionTokenPayload {
  id: string;
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

// Note: Express Request.user type is extended in auth.middleware.ts
// to avoid duplicate declarations across middleware files

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable must be set in production');
}
const JWT_SECRET_RESOLVED = JWT_SECRET || 'dev-jwt-secret-' + process.pid;
const BCRYPT_ROUNDS = 12; // Cost factor for bcrypt (FedRAMP compliant)

// ============================================================================
// PASSWORD HASHING
// ============================================================================

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (payload: ProductionTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET_RESOLVED, {
    expiresIn: '24h',
    issuer: 'fleet-api',
    audience: 'fleet-app',
  });
};

export const verifyToken = (token: string): ProductionTokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET_RESOLVED, {
      issuer: 'fleet-api',
      audience: 'fleet-app',
    }) as ProductionTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to authenticate requests using JWT
 * Validates token and attaches user info to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);

    // Verify user still exists and is active
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId));

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User account is inactive or does not exist' });
      return;
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Update last login time
    await db.update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// ============================================================================
// AUTHORIZATION MIDDLEWARE (RBAC)
// ============================================================================

type UserRole = 'SuperAdmin' | 'Admin' | 'Manager' | 'Supervisor' | 'Driver' | 'Dispatcher' | 'Mechanic' | 'Viewer';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SuperAdmin: 100,
  Admin: 80,
  Manager: 60,
  Supervisor: 50,
  Dispatcher: 40,
  Mechanic: 30,
  Driver: 20,
  Viewer: 10,
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SuperAdmin: ['*'], // All permissions
  Admin: [
    'vehicles:*',
    'drivers:*',
    'maintenance:*',
    'fuel:*',
    'routes:*',
    'reports:*',
    'analytics:*',
    'users:read',
    'users:create',
    'users:update',
  ],
  Manager: [
    'vehicles:read',
    'vehicles:create',
    'vehicles:update',
    'drivers:read',
    'drivers:create',
    'drivers:update',
    'maintenance:*',
    'fuel:*',
    'routes:*',
    'reports:*',
    'analytics:read',
  ],
  Supervisor: [
    'vehicles:read',
    'drivers:read',
    'maintenance:read',
    'maintenance:create',
    'fuel:read',
    'routes:read',
    'routes:create',
    'reports:read',
  ],
  Dispatcher: [
    'vehicles:read',
    'drivers:read',
    'routes:*',
    'gps:read',
    'gps:create',
  ],
  Mechanic: [
    'vehicles:read',
    'maintenance:*',
    'parts:*',
    'work-orders:*',
  ],
  Driver: [
    'vehicles:read',
    'fuel:create',
    'gps:create',
    'inspections:create',
  ],
  Viewer: [
    'vehicles:read',
    'drivers:read',
    'reports:read',
    'analytics:read',
  ],
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (role: UserRole, permission: string): boolean => {
  const rolePerms = ROLE_PERMISSIONS[role] || [];

  // SuperAdmin has all permissions
  if (rolePerms.includes('*')) {
    return true;
  }

  // Check exact permission
  if (rolePerms.includes(permission)) {
    return true;
  }

  // Check wildcard permission (e.g., 'vehicles:*' matches 'vehicles:read')
  const [resource] = permission.split(':');
  if (rolePerms.includes(`${resource}:*`)) {
    return true;
  }

  return false;
};

/**
 * Middleware to check if user has required permissions
 * @param permission - Permission string in format 'resource:action' (e.g., 'vehicles:create')
 */
export const authorize = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userRole = req.user.role as UserRole;

      if (!hasPermission(userRole, permission)) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: permission,
          userRole,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(403).json({ error: 'Authorization failed' });
    }
  };
};

/**
 * Middleware to check if user has minimum role level
 */
export const requireRole = (minRole: UserRole) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userRole = req.user.role as UserRole;
      const userLevel = ROLE_HIERARCHY[userRole] || 0;
      const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

      if (userLevel < requiredLevel) {
        res.status(403).json({
          error: 'Insufficient role level',
          required: minRole,
          userRole,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(403).json({ error: 'Role verification failed' });
    }
  };
};

// ============================================================================
// TENANT ISOLATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to enforce tenant isolation
 * Ensures users can only access data from their own tenant
 */
export const enforceTenantIsolation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // SuperAdmin can access all tenants
    if (req.user.role === 'SuperAdmin') {
      next();
      return;
    }

    // For other roles, add tenant filter to request
    // This will be used by route handlers to filter queries
    req.tenantId = req.user.tenantId;

    next();
  } catch (error) {
    logger.error('Tenant isolation error:', error);
    res.status(500).json({ error: 'Tenant verification failed' });
  }
};

// ============================================================================
// LOGIN HANDLER
// ============================================================================

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()));

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    if (!user.passwordHash) {
      res.status(401).json({ error: 'Password authentication not configured for this user' });
      return;
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({ error: 'User account is inactive' });
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // Update last login
    await db.update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ============================================================================
// REGISTER HANDLER
// ============================================================================

export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, tenantId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Validate password strength
    if (password.length < 12) {
      res.status(400).json({ error: 'Password must be at least 12 characters long' });
      return;
    }

    // Check if user already exists
    const [existingUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()));

    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Get or validate tenant
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      const [defaultTenant] = await db.select().from(schema.tenants).limit(1);
      if (!defaultTenant) {
        res.status(500).json({ error: 'No tenant available' });
        return;
      }
      finalTenantId = defaultTenant.id;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db.insert(schema.users).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      tenantId: finalTenantId,
      role: 'Viewer', // Default role
      isActive: true,
    }).returning();

    // Generate token
    const token = generateToken({
      id: newUser.id,
      userId: newUser.id,
      tenantId: newUser.tenantId,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        tenantId: newUser.tenantId,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// ============================================================================
// USER PROFILE HANDLER
// ============================================================================

export const profileHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, req.user.id));

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
