import pool from '../config/database'
import { logger } from '../config/logger'
import { appInsightsService } from '../config/app-insights'

interface DriverBillingRecord {
  driver_id: string
  driver_name: string
  driver_email: string
  total_personal_miles: number
  total_business_miles: number
  personal_percentage: number
  total_charge: number
  trip_count: number
  approved_trips: number
  pending_trips: number
}

interface MonthlyBillingReport {
  period: string
  period_start: string
  period_end: string
  generated_at: string
  summary: {
    total_drivers: number
    total_personal_miles: number
    total_charges: number
    average_charge_per_driver: number
    total_trips: number
  }
  drivers: DriverBillingRecord[]
  policy_violations: PolicyViolation[]
}

interface PolicyViolation {
  driver_id: string
  driver_name: string
  violation_type: string
  current_miles: number
  limit_miles: number
  overage_miles: number
}

interface PayrollExport {
  period: string
  export_date: string
  total_deductions: number
  line_items: PayrollLineItem[]
}

interface PayrollLineItem {
  employee_id: string
  employee_name: string
  employee_email: string
  deduction_code: string
  deduction_amount: number
  deduction_description: string
}

class BillingReportsService {
  /**
   * Generate comprehensive monthly billing report
   */
  async generateMonthlyReport(tenantId: string, period: string): Promise<MonthlyBillingReport> {
    try {
      const [year, month] = period.split('-')
      const periodStart = `${year}-${month}-01`
      const periodEnd = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

      logger.info('Generating monthly billing report', { tenantId, period })

      // Get driver billing data
      const driversQuery = await pool.query(`
        SELECT
          u.id as driver_id,
          u.first_name || ' ' || u.last_name as driver_name,
          u.email as driver_email,
          COALESCE(SUM(t.miles_personal), 0) as total_personal_miles,
          COALESCE(SUM(t.miles_business), 0) as total_business_miles,
          COALESCE(
            ROUND(SUM(t.miles_personal) / NULLIF(SUM(t.miles_total), 0) * 100, 2),
            0
          ) as personal_percentage,
          COALESCE(SUM(c.total_charge), 0) as total_charge,
          COUNT(DISTINCT t.id) as trip_count,
          COUNT(DISTINCT CASE WHEN t.approval_status = 'approved' THEN t.id END) as approved_trips,
          COUNT(DISTINCT CASE WHEN t.approval_status = 'pending' THEN t.id END) as pending_trips
        FROM users u
        LEFT JOIN trip_usage_classification t ON u.id = t.driver_id
          AND t.tenant_id = $1
          AND t.trip_date >= $2
          AND t.trip_date <= $3
          AND t.miles_personal > 0
        LEFT JOIN personal_use_charges c ON u.id = c.driver_id
          AND c.tenant_id = $1
          AND c.charge_period = $4
        WHERE u.tenant_id = $1
          AND u.role IN ('user', 'driver', 'manager', 'fleet_manager')
        GROUP BY u.id, u.first_name, u.last_name, u.email
        HAVING COUNT(t.id) > 0
        ORDER BY total_charge DESC
      `, [tenantId, periodStart, periodEnd, period])

      // Get policy violations
      const violationsQuery = await pool.query(`
        SELECT
          u.id as driver_id,
          u.first_name || ' ' || u.last_name as driver_name,
          CASE
            WHEN SUM(t.miles_personal) > p.max_personal_miles_per_month THEN 'monthly_limit_exceeded'
            ELSE 'approaching_limit'
          END as violation_type,
          SUM(t.miles_personal) as current_miles,
          p.max_personal_miles_per_month as limit_miles,
          GREATEST(SUM(t.miles_personal) - p.max_personal_miles_per_month, 0) as overage_miles
        FROM users u
        JOIN trip_usage_classification t ON u.id = t.driver_id
        CROSS JOIN personal_use_policies p
        WHERE u.tenant_id = $1
          AND t.tenant_id = $1
          AND p.tenant_id = $1
          AND t.trip_date >= $2
          AND t.trip_date <= $3
          AND t.miles_personal > 0
        GROUP BY u.id, u.first_name, u.last_name, p.max_personal_miles_per_month
        HAVING SUM(t.miles_personal) >= p.max_personal_miles_per_month * 0.8
        ORDER BY overage_miles DESC
      `, [tenantId, periodStart, periodEnd])

      const drivers: DriverBillingRecord[] = driversQuery.rows
      const violations: PolicyViolation[] = violationsQuery.rows

      const summary = {
        total_drivers: drivers.length,
        total_personal_miles: drivers.reduce((sum, d) => sum + parseFloat(d.total_personal_miles.toString()), 0),
        total_charges: drivers.reduce((sum, d) => sum + parseFloat(d.total_charge.toString()), 0),
        average_charge_per_driver: drivers.length > 0
          ? drivers.reduce((sum, d) => sum + parseFloat(d.total_charge.toString()), 0) / drivers.length
          : 0,
        total_trips: drivers.reduce((sum, d) => sum + parseInt(d.trip_count.toString()), 0)
      }

      const report: MonthlyBillingReport = {
        period,
        period_start: periodStart,
        period_end: periodEnd,
        generated_at: new Date().toISOString(),
        summary,
        drivers,
        policy_violations: violations
      }

      // Track in Application Insights
      appInsightsService.trackMonthlyBilling(
        period,
        summary.total_drivers,
        summary.total_charges,
        summary.total_personal_miles
      )

      logger.info('Monthly billing report generated successfully', {
        period,
        totalDrivers: summary.total_drivers,
        totalCharges: summary.total_charges
      })

      return report
    } catch (error) {
      logger.error('Failed to generate monthly billing report', {
        tenantId,
        period,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Export billing data for payroll system integration
   */
  async generatePayrollExport(tenantId: string, period: string): Promise<PayrollExport> {
    try {
      logger.info('Generating payroll export', { tenantId, period })

      const result = await pool.query(`
        SELECT
          u.id as employee_id,
          u.first_name || ' ' || u.last_name as employee_name,
          u.email as employee_email,
          SUM(c.total_charge) as deduction_amount,
          COUNT(c.id) as charge_count,
          SUM(c.miles_charged) as total_miles
        FROM users u
        JOIN personal_use_charges c ON u.id = c.driver_id
        WHERE u.tenant_id = $1
          AND c.tenant_id = $1
          AND c.charge_period = $2
          AND c.charge_status IN ('pending', 'billed')
        GROUP BY u.id, u.first_name, u.last_name, u.email
        HAVING SUM(c.total_charge) > 0
        ORDER BY employee_name
      `, [tenantId, period])

      const lineItems: PayrollLineItem[] = result.rows.map(row => ({
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        employee_email: row.employee_email,
        deduction_code: 'PERS_VEHICLE',
        deduction_amount: parseFloat(row.deduction_amount),
        deduction_description: `Personal vehicle use: ${parseFloat(row.total_miles).toFixed(1)} miles (${row.charge_count} trips)`
      }))

      const payrollExport: PayrollExport = {
        period,
        export_date: new Date().toISOString(),
        total_deductions: lineItems.reduce((sum, item) => sum + item.deduction_amount, 0),
        line_items: lineItems
      }

      logger.info('Payroll export generated successfully', {
        period,
        totalDeductions: payrollExport.total_deductions,
        employeeCount: lineItems.length
      })

      return payrollExport
    } catch (error) {
      logger.error('Failed to generate payroll export', {
        tenantId,
        period,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Mark charges as billed after payroll export
   */
  async markChargesAsBilled(tenantId: string, period: string, chargeIds?: string[]): Promise<number> {
    try {
      let query: string
      let params: any[]

      if (chargeIds && chargeIds.length > 0) {
        query = `
          UPDATE personal_use_charges
          SET charge_status = 'billed',
              updated_at = NOW()
          WHERE tenant_id = $1
            AND charge_period = $2
            AND id = ANY($3)
            AND charge_status = 'pending'
          RETURNING id
        `
        params = [tenantId, period, chargeIds]
      } else {
        query = `
          UPDATE personal_use_charges
          SET charge_status = 'billed',
              updated_at = NOW()
          WHERE tenant_id = $1
            AND charge_period = $2
            AND charge_status = 'pending'
          RETURNING id
        `
        params = [tenantId, period]
      }

      const result = await pool.query(query, params)

      logger.info('Marked charges as billed', {
        tenantId,
        period,
        count: result.rowCount
      })

      return result.rowCount || 0
    } catch (error) {
      logger.error('Failed to mark charges as billed', {
        tenantId,
        period,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Generate CSV export for payroll systems
   */
  async generatePayrollCSV(tenantId: string, period: string): Promise<string> {
    const payrollExport = await this.generatePayrollExport(tenantId, period)

    const headers = [
      'Employee ID',
      'Employee Name',
      'Employee Email',
      'Deduction Code',
      'Deduction Amount',
      'Description'
    ]

    const rows = payrollExport.line_items.map(item => [
      item.employee_id,
      item.employee_name,
      item.employee_email,
      item.deduction_code,
      item.deduction_amount.toFixed(2),
      item.deduction_description
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csv
  }
}

export const billingReportsService = new BillingReportsService()
export default billingReportsService
