/**
 * Vehicle Assignments Repository
 * Agent 51 - Refactoring B3 - Eliminates 13 direct database queries from routes
 *
 * All queries use parameterized statements ($1, $2, $3) for security
 * All queries filter by tenant_id for multi-tenancy
 */

import { injectable, inject } from 'inversify';
import { Pool } from 'pg';

import logger from '../config/logger';
import { TYPES } from '../types';

export interface VehicleAssignment {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  driver_id: string;
  department_id?: string;
  assignment_type: 'designated' | 'on_call' | 'temporary';
  start_date: string;
  end_date?: string;
  is_ongoing: boolean;
  authorized_use?: string;
  commuting_authorized: boolean;
  on_call_only: boolean;
  geographic_constraints: Record<string, any>;
  requires_secured_parking: boolean;
  secured_parking_location_id?: string;
  lifecycle_state: string;
  approval_status?: string;
  recommendation_notes?: string;
  approval_notes?: string;
  denial_reason?: string;
  created_by_user_id: string;
  recommended_by_user_id?: string;
  approved_by_user_id?: string;
  denied_by_user_id?: string;
  recommended_at?: Date;
  approved_at?: Date;
  denied_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleAssignmentFilters {
  assignment_type?: string;
  lifecycle_state?: string;
  driver_id?: string;
  vehicle_id?: string;
  department_id?: string;
  user_scope?: 'own' | 'team' | 'fleet';
  user_id?: string;
  team_driver_ids?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface CreateAssignmentData {
  vehicle_id: string;
  driver_id: string;
  department_id?: string;
  assignment_type: 'designated' | 'on_call' | 'temporary';
  start_date: string;
  end_date?: string;
  is_ongoing: boolean;
  authorized_use?: string;
  commuting_authorized: boolean;
  on_call_only: boolean;
  geographic_constraints?: Record<string, any>;
  requires_secured_parking: boolean;
  secured_parking_location_id?: string;
  recommendation_notes?: string;
}

export interface UpdateAssignmentData {
  vehicle_id?: string;
  driver_id?: string;
  department_id?: string;
  assignment_type?: 'designated' | 'on_call' | 'temporary';
  start_date?: string;
  end_date?: string;
  is_ongoing?: boolean;
  authorized_use?: string;
  commuting_authorized?: boolean;
  on_call_only?: boolean;
  geographic_constraints?: Record<string, any>;
  requires_secured_parking?: boolean;
  secured_parking_location_id?: string;
  recommendation_notes?: string;
}

@injectable()
export class VehicleAssignmentsRepository {
  constructor(@inject(TYPES.DatabasePool) private pool: Pool) {}

  /**
   * Query 1: Get paginated list of vehicle assignments with filters
   * Used in GET /vehicle-assignments
   */
  async findAll(
    tenantId: string,
    filters: VehicleAssignmentFilters,
    pagination: PaginationOptions
  ): Promise<any[]> {
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = ['va.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    // Apply scope filtering
    if (filters.user_scope === 'own' && filters.user_id) {
      whereConditions.push(`dr.user_id = $${paramIndex++}`);
      params.push(filters.user_id);
    } else if (filters.user_scope === 'team' && filters.team_driver_ids) {
      whereConditions.push(`va.driver_id = ANY($${paramIndex++}::uuid[])`);
      params.push(filters.team_driver_ids);
    }

    // Add filters
    if (filters.assignment_type) {
      whereConditions.push(`va.assignment_type = $${paramIndex++}`);
      params.push(filters.assignment_type);
    }
    if (filters.lifecycle_state) {
      whereConditions.push(`va.lifecycle_state = $${paramIndex++}`);
      params.push(filters.lifecycle_state);
    }
    if (filters.driver_id) {
      whereConditions.push(`va.driver_id = $${paramIndex++}`);
      params.push(filters.driver_id);
    }
    if (filters.vehicle_id) {
      whereConditions.push(`va.vehicle_id = $${paramIndex++}`);
      params.push(filters.vehicle_id);
    }
    if (filters.department_id) {
      whereConditions.push(`va.department_id = $${paramIndex++}`);
      params.push(filters.department_id);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT
        va.*,
        v.unit_number, v.make, v.model, v.year, v.vin,
        v.classification AS vehicle_classification,
        dr.employee_number, dr.position_title, dr.home_county, dr.on_call_eligible,
        u.first_name AS driver_first_name, u.last_name AS driver_last_name, u.email AS driver_email,
        dept.name AS department_name, dept.code AS department_code,
        sp.name AS secured_parking_name, sp.address AS secured_parking_address,
        rec_user.first_name AS recommended_by_first_name, rec_user.last_name AS recommended_by_last_name,
        app_user.first_name AS approved_by_first_name, app_user.last_name AS approved_by_last_name,
        cba.id AS cost_benefit_id, cba.net_benefit
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      JOIN drivers dr ON va.driver_id = dr.id
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN departments dept ON va.department_id = dept.id
      LEFT JOIN secured_parking_locations sp ON va.secured_parking_location_id = sp.id
      LEFT JOIN users rec_user ON va.recommended_by_user_id = rec_user.id
      LEFT JOIN users app_user ON va.approved_by_user_id = app_user.id
      LEFT JOIN cost_benefit_analyses cba ON va.cost_benefit_analysis_id = cba.id
      WHERE ${whereClause}
      ORDER BY va.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(pagination.limit, offset);

    logger.debug('VehicleAssignmentsRepository.findAll', { query, params });
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Query 2: Get total count for pagination
   * Used in GET /vehicle-assignments
   */
  async count(tenantId: string, filters: VehicleAssignmentFilters): Promise<number> {
    const whereConditions = ['va.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    // Apply scope filtering
    if (filters.user_scope === 'own' && filters.user_id) {
      whereConditions.push(`dr.user_id = $${paramIndex++}`);
      params.push(filters.user_id);
    } else if (filters.user_scope === 'team' && filters.team_driver_ids) {
      whereConditions.push(`va.driver_id = ANY($${paramIndex++}::uuid[])`);
      params.push(filters.team_driver_ids);
    }

    // Add filters
    if (filters.assignment_type) {
      whereConditions.push(`va.assignment_type = $${paramIndex++}`);
      params.push(filters.assignment_type);
    }
    if (filters.lifecycle_state) {
      whereConditions.push(`va.lifecycle_state = $${paramIndex++}`);
      params.push(filters.lifecycle_state);
    }
    if (filters.driver_id) {
      whereConditions.push(`va.driver_id = $${paramIndex++}`);
      params.push(filters.driver_id);
    }
    if (filters.vehicle_id) {
      whereConditions.push(`va.vehicle_id = $${paramIndex++}`);
      params.push(filters.vehicle_id);
    }
    if (filters.department_id) {
      whereConditions.push(`va.department_id = $${paramIndex++}`);
      params.push(filters.department_id);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT COUNT(*) as total
      FROM vehicle_assignments va
      JOIN drivers dr ON va.driver_id = dr.id
      WHERE ${whereClause}
    `;

    logger.debug('VehicleAssignmentsRepository.count', { query, params });
    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].total);
  }

  /**
   * Query 3: Get single assignment by ID with full details
   * Used in GET /vehicle-assignments/:id
   */
  async findById(id: string, tenantId: string): Promise<any | null> {
    const query = `
      SELECT
        va.*,
        v.unit_number, v.make, v.model, v.year, v.vin, v.license_plate,
        v.classification AS vehicle_classification, v.ownership_type,
        dr.employee_number, dr.position_title, dr.home_county, dr.home_city,
        dr.home_state, dr.residence_region, dr.on_call_eligible,
        u.first_name AS driver_first_name, u.last_name AS driver_last_name,
        u.email AS driver_email, u.phone AS driver_phone,
        dept.name AS department_name, dept.code AS department_code,
        sp.name AS secured_parking_name, sp.address AS secured_parking_address,
        sp.city AS secured_parking_city, sp.state AS secured_parking_state,
        rec_user.first_name AS recommended_by_first_name, rec_user.last_name AS recommended_by_last_name,
        app_user.first_name AS approved_by_first_name, app_user.last_name AS approved_by_last_name,
        den_user.first_name AS denied_by_first_name, den_user.last_name AS denied_by_last_name,
        cba.id AS cost_benefit_id, cba.net_benefit, cba.total_annual_costs,
        cba.total_annual_benefits
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      JOIN drivers dr ON va.driver_id = dr.id
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN departments dept ON va.department_id = dept.id
      LEFT JOIN secured_parking_locations sp ON va.secured_parking_location_id = sp.id
      LEFT JOIN users rec_user ON va.recommended_by_user_id = rec_user.id
      LEFT JOIN users app_user ON va.approved_by_user_id = app_user.id
      LEFT JOIN users den_user ON va.denied_by_user_id = den_user.id
      LEFT JOIN cost_benefit_analyses cba ON va.cost_benefit_analysis_id = cba.id
      WHERE va.id = $1 AND va.tenant_id = $2
    `;

    logger.debug('VehicleAssignmentsRepository.findById', { id, tenantId });
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Query 4: Check if driver is in allowed region
   * Used in POST /vehicle-assignments
   */
  async isDriverInAllowedRegion(driverId: string, tenantId: string): Promise<boolean> {
    const query = `SELECT is_driver_in_allowed_region($1, $2) as is_allowed`;

    logger.debug('VehicleAssignmentsRepository.isDriverInAllowedRegion', { driverId, tenantId });
    const result = await this.pool.query(query, [driverId, tenantId]);
    return result.rows[0].is_allowed;
  }

  /**
   * Query 5: Create new vehicle assignment
   * Used in POST /vehicle-assignments
   */
  async create(
    tenantId: string,
    userId: string,
    data: CreateAssignmentData
  ): Promise<VehicleAssignment> {
    const query = `
      INSERT INTO vehicle_assignments (
        tenant_id, vehicle_id, driver_id, department_id,
        assignment_type, start_date, end_date, is_ongoing,
        authorized_use, commuting_authorized, on_call_only,
        geographic_constraints, requires_secured_parking, secured_parking_location_id,
        recommendation_notes, created_by_user_id, lifecycle_state
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft'
      )
      RETURNING *
    `;

    const params = [
      tenantId,
      data.vehicle_id,
      data.driver_id,
      data.department_id || null,
      data.assignment_type,
      data.start_date,
      data.end_date || null,
      data.is_ongoing,
      data.authorized_use || null,
      data.commuting_authorized,
      data.on_call_only,
      JSON.stringify(data.geographic_constraints || {}),
      data.requires_secured_parking,
      data.secured_parking_location_id || null,
      data.recommendation_notes || null,
      userId,
    ];

    logger.debug('VehicleAssignmentsRepository.create', { params });
    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Query 6: Update vehicle assignment
   * Used in PUT /vehicle-assignments/:id
   */
  async update(
    id: string,
    tenantId: string,
    data: UpdateAssignmentData
  ): Promise<VehicleAssignment | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`);
        params.push(key === 'geographic_constraints' ? JSON.stringify(value) : value);
      }
    });

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = NOW()`);
    params.push(id, tenantId);

    const query = `
      UPDATE vehicle_assignments
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
      RETURNING *
    `;

    logger.debug('VehicleAssignmentsRepository.update', { id, tenantId, updates });
    const result = await this.pool.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Query 7: Update lifecycle state
   * Used in POST /vehicle-assignments/:id/lifecycle
   */
  async updateLifecycleState(
    id: string,
    tenantId: string,
    lifecycleState: string
  ): Promise<VehicleAssignment | null> {
    const query = `
      UPDATE vehicle_assignments
      SET lifecycle_state = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;

    logger.debug('VehicleAssignmentsRepository.updateLifecycleState', { id, tenantId, lifecycleState });
    const result = await this.pool.query(query, [lifecycleState, id, tenantId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Query 8: Recommend assignment for approval
   * Used in POST /vehicle-assignments/:id/recommend
   */
  async recommend(
    id: string,
    tenantId: string,
    userId: string,
    notes?: string
  ): Promise<VehicleAssignment | null> {
    const query = `
      UPDATE vehicle_assignments
      SET
        lifecycle_state = 'submitted',
        recommended_by_user_id = $1,
        recommended_at = NOW(),
        recommendation_notes = $2,
        updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `;

    logger.debug('VehicleAssignmentsRepository.recommend', { id, tenantId, userId });
    const result = await this.pool.query(query, [userId, notes || null, id, tenantId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Query 9: Approve assignment
   * Used in POST /vehicle-assignments/:id/approve (approve action)
   */
  async approve(
    id: string,
    tenantId: string,
    userId: string,
    notes?: string
  ): Promise<VehicleAssignment | null> {
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

    logger.debug('VehicleAssignmentsRepository.approve', { id, tenantId, userId });
    const result = await this.pool.query(query, [userId, notes || null, id, tenantId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Query 10: Deny assignment
   * Used in POST /vehicle-assignments/:id/approve (deny action)
   */
  async deny(
    id: string,
    tenantId: string,
    userId: string,
    reason: string
  ): Promise<VehicleAssignment | null> {
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

    logger.debug('VehicleAssignmentsRepository.deny', { id, tenantId, userId });
    const result = await this.pool.query(query, [userId, reason, id, tenantId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Query 11: Activate assignment
   * Used in POST /vehicle-assignments/:id/activate
   */
  async activate(id: string, tenantId: string): Promise<VehicleAssignment | null> {
    const query = `
      UPDATE vehicle_assignments
      SET lifecycle_state = 'active', updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND approval_status = 'approved'
      RETURNING *
    `;

    logger.debug('VehicleAssignmentsRepository.activate', { id, tenantId });
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Query 12: Terminate assignment
   * Used in POST /vehicle-assignments/:id/terminate
   */
  async terminate(
    id: string,
    tenantId: string,
    reason: string,
    effectiveDate: string
  ): Promise<VehicleAssignment | null> {
    const query = `
      UPDATE vehicle_assignments
      SET
        lifecycle_state = 'terminated',
        end_date = $1,
        approval_notes = COALESCE(approval_notes, '') || E'\n\nTermination reason: ' || $2,
        updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `;

    logger.debug('VehicleAssignmentsRepository.terminate', { id, tenantId, reason, effectiveDate });
    const result = await this.pool.query(query, [effectiveDate, reason, id, tenantId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Query 13: Get assignment change history
   * Used in GET /vehicle-assignments/:id/history
   */
  async getHistory(id: string, tenantId: string): Promise<any[]> {
    const query = `
      SELECT
        vah.*,
        u.first_name, u.last_name, u.email
      FROM vehicle_assignment_history vah
      LEFT JOIN users u ON vah.changed_by_user_id = u.id
      WHERE vah.vehicle_assignment_id = $1 AND vah.tenant_id = $2
      ORDER BY vah.change_timestamp DESC
    `;

    logger.debug('VehicleAssignmentsRepository.getHistory', { id, tenantId });
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows;
  }

  /**
   * Bonus: Delete draft assignment
   * Used in DELETE /vehicle-assignments/:id
   */
  async deleteDraft(id: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM vehicle_assignments
      WHERE id = $1 AND tenant_id = $2 AND lifecycle_state = 'draft'
      RETURNING *
    `;

    logger.debug('VehicleAssignmentsRepository.deleteDraft', { id, tenantId });
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows.length > 0;
  }
}
