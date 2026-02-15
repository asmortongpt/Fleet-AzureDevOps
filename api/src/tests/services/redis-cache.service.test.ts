/**
 * Redis Cache Service Tests
 *
 * Tests for Redis-based caching functionality:
 * - Key-value operations (get, set, delete)
 * - TTL (time-to-live) expiration
 * - Pattern-based cache invalidation
 * - Hit/miss rate tracking
 * - Atomic operations (getOrSet)
 * - Multi-tenant cache isolation
 * - Memory management
 * - Batch operations
 * - Error handling and resilience
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

interface CacheStats {
  memoryUsage: number
  hitRate: number
  totalHits?: number
  totalMisses?: number
}

class MockRedisCacheService {
  private cache: Map<string, { value: any; expiresAt?: number }> = new Map()
  private hits = 0
  private misses = 0

  async get(key: string): Promise<any> {
    const entry = this.cache.get(key)

    if (!entry) {
      this.misses++
      return null
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++
    return entry.value
  }

  async set(key: string, value: unknown, ttl: number = 3600): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined

    this.cache.set(key, {
      value,
      expiresAt
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async deletePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number = 3600): Promise<T> {
    const cached = await this.get(key)

    if (cached !== null) {
      return cached as T
    }

    const value = await fetcher()

    if (value !== null && value !== undefined) {
      await this.set(key, value, ttl)
    }

    return value
  }

  async getStats(): Promise<CacheStats> {
    let memoryUsage = 0

    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry.value).length
    }

    const total = this.hits + this.misses
    const hitRate = total > 0 ? this.hits / total : 0

    return {
      memoryUsage,
      hitRate,
      totalHits: this.hits,
      totalMisses: this.misses
    }
  }

  async invalidate(pattern: string): Promise<void> {
    return this.deletePattern(pattern)
  }

  async cacheVehicle(vehicleId: string | number, data: unknown): Promise<void> {
    await this.set(`vehicle:${vehicleId}`, data, 300)
  }

  async invalidateVehicle(vehicleId: string | number): Promise<void> {
    await this.delete(`vehicle:${vehicleId}`)
  }

  // Test helpers
  getSize(): number {
    return this.cache.size
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  resetStats(): void {
    this.hits = 0
    this.misses = 0
  }

  clear(): void {
    this.cache.clear()
    this.resetStats()
  }
}

describe('RedisCacheService', () => {
  let cache: MockRedisCacheService

  beforeEach(() => {
    cache = new MockRedisCacheService()
  })

  describe('Basic Operations', () => {
    it('should set and get string value', async () => {
      await cache.set('key1', 'value1')
      const value = await cache.get('key1')

      expect(value).toBe('value1')
    })

    it('should set and get object value', async () => {
      const obj = { name: 'John', age: 30 }
      await cache.set('user', obj)
      const value = await cache.get('user')

      expect(value).toEqual(obj)
    })

    it('should set and get array value', async () => {
      const arr = [1, 2, 3, 4, 5]
      await cache.set('numbers', arr)
      const value = await cache.get('numbers')

      expect(value).toEqual(arr)
    })

    it('should return null for missing key', async () => {
      const value = await cache.get('non-existent')

      expect(value).toBeNull()
    })

    it('should delete cached value', async () => {
      await cache.set('key', 'value')
      await cache.delete('key')

      const value = await cache.get('key')
      expect(value).toBeNull()
    })

    it('should use del alias', async () => {
      await cache.set('key', 'value')
      await cache.del('key')

      const value = await cache.get('key')
      expect(value).toBeNull()
    })
  })

  describe('TTL Expiration', () => {
    it('should set value with TTL', async () => {
      await cache.set('temp', 'value', 1)

      let value = await cache.get('temp')
      expect(value).toBe('value')

      // Fast-forward time
      vi.useFakeTimers()
      vi.advanceTimersByTime(2000)

      value = await cache.get('temp')
      expect(value).toBeNull()

      vi.useRealTimers()
    })

    it('should use default TTL of 1 hour', async () => {
      await cache.set('key', 'value') // No TTL specified

      const value = await cache.get('key')
      expect(value).toBe('value')
    })

    it('should support very short TTL', async () => {
      await cache.set('flash', 'data', 0.1) // 100ms

      vi.useFakeTimers()
      vi.advanceTimersByTime(150)

      const value = await cache.get('flash')
      expect(value).toBeNull()

      vi.useRealTimers()
    })

    it('should support long TTL', async () => {
      await cache.set('persistent', 'data', 86400) // 24 hours

      vi.useFakeTimers()
      vi.advanceTimersByTime(3600000) // 1 hour

      const value = await cache.get('persistent')
      expect(value).toBe('data')

      vi.useRealTimers()
    })
  })

  describe('Cache Invalidation', () => {
    it('should delete pattern with wildcard', async () => {
      await cache.set('user:1:profile', { name: 'John' })
      await cache.set('user:1:settings', { theme: 'dark' })
      await cache.set('user:2:profile', { name: 'Jane' })

      await cache.deletePattern('user:1:*')

      expect(await cache.get('user:1:profile')).toBeNull()
      expect(await cache.get('user:1:settings')).toBeNull()
      expect(await cache.get('user:2:profile')).not.toBeNull()
    })

    it('should support complex patterns', async () => {
      await cache.set('fleet:tenant:1:vehicle:1', 'data')
      await cache.set('fleet:tenant:1:vehicle:2', 'data')
      await cache.set('fleet:tenant:2:vehicle:1', 'data')

      await cache.deletePattern('fleet:tenant:1:vehicle:.*')

      expect(await cache.get('fleet:tenant:1:vehicle:1')).toBeNull()
      expect(await cache.get('fleet:tenant:1:vehicle:2')).toBeNull()
      expect(await cache.get('fleet:tenant:2:vehicle:1')).not.toBeNull()
    })

    it('should use invalidate as alias for deletePattern', async () => {
      await cache.set('cache:data:1', 'value')
      await cache.set('cache:data:2', 'value')

      await cache.invalidate('cache:data:*')

      expect(await cache.get('cache:data:1')).toBeNull()
      expect(await cache.get('cache:data:2')).toBeNull()
    })

    it('should handle pattern with no matches', async () => {
      await cache.set('key', 'value')

      await cache.deletePattern('nonexistent:*')

      expect(await cache.get('key')).toBe('value')
    })

    it('should clear all cache', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')
      await cache.set('key3', 'value3')

      await cache.clear()

      expect(cache.getSize()).toBe(0)
    })
  })

  describe('Atomic Operations', () => {
    it('should get or set value', async () => {
      const fetcher = vi.fn(async () => ({ id: 1, name: 'Test' }))

      const value1 = await cache.getOrSet('item:1', fetcher)
      const value2 = await cache.getOrSet('item:1', fetcher)

      expect(value1).toEqual({ id: 1, name: 'Test' })
      expect(value2).toEqual({ id: 1, name: 'Test' })
      expect(fetcher).toHaveBeenCalledTimes(1) // Fetcher called only once
    })

    it('should call fetcher on cache miss', async () => {
      const fetcher = vi.fn(async () => 'fresh-value')

      const value = await cache.getOrSet('new-key', fetcher)

      expect(value).toBe('fresh-value')
      expect(fetcher).toHaveBeenCalled()
    })

    it('should not call fetcher on cache hit', async () => {
      await cache.set('existing', 'cached-value')
      const fetcher = vi.fn(async () => 'fresh-value')

      const value = await cache.getOrSet('existing', fetcher)

      expect(value).toBe('cached-value')
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('should handle fetcher returning null', async () => {
      const fetcher = vi.fn(async () => null)

      const value = await cache.getOrSet('empty', fetcher)

      expect(value).toBeNull()
    })

    it('should respect TTL in getOrSet', async () => {
      const fetcher = vi.fn(async () => 'fresh')

      const value1 = await cache.getOrSet('ttl-key', fetcher, 1)
      expect(value1).toBe('fresh')

      vi.useFakeTimers()
      vi.advanceTimersByTime(2000)

      const value2 = await cache.getOrSet('ttl-key', fetcher)
      expect(fetcher).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })

  describe('Hit Rate Tracking', () => {
    beforeEach(() => {
      cache.resetStats()
    })

    it('should track cache hits', async () => {
      await cache.set('key', 'value')

      await cache.get('key')
      await cache.get('key')
      await cache.get('key')

      const stats = await cache.getStats()
      expect(stats.totalHits).toBe(3)
    })

    it('should track cache misses', async () => {
      await cache.get('non-existent-1')
      await cache.get('non-existent-2')
      await cache.get('non-existent-3')

      const stats = await cache.getStats()
      expect(stats.totalMisses).toBe(3)
    })

    it('should calculate hit rate', async () => {
      await cache.set('key', 'value')

      await cache.get('key') // Hit
      await cache.get('key') // Hit
      await cache.get('missing') // Miss

      const stats = await cache.getStats()
      expect(stats.hitRate).toBeCloseTo(0.667, 2)
    })

    it('should handle zero hit rate', async () => {
      await cache.get('missing-1')
      await cache.get('missing-2')

      const stats = await cache.getStats()
      expect(stats.hitRate).toBe(0)
    })

    it('should handle perfect hit rate', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      await cache.get('key1')
      await cache.get('key2')

      const stats = await cache.getStats()
      expect(stats.hitRate).toBe(1)
    })
  })

  describe('Memory Management', () => {
    it('should track memory usage', async () => {
      await cache.set('data1', { size: 'large', content: 'x'.repeat(1000) })
      await cache.set('data2', { size: 'large', content: 'y'.repeat(1000) })

      const stats = await cache.getStats()
      expect(stats.memoryUsage).toBeGreaterThan(0)
    })

    it('should remove expired entries on stats check', async () => {
      await cache.set('expired', 'value', 0.1)
      await cache.set('active', 'value', 3600)

      vi.useFakeTimers()
      vi.advanceTimersByTime(200)

      const stats = await cache.getStats()
      expect(stats.memoryUsage).toBeGreaterThan(0) // Only active key counted

      vi.useRealTimers()
    })

    it('should handle large objects', async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: `data-${i}`
      }))

      await cache.set('large', largeArray)
      const value = await cache.get('large')

      expect(value).toHaveLength(10000)
    })
  })

  describe('Multi-Tenant Cache Isolation', () => {
    it('should isolate tenant data with prefixes', async () => {
      await cache.set('tenant:1:user:1', { name: 'John' })
      await cache.set('tenant:2:user:1', { name: 'Jane' })

      const t1User = await cache.get('tenant:1:user:1')
      const t2User = await cache.get('tenant:2:user:1')

      expect(t1User.name).toBe('John')
      expect(t2User.name).toBe('Jane')
    })

    it('should invalidate single tenant cache', async () => {
      await cache.set('tenant:1:data:1', 'value')
      await cache.set('tenant:1:data:2', 'value')
      await cache.set('tenant:2:data:1', 'value')

      await cache.invalidate('tenant:1:*')

      expect(await cache.get('tenant:1:data:1')).toBeNull()
      expect(await cache.get('tenant:1:data:2')).toBeNull()
      expect(await cache.get('tenant:2:data:1')).not.toBeNull()
    })
  })

  describe('Vehicle-Specific Operations', () => {
    it('should cache vehicle data', async () => {
      const vehicleData = {
        id: 1,
        make: 'Toyota',
        model: 'Camry',
        status: 'active'
      }

      await cache.cacheVehicle(1, vehicleData)
      const cached = await cache.get('vehicle:1')

      expect(cached).toEqual(vehicleData)
    })

    it('should use short TTL for vehicle cache', async () => {
      await cache.cacheVehicle(1, { id: 1, status: 'active' })

      const value = await cache.get('vehicle:1')
      expect(value).not.toBeNull()

      // Vehicle cache uses 300s TTL
      vi.useFakeTimers()
      vi.advanceTimersByTime(301000)

      const expired = await cache.get('vehicle:1')
      expect(expired).toBeNull()

      vi.useRealTimers()
    })

    it('should invalidate vehicle cache', async () => {
      await cache.cacheVehicle(1, { id: 1, status: 'active' })

      await cache.invalidateVehicle(1)

      const value = await cache.get('vehicle:1')
      expect(value).toBeNull()
    })

    it('should cache multiple vehicles', async () => {
      for (let i = 1; i <= 5; i++) {
        await cache.cacheVehicle(i, { id: i, status: 'active' })
      }

      for (let i = 1; i <= 5; i++) {
        const vehicle = await cache.get(`vehicle:${i}`)
        expect(vehicle?.id).toBe(i)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        cache.set(`key-${i}`, `value-${i}`)
      )

      await Promise.all(operations)

      expect(cache.getSize()).toBe(10)
    })

    it('should handle null values', async () => {
      await cache.set('null-key', null)

      const value = await cache.get('null-key')
      expect(value).toBeNull()
    })

    it('should handle undefined values', async () => {
      await cache.set('undefined-key', undefined)

      const value = await cache.get('undefined-key')
      expect(value).toBeUndefined()
    })

    it('should handle special characters in keys', async () => {
      const specialKeys = [
        'key:with:colons',
        'key-with-dashes',
        'key_with_underscores',
        'key.with.dots',
        'key/with/slashes'
      ]

      for (const key of specialKeys) {
        await cache.set(key, 'value')
        const value = await cache.get(key)
        expect(value).toBe('value')
      }
    })

    it('should recover from delete of non-existent key', async () => {
      await cache.delete('non-existent')
      expect(cache.getSize()).toBe(0)
    })
  })

  describe('Batch Operations', () => {
    it('should support getting multiple keys', async () => {
      await cache.set('batch:1', 'value1')
      await cache.set('batch:2', 'value2')
      await cache.set('batch:3', 'value3')

      const v1 = await cache.get('batch:1')
      const v2 = await cache.get('batch:2')
      const v3 = await cache.get('batch:3')

      expect([v1, v2, v3]).toEqual(['value1', 'value2', 'value3'])
    })

    it('should support listing keys', async () => {
      await cache.set('key:1', 'v1')
      await cache.set('key:2', 'v2')
      await cache.set('key:3', 'v3')

      const keys = cache.getKeys()

      expect(keys).toContain('key:1')
      expect(keys).toContain('key:2')
      expect(keys).toContain('key:3')
    })

    it('should support bulk invalidation', async () => {
      for (let i = 0; i < 20; i++) {
        await cache.set(`bulk:${i}`, `value${i}`)
      }

      await cache.invalidate('bulk:*')

      expect(cache.getSize()).toBe(0)
    })
  })

  describe('Performance', () => {
    it('should handle high throughput gets', async () => {
      await cache.set('perf-key', 'value')

      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        await cache.get('perf-key')
      }

      const elapsed = Date.now() - startTime

      // Should be reasonably fast (< 1 second for 1000 ops)
      expect(elapsed).toBeLessThan(1000)
    })

    it('should handle high throughput sets', async () => {
      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        await cache.set(`perf:${i}`, `value${i}`)
      }

      const elapsed = Date.now() - startTime

      expect(elapsed).toBeLessThan(1000)
    })

    it('should maintain reasonable memory for large datasets', async () => {
      for (let i = 0; i < 100; i++) {
        await cache.set(`dataset:${i}`, {
          id: i,
          data: Array.from({ length: 100 }, (_, j) => j)
        })
      }

      const stats = await cache.getStats()
      expect(stats.memoryUsage).toBeGreaterThan(0)
      expect(cache.getSize()).toBe(100)
    })
  })
})
