/**
 * Cost Analysis Service
 *
 * Comprehensive cost tracking, forecasting, and anomaly detection
 */

import pool from '../config/database'
import costForecastingModel from '../ml-models/cost-forecasting.model'

export interface CostEntry {
  id?: string
  costCategory: string
  costSubcategory?: string
  vehicleId?: string
  driverId?: string
  routeId?: string
  vendorId?: string
  amount: number
  description?: string
  transactionDate: Date
  invoiceNumber?: string
  isBudgeted: boolean
  isAnomaly: boolean
  costPerMile?: number
  costPerHour?: number
}

export interface CostSummary {
  totalCost: number
  categoryBreakdown: Array<{
    category: string
    amount: number
    percentage: number
    trend: 'increasing' | 'decreasing' | 'stable'
    forecastedAmount: number
  }>
  topExpenses: Array<{
    description: string
    amount: number
    category: string
    date: Date
  }>
  anomalies: Array<{
    id: string
    amount: number
    category: string
    reason: string
    date: Date
  }>
}

export interface BudgetStatus {
  category: string
  allocated: number
  spent: number
  remaining: number
  percentageUsed: number
  isOverBudget: boolean
  forecastedSpend: number
}

export class CostAnalysisService {
  /**
   * Track a new cost
   */
  async trackCost(tenantId: string, cost: CostEntry): Promise<CostEntry> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Detect if this is an anomaly
      const anomalyDetection = await costForecastingModel.detectAnomaly(
        cost.amount,
        cost.costCategory,
        tenantId
      )

      // Calculate cost per mile if vehicle is specified
      let costPerMile = null
      if (cost.vehicleId) {
        const startDate = new Date(cost.transactionDate)
        startDate.setDate(startDate.getDate() - 30) // Last 30 days

        costPerMile = await costForecastingModel.calculateCostPerMile(
          cost.vehicleId,
          tenantId,
          startDate,
          cost.transactionDate
        )
      }

      // Insert cost
      const result = await client.query(
        `INSERT INTO cost_tracking (
          tenant_id, cost_category, cost_subcategory,
          vehicle_id, driver_id, route_id, vendor_id,
          amount, description, transaction_date, invoice_number,
          is_budgeted, is_anomaly, cost_per_mile
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          tenantId, cost.costCategory, cost.costSubcategory,
          cost.vehicleId, cost.driverId, cost.routeId, cost.vendorId,
          cost.amount, cost.description, cost.transactionDate, cost.invoiceNumber,
          cost.isBudgeted, anomalyDetection.isAnomaly, costPerMile
        ]
      )

      // Update budget if applicable
      if (cost.isBudgeted) {
        await this.updateBudgetSpent(tenantId, cost.costCategory, cost.amount, client)
      }

      await client.query('COMMIT')

      return {
        ...cost,
        id: result.rows[0].id,
        isAnomaly: anomalyDetection.isAnomaly,
        costPerMile
      }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error tracking cost:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update budget spent amount
   */
  private async updateBudgetSpent(
    tenantId: string,
    category: string,
    amount: number,
    client: any
  ): Promise<void> {
    const now = new Date()
    const fiscalYear = now.getFullYear()
    const fiscalQuarter = Math.floor(now.getMonth() / 3) + 1

    await client.query(
      `UPDATE budget_allocations
       SET spent_amount = spent_amount + $1,
           remaining_amount = allocated_amount - (spent_amount + $1),
           updated_at = NOW()
       WHERE tenant_id = $2
       AND budget_category = $3
       AND fiscal_year = $4
       AND fiscal_quarter = $5`,
      [amount, tenantId, category, fiscalYear, fiscalQuarter]
    )
  }

  /**
   * Get cost summary for a period
   */
  async getCostSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostSummary> {
    // Get total cost
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_cost
       FROM cost_tracking
       WHERE tenant_id = $1
       AND transaction_date BETWEEN $2 AND $3`,
      [tenantId, startDate, endDate]
    )

    const totalCost = parseFloat(totalResult.rows[0].total_cost)

    // Get category breakdown
    const categoryBreakdown = await costForecastingModel.analyzeCostBreakdown(
      tenantId,
      startDate,
      endDate
    )

    // Get top expenses
    const expensesResult = await pool.query(
      `SELECT
         description,
         amount,
         cost_category as category,
         transaction_date as date
       FROM cost_tracking
       WHERE tenant_id = $1
       AND transaction_date BETWEEN $2 AND $3
       ORDER BY amount DESC
       LIMIT 10`,
      [tenantId, startDate, endDate]
    )

