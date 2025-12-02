/**
 * Permission Engine Tests
 * Comprehensive test suite for RBAC engine
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PermissionEngine } from '../engine';
import { User, UserRole } from '../types';

describe('PermissionEngine', () => {
  let engine: PermissionEngine;

  beforeEach(() => {
    engine = new PermissionEngine();
  });

  // Helper to create test users
  const createUser = (roles: UserRole[], org_id = 'org-123'): User => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    org_id,
    roles
  });

  describe('can() - Action Permissions', () => {
    it('should allow Admin to perform any action', async () => {
      const admin = createUser(['Admin']);

      const result = await engine.can(admin, 'vehicle.delete');

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('should allow FleetManager to create vehicles', async () => {
      const manager = createUser(['FleetManager']);

      const result = await engine.can(manager, 'vehicle.create');

      expect(result.allowed).toBe(true);
    });

    it('should deny Driver from creating vehicles', async () => {
      const driver = createUser(['Driver']);

      const result = await engine.can(driver, 'vehicle.create');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not authorized');
    });

    it('should allow Inspector to edit own damage pins', async () => {
      const inspector = createUser(['Inspector']);
      const inspection = { created_by: 'user-123' };

      const result = await engine.can(inspector, 'damage.edit', inspection);

      expect(result.allowed).toBe(true);
    });

    it('should deny Inspector from editing others damage pins', async () => {
      const inspector = createUser(['Inspector']);
      const inspection = { created_by: 'other-user' };

      const result = await engine.can(inspector, 'damage.edit', inspection);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Condition failed');
    });

    it('should allow Vendor to close assigned work orders', async () => {
      const vendor = createUser(['Vendor']);
      const workorder = { assigned_to: 'user-123' };

      const result = await engine.can(vendor, 'maint.closeWorkOrder', workorder);

      expect(result.allowed).toBe(true);
    });

    it('should deny Vendor from closing unassigned work orders', async () => {
      const vendor = createUser(['Vendor']);
      const workorder = { assigned_to: 'other-user' };

      const result = await engine.can(vendor, 'maint.closeWorkOrder', workorder);

      expect(result.allowed).toBe(false);
    });

    it('should allow Finance to view value data', async () => {
      const finance = createUser(['Finance']);

      const result = await engine.can(finance, 'value.read');

      expect(result.allowed).toBe(true);
    });

    it('should deny Driver from viewing value data', async () => {
      const driver = createUser(['Driver']);

      const result = await engine.can(driver, 'value.read');

      expect(result.allowed).toBe(false);
    });

    it('should allow Safety to create crash reports', async () => {
      const safety = createUser(['Safety']);

      const result = await engine.can(safety, 'crash.create');

      expect(result.allowed).toBe(true);
    });

    it('should allow Auditor to read but not modify', async () => {
      const auditor = createUser(['Auditor']);

      const readResult = await engine.can(auditor, 'crash.read');
      const editResult = await engine.can(auditor, 'crash.edit');

      expect(readResult.allowed).toBe(true);
      expect(editResult.allowed).toBe(false);
    });

    it('should handle multi-role users (union of permissions)', async () => {
      const multiRole = createUser(['Driver', 'Inspector']);

      // Driver can read
      const readResult = await engine.can(multiRole, 'vehicle.read');
      // Inspector can create scans
      const scanResult = await engine.can(multiRole, 'scan.create');
      // Neither can delete
      const deleteResult = await engine.can(multiRole, 'vehicle.delete');

      expect(readResult.allowed).toBe(true);
      expect(scanResult.allowed).toBe(true);
      expect(deleteResult.allowed).toBe(false);
    });

    it('should return false for unknown actions', async () => {
      const user = createUser(['Admin']);

      const result = await engine.can(user, 'unknown.action');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Unknown action');
    });
  });

  describe('visibleModules()', () => {
    it('should return all modules for Admin', async () => {
      const admin = createUser(['Admin']);

      const { modules } = await engine.visibleModules(admin);

      expect(modules).toContain('vehicles');
      expect(modules).toContain('garage');
      expect(modules).toContain('admin');
      expect(modules).toContain('users');
      expect(modules.length).toBeGreaterThan(9);
    });

    it('should return limited modules for Driver', async () => {
      const driver = createUser(['Driver']);

      const { modules } = await engine.visibleModules(driver);

      expect(modules).toContain('vehicles');
      expect(modules).toContain('garage');
      expect(modules).toContain('maintenance');
      expect(modules).not.toContain('admin');
      expect(modules).not.toContain('crashes');
      expect(modules).not.toContain('value');
    });

    it('should include crash module for Safety', async () => {
      const safety = createUser(['Safety']);

      const { modules } = await engine.visibleModules(safety);

      expect(modules).toContain('crashes');
      expect(modules).not.toContain('value');
    });

    it('should include value module for Finance', async () => {
      const finance = createUser(['Finance']);

      const { modules } = await engine.visibleModules(finance);

      expect(modules).toContain('value');
      expect(modules).not.toContain('crashes');
    });

    it('should combine modules for multi-role users', async () => {
      const multiRole = createUser(['Finance', 'Safety']);

      const { modules } = await engine.visibleModules(multiRole);

      expect(modules).toContain('value');
      expect(modules).toContain('crashes');
    });

    it('should return module configs', async () => {
      const user = createUser(['FleetManager']);

      const { moduleConfigs } = await engine.visibleModules(user);

      expect(moduleConfigs.vehicles).toBeDefined();
      expect(moduleConfigs.vehicles.name).toBe('Vehicles Registry');
      expect(moduleConfigs.vehicles.roles).toContain('FleetManager');
    });
  });

  describe('applyRecordFilter()', () => {
    it('should filter by org_id for non-Admin', async () => {
      const user = createUser(['FleetManager'], 'org-456');

      const filtered = await engine.applyRecordFilter({}, user, 'vehicle');

      expect(filtered.org_id).toBe('org-456');
    });

    it('should not override existing filters', async () => {
      const user = createUser(['FleetManager'], 'org-456');

      const filtered = await engine.applyRecordFilter(
        { status: 'active' },
        user,
        'vehicle'
      );

      expect(filtered.org_id).toBe('org-456');
      expect(filtered.status).toBe('active');
    });

    it('should filter Driver to assigned vehicles only', async () => {
      const driver = createUser(['Driver']);

      const filtered = await engine.applyRecordFilter({}, driver, 'vehicle');

      expect(filtered.assigned_user_id).toBe('user-123');
      expect(filtered.org_id).toBe('org-123');
    });

    it('should filter Inspector by depot or created_by', async () => {
      const inspector = createUser(['Inspector']);
      inspector.depot_id = 'depot-1';

      const filtered = await engine.applyRecordFilter({}, inspector, 'inspection');

      expect(filtered.$or).toBeDefined();
      expect(filtered.$or).toEqual([
        { created_by: 'user-123' },
        { depot_id: 'depot-1' }
      ]);
    });

    it('should allow Admin to see all in org', async () => {
      const admin = createUser(['Admin'], 'org-789');

      const filtered = await engine.applyRecordFilter({}, admin, 'vehicle');

      expect(filtered.org_id).toBe('org-789');
      expect(filtered.assigned_user_id).toBeUndefined();
    });
  });

  describe('filterFields()', () => {
    const vehicleData = {
      id: 'v-1',
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      vin: '1234567890',
      purchase_price: 25000,
      current_value: 23000,
      crash_history: 'Rear-end collision on 2023-01-15'
    };

    it('should show all fields to Admin', async () => {
      const admin = createUser(['Admin']);

      const { filteredData, redactedFields } = await engine.filterFields(
        admin,
        'vehicle',
        vehicleData
      );

      expect(filteredData.purchase_price).toBe(25000);
      expect(filteredData.current_value).toBe(23000);
      expect(filteredData.crash_history).toBeDefined();
      expect(redactedFields.length).toBe(0);
    });

    it('should redact financial fields from Driver', async () => {
      const driver = createUser(['Driver']);

      const { filteredData, redactedFields } = await engine.filterFields(
        driver,
        'vehicle',
        vehicleData
      );

      expect(filteredData.make).toBe('Toyota');
      expect(filteredData.purchase_price).toBeUndefined();
      expect(filteredData.current_value).toBeUndefined();
      expect(redactedFields).toContain('purchase_price');
      expect(redactedFields).toContain('current_value');
    });

    it('should show financial fields to Finance role', async () => {
      const finance = createUser(['Finance']);

      const { filteredData } = await engine.filterFields(
        finance,
        'vehicle',
        vehicleData
      );

      expect(filteredData.purchase_price).toBe(25000);
      expect(filteredData.current_value).toBe(23000);
    });

    it('should redact crash details from non-Safety roles', async () => {
      const inspector = createUser(['Inspector']);

      const { filteredData, redactedFields } = await engine.filterFields(
        inspector,
        'vehicle',
        vehicleData
      );

      expect(filteredData.crash_history).toBeUndefined();
      expect(redactedFields).toContain('crash_history');
    });

    it('should show crash details to Safety role', async () => {
      const safety = createUser(['Safety']);

      const { filteredData } = await engine.filterFields(
        safety,
        'vehicle',
        vehicleData
      );

      expect(filteredData.crash_history).toBeDefined();
    });

    it('should handle array of items', async () => {
      const driver = createUser(['Driver']);
      const vehicles = [vehicleData, { ...vehicleData, id: 'v-2' }];

      const { filteredData } = await engine.filterFields(
        driver,
        'vehicle',
        vehicles
      );

      expect(Array.isArray(filteredData)).toBe(true);
      expect(filteredData.length).toBe(2);
      expect(filteredData[0].purchase_price).toBeUndefined();
      expect(filteredData[1].purchase_price).toBeUndefined();
    });

    it('should always show always_visible fields', async () => {
      const driver = createUser(['Driver']);

      const { filteredData } = await engine.filterFields(
        driver,
        'vehicle',
        vehicleData
      );

      expect(filteredData.id).toBe('v-1');
      expect(filteredData.make).toBe('Toyota');
      expect(filteredData.model).toBe('Camry');
      expect(filteredData.year).toBe(2023);
      expect(filteredData.vin).toBe('1234567890');
    });
  });

  describe('canAccessField()', () => {
    it('should allow Admin to access any field', () => {
      const admin = createUser(['Admin']);

      expect(engine.canAccessField(admin, 'vehicle', 'purchase_price')).toBe(true);
      expect(engine.canAccessField(admin, 'vehicle', 'crash_history')).toBe(true);
    });

    it('should deny Driver access to financial fields', () => {
      const driver = createUser(['Driver']);

      expect(engine.canAccessField(driver, 'vehicle', 'purchase_price')).toBe(false);
      expect(engine.canAccessField(driver, 'vehicle', 'current_value')).toBe(false);
    });

    it('should allow Finance to access financial fields', () => {
      const finance = createUser(['Finance']);

      expect(engine.canAccessField(finance, 'vehicle', 'purchase_price')).toBe(true);
      expect(engine.canAccessField(finance, 'vehicle', 'current_value')).toBe(true);
    });

    it('should allow access to always_visible fields', () => {
      const driver = createUser(['Driver']);

      expect(engine.canAccessField(driver, 'vehicle', 'make')).toBe(true);
      expect(engine.canAccessField(driver, 'vehicle', 'model')).toBe(true);
      expect(engine.canAccessField(driver, 'vehicle', 'vin')).toBe(true);
    });

    it('should return true for unknown resource types', () => {
      const driver = createUser(['Driver']);

      expect(engine.canAccessField(driver, 'unknown_type', 'any_field')).toBe(true);
    });
  });
});
