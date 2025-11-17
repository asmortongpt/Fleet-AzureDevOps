/**
 * Executive Dashboard Service
 *
 * Provides real-time KPI calculations, AI-powered insights,
 * trend analysis, and comprehensive fleet health metrics.
 */

import OpenAI from 'openai'
import pool from '../config/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface DashboardKPIs {
  totalVehicles: number
  activeVehicles: number
  inactiveVehicles: number
  maintenanceVehicles: number
  fleetUtilizationRate: number
  totalMileageThisMonth: number
  totalMileageLastMonth: number
  mileageChange: number
  avgFuelEfficiency: number
  maintenanceCostPerVehicle: number
  incidentRatePer100kMiles: number
  avgDriverSafetyScore: number
  assetUtilizationPercentage: number
  taskCompletionRate: number
  avgAlertResponseTime: number
}

interface TrendData {
  date: string
  value: number
  label: string
}

interface AIInsight {
  id: string
  type: 'warning' | 'recommendation' | 'insight' | 'critical'
  title: string
  message: string
  confidence: number
  actionable: boolean
  relatedVehicle?: string
  timestamp: string
}

interface AlertSummary {
  critical: number
  high: number
  medium: number
  low: number
  recentAlerts: Array<{
    id: string
    severity: string
    message: string
    vehicleId?: string
    timestamp: string
  }>
}

interface FleetHealthScore {
  overall: number
  mechanical: number
  safety: number
  compliance: number
  efficiency: number
  breakdown: {
    category: string
    score: number
    weight: number
  }[]
}

interface CostAnalysis {
  totalCosts: number
  fuelCosts: number
  maintenanceCosts: number
  incidentCosts: number
  costPerMile: number
  costPerVehicle: number
  breakdown: {
    category: string
    amount: number
    percentage: number
  }[]
  trends: TrendData[]
}

