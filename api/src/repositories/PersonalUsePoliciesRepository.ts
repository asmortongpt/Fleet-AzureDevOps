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

import pool from '../config/database';
import { ApprovalWorkflow } from '../types/trip-usage';

import { BaseRepository, QueryContext } from './base/BaseRepository';


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
    super(pool, 'personal_use_policies', 'id');
  }

  protected getPool(context?: QueryContext): Pool {
    return super.getPool();
  }

  async getPolicyByTenant(context: QueryContext): Promise<PersonalUsePolicy | null> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT p.*,
              NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), '') as created_by_name
       FROM personal_use_policies p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.tenant_id = $1 AND p.is_active = true
       ORDER BY p.effective_date DESC NULLS LAST, p.created_at DESC
       LIMIT 1`,
      [context.tenantId]
    );

    const row = result.rows[0];
    if (!row) return null;

    const meta = (row.metadata && typeof row.metadata === 'object') ? row.metadata : {};

    return {
      id: row.id,
      tenant_id: row.tenant_id,
      allow_personal_use: meta.allow_personal_use ?? true,
      require_approval: meta.require_approval ?? true,
      max_personal_miles_per_month: row.max_personal_miles_monthly != null ? Number(row.max_personal_miles_monthly) : undefined,
      max_personal_miles_per_year: meta.max_personal_miles_per_year != null ? Number(meta.max_personal_miles_per_year) : undefined,
      charge_personal_use: meta.charge_personal_use ?? (row.personal_use_rate != null && Number(row.personal_use_rate) > 0),
      personal_use_rate_per_mile: row.personal_use_rate != null ? Number(row.personal_use_rate) : undefined,
      reporting_required: meta.reporting_required ?? true,
      approval_workflow: meta.approval_workflow ?? ApprovalWorkflow.MANAGER,
      notification_settings: meta.notification_settings ?? {},
      auto_approve_under_miles: meta.auto_approve_under_miles != null ? Number(meta.auto_approve_under_miles) : undefined,
      effective_date: row.effective_date ? String(row.effective_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      expiration_date: row.expiration_date ? String(row.expiration_date).slice(0, 10) : undefined,
      created_by_user_id: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
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
    const metadata = {
      allow_personal_use: data.allow_personal_use,
      require_approval: data.require_approval,
      charge_personal_use: data.charge_personal_use,
      reporting_required: data.reporting_required ?? true,
      approval_workflow: data.approval_workflow || ApprovalWorkflow.MANAGER,
      notification_settings: data.notification_settings || {},
      auto_approve_under_miles: data.auto_approve_under_miles ?? null,
      max_personal_miles_per_year: data.max_personal_miles_per_year ?? null,
    };
    const result = await dbPool.query(
      `INSERT INTO personal_use_policies (
         tenant_id,
         policy_name,
         description,
         max_personal_miles_monthly,
         personal_use_rate,
         is_active,
         effective_date,
         expiration_date,
         metadata,
         created_by
       ) VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9)
       RETURNING *`,
      [
        context.tenantId,
        'Personal Use Policy',
        'Tenant personal use policy configuration',
        data.max_personal_miles_per_month || null,
        data.personal_use_rate_per_mile || null,
        data.effective_date,
        data.expiration_date || null,
        metadata,
        context.userId,
      ]
    );
    // Re-load through the normalized reader
    return (await this.getPolicyByTenant(context))!;
  }

  async updatePolicy(data: PersonalUsePolicyUpdate, context: QueryContext): Promise<PersonalUsePolicy> {
    const dbPool = this.getPool(context);
    const current = await dbPool.query(
      `SELECT metadata FROM personal_use_policies WHERE tenant_id = $1`,
      [context.tenantId]
    );
    const existingMeta = (current.rows[0]?.metadata && typeof current.rows[0].metadata === 'object') ? current.rows[0].metadata : {};
    const mergedMeta = {
      ...existingMeta,
      ...(data.allow_personal_use !== undefined ? { allow_personal_use: data.allow_personal_use } : {}),
      ...(data.require_approval !== undefined ? { require_approval: data.require_approval } : {}),
      ...(data.charge_personal_use !== undefined ? { charge_personal_use: data.charge_personal_use } : {}),
      ...(data.reporting_required !== undefined ? { reporting_required: data.reporting_required } : {}),
      ...(data.approval_workflow !== undefined ? { approval_workflow: data.approval_workflow } : {}),
      ...(data.notification_settings !== undefined ? { notification_settings: data.notification_settings } : {}),
      ...(data.auto_approve_under_miles !== undefined ? { auto_approve_under_miles: data.auto_approve_under_miles } : {}),
      ...(data.max_personal_miles_per_year !== undefined ? { max_personal_miles_per_year: data.max_personal_miles_per_year } : {}),
    };

    await dbPool.query(
      `UPDATE personal_use_policies
         SET max_personal_miles_monthly = COALESCE($1, max_personal_miles_monthly),
             personal_use_rate = COALESCE($2, personal_use_rate),
             effective_date = COALESCE($3, effective_date),
             expiration_date = $4,
             metadata = $5,
             updated_at = NOW()
       WHERE tenant_id = $6`,
      [
        data.max_personal_miles_per_month ?? null,
        data.personal_use_rate_per_mile ?? null,
        data.effective_date ?? null,
        data.expiration_date ?? null,
        mergedMeta,
        context.tenantId,
      ]
    );
    return (await this.getPolicyByTenant(context))!;
  }

  async getDriverByIdAndTenant(driverId: string, context: QueryContext): Promise<{ id: string; name: string } | null> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT id, NULLIF(TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), '') as name
       FROM users
       WHERE id = $1 AND tenant_id = $2`,
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
      `SELECT
         id,
         tenant_id,
         COALESCE((metadata->>'allow_personal_use')::boolean, true) as allow_personal_use,
         COALESCE((metadata->>'require_approval')::boolean, true) as require_approval,
         COALESCE(
           (metadata->>'charge_personal_use')::boolean,
           (personal_use_rate IS NOT NULL AND personal_use_rate > 0)
         ) as charge_personal_use,
         max_personal_miles_monthly as max_personal_miles_per_month,
         NULLIF(metadata->>'max_personal_miles_per_year', '')::numeric as max_personal_miles_per_year
       FROM personal_use_policies
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY effective_date DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [context.tenantId]
    );
    return result.rows[0] || null;
  }

  async getPolicyWithLimits(context: QueryContext): Promise<any> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT
         id,
         tenant_id,
         max_personal_miles_monthly as max_personal_miles_per_month,
         NULLIF(metadata->>'max_personal_miles_per_year', '')::numeric as max_personal_miles_per_year
       FROM personal_use_policies
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY effective_date DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [context.tenantId]
    );
    return result.rows[0] || null;
  }

  async getDriversAtLimit(monthlyLimit: number, currentMonth: string, threshold: number, context: QueryContext): Promise<DriverAtLimit[]> {
    const dbPool = this.getPool(context);
    const result = await dbPool.query(
      `SELECT
         u.id as driver_id,
         NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), '') as driver_name,
         u.email as driver_email,
         COALESCE(SUM(t.miles_personal), 0) as personal_miles,
         $1 as monthly_limit,
         ROUND((COALESCE(SUM(t.miles_personal), 0) / $1 * 100)::numeric, 2) as percentage_used,
         CASE WHEN COALESCE(SUM(t.miles_personal), 0) > $1 THEN true ELSE false END as exceeds_limit
       FROM users u
       LEFT JOIN trip_usage_classification t
         ON u.id = t.driver_id
        AND TO_CHAR(t.trip_date, 'YYYY-MM') = $2
        AND t.approval_status \!= 'rejected'
       WHERE u.tenant_id = $3
       GROUP BY u.id, u.first_name, u.last_name, u.email
       HAVING COALESCE(SUM(t.miles_personal), 0) / $1 * 100 >= $4
       ORDER BY percentage_used DESC`,
      [monthlyLimit, currentMonth, context.tenantId, threshold]
    );
    return result.rows;
  }
}
