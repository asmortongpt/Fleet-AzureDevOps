/**
 * Redis-Based Caching Middleware
 *
 * Production-ready caching with:
 * - Redis distributed caching
 * - Smart cache key generation
 * - Conditional caching based on status codes
 * - Cache invalidation strategies
 * - TTL support
 * - Performance metrics
 *
 * @module middleware/cache
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import redisClient from '../config/redis'
import logger from '../utils/logger'

/**
 * Cache entry
 */
interface CacheEntry {
  data: any
  headers: Record<string, string>
  statusCode: number
  timestamp: number
}

/**
 * Cache configuration
 */
interface CacheConfig {
  /**
   * Time to live in milliseconds
   */
  ttl?: number

  /**
   * Custom cache key generator
   */
  keyGenerator?: (req: Request) => string

  /**
   * Only cache responses with these status codes
   */
  statusCodes?: number[]

  /**
   * Skip caching for certain conditions
   */
  skip?: (req: Request, res: Response) => boolean

  /**
   * Vary by query parameters
   */
  varyByQuery?: boolean

  /**
   * Vary by user
   */
  varyByUser?: boolean

  /**
   * Vary by tenant
   */
  varyByTenant?: boolean
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, config: CacheConfig = {}): string {
  const parts: string[] = [
    req.method,
    req.path
  ]

  // Include query parameters
  if (config.varyByQuery !== false && Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&')
    parts.push(sortedQuery)
  }

  // Include user ID
  if (config.varyByUser && (req as any).user?.id) {
    parts.push(`user:${(req as any).user.id}`)
  }

  // Include tenant ID
  if (config.varyByTenant && (req as any).user?.tenant_id) {
    parts.push(`tenant:${(req as any).user.tenant_id}`)
  }

  // Use custom key generator if provided
  if (config.keyGenerator) {
    return config.keyGenerator(req)
  }

  // Generate hash of parts
  const key = parts.join('|')
  return crypto.createHash('md5').update(key).digest('hex')
}

/**
 * Cache middleware using Redis
 *
 * Usage:
 * ```typescript
 * import { cacheMiddleware } from './middleware/cache'
 *
 * // Cache for 5 minutes (300 seconds)
 * router.get('/vehicles', cacheMiddleware({ ttl: 300 }), handler)
 *
 * // Cache per user
 * router.get('/my-vehicles', cacheMiddleware({ ttl: 60, varyByUser: true }), handler)
 * ```
 */
export function cacheMiddleware(config: CacheConfig = {}) {
  const {
    ttl = 300, // 5 minutes default (in seconds)
    statusCodes = [200],
    skip
  } = config

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET and HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next()
    }

    // Check skip condition
    if (skip && skip(req, res)) {
      return next()
    }

    // Generate cache key
    const cacheKey = generateCacheKey(req, config)
    const startTime = Date.now()

    try {
      // Try to get from Redis cache
      const cachedData = await redisClient.get(cacheKey)

      if (cachedData) {
        const cached: CacheEntry = JSON.parse(cachedData)
        const duration = Date.now() - startTime

        logger.debug(`Cache HIT: ${cacheKey} (${duration}ms)`)

        // Set cached headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.setHeader(key, value)
        })

        // Set cache metadata headers
        res.setHeader('X-Cache', 'HIT')
        res.setHeader('X-Cache-Key', cacheKey)
        res.setHeader('X-Response-Time', '${duration}ms`)

        // Send cached response
        return res.status(cached.statusCode).json(cached.data)
      }

      // Cache MISS
      logger.debug(`Cache MISS: ${cacheKey}`)
      res.setHeader('X-Cache', 'MISS')

      // Intercept res.json to cache the response
      const originalJson = res.json.bind(res)

      res.json = function (data: any) {
        const duration = Date.now() - startTime

        // Only cache successful responses
        if (statusCodes.includes(res.statusCode)) {
          // Extract relevant headers
          const headers: Record<string, string> = {}
          const headersToCache = ['content-type', 'etag', 'last-modified']

          headersToCache.forEach((header) => {
            const value = res.getHeader(header)
            if (value) {
              headers[header] = value.toString()
            }
          })

          // Cache the response asynchronously (don't block)
          const cacheEntry: CacheEntry = {
            data,
            headers,
            statusCode: res.statusCode,
            timestamp: Date.now(),
          }

          redisClient
            .setex(cacheKey, ttl, JSON.stringify(cacheEntry))
            .then(() => {
              logger.debug(`Cached response: ${cacheKey} (TTL: ${ttl}s)`)
            })
            .catch((err) => {
              logger.error(`Error caching response for ${cacheKey}:`, err)
            })
        }

        res.setHeader('X-Response-Time', '${duration}ms`)
        return originalJson(data)
      }

      next()
    } catch (error) {
      // On cache error, continue without caching
      logger.error(`Cache middleware error for ${cacheKey}:`, error)
      res.setHeader('X-Cache', 'ERROR')
      next()
    }
  }
}

