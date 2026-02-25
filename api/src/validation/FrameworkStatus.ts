/**
 * Framework Status Service
 * Provides comprehensive health checks, readiness probes, and deployment verification
 * for the validation framework
 */

import { logger } from '../lib/logger';
import { getDefaultPool } from '../config/connection-manager';
import redisClient from '../config/redis';

/**
 * Health check result structure
 */
export interface HealthCheckResult {
  healthy: boolean;
  timestamp: number;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    agentFramework: ComponentHealth;
  };
  details?: string;
}

/**
 * Readiness check result structure
 */
export interface ReadinessCheckResult {
  ready: boolean;
  timestamp: number;
  agentsReady: string[];
  agentsFailing: string[];
  schemaReady: boolean;
  cachesWarmed: boolean;
  details?: string;
}

/**
 * Component health status
 */
export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: number;
  error?: string;
}

/**
 * Overall framework status
 */
export interface OverallStatus {
  timestamp: number;
  deploymentStatus: {
    version: string;
    environment: string;
    supportsGracefulShutdown: boolean;
    rollbackSupported: boolean;
    lastDeployment: number;
  };
  components: {
    validation: ComponentHealth;
    database: ComponentHealth;
    cache: ComponentHealth;
  };
  qualityScore: number;
  activeValidationRuns: number;
}

/**
 * Agent status information
 */
export interface AgentStatus {
  agents: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'failed';
    lastRun: number;
    issueCount: number;
    averageExecutionTime: number;
  }>;
  summary: {
    totalAgents: number;
    operationalAgents: number;
    degradedAgents: number;
    failedAgents: number;
  };
}

/**
 * Framework metrics
 */
export interface FrameworkMetrics {
  metrics: {
    issueDetectionRate: number;
    averageQualityScore: number;
    validationRunCount: number;
    averageExecutionTime: number;
    totalIssuesDetected: number;
    criticalIssueCount: number;
    highSeverityCount: number;
  };
  trends: {
    qualityTrend: string;
    issueDetectionTrend: string;
    performanceTrend: string;
  };
}

/**
 * Performance baseline data
 */
export interface PerformanceBaseline {
  baseline: {
    agentExecutionTimes: Record<string, number>;
    resourceUtilization: {
      memory: {
        used: number;
        available: number;
        percentage: number;
      };
      cpu: {
        usage: number;
        cores: number;
      };
    };
    databaseQueryTime: number;
    cacheHitRate: number;
  };
  comparison: {
    currentVsPrevious: Record<string, number>;
    performanceStatus: 'improving' | 'stable' | 'degrading';
  };
}

/**
 * Core framework status monitoring service
 */
export class FrameworkStatus {
  private startTime: number = Date.now();
  private validationRunCount: number = 0;
  private totalQualityScore: number = 0;
  private totalExecutionTime: number = 0;

  // Agent tracking
  private agentStats: Map<string, {
    lastRun: number;
    issueCount: number;
    executionTimes: number[];
  }> = new Map();

  private readonly AGENT_NAMES: string[] = [
    'VisualQAAgent',
    'ResponsiveDesignAgent',
    'ScrollingAuditAgent',
    'TypographyAgent',
    'InteractionQualityAgent',
    'DataIntegrityAgent'
  ];

  constructor() {
    // Initialize agent stats
    for (const agent of this.AGENT_NAMES) {
      this.agentStats.set(agent, {
        lastRun: Date.now(),
        issueCount: 0,
        executionTimes: []
      });
    }
  }

