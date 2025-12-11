import { injectable } from 'inversify';
import { BaseRepository } from '../services/dal/BaseRepository';
import { connectionManager } from '../config/connection-manager';
import { ReimbursementStatus, ReimbursementRequest } from '../types/trip-usage';

export interface ReimbursementRequestRow {
  id: string;
  tenant_id: string;
  driver_id: string;
  charge_id: string;
  request_amount: number;
  description?: string;
  expense_date: Date;
  category?: string;
  receipt_file_path?: string;
  receipt_uploaded_at?: Date;
  receipt_metadata?: Record<string, any>;
  status: ReimbursementStatus;
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
  created_by_user_id?: string;
}

export interface ChargeWithPolicyRow {
  id: string;
  tenant_id: string;
  driver_id: string;
  auto_approve_under_amount?: number;
  require_receipt_upload?: boolean;
  receipt_required_over_amount?: number;
  charge_period?: string;
  miles_charged?: number;
  total_charge?: number;
}

export interface ReimbursementWithDetailsRow extends ReimbursementRequestRow {
  driver_name?: string;
  driver_email?: string;
  reviewed_by_name?: string;
  charge_period?: string;
  miles_charged?: number;
  total_charge?: number;
  days_pending?: number;
}

export interface ReimbursementSummaryRow {
  driver_id: string;
  tenant_id: string;
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

export interface PendingReimbursementStatsRow {
  total_pending: number;
  total_amount: number;
  avg_days_pending: number;
}

@injectable()
export class ReimbursementRequestRepository extends BaseRepository<ReimbursementRequestRow> {
  constructor() {
    super('reimbursement_requests', connectionManager.getWritePool());
  }

