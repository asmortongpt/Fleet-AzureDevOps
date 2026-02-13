import { Router } from 'express'

import logger from '../config/logger'
/**
 * Cost Management Routes
 * Provides endpoints for cost tracking, budgeting, and analytics
 * All data sourced from real PostgreSQL tables via unified_costs view
 */

import { pool } from '../db/connection'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticateJWT } from '../middleware/auth'


const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

// GET all cost entries with filtering and pagination
router.get('/', asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      category,
      vehicleId,
      department,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      paymentMethod,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query

    const tenantId = req.tenantId || req.user?.tenantId

    // Build parameterized query against unified_costs view
    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }

    if (category && typeof category === 'string') {
      conditions.push(`cost_category = $${paramIndex++}`)
      params.push(category)
    }
    if (vehicleId && typeof vehicleId === 'string') {
      conditions.push(`vehicle_id = $${paramIndex++}`)
      params.push(vehicleId)
    }
    if (department && typeof department === 'string') {
      conditions.push(`cost_subcategory = $${paramIndex++}`)
      params.push(department)
    }
    if (startDate && typeof startDate === 'string') {
      conditions.push(`transaction_date >= $${paramIndex++}`)
      params.push(new Date(startDate))
    }
    if (endDate && typeof endDate === 'string') {
      conditions.push(`transaction_date <= $${paramIndex++}`)
      params.push(new Date(endDate))
    }
    if (minAmount && typeof minAmount === 'string') {
      conditions.push(`amount >= $${paramIndex++}`)
      params.push(Number(minAmount))
    }
    if (maxAmount && typeof maxAmount === 'string') {
      conditions.push(`amount <= $${paramIndex++}`)
      params.push(Number(maxAmount))
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Determine sort column
    const sortColumnMap: Record<string, string> = {
      date: 'transaction_date',
      amount: 'amount',
      category: 'cost_category',
      vendor: 'vendor_id'
    }
    const sortColumn = sortColumnMap[String(sortBy)] || 'transaction_date'
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC'

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM unified_costs ${whereClause}`,
      params
    )
    const total = countResult.rows[0]?.total || 0

    // Get summary stats
    const summaryResult = await pool.query(
      `SELECT
        COALESCE(SUM(amount), 0)::numeric AS total_amount,
        COALESCE(AVG(amount), 0)::numeric AS avg_amount,
        COUNT(*)::int AS count
      FROM unified_costs ${whereClause}`,
      params
    )

    // Get paginated data
    const offset = (Number(page) - 1) * Number(pageSize)
    const dataResult = await pool.query(
      `SELECT
        source_id AS id,
        cost_category AS category,
        cost_subcategory AS subcategory,
        vehicle_id,
        driver_id,
        vendor_id,
        amount,
        description,
        transaction_date AS date,
        invoice_number,
        source_table,
        cost_per_mile,
        is_anomaly,
        anomaly_score,
        anomaly_reason
      FROM unified_costs
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, Number(pageSize), offset]
    )

    const totalPages = Math.ceil(total / Number(pageSize))
    const summary = summaryResult.rows[0]

    res.json({
      data: dataResult.rows,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages
      },
      summary: {
        totalAmount: Number(parseFloat(summary.total_amount).toFixed(2)),
        averageAmount: Number(parseFloat(summary.avg_amount).toFixed(2)),
        count: summary.count
      }
    })
  } catch (error) {
    logger.error('Error fetching costs:', error)
    res.status(500).json({ error: 'Failed to fetch cost data' })
  }
}))

