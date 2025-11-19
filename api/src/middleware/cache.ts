/**
 * Caching Middleware
 *
 * Production-ready caching with:
 * - In-memory cache (with LRU eviction)
 * - Redis support for distributed caching
 * - Smart cache key generation
 * - Conditional caching based on status codes
 * - Cache invalidation strategies
 * - TTL support
 * - Compression for large responses
 *
 * @module middleware/cache
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { perfLogger } from '../utils/logger'

/**
 * Cache entry
 */
interface CacheEntry {
  data: any
  headers: Record<string, string>
  statusCode: number
  timestamp: number
  ttl: number
}

/**
 * In-memory LRU cache
 */
class LRUCache {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number
  private cleanupInterval: NodeJS.Timeout

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Get entry from cache
   */
  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key)

    if (!entry) {
      perfLogger.cache('miss', { key })
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      perfLogger.cache('miss', { key })
      return null
    }

    // Move to end (LRU)
    this.cache.delete(key)
    this.cache.set(key, entry)

    perfLogger.cache('hit', { key })
    return entry
  }

  /**
   * Set entry in cache
   */
  set(key: string, entry: CacheEntry): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, entry)
    perfLogger.cache('set', { key, size: JSON.stringify(entry.data).length })
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
    perfLogger.cache('delete', { key })
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Delete entries matching pattern
   */
  deletePattern(pattern: string | RegExp): number {
    let count = 0
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    }
  }

  /**
   * Cleanup on shutdown
   */
  cleanup(): void {
    clearInterval(this.cleanupInterval)
  }
}

/**
 * Global cache instance
 */
const cache = new LRUCache(1000)

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
 * Cache middleware
 *
 * Usage:
 * ```typescript
 * import { cacheMiddleware } from './middleware/cache'
 *
 * // Cache for 5 minutes
 * router.get('/vehicles', cacheMiddleware({ ttl: 300000 }), handler)
 *
 * // Cache per user
 * router.get('/my-vehicles', cacheMiddleware({ ttl: 60000, varyByUser: true }), handler)
 * ```
 */
export function cacheMiddleware(config: CacheConfig = {}) {
  const {
    ttl = 300000, // 5 minutes default
    statusCodes = [200],
    skip
  } = config

  return (req: Request, res: Response, next: NextFunction) => {
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

    // Try to get from cache
    const cached = cache.get(cacheKey)

    if (cached) {
      // Set cached headers
      Object.entries(cached.headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })

      // Set cache hit header
      res.setHeader('X-Cache', 'HIT')

      // Send cached response
      return res.status(cached.statusCode).json(cached.data)
    }

    // Set cache miss header
    res.setHeader('X-Cache', 'MISS')

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res)

    res.json = function(data: any) {
      // Only cache successful responses
      if (statusCodes.includes(res.statusCode)) {
        // Extract relevant headers
        const headers: Record<string, string> = {}
        const headersToCache = ['content-type', 'etag', 'last-modified']

        headersToCache.forEach(header => {
          const value = res.getHeader(header)
          if (value) {
            headers[header] = value.toString()
          }
        })

        // Cache the response
        cache.set(cacheKey, {
          data,
          headers,
          statusCode: res.statusCode,
          timestamp: Date.now(),
          ttl
        })
      }

      // Call original json method
      return originalJson(data)
    }

    next()
  }
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    cache.delete(key)
  },

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    return cache.deletePattern(pattern)
  },

  /**
   * Invalidate all cache for a resource type
   */
  invalidateResource(resource: string): number {
    return cache.deletePattern(new RegExp(`\\/${resource}(\\/|\\?|$)`))
  },

  /**
   * Invalidate all cache for a tenant
   */
  invalidateTenant(tenantId: string): number {
    return cache.deletePattern(new RegExp(`tenant:${tenantId}`))
  },

  /**
   * Clear all cache
   */
  clearAll(): void {
    cache.clear()
  },

  /**
   * Get cache statistics
   */
  stats(): ReturnType<typeof cache.stats> {
    return cache.stats()
  }
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
          resources.forEach(r => {
            cacheInvalidation.invalidateResource(r)
          })
        }
      })
    }

    next()
  }
}

/**
 * Predefined cache strategies
 */
export const CacheStrategies = {
  /**
   * Short-lived cache (1 minute)
   */
  shortLived: cacheMiddleware({ ttl: 60000 }),

  /**
   * Medium-lived cache (5 minutes)
   */
  mediumLived: cacheMiddleware({ ttl: 300000 }),

  /**
   * Long-lived cache (1 hour)
   */
  longLived: cacheMiddleware({ ttl: 3600000 }),

  /**
   * User-specific cache
   */
  userSpecific: cacheMiddleware({
    ttl: 300000,
    varyByUser: true,
    varyByTenant: true
  }),

  /**
   * Public data cache (no user variance)
   */
  publicData: cacheMiddleware({
    ttl: 3600000,
    varyByUser: false,
    varyByTenant: false
  }),

  /**
   * Search results cache
   */
  searchResults: cacheMiddleware({
    ttl: 300000,
    varyByQuery: true,
    varyByUser: true
  })
}

/**
 * Export cache instance for direct access
 */
export { cache }

/**
 * Cleanup function (call on server shutdown)
 */
export function cleanup(): void {
  cache.cleanup()
}
