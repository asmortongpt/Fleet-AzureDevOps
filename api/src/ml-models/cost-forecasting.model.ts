/**
 * Cost Forecasting ML Model
 *
 * Predicts future costs using time series analysis
 * Detects anomalies in spending patterns
 */

import pool from '../config/database'

export interface CostData {
  date: Date
  amount: number
  category: string
}

export interface CostForecast {
  period: string
  predictedAmount: number
  lowerBound: number
  upperBound: number
  confidence: number
}

export interface AnomalyDetection {
  isAnomaly: boolean
  score: number // How unusual (0-100)
  reason: string
  expectedRange: { min: number; max: number }
}

export interface CostBreakdown {
  category: string
  amount: number
  percentage: number
  trend: 'increasing' | 'decreasing' | 'stable'
  forecastedAmount: number
}

export class CostForecastingModel {
  // Anomaly detection thresholds
  private readonly ANOMALY_THRESHOLD = 2.5 // Standard deviations
  private readonly MIN_DATA_POINTS = 3

  /**
   * Forecast costs for upcoming periods
   */
  async forecastCosts(
    tenantId: string,
    category: string | null,
    forecastMonths: number = 3
  ): Promise<CostForecast[]> {
    try {
      // Get historical data
      const whereClause = category
        ? 'AND cost_category = $2'
        : ''

      const params = category
        ? [tenantId, category]
        : [tenantId]

      const result = await pool.query(
        `SELECT
           DATE_TRUNC('month', transaction_date) as month,
           SUM(amount) as total_amount
         FROM cost_tracking
         WHERE tenant_id = $1 ${whereClause}
         AND transaction_date >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', transaction_date)
         ORDER BY month ASC`,
        params
      )

      if (result.rows.length < this.MIN_DATA_POINTS) {
        return []
      }

      // Prepare data for forecasting
      const data = result.rows.map((row, i) => ({
        x: i,
        y: parseFloat(row.total_amount),
        date: new Date(row.month)
      }))

      // Calculate trend using linear regression
      const { slope, intercept } = this.linearRegression(data)

      // Calculate standard deviation for confidence intervals
      const stdDev = this.calculateStdDev(data, slope, intercept)

      // Generate forecasts
      const forecasts: CostForecast[] = []

      for (let i = 1; i <= forecastMonths; i++) {
        const x = data.length + i - 1
        const predicted = slope * x + intercept

        // Confidence decreases with distance
        const confidence = Math.max(60, 95 - (i * 10))

        // Calculate bounds (2 standard deviations)
        const margin = stdDev * 2 * (1 + (i * 0.1)) // Increase uncertainty over time
        const lowerBound = Math.max(0, predicted - margin)
        const upperBound = predicted + margin

        // Calculate period
        const forecastDate = new Date()
        forecastDate.setMonth(forecastDate.getMonth() + i)
        const period = forecastDate.toISOString().substring(0, 7)

        forecasts.push({
          period,
          predictedAmount: Math.round(predicted * 100) / 100,
          lowerBound: Math.round(lowerBound * 100) / 100,
          upperBound: Math.round(upperBound * 100) / 100,
          confidence
        })
      }

      return forecasts
    } catch (error) {
      console.error('Error forecasting costs:', error)
      return []
    }
  }