// GET costs for specific vehicle
router.get('/vehicle/:vehicleId', asyncHandler(async (req, res) => {
  try {
    const { vehicleId } = req.params
    const {
      page = 1,
      pageSize = 50,
      startDate,
      endDate
    } = req.query

    const tenantId = req.tenantId || req.user?.tenantId

    const conditions: string[] = ['vehicle_id = $1']
    const params: unknown[] = [vehicleId]
    let paramIndex = 2

    if (tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }
    if (startDate && typeof startDate === 'string') {
      conditions.push(`transaction_date >= $${paramIndex++}`)
      params.push(new Date(startDate))
    }
    if (endDate && typeof endDate === 'string') {
      conditions.push(`transaction_date <= $${paramIndex++}`)
      params.push(new Date(endDate))
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // Get total and category breakdown
    const summaryResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(amount), 0)::numeric AS total_amount,
        cost_category,
        COALESCE(SUM(amount), 0)::numeric AS cat_amount
      FROM unified_costs
      ${whereClause}
      GROUP BY GROUPING SETS ((), (cost_category))`,
      params
    )

    // Extract overall total and category breakdown
    const overallRow = summaryResult.rows.find(r => r.cost_category === null)
    const totalAmount = parseFloat(overallRow?.total_amount || '0')
    const total = overallRow?.total || 0

    const categoryBreakdown = summaryResult.rows
      .filter(r => r.cost_category !== null)
      .map(r => ({
        category: r.cost_category,
        amount: Number(parseFloat(r.cat_amount).toFixed(2)),
        percent: totalAmount > 0
          ? Number(((parseFloat(r.cat_amount) / totalAmount) * 100).toFixed(1))
          : 0
      }))
      .sort((a, b) => b.amount - a.amount)

    // Get paginated data
    const offset = (Number(page) - 1) * Number(pageSize)
    const dataResult = await pool.query(
      `SELECT
        source_id AS id,
        cost_category AS category,
        cost_subcategory AS subcategory,
        vehicle_id,
        driver_id,
        vendor_id,
        amount,
        description,
        transaction_date AS date,
        invoice_number,
        source_table,
        cost_per_mile
      FROM unified_costs
      ${whereClause}
      ORDER BY transaction_date DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, Number(pageSize), offset]
    )

    const totalPages = Math.ceil(total / Number(pageSize))

    res.json({
      data: dataResult.rows,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages
      },
      vehicleSummary: {
        vehicleId,
        totalCost: Number(totalAmount.toFixed(2)),
        costCount: total,
        averageCost: total > 0 ? Number((totalAmount / total).toFixed(2)) : 0,
        categoryBreakdown
      }
    })
  } catch (error) {
    logger.error('Error fetching vehicle costs:', error)
    res.status(500).json({ error: 'Failed to fetch vehicle cost data' })
  }
}))

// GET cost analytics and trends
router.get('/analytics', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const tenantId = req.tenantId || req.user?.tenantId

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }
    if (startDate && typeof startDate === 'string') {
      conditions.push(`transaction_date >= $${paramIndex++}`)
      params.push(new Date(startDate))
    }
    if (endDate && typeof endDate === 'string') {
      conditions.push(`transaction_date <= $${paramIndex++}`)
      params.push(new Date(endDate))
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Get totals and category breakdown
    const analyticsResult = await pool.query(
      `SELECT
        COALESCE(SUM(amount), 0)::numeric AS total_costs,
        COUNT(*)::int AS transaction_count,
        COALESCE(AVG(amount), 0)::numeric AS avg_cost,
        COUNT(DISTINCT vehicle_id)::int AS vehicle_count,
        COALESCE(AVG(cost_per_mile), 0)::numeric AS avg_cost_per_mile
      FROM unified_costs ${whereClause}`,
      params
    )

    // Monthly trends
    const trendResult = await pool.query(
      `SELECT
        TO_CHAR(transaction_date, 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0)::numeric AS total,
        COUNT(*)::int AS count
      FROM unified_costs ${whereClause}
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12`,
      params
    )

    // Top expense categories
    const categoryResult = await pool.query(
      `SELECT
        cost_category AS category,
        COALESCE(SUM(amount), 0)::numeric AS total,
        COUNT(*)::int AS count
      FROM unified_costs ${whereClause}
      GROUP BY cost_category
      ORDER BY total DESC`,
      params
    )

    // Vehicle cost comparison
    const vehicleResult = await pool.query(
      `SELECT
        uc.vehicle_id,
        v.make,
        v.model,
        v.year,
        COALESCE(SUM(uc.amount), 0)::numeric AS total_cost,
        COUNT(*)::int AS transaction_count
      FROM unified_costs uc
      LEFT JOIN vehicles v ON v.id = uc.vehicle_id
      ${whereClause ? whereClause.replace('tenant_id', 'uc.tenant_id').replace('transaction_date', 'uc.transaction_date') : ''}
      GROUP BY uc.vehicle_id, v.make, v.model, v.year
      ORDER BY total_cost DESC
      LIMIT 20`,
      params
    )

    const analytics = analyticsResult.rows[0]

    // Build forecast from monthly trend data
    const monthlyTotals = trendResult.rows.map(r => parseFloat(r.total))
    const avgMonthly = monthlyTotals.length > 0
      ? monthlyTotals.reduce((s, v) => s + v, 0) / monthlyTotals.length
      : 0

    res.json({
      analytics: {
        totalCosts: Number(parseFloat(analytics.total_costs).toFixed(2)),
        transactionCount: analytics.transaction_count,
        averageCost: Number(parseFloat(analytics.avg_cost).toFixed(2)),
        costPerMile: Number(parseFloat(analytics.avg_cost_per_mile).toFixed(3)),
        costPerVehicle: analytics.vehicle_count > 0
          ? Number((parseFloat(analytics.total_costs) / analytics.vehicle_count).toFixed(2))
          : 0,
        vehicleCount: analytics.vehicle_count,
        topExpenseCategories: categoryResult.rows.map(r => ({
          category: r.category,
          total: Number(parseFloat(r.total).toFixed(2)),
          count: r.count
        })),
        vehicleComparison: vehicleResult.rows.map(r => ({
          vehicleId: r.vehicle_id,
          make: r.make,
          model: r.model,
          year: r.year,
          totalCost: Number(parseFloat(r.total_cost).toFixed(2)),
          transactionCount: r.transaction_count
        })),
        monthlyTrend: trendResult.rows.map(r => ({
          month: r.month,
          total: Number(parseFloat(r.total).toFixed(2)),
          count: r.count
        }))
      },
      forecast: {
        nextMonth: Number(avgMonthly.toFixed(2)),
        nextQuarter: Number((avgMonthly * 3).toFixed(2)),
        confidence: monthlyTotals.length >= 3 ? 0.75 : 0.5
      },
      generated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error generating analytics:', error)
    res.status(500).json({ error: 'Failed to generate cost analytics' })
  }
}))

