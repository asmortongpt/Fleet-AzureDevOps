/**
 * Tire Rotation Service
 * Manages automated rotation scheduling, pattern execution, and alerting
 */

import { db } from '../db';
import logger from '../config/logger';
import {
  TireRotationSchedule,
  CreateRotationScheduleInput,
  UpdateRotationScheduleInput,
  RotationAlert,
  RotationPattern,
  RotateTiresInput,
  VehicleTirePosition
} from '../types/tires';

export class TireRotationService {
  /**
   * Create a rotation schedule for a vehicle or vehicle type
   */
  async createSchedule(
    tenantId: string,
    input: CreateRotationScheduleInput
  ): Promise<TireRotationSchedule> {
    const {
      vehicle_id,
      vehicle_type,
      interval_miles,
      rotation_pattern,
      alert_threshold_percentage = 80,
      metadata = {}
    } = input;

    // Validate that either vehicle_id or vehicle_type is provided
    if (!vehicle_id && !vehicle_type) {
      throw new Error('Either vehicle_id or vehicle_type must be provided');
    }

    if (vehicle_id && vehicle_type) {
      throw new Error('Cannot specify both vehicle_id and vehicle_type');
    }

    const query = `
      INSERT INTO tire_rotation_schedules (
        tenant_id, vehicle_id, vehicle_type, interval_miles,
        rotation_pattern, alert_threshold_percentage, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await db.query<TireRotationSchedule>(query, [
      tenantId,
      vehicle_id || null,
      vehicle_type || null,
      interval_miles,
      rotation_pattern,
      alert_threshold_percentage,
      metadata
    ]);

    logger.info('Created tire rotation schedule', {
      tenantId,
      scheduleId: result.rows[0].id,
      vehicleId: vehicle_id,
      vehicleType: vehicle_type
    });

    return result.rows[0];
  }

  /**
   * Update an existing rotation schedule
   */
  async updateSchedule(
    scheduleId: string,
    tenantId: string,
    input: UpdateRotationScheduleInput
  ): Promise<TireRotationSchedule> {
    const updates: string[] = [];
    const values: any[] = [scheduleId, tenantId];
    let paramIndex = 3;

    if (input.interval_miles !== undefined) {
      updates.push(`interval_miles = $${paramIndex++}`);
      values.push(input.interval_miles);
    }
    if (input.rotation_pattern !== undefined) {
      updates.push(`rotation_pattern = $${paramIndex++}`);
      values.push(input.rotation_pattern);
    }
    if (input.alert_threshold_percentage !== undefined) {
      updates.push(`alert_threshold_percentage = $${paramIndex++}`);
      values.push(input.alert_threshold_percentage);
    }
    if (input.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(input.is_active);
    }
    if (input.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(input.metadata);
    }

    if (updates.length === 0) {
      throw new Error('No updates provided');
    }

    const query = `
      UPDATE tire_rotation_schedules
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const result = await db.query<TireRotationSchedule>(query, values);

    if (result.rows.length === 0) {
      throw new Error('Rotation schedule not found');
    }

    return result.rows[0];
  }

