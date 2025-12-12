/**
 * PersonalUsePoliciesRepository
 * 
 * Data access layer for personal use policies
 * Eliminates direct database queries from routes
 * 
 * Security:
 * - All queries use parameterized statements ($1, $2, etc.)
 * - Tenant isolation enforced at repository level
 * - Input validation via BaseRepository
 */

import { injectable } from 'inversify';
import { Pool } from 'pg';
import { BaseRepository, QueryContext } from './BaseRepository';
import { ApprovalWorkflow } from '../types/trip-usage';

export interface PersonalUsePolicy {
  id: string;
  tenant_id: string;
  allow_personal_use: boolean;
  require_approval: boolean;
  max_personal_miles_per_month?: number;
  max_personal_miles_per_year?: number;
  charge_personal_use: boolean;
  personal_use_rate_per_mile?: number;
  reporting_required: boolean;
  approval_workflow: ApprovalWorkflow;
  notification_settings?: {
    notify_at_percentage?: number;
    notify_manager_on_exceed?: boolean;
    notify_driver_on_limit?: boolean;
    email_notifications?: boolean;
  };
  auto_approve_under_miles?: number;
  effective_date: string;
  expiration_date?: string;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface PersonalUsePolicyCreate {
  allow_personal_use: boolean;
  require_approval: boolean;
  max_personal_miles_per_month?: number;
  max_personal_miles_per_year?: number;
  charge_personal_use: boolean;
  personal_use_rate_per_mile?: number;
  reporting_required?: boolean;
  approval_workflow?: ApprovalWorkflow;
  notification_settings?: object;
  auto_approve_under_miles?: number;
  effective_date: string;
  expiration_date?: string;
}

export interface PersonalUsePolicyUpdate extends Partial<PersonalUsePolicyCreate> {}

export interface DriverAtLimit {
  driver_id: string;
  driver_name: string;
  driver_email: string;
  personal_miles: number;
  monthly_limit: number;
  percentage_used: number;
  exceeds_limit: boolean;
}

/**
 * PersonalUsePoliciesRepository
 *
 * Handles all database operations for personal use policies
 */
@injectable()
export class PersonalUsePoliciesRepository extends BaseRepository<PersonalUsePolicy> {
  protected tableName = 'personal_use_policies';
  protected idColumn = 'id';

  constructor() {
    super();
  }

