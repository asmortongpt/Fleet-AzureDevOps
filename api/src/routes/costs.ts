import { Router } from 'express'

import logger from '../config/logger'; // Wave 18: Add Winston logger
/**
/**
 * Cost Management Routes
 * Provides endpoints for cost tracking, budgeting, and analytics
 */

import { costEmulator } from '../emulators/cost/CostEmulator'
import type { BudgetTracking } from '../emulators/cost/CostEmulator'
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
      tags,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query

    // Build filters
    const filters: Parameters<typeof costEmulator.getAllCosts>[0] = {}

    if (category && typeof category === 'string') {
      filters.category = category
    }
    if (vehicleId && typeof vehicleId === 'string') {
      filters.vehicleId = Number(vehicleId)
    }
    if (department && typeof department === 'string') {
      filters.department = department
    }
    if (startDate && typeof startDate === 'string') {
      filters.startDate = new Date(startDate)
    }
    if (endDate && typeof endDate === 'string') {
      filters.endDate = new Date(endDate)
    }
    if (minAmount && typeof minAmount === 'string') {
      filters.minAmount = Number(minAmount)
    }
    if (maxAmount && typeof maxAmount === 'string') {
      filters.maxAmount = Number(maxAmount)
    }
    if (paymentMethod && typeof paymentMethod === 'string') {
      filters.paymentMethod = paymentMethod
    }
    if (tags && typeof tags === 'string') {
      filters.tags = tags.split(',')
    }

    // Get filtered costs
    const costs = costEmulator.getAllCosts(filters)

    // Apply sorting
    if (sortBy === 'amount') {
      costs.sort((a, b) => {
        const diff = b.amount - a.amount
        return sortOrder === 'asc' ? -diff : diff
      })
    } else if (sortBy === 'category') {
      costs.sort((a, b) => {
        const comp = a.category.localeCompare(b.category)
        return sortOrder === 'asc' ? comp : -comp
      })
    } else if (sortBy === 'vendor') {
      costs.sort((a, b) => {
        const aVendor = a.vendorName || ''
        const bVendor = b.vendorName || ''
        const comp = aVendor.localeCompare(bVendor)
        return sortOrder === 'asc' ? comp : -comp
      })
    }
    // Default is by date, which is already applied

    // Apply pagination
    const total = costs.length
    const totalPages = Math.ceil(total / Number(pageSize))
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = costs.slice(offset, offset + Number(pageSize))

    // Calculate summary statistics
    const totalAmount = costs.reduce((sum, c) => sum + c.amount, 0)
    const avgAmount = total > 0 ? totalAmount / total : 0

    res.json({
      data,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages
      },
      summary: {
        totalAmount: Number(totalAmount.toFixed(2)),
        averageAmount: Number(avgAmount.toFixed(2)),
        count: total
      }
    })
  } catch (error) {
    logger.error('Error fetching costs:', error) // Wave 18: Winston logger
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

    let costs = costEmulator.getCostsByVehicle(Number(vehicleId))

    // Apply date filtering if provided
    if (startDate && typeof startDate === 'string') {
      const start = new Date(startDate)
      costs = costs.filter(c => c.date >= start)
    }
    if (endDate && typeof endDate === 'string') {
      const end = new Date(endDate)
      costs = costs.filter(c => c.date <= end)
    }

    // Pagination
    const total = costs.length
    const totalPages = Math.ceil(total / Number(pageSize))
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = costs.slice(offset, offset + Number(pageSize))

    // Calculate vehicle-specific metrics
    const totalAmount = costs.reduce((sum, c) => sum + c.amount, 0)
    const categoryBreakdown = costs.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + c.amount
      return acc
    }, {} as Record<string, number>)

    res.json({
      data,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages
      },
      vehicleSummary: {
        vehicleId: Number(vehicleId),
        totalCost: Number(totalAmount.toFixed(2)),
        costCount: total,
        averageCost: total > 0 ? Number((totalAmount / total).toFixed(2)) : 0,
        categoryBreakdown: Object.entries(categoryBreakdown).map(([category, amount]) => ({
          category,
          amount: Number(amount.toFixed(2)),
          percent: Number(((amount / totalAmount) * 100).toFixed(1))
        })).sort((a, b) => b.amount - a.amount)
      }
    })
  } catch (error) {
    logger.error('Error fetching vehicle costs:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to fetch vehicle cost data' })
  }
}))

