/**
 * Fleet Optimization ML Model
 *
 * Analyzes vehicle utilization and provides optimization recommendations
 * Uses historical data and predictive analytics for fleet rightsizing
 */

import pool from '../config/database'

export interface VehicleUtilizationData {
  vehicleId: string
  vehicleNumber: string
  vehicleType: string
  totalHours: number
  activeHours: number
  idleHours: number
  maintenanceHours: number
  totalMiles: number
  tripsCount: number
  acquisitionCost: number
  monthlyOperatingCost: number
}

export interface UtilizationAnalysis {
  utilizationRate: number
  avgTripLength: number
  revenuePerHour: number
  costPerMile: number
  roi: number
  recommendation: string
  recommendationType: 'retire' | 'reassign' | 'optimize' | 'maintain' | 'expand'
  potentialSavings: number
  confidenceScore: number
}

export interface FleetOptimizationRecommendation {
  type: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  potentialSavings: number
  implementationCost: number
  paybackPeriodMonths: number
  confidenceScore: number
  vehicleIds: string[]
}

export class FleetOptimizationModel {
  // Utilization thresholds
  private readonly LOW_UTILIZATION_THRESHOLD = 30 // %
  private readonly OPTIMAL_UTILIZATION_MIN = 60 // %
  private readonly OPTIMAL_UTILIZATION_MAX = 85 // %
  private readonly HIGH_UTILIZATION_THRESHOLD = 90 // %

  // Cost thresholds
  private readonly HIGH_COST_PER_MILE_THRESHOLD = 2.5 // $
  private readonly NEGATIVE_ROI_THRESHOLD = -5 // %

  /**
   * Analyze vehicle utilization
   */
  analyzeUtilization(data: VehicleUtilizationData): UtilizationAnalysis {
    // Calculate utilization rate
    const utilizationRate = data.totalHours > 0
      ? (data.activeHours / data.totalHours) * 100
      : 0

    // Calculate metrics
    const avgTripLength = data.tripsCount > 0
      ? data.totalMiles / data.tripsCount
      : 0

    // Estimate revenue (assuming $3/mile for revenue-generating trips)
    const estimatedRevenue = data.totalMiles * 3
    const revenuePerHour = data.activeHours > 0
      ? estimatedRevenue / data.activeHours
      : 0

    const costPerMile = data.totalMiles > 0
      ? data.monthlyOperatingCost / data.totalMiles
      : 0

    // Calculate ROI
    const roi = data.acquisitionCost > 0
      ? ((estimatedRevenue - data.monthlyOperatingCost * 12) / data.acquisitionCost) * 100
      : 0

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      utilizationRate,
      costPerMile,
      roi,
      data
    )

    return {
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      avgTripLength: Math.round(avgTripLength * 100) / 100,
      revenuePerHour: Math.round(revenuePerHour * 100) / 100,
      costPerMile: Math.round(costPerMile * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      recommendation: recommendation.recommendation,
      recommendationType: recommendation.type,
      potentialSavings: recommendation.potentialSavings,
      confidenceScore: recommendation.confidenceScore
    }
  }

  /**
   * Generate specific recommendation based on analysis
   */
  private generateRecommendation(
    utilizationRate: number,
    costPerMile: number,
    roi: number,
    data: VehicleUtilizationData
  ): {
    recommendation: string
    type: 'retire' | 'reassign' | 'optimize' | 'maintain' | 'expand'
    potentialSavings: number
    confidenceScore: number
  } {
    let recommendation = ''
    let type: 'retire' | 'reassign' | 'optimize' | 'maintain' | 'expand' = 'maintain'
    let potentialSavings = 0
    let confidenceScore = 75

    // Critical: Consider retirement
    if (utilizationRate < this.LOW_UTILIZATION_THRESHOLD && roi < this.NEGATIVE_ROI_THRESHOLD) {
      recommendation = `Vehicle ${data.vehicleNumber} is severely underutilized (${utilizationRate.toFixed(1)}%) with negative ROI. Consider retiring or selling this vehicle.`
      type = 'retire'
      potentialSavings = data.monthlyOperatingCost * 12
      confidenceScore = 85
    }
    // High cost per mile
    else if (costPerMile > this.HIGH_COST_PER_MILE_THRESHOLD) {
      recommendation = `Vehicle ${data.vehicleNumber} has high operating costs ($${costPerMile.toFixed(2)}/mile). Consider replacing with a more efficient vehicle.`
      type = 'optimize'
      potentialSavings = (costPerMile - 1.5) * data.totalMiles * 12
      confidenceScore = 80
    }
    // Low utilization
    else if (utilizationRate < this.OPTIMAL_UTILIZATION_MIN) {
      recommendation = `Vehicle ${data.vehicleNumber} is underutilized at ${utilizationRate.toFixed(1)}%. Consider reassigning to higher-demand routes or sharing with other departments.`
      type = 'reassign'
      potentialSavings = data.monthlyOperatingCost * 0.3 * 12
      confidenceScore = 70
    }
    // High utilization - potential expansion opportunity
    else if (utilizationRate > this.HIGH_UTILIZATION_THRESHOLD) {
      recommendation = `Vehicle ${data.vehicleNumber} is highly utilized (${utilizationRate.toFixed(1)}%). Consider adding similar vehicles to prevent overuse and reduce maintenance costs.`
      type = 'expand'
      potentialSavings = 0
      confidenceScore = 65
    }
    // Optimal utilization
    else {
      recommendation = `Vehicle ${data.vehicleNumber} is performing within optimal parameters (${utilizationRate.toFixed(1)}% utilization, $${costPerMile.toFixed(2)}/mile). Continue current operations.`
      type = 'maintain'
      potentialSavings = 0
      confidenceScore = 90
    }

    return { recommendation, type, potentialSavings, confidenceScore }
  }

