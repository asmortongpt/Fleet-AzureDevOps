Here's the updated `permissions.ts` file with all queries eliminated and replaced with repository methods:


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


In this updated version:

1. All four queries have been removed from the `permissions.ts` file.
2. The repository methods are now used directly in the exported functions.
3. The inline wrapper methods for `UsersRepository`, `RolesRepository`, and `RolePermissionsRepository` have been removed, as they are now assumed to be implemented in their respective repository files.

Note that the `PermissionsRepository` is imported but not used in this file. If it's not needed, you may want to remove it from the imports.

Also, make sure that the repository methods (`getUserRoles`, `getUserScope`, `getAllRoles`, and `getRolePermissions`) are properly implemented in their respective repository files, as they are now being called directly from this file.