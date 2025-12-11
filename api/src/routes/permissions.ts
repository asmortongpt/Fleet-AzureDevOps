import { pool } from '../database';
import { PermissionsRepository } from '../repositories/permissions-repository';
import { UsersRepository } from '../repositories/users-repository';
import { RolesRepository } from '../repositories/roles-repository';
import { RolePermissionsRepository } from '../repositories/role-permissions-repository';

const permissionsRepository = new PermissionsRepository();
const usersRepository = new UsersRepository();
const rolesRepository = new RolesRepository();
const rolePermissionsRepository = new RolePermissionsRepository();

export async function getUserRoles(userId: number, tenantId: number): Promise<any[]> {
  return await rolesRepository.getUserRoles(userId, tenantId);
}

export async function getUserScope(userId: number, tenantId: number): Promise<any> {
  return await usersRepository.getUserScope(userId, tenantId);
}

export async function getAllRoles(tenantId: number): Promise<any[]> {
  return await rolesRepository.getAllRoles(tenantId);
}

export async function getRolePermissions(roleId: string, tenantId: number): Promise<any[]> {
  return await rolePermissionsRepository.getRolePermissions(roleId, tenantId);
}

export async function getUserPermissions(userId: number, tenantId: number): Promise<Set<string>> {
  const userRoles = await getUserRoles(userId, tenantId);
  const rolePermissions = new Set<string>();

  for (const role of userRoles) {
    const permissions = await getRolePermissions(role.id.toString(), tenantId);
    permissions.forEach(permission => rolePermissions.add(permission.name));
  }

  return rolePermissions;
}

// Inline wrapper methods to be moved to repositories later

class UsersRepository {
  async getUserScope(userId: number, tenantId: number): Promise<any> {
    const result = await pool.query(
      `SELECT facility_ids, team_driver_ids, team_vehicle_ids, scope_level, approval_limit
       FROM users 
       WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );
    return result.rows[0] || {};
  }
}

class RolesRepository {
  async getUserRoles(userId: number, tenantId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT r.id, r.name, r.display_name, r.description
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND r.tenant_id = $2
       AND ur.is_active = true
       AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [userId, tenantId]
    );
    return result.rows;
  }

  async getAllRoles(tenantId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, name, display_name, description
       FROM roles
       WHERE tenant_id = $1`,
      [tenantId]
    );
    return result.rows;
  }
}

class RolePermissionsRepository {
  async getRolePermissions(roleId: string, tenantId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT p.id, p.name, p.description
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1 AND p.tenant_id = $2`,
      [roleId, tenantId]
    );
    return result.rows;
  }
}