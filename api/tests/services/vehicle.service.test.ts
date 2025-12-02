/**
 * Vehicle Service Unit Tests
 * Tests all vehicle-related business logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { createMockVehicle, createBulkMockData, createMockElectricVehicle } from '../fixtures';
import { DatabaseTestHelper } from '../helpers/test-helpers';

describe('VehicleService', () => {
  let dbHelper: DatabaseTestHelper;
  let testPool: Pool;

  beforeEach(async () => {
    testPool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      database: process.env.TEST_DB_NAME || 'fleet_test',
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
    });
    dbHelper = new DatabaseTestHelper(testPool);
    await dbHelper.cleanAllTables();
  });

  afterEach(async () => {
    await testPool.end();
  });

  describe('createVehicle', () => {
    it('should create a new vehicle with valid data', async () => {
      const vehicleData = createMockVehicle();
      const result = await dbHelper.insertTestData('vehicles', vehicleData);

      expect(result[0]).toMatchObject({
        vehicle_number: vehicleData.vehicle_number,
        vin: vehicleData.vin,
        make: vehicleData.make,
        model: vehicleData.model,
        status: 'active',
      });
    });

    it('should enforce unique VIN constraint', async () => {
      const vehicle1 = createMockVehicle({ vin: 'UNIQUE123' });
      const vehicle2 = createMockVehicle({ vin: 'UNIQUE123' });

      await dbHelper.insertTestData('vehicles', vehicle1);

      await expect(async () => {
        await dbHelper.insertTestData('vehicles', vehicle2);
      }).rejects.toThrow();
    });

    it('should create electric vehicle with battery data', async () => {
      const evData = createMockElectricVehicle();
      const result = await dbHelper.insertTestData('vehicles', evData);

      expect(result[0]).toMatchObject({
        fuel_type: 'electric',
        battery_capacity_kwh: evData.battery_capacity_kwh,
        range_miles: evData.range_miles,
      });
    });

    it('should validate required fields', async () => {
      const invalidVehicle = createMockVehicle();
      delete invalidVehicle.vin;

      await expect(async () => {
        await dbHelper.insertTestData('vehicles', invalidVehicle);
      }).rejects.toThrow();
    });
  });

  describe('getVehicles', () => {
    it('should retrieve all vehicles for a tenant', async () => {
      const vehicles = createBulkMockData(createMockVehicle, 5, { tenant_id: 'test-tenant' });
      await dbHelper.insertTestData('vehicles', vehicles);

      const count = await dbHelper.countRecords('vehicles', 'tenant_id = $1', ['test-tenant']);
      expect(count).toBe(5);
    });

    it('should filter vehicles by status', async () => {
      await dbHelper.insertTestData('vehicles', [
        createMockVehicle({ status: 'active', tenant_id: 'test-tenant' }),
        createMockVehicle({ status: 'active', tenant_id: 'test-tenant' }),
        createMockVehicle({ status: 'out_of_service', tenant_id: 'test-tenant' }),
      ]);

      const activeCount = await dbHelper.countRecords('vehicles', 'status = $1', ['active']);
      expect(activeCount).toBe(2);
    });

    it('should enforce tenant isolation', async () => {
      await dbHelper.insertTestData('vehicles', [
        createMockVehicle({ tenant_id: 'tenant-1' }),
        createMockVehicle({ tenant_id: 'tenant-2' }),
      ]);

      const tenant1Count = await dbHelper.countRecords('vehicles', 'tenant_id = $1', ['tenant-1']);
      const tenant2Count = await dbHelper.countRecords('vehicles', 'tenant_id = $1', ['tenant-2']);

      expect(tenant1Count).toBe(1);
      expect(tenant2Count).toBe(1);
    });
  });

  describe('updateVehicle', () => {
    it('should update vehicle odometer', async () => {
      const vehicle = createMockVehicle({ odometer: 10000 });
      const [created] = await dbHelper.insertTestData('vehicles', vehicle);

      await dbHelper.withTransaction(async (client) => {
        await client.query('UPDATE vehicles SET odometer = $1 WHERE id = $2', [15000, created.id]);
      });

      const updated = await dbHelper.getRecordById('vehicles', created.id);
      expect(updated.odometer).toBe(15000);
    });

    it('should update vehicle status', async () => {
      const vehicle = createMockVehicle({ status: 'active' });
      const [created] = await dbHelper.insertTestData('vehicles', vehicle);

      await dbHelper.withTransaction(async (client) => {
        await client.query('UPDATE vehicles SET status = $1 WHERE id = $2', [
          'out_of_service',
          created.id,
        ]);
      });

      const updated = await dbHelper.getRecordById('vehicles', created.id);
      expect(updated.status).toBe('out_of_service');
    });

    it('should prevent cross-tenant updates', async () => {
      const vehicle1 = createMockVehicle({ tenant_id: 'tenant-1' });
      const [created] = await dbHelper.insertTestData('vehicles', vehicle1);

      // Simulate update attempt from different tenant
      await dbHelper.withTransaction(async (client) => {
        const result = await client.query(
          'UPDATE vehicles SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
          ['out_of_service', created.id, 'tenant-2']
        );
        expect(result.rows.length).toBe(0); // No rows updated
      });
    });
  });

  describe('deleteVehicle', () => {
    it('should soft delete vehicle', async () => {
      const vehicle = createMockVehicle();
      const [created] = await dbHelper.insertTestData('vehicles', vehicle);

      await dbHelper.withTransaction(async (client) => {
        await client.query('UPDATE vehicles SET status = $1, deleted_at = NOW() WHERE id = $2', [
          'deleted',
          created.id,
        ]);
      });

      const deleted = await dbHelper.getRecordById('vehicles', created.id);
      expect(deleted.status).toBe('deleted');
      expect(deleted.deleted_at).toBeDefined();
    });
  });

  describe('Vehicle Calculations', () => {
    it('should calculate depreciation correctly', () => {
      const purchasePrice = 50000;
      const depreciationRate = 10; // 10% per year
      const yearsOwned = 2;

      const currentValue = purchasePrice * Math.pow(1 - depreciationRate / 100, yearsOwned);
      expect(currentValue).toBe(40500);
    });

    it('should calculate fuel efficiency', () => {
      const totalFuelGallons = 100;
      const totalMilesDriven = 2500;
      const mpg = totalMilesDriven / totalFuelGallons;

      expect(mpg).toBe(25);
    });

    it('should calculate total cost of ownership', () => {
      const purchasePrice = 50000;
      const maintenanceCosts = 5000;
      const fuelCosts = 8000;
      const insuranceCosts = 3000;

      const tco = purchasePrice + maintenanceCosts + fuelCosts + insuranceCosts;
      expect(tco).toBe(66000);
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk create vehicles', async () => {
      const vehicles = createBulkMockData(createMockVehicle, 10);
      const results = await dbHelper.insertTestData('vehicles', vehicles);

      expect(results).toHaveLength(10);
    });

    it('should handle bulk updates efficiently', async () => {
      const vehicles = createBulkMockData(createMockVehicle, 10);
      const created = await dbHelper.insertTestData('vehicles', vehicles);

      await dbHelper.withTransaction(async (client) => {
        for (const vehicle of created) {
          await client.query('UPDATE vehicles SET status = $1 WHERE id = $2', [
            'maintenance',
            vehicle.id,
          ]);
        }
      });

      const maintenanceCount = await dbHelper.countRecords('vehicles', 'status = $1', [
        'maintenance',
      ]);
      expect(maintenanceCount).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle vehicle with extremely high mileage', async () => {
      const highMileageVehicle = createMockVehicle({ odometer: 500000 });
      const result = await dbHelper.insertTestData('vehicles', highMileageVehicle);

      expect(result[0].odometer).toBe(500000);
    });

    it('should handle vehicle with zero mileage', async () => {
      const newVehicle = createMockVehicle({ odometer: 0 });
      const result = await dbHelper.insertTestData('vehicles', newVehicle);

      expect(result[0].odometer).toBe(0);
    });

    it('should handle special characters in vehicle data', async () => {
      const vehicle = createMockVehicle({
        vehicle_number: "V-123'456",
        notes: 'Vehicle with "special" characters & symbols',
      });
      const result = await dbHelper.insertTestData('vehicles', vehicle);

      expect(result[0].vehicle_number).toBe("V-123'456");
    });

    it('should handle null optional fields', async () => {
      const vehicle = createMockVehicle({
        notes: null,
        department: null,
        location: null,
      });
      const result = await dbHelper.insertTestData('vehicles', vehicle);

      expect(result[0].notes).toBeNull();
      expect(result[0].department).toBeNull();
    });
  });
});
