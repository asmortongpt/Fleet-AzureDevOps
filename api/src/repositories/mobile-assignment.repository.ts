import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';

export interface MobileAssignmentRepository {
  findDriverByUserId(userId: string, tenantId: number): Promise<any>;
  findActiveAssignmentsByDriver(driverId: string, tenantId: number): Promise<any[]>;
  findUpcomingOnCallPeriods(driverId: string, tenantId: number, limit: number): Promise<any[]>;
  findRecentCallbackTrips(driverId: string, tenantId: number, limit: number): Promise<any[]>;
  findPendingReimbursements(driverId: string, tenantId: number): Promise<{ pending_count: string; pending_amount: string }>;
  findOnCallPeriodWithDriver(periodId: string, tenantId: number): Promise<any | null>;
  acknowledgeOnCallPeriod(periodId: string, tenantId: number): Promise<any>;
  createCallbackTrip(data: any): Promise<any>;
  incrementCallbackCount(onCallPeriodId: string, tenantId: number): Promise<void>;
  findPendingAssignmentsForManager(tenantId: number, teamDriverIds: string[], scopeLevel: string): Promise<any[]>;
  findActiveAssignmentsForManager(tenantId: number, teamDriverIds: string[], scopeLevel: string, limit: number): Promise<any[]>;
  findCurrentOnCallForManager(tenantId: number, teamDriverIds: string[], scopeLevel: string): Promise<any[]>;
  findComplianceExceptionsCount(tenantId: number): Promise<number>;
  approveAssignment(assignmentId: string, userId: string, notes: string | null, tenantId: number): Promise<any | null>;
  denyAssignment(assignmentId: string, userId: string, notes: string | null, tenantId: number): Promise<any | null>;
  findOfflineAssignments(driverId: string, tenantId: number): Promise<any[]>;
  findOfflineOnCallPeriods(driverId: string, tenantId: number): Promise<any[]>;
  findOfflineVehicles(driverId: string, tenantId: number): Promise<any[]>;
  findOfflineSecuredParking(driverId: string, tenantId: number): Promise<any[]>;
}

export class MobileAssignmentRepositoryImpl implements MobileAssignmentRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findDriverByUserId(userId: string, tenantId: number): Promise<any> {
    const result = await this.pool.query(
      'SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
    return result.rows[0] || null;
  }

  async findActiveAssignmentsByDriver(driverId: string, tenantId: number): Promise<any[]> {
    const query = `
      SELECT
        va.*,
        v.unit_number, v.make, v.model, v.year, v.license_plate, v.fuel_type,
        v.classification as vehicle_classification,
        sp.name as secured_parking_name,
        sp.address as secured_parking_address,
        sp.city as secured_parking_city,
        sp.latitude as parking_latitude,
        sp.longitude as parking_longitude
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      LEFT JOIN secured_parking_locations sp ON va.secured_parking_location_id = sp.id
      WHERE va.driver_id = $1
        AND va.tenant_id = $2
        AND va.lifecycle_state IN ('active', 'approved')
      ORDER BY va.created_at DESC
    `;
    const result = await this.pool.query(query, [driverId, tenantId]);
    return result.rows;
  }

  async findUpcomingOnCallPeriods(driverId: string, tenantId: number, limit: number): Promise<any[]> {
    const query = `
      SELECT
        ocp.*,
        va.vehicle_id,
        v.unit_number, v.make, v.model, v.license_plate
      FROM on_call_periods ocp
      LEFT JOIN vehicle_assignments va ON ocp.on_call_vehicle_assignment_id = va.id
      LEFT JOIN vehicles v ON va.vehicle_id = v.id
      WHERE ocp.driver_id = $1
        AND ocp.tenant_id = $2
        AND ocp.is_active = true
        AND ocp.end_datetime >= NOW()
      ORDER BY ocp.start_datetime
      LIMIT $3
    `;
    const result = await this.pool.query(query, [driverId, tenantId, limit]);
    return result.rows;
  }

  async findRecentCallbackTrips(driverId: string, tenantId: number, limit: number): Promise<any[]> {
    const query = `
      SELECT oct.*, ocp.start_datetime, ocp.end_datetime
      FROM on_call_callback_trips oct
      JOIN on_call_periods ocp ON oct.on_call_period_id = ocp.id
      WHERE oct.driver_id = $1
        AND oct.tenant_id = $2
      ORDER BY oct.trip_date DESC
      LIMIT $3
    `;
    const result = await this.pool.query(query, [driverId, tenantId, limit]);
    return result.rows;
  }

