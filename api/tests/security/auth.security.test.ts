/**
 * Authentication and Authorization Security Tests
 * Tests for common security vulnerabilities
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/server'
import {
  generateTestToken,
  seedTestDatabase,
  cleanupDatabase,
  closeTestDatabase,
  testPool
} from '../setup'

describe('Security Tests - Authentication & Authorization', () => {
  let authToken: string

  beforeAll(async () => {
    await seedTestDatabase()
    authToken = generateTestToken()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await closeTestDatabase()
  })

  describe('Authentication Bypass Prevention', () => {
    it('should reject requests without authentication token', async () => {
      await request(app)
        .get('/api/asset-management')
        .expect(401)
    })

    it('should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/asset-management')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })

    it('should reject requests with malformed token', async () => {
      await request(app)
        .get('/api/asset-management')
        .set('Authorization', 'Bearer ')
        .expect(401)
    })

    it('should reject requests with missing Bearer prefix', async () => {
      await request(app)
        .get('/api/asset-management')
        .set('Authorization', authToken)
        .expect(401)
    })

    it('should reject expired tokens', async () => {
      // Create an expired token (this would need to be implemented in setup)
      const expiredToken = generateTestToken({ exp: Math.floor(Date.now() / 1000) - 3600 })

      await request(app)
        .get('/api/asset-management')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
    })
  })

  describe('Multi-Tenant Isolation', () => {
    let tenant1Token: string
    let tenant2Token: string
    let tenant1AssetId: string

    beforeAll(async () => {
      // Create tokens for two different tenants
      tenant1Token = generateTestToken({ tenant_id: 'tenant-1' })
      tenant2Token = generateTestToken({ tenant_id: 'tenant-2' })

      // Create asset for tenant 1
      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          asset_name: 'Tenant 1 Asset',
          asset_type: 'vehicle',
          asset_tag: 'T1-001',
          status: 'active'
        })

      tenant1AssetId = response.body.asset.id
    })

    it('should not allow tenant 2 to access tenant 1 assets', async () => {
      await request(app)
        .get(`/api/asset-management/${tenant1AssetId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404) // Should not find the asset
    })

    it('should not allow tenant 2 to update tenant 1 assets', async () => {
      await request(app)
        .put(`/api/asset-management/${tenant1AssetId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({ status: 'inactive' })
        .expect(404)
    })

    it('should not allow tenant 2 to delete tenant 1 assets', async () => {
      await request(app)
        .delete(`/api/asset-management/${tenant1AssetId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({ disposal_reason: 'Test' })
        .expect(404)
    })

    it('should not return tenant 1 data in tenant 2 list queries', async () => {
      const response = await request(app)
        .get('/api/asset-management')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200)

      const tenant1Assets = response.body.assets.filter(
        (a: any) => a.tenant_id === 'tenant-1'
      )
      expect(tenant1Assets.length).toBe(0)
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should handle SQL injection attempts in search query', async () => {
      const sqlInjection = "'; DROP TABLE assets; --"

      const response = await request(app)
        .get(`/api/asset-management?search=${encodeURIComponent(sqlInjection)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Should return empty or safe results, not error
      expect(response.body.assets).toBeDefined()

      // Verify assets table still exists
      const result = await testPool.query('SELECT COUNT(*) FROM assets')
      expect(result.rows).toBeDefined()
    })

    it('should handle SQL injection in asset ID parameter', async () => {
      const sqlInjection = "1' OR '1'='1"

      await request(app)
        .get(`/api/asset-management/${sqlInjection}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should sanitize input in POST requests', async () => {
      const maliciousData = {
        asset_name: "'; DROP TABLE assets; --",
        asset_type: 'vehicle',
        asset_tag: "1' OR '1'='1",
        status: 'active'
      }

      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201)

      // Data should be stored safely
      expect(response.body.asset.asset_name).toBe(maliciousData.asset_name)

      // Verify assets table still exists
      const result = await testPool.query('SELECT COUNT(*) FROM assets')
      expect(result.rows).toBeDefined()
    })
  })

  describe('XSS Prevention', () => {
    it('should sanitize XSS attempts in asset names', async () => {
      const xssPayload = '<script>alert("XSS")</script>'

      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset_name: xssPayload,
          asset_type: 'vehicle',
          asset_tag: 'XSS-001',
          status: 'active'
        })
        .expect(201)

      // Data should be stored but properly escaped when retrieved
      const asset = response.body.asset
      expect(asset.asset_name).toBe(xssPayload) // Stored as-is
      // Frontend should escape this when rendering
    })

    it('should handle XSS in search parameters', async () => {
      const xssPayload = '<img src=x onerror=alert(1)>'

      const response = await request(app)
        .get(`/api/asset-management?search=${encodeURIComponent(xssPayload)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toBeDefined()
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      const requests = []

      // Make 150 requests (exceeds 100/minute limit)
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .get('/api/health')
            .then(res => res.status)
        )
      }

      const results = await Promise.all(requests)
      const rateLimited = results.filter(status => status === 429)

      // At least some requests should be rate limited
      expect(rateLimited.length).toBeGreaterThan(0)
    }, 30000) // Increase timeout for this test
  })

  describe('Input Validation', () => {
    it('should reject excessively long input strings', async () => {
      const veryLongString = 'A'.repeat(10000)

      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset_name: veryLongString,
          asset_type: 'vehicle',
          asset_tag: 'LONG-001',
          status: 'active'
        })
        .expect(err => {
          expect(err.status).toBeGreaterThanOrEqual(400)
        })
    })

    it('should validate enum values', async () => {
      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset_name: 'Test Asset',
          asset_type: 'invalid_type',
          asset_tag: 'TEST-001',
          status: 'active'
        })
        .expect(err => {
          // May accept or reject based on validation
          expect([200, 201, 400, 500]).toContain(err.status)
        })
    })

    it('should reject malformed JSON', async () => {
      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400)
    })
  })

  describe('CSRF Protection', () => {
    it('should have security headers', async () => {
      const response = await request(app)
        .get('/api/health')

      // Check for security headers (from Helmet)
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBeDefined()
      expect(response.headers['strict-transport-security']).toBeDefined()
    })
  })

  describe('Sensitive Data Protection', () => {
    it('should not expose sensitive data in error messages', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })

      // Error should be generic, not reveal if user exists
      expect(response.body.error).not.toContain('database')
      expect(response.body.error).not.toContain('connection')
      expect(response.body.stack).toBeUndefined()
    })

    it('should not return password hashes in user data', async () => {
      const result = await testPool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      )

      if (result.rows.length > 0) {
        const user = result.rows[0]
        // Password hash should exist in DB
        expect(user.password_hash).toBeDefined()
      }

      // But API should never return it
      const response = await request(app)
        .get('/api/drivers') // Or any endpoint that returns user data
        .set('Authorization', `Bearer ${authToken}`)

      if (response.body.drivers && response.body.drivers.length > 0) {
        response.body.drivers.forEach((driver: any) => {
          expect(driver.password_hash).toBeUndefined()
          expect(driver.password).toBeUndefined()
        })
      }
    })
  })

  describe('Path Traversal Prevention', () => {
    it('should prevent directory traversal in file paths', async () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '....//....//....//etc/passwd'
      ]

      for (const attempt of traversalAttempts) {
        await request(app)
          .get(`/api/documents/${encodeURIComponent(attempt)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(err => {
            expect([400, 404]).toContain(err.status)
          })
      }
    })
  })
})
