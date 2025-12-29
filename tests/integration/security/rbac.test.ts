/**
 * Role-Based Access Control (RBAC) Integration Tests
 *
 * FedRAMP-compliant authorization testing:
 * - Admin role permissions (all access)
 * - Viewer role permissions (read-only)
 * - Fleet-manager role permissions (operational)
 * - Permission inheritance and constraints
 * - Permission denial logging
 * - Attribute-based access control (ABAC)
 *
 * AC-2: Account Management
 * AC-3: Access Enforcement
 * AC-6: Least Privilege
 */

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import type { Role, Permission } from '@/lib/security/rbac';
import {
  ROLE_DEFINITIONS,
  hasPermission,
  getRolePermissions,
  canAccessDatasetSize,
  logPermissionCheck,
  type UserAttributes
} from '@/lib/security/rbac';

describe('Role-Based Access Control (RBAC)', () => {
  // ========================================================================
  // Setup & Teardown
  // ========================================================================

  beforeAll(() => {
    // Mock logger to capture audit logs
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Test: Admin Role - Complete Access
  // ========================================================================

  describe('Admin Role - Full Organizational Access', () => {
    it('should have all vehicle management permissions', () => {
      const adminPerms = getRolePermissions('admin');

      expect(adminPerms).toContain('vehicles.view');
      expect(adminPerms).toContain('vehicles.create');
      expect(adminPerms).toContain('vehicles.edit');
      expect(adminPerms).toContain('vehicles.delete');
      expect(adminPerms).toContain('vehicles.assign');
    });

    it('should have all driver management permissions', () => {
      const adminPerms = getRolePermissions('admin');

      expect(adminPerms).toContain('drivers.view');
      expect(adminPerms).toContain('drivers.create');
      expect(adminPerms).toContain('drivers.edit');
      expect(adminPerms).toContain('drivers.delete');
      expect(adminPerms).toContain('drivers.certify');
    });

    it('should have all maintenance permissions', () => {
      const adminPerms = getRolePermissions('admin');

      expect(adminPerms).toContain('maintenance.view');
      expect(adminPerms).toContain('maintenance.create');
      expect(adminPerms).toContain('maintenance.approve');
      expect(adminPerms).toContain('maintenance.schedule');
      expect(adminPerms).toContain('maintenance.complete');
    });

    it('should have all work order permissions', () => {
      const adminPerms = getRolePermissions('admin');

      expect(adminPerms).toContain('workorders.view');
      expect(adminPerms).toContain('workorders.create');
      expect(adminPerms).toContain('workorders.assign');
      expect(adminPerms).toContain('workorders.approve');
      expect(adminPerms).toContain('workorders.complete');
    });

    it('should have all financial and procurement permissions', () => {
      const adminPerms = getRolePermissions('admin');

      expect(adminPerms).toContain('po.view');
      expect(adminPerms).toContain('po.create');
      expect(adminPerms).toContain('po.approve');
      expect(adminPerms).toContain('invoices.view');
      expect(adminPerms).toContain('invoices.approve');
      expect(adminPerms).toContain('invoices.pay');
      expect(adminPerms).toContain('payments.approve');
      expect(adminPerms).toContain('payments.process');
    });

    it('should have all reporting and analytics permissions', () => {
      const adminPerms = getRolePermissions('admin');

      expect(adminPerms).toContain('reports.view');
      expect(adminPerms).toContain('reports.generate');
      expect(adminPerms).toContain('reports.export');
      expect(adminPerms).toContain('reports.schedule');
    });

    it('should have all audit and compliance permissions', () => {
      const adminPerms = getRolePermissions('admin');

      expect(adminPerms).toContain('audit.view');
      expect(adminPerms).toContain('audit.export');
      expect(adminPerms).toContain('compliance.view');
      expect(adminPerms).toContain('compliance.manage');
    });

    it('should have user and role management permissions', () => {
      const adminPerms = getRolePermissions('admin');

      expect(adminPerms).toContain('users.view');
      expect(adminPerms).toContain('users.manage');
      expect(adminPerms).toContain('roles.manage');
      expect(adminPerms).toContain('settings.manage');
    });

    it('should grant permission check for admin with any permission', () => {
      const adminPerms = getRolePermissions('admin');
      const canViewVehicles = hasPermission('admin', adminPerms, 'vehicles.view');
      const canApproveInvoices = hasPermission('admin', adminPerms, 'invoices.approve');
      const canManageRoles = hasPermission('admin', adminPerms, 'roles.manage');

      expect(canViewVehicles).toBe(true);
      expect(canApproveInvoices).toBe(true);
      expect(canManageRoles).toBe(true);
    });

    it('should mark admin as non-system role', () => {
      const adminDef = ROLE_DEFINITIONS['admin'];

      expect(adminDef.isSystemRole).toBe(false);
      expect(adminDef.permissions.length).toBeGreaterThan(50);
    });
  });

  // ========================================================================
  // Test: Viewer Role - Read-Only Access
  // ========================================================================

  describe('Viewer Role - Read-Only Access', () => {
    it('should have only view permissions', () => {
      const viewerPerms = getRolePermissions('viewer');

      expect(viewerPerms).toContain('vehicles.view');
      expect(viewerPerms).toContain('drivers.view');
      expect(viewerPerms).toContain('maintenance.view');
      expect(viewerPerms).toContain('workorders.view');
      expect(viewerPerms).toContain('reports.view');
      expect(viewerPerms).toContain('gps.view');
    });

    it('should NOT have create permissions', () => {
      const viewerPerms = getRolePermissions('viewer');

      expect(viewerPerms).not.toContain('vehicles.create');
      expect(viewerPerms).not.toContain('drivers.create');
      expect(viewerPerms).not.toContain('maintenance.create');
      expect(viewerPerms).not.toContain('workorders.create');
      expect(viewerPerms).not.toContain('reports.generate');
    });

    it('should NOT have edit/delete permissions', () => {
      const viewerPerms = getRolePermissions('viewer');

      expect(viewerPerms).not.toContain('vehicles.edit');
      expect(viewerPerms).not.toContain('vehicles.delete');
      expect(viewerPerms).not.toContain('drivers.edit');
      expect(viewerPerms).not.toContain('drivers.delete');
    });

    it('should NOT have approval permissions', () => {
      const viewerPerms = getRolePermissions('viewer');

      expect(viewerPerms).not.toContain('maintenance.approve');
      expect(viewerPerms).not.toContain('workorders.approve');
      expect(viewerPerms).not.toContain('invoices.approve');
      expect(viewerPerms).not.toContain('po.approve');
    });

    it('should NOT have export permissions', () => {
      const viewerPerms = getRolePermissions('viewer');

      expect(viewerPerms).not.toContain('reports.export');
      expect(viewerPerms).not.toContain('gps.export');
      expect(viewerPerms).not.toContain('audit.export');
    });

    it('should enforce dataset size limits (1000 rows)', () => {
      const viewerDef = ROLE_DEFINITIONS['viewer'];

      expect(viewerDef.maxDatasetSize).toBe(1000);
      expect(canAccessDatasetSize('viewer', 500)).toBe(true);
      expect(canAccessDatasetSize('viewer', 1000)).toBe(true);
      expect(canAccessDatasetSize('viewer', 1001)).toBe(false);
      expect(canAccessDatasetSize('viewer', 10000)).toBe(false);
    });

    it('should have minimal permission set', () => {
      const viewerPerms = getRolePermissions('viewer');

      expect(viewerPerms.length).toBeLessThan(15);
      expect(viewerPerms.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Test: Fleet Manager Role - Operational Access
  // ========================================================================

  describe('Fleet Manager Role - Operational Permissions', () => {
    it('should have vehicle management permissions (view, edit, assign)', () => {
      const managerPerms = getRolePermissions('manager');

      expect(managerPerms).toContain('vehicles.view');
      expect(managerPerms).toContain('vehicles.edit');
      expect(managerPerms).toContain('vehicles.assign');
      // Should NOT have delete
      expect(managerPerms).not.toContain('vehicles.delete');
      // Should NOT have create
      expect(managerPerms).not.toContain('vehicles.create');
    });

    it('should have driver management permissions (view, edit, certify)', () => {
      const managerPerms = getRolePermissions('manager');

      expect(managerPerms).toContain('drivers.view');
      expect(managerPerms).toContain('drivers.edit');
      expect(managerPerms).toContain('drivers.certify');
      expect(managerPerms).not.toContain('drivers.create');
      expect(managerPerms).not.toContain('drivers.delete');
    });

    it('should have maintenance permissions (view, create, approve, schedule)', () => {
      const managerPerms = getRolePermissions('manager');

      expect(managerPerms).toContain('maintenance.view');
      expect(managerPerms).toContain('maintenance.create');
      expect(managerPerms).toContain('maintenance.approve');
      expect(managerPerms).toContain('maintenance.schedule');
      expect(managerPerms).not.toContain('maintenance.complete');
    });

    it('should have work order permissions (view, create, assign, approve)', () => {
      const managerPerms = getRolePermissions('manager');

      expect(managerPerms).toContain('workorders.view');
      expect(managerPerms).toContain('workorders.create');
      expect(managerPerms).toContain('workorders.assign');
      expect(managerPerms).toContain('workorders.approve');
      expect(managerPerms).not.toContain('workorders.complete');
    });

    it('should have parts and procurement permissions', () => {
      const managerPerms = getRolePermissions('manager');

      expect(managerPerms).toContain('parts.view');
      expect(managerPerms).toContain('parts.order');
      expect(managerPerms).toContain('po.view');
      expect(managerPerms).toContain('po.create');
      expect(managerPerms).toContain('po.approve');
    });

    it('should have reporting and compliance permissions', () => {
      const managerPerms = getRolePermissions('manager');

      expect(managerPerms).toContain('reports.view');
      expect(managerPerms).toContain('reports.generate');
      expect(managerPerms).toContain('reports.export');
      expect(managerPerms).toContain('compliance.view');
    });

    it('should enforce dataset size limits (10000 rows)', () => {
      const managerDef = ROLE_DEFINITIONS['manager'];

      expect(managerDef.maxDatasetSize).toBe(10000);
      expect(canAccessDatasetSize('manager', 5000)).toBe(true);
      expect(canAccessDatasetSize('manager', 10000)).toBe(true);
      expect(canAccessDatasetSize('manager', 10001)).toBe(false);
    });

    it('should NOT have user management permissions', () => {
      const managerPerms = getRolePermissions('manager');

      expect(managerPerms).not.toContain('users.manage');
      expect(managerPerms).not.toContain('roles.manage');
      expect(managerPerms).not.toContain('settings.manage');
    });
  });

  // ========================================================================
  // Test: Permission Inheritance & Constraints
  // ========================================================================

  describe('Permission Inheritance & Constraints', () => {
    it('should enforce department constraint', () => {
      const managerPerms = getRolePermissions('manager');
      const userAttributes: UserAttributes = {
        departments: ['Operations', 'Maintenance']
      };

      // Grant with matching department
      const grantWithConstraint = hasPermission(
        'manager',
        managerPerms,
        'maintenance.view',
        { department: 'Maintenance' },
        userAttributes
      );
      expect(grantWithConstraint).toBe(true);

      // Deny with non-matching department
      const denyWithConstraint = hasPermission(
        'manager',
        managerPerms,
        'maintenance.view',
        { department: 'Finance' },
        userAttributes
      );
      expect(denyWithConstraint).toBe(false);
    });

    it('should enforce site constraint', () => {
      const managerPerms = getRolePermissions('manager');
      const userAttributes: UserAttributes = {
        sites: ['Site-A', 'Site-B']
      };

      // Grant with matching site
      const grantWithSite = hasPermission(
        'manager',
        managerPerms,
        'vehicles.view',
        { site: 'Site-A' },
        userAttributes
      );
      expect(grantWithSite).toBe(true);

      // Deny with non-matching site
      const denyWithSite = hasPermission(
        'manager',
        managerPerms,
        'vehicles.view',
        { site: 'Site-C' },
        userAttributes
      );
      expect(denyWithSite).toBe(false);
    });

    it('should enforce region constraint', () => {
      const managerPerms = getRolePermissions('manager');
      const userAttributes: UserAttributes = {
        regions: ['US-East', 'US-West']
      };

      // Grant with matching region
      const grantWithRegion = hasPermission(
        'manager',
        managerPerms,
        'reports.view',
        { region: 'US-East' },
        userAttributes
      );
      expect(grantWithRegion).toBe(true);

      // Deny with non-matching region
      const denyWithRegion = hasPermission(
        'manager',
        managerPerms,
        'reports.view',
        { region: 'US-South' },
        userAttributes
      );
      expect(denyWithRegion).toBe(false);
    });

    it('should enforce vehicle type constraint', () => {
      const managerPerms = getRolePermissions('manager');
      const userAttributes: UserAttributes = {
        vehicleTypes: ['Truck', 'Van']
      };

      // Grant with matching vehicle type
      const grantWithVehicleType = hasPermission(
        'manager',
        managerPerms,
        'vehicles.edit',
        { vehicleType: 'Truck' },
        userAttributes
      );
      expect(grantWithVehicleType).toBe(true);

      // Deny with non-matching vehicle type
      const denyWithVehicleType = hasPermission(
        'manager',
        managerPerms,
        'vehicles.edit',
        { vehicleType: 'Car' },
        userAttributes
      );
      expect(denyWithVehicleType).toBe(false);
    });

    it('should enforce multiple constraints simultaneously', () => {
      const managerPerms = getRolePermissions('manager');
      const userAttributes: UserAttributes = {
        departments: ['Maintenance'],
        sites: ['Site-A'],
        regions: ['US-East'],
        vehicleTypes: ['Truck']
      };

      // Grant when ALL constraints match
      const grantAll = hasPermission(
        'manager',
        managerPerms,
        'maintenance.view',
        {
          department: 'Maintenance',
          site: 'Site-A',
          region: 'US-East'
        },
        userAttributes
      );
      expect(grantAll).toBe(true);

      // Deny if ANY constraint fails
      const denyPartial = hasPermission(
        'manager',
        managerPerms,
        'maintenance.view',
        {
          department: 'Maintenance',
          site: 'Site-B', // Wrong site
          region: 'US-East'
        },
        userAttributes
      );
      expect(denyPartial).toBe(false);
    });

    it('should deny access when constraints specified but no user attributes', () => {
      const managerPerms = getRolePermissions('manager');

      const result = hasPermission(
        'manager',
        managerPerms,
        'maintenance.view',
        { department: 'Maintenance' },
        undefined // No user attributes
      );

      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // Test: Permission Denial Logging
  // ========================================================================

  describe('Permission Denial Logging', () => {
    it('should log when permission check fails (missing permission)', () => {
      const viewerPerms = getRolePermissions('viewer');
      const consoleInfoSpy = vi.spyOn(console, 'info');

      hasPermission('viewer', viewerPerms, 'vehicles.delete');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RBAC]'),
        expect.objectContaining({
          role: 'viewer',
          requiredPermission: 'vehicles.delete',
          hasPermission: false
        })
      );
    });

    it('should log when attribute constraint fails', () => {
      const managerPerms = getRolePermissions('manager');
      const consoleInfoSpy = vi.spyOn(console, 'info');
      const userAttributes: UserAttributes = {
        departments: ['Operations']
      };

      hasPermission(
        'manager',
        managerPerms,
        'maintenance.view',
        { department: 'Finance' },
        userAttributes
      );

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RBAC]'),
        expect.objectContaining({
          role: 'manager',
          requiredPermission: 'maintenance.view'
        })
      );
    });

    it('should log successful permission grants', () => {
      const managerPerms = getRolePermissions('manager');
      const consoleInfoSpy = vi.spyOn(console, 'info');

      hasPermission('manager', managerPerms, 'maintenance.view');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RBAC]'),
        expect.objectContaining({
          role: 'manager',
          requiredPermission: 'maintenance.view'
        })
      );
    });

    it('should support custom audit logging via logPermissionCheck', () => {
      const entry = {
        timestamp: new Date().toISOString(),
        userId: 'user-123',
        tenantId: 'tenant-456',
        permission: 'vehicles.delete' as Permission,
        resource: 'vehicle:789',
        action: 'delete',
        granted: false,
        reason: 'Insufficient permissions',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      };

      const consoleInfoSpy = vi.spyOn(console, 'info');
      logPermissionCheck(entry);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RBAC Audit]'),
        expect.objectContaining({ entry })
      );
    });
  });

  // ========================================================================
  // Test: Super Admin Role
  // ========================================================================

  describe('Super Admin Role - Platform-Level Access', () => {
    it('should have system-level permissions', () => {
      const superAdminPerms = getRolePermissions('super-admin');

      expect(superAdminPerms).toContain('system.admin');
      expect(superAdminPerms).toContain('system.audit');
      expect(superAdminPerms).toContain('system.backup');
      expect(superAdminPerms).toContain('system.restore');
    });

    it('should have tenant management permissions', () => {
      const superAdminPerms = getRolePermissions('super-admin');

      expect(superAdminPerms).toContain('tenant.create');
      expect(superAdminPerms).toContain('tenant.manage');
      expect(superAdminPerms).toContain('tenant.billing');
    });

    it('should be marked as system role', () => {
      const superAdminDef = ROLE_DEFINITIONS['super-admin'];

      expect(superAdminDef.isSystemRole).toBe(true);
    });

    it('should grant any permission without constraints (implicit super-admin bypass)', () => {
      // Super admin role should pass permission check for ANY permission
      const result = hasPermission(
        'super-admin',
        [],
        'system.admin'
      );

      expect(result).toBe(true);
    });
  });

  // ========================================================================
  // Test: Dataset Size Enforcement
  // ========================================================================

  describe('Dataset Size Enforcement (Row-Level Security)', () => {
    it('analyst role allows 50000 row dataset', () => {
      expect(canAccessDatasetSize('analyst', 50000)).toBe(true);
      expect(canAccessDatasetSize('analyst', 50001)).toBe(false);
    });

    it('auditor role allows 50000 row dataset', () => {
      expect(canAccessDatasetSize('auditor', 50000)).toBe(true);
      expect(canAccessDatasetSize('auditor', 50001)).toBe(false);
    });

    it('supervisor role allows 5000 row dataset', () => {
      expect(canAccessDatasetSize('supervisor', 5000)).toBe(true);
      expect(canAccessDatasetSize('supervisor', 5001)).toBe(false);
    });

    it('mechanic role allows 1000 row dataset', () => {
      expect(canAccessDatasetSize('mechanic', 1000)).toBe(true);
      expect(canAccessDatasetSize('mechanic', 1001)).toBe(false);
    });

    it('technician role allows 500 row dataset', () => {
      expect(canAccessDatasetSize('technician', 500)).toBe(true);
      expect(canAccessDatasetSize('technician', 501)).toBe(false);
    });

    it('driver role allows 100 row dataset', () => {
      expect(canAccessDatasetSize('driver', 100)).toBe(true);
      expect(canAccessDatasetSize('driver', 101)).toBe(false);
    });

    it('roles without size limit should allow any size', () => {
      expect(canAccessDatasetSize('admin', 1000000)).toBe(true);
      expect(canAccessDatasetSize('super-admin', 1000000)).toBe(true);
    });
  });

  // ========================================================================
  // Test: All Role Definitions Valid
  // ========================================================================

  describe('Role Definitions Validation', () => {
    it('should have all defined roles in ROLE_DEFINITIONS', () => {
      const requiredRoles: Role[] = [
        'super-admin', 'admin', 'manager', 'supervisor', 'dispatcher',
        'mechanic', 'technician', 'driver', 'safety-officer', 'analyst',
        'auditor', 'viewer'
      ];

      for (const role of requiredRoles) {
        expect(ROLE_DEFINITIONS[role]).toBeDefined();
        expect(ROLE_DEFINITIONS[role].name).toBe(role);
      }
    });

    it('each role should have non-empty permissions array', () => {
      for (const [roleName, roleDef] of Object.entries(ROLE_DEFINITIONS)) {
        expect(roleDef.permissions.length).toBeGreaterThan(0);
        expect(Array.isArray(roleDef.permissions)).toBe(true);
      }
    });

    it('each role should have description', () => {
      for (const [roleName, roleDef] of Object.entries(ROLE_DEFINITIONS)) {
        expect(roleDef.description).toBeDefined();
        expect(typeof roleDef.description).toBe('string');
        expect(roleDef.description.length).toBeGreaterThan(0);
      }
    });

    it('each role should declare system role status', () => {
      for (const [roleName, roleDef] of Object.entries(ROLE_DEFINITIONS)) {
        expect(typeof roleDef.isSystemRole).toBe('boolean');
      }
    });
  });
});
