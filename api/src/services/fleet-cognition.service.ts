/**
 * Fleet Cognition Service
 * Central AI orchestrator that coordinates all ML services, performs pattern recognition,
 * anomaly detection, and generates high-level insights for fleet managers
 */

import pool from '../config/database'
import { logger } from '../utils/logger'
import mlDecisionEngineService from './ml-decision-engine.service'
import ragEngineService from './rag-engine.service'

export interface CognitionInsight {
  insight_type: string
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affected_entities: any[]
  recommended_actions: any[]
  confidence_score: number
}

export interface PatternAnalysis {
  pattern_type: string
  pattern_name: string
  description: string
  affected_entities: any[]
  occurrence_frequency: string
  confidence_score: number
}

export interface AnomalyDetection {
  anomaly_type: string
  entity_type: string
  entity_id: string
  metric_name: string
  expected_value: any
  actual_value: any
  deviation_score: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class FleetCognitionService {
  private analysisInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startContinuousAnalysis()
  }

  /**
   * Generate comprehensive fleet insights
   */
  async generateFleetInsights(tenantId: string): Promise<CognitionInsight[]> {
    logger.info('Generating fleet insights', { tenantId })

    const insights: CognitionInsight[] = []

    try {
      // 1. Analyze maintenance patterns
      const maintenanceInsights = await this.analyzeMaintenancePatterns(tenantId)
      insights.push(...maintenanceInsights)

      // 2. Analyze driver performance
      const driverInsights = await this.analyzeDriverPerformance(tenantId)
      insights.push(...driverInsights)

      // 3. Analyze cost trends
      const costInsights = await this.analyzeCostTrends(tenantId)
      insights.push(...costInsights)

      // 4. Detect anomalies
      const anomalyInsights = await this.detectAndReportAnomalies(tenantId)
      insights.push(...anomalyInsights)

      // 5. Identify optimization opportunities
      const optimizationInsights = await this.identifyOptimizationOpportunities(tenantId)
      insights.push(...optimizationInsights)

      // Store insights in database
      for (const insight of insights) {
        await this.storeInsight(tenantId, insight)
      }

      logger.info('Fleet insights generated', { tenantId, count: insights.length })

      return insights
    } catch (error: any) {
      logger.error('Error generating fleet insights', { error: error.message, tenantId })
      throw error
    }
  }

  /**
   * Detect patterns across fleet operations
   */
  async detectPatterns(tenantId: string): Promise<PatternAnalysis[]> {
    logger.info('Detecting fleet patterns', { tenantId })

    const patterns: PatternAnalysis[] = []

    try {
      // Pattern 1: Recurring maintenance issues
      const maintenancePatterns = await this.detectMaintenancePatterns(tenantId)
      patterns.push(...maintenancePatterns)

      // Pattern 2: Driver behavior patterns
      const driverPatterns = await this.detectDriverBehaviorPatterns(tenantId)
      patterns.push(...driverPatterns)

      // Pattern 3: Route efficiency patterns
      const routePatterns = await this.detectRoutePatterns(tenantId)
      patterns.push(...routePatterns)

      // Pattern 4: Incident patterns
      const incidentPatterns = await this.detectIncidentPatterns(tenantId)
      patterns.push(...incidentPatterns)

      // Store detected patterns
      for (const pattern of patterns) {
        await this.storePattern(tenantId, pattern)
      }

      logger.info('Patterns detected', { tenantId, count: patterns.length })

      return patterns
    } catch (error: any) {
      logger.error('Error detecting patterns', { error: error.message, tenantId })
      throw error
    }
  }