  /**
   * Detect cost anomalies
   */
  async detectAnomaly(
    amount: number,
    category: string,
    tenantId: string
  ): Promise<AnomalyDetection> {
    try {
      // Get historical data for this category
      const result = await pool.query(
        `SELECT amount
         FROM cost_tracking
         WHERE tenant_id = $1
         AND cost_category = $2
         AND transaction_date >= CURRENT_DATE - INTERVAL '90 days'
         ORDER BY transaction_date DESC`,
        [tenantId, category]
      )

      if (result.rows.length < this.MIN_DATA_POINTS) {
        return {
          isAnomaly: false,
          score: 0,
          reason: 'Insufficient historical data',
          expectedRange: { min: 0, max: amount * 2 }
        }
      }

      const amounts = result.rows.map(r => parseFloat(r.amount))
      const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length
      const stdDev = Math.sqrt(
        amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length
      )

      // Calculate z-score
      const zScore = stdDev > 0 ? Math.abs((amount - mean) / stdDev) : 0

      // Determine if anomaly
      const isAnomaly = zScore > this.ANOMALY_THRESHOLD

      // Calculate anomaly score (0-100)
      const score = Math.min(100, (zScore / 4) * 100)

      // Generate reason
      let reason = ''
      if (isAnomaly) {
        if (amount > mean) {
          const percentageAbove = ((amount - mean) / mean) * 100
          reason = `Cost is ${percentageAbove.toFixed(0)}% higher than average for ${category}`
        } else {
          const percentageBelow = ((mean - amount) / mean) * 100
          reason = `Cost is ${percentageBelow.toFixed(0)}% lower than average for ${category}`
        }
      } else {
        reason = 'Cost is within expected range'
      }

      // Calculate expected range (2 standard deviations)
      const expectedRange = {
        min: Math.max(0, mean - (2 * stdDev)),
        max: mean + (2 * stdDev)
      }

      return {
        isAnomaly,
        score: Math.round(score * 100) / 100,
        reason,
        expectedRange: {
          min: Math.round(expectedRange.min * 100) / 100,
          max: Math.round(expectedRange.max * 100) / 100
        }
      }
    } catch (error) {
      console.error('Error detecting anomaly:', error)
      return {
        isAnomaly: false,
        score: 0,
        reason: 'Error analyzing cost',
        expectedRange: { min: 0, max: 0 }
      }
    }
  }

