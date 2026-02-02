/**
 * Security Headers Integration Tests
 *
 * Tests comprehensive security headers implementation including:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - CORS headers
 *
 * @module tests/security/security-headers
 */

import express, { Express } from 'express'
import request from 'supertest'
import { describe, it, expect, beforeAll } from 'vitest'

import { securityHeaders } from '../../src/middleware/security-headers'

describe('Security Headers Middleware', () => {
  let app: Express

  beforeAll(() => {
    app = express()
    app.use(securityHeaders())
    app.get('/test', (req, res) => {
      res.json({ success: true })
    })
  })

  describe('Content Security Policy (CSP)', () => {
    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['content-security-policy']).toBeDefined()
    })

    it('should have default-src self directive', async () => {
      const response = await request(app).get('/test')
      const csp = response.headers['content-security-policy']

      expect(csp).toContain("default-src 'self'")
    })

    it('should have script-src self directive', async () => {
      const response = await request(app).get('/test')
      const csp = response.headers['content-security-policy']

      expect(csp).toContain("script-src 'self'")
    })

    it('should have object-src none directive', async () => {
      const response = await request(app).get('/test')
      const csp = response.headers['content-security-policy']

      expect(csp).toContain("object-src 'none'")
    })

    it('should have frame-ancestors none directive', async () => {
      const response = await request(app).get('/test')
      const csp = response.headers['content-security-policy']

      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('should have base-uri self directive', async () => {
      const response = await request(app).get('/test')
      const csp = response.headers['content-security-policy']

      expect(csp).toContain("base-uri 'self'")
    })
  })

  describe('HTTP Strict Transport Security (HSTS)', () => {
    it('should set HSTS header in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const prodApp = express()
      prodApp.use(securityHeaders())
      prodApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(prodApp).get('/test')

      expect(response.headers['strict-transport-security']).toBeDefined()
      expect(response.headers['strict-transport-security']).toContain('max-age=')
      expect(response.headers['strict-transport-security']).toContain('includeSubDomains')

      process.env.NODE_ENV = originalEnv
    })

    it('should have reasonable max-age in HSTS', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const prodApp = express()
      prodApp.use(securityHeaders({
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true
        }
      }))
      prodApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(prodApp).get('/test')

      expect(response.headers['strict-transport-security']).toContain('max-age=31536000')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('X-Frame-Options', () => {
    it('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['x-frame-options']).toBe('DENY')
    })

    it('should allow SAMEORIGIN when configured', async () => {
      const customApp = express()
      customApp.use(securityHeaders({ frameOptions: 'SAMEORIGIN' }))
      customApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(customApp).get('/test')

      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    })
  })

  describe('X-Content-Type-Options', () => {
    it('should set X-Content-Type-Options to nosniff', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['x-content-type-options']).toBe('nosniff')
    })
  })

  describe('X-XSS-Protection', () => {
    it('should set X-XSS-Protection header', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['x-xss-protection']).toBe('1; mode=block')
    })
  })

  describe('Referrer-Policy', () => {
    it('should set Referrer-Policy header', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('Permissions-Policy', () => {
    it('should set Permissions-Policy header', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['permissions-policy']).toBeDefined()
    })

    it('should restrict camera access', async () => {
      const response = await request(app).get('/test')
      const policy = response.headers['permissions-policy']

      expect(policy).toContain('camera=()')
    })

    it('should restrict microphone access', async () => {
      const response = await request(app).get('/test')
      const policy = response.headers['permissions-policy']

      expect(policy).toContain('microphone=()')
    })

    it('should allow geolocation for fleet tracking', async () => {
      const response = await request(app).get('/test')
      const policy = response.headers['permissions-policy']

      expect(policy).toContain('geolocation=(')
    })
  })

  describe('Additional Security Headers', () => {
    it('should set X-DNS-Prefetch-Control', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['x-dns-prefetch-control']).toBe('off')
    })

    it('should set X-Download-Options', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['x-download-options']).toBe('noopen')
    })

    it('should set X-Permitted-Cross-Domain-Policies', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['x-permitted-cross-domain-policies']).toBe('none')
    })

    it('should set Cross-Origin-Embedder-Policy', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['cross-origin-embedder-policy']).toBe('require-corp')
    })

    it('should set Cross-Origin-Opener-Policy', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['cross-origin-opener-policy']).toBe('same-origin')
    })

    it('should set Cross-Origin-Resource-Policy', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['cross-origin-resource-policy']).toBe('same-origin')
    })

    it('should remove X-Powered-By header', async () => {
      const response = await request(app).get('/test')

      expect(response.headers['x-powered-by']).toBeUndefined()
    })
  })

  describe('Custom Configuration', () => {
    it('should allow custom CSP directives', async () => {
      const customApp = express()
      customApp.use(securityHeaders({
        csp: {
          directives: {
            'default-src': ["'none'"],
            'script-src': ["'self'", 'https://trusted-cdn.com']
          }
        }
      }))
      customApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(customApp).get('/test')
      const csp = response.headers['content-security-policy']

      expect(csp).toContain("script-src 'self' https://trusted-cdn.com")
    })

    it('should allow custom headers', async () => {
      const customApp = express()
      customApp.use(securityHeaders({
        customHeaders: {
          'X-Custom-Header': 'custom-value'
        }
      }))
      customApp.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(customApp).get('/test')

      expect(response.headers['x-custom-header']).toBe('custom-value')
    })
  })

  describe('Security Headers Count', () => {
    it('should set at least 12 security headers', async () => {
      const response = await request(app).get('/test')

      const securityHeaders = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy',
        'permissions-policy',
        'x-dns-prefetch-control',
        'x-download-options',
        'x-permitted-cross-domain-policies',
        'cross-origin-embedder-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy'
      ]

      const presentHeaders = securityHeaders.filter(
        header => response.headers[header] !== undefined
      )

      expect(presentHeaders.length).toBeGreaterThanOrEqual(12)
    })
  })
})

describe('API Security Headers', () => {
  it('should set strict CSP for API endpoints', async () => {
    const { apiSecurityHeaders } = await import('../../src/middleware/security-headers')

    const app = express()
    app.use(apiSecurityHeaders())
    app.get('/api/test', (req, res) => res.json({ success: true }))

    const response = await request(app).get('/api/test')
    const csp = response.headers['content-security-policy']

    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
  })
})

describe('Download Security Headers', () => {
  it('should set download-specific headers', async () => {
    const { downloadSecurityHeaders } = await import('../../src/middleware/security-headers')

    const app = express()
    app.get('/download', downloadSecurityHeaders(), (req, res) => {
      res.json({ success: true })
    })

    const response = await request(app).get('/download')

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['content-disposition']).toBe('attachment')
  })
})