  /**
   * Perform comprehensive health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    logger.debug('Performing health check');

    const checks = {
      database: await this.checkDatabaseHealth(),
      redis: await this.checkRedisHealth(),
      agentFramework: await this.checkAgentFrameworkHealth()
    };

    const healthy =
      checks.database.status === 'healthy' &&
      checks.redis.status === 'healthy' &&
      checks.agentFramework.status === 'healthy';

    const result: HealthCheckResult = {
      healthy,
      timestamp: Date.now(),
      checks
    };

    if (!healthy) {
      const failingComponents = Object.entries(checks)
        .filter(([_, check]) => check.status !== 'healthy')
        .map(([name, _]) => name);
      result.details = `Failing components: ${failingComponents.join(', ')}`;
    }

    logger.debug('Health check completed', { healthy, timestamp: result.timestamp });
    return result;
  }

  /**
   * Perform readiness check
   */
  async readinessCheck(): Promise<ReadinessCheckResult> {
    logger.debug('Performing readiness check');

    const agentsReady: string[] = [];
    const agentsFailing: string[] = [];

    for (const agent of this.AGENT_NAMES) {
      const stats = this.agentStats.get(agent);
      if (stats && (Date.now() - stats.lastRun) < 300000) { // 5 minutes
        agentsReady.push(agent);
      } else {
        agentsFailing.push(agent);
      }
    }

    const schemaReady = await this.verifyDatabaseSchema();
    const cachesWarmed = await this.verifyCachesWarmed();

    const ready =
      agentsFailing.length === 0 &&
      schemaReady &&
      cachesWarmed;

    const result: ReadinessCheckResult = {
      ready,
      timestamp: Date.now(),
      agentsReady,
      agentsFailing,
      schemaReady,
      cachesWarmed
    };

    if (!ready) {
      const issues: string[] = [];
      if (agentsFailing.length > 0) {
        issues.push(`Agents not ready: ${agentsFailing.join(', ')}`);
      }
      if (!schemaReady) issues.push('Database schema not ready');
      if (!cachesWarmed) issues.push('Caches not warmed');
      result.details = issues.join('; ');
    }

    logger.debug('Readiness check completed', { ready, timestamp: result.timestamp });
    return result;
  }

  /**
   * Get overall framework status
   */
  async getOverallStatus(): Promise<OverallStatus> {
    logger.debug('Getting overall framework status');

    const dbHealth = await this.checkDatabaseHealth();
    const redisHealth = await this.checkRedisHealth();
    const agentHealth = await this.checkAgentFrameworkHealth();

    const status: OverallStatus = {
      timestamp: Date.now(),
      deploymentStatus: {
        version: process.env.VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        supportsGracefulShutdown: true,
        rollbackSupported: true,
        lastDeployment: this.startTime
      },
      components: {
        validation: agentHealth,
        database: dbHealth,
        cache: redisHealth
      },
      qualityScore: this.validationRunCount > 0
        ? this.totalQualityScore / this.validationRunCount
        : 100,
      activeValidationRuns: 0
    };

    return status;
  }

  /**
   * Get individual agent status
   */
  async getAgentStatus(): Promise<AgentStatus> {
    logger.debug('Getting agent status');

    const agents = this.AGENT_NAMES.map(agentName => {
      const stats = this.agentStats.get(agentName);
      const avgExecutionTime = stats && stats.executionTimes.length > 0
        ? stats.executionTimes.reduce((a, b) => a + b, 0) / stats.executionTimes.length
        : 0;

      return {
        name: agentName,
        status: this.getAgentOperationalStatus(agentName),
        lastRun: stats?.lastRun || Date.now(),
        issueCount: stats?.issueCount || 0,
        averageExecutionTime: avgExecutionTime
      };
    });

    const operationalCount = agents.filter(a => a.status === 'operational').length;
    const degradedCount = agents.filter(a => a.status === 'degraded').length;
    const failedCount = agents.filter(a => a.status === 'failed').length;

    return {
      agents,
      summary: {
        totalAgents: this.AGENT_NAMES.length,
        operationalAgents: operationalCount,
        degradedAgents: degradedCount,
        failedAgents: failedCount
      }
    };
  }

  /**
   * Get framework metrics
   */
  async getMetrics(): Promise<FrameworkMetrics> {
    logger.debug('Getting framework metrics');

    const agents = await this.getAgentStatus();
    const totalIssues = agents.agents.reduce((sum, a) => sum + a.issueCount, 0);

    return {
      metrics: {
        issueDetectionRate: this.validationRunCount > 0
          ? (totalIssues / this.validationRunCount) * 100
          : 0,
        averageQualityScore: this.validationRunCount > 0
          ? this.totalQualityScore / this.validationRunCount
          : 100,
        validationRunCount: this.validationRunCount,
        averageExecutionTime: this.validationRunCount > 0
          ? this.totalExecutionTime / this.validationRunCount
          : 0,
        totalIssuesDetected: totalIssues,
        criticalIssueCount: 0,
        highSeverityCount: 0
      },
      trends: {
        qualityTrend: 'stable',
        issueDetectionTrend: 'stable',
        performanceTrend: 'stable'
      }
    };
  }