/**
 * Cache invalidation helpers using Redis
 */
export const cacheInvalidation = {
  /**
   * Invalidate specific cache entry
   */
  async invalidate(key: string): Promise<void> {
    try {
      await redisClient.del(key)
      logger.debug(`Invalidated cache key: ${key}`)
    } catch (error) {
      logger.error(`Error invalidating cache key ${key}:`, error)
    }
  },

  /**
   * Invalidate all cache entries matching pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern)
      if (keys.length === 0) {
        logger.debug(`No cache keys found matching pattern: ${pattern}`)
        return 0
      }
      const count = await redisClient.del(...keys)
      logger.info(`Invalidated ${count} cache keys matching pattern: ${pattern}`)
      return count
    } catch (error) {
      logger.error(`Error invalidating cache pattern ${pattern}:`, error)
      return 0
    }
  },

  /**
   * Invalidate all cache for a resource type
   */
  async invalidateResource(resource: string): Promise<number> {
    const pattern = `*${resource}*`
    return await this.invalidatePattern(pattern)
  },

  /**
   * Invalidate all cache for a tenant
   */
  async invalidateTenant(tenantId: string): Promise<number> {
    const pattern = `*tenant:${tenantId}*`
    return await this.invalidatePattern(pattern)
  },

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      await redisClient.flushdb()
      logger.info('Cleared all cache from current database')
    } catch (error) {
      logger.error('Error clearing all cache:', error)
    }
  },

  /**
   * Get cache statistics
   */
  async stats(): Promise<any> {
    try {
      const info = await redisClient.info('stats')
      const keyspace = await redisClient.info('keyspace')
      const memory = await redisClient.info('memory')

      // Parse keyspace info to get key count
      const dbMatch = keyspace.match(/db0:keys=(\d+)/)
      const keyCount = dbMatch ? parseInt(dbMatch[1], 10) : 0

      // Parse hits and misses
      const hitsMatch = info.match(/keyspace_hits:(\d+)/)
      const missesMatch = info.match(/keyspace_misses:(\d+)/)
      const hits = hitsMatch ? parseInt(hitsMatch[1], 10) : 0
      const misses = missesMatch ? parseInt(missesMatch[1], 10) : 0
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0

      // Parse memory usage
      const memoryMatch = memory.match(/used_memory_human:(.+)/)
      const memoryUsed = memoryMatch ? memoryMatch[1].trim() : 'N/A'

      return {
        keyCount,
        hits,
        misses,
        hitRate: hitRate.toFixed(2) + '%',
        memoryUsed,
      }
    } catch (error) {
      logger.error('Error getting cache stats:', error)
      return null
    }
  },
}

/**
 * Middleware to invalidate cache on write operations
 *
 * Usage:
 * ```typescript
 * router.post('/vehicles', invalidateOnWrite('vehicles'), handler)
 * router.put('/vehicles/:id', invalidateOnWrite('vehicles'), handler)
 * router.delete('/vehicles/:id', invalidateOnWrite('vehicles'), handler)
 * ```
 */
export function invalidateOnWrite(resource: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate for write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Hook into response finish to invalidate after successful write
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const resources = Array.isArray(resource) ? resource : [resource]
          resources.forEach((r) => {
            cacheInvalidation
              .invalidateResource(r)
              .catch((err) => logger.error(`Error invalidating ${r}:`, err))
          })
        }
      })
    }

    next()
  }
}

/**
 * Predefined cache strategies (TTL in seconds for Redis)
 */
export const CacheStrategies = {
  /**
   * Short-lived cache (30 seconds) - for real-time data
   */
  realtime: cacheMiddleware({ ttl: 30 }),

  /**
   * Short-lived cache (1 minute) - for frequently changing data
   */
  shortLived: cacheMiddleware({ ttl: 60 }),

  /**
   * Medium-lived cache (5 minutes) - for standard endpoints
   */
  mediumLived: cacheMiddleware({ ttl: 300 }),

  /**
   * Long-lived cache (1 hour) - for static data
   */
  longLived: cacheMiddleware({ ttl: 3600 }),

  /**
   * User-specific cache (5 minutes)
   */
  userSpecific: cacheMiddleware({
    ttl: 300,
    varyByUser: true,
    varyByTenant: true,
  }),

  /**
   * Public data cache (1 hour, no user variance)
   */
  publicData: cacheMiddleware({
    ttl: 3600,
    varyByUser: false,
    varyByTenant: false,
  }),

  /**
   * Search results cache (5 minutes)
   */
  searchResults: cacheMiddleware({
    ttl: 300,
    varyByQuery: true,
    varyByUser: true,
  }),
}

/**
 * Cleanup function (call on server shutdown)
 */
export async function cleanup(): Promise<void> {
  try {
    await redisClient.quit()
    logger.info('Redis cache connection closed')
  } catch (error) {
    logger.error('Error closing Redis cache connection:', error)
  }
}
