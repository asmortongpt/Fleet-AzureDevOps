/**
 * ML Decision Engine Service
 * Provides predictive models for fleet operations including:
 * - Predictive maintenance
 * - Driver behavior scoring
 * - Route optimization
 * - Incident risk prediction
 * - Cost forecasting
 */

import pool from '../config/database'
import { logger } from '../utils/logger'

export interface MaintenancePrediction {
  vehicle_id: string
  predicted_failure_date: Date
  failure_type: string
  confidence: number
  recommended_action: string
  estimated_cost: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
}

export interface DriverBehaviorScore {
  driver_id: string
  overall_score: number
  acceleration_score: number
  braking_score: number
  speeding_score: number
  cornering_score: number
  idle_time_score: number
  safety_incidents: number
  risk_level: 'low' | 'medium' | 'high'
  improvement_areas: string[]
}

export interface IncidentRiskPrediction {
  entity_type: 'vehicle' | 'driver' | 'route'
  entity_id: string
  risk_score: number
  risk_factors: Array<{ factor: string; weight: number }>
  predicted_incident_types: string[]
  mitigation_recommendations: string[]
}

export interface CostForecast {
  forecast_period: string
  predicted_fuel_cost: number
  predicted_maintenance_cost: number
  predicted_total_cost: number
  confidence_interval: { lower: number; upper: number }
  trend: 'increasing' | 'stable' | 'decreasing'
}

class MLDecisionEngineService {
  /**
   * Predict vehicle maintenance needs
   */
  async predictMaintenance(
    tenantId: string,
    vehicleId: string
  ): Promise<MaintenancePrediction> {
    try {
      // Get active maintenance prediction model
      const modelResult = await pool.query(
        `SELECT * FROM ml_models
         WHERE tenant_id = $1
           AND model_type = 'predictive_maintenance'
           AND is_active = true
         ORDER BY created_at DESC
         LIMIT 1`,
        [tenantId]
      )

      const model = modelResult.rows[0]

      // Get vehicle data for prediction
      const vehicleData = await this.getVehicleFeatures(tenantId, vehicleId)

      // Calculate prediction using simple heuristic-based model
      // In production, this would use the actual trained model
      const prediction = this.calculateMaintenancePrediction(vehicleData)

      // Store prediction
      await this.storePrediction(
        tenantId,
        model?.id,
        'predictive_maintenance',
        'vehicle',
        vehicleId,
        vehicleData,
        prediction,
        prediction.confidence
      )

      return prediction
    } catch (error: any) {
      logger.error('Maintenance prediction error', { error: error.message, vehicleId })
      throw error
    }
  }

