/**
 * Tire Management System Route Tests
 *
 * @module routes/__tests__/tires.test
 * @created 2026-02-02
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Pool } from 'pg';
import { tireRotationService } from '../../services/tire-rotation';
import { tireAnalyticsService } from '../../services/tire-analytics';
import {
  TireInventory,
  TireStatus,
  TireType,
  RotationPattern,
  RemovalReason,
  PressureLogSource
} from '../../types/tires';

describe('Tire Management System', () => {
  let pool: Pool;
  let testTenantId: string;
  let testUserId: string;
  let testVehicleId: string;
  let testFacilityId: string;
  let testTireId: string;

  beforeAll(async () => {
    // Initialize pool (use test database)
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fleet_test',
      user: process.env.DB_USER || 'fleet_user',
      password: process.env.DB_PASSWORD || 'fleet_test_pass'
    });

    // Create test tenant
    const tenantResult = await pool.query(
      `INSERT INTO tenants (tenant_name, is_active) VALUES ($1, $2) RETURNING id`,
      ['Test Tire Tenant', true]
    );
    testTenantId = tenantResult.rows[0].id;

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (tenant_id, email, full_name, is_active)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testTenantId, 'test@tire.com', 'Test User', true]
    );
    testUserId = userResult.rows[0].id;

    // Create test facility
    const facilityResult = await pool.query(
      `INSERT INTO facilities (tenant_id, name, address, city, state, zip_code)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [testTenantId, 'Test Warehouse', '123 Main St', 'Springfield', 'IL', '62701']
    );
    testFacilityId = facilityResult.rows[0].id;

    // Create test vehicle
    const vehicleResult = await pool.query(
      `INSERT INTO vehicles (tenant_id, vin, make, model, year, license_plate, type, odometer, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [testTenantId, 'TEST123456789TIRE', 'Ford', 'F-150', 2024, 'TIRE-001', 'truck', 10000, 'active']
    );
    testVehicleId = vehicleResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testTenantId) {
      await pool.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    }
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up tire data before each test
    if (testTenantId) {
      await pool.query('DELETE FROM tire_pressure_logs WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM tire_inspections WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM tire_rotation_schedules WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM vehicle_tire_positions WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM tire_inventory WHERE tenant_id = $1', [testTenantId]);
    }
  });

  describe('Tire Inventory Management', () => {
    it('should create a new tire in inventory', async () => {
      const result = await pool.query<TireInventory>(
        `INSERT INTO tire_inventory (
          tenant_id, tire_number, manufacturer, model, size,
          load_range, tire_type, tread_depth_32nds, dot_number,
          purchase_date, purchase_price, facility_id, expected_life_miles
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          testTenantId,
          'TIRE-001',
          'Michelin',
          'XZE2',
          '295/75R22.5',
          'H',
          TireType.DRIVE,
          20,
          'DOT123456789',
          new Date('2025-01-01'),
          450.00,
          testFacilityId,
          50000
        ]
      );

      const tire = result.rows[0];
      testTireId = tire.id;

      expect(tire).toBeDefined();
      expect(tire.tire_number).toBe('TIRE-001');
      expect(tire.manufacturer).toBe('Michelin');
      expect(tire.status).toBe(TireStatus.IN_STOCK);
      expect(tire.tread_depth_32nds).toBe(20);
      expect(tire.expected_life_miles).toBe(50000);
    });

    it('should update tire tread depth', async () => {
      // Create tire
      const createResult = await pool.query(
        `INSERT INTO tire_inventory (
          tenant_id, tire_number, manufacturer, model, size, tire_type
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [testTenantId, 'TIRE-002', 'Goodyear', 'G399A', '11R22.5', TireType.STEER]
      );
      const tireId = createResult.rows[0].id;

      // Update tread depth
      const updateResult = await pool.query(
        `UPDATE tire_inventory SET tread_depth_32nds = $1
         WHERE id = $2 AND tenant_id = $3 RETURNING *`,
        [12, tireId, testTenantId]
      );

      expect(updateResult.rows[0].tread_depth_32nds).toBe(12);
    });

    it('should list tires with status filter', async () => {
      // Create multiple tires
      await pool.query(
        `INSERT INTO tire_inventory (tenant_id, tire_number, manufacturer, model, size, tire_type, status)
         VALUES
         ($1, 'TIRE-100', 'Michelin', 'XZE2', '295/75R22.5', $2, $3),
         ($1, 'TIRE-101', 'Goodyear', 'G399A', '11R22.5', $2, $4),
         ($1, 'TIRE-102', 'Bridgestone', 'M726', '295/75R22.5', $2, $3)`,
        [testTenantId, TireType.DRIVE, TireStatus.IN_STOCK, TireStatus.MOUNTED]
      );

      const result = await pool.query(
        `SELECT * FROM tire_inventory WHERE tenant_id = $1 AND status = $2`,
        [testTenantId, TireStatus.IN_STOCK]
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows.every((t) => t.status === TireStatus.IN_STOCK)).toBe(true);
    });
  });

  describe('Tire Mounting Operations', () => {
    let mountedTireId: string;

    beforeEach(async () => {
      // Create a tire for mounting tests
      const result = await pool.query(
        `INSERT INTO tire_inventory (
          tenant_id, tire_number, manufacturer, model, size, tire_type
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [testTenantId, 'MOUNT-001', 'Michelin', 'XZE2', '295/75R22.5', TireType.DRIVE]
      );
      mountedTireId = result.rows[0].id;
    });

    it('should mount a tire to a vehicle position', async () => {
      const result = await pool.query(
        `INSERT INTO vehicle_tire_positions (
          tenant_id, vehicle_id, tire_id, position,
          mounted_date, mounted_odometer, mounted_by, is_current
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
        [testTenantId, testVehicleId, mountedTireId, 'LF', new Date(), 10000, testUserId]
      );

      const position = result.rows[0];
      expect(position.position).toBe('LF');
      expect(position.is_current).toBe(true);
      expect(position.mounted_odometer).toBe(10000);

      // Verify tire status updated
      const tireResult = await pool.query(
        'UPDATE tire_inventory SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING status',
        [TireStatus.MOUNTED, mountedTireId, testTenantId]
      );
      expect(tireResult.rows[0].status).toBe(TireStatus.MOUNTED);
    });

    it('should prevent mounting to occupied position', async () => {
      // Mount first tire
      await pool.query(
        `INSERT INTO vehicle_tire_positions (
          tenant_id, vehicle_id, tire_id, position,
          mounted_date, mounted_odometer, is_current
        ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [testTenantId, testVehicleId, mountedTireId, 'LF', new Date(), 10000]
      );

      // Try to mount another tire to same position
      const checkResult = await pool.query(
        `SELECT id FROM vehicle_tire_positions
         WHERE vehicle_id = $1 AND position = $2 AND is_current = true AND tenant_id = $3`,
        [testVehicleId, 'LF', testTenantId]
      );

      expect(checkResult.rows).toHaveLength(1);
    });

    it('should unmount a tire from a position', async () => {
      // Mount tire first
      await pool.query(
        `INSERT INTO vehicle_tire_positions (
          tenant_id, vehicle_id, tire_id, position,
          mounted_date, mounted_odometer, is_current
        ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [testTenantId, testVehicleId, mountedTireId, 'LF', new Date(), 10000]
      );

      // Unmount tire
      const result = await pool.query(
        `UPDATE vehicle_tire_positions
         SET is_current = false, removed_date = $1, removed_odometer = $2, removal_reason = $3
         WHERE vehicle_id = $4 AND position = $5 AND is_current = true AND tenant_id = $6
         RETURNING *`,
        [new Date(), 15000, RemovalReason.ROTATION, testVehicleId, 'LF', testTenantId]
      );

      const position = result.rows[0];
      expect(position.is_current).toBe(false);
      expect(position.removed_odometer).toBe(15000);
      expect(position.removal_reason).toBe(RemovalReason.ROTATION);
      expect(position.miles_on_tire).toBe(5000);
    });
  });

  describe('Tire Rotation Scheduling', () => {
    it('should create rotation schedule for vehicle', async () => {
      const schedule = await tireRotationService.createSchedule(testTenantId, {
        vehicle_id: testVehicleId,
        interval_miles: 8000,
        rotation_pattern: RotationPattern.FRONT_TO_REAR,
        alert_threshold_percentage: 80
      });

      expect(schedule).toBeDefined();
      expect(schedule.vehicle_id).toBe(testVehicleId);
      expect(schedule.interval_miles).toBe(8000);
      expect(schedule.rotation_pattern).toBe(RotationPattern.FRONT_TO_REAR);
      expect(schedule.is_active).toBe(true);
    });

    it('should create rotation schedule for vehicle type', async () => {
      const schedule = await tireRotationService.createSchedule(testTenantId, {
        vehicle_type: 'truck',
        interval_miles: 8000,
        rotation_pattern: RotationPattern.FRONT_TO_REAR
      });

      expect(schedule).toBeDefined();
      expect(schedule.vehicle_type).toBe('truck');
      expect(schedule.vehicle_id).toBeNull();
    });

    it('should retrieve rotation schedule for vehicle', async () => {
      // Create schedule
      await tireRotationService.createSchedule(testTenantId, {
        vehicle_id: testVehicleId,
        interval_miles: 8000,
        rotation_pattern: RotationPattern.FRONT_TO_REAR
      });

      // Retrieve schedule
      const schedule = await tireRotationService.getScheduleForVehicle(
        testVehicleId,
        testTenantId
      );

      expect(schedule).toBeDefined();
      expect(schedule!.interval_miles).toBe(8000);
    });

    it('should generate rotation alerts for overdue vehicles', async () => {
      // Create schedule with next rotation due
      await pool.query(
        `INSERT INTO tire_rotation_schedules (
          tenant_id, vehicle_id, interval_miles, rotation_pattern,
          last_rotation_odometer, next_rotation_odometer, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [testTenantId, testVehicleId, 8000, RotationPattern.FRONT_TO_REAR, 2000, 10000]
      );

      // Vehicle odometer is at 11000 (1000 miles overdue)
      await pool.query('UPDATE vehicles SET odometer = $1 WHERE id = $2', [11000, testVehicleId]);

      const alerts = await tireRotationService.getRotationAlerts(testTenantId);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alert_level).toBe('critical');
      expect(alerts[0].miles_overdue).toBe(1000);
    });
  });

  describe('Tire Rotation Execution', () => {
    let tire1Id: string;
    let tire2Id: string;
    let tire3Id: string;
    let tire4Id: string;

    beforeEach(async () => {
      // Create 4 tires
      const tire1 = await pool.query(
        `INSERT INTO tire_inventory (tenant_id, tire_number, manufacturer, model, size, tire_type)
         VALUES ($1, 'ROT-001', 'Michelin', 'XZE2', '295/75R22.5', $2) RETURNING id`,
        [testTenantId, TireType.DRIVE]
      );
      tire1Id = tire1.rows[0].id;

      const tire2 = await pool.query(
        `INSERT INTO tire_inventory (tenant_id, tire_number, manufacturer, model, size, tire_type)
         VALUES ($1, 'ROT-002', 'Michelin', 'XZE2', '295/75R22.5', $2) RETURNING id`,
        [testTenantId, TireType.DRIVE]
      );
      tire2Id = tire2.rows[0].id;

      const tire3 = await pool.query(
        `INSERT INTO tire_inventory (tenant_id, tire_number, manufacturer, model, size, tire_type)
         VALUES ($1, 'ROT-003', 'Michelin', 'XZE2', '295/75R22.5', $2) RETURNING id`,
        [testTenantId, TireType.DRIVE]
      );
      tire3Id = tire3.rows[0].id;

      const tire4 = await pool.query(
        `INSERT INTO tire_inventory (tenant_id, tire_number, manufacturer, model, size, tire_type)
         VALUES ($1, 'ROT-004', 'Michelin', 'XZE2', '295/75R22.5', $2) RETURNING id`,
        [testTenantId, TireType.DRIVE]
      );
      tire4Id = tire4.rows[0].id;

      // Mount all 4 tires
      await pool.query(
        `INSERT INTO vehicle_tire_positions (
          tenant_id, vehicle_id, tire_id, position, mounted_date, mounted_odometer, is_current
        ) VALUES
        ($1, $2, $3, 'LF', $4, 10000, true),
        ($1, $2, $5, 'RF', $4, 10000, true),
        ($1, $2, $6, 'LR1', $4, 10000, true),
        ($1, $2, $7, 'RR1', $4, 10000, true)`,
        [testTenantId, testVehicleId, tire1Id, new Date(), tire2Id, tire3Id, tire4Id]
      );
    });

    it('should execute front-to-rear rotation', async () => {
      const result = await tireRotationService.executeTireRotation(testVehicleId, testTenantId, {
        rotation_odometer: 18000,
        rotated_by: testUserId,
        rotation_pattern: RotationPattern.FRONT_TO_REAR,
        position_mappings: [
          { from_position: 'LF', to_position: 'LR1' },
          { from_position: 'RF', to_position: 'RR1' },
          { from_position: 'LR1', to_position: 'LF' },
          { from_position: 'RR1', to_position: 'RF' }
        ]
      });

      expect(result.success).toBe(true);

      // Verify new positions
      const newPositions = await pool.query(
        `SELECT tire_id, position FROM vehicle_tire_positions
         WHERE vehicle_id = $1 AND is_current = true AND tenant_id = $2
         ORDER BY position`,
        [testVehicleId, testTenantId]
      );

      expect(newPositions.rows).toHaveLength(4);
      // LR1 went to LF
      expect(newPositions.rows.find((p) => p.position === 'LF')?.tire_id).toBe(tire3Id);
    });
  });

  describe('Tire Inspections', () => {
    let inspectionTireId: string;

    beforeEach(async () => {
      const result = await pool.query(
        `INSERT INTO tire_inventory (tenant_id, tire_number, manufacturer, model, size, tire_type)
         VALUES ($1, 'INSP-001', 'Michelin', 'XZE2', '295/75R22.5', $2) RETURNING id`,
        [testTenantId, TireType.DRIVE]
      );
      inspectionTireId = result.rows[0].id;

      await pool.query(
        `INSERT INTO vehicle_tire_positions (
          tenant_id, vehicle_id, tire_id, position, mounted_date, mounted_odometer, is_current
        ) VALUES ($1, $2, $3, 'LF', $4, 10000, true)`,
        [testTenantId, testVehicleId, inspectionTireId, new Date()]
      );
    });

    it('should record tire inspection', async () => {
      const tirePositions = [
        {
          position: 'LF',
          tire_id: inspectionTireId,
          tread_depth: 12,
          psi: 105,
          condition: 'good' as const
        }
      ];

      const result = await pool.query(
        `INSERT INTO tire_inspections (
          tenant_id, vehicle_id, inspection_date, inspector_id,
          odometer_reading, tire_positions, defects_found
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          testTenantId,
          testVehicleId,
          new Date(),
          testUserId,
          15000,
          JSON.stringify(tirePositions),
          false
        ]
      );

      const inspection = result.rows[0];
      expect(inspection).toBeDefined();
      expect(inspection.odometer_reading).toBe(15000);
      expect(inspection.defects_found).toBe(false);
    });

    it('should record inspection with defects', async () => {
      const tirePositions = [
        {
          position: 'LF',
          tire_id: inspectionTireId,
          tread_depth: 4,
          psi: 85,
          condition: 'poor' as const
        }
      ];

      const defects = [
        {
          position: 'LF',
          issue: 'low tread depth',
          severity: 'high' as const,
          description: 'Tread depth at 4/32", replace soon'
        }
      ];

      const result = await pool.query(
        `INSERT INTO tire_inspections (
          tenant_id, vehicle_id, inspection_date, odometer_reading,
          tire_positions, defects_found, defects
        ) VALUES ($1, $2, $3, $4, $5, true, $6) RETURNING *`,
        [
          testTenantId,
          testVehicleId,
          new Date(),
          15000,
          JSON.stringify(tirePositions),
          JSON.stringify(defects)
        ]
      );

      const inspection = result.rows[0];
      expect(inspection.defects_found).toBe(true);
      expect(inspection.defects).toHaveLength(1);
    });
  });

  describe('Tire Pressure Monitoring', () => {
    it('should log tire pressure readings', async () => {
      const tirePositions = [
        { position: 'LF', psi: 105, temp_f: 80 },
        { position: 'RF', psi: 107, temp_f: 82 },
        { position: 'LR1', psi: 110, temp_f: 85 },
        { position: 'RR1', psi: 108, temp_f: 84 }
      ];

      const result = await pool.query(
        `INSERT INTO tire_pressure_logs (
          tenant_id, vehicle_id, log_date, tire_positions,
          checked_by, source
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          testTenantId,
          testVehicleId,
          new Date(),
          JSON.stringify(tirePositions),
          testUserId,
          PressureLogSource.MANUAL
        ]
      );

      const log = result.rows[0];
      expect(log).toBeDefined();
      expect(log.tire_positions).toHaveLength(4);
      expect(log.source).toBe(PressureLogSource.MANUAL);
    });

    it('should trigger low pressure alerts', async () => {
      const tirePositions = [
        { position: 'LF', psi: 80, temp_f: 75 }, // Low pressure
        { position: 'RF', psi: 105, temp_f: 82 }
      ];

      const alerts = [];
      for (const position of tirePositions) {
        if (position.psi < 95) {
          alerts.push({
            position: position.position,
            alert_type: 'low_pressure',
            threshold: 95,
            actual: position.psi,
            severity: position.psi < 85 ? 'critical' : 'warning'
          });
        }
      }

      const result = await pool.query(
        `INSERT INTO tire_pressure_logs (
          tenant_id, vehicle_id, tire_positions, alerts_triggered, source
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          testTenantId,
          testVehicleId,
          JSON.stringify(tirePositions),
          JSON.stringify(alerts),
          PressureLogSource.TPMS
        ]
      );

      const log = result.rows[0];
      expect(log.alerts_triggered).toHaveLength(1);
      expect(log.alerts_triggered[0].severity).toBe('critical');
    });
  });

  describe('Tire Analytics', () => {
    let analyticsTireId: string;

    beforeEach(async () => {
      // Create tire with full lifecycle
      const result = await pool.query(
        `INSERT INTO tire_inventory (
          tenant_id, tire_number, manufacturer, model, size, tire_type,
          purchase_price, expected_life_miles, tread_depth_32nds
        ) VALUES ($1, 'ANAL-001', 'Michelin', 'XZE2', '295/75R22.5', $2, 450, 50000, 20)
        RETURNING id`,
        [testTenantId, TireType.DRIVE]
      );
      analyticsTireId = result.rows[0].id;

      // Create mounting history
      await pool.query(
        `INSERT INTO vehicle_tire_positions (
          tenant_id, vehicle_id, tire_id, position,
          mounted_date, mounted_odometer, removed_date, removed_odometer,
          is_current, removal_reason
        ) VALUES ($1, $2, $3, 'LF', '2025-01-01', 10000, '2025-06-01', 30000, false, $4)`,
        [testTenantId, testVehicleId, analyticsTireId, RemovalReason.ROTATION]
      );
    });

    it('should calculate tire analytics', async () => {
      const analytics = await tireAnalyticsService.getTireAnalytics(
        analyticsTireId,
        testTenantId
      );

      expect(analytics).toBeDefined();
      expect(analytics.tire_id).toBe(analyticsTireId);
      expect(analytics.total_miles).toBe(20000);
      expect(analytics.cost_per_mile).toBeCloseTo(0.0225, 4);
    });

    it('should calculate vehicle tire status', async () => {
      // Mount tire to vehicle
      await pool.query(
        `UPDATE vehicle_tire_positions
         SET is_current = true, removed_date = NULL, removed_odometer = NULL
         WHERE tire_id = $1 AND tenant_id = $2`,
        [analyticsTireId, testTenantId]
      );

      await pool.query('UPDATE vehicles SET odometer = 35000 WHERE id = $1', [testVehicleId]);

      const status = await tireAnalyticsService.getVehicleTireStatus(
        testVehicleId,
        testTenantId
      );

      expect(status).toBeDefined();
      expect(status.vehicle_id).toBe(testVehicleId);
      expect(status.current_tires).toHaveLength(1);
    });
  });

  describe('Cost Analysis', () => {
    it('should calculate fleet tire cost analysis', async () => {
      // Create multiple tires with different statuses
      await pool.query(
        `INSERT INTO tire_inventory (
          tenant_id, tire_number, manufacturer, model, size, tire_type,
          purchase_price, expected_life_miles, status
        ) VALUES
        ($1, 'COST-001', 'Michelin', 'XZE2', '295/75R22.5', $2, 450, 50000, $3),
        ($1, 'COST-002', 'Goodyear', 'G399A', '11R22.5', $4, 380, 45000, $3),
        ($1, 'COST-003', 'Bridgestone', 'M726', '295/75R22.5', $2, 420, 48000, $5)`,
        [
          testTenantId,
          TireType.DRIVE,
          TireStatus.IN_STOCK,
          TireType.STEER,
          TireStatus.SCRAPPED
        ]
      );

      const analysis = await tireAnalyticsService.getTireCostAnalysis(testTenantId);

      expect(analysis).toBeDefined();
      expect(analysis.total_tire_cost).toBeGreaterThan(0);
      expect(analysis.tire_count).toBeGreaterThanOrEqual(3);
      expect(analysis.cost_optimization_recommendations).toBeDefined();
      expect(analysis.cost_optimization_recommendations.length).toBeGreaterThan(0);
    });
  });
});