// GET cost analytics and trends
router.get('/analytics', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const start = startDate && typeof startDate === 'string' ?
      new Date(startDate) : undefined
    const end = endDate && typeof endDate === 'string' ?
      new Date(endDate) : undefined

    const analytics = costEmulator.getAnalytics(start, end)
    const forecast = costEmulator.getForecast()

    res.json({
      analytics,
      forecast,
      generated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error generating analytics:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to generate cost analytics' })
  }
}))

// GET /api/costs/analysis - Comprehensive cost analysis endpoint
router.get('/analysis', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, vehicleId, category, groupBy = 'category' } = req.query

    // Default date range: last 90 days
    const start = startDate && typeof startDate === 'string' ?
      new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const end = endDate && typeof endDate === 'string' ?
      new Date(endDate) : new Date()

    // Get filtered costs
    const costs = costEmulator.getAllCosts({
      startDate: start,
      endDate: end,
      vehicleId: vehicleId && typeof vehicleId === 'string' ? Number(vehicleId) : undefined,
      category: category && typeof category === 'string' ? category : undefined
    })

    // Calculate summary metrics
    const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
    const avgCostPerTransaction = costs.length > 0 ? totalCosts / costs.length : 0

    // Group by specified dimension
    let groupedData: any[] = []

    if (groupBy === 'category') {
      const categoryMap = new Map<string, { total: number; count: number; costs: typeof costs }>()

      costs.forEach(cost => {
        const existing = categoryMap.get(cost.category) || { total: 0, count: 0, costs: [] }
        existing.total += cost.amount
        existing.count += 1
        existing.costs.push(cost)
        categoryMap.set(cost.category, existing)
      })

      groupedData = Array.from(categoryMap.entries()).map(([category, data]) => ({
        group: category,
        total_cost: Number(data.total.toFixed(2)),
        transaction_count: data.count,
        avg_cost: Number((data.total / data.count).toFixed(2)),
        percent_of_total: Number(((data.total / totalCosts) * 100).toFixed(1))
      })).sort((a, b) => b.total_cost - a.total_cost)

    } else if (groupBy === 'vehicle') {
      const vehicleMap = new Map<number, { total: number; count: number }>()

      costs.forEach(cost => {
        const existing = vehicleMap.get(cost.vehicleId) || { total: 0, count: 0 }
        existing.total += cost.amount
        existing.count += 1
        vehicleMap.set(cost.vehicleId, existing)
      })

      groupedData = Array.from(vehicleMap.entries()).map(([vehicleId, data]) => ({
        group: `Vehicle ${vehicleId}`,
        vehicle_id: vehicleId,
        total_cost: Number(data.total.toFixed(2)),
        transaction_count: data.count,
        avg_cost: Number((data.total / data.count).toFixed(2)),
        percent_of_total: Number(((data.total / totalCosts) * 100).toFixed(1))
      })).sort((a, b) => b.total_cost - a.total_cost)

    } else if (groupBy === 'month') {
      const monthMap = new Map<string, { total: number; count: number }>()

      costs.forEach(cost => {
        const month = cost.date.toISOString().substring(0, 7) // YYYY-MM
        const existing = monthMap.get(month) || { total: 0, count: 0 }
        existing.total += cost.amount
        existing.count += 1
        monthMap.set(month, existing)
      })

      groupedData = Array.from(monthMap.entries()).map(([month, data]) => ({
        group: month,
        total_cost: Number(data.total.toFixed(2)),
        transaction_count: data.count,
        avg_cost: Number((data.total / data.count).toFixed(2)),
        percent_of_total: Number(((data.total / totalCosts) * 100).toFixed(1))
      })).sort((a, b) => a.group.localeCompare(b.group))
    }

    // Calculate cost per mile if vehicle-specific
    let costPerMile: number | null = null
    if (vehicleId && typeof vehicleId === 'string') {
      // Mock calculation - in production, fetch actual mileage from vehicle records
      const estimatedMiles = 1000 // Placeholder
      costPerMile = Number((totalCosts / estimatedMiles).toFixed(3))
    }

    // Top cost drivers
    const topCosts = [...costs]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map(cost => ({
        id: cost.id,
        date: cost.date.toISOString().split('T')[0],
        category: cost.category,
        amount: Number(cost.amount.toFixed(2)),
        description: cost.description,
        vehicle_id: cost.vehicleId,
        vendor_name: cost.vendorName
      }))

    // Cost trend (weekly breakdown)
    const weekMap = new Map<string, number>()
    costs.forEach(cost => {
      const weekStart = new Date(cost.date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
      const weekKey = weekStart.toISOString().split('T')[0]
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + cost.amount)
    })

    const costTrend = Array.from(weekMap.entries())
      .map(([week, total]) => ({
        week,
        total_cost: Number(total.toFixed(2))
      }))
      .sort((a, b) => a.week.localeCompare(b.week))

    res.json({
      summary: {
        total_costs: Number(totalCosts.toFixed(2)),
        transaction_count: costs.length,
        avg_cost_per_transaction: Number(avgCostPerTransaction.toFixed(2)),
        cost_per_mile: costPerMile,
        date_range: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        }
      },
      grouped_by: groupBy,
      breakdown: groupedData,
      top_costs: topCosts,
      cost_trend: costTrend,
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

    const budgetTracking = costEmulator.getBudgetTracking(
      month && typeof month === 'string' ? month : undefined
    )

    // Group by month for better visualization
    const byMonth = budgetTracking.reduce((acc, budget) => {
      if (!acc[budget.month]) {
        acc[budget.month] = {
          month: budget.month,
          categories: [],
          totalBudgeted: 0,
          totalActual: 0,
          totalVariance: 0,
          overallStatus: 'on-track' as BudgetTracking['status']
        }
      }

      acc[budget.month].categories.push(budget)
      acc[budget.month].totalBudgeted += budget.budgeted
      acc[budget.month].totalActual += budget.actual
      acc[budget.month].totalVariance += budget.variance

      return acc
    }, {} as Record<string, any>)

    // Calculate overall status for each month
    Object.values(byMonth).forEach((monthData: any) => {
      const variancePercent = (monthData.totalVariance / monthData.totalBudgeted) * 100
      monthData.overallVariancePercent = Number(variancePercent.toFixed(1))
      monthData.overallStatus =
        variancePercent < -5 ? 'under' :
        variancePercent > 10 ? 'over' : 'on-track'

      // Sort categories by variance (largest overages first)
      monthData.categories.sort((a: BudgetTracking, b: BudgetTracking) =>
        b.variancePercent - a.variancePercent
      )
    })

    // Convert to array and sort by month (most recent first)
    const result = Object.values(byMonth)
      .sort((a: any, b: any) => b.month.localeCompare(a.month))

    res.json({
      data: result,
      summary: {
        currentMonth: result[0] || null,
        monthsTracked: result.length,
        categoriesTracked: Object.keys(costEmulator['categoryBudgets'] || {}).length
      }
    })
  } catch (error) {
    logger.error('Error fetching budget data:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to fetch budget tracking data' })
  }
}))