    const topExpenses = expensesResult.rows.map(row => ({
      description: row.description || 'Unnamed expense',
      amount: parseFloat(row.amount),
      category: row.category,
      date: row.date
    }))

    // Get anomalies
    const anomaliesResult = await pool.query(
      `SELECT
         id,
         amount,
         cost_category as category,
         description,
         transaction_date as date
       FROM cost_tracking
       WHERE tenant_id = $1
       AND transaction_date BETWEEN $2 AND $3
       AND is_anomaly = true
       ORDER BY transaction_date DESC
       LIMIT 20`,
      [tenantId, startDate, endDate]
    )

    const anomalies = anomaliesResult.rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      category: row.category,
      reason: row.description || 'Unusual spending detected',
      date: row.date
    }))

    return {
      totalCost,
      categoryBreakdown,
      topExpenses,
      anomalies
    }
  }

  /**
   * Get cost breakdown by category
   */
  async getCostsByCategory(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ category: string; amount: number; percentage: number }>> {
    const result = await pool.query(
      `SELECT
         cost_category as category,
         SUM(amount) as amount
       FROM cost_tracking
       WHERE tenant_id = $1
       AND transaction_date BETWEEN $2 AND $3
       GROUP BY cost_category
       ORDER BY amount DESC`,
      [tenantId, startDate, endDate]
    )

    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0)

    return result.rows.map(row => ({
      category: row.category,
      amount: parseFloat(row.amount),
      percentage: total > 0 ? (parseFloat(row.amount) / total) * 100 : 0
    }))
  }

  /**
   * Get cost by vehicle
   */
  async getCostsByVehicle(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    vehicleId: string
    vehicleNumber: string
    totalCost: number
    costPerMile: number
    categories: Record<string, number>
  }>> {
    const result = await pool.query(
      `SELECT
         ct.vehicle_id,
         v.vehicle_number,
         ct.cost_category,
         SUM(ct.amount) as amount,
         AVG(ct.cost_per_mile) as avg_cost_per_mile
       FROM cost_tracking ct
       JOIN vehicles v ON ct.vehicle_id = v.id
       WHERE ct.tenant_id = $1
       AND ct.vehicle_id IS NOT NULL
       AND ct.transaction_date BETWEEN $2 AND $3
       GROUP BY ct.vehicle_id, v.vehicle_number, ct.cost_category
       ORDER BY ct.vehicle_id, amount DESC`,
      [tenantId, startDate, endDate]
    )

    // Group by vehicle
    const vehicleMap = new Map<string, any>()

    for (const row of result.rows) {
      if (!vehicleMap.has(row.vehicle_id)) {
        vehicleMap.set(row.vehicle_id, {
          vehicleId: row.vehicle_id,
          vehicleNumber: row.vehicle_number,
          totalCost: 0,
          costPerMile: parseFloat(row.avg_cost_per_mile || '0'),
          categories: {}
        })
      }

      const vehicle = vehicleMap.get(row.vehicle_id)
      const amount = parseFloat(row.amount)
      vehicle.totalCost += amount
      vehicle.categories[row.cost_category] = amount
    }

    return Array.from(vehicleMap.values())
  }

  /**
   * Forecast costs
   */
  async forecastCosts(
    tenantId: string,
    category: string | null,
    forecastMonths: number = 3
  ): Promise<Array<{
    period: string
    predictedAmount: number
    lowerBound: number
    upperBound: number
    confidence: number
  }>> {
    return costForecastingModel.forecastCosts(tenantId, category, forecastMonths)
  }

  /**
   * Get budget status
   */
  async getBudgetStatus(
    tenantId: string,
    fiscalYear?: number,
    fiscalQuarter?: number
  ): Promise<BudgetStatus[]> {
    const now = new Date()
    const year = fiscalYear || now.getFullYear()
    const quarter = fiscalQuarter || Math.floor(now.getMonth() / 3) + 1

    const result = await pool.query(
      `SELECT
         budget_category,
         allocated_amount,
         spent_amount,
         remaining_amount
       FROM budget_allocations
       WHERE tenant_id = $1
       AND fiscal_year = $2
       AND fiscal_quarter = $3
       ORDER BY budget_category`,
      [tenantId, year, quarter]
    )

    const budgets: BudgetStatus[] = []

    for (const row of result.rows) {
      const allocated = parseFloat(row.allocated_amount)
      const spent = parseFloat(row.spent_amount)
      const remaining = parseFloat(row.remaining_amount)
      const percentageUsed = allocated > 0 ? (spent / allocated) * 100 : 0
      const isOverBudget = spent > allocated

      // Get forecast
      const forecasts = await this.forecastCosts(tenantId, row.budget_category, 1)
      const forecastedSpend = forecasts.length > 0
        ? forecasts[0].predictedAmount
        : spent

      budgets.push({
        category: row.budget_category,
        allocated,
        spent,
        remaining,
        percentageUsed,
        isOverBudget,
        forecastedSpend
      })
    }

    return budgets
  }

  /**
   * Set budget allocation
   */
  async setBudgetAllocation(
    tenantId: string,
    category: string,
    amount: number,
    fiscalYear: number,
    fiscalQuarter: number
  ): Promise<void> {
    await pool.query(
      `INSERT INTO budget_allocations (
        tenant_id, budget_category, allocated_amount,
        fiscal_year, fiscal_quarter, remaining_amount
      ) VALUES ($1, $2, $3, $4, $5, $3)
      ON CONFLICT (tenant_id, budget_category, fiscal_year, fiscal_quarter)
      DO UPDATE SET
        allocated_amount = EXCLUDED.allocated_amount,
        remaining_amount = EXCLUDED.allocated_amount - budget_allocations.spent_amount,
        updated_at = NOW()`,
      [tenantId, category, amount, fiscalYear, fiscalQuarter]
    )
  }

  /**
   * Get cost trends over time
   */
  async getCostTrends(
    tenantId: string,
    category: string | null,
    months: number = 12
  ): Promise<Array<{ month: string; amount: number }>> {
    // Validate and sanitize months parameter
    const monthsNum = Math.max(1, Math.min(24, months || 12))

    let query = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') as month,
        SUM(amount) as amount
      FROM cost_tracking
      WHERE tenant_id = $1
      AND transaction_date >= CURRENT_DATE - ($2 || ' months')::INTERVAL
    `

    const params: any[] = [tenantId, monthsNum]
    let paramIndex = 3

    if (category) {
      query += ` AND cost_category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    query += ' GROUP BY DATE_TRUNC(\'month\', transaction_date) ORDER BY month ASC'

    const result = await pool.query(query, params)

    return result.rows.map(row => ({
      month: row.month,
      amount: parseFloat(row.amount)
    }))
  }

  /**
   * Get anomalies
   */
  async getAnomalies(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    id: string
    amount: number
    category: string
    description: string
    transactionDate: Date
    expectedRange: { min: number; max: number }
  }>> {
    const result = await pool.query(
      `SELECT *
       FROM cost_tracking
       WHERE tenant_id = $1
       AND transaction_date BETWEEN $2 AND $3
       AND is_anomaly = true
       ORDER BY transaction_date DESC`,
      [tenantId, startDate, endDate]
    )

    const anomalies = []

    for (const row of result.rows) {
      const detection = await costForecastingModel.detectAnomaly(
        parseFloat(row.amount),
        row.cost_category,
        tenantId
      )

      anomalies.push({
        id: row.id,
        amount: parseFloat(row.amount),
        category: row.cost_category,
        description: row.description || detection.reason,
        transactionDate: row.transaction_date,
        expectedRange: detection.expectedRange
      })
    }

    return anomalies
  }

  /**
   * Export cost data to CSV format
   */
  async exportCostData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const result = await pool.query(
      `SELECT
         transaction_date,
         cost_category,
         cost_subcategory,
         amount,
         description,
         invoice_number,
         v.vehicle_number,
         d.first_name || ' ' || d.last_name as driver_name,
         vn.name as vendor_name
       FROM cost_tracking ct
       LEFT JOIN vehicles v ON ct.vehicle_id = v.id
       LEFT JOIN drivers d ON ct.driver_id = d.id
       LEFT JOIN vendors vn ON ct.vendor_id = vn.id
       WHERE ct.tenant_id = $1
       AND ct.transaction_date BETWEEN $2 AND $3
       ORDER BY ct.transaction_date DESC`,
      [tenantId, startDate, endDate]
    )

    // Build CSV
    const headers = [
      'Date', 'Category', 'Subcategory', 'Amount', 'Description',
      'Invoice', 'Vehicle', 'Driver', 'Vendor'
    ]

    let csv = headers.join(',') + '\n'

    for (const row of result.rows) {
      const values = [
        row.transaction_date,
        row.cost_category || '',
        row.cost_subcategory || '',
        row.amount,
        row.description || '',
        row.invoice_number || '',
        row.vehicle_number || '',
        row.driver_name || '',
        row.vendor_name || ''
      ]

      csv += values.map(v => `"${v}"`).join(',') + '\n'
    }

    return csv
  }
}

export default new CostAnalysisService()
