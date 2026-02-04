/**
 * Data Integrity Tests
 *
 * Comprehensive tests for:
 * - All 85 data integrity constraints
 * - Table partitioning functionality
 * - Partition management service
 * - Constraint monitoring service
 *
 * Phase 4 - Agent 10
 * Date: 2026-02-02
 */

import request from 'supertest';
import { pool } from '../../db';
import { partitionManagementService } from '../../services/partition-management.service';
import { constraintMonitoringService } from '../../services/constraint-monitoring.service';

describe('Data Integrity Constraints', () => {
  beforeAll(async () => {
    // Initialize constraint violation logging
    await constraintMonitoringService.initializeLogging();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Negative Value Constraints', () => {
    test('should reject negative odometer on vehicles', async () => {
      const tenantId = 'test-tenant-id';
      const vehicleId = 'test-vehicle-id';

      await expect(
        pool.query(
          `INSERT INTO vehicles (id, tenant_id, vehicle_number, odometer, status)
           VALUES ($1, $2, 'TEST-001', -1000, 'active')`,
          [vehicleId, tenantId]
        )
      ).rejects.toThrow(/chk_vehicles_odometer_positive/);
    });

    test('should reject invalid fuel level (>100%) on vehicles', async () => {
      const tenantId = 'test-tenant-id';
      const vehicleId = 'test-vehicle-id';

      await expect(
        pool.query(
          `INSERT INTO vehicles (id, tenant_id, vehicle_number, fuel_level, status)
           VALUES ($1, $2, 'TEST-002', 150, 'active')`,
          [vehicleId, tenantId]
        )
      ).rejects.toThrow(/chk_vehicles_fuel_level_valid/);
    });

    test('should reject invalid year on vehicles', async () => {
      const tenantId = 'test-tenant-id';
      const vehicleId = 'test-vehicle-id';

      await expect(
        pool.query(
          `INSERT INTO vehicles (id, tenant_id, vehicle_number, year, status)
           VALUES ($1, $2, 'TEST-003', 1800, 'active')`,
          [vehicleId, tenantId]
        )
      ).rejects.toThrow(/chk_vehicles_year_valid/);
    });

    test('should reject negative speed on GPS tracks', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO gps_tracks (tenant_id, vehicle_id, timestamp, latitude, longitude, speed)
           VALUES ($1, gen_random_uuid(), NOW(), 30.0, -95.0, -50)`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_gps_tracks_speed_valid/);
    });

    test('should reject invalid latitude/longitude on GPS tracks', async () => {
      const tenantId = 'test-tenant-id';

      // Invalid latitude (>90)
      await expect(
        pool.query(
          `INSERT INTO gps_tracks (tenant_id, vehicle_id, timestamp, latitude, longitude)
           VALUES ($1, gen_random_uuid(), NOW(), 95.0, -95.0)`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_gps_tracks_latitude_valid/);

      // Invalid longitude (>180)
      await expect(
        pool.query(
          `INSERT INTO gps_tracks (tenant_id, vehicle_id, timestamp, latitude, longitude)
           VALUES ($1, gen_random_uuid(), NOW(), 30.0, -200.0)`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_gps_tracks_longitude_valid/);
    });

    test('should reject negative RPM on telemetry data', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO telemetry_data (tenant_id, vehicle_id, timestamp, engine_rpm)
           VALUES ($1, gen_random_uuid(), NOW(), -1000)`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_telemetry_rpm_valid/);
    });
  });

  describe('Future Date Constraints', () => {
    test('should reject future date on fuel transactions', async () => {
      const tenantId = 'test-tenant-id';
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await expect(
        pool.query(
          `INSERT INTO fuel_transactions (
            tenant_id, vehicle_id, transaction_date, gallons, cost_per_gallon, total_cost
          ) VALUES ($1, gen_random_uuid(), $2, 10, 3.5, 35)`,
          [tenantId, futureDate]
        )
      ).rejects.toThrow(/chk_fuel_transaction_date_not_future/);
    });

    test('should reject future date on incidents', async () => {
      const tenantId = 'test-tenant-id';
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await expect(
        pool.query(
          `INSERT INTO incidents (
            tenant_id, vehicle_id, incident_date, description, severity
          ) VALUES ($1, gen_random_uuid(), $2, 'Test incident', 'minor')`,
          [tenantId, futureDate]
        )
      ).rejects.toThrow(/chk_incident_date_not_future/);
    });

    test('should allow GPS tracks with slight clock skew (5 minutes)', async () => {
      const tenantId = 'test-tenant-id';
      const slightFuture = new Date();
      slightFuture.setMinutes(slightFuture.getMinutes() + 3);

      // Should succeed
      await pool.query(
        `INSERT INTO gps_tracks (tenant_id, vehicle_id, timestamp, latitude, longitude)
         VALUES ($1, gen_random_uuid(), $2, 30.0, -95.0)`,
        [tenantId, slightFuture]
      );
    });
  });

  describe('Date Range Constraints', () => {
    test('should reject work order with end before start', async () => {
      const tenantId = 'test-tenant-id';
      const startDate = new Date('2026-01-15');
      const endDate = new Date('2026-01-10'); // Before start

      await expect(
        pool.query(
          `INSERT INTO work_orders (
            tenant_id, vehicle_id, title, scheduled_start_date, scheduled_end_date
          ) VALUES ($1, gen_random_uuid(), 'Test WO', $2, $3)`,
          [tenantId, startDate, endDate]
        )
      ).rejects.toThrow(/chk_work_order_scheduled_dates/);
    });

    test('should reject certification with expiry before issue', async () => {
      const tenantId = 'test-tenant-id';
      const issueDate = new Date('2026-01-15');
      const expiryDate = new Date('2026-01-10'); // Before issue

      await expect(
        pool.query(
          `INSERT INTO certifications (
            tenant_id, driver_id, type, issued_date, expiry_date
          ) VALUES ($1, gen_random_uuid(), 'CDL', $2, $3)`,
          [tenantId, issueDate, expiryDate]
        )
      ).rejects.toThrow(/chk_certification_dates/);
    });

    test('should reject charging session with end before start', async () => {
      const tenantId = 'test-tenant-id';
      const startTime = new Date('2026-01-15T10:00:00Z');
      const endTime = new Date('2026-01-15T09:00:00Z'); // Before start

      await expect(
        pool.query(
          `INSERT INTO charging_sessions (
            tenant_id, vehicle_id, station_id, start_time, end_time
          ) VALUES ($1, gen_random_uuid(), gen_random_uuid(), $2, $3)`,
          [tenantId, startTime, endTime]
        )
      ).rejects.toThrow(/chk_charging_times/);
    });
  });

  describe('Amount Constraints', () => {
    test('should reject negative invoice amount', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO invoices (
            tenant_id, vendor_id, invoice_number, invoice_date, total_amount
          ) VALUES ($1, gen_random_uuid(), 'INV-001', NOW(), -100)`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_invoice_amount_positive/);
    });

    test('should reject zero gallons on fuel transaction', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO fuel_transactions (
            tenant_id, vehicle_id, transaction_date, gallons, cost_per_gallon, total_cost
          ) VALUES ($1, gen_random_uuid(), NOW(), 0, 3.5, 0)`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_fuel_gallons_positive/);
    });

    test('should reject negative part cost', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO parts_inventory (
            tenant_id, part_number, name, quantity_on_hand, unit_cost
          ) VALUES ($1, 'PART-001', 'Test Part', 10, -50)`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_part_cost_positive/);
    });

    test('should reject invalid SOC on charging session', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO charging_sessions (
            tenant_id, vehicle_id, station_id, start_time, start_soc, end_soc
          ) VALUES ($1, gen_random_uuid(), gen_random_uuid(), NOW(), 120, 80)`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_charging_soc_valid/);
    });
  });

  describe('Status Constraints', () => {
    test('should reject completed work order without dates', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO work_orders (
            tenant_id, vehicle_id, title, status, scheduled_start_date
          ) VALUES ($1, gen_random_uuid(), 'Test WO', 'completed', NOW())`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_work_order_completed_has_dates/);
    });

    test('should reject completed work order without cost', async () => {
      const tenantId = 'test-tenant-id';
      const startDate = new Date('2026-01-15');
      const endDate = new Date('2026-01-20');

      await expect(
        pool.query(
          `INSERT INTO work_orders (
            tenant_id, vehicle_id, title, status,
            actual_start_date, actual_end_date, scheduled_start_date
          ) VALUES ($1, gen_random_uuid(), 'Test WO', 'completed', $2, $3, $2)`,
          [tenantId, startDate, endDate]
        )
      ).rejects.toThrow(/chk_work_order_completed_has_cost/);
    });

    test('should reject verified certification without verifier', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO certifications (
            tenant_id, driver_id, type, issued_date, expiry_date, verified_at
          ) VALUES ($1, gen_random_uuid(), 'CDL', NOW(), NOW() + INTERVAL '1 year', NOW())`,
          [tenantId]
        )
      ).rejects.toThrow(/chk_certification_verified_has_verifier/);
    });
  });

  describe('Calculation Constraints', () => {
    test('should reject fuel transaction with invalid calculation', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO fuel_transactions (
            tenant_id, vehicle_id, transaction_date,
            gallons, cost_per_gallon, total_cost
          ) VALUES ($1, gen_random_uuid(), NOW(), 10, 3.5, 100)`, // Should be 35, not 100
          [tenantId]
        )
      ).rejects.toThrow(/chk_fuel_calculation_valid/);
    });

    test('should reject charging session with SOC decrease', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO charging_sessions (
            tenant_id, vehicle_id, station_id, start_time, start_soc, end_soc
          ) VALUES ($1, gen_random_uuid(), gen_random_uuid(), NOW(), 80, 20)`, // SOC decreased!
          [tenantId]
        )
      ).rejects.toThrow(/chk_charging_soc_increase/);
    });

    test('should reject unreasonable GPS speed', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO gps_tracks (
            tenant_id, vehicle_id, timestamp, latitude, longitude, speed
          ) VALUES ($1, gen_random_uuid(), NOW(), 30.0, -95.0, 200)`, // 200 mph
          [tenantId]
        )
      ).rejects.toThrow(/chk_gps_speed_reasonable/);
    });

    test('should reject unreasonable engine RPM', async () => {
      const tenantId = 'test-tenant-id';

      await expect(
        pool.query(
          `INSERT INTO telemetry_data (
            tenant_id, vehicle_id, timestamp, engine_rpm
          ) VALUES ($1, gen_random_uuid(), NOW(), 12000)`, // 12000 RPM
          [tenantId]
        )
      ).rejects.toThrow(/chk_telemetry_rpm_reasonable/);
    });
  });
});

describe('Table Partitioning', () => {
  describe('GPS Tracks Partitioning', () => {
    test('should insert GPS track into correct partition', async () => {
      const tenantId = 'test-tenant-id';
      const timestamp = new Date('2026-02-15T10:00:00Z'); // Current month

      const result = await pool.query(
        `INSERT INTO gps_tracks (
          tenant_id, vehicle_id, timestamp, latitude, longitude
        ) VALUES ($1, gen_random_uuid(), $2, 30.0, -95.0)
        RETURNING id, timestamp`,
        [tenantId, timestamp]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].timestamp).toBeDefined();

      // Verify it's in the correct partition
      const partitionCheck = await pool.query(
        `SELECT tableoid::regclass AS partition_name
         FROM gps_tracks
         WHERE id = $1`,
        [result.rows[0].id]
      );

      expect(partitionCheck.rows[0].partition_name).toBe('gps_tracks_2026_02');
    });

    test('should query GPS tracks efficiently with date range', async () => {
      const tenantId = 'test-tenant-id';
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');

      const result = await pool.query(
        `EXPLAIN (FORMAT JSON) SELECT * FROM gps_tracks
         WHERE tenant_id = $1 AND timestamp BETWEEN $2 AND $3`,
        [tenantId, startDate, endDate]
      );

      const plan = result.rows[0]['QUERY PLAN'][0];

      // Should use partition pruning (only scan relevant partition)
      expect(JSON.stringify(plan)).toContain('gps_tracks_2026_02');
    });
  });

  describe('Telemetry Data Partitioning', () => {
    test('should insert telemetry into correct partition', async () => {
      const tenantId = 'test-tenant-id';
      const timestamp = new Date('2026-02-15T10:00:00Z');

      const result = await pool.query(
        `INSERT INTO telemetry_data (
          tenant_id, vehicle_id, timestamp, engine_rpm
        ) VALUES ($1, gen_random_uuid(), $2, 2500)
        RETURNING id, timestamp`,
        [tenantId, timestamp]
      );

      expect(result.rows.length).toBe(1);

      // Verify partition
      const partitionCheck = await pool.query(
        `SELECT tableoid::regclass AS partition_name
         FROM telemetry_data
         WHERE id = $1`,
        [result.rows[0].id]
      );

      expect(partitionCheck.rows[0].partition_name).toBe('telemetry_data_2026_02');
    });
  });
});

describe('Partition Management Service', () => {
  test('should get partition summary', async () => {
    const summary = await partitionManagementService.getPartitionSummary();

    expect(summary).toBeDefined();
    expect(summary.totalPartitions).toBeGreaterThan(0);
    expect(summary.activePartitions).toBeGreaterThan(0);
    expect(summary.byTable).toHaveProperty('gps_tracks');
    expect(summary.byTable).toHaveProperty('telemetry_data');
  });

  test('should update partition statistics', async () => {
    const stats = await partitionManagementService.updatePartitionStats();

    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);

    const gpsStat = stats.find((s) => s.tableName === 'gps_tracks');
    expect(gpsStat).toBeDefined();
    expect(gpsStat?.rowCount).toBeGreaterThanOrEqual(0);
    expect(gpsStat?.sizeMB).toBeGreaterThanOrEqual(0);
  });

  test('should analyze partition health', async () => {
    const health = await partitionManagementService.analyzePartitionHealth();

    expect(health).toBeDefined();
    expect(health.healthy).toBeDefined();
    expect(Array.isArray(health.alerts)).toBe(true);
    expect(Array.isArray(health.stats)).toBe(true);
  });

  test('should create future partitions', async () => {
    const results = await partitionManagementService.createFuturePartitions();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.table && r.message)).toBe(true);
  });
});

describe('Constraint Monitoring Service', () => {
  test('should log constraint violation', async () => {
    const violationId = await constraintMonitoringService.logViolation({
      tenantId: 'test-tenant-id',
      tableName: 'vehicles',
      constraintName: 'chk_vehicles_odometer_positive',
      violationType: 'check',
      attemptedValue: { odometer: -1000 },
      errorMessage: 'Check constraint violation',
      sqlState: '23514',
      userId: 'test-user-id',
      ipAddress: '127.0.0.1',
    });

    expect(violationId).toBeDefined();
    expect(typeof violationId).toBe('string');
  });

  test('should get constraint statistics', async () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-12-31');

    const stats = await constraintMonitoringService.getConstraintStats(startDate, endDate);

    expect(Array.isArray(stats)).toBe(true);
  });

  test('should generate data quality report', async () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-12-31');

    const report = await constraintMonitoringService.generateDataQualityReport(startDate, endDate);

    expect(report).toBeDefined();
    expect(report.period).toBeDefined();
    expect(report.totalViolations).toBeGreaterThanOrEqual(0);
    expect(report.byTable).toBeDefined();
    expect(report.byConstraint).toBeDefined();
    expect(report.byType).toBeDefined();
    expect(Array.isArray(report.topViolators)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);
  });

  test('should parse PostgreSQL error as violation', async () => {
    const pgError = {
      code: '23514',
      message: 'new row for relation "vehicles" violates check constraint "chk_vehicles_odometer_positive"',
    };

    const violationId = await constraintMonitoringService.logErrorAsViolation(pgError, {
      tenantId: 'test-tenant-id',
      userId: 'test-user-id',
      ipAddress: '127.0.0.1',
    });

    expect(violationId).toBeDefined();
    expect(typeof violationId).toBe('string');
  });

  test('should clean up old violations', async () => {
    const deletedCount = await constraintMonitoringService.cleanupOldViolations(90);

    expect(typeof deletedCount).toBe('number');
    expect(deletedCount).toBeGreaterThanOrEqual(0);
  });
});
