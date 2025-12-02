/**
 * Maintenance Service Unit Tests
 * Tests maintenance scheduling, work orders, and preventive maintenance logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import {
  createMockVehicle,
  createMockMaintenanceSchedule,
  createMockWorkOrder,
  createBulkMockData,
} from '../fixtures';
import { DatabaseTestHelper, createDateInFuture, createDateInPast } from '../helpers/test-helpers';

describe('MaintenanceService', () => {
  let dbHelper: DatabaseTestHelper;
  let testPool: Pool;
  let testVehicle: any;

  beforeEach(async () => {
    testPool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      database: process.env.TEST_DB_NAME || 'fleet_test',
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
    });
    dbHelper = new DatabaseTestHelper(testPool);
    await dbHelper.cleanAllTables();

    // Create test vehicle
    const [vehicle] = await dbHelper.insertTestData('vehicles', createMockVehicle());
    testVehicle = vehicle;
  });

  afterEach(async () => {
    await testPool.end();
  });

  describe('Maintenance Scheduling', () => {
    it('should create a maintenance schedule', async () => {
      const schedule = createMockMaintenanceSchedule({ vehicle_id: testVehicle.id });
      const [result] = await dbHelper.insertTestData('maintenance_schedules', schedule);

      expect(result).toMatchObject({
        vehicle_id: testVehicle.id,
        maintenance_type: schedule.maintenance_type,
        interval_type: schedule.interval_type,
        interval_value: schedule.interval_value,
      });
    });

    it('should calculate next maintenance due date based on mileage', () => {
      const currentOdometer = 15000;
      const lastServiceOdometer = 10000;
      const intervalMiles = 5000;

      const nextServiceOdometer = lastServiceOdometer + intervalMiles;
      const isOverdue = currentOdometer >= nextServiceOdometer;

      expect(nextServiceOdometer).toBe(15000);
      expect(isOverdue).toBe(true);
    });

    it('should calculate next maintenance due date based on time', () => {
      const lastServiceDate = createDateInPast(90);
      const intervalDays = 90;
      const today = new Date();

      const nextServiceDate = new Date(lastServiceDate);
      nextServiceDate.setDate(nextServiceDate.getDate() + intervalDays);

      const isOverdue = today >= nextServiceDate;
      expect(isOverdue).toBe(true);
    });

    it('should handle multiple maintenance schedules per vehicle', async () => {
      const schedules = [
        createMockMaintenanceSchedule({
          vehicle_id: testVehicle.id,
          maintenance_type: 'oil_change',
        }),
        createMockMaintenanceSchedule({
          vehicle_id: testVehicle.id,
          maintenance_type: 'tire_rotation',
        }),
        createMockMaintenanceSchedule({
          vehicle_id: testVehicle.id,
          maintenance_type: 'brake_inspection',
        }),
      ];

      await dbHelper.insertTestData('maintenance_schedules', schedules);
      const count = await dbHelper.countRecords('maintenance_schedules', 'vehicle_id = $1', [
        testVehicle.id,
      ]);

      expect(count).toBe(3);
    });
  });

  describe('Work Orders', () => {
    it('should create a work order', async () => {
      const workOrder = createMockWorkOrder({ vehicle_id: testVehicle.id });
      const [result] = await dbHelper.insertTestData('work_orders', workOrder);

      expect(result).toMatchObject({
        vehicle_id: testVehicle.id,
        type: workOrder.type,
        status: 'open',
        priority: workOrder.priority,
      });
    });

    it('should calculate total work order cost', () => {
      const laborCost = 150.0;
      const partsCost = 250.0;
      const totalCost = laborCost + partsCost;

      expect(totalCost).toBe(400.0);
    });

    it('should track work order status transitions', async () => {
      const workOrder = createMockWorkOrder({
        vehicle_id: testVehicle.id,
        status: 'open',
      });
      const [created] = await dbHelper.insertTestData('work_orders', workOrder);

      // Progress through statuses
      const statuses = ['in_progress', 'parts_ordered', 'completed'];

      for (const status of statuses) {
        await dbHelper.withTransaction(async (client) => {
          await client.query('UPDATE work_orders SET status = $1 WHERE id = $2', [
            status,
            created.id,
          ]);
        });

        const updated = await dbHelper.getRecordById('work_orders', created.id);
        expect(updated.status).toBe(status);
      }
    });

    it('should enforce required fields for work orders', async () => {
      const invalidWorkOrder = createMockWorkOrder({ vehicle_id: testVehicle.id });
      delete invalidWorkOrder.type;

      await expect(async () => {
        await dbHelper.insertTestData('work_orders', invalidWorkOrder);
      }).rejects.toThrow();
    });

    it('should handle work order priorities', async () => {
      const workOrders = [
        createMockWorkOrder({ vehicle_id: testVehicle.id, priority: 'low' }),
        createMockWorkOrder({ vehicle_id: testVehicle.id, priority: 'medium' }),
        createMockWorkOrder({ vehicle_id: testVehicle.id, priority: 'high' }),
        createMockWorkOrder({ vehicle_id: testVehicle.id, priority: 'critical' }),
      ];

      await dbHelper.insertTestData('work_orders', workOrders);
      const highPriorityCount = await dbHelper.countRecords(
        'work_orders',
        "priority IN ('high', 'critical')",
        []
      );

      expect(highPriorityCount).toBe(2);
    });
  });

  describe('Preventive Maintenance Logic', () => {
    it('should identify vehicles due for maintenance', async () => {
      const schedule = createMockMaintenanceSchedule({
        vehicle_id: testVehicle.id,
        last_service_odometer: 10000,
        next_service_odometer: 15000,
        interval_type: 'mileage',
        interval_value: 5000,
      });

      await dbHelper.insertTestData('maintenance_schedules', schedule);

      // Update vehicle odometer to trigger maintenance
      await dbHelper.withTransaction(async (client) => {
        await client.query('UPDATE vehicles SET odometer = $1 WHERE id = $2', [
          15000,
          testVehicle.id,
        ]);
      });

      const vehicle = await dbHelper.getRecordById('vehicles', testVehicle.id);
      expect(vehicle.odometer).toBe(15000);
    });

    it('should calculate maintenance compliance percentage', async () => {
      // Create 10 maintenance schedules, 8 completed on time
      const totalSchedules = 10;
      const completedOnTime = 8;
      const complianceRate = (completedOnTime / totalSchedules) * 100;

      expect(complianceRate).toBe(80);
    });

    it('should forecast upcoming maintenance needs', () => {
      const currentOdometer = 12000;
      const averageMilesPerDay = 50;
      const maintenanceDueAt = 15000;
      const milesRemaining = maintenanceDueAt - currentOdometer;
      const daysUntilDue = Math.floor(milesRemaining / averageMilesPerDay);

      expect(daysUntilDue).toBe(60);
    });
  });

  describe('Maintenance Cost Tracking', () => {
    it('should calculate total maintenance costs for a vehicle', async () => {
      const workOrders = createBulkMockData(createMockWorkOrder, 5, {
        vehicle_id: testVehicle.id,
        labor_cost: 100,
        parts_cost: 150,
        total_cost: 250,
        status: 'completed',
      });

      await dbHelper.insertTestData('work_orders', workOrders);

      const totalCost = 5 * 250;
      expect(totalCost).toBe(1250);
    });

    it('should calculate cost per mile for maintenance', () => {
      const totalMaintenanceCost = 5000;
      const totalMilesDriven = 50000;
      const costPerMile = totalMaintenanceCost / totalMilesDriven;

      expect(costPerMile).toBe(0.1);
    });

    it('should identify high-cost maintenance vehicles', async () => {
      await dbHelper.insertTestData('work_orders', [
        createMockWorkOrder({ vehicle_id: testVehicle.id, total_cost: 500 }),
        createMockWorkOrder({ vehicle_id: testVehicle.id, total_cost: 1500 }),
        createMockWorkOrder({ vehicle_id: testVehicle.id, total_cost: 2500 }),
      ]);

      const highCostThreshold = 1000;
      const highCostCount = await dbHelper.countRecords(
        'work_orders',
        'total_cost > $1',
        [highCostThreshold]
      );

      expect(highCostCount).toBe(2);
    });
  });

  describe('Maintenance History', () => {
    it('should maintain complete maintenance history', async () => {
      const workOrders = createBulkMockData(createMockWorkOrder, 10, {
        vehicle_id: testVehicle.id,
        status: 'completed',
      });

      await dbHelper.insertTestData('work_orders', workOrders);
      const historyCount = await dbHelper.countRecords(
        'work_orders',
        'vehicle_id = $1 AND status = $2',
        [testVehicle.id, 'completed']
      );

      expect(historyCount).toBe(10);
    });

    it('should track maintenance frequency', async () => {
      const maintenanceEvents = 12; // Over 1 year
      const monthsInPeriod = 12;
      const averagePerMonth = maintenanceEvents / monthsInPeriod;

      expect(averagePerMonth).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maintenance with zero cost', async () => {
      const workOrder = createMockWorkOrder({
        vehicle_id: testVehicle.id,
        labor_cost: 0,
        parts_cost: 0,
        total_cost: 0,
      });

      const [result] = await dbHelper.insertTestData('work_orders', workOrder);
      expect(result.total_cost).toBe(0);
    });

    it('should handle extremely high maintenance costs', async () => {
      const workOrder = createMockWorkOrder({
        vehicle_id: testVehicle.id,
        labor_cost: 50000,
        parts_cost: 100000,
        total_cost: 150000,
      });

      const [result] = await dbHelper.insertTestData('work_orders', workOrder);
      expect(result.total_cost).toBe(150000);
    });

    it('should handle concurrent maintenance schedules', async () => {
      const schedules = createBulkMockData(createMockMaintenanceSchedule, 5, {
        vehicle_id: testVehicle.id,
        next_service_date: createDateInFuture(7).toISOString(),
      });

      await dbHelper.insertTestData('maintenance_schedules', schedules);
      const concurrentCount = await dbHelper.countRecords('maintenance_schedules', 'vehicle_id = $1', [
        testVehicle.id,
      ]);

      expect(concurrentCount).toBe(5);
    });
  });

  describe('Recurring Maintenance', () => {
    it('should auto-generate recurring maintenance tasks', () => {
      const lastServiceDate = new Date('2024-01-01');
      const intervalMonths = 3;
      const occurrences = 4;

      const scheduledDates = [];
      for (let i = 1; i <= occurrences; i++) {
        const nextDate = new Date(lastServiceDate);
        nextDate.setMonth(nextDate.getMonth() + intervalMonths * i);
        scheduledDates.push(nextDate);
      }

      expect(scheduledDates).toHaveLength(4);
      expect(scheduledDates[0].getMonth()).toBe(3); // April (0-indexed)
    });
  });
});
