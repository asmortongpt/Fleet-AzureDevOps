/**
 * Assignment Reporting & Compliance API Routes
 * Supports BR-10 (Reporting & Audit Requirements)
 *
 * Handles:
 * - Assignment inventory reports
 * - Policy compliance reports
 * - Exception reports
 * - Change history/audit trail
 */

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router();

let pool: Pool;
export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
}

// =====================================================
// GET /reports/assignment-inventory
// Assignment inventory report (BR-10.1)
// =====================================================

router.get(
  '/assignment-inventory',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;
      const { department_id, assignment_type, format = 'json' } = req.query;

      let whereConditions = ['va.tenant_id = $1'];
      let params: any[] = [tenant_id];
      let paramIndex = 2;

      if (department_id) {
        whereConditions.push(`va.department_id = $${paramIndex++}`);
        params.push(department_id);
      }
      if (assignment_type) {
        whereConditions.push(`va.assignment_type = $${paramIndex++}`);
        params.push(assignment_type);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          dept.name AS department,
          u.first_name || ' ' || u.last_name AS employee_name,
          dr.employee_number,
          dr.position_title,
          v.unit_number,
          v.make || ' ' || v.model || ' ' || v.year AS vehicle,
          va.assignment_type,
          va.lifecycle_state,
          va.start_date,
          va.end_date,
          va.commuting_authorized,
          dr.home_county,
          dr.residence_region,
          CASE WHEN va.secured_parking_location_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS has_secured_parking,
          sp.name AS secured_parking_location
        FROM vehicle_assignments va
        JOIN vehicles v ON va.vehicle_id = v.id
        JOIN drivers dr ON va.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN departments dept ON va.department_id = dept.id
        LEFT JOIN secured_parking_locations sp ON va.secured_parking_location_id = sp.id
        WHERE ${whereClause}
        ORDER BY dept.name, u.last_name, u.first_name
      `;

      const result = await pool.query(query, params);

      // Generate summary statistics
      const statsQuery = `
        SELECT
          va.assignment_type,
          va.lifecycle_state,
          COUNT(*) as count,
          COUNT(CASE WHEN va.secured_parking_location_id IS NOT NULL THEN 1 END) as with_secured_parking,
          COUNT(CASE WHEN va.commuting_authorized THEN 1 END) as commuting_authorized
        FROM vehicle_assignments va
        WHERE ${whereClause}
        GROUP BY va.assignment_type, va.lifecycle_state
      `;

      const statsResult = await pool.query(statsQuery, params);

      res.json({
        report_name: 'Vehicle Assignment Inventory',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        filters: { department_id, assignment_type },
        summary_statistics: statsResult.rows,
        total_assignments: result.rows.length,
        assignments: result.rows,
      });
    } catch (error: any) {
      console.error('Error generating assignment inventory report:', error);
      res.status(500).json({
        error: 'Failed to generate assignment inventory report',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /reports/policy-compliance
// Policy compliance report (BR-10.2)
// =====================================================

router.get(
  '/policy-compliance',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;

      // Use the pre-built view for compliance exceptions
      const query = `
        SELECT * FROM v_policy_compliance_exceptions
        WHERE tenant_id = $1
        ORDER BY exception_type, department_name, driver_name
      `;

      const result = await pool.query(query, [tenant_id]);

      // Get summary by exception type
      const summaryQuery = `
        SELECT
          exception_type,
          COUNT(*) as count,
          ARRAY_AGG(DISTINCT department_name) as affected_departments
        FROM v_policy_compliance_exceptions
        WHERE tenant_id = $1
        GROUP BY exception_type
      `;

      const summaryResult = await pool.query(summaryQuery, [tenant_id]);

      res.json({
        report_name: 'Policy Compliance Exceptions',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        total_exceptions: result.rows.length,
        exceptions_by_type: summaryResult.rows,
        exceptions: result.rows,
      });
    } catch (error: any) {
      console.error('Error generating policy compliance report:', error);
      res.status(500).json({
        error: 'Failed to generate policy compliance report',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /reports/assignment-changes
// Assignment change history report (BR-10.3)
// =====================================================

router.get(
  '/assignment-changes',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;
      const { start_date, end_date, assignment_id, change_type } = req.query;

      let whereConditions = ['vah.tenant_id = $1'];
      let params: any[] = [tenant_id];
      let paramIndex = 2;

      if (start_date) {
        whereConditions.push(`vah.change_timestamp >= $${paramIndex++}::timestamp`);
        params.push(start_date);
      }
      if (end_date) {
        whereConditions.push(`vah.change_timestamp <= $${paramIndex++}::timestamp`);
        params.push(end_date);
      }
      if (assignment_id) {
        whereConditions.push(`vah.vehicle_assignment_id = $${paramIndex++}`);
        params.push(assignment_id);
      }
      if (change_type) {
        whereConditions.push(`vah.change_type = $${paramIndex++}`);
        params.push(change_type);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          vah.*,
          u.first_name || ' ' || u.last_name AS changed_by_name,
          u.email AS changed_by_email,
          va.assignment_type,
          v.unit_number,
          v.make || ' ' || v.model AS vehicle,
          dr.employee_number,
          emp.first_name || ' ' || emp.last_name AS driver_name
        FROM vehicle_assignment_history vah
        LEFT JOIN users u ON vah.changed_by_user_id = u.id
        LEFT JOIN vehicle_assignments va ON vah.vehicle_assignment_id = va.id
        LEFT JOIN vehicles v ON va.vehicle_id = v.id
        LEFT JOIN drivers dr ON va.driver_id = dr.id
        LEFT JOIN users emp ON dr.user_id = emp.id
        WHERE ${whereClause}
        ORDER BY vah.change_timestamp DESC
        LIMIT 1000
      `;

      const result = await pool.query(query, params);

      // Summary by change type
      const summaryQuery = `
        SELECT
          change_type,
          COUNT(*) as count,
          MIN(change_timestamp) as first_change,
          MAX(change_timestamp) as last_change
        FROM vehicle_assignment_history vah
        WHERE ${whereClause}
        GROUP BY change_type
      `;

      const summaryResult = await pool.query(summaryQuery, params);

      res.json({
        report_name: 'Vehicle Assignment Change History',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        filters: { start_date, end_date, assignment_id, change_type },
        total_changes: result.rows.length,
        changes_by_type: summaryResult.rows,
        changes: result.rows,
      });
    } catch (error: any) {
      console.error('Error generating assignment changes report:', error);
      res.status(500).json({
        error: 'Failed to generate assignment changes report',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /reports/region-distribution
// Geographic region distribution report
// =====================================================

router.get(
  '/region-distribution',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;

      const query = `
        SELECT
          dr.home_county AS region,
          dr.residence_region,
          COUNT(*) as assignment_count,
          COUNT(CASE WHEN va.commuting_authorized THEN 1 END) as commuting_authorized,
          COUNT(CASE WHEN va.secured_parking_location_id IS NOT NULL THEN 1 END) as with_secured_parking,
          ARRAY_AGG(DISTINCT dept.name) as departments
        FROM vehicle_assignments va
        JOIN drivers dr ON va.driver_id = dr.id
        LEFT JOIN departments dept ON va.department_id = dept.id
        WHERE va.tenant_id = $1 AND va.lifecycle_state = 'active'
        GROUP BY dr.home_county, dr.residence_region
        ORDER BY assignment_count DESC
      `;

      const result = await pool.query(query, [tenant_id]);

      res.json({
        report_name: 'Geographic Region Distribution',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        total_regions: result.rows.length,
        distribution: result.rows,
      });
    } catch (error: any) {
      console.error('Error generating region distribution report:', error);
      res.status(500).json({
        error: 'Failed to generate region distribution report',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /reports/department-summary
// Department-level assignment summary
// =====================================================

router.get(
  '/department-summary',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;

      const query = `
        SELECT
          dept.name AS department,
          dept.code AS department_code,
          dir_user.first_name || ' ' || dir_user.last_name AS director,
          COUNT(*) as total_assignments,
          COUNT(CASE WHEN va.assignment_type = 'designated' THEN 1 END) as designated_count,
          COUNT(CASE WHEN va.assignment_type = 'on_call' THEN 1 END) as on_call_count,
          COUNT(CASE WHEN va.assignment_type = 'temporary' THEN 1 END) as temporary_count,
          COUNT(CASE WHEN va.lifecycle_state = 'active' THEN 1 END) as active_count,
          COUNT(CASE WHEN va.lifecycle_state = 'pending_reauth' THEN 1 END) as pending_reauth_count
        FROM vehicle_assignments va
        LEFT JOIN departments dept ON va.department_id = dept.id
        LEFT JOIN users dir_user ON dept.director_user_id = dir_user.id
        WHERE va.tenant_id = $1
        GROUP BY dept.id, dept.name, dept.code, dir_user.first_name, dir_user.last_name
        ORDER BY total_assignments DESC
      `;

      const result = await pool.query(query, [tenant_id]);

      res.json({
        report_name: 'Department Assignment Summary',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        total_departments: result.rows.length,
        departments: result.rows,
      });
    } catch (error: any) {
      console.error('Error generating department summary report:', error);
      res.status(500).json({
        error: 'Failed to generate department summary report',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /reports/on-call-summary
// On-call assignment and callback summary
// =====================================================

router.get(
  '/on-call-summary',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;
      const { start_date, end_date } = req.query;

      let whereConditions = ['ocp.tenant_id = $1'];
      let params: any[] = [tenant_id];
      let paramIndex = 2;

      if (start_date) {
        whereConditions.push(`ocp.start_datetime >= $${paramIndex++}::timestamp`);
        params.push(start_date);
      }
      if (end_date) {
        whereConditions.push(`ocp.end_datetime <= $${paramIndex++}::timestamp`);
        params.push(end_date);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          dept.name AS department,
          u.first_name || ' ' || u.last_name AS driver_name,
          dr.employee_number,
          COUNT(DISTINCT ocp.id) as on_call_periods,
          SUM(ocp.callback_count) as total_callbacks,
          SUM(
            EXTRACT(EPOCH FROM (ocp.end_datetime - ocp.start_datetime)) / 3600
          ) as total_on_call_hours,
          COUNT(CASE WHEN ocp.acknowledged_by_driver THEN 1 END) as acknowledged_periods,
          SUM(
            (SELECT SUM(oct.miles_driven)
             FROM on_call_callback_trips oct
             WHERE oct.on_call_period_id = ocp.id)
          ) as total_callback_miles,
          SUM(
            (SELECT SUM(oct.reimbursement_amount)
             FROM on_call_callback_trips oct
             WHERE oct.on_call_period_id = ocp.id
               AND oct.reimbursement_requested = true)
          ) as total_reimbursement_requested
        FROM on_call_periods ocp
        JOIN drivers dr ON ocp.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN departments dept ON ocp.department_id = dept.id
        WHERE ${whereClause}
        GROUP BY dept.name, u.first_name, u.last_name, dr.employee_number
        ORDER BY total_on_call_hours DESC
      `;

      const result = await pool.query(query, params);

      res.json({
        report_name: 'On-Call Summary Report',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        filters: { start_date, end_date },
        summary: result.rows,
      });
    } catch (error: any) {
      console.error('Error generating on-call summary report:', error);
      res.status(500).json({
        error: 'Failed to generate on-call summary report',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /reports/cost-benefit-summary
// Cost/benefit analysis summary report
// =====================================================

router.get(
  '/cost-benefit-summary',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;

      const query = `
        SELECT
          dept.name AS department,
          COUNT(*) as total_analyses,
          COUNT(CASE WHEN cba.approval_status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN cba.approval_status = 'rejected' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN cba.approval_status = 'pending' THEN 1 END) as pending_count,
          ROUND(AVG(cba.total_annual_costs), 2) as avg_annual_costs,
          ROUND(AVG(cba.total_annual_benefits), 2) as avg_annual_benefits,
          ROUND(AVG(cba.net_benefit), 2) as avg_net_benefit,
          ROUND(SUM(cba.total_annual_costs), 2) as total_costs,
          ROUND(SUM(cba.total_annual_benefits), 2) as total_benefits,
          ROUND(SUM(cba.net_benefit), 2) as total_net_benefit
        FROM cost_benefit_analyses cba
        LEFT JOIN departments dept ON cba.department_id = dept.id
        WHERE cba.tenant_id = $1
        GROUP BY dept.name
        ORDER BY total_net_benefit DESC
      `;

      const result = await pool.query(query, [tenant_id]);

      res.json({
        report_name: 'Cost/Benefit Analysis Summary',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        summary: result.rows,
      });
    } catch (error: any) {
      console.error('Error generating cost/benefit summary report:', error);
      res.status(500).json({
        error: 'Failed to generate cost/benefit summary report',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /reports/export
// Export report to various formats (CSV, Excel, PDF)
// =====================================================

router.post(
  '/export',
  authenticateJWT,
  requirePermission('compliance_report:export:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { report_type, format = 'csv', filters } = req.body;

      // This would integrate with a report generation library
      // For now, return a placeholder response

      res.json({
        message: 'Report export initiated',
        report_type,
        format,
        status: 'pending',
        estimated_completion: new Date(Date.now() + 60000).toISOString(),
      });
    } catch (error: any) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        error: 'Failed to export report',
        details: getErrorMessage(error),
      });
    }
  }
);

export default router;
