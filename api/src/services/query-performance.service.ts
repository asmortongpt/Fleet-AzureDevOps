/**
 * Query Performance Monitoring Service
 *
 * This service monitors and analyzes database query performance
 * to identify slow queries, optimization opportunities, and potential issues.
 */

import { Pool, QueryResult } from 'pg'
import { EventEmitter } from 'events'

interface QueryMetrics {
  query: string
  params?: any[]
  duration: number
  timestamp: Date
  success: boolean
  error?: string
  rowCount?: number
  poolType?: string
}

interface QueryStats {
  count: number
  totalDuration: number
  avgDuration: number
  minDuration: number
  maxDuration: number
  errors: number
  lastExecuted: Date
}

export class QueryPerformanceService extends EventEmitter {
  private queryMetrics: QueryMetrics[] = []
  private slowQueryThreshold: number = 1000 // 1 second
  private maxMetricsHistory: number = 10000
  private enabled: boolean = true

  constructor(options: { slowQueryThreshold?: number; maxMetricsHistory?: number } = {}) {
    super()

    if (options.slowQueryThreshold) {
      this.slowQueryThreshold = options.slowQueryThreshold
    }

    if (options.maxMetricsHistory) {
      this.maxMetricsHistory = options.maxMetricsHistory
    }

    console.log(`✅ Query Performance Monitoring initialized (slow query threshold: ${this.slowQueryThreshold}ms)`)
  }

  /**
   * Wrap a pool query with performance monitoring
   */
  wrapPoolQuery(pool: Pool, poolType: string = 'default'): Pool {
    const originalQuery = pool.query.bind(pool)

    pool.query = (async (...args: any[]): Promise<QueryResult<any>> => {
      const startTime = Date.now()
      let query: string = ''
      let params: any[] | undefined

      // Parse arguments (query can be string or QueryConfig)
      if (typeof args[0] === 'string') {
        query = args[0]
        params = args[1]
      } else if (typeof args[0] === 'object') {
        query = args[0].text
        params = args[0].values
      }

      try {
        const result = await originalQuery(...args)
        const duration = Date.now() - startTime

        // Record metrics
        this.recordQuery({
          query: this.sanitizeQuery(query),
          params,
          duration,
          timestamp: new Date(),
          success: true,
          rowCount: result.rowCount || 0,
          poolType
        })

        // Check for slow query
        if (duration > this.slowQueryThreshold) {
          this.emit('slowQuery', {
            query: this.sanitizeQuery(query),
            duration,
            poolType
          })

          console.warn(`🐌 Slow query detected (${duration}ms, ${poolType}):`, this.sanitizeQuery(query).substring(0, 100))
        }

        return result
      } catch (error: any) {
        const duration = Date.now() - startTime

        // Record error
        this.recordQuery({
          query: this.sanitizeQuery(query),
          params,
          duration,
          timestamp: new Date(),
          success: false,
          error: error.message,
          poolType
        })

        throw error
      }
    }) as any

    return pool
  }