  /**
   * Analyze cost breakdown by category
   */
  async analyzeCostBreakdown(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostBreakdown[]> {
    try {
      // Get current period costs
      const currentResult = await pool.query(
        `SELECT
           cost_category,
           SUM(amount) as total_amount
         FROM cost_tracking
         WHERE tenant_id = $1
         AND transaction_date BETWEEN $2 AND $3
         GROUP BY cost_category
         ORDER BY total_amount DESC`,
        [tenantId, startDate, endDate]
      )

      if (currentResult.rows.length === 0) {
        return []
      }

      const totalAmount = currentResult.rows.reduce(
        (sum, row) => sum + parseFloat(row.total_amount),
        0
      )

      // Get previous period for trend analysis
      const periodLength = (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60 / 24
      const prevStartDate = new Date(startDate)
      prevStartDate.setDate(prevStartDate.getDate() - periodLength)

      const prevResult = await pool.query(
        `SELECT
           cost_category,
           SUM(amount) as total_amount
         FROM cost_tracking
         WHERE tenant_id = $1
         AND transaction_date BETWEEN $2 AND $3
         GROUP BY cost_category`,
        [tenantId, prevStartDate, startDate]
      )

      const prevAmounts = new Map(
        prevResult.rows.map(row => [row.cost_category, parseFloat(row.total_amount)])
      )

      // Build breakdown
      const breakdown: CostBreakdown[] = await Promise.all(
        currentResult.rows.map(async (row) => {
          const category = row.cost_category
          const amount = parseFloat(row.total_amount)
          const percentage = (amount / totalAmount) * 100

          // Determine trend
          const prevAmount = prevAmounts.get(category) || 0
          let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'

          if (prevAmount > 0) {
            const change = ((amount - prevAmount) / prevAmount) * 100
            if (change > 10) trend = 'increasing'
            else if (change < -10) trend = 'decreasing'
          } else if (amount > 0) {
            trend = 'increasing'
          }

          // Forecast next period
          const forecasts = await this.forecastCosts(tenantId, category, 1)
          const forecastedAmount = forecasts.length > 0
            ? forecasts[0].predictedAmount
            : amount

          return {
            category,
            amount: Math.round(amount * 100) / 100,
            percentage: Math.round(percentage * 100) / 100,
            trend,
            forecastedAmount: Math.round(forecastedAmount * 100) / 100
          }
        })
      )

      return breakdown
    } catch (error) {
      console.error('Error analyzing cost breakdown:', error)
      return []
    }
  }

  /**
   * Calculate cost per mile for vehicles
   */
  async calculateCostPerMile(
    vehicleId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // Get total costs
      const costResult = await pool.query(
        `SELECT SUM(amount) as total_cost
         FROM cost_tracking
         WHERE tenant_id = $1
         AND vehicle_id = $2
         AND transaction_date BETWEEN $3 AND $4`,
        [tenantId, vehicleId, startDate, endDate]
      )

      // Get total miles (would come from telematics/trips)
      // For now, use a placeholder query
      const milesResult = await pool.query(
        `SELECT COALESCE(SUM(distance), 0) as total_miles
         FROM trips
         WHERE tenant_id = $1
         AND vehicle_id = $2
         AND trip_start BETWEEN $3 AND $4`,
        [tenantId, vehicleId, startDate, endDate]
      )

      const totalCost = parseFloat(costResult.rows[0]?.total_cost || '0')
      const totalMiles = parseFloat(milesResult.rows[0]?.total_miles || '0')

      if (totalMiles === 0) return 0

      return Math.round((totalCost / totalMiles) * 100) / 100
    } catch (error) {
      console.error('Error calculating cost per mile:', error)
      return 0
    }
  }

  /**
   * Linear regression helper
   */
  private linearRegression(
    data: Array<{ x: number; y: number }>
  ): { slope: number; intercept: number } {
    const n = data.length
    const sumX = data.reduce((sum, p) => sum + p.x, 0)
    const sumY = data.reduce((sum, p) => sum + p.y, 0)
    const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumXX = data.reduce((sum, p) => sum + p.x * p.x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  /**
   * Calculate standard deviation of residuals
   */
  private calculateStdDev(
    data: Array<{ x: number; y: number }>,
    slope: number,
    intercept: number
  ): number {
    const residuals = data.map(point => {
      const predicted = slope * point.x + intercept
      return Math.pow(point.y - predicted, 2)
    })

    const variance = residuals.reduce((sum, val) => sum + val, 0) / data.length
    return Math.sqrt(variance)
  }

  /**
   * Calculate budget variance
   */
  async calculateBudgetVariance(
    tenantId: string,
    category: string,
    fiscalYear: number,
    fiscalQuarter: number
  ): Promise<{
    allocated: number
    spent: number
    remaining: number
    percentageUsed: number
    isOverBudget: boolean
  }> {
    try {
      const result = await pool.query(
        `SELECT
           allocated_amount,
           spent_amount,
           remaining_amount
         FROM budget_allocations
         WHERE tenant_id = $1
         AND budget_category = $2
         AND fiscal_year = $3
         AND fiscal_quarter = $4`,
        [tenantId, category, fiscalYear, fiscalQuarter]
      )

      if (result.rows.length === 0) {
        return {
          allocated: 0,
          spent: 0,
          remaining: 0,
          percentageUsed: 0,
          isOverBudget: false
        }
      }

      const row = result.rows[0]
      const allocated = parseFloat(row.allocated_amount)
      const spent = parseFloat(row.spent_amount)
      const remaining = parseFloat(row.remaining_amount)
      const percentageUsed = allocated > 0 ? (spent / allocated) * 100 : 0
      const isOverBudget = spent > allocated

      return {
        allocated,
        spent,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        isOverBudget
      }
    } catch (error) {
      console.error('Error calculating budget variance:', error)
      return {
        allocated: 0,
        spent: 0,
        remaining: 0,
        percentageUsed: 0,
        isOverBudget: false
      }
    }
  }
}

export default new CostForecastingModel()
