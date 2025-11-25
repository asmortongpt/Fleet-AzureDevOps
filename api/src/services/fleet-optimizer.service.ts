/**
 * Fleet Optimizer Service
 *
 * Analyzes fleet utilization and generates optimization recommendations
 */

import pool from '../config/database'
import fleetOptimizationModel, { VehicleUtilizationData } from '../ml-models/fleet-optimization.model'

export interface UtilizationMetric {
  vehicleId: string
  vehicleNumber: string
  utilizationRate: number
  totalHours: number
  activeHours: number
  idleHours: number
  totalMiles: number
  tripsCount: number
  costPerMile: number
  roi: number
  recommendation: string
  recommendationType: string
  potentialSavings: number
}

export interface OptimizationRecommendation {
  id?: string
  type: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  potentialSavings: number
  implementationCost: number
  paybackPeriodMonths: number
  confidenceScore: number
  vehicleIds: string[]
  status?: string
}

export class FleetOptimizerService {
  /**
   * Analyze vehicle utilization for a period
   */
  async analyzeVehicleUtilization(
    vehicleId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UtilizationMetric> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Gather utilization data
      const utilizationData = await this.gatherVehicleData(
        vehicleId,
        tenantId,
        periodStart,
        periodEnd
      )

      // Analyze using ML model
      const analysis = fleetOptimizationModel.analyzeUtilization(utilizationData)

      // Save to database
      await client.query(
        `INSERT INTO utilization_metrics (
          tenant_id, vehicle_id,
          total_hours, active_hours, idle_hours, maintenance_hours,
          utilization_rate, total_miles, trips_count, avg_trip_length,
          cost_per_mile, roi,
          recommendation, recommendation_type, potential_savings,
          period_start, period_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (vehicle_id, period_start, period_end)
        DO UPDATE SET
          total_hours = EXCLUDED.total_hours,
          active_hours = EXCLUDED.active_hours,
          idle_hours = EXCLUDED.idle_hours,
          utilization_rate = EXCLUDED.utilization_rate,
          total_miles = EXCLUDED.total_miles,
          trips_count = EXCLUDED.trips_count,
          avg_trip_length = EXCLUDED.avg_trip_length,
          cost_per_mile = EXCLUDED.cost_per_mile,
          roi = EXCLUDED.roi,
          recommendation = EXCLUDED.recommendation,
          recommendation_type = EXCLUDED.recommendation_type,
          potential_savings = EXCLUDED.potential_savings,
          updated_at = NOW()
        RETURNING *`,
        [
          tenantId, vehicleId,
          utilizationData.totalHours, utilizationData.activeHours,
          utilizationData.idleHours, utilizationData.maintenanceHours,
          analysis.utilizationRate, utilizationData.totalMiles,
          utilizationData.tripsCount, analysis.avgTripLength,
          analysis.costPerMile, analysis.roi,
          analysis.recommendation, analysis.recommendationType, analysis.potentialSavings,
          periodStart, periodEnd
        ]
      )

      await client.query('COMMIT')

      return {
        vehicleId,
        vehicleNumber: utilizationData.vehicleNumber,
        utilizationRate: analysis.utilizationRate,
        totalHours: utilizationData.totalHours,
        activeHours: utilizationData.activeHours,
        idleHours: utilizationData.idleHours,
        totalMiles: utilizationData.totalMiles,
        tripsCount: utilizationData.tripsCount,
        costPerMile: analysis.costPerMile,
        roi: analysis.roi,
        recommendation: analysis.recommendation,
        recommendationType: analysis.recommendationType,
        potentialSavings: analysis.potentialSavings
      }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error analyzing vehicle utilization:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Gather vehicle utilization data
   */
  private async gatherVehicleData(
    vehicleId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<VehicleUtilizationData> {
    // Get vehicle info
    const vehicleResult = await pool.query(
      `SELECT vehicle_number, vehicle_type, purchase_price
       FROM vehicles
       WHERE id = $1 AND tenant_id = $2',
      [vehicleId, tenantId]
    )

    if (vehicleResult.rows.length === 0) {
      throw new Error('Vehicle not found')
    }

    const vehicle = vehicleResult.rows[0]

    // Get trip data
    const tripResult = await pool.query(
      `SELECT
         COUNT(*) as trips_count,
         COALESCE(SUM(distance), 0) as total_miles,
         COALESCE(SUM(EXTRACT(EPOCH FROM (trip_end - trip_start)) / 3600), 0) as total_hours
       FROM trips
       WHERE vehicle_id = $1 AND tenant_id = $2
       AND trip_start BETWEEN $3 AND $4`,
      [vehicleId, tenantId, periodStart, periodEnd]
    )

    // Get maintenance data
    const maintenanceResult = await pool.query(
      `SELECT
         COALESCE(SUM(EXTRACT(EPOCH FROM (completed_date - started_date)) / 3600), 0) as maintenance_hours
       FROM work_orders
       WHERE vehicle_id = $1 AND tenant_id = $2
       AND status = 'completed'
       AND started_date BETWEEN $3 AND $4`,
      [vehicleId, tenantId, periodStart, periodEnd]
    )

    // Get cost data
    const costResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_cost
       FROM cost_tracking
       WHERE vehicle_id = $1 AND tenant_id = $2
       AND transaction_date BETWEEN $3 AND $4`,
      [vehicleId, tenantId, periodStart, periodEnd]
    )

    const trips = tripResult.rows[0]
    const maintenance = maintenanceResult.rows[0]
    const costs = costResult.rows[0]

    const totalHours = parseFloat(trips.total_hours || '0')
    const maintenanceHours = parseFloat(maintenance.maintenance_hours || '0')
    const totalMiles = parseFloat(trips.total_miles || '0')

    // Calculate period hours
    const periodHours = ((periodEnd.getTime() - periodStart.getTime()) / 1000 / 60 / 60)

    // Active hours = total hours - maintenance hours
    const activeHours = Math.max(0, totalHours - maintenanceHours)

    // Idle hours = period hours - total hours
    const idleHours = Math.max(0, periodHours - totalHours)

    // Monthly operating cost estimate
    const monthlyOperatingCost = parseFloat(costs.total_cost || '0')

    return {
      vehicleId,
      vehicleNumber: vehicle.vehicle_number,
      vehicleType: vehicle.vehicle_type,
      totalHours: periodHours,
      activeHours,
      idleHours,
      maintenanceHours,
      totalMiles,
      tripsCount: parseInt(trips.trips_count || '0'),
      acquisitionCost: parseFloat(vehicle.purchase_price || '50000'),
      monthlyOperatingCost
    }
  }

  /**
   * Get fleet utilization heatmap
   */
  async getUtilizationHeatmap(
    tenantId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<UtilizationMetric[]> {
    let query = `
      SELECT
        um.*,
        v.vehicle_number
      FROM utilization_metrics um
      JOIN vehicles v ON um.vehicle_id = v.id
      WHERE um.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (periodStart && periodEnd) {
      paramCount += 2
      query += ` AND um.period_start = $${paramCount - 1} AND um.period_end = $${paramCount}`
      params.push(periodStart, periodEnd)
    } else {
      // Get most recent period
      query += ` AND um.period_end = (
        SELECT MAX(period_end) FROM utilization_metrics WHERE tenant_id = $1
      )`
    }

    query += ' ORDER BY um.utilization_rate ASC'

    const result = await pool.query(query, params)

    return result.rows.map(row => ({
      vehicleId: row.vehicle_id,
      vehicleNumber: row.vehicle_number,
      utilizationRate: parseFloat(row.utilization_rate),
      totalHours: parseFloat(row.total_hours),
      activeHours: parseFloat(row.active_hours),
      idleHours: parseFloat(row.idle_hours),
      totalMiles: parseFloat(row.total_miles),
      tripsCount: parseInt(row.trips_count),
      costPerMile: parseFloat(row.cost_per_mile || '0'),
      roi: parseFloat(row.roi || '0'),
      recommendation: row.recommendation,
      recommendationType: row.recommendation_type,
      potentialSavings: parseFloat(row.potential_savings || '0')
    }))
  }

  /**
   * Generate optimization recommendations
   */
  async generateRecommendations(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<OptimizationRecommendation[]> {
    // Get all vehicles' utilization data
    const vehicles = await pool.query(
      'SELECT id FROM vehicles WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    )

    const utilizationData: VehicleUtilizationData[] = []

    for (const vehicle of vehicles.rows) {
      try {
        const data = await this.gatherVehicleData(
          vehicle.id,
          tenantId,
          periodStart,
          periodEnd
        )
        utilizationData.push(data)
      } catch (error) {
        console.error(`Error gathering data for vehicle ${vehicle.id}:`, error)
      }
    }

    // Generate recommendations using ML model
    const recommendations = await fleetOptimizationModel.generateFleetRecommendations(
      tenantId,
      utilizationData
    )

    // Save recommendations to database
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      for (const rec of recommendations) {
        await client.query(
          `INSERT INTO fleet_optimization_recommendations (
            tenant_id, recommendation_type, title, description, priority,
            potential_savings, implementation_cost, payback_period_months,
            confidence_score, vehicle_ids, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
          RETURNING id`,
          [
            tenantId, rec.type, rec.title, rec.description, rec.priority,
            rec.potentialSavings, rec.implementationCost, rec.paybackPeriodMonths,
            rec.confidenceScore, rec.vehicleIds
          ]
        )
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error saving recommendations:', error)
    } finally {
      client.release()
    }

    return recommendations
  }

  /**
   * Get recommendations
   */
  async getRecommendations(
    tenantId: string,
    status?: string
  ): Promise<OptimizationRecommendation[]> {
    let query = `
      SELECT id, tenant_id, recommendation_type, title, description, priority, estimated_savings, created_at FROM fleet_optimization_recommendations
      WHERE tenant_id = $1
    `

    const params: any[] = [tenantId]

    if (status) {
      query += ' AND status = $2'
      params.push(status)
    }

    query += ' ORDER BY priority DESC, potential_savings DESC, created_at DESC'

    const result = await pool.query(query, params)

    return result.rows.map(row => ({
      id: row.id,
      type: row.recommendation_type,
      title: row.title,
      description: row.description,
      priority: row.priority,
      potentialSavings: parseFloat(row.potential_savings || '0'),
      implementationCost: parseFloat(row.implementation_cost || '0'),
      paybackPeriodMonths: parseInt(row.payback_period_months || '0'),
      confidenceScore: parseFloat(row.confidence_score || '0'),
      vehicleIds: row.vehicle_ids || [],
      status: row.status
    }))
  }

  /**
   * Calculate optimal fleet size
   */
  async calculateOptimalFleetSize(
    tenantId: string,
    avgDailyDemand: number
  ): Promise<{
    currentSize: number
    optimalSize: number
    recommendation: string
    potentialSavings: number
  }> {
    // Get current fleet size
    const sizeResult = await pool.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    )

    const currentSize = parseInt(sizeResult.rows[0].count)

    // Calculate optimal size
    const result = await fleetOptimizationModel.calculateOptimalFleetSize(
      tenantId,
      currentSize,
      avgDailyDemand
    )

    return {
      currentSize,
      ...result
    }
  }

  /**
   * Predict future utilization
   */
  async predictUtilization(
    vehicleId: string,
    tenantId: string,
    forecastMonths: number = 3
  ): Promise<Array<{ month: string; predictedUtilization: number; confidence: number }>> {
    return fleetOptimizationModel.predictFutureUtilization(
      vehicleId,
      tenantId,
      forecastMonths
    )
  }

  /**
   * Analyze all vehicles for a period
   */
  async analyzeAllVehicles(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const vehicles = await pool.query(
      'SELECT id FROM vehicles WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    )

    for (const vehicle of vehicles.rows) {
      try {
        await this.analyzeVehicleUtilization(vehicle.id, tenantId, periodStart, periodEnd)
      } catch (error) {
        console.error(`Error analyzing vehicle ${vehicle.id}:`, error)
      }
    }
  }
}

export default new FleetOptimizerService()