// GET budget alerts and warnings
router.get('/budget/alerts', async (_req, res) => {
  try {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const budgets = costEmulator.getBudgetTracking(currentMonth)

    const alerts = budgets
      .filter(b => b.alerts && b.alerts.length > 0)
      .map(b => ({
        category: b.category,
        status: b.status,
        variancePercent: b.variancePercent,
        variance: b.variance,
        alerts: b.alerts,
        projectedMonthEnd: b.projectedMonthEnd
      }))
      .sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))

    const overBudgetCategories = budgets.filter(b => b.status === 'over')
    const underBudgetCategories = budgets.filter(b => b.status === 'under')

    res.json({
      alerts,
      summary: {
        totalAlerts: alerts.length,
        overBudgetCount: overBudgetCategories.length,
        underBudgetCount: underBudgetCategories.length,
        month: currentMonth
      }
    })
  } catch (error) {
    logger.error('Error fetching budget alerts:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to fetch budget alerts' })
  }
});

// GET cost breakdown by department
router.get('/department-analysis', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const start = startDate && typeof startDate === 'string' ?
      new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)
    const end = endDate && typeof endDate === 'string' ?
      new Date(endDate) : new Date()

    const analytics = costEmulator.getAnalytics(start, end)

    res.json({
      departments: analytics.departmentBreakdown || [],
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      totalCost: analytics.totalCosts
    })
  } catch (error) {
    logger.error('Error fetching department analysis:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to fetch department analysis' })
  }
}))