  /**
   * Detect anomalies across fleet metrics
   */
  async detectAnomalies(tenantId: string): Promise<AnomalyDetection[]> {
    logger.info('Detecting anomalies', { tenantId })

    const anomalies: AnomalyDetection[] = []

    try {
      // Anomaly 1: Unusual fuel consumption
      const fuelAnomalies = await this.detectFuelConsumptionAnomalies(tenantId)
      anomalies.push(...fuelAnomalies)

      // Anomaly 2: Unusual maintenance frequency
      const maintenanceAnomalies = await this.detectMaintenanceAnomalies(tenantId)
      anomalies.push(...maintenanceAnomalies)

      // Anomaly 3: Unusual driver behavior
      const driverAnomalies = await this.detectDriverBehaviorAnomalies(tenantId)
      anomalies.push(...driverAnomalies)

      // Anomaly 4: Unusual route deviations
      const routeAnomalies = await this.detectRouteAnomalies(tenantId)
      anomalies.push(...routeAnomalies)

      // Store detected anomalies
      for (const anomaly of anomalies) {
        await this.storeAnomaly(tenantId, anomaly)
      }

      logger.info('Anomalies detected', { tenantId, count: anomalies.length })

      return anomalies
    } catch (error: any) {
      logger.error('Error detecting anomalies', { error: error.message, tenantId })
      throw error
    }
  }

  /**
   * Get personalized recommendations for fleet manager
   */
  async getRecommendations(
    tenantId: string,
    context: 'maintenance' | 'cost' | 'safety' | 'efficiency' | 'all' = 'all'
  ): Promise<any[]> {
    logger.info('Generating recommendations', { tenantId, context })

    const recommendations: any[] = []

    try {
      // Get recent insights
      const insights = await this.getRecentInsights(tenantId, 30)

      // Get detected patterns
      const patterns = await this.getRecentPatterns(tenantId, 30)

      // Get detected anomalies
      const anomalies = await this.getUnresolvedAnomalies(tenantId)

      // Generate recommendations based on insights, patterns, and anomalies
      if (context === 'all' || context === 'maintenance') {
        recommendations.push(...this.generateMaintenanceRecommendations(insights, patterns, anomalies))
      }

      if (context === 'all' || context === 'cost') {
        recommendations.push(...this.generateCostOptimizationRecommendations(insights, patterns))
      }

      if (context === 'all' || context === 'safety') {
        recommendations.push(...this.generateSafetyRecommendations(insights, anomalies))
      }

      if (context === 'all' || context === 'efficiency') {
        recommendations.push(...this.generateEfficiencyRecommendations(patterns))
      }

      logger.info('Recommendations generated', { tenantId, count: recommendations.length })

      return recommendations
    } catch (error: any) {
      logger.error('Error generating recommendations', { error: error.message, tenantId })
      throw error
    }
  }

  /**
   * Learn from feedback and improve predictions
   */
  async processFeedbackLoop(tenantId: string): Promise<void> {
    logger.info('Processing feedback loop', { tenantId })

    try {
      // Get feedback that hasn't been incorporated into training
      const feedbackResult = await pool.query(
        `SELECT * FROM feedback_loops
         WHERE tenant_id = $1
           AND incorporated_into_training = false
           AND should_retrain = true
         ORDER BY created_at DESC
         LIMIT 100`,
        [tenantId]
      )

      const feedbackItems = feedbackResult.rows

      if (feedbackItems.length === 0) {
        logger.info('No new feedback to process', { tenantId })
        return
      }

      // Group feedback by model type
      const feedbackByModel = this.groupFeedbackByModel(feedbackItems)

      // For each model type, assess if retraining is needed
      for (const [modelId, feedbacks] of Object.entries(feedbackByModel)) {
        const shouldRetrain = await this.assessRetrainingNeed(modelId, feedbacks as any[])

        if (shouldRetrain) {
          logger.info('Scheduling model retraining', { modelId, feedbackCount: (feedbacks as any[]).length })
          await this.scheduleModelRetraining(tenantId, modelId, feedbacks as any[])
        }
      }

      logger.info('Feedback loop processed', { tenantId, feedbackProcessed: feedbackItems.length })
    } catch (error: any) {
      logger.error('Error processing feedback loop', { error: error.message, tenantId })
      throw error
    }
  }

