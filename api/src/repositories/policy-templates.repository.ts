
/**
 * Policy Templates Repository
 *
 * Handles all database operations for:
 * - Policy Templates (industry-standard policy library)
 * - Policy Acknowledgments (employee acknowledgments and digital signatures)
 * - Policy Violations
 * - Policy Compliance Audits
 * - Compliance Dashboard Analytics
 */

import { Pool } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface PolicyTemplate {
  id: number;
  policy_code: string;
  policy_name: string;
  policy_category: string;
  sub_category?: string;
  policy_objective?: string;
  policy_scope?: string;
  policy_content: string;
  procedures?: string;
  regulatory_references?: string[];
  industry_standards?: string[];
  responsible_roles?: string[];
  approval_required_from?: string[];
  version: string;
  effective_date?: Date;
  review_cycle_months?: number;
  next_review_date?: Date;
  expiration_date?: Date;
  supersedes_policy_id?: number;
  status: 'Draft' | 'Active' | 'Under Review' | 'Archived';
  is_mandatory: boolean;
  applies_to_roles?: string[];
  requires_training: boolean;
  requires_test: boolean;
  test_questions?: any;
  related_forms?: string[];
  attachments?: string[];
  times_acknowledged: number;
  last_acknowledged_at?: Date;
  created_at: Date;
  created_by: number;
  updated_at?: Date;
  updated_by?: number;
  approved_at?: Date;
  approved_by?: number;
}

export interface PolicyAcknowledgment {
  id: number;
  policy_id: number;
  employee_id: number;
  acknowledged_at: Date;
  signature_data?: string;
  ip_address?: string;
  device_info?: string;
  test_taken: boolean;
  test_score?: number;
  test_passed: boolean;
  is_current: boolean;
  created_at: Date;
}

export interface PolicyViolation {
  id: number;
  policy_id: number;
  employee_id: number;
  violation_date: Date;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  corrective_action?: string;
  status: 'Open' | 'Under Investigation' | 'Resolved' | 'Closed';
  resolution_date?: Date;
  resolution_notes?: string;
  created_at: Date;
  created_by: number;
  updated_at?: Date;
  updated_by?: number;
}

export interface PolicyComplianceAudit {
  id: number;
  policy_id: number;
  audit_date: Date;
  auditor_name: string;
  audit_scope?: string;
  findings?: string;
  recommendations?: string;
  compliance_score?: number;
  next_audit_date?: Date;
  created_at: Date;
  created_by: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class PolicyTemplatesRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  // ============================================================================
  // Policy Templates
  // ============================================================================

