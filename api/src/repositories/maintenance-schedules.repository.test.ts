import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import pool from '../config/database';
import * as maintenanceSchedulesRepo from './maintenance-schedules.repository';

describe('MaintenanceSchedulesRepository', () => {
  const testTenantId = 'test-tenant-' + Date.now();
  const testVehicleId = 'test-vehicle-' + Date.now();
  let testScheduleId: string;

  beforeAll(async () => {
    // Create test tenant
    await pool.query(
      'INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [testTenantId, 'Test Tenant']
    );

    // Create test vehicle
    await pool.query(
      `INSERT INTO vehicles (id, tenant_id, name, make, model, year, vin, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
      [testVehicleId, testTenantId, 'Test Vehicle', 'Ford', 'F-150', 2022, 'TEST123', 'active']
    );
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM maintenance_schedules WHERE tenant_id = $1', [testTenantId]);
    await pool.query('DELETE FROM vehicles WHERE tenant_id = $1', [testTenantId]);
    await pool.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    await pool.end();
  });

  describe('createMaintenanceSchedule', () => {
    it('should create a maintenance schedule', async () => {
      const columnNames = 'tenant_id, vehicle_id, service_type, priority, status';
      const placeholders = '$1, $2, $3, $4, $5';
      const values = [testVehicleId, 'Oil Change', 'medium', 'scheduled'];

      const schedule = await maintenanceSchedulesRepo.createMaintenanceSchedule(
        testTenantId,
        columnNames,
        placeholders,
        values
      );

      expect(schedule).toBeDefined();
      expect(schedule.tenant_id).toBe(testTenantId);
      expect(schedule.vehicle_id).toBe(testVehicleId);
      expect(schedule.service_type).toBe('Oil Change');
      
      testScheduleId = schedule.id;
    });
  });

  describe('findMaintenanceScheduleById', () => {
    it('should find schedule by id', async () => {
      const schedule = await maintenanceSchedulesRepo.findMaintenanceScheduleById(
        testScheduleId,
        testTenantId
      );

      expect(schedule).toBeDefined();
      expect(schedule!.id).toBe(testScheduleId);
    });

    it('should return null for non-existent schedule', async () => {
      const schedule = await maintenanceSchedulesRepo.findMaintenanceScheduleById(
        'non-existent-id',
        testTenantId
      );

      expect(schedule).toBeNull();
    });

    it('should not find schedule from different tenant', async () => {
      const schedule = await maintenanceSchedulesRepo.findMaintenanceScheduleById(
        testScheduleId,
        'different-tenant'
      );

      expect(schedule).toBeNull();
    });
  });

  describe('findMaintenanceSchedules', () => {
    it('should find schedules with filters', async () => {
      const schedules = await maintenanceSchedulesRepo.findMaintenanceSchedules(
        testTenantId,
        { vehicle_id: testVehicleId },
        { limit: 10, offset: 0 }
      );

      expect(Array.isArray(schedules)).toBe(true);
      expect(schedules.length).toBeGreaterThan(0);
      expect(schedules[0].tenant_id).toBe(testTenantId);
    });
  });

  describe('countMaintenanceSchedules', () => {
    it('should count schedules', async () => {
      const count = await maintenanceSchedulesRepo.countMaintenanceSchedules(
        testTenantId,
        { vehicle_id: testVehicleId }
      );

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('updateMaintenanceSchedule', () => {
    it('should update schedule', async () => {
      const updated = await maintenanceSchedulesRepo.updateMaintenanceSchedule(
        testScheduleId,
        testTenantId,
        'priority = $3',
        ['high']
      );

      expect(updated).toBeDefined();
      expect(updated!.priority).toBe('high');
    });

    it('should not update schedule from different tenant', async () => {
      const updated = await maintenanceSchedulesRepo.updateMaintenanceSchedule(
        testScheduleId,
        'different-tenant',
        'priority = $3',
        ['low']
      );

      expect(updated).toBeNull();
    });
  });

  describe('deleteMaintenanceSchedule', () => {
    it('should delete schedule', async () => {
      const deletedId = await maintenanceSchedulesRepo.deleteMaintenanceSchedule(
        testScheduleId,
        testTenantId
      );

      expect(deletedId).toBe(testScheduleId);

      // Verify deletion
      const schedule = await maintenanceSchedulesRepo.findMaintenanceScheduleById(
        testScheduleId,
        testTenantId
      );
      expect(schedule).toBeNull();
    });

    it('should not delete schedule from different tenant', async () => {
      // Create new schedule
      const columnNames = 'tenant_id, vehicle_id, service_type, priority, status';
      const placeholders = '$1, $2, $3, $4, $5';
      const values = [testVehicleId, 'Test Service', 'medium', 'scheduled'];

      const schedule = await maintenanceSchedulesRepo.createMaintenanceSchedule(
        testTenantId,
        columnNames,
        placeholders,
        values
      );

      const deletedId = await maintenanceSchedulesRepo.deleteMaintenanceSchedule(
        schedule.id,
        'different-tenant'
      );

      expect(deletedId).toBeNull();
    });
  });

  describe('Tenant isolation', () => {
    it('should enforce tenant_id filtering in all queries', async () => {
      const otherTenantId = 'other-tenant-' + Date.now();
      
      // Create other tenant
      await pool.query(
        'INSERT INTO tenants (id, name) VALUES ($1, $2)',
        [otherTenantId, 'Other Tenant']
      );

      // Create schedule for other tenant
      await pool.query(
        `INSERT INTO maintenance_schedules (tenant_id, vehicle_id, service_type, priority, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [otherTenantId, testVehicleId, 'Other Service', 'low', 'scheduled']
      );

      // Try to find schedules - should not return other tenant's data
      const schedules = await maintenanceSchedulesRepo.findMaintenanceSchedules(
        testTenantId,
        {},
        { limit: 100, offset: 0 }
      );

      const otherTenantSchedules = schedules.filter(s => s.tenant_id === otherTenantId);
      expect(otherTenantSchedules.length).toBe(0);

      // Cleanup
      await pool.query('DELETE FROM maintenance_schedules WHERE tenant_id = $1', [otherTenantId]);
      await pool.query('DELETE FROM tenants WHERE id = $1', [otherTenantId]);
    });
  });
});