  /**
   * Calculate optimal fleet size based on demand
   */
  async calculateOptimalFleetSize(
    tenantId: string,
    currentFleetSize: number,
    avgDailyDemand: number,
    peakDemandMultiplier: number = 1.3
  ): Promise<{
    optimalSize: number
    recommendation: string
    potentialSavings: number
  }> {
    try {
      // Get current utilization rates
      const result = await pool.query(
        `SELECT AVG(utilization_rate) as avg_utilization
         FROM utilization_metrics
         WHERE tenant_id = $1
         AND period_end >= CURRENT_DATE - INTERVAL '90 days'',
        [tenantId]
      )

      const avgUtilization = parseFloat(result.rows[0]?.avg_utilization || '75')

      // Calculate optimal size
      // Formula: (avgDailyDemand * peakMultiplier) / targetUtilization
      const targetUtilization = 75 // Target 75% utilization
      const optimalSize = Math.ceil((avgDailyDemand * peakDemandMultiplier) / (targetUtilization / 100))

      const difference = currentFleetSize - optimalSize
      let recommendation = ''
      let potentialSavings = 0

      if (difference > 2) {
        recommendation = `Fleet is oversized by approximately ${difference} vehicles. Consider reducing fleet size to improve utilization and reduce costs.`
        potentialSavings = difference * 3000 * 12 // Assume $3000/month per vehicle
      } else if (difference < -2) {
        recommendation = `Fleet is undersized by approximately ${Math.abs(difference)} vehicles. Consider expanding to meet demand and reduce vehicle wear.`
        potentialSavings = 0
      } else {
        recommendation = 'Fleet size is optimal for current demand levels.'
        potentialSavings = 0
      }

      return {
        optimalSize,
        recommendation,
        potentialSavings
      }
    } catch (error) {
      console.error('Error calculating optimal fleet size:', error)
      return {
        optimalSize: currentFleetSize,
        recommendation: 'Unable to calculate optimal fleet size',
        potentialSavings: 0
      }
    }
  }

  /**
   * Generate fleet-wide optimization recommendations
   */
  async generateFleetRecommendations(
    tenantId: string,
    utilizationData: Array<VehicleUtilizationData>
  ): Promise<FleetOptimizationRecommendation[]> {
    const recommendations: FleetOptimizationRecommendation[] = []

    // Analyze each vehicle
    const analyses = utilizationData.map(data => ({
      ...data,
      analysis: this.analyzeUtilization(data)
    }))

    // Group by recommendation type
    const underutilizedVehicles = analyses.filter(
      a => a.analysis.recommendationType === 'retire' || a.analysis.recommendationType === 'reassign'
    )

    const highCostVehicles = analyses.filter(
      a => a.analysis.costPerMile > this.HIGH_COST_PER_MILE_THRESHOLD
    )

    const overutilizedVehicles = analyses.filter(
      a => a.analysis.utilizationRate > this.HIGH_UTILIZATION_THRESHOLD
    )

    // Recommendation: Retire underutilized vehicles
    if (underutilizedVehicles.length > 0) {
      const totalSavings = underutilizedVehicles.reduce(
        (sum, v) => sum + v.analysis.potentialSavings,
        0
      )

      recommendations.push({
        type: 'fleet_rightsizing',
        title: 'Retire Underutilized Vehicles',
        description: `${underutilizedVehicles.length} vehicle(s) are significantly underutilized. Consider retirement, sale, or redeployment to reduce operational costs.`,
        priority: totalSavings > 50000 ? 'high' : 'medium',
        potentialSavings: totalSavings,
        implementationCost: 5000, // Administrative costs
        paybackPeriodMonths: 1,
        confidenceScore: 85,
        vehicleIds: underutilizedVehicles.map(v => v.vehicleId)
      })
    }

    // Recommendation: Replace high-cost vehicles
    if (highCostVehicles.length > 0) {
      const totalSavings = highCostVehicles.reduce(
        (sum, v) => sum + v.analysis.potentialSavings,
        0
      )

      recommendations.push({
        type: 'vehicle_replacement',
        title: 'Replace High-Cost Vehicles',
        description: `${highCostVehicles.length} vehicle(s) have high operating costs. Replacing with more efficient models could significantly reduce expenses.`,
        priority: 'medium',
        potentialSavings: totalSavings,
        implementationCost: highCostVehicles.length * 50000, // Assume $50k per vehicle
        paybackPeriodMonths: Math.ceil((highCostVehicles.length * 50000) / (totalSavings / 12)),
        confidenceScore: 75,
        vehicleIds: highCostVehicles.map(v => v.vehicleId)
      })
    }

    // Recommendation: Add vehicles for high demand
    if (overutilizedVehicles.length > 3) {
      recommendations.push({
        type: 'fleet_expansion',
        title: 'Expand Fleet Capacity',
        description: `${overutilizedVehicles.length} vehicle(s) are operating at >90% utilization. Consider adding vehicles to prevent excessive wear and improve service quality.`,
        priority: 'medium',
        potentialSavings: 0,
        implementationCost: 50000, // Cost of one additional vehicle
        paybackPeriodMonths: 24,
        confidenceScore: 70,
        vehicleIds: overutilizedVehicles.map(v => v.vehicleId)
      })
    }

    // Recommendation: Route optimization
    const inefficientRoutes = analyses.filter(
      a => a.analysis.avgTripLength < 10 && a.tripsCount > 50
    )

    if (inefficientRoutes.length > 0) {
      recommendations.push({
        type: 'route_optimization',
        title: 'Optimize Short-Trip Routes',
        description: `${inefficientRoutes.length} vehicle(s) are making many short trips. Route consolidation could improve efficiency.`,
        priority: 'low',
        potentialSavings: inefficientRoutes.length * 5000,
        implementationCost: 2000,
        paybackPeriodMonths: 6,
        confidenceScore: 65,
        vehicleIds: inefficientRoutes.map(v => v.vehicleId)
      })
    }

    return recommendations
  }

  /**
   * Predict future utilization based on historical trends
   */
  async predictFutureUtilization(
    vehicleId: string,
    tenantId: string,
    forecastMonths: number = 3
  ): Promise<Array<{
    month: string
    predictedUtilization: number
    confidence: number
  }>> {
    try {
      // Get historical data
      const result = await pool.query(
        `SELECT
           utilization_rate,
           period_start,
           period_end
         FROM utilization_metrics
         WHERE vehicle_id = $1 AND tenant_id = $2
         ORDER BY period_end DESC
         LIMIT 12`,
        [vehicleId, tenantId]
      )

      if (result.rows.length < 3) {
        return []
      }

      // Simple linear regression for trend
      const data = result.rows.reverse().map((row, i) => ({
        x: i,
        y: parseFloat(row.utilization_rate)
      }))

      const { slope, intercept } = this.linearRegression(data)

      // Generate predictions
      const predictions = []
      for (let i = 1; i <= forecastMonths; i++) {
        const x = data.length + i - 1
        const predicted = slope * x + intercept

        // Clamp between 0 and 100
        const predictedUtilization = Math.max(0, Math.min(100, predicted))

        // Confidence decreases with distance
        const confidence = Math.max(50, 90 - (i * 10))

        const monthDate = new Date()
        monthDate.setMonth(monthDate.getMonth() + i)

        predictions.push({
          month: monthDate.toISOString().substring(0, 7),
          predictedUtilization: Math.round(predictedUtilization * 100) / 100,
          confidence
        })
      }

      return predictions
    } catch (error) {
      console.error('Error predicting utilization:', error)
      return []
    }
  }

  /**
   * Simple linear regression
   */
  private linearRegression(data: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
    const n = data.length
    const sumX = data.reduce((sum, p) => sum + p.x, 0)
    const sumY = data.reduce((sum, p) => sum + p.y, 0)
    const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumXX = data.reduce((sum, p) => sum + p.x * p.x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }
}

export default new FleetOptimizationModel()
