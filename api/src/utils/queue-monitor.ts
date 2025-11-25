/**
 * Queue Monitoring Utilities
 * Provides monitoring, alerting, and metrics collection for queue system
 */

import { pool } from '../config/database';
import { QueueName, QueueHealth } from '../types/queue.types';
import { queueService } from '../services/queue.service';

interface AlertThresholds {
  maxBacklog: number;
  maxFailureRate: number; // percentage
  maxProcessingTime: number; // milliseconds
  maxDeadLetterJobs: number;
}

interface Alert {
  level: 'info' | 'warning' | 'critical';
  queueName?: string;
  message: string;
  metric?: string;
  currentValue?: number;
  threshold?: number;
  timestamp: Date;
}

export class QueueMonitor {
  private alertThresholds: AlertThresholds = {
    maxBacklog: 1000,
    maxFailureRate: 10, // 10%
    maxProcessingTime: 60000, // 60 seconds
    maxDeadLetterJobs: 50
  };

  private alerts: Alert[] = [];

  /**
   * Collect and store queue statistics
   */
  async collectStatistics(): Promise<void> {
    try {
      const queues = Object.values(QueueName).filter(q => q !== QueueName.DEAD_LETTER);

      for (const queueName of queues) {
        const stats = await queueService.getQueueStats(queueName);

        // Store statistics in database
        await pool.query(
          `INSERT INTO queue_statistics
           (queue_name, jobs_pending, jobs_active, jobs_completed, jobs_failed,
            avg_processing_time_ms, jobs_per_minute)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            stats.queueName,
            stats.pending,
            stats.active,
            stats.completed,
            stats.failed,
            stats.avgProcessingTimeMs,
            stats.jobsPerMinute
          ]
        );
      }

      console.log('📊 Queue statistics collected successfully');
    } catch (error) {
      console.error('Failed to collect queue statistics:', error);
    }
  }

  /**
   * Check queue health and generate alerts
   */
  async checkHealth(): Promise<QueueHealth> {
    this.alerts = [];

    try {
      const health = await queueService.getQueueHealth();

      // Check each queue
      for (const [queueName, queueStats] of Object.entries(health.queues)) {
        // Check backlog
        if (queueStats.backlog > this.alertThresholds.maxBacklog) {
          this.addAlert({
            level: 'warning',
            queueName,
            message: `Queue backlog exceeds threshold`,
            metric: 'backlog',
            currentValue: queueStats.backlog,
            threshold: this.alertThresholds.maxBacklog,
            timestamp: new Date()
          });
        }

        // Check failure rate
        if (queueStats.failureRate > this.alertThresholds.maxFailureRate) {
          this.addAlert({
            level: 'critical',
            queueName,
            message: `Queue failure rate exceeds threshold`,
            metric: 'failureRate',
            currentValue: queueStats.failureRate,
            threshold: this.alertThresholds.maxFailureRate,
            timestamp: new Date()
          });
        }

        // Check processing time
        if (queueStats.avgProcessingTime > this.alertThresholds.maxProcessingTime) {
          this.addAlert({
            level: 'warning',
            queueName,
            message: `Average processing time exceeds threshold`,
            metric: 'avgProcessingTime',
            currentValue: queueStats.avgProcessingTime,
            threshold: this.alertThresholds.maxProcessingTime,
            timestamp: new Date()
          });
        }

        // Check if queue is not running
        if (!queueStats.isRunning) {
          this.addAlert({
            level: 'critical',
            queueName,
            message: `Queue is not running`,
            timestamp: new Date()
          });
        }
      }

      // Check dead letter queue
      if (health.deadLetterCount > this.alertThresholds.maxDeadLetterJobs) {
        this.addAlert({
          level: 'critical',
          message: `Dead letter queue has too many jobs`,
          metric: 'deadLetterCount',
          currentValue: health.deadLetterCount,
          threshold: this.alertThresholds.maxDeadLetterJobs,
          timestamp: new Date()
        });
      }

      // Send alerts if any
      if (this.alerts.length > 0) {
        await this.sendAlerts();
      }

      return health;
    } catch (error) {
      console.error('Failed to check queue health:', error);
      throw error;
    }
  }

  /**
   * Add an alert
   */
  private addAlert(alert: Alert): void {
    this.alerts.push(alert);
    console.log(`🚨 [${alert.level.toUpperCase()}] ${alert.message}`, {
      queue: alert.queueName,
      metric: alert.metric,
      currentValue: alert.currentValue,
      threshold: alert.threshold
    });
  }

  /**
   * Send alerts via configured channels
   */
  private async sendAlerts(): Promise<void> {
    try {
      // Store alerts in database
      for (const alert of this.alerts) {
        await pool.query(
          `INSERT INTO queue_alerts
           (level, queue_name, message, metric, current_value, threshold, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            alert.level,
            alert.queueName || null,
            alert.message,
            alert.metric || null,
            alert.currentValue || null,
            alert.threshold || null
          ]
        );
      }

      // TODO: Send alerts via other channels (email, Slack, PagerDuty, etc.)
      // For critical alerts, you might want to:
      // - Send email notifications
      // - Post to Slack channel
      // - Trigger PagerDuty incident
      // - Send push notifications

      const criticalAlerts = this.alerts.filter(a => a.level === 'critical');
      if (criticalAlerts.length > 0) {
        console.error(`🚨 ${criticalAlerts.length} CRITICAL ALERTS detected!`);
        // await sendCriticalAlertNotifications(criticalAlerts);
      }
    } catch (error) {
      console.error('Failed to send alerts:', error);
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 50): Promise<Alert[]> {
    try {
      const result = await pool.query(
        `SELECT
      id, tenant_id, queue_name, alert_type, threshold, current_value,
      message, severity, acknowledged, created_at, updated_at
    FROM queue_alerts
         ORDER BY created_at DESC
         LIMIT $1',
        [limit]
      );

      return result.rows.map(row => ({
        level: row.level,
        queueName: row.queue_name,
        message: row.message,
        metric: row.metric,
        currentValue: row.current_value,
        threshold: row.threshold,
        timestamp: row.created_at
      }));
    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      return [];
    }
  }

  /**
   * Get queue performance trends
   */
  async getPerformanceTrends(
    queueName: string,
    timeRange: string = '24h'
  ): Promise<any[]> {
    try {
      const timeRangeMap: Record<string, string> = {
        '1h': '1 hour',
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days'
      };

      const interval = timeRangeMap[timeRange] || '24 hours';

      const result = await pool.query(
        `SELECT
          DATE_TRUNC('hour', timestamp) as hour,
          AVG(jobs_pending) as avg_pending,
          AVG(jobs_active) as avg_active,
          AVG(jobs_completed) as avg_completed,
          AVG(jobs_failed) as avg_failed,
          AVG(avg_processing_time_ms) as avg_processing_time,
          AVG(jobs_per_minute) as avg_jobs_per_minute
         FROM queue_statistics
         WHERE queue_name = $1 AND timestamp > NOW() - $2::INTERVAL
         GROUP BY DATE_TRUNC('hour', timestamp)
         ORDER BY hour DESC`,
        [queueName, interval]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get performance trends:', error);
      return [];
    }
  }

  /**
   * Generate queue performance report
   */
  async generatePerformanceReport(timeRange: string = '24h'): Promise<any> {
    try {
      const queues = Object.values(QueueName).filter(q => q !== QueueName.DEAD_LETTER);
      const report: any = {
        timeRange,
        generatedAt: new Date(),
        queues: {}
      };

      for (const queueName of queues) {
        const stats = await queueService.getQueueStats(queueName);
        const trends = await this.getPerformanceTrends(queueName, timeRange);

        report.queues[queueName] = {
          currentStats: stats,
          trends: trends.slice(0, 24), // Last 24 hours
          summary: {
            totalProcessed: stats.completed + stats.failed,
            successRate: stats.completed > 0
              ? ((stats.completed / (stats.completed + stats.failed)) * 100).toFixed(2) + '%'
              : '0%',
            averageBacklog: trends.length > 0
              ? (trends.reduce((sum, t) => sum + parseFloat(t.avg_pending), 0) / trends.length).toFixed(0)
              : '0',
            peakProcessingTime: Math.max(...trends.map(t => parseFloat(t.avg_processing_time) || 0))
          }
        };
      }

      // Get dead letter queue summary
      // Map timeRange to interval (sanitized via whitelist)
      const timeRangeMap: Record<string, string> = {
        '1h': '1 hour',
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days'
      };
      const interval = timeRangeMap[timeRange] || '24 hours';

      const dlqResult = await pool.query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE reviewed = FALSE) as unreviewed,
          COUNT(*) FILTER (WHERE retry_attempted = TRUE) as retried
         FROM dead_letter_queue
         WHERE moved_to_dlq_at > NOW() - $1::INTERVAL`,
        [interval]
      );

      report.deadLetterQueue = {
        total: parseInt(dlqResult.rows[0].total),
        unreviewed: parseInt(dlqResult.rows[0].unreviewed),
        retried: parseInt(dlqResult.rows[0].retried)
      };

      return report;
    } catch (error) {
      console.error('Failed to generate performance report:', error);
      throw error;
    }
  }

  /**
   * Clean up old statistics
   */
  async cleanupOldStatistics(daysToKeep: number = 30): Promise<void> {
    try {
      // Validate and sanitize daysToKeep parameter
      const daysToKeepNum = Math.max(1, Math.min(365, daysToKeep || 30))

      const result = await pool.query(
        `DELETE FROM queue_statistics
         WHERE created_at < NOW() - ($1 || ' days')::INTERVAL`,
        [daysToKeepNum]
      );

      console.log(`🧹 Cleaned up ${result.rowCount} old statistics records`);
    } catch (error) {
      console.error('Failed to cleanup old statistics:', error);
    }
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = {
      ...this.alertThresholds,
      ...newThresholds
    };
    console.log('✅ Alert thresholds updated:', this.alertThresholds);
  }

  /**
   * Get current alert thresholds
   */
  getThresholds(): AlertThresholds {
    return { ...this.alertThresholds };
  }
}

// Export singleton instance
export const queueMonitor = new QueueMonitor();
export default queueMonitor;