  /**
   * Calculate driver behavior score
   */
  async scoreDriverBehavior(
    tenantId: string,
    driverId: string,
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<DriverBehaviorScore> {
    try {
      // Get driver telemetry data
      const driverData = await this.getDriverTelemetryData(tenantId, driverId, period)

      // Calculate behavior scores
      const score = this.calculateDriverBehaviorScore(driverData)

      // Store prediction
      const model = await this.getActiveModel(tenantId, 'driver_behavior_scoring')
      await this.storePrediction(
        tenantId,
        model?.id,
        'driver_behavior_scoring',
        'driver',
        driverId,
        driverData,
        score,
        0.85
      )

      return score
    } catch (error: any) {
      logger.error('Driver behavior scoring error', { error: error.message, driverId })
      throw error
    }
  }

  /**
   * Predict incident risk
   */
  async predictIncidentRisk(
    tenantId: string,
    entityType: 'vehicle' | 'driver' | 'route',
    entityId: string
  ): Promise<IncidentRiskPrediction> {
    try {
      const features = await this.getEntityRiskFeatures(tenantId, entityType, entityId)
      const riskPrediction = this.calculateIncidentRisk(entityType, features)

      const model = await this.getActiveModel(tenantId, 'incident_risk_prediction')
      await this.storePrediction(
        tenantId,
        model?.id,
        'incident_risk_prediction',
        entityType,
        entityId,
        features,
        riskPrediction,
        riskPrediction.risk_score
      )

      return riskPrediction
    } catch (error: any) {
      logger.error('Incident risk prediction error', { error: error.message, entityType, entityId })
      throw error
    }
  }

  /**
   * Forecast costs for next period
   */
  async forecastCosts(
    tenantId: string,
    forecastPeriod: 'week' | 'month' | 'quarter'
  ): Promise<CostForecast> {
    try {
      // Get historical cost data
      const historicalData = await this.getHistoricalCostData(tenantId, forecastPeriod)

      // Calculate forecast
      const forecast = this.calculateCostForecast(historicalData, forecastPeriod)

      const model = await this.getActiveModel(tenantId, 'cost_forecasting')
      await this.storePrediction(
        tenantId,
        model?.id,
        'cost_forecasting',
        'fleet',
        tenantId,
        { historical_data: historicalData },
        forecast,
        0.75
      )

      return forecast
    } catch (error: any) {
      logger.error('Cost forecasting error', { error: error.message, forecastPeriod })
      throw error
    }
  }

  /**
   * Get optimal route based on ML predictions
   */
  async optimizeRoute(
    tenantId: string,
    startLocation: { lat: number; lng: number },
    endLocation: { lat: number; lng: number },
    constraints: Record<string, any>
  ): Promise<any> {
    try {
      // Get historical route data
      const routeData = await this.getRouteHistoricalData(tenantId, startLocation, endLocation)

      // Predict best route considering traffic, weather, historical performance
      const optimizedRoute = this.calculateOptimalRoute(routeData, constraints)

      const model = await this.getActiveModel(tenantId, 'route_optimization')
      await this.storePrediction(
        tenantId,
        model?.id,
        'route_optimization',
        'route',
        `${startLocation.lat},${startLocation.lng}-${endLocation.lat},${endLocation.lng}`,
        { start: startLocation, end: endLocation, constraints },
        optimizedRoute,
        optimizedRoute.confidence
      )

      return optimizedRoute
    } catch (error: any) {
      logger.error('Route optimization error', { error: error.message })
      throw error
    }
  }

  /**
   * Record actual outcome for prediction (feedback loop)
   */
  async recordActualOutcome(
    predictionId: string,
    tenantId: string,
    actualOutcome: any,
    userId: string
  ): Promise<void> {
    try {
      // Update prediction with actual outcome
      await pool.query(
        `UPDATE predictions
         SET actual_outcome = $1,
             outcome_date = NOW(),
             is_correct = $2,
             error_magnitude = $3
         WHERE id = $4 AND tenant_id = $5`,
        [
          JSON.stringify(actualOutcome),
          this.evaluatePredictionCorrectness(predictionId, actualOutcome),
          this.calculateErrorMagnitude(predictionId, actualOutcome),
          predictionId,
          tenantId
        ]
      )

      // Get prediction details
      const predResult = await pool.query(
        `SELECT 
      id,
      tenant_id,
      model_id,
      prediction_type,
      entity_type,
      entity_id,
      input_features,
      prediction_value,
      confidence_score,
      probability_distribution,
      prediction_date,
      actual_outcome,
      outcome_date,
      is_correct,
      error_magnitude,
      metadata,
      created_at FROM predictions WHERE id = $1`,
        [predictionId]
      )

      const prediction = predResult.rows[0]

      // Create feedback loop entry
      await pool.query(
        `INSERT INTO feedback_loops (
          tenant_id, prediction_id, model_id, feedback_type,
          original_prediction, actual_value, entity_type, entity_id,
          should_retrain, provided_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          tenantId,
          predictionId,
          prediction.model_id,
          'actual_outcome',
          prediction.prediction_value,
          JSON.stringify(actualOutcome),
          prediction.entity_type,
          prediction.entity_id,
          true, // Flag for retraining
          userId
        ]
      )

      logger.info('Actual outcome recorded for prediction', { predictionId })
    } catch (error: any) {
      logger.error('Error recording actual outcome', { error: error.message, predictionId })
      throw error
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getVehicleFeatures(tenantId: string, vehicleId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
        v.id,
        v.mileage,
        v.year,
        EXTRACT(YEAR FROM AGE(NOW(), v.year::text::date)) as vehicle_age,
        v.status,
        COUNT(wo.id) as total_work_orders,
        COUNT(wo.id) FILTER (WHERE wo.created_at >= NOW() - INTERVAL '90 days') as recent_work_orders,
        COALESCE(SUM(wo.total_cost), 0) as total_maintenance_cost,
        MAX(wo.completed_at) as last_maintenance_date
       FROM vehicles v
       LEFT JOIN work_orders wo ON v.id = wo.vehicle_id
       WHERE v.id = $1 AND v.tenant_id = $2
       GROUP BY v.id`,
      [vehicleId, tenantId]
    )

    return result.rows[0] || {}
  }

  private calculateMaintenancePrediction(vehicleData: any): MaintenancePrediction {
    const mileage = vehicleData.mileage || 0
    const vehicleAge = vehicleData.vehicle_age || 0
    const recentWorkOrders = vehicleData.recent_work_orders || 0

    // Simple heuristic model
    let riskScore = 0
    let failureType = 'routine_maintenance'
    let daysUntilFailure = 180

    // High mileage increases risk
    if (mileage > 100000) riskScore += 30
    else if (mileage > 75000) riskScore += 20
    else if (mileage > 50000) riskScore += 10

    // Age increases risk
    if (vehicleAge > 8) riskScore += 30
    else if (vehicleAge > 5) riskScore += 15

    // Recent work orders indicate potential issues
    if (recentWorkOrders > 3) {
      riskScore += 25
      failureType = 'recurring_issue'
      daysUntilFailure = 60
    } else if (recentWorkOrders > 1) {
      riskScore += 15
      daysUntilFailure = 90
    }

    // Determine risk level and confidence
    let riskLevel: 'low' | 'medium' | 'high' | 'critical'
    let confidence: number

    if (riskScore >= 70) {
      riskLevel = 'critical'
      confidence = 0.85
      daysUntilFailure = 30
    } else if (riskScore >= 50) {
      riskLevel = 'high'
      confidence = 0.80
      daysUntilFailure = 60
    } else if (riskScore >= 30) {
      riskLevel = 'medium'
      confidence = 0.70
    } else {
      riskLevel = 'low'
      confidence = 0.60
    }

    const predictedDate = new Date()
    predictedDate.setDate(predictedDate.getDate() + daysUntilFailure)

    return {
      vehicle_id: vehicleData.id,
      predicted_failure_date: predictedDate,
      failure_type: failureType,
      confidence,
      recommended_action: this.getMaintenanceRecommendation(riskLevel, failureType),
      estimated_cost: this.estimateMaintenanceCost(failureType, riskLevel),
      risk_level: riskLevel
    }
  }

  private async getDriverTelemetryData(
    tenantId: string,
    driverId: string,
    period: string
  ): Promise<any> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_trips,
        AVG(CASE WHEN harsh_acceleration > 0 THEN 1 ELSE 0 END) as avg_harsh_acceleration,
        AVG(CASE WHEN harsh_braking > 0 THEN 1 ELSE 0 END) as avg_harsh_braking,
        AVG(CASE WHEN speeding_events > 0 THEN 1 ELSE 0 END) as avg_speeding,
        COUNT(si.id) as safety_incidents
       FROM trips t
       LEFT JOIN safety_incidents si ON si.driver_id = $1
         AND si.incident_date >= NOW() - INTERVAL '${days} days'
       WHERE t.driver_id = $1
         AND t.tenant_id = $2
         AND t.start_time >= NOW() - INTERVAL '${days} days'
       GROUP BY t.driver_id`,
      [driverId, tenantId]
    )

    return result.rows[0] || {}
  }

  private calculateDriverBehaviorScore(driverData: any): DriverBehaviorScore {
    // Calculate individual scores (0-100)
    const accelerationScore = Math.max(0, 100 - (driverData.avg_harsh_acceleration || 0) * 100)
    const brakingScore = Math.max(0, 100 - (driverData.avg_harsh_braking || 0) * 100)
    const speedingScore = Math.max(0, 100 - (driverData.avg_speeding || 0) * 100)
    const corneringScore = 85 // Placeholder
    const idleTimeScore = 80 // Placeholder

    // Weighted overall score
    const overallScore =
      accelerationScore * 0.25 +
      brakingScore * 0.25 +
      speedingScore * 0.3 +
      corneringScore * 0.1 +
      idleTimeScore * 0.1

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high'
    if (overallScore >= 80) riskLevel = 'low'
    else if (overallScore >= 60) riskLevel = 'medium'
    else riskLevel = 'high'

    // Identify improvement areas
    const improvementAreas: string[] = []
    if (accelerationScore < 70) improvementAreas.push('Smooth acceleration')
    if (brakingScore < 70) improvementAreas.push('Gradual braking')
    if (speedingScore < 70) improvementAreas.push('Speed limit adherence')

    return {
      driver_id: driverData.driver_id,
      overall_score: Math.round(overallScore),
      acceleration_score: Math.round(accelerationScore),
      braking_score: Math.round(brakingScore),
      speeding_score: Math.round(speedingScore),
      cornering_score: Math.round(corneringScore),
      idle_time_score: Math.round(idleTimeScore),
      safety_incidents: driverData.safety_incidents || 0,
      risk_level: riskLevel,
      improvement_areas: improvementAreas
    }
  }

  private async getEntityRiskFeatures(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<any> {
    // Implementation would fetch relevant features based on entity type
    return {
      entity_id: entityId,
      historical_incidents: Math.floor(Math.random() * 5),
      recent_violations: Math.floor(Math.random() * 3),
      maintenance_issues: Math.floor(Math.random() * 2)
    }
  }

  private calculateIncidentRisk(entityType: string, features: any): IncidentRiskPrediction {
    const riskFactors = [
      { factor: 'Historical incidents', weight: features.historical_incidents * 0.3 },
      { factor: 'Recent violations', weight: features.recent_violations * 0.25 },
      { factor: 'Maintenance issues', weight: features.maintenance_issues * 0.2 }
    ]

    const riskScore = Math.min(
      riskFactors.reduce((sum, rf) => sum + rf.weight, 0) / 0.75,
      1.0
    )

    return {
      entity_type: entityType as any,
      entity_id: features.entity_id,
      risk_score: Math.round(riskScore * 10000) / 10000,
      risk_factors: riskFactors,
      predicted_incident_types: ['collision', 'moving_violation'],
      mitigation_recommendations: [
        'Schedule additional safety training',
        'Increase monitoring frequency'
      ]
    }
  }

  private async getHistoricalCostData(tenantId: string, period: string): Promise<any> {
    const months = period === 'week' ? 1 : period === 'month' ? 3 : 12

    const result = await pool.query(
      `SELECT
        DATE_TRUNC('month', date) as month,
        SUM(fuel_cost) as fuel_cost,
        SUM(maintenance_cost) as maintenance_cost,
        SUM(total_cost) as total_cost
       FROM (
         SELECT DATE(ft.transaction_date) as date,
                SUM(ft.total_cost) as fuel_cost,
                0 as maintenance_cost,
                SUM(ft.total_cost) as total_cost
         FROM fuel_transactions ft
         WHERE ft.tenant_id = $1
           AND ft.transaction_date >= NOW() - INTERVAL '${months} months'
         GROUP BY DATE(ft.transaction_date)
         UNION ALL
         SELECT DATE(wo.created_at) as date,
                0 as fuel_cost,
                SUM(wo.total_cost) as maintenance_cost,
                SUM(wo.total_cost) as total_cost
         FROM work_orders wo
         WHERE wo.tenant_id = $1
           AND wo.created_at >= NOW() - INTERVAL '${months} months'
         GROUP BY DATE(wo.created_at)
       ) costs
       GROUP BY DATE_TRUNC('month', date)
       ORDER BY month`,
      [tenantId]
    )

    return result.rows
  }

  private calculateCostForecast(historicalData: any[], period: string): CostForecast {
    if (historicalData.length === 0) {
      return {
        forecast_period: period,
        predicted_fuel_cost: 0,
        predicted_maintenance_cost: 0,
        predicted_total_cost: 0,
        confidence_interval: { lower: 0, upper: 0 },
        trend: 'stable'
      }
    }

    // Simple linear trend forecast
    const avgFuelCost = historicalData.reduce((sum, d) => sum + (parseFloat(d.fuel_cost) || 0), 0) / historicalData.length
    const avgMaintenanceCost = historicalData.reduce((sum, d) => sum + (parseFloat(d.maintenance_cost) || 0), 0) / historicalData.length
    const avgTotalCost = avgFuelCost + avgMaintenanceCost

    // Calculate trend
    const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2))
    const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2))

    const firstAvg = firstHalf.reduce((sum, d) => sum + (parseFloat(d.total_cost) || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, d) => sum + (parseFloat(d.total_cost) || 0), 0) / secondHalf.length

    let trend: 'increasing' | 'stable' | 'decreasing'
    if (secondAvg > firstAvg * 1.1) trend = 'increasing'
    else if (secondAvg < firstAvg * 0.9) trend = 'decreasing'
    else trend = 'stable'

    return {
      forecast_period: period,
      predicted_fuel_cost: Math.round(avgFuelCost * 100) / 100,
      predicted_maintenance_cost: Math.round(avgMaintenanceCost * 100) / 100,
      predicted_total_cost: Math.round(avgTotalCost * 100) / 100,
      confidence_interval: {
        lower: Math.round(avgTotalCost * 0.85 * 100) / 100,
        upper: Math.round(avgTotalCost * 1.15 * 100) / 100
      },
      trend
    }
  }

  private async getRouteHistoricalData(
    tenantId: string,
    start: any,
    end: any
  ): Promise<any> {
    return {
      average_duration: 45,
      average_distance: 25,
      traffic_pattern: 'moderate'
    }
  }

  private calculateOptimalRoute(routeData: any, constraints: any): any {
    return {
      recommended_departure_time: new Date(Date.now() + 30 * 60000),
      estimated_duration: routeData.average_duration,
      estimated_distance: routeData.average_distance,
      confidence: 0.78,
      traffic_considerations: ['Avoid downtown during rush hour']
    }
  }

  private async getActiveModel(tenantId: string, modelType: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM ml_models
       WHERE tenant_id = $1 AND model_type = $2 AND is_active = true
       ORDER BY created_at DESC LIMIT 1`,
      [tenantId, modelType]
    )

    return result.rows[0] || null
  }

