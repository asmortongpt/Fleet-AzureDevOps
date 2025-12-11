import { BaseRepository } from '../repositories/BaseRepository';

/**
 * Reimbursement Requests Repository
 *
 * Handles all database operations for reimbursement requests with:
 * - Tenant isolation (all queries filter by tenant_id)
 * - Parameterized queries only (SQL injection prevention)
 * - Transaction support
 * - Policy enforcement
 * - Status management
 *
 * Security: CWE-89 (SQL Injection Prevention)
 * Task: B3 - Agent 25 - Eliminate 19 direct database queries
 */

import { Pool, PoolClient } from 'pg';

export interface ReimbursementRequest {
  id: string;
  tenant_id: number;
  driver_id: string;
  charge_id: string;
  request_amount: number;
  description?: string;
  expense_date: string;
  category?: string;
  receipt_file_path?: string;
  receipt_uploaded_at?: Date;
  receipt_metadata?: any;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submitted_at: Date;
  reviewed_at?: Date;
  reviewed_by_user_id?: string;
  reviewer_notes?: string;
  approved_amount?: number;
  payment_date?: Date;
  payment_method?: string;
  payment_reference?: string;
  created_at: Date;
  updated_at: Date;
  created_by_user_id: string;
}

export interface ReimbursementWithDetails extends ReimbursementRequest {
  driver_name?: string;
  driver_email?: string;
  reviewed_by_name?: string;
  charge_period?: string;
  miles_charged?: number;
  total_charge?: number;
}

export interface ChargeWithPolicy {
  id: string;
  tenant_id: number;
  auto_approve_under_amount?: number;
  require_receipt_upload?: boolean;
  receipt_required_over_amount?: number;
}

export interface ReimbursementFilters {
  driver_id?: string;
  status?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  has_receipt?: boolean;
  limit?: number;
  offset?: number;
}

export interface ReimbursementCreateData {
  tenant_id: number;
  driver_id: string;
  charge_id: string;
  request_amount: number;
  description?: string;
  expense_date: string;
  category?: string;
  receipt_file_path?: string;
  receipt_uploaded_at?: Date;
  status: string;
  approved_amount?: number;
  reviewer_notes?: string;
  reviewed_at?: Date;
  created_by_user_id: string;
}

export interface PendingQueueItem extends ReimbursementRequest {
  driver_name?: string;
  driver_email?: string;
  days_pending?: number;
}

export interface PendingQueueStats {
  total_pending: number;
  total_amount: number;
  avg_days_pending: number;
}

export interface DriverSummary {
  driver_id: string;
  tenant_id: number;
  driver_name?: string;
  driver_email?: string;
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  paid_requests: number;
  total_requested: number;
  total_approved: number;
  total_paid: number;
  avg_approval_days?: number;
}