export class ExecutiveDashboardService {
  /**
   * Calculate all KPIs for the executive dashboard
   */
  async getKPIs(tenantId: string): Promise<DashboardKPIs> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get vehicle counts
    const vehicleStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
        COUNT(*) FILTER (WHERE status IN ('out_of_service', 'sold', 'retired')) as inactive
      FROM vehicles
      WHERE tenant_id = $1
    `, [tenantId])

    const vStats = vehicleStats.rows[0]

    // Get mileage data
    const mileageData = await pool.query(`
      SELECT
        COALESCE(SUM(ft.gallons * 25.0), 0) as current_month_mileage,
        COALESCE(AVG(ft.gallons), 0) as avg_fuel_consumption
      FROM fuel_transactions ft
      WHERE ft.tenant_id = $1
        AND ft.transaction_date >= $2
    `, [tenantId, startOfMonth])

    const lastMonthMileage = await pool.query(`
      SELECT COALESCE(SUM(ft.gallons * 25.0), 0) as last_month_mileage
      FROM fuel_transactions ft
      WHERE ft.tenant_id = $1
        AND ft.transaction_date >= $2
        AND ft.transaction_date < $3
    `, [tenantId, startOfLastMonth, endOfLastMonth])

    const currentMileage = parseFloat(mileageData.rows[0]?.current_month_mileage || '0')
    const lastMileage = parseFloat(lastMonthMileage.rows[0]?.last_month_mileage || '0')
    const mileageChange = lastMileage > 0 ? ((currentMileage - lastMileage) / lastMileage) * 100 : 0

    // Calculate fuel efficiency
    const fuelEfficiency = await pool.query(`
      SELECT
        COALESCE(AVG(
          CASE
            WHEN gallons > 0 THEN (25.0 / gallons) * 100
            ELSE 0
          END
        ), 0) as avg_mpg
      FROM fuel_transactions
      WHERE tenant_id = $1
        AND transaction_date >= $2
    `, [tenantId, startOfMonth])

    // Get maintenance costs
    const maintenanceCosts = await pool.query(`
      SELECT
        COALESCE(AVG(total_cost), 0) as avg_cost_per_vehicle
      FROM work_orders
      WHERE tenant_id = $1
        AND actual_end >= $2
        AND status = 'completed'
    `, [tenantId, startOfMonth])

    // Calculate incident rate
    const incidentRate = await pool.query(`
      SELECT
        COUNT(*) as incident_count,
        COALESCE(SUM(
          CASE
            WHEN v.odometer > 0 THEN v.odometer
            ELSE 0
          END
        ), 0) as total_miles
      FROM safety_incidents si
      LEFT JOIN vehicles v ON si.vehicle_id = v.id
      WHERE si.tenant_id = $1
        AND si.incident_date >= $2
    `, [tenantId, startOfMonth])

    const incidents = parseInt(incidentRate.rows[0]?.incident_count || '0')
    const totalMiles = parseFloat(incidentRate.rows[0]?.total_miles || '0')
    const incidentsPer100k = totalMiles > 0 ? (incidents / totalMiles) * 100000 : 0

    // Get driver safety scores
    const driverScores = await pool.query(`
      SELECT COALESCE(AVG(safety_score), 100) as avg_score
      FROM drivers
      WHERE tenant_id = $1
        AND status = 'active'
    `, [tenantId])

    // Calculate fleet utilization
    const utilizationData = await pool.query(`
      SELECT
        COUNT(DISTINCT v.id) as active_count,
        COALESCE(AVG(v.engine_hours), 0) as avg_hours
      FROM vehicles v
      WHERE v.tenant_id = $1
        AND v.status = 'active'
    `, [tenantId])

    const avgHours = parseFloat(utilizationData.rows[0]?.avg_hours || '0')
    const expectedHours = 160 // Average hours per month
    const utilizationRate = expectedHours > 0 ? (avgHours / expectedHours) * 100 : 0

    // Asset utilization percentage
    const assetUtilization = vStats.total > 0
      ? (parseInt(vStats.active) / parseInt(vStats.total)) * 100
      : 0

    // Task completion rate (from work orders)
    const taskCompletion = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) as total
      FROM work_orders
      WHERE tenant_id = $1
        AND created_at >= $2
    `, [tenantId, startOfMonth])

    const completedTasks = parseInt(taskCompletion.rows[0]?.completed || '0')
    const totalTasks = parseInt(taskCompletion.rows[0]?.total || '0')
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Alert response time (using policy violations as proxy)
    const alertResponse = await pool.query(`
      SELECT
        COALESCE(AVG(
          EXTRACT(EPOCH FROM (acknowledged_at - violation_time)) / 3600
        ), 0) as avg_hours
      FROM policy_violations
      WHERE tenant_id = $1
        AND acknowledged = true
        AND violation_time >= $2
    `, [tenantId, startOfMonth])

    return {
      totalVehicles: parseInt(vStats.total),
      activeVehicles: parseInt(vStats.active),
      inactiveVehicles: parseInt(vStats.inactive),
      maintenanceVehicles: parseInt(vStats.maintenance),
      fleetUtilizationRate: parseFloat(utilizationRate.toFixed(2)),
      totalMileageThisMonth: parseFloat(currentMileage.toFixed(2)),
      totalMileageLastMonth: parseFloat(lastMileage.toFixed(2)),
      mileageChange: parseFloat(mileageChange.toFixed(2)),
      avgFuelEfficiency: parseFloat(fuelEfficiency.rows[0]?.avg_mpg || '0'),
      maintenanceCostPerVehicle: parseFloat(maintenanceCosts.rows[0]?.avg_cost_per_vehicle || '0'),
      incidentRatePer100kMiles: parseFloat(incidentsPer100k.toFixed(2)),
      avgDriverSafetyScore: parseFloat(driverScores.rows[0]?.avg_score || '100'),
      assetUtilizationPercentage: parseFloat(assetUtilization.toFixed(2)),
      taskCompletionRate: parseFloat(taskCompletionRate.toFixed(2)),
      avgAlertResponseTime: parseFloat(alertResponse.rows[0]?.avg_hours || '0')
    }
  }

  /**
   * Get trend data for time-series charts
   */
  async getTrends(tenantId: string, days: number = 30): Promise<{
    utilization: TrendData[]
    costs: TrendData[]
    incidents: TrendData[]
    maintenance: TrendData[]
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Daily utilization trend
    const utilizationTrend = await pool.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as value
      FROM telemetry_data
      WHERE tenant_id = $1
        AND timestamp >= $2
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [tenantId, startDate])

    // Daily cost trend
    const costTrend = await pool.query(`
      SELECT
        DATE(actual_end) as date,
        SUM(total_cost) as value
      FROM work_orders
      WHERE tenant_id = $1
        AND actual_end >= $2
        AND status = 'completed'
      GROUP BY DATE(actual_end)
      ORDER BY date ASC
    `, [tenantId, startDate])

    // Daily incident trend
    const incidentTrend = await pool.query(`
      SELECT
        DATE(incident_date) as date,
        COUNT(*) as value
      FROM safety_incidents
      WHERE tenant_id = $1
        AND incident_date >= $2
      GROUP BY DATE(incident_date)
      ORDER BY date ASC
    `, [tenantId, startDate])

    // Maintenance schedule trend
    const maintenanceTrend = await pool.query(`
      SELECT
        DATE(actual_start) as date,
        COUNT(*) as value
      FROM work_orders
      WHERE tenant_id = $1
        AND actual_start >= $2
      GROUP BY DATE(actual_start)
      ORDER BY date ASC
    `, [tenantId, startDate])

    return {
      utilization: utilizationTrend.rows.map(r => ({
        date: r.date,
        value: parseFloat(r.value),
        label: 'Telemetry Events'
      })),
      costs: costTrend.rows.map(r => ({
        date: r.date,
        value: parseFloat(r.value),
        label: 'Maintenance Costs'
      })),
      incidents: incidentTrend.rows.map(r => ({
        date: r.date,
        value: parseFloat(r.value),
        label: 'Incidents'
      })),
      maintenance: maintenanceTrend.rows.map(r => ({
        date: r.date,
        value: parseFloat(r.value),
        label: 'Work Orders'
      }))
    }
  }

  /**
   * Generate AI-powered insights based on fleet data
   */
  async getAIInsights(tenantId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    try {
      // Get recent data for AI analysis
      const kpis = await this.getKPIs(tenantId)

      // Get vehicles with high maintenance costs
      const highMaintenanceVehicles = await pool.query(`
        SELECT
          v.vin,
          v.make,
          v.model,
          SUM(wo.total_cost) as total_cost,
          COUNT(wo.id) as work_order_count
        FROM vehicles v
        LEFT JOIN work_orders wo ON v.id = wo.vehicle_id
        WHERE v.tenant_id = $1
          AND wo.actual_end >= NOW() - INTERVAL '90 days'
        GROUP BY v.id, v.vin, v.make, v.model
        HAVING SUM(wo.total_cost) > 5000
        ORDER BY total_cost DESC
        LIMIT 5
      `, [tenantId])

      // Get overdue maintenance
      const overdueMaintenance = await pool.query(`
        SELECT
          v.vin,
          v.make,
          v.model,
          ms.service_type,
          ms.next_service_due_date,
          (CURRENT_DATE - ms.next_service_due_date) as days_overdue
        FROM maintenance_schedules ms
        JOIN vehicles v ON ms.vehicle_id = v.id
        WHERE v.tenant_id = $1
          AND ms.is_active = true
          AND ms.next_service_due_date < CURRENT_DATE
        ORDER BY days_overdue DESC
        LIMIT 5
      `, [tenantId])

      // Get recent safety incidents
      const recentIncidents = await pool.query(`
        SELECT
          v.vin,
          v.make,
          v.model,
          COUNT(*) as incident_count
        FROM safety_incidents si
        JOIN vehicles v ON si.vehicle_id = v.id
        WHERE si.tenant_id = $1
          AND si.incident_date >= NOW() - INTERVAL '30 days'
        GROUP BY v.id, v.vin, v.make, v.model
        HAVING COUNT(*) > 1
        ORDER BY incident_count DESC
        LIMIT 3
      `, [tenantId])

      // Generate high maintenance insights
      for (const vehicle of highMaintenanceVehicles.rows) {
        insights.push({
          id: `high-maint-${vehicle.vin}`,
          type: 'warning',
          title: 'High Maintenance Costs Detected',
          message: `${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin}) has incurred $${parseFloat(vehicle.total_cost).toFixed(2)} in maintenance costs over the last 90 days with ${vehicle.work_order_count} work orders. Consider replacement evaluation.`,
          confidence: 0.85,
          actionable: true,
          relatedVehicle: vehicle.vin,
          timestamp: new Date().toISOString()
        })
      }

      // Generate overdue maintenance insights
      for (const maint of overdueMaintenance.rows) {
        const severity = parseInt(maint.days_overdue) > 30 ? 'critical' : 'warning'
        insights.push({
          id: `overdue-${maint.vin}`,
          type: severity,
          title: 'Overdue Maintenance Alert',
          message: `${maint.make} ${maint.model} (VIN: ${maint.vin}) has ${maint.service_type} overdue by ${maint.days_overdue} days. Schedule maintenance immediately to prevent breakdowns.`,
          confidence: 0.95,
          actionable: true,
          relatedVehicle: maint.vin,
          timestamp: new Date().toISOString()
        })
      }

      // Generate incident pattern insights
      for (const incident of recentIncidents.rows) {
        insights.push({
          id: `incident-pattern-${incident.vin}`,
          type: 'critical',
          title: 'Recurring Incident Pattern',
          message: `${incident.make} ${incident.model} (VIN: ${incident.vin}) has been involved in ${incident.incident_count} incidents in the past 30 days. Investigate driver behavior and vehicle condition.`,
          confidence: 0.90,
          actionable: true,
          relatedVehicle: incident.vin,
          timestamp: new Date().toISOString()
        })
      }

      // Generate utilization insights
      if (kpis.fleetUtilizationRate < 60) {
        insights.push({
          id: 'low-utilization',
          type: 'recommendation',
          title: 'Low Fleet Utilization',
          message: `Fleet utilization is at ${kpis.fleetUtilizationRate.toFixed(1)}%, which is below optimal levels. Consider reducing fleet size or increasing route assignments.`,
          confidence: 0.75,
          actionable: true,
          timestamp: new Date().toISOString()
        })
      }

      // Generate efficiency insights
      if (kpis.avgFuelEfficiency > 0 && kpis.avgFuelEfficiency < 15) {
        insights.push({
          id: 'low-fuel-efficiency',
          type: 'recommendation',
          title: 'Below Average Fuel Efficiency',
          message: `Current fleet fuel efficiency is ${kpis.avgFuelEfficiency.toFixed(1)} MPG. Driver training on eco-driving techniques could improve efficiency by 10-15%.`,
          confidence: 0.70,
          actionable: true,
          timestamp: new Date().toISOString()
        })
      }

      // Use OpenAI for advanced pattern detection if API key is available
      if (process.env.OPENAI_API_KEY && insights.length > 0) {
        try {
          const aiAnalysis = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{
              role: 'system',
              content: 'You are a fleet management AI analyst. Analyze the provided fleet data and generate one concise strategic insight.'
            }, {
              role: 'user',
              content: `Fleet KPIs: ${JSON.stringify(kpis)}. Current insights detected: ${insights.length}. What is the most important strategic recommendation?`
            }],
            max_tokens: 150,
            temperature: 0.7
          })

          const aiInsight = aiAnalysis.choices[0]?.message?.content
          if (aiInsight) {
            insights.push({
              id: 'ai-strategic',
              type: 'insight',
              title: 'AI Strategic Recommendation',
              message: aiInsight,
              confidence: 0.80,
              actionable: true,
              timestamp: new Date().toISOString()
            })
          }
        } catch (aiError) {
          console.error('OpenAI insight generation failed:', aiError)
        }
      }

      // Sort by confidence and severity
      return insights.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, recommendation: 2, insight: 3 }
        const severityDiff = severityOrder[a.type] - severityOrder[b.type]
        if (severityDiff !== 0) return severityDiff
        return b.confidence - a.confidence
      })

    } catch (error) {
      console.error('Error generating AI insights:', error)
      return insights
    }
  }

  /**
   * Get alerts summary
   */
  async getAlertsSummary(tenantId: string): Promise<AlertSummary> {
    const alerts = await pool.query(`
      SELECT
        severity,
        COUNT(*) as count
      FROM policy_violations
      WHERE tenant_id = $1
        AND acknowledged = false
        AND violation_time >= NOW() - INTERVAL '7 days'
      GROUP BY severity
    `, [tenantId])

    const recentAlerts = await pool.query(`
      SELECT
        pv.id,
        pv.severity,
        pv.violation_time as timestamp,
        v.vin as vehicle_id,
        p.policy_name as message
      FROM policy_violations pv
      LEFT JOIN vehicles v ON pv.vehicle_id = v.id
      LEFT JOIN policies p ON pv.policy_id = p.id
      WHERE pv.tenant_id = $1
        AND pv.acknowledged = false
      ORDER BY pv.violation_time DESC
      LIMIT 10
    `, [tenantId])

    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }

    for (const alert of alerts.rows) {
      summary[alert.severity as keyof typeof summary] = parseInt(alert.count)
    }

    return {
      ...summary,
      recentAlerts: recentAlerts.rows.map(r => ({
        id: r.id,
        severity: r.severity,
        message: r.message || 'Policy violation',
        vehicleId: r.vehicle_id,
        timestamp: r.timestamp
      }))
    }
  }

  /**
   * Calculate overall fleet health score
   */
  async getFleetHealth(tenantId: string): Promise<FleetHealthScore> {
    const kpis = await this.getKPIs(tenantId)

    // Mechanical health (based on maintenance status)
    const mechanicalScore = Math.min(100, 100 - (kpis.maintenanceVehicles / kpis.totalVehicles) * 100)

    // Safety score (based on incidents and driver scores)
    const safetyScore = Math.min(100, kpis.avgDriverSafetyScore - (kpis.incidentRatePer100kMiles * 2))

    // Compliance score (based on overdue maintenance)
    const complianceData = await pool.query(`
      SELECT COUNT(*) as overdue_count
      FROM maintenance_schedules
      WHERE tenant_id = $1
        AND is_active = true
        AND next_service_due_date < CURRENT_DATE
    `, [tenantId])
    const overdueCount = parseInt(complianceData.rows[0]?.overdue_count || '0')
    const complianceScore = Math.max(0, 100 - (overdueCount * 5))

    // Efficiency score (based on utilization and fuel efficiency)
    const efficiencyScore = (kpis.fleetUtilizationRate + kpis.assetUtilizationPercentage) / 2

    // Calculate weighted overall score
    const breakdown = [
      { category: 'Mechanical', score: mechanicalScore, weight: 0.30 },
      { category: 'Safety', score: safetyScore, weight: 0.35 },
      { category: 'Compliance', score: complianceScore, weight: 0.20 },
      { category: 'Efficiency', score: efficiencyScore, weight: 0.15 }
    ]

    const overall = breakdown.reduce((sum, item) => sum + (item.score * item.weight), 0)

    return {
      overall: parseFloat(overall.toFixed(2)),
      mechanical: parseFloat(mechanicalScore.toFixed(2)),
      safety: parseFloat(safetyScore.toFixed(2)),
      compliance: parseFloat(complianceScore.toFixed(2)),
      efficiency: parseFloat(efficiencyScore.toFixed(2)),
      breakdown
    }
  }

  /**
   * Get cost analysis and breakdown
   */
  async getCostAnalysis(tenantId: string): Promise<CostAnalysis> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Get fuel costs
    const fuelCosts = await pool.query(`
      SELECT COALESCE(SUM(total_cost), 0) as total
      FROM fuel_transactions
      WHERE tenant_id = $1
        AND transaction_date >= $2
    `, [tenantId, startOfMonth])

    // Get maintenance costs
    const maintenanceCosts = await pool.query(`
      SELECT COALESCE(SUM(total_cost), 0) as total
      FROM work_orders
      WHERE tenant_id = $1
        AND actual_end >= $2
        AND status = 'completed'
    `, [tenantId, startOfMonth])

    // Get incident costs
    const incidentCosts = await pool.query(`
      SELECT COALESCE(SUM(vehicle_damage_cost + property_damage_cost), 0) as total
      FROM safety_incidents
      WHERE tenant_id = $1
        AND incident_date >= $2
    `, [tenantId, startOfMonth])

    const fuelTotal = parseFloat(fuelCosts.rows[0]?.total || '0')
    const maintTotal = parseFloat(maintenanceCosts.rows[0]?.total || '0')
    const incidentTotal = parseFloat(incidentCosts.rows[0]?.total || '0')
    const totalCosts = fuelTotal + maintTotal + incidentTotal

    // Get cost trends for the past 6 months
    const costTrends = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') as date,
        SUM(total_cost) as value
      FROM fuel_transactions
      WHERE tenant_id = $1
        AND transaction_date >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY date ASC
    `, [tenantId])

    const kpis = await this.getKPIs(tenantId)
    const costPerMile = kpis.totalMileageThisMonth > 0
      ? totalCosts / kpis.totalMileageThisMonth
      : 0
    const costPerVehicle = kpis.totalVehicles > 0
      ? totalCosts / kpis.totalVehicles
      : 0

    return {
      totalCosts,
      fuelCosts: fuelTotal,
      maintenanceCosts: maintTotal,
      incidentCosts: incidentTotal,
      costPerMile,
      costPerVehicle,
      breakdown: [
        {
          category: 'Fuel',
          amount: fuelTotal,
          percentage: totalCosts > 0 ? (fuelTotal / totalCosts) * 100 : 0
        },
        {
          category: 'Maintenance',
          amount: maintTotal,
          percentage: totalCosts > 0 ? (maintTotal / totalCosts) * 100 : 0
        },
        {
          category: 'Incidents',
          amount: incidentTotal,
          percentage: totalCosts > 0 ? (incidentTotal / totalCosts) * 100 : 0
        }
      ],
      trends: costTrends.rows.map(r => ({
        date: r.date,
        value: parseFloat(r.value),
        label: 'Monthly Costs'
      }))
    }
  }
}

export default new ExecutiveDashboardService()