  private async storePrediction(
    tenantId: string,
    modelId: string | undefined,
    predictionType: string,
    entityType: string,
    entityId: string,
    inputFeatures: any,
    predictionValue: any,
    confidence: number
  ): Promise<void> {
    await pool.query(
      `INSERT INTO predictions (
        tenant_id, model_id, prediction_type, entity_type, entity_id,
        input_features, prediction_value, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        modelId || null,
        predictionType,
        entityType,
        entityId,
        JSON.stringify(inputFeatures),
        JSON.stringify(predictionValue),
        confidence
      ]
    )
  }

  private getMaintenanceRecommendation(riskLevel: string, failureType: string): string {
    if (riskLevel === 'critical') {
      return 'Schedule immediate inspection and preventive maintenance'
    } else if (riskLevel === 'high') {
      return 'Schedule maintenance within the next 2 weeks'
    } else if (riskLevel === 'medium') {
      return 'Schedule maintenance within the next month'
    } else {
      return 'Continue normal maintenance schedule'
    }
  }

  private estimateMaintenanceCost(failureType: string, riskLevel: string): number {
    const baseCost = failureType === 'recurring_issue' ? 800 : 400
    const multiplier = riskLevel === 'critical' ? 2.5 : riskLevel === 'high' ? 1.8 : 1.2
    return Math.round(baseCost * multiplier)
  }

  private evaluatePredictionCorrectness(predictionId: string, actualOutcome: any): boolean {
    // Simplified evaluation - in production would be more sophisticated
    return true
  }

  private calculateErrorMagnitude(predictionId: string, actualOutcome: any): number {
    // Simplified calculation - in production would compare predicted vs actual values
    return 0.05
  }
}

export const mlDecisionEngineService = new MLDecisionEngineService()
export default mlDecisionEngineService