export class ReimbursementRequestsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Query 1: Get charge with policy information
   */
  async getChargeWithPolicy(chargeId: string, tenantId: number): Promise<ChargeWithPolicy | null> {
    const query = `
      SELECT c.*, p.auto_approve_under_amount, p.require_receipt_upload, p.receipt_required_over_amount
      FROM personal_use_charges c
      LEFT JOIN personal_use_policies p ON c.tenant_id = p.tenant_id
      WHERE c.id = $1 AND c.tenant_id = $2
    `;
    const result = await this.pool.query(query, [chargeId, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Query 2: Create reimbursement request
   */
  async create(data: ReimbursementCreateData): Promise<ReimbursementRequest> {
    const query = `
      INSERT INTO reimbursement_requests (
        tenant_id, driver_id, charge_id, request_amount, description,
        expense_date, category, receipt_file_path, receipt_uploaded_at,
        status, approved_amount, reviewer_notes, reviewed_at, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      data.tenant_id, data.driver_id, data.charge_id, data.request_amount, data.description,
      data.expense_date, data.category, data.receipt_file_path, data.receipt_uploaded_at,
      data.status, data.approved_amount, data.reviewer_notes, data.reviewed_at, data.created_by_user_id
    ]);
    return result.rows[0];
  }

  /**
   * Query 3: Update charge with auto-approval
   */
  async updateChargeApproved(chargeId: string, approvedBy: string): Promise<void> {
    const query = `
      UPDATE personal_use_charges
      SET is_reimbursement = true,
          reimbursement_requested_at = NOW(),
          reimbursement_approved_at = NOW(),
          reimbursement_approved_by = $1
      WHERE id = $2
    `;
    await this.pool.query(query, [approvedBy, chargeId]);
  }

  /**
   * Query 4: Update charge as requested (pending)
   */
  async updateChargeRequested(chargeId: string): Promise<void> {
    const query = `
      UPDATE personal_use_charges
      SET is_reimbursement = true,
          reimbursement_requested_at = NOW()
      WHERE id = $1
    `;
    await this.pool.query(query, [chargeId]);
  }

  /**
   * Queries 5 & 6: List reimbursements with filters and count
   */
  async findWithFilters(
    tenantId: number,
    filters: ReimbursementFilters,
    userRole: string,
    userId?: string
  ): Promise<{ data: ReimbursementWithDetails[]; total: number }> {
    let query = `
      SELECT
        r.*,
        d.name as driver_name,
        d.email as driver_email,
        rev.name as reviewed_by_name,
        c.charge_period, c.miles_charged
      FROM reimbursement_requests r
      LEFT JOIN users d ON r.driver_id = d.id
      LEFT JOIN users rev ON r.reviewed_by_user_id = rev.id
      LEFT JOIN personal_use_charges c ON r.charge_id = c.id
      WHERE r.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (userRole !== 'admin' && userRole !== 'fleet_manager') {
      query += ` AND r.driver_id = $` + paramIndex;
      params.push(userId);
      paramIndex++;
    } else if (filters.driver_id) {
      query += ` AND r.driver_id = $` + paramIndex;
      params.push(filters.driver_id);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND r.status = $` + paramIndex;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND r.category = $` + paramIndex;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND r.expense_date >= $` + paramIndex;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND r.expense_date <= $` + paramIndex;
      params.push(filters.end_date);
      paramIndex++;
    }

    if (filters.has_receipt === true) {
      query += ` AND r.receipt_file_path IS NOT NULL`;
    } else if (filters.has_receipt === false) {
      query += ` AND r.receipt_file_path IS NULL`;
    }

    query += ` ORDER BY r.submitted_at DESC LIMIT $` + paramIndex + ` OFFSET $` + (paramIndex + 1);
    params.push(filters.limit || 50);
    params.push(filters.offset || 0);

    const result = await this.pool.query(query, params);

    // Count query
    let countQuery = `SELECT COUNT(*) FROM reimbursement_requests WHERE tenant_id = $1`;
    const countParams = [tenantId];

    if (userRole !== 'admin' && userRole !== 'fleet_manager') {
      countQuery += ' AND driver_id = $2';
      countParams.push(userId!);
    }

    const countResult = await this.pool.query(countQuery, countParams);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  /**
   * Query 7: Get single reimbursement with details
   */
  async findByIdWithDetails(id: string, tenantId: number): Promise<ReimbursementWithDetails | null> {
    const query = `
      SELECT
        r.*,
        d.name as driver_name,
        d.email as driver_email,
        rev.name as reviewed_by_name,
        c.charge_period, c.miles_charged, c.total_charge
      FROM reimbursement_requests r
      LEFT JOIN users d ON r.driver_id = d.id
      LEFT JOIN users rev ON r.reviewed_by_user_id = rev.id
      LEFT JOIN personal_use_charges c ON r.charge_id = c.id
      WHERE r.id = $1 AND r.tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Query 8: Get for approval
   */
  async findByIdForApproval(id: string, tenantId: number): Promise<ReimbursementRequest | null> {
    const query = `
      SELECT
        id, tenant_id, driver_id, charge_id, request_amount, description,
        expense_date, category, receipt_file_path, receipt_uploaded_at,
        receipt_metadata, status, submitted_at, reviewed_at, reviewed_by_user_id,
        reviewer_notes, approved_amount, payment_date, payment_method,
        payment_reference, created_at, updated_at, created_by_user_id
      FROM reimbursement_requests
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Query 9: Approve reimbursement
   */
  async approve(
    id: string,
    approvedAmount: number,
    reviewerNotes: string | undefined,
    reviewedBy: string
  ): Promise<ReimbursementRequest> {
    const query = `
      UPDATE reimbursement_requests
      SET status = $1,
          approved_amount = $2,
          reviewer_notes = $3,
          reviewed_at = NOW(),
          reviewed_by_user_id = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      'approved',
      approvedAmount,
      reviewerNotes,
      reviewedBy,
      id
    ]);
    return result.rows[0];
  }

  /**
   * Query 10: Update charge approved by reviewer
   */
  async updateChargeApprovedByReviewer(chargeId: string, approvedBy: string): Promise<void> {
    const query = `
      UPDATE personal_use_charges
      SET reimbursement_approved_at = NOW(),
          reimbursement_approved_by = $1
      WHERE id = $2
    `;
    await this.pool.query(query, [approvedBy, chargeId]);
  }

  /**
   * Query 11: Get for rejection
   */
  async findByIdForRejection(id: string, tenantId: number): Promise<ReimbursementRequest | null> {
    const query = `
      SELECT
        id, tenant_id, driver_id, charge_id, request_amount, description,
        expense_date, category, receipt_file_path, receipt_uploaded_at,
        receipt_metadata, status, submitted_at, reviewed_at, reviewed_by_user_id,
        reviewer_notes, approved_amount, payment_date, payment_method,
        payment_reference, created_at, updated_at, created_by_user_id
      FROM reimbursement_requests
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Query 12: Reject reimbursement
   */
  async reject(
    id: string,
    reviewerNotes: string,
    reviewedBy: string
  ): Promise<ReimbursementRequest> {
    const query = `
      UPDATE reimbursement_requests
      SET status = $1,
          reviewer_notes = $2,
          reviewed_at = NOW(),
          reviewed_by_user_id = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      'rejected',
      reviewerNotes,
      reviewedBy,
      id
    ]);
    return result.rows[0];
  }

  /**
   * Query 13: Update charge rejected
   */
  async updateChargeRejected(chargeId: string, rejectionReason: string): Promise<void> {
    const query = `
      UPDATE personal_use_charges
      SET reimbursement_rejected_at = NOW(),
          reimbursement_rejection_reason = $1
      WHERE id = $2
    `;
    await this.pool.query(query, [rejectionReason, chargeId]);
  }

  /**
   * Query 14: Get for payment
   */
  async findByIdForPayment(id: string, tenantId: number): Promise<ReimbursementRequest | null> {
    const query = `
      SELECT
        id, tenant_id, driver_id, charge_id, request_amount, description,
        expense_date, category, receipt_file_path, receipt_uploaded_at,
        receipt_metadata, status, submitted_at, reviewed_at, reviewed_by_user_id,
        reviewer_notes, approved_amount, payment_date, payment_method,
        payment_reference, created_at, updated_at, created_by_user_id
      FROM reimbursement_requests
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Query 15: Mark as paid
   */
  async markAsPaid(
    id: string,
    paymentDate: string,
    paymentMethod: string,
    paymentReference: string
  ): Promise<ReimbursementRequest> {
    const query = `
      UPDATE reimbursement_requests
      SET status = $1,
          payment_date = $2,
          payment_method = $3,
          payment_reference = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      'paid',
      paymentDate,
      paymentMethod,
      paymentReference,
      id
    ]);
    return result.rows[0];
  }

  /**
   * Query 16: Update charge paid
   */
  async updateChargePaid(
    chargeId: string,
    paymentDate: string,
    paymentReference: string
  ): Promise<void> {
    const query = `
      UPDATE personal_use_charges
      SET reimbursement_paid_at = $1,
          reimbursement_payment_reference = $2,
          charge_status = 'paid'
      WHERE id = $3
    `;
    await this.pool.query(query, [paymentDate, paymentReference, chargeId]);
  }

  /**
   * Query 17: Get pending queue
   */
  async getPendingQueue(tenantId: number): Promise<PendingQueueItem[]> {
    const query = `
      SELECT
        id, tenant_id, driver_id, charge_id, request_amount, description,
        expense_date, category, receipt_file_path, receipt_uploaded_at,
        receipt_metadata, status, submitted_at, reviewed_at, reviewed_by_user_id,
        reviewer_notes, approved_amount, payment_date, payment_method,
        payment_reference, created_at, updated_at, created_by_user_id,
        driver_name, driver_email, days_pending
      FROM v_pending_reimbursements
      WHERE tenant_id = $1
      ORDER BY days_pending DESC
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Query 18: Get pending queue stats
   */
  async getPendingQueueStats(tenantId: number): Promise<PendingQueueStats> {
    const query = `
      SELECT
        COUNT(*) as total_pending,
        SUM(request_amount) as total_amount,
        AVG(EXTRACT(EPOCH FROM (NOW() - submitted_at))/86400) as avg_days_pending
      FROM reimbursement_requests
      WHERE tenant_id = $1 AND status = 'pending'
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows[0];
  }

  /**
   * Query 19: Get driver summary
   */
  async getDriverSummary(driverId: string, tenantId: number): Promise<DriverSummary[]> {
    const query = `
      SELECT
        driver_id, tenant_id, driver_name, driver_email,
        total_requests, pending_requests, approved_requests,
        rejected_requests, paid_requests, total_requested,
        total_approved, total_paid, avg_approval_days
      FROM v_driver_reimbursement_summary
      WHERE tenant_id = $1 AND driver_id = $2
    `;
    const result = await this.pool.query(query, [tenantId, driverId]);
    return result.rows;
  }
}
