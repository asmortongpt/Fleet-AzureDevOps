/**
 * Enterprise-Grade Redis Cache Manager
 * Implements: Multi-layer caching, smart invalidation, cache warming, and performance monitoring
 */

import { createHash } from 'crypto'
import { EventEmitter } from 'events'
import { performance } from 'perf_hooks'

import Redis, { RedisOptions } from 'ioredis'
import pLimit from 'p-limit'

// Cache configuration types
interface CacheConfig {
  defaultTTL: number
  maxMemory: string
  evictionPolicy: 'lru' | 'lfu' | 'volatile-lru' | 'allkeys-lru'
  cluster?: boolean
  sentinels?: Array<{ host: string; port: number }>
  enableCompression?: boolean
  enableStatistics?: boolean
}

interface CacheEntry<T> {
  data: T
  metadata: {
    createdAt: number
    accessCount: number
    lastAccessedAt: number
    ttl: number
    tags: string[]
    compressed: boolean
    version: string
  }
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  avgGetTime: number
  avgSetTime: number
  memoryUsage: number
  keyCount: number
  hitRate: number
}

// Cache invalidation strategies
enum InvalidationStrategy {
  IMMEDIATE = 'immediate',
  LAZY = 'lazy',
  SCHEDULED = 'scheduled',
  EVENT_DRIVEN = 'event-driven',
  CASCADE = 'cascade'
}

// Cache key patterns for different data types
export class CacheKeyBuilder {
  static damageReport(id: string): string {
    return `damage:report:${id}`
  }

  static damageReportList(filters: Record<string, any>): string {
    const hash = this.hashObject(filters)
    return `damage:reports:list:${hash}`
  }

  static vehicleStats(vehicleId: number): string {
    return `vehicle:stats:${vehicleId}`
  }

  static userSession(userId: string): string {
    return `session:user:${userId}`
  }

  static apiResponse(endpoint: string, params: Record<string, any>): string {
    const hash = this.hashObject({ endpoint, ...params })
    return `api:response:${hash}`
  }

  static model3D(modelId: string): string {
    return `model:3d:${modelId}`
  }

  static geoSpatialQuery(lat: number, lng: number, radius: number): string {
    return `geo:${lat}:${lng}:${radius}`
  }

  private static hashObject(obj: Record<string, any>): string {
    const sortedStr = JSON.stringify(this.sortObject(obj))
    return createHash('sha256').update(sortedStr).digest('hex').substring(0, 16)
  }

  private static sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(item => this.sortObject(item))

    return Object.keys(obj).sort().reduce((sorted: any, key) => {
      sorted[key] = this.sortObject(obj[key])
      return sorted
    }, {})
  }
}

// Main Redis Cache Manager
export class RedisCacheManager extends EventEmitter {
  private client: Redis
  private readReplicas: Redis[] = []
  private writeClient: Redis
  private stats: CacheStats
  private config: CacheConfig
  private compressionThreshold: number = 1024 // bytes
  private concurrencyLimit: ReturnType<typeof pLimit>
  private scriptSHAs: Map<string, string> = new Map()

  constructor(config: CacheConfig) {
    super()
    this.config = config
    this.stats = this.initializeStats()
    this.concurrencyLimit = pLimit(100) // Limit concurrent operations

    // Initialize Redis clients
    this.client = this.createRedisClient(config)
    this.writeClient = this.client

    // Set up read replicas for read scaling
    if (config.cluster) {
      this.setupReadReplicas()
    }

    // Configure Redis settings
    this.configureRedis()

    // Set up monitoring
    this.setupMonitoring()
  }

  private createRedisClient(config: CacheConfig): Redis {
    const redisConfig: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'fleet:',
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    }

    if (config.sentinels) {
      redisConfig.sentinels = config.sentinels
      redisConfig.name = 'mymaster'
    }

    const client = new Redis(redisConfig)

    client.on('error', (err) => {
      this.emit('error', err)
      this.stats.errors++
    })

    client.on('connect', () => {
      this.emit('connected')
    })

