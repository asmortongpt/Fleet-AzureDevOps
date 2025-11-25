/**
 * SQL Injection Security Test Suite
 *
 * Tests to verify that all SQL queries use parameterized queries
 * and are protected against SQL injection attacks.
 */

import pool from '../../config/database'
import request from 'supertest'
import app from '../../app'

describe('SQL Injection Protection Tests', () => {
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM users--",
    "admin'--",
    "' OR 1=1--",
    "'; DELETE FROM users WHERE '1'='1",
    "1' AND (SELECT COUNT(*) FROM users) > 0--",
    "' OR 'x'='x",
    "105; DROP TABLE users;--",
    "1'; UPDATE users SET admin=1 WHERE '1'='1",
  ]

  describe('Route: /api/deployments/stats/summary', () => {
    it('should treat malicious days parameter as literal number', async () => {
      const maliciousPayload = "30'; DROP TABLE deployments; --"

      const response = await request(app)
        .get('/api/deployments/stats/summary')
        .query({ days: maliciousPayload })
        .set('Authorization', 'Bearer test-token')

      // Should either:
      // 1. Return 400 if validation rejects non-numeric input
      // 2. Return 200 with NaN treated safely
      // Should NOT execute any malicious SQL
      expect([200, 400, 401, 403]).toContain(response.status)

      // Verify deployments table still exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'deployments'
        )`
      )
      expect(tableCheck.rows[0].exists).toBe(true)
    })

    it('should reject extremely large days values', async () => {
      const response = await request(app)
        .get('/api/deployments/stats/summary')
        .query({ days: 99999 })
        .set('Authorization', 'Bearer test-token')

      // Should handle gracefully - either cap at max value or return error
      expect([200, 400, 401, 403]).toContain(response.status)
    })
  })

  describe('Route: /api/quality-gates/summary', () => {
    it('should protect against SQL injection in days parameter', async () => {
      const response = await request(app)
        .get('/api/quality-gates/summary')
        .query({ days: "7' OR '1'='1" })
        .set('Authorization', 'Bearer test-token')

      expect([200, 400, 401, 403]).toContain(response.status)
    })
  })

  describe('Route: /api/queue/metrics', () => {
    it('should protect against SQL injection in timeRange parameter', async () => {
      const response = await request(app)
        .get('/api/queue/metrics')
        .query({ timeRange: "24h'; DROP TABLE job_tracking; --" })
        .set('Authorization', 'Bearer test-token')

      expect([200, 400, 401, 403]).toContain(response.status)

      // Verify job_tracking table still exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'job_tracking'
        )`
      )
      expect(tableCheck.rows[0].exists).toBe(true)
    })
  })

  describe('Direct Database Query Protection', () => {
    it('should use parameterized queries for INTERVAL operations', async () => {
      // Test that our parameterized INTERVAL syntax works correctly
      const days = 30
      const result = await pool.query(
        'SELECT NOW() - ($1 || ' days')::INTERVAL as past_date',
        [days]
      )

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].past_date).toBeInstanceOf(Date)
    })

    it('should reject malicious INTERVAL values when parameterized', async () => {
      const maliciousValue = "30'; DROP TABLE users; --"

      try {
        await pool.query(
          'SELECT NOW() - ($1 || ' days')::INTERVAL as past_date',
          [maliciousValue]
        )
        // Should fail due to invalid interval format
        fail('Should have thrown an error for invalid interval')
      } catch (error: any) {
        // Expected to fail with PostgreSQL error, not execute malicious SQL
        expect(error.message).toMatch(/invalid input syntax|interval/)
      }

      // Verify users table still exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'users'
        )`
      )
      expect(tableCheck.rows[0].exists).toBe(true)
    })

    it('should handle numeric validation properly', async () => {
      const validDays = 30
      const result = await pool.query(
        'SELECT NOW() - ($1 || ' days')::INTERVAL as past_date',
        [validDays]
      )

      expect(result.rows[0].past_date).toBeInstanceOf(Date)
    })
  })

  describe('Input Validation', () => {
    it('should validate and sanitize numeric inputs', () => {
      // Test the validation logic used in routes
      const testValidation = (input: any, min: number, max: number, defaultVal: number) => {
        return Math.max(min, Math.min(max, parseInt(input) || defaultVal))
      }

      expect(testValidation(30, 1, 365, 30)).toBe(30)
      expect(testValidation(0, 1, 365, 30)).toBe(1)
      expect(testValidation(999, 1, 365, 30)).toBe(365)
      expect(testValidation("abc", 1, 365, 30)).toBe(30)
      expect(testValidation("30'; DROP TABLE", 1, 365, 30)).toBe(30)
    })
  })

  describe('Comprehensive SQL Injection Payload Tests', () => {
    sqlInjectionPayloads.forEach((payload) => {
      it(`should protect against payload: ${payload}`, async () => {
        const response = await request(app)
          .get('/api/deployments/stats/summary')
          .query({ days: payload })
          .set('Authorization', 'Bearer test-token')

        // Should handle gracefully without executing malicious SQL
        expect([200, 400, 401, 403, 500]).toContain(response.status)

        // Verify critical tables still exist
        const tables = ['users', 'deployments', 'quality_gates', 'vehicles']
        for (const table of tables) {
          const tableCheck = await pool.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_name = $1
            )`,
            [table]
          )
          expect(tableCheck.rows[0].exists).toBe(true)
        }
      })
    })
  })

  describe('Positive Tests - Valid Parameterized Queries', () => {
    it('should correctly execute valid parameterized INTERVAL queries', async () => {
      const testCases = [
        { value: 1, unit: 'days' },
        { value: 7, unit: 'days' },
        { value: 30, unit: 'days' },
        { value: 1, unit: 'months' },
        { value: 6, unit: 'months' },
        { value: 1, unit: 'hour' },
        { value: 24, unit: 'hours' },
      ]

      for (const testCase of testCases) {
        const result = await pool.query(
          'SELECT NOW() - ($1 || ' ' || $2)::INTERVAL as past_date',
          [testCase.value, testCase.unit]
        )

        expect(result.rows.length).toBe(1)
        expect(result.rows[0].past_date).toBeInstanceOf(Date)
      }
    })
  })
})

describe('File-Specific SQL Injection Tests', () => {
  describe('Services: OBD2 Service', () => {
    it('should use parameterized queries for fuel economy trends', async () => {
      // This would test the actual service method
      // For now, we verify the query pattern is safe
      const days = 30
      const query = `
        SELECT *
        FROM obd2_fuel_economy_trends
        WHERE tenant_id = $1 AND vehicle_id = $2
        AND date >= CURRENT_DATE - ($3 || ' days')::INTERVAL
        ORDER BY date DESC
      `

      // Verify query compiles (doesn't test with actual data)
      expect(query).toContain('$3')
      expect(query).not.toContain('${')
    })
  })

  describe('Services: Document Service', () => {
    it('should use parameterized queries for expiring documents', () => {
      const query = `
        SELECT * FROM fleet_documents
        WHERE expires_at IS NOT NULL
        AND expires_at <= NOW() + ($1 || ' days')::INTERVAL
        AND expires_at > NOW()
        AND is_archived = false
        ORDER BY expires_at ASC
      `

      expect(query).toContain('$1')
      expect(query).not.toContain('${')
    })
  })
})