// GET vendor analysis
router.get('/vendor-analysis', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query

    const start = startDate && typeof startDate === 'string' ?
      new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1)
    const end = endDate && typeof endDate === 'string' ?
      new Date(endDate) : new Date()

    const analytics = costEmulator.getAnalytics(start, end)
    const vendors = (analytics.vendorAnalysis || []).slice(0, Number(limit))

    res.json({
      vendors,
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        totalVendors: analytics.vendorAnalysis?.length || 0,
        topVendorSpend: vendors[0]?.amount || 0,
        averagePerVendor: vendors.length > 0 ?
          Number((vendors.reduce((sum, v) => sum + v.amount, 0) / vendors.length).toFixed(2)) : 0
      }
    })
  } catch (error) {
    logger.error('Error fetching vendor analysis:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to fetch vendor analysis' })
  }
}))

// GET export costs to CSV
router.get('/export', async (_req, res) => {
  try {
    const csv = costEmulator.exportToCSV()

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="fleet-costs-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csv)
  } catch (error) {
    logger.error('Error exporting costs:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to export cost data' })
  }
});

// POST create new cost entry
router.post('/',csrfProtection, asyncHandler(async (req, res): Promise<any> => {
  try {
    const {
      vehicleId,
      driverId,
      category,
      amount,
      date,
      description,
      invoiceNumber,
      vendorName,
      vendorId,
      department,
      budgetCategory,
      tags,
      paymentMethod,
      approvedBy,
      notes,
      mileageAtTime
    } = req.body

    // Validate required fields
    if (!vehicleId || !category || !amount || !date || !description) {
      return res.status(400).json({
        error: 'Missing required fields: vehicleId, category, amount, date, description'
      })
    }

    // Validate category
    const validCategories = ['fuel', 'maintenance', 'insurance', 'depreciation',
      'labor', 'tolls', 'parking', 'violations', 'other']
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      })
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' })
    }

    const newCost = costEmulator.addCost({
      vehicleId: Number(vehicleId),
      driverId: driverId ? Number(driverId) : undefined,
      category,
      amount: Number(amount),
      date: new Date(date),
      description,
      invoiceNumber,
      vendorName,
      vendorId: vendorId ? Number(vendorId) : undefined,
      department,
      budgetCategory,
      tags: tags || [],
      paymentMethod,
      approvedBy,
      notes,
      mileageAtTime: mileageAtTime ? Number(mileageAtTime) : undefined
    })

    res.status(201).json({
      message: 'Cost entry created successfully',
      data: newCost
    })
  } catch (error) {
    logger.error('Error creating cost entry:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to create cost entry' })
  }
}))