    return client
  }

  private setupReadReplicas(): void {
    const replicaCount = parseInt(process.env.REDIS_READ_REPLICAS || '2')
    for (let i = 0; i < replicaCount; i++) {
      const replica = this.createRedisClient(this.config)
      replica.config('SET', 'replica-read-only', 'yes')
      this.readReplicas.push(replica)
    }
  }

  private async configureRedis(): Promise<void> {
    // Set memory policy
    await this.client.config('SET', 'maxmemory', this.config.maxMemory)
    await this.client.config('SET', 'maxmemory-policy', this.config.evictionPolicy)

    // Enable keyspace notifications for cache invalidation
    await this.client.config('SET', 'notify-keyspace-events', 'Ex')

    // Set up Lua scripts for atomic operations
    this.registerLuaScripts()
  }

  private initializeStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      avgGetTime: 0,
      avgSetTime: 0,
      memoryUsage: 0,
      keyCount: 0,
      hitRate: 0
    }
  }

  // Core cache operations with performance tracking
  async get<T>(key: string, options?: { parse?: boolean }): Promise<T | null> {
    const startTime = performance.now()

    try {
      // Use read replica for get operations
      const client = this.selectReadClient()
      const value = await client.get(key)

      const duration = performance.now() - startTime
      this.updateStats('get', duration, !!value)

      if (!value) {
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(value)

      // Update access metadata
      entry.metadata.accessCount++
      entry.metadata.lastAccessedAt = Date.now()

      // Async update metadata without blocking
      this.updateMetadata(key, entry).catch(err =>
        this.emit('error', { type: 'metadata_update', error: err })
      )

      // Decompress if needed
      if (entry.metadata.compressed && entry.data) {
        entry.data = await this.decompress(entry.data as unknown as Buffer)
      }

      return entry.data
    } catch (error) {
      this.stats.errors++
      this.emit('error', { type: 'get', key, error })
      return null
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number
      tags?: string[]
      compress?: boolean
      invalidationStrategy?: InvalidationStrategy
    }
  ): Promise<boolean> {
    const startTime = performance.now()

    try {
      const ttl = options?.ttl || this.config.defaultTTL
      let dataToStore: any = value

      // Compress large values
      const shouldCompress = options?.compress !== false &&
        this.config.enableCompression &&
        JSON.stringify(value).length > this.compressionThreshold

      if (shouldCompress) {
        dataToStore = await this.compress(value)
      }

      const entry: CacheEntry<T> = {
        data: dataToStore as T,
        metadata: {
          createdAt: Date.now(),
          accessCount: 0,
          lastAccessedAt: Date.now(),
          ttl,
          tags: options?.tags || [],
          compressed: shouldCompress,
          version: this.generateVersion()
        }
      }

      const success = await this.writeClient.setex(
        key,
        ttl,
        JSON.stringify(entry)
      )

      // Set up invalidation
      if (options?.invalidationStrategy) {
        await this.setupInvalidation(key, options.invalidationStrategy, options.tags)
      }

      // Index by tags for grouped invalidation
      if (options?.tags && options.tags.length > 0) {
        await this.indexByTags(key, options.tags)
      }

      const duration = performance.now() - startTime
      this.updateStats('set', duration, true)

      return success === 'OK'
    } catch (error) {
      this.stats.errors++
      this.emit('error', { type: 'set', key, error })
      return false
    }
  }

  async delete(key: string | string[]): Promise<number> {
    try {
      const keys = Array.isArray(key) ? key : [key]
      const deleted = await this.writeClient.del(...keys)

      this.stats.deletes += deleted

      // Clean up tag indexes
      await this.cleanupTagIndexes(keys)

      return deleted
    } catch (error) {
      this.stats.errors++
      this.emit('error', { type: 'delete', key, error })
      return 0
    }
  }

  // Smart invalidation methods
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0

    for (const tag of tags) {
      const keys = await this.client.smembers(`tag:${tag}`)
      if (keys.length > 0) {
        const deleted = await this.delete(keys)
        totalDeleted += deleted

        // Clean up tag index
        await this.client.del(`tag:${tag}`)
      }
    }

    this.emit('invalidation', { type: 'tags', tags, count: totalDeleted })
    return totalDeleted
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    const keys = await this.scanKeys(pattern)
    if (keys.length === 0) return 0

    const deleted = await this.delete(keys)
    this.emit('invalidation', { type: 'pattern', pattern, count: deleted })

    return deleted
  }

  async cascadeInvalidate(rootKey: string): Promise<number> {
    // Get dependent keys
    const dependents = await this.client.smembers(`deps:${rootKey}`)
    const allKeys = [rootKey, ...dependents]

    const deleted = await this.delete(allKeys)

    // Clean up dependency tracking
    await this.client.del(`deps:${rootKey}`)

    this.emit('invalidation', { type: 'cascade', rootKey, count: deleted })
    return deleted
  }

  // Cache warming strategies
  async warmCache(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const warmingTasks = keys.map(key =>
      this.concurrencyLimit(async () => {
        const cached = await this.get(key)
        if (!cached) {
          const data = await fetcher(key)
          if (data) {
            await this.set(key, data)
          }
        }
      })
    )

    await Promise.all(warmingTasks)
    this.emit('cache-warmed', { count: keys.length })
  }

  // Multi-get with automatic batching
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>()

    // Batch keys for efficiency
    const batchSize = 100
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)
      const values = await this.client.mget(...batch)

      batch.forEach((key, index) => {
        if (values[index]) {
          try {
            const entry: CacheEntry<T> = JSON.parse(values[index] as string)
            results.set(key, entry.data)
          } catch {
            results.set(key, null)
          }
        } else {
          results.set(key, null)
        }
      })
    }

    return results
  }

  // Distributed locking for cache stampede prevention
  async acquireLock(resource: string, ttl: number = 5000): Promise<string | null> {
    const lockId = this.generateLockId()
    const lockKey = `lock:${resource}`

    const acquired = await this.client.set(
      lockKey,
      lockId,
      'PX',
      ttl,
      'NX'
    )

    return acquired ? lockId : null
  }

  async releaseLock(resource: string, lockId: string): Promise<boolean> {
    const lockKey = `lock:${resource}`

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `

    const result = await this.client.eval(script, 1, lockKey, lockId) as number
    return result === 1
  }

  // Cache-aside pattern with stampede protection
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; lockTimeout?: number }
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Acquire lock to prevent stampede
    const lockId = await this.acquireLock(key, options?.lockTimeout || 5000)
    if (!lockId) {
      // Another process is fetching, wait and retry
      await new Promise(resolve => setTimeout(resolve, 100))
      return this.getOrSet(key, fetcher, options)
    }

    try {
      // Double-check after acquiring lock
      const cachedAgain = await this.get<T>(key)
      if (cachedAgain !== null) {
        return cachedAgain
      }

      // Fetch fresh data
      const data = await fetcher()

      // Cache the result
      await this.set(key, data, { ttl: options?.ttl })

      return data
    } finally {
      await this.releaseLock(key, lockId)
    }
  }

  // Helper methods
  private selectReadClient(): Redis {
    if (this.readReplicas.length > 0) {
      const index = Math.floor(Math.random() * this.readReplicas.length)
      return this.readReplicas[index]
    }
    return this.client
  }

  private async updateMetadata<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Update only if key still exists
    const exists = await this.client.exists(key)
    if (exists) {
      const ttl = await this.client.ttl(key)
      if (ttl > 0) {
        await this.client.setex(key, ttl, JSON.stringify(entry))
      }
    }
  }

  private async indexByTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.client.pipeline()
    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key)
    }
    await pipeline.exec()
  }

  private async cleanupTagIndexes(keys: string[]): Promise<void> {
    // This would need to track which tags each key belongs to
    // For simplicity, scanning all tags
    const tags = await this.scanKeys('tag:*')
    const pipeline = this.client.pipeline()

    for (const tag of tags) {
      for (const key of keys) {
        pipeline.srem(tag, key)
      }
    }

    await pipeline.exec()
  }

  private async setupInvalidation(
    key: string,
    strategy: InvalidationStrategy,
    tags?: string[]
  ): Promise<void> {
    switch (strategy) {
      case InvalidationStrategy.EVENT_DRIVEN:
        // Set up pub/sub for this key
        this.client.subscribe(`invalidate:${key}`)
        break

      case InvalidationStrategy.CASCADE:
        // Track dependencies
        if (tags) {
          for (const tag of tags) {
            await this.client.sadd(`deps:${tag}`, key)
          }
        }
        break

      case InvalidationStrategy.SCHEDULED:
        // Use Redis keyspace notifications
        // Already configured in configureRedis()
        break
    }
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = []
    let cursor = '0'

    do {
      const [newCursor, batch] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      )
      cursor = newCursor
      keys.push(...batch)
    } while (cursor !== '0')

    return keys
  }

  private generateVersion(): string {
    return Date.now().toString(36)
  }

  private generateLockId(): string {
    return `${process.pid}:${Date.now()}:${Math.random().toString(36)}`
  }

  private async compress(data: any): Promise<Buffer> {
    // Implementation would use zlib or similar
    // Placeholder for actual compression
    return Buffer.from(JSON.stringify(data))
  }

  private async decompress(data: Buffer): Promise<unknown> {
    // Implementation would use zlib or similar
    // Placeholder for actual decompression
    return JSON.parse(data.toString())
  }

  private updateStats(operation: 'get' | 'set', duration: number, success: boolean): void {
    if (operation === 'get') {
      if (success) {
        this.stats.hits++
      } else {
        this.stats.misses++
      }
      this.stats.avgGetTime = (this.stats.avgGetTime + duration) / 2
    } else {
      this.stats.sets++
      this.stats.avgSetTime = (this.stats.avgSetTime + duration) / 2
    }

    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses)
  }

  private setupMonitoring(): void {
    // Report stats every minute
    setInterval(async () => {
      const info = await this.client.info('memory')
      const memoryUsage = this.parseMemoryUsage(info)
      const keyCount = await this.client.dbsize()

      this.stats.memoryUsage = memoryUsage
      this.stats.keyCount = keyCount

      this.emit('stats', this.stats)

      // Reset rolling averages
      this.stats.avgGetTime = 0
      this.stats.avgSetTime = 0
    }, 60000)
  }

  private parseMemoryUsage(info: string): number {
    const match = info.match(/used_memory:(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  private registerLuaScripts(): void {
    // Register commonly used Lua scripts for atomic operations
    const scripts = {
      conditionalSet: `
        local key = KEYS[1]
        local value = ARGV[1]
        local ttl = ARGV[2]
        local condition = ARGV[3]

        local current = redis.call('get', key)
        if condition == 'nx' and current then
          return 0
        elseif condition == 'xx' and not current then
          return 0
        end

        redis.call('setex', key, ttl, value)
        return 1
      `,

      incrementWithLimit: `
        local key = KEYS[1]
        local increment = tonumber(ARGV[1])
        local limit = tonumber(ARGV[2])

        local current = tonumber(redis.call('get', key) or '0')
        if current + increment > limit then
          return nil
        end

        return redis.call('incrby', key, increment)
      `
    }

    // Store script SHA hashes for later use
    Object.entries(scripts).forEach(([name, script]) => {
      this.client.script('LOAD', script).then(sha => {
        this.scriptSHAs.set(name, sha as string)
      })
    })
  }

  // Cleanup
  async disconnect(): Promise<void> {
    await this.client.quit()
    for (const replica of this.readReplicas) {
      await replica.quit()
    }
  }

  // Get statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }
}

// Export singleton instance
export const cacheManager = new RedisCacheManager({
  defaultTTL: 3600,
  maxMemory: '2gb',
  evictionPolicy: 'allkeys-lru',
  cluster: process.env.NODE_ENV === 'production',
  enableCompression: true,
  enableStatistics: true
})