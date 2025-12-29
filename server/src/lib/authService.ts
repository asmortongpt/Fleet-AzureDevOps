/**
 * Authentication Service
 * Provides user role and permission management
 */

import { Pool } from 'pg';
import { logger } from './logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

/**
 * Get user roles for a specific user
 */
export async function getUserRoles(userId: string | number, tenantId?: string | number): Promise<string[]> {
  try {
    const query = tenantId
      ? 'SELECT role FROM user_roles WHERE user_id = $1 AND tenant_id = $2'
      : 'SELECT role FROM user_roles WHERE user_id = $1';

    const params = tenantId ? [userId, tenantId] : [userId];
    const result = await pool.query(query, params);

    return result.rows.map(row => row.role);
  } catch (error) {
    logger.error('Error fetching user roles', { userId, tenantId, error });
    return [];
  }
}

/**
 * Get required permissions for a specific route
 */
export async function getRoutePermissions(route: string, method: string): Promise<string[]> {
  try {
    const query = 'SELECT permissions FROM route_permissions WHERE route = $1 AND method = $2';
    const result = await pool.query(query, [route, method]);

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows[0].permissions || [];
  } catch (error) {
    logger.error('Error fetching route permissions', { route, method, error });
    return [];
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  userId: string | number,
  permission: string,
  tenantId?: string | number
): Promise<boolean> {
  try {
    const roles = await getUserRoles(userId, tenantId);

    if (roles.includes('admin') || roles.includes('super_admin')) {
      return true;
    }

    const query = tenantId
      ? 'SELECT COUNT(*) FROM role_permissions WHERE role = ANY($1) AND permission = $2 AND tenant_id = $3'
      : 'SELECT COUNT(*) FROM role_permissions WHERE role = ANY($1) AND permission = $2';

    const params = tenantId ? [roles, permission, tenantId] : [roles, permission];
    const result = await pool.query(query, params);

    return parseInt(result.rows[0].count, 10) > 0;
  } catch (error) {
    logger.error('Error checking permission', { userId, permission, tenantId, error });
    return false;
  }
}
