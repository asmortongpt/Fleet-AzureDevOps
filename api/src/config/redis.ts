import Redis from 'ioredis'
import logger from '../utils/logger'

/**
 * Redis Configuration and Client Setup
 *
 * Provides:
 * - Connection management with retry logic
 * - Error handling and logging
 * - Graceful shutdown
 * - Health check capabilities
 */

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000)
    logger.warn(`Redis connection retry attempt ${times}, waiting ${delay}ms`)
    return delay
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
}

// Create Redis client
const redisClient = new Redis(REDIS_CONFIG)

// Connection event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected successfully')
})

redisClient.on('ready', () => {
  logger.info('Redis client ready to accept commands')
})

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err)
})

redisClient.on('close', () => {
  logger.warn('Redis connection closed')
})

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting...')
})

redisClient.on('end', () => {
  logger.warn('Redis connection ended')
})

/**
 * Check if Redis is connected and ready
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const pong = await redisClient.ping()
    return pong === 'PONG'
  } catch (error) {
    logger.error('Redis health check failed:', error)
    return false
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    await redisClient.quit()
    logger.info('Redis connection closed gracefully')
  } catch (error) {
    logger.error('Error closing Redis connection:', error)
    redisClient.disconnect()
  }
}

/**
 * Get Redis connection stats
 */
export async function getRedisStats() {
  try {
    const info = await redisClient.info('stats')
    const memory = await redisClient.info('memory')
    return {
      info,
      memory,
      connected: redisClient.status === 'ready',
    }
  } catch (error) {
    logger.error('Error getting Redis stats:', error)
    return null
  }
}

export default redisClient