  /**
   * Get paginated list of policy templates
   */
  async findAll(
    filters: {
      category?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginationResult<PolicyTemplate>> {
    const { page = 1, limit = 50, category, status } = filters;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `SELECT
      id, policy_code, policy_name, policy_category, sub_category,
      policy_objective, policy_scope, policy_content, procedures,
      regulatory_references, industry_standards, responsible_roles,
      approval_required_from, version, effective_date, review_cycle_months,
      next_review_date, expiration_date, supersedes_policy_id, status,
      is_mandatory, applies_to_roles, requires_training, requires_test,
      test_questions, related_forms, attachments, times_acknowledged,
      last_acknowledged_at, created_at, created_by, updated_at, updated_by,
      approved_at, approved_by
      FROM policy_templates WHERE 1=1`;

    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND policy_category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY policy_category, policy_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM policy_templates WHERE 1=1`
    );

    return {
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / Number(limit))
      }
    };
  }

  /**
   * Find policy template by ID
   */
  async findById(id: number): Promise<PolicyTemplate | null> {
    const result = await this.pool.query(
      `SELECT
        id, policy_code, policy_name, policy_category, sub_category,
        policy_objective, policy_scope, policy_content, procedures,
        regulatory_references, industry_standards, responsible_roles,
        approval_required_from, version, effective_date, review_cycle_months,
        next_review_date, expiration_date, supersedes_policy_id, status,
        is_mandatory, applies_to_roles, requires_training, requires_test,
        test_questions, related_forms, attachments, times_acknowledged,
        last_acknowledged_at, created_at, created_by, updated_at, updated_by,
        approved_at, approved_by
      FROM policy_templates WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Create new policy template
   */
  async create(
    data: Partial<PolicyTemplate>,
    userId: number
  ): Promise<PolicyTemplate> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 2}`).join(', ');

    const query = `
      INSERT INTO policy_templates (${columns.join(', ')}, created_by)
      VALUES (${placeholders}, $1)
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId, ...values]);
    return result.rows[0];
  }

  /**
   * Update policy template
   */
  async update(
    id: number,
    data: Partial<PolicyTemplate>,
    userId: number
  ): Promise<PolicyTemplate | null> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, i) => `${col} = $${i + 3}`).join(', ');

    const query = `
      UPDATE policy_templates
      SET ${setClause}, updated_at = NOW(), updated_by = $2
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [id, userId, ...values]);
    return result.rows[0] || null;
  }

  // ============================================================================
  // Policy Acknowledgments
  // ============================================================================

  /**
   * Get acknowledgments for a policy (with tenant filtering)
   */
  async findAcknowledgmentsByPolicyId(
    policyId: number,
    tenantId: number
  ): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT pa.*,
              d.first_name || ' ' || d.last_name as employee_name,
              d.employee_id
       FROM policy_acknowledgments pa
       JOIN drivers d ON pa.employee_id = d.id
       WHERE pa.policy_id = $1 AND d.tenant_id = $2
       ORDER BY pa.acknowledged_at DESC`,
      [policyId, tenantId]
    );

    return result.rows;
  }

  /**
   * Mark previous acknowledgments as not current
   */
  async markPreviousAcknowledgmentsAsNotCurrent(
    policyId: number,
    employeeId: number
  ): Promise<void> {
    await this.pool.query(
      `UPDATE policy_acknowledgments
       SET is_current = FALSE
       WHERE policy_id = $1 AND employee_id = $2`,
      [policyId, employeeId]
    );
  }

  /**
   * Create new policy acknowledgment
   */
  async createAcknowledgment(
    data: {
      policy_id: number;
      employee_id: number;
      signature_data?: string;
      ip_address?: string;
      device_info?: string;
      test_taken?: boolean;
      test_score?: number;
      test_passed?: boolean;
    }
  ): Promise<PolicyAcknowledgment> {
    const result = await this.pool.query(
      `INSERT INTO policy_acknowledgments (
        policy_id, employee_id, signature_data, ip_address, device_info,
        test_taken, test_score, test_passed, is_current
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      RETURNING *`,
      [
        data.policy_id,
        data.employee_id,
        data.signature_data,
        data.ip_address,
        data.device_info,
        data.test_taken || false,
        data.test_score,
        data.test_passed || false
      ]
    );

    return result.rows[0];
  }

  /**
   * Update policy acknowledgment count
   */
  async incrementAcknowledgmentCount(policyId: number): Promise<void> {
    await this.pool.query(
      `UPDATE policy_templates
       SET times_acknowledged = times_acknowledged + 1,
           last_acknowledged_at = NOW()
       WHERE id = $1`,
      [policyId]
    );
  }

  // ============================================================================
  // Employee Compliance
  // ============================================================================

  /**
   * Get employee compliance dashboard data (with tenant filtering)
   */
  async getEmployeeCompliance(
    employeeId: number,
    tenantId: number
  ): Promise<any> {
    const result = await this.pool.query(
      `SELECT
        d.id AS employee_id,
        d.first_name || ' ' || d.last_name AS employee_name,
        COUNT(DISTINCT pt.id) AS total_policies,
        COUNT(DISTINCT pa.policy_id) AS acknowledged_policies,
        COUNT(DISTINCT pt.id) - COUNT(DISTINCT pa.policy_id) AS pending_acknowledgments,
        MAX(pa.acknowledged_at) AS last_acknowledgment_date
       FROM drivers d
       CROSS JOIN policy_templates pt
       LEFT JOIN policy_acknowledgments pa ON d.id = pa.employee_id AND pt.id = pa.policy_id AND pa.is_current = TRUE
       WHERE d.id = $1
         AND d.tenant_id = $2
         AND pt.status = 'Active'
         AND (pt.applies_to_roles IS NULL OR d.role = ANY(pt.applies_to_roles))
       GROUP BY d.id, d.first_name, d.last_name`,
      [employeeId, tenantId]
    );

    return result.rows[0] || null;
  }

  // ============================================================================
  // Policy Violations
  // ============================================================================

  /**
   * Get paginated list of policy violations (with tenant filtering)
   */
  async findViolations(
    filters: {
      tenantId: number;
      employeeId?: number;
      policyId?: number;
      severity?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginationResult<any>> {
    const { tenantId, employeeId, policyId, severity, page = 1, limit = 50 } = filters;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT pv.*,
             pt.policy_name,
             d.first_name || ' ' || d.last_name as employee_name,
             d.employee_id as employee_number
      FROM policy_violations pv
      JOIN policy_templates pt ON pv.policy_id = pt.id
      JOIN drivers d ON pv.employee_id = d.id
      WHERE d.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (employeeId) {
      query += ` AND pv.employee_id = $${paramIndex}`;
      params.push(employeeId);
      paramIndex++;
    }

    if (policyId) {
      query += ` AND pv.policy_id = $${paramIndex}`;
      params.push(policyId);
      paramIndex++;
    }

    if (severity) {
      query += ` AND pv.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    query += ` ORDER BY pv.violation_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM policy_violations pv
      JOIN drivers d ON pv.employee_id = d.id
      WHERE d.tenant_id = $1
    `;
    const countResult = await this.pool.query(countQuery, [tenantId]);

    return {
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / Number(limit))
      }
    };
  }

  /**
   * Create policy violation
   */
  async createViolation(
    data: Partial<PolicyViolation>,
    userId: number
  ): Promise<PolicyViolation> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 2}`).join(', ');

    const query = `
      INSERT INTO policy_violations (${columns.join(', ')}, created_by)
      VALUES (${placeholders}, $1)
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId, ...values]);
    return result.rows[0];
  }

  // ============================================================================
  // Policy Compliance Audits
  // ============================================================================

  /**
   * Get paginated list of policy compliance audits
   */
  async findAudits(
    filters: {
      policyId?: number;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginationResult<any>> {
    const { policyId, page = 1, limit = 50 } = filters;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT pca.*,
             pt.policy_name
      FROM policy_compliance_audits pca
      JOIN policy_templates pt ON pca.policy_id = pt.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (policyId) {
      query += ` AND pca.policy_id = $${paramIndex}`;
      params.push(policyId);
      paramIndex++;
    }

    query += ` ORDER BY pca.audit_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);

    const countQuery = `SELECT COUNT(*) FROM policy_compliance_audits`;
    const countResult = await this.pool.query(countQuery);

    return {
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / Number(limit))
      }
    };
  }

  /**
   * Create policy compliance audit
   */
  async createAudit(
    data: Partial<PolicyComplianceAudit>,
    userId: number
  ): Promise<PolicyComplianceAudit> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 2}`).join(', ');

    const query = `
      INSERT INTO policy_compliance_audits (${columns.join(', ')}, created_by)
      VALUES (${placeholders}, $1)
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId, ...values]);
    return result.rows[0];
  }

  // ============================================================================
  // Dashboard & Analytics
  // ============================================================================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(tenantId: number): Promise<{
    policies: any;
    compliance: any;
    violations: any[];
  }> {
    // Total active policies
    const policiesResult = await this.pool.query(
      `SELECT COUNT(*) as active_policies,
              COUNT(CASE WHEN next_review_date < CURRENT_DATE THEN 1 END) as overdue_reviews,
              COUNT(CASE WHEN next_review_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as upcoming_reviews
       FROM policy_templates
       WHERE status = 'Active'`
    );

    // Compliance rate (with tenant filtering)
    const complianceResult = await this.pool.query(
      `SELECT
        COUNT(DISTINCT d.id) as total_employees,
        COUNT(DISTINCT CASE WHEN pa.id IS NOT NULL THEN d.id END) as compliant_employees
       FROM drivers d
       CROSS JOIN policy_templates pt
       LEFT JOIN policy_acknowledgments pa ON d.id = pa.employee_id AND pt.id = pa.policy_id AND pa.is_current = TRUE
       WHERE d.tenant_id = $1
       AND pt.status = 'Active'
       AND pt.is_mandatory = TRUE`,
      [tenantId]
    );

    // Violations this month (with tenant filtering)
    const violationsResult = await this.pool.query(
      `SELECT severity, COUNT(*) as count
       FROM policy_violations pv
       JOIN drivers d ON pv.employee_id = d.id
       WHERE d.tenant_id = $1
       AND pv.violation_date >= DATE_TRUNC('month', CURRENT_DATE)
       GROUP BY severity
       ORDER BY count DESC`,
      [tenantId]
    );

    return {
      policies: policiesResult.rows[0],
      compliance: complianceResult.rows[0],
      violations: violationsResult.rows
    };
  }
}
