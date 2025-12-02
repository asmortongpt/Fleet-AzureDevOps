/**
 * Redis Client Configuration
 *
 * Singleton Redis client for rate limiting and caching
 * Supports both development (local Redis) and production (Azure Redis Cache)
 */

import Redis from 'ioredis';
import { redisConfig } from '../config/rate-limit.config';

/**
 * Logger utility for Redis operations
 */
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[Redis] ${message}`, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[Redis] ${message}`, meta || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Redis] ${message}`, error || '');
  },
};

/**
 * Redis client instance (singleton)
 */
let redisClient: Redis | null = null;

/**
 * Connection state tracking
 */
let isConnecting = false;
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 10;

/**
 * Create and configure Redis client
 *
 * @returns Redis client instance
 */
export const createRedisClient = (): Redis => {
  if (redisClient && isConnected) {
    return redisClient;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    logger.warn('Redis connection already in progress');
    return redisClient as Redis;
  }

  isConnecting = true;
  connectionAttempts++;

  logger.info('Creating Redis client', {
    url: redisConfig.url.replace(/:[^:]*@/, ':***@'), // Mask password in logs
    attempt: connectionAttempts,
  });

  // Create Redis client with configuration
  redisClient = new Redis(redisConfig.url, {
    password: redisConfig.password,
    retryStrategy: (times: number) => {
      if (times > MAX_CONNECTION_ATTEMPTS) {
        logger.error(`Redis connection failed after ${MAX_CONNECTION_ATTEMPTS} attempts`);
        return null; // Stop retrying
      }

      const delay = Math.min(times * 100, 3000);
      logger.warn(`Redis connection retry ${times} in ${delay}ms`);
      return delay;
    },
    reconnectOnError: (err) => {
      logger.warn('Redis reconnect on error', { error: err.message });
      // Reconnect on READONLY errors (replica promotion)
      return err.message.includes('READONLY');
    },
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: false, // Connect immediately
  });

  // Event: Connection successful
  redisClient.on('connect', () => {
    logger.info('Redis client connected');
    isConnecting = false;
    isConnected = true;
    connectionAttempts = 0;
  });

  // Event: Ready to accept commands
  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  // Event: Connection error
  redisClient.on('error', (error) => {
    logger.error('Redis client error', {
      message: error.message,
      code: (error as any).code,
    });

    // If rate limiting is critical, consider crashing the application
    // For now, we'll continue without Redis (in-memory fallback)
    if (process.env.REDIS_REQUIRED === 'true') {
      logger.error('Redis is required but unavailable. Application will exit.');
      process.exit(1);
    }
  });

  // Event: Connection closed
  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
    isConnected = false;
  });

  // Event: Reconnecting
  redisClient.on('reconnecting', (delay: number) => {
    logger.info(`Redis reconnecting in ${delay}ms`);
  });

  // Event: Connection ended (no more reconnects)
  redisClient.on('end', () => {
    logger.warn('Redis connection ended permanently');
    isConnected = false;
    isConnecting = false;
  });

  return redisClient;
};

/**
 * Get existing Redis client or create new one
 *
 * @returns Redis client instance
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
};

/**
 * Check if Redis is connected and available
 *
 * @returns true if Redis is connected
 */
export const isRedisAvailable = (): boolean => {
  return isConnected && redisClient !== null;
};

/**
 * Ping Redis to check connection
 *
 * @returns true if ping successful
 */
export const pingRedis = async (): Promise<boolean> => {
  try {
    if (!redisClient) {
      return false;
    }

    const response = await redisClient.ping();
    return response === 'PONG';
  } catch (error) {
    logger.error('Redis ping failed', error);
    return false;
  }
};

/**
 * Get Redis client statistics
 *
 * @returns Redis stats object
 */
export const getRedisStats = async (): Promise<Record<string, any>> => {
  try {
    if (!redisClient || !isConnected) {
      return {
        connected: false,
        error: 'Redis not connected',
      };
    }

    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbsize();

    return {
      connected: true,
      dbSize,
      info,
      uptime: info.match(/uptime_in_seconds:(\d+)/)?.[1],
      totalConnections: info.match(/total_connections_received:(\d+)/)?.[1],
      totalCommands: info.match(/total_commands_processed:(\d+)/)?.[1],
    };
  } catch (error) {
    logger.error('Failed to get Redis stats', error);
    return {
      connected: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Gracefully close Redis connection
 * Call this on application shutdown
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    logger.info('Closing Redis connection');

    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connection', error);
      // Force close if graceful quit fails
      redisClient.disconnect();
    } finally {
      redisClient = null;
      isConnected = false;
      isConnecting = false;
    }
  }
};

/**
 * Clear all rate limit data from Redis
 * WARNING: Use only in development/testing
 */
export const clearRateLimitData = async (): Promise<void> => {
  if (!redisClient || !isConnected) {
    logger.warn('Cannot clear rate limit data: Redis not connected');
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    logger.error('Cannot clear rate limit data in production');
    throw new Error('Clearing rate limit data is not allowed in production');
  }

  try {
    const keys = await redisClient.keys('rl:*');
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info(`Cleared ${keys.length} rate limit keys from Redis`);
    } else {
      logger.info('No rate limit keys to clear');
    }
  } catch (error) {
    logger.error('Failed to clear rate limit data', error);
    throw error;
  }
};

/**
 * Handle process shutdown gracefully
 */
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, closing Redis connection`);
  await closeRedisConnection();
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Export singleton instance
export default getRedisClient;
