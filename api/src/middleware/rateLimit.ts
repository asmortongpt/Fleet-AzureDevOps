import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Rate limiting middleware
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const key = `${userId}:${req.path}`
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      res.set('Retry-After', retryAfter.toString())
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: retryAfter
      })
    }

    // Increment count
    entry.count++
    rateLimitStore.set(key, entry)
    next()
  }
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)