  /**
   * Get charge with policy details by charge_id and tenant_id
   * Used for validation before creating reimbursement request
   */
  async getChargeWithPolicy(
    chargeId: string,
    tenantId: string
  ): Promise<ChargeWithPolicyRow | null> {
    const query = `
      SELECT
        c.id,
        c.tenant_id,
        c.driver_id,
        c.charge_period,
        c.miles_charged,
        c.total_charge,
        p.auto_approve_under_amount,
        p.require_receipt_upload,
        p.receipt_required_over_amount
      FROM personal_use_charges c
      LEFT JOIN personal_use_policies p ON c.tenant_id = p.tenant_id
      WHERE c.id = $1 AND c.tenant_id = $2
    `;
    const result = await this.query<ChargeWithPolicyRow>(query, [chargeId, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create reimbursement request
   */
  async createRequest(data: {
    tenant_id: string;
    driver_id: string;
    charge_id: string;
    request_amount: number;
    description?: string;
    expense_date: string;
    category?: string;
    receipt_file_path?: string;
    receipt_uploaded_at?: Date;
    status: ReimbursementStatus;
    approved_amount?: number;
    reviewer_notes?: string;
    reviewed_at?: Date;
    created_by_user_id: string;
  }): Promise<ReimbursementRequestRow> {
    const query = `
      INSERT INTO reimbursement_requests (
        tenant_id, driver_id, charge_id,
        request_amount, description, expense_date, category,
        receipt_file_path, receipt_uploaded_at,
        status, approved_amount, reviewer_notes, reviewed_at,
        created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const values = [
      data.tenant_id,
      data.driver_id,
      data.charge_id,
      data.request_amount,
      data.description,
      data.expense_date,
      data.category,
      data.receipt_file_path,
      data.receipt_uploaded_at,
      data.status,
      data.approved_amount,
      data.reviewer_notes,
      data.reviewed_at,
      data.created_by_user_id,
    ];
    const result = await this.query<ReimbursementRequestRow>(query, values);
    return result.rows[0];
  }

  /**
   * Update personal_use_charges after auto-approval
   */
  async updateChargeAutoApproved(chargeId: string, userId: string): Promise<void> {
    const query = `
      UPDATE personal_use_charges
      SET is_reimbursement = true,
          reimbursement_requested_at = NOW(),
          reimbursement_approved_at = NOW(),
          reimbursement_approved_by = $1
      WHERE id = $2
    `;
    await this.query(query, [userId, chargeId]);
  }

  /**
   * Update personal_use_charges after request submission
   */
  async updateChargeRequested(chargeId: string): Promise<void> {
    const query = `
      UPDATE personal_use_charges
      SET is_reimbursement = true,
          reimbursement_requested_at = NOW()
      WHERE id = $1
    `;
    await this.query(query, [chargeId]);
  }

  /**
   * List reimbursement requests with filters and joins
   */
  async listWithFilters(params: {
    tenant_id: string;
    driver_id?: string;
    status?: ReimbursementStatus;
    category?: string;
    start_date?: string;
    end_date?: string;
    has_receipt?: boolean;
    limit: number;
    offset: number;
  }): Promise<ReimbursementWithDetailsRow[]> {
    let query = `
      SELECT
        r.*,
        d.first_name || ' ' || d.last_name as driver_name,
        d.email as driver_email,
        rev.first_name || ' ' || rev.last_name as reviewed_by_name,
        c.charge_period, c.miles_charged, c.total_charge
      FROM reimbursement_requests r
      LEFT JOIN users d ON r.driver_id = d.id
      LEFT JOIN users rev ON r.reviewed_by_user_id = rev.id
      LEFT JOIN personal_use_charges c ON r.charge_id = c.id
      WHERE r.tenant_id = $1
    `;

    const values: any[] = [params.tenant_id];
    let paramIndex = 2;

    if (params.driver_id) {
      query += ` AND r.driver_id = $${paramIndex}`;
      values.push(params.driver_id);
      paramIndex++;
    }

    if (params.status) {
      query += ` AND r.status = $${paramIndex}`;
      values.push(params.status);
      paramIndex++;
    }

    if (params.category) {
      query += ` AND r.category = $${paramIndex}`;
      values.push(params.category);
      paramIndex++;
    }

    if (params.start_date) {
      query += ` AND r.expense_date >= $${paramIndex}`;
      values.push(params.start_date);
      paramIndex++;
    }

    if (params.end_date) {
      query += ` AND r.expense_date <= $${paramIndex}`;
      values.push(params.end_date);
      paramIndex++;
    }

    if (params.has_receipt !== undefined) {
      if (params.has_receipt) {
        query += ` AND r.receipt_file_path IS NOT NULL`;
      } else {
        query += ` AND r.receipt_file_path IS NULL`;
      }
    }

    query += ` ORDER BY r.submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(params.limit, params.offset);

    const result = await this.query<ReimbursementWithDetailsRow>(query, values);
    return result.rows;
  }

  /**
   * Count reimbursements with filters
   */
  async countWithFilters(params: {
    tenant_id: string;
    driver_id?: string;
  }): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM reimbursement_requests WHERE tenant_id = $1`;
    const values: any[] = [params.tenant_id];

    if (params.driver_id) {
      query += ` AND driver_id = $2`;
      values.push(params.driver_id);
    }

    const result = await this.query<{ count: string }>(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get reimbursement by ID with details (joins)
   */
  async getByIdWithDetails(
    id: string,
    tenantId: string
  ): Promise<ReimbursementWithDetailsRow | null> {
    const query = `
      SELECT
        r.*,
        d.first_name || ' ' || d.last_name as driver_name,
        d.email as driver_email,
        rev.first_name || ' ' || rev.last_name as reviewed_by_name,
        c.charge_period, c.miles_charged, c.total_charge
      FROM reimbursement_requests r
      LEFT JOIN users d ON r.driver_id = d.id
      LEFT JOIN users rev ON r.reviewed_by_user_id = rev.id
      LEFT JOIN personal_use_charges c ON r.charge_id = c.id
      WHERE r.id = $1 AND r.tenant_id = $2
    `;
    const result = await this.query<ReimbursementWithDetailsRow>(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Get reimbursement by ID (simple, no joins)
   */
  async getById(id: string, tenantId: string): Promise<ReimbursementRequestRow | null> {
    const query = `
      SELECT id, created_at, updated_at FROM reimbursement_requests
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.query<ReimbursementRequestRow>(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Update reimbursement status to approved
   */
  async approveRequest(
    id: string,
    approvedAmount: number,
    reviewerNotes: string | undefined,
    reviewerId: string
  ): Promise<ReimbursementRequestRow> {
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
    const result = await this.query<ReimbursementRequestRow>(query, [
      ReimbursementStatus.APPROVED,
      approvedAmount,
      reviewerNotes,
      reviewerId,
      id,
    ]);
    return result.rows[0];
  }

  /**
   * Update charge after approval
   */
  async updateChargeApproved(chargeId: string, userId: string): Promise<void> {
    const query = `
      UPDATE personal_use_charges
      SET reimbursement_approved_at = NOW(),
          reimbursement_approved_by = $1
      WHERE id = $2
    `;
    await this.query(query, [userId, chargeId]);
  }

  /**
   * Update reimbursement status to rejected
   */
  async rejectRequest(
    id: string,
    reviewerNotes: string,
    reviewerId: string
  ): Promise<ReimbursementRequestRow> {
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
    const result = await this.query<ReimbursementRequestRow>(query, [
      ReimbursementStatus.REJECTED,
      reviewerNotes,
      reviewerId,
      id,
    ]);
    return result.rows[0];
  }

  /**
   * Update charge after rejection
   */
  async updateChargeRejected(chargeId: string, rejectionReason: string): Promise<void> {
    const query = `
      UPDATE personal_use_charges
      SET reimbursement_rejected_at = NOW(),
          reimbursement_rejection_reason = $1
      WHERE id = $2
    `;
    await this.query(query, [rejectionReason, chargeId]);
  }

  /**
   * Update reimbursement payment information
   */
  async processPayment(
    id: string,
    paymentDate: string,
    paymentMethod: string,
    paymentReference: string
  ): Promise<ReimbursementRequestRow> {
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
    const result = await this.query<ReimbursementRequestRow>(query, [
      ReimbursementStatus.PAID,
      paymentDate,
      paymentMethod,
      paymentReference,
      id,
    ]);
    return result.rows[0];
  }

  /**
   * Update charge after payment processed
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
    await this.query(query, [paymentDate, paymentReference, chargeId]);
  }

  /**
   * Get pending reimbursements queue with details
   */
  async getPendingQueue(tenantId: string): Promise<ReimbursementWithDetailsRow[]> {
    const query = `
      SELECT
        r.*,
        d.first_name || ' ' || d.last_name as driver_name,
        d.email as driver_email,
        EXTRACT(EPOCH FROM (NOW() - r.submitted_at)) / 86400 as days_pending
      FROM reimbursement_requests r
      LEFT JOIN users d ON r.driver_id = d.id
      WHERE r.tenant_id = $1 AND r.status = $2
      ORDER BY r.submitted_at ASC
    `;
    const result = await this.query<ReimbursementWithDetailsRow>(query, [
      tenantId,
      ReimbursementStatus.PENDING,
    ]);
    return result.rows;
  }

  /**
   * Get pending reimbursement statistics
   */
  async getPendingStats(tenantId: string): Promise<PendingReimbursementStatsRow> {
    const query = `
      SELECT
        COUNT(*) as total_pending,
        COALESCE(SUM(request_amount), 0) as total_amount,
        COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - submitted_at)) / 86400), 0) as avg_days_pending
      FROM reimbursement_requests
      WHERE tenant_id = $1 AND status = $2
    `;
    const result = await this.query<PendingReimbursementStatsRow>(query, [
      tenantId,
      ReimbursementStatus.PENDING,
    ]);
    return result.rows[0];
  }

  /**
   * Get driver reimbursement summary
   */
  async getDriverSummary(
    driverId: string,
    tenantId: string
  ): Promise<ReimbursementSummaryRow | null> {
    const query = `
      SELECT
        r.driver_id,
        r.tenant_id,
        d.first_name || ' ' || d.last_name as driver_name,
        d.email as driver_email,
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE r.status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE r.status = 'approved') as approved_requests,
        COUNT(*) FILTER (WHERE r.status = 'rejected') as rejected_requests,
        COUNT(*) FILTER (WHERE r.status = 'paid') as paid_requests,
        COALESCE(SUM(r.request_amount), 0) as total_requested,
        COALESCE(SUM(r.approved_amount), 0) as total_approved,
        COALESCE(SUM(CASE WHEN r.status = 'paid' THEN r.approved_amount ELSE 0 END), 0) as total_paid,
        AVG(EXTRACT(EPOCH FROM (r.reviewed_at - r.submitted_at)) / 86400) as avg_approval_days
      FROM reimbursement_requests r
      LEFT JOIN users d ON r.driver_id = d.id
      WHERE r.tenant_id = $1 AND r.driver_id = $2
      GROUP BY r.driver_id, r.tenant_id, d.first_name, d.last_name, d.email
    `;
    const result = await this.query<ReimbursementSummaryRow>(query, [tenantId, driverId]);
    return result.rows[0] || null;
  }
}
