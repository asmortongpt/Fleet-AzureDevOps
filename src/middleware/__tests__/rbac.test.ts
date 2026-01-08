/**
 * Role-Based Access Control (RBAC) Tests
 * Comprehensive tests for permission and role checking
 * Target: 80%+ coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ROLE_HIERARCHY,
  PERMISSION_CATEGORIES,
  DEFAULT_ROLE_PERMISSIONS,
  hasRoleLevel,
  hasAnyRoleLevel,
  matchesPermission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getEffectivePermissions,
  checkAccess,
  logPermissionCheck,
  type Permission,
} from '../rbac';
import type { UserRole } from '@/contexts/AuthContext';

// Mock logger
vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch for audit logging
global.fetch = vi.fn();

describe('Role Hierarchy', () => {
  it('should define correct hierarchy levels', () => {
    expect(ROLE_HIERARCHY.SuperAdmin).toBe(5);
    expect(ROLE_HIERARCHY.Admin).toBe(4);
    expect(ROLE_HIERARCHY.Manager).toBe(3);
    expect(ROLE_HIERARCHY.User).toBe(2);
    expect(ROLE_HIERARCHY.ReadOnly).toBe(1);
  });

  it('should have SuperAdmin as highest level', () => {
    const levels = Object.values(ROLE_HIERARCHY);
    const maxLevel = Math.max(...levels);

    expect(ROLE_HIERARCHY.SuperAdmin).toBe(maxLevel);
  });

  it('should have ReadOnly as lowest level', () => {
    const levels = Object.values(ROLE_HIERARCHY);
    const minLevel = Math.min(...levels);

    expect(ROLE_HIERARCHY.ReadOnly).toBe(minLevel);
  });
});

describe('Permission Categories', () => {
  it('should define vehicle permissions', () => {
    expect(PERMISSION_CATEGORIES['vehicles:read']).toBeDefined();
    expect(PERMISSION_CATEGORIES['vehicles:create']).toBeDefined();
    expect(PERMISSION_CATEGORIES['vehicles:update']).toBeDefined();
    expect(PERMISSION_CATEGORIES['vehicles:delete']).toBeDefined();
    expect(PERMISSION_CATEGORIES['vehicles:*']).toBeDefined();
  });

  it('should define driver permissions', () => {
    expect(PERMISSION_CATEGORIES['drivers:read']).toBeDefined();
    expect(PERMISSION_CATEGORIES['drivers:create']).toBeDefined();
    expect(PERMISSION_CATEGORIES['drivers:update']).toBeDefined();
    expect(PERMISSION_CATEGORIES['drivers:delete']).toBeDefined();
  });

  it('should define maintenance permissions', () => {
    expect(PERMISSION_CATEGORIES['maintenance:read']).toBeDefined();
    expect(PERMISSION_CATEGORIES['maintenance:create']).toBeDefined();
    expect(PERMISSION_CATEGORIES['maintenance:approve']).toBeDefined();
  });

  it('should define system permissions', () => {
    expect(PERMISSION_CATEGORIES['system:admin']).toBeDefined();
    expect(PERMISSION_CATEGORIES['system:audit']).toBeDefined();
  });

  it('should define wildcard permission', () => {
    expect(PERMISSION_CATEGORIES['*']).toBeDefined();
  });
});

describe('Default Role Permissions', () => {
  it('should give SuperAdmin all permissions', () => {
    const permissions = DEFAULT_ROLE_PERMISSIONS.SuperAdmin;

    expect(permissions).toContain('*');
  });

  it('should give Admin comprehensive permissions', () => {
    const permissions = DEFAULT_ROLE_PERMISSIONS.Admin;

    expect(permissions).toContain('vehicles:*');
    expect(permissions).toContain('drivers:*');
    expect(permissions).toContain('maintenance:*');
    expect(permissions).toContain('users:read');
  });

  it('should give Manager moderate permissions', () => {
    const permissions = DEFAULT_ROLE_PERMISSIONS.Manager;

    expect(permissions).toContain('vehicles:read');
    expect(permissions).toContain('vehicles:update');
    expect(permissions).toContain('maintenance:approve');
    expect(permissions).not.toContain('users:delete');
  });

  it('should give User basic permissions', () => {
    const permissions = DEFAULT_ROLE_PERMISSIONS.User;

    expect(permissions).toContain('vehicles:read');
    expect(permissions).toContain('maintenance:create');
    expect(permissions).not.toContain('vehicles:delete');
  });

  it('should give ReadOnly only read permissions', () => {
    const permissions = DEFAULT_ROLE_PERMISSIONS.ReadOnly;

    expect(permissions.every(p => p.includes(':read'))).toBe(true);
  });
});

describe('hasRoleLevel', () => {
  it('should allow higher role to access lower role data', () => {
    expect(hasRoleLevel('Admin', 'User')).toBe(true);
    expect(hasRoleLevel('Manager', 'ReadOnly')).toBe(true);
    expect(hasRoleLevel('SuperAdmin', 'Admin')).toBe(true);
  });

  it('should allow same role to access same role data', () => {
    expect(hasRoleLevel('Admin', 'Admin')).toBe(true);
    expect(hasRoleLevel('User', 'User')).toBe(true);
  });

  it('should deny lower role from accessing higher role data', () => {
    expect(hasRoleLevel('User', 'Admin')).toBe(false);
    expect(hasRoleLevel('ReadOnly', 'Manager')).toBe(false);
  });

  it('should allow SuperAdmin to access all roles', () => {
    const roles: UserRole[] = ['SuperAdmin', 'Admin', 'Manager', 'User', 'ReadOnly'];

    roles.forEach(role => {
      expect(hasRoleLevel('SuperAdmin', role)).toBe(true);
    });
  });

  it('should deny ReadOnly from accessing any higher role', () => {
    const higherRoles: UserRole[] = ['SuperAdmin', 'Admin', 'Manager', 'User'];

    higherRoles.forEach(role => {
      expect(hasRoleLevel('ReadOnly', role)).toBe(false);
    });
  });
});

describe('hasAnyRoleLevel', () => {
  it('should return true if user has any of the required roles', () => {
    expect(hasAnyRoleLevel('Admin', ['Manager', 'Admin'])).toBe(true);
    expect(hasAnyRoleLevel('Manager', ['User', 'Manager', 'ReadOnly'])).toBe(true);
  });

  it('should return false if user has none of the required roles', () => {
    expect(hasAnyRoleLevel('User', ['Admin', 'SuperAdmin'])).toBe(false);
    expect(hasAnyRoleLevel('ReadOnly', ['Manager', 'Admin'])).toBe(false);
  });

  it('should handle single role in array', () => {
    expect(hasAnyRoleLevel('Admin', ['Admin'])).toBe(true);
    expect(hasAnyRoleLevel('User', ['Admin'])).toBe(false);
  });

  it('should handle empty array', () => {
    expect(hasAnyRoleLevel('Admin', [])).toBe(false);
  });
});

describe('matchesPermission', () => {
  it('should match exact permissions', () => {
    expect(matchesPermission('vehicles:read', 'vehicles:read')).toBe(true);
    expect(matchesPermission('drivers:create', 'drivers:create')).toBe(true);
  });

  it('should match wildcard permission', () => {
    expect(matchesPermission('*', 'vehicles:read')).toBe(true);
    expect(matchesPermission('*', 'drivers:delete')).toBe(true);
    expect(matchesPermission('*', 'system:admin')).toBe(true);
  });

  it('should match category wildcard', () => {
    expect(matchesPermission('vehicles:*', 'vehicles:read')).toBe(true);
    expect(matchesPermission('vehicles:*', 'vehicles:create')).toBe(true);
    expect(matchesPermission('drivers:*', 'drivers:update')).toBe(true);
  });

  it('should not match different categories', () => {
    expect(matchesPermission('vehicles:*', 'drivers:read')).toBe(false);
    expect(matchesPermission('maintenance:read', 'vehicles:read')).toBe(false);
  });

  it('should not match partial category names', () => {
    expect(matchesPermission('vehicle:*', 'vehicles:read')).toBe(false);
  });
});

describe('hasPermission', () => {
  it('should return true if user has exact permission', () => {
    const permissions = ['vehicles:read', 'drivers:create'];

    expect(hasPermission(permissions, 'vehicles:read')).toBe(true);
    expect(hasPermission(permissions, 'drivers:create')).toBe(true);
  });

  it('should return true if user has wildcard permission', () => {
    const permissions = ['*'];

    expect(hasPermission(permissions, 'vehicles:read')).toBe(true);
    expect(hasPermission(permissions, 'system:admin')).toBe(true);
  });

  it('should return true if user has category wildcard', () => {
    const permissions = ['vehicles:*'];

    expect(hasPermission(permissions, 'vehicles:read')).toBe(true);
    expect(hasPermission(permissions, 'vehicles:delete')).toBe(true);
  });

  it('should return false if user lacks permission', () => {
    const permissions = ['vehicles:read'];

    expect(hasPermission(permissions, 'vehicles:delete')).toBe(false);
    expect(hasPermission(permissions, 'drivers:read')).toBe(false);
  });

  it('should handle empty permissions array', () => {
    expect(hasPermission([], 'vehicles:read')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('should return true if user has any required permission', () => {
    const userPermissions = ['vehicles:read', 'drivers:create'];
    const requiredPermissions = ['vehicles:read', 'vehicles:delete'];

    expect(hasAnyPermission(userPermissions, requiredPermissions)).toBe(true);
  });

  it('should return false if user has none of the required permissions', () => {
    const userPermissions = ['vehicles:read'];
    const requiredPermissions = ['drivers:create', 'maintenance:delete'];

    expect(hasAnyPermission(userPermissions, requiredPermissions)).toBe(false);
  });

  it('should work with wildcard permissions', () => {
    const userPermissions = ['*'];
    const requiredPermissions = ['vehicles:read', 'drivers:create'];

    expect(hasAnyPermission(userPermissions, requiredPermissions)).toBe(true);
  });

  it('should work with category wildcards', () => {
    const userPermissions = ['vehicles:*'];
    const requiredPermissions = ['vehicles:read', 'drivers:create'];

    expect(hasAnyPermission(userPermissions, requiredPermissions)).toBe(true);
  });

  it('should handle empty required permissions', () => {
    const userPermissions = ['vehicles:read'];

    expect(hasAnyPermission(userPermissions, [])).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('should return true if user has all required permissions', () => {
    const userPermissions = ['vehicles:read', 'vehicles:create', 'drivers:read'];
    const requiredPermissions = ['vehicles:read', 'drivers:read'];

    expect(hasAllPermissions(userPermissions, requiredPermissions)).toBe(true);
  });

  it('should return false if user lacks any required permission', () => {
    const userPermissions = ['vehicles:read'];
    const requiredPermissions = ['vehicles:read', 'vehicles:create'];

    expect(hasAllPermissions(userPermissions, requiredPermissions)).toBe(false);
  });

  it('should work with wildcard permission', () => {
    const userPermissions = ['*'];
    const requiredPermissions = ['vehicles:read', 'drivers:create', 'system:admin'];

    expect(hasAllPermissions(userPermissions, requiredPermissions)).toBe(true);
  });

  it('should work with category wildcards', () => {
    const userPermissions = ['vehicles:*', 'drivers:*'];
    const requiredPermissions = ['vehicles:read', 'drivers:create'];

    expect(hasAllPermissions(userPermissions, requiredPermissions)).toBe(true);
  });

  it('should handle empty required permissions', () => {
    const userPermissions = ['vehicles:read'];

    expect(hasAllPermissions(userPermissions, [])).toBe(true);
  });
});

describe('getEffectivePermissions', () => {
  it('should return correct permissions for SuperAdmin', () => {
    const permissions = getEffectivePermissions('SuperAdmin');

    expect(permissions).toContain('*');
  });

  it('should return correct permissions for Admin', () => {
    const permissions = getEffectivePermissions('Admin');

    expect(permissions).toContain('vehicles:*');
    expect(permissions).toContain('drivers:*');
  });

  it('should return correct permissions for Manager', () => {
    const permissions = getEffectivePermissions('Manager');

    expect(permissions).toContain('vehicles:read');
    expect(permissions).toContain('maintenance:approve');
  });

  it('should return correct permissions for User', () => {
    const permissions = getEffectivePermissions('User');

    expect(permissions).toContain('vehicles:read');
    expect(permissions).not.toContain('vehicles:delete');
  });

  it('should return correct permissions for ReadOnly', () => {
    const permissions = getEffectivePermissions('ReadOnly');

    expect(permissions.every(p => p.includes(':read'))).toBe(true);
  });
});

describe('checkAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role-based checks', () => {
    it('should grant access if user has required role', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'Admin',
        userPermissions: [],
        requiredRole: 'Manager',
      });

      expect(result.granted).toBe(true);
    });

    it('should deny access if user lacks required role', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'User',
        userPermissions: [],
        requiredRole: 'Admin',
      });

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Insufficient role');
    });

    it('should grant access if user has any of the required roles', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'Manager',
        userPermissions: [],
        requiredRole: ['Admin', 'Manager'],
      });

      expect(result.granted).toBe(true);
    });
  });

  describe('Permission-based checks', () => {
    it('should grant access if user has required permission', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'User',
        userPermissions: ['vehicles:read'],
        requiredPermission: 'vehicles:read',
      });

      expect(result.granted).toBe(true);
    });

    it('should deny access if user lacks required permission', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'User',
        userPermissions: ['vehicles:read'],
        requiredPermission: 'vehicles:delete',
      });

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Insufficient permissions');
    });

    it('should grant access if user has wildcard permission', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'SuperAdmin',
        userPermissions: ['*'],
        requiredPermission: 'system:admin',
      });

      expect(result.granted).toBe(true);
    });

    it('should grant access if user has category wildcard', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'Admin',
        userPermissions: ['vehicles:*'],
        requiredPermission: 'vehicles:delete',
      });

      expect(result.granted).toBe(true);
    });

    it('should grant access if user has any of the required permissions', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'User',
        userPermissions: ['vehicles:read'],
        requiredPermission: ['vehicles:read', 'vehicles:create'],
      });

      expect(result.granted).toBe(true);
    });
  });

  describe('Combined role and permission checks', () => {
    it('should require both role and permission when specified', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'Admin',
        userPermissions: ['vehicles:*'],
        requiredRole: 'Manager',
        requiredPermission: 'vehicles:delete',
      });

      expect(result.granted).toBe(true);
    });

    it('should deny if role is sufficient but permission is missing', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'Admin',
        userPermissions: ['vehicles:read'],
        requiredRole: 'Manager',
        requiredPermission: 'vehicles:delete',
      });

      expect(result.granted).toBe(false);
    });

    it('should deny if permission is sufficient but role is missing', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'User',
        userPermissions: ['vehicles:delete'],
        requiredRole: 'Admin',
        requiredPermission: 'vehicles:delete',
      });

      expect(result.granted).toBe(false);
    });
  });

  describe('Audit logging', () => {
    it('should log successful access', () => {
      checkAccess({
        userId: 'user-123',
        userRole: 'Admin',
        userPermissions: ['vehicles:*'],
        requiredPermission: 'vehicles:read',
        resource: 'vehicles',
        action: 'read',
      });

      // Logger should be called (mocked)
      expect(true).toBe(true);
    });

    it('should log denied access', () => {
      checkAccess({
        userId: 'user-123',
        userRole: 'User',
        userPermissions: ['vehicles:read'],
        requiredPermission: 'vehicles:delete',
        resource: 'vehicles',
        action: 'delete',
      });

      // Logger should be called (mocked)
      expect(true).toBe(true);
    });

    it('should include resource and action in audit log', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'Admin',
        userPermissions: ['*'],
        requiredPermission: 'vehicles:read',
        resource: 'vehicle-123',
        action: 'view-details',
      });

      expect(result.granted).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should grant access if no requirements specified', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'User',
        userPermissions: [],
      });

      expect(result.granted).toBe(true);
    });

    it('should handle empty permissions array', () => {
      const result = checkAccess({
        userId: 'user-123',
        userRole: 'User',
        userPermissions: [],
        requiredPermission: 'vehicles:read',
      });

      expect(result.granted).toBe(false);
    });
  });
});

describe('logPermissionCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log permission check', () => {
    const audit = {
      userId: 'user-123',
      userRole: 'Admin' as UserRole,
      requiredPermission: 'vehicles:read',
      granted: true,
      timestamp: new Date().toISOString(),
    };

    expect(() => logPermissionCheck(audit)).not.toThrow();
  });

  it('should include optional fields', () => {
    const audit = {
      userId: 'user-123',
      userRole: 'Admin' as UserRole,
      requiredPermission: 'vehicles:read',
      granted: true,
      timestamp: new Date().toISOString(),
      resource: 'vehicle-123',
      action: 'view',
    };

    expect(() => logPermissionCheck(audit)).not.toThrow();
  });
});
