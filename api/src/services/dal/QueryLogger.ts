/**
 * Query Logger for DAL
 * Provides structured logging for database queries with performance monitoring
 */

export interface QueryLog {
  query: string
  params?: any[]
  duration?: number
  rowCount?: number
  timestamp: Date
  success: boolean
  error?: any
}

export class QueryLogger {
  private logs: QueryLog[] = []
  private maxLogs: number = 1000
  private enabled: boolean = true

  constructor(options?: { enabled?: boolean; maxLogs?: number }) {
    if (options?.enabled !== undefined) {
      this.enabled = options.enabled
    }
    if (options?.maxLogs !== undefined) {
      this.maxLogs = options.maxLogs
    }

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development' || process.env.DB_LOG_QUERIES === 'true') {
      this.enabled = true
    }
  }

  /**
   * Log a query execution
   */
  logQuery(query: string, params?: any[]): void {
    if (!this.enabled) return

    const log: QueryLog = {
      query: this.sanitizeQuery(query),
      params: this.sanitizeParams(params),
      timestamp: new Date(),
      success: true
    }

    this.addLog(log)

    if (process.env.DB_LOG_QUERIES === 'true') {
      console.log('[DB Query]', {
        query: log.query,
        params: log.params,
        timestamp: log.timestamp.toISOString()
      })
    }
  }

  /**
   * Log a successful query execution
   */
  logSuccess(query: string, params: any[] | undefined, duration: number, rowCount: number): void {
    if (!this.enabled) return

    const log: QueryLog = {
      query: this.sanitizeQuery(query),
      params: this.sanitizeParams(params),
      duration,
      rowCount,
      timestamp: new Date(),
      success: true
    }

    this.addLog(log)

    // Warn on slow queries (> 1 second)
    if (duration > 1000) {
      console.warn('[DB Slow Query]', {
        query: log.query,
        duration: `${duration}ms`,
        rowCount
      })
    }

    if (process.env.DB_LOG_QUERIES === 'true') {
      console.log('[DB Success]', {
        query: log.query,
        duration: `${duration}ms`,
        rowCount
      })
    }
  }

  /**
   * Log a failed query execution
   */
  logError(query: string, params: any[] | undefined, duration: number, error: any): void {
    const log: QueryLog = {
      query: this.sanitizeQuery(query),
      params: this.sanitizeParams(params),
      duration,
      timestamp: new Date(),
      success: false,
      error: {
        message: error.message,
        code: error.code,
        detail: error.detail
      }
    }

    this.addLog(log)

    console.error('[DB Error]', {
      query: log.query,
      params: log.params,
      duration: `${duration}ms`,
      error: log.error
    })
  }

  /**
   * Add a log entry and maintain max size
   */
  private addLog(log: QueryLog): void {
    this.logs.push(log)

    // Keep only the last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  /**
   * Sanitize query for logging (remove extra whitespace)
   */
  private sanitizeQuery(query: string): string {
    return query.replace(/\s+/g, ' ').trim()
  }

  /**
   * Sanitize params for logging (hide sensitive data)
   */
  private sanitizeParams(params?: any[]): any[] | undefined {
    if (!params) return undefined

    return params.map(param => {
      if (typeof param === 'string') {
        // Hide potential passwords, tokens, etc.
        if (param.length > 50) {
          return `${param.substring(0, 20)}...[${param.length} chars]`
        }
      }
      return param
    })
  }

  /**
   * Get recent logs
   */
  getLogs(limit?: number): QueryLog[] {
    if (limit) {
      return this.logs.slice(-limit)
    }
    return [...this.logs]
  }

  /**
   * Get query statistics
   */
  getStats(): {
    totalQueries: number
    successfulQueries: number
    failedQueries: number
    averageDuration: number
    slowQueries: number
  } {
    const stats = {
      totalQueries: this.logs.length,
      successfulQueries: 0,
      failedQueries: 0,
      averageDuration: 0,
      slowQueries: 0
    }

    let totalDuration = 0
    let queriesWithDuration = 0

    this.logs.forEach(log => {
      if (log.success) {
        stats.successfulQueries++
      } else {
        stats.failedQueries++
      }

      if (log.duration !== undefined) {
        totalDuration += log.duration
        queriesWithDuration++

        if (log.duration > 1000) {
          stats.slowQueries++
        }
      }
    })

    stats.averageDuration = queriesWithDuration > 0 ? totalDuration / queriesWithDuration : 0

    return stats
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

// Singleton instance for global query logging
export const globalQueryLogger = new QueryLogger()