  async findPendingReimbursements(driverId: string, tenantId: number): Promise<{ pending_count: string; pending_amount: string }> {
    const query = `
      SELECT COUNT(*) as pending_count, SUM(reimbursement_amount) as pending_amount
      FROM on_call_callback_trips
      WHERE driver_id = $1
        AND tenant_id = $2
        AND reimbursement_requested = true
        AND reimbursement_status = 'pending'
    `;
    const result = await this.pool.query(query, [driverId, tenantId]);
    return result.rows[0];
  }

  async findOnCallPeriodWithDriver(periodId: string, tenantId: number): Promise<any | null> {
    const query = `
      SELECT ocp.*, dr.user_id
      FROM on_call_periods ocp
      JOIN drivers dr ON ocp.driver_id = dr.id
      WHERE ocp.id = $1 AND ocp.tenant_id = $2
    `;
    const result = await this.pool.query(query, [periodId, tenantId]);
    return result.rows[0] || null;
  }

  async acknowledgeOnCallPeriod(periodId: string, tenantId: number): Promise<any> {
    const query = `
      UPDATE on_call_periods
      SET
        acknowledged_by_driver = true,
        acknowledged_at = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [periodId, tenantId]);
    return result.rows[0];
  }

  async createCallbackTrip(data: {
    tenant_id: number;
    on_call_period_id: string;
    driver_id: string;
    trip_date: string;
    trip_start_time: string | null;
    trip_end_time: string | null;
    miles_driven: number;
    includes_commute_trip: boolean;
    commute_miles: number | null;
    used_assigned_vehicle: boolean;
    used_private_vehicle: boolean;
    purpose: string;
    notes: string | null;
    reimbursement_requested: boolean;
    reimbursement_amount: number;
  }): Promise<any> {
    const query = `
      INSERT INTO on_call_callback_trips (
        tenant_id, on_call_period_id, driver_id,
        trip_date, trip_start_time, trip_end_time,
        miles_driven, includes_commute_trip, commute_miles,
        used_assigned_vehicle, used_private_vehicle,
        purpose, notes,
        reimbursement_requested, reimbursement_amount, reimbursement_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending'
      )
      RETURNING *
    `;
    const params = [
      data.tenant_id,
      data.on_call_period_id,
      data.driver_id,
      data.trip_date,
      data.trip_start_time,
      data.trip_end_time,
      data.miles_driven,
      data.includes_commute_trip,
      data.commute_miles,
      data.used_assigned_vehicle,
      data.used_private_vehicle,
      data.purpose,
      data.notes,
      data.reimbursement_requested,
      data.reimbursement_amount,
    ];
    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async incrementCallbackCount(onCallPeriodId: string, tenantId: number): Promise<void> {
    await this.pool.query(
      `UPDATE on_call_periods
       SET callback_count = callback_count + 1
       WHERE id = $1 AND tenant_id = $2`,
      [onCallPeriodId, tenantId]
    );
  }

  async findPendingAssignmentsForManager(tenantId: number, teamDriverIds: string[], scopeLevel: string): Promise<any[]> {
    const query = `
      SELECT
        va.*,
        v.unit_number, v.make, v.model, v.year,
        dr.employee_number, dr.position_title,
        u.first_name || ' ' || u.last_name as driver_name,
        dept.name as department_name
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      JOIN drivers dr ON va.driver_id = dr.id
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN departments dept ON va.department_id = dept.id
      WHERE va.tenant_id = $1
        AND va.lifecycle_state = 'submitted'
        AND (va.driver_id = ANY($2::uuid[]) OR $3 = 'global')
      ORDER BY va.recommended_at ASC
    `;
    const result = await this.pool.query(query, [tenantId, teamDriverIds, scopeLevel]);
    return result.rows;
  }

  async findActiveAssignmentsForManager(tenantId: number, teamDriverIds: string[], scopeLevel: string, limit: number): Promise<any[]> {
    const query = `
      SELECT
        va.*,
        v.unit_number, v.make, v.model,
        dr.employee_number,
        u.first_name || ' ' || u.last_name as driver_name
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      JOIN drivers dr ON va.driver_id = dr.id
      LEFT JOIN users u ON dr.user_id = u.id
      WHERE va.tenant_id = $1
        AND va.lifecycle_state = 'active'
        AND (va.driver_id = ANY($2::uuid[]) OR $3 = 'global')
      ORDER BY va.start_date DESC
      LIMIT $4
    `;
    const result = await this.pool.query(query, [tenantId, teamDriverIds, scopeLevel, limit]);
    return result.rows;
  }

  async findCurrentOnCallForManager(tenantId: number, teamDriverIds: string[], scopeLevel: string): Promise<any[]> {
    const query = `
      SELECT
        ocp.*,
        dr.employee_number,
        u.first_name || ' ' || u.last_name as driver_name,
        u.phone as driver_phone,
        v.unit_number, v.make, v.model
      FROM on_call_periods ocp
      JOIN drivers dr ON ocp.driver_id = dr.id
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN vehicle_assignments va ON ocp.on_call_vehicle_assignment_id = va.id
      LEFT JOIN vehicles v ON va.vehicle_id = v.id
      WHERE ocp.tenant_id = $1
        AND ocp.is_active = true
        AND ocp.start_datetime <= NOW()
        AND ocp.end_datetime >= NOW()
        AND (ocp.driver_id = ANY($2::uuid[]) OR $3 = 'global')
      ORDER BY ocp.start_datetime
    `;
    const result = await this.pool.query(query, [tenantId, teamDriverIds, scopeLevel]);
    return result.rows;
  }

  async findComplianceExceptionsCount(tenantId: number): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as exception_count FROM v_policy_compliance_exceptions WHERE tenant_id = $1',
      [tenantId]
    );
    return parseInt(result.rows[0].exception_count) || 0;
  }

  async approveAssignment(assignmentId: string, userId: string, notes: string | null, tenantId: number): Promise<any | null> {
    const query = `
      UPDATE vehicle_assignments
      SET
        lifecycle_state = 'approved',
        approval_status = 'approved',
        approved_by_user_id = $1,
        approved_at = NOW(),
        approval_notes = $2,
        updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4 AND lifecycle_state = 'submitted'
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId, notes, assignmentId, tenantId]);
    return result.rows[0] || null;
  }

  async denyAssignment(assignmentId: string, userId: string, notes: string | null, tenantId: number): Promise<any | null> {
    const query = `
      UPDATE vehicle_assignments
      SET
        lifecycle_state = 'denied',
        approval_status = 'denied',
        denied_by_user_id = $1,
        denied_at = NOW(),
        denial_reason = $2,
        updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4 AND lifecycle_state = 'submitted'
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId, notes, assignmentId, tenantId]);
    return result.rows[0] || null;
  }

  async findOfflineAssignments(driverId: string, tenantId: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, tenant_id, vehicle_id, driver_id, assignment_type, start_date, end_date, status, created_at, updated_at 
       FROM vehicle_assignments
       WHERE driver_id = $1 AND tenant_id = $2
       AND lifecycle_state IN ('active', 'approved')`,
      [driverId, tenantId]
    );
    return result.rows;
  }

  async findOfflineOnCallPeriods(driverId: string, tenantId: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, tenant_id, driver_id, start_datetime, end_datetime, status, created_at, updated_at 
       FROM on_call_periods
       WHERE driver_id = $1 AND tenant_id = $2
       AND is_active = true AND end_datetime >= NOW() - INTERVAL '7 days'`,
      [driverId, tenantId]
    );
    return result.rows;
  }

  async findOfflineVehicles(driverId: string, tenantId: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT v.* FROM vehicles v
       JOIN vehicle_assignments va ON v.id = va.vehicle_id
       WHERE va.driver_id = $1 AND va.tenant_id = $2
       AND va.lifecycle_state = 'active'`,
      [driverId, tenantId]
    );
    return result.rows;
  }

  async findOfflineSecuredParking(driverId: string, tenantId: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT sp.* FROM secured_parking_locations sp
       JOIN vehicle_assignments va ON sp.id = va.secured_parking_location_id
       WHERE va.driver_id = $1 AND va.tenant_id = $2
       AND va.lifecycle_state = 'active'`,
      [driverId, tenantId]
    );
    return result.rows;
  }
}
