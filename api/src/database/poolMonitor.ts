/**
 * Database Connection Pool Monitor
 *
 * Provides real-time monitoring and alerting for database connection pools:
 * - Tracks total/idle/active connections
 * - Monitors waiting requests
 * - Logs metrics every 60 seconds
 * - Alerts when waiting requests > 10
 *
 * @module database/poolMonitor
 */

import { databaseConnectionManager, PoolType } from './connectionManager';

/**
 * Pool metrics interface
 */
export interface PoolMetrics {
  poolType: PoolType;
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingRequests: number;
  maxConnections: number;
  minConnections: number;
  utilizationPercent: number;
  timestamp: Date;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  waitingRequestsThreshold: number;
  utilizationThresholdPercent: number;
  idleConnectionsMinThreshold: number;
  enableAlerts: boolean;
  alertCallback?: (alert: PoolAlert) => void;
}

/**
 * Pool alert interface
 */
export interface PoolAlert {
  poolType: PoolType;
  alertType: 'WAITING_REQUESTS' | 'HIGH_UTILIZATION' | 'LOW_IDLE' | 'POOL_ERROR' | 'RECONNECTION';
  message: string;
  severity: 'warning' | 'critical';
  metrics: PoolMetrics | null;
  timestamp: Date;
}

/**
 * Historical metrics for trend analysis
 */
interface MetricsHistory {
  metrics: PoolMetrics[];
  maxSize: number;
}

/**
 * Default alert configuration
 */
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  waitingRequestsThreshold: parseInt(process.env.DB_ALERT_WAITING_THRESHOLD || '10'),
  utilizationThresholdPercent: parseInt(process.env.DB_ALERT_UTILIZATION_THRESHOLD || '80'),
  idleConnectionsMinThreshold: parseInt(process.env.DB_ALERT_MIN_IDLE_THRESHOLD || '1'),
  enableAlerts: process.env.DB_ALERTS_ENABLED !== 'false'
};

/**
 * Database Pool Monitor
 *
 * Monitors connection pool health and emits alerts when thresholds are exceeded.
 */
export class PoolMonitor {
  private metricsInterval: NodeJS.Timeout | null = null;
  private alertConfig: AlertConfig;
  private metricsHistory: Map<PoolType, MetricsHistory> = new Map();
  private alertHistory: PoolAlert[] = [];
  private isRunning: boolean = false;
  private metricsIntervalMs: number;

  constructor(
    alertConfig: Partial<AlertConfig> = {},
    metricsIntervalMs: number = parseInt(process.env.DB_METRICS_INTERVAL_MS || '60000')
  ) {
    this.alertConfig = { ...DEFAULT_ALERT_CONFIG, ...alertConfig };
    this.metricsIntervalMs = metricsIntervalMs;

    // Initialize history for each pool type
    for (const poolType of Object.values(PoolType)) {
      this.metricsHistory.set(poolType as PoolType, {
        metrics: [],
        maxSize: 60 // Keep 60 data points (1 hour at 60s intervals)
      });
    }
  }

