/**
 * Cache Service Tests
 *
 * Tests for caching functionality:
 * - Store and retrieve cached values
 * - TTL (time-to-live) expiration
 * - Cache invalidation
 * - Key-value operations
 * - Memory management
 * - Multi-tenant cache isolation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

interface CacheEntry<T> {
  value: T
  expiresAt?: number
  createdAt: number
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly defaultTTL = 3600000 // 1 hour in milliseconds

  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : undefined

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  getSize(): number {
    // Clean up expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
    return this.cache.size
  }

  getKeys(): string[] {
    const keys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(key)
      } else {
        keys.push(key)
      }
    }

    return keys
  }

  setIfMissing<T>(key: string, value: T, ttl?: number): boolean {
    if (this.has(key)) {
      return false
    }

    this.set(key, value, ttl)
    return true
  }

  increment(key: string, amount: number = 1): number {
    const current = this.get<number>(key) || 0
    const newValue = current + amount

    this.set(key, newValue)
    return newValue
  }

  decrement(key: string, amount: number = 1): number {
    return this.increment(key, -amount)
  }

  getExpiration(key: string): number | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (!entry.expiresAt) {
      return null
    }

    const ttl = entry.expiresAt - Date.now()
    return ttl > 0 ? ttl : null
  }

  // Multi-tenant support
  setScoped(tenantId: string, key: string, value: any, ttl?: number): void {
    this.set(`${tenantId}:${key}`, value, ttl)
  }

  getScoped(tenantId: string, key: string): any {
    return this.get(`${tenantId}:${key}`)
  }

  deleteScoped(tenantId: string, key: string): boolean {
    return this.delete(`${tenantId}:${key}`)
  }

  clearTenant(tenantId: string): void {
    const prefix = `${tenantId}:`
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Statistics
  getStats() {
    let expired = 0
    let valid = 0

    for (const entry of this.cache.values()) {
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        expired++
      } else {
        valid++
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired
    }
  }
}

describe('CacheService', () => {
  let cache: CacheService

  beforeEach(() => {
    cache = new CacheService()
  })

  describe('Basic Set and Get', () => {
    it('should store and retrieve string value', () => {
      cache.set('key1', 'value1')

      expect(cache.get('key1')).toBe('value1')
    })

    it('should store and retrieve object value', () => {
      const obj = { name: 'John', age: 30 }
      cache.set('user', obj)

      expect(cache.get('user')).toEqual(obj)
    })

    it('should store and retrieve array value', () => {
      const arr = [1, 2, 3, 4, 5]
      cache.set('numbers', arr)

      expect(cache.get('numbers')).toEqual(arr)
    })

    it('should store and retrieve numeric value', () => {
      cache.set('count', 42)

      expect(cache.get('count')).toBe(42)
    })

    it('should store and retrieve boolean value', () => {
      cache.set('flag', true)

      expect(cache.get('flag')).toBe(true)
    })

    it('should return null for non-existent key', () => {
      expect(cache.get('non-existent')).toBeNull()
    })
  })

  describe('TTL Expiration', () => {
    it('should expire value after TTL', () => {
      cache.set('temp', 'value', 100) // 100ms TTL

      expect(cache.get('temp')).toBe('value')

      // Wait for expiration
      vi.useFakeTimers()
      vi.advanceTimersByTime(150)

      expect(cache.get('temp')).toBeNull()
      vi.useRealTimers()
    })

    it('should not expire value before TTL', () => {
      cache.set('temp', 'value', 1000) // 1 second TTL

      vi.useFakeTimers()
      vi.advanceTimersByTime(500)

      expect(cache.get('temp')).toBe('value')
      vi.useRealTimers()
    })

    it('should support no expiration', () => {
      cache.set('permanent', 'value') // No TTL

      expect(cache.get('permanent')).toBe('value')
      expect(cache.getExpiration('permanent')).toBeNull()
    })

    it('should track TTL remaining', () => {
      cache.set('temp', 'value', 1000)

      const ttl = cache.getExpiration('temp')
      expect(ttl).toBeLessThanOrEqual(1000)
      expect(ttl).toBeGreaterThan(0)
    })
  })

  describe('Cache Invalidation', () => {
    it('should delete single key', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      cache.delete('key1')

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('value2')
    })

    it('should return true when deleting existing key', () => {
      cache.set('key', 'value')

      expect(cache.delete('key')).toBe(true)
    })

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('non-existent')).toBe(false)
    })

    it('should clear all cache', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      cache.clear()

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('key3')).toBeNull()
      expect(cache.getSize()).toBe(0)
    })
  })

  describe('Key Checking', () => {
    it('should check if key exists', () => {
      cache.set('key', 'value')

      expect(cache.has('key')).toBe(true)
      expect(cache.has('non-existent')).toBe(false)
    })

    it('should return false for expired key', () => {
      cache.set('temp', 'value', 100)

      vi.useFakeTimers()
      vi.advanceTimersByTime(150)

      expect(cache.has('temp')).toBe(false)
      vi.useRealTimers()
    })

    it('should auto-delete expired key when checking', () => {
      cache.set('temp', 'value', 100)

      vi.useFakeTimers()
      vi.advanceTimersByTime(150)

      cache.has('temp')
      expect(cache.getSize()).toBe(0)

      vi.useRealTimers()
    })
  })

  describe('Atomic Operations', () => {
    it('should set only if missing', () => {
      const result1 = cache.setIfMissing('key', 'value1')
      const result2 = cache.setIfMissing('key', 'value2')

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      expect(cache.get('key')).toBe('value1')
    })

    it('should increment numeric value', () => {
      cache.set('counter', 5)

      const result = cache.increment('counter', 3)

      expect(result).toBe(8)
      expect(cache.get('counter')).toBe(8)
    })

    it('should increment non-existent key from 0', () => {
      const result = cache.increment('new-counter', 5)

      expect(result).toBe(5)
    })

    it('should decrement numeric value', () => {
      cache.set('counter', 10)

      const result = cache.decrement('counter', 2)

      expect(result).toBe(8)
    })

    it('should default to increment of 1', () => {
      cache.set('counter', 0)

      const result = cache.increment('counter')

      expect(result).toBe(1)
    })
  })

  describe('Cache Information', () => {
    it('should return cache size', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      expect(cache.getSize()).toBe(3)
    })

    it('should return all keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      const keys = cache.getKeys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })

    it('should exclude expired keys from size', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2', 100) // Expiring

      vi.useFakeTimers()
      vi.advanceTimersByTime(150)

      expect(cache.getSize()).toBe(1)

      vi.useRealTimers()
    })

    it('should get cache statistics', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2', 100)

      vi.useFakeTimers()
      vi.advanceTimersByTime(150)

      const stats = cache.getStats()
      expect(stats.valid).toBe(1)
      expect(stats.expired).toBe(1)

      vi.useRealTimers()
    })
  })

  describe('Multi-Tenant Scoped Cache', () => {
    it('should store scoped values', () => {
      cache.setScoped('tenant-1', 'key', 'value1')
      cache.setScoped('tenant-2', 'key', 'value2')

      expect(cache.getScoped('tenant-1', 'key')).toBe('value1')
      expect(cache.getScoped('tenant-2', 'key')).toBe('value2')
    })

    it('should isolate tenants', () => {
      cache.setScoped('tenant-1', 'key', 'value1')

      expect(cache.getScoped('tenant-2', 'key')).toBeNull()
    })

    it('should delete scoped values', () => {
      cache.setScoped('tenant-1', 'key', 'value')

      cache.deleteScoped('tenant-1', 'key')

      expect(cache.getScoped('tenant-1', 'key')).toBeNull()
    })

    it('should clear tenant cache', () => {
      cache.setScoped('tenant-1', 'key1', 'value1')
      cache.setScoped('tenant-1', 'key2', 'value2')
      cache.setScoped('tenant-2', 'key1', 'value')

      cache.clearTenant('tenant-1')

      expect(cache.getScoped('tenant-1', 'key1')).toBeNull()
      expect(cache.getScoped('tenant-1', 'key2')).toBeNull()
      expect(cache.getScoped('tenant-2', 'key1')).toBe('value')
    })
  })

  describe('Memory Management', () => {
    it('should clean up expired entries on size check', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2', 100)

      vi.useFakeTimers()
      vi.advanceTimersByTime(150)

      const size = cache.getSize()
      expect(size).toBe(1)

      vi.useRealTimers()
    })

    it('should handle large cache', () => {
      const largeObj = new Array(1000).fill('data')

      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, largeObj)
      }

      expect(cache.getSize()).toBe(100)
      expect(cache.get('key-50')).toEqual(largeObj)
    })
  })

  describe('Type Safety', () => {
    it('should preserve type information', () => {
      const user = { id: 1, name: 'John' }
      cache.set('user', user)

      const retrieved = cache.get<typeof user>('user')
      expect(retrieved?.id).toBe(1)
      expect(retrieved?.name).toBe('John')
    })
  })

  describe('Error Handling', () => {
    it('should not throw on operations', () => {
      expect(() => {
        cache.set('key', 'value')
        cache.get('key')
        cache.has('key')
        cache.delete('key')
        cache.clear()
      }).not.toThrow()
    })

    it('should handle null values', () => {
      cache.set('null-key', null)

      expect(cache.get('null-key')).toBeNull()
    })

    it('should handle undefined values', () => {
      cache.set('undefined-key', undefined)

      expect(cache.get('undefined-key')).toBeUndefined()
    })
  })
})