  async getPolicyByTenant(context: QueryContext): Promise<PersonalUsePolicy | null> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT p.*, u.name as created_by_name FROM personal_use_policies p LEFT JOIN users u ON p.created_by_user_id = u.id WHERE p.tenant_id = $1`,
      [context.tenantId]
    );
    return result.rows[0] || null;
  }

  async policyExists(context: QueryContext): Promise<boolean> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT id FROM personal_use_policies WHERE tenant_id = $1`,
      [context.tenantId]
    );
    return result.rows.length > 0;
  }

  async createPolicy(data: PersonalUsePolicyCreate, context: QueryContext): Promise<PersonalUsePolicy> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `INSERT INTO personal_use_policies (tenant_id, allow_personal_use, require_approval, max_personal_miles_per_month, max_personal_miles_per_year, charge_personal_use, personal_use_rate_per_mile, reporting_required, approval_workflow, notification_settings, auto_approve_under_miles, effective_date, expiration_date, created_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [context.tenantId, data.allow_personal_use, data.require_approval, data.max_personal_miles_per_month || null, data.max_personal_miles_per_year || null, data.charge_personal_use, data.personal_use_rate_per_mile || null, data.reporting_required ?? true, data.approval_workflow || ApprovalWorkflow.MANAGER, JSON.stringify(data.notification_settings || {}), data.auto_approve_under_miles || null, data.effective_date, data.expiration_date || null, context.userId]
    );
    return result.rows[0];
  }

  async updatePolicy(data: PersonalUsePolicyUpdate, context: QueryContext): Promise<PersonalUsePolicy> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `UPDATE personal_use_policies SET allow_personal_use = $1, require_approval = $2, max_personal_miles_per_month = $3, max_personal_miles_per_year = $4, charge_personal_use = $5, personal_use_rate_per_mile = $6, reporting_required = $7, approval_workflow = $8, notification_settings = $9, auto_approve_under_miles = $10, effective_date = $11, expiration_date = $12, updated_at = NOW() WHERE tenant_id = $13 RETURNING *`,
      [data.allow_personal_use, data.require_approval, data.max_personal_miles_per_month || null, data.max_personal_miles_per_year || null, data.charge_personal_use, data.personal_use_rate_per_mile || null, data.reporting_required ?? true, data.approval_workflow || ApprovalWorkflow.MANAGER, JSON.stringify(data.notification_settings || {}), data.auto_approve_under_miles || null, data.effective_date, data.expiration_date || null, context.tenantId]
    );
    return result.rows[0];
  }

  async getDriverByIdAndTenant(driverId: string, context: QueryContext): Promise<{ id: string; name: string } | null> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT id, name FROM users WHERE id = $1 AND tenant_id = $2`,
      [driverId, context.tenantId]
    );
    return result.rows[0] || null;
  }

  async getMonthlyUsage(driverId: string, currentMonth: string, context: QueryContext): Promise<number> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT COALESCE(SUM(miles_personal), 0) as personal_miles FROM trip_usage_classification WHERE driver_id = $1 AND tenant_id = $2 AND TO_CHAR(trip_date, 'YYYY-MM') = $3 AND approval_status \!= 'rejected'`,
      [driverId, context.tenantId, currentMonth]
    );
    return parseFloat(result.rows[0].personal_miles);
  }

  async getYearlyUsage(driverId: string, currentYear: number, context: QueryContext): Promise<number> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT COALESCE(SUM(miles_personal), 0) as personal_miles FROM trip_usage_classification WHERE driver_id = $1 AND tenant_id = $2 AND EXTRACT(YEAR FROM trip_date) = $3 AND approval_status \!= 'rejected'`,
      [driverId, context.tenantId, currentYear]
    );
    return parseFloat(result.rows[0].personal_miles);
  }

  async getPolicyForLimits(context: QueryContext): Promise<any> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT id, tenant_id, allow_personal_use, require_approval, charge_personal_use, max_personal_miles_per_month, max_personal_miles_per_year FROM personal_use_policies WHERE tenant_id = $1`,
      [context.tenantId]
    );
    return result.rows[0] || null;
  }

  async getPolicyWithLimits(context: QueryContext): Promise<any> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT id, tenant_id, max_personal_miles_per_month, max_personal_miles_per_year FROM personal_use_policies WHERE tenant_id = $1`,
      [context.tenantId]
    );
    return result.rows[0] || null;
  }

  async getDriversAtLimit(monthlyLimit: number, currentMonth: string, threshold: number, context: QueryContext): Promise<DriverAtLimit[]> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT u.id as driver_id, u.name as driver_name, u.email as driver_email, COALESCE(SUM(t.miles_personal), 0) as personal_miles, $1 as monthly_limit, ROUND((COALESCE(SUM(t.miles_personal), 0) / $1 * 100)::numeric, 2) as percentage_used, CASE WHEN COALESCE(SUM(t.miles_personal), 0) > $1 THEN true ELSE false END as exceeds_limit FROM users u LEFT JOIN trip_usage_classification t ON u.id = t.driver_id AND TO_CHAR(t.trip_date, 'YYYY-MM') = $2 AND t.approval_status \!= 'rejected' WHERE u.tenant_id = $3 GROUP BY u.id, u.name, u.email HAVING COALESCE(SUM(t.miles_personal), 0) / $1 * 100 >= $4 ORDER BY percentage_used DESC`,
      [monthlyLimit, currentMonth, context.tenantId, threshold]
    );
    return result.rows;
  }
}
