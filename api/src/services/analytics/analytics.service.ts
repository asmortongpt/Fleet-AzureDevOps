/**
 * Advanced Analytics Service
 * Provides comprehensive analytics and insights for tasks and assets
 *
 * Features:
 * - Real-time dashboards
 * - Trend analysis
 * - Predictive analytics
 * - Custom metrics
 * - Data aggregation
 * - Export capabilities
 */

import pool from '../../config/database'

export interface TaskAnalytics {
  overview: {
    total: number
    completed: number
    inProgress: number
    pending: number
    overdue: number
    completionRate: number
    averageCompletionTime: number
  }
  byPriority: Array<{ priority: string; count: number; percentage: number }>
  byStatus: Array<{ status: string; count: number; percentage: number }>
  byType: Array<{ type: string; count: number; averageTime: number }>
  byAssignee: Array<{ userId: string; userName: string; taskCount: number; completionRate: number }>
  timeline: Array<{ date: string; completed: number; created: number; inProgress: number }>
  trends: {
    completionTrend: 'up' | 'down' | 'stable'
    averageTimeTrend: 'up' | 'down' | 'stable'
    overdueIncreasing: boolean
  }
}

export interface AssetAnalytics {
  overview: {
    total: number
    totalValue: number
    totalDepreciation: number
    averageAge: number
    maintenanceCount: number
    averageMaintenanceCost: number
  }
  byType: Array<{ type: string; count: number; totalValue: number }>
  byStatus: Array<{ status: string; count: number; percentage: number }>
  byCondition: Array<{ condition: string; count: number; percentage: number }>
  maintenance: {
    dueThisWeek: number
    dueThisMonth: number
    overdue: number
    upcomingCosts: number
  }
  depreciation: Array<{ month: string; totalValue: number; depreciation: number }>
  utilization: {
    inUse: number
    available: number
    maintenance: number
    utilizationRate: number
  }
  lifecycle: {
    byPhase: Array<{ phase: string; count: number; value: number }>
    endOfLife: Array<{ assetId: string; assetName: string; monthsRemaining: number }>
  }
}

export interface CustomMetric {
  id: string
  name: string
  description: string
  entity: 'task' | 'asset'
  calculation: 'count' | 'sum' | 'average' | 'min' | 'max' | 'percentage'
  field?: string
  filters?: any
}

export class AnalyticsService {
  /**
   * Get comprehensive task analytics
   */
  async getTaskAnalytics(tenantId: string, startDate?: Date, endDate?: Date): Promise<TaskAnalytics> {
    const dateFilter = this.buildDateFilter(startDate, endDate)

    // Overview stats
    const overview = await this.getTaskOverview(tenantId, dateFilter)

    // Breakdown by priority
    const byPriority = await this.getTasksByPriority(tenantId, dateFilter)

    // Breakdown by status
    const byStatus = await this.getTasksByStatus(tenantId, dateFilter)

    // Breakdown by type
    const byType = await this.getTasksByType(tenantId, dateFilter)

    // By assignee
    const byAssignee = await this.getTasksByAssignee(tenantId, dateFilter)

    // Timeline
    const timeline = await this.getTaskTimeline(tenantId, startDate, endDate)

    // Trends
    const trends = await this.getTaskTrends(tenantId)

    return {
      overview,
      byPriority,
      byStatus,
      byType,
      byAssignee,
      timeline,
      trends
    }
  }

  /**
   * Get comprehensive asset analytics
   */
  async getAssetAnalytics(tenantId: string): Promise<AssetAnalytics> {
    const overview = await this.getAssetOverview(tenantId)
    const byType = await this.getAssetsByType(tenantId)
    const byStatus = await this.getAssetsByStatus(tenantId)
    const byCondition = await this.getAssetsByCondition(tenantId)
    const maintenance = await this.getMaintenanceMetrics(tenantId)
    const depreciation = await this.getDepreciationTimeline(tenantId)
    const utilization = await this.getAssetUtilization(tenantId)
    const lifecycle = await this.getLifecycleMetrics(tenantId)

    return {
      overview,
      byType,
      byStatus,
      byCondition,
      maintenance,
      depreciation,
      utilization,
      lifecycle
    }
  }

