/**
 * Queue System Initialization
 * Initializes the queue service and registers all processors
 */

import { queueService } from '../services/queue.service';
import { initializeQueueProcessors } from '../jobs/queue-processors';
import { queueMonitor } from '../utils/queue-monitor';
import cron from 'node-cron';

/**
 * Initialize the queue system
 */
export async function initializeQueueSystem(): Promise<void> {
  console.log('🚀 Initializing queue system...');

  try {
    // 1. Initialize queue service
    await queueService.initialize();
    console.log('✅ Queue service initialized');

    // 2. Register all queue processors
    await initializeQueueProcessors(queueService);
    console.log('✅ Queue processors registered');

    // 3. Set up monitoring cron jobs
    setupMonitoringJobs();
    console.log('✅ Monitoring jobs scheduled');

    // 4. Set up cleanup jobs
    setupCleanupJobs();
    console.log('✅ Cleanup jobs scheduled');

    // 5. Set up graceful shutdown
    setupGracefulShutdown();
    console.log('✅ Graceful shutdown handlers registered');

    console.log('✅ Queue system initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize queue system:', error);
    throw error;
  }
}

/**
 * Set up monitoring cron jobs
 */
function setupMonitoringJobs(): void {
  // Collect statistics every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('📊 Collecting queue statistics...');
      await queueMonitor.collectStatistics();
    } catch (error) {
      console.error('Failed to collect statistics:', error);
    }
  });

  // Check queue health every minute
  cron.schedule('* * * * *', async () => {
    try {
      await queueMonitor.checkHealth();
    } catch (error) {
      console.error('Failed to check queue health:', error);
    }
  });

  // Generate performance report daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('📈 Generating daily performance report...');
      const report = await queueMonitor.generatePerformanceReport('24h');
      console.log('Performance Report:', JSON.stringify(report, null, 2));

      // TODO: Send report via email or store in reporting system
    } catch (error) {
      console.error('Failed to generate performance report:', error);
    }
  });
}

/**
 * Set up cleanup cron jobs
 */
function setupCleanupJobs(): void {
  // Clean up old statistics daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🧹 Cleaning up old queue statistics...');
      await queueMonitor.cleanupOldStatistics(30); // Keep 30 days
    } catch (error) {
      console.error('Failed to cleanup old statistics:', error);
    }
  });

  // Clean up old job tracking records weekly
  cron.schedule('0 3 * * 0', async () => {
    try {
      console.log('🧹 Cleaning up old job tracking records...');
      const { pool } = await import('../config/database');

      // Delete completed jobs older than 30 days
      const result = await pool.query(
        `DELETE FROM job_tracking
         WHERE status = 'completed'
         AND completed_at < NOW() - INTERVAL '30 days''
      );

      console.log(`✅ Deleted ${result.rowCount} old job tracking records`);
    } catch (error) {
      console.error('Failed to cleanup old job tracking records:', error);
    }
  });
}

/**
 * Set up graceful shutdown handlers
 */
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

    try {
      // Stop accepting new jobs and wait for current jobs to finish
      await queueService.shutdown();
      console.log('✅ Queue service stopped gracefully');

      // Exit process
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', async (error) => {
    console.error('❌ Uncaught exception:', error);
    await queueService.shutdown();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    await queueService.shutdown();
    process.exit(1);
  });
}

/**
 * Get queue system status
 */
export async function getQueueSystemStatus(): Promise<any> {
  try {
    const health = await queueService.getQueueHealth();
    const recentAlerts = await queueMonitor.getRecentAlerts(10);

    return {
      healthy: health.healthy,
      queues: health.queues,
      deadLetterCount: health.deadLetterCount,
      recentAlerts: recentAlerts.slice(0, 5),
      lastChecked: health.lastChecked
    };
  } catch (error) {
    console.error('Failed to get queue system status:', error);
    return {
      healthy: false,
      error: 'Failed to get status'
    };
  }
}

export default initializeQueueSystem;