// GET /api/costs/analysis - Comprehensive cost analysis endpoint
router.get('/analysis', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, vehicleId, category, groupBy = 'category' } = req.query
    const tenantId = req.tenantId || req.user?.tenantId

    // Default date range: last 90 days
    const start = startDate && typeof startDate === 'string'
      ? new Date(startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const end = endDate && typeof endDate === 'string'
      ? new Date(endDate)
      : new Date()

    const conditions: string[] = [
      'transaction_date >= $1',
      'transaction_date <= $2'
    ]
    const params: unknown[] = [start, end]
    let paramIndex = 3

    if (tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }
    if (vehicleId && typeof vehicleId === 'string') {
      conditions.push(`vehicle_id = $${paramIndex++}`)
      params.push(vehicleId)
    }
    if (category && typeof category === 'string') {
      conditions.push(`cost_category = $${paramIndex++}`)
      params.push(category)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // Summary metrics
    const summaryResult = await pool.query(
      `SELECT
        COALESCE(SUM(amount), 0)::numeric AS total_costs,
        COUNT(*)::int AS transaction_count,
        COALESCE(AVG(amount), 0)::numeric AS avg_cost
      FROM unified_costs ${whereClause}`,
      params
    )

    const summary = summaryResult.rows[0]
    const totalCosts = parseFloat(summary.total_costs)

    // Group by specified dimension
    let groupedData: { group: string; total_cost: number; transaction_count: number; avg_cost: number; percent_of_total: number }[] = []
    const groupColumnMap: Record<string, string> = {
      category: 'cost_category',
      vehicle: 'vehicle_id',
      month: "TO_CHAR(transaction_date, 'YYYY-MM')"
    }
    const groupColumn = groupColumnMap[String(groupBy)] || 'cost_category'

    const groupResult = await pool.query(
      `SELECT
        ${groupColumn} AS group_key,
        COALESCE(SUM(amount), 0)::numeric AS total_cost,
        COUNT(*)::int AS transaction_count,
        COALESCE(AVG(amount), 0)::numeric AS avg_cost
      FROM unified_costs ${whereClause}
      GROUP BY ${groupColumn}
      ORDER BY ${groupBy === 'month' ? 'group_key ASC' : 'total_cost DESC'}`,
      params
    )

    groupedData = groupResult.rows.map(r => ({
      group: r.group_key,
      total_cost: Number(parseFloat(r.total_cost).toFixed(2)),
      transaction_count: r.transaction_count,
      avg_cost: Number(parseFloat(r.avg_cost).toFixed(2)),
      percent_of_total: totalCosts > 0
        ? Number(((parseFloat(r.total_cost) / totalCosts) * 100).toFixed(1))
        : 0
    }))

    // Calculate cost per mile if vehicle-specific
    let costPerMile: number | null = null
    if (vehicleId && typeof vehicleId === 'string') {
      const vehicleMileageResult = await pool.query(
        `SELECT COALESCE(odometer, 0)::numeric as odometer FROM vehicles WHERE id = $1`,
        [vehicleId]
      )
      const actualMiles = parseFloat(vehicleMileageResult.rows[0]?.odometer || '0')
      if (actualMiles > 0) {
        costPerMile = Number((totalCosts / actualMiles).toFixed(3))
      } else {
        costPerMile = 0
      }
    }

    // Top cost drivers
    const topCostsResult = await pool.query(
      `SELECT
        source_id AS id,
        transaction_date AS date,
        cost_category AS category,
        amount,
        description,
        vehicle_id,
        vendor_id
      FROM unified_costs ${whereClause}
      ORDER BY amount DESC
      LIMIT 10`,
      params
    )

    // Weekly cost trend
    const trendResult = await pool.query(
      `SELECT
        DATE_TRUNC('week', transaction_date)::date AS week,
        COALESCE(SUM(amount), 0)::numeric AS total_cost
      FROM unified_costs ${whereClause}
      GROUP BY DATE_TRUNC('week', transaction_date)
      ORDER BY week ASC`,
      params
    )

    res.json({
      summary: {
        total_costs: Number(totalCosts.toFixed(2)),
        transaction_count: summary.transaction_count,
        avg_cost_per_transaction: Number(parseFloat(summary.avg_cost).toFixed(2)),
        cost_per_mile: costPerMile,
        date_range: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        }
      },
      grouped_by: groupBy,
      breakdown: groupedData,
      top_costs: topCostsResult.rows.map(r => ({
        id: r.id,
        date: r.date ? new Date(r.date).toISOString().split('T')[0] : null,
        category: r.category,
        amount: Number(parseFloat(r.amount).toFixed(2)),
        description: r.description,
        vehicle_id: r.vehicle_id,
        vendor_id: r.vendor_id
      })),
      cost_trend: trendResult.rows.map(r => ({
        week: r.week,
        total_cost: Number(parseFloat(r.total_cost).toFixed(2))
      })),
      generated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error generating cost analysis:', error)
    res.status(500).json({ error: 'Failed to generate cost analysis' })
  }
}))

