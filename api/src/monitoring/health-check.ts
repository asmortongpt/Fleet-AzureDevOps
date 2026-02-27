/**
 * Health Check Service
 * Provides comprehensive health status for all system components
 */

import { pool } from '../db';
import logger from '../config/logger';
import type { Request, Response } from 'express';

/**
 * Health check status types
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

/**
 * Service health information
 */
export interface ServiceHealth {
  status: HealthStatus;
  responseTime: number;
  details?: string;
  lastChecked?: Date;
}

/**
 * Overall health report
 */
export interface HealthReport {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  services: {
    database: ServiceHealth;
    memory: ServiceHealth;
    diskSpace?: ServiceHealth;
  };
  version: string;
}

/**
 * Health check service
 */
class HealthCheckService {
  private startTime: Date = new Date();
  private lastDatabaseCheck: Date | null = null;
  private lastMemoryCheck: Date | null = null;
  private databaseCheckInterval: number = 30000; // 30 seconds
  private memoryCheckInterval: number = 60000; // 60 seconds
  private cacheHealth: Map<string, ServiceHealth> = new Map();

  /**
   * Perform database health check
   */
  async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      // Execute a simple query to verify database connectivity
      const result = await pool.query('SELECT 1 as health_check');

      if (result.rows.length > 0) {
        this.lastDatabaseCheck = new Date();
        return {
          status: HealthStatus.HEALTHY,
          responseTime: Date.now() - startTime,
          details: `Database connection pool active with ${pool.totalCount} connections`
        };
      }

      return {
        status: HealthStatus.UNHEALTHY,
        responseTime: Date.now() - startTime,
        details: 'Database query returned no results'
      };
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        status: HealthStatus.UNHEALTHY,
        responseTime: Date.now() - startTime,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check memory usage
   */
  checkMemory(): ServiceHealth {
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const rssPercent = (memUsage.rss / (1024 * 1024 * 1024)) * 100; // Assuming ~1GB available

      let status = HealthStatus.HEALTHY;
      if (heapUsedPercent > 90) {
        status = HealthStatus.UNHEALTHY;
      } else if (heapUsedPercent > 75) {
        status = HealthStatus.DEGRADED;
      }

      this.lastMemoryCheck = new Date();

      return {
        status,
        responseTime: Date.now() - startTime,
        details: `Heap usage: ${heapUsedPercent.toFixed(2)}%, RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      };
    } catch (error) {
      logger.error('Memory health check failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        status: HealthStatus.UNHEALTHY,
        responseTime: Date.now() - startTime,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check a named service health
   */
  checkService(serviceName: string, checker: () => Promise<ServiceHealth>): Promise<ServiceHealth> {
    return checker();
  }

  /**
   * Cache service health information
   */
  cacheServiceHealth(serviceName: string, health: ServiceHealth): void {
    this.cacheHealth.set(serviceName, {
      ...health,
      lastChecked: new Date()
    });
  }

  /**
   * Get cached service health
   */
  getCachedServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.cacheHealth.get(serviceName);
  }

  /**
   * Get overall health report
   */
  async getHealthReport(): Promise<HealthReport> {
    const dbHealth = await this.checkDatabase();
    const memHealth = this.checkMemory();

    let overallStatus = HealthStatus.HEALTHY;

    if (
      dbHealth.status === HealthStatus.UNHEALTHY ||
      memHealth.status === HealthStatus.UNHEALTHY
    ) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (
      dbHealth.status === HealthStatus.DEGRADED ||
      memHealth.status === HealthStatus.DEGRADED
    ) {
      overallStatus = HealthStatus.DEGRADED;
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      services: {
        database: dbHealth,
        memory: memHealth
      },
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  /**
   * Express middleware for health check endpoint
   */
  healthCheckEndpoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.getHealthReport();

      const statusCode =
        health.status === HealthStatus.HEALTHY
          ? 200
          : health.status === HealthStatus.DEGRADED
            ? 503
            : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check endpoint error', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(503).json({
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Liveness probe (is the service running?)
   */
  livenessProbe = async (req: Request, res: Response): Promise<void> => {
    try {
      // Quick check - just verify the process is running
      res.status(200).json({
        status: 'alive',
        timestamp: new Date(),
        uptime: Date.now() - this.startTime.getTime()
      });
    } catch (error) {
      res.status(500).json({
        status: 'dead',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Readiness probe (is the service ready to accept requests?)
   */
  readinessProbe = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.getHealthReport();

      const statusCode =
        health.status === HealthStatus.HEALTHY ? 200 : 503;

      res.status(statusCode).json({
        status: health.status === HealthStatus.HEALTHY ? 'ready' : 'not_ready',
        timestamp: new Date(),
        services: health.services
      });
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Startup probe (did the service start successfully?)
   */
  startupProbe = async (req: Request, res: Response): Promise<void> => {
    try {
      const dbHealth = await this.checkDatabase();

      const isReady = dbHealth.status === HealthStatus.HEALTHY;

      res.status(isReady ? 200 : 503).json({
        status: isReady ? 'started' : 'starting',
        timestamp: new Date(),
        database: dbHealth
      });
    } catch (error) {
      res.status(503).json({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();

export default healthCheckService;
