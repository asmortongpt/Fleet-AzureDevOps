/**
 * Query Performance Monitoring
 *
 * Monitors all database queries, tracks performance metrics, detects slow queries,
 * and integrates with OpenTelemetry and Application Insights
 */

import { Pool, QueryResult, PoolClient } from 'pg';
import { tracer, traceAsync } from '../config/telemetry';
import { SpanStatusCode, trace, context as otelContext, Span } from '@opentelemetry/api';
import * as appInsights from 'applicationinsights';

// Configuration
const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '500');
const LOG_ALL_QUERIES = process.env.LOG_ALL_QUERIES === 'true';
const DETECT_N_PLUS_ONE = process.env.DETECT_N_PLUS_ONE !== 'false'; // Default: true

/**
 * Query execution context
 */
interface QueryContext {
  query: string;
  params?: any[];
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: Error;
  rowCount?: number;
  stackTrace?: string;
}

/**
 * Query statistics
 */
interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  errorQueries: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
}

/**
 * N+1 Query Detection
 */
class NPlusOneDetector {
  private queryPatterns: Map<string, number> = new Map();
  private resetInterval: NodeJS.Timeout;
  private detectionWindow = 1000; // 1 second window

  constructor() {
    // Reset detection map every second
    this.resetInterval = setInterval(() => {
      this.queryPatterns.clear();
    }, this.detectionWindow);
  }

  /**
   * Normalize query for pattern matching
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\$\d+/g, '?') // Replace $1, $2 with ?
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .replace(/\d+/g, 'N')    // Replace numbers with N
      .trim()
      .toLowerCase();
  }

  /**
   * Check if query pattern indicates N+1
   */
  checkQuery(query: string): boolean {
    const normalized = this.normalizeQuery(query);
    const count = (this.queryPatterns.get(normalized) || 0) + 1;
    this.queryPatterns.set(normalized, count);

    // If same query pattern executed > 5 times in detection window, flag as potential N+1
    if (count > 5) {
      return true;
    }

    return false;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    clearInterval(this.resetInterval);
  }
}

/**
 * Query Performance Monitor
 */
export class QueryMonitor {
  private stats: Map<string, QueryStats> = new Map();
  private recentSlowQueries: QueryContext[] = [];
  private maxSlowQueriesHistory = 100;
  private nPlusOneDetector: NPlusOneDetector;

  constructor() {
    this.nPlusOneDetector = new NPlusOneDetector();

    // Export metrics every 60 seconds
    setInterval(() => {
      this.exportMetrics();
    }, 60000);
  }

  /**
   * Get current stack trace
   */
  private getStackTrace(): string {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    // Skip first 3 lines (Error, getStackTrace, and calling function)
    return lines.slice(3, 8).join('\n');
  }

  /**
   * Normalize query for statistics grouping
   */
  private normalizeQueryForStats(query: string): string {
    return query
      .replace(/\$\d+/g, '?')
      .replace(/\s+/g, ' ')
      .split(' ')
      .slice(0, 5) // First 5 words
      .join(' ');
  }

  /**
   * Log slow query
   */
  private logSlowQuery(ctx: QueryContext): void {
    const logData = {
      query: ctx.query,
      duration: ctx.duration,
      threshold: SLOW_QUERY_THRESHOLD_MS,
      params: ctx.params,
      rowCount: ctx.rowCount,
      stackTrace: ctx.stackTrace
    };

    console.warn('🐌 SLOW QUERY DETECTED:', logData);

    // Send to Application Insights
    if (appInsights.defaultClient) {
      appInsights.defaultClient.trackEvent({
        name: 'SlowQueryDetected',
        properties: {
          query: ctx.query,
          duration: ctx.duration?.toString() || '0',
          threshold: SLOW_QUERY_THRESHOLD_MS.toString(),
          rowCount: ctx.rowCount?.toString() || '0'
        },
        measurements: {
          duration: ctx.duration || 0,
          threshold: SLOW_QUERY_THRESHOLD_MS
        }
      });

      appInsights.defaultClient.trackMetric({
        name: 'Database.SlowQuery.Duration',
        value: ctx.duration || 0,
        properties: {
          query: this.normalizeQueryForStats(ctx.query)
        }
      });
    }

    // Keep in history
    this.recentSlowQueries.push(ctx);
    if (this.recentSlowQueries.length > this.maxSlowQueriesHistory) {
      this.recentSlowQueries.shift();
    }
  }

