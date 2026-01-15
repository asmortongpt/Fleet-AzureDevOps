/**
 * CORS Security Integration Tests
 *
 * Tests strict CORS configuration including:
 * - Origin whitelist validation
 * - HTTPS enforcement in production
 * - Development localhost access
 * - Credentials handling
 * - Preflight requests
 *
 * @module tests/security/cors
 */

import cors from 'cors'
import express, { Express } from 'express'
import request from 'supertest'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { getCorsConfig, corsUtils } from '../../src/middleware/corsConfig'

describe('CORS Configuration', () => {
  let app: Express
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    delete process.env.CORS_ORIGIN
  })

  describe('Development Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      app = express()
      app.use(cors(getCorsConfig()))
      app.get('/test', (req, res) => res.json({ success: true }))
    })

    it('should allow localhost origins in development', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173')

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should allow 127.0.0.1 origins in development', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://127.0.0.1:3000')

      expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:3000')
    })

    it('should allow configured origins in development', async () => {
      process.env.CORS_ORIGIN = 'http://example.com'
      const devApp = express()
      devApp.use(cors(getCorsConfig()))
      devApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(devApp)
        .get('/test')
        .set('Origin', 'http://example.com')

      expect(response.headers['access-control-allow-origin']).toBe('http://example.com')
    })
  })

  describe('Production Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('should block localhost origins in production', async () => {
      process.env.CORS_ORIGIN = 'https://production.com'
      const prodApp = express()
      prodApp.use(cors(getCorsConfig()))
      prodApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(prodApp)
        .get('/test')
        .set('Origin', 'http://localhost:5173')
        .expect((res) => {
          // CORS should reject this origin
          expect(res.headers['access-control-allow-origin']).toBeUndefined()
        })
    })

    it('should allow HTTPS origins in production', async () => {
      process.env.CORS_ORIGIN = 'https://production.com'
      const prodApp = express()
      prodApp.use(cors(getCorsConfig()))
      prodApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(prodApp)
        .get('/test')
        .set('Origin', 'https://production.com')

      expect(response.headers['access-control-allow-origin']).toBe('https://production.com')
    })

    it('should block HTTP origins in production', async () => {
      process.env.CORS_ORIGIN = 'https://production.com'
      const prodApp = express()
      prodApp.use(cors(getCorsConfig()))
      prodApp.get('/test', (req, res) => res.json({ success: true }))

      await request(prodApp)
        .get('/test')
        .set('Origin', 'http://insecure.com')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined()
        })
    })

    it('should allow multiple HTTPS origins', async () => {
      process.env.CORS_ORIGIN = 'https://app1.com,https://app2.com,https://app3.com'
      const prodApp = express()
      prodApp.use(cors(getCorsConfig()))
      prodApp.get('/test', (req, res) => res.json({ success: true }))

      const response1 = await request(prodApp)
        .get('/test')
        .set('Origin', 'https://app1.com')

      expect(response1.headers['access-control-allow-origin']).toBe('https://app1.com')

      const response2 = await request(prodApp)
        .get('/test')
        .set('Origin', 'https://app2.com')

      expect(response2.headers['access-control-allow-origin']).toBe('https://app2.com')
    })
  })

  describe('Preflight Requests', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      app = express()
      app.use(cors(getCorsConfig()))
      app.get('/test', (req, res) => res.json({ success: true }))
      app.post('/test', (req, res) => res.json({ success: true }))
    })

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')

      expect(response.status).toBe(204)
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
      expect(response.headers['access-control-allow-methods']).toBeDefined()
    })

    it('should allow standard HTTP methods', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')

      const methods = response.headers['access-control-allow-methods']
      expect(methods).toContain('GET')
      expect(methods).toContain('POST')
      expect(methods).toContain('PUT')
      expect(methods).toContain('DELETE')
    })

    it('should set max-age for preflight cache', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')

      expect(response.headers['access-control-max-age']).toBe('86400') // 24 hours
    })
  })

  describe('Credentials Handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      app = express()
      app.use(cors(getCorsConfig()))
      app.get('/test', (req, res) => res.json({ success: true }))
    })

    it('should allow credentials for whitelisted origins', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173')

      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should include credentials in preflight responses', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')

      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })
  })

  describe('Allowed Headers', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      app = express()
      app.use(cors(getCorsConfig()))
      app.get('/test', (req, res) => res.json({ success: true }))
    })

    it('should allow Content-Type header', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')

      const allowedHeaders = response.headers['access-control-allow-headers']
      expect(allowedHeaders).toContain('Content-Type')
    })

    it('should allow Authorization header', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Authorization')

      const allowedHeaders = response.headers['access-control-allow-headers']
      expect(allowedHeaders).toContain('Authorization')
    })

    it('should allow X-CSRF-Token header', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'X-CSRF-Token')

      const allowedHeaders = response.headers['access-control-allow-headers']
      expect(allowedHeaders).toContain('X-CSRF-Token')
    })
  })

  describe('Exposed Headers', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      app = express()
      app.use(cors(getCorsConfig()))
      app.get('/test', (req, res) => {
        res.set('X-Total-Count', '100')
        res.set('X-Page-Count', '10')
        res.json({ success: true })
      })
    })

    it('should expose X-Total-Count header', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173')

      expect(response.headers['access-control-expose-headers']).toContain('X-Total-Count')
    })

    it('should expose X-Page-Count header', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173')

      expect(response.headers['access-control-expose-headers']).toContain('X-Page-Count')
    })
  })

  describe('Origin Validation Edge Cases', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      app = express()
      app.use(cors(getCorsConfig()))
      app.get('/test', (req, res) => res.json({ success: true }))
    })

    it('should allow requests with no Origin header (same-origin)', async () => {
      const response = await request(app).get('/test')

      // Should succeed without CORS headers
      expect(response.status).toBe(200)
    })

    it('should block unauthorized origins', async () => {
      process.env.CORS_ORIGIN = 'https://allowed.com'
      const testApp = express()
      testApp.use(cors(getCorsConfig()))
      testApp.get('/test', (req, res) => res.json({ success: true }))

      await request(testApp)
        .get('/test')
        .set('Origin', 'https://malicious.com')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined()
        })
    })
  })

  describe('CORS Utils', () => {
    it('should correctly identify development environment', () => {
      process.env.NODE_ENV = 'development'
      expect(corsUtils.isDevelopment()).toBe(true)

      process.env.NODE_ENV = 'production'
      expect(corsUtils.isDevelopment()).toBe(false)
    })

    it('should correctly identify production environment', () => {
      process.env.NODE_ENV = 'production'
      expect(corsUtils.isProduction()).toBe(true)

      process.env.NODE_ENV = 'development'
      expect(corsUtils.isProduction()).toBe(false)
    })

    it('should validate HTTPS origins for production', () => {
      expect(corsUtils.isValidProductionOrigin('https://example.com')).toBe(true)
      expect(corsUtils.isValidProductionOrigin('http://example.com')).toBe(false)
      expect(corsUtils.isValidProductionOrigin('invalid-url')).toBe(false)
    })

    it('should identify localhost origins', () => {
      expect(corsUtils.isLocalhostOrigin('http://localhost:5173')).toBe(true)
      expect(corsUtils.isLocalhostOrigin('http://127.0.0.1:3000')).toBe(true)
      expect(corsUtils.isLocalhostOrigin('https://example.com')).toBe(false)
    })

    it('should parse comma-separated origins', () => {
      process.env.CORS_ORIGIN = 'https://app1.com, https://app2.com ,https://app3.com'
      const origins = corsUtils.parseAllowedOrigins()

      expect(origins).toHaveLength(3)
      expect(origins).toContain('https://app1.com')
      expect(origins).toContain('https://app2.com')
      expect(origins).toContain('https://app3.com')
    })
  })
})