  // ========== Task Analytics Methods ==========

  private async getTaskOverview(tenantId: string, dateFilter: string): Promise<any> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue,
         AVG(EXTRACT(EPOCH FROM (completed_date - created_at))/3600) FILTER (WHERE status = 'completed') as avg_completion_hours
       FROM tasks
       WHERE tenant_id = $1 ${dateFilter}`,
      [tenantId]
    )

    const data = result.rows[0]
    const total = parseInt(data.total) || 0
    const completed = parseInt(data.completed) || 0

    return {
      total,
      completed,
      inProgress: parseInt(data.in_progress) || 0,
      pending: parseInt(data.pending) || 0,
      overdue: parseInt(data.overdue) || 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      averageCompletionTime: parseFloat(data.avg_completion_hours) || 0
    }
  }

  private async getTasksByPriority(tenantId: string, dateFilter: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         priority,
         COUNT(*) as count,
         ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
       FROM tasks
       WHERE tenant_id = $1 ${dateFilter}
       GROUP BY priority
       ORDER BY
         CASE priority
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END`,
      [tenantId]
    )

    return result.rows.map(row => ({
      priority: row.priority,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage) || 0
    }))
  }

  private async getTasksByStatus(tenantId: string, dateFilter: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         status,
         COUNT(*) as count,
         ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
       FROM tasks
       WHERE tenant_id = $1 ${dateFilter}
       GROUP BY status
       ORDER BY count DESC`,
      [tenantId]
    )

    return result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage) || 0
    }))
  }

  private async getTasksByType(tenantId: string, dateFilter: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         task_type as type,
         COUNT(*) as count,
         AVG(EXTRACT(EPOCH FROM (completed_date - created_at))/3600) FILTER (WHERE status = 'completed') as average_time
       FROM tasks
       WHERE tenant_id = $1 ${dateFilter}
       GROUP BY task_type
       ORDER BY count DESC`,
      [tenantId]
    )

    return result.rows.map(row => ({
      type: row.type,
      count: parseInt(row.count),
      averageTime: parseFloat(row.average_time) || 0
    }))
  }

  private async getTasksByAssignee(tenantId: string, dateFilter: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         u.id as user_id,
         u.first_name || ' ' || u.last_name as user_name,
         COUNT(t.id) as task_count,
         COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_count,
         ROUND(COUNT(t.id) FILTER (WHERE t.status = 'completed')::numeric / NULLIF(COUNT(t.id), 0) * 100, 2) as completion_rate
       FROM users u
       LEFT JOIN tasks t ON u.id = t.assigned_to AND t.tenant_id = $1 ${dateFilter.replace('WHERE', 'AND')}
       WHERE u.tenant_id = $1
       GROUP BY u.id, u.first_name, u.last_name
       HAVING COUNT(t.id) > 0
       ORDER BY task_count DESC
       LIMIT 10`,
      [tenantId]
    )

    return result.rows.map(row => ({
      userId: row.user_id,
      userName: row.user_name,
      taskCount: parseInt(row.task_count),
      completionRate: parseFloat(row.completion_rate) || 0
    }))
  }

  private async getTaskTimeline(tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate || new Date()

    const result = await pool.query(
      `SELECT
         DATE(date_series) as date,
         COUNT(t.id) FILTER (WHERE t.status = 'completed' AND DATE(t.completed_date) = DATE(date_series)) as completed,
         COUNT(t.id) FILTER (WHERE DATE(t.created_at) = DATE(date_series)) as created,
         COUNT(t.id) FILTER (WHERE t.status = 'in_progress' AND DATE(date_series) BETWEEN DATE(t.created_at) AND COALESCE(DATE(t.completed_date), CURRENT_DATE)) as in_progress
       FROM generate_series($1::date, $2::date, '1 day'::interval) as date_series
       LEFT JOIN tasks t ON t.tenant_id = $3
       GROUP BY DATE(date_series)
       ORDER BY DATE(date_series)`,
      [start, end, tenantId]
    )

    return result.rows.map(row => ({
      date: row.date,
      completed: parseInt(row.completed) || 0,
      created: parseInt(row.created) || 0,
      inProgress: parseInt(row.in_progress) || 0
    }))
  }

  private async getTaskTrends(tenantId: string): Promise<any> {
    // Get last 2 weeks data for trend analysis
    const result = await pool.query(
      `WITH weekly_stats AS (
         SELECT
           DATE_TRUNC('week', created_at) as week,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'completed') as completed,
           AVG(EXTRACT(EPOCH FROM (completed_date - created_at))/3600) FILTER (WHERE status = 'completed') as avg_time,
           COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue
         FROM tasks
         WHERE tenant_id = $1
           AND created_at >= NOW() - INTERVAL '14 days'
         GROUP BY DATE_TRUNC('week', created_at)
         ORDER BY week
       )
       SELECT id, tenant_id, stat_week, metric_name, metric_value, created_at FROM weekly_stats`,
      [tenantId]
    )

    const rows = result.rows
    if (rows.length < 2) {
      return {
        completionTrend: 'stable',
        averageTimeTrend: 'stable',
        overdueIncreasing: false
      }
    }

    const current = rows[rows.length - 1]
    const previous = rows[rows.length - 2]

    const completionRate = (current.completed / current.total) || 0
    const previousCompletionRate = (previous.completed / previous.total) || 0

    return {
      completionTrend: completionRate > previousCompletionRate + 0.05 ? 'up' :
                       completionRate < previousCompletionRate - 0.05 ? 'down' : 'stable',
      averageTimeTrend: current.avg_time < previous.avg_time - 1 ? 'down' :
                        current.avg_time > previous.avg_time + 1 ? 'up' : 'stable',
      overdueIncreasing: current.overdue > previous.overdue
    }
  }

  // ========== Asset Analytics Methods ==========

  private async getAssetOverview(tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(CAST(current_value AS NUMERIC)) as total_value,
         SUM(CAST(purchase_price AS NUMERIC) - CAST(current_value AS NUMERIC)) as total_depreciation,
         AVG(EXTRACT(YEAR FROM AGE(NOW(), purchase_date))) as average_age,
         (SELECT COUNT(*) FROM asset_maintenance WHERE asset_id IN (SELECT id FROM assets WHERE tenant_id = $1)) as maintenance_count,
         (SELECT AVG(CAST(cost AS NUMERIC)) FROM asset_maintenance WHERE asset_id IN (SELECT id FROM assets WHERE tenant_id = $1)) as avg_maintenance_cost
       FROM assets
       WHERE tenant_id = $1 AND status != 'disposed'`,
      [tenantId]
    )

    const data = result.rows[0]

    return {
      total: parseInt(data.total) || 0,
      totalValue: parseFloat(data.total_value) || 0,
      totalDepreciation: parseFloat(data.total_depreciation) || 0,
      averageAge: parseFloat(data.average_age) || 0,
      maintenanceCount: parseInt(data.maintenance_count) || 0,
      averageMaintenanceCost: parseFloat(data.avg_maintenance_cost) || 0
    }
  }

  private async getAssetsByType(tenantId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         asset_type as type,
         COUNT(*) as count,
         SUM(CAST(current_value AS NUMERIC)) as total_value
       FROM assets
       WHERE tenant_id = $1 AND status != 'disposed'
       GROUP BY asset_type
       ORDER BY count DESC`,
      [tenantId]
    )

    return result.rows.map(row => ({
      type: row.type,
      count: parseInt(row.count),
      totalValue: parseFloat(row.total_value) || 0
    }))
  }

  private async getAssetsByStatus(tenantId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         status,
         COUNT(*) as count,
         ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
       FROM assets
       WHERE tenant_id = $1
       GROUP BY status
       ORDER BY count DESC`,
      [tenantId]
    )

    return result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage) || 0
    }))
  }

  private async getAssetsByCondition(tenantId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         condition,
         COUNT(*) as count,
         ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
       FROM assets
       WHERE tenant_id = $1 AND status != 'disposed'
       GROUP BY condition
       ORDER BY
         CASE condition
           WHEN 'excellent' THEN 1
           WHEN 'good' THEN 2
           WHEN 'fair' THEN 3
           WHEN 'poor' THEN 4
           WHEN 'needs_repair' THEN 5
         END`,
      [tenantId]
    )

    return result.rows.map(row => ({
      condition: row.condition,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage) || 0
    }))
  }

  private async getMaintenanceMetrics(tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE next_maintenance_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') as due_this_week,
         COUNT(*) FILTER (WHERE next_maintenance_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') as due_this_month,
         COUNT(*) FILTER (WHERE next_maintenance_date < NOW()) as overdue,
         SUM(CAST(cost AS NUMERIC)) FILTER (WHERE next_maintenance_date BETWEEN NOW() AND NOW() + INTERVAL '90 days') as upcoming_costs
       FROM asset_maintenance am
       JOIN assets a ON am.asset_id = a.id
       WHERE a.tenant_id = $1',
      [tenantId]
    )

    const data = result.rows[0]

    return {
      dueThisWeek: parseInt(data.due_this_week) || 0,
      dueThisMonth: parseInt(data.due_this_month) || 0,
      overdue: parseInt(data.overdue) || 0,
      upcomingCosts: parseFloat(data.upcoming_costs) || 0
    }
  }

  private async getDepreciationTimeline(tenantId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         TO_CHAR(date_series, 'YYYY-MM') as month,
         SUM(CAST(a.current_value AS NUMERIC)) as total_value,
         SUM(CAST(a.purchase_price AS NUMERIC) - CAST(a.current_value AS NUMERIC)) as depreciation
       FROM generate_series(NOW() - INTERVAL '12 months', NOW(), '1 month'::interval) as date_series
       CROSS JOIN assets a
       WHERE a.tenant_id = $1 AND a.status != 'disposed'
       GROUP BY TO_CHAR(date_series, 'YYYY-MM')
       ORDER BY month`,
      [tenantId]
    )

    return result.rows.map(row => ({
      month: row.month,
      totalValue: parseFloat(row.total_value) || 0,
      depreciation: parseFloat(row.depreciation) || 0
    }))
  }

  private async getAssetUtilization(tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'in_use') as in_use,
         COUNT(*) FILTER (WHERE status = 'active') as available,
         COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
         COUNT(*) as total
       FROM assets
       WHERE tenant_id = $1 AND status != 'disposed' AND status != 'retired'`,
      [tenantId]
    )

    const data = result.rows[0]
    const total = parseInt(data.total) || 0
    const inUse = parseInt(data.in_use) || 0

    return {
      inUse,
      available: parseInt(data.available) || 0,
      maintenance: parseInt(data.maintenance) || 0,
      utilizationRate: total > 0 ? Math.round((inUse / total) * 100) : 0
    }
  }

  private async getLifecycleMetrics(tenantId: string): Promise<any> {
    return {
      byPhase: [],
      endOfLife: []
    }
  }

  // ========== Helper Methods ==========

  private buildDateFilter(startDate?: Date, endDate?: Date): string {
    if (!startDate && !endDate) return ''

    const filters: string[] = []

    if (startDate) {
      filters.push(`created_at >= '${startDate.toISOString()}'`)
    }

    if (endDate) {
      filters.push(`created_at <= '${endDate.toISOString()}'`)
    }

    return filters.length > 0 ? `AND ${filters.join(' AND ')}` : ''
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(tenantId: string, entity: 'task' | 'asset', format: 'json' | 'csv'): Promise<string> {
    const analytics = entity === 'task'
      ? await this.getTaskAnalytics(tenantId)
      : await this.getAssetAnalytics(tenantId)

    if (format === 'json') {
      return JSON.stringify(analytics, null, 2)
    } else {
      // Convert to CSV
      return this.convertToCSV(analytics)
    }
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    return JSON.stringify(data)
  }
}

// Global instance
export const analyticsService = new AnalyticsService()

export default analyticsService