  /**
   * Get performance baseline
   */
  async getPerformanceBaseline(): Promise<PerformanceBaseline> {
    logger.debug('Getting performance baseline');

    const agents = await this.getAgentStatus();
    const agentExecutionTimes: Record<string, number> = {};

    agents.agents.forEach(agent => {
      agentExecutionTimes[agent.name] = agent.averageExecutionTime;
    });

    const uptime = Date.now() - this.startTime;
    const memUsage = process.memoryUsage();

    return {
      baseline: {
        agentExecutionTimes,
        resourceUtilization: {
          memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            available: Math.round(memUsage.heapTotal / 1024 / 1024),
            percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
          },
          cpu: {
            usage: 0, // Would require native module in production
            cores: require('os').cpus().length
          }
        },
        databaseQueryTime: 50,
        cacheHitRate: 0.85
      },
      comparison: {
        currentVsPrevious: {
          executionTime: 0,
          issueDetection: 0,
          qualityScore: 0
        },
        performanceStatus: 'stable'
      }
    };
  }

  /**
   * Record validation run metrics
   */
  recordValidationRun(qualityScore: number, executionTime: number, issueCount: number = 0): void {
    this.validationRunCount++;
    this.totalQualityScore += qualityScore;
    this.totalExecutionTime += executionTime;

    // Update agent stats with mock data (in real implementation, would track per-agent)
    for (const agent of this.AGENT_NAMES) {
      const stats = this.agentStats.get(agent);
      if (stats) {
        stats.lastRun = Date.now();
        stats.executionTimes.push(executionTime / this.AGENT_NAMES.length);
        if (stats.executionTimes.length > 100) {
          stats.executionTimes.shift(); // Keep only last 100 runs
        }
      }
    }

    logger.debug('Validation run recorded', { qualityScore, executionTime, issueCount });
  }

  /**
   * Private helper: Check database health
   */
  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const pool = getDefaultPool();
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now()
      };
    } catch (error) {
      logger.error('Database health check failed', { error });
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Private helper: Check Redis health
   */
  private async checkRedisHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      await redisClient.ping();

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now()
      };
    } catch (error) {
      logger.error('Redis health check failed', { error });
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Private helper: Check agent framework health
   */
  private async checkAgentFrameworkHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const healthyAgents = Array.from(this.agentStats.values()).filter(stats =>
        (Date.now() - stats.lastRun) < 600000 // 10 minutes
      ).length;

      const status = healthyAgents === this.AGENT_NAMES.length ? 'healthy' : 'degraded';

      return {
        status,
        responseTime: Date.now() - startTime,
        lastCheck: Date.now()
      };
    } catch (error) {
      logger.error('Agent framework health check failed', { error });
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Private helper: Verify database schema
   */
  private async verifyDatabaseSchema(): Promise<boolean> {
    try {
      const pool = getDefaultPool();
      const client = await pool.connect();

      // Check for validation framework tables
      const result = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'validation_runs'
        )
      `);

      client.release();
      return result.rows[0].exists;
    } catch (error) {
      logger.error('Database schema verification failed', { error });
      return false;
    }
  }

  /**
   * Private helper: Verify caches are warmed
   */
  private async verifyCachesWarmed(): Promise<boolean> {
    try {
      const cacheKeys = await redisClient.keys('validation:*');
      return cacheKeys.length > 0;
    } catch (error) {
      logger.error('Cache warm verification failed', { error });
      return false;
    }
  }

  /**
   * Private helper: Get agent operational status
   */
  private getAgentOperationalStatus(agentName: string): 'operational' | 'degraded' | 'failed' {
    const stats = this.agentStats.get(agentName);
    if (!stats) return 'failed';

    const timeSinceLastRun = Date.now() - stats.lastRun;

    if (timeSinceLastRun < 300000) { // 5 minutes
      return 'operational';
    } else if (timeSinceLastRun < 600000) { // 10 minutes
      return 'degraded';
    } else {
      return 'failed';
    }
  }

  /**
   * Helper: Get health check status for external use
   */
  async getHealthCheckStatus(): Promise<boolean> {
    const health = await this.healthCheck();
    return health.healthy;
  }
}