  /**
   * Get rotation schedule for a vehicle
   */
  async getScheduleForVehicle(
    vehicleId: string,
    tenantId: string
  ): Promise<TireRotationSchedule | null> {
    // First, try to find vehicle-specific schedule
    let query = `
      SELECT * FROM tire_rotation_schedules
      WHERE vehicle_id = $1 AND tenant_id = $2 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    let result = await db.query<TireRotationSchedule>(query, [vehicleId, tenantId]);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Fall back to vehicle type schedule
    query = `
      SELECT trs.*
      FROM tire_rotation_schedules trs
      JOIN vehicles v ON v.type = trs.vehicle_type
      WHERE v.id = $1 AND v.tenant_id = $2
        AND trs.tenant_id = $2
        AND trs.is_active = true
        AND trs.vehicle_id IS NULL
      ORDER BY trs.created_at DESC
      LIMIT 1
    `;

    result = await db.query<TireRotationSchedule>(query, [vehicleId, tenantId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Execute a tire rotation
   */
  async executeTireRotation(
    vehicleId: string,
    tenantId: string,
    input: RotateTiresInput
  ): Promise<{ success: boolean; message: string }> {
    const {
      rotation_date = new Date(),
      rotation_odometer,
      rotated_by,
      rotation_pattern,
      position_mappings
    } = input;

    // Get current tire positions
    const currentPositionsQuery = `
      SELECT * FROM vehicle_tire_positions
      WHERE vehicle_id = $1 AND tenant_id = $2 AND is_current = true
    `;
    const currentPositions = await db.query<VehicleTirePosition>(currentPositionsQuery, [
      vehicleId,
      tenantId
    ]);

    if (currentPositions.rows.length === 0) {
      throw new Error('No current tire positions found for vehicle');
    }

    // Begin transaction
    await db.query('BEGIN');

    try {
      // Mark all current positions as removed
      for (const position of currentPositions.rows) {
        await db.query(
          `
          UPDATE vehicle_tire_positions
          SET is_current = false,
              removed_date = $1,
              removed_odometer = $2,
              removed_by = $3,
              removal_reason = 'rotation'
          WHERE id = $4 AND tenant_id = $5
          `,
          [rotation_date, rotation_odometer, rotated_by, position.id, tenantId]
        );
      }

      // Create new positions based on rotation mappings
      for (const mapping of position_mappings) {
        const oldPosition = currentPositions.rows.find(
          (p) => p.position === mapping.from_position
        );

        if (!oldPosition) {
          throw new Error(`Position ${mapping.from_position} not found in current positions`);
        }

        await db.query(
          `
          INSERT INTO vehicle_tire_positions (
            tenant_id, vehicle_id, tire_id, position,
            mounted_date, mounted_odometer, mounted_by, is_current
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          `,
          [
            tenantId,
            vehicleId,
            oldPosition.tire_id,
            mapping.to_position,
            rotation_date,
            rotation_odometer,
            rotated_by
          ]
        );
      }

      // Update rotation schedule
      const schedule = await this.getScheduleForVehicle(vehicleId, tenantId);
      if (schedule) {
        const nextRotationOdometer = rotation_odometer + schedule.interval_miles;
        await db.query(
          `
          UPDATE tire_rotation_schedules
          SET last_rotation_date = $1,
              last_rotation_odometer = $2,
              next_rotation_odometer = $3
          WHERE id = $4 AND tenant_id = $5
          `,
          [rotation_date, rotation_odometer, nextRotationOdometer, schedule.id, tenantId]
        );
      }

      await db.query('COMMIT');

      logger.info('Tire rotation executed successfully', {
        vehicleId,
        tenantId,
        rotationPattern: rotation_pattern,
        odometer: rotation_odometer
      });

      return {
        success: true,
        message: `Tire rotation completed successfully using ${rotation_pattern} pattern`
      };
    } catch (error) {
      await db.query('ROLLBACK');
      logger.error('Tire rotation failed', { error, vehicleId, tenantId });
      throw error;
    }
  }

  /**
   * Get rotation alerts for vehicles due or overdue for rotation
   */
  async getRotationAlerts(
    tenantId: string,
    alertLevel?: 'info' | 'warning' | 'critical'
  ): Promise<RotationAlert[]> {
    const query = `
      SELECT
        v.id as vehicle_id,
        v.make || ' ' || v.model || ' (' || v.license_plate || ')' as vehicle_name,
        v.odometer as current_odometer,
        trs.next_rotation_odometer,
        trs.interval_miles,
        trs.alert_threshold_percentage,
        trs.id as schedule_id,
        trs.vehicle_id,
        trs.vehicle_type,
        trs.rotation_pattern,
        trs.last_rotation_date,
        trs.last_rotation_odometer,
        trs.is_active,
        trs.metadata,
        trs.created_at,
        trs.updated_at
      FROM vehicles v
      LEFT JOIN tire_rotation_schedules trs ON (
        trs.vehicle_id = v.id OR (trs.vehicle_type = v.type AND trs.vehicle_id IS NULL)
      )
      WHERE v.tenant_id = $1
        AND trs.is_active = true
        AND trs.next_rotation_odometer IS NOT NULL
        AND v.odometer IS NOT NULL
      ORDER BY v.odometer - trs.next_rotation_odometer DESC
    `;

    const result = await db.query(query, [tenantId]);
    const alerts: RotationAlert[] = [];

    for (const row of result.rows) {
      const currentOdometer = row.current_odometer;
      const nextRotationOdometer = row.next_rotation_odometer;
      const alertThreshold = row.alert_threshold_percentage / 100;
      const intervalMiles = row.interval_miles;

      // Calculate alert level
      let calculatedAlertLevel: 'info' | 'warning' | 'critical';
      let milesOverdue = 0;

      if (currentOdometer >= nextRotationOdometer) {
        calculatedAlertLevel = 'critical';
        milesOverdue = currentOdometer - nextRotationOdometer;
      } else if (currentOdometer >= nextRotationOdometer * alertThreshold) {
        calculatedAlertLevel = 'warning';
      } else {
        calculatedAlertLevel = 'info';
      }

      // Filter by alert level if specified
      if (alertLevel && calculatedAlertLevel !== alertLevel) {
        continue;
      }

      const schedule: TireRotationSchedule = {
        id: row.schedule_id,
        tenant_id: tenantId,
        vehicle_id: row.vehicle_id,
        vehicle_type: row.vehicle_type,
        interval_miles: row.interval_miles,
        rotation_pattern: row.rotation_pattern,
        last_rotation_date: row.last_rotation_date,
        last_rotation_odometer: row.last_rotation_odometer,
        next_rotation_odometer: row.next_rotation_odometer,
        alert_threshold_percentage: row.alert_threshold_percentage,
        is_active: row.is_active,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      alerts.push({
        vehicle_id: row.vehicle_id,
        vehicle_name: row.vehicle_name,
        current_odometer: currentOdometer,
        next_rotation_odometer: nextRotationOdometer,
        miles_overdue: milesOverdue > 0 ? milesOverdue : undefined,
        alert_level: calculatedAlertLevel,
        schedule
      });
    }

    return alerts;
  }

  /**
   * Calculate next rotation odometer based on current odometer and interval
   */
  async calculateNextRotation(
    vehicleId: string,
    tenantId: string,
    currentOdometer: number
  ): Promise<number> {
    const schedule = await this.getScheduleForVehicle(vehicleId, tenantId);

    if (!schedule) {
      throw new Error('No rotation schedule found for vehicle');
    }

    return currentOdometer + schedule.interval_miles;
  }

  /**
   * Get rotation pattern recommendations based on vehicle type
   */
  getRotationPatternForVehicleType(vehicleType: string): RotationPattern {
    const patterns: Record<string, RotationPattern> = {
      sedan: RotationPattern.CROSS,
      suv: RotationPattern.CROSS,
      truck: RotationPattern.FRONT_TO_REAR,
      van: RotationPattern.FRONT_TO_REAR,
      'commercial-truck': RotationPattern.FRONT_TO_REAR,
      trailer: RotationPattern.SIDE_TO_SIDE
    };

    return patterns[vehicleType.toLowerCase()] || RotationPattern.FRONT_TO_REAR;
  }

  /**
   * Generate position mappings for common rotation patterns
   */
  generateRotationMappings(
    pattern: RotationPattern,
    currentPositions: string[]
  ): Array<{ from_position: string; to_position: string }> {
    const mappings: Array<{ from_position: string; to_position: string }> = [];

    switch (pattern) {
      case RotationPattern.FRONT_TO_REAR:
        // LF -> LR, RF -> RR, LR -> LF, RR -> RF
        if (currentPositions.includes('LF') && currentPositions.includes('LR1')) {
          mappings.push({ from_position: 'LF', to_position: 'LR1' });
        }
        if (currentPositions.includes('RF') && currentPositions.includes('RR1')) {
          mappings.push({ from_position: 'RF', to_position: 'RR1' });
        }
        if (currentPositions.includes('LR1') && currentPositions.includes('LF')) {
          mappings.push({ from_position: 'LR1', to_position: 'LF' });
        }
        if (currentPositions.includes('RR1') && currentPositions.includes('RF')) {
          mappings.push({ from_position: 'RR1', to_position: 'RF' });
        }
        break;

      case RotationPattern.CROSS:
        // LF -> RR, RF -> LR, LR -> RF, RR -> LF
        mappings.push(
          { from_position: 'LF', to_position: 'RR1' },
          { from_position: 'RF', to_position: 'LR1' },
          { from_position: 'LR1', to_position: 'RF' },
          { from_position: 'RR1', to_position: 'LF' }
        );
        break;

      case RotationPattern.REARWARD_CROSS:
        // LF -> LR, RF -> RR, LR -> RF, RR -> LF
        mappings.push(
          { from_position: 'LF', to_position: 'LR1' },
          { from_position: 'RF', to_position: 'RR1' },
          { from_position: 'LR1', to_position: 'RF' },
          { from_position: 'RR1', to_position: 'LF' }
        );
        break;

      case RotationPattern.SIDE_TO_SIDE:
        // LR1 <-> LR2, RR1 <-> RR2
        mappings.push(
          { from_position: 'LR1', to_position: 'LR2' },
          { from_position: 'LR2', to_position: 'LR1' },
          { from_position: 'RR1', to_position: 'RR2' },
          { from_position: 'RR2', to_position: 'RR1' }
        );
        break;

      default:
        throw new Error(`Unsupported rotation pattern: ${pattern}`);
    }

    return mappings;
  }
}

export const tireRotationService = new TireRotationService();