  /**
   * Log N+1 query warning
   */
  private logNPlusOne(ctx: QueryContext): void {
    console.warn('⚠️  POTENTIAL N+1 QUERY:', {
      query: ctx.query,
      duration: ctx.duration,
      stackTrace: ctx.stackTrace
    });

    if (appInsights.defaultClient) {
      appInsights.defaultClient.trackEvent({
        name: 'NPlusOneQueryDetected',
        properties: {
          query: ctx.query,
          duration: ctx.duration?.toString() || '0'
        }
      });
    }
  }

  /**
   * Update statistics
   */
  private updateStats(queryKey: string, duration: number): void {
    let stats = this.stats.get(queryKey);

    if (!stats) {
      stats = {
        totalQueries: 0,
        slowQueries: 0,
        errorQueries: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity
      };
      this.stats.set(queryKey, stats);
    }

    stats.totalQueries++;
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.minDuration = Math.min(stats.minDuration, duration);

    // Update running average
    stats.avgDuration = (stats.avgDuration * (stats.totalQueries - 1) + duration) / stats.totalQueries;

    if (duration >= SLOW_QUERY_THRESHOLD_MS) {
      stats.slowQueries++;
    }
  }

  /**
   * Monitor a query execution
   */
  async monitorQuery<T>(
    pool: Pool | PoolClient,
    query: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const ctx: QueryContext = {
      query,
      params,
      startTime: Date.now(),
      stackTrace: this.getStackTrace()
    };

    const queryKey = this.normalizeQueryForStats(query);
    const isNPlusOne = DETECT_N_PLUS_ONE && this.nPlusOneDetector.checkQuery(query);

    // Create OpenTelemetry span
    return tracer.startActiveSpan('database.query', async (span: Span) => {
      // Add attributes to span
      span.setAttribute('db.system', 'postgresql');
      span.setAttribute('db.statement', query);
      span.setAttribute('db.operation', this.extractOperation(query));

      if (params && params.length > 0) {
        span.setAttribute('db.params_count', params.length);
      }

      try {
        // Execute query
        const result = await pool.query<T>(query, params);

        ctx.endTime = Date.now();
        ctx.duration = ctx.endTime - ctx.startTime;
        ctx.rowCount = result.rowCount || 0;

        // Add result metrics to span
        span.setAttribute('db.row_count', ctx.rowCount);
        span.setAttribute('db.duration_ms', ctx.duration);
        span.setStatus({ code: SpanStatusCode.OK });

        // Update statistics
        this.updateStats(queryKey, ctx.duration);

        // Log if slow
        if (ctx.duration >= SLOW_QUERY_THRESHOLD_MS) {
          this.logSlowQuery(ctx);
          span.setAttribute('db.slow_query', true);
        }

        // Check for N+1
        if (isNPlusOne) {
          this.logNPlusOne(ctx);
          span.setAttribute('db.n_plus_one', true);
        }

        // Log all queries if configured
        if (LOG_ALL_QUERIES) {
          console.log('📊 Query executed:', {
            query: queryKey,
            duration: ctx.duration,
            rows: ctx.rowCount
          });
        }

        // Track metric in Application Insights
        if (appInsights.defaultClient) {
          appInsights.defaultClient.trackMetric({
            name: 'Database.Query.Duration',
            value: ctx.duration,
            properties: {
              operation: this.extractOperation(query),
              query: queryKey
            }
          });

          appInsights.defaultClient.trackDependency({
            name: queryKey,
            data: query,
            duration: ctx.duration,
            resultCode: 0,
            success: true,
            dependencyTypeName: 'postgresql'
          });
        }

        return result;
      } catch (error: any) {
        ctx.error = error;
        ctx.endTime = Date.now();
        ctx.duration = ctx.endTime - ctx.startTime;

        // Update error stats
        const stats = this.stats.get(queryKey);
        if (stats) {
          stats.errorQueries++;
        }

        // Record error in span
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });
        span.setAttribute('db.error', true);

        // Log error
        console.error('❌ Query error:', {
          query: ctx.query,
          duration: ctx.duration,
          error: error.message,
          stackTrace: ctx.stackTrace
        });

        // Track error in Application Insights
        if (appInsights.defaultClient) {
          appInsights.defaultClient.trackException({
            exception: error,
            properties: {
              query: ctx.query,
              duration: ctx.duration?.toString() || '0'
            }
          });

          appInsights.defaultClient.trackDependency({
            name: queryKey,
            data: query,
            duration: ctx.duration,
            resultCode: 1,
            success: false,
            dependencyTypeName: 'postgresql'
          });
        }

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Extract operation type from query
   */
  private extractOperation(query: string): string {
    const normalized = query.trim().toLowerCase();
    if (normalized.startsWith('select')) return 'SELECT';
    if (normalized.startsWith('insert')) return 'INSERT';
    if (normalized.startsWith('update')) return 'UPDATE';
    if (normalized.startsWith('delete')) return 'DELETE';
    if (normalized.startsWith('create')) return 'CREATE';
    if (normalized.startsWith('alter')) return 'ALTER';
    if (normalized.startsWith('drop')) return 'DROP';
    return 'OTHER';
  }

  /**
   * Get statistics
   */
  getStats(): Map<string, QueryStats> {
    return this.stats;
  }

  /**
   * Get recent slow queries
   */
  getRecentSlowQueries(limit: number = 10): QueryContext[] {
    return this.recentSlowQueries.slice(-limit);
  }

  /**
   * Get top slow queries
   */
  getTopSlowQueries(limit: number = 10): Array<{ query: string; stats: QueryStats }> {
    return Array.from(this.stats.entries())
      .filter(([_, stats]) => stats.slowQueries > 0)
      .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
      .slice(0, limit)
      .map(([query, stats]) => ({ query, stats }));
  }

  /**
   * Get query frequency
   */
  getQueryFrequency(limit: number = 10): Array<{ query: string; count: number }> {
    return Array.from(this.stats.entries())
      .sort((a, b) => b[1].totalQueries - a[1].totalQueries)
      .slice(0, limit)
      .map(([query, stats]) => ({ query, count: stats.totalQueries }));
  }

  /**
   * Get error rate
   */
  getErrorRate(): Array<{ query: string; errorRate: number; totalQueries: number }> {
    return Array.from(this.stats.entries())
      .filter(([_, stats]) => stats.errorQueries > 0)
      .map(([query, stats]) => ({
        query,
        errorRate: (stats.errorQueries / stats.totalQueries) * 100,
        totalQueries: stats.totalQueries
      }))
      .sort((a, b) => b.errorRate - a.errorRate);
  }

  /**
   * Export metrics to Application Insights
   */
  private exportMetrics(): void {
    if (!appInsights.defaultClient) return;

    const totalQueries = Array.from(this.stats.values()).reduce((sum, s) => sum + s.totalQueries, 0);
    const totalSlowQueries = Array.from(this.stats.values()).reduce((sum, s) => sum + s.slowQueries, 0);
    const totalErrors = Array.from(this.stats.values()).reduce((sum, s) => sum + s.errorQueries, 0);

    appInsights.defaultClient.trackMetric({
      name: 'Database.Queries.Total',
      value: totalQueries
    });

    appInsights.defaultClient.trackMetric({
      name: 'Database.Queries.Slow',
      value: totalSlowQueries
    });

    appInsights.defaultClient.trackMetric({
      name: 'Database.Queries.Errors',
      value: totalErrors
    });

    appInsights.defaultClient.trackMetric({
      name: 'Database.Queries.SlowRate',
      value: totalQueries > 0 ? (totalSlowQueries / totalQueries) * 100 : 0
    });

    appInsights.defaultClient.trackMetric({
      name: 'Database.Queries.ErrorRate',
      value: totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalQueries: number;
    slowQueries: number;
    errorQueries: number;
    slowQueryRate: number;
    errorRate: number;
    avgDuration: number;
  } {
    const allStats = Array.from(this.stats.values());
    const totalQueries = allStats.reduce((sum, s) => sum + s.totalQueries, 0);
    const slowQueries = allStats.reduce((sum, s) => sum + s.slowQueries, 0);
    const errorQueries = allStats.reduce((sum, s) => sum + s.errorQueries, 0);

    let totalDuration = 0;
    let queryCount = 0;
    allStats.forEach(s => {
      totalDuration += s.avgDuration * s.totalQueries;
      queryCount += s.totalQueries;
    });

    const avgDuration = queryCount > 0 ? totalDuration / queryCount : 0;

    return {
      totalQueries,
      slowQueries,
      errorQueries,
      slowQueryRate: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
      errorRate: totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0,
      avgDuration
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.clear();
    this.recentSlowQueries = [];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.nPlusOneDetector.destroy();
  }
}

// Singleton instance
export const queryMonitor = new QueryMonitor();

/**
 * Monitored query wrapper
 * Use this instead of pool.query() to get automatic monitoring
 */
export async function monitoredQuery<T = any>(
  pool: Pool | PoolClient,
  query: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return queryMonitor.monitorQuery<T>(pool, query, params);
}

export default queryMonitor;