  /**
   * Record query metrics
   */
  private recordQuery(metrics: QueryMetrics): void {
    if (!this.enabled) {
      return
    }

    this.queryMetrics.push(metrics)

    // Trim metrics if exceeds max history
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory)
    }

    // Emit event
    this.emit('queryExecuted', metrics)
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: string): string {
    // Remove extra whitespace
    let sanitized = query.replace(/\s+/g, ' ').trim()

    // Truncate long queries
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + '...'
    }

    return sanitized
  }

  /**
   * Get query statistics
   */
  getQueryStats(): Record<string, QueryStats> {
    const stats: Record<string, QueryStats> = {}

    for (const metric of this.queryMetrics) {
      const key = this.sanitizeQuery(metric.query)

      if (!stats[key]) {
        stats[key] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          minDuration: Number.MAX_VALUE,
          maxDuration: 0,
          errors: 0,
          lastExecuted: metric.timestamp
        }
      }

      const stat = stats[key]
      stat.count++
      stat.totalDuration += metric.duration
      stat.minDuration = Math.min(stat.minDuration, metric.duration)
      stat.maxDuration = Math.max(stat.maxDuration, metric.duration)
      stat.lastExecuted = metric.timestamp
      stat.avgDuration = stat.totalDuration / stat.count

      if (!metric.success) {
        stat.errors++
      }
    }

    return stats
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit: number = 20): QueryMetrics[] {
    return this.queryMetrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Get recent queries
   */
  getRecentQueries(limit: number = 50): QueryMetrics[] {
    return this.queryMetrics.slice(-limit).reverse()
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    const stats = this.getQueryStats()
    const queries = Object.entries(stats)

    const totalQueries = this.queryMetrics.length
    const totalErrors = this.queryMetrics.filter(m => !m.success).length
    const slowQueries = this.queryMetrics.filter(m => m.duration > this.slowQueryThreshold).length

    // Calculate percentiles
    const durations = this.queryMetrics.map(m => m.duration).sort((a, b) => a - b)
    const p50 = durations[Math.floor(durations.length * 0.5)] || 0
    const p95 = durations[Math.floor(durations.length * 0.95)] || 0
    const p99 = durations[Math.floor(durations.length * 0.99)] || 0

    // Top slowest queries
    const topSlow = queries
      .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
      .slice(0, 10)
      .map(([query, stat]) => ({
        query: query.substring(0, 100),
        avgDuration: Math.round(stat.avgDuration),
        maxDuration: stat.maxDuration,
        count: stat.count
      }))

    // Most frequently executed
    const topFrequent = queries
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([query, stat]) => ({
        query: query.substring(0, 100),
        count: stat.count,
        avgDuration: Math.round(stat.avgDuration)
      }))

    return {
      summary: {
        totalQueries,
        uniqueQueries: Object.keys(stats).length,
        totalErrors,
        slowQueries,
        errorRate: (totalErrors / Math.max(totalQueries, 1) * 100).toFixed(2) + '%',
        slowQueryRate: (slowQueries / Math.max(totalQueries, 1) * 100).toFixed(2) + '%'
      },
      performance: {
        p50,
        p95,
        p99,
        avgDuration: Math.round(durations.reduce((sum, d) => sum + d, 0) / Math.max(durations.length, 1)),
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations)
      },
      topSlowQueries: topSlow,
      topFrequentQueries: topFrequent,
      config: {
        slowQueryThreshold: this.slowQueryThreshold,
        maxMetricsHistory: this.maxMetricsHistory,
        enabled: this.enabled
      }
    }
  }

  /**
   * Analyze query plan for a specific query
   */
  async analyzeQueryPlan(pool: Pool, query: string, params?: any[]): Promise<any> {
    try {
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`
      const result = await pool.query(explainQuery, params)

      return {
        success: true,
        plan: result.rows[0]['QUERY PLAN'],
        analysis: this.extractPlanInsights(result.rows[0]['QUERY PLAN'])
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Extract insights from query plan
   */
  private extractPlanInsights(plan: any[]): any {
    const insights: any = {
      warnings: [],
      suggestions: []
    }

    const planObj = plan[0]?.Plan || {}

    // Check for sequential scans
    if (this.containsSeqScan(planObj)) {
      insights.warnings.push('Sequential scan detected - consider adding an index')
      insights.suggestions.push('Review WHERE clauses and add appropriate indexes')
    }

    // Check for high cost
    if (planObj['Total Cost'] > 1000) {
      insights.warnings.push('High query cost detected')
      insights.suggestions.push('Consider optimizing joins or adding indexes')
    }

    // Check for large row estimates
    if (planObj['Plan Rows'] > 10000) {
      insights.warnings.push('Large result set - consider adding pagination')
      insights.suggestions.push('Use LIMIT and OFFSET for pagination')
    }

    return insights
  }

  /**
   * Check if plan contains sequential scan
   */
  private containsSeqScan(plan: any): boolean {
    if (plan['Node Type'] === 'Seq Scan') {
      return true
    }

    if (plan.Plans && Array.isArray(plan.Plans)) {
      return plan.Plans.some((p: any) => this.containsSeqScan(p))
    }

    return false
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.queryMetrics = []
    console.log('Query metrics cleared')
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    console.log(`Query performance monitoring ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Get metrics for export
   */
  exportMetrics(): QueryMetrics[] {
    return [...this.queryMetrics]
  }
}

// Singleton instance
export const queryPerformanceService = new QueryPerformanceService({
  slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '1000'),
  maxMetricsHistory: parseInt(process.env.QUERY_METRICS_HISTORY || '10000')
})

export default queryPerformanceService
