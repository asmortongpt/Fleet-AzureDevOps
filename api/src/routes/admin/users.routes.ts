/**
 * Admin Users API Routes
 * Provides CRUD operations for user management
 *
 * SECURITY:
 * - All routes require JWT authentication
 * - RBAC enforcement (ADMIN role required)
 * - Parameterized queries only (no SQL injection)
 * - Input validation required
 */

import { Router, Request, Response } from 'express';
import { pool } from '../../db/connection';
import { authenticateJWT } from '../../middleware/auth';
import { requireRBAC, Role, PERMISSIONS } from '../../middleware/rbac';
import { asyncHandler } from '../../middleware/errorHandler';
import logger from '../../config/logger';
import { authenticateJWT } from '../middleware/auth'

const router = Router();

// All routes require authentication and admin role
router.use(authenticateJWT);
router.use(requireRBAC({
  roles: [Role.ADMIN],
  permissions: [PERMISSIONS.USERS_MANAGE],
  enforceTenantIsolation: false
}));

/**
 * GET /api/admin/users
 * Returns list of all users with filtering and pagination
 *
 * Query Params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 * - role: Filter by role
 * - status: Filter by status (active/inactive)
 * - search: Search by name or email
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     users: Array<User>,
 *     total: number,
 *     page: number,
 *     limit: number
 *   }
 * }
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching users list', { query: req.query });

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;
    const role = req.query.role as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 1;

    // Build WHERE clause
    if (role) {
      whereConditions.push(`role = $${paramCount}`);
      queryParams.push(role);
      paramCount++;
    }

    if (status) {
      if (status === 'active') {
        whereConditions.push(`is_active = true`);
      } else if (status === 'inactive') {
        whereConditions.push(`is_active = false`);
      }
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    try {
      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*)::integer as total FROM users ${whereClause}`,
        queryParams
      );

      // Get paginated users
      const usersResult = await pool.query(
        `SELECT
          id,
          name,
          email,
          role,
          department,
          is_active as status,
          last_login_at as "lastLogin",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...queryParams, limit, offset]
      );

      // Transform status to active/inactive string
      const users = usersResult.rows.map(user => ({
        ...user,
        status: user.status ? 'active' : 'inactive'
      }));

      res.json({
        success: true,
        data: {
          users,
          total: countResult.rows[0].total,
          page,
          limit,
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * GET /api/admin/users/:id
 * Returns details for a specific user
 *
 * Response:
 * {
 *   success: boolean,
 *   data: User
 * }
 */
router.get('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        timestamp: new Date().toISOString()
      });
    }

    try {
      const result = await pool.query(
        `SELECT
          id,
          name,
          email,
          role,
          department,
          is_active as status,
          last_login_at as "lastLogin",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users
        WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString()
        });
      }

      const user = {
        ...result.rows[0],
        status: result.rows[0].status ? 'active' : 'inactive'
      };

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * POST /api/admin/users
 * Creates a new user
 *
 * Body:
 * {
 *   name: string,
 *   email: string,
 *   role: string,
 *   department: string,
 *   password?: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: User
 * }
 */
router.post('/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, role, department, password } = req.body;

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, role',
        timestamp: new Date().toISOString()
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        timestamp: new Date().toISOString()
      });
    }

    // Role validation
    const validRoles = ['admin', 'manager', 'operator', 'viewer', 'driver', 'dispatcher', 'maintenance_manager', 'fleet_manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Check if email already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists',
          timestamp: new Date().toISOString()
        });
      }

      // Create user (password hashing would be done in production)
      const result = await pool.query(
        `INSERT INTO users (name, email, role, department, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        RETURNING
          id,
          name,
          email,
          role,
          department,
          is_active as status,
          last_login_at as "lastLogin",
          created_at as "createdAt",
          updated_at as "updatedAt"`,
        [name, email, role, department || '']
      );

      const newUser = {
        ...result.rows[0],
        status: result.rows[0].status ? 'active' : 'inactive'
      };

      logger.info('User created successfully', { userId: newUser.id, email });

      res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * PUT /api/admin/users/:id
 * Updates an existing user
 *
 * Body:
 * {
 *   name?: string,
 *   email?: string,
 *   role?: string,
 *   department?: string,
 *   status?: 'active' | 'inactive'
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: User
 * }
 */
router.put('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const { name, email, role, department, status } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        timestamp: new Date().toISOString()
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email !== undefined) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          timestamp: new Date().toISOString()
        });
      }
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (role !== undefined) {
      const validRoles = ['admin', 'manager', 'operator', 'viewer', 'driver', 'dispatcher', 'maintenance_manager', 'fleet_manager'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
          timestamp: new Date().toISOString()
        });
      }
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (department !== undefined) {
      updates.push(`department = $${paramCount}`);
      values.push(department);
      paramCount++;
    }

    if (status !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(status === 'active');
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        timestamp: new Date().toISOString()
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    try {
      const result = await pool.query(
        `UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING
          id,
          name,
          email,
          role,
          department,
          is_active as status,
          last_login_at as "lastLogin",
          created_at as "createdAt",
          updated_at as "updatedAt"`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString()
        });
      }

      const updatedUser = {
        ...result.rows[0],
        status: result.rows[0].status ? 'active' : 'inactive'
      };

      logger.info('User updated successfully', { userId });

      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * DELETE /api/admin/users/:id
 * Soft deletes a user (sets is_active to false)
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */
router.delete('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        timestamp: new Date().toISOString()
      });
    }

    try {
      const result = await pool.query(
        `UPDATE users
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING id`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString()
        });
      }

      logger.info('User deleted successfully', { userId });

      res.json({
        success: true,
        message: 'User deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * GET /api/admin/users/stats
 * Returns user statistics
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     total: number,
 *     active: number,
 *     byRole: object,
 *     recentSignups: number
 *   }
 * }
 */
router.get('/stats/summary',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const [totalResult, byRoleResult, recentResult] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(*)::integer as total,
            COUNT(*) FILTER (WHERE is_active = true)::integer as active
          FROM users
        `),
        pool.query(`
          SELECT
            role,
            COUNT(*)::integer as count
          FROM users
          WHERE is_active = true
          GROUP BY role
        `),
        pool.query(`
          SELECT COUNT(*)::integer as count
          FROM users
          WHERE created_at >= NOW() - INTERVAL '30 days'
        `)
      ]);

      const byRole: Record<string, number> = {};
      byRoleResult.rows.forEach(row => {
        byRole[row.role] = row.count;
      });

      res.json({
        success: true,
        data: {
          total: totalResult.rows[0].total,
          active: totalResult.rows[0].active,
          byRole,
          recentSignups: recentResult.rows[0].count
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  })
);

export default router;