// GET budget vs actual tracking
router.get('/budget', asyncHandler(async (req, res) => {
  try {
    const { month } = req.query
    const tenantId = req.tenantId || req.user?.tenantId

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }
    if (month && typeof month === 'string') {
      conditions.push(`TO_CHAR(period_start, 'YYYY-MM') = $${paramIndex++}`)
      params.push(month)
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')} AND status = 'active'`
      : `WHERE status = 'active'`

    const budgetResult = await pool.query(
      `SELECT
        id,
        budget_name,
        budget_category,
        budget_period,
        fiscal_year,
        period_start,
        period_end,
        department,
        cost_center,
        budgeted_amount,
        spent_to_date,
        committed_amount,
        available_amount,
        variance_amount,
        variance_percentage,
        forecast_end_of_period,
        status
      FROM budgets
      ${whereClause}
      ORDER BY period_start DESC, budget_category ASC`,
      params
    )

    // Group by month for visualization
    interface BudgetCategory {
      id: string
      category: string
      budgeted: number
      actual: number
      variance: number
      variancePercent: number
      status: string
      projectedMonthEnd: number | null
    }

    interface BudgetMonthData {
      month: string
      categories: BudgetCategory[]
      totalBudgeted: number
      totalActual: number
      totalVariance: number
      overallStatus: string
      overallVariancePercent?: number
    }

    const byMonth: Record<string, BudgetMonthData> = {}

    for (const budget of budgetResult.rows) {
      const monthKey = new Date(budget.period_start).toISOString().substring(0, 7)

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          month: monthKey,
          categories: [],
          totalBudgeted: 0,
          totalActual: 0,
          totalVariance: 0,
          overallStatus: 'on-track'
        }
      }

      const budgeted = parseFloat(budget.budgeted_amount)
      const actual = parseFloat(budget.spent_to_date)
      const variance = parseFloat(budget.variance_amount)
      const variancePercent = parseFloat(budget.variance_percentage || '0')

      byMonth[monthKey].categories.push({
        id: budget.id,
        category: budget.budget_category,
        budgeted: Number(budgeted.toFixed(2)),
        actual: Number(actual.toFixed(2)),
        variance: Number(variance.toFixed(2)),
        variancePercent: Number(variancePercent.toFixed(1)),
        status: variancePercent < -10 ? 'over' : variancePercent > 5 ? 'under' : 'on-track',
        projectedMonthEnd: budget.forecast_end_of_period
          ? Number(parseFloat(budget.forecast_end_of_period).toFixed(2))
          : null
      })
      byMonth[monthKey].totalBudgeted += budgeted
      byMonth[monthKey].totalActual += actual
      byMonth[monthKey].totalVariance += variance
    }

    // Calculate overall status for each month
    Object.values(byMonth).forEach((monthData: BudgetMonthData) => {
      const variancePercent = monthData.totalBudgeted > 0
        ? ((monthData.totalVariance / monthData.totalBudgeted) * 100)
        : 0
      monthData.overallVariancePercent = Number(variancePercent.toFixed(1))
      monthData.overallStatus =
        variancePercent < -5 ? 'over' :
        variancePercent > 10 ? 'under' : 'on-track'
      monthData.categories.sort((a: BudgetCategory, b: BudgetCategory) =>
        b.variancePercent - a.variancePercent
      )
    })

    const result = Object.values(byMonth)
      .sort((a: BudgetMonthData, b: BudgetMonthData) => b.month.localeCompare(a.month))

    res.json({
      data: result,
      summary: {
        currentMonth: result[0] || null,
        monthsTracked: result.length,
        categoriesTracked: new Set(budgetResult.rows.map(r => r.budget_category)).size
      }
    })
  } catch (error) {
    logger.error('Error fetching budget data:', error)
    res.status(500).json({ error: 'Failed to fetch budget tracking data' })
  }
}))

