/**
 * Comprehensive Monitoring Setup
 * Initializes all monitoring, logging, and observability components
 */

import type { Express } from 'express';
import logger from '../config/logger';
import { prometheusMetrics } from './prometheus';
import { healthCheckService } from './health-check';
import { sentryService } from './sentry';
import { initMemoryMonitoring } from './memory';
import { getLogger as getStructuredLogger } from './structured-logging';
import telemetryService from './applicationInsights';

/**
 * Monitoring setup configuration
 */
export interface MonitoringConfig {
  enableMetrics?: boolean;
  enableHealthChecks?: boolean;
  enableStructuredLogging?: boolean;
  enableSentry?: boolean;
  enableApplicationInsights?: boolean;
  enableMemoryMonitoring?: boolean;
  enableTracing?: boolean;
  metricsPort?: number;
  healthCheckPath?: string;
  metricsPath?: string;
  livenessPath?: string;
  readinessPath?: string;
  startupPath?: string;
}

/**
 * Default monitoring configuration
 */
const DEFAULT_CONFIG: MonitoringConfig = {
  enableMetrics: true,
  enableHealthChecks: true,
  enableStructuredLogging: true,
  enableSentry: true,
  enableApplicationInsights: true,
  enableMemoryMonitoring: true,
  enableTracing: false,
  metricsPort: 9090,
  healthCheckPath: '/health',
  metricsPath: '/metrics',
  livenessPath: '/health/live',
  readinessPath: '/health/ready',
  startupPath: '/health/startup'
};

/**
 * Initialize all monitoring components
 */
export async function initializeMonitoring(
  app: Express,
  config: MonitoringConfig = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    logger.info('Initializing monitoring setup', { config: finalConfig });

    // Initialize Prometheus metrics
    if (finalConfig.enableMetrics) {
      logger.info('Initializing Prometheus metrics');
      prometheusMetrics.initialize();
    }

    // Initialize Sentry
    if (finalConfig.enableSentry) {
      logger.info('Initializing Sentry error tracking');
      sentryService.init();
    }

    // Initialize Application Insights
    if (finalConfig.enableApplicationInsights) {
      logger.info('Initializing Application Insights');
      telemetryService.initialize();
    }

    // Initialize memory monitoring
    if (finalConfig.enableMemoryMonitoring) {
      logger.info('Initializing memory monitoring');
      initMemoryMonitoring();
    }

    // Initialize structured logging
    if (finalConfig.enableStructuredLogging) {
      logger.info('Structured logging enabled');
      const structuredLogger = getStructuredLogger();
      logger.info('Structured logger active', {
        logLevel: structuredLogger.level
      });
    }

    // Register health check endpoints
    if (finalConfig.enableHealthChecks) {
      logger.info('Registering health check endpoints');

      // Main health endpoint
      app.get(finalConfig.healthCheckPath!, healthCheckService.healthCheckEndpoint);
      logger.info(`Health endpoint registered at ${finalConfig.healthCheckPath}`);

      // Liveness probe
      app.get(finalConfig.livenessPath!, healthCheckService.livenessProbe);
      logger.info(`Liveness probe registered at ${finalConfig.livenessPath}`);

      // Readiness probe
      app.get(finalConfig.readinessPath!, healthCheckService.readinessProbe);
      logger.info(`Readiness probe registered at ${finalConfig.readinessPath}`);

      // Startup probe
      app.get(finalConfig.startupPath!, healthCheckService.startupProbe);
      logger.info(`Startup probe registered at ${finalConfig.startupPath}`);
    }

    // Register metrics endpoint
    if (finalConfig.enableMetrics) {
      app.get(finalConfig.metricsPath!, async (req, res) => {
        try {
          const metrics = await prometheusMetrics.getMetrics();
          res.set('Content-Type', prometheusMetrics.getContentType());
          res.send(metrics);
        } catch (error) {
          logger.error('Error retrieving metrics', {
            error: error instanceof Error ? error.message : String(error)
          });
          res.status(500).json({
            error: 'Failed to retrieve metrics'
          });
        }
      });
      logger.info(`Metrics endpoint registered at ${finalConfig.metricsPath}`);
    }

    logger.info('Monitoring setup completed successfully');
  } catch (error) {
    logger.error('Failed to initialize monitoring', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Add monitoring middleware to express app
 */
export function addMonitoringMiddleware(app: Express): void {
  // HTTP metrics middleware
  app.use((req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Track request start
    prometheusMetrics.trackHttpRequestStart(req.method, req.baseUrl || req.path);

    // Override send to track response
    res.send = function (data: any) {
      const duration = Date.now() - startTime;

      // Track metrics
      prometheusMetrics.trackHttpRequest(
        req.method,
        req.baseUrl || req.path,
        res.statusCode,
        duration
      );

      prometheusMetrics.trackHttpRequestEnd(req.method, req.baseUrl || req.path);

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  });
}

/**
 * Shutdown monitoring gracefully
 */
export async function shutdownMonitoring(): Promise<void> {
  try {
    logger.info('Shutting down monitoring services');

    // Flush Sentry
    await sentryService.flush();

    // Flush Application Insights
    await telemetryService.flush();

    logger.info('Monitoring shutdown completed');
  } catch (error) {
    logger.error('Error during monitoring shutdown', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get monitoring status
 */
export function getMonitoringStatus(): Record<string, boolean> {
  return {
    prometheus: prometheusMetrics.isInitialized(),
    sentry: true, // Sentry doesn't expose initialization status
    applicationInsights: telemetryService.isActive(),
    healthChecks: true // Health checks are always available
  };
}

/**
 * Create metrics collection interval
 */
export function startMetricsCollection(intervalMs: number = 60000): void {
  setInterval(() => {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      logger.debug('Metrics collection', {
        memoryHeapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        memoryHeapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        memoryRssMB: Math.round(memUsage.rss / 1024 / 1024),
        uptimeSeconds: Math.round(uptime)
      });
    } catch (error) {
      logger.error('Error collecting metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, intervalMs);
}

/**
 * Export all monitoring components
 */
export {
  prometheusMetrics,
  healthCheckService,
  sentryService,
  telemetryService,
  getStructuredLogger
};

export default {
  initializeMonitoring,
  addMonitoringMiddleware,
  shutdownMonitoring,
  getMonitoringStatus,
  startMetricsCollection
};