// POST bulk import costs
router.post('/bulk-import',csrfProtection, asyncHandler(async (req, res): Promise<any> => {
  try {
    const { costs } = req.body

    if (!Array.isArray(costs) || costs.length === 0) {
      return res.status(400).json({ error: 'Costs must be a non-empty array' })
    }

    const validCategories = ['fuel', 'maintenance', 'insurance', 'depreciation',
      'labor', 'tolls', 'parking', 'violations', 'other']

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    costs.forEach((cost, index) => {
      try {
        // Validate each cost entry
        if (!cost.vehicleId || !cost.category || !cost.amount || !cost.date || !cost.description) {
          results.failed++
          results.errors.push(`Row ${index + 1}: Missing required fields`)
          return
        }

        if (!validCategories.includes(cost.category)) {
          results.failed++
          results.errors.push(`Row ${index + 1}: Invalid category ${cost.category}`)
          return
        }

        costEmulator.addCost({
          ...cost,
          vehicleId: Number(cost.vehicleId),
          amount: Number(cost.amount),
          date: new Date(cost.date)
        })

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`Row ${index + 1}: ${error}`)
      }
    })

    res.json({
      message: 'Bulk import completed',
      results
    })
  } catch (error) {
    logger.error('Error in bulk import:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to process bulk import' })
  }
}))

// GET cost forecast
router.get('/forecast', async (_req, res) => {
  try {
    const forecast = costEmulator.getForecast()
    const currentState = costEmulator.getCurrentState()

    res.json({
      forecast,
      currentMetrics: {
        totalEntries: currentState.totalEntries,
        totalCost: Number(currentState.totalCost.toFixed(2)),
        categoryCounts: currentState.categoryCounts
      },
      generated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error generating forecast:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to generate cost forecast' })
  }
});

// GET cost summary dashboard data
router.get('/dashboard', async (_req, res) => {
  try {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

    // Get current month analytics
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const endOfMonth = new Date()
    const monthAnalytics = costEmulator.getAnalytics(startOfMonth, endOfMonth)

    // Get YTD analytics
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const ytdAnalytics = costEmulator.getAnalytics(startOfYear, endOfMonth)

    // Get current month budget status
    const budgets = costEmulator.getBudgetTracking(currentMonth)
    const overBudgetCount = budgets.filter(b => b.status === 'over').length
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0)
    const totalActual = budgets.reduce((sum, b) => sum + b.actual, 0)

    // Get forecast
    const forecast = costEmulator.getForecast()

    res.json({
      currentMonth: {
        month: currentMonth,
        totalCosts: monthAnalytics.totalCosts,
        costPerDay: monthAnalytics.costPerDay,
        topCategory: monthAnalytics.topExpenseCategories[0] || null,
        vehicleCount: monthAnalytics.vehicleComparison.length
      },
      yearToDate: {
        totalCosts: ytdAnalytics.totalCosts,
        costPerMile: ytdAnalytics.costPerMile,
        costPerVehicle: ytdAnalytics.costPerVehicle,
        monthlyAverage: ytdAnalytics.totalCosts / (new Date().getMonth() + 1)
      },
      budget: {
        totalBudgeted: Number(totalBudgeted.toFixed(2)),
        totalActual: Number(totalActual.toFixed(2)),
        variance: Number((totalActual - totalBudgeted).toFixed(2)),
        variancePercent: Number(((totalActual - totalBudgeted) / totalBudgeted * 100).toFixed(1)),
        overBudgetCategories: overBudgetCount
      },
      forecast: {
        nextMonth: forecast.nextMonth,
        nextQuarter: forecast.nextQuarter,
        confidence: forecast.confidence
      },
      trends: {
        last6Months: monthAnalytics.monthlyTrend,
        yearOverYear: ytdAnalytics.yearOverYearComparison
      }
    })
  } catch (error) {
    logger.error('Error generating dashboard data:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to generate dashboard data' })
  }
});

// Start the cost emulator
costEmulator.start().catch(console.error)

export default router