// GET budget alerts and warnings
router.get('/budget/alerts', asyncHandler(async (_req, res) => {
  try {
    const tenantId = _req.tenantId || _req.user?.tenantId

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (tenantId) {
      conditions.push(`ba.tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const alertsResult = await pool.query(
      `SELECT
        ba.id,
        ba.alert_type,
        ba.alert_threshold,
        ba.current_percentage,
        ba.amount_spent,
        ba.amount_budgeted,
        ba.alert_message,
        ba.acknowledged,
        ba.sent_at,
        b.budget_category,
        b.budget_name,
        b.variance_percentage,
        b.variance_amount
      FROM budget_alerts ba
      JOIN budgets b ON b.id = ba.budget_id
      ${whereClause}
      ORDER BY ba.sent_at DESC
      LIMIT 50`,
      params
    )

    const alerts = alertsResult.rows.map(r => ({
      id: r.id,
      category: r.budget_category,
      budgetName: r.budget_name,
      alertType: r.alert_type,
      threshold: r.alert_threshold,
      currentPercentage: Number(parseFloat(r.current_percentage).toFixed(1)),
      amountSpent: Number(parseFloat(r.amount_spent).toFixed(2)),
      amountBudgeted: Number(parseFloat(r.amount_budgeted).toFixed(2)),
      message: r.alert_message,
      variancePercent: r.variance_percentage ? Number(parseFloat(r.variance_percentage).toFixed(1)) : 0,
      variance: r.variance_amount ? Number(parseFloat(r.variance_amount).toFixed(2)) : 0,
      acknowledged: r.acknowledged,
      sentAt: r.sent_at
    }))

    const overBudgetCount = alerts.filter(a =>
      a.alertType === 'threshold_100' || a.alertType === 'overspent'
    ).length
    const underBudgetCount = alerts.filter(a =>
      a.currentPercentage < 50
    ).length

    res.json({
      alerts,
      summary: {
        totalAlerts: alerts.length,
        overBudgetCount,
        underBudgetCount,
        month: new Date().toISOString().substring(0, 7)
      }
    })
  } catch (error) {
    logger.error('Error fetching budget alerts:', error)
    res.status(500).json({ error: 'Failed to fetch budget alerts' })
  }
}))

// GET cost breakdown by department
router.get('/department-analysis', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const tenantId = req.tenantId || req.user?.tenantId

    const start = startDate && typeof startDate === 'string'
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)
    const end = endDate && typeof endDate === 'string'
      ? new Date(endDate)
      : new Date()

    const conditions: string[] = [
      'transaction_date >= $1',
      'transaction_date <= $2'
    ]
    const params: unknown[] = [start, end]
    let paramIndex = 3

    if (tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    const deptResult = await pool.query(
      `SELECT
        cost_subcategory AS department,
        COALESCE(SUM(amount), 0)::numeric AS total,
        COUNT(*)::int AS transaction_count,
        COALESCE(AVG(amount), 0)::numeric AS avg_cost
      FROM unified_costs ${whereClause}
      GROUP BY cost_subcategory
      ORDER BY total DESC`,
      params
    )

    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total
      FROM unified_costs ${whereClause}`,
      params
    )

    res.json({
      departments: deptResult.rows.map(r => ({
        department: r.department || 'Unassigned',
        total: Number(parseFloat(r.total).toFixed(2)),
        transactionCount: r.transaction_count,
        avgCost: Number(parseFloat(r.avg_cost).toFixed(2))
      })),
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      totalCost: Number(parseFloat(totalResult.rows[0]?.total || '0').toFixed(2))
    })
  } catch (error) {
    logger.error('Error fetching department analysis:', error)
    res.status(500).json({ error: 'Failed to fetch department analysis' })
  }
}))

// GET vendor analysis
router.get('/vendor-analysis', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query
    const tenantId = req.tenantId || req.user?.tenantId

    const start = startDate && typeof startDate === 'string'
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1)
    const end = endDate && typeof endDate === 'string'
      ? new Date(endDate)
      : new Date()

    const conditions: string[] = [
      'uc.transaction_date >= $1',
      'uc.transaction_date <= $2',
      'uc.vendor_id IS NOT NULL'
    ]
    const params: unknown[] = [start, end]
    let paramIndex = 3

    if (tenantId) {
      conditions.push(`uc.tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    const vendorResult = await pool.query(
      `SELECT
        uc.vendor_id,
        v.name AS vendor_name,
        COALESCE(SUM(uc.amount), 0)::numeric AS total_amount,
        COUNT(*)::int AS transaction_count,
        COALESCE(AVG(uc.amount), 0)::numeric AS avg_amount,
        MIN(uc.transaction_date) AS first_transaction,
        MAX(uc.transaction_date) AS last_transaction
      FROM unified_costs uc
      LEFT JOIN vendors v ON v.id = uc.vendor_id
      ${whereClause}
      GROUP BY uc.vendor_id, v.name
      ORDER BY total_amount DESC
      LIMIT $${paramIndex++}`,
      [...params, Number(limit)]
    )

    const vendors = vendorResult.rows.map(r => ({
      vendorId: r.vendor_id,
      vendorName: r.vendor_name || 'Unknown',
      amount: Number(parseFloat(r.total_amount).toFixed(2)),
      transactionCount: r.transaction_count,
      avgAmount: Number(parseFloat(r.avg_amount).toFixed(2)),
      firstTransaction: r.first_transaction,
      lastTransaction: r.last_transaction
    }))

    res.json({
      vendors,
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        totalVendors: vendors.length,
        topVendorSpend: vendors[0]?.amount || 0,
        averagePerVendor: vendors.length > 0
          ? Number((vendors.reduce((sum, v) => sum + v.amount, 0) / vendors.length).toFixed(2))
          : 0
      }
    })
  } catch (error) {
    logger.error('Error fetching vendor analysis:', error)
    res.status(500).json({ error: 'Failed to fetch vendor analysis' })
  }
}))

// GET export costs to CSV
router.get('/export', asyncHandler(async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const result = await pool.query(
      `SELECT
        source_id AS id,
        cost_category AS category,
        cost_subcategory AS subcategory,
        vehicle_id,
        driver_id,
        vendor_id,
        amount,
        description,
        transaction_date AS date,
        invoice_number,
        source_table,
        cost_per_mile
      FROM unified_costs ${whereClause}
      ORDER BY transaction_date DESC`,
      params
    )

    // Build CSV
    const headers = ['id', 'category', 'subcategory', 'vehicle_id', 'driver_id', 'vendor_id', 'amount', 'description', 'date', 'invoice_number', 'source', 'cost_per_mile']
    const csvRows = [headers.join(',')]

    for (const row of result.rows) {
      const values = headers.map(h => {
        const key = h === 'source' ? 'source_table' : h
        const val = row[key]
        if (val === null || val === undefined) return ''
        const str = String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      })
      csvRows.push(values.join(','))
    }

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="fleet-costs-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csvRows.join('\n'))
  } catch (error) {
    logger.error('Error exporting costs:', error)
    res.status(500).json({ error: 'Failed to export cost data' })
  }
}))

// POST create new cost entry
router.post('/', csrfProtection, asyncHandler(async (req, res): Promise<void> => {
  try {
    const {
      vehicleId,
      driverId,
      category,
      amount,
      date,
      description,
      invoiceNumber,
      vendorId,
      department,
      tags,
      paymentMethod,
      notes,
      mileageAtTime
    } = req.body

    const tenantId = req.tenantId || req.user?.tenantId

    // Validate required fields
    if (!category || !amount || !date || !description) {
      return res.status(400).json({
        error: 'Missing required fields: category, amount, date, description'
      })
    }

    // Validate category
    const validCategories = ['fuel', 'maintenance', 'insurance', 'depreciation',
      'labor', 'tolls', 'parking', 'violations', 'parts', 'equipment', 'administrative', 'other']
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      })
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' })
    }

    // Calculate cost per mile if mileage provided
    let costPerMile: number | null = null
    if (mileageAtTime && Number(mileageAtTime) > 0) {
      costPerMile = Number((amount / Number(mileageAtTime)).toFixed(4))
    }

    const result = await pool.query(
      `INSERT INTO cost_manual_entries (
        tenant_id, cost_category, cost_subcategory,
        vehicle_id, driver_id, vendor_id,
        amount, description, transaction_date,
        invoice_number, cost_per_mile, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        tenantId,
        category,
        department || null,
        vehicleId || null,
        driverId || null,
        vendorId || null,
        amount,
        description,
        new Date(date),
        invoiceNumber || null,
        costPerMile,
        JSON.stringify({ tags: tags || [], paymentMethod, notes, mileageAtTime })
      ]
    )

    res.status(201).json({
      message: 'Cost entry created successfully',
      data: result.rows[0]
    })
  } catch (error) {
    logger.error('Error creating cost entry:', error)
    res.status(500).json({ error: 'Failed to create cost entry' })
  }
}))