  /**
   * Start the pool monitor
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[PoolMonitor] Already running');
      return;
    }

    console.log(`[PoolMonitor] Starting with ${this.metricsIntervalMs}ms interval`);
    console.log(`[PoolMonitor] Alert thresholds - Waiting: ${this.alertConfig.waitingRequestsThreshold}, Utilization: ${this.alertConfig.utilizationThresholdPercent}%`);

    this.isRunning = true;
    this.collectAndLogMetrics(); // Immediate first collection

    this.metricsInterval = setInterval(() => {
      this.collectAndLogMetrics();
    }, this.metricsIntervalMs);
  }

  /**
   * Stop the pool monitor
   */
  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    this.isRunning = false;
    console.log('[PoolMonitor] Stopped');
  }

  /**
   * Collect metrics from all pools
   */
  collectMetrics(): PoolMetrics[] {
    const allMetrics: PoolMetrics[] = [];
    const timestamp = new Date();

    for (const poolType of Object.values(PoolType)) {
      const stats = databaseConnectionManager.getPoolStats(poolType as PoolType);

      if (!stats) {
        // Pool not initialized yet, skip
        continue;
      }

      const metrics: PoolMetrics = {
        poolType: poolType as PoolType,
        totalConnections: stats.totalCount,
        idleConnections: stats.idleCount,
        activeConnections: stats.activeCount,
        waitingRequests: stats.waitingCount,
        maxConnections: stats.maxConnections,
        minConnections: stats.minConnections,
        utilizationPercent: stats.maxConnections > 0
          ? Math.round((stats.activeCount / stats.maxConnections) * 100)
          : 0,
        timestamp
      };

      allMetrics.push(metrics);

      // Store in history
      const history = this.metricsHistory.get(poolType as PoolType);
      if (history) {
        history.metrics.push(metrics);
        if (history.metrics.length > history.maxSize) {
          history.metrics.shift();
        }
      }
    }

    return allMetrics;
  }

  /**
   * Collect metrics and log them
   */
  private collectAndLogMetrics(): void {
    const metrics = this.collectMetrics();

    if (metrics.length === 0) {
      console.log('[PoolMonitor] No pools initialized yet');
      return;
    }

    // Log metrics
    console.log('[PoolMonitor] Connection Pool Metrics:');
    for (const m of metrics) {
      console.log(
        `  [${m.poolType}] Total: ${m.totalConnections}/${m.maxConnections}, ` +
        `Active: ${m.activeConnections}, Idle: ${m.idleConnections}, ` +
        `Waiting: ${m.waitingRequests}, Utilization: ${m.utilizationPercent}%`
      );

      // Check for alerts
      this.checkAlerts(m);
    }

    // Log active queries from connection manager
    const activeQueries = databaseConnectionManager.getActiveQueryCount();
    console.log(`[PoolMonitor] Total active queries: ${activeQueries}`);
  }

  /**
   * Check metrics against alert thresholds
   */
  private checkAlerts(metrics: PoolMetrics): void {
    if (!this.alertConfig.enableAlerts) {
      return;
    }

    // Check waiting requests threshold
    if (metrics.waitingRequests > this.alertConfig.waitingRequestsThreshold) {
      this.emitAlert({
        poolType: metrics.poolType,
        alertType: 'WAITING_REQUESTS',
        message: `High waiting requests: ${metrics.waitingRequests} clients waiting (threshold: ${this.alertConfig.waitingRequestsThreshold})`,
        severity: metrics.waitingRequests > this.alertConfig.waitingRequestsThreshold * 2 ? 'critical' : 'warning',
        metrics,
        timestamp: new Date()
      });
    }

    // Check utilization threshold
    if (metrics.utilizationPercent >= this.alertConfig.utilizationThresholdPercent) {
      this.emitAlert({
        poolType: metrics.poolType,
        alertType: 'HIGH_UTILIZATION',
        message: `High pool utilization: ${metrics.utilizationPercent}% (threshold: ${this.alertConfig.utilizationThresholdPercent}%)`,
        severity: metrics.utilizationPercent >= 95 ? 'critical' : 'warning',
        metrics,
        timestamp: new Date()
      });
    }

    // Check for low idle connections (potential pool exhaustion)
    if (
      metrics.activeConnections > 0 &&
      metrics.idleConnections < this.alertConfig.idleConnectionsMinThreshold
    ) {
      this.emitAlert({
        poolType: metrics.poolType,
        alertType: 'LOW_IDLE',
        message: `Low idle connections: ${metrics.idleConnections} idle (min threshold: ${this.alertConfig.idleConnectionsMinThreshold})`,
        severity: 'warning',
        metrics,
        timestamp: new Date()
      });
    }
  }

  /**
   * Emit an alert
   */
  private emitAlert(alert: PoolAlert): void {
    // Store in history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > 1000) {
      this.alertHistory.shift();
    }

    // Log the alert
    const logPrefix = alert.severity === 'critical' ? '[CRITICAL]' : '[WARNING]';
    console.warn(`[PoolMonitor] ${logPrefix} ${alert.alertType}: ${alert.message}`);

    // Call custom alert callback if configured
    if (this.alertConfig.alertCallback) {
      try {
        this.alertConfig.alertCallback(alert);
      } catch (error) {
        console.error('[PoolMonitor] Alert callback error:', error);
      }
    }
  }

  /**
   * Get current metrics for all pools
   */
  getCurrentMetrics(): PoolMetrics[] {
    return this.collectMetrics();
  }

  /**
   * Get metrics history for a specific pool
   */
  getMetricsHistory(poolType: PoolType): PoolMetrics[] {
    return this.metricsHistory.get(poolType)?.metrics || [];
  }

  /**
   * Get all metrics history
   */
  getAllMetricsHistory(): Record<PoolType, PoolMetrics[]> {
    const history: Record<string, PoolMetrics[]> = {};
    Array.from(this.metricsHistory.entries()).forEach(([poolType, data]) => {
      history[poolType] = data.metrics;
    });
    return history as Record<PoolType, PoolMetrics[]>;
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): PoolAlert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get recent alerts (last hour)
   */
  getRecentAlerts(): PoolAlert[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.alertHistory.filter(alert => alert.timestamp >= oneHourAgo);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    pools: Record<string, any>;
    totalActiveQueries: number;
    recentAlerts: number;
    timestamp: string;
  } {
    const metrics = this.collectMetrics();
    const pools: Record<string, any> = {};

    for (const m of metrics) {
      pools[m.poolType] = {
        total: m.totalConnections,
        active: m.activeConnections,
        idle: m.idleConnections,
        waiting: m.waitingRequests,
        utilization: `${m.utilizationPercent}%`,
        max: m.maxConnections
      };
    }

    return {
      pools,
      totalActiveQueries: databaseConnectionManager.getActiveQueryCount(),
      recentAlerts: this.getRecentAlerts().length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    console.log('[PoolMonitor] Alert configuration updated:', this.alertConfig);
  }

  /**
   * Check if monitor is running
   */
  isMonitorRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Clear alert history
   */
  clearAlertHistory(): void {
    this.alertHistory = [];
    console.log('[PoolMonitor] Alert history cleared');
  }

  /**
   * Clear metrics history
   */
  clearMetricsHistory(): void {
    Array.from(this.metricsHistory.values()).forEach(history => {
      history.metrics = [];
    });
    console.log('[PoolMonitor] Metrics history cleared');
  }
}

// Singleton instance
export const poolMonitor = new PoolMonitor();

/**
 * Start the pool monitor
 * Call this during application startup after database initialization
 */
export function startPoolMonitor(config?: Partial<AlertConfig>): void {
  if (config) {
    poolMonitor.updateAlertConfig(config);
  }
  poolMonitor.start();
}

/**
 * Stop the pool monitor
 * Call this during application shutdown
 */
export function stopPoolMonitor(): void {
  poolMonitor.stop();
}

export default poolMonitor;
