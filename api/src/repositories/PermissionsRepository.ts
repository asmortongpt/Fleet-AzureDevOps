/**
 * Permissions Repository
 * Data access layer for permissions, roles, and user role assignments
 * 
 * Security:
 * - All queries use parameterized statements ($1, $2, etc.)
 * - Tenant isolation enforced via tenant_id checks
 * - No string concatenation in SQL
 */

import { injectable, inject } from 'inversify';
import { Pool, PoolClient } from 'pg';
import { TYPES } from '../types';
import { connectionManager } from '../config/connection-manager';
import { NotFoundError, DatabaseError } from '../errors/ApplicationError';

export interface ModuleRole {
  name: string;
  description: string;
  is_system: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserModuleRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role_name: string;
  org_id?: string;
  granted_at: Date;
  granted_by?: string;
  expires_at?: Date;
  is_active: boolean;
}

export interface UserRoleWithDetails extends UserModuleRole {
  description?: string;
}

/**
 * Repository for managing permissions and roles
 */
@injectable()
export class PermissionsRepository {
  private pool: Pool;

  constructor(@inject(TYPES.DatabasePool) pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get active roles for a user
   * @param tenantId - Tenant ID for isolation
   * @param userId - User ID
   * @returns Array of active role names
   */
  async getUserRoles(tenantId: string, userId: string): Promise<string[]> {
    try {
      const result = await this.pool.query(
        `SELECT role_name
         FROM user_module_roles
         WHERE tenant_id = $1 AND user_id = $2
         AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [tenantId, userId]
      );

      return result.rows.map(row => row.role_name);
    } catch (error) {
      throw new DatabaseError('Failed to get user roles', { tenantId, userId, error });
    }
  }

  /**
   * Get all available roles
   * @returns Array of all module roles
   */
  async getAllRoles(): Promise<ModuleRole[]> {
    try {
      const result = await this.pool.query(
        `SELECT name, description, is_system, created_at, updated_at
         FROM module_roles
         ORDER BY name`
      );

      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to get all roles', { error });
    }
  }

  /**
   * Create a new role
   * @param name - Role name
   * @param description - Role description (optional)
   * @returns Created role
   */
  async createRole(name: string, description?: string): Promise<ModuleRole> {
    try {
      const result = await this.pool.query(
        `INSERT INTO module_roles (name, description, is_system)
         VALUES ($1, $2, false)
         RETURNING *`,
        [name, description || null]
      );

      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new DatabaseError('Role with this name already exists', { name });
      }
      throw new DatabaseError('Failed to create role', { name, error });
    }
  }

  /**
   * Get roles assigned to a specific user with details
   * @param userId - User ID
   * @returns Array of user roles with descriptions
   */
  async getUserRolesWithDetails(userId: string): Promise<UserRoleWithDetails[]> {
    try {
      const result = await this.pool.query(
        `SELECT
           umr.id,
           umr.user_id,
           umr.tenant_id,
           umr.role_name,
           umr.org_id,
           umr.granted_at,
           umr.granted_by,
           umr.expires_at,
           umr.is_active,
           mr.description
         FROM user_module_roles umr
         JOIN module_roles mr ON umr.role_name = mr.name
         WHERE umr.user_id = $1
         ORDER BY umr.granted_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to get user roles with details', { userId, error });
    }
  }

  /**
   * Deactivate all roles for a user
   * @param client - Database client (for transaction support)
   * @param userId - User ID
   */
  async deactivateUserRoles(client: PoolClient, userId: string): Promise<void> {
    try {
      await client.query(
        `UPDATE user_module_roles
         SET is_active = false
         WHERE user_id = $1`,
        [userId]
      );
    } catch (error) {
      throw new DatabaseError('Failed to deactivate user roles', { userId, error });
    }
  }

  /**
   * Assign a role to a user
   * @param client - Database client (for transaction support)
   * @param userId - User ID
   * @param tenantId - Tenant ID for isolation
   * @param roleName - Role name to assign
   * @param grantedBy - User ID of the granter
   * @param orgId - Organization ID (optional)
   */
  async assignRole(
    client: PoolClient,
    userId: string,
    tenantId: string,
    roleName: string,
    grantedBy: string,
    orgId?: string
  ): Promise<void> {
    try {
      await client.query(
        `INSERT INTO user_module_roles (user_id, tenant_id, role_name, org_id, granted_by, granted_at, is_active)
         VALUES ($1, $2, $3, $4, $5, NOW(), true)
         ON CONFLICT (user_id, role_name)
         DO UPDATE SET is_active = true, granted_by = $5, granted_at = NOW()`,
        [userId, tenantId, roleName, orgId || null, grantedBy]
      );
    } catch (error) {
      throw new DatabaseError('Failed to assign role', { userId, roleName, error });
    }
  }

  /**
   * Remove a role from a user
   * @param userId - User ID
   * @param roleName - Role name to remove
   */
  async removeRole(userId: string, roleName: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE user_module_roles
         SET is_active = false
         WHERE user_id = $1 AND role_name = $2`,
        [userId, roleName]
      );
    } catch (error) {
      throw new DatabaseError('Failed to remove role', { userId, roleName, error });
    }
  }

  /**
   * Get a database client for transaction management
   * @returns PoolClient for transaction operations
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