// POST bulk import costs
router.post('/bulk-import', csrfProtection, asyncHandler(async (req, res): Promise<void> => {
  try {
    const { costs } = req.body
    const tenantId = req.tenantId || req.user?.tenantId

    if (!Array.isArray(costs) || costs.length === 0) {
      return res.status(400).json({ error: 'Costs must be a non-empty array' })
    }

    const validCategories = ['fuel', 'maintenance', 'insurance', 'depreciation',
      'labor', 'tolls', 'parking', 'violations', 'parts', 'equipment', 'administrative', 'other']

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Use a transaction for bulk import
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      for (let i = 0; i < costs.length; i++) {
        const cost = costs[i]
        try {
          if (!cost.category || !cost.amount || !cost.date || !cost.description) {
            results.failed++
            results.errors.push(`Row ${i + 1}: Missing required fields`)
            continue
          }
          if (!validCategories.includes(cost.category)) {
            results.failed++
            results.errors.push(`Row ${i + 1}: Invalid category ${cost.category}`)
            continue
          }

          await client.query(
            `INSERT INTO cost_manual_entries (
              tenant_id, cost_category, cost_subcategory,
              vehicle_id, driver_id, vendor_id,
              amount, description, transaction_date,
              invoice_number, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              tenantId,
              cost.category,
              cost.department || null,
              cost.vehicleId || null,
              cost.driverId || null,
              cost.vendorId || null,
              Number(cost.amount),
              cost.description,
              new Date(cost.date),
              cost.invoiceNumber || null,
              JSON.stringify({ tags: cost.tags || [], paymentMethod: cost.paymentMethod })
            ]
          )
          results.success++
        } catch (err) {
          results.failed++
          results.errors.push(`Row ${i + 1}: ${err}`)
        }
      }

      await client.query('COMMIT')
    } catch (txError) {
      await client.query('ROLLBACK')
      throw txError
    } finally {
      client.release()
    }

    res.json({
      message: 'Bulk import completed',
      results
    })
  } catch (error) {
    logger.error('Error in bulk import:', error)
    res.status(500).json({ error: 'Failed to process bulk import' })
  }
}))

// GET cost forecast
router.get('/forecast', asyncHandler(async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Get monthly trend for forecasting (last 12 months)
    const trendResult = await pool.query(
      `SELECT
        TO_CHAR(transaction_date, 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0)::numeric AS total,
        COUNT(*)::int AS count,
        COUNT(DISTINCT cost_category)::int AS category_count
      FROM unified_costs
      ${whereClause ? whereClause + ' AND' : 'WHERE'} transaction_date >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
      ORDER BY month ASC`,
      params
    )

    // Category counts for current state
    const stateResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_entries,
        COALESCE(SUM(amount), 0)::numeric AS total_cost,
        cost_category,
        COUNT(*)::int AS cat_count
      FROM unified_costs
      ${whereClause}
      GROUP BY GROUPING SETS ((), (cost_category))`,
      params
    )

    const overallRow = stateResult.rows.find(r => r.cost_category === null)
    const categoryCounts: Record<string, number> = {}
    stateResult.rows
      .filter(r => r.cost_category !== null)
      .forEach(r => { categoryCounts[r.cost_category] = r.cat_count })

    // Forecast based on moving average
    const monthlyTotals = trendResult.rows.map(r => parseFloat(r.total))
    const avgMonthly = monthlyTotals.length > 0
      ? monthlyTotals.reduce((s, v) => s + v, 0) / monthlyTotals.length
      : 0

    // Use last 3 months for more accurate short-term forecast
    const recentTotals = monthlyTotals.slice(-3)
    const recentAvg = recentTotals.length > 0
      ? recentTotals.reduce((s, v) => s + v, 0) / recentTotals.length
      : avgMonthly

    res.json({
      forecast: {
        nextMonth: Number(recentAvg.toFixed(2)),
        nextQuarter: Number((recentAvg * 3).toFixed(2)),
        confidence: monthlyTotals.length >= 6 ? 0.8 : monthlyTotals.length >= 3 ? 0.6 : 0.4,
        monthlyTrend: trendResult.rows.map(r => ({
          month: r.month,
          total: Number(parseFloat(r.total).toFixed(2)),
          count: r.count
        }))
      },
      currentMetrics: {
        totalEntries: overallRow?.total_entries || 0,
        totalCost: Number(parseFloat(overallRow?.total_cost || '0').toFixed(2)),
        categoryCounts
      },
      generated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error generating forecast:', error)
    res.status(500).json({ error: 'Failed to generate cost forecast' })
  }
}))

// GET cost summary dashboard data
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`)
      params.push(tenantId)
    }

    const tenantWhere = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''
    const tenantAnd = conditions.length > 0
      ? `AND ${conditions.join(' AND ')}`
      : ''

    // Current month analytics
    const monthResult = await pool.query(
      `SELECT
        COALESCE(SUM(amount), 0)::numeric AS total_costs,
        COUNT(DISTINCT vehicle_id)::int AS vehicle_count,
        COALESCE(AVG(amount), 0)::numeric AS avg_cost,
        cost_category,
        COALESCE(SUM(amount), 0)::numeric AS cat_total
      FROM unified_costs
      WHERE transaction_date >= DATE_TRUNC('month', NOW())
        AND transaction_date <= NOW()
        ${tenantAnd}
      GROUP BY GROUPING SETS ((), (cost_category))`,
      params
    )

    const monthOverall = monthResult.rows.find(r => r.cost_category === null)
    const topCategory = monthResult.rows
      .filter(r => r.cost_category !== null)
      .sort((a, b) => parseFloat(b.cat_total) - parseFloat(a.cat_total))[0]

    const daysInMonth = new Date().getDate()
    const monthTotal = parseFloat(monthOverall?.total_costs || '0')

    // Year-to-date analytics
    const ytdResult = await pool.query(
      `SELECT
        COALESCE(SUM(amount), 0)::numeric AS total_costs,
        COUNT(DISTINCT vehicle_id)::int AS vehicle_count,
        COALESCE(AVG(cost_per_mile), 0)::numeric AS avg_cpm
      FROM unified_costs
      WHERE transaction_date >= DATE_TRUNC('year', NOW())
        AND transaction_date <= NOW()
        ${tenantAnd}`,
      params
    )

    const ytd = ytdResult.rows[0]
    const ytdTotal = parseFloat(ytd.total_costs)
    const currentMonth = new Date().getMonth() + 1

    // Budget summary (current month)
    const budgetResult = await pool.query(
      `SELECT
        COALESCE(SUM(budgeted_amount), 0)::numeric AS total_budgeted,
        COALESCE(SUM(spent_to_date), 0)::numeric AS total_actual,
        COUNT(*) FILTER (WHERE variance_percentage < -10)::int AS over_budget_count
      FROM budgets
      WHERE period_start <= NOW() AND period_end >= NOW()
        AND status = 'active'
        ${tenantAnd}`,
      params
    )

    const budget = budgetResult.rows[0]
    const totalBudgeted = parseFloat(budget.total_budgeted)
    const totalActual = parseFloat(budget.total_actual)

    // Monthly trend for the last 6 months
    const trendResult = await pool.query(
      `SELECT
        TO_CHAR(transaction_date, 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0)::numeric AS total
      FROM unified_costs
      WHERE transaction_date >= NOW() - INTERVAL '6 months'
        ${tenantAnd}
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
      ORDER BY month ASC`,
      params
    )

    // Forecast from recent trend
    const monthlyTotals = trendResult.rows.map(r => parseFloat(r.total))
    const recentTotals = monthlyTotals.slice(-3)
    const recentAvg = recentTotals.length > 0
      ? recentTotals.reduce((s, v) => s + v, 0) / recentTotals.length
      : 0

    res.json({
      currentMonth: {
        month: new Date().toISOString().substring(0, 7),
        totalCosts: Number(monthTotal.toFixed(2)),
        costPerDay: daysInMonth > 0 ? Number((monthTotal / daysInMonth).toFixed(2)) : 0,
        topCategory: topCategory ? {
          category: topCategory.cost_category,
          total: Number(parseFloat(topCategory.cat_total).toFixed(2))
        } : null,
        vehicleCount: monthOverall?.vehicle_count || 0
      },
      yearToDate: {
        totalCosts: Number(ytdTotal.toFixed(2)),
        costPerMile: Number(parseFloat(ytd.avg_cpm).toFixed(3)),
        costPerVehicle: ytd.vehicle_count > 0
          ? Number((ytdTotal / ytd.vehicle_count).toFixed(2))
          : 0,
        monthlyAverage: Number((ytdTotal / currentMonth).toFixed(2))
      },
      budget: {
        totalBudgeted: Number(totalBudgeted.toFixed(2)),
        totalActual: Number(totalActual.toFixed(2)),
        variance: Number((totalActual - totalBudgeted).toFixed(2)),
        variancePercent: totalBudgeted > 0
          ? Number(((totalActual - totalBudgeted) / totalBudgeted * 100).toFixed(1))
          : 0,
        overBudgetCategories: budget.over_budget_count
      },
      forecast: {
        nextMonth: Number(recentAvg.toFixed(2)),
        nextQuarter: Number((recentAvg * 3).toFixed(2)),
        confidence: monthlyTotals.length >= 3 ? 0.75 : 0.5
      },
      trends: {
        last6Months: trendResult.rows.map(r => ({
          month: r.month,
          total: Number(parseFloat(r.total).toFixed(2))
        }))
      }
    })
  } catch (error) {
    logger.error('Error generating dashboard data:', error)
    res.status(500).json({ error: 'Failed to generate dashboard data' })
  }
}))

export default router