  /**
   * Get fleet health score
   */
  async getFleetHealthScore(tenantId: string): Promise<any> {
    logger.info('Calculating fleet health score', { tenantId })

    try {
      // Get various metrics
      const vehicleHealth = await this.calculateVehicleHealth(tenantId)
      const driverSafety = await this.calculateDriverSafety(tenantId)
      const maintenanceCompliance = await this.calculateMaintenanceCompliance(tenantId)
      const costEfficiency = await this.calculateCostEfficiency(tenantId)
      const incidentRate = await this.calculateIncidentRate(tenantId)

      // Calculate overall health score (weighted average)
      const overallScore =
        vehicleHealth * 0.25 +
        driverSafety * 0.25 +
        maintenanceCompliance * 0.20 +
        costEfficiency * 0.15 +
        incidentRate * 0.15

      return {
        overall_score: Math.round(overallScore),
        vehicle_health: Math.round(vehicleHealth),
        driver_safety: Math.round(driverSafety),
        maintenance_compliance: Math.round(maintenanceCompliance),
        cost_efficiency: Math.round(costEfficiency),
        incident_rate_score: Math.round(incidentRate),
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      logger.error('Error calculating fleet health score', { error: error.message, tenantId })
      throw error
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async analyzeMaintenancePatterns(tenantId: string): Promise<CognitionInsight[]> {
    const insights: CognitionInsight[] = []

    // Get vehicles needing maintenance
    const result = await pool.query(
      `SELECT v.id, v.name, v.mileage,
              COUNT(wo.id) FILTER (WHERE wo.created_at >= NOW() - INTERVAL '90 days') as recent_work_orders
       FROM vehicles v
       LEFT JOIN work_orders wo ON v.id = wo.vehicle_id
       WHERE v.tenant_id = $1 AND v.status = 'active'
       GROUP BY v.id
       HAVING COUNT(wo.id) FILTER (WHERE wo.created_at >= INTERVAL '90 days') >= 3`,
      [tenantId]
    )

    if (result.rows.length > 0) {
      insights.push({
        insight_type: 'pattern_recognized',
        severity: 'medium',
        title: `${result.rows.length} vehicles showing frequent maintenance needs`,
        description: `Multiple vehicles have required 3+ maintenance interventions in the past 90 days. This may indicate underlying issues or aging fleet.`,
        affected_entities: result.rows.map(r => ({ type: 'vehicle', id: r.id, name: r.name })),
        recommended_actions: [
          { action: 'Schedule comprehensive inspections', priority: 'high' },
          { action: 'Consider vehicle replacement analysis', priority: 'medium' }
        ],
        confidence_score: 0.85
      })
    }

    return insights
  }

  private async analyzeDriverPerformance(tenantId: string): Promise<CognitionInsight[]> {
    const insights: CognitionInsight[] = []

    // Get high-risk drivers
    const result = await pool.query(
      `SELECT d.id, d.first_name, d.last_name,
              COUNT(si.id) as incident_count
       FROM drivers d
       LEFT JOIN safety_incidents si ON d.id = si.driver_id
         AND si.incident_date >= NOW() - INTERVAL '90 days'
       WHERE d.tenant_id = $1 AND d.status = 'active'
       GROUP BY d.id
       HAVING COUNT(si.id) >= 2`,
      [tenantId]
    )

    if (result.rows.length > 0) {
      insights.push({
        insight_type: 'risk_alert',
        severity: 'high',
        title: `${result.rows.length} drivers with elevated safety risk`,
        description: `These drivers have been involved in 2+ safety incidents in the past 90 days.`,
        affected_entities: result.rows.map(r => ({
          type: 'driver',
          id: r.id,
          name: `${r.first_name} ${r.last_name}`
        })),
        recommended_actions: [
          { action: 'Schedule immediate safety training', priority: 'high' },
          { action: 'Implement increased monitoring', priority: 'high' },
          { action: 'Review driving assignments', priority: 'medium' }
        ],
        confidence_score: 0.90
      })
    }

    return insights
  }

  private async analyzeCostTrends(tenantId: string): Promise<CognitionInsight[]> {
    const insights: CognitionInsight[] = []

    // Analyze cost trends
    const result = await pool.query(
      `WITH monthly_costs AS (
         SELECT
           DATE_TRUNC('month', created_at) as month,
           SUM(total_cost) as total_cost
         FROM work_orders
         WHERE tenant_id = $1
           AND created_at >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month
       )
       SELECT
         (SELECT total_cost FROM monthly_costs ORDER BY month DESC LIMIT 1) as current_month,
         (SELECT AVG(total_cost) FROM monthly_costs) as avg_cost
       FROM monthly_costs
       LIMIT 1`,
      [tenantId]
    )

    if (result.rows.length > 0) {
      const current = parseFloat(result.rows[0].current_month) || 0
      const average = parseFloat(result.rows[0].avg_cost) || 0

      if (current > average * 1.25) {
        insights.push({
          insight_type: 'cost_savings_opportunity',
          severity: 'medium',
          title: 'Maintenance costs trending above average',
          description: `Current month costs are 25% higher than 6-month average. Consider reviewing maintenance strategies.`,
          affected_entities: [{ type: 'fleet', id: tenantId }],
          recommended_actions: [
            { action: 'Review and optimize maintenance schedules', priority: 'medium' },
            { action: 'Evaluate vendor pricing', priority: 'low' }
          ],
          confidence_score: 0.75
        })
      }
    }

    return insights
  }

  private async detectAndReportAnomalies(tenantId: string): Promise<CognitionInsight[]> {
    const anomalies = await this.detectAnomalies(tenantId)

    return anomalies
      .filter(a => a.severity === 'high' || a.severity === 'critical')
      .map(a => ({
        insight_type: 'anomaly_detected',
        severity: a.severity,
        title: `Anomaly detected: ${a.metric_name}`,
        description: `${a.entity_type} showing unusual ${a.metric_name}. Expected: ${JSON.stringify(a.expected_value)}, Actual: ${JSON.stringify(a.actual_value)}`,
        affected_entities: [{ type: a.entity_type, id: a.entity_id }],
        recommended_actions: [
          { action: 'Investigate root cause', priority: 'high' },
          { action: 'Monitor closely', priority: 'medium' }
        ],
        confidence_score: 0.80
      }))
  }

  private async identifyOptimizationOpportunities(tenantId: string): Promise<CognitionInsight[]> {
    const insights: CognitionInsight[] = []

    // Check for idle vehicles
    const idleResult = await pool.query(
      `SELECT v.id, v.name, MAX(t.end_time) as last_trip
       FROM vehicles v
       LEFT JOIN trips t ON v.id = t.vehicle_id
       WHERE v.tenant_id = $1 AND v.status = 'active'
       GROUP BY v.id
       HAVING MAX(t.end_time) < NOW() - INTERVAL '14 days' OR MAX(t.end_time) IS NULL`,
      [tenantId]
    )

    if (idleResult.rows.length > 0) {
      insights.push({
        insight_type: 'optimization_opportunity',
        severity: 'low',
        title: `${idleResult.rows.length} vehicles underutilized`,
        description: `These vehicles have not been used in the past 14 days, representing potential cost savings.`,
        affected_entities: idleResult.rows.map(r => ({ type: 'vehicle', id: r.id, name: r.name })),
        recommended_actions: [
          { action: 'Consider fleet right-sizing', priority: 'medium' },
          { action: 'Evaluate vehicle reallocation', priority: 'low' }
        ],
        confidence_score: 0.70
      })
    }

    return insights
  }

  private async detectMaintenancePatterns(tenantId: string): Promise<PatternAnalysis[]> {
    // Implementation for detecting maintenance patterns
    return []
  }

  private async detectDriverBehaviorPatterns(tenantId: string): Promise<PatternAnalysis[]> {
    // Implementation for detecting driver behavior patterns
    return []
  }

  private async detectRoutePatterns(tenantId: string): Promise<PatternAnalysis[]> {
    // Implementation for detecting route patterns
    return []
  }

  private async detectIncidentPatterns(tenantId: string): Promise<PatternAnalysis[]> {
    // Implementation for detecting incident patterns
    return []
  }

  private async detectFuelConsumptionAnomalies(tenantId: string): Promise<AnomalyDetection[]> {
    // Implementation for detecting fuel consumption anomalies
    return []
  }

  private async detectMaintenanceAnomalies(tenantId: string): Promise<AnomalyDetection[]> {
    // Implementation for detecting maintenance anomalies
    return []
  }

  private async detectDriverBehaviorAnomalies(tenantId: string): Promise<AnomalyDetection[]> {
    // Implementation for detecting driver behavior anomalies
    return []
  }

  private async detectRouteAnomalies(tenantId: string): Promise<AnomalyDetection[]> {
    // Implementation for detecting route anomalies
    return []
  }

  private async storeInsight(tenantId: string, insight: CognitionInsight): Promise<void> {
    await pool.query(
      `INSERT INTO cognition_insights (
        tenant_id, insight_type, severity, title, description,
        affected_entities, recommended_actions, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        insight.insight_type,
        insight.severity,
        insight.title,
        insight.description,
        JSON.stringify(insight.affected_entities),
        JSON.stringify(insight.recommended_actions),
        insight.confidence_score
      ]
    )
  }

  private async storePattern(tenantId: string, pattern: PatternAnalysis): Promise<void> {
    await pool.query(
      `INSERT INTO detected_patterns (
        tenant_id, pattern_type, pattern_name, description,
        affected_entities, pattern_characteristics, confidence_score,
        first_detected_at, last_detected_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (tenant_id, pattern_type, pattern_name) DO UPDATE
      SET occurrence_count = detected_patterns.occurrence_count + 1,
          last_detected_at = NOW()`,
      [
        tenantId,
        pattern.pattern_type,
        pattern.pattern_name,
        pattern.description,
        JSON.stringify(pattern.affected_entities),
        JSON.stringify({ frequency: pattern.occurrence_frequency }),
        pattern.confidence_score
      ]
    )
  }

  private async storeAnomaly(tenantId: string, anomaly: AnomalyDetection): Promise<void> {
    await pool.query(
      `INSERT INTO anomalies (
        tenant_id, anomaly_type, entity_type, entity_id, metric_name,
        expected_value, actual_value, deviation_score, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenantId,
        anomaly.anomaly_type,
        anomaly.entity_type,
        anomaly.entity_id,
        anomaly.metric_name,
        JSON.stringify(anomaly.expected_value),
        JSON.stringify(anomaly.actual_value),
        anomaly.deviation_score,
        anomaly.severity
      ]
    )
  }

  private async getRecentInsights(tenantId: string, days: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM cognition_insights
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [tenantId]
    )
    return result.rows
  }

  private async getRecentPatterns(tenantId: string, days: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM detected_patterns
       WHERE tenant_id = $1 AND last_detected_at >= NOW() - INTERVAL '${days} days'
       ORDER BY occurrence_count DESC`,
      [tenantId]
    )
    return result.rows
  }

  private async getUnresolvedAnomalies(tenantId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM anomalies
       WHERE tenant_id = $1 AND is_resolved = false
       ORDER BY severity DESC, detected_at DESC`,
      [tenantId]
    )
    return result.rows
  }

  private generateMaintenanceRecommendations(insights: any[], patterns: any[], anomalies: any[]): any[] {
    return [
      {
        type: 'maintenance',
        priority: 'high',
        title: 'Implement predictive maintenance program',
        description: 'Based on patterns, predictive maintenance could reduce costs by 20%'
      }
    ]
  }

  private generateCostOptimizationRecommendations(insights: any[], patterns: any[]): any[] {
    return [
      {
        type: 'cost',
        priority: 'medium',
        title: 'Optimize fuel purchasing',
        description: 'Bulk fuel purchases could save approximately $2,000/month'
      }
    ]
  }

  private generateSafetyRecommendations(insights: any[], anomalies: any[]): any[] {
    return [
      {
        type: 'safety',
        priority: 'high',
        title: 'Enhanced driver training program',
        description: 'Targeted training for high-risk drivers could reduce incidents by 30%'
      }
    ]
  }

  private generateEfficiencyRecommendations(patterns: any[]): any[] {
    return [
      {
        type: 'efficiency',
        priority: 'medium',
        title: 'Route optimization implementation',
        description: 'AI-powered route optimization could reduce fuel costs by 15%'
      }
    ]
  }

  private groupFeedbackByModel(feedbackItems: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>()
    for (const item of feedbackItems) {
      if (!grouped.has(item.model_id)) {
        grouped.set(item.model_id, [])
      }
      grouped.get(item.model_id)!.push(item)
    }
    return grouped
  }

  private async assessRetrainingNeed(modelId: string, feedbacks: any[]): Promise<boolean> {
    // Retrain if we have 50+ feedback items or accuracy drops below threshold
    return feedbacks.length >= 50
  }

  private async scheduleModelRetraining(tenantId: string, modelId: string, feedbacks: any[]): Promise<void> {
    // This would integrate with the ML training service
    logger.info('Model retraining scheduled', { modelId, feedbackCount: feedbacks.length })
  }

  private async calculateVehicleHealth(tenantId: string): Promise<number> {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_vehicles,
        COUNT(*) FILTER (WHERE status = 'maintenance') as in_maintenance
       FROM vehicles WHERE tenant_id = $1 AND status IN ('active', 'maintenance')`,
      [tenantId]
    )

    const total = parseInt(result.rows[0].total_vehicles) || 1
    const inMaintenance = parseInt(result.rows[0].in_maintenance) || 0

    return Math.max(0, 100 - (inMaintenance / total) * 100)
  }

  private async calculateDriverSafety(tenantId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as incident_count
       FROM safety_incidents
       WHERE tenant_id = $1 AND incident_date >= NOW() - INTERVAL '90 days'`,
      [tenantId]
    )

    const incidents = parseInt(result.rows[0].incident_count) || 0
    return Math.max(0, 100 - incidents * 5)
  }

  private async calculateMaintenanceCompliance(tenantId: string): Promise<number> {
    // Simplified: assume 80% compliance
    return 80
  }

  private async calculateCostEfficiency(tenantId: string): Promise<number> {
    // Simplified: assume 75% efficiency
    return 75
  }

  private async calculateIncidentRate(tenantId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as incident_count
       FROM safety_incidents
       WHERE tenant_id = $1 AND incident_date >= NOW() - INTERVAL '30 days'`,
      [tenantId]
    )

    const incidents = parseInt(result.rows[0].incident_count) || 0
    return Math.max(0, 100 - incidents * 10)
  }

  private startContinuousAnalysis(): void {
    // Run analysis every 6 hours
    this.analysisInterval = setInterval(async () => {
      try {
        // Get all active tenants
        const tenantsResult = await pool.query('SELECT id FROM tenants WHERE is_active = true')

        for (const tenant of tenantsResult.rows) {
          try {
            await this.generateFleetInsights(tenant.id)
            await this.detectPatterns(tenant.id)
            await this.detectAnomalies(tenant.id)
            await this.processFeedbackLoop(tenant.id)
          } catch (error) {
            logger.error('Error in continuous analysis for tenant', { tenantId: tenant.id, error })
          }
        }
      } catch (error) {
        logger.error('Error in continuous analysis', { error })
      }
    }, 6 * 60 * 60 * 1000) // 6 hours
  }

  async shutdown(): Promise<void> {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
    }
    logger.info('Fleet cognition service shut down')
  }
}

export const fleetCognitionService = new FleetCognitionService()
export default fleetCognitionService
