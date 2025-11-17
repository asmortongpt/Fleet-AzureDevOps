/**
 * Cache Utility
 *
 * Simple in-memory cache with TTL support
 * Can be extended to use Redis in production
 */

export interface CacheEntry {
  value: any
  expiry: number
}

export class Cache {
  private store: Map<string, CacheEntry>
  private cleanupInterval: NodeJS.Timeout | null

  constructor() {
    this.store = new Map()

    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any | null> {
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.store.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    const expiry = Date.now() + (ttl * 1000)

    this.store.set(key, {
      value,
      expiry
    })
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  /**
   * Clear all cache entries matching pattern
   */
  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.store.clear()
      return
    }

    // Convert glob pattern to regex
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    )

    const keysToDelete: string[] = []
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.store.delete(key))
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    keys: string[]
    expired: number
  } {
    let expired = 0
    const now = Date.now()

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        expired++
      }
    }

    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
      expired
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.store.delete(key))

    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`)
    }
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

export default new Cache()
