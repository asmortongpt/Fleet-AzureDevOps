import { PolicyRepository } from '../repositories/policy.repository';
import { UserRepository } from '../repositories/user.repository';
import { GroupRepository } from '../repositories/group.repository';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { PolicyUserRepository } from '../repositories/policyUser.repository';
import { PolicyGroupRepository } from '../repositories/policyGroup.repository';
import { PolicyRoleRepository } from '../repositories/policyRole.repository';
import { PolicyPermissionRepository } from '../repositories/policyPermission.repository';

const policyRepository = new PolicyRepository();
const userRepository = new UserRepository();
const groupRepository = new GroupRepository();
const roleRepository = new RoleRepository();
const permissionRepository = new PermissionRepository();
const policyUserRepository = new PolicyUserRepository();
const policyGroupRepository = new PolicyGroupRepository();
const policyRoleRepository = new PolicyRoleRepository();
const policyPermissionRepository = new PolicyPermissionRepository();

export const getPolicies = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { limit = 10, offset = 0 } = req.query;

  try {
    const [policies, totalCount] = await policyRepository.getPolicies(tenantId, limit, offset);
    res.json({ policies, totalCount });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId } = req.params;

  try {
    const policy = await policyRepository.getPolicyById(policyId, tenantId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { name, description, enabled } = req.body;

  try {
    const policy = await policyRepository.createPolicy(tenantId, name, description, enabled);
    res.status(201).json(policy);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updatePolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId } = req.params;
  const { name, description, enabled } = req.body;

  try {
    const policy = await policyRepository.updatePolicy(policyId, tenantId, name, description, enabled);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deletePolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId } = req.params;

  try {
    const deletedPolicyId = await policyRepository.deletePolicy(policyId, tenantId);
    if (!deletedPolicyId) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPolicyUsers = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId } = req.params;

  try {
    const policyUsers = await policyUserRepository.getPolicyUsers(policyId, tenantId);
    const userIds = policyUsers.map(pu => pu.user_id);
    const users = await userRepository.getUsersByIds(userIds, tenantId);
    res.json(users);
  } catch (error) {
    console.error('Error fetching policy users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addUserToPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId, userId } = req.params;

  try {
    const policy = await policyRepository.getPolicyById(policyId, tenantId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const user = await userRepository.getUserById(userId, tenantId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await policyUserRepository.addUserToPolicy(policyId, userId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error adding user to policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const removeUserFromPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId, userId } = req.params;

  try {
    const policy = await policyRepository.getPolicyById(policyId, tenantId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const user = await userRepository.getUserById(userId, tenantId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await policyUserRepository.removeUserFromPolicy(policyId, userId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing user from policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPolicyGroups = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId } = req.params;

  try {
    const policyGroups = await policyGroupRepository.getPolicyGroups(policyId, tenantId);
    const groupIds = policyGroups.map(pg => pg.group_id);
    const groups = await groupRepository.getGroupsByIds(groupIds, tenantId);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching policy groups:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addGroupToPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId, groupId } = req.params;

  try {
    const policy = await policyRepository.getPolicyById(policyId, tenantId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const group = await groupRepository.getGroupById(groupId, tenantId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await policyGroupRepository.addGroupToPolicy(policyId, groupId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error adding group to policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const removeGroupFromPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId, groupId } = req.params;

  try {
    const policy = await policyRepository.getPolicyById(policyId, tenantId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const group = await groupRepository.getGroupById(groupId, tenantId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await policyGroupRepository.removeGroupFromPolicy(policyId, groupId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing group from policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPolicyRoles = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId } = req.params;

  try {
    const policyRoles = await policyRoleRepository.getPolicyRoles(policyId, tenantId);
    const roleIds = policyRoles.map(pr => pr.role_id);
    const roles = await roleRepository.getRolesByIds(roleIds, tenantId);
    res.json(roles);
  } catch (error) {
    console.error('Error fetching policy roles:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addRoleToPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId, roleId } = req.params;

  try {
    const policy = await policyRepository.getPolicyById(policyId, tenantId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const role = await roleRepository.getRoleById(roleId, tenantId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await policyRoleRepository.addRoleToPolicy(policyId, roleId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error adding role to policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const removeRoleFromPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId, roleId } = req.params;

  try {
    const policy = await policyRepository.getPolicyById(policyId, tenantId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const role = await roleRepository.getRoleById(roleId, tenantId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await policyRoleRepository.removeRoleFromPolicy(policyId, roleId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing role from policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPolicyPermissions = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId } = req.params;

  try {
    const policyPermissions = await policyPermissionRepository.getPolicyPermissions(policyId, tenantId);
    const permissionIds = policyPermissions.map(pp => pp.permission_id);
    const permissions = await permissionRepository.getPermissionsByIds(permissionIds, tenantId);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching policy permissions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addPermissionToPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId, permissionId } = req.params;

  try {
    const policy = await policyRepository.getPolicyById(policyId, tenantId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const permission = await permissionRepository.getPermissionById(permissionId, tenantId);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    await policyPermissionRepository.addPermissionToPolicy(policyId, permissionId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error adding permission to policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const removePermissionFromPolicy = async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { policyId, permissionId } = req.params;

  try {
    const policy = await policyRepository.getPolicyById(policyId, tenantId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const permission = await permissionRepository.getPermissionById(permissionId, tenantId);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    await policyPermissionRepository.removePermissionFromPolicy(policyId, permissionId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing permission from policy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};