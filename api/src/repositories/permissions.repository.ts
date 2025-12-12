import { BaseRepository } from '../repositories/BaseRepository';

/**
 * Permissions Repository
 * Handles RBAC permissions and role-based access control
 *
 * Security:
 * - All queries use parameterized statements ($1, $2, $3)
 * - No string concatenation in SQL
 * - Validates permission checks and enforces role hierarchy
 */

import { Pool } from 'pg';

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  level: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  is_active: boolean;
  expires_at?: Date;
  assigned_by?: number;
  assigned_at: Date;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: Date;
}

export class PermissionsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  // ============================================================================
  // PERMISSION OPERATIONS
  // ============================================================================

  /**
   * Find all permissions
   */
  async findAllPermissions(): Promise<Permission[]> {
    const result = await this.pool.query(
      'SELECT id, tenant_id, created_at, updated_at FROM permissions WHERE is_active = true ORDER BY resource, action'
    );
    return result.rows;
  }

  /**
   * Find permission by ID
   */
  async findPermissionById(id: number): Promise<Permission | null> {
    const result = await this.pool.query(
      'SELECT id, tenant_id, created_at, updated_at FROM permissions WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find permission by name
   */
  async findPermissionByName(name: string): Promise<Permission | null> {
    const result = await this.pool.query(
      'SELECT id, tenant_id, created_at, updated_at FROM permissions WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * Find permissions by resource
   */
  async findPermissionsByResource(resource: string): Promise<Permission[]> {
    const result = await this.pool.query(
      'SELECT id, tenant_id, created_at, updated_at FROM permissions WHERE resource = $1 AND is_active = true ORDER BY action',
      [resource]
    );
    return result.rows;
  }

  /**
   * Create new permission
   */
  async createPermission(data: Omit<Permission, 'id' | 'created_at' | 'updated_at'>): Promise<Permission> {
    const result = await this.pool.query(
      `INSERT INTO permissions (name, resource, action, description, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.name,
        data.resource,
        data.action,
        data.description || null,
        data.is_active !== undefined ? data.is_active : true
      ]
    );
    return result.rows[0];
  }

  /**
   * Update permission
   */
  async updatePermission(id: number, data: Partial<Omit<Permission, 'id' | 'created_at'>>): Promise<Permission | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.resource !== undefined) {
      fields.push(`resource = $${paramIndex++}`);
      values.push(data.resource);
    }
    if (data.action !== undefined) {
      fields.push(`action = $${paramIndex++}`);
      values.push(data.action);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      return this.findPermissionById(id);
    }

    values.push(id);

    const result = await this.pool.query(
      `UPDATE permissions SET ${fields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete permission
   */
  async deletePermission(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM permissions WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============================================================================
  // ROLE OPERATIONS
  // ============================================================================

  /**
   * Find all roles
   */
  async findAllRoles(): Promise<Role[]> {
    const result = await this.pool.query(
      'SELECT id, tenant_id, created_at, updated_at FROM roles WHERE is_active = true ORDER BY level DESC'
    );
    return result.rows;
  }

  /**
   * Find role by ID
   */
  async findRoleById(id: number): Promise<Role | null> {
    const result = await this.pool.query(
      'SELECT id, tenant_id, created_at, updated_at FROM roles WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find role by name
   */
  async findRoleByName(name: string): Promise<Role | null> {
    const result = await this.pool.query(
      'SELECT id, tenant_id, created_at, updated_at FROM roles WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }

  // ============================================================================
  // USER ROLE OPERATIONS
  // ============================================================================

  /**
   * Get user's roles
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    const result = await this.pool.query(
      `SELECT r.*
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1
         AND ur.is_active = true
         AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
       ORDER BY r.level DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get user's effective role (highest level)
   */
  async getUserEffectiveRole(userId: number): Promise<string> {
    const result = await this.pool.query(
      'SELECT get_user_effective_role($1) as role',
      [userId]
    );
    return result.rows[0]?.role || 'guest';
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: number, roleId: number, assignedBy?: number, expiresAt?: Date): Promise<UserRole> {
    const result = await this.pool.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (user_id, role_id) DO UPDATE
       SET is_active = true, assigned_by = $3, expires_at = $4, assigned_at = NOW()
       RETURNING *`,
      [userId, roleId, assignedBy || null, expiresAt || null]
    );
    return result.rows[0];
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Deactivate user role
   */
  async deactivateUserRole(userId: number, roleId: number): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE user_roles SET is_active = false WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============================================================================
  // PERMISSION CHECK OPERATIONS
  // ============================================================================

  /**
   * Check if user has specific permission
   */
  async userHasPermission(userId: number, permissionName: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT user_has_permission($1, $2) as has_permission',
      [userId, permissionName]
    );
    return result.rows[0]?.has_permission || false;
  }

  /**
   * Get all user permissions
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT p.*
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1
         AND ur.is_active = true
         AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
         AND p.is_active = true
       ORDER BY p.resource, p.action`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const result = await this.pool.query(
      `SELECT p.*
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1 AND p.is_active = true
       ORDER BY p.resource, p.action`,
      [roleId]
    );
    return result.rows;
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission> {
    const result = await this.pool.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES ($1, $2)
       ON CONFLICT (role_id, permission_id) DO NOTHING
       RETURNING *`,
      [roleId, permissionId]
    );
    return result.rows[0];
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============================================================================
  // AUDIT OPERATIONS
  // ============================================================================

  /**
   * Log authorization failure
   */
  async logAuthorizationFailure(data: {
    userId: number;
    tenantId?: string;
    action: string;
    reason: string;
    requiredRoles?: string[];
    userRole?: string;
    requiredPermissions?: string[];
    userPermissions?: string[];
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO authorization_audit_log
       (user_id, tenant_id, action, reason, required_roles, user_role,
        required_permissions, user_permissions, resource_type, resource_id,
        ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        data.userId,
        data.tenantId || null,
        data.action,
        data.reason,
        data.requiredRoles ? JSON.stringify(data.requiredRoles) : null,
        data.userRole || null,
        data.requiredPermissions ? JSON.stringify(data.requiredPermissions) : null,
        data.userPermissions ? JSON.stringify(data.userPermissions) : null,
        data.resourceType || null,
        data.resourceId || null,
        data.ipAddress || null,
        data.userAgent || null
      ]
    );
  }

  /**
   * Get authorization failures for a user
   */
  async getUserAuthorizationFailures(userId: number, since?: Date): Promise<any[]> {
    const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const result = await this.pool.query(
      `SELECT id, tenant_id, created_at, updated_at FROM authorization_audit_log
       WHERE user_id = $1 AND created_at > $2
       ORDER BY created_at DESC`,
      [userId, sinceDate]
    );
    return result.rows;
  }

  /**
   * Get recent authorization failures summary
   */
  async getRecentAuthorizationFailures(limit: number = 100): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, tenant_id, created_at, updated_at FROM v_authorization_failures LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}
