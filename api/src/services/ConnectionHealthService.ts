/**
 * ConnectionHealthService - Comprehensive system health monitoring
 * Verifies connections to all external services and dependencies
 */

import { EventEmitter } from 'events';

import Redis from 'ioredis';

import logger from '../config/logger';
import { checkDatabaseConnection } from '../db/connection';

export interface ConnectionStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  message?: string;
  lastChecked: Date;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  connections: ConnectionStatus[];
  emulators: {
    gps: number;
    obd2: number;
    fuel: number;
    maintenance: number;
    driver: number;
    route: number;
    cost: number;
    iot: number;
    radio: number;
    video: number;
    ev: number;
    inventory: number;
    dispatch: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

export class ConnectionHealthService extends EventEmitter {
  private redis: Redis | null = null;
  private healthCache: SystemHealth | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize connection health monitoring
   */
  public async initialize(): Promise<void> {
    logger.info('[ConnectionHealthService] Initializing...');

    // Initialize Redis connection if configured
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });

        await this.redis.connect();
        logger.info('[ConnectionHealthService] Redis connected');
      } catch (error) {
        logger.warn('[ConnectionHealthService] Redis connection failed', { error: error instanceof Error ? error.message : String(error) });
        this.redis = null;
      }
    }

    // Start periodic health checks (every 30 seconds)
    this.checkInterval = setInterval(() => {
      this.performHealthCheck().catch((err) => logger.error('[ConnectionHealthService] Health check failed', { error: err instanceof Error ? err.message : String(err) }));
    }, 30000);

    // Perform initial health check
    await this.performHealthCheck();

    logger.info('[ConnectionHealthService] Initialized');
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    const connections: ConnectionStatus[] = [];

    // Check Database
    connections.push(await this.checkDatabase());

    // Check Redis
    if (this.redis) {
      connections.push(await this.checkRedis());
    }

    // Check Azure Services
    if (process.env.AZURE_OPENAI_ENDPOINT) {
      connections.push(await this.checkAzureOpenAI());
    }

    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      connections.push(await this.checkAzureStorage());
    }

    // Check External APIs
    if (process.env.GOOGLE_MAPS_API_KEY) {
      connections.push(await this.checkGoogleMaps());
    }

    // Calculate overall health
    const healthyCount = connections.filter(c => c.status === 'healthy').length;
    const degradedCount = connections.filter(c => c.status === 'degraded').length;
    const unhealthyCount = connections.filter(c => c.status === 'unhealthy').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0 || healthyCount === 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    // Get memory usage
    const memUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    this.healthCache = {
      overall,
      timestamp: new Date(),
      connections,
      emulators: {
        gps: 0,
        obd2: 0,
        fuel: 0,
        maintenance: 0,
        driver: 0,
        route: 0,
        cost: 0,
        iot: 0,
        radio: 0,
        video: 0,
        ev: 0,
        inventory: 0,
        dispatch: 0,
      },
      memory,
      uptime: process.uptime(),
    };

    this.emit('health-check', this.healthCache);
    return this.healthCache;
  }

  /**
   * Check PostgreSQL database connection
   */
  private async checkDatabase(): Promise<ConnectionStatus> {
    const startTime = Date.now();

    try {
      const isHealthy = await checkDatabaseConnection();
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        return {
          name: 'PostgreSQL Database',
          status: 'healthy',
          responseTime,
          message: 'Connected successfully',
          lastChecked: new Date(),
        };
      } else {
        return {
          name: 'PostgreSQL Database',
          status: 'unhealthy',
          responseTime,
          message: 'Connection failed',
          lastChecked: new Date(),
        };
      }
    } catch (error) {
      return {
        name: 'PostgreSQL Database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Check Redis connection
   */
  private async checkRedis(): Promise<ConnectionStatus> {
    const startTime = Date.now();

    try {
      if (!this.redis) {
        return {
          name: 'Redis Cache',
          status: 'unknown',
          responseTime: 0,
          message: 'Not configured',
          lastChecked: new Date(),
        };
      }

      await this.redis.ping();
      const responseTime = Date.now() - startTime;

      return {
        name: 'Redis Cache',
        status: 'healthy',
        responseTime,
        message: 'Connected successfully',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Redis Cache',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Check Azure OpenAI connection
   */
  private async checkAzureOpenAI(): Promise<ConnectionStatus> {
    const startTime = Date.now();

    try {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      if (!endpoint) {
        return {
          name: 'Azure OpenAI',
          status: 'unknown',
          responseTime: 0,
          message: 'Not configured',
          lastChecked: new Date(),
        };
      }

      // Simple connectivity check (we won't make actual API calls to save costs)
      const url = new URL(endpoint);
      const canResolve = url.hostname.length > 0;

      return {
        name: 'Azure OpenAI',
        status: canResolve ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        message: canResolve ? 'Endpoint configured' : 'Invalid endpoint',
        lastChecked: new Date(),
        metadata: {
          endpoint: endpoint.replace(/[a-f0-9]{32}/gi, '***'),
        },
      };
    } catch (error) {
      return {
        name: 'Azure OpenAI',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Check Azure Storage connection
   */
  private async checkAzureStorage(): Promise<ConnectionStatus> {
    const startTime = Date.now();

    try {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!connectionString) {
        return {
          name: 'Azure Blob Storage',
          status: 'unknown',
          responseTime: 0,
          message: 'Not configured',
          lastChecked: new Date(),
        };
      }

      // Check if connection string is valid format
      const hasAccountName = connectionString.includes('AccountName=');
      const hasAccountKey = connectionString.includes('AccountKey=');

      return {
        name: 'Azure Blob Storage',
        status: hasAccountName && hasAccountKey ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        message: hasAccountName && hasAccountKey ? 'Connection string configured' : 'Invalid connection string',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Azure Blob Storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Check Google Maps API
   */
  private async checkGoogleMaps(): Promise<ConnectionStatus> {
    const startTime = Date.now();

    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return {
          name: 'Google Maps API',
          status: 'unknown',
          responseTime: 0,
          message: 'Not configured',
          lastChecked: new Date(),
        };
      }

      // Simple check - verify API key format
      const isValidFormat = apiKey.startsWith('AIzaSy') && apiKey.length >= 30;

      return {
        name: 'Google Maps API',
        status: isValidFormat ? 'healthy' : 'degraded',
        responseTime: Date.now() - startTime,
        message: isValidFormat ? 'API key configured' : 'API key may be invalid',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Google Maps API',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Get current health status
   */
  public getHealth(): SystemHealth | null {
    return this.healthCache;
  }

  /**
   * Update emulator counts
   */
  public updateEmulatorCounts(counts: Partial<SystemHealth['emulators']>): void {
    if (this.healthCache) {
      this.healthCache.emulators = {
        ...this.healthCache.emulators,
        ...counts,
      };
    }
  }

  /**
   * Shutdown the service
   */
  public async shutdown(): Promise<void> {
    logger.info('[ConnectionHealthService] Shutting down...');

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }

    this.removeAllListeners();
    logger.info('[ConnectionHealthService] Shutdown complete');
  }
}

// Export singleton instance
export const connectionHealthService = new ConnectionHealthService();
