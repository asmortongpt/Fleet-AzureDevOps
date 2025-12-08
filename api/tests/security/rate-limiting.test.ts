/**
 * Rate Limiting Integration Tests
 *
 * Tests comprehensive rate limiting implementation including:
 * - Global rate limits
 * - Per-route rate limits (auth, read, write, admin)
 * - Brute force protection
 * - Rate limit headers
 * - IP-based and user-based tracking
 *
 * @module tests/security/rate-limiting
 */

import express, { Express } from 'express'
import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'

import {
  globalLimiter,
  authLimiter,
  readLimiter,
  writeLimiter,
  adminLimiter,
  fileUploadLimiter,
  aiProcessingLimiter,
  searchLimiter,
  reportLimiter,
  realtimeLimiter,
  webhookLimiter,
  bruteForce,
  checkBruteForce,
  smartRateLimiter
} from '../../src/middleware/rateLimiter'

describe('Rate Limiting Middleware', () => {
  describe('Global Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.use(globalLimiter)
      app.get('/test', (req, res) => res.json({ success: true }))
    })

    it('should allow requests under the limit', async () => {
      const response = await request(app).get('/test')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should set rate limit headers', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['ratelimit-limit']).toBeDefined()
      expect(response.headers['ratelimit-remaining']).toBeDefined()
      expect(response.headers['ratelimit-reset']).toBeDefined()
    })

    it('should block requests exceeding the limit', async () => {
      // Make 31 requests (limit is 30)
      for (let i = 0; i < 31; i++) {
        const response = await request(app).get('/test')

        if (i < 30) {
          expect(response.status).toBe(200)
        } else {
          expect(response.status).toBe(429)
          expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED')
          expect(response.headers['retry-after']).toBeDefined()
        }
      }
    }, 10000) // Increase timeout for multiple requests
  })

  describe('Authentication Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.use(express.json())
      app.post('/auth/login', authLimiter, (req, res) => {
        res.json({ success: true })
      })
    })

    it('should allow limited login attempts', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })

      expect(response.status).toBe(200)
    })

    it('should block excessive login attempts', async () => {
      const loginData = { email: 'test@example.com', password: 'wrong' }

      // Make 6 requests (limit is 5)
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/auth/login')
          .send(loginData)

        if (i < 5) {
          expect(response.status).toBe(200)
        } else {
          expect(response.status).toBe(429)
          expect(response.body.message).toContain('authentication attempts')
        }
      }
    }, 10000)

    it('should track attempts per email+IP combination', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'user1@example.com', password: 'password' })

      expect(response.status).toBe(200)

      const response2 = await request(app)
        .post('/auth/login')
        .send({ email: 'user2@example.com', password: 'password' })

      expect(response2.status).toBe(200)
    })
  })

  describe('Read Operations Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.get('/api/data', readLimiter, (req, res) => {
        res.json({ data: [] })
      })
    })

    it('should allow high volume of read requests', async () => {
      // Read limiter allows 100 requests per minute
      for (let i = 0; i < 50; i++) {
        const response = await request(app).get('/api/data')
        expect(response.status).toBe(200)
      }
    }, 15000)

    it('should skip health check endpoints', async () => {
      const healthApp = express()
      healthApp.get('/api/health', readLimiter, (req, res) => {
        res.json({ status: 'ok' })
      })

      // Health checks should not be rate limited
      for (let i = 0; i < 150; i++) {
        const response = await request(healthApp).get('/api/health')
        expect(response.status).toBe(200)
      }
    }, 15000)
  })

  describe('Write Operations Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.use(express.json())
      app.post('/api/data', writeLimiter, (req, res) => {
        res.json({ success: true })
      })
    })

    it('should have stricter limits for write operations', async () => {
      // Write limiter allows 20 requests per minute
      for (let i = 0; i < 21; i++) {
        const response = await request(app)
          .post('/api/data')
          .send({ data: 'test' })

        if (i < 20) {
          expect(response.status).toBe(200)
        } else {
          expect(response.status).toBe(429)
        }
      }
    }, 10000)
  })

  describe('File Upload Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.post('/api/upload', fileUploadLimiter, (req, res) => {
        res.json({ success: true })
      })
    })

    it('should strictly limit file uploads', async () => {
      // File upload limiter allows 5 per minute
      for (let i = 0; i < 6; i++) {
        const response = await request(app).post('/api/upload')

        if (i < 5) {
          expect(response.status).toBe(200)
        } else {
          expect(response.status).toBe(429)
          expect(response.body.message).toContain('file uploads')
        }
      }
    }, 10000)
  })

  describe('AI Processing Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.post('/api/ai/analyze', aiProcessingLimiter, (req, res) => {
        res.json({ analysis: {} })
      })
    })

    it('should severely limit AI processing requests', async () => {
      // AI limiter allows 2 per minute
      const response1 = await request(app).post('/api/ai/analyze')
      expect(response1.status).toBe(200)

      const response2 = await request(app).post('/api/ai/analyze')
      expect(response2.status).toBe(200)

      const response3 = await request(app).post('/api/ai/analyze')
      expect(response3.status).toBe(429)
      expect(response3.body.code).toBe('AI_RATE_LIMIT_EXCEEDED')
    })

    it('should provide queue information in error response', async () => {
      // Exceed limit
      await request(app).post('/api/ai/analyze')
      await request(app).post('/api/ai/analyze')

      const response = await request(app).post('/api/ai/analyze')

      expect(response.body.queue).toBeDefined()
      expect(response.body.queue.available).toBe(false)
    })
  })

  describe('Smart Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.use(express.json())
      app.use(smartRateLimiter)
      app.get('/api/test', (req, res) => res.json({ success: true }))
      app.post('/api/test', (req, res) => res.json({ success: true }))
      app.put('/api/test', (req, res) => res.json({ success: true }))
      app.delete('/api/test', (req, res) => res.json({ success: true }))
    })

    it('should apply read limiter to GET requests', async () => {
      const response = await request(app).get('/api/test')
      expect(response.status).toBe(200)
      // Read limiter is more permissive
    })

    it('should apply write limiter to POST requests', async () => {
      const response = await request(app).post('/api/test')
      expect(response.status).toBe(200)
      // Write limiter is more strict
    })

    it('should apply write limiter to PUT requests', async () => {
      const response = await request(app).put('/api/test')
      expect(response.status).toBe(200)
    })

    it('should apply write limiter to DELETE requests', async () => {
      const response = await request(app).delete('/api/test')
      expect(response.status).toBe(200)
    })
  })

  describe('Admin Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.get('/admin/users', adminLimiter, (req, res) => {
        res.json({ users: [] })
      })
    })

    it('should allow moderate admin requests', async () => {
      // Admin limiter allows 50 per minute
      for (let i = 0; i < 30; i++) {
        const response = await request(app).get('/admin/users')
        expect(response.status).toBe(200)
      }
    }, 10000)
  })

  describe('Search Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.get('/api/search', searchLimiter, (req, res) => {
        res.json({ results: [] })
      })
    })

    it('should allow moderate search requests', async () => {
      for (let i = 0; i < 25; i++) {
        const response = await request(app).get('/api/search')
        expect(response.status).toBe(200)
      }
    }, 10000)
  })

  describe('Report Generation Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.post('/api/reports', reportLimiter, (req, res) => {
        res.json({ reportId: '123' })
      })
    })

    it('should strictly limit report generation', async () => {
      for (let i = 0; i < 6; i++) {
        const response = await request(app).post('/api/reports')

        if (i < 5) {
          expect(response.status).toBe(200)
        } else {
          expect(response.status).toBe(429)
        }
      }
    }, 10000)
  })

  describe('Real-time Data Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.get('/api/gps/telemetry', realtimeLimiter, (req, res) => {
        res.json({ telemetry: {} })
      })
    })

    it('should allow high volume real-time requests', async () => {
      // Real-time limiter allows 200 per minute
      for (let i = 0; i < 100; i++) {
        const response = await request(app).get('/api/gps/telemetry')
        expect(response.status).toBe(200)
      }
    }, 15000)
  })

  describe('Webhook Rate Limiter', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.post('/webhooks/incoming', webhookLimiter, (req, res) => {
        res.json({ received: true })
      })
    })

    it('should allow very high volume webhook requests', async () => {
      // Webhook limiter allows 500 per minute
      for (let i = 0; i < 100; i++) {
        const response = await request(app).post('/webhooks/incoming')
        expect(response.status).toBe(200)
      }
    }, 15000)

    it('should track by webhook identifier', async () => {
      const response = await request(app)
        .post('/webhooks/incoming')
        .set('X-Webhook-Id', 'webhook-123')

      expect(response.status).toBe(200)
    })
  })

  describe('Brute Force Protection', () => {
    beforeEach(() => {
      // Clear brute force attempts before each test
      bruteForce.unlock('test@example.com')
    })

    it('should record failed login attempts', () => {
      const result = bruteForce.recordFailure('test@example.com')

      expect(result.locked).toBe(false)
      expect(result.remainingAttempts).toBe(4) // 5 max - 1 = 4
    })

    it('should lock account after max attempts', () => {
      // Record 5 failures (max attempts)
      for (let i = 0; i < 5; i++) {
        bruteForce.recordFailure('test@example.com')
      }

      const result = bruteForce.recordFailure('test@example.com')

      expect(result.locked).toBe(true)
      expect(result.remainingAttempts).toBe(0)
      expect(result.lockedUntil).toBeDefined()
    })

    it('should check if account is locked', () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        bruteForce.recordFailure('locked@example.com')
      }

      expect(bruteForce.isLocked('locked@example.com')).toBe(true)
      expect(bruteForce.isLocked('notlocked@example.com')).toBe(false)
    })

    it('should reset on successful login', () => {
      bruteForce.recordFailure('test@example.com')
      bruteForce.recordFailure('test@example.com')

      expect(bruteForce.isLocked('test@example.com')).toBe(false)

      bruteForce.recordSuccess('test@example.com')

      // Should be reset
      const result = bruteForce.recordFailure('test@example.com')
      expect(result.remainingAttempts).toBe(4)
    })

    it('should allow manual unlock', () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        bruteForce.recordFailure('locked@example.com')
      }

      expect(bruteForce.isLocked('locked@example.com')).toBe(true)

      bruteForce.unlock('locked@example.com')

      expect(bruteForce.isLocked('locked@example.com')).toBe(false)
    })
  })

  describe('Brute Force Middleware', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.use(express.json())
      app.post('/login', checkBruteForce('email'), (req, res) => {
        res.json({ success: true })
      })

      bruteForce.unlock('test@example.com')
    })

    it('should allow login when not locked', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password: 'password' })

      expect(response.status).toBe(200)
    })

    it('should block login when locked', async () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        bruteForce.recordFailure('locked@example.com')
      }

      const response = await request(app)
        .post('/login')
        .send({ email: 'locked@example.com', password: 'password' })

      expect(response.status).toBe(429)
      expect(response.body.code).toBe('ACCOUNT_LOCKED')
      expect(response.body.locked).toBe(true)
    })
  })

  describe('Rate Limit Response Format', () => {
    let app: Express

    beforeEach(() => {
      app = express()
      app.use(globalLimiter)
      app.get('/test', (req, res) => res.json({ success: true }))
    })

    it('should return proper error format when rate limited', async () => {
      // Exceed limit
      for (let i = 0; i < 31; i++) {
        await request(app).get('/test')
      }

      const response = await request(app).get('/test')

      expect(response.status).toBe(429)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED')
      expect(response.body).toHaveProperty('retryAfter')
      expect(response.body).toHaveProperty('timestamp')
    }, 10000)

    it('should include Retry-After header', async () => {
      // Exceed limit
      for (let i = 0; i < 31; i++) {
        await request(app).get('/test')
      }

      const response = await request(app).get('/test')

      expect(response.headers['retry-after']).toBeDefined()
      expect(parseInt(response.headers['retry-after'])).toBeGreaterThan(0)
    }, 10000)
  })
})
