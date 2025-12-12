/**
 * Permission Repository - Repository pattern for permissions and roles
 *
 * Provides data access layer for:
 * - User roles and permissions
 * - Role management
 * - User scope and limits
 */

import { injectable } from 'inversify';
import { BaseRepository } from './base.repository';
import { pool } from '../db';

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  role_id: number;
  role_name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  expires_at: Date | null;
}

export interface UserScope {
  facility_ids: number[];
  team_driver_ids: number[];
  team_vehicle_ids: number[];
  scope_level: string;
  approval_limit: number;
}

export interface RoleWithStats extends Role {
  user_count: number;
  permission_count: number;
}

@injectable()
export class PermissionRepository extends BaseRepository<Role> {
  constructor() {
    super('roles');
  }

  /**
   * Get all active roles for a user with tenant filtering
   */
  async getUserRoles(userId: number, tenantId: number): Promise<UserRole[]> {
    const result = await pool.query(
      `SELECT r.id as role_id, r.name as role_name, r.display_name, r.description,
              ur.is_active, ur.expires_at
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1
         AND r.tenant_id = $2
         AND ur.is_active = true
         AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [userId, tenantId]
    );

    return result.rows;
  }

  /**
   * Get user scope configuration (facility access, team assignments, approval limits)
   */
  async getUserScope(userId: number, tenantId: number): Promise<UserScope | null> {
    const result = await pool.query(
      `SELECT facility_ids, team_driver_ids, team_vehicle_ids, scope_level, approval_limit
       FROM users
       WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      facility_ids: result.rows[0].facility_ids || [],
      team_driver_ids: result.rows[0].team_driver_ids || [],
      team_vehicle_ids: result.rows[0].team_vehicle_ids || [],
      scope_level: result.rows[0].scope_level || 'team',
      approval_limit: result.rows[0].approval_limit || 0,
    };
  }

  /**
   * Get all roles with user count and permission count statistics
   * Admin only - does not filter by tenant (global view)
   */
  async getAllRolesWithStats(tenantId: number): Promise<RoleWithStats[]> {
    const result = await pool.query(
      `SELECT r.*,
              COUNT(DISTINCT ur.user_id) as user_count,
              COUNT(DISTINCT rp.permission_id) as permission_count
       FROM roles r
       LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       WHERE r.tenant_id = $1
       GROUP BY r.id
       ORDER BY r.name`,
      [tenantId]
    );

    return result.rows.map(row => ({
      ...row,
      user_count: parseInt(row.user_count, 10),
      permission_count: parseInt(row.permission_count, 10),
    }));
  }

  /**
   * Check if a user has a specific permission
   * This delegates to the existing getUserPermissions middleware function
   * but can be extended to query the database directly if needed
   */
  async userHasPermission(
    userId: number,
    tenantId: number,
    permission: string
  ): Promise<boolean> {
    // Query role_permissions through user_roles
    const result = await pool.query(
      `SELECT EXISTS(
         SELECT 1
         FROM user_roles ur
         JOIN role_permissions rp ON ur.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE ur.user_id = $1
           AND ur.is_active = true
           AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
           AND p.name = $2
           AND p.tenant_id = $3
       ) as has_permission`,
      [userId, tenantId, permission]
    );

    return result.rows[0]?.has_permission || false;
  }

  /**
   * Get all permission names for a user
   */
  async getUserPermissionNames(userId: number, tenantId: number): Promise<string[]> {
    const result = await pool.query(
      `SELECT DISTINCT p.name
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1
         AND ur.is_active = true
         AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
         AND p.tenant_id = $2
       ORDER BY p.name`,
      [userId, tenantId]
    );

    return result.rows.map(row => row.name);
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(
    userId: number,
    roleId: number,
    tenantId: number,
    expiresAt?: Date
  ): Promise<void> {
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, is_active, expires_at, tenant_id)
       VALUES ($1, $2, true, $3, $4)
       ON CONFLICT (user_id, role_id)
       DO UPDATE SET is_active = true, expires_at = EXCLUDED.expires_at`,
      [userId, roleId, expiresAt || null, tenantId]
    );
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(
    userId: number,
    roleId: number,
    tenantId: number
  ): Promise<void> {
    await pool.query(
      `UPDATE user_roles
       SET is_active = false
       WHERE user_id = $1 AND role_id = $2 AND tenant_id = $3`,
      [userId, roleId, tenantId]
    );
  }
}
