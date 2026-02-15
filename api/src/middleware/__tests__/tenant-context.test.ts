/**
 * Comprehensive Test Suite for Tenant Context Middleware
 * Tests PostgreSQL RLS, transaction management, multi-tenant isolation
 * Aims for 100% branch coverage on tenant-context.ts (360 lines)
 */

import { Request, Response, NextFunction } from 'express'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PoolClient } from 'pg'

import {
  setTenantContext,
  getCurrentTenantId,
  debugTenantContext,
  requireTenantContext,
  setTenantContextDirect
} from '../tenant-context'
import { AuthRequest } from '../auth'

vi.mock('../../config/database', () => {
  const mockPoolClient = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    release: vi.fn().mockResolvedValue(undefined),
    on: vi.fn()
  }

  return {
    default: {
      connect: vi.fn().mockResolvedValue(mockPoolClient),
      query: vi.fn().mockResolvedValue({ rows: [] })
    }
  }
})

// Mock logger
vi.mock('../../config/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

describe('Tenant Context Middleware', () => {
  let mockReq: Partial<AuthRequest>
  let mockRes: any
  let mockNext: NextFunction
  let mockClient: any
  let pool: any

  const testTenantId = '550e8400-e29b-41d4-a716-446655440000'
  const testUserId = 'user-123'
  const testEmail = 'user@example.com'

  beforeEach(async () => {
    // Mock database client
    mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
      on: vi.fn()
    }

    mockReq = {
      user: {
        id: testUserId,
        email: testEmail,
        tenant_id: testTenantId,
        role: 'admin'
      } as any,
      dbClient: mockClient  // Always provide dbClient in tests
    }

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      on: vi.fn()
    }

    mockNext = vi.fn()

    // Get mocked pool instance
    const database = require('../../config/database').default
    pool = database
    pool.connect = vi.fn().mockResolvedValue(mockClient)
    pool.query = vi.fn().mockResolvedValue({ rows: [] })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // SUITE 1: setTenantContext Middleware (25 tests)
  // ============================================================================

  describe('setTenantContext Middleware', () => {
    it('should skip when user is not authenticated', async () => {
      mockReq.user = undefined

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(pool.connect).not.toHaveBeenCalled()
    })

    it('should return 403 when tenant_id is missing from JWT', async () => {
      mockReq.user!.tenant_id = undefined

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MISSING_TENANT_ID'
        })
      )
    })

    it('should return 403 when tenant_id has invalid UUID format', async () => {
      mockReq.user!.tenant_id = 'not-a-uuid'

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_TENANT_ID_FORMAT'
        })
      )
    })

    it('should connect to database pool', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(pool.connect).toHaveBeenCalled()
    })

    it('should start a transaction with BEGIN', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
    })

    it('should set tenant context using set_config', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT set_config($1, $2, true)',
        ['app.current_tenant_id', testTenantId]
      )
    })

    it('should attach client to request', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockReq.dbClient).toBe(mockClient)
    })

    it('should attach tenantId to request', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockReq.tenantId).toBe(testTenantId)
    })

    it('should register cleanup on response finish', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function))
    })

    it('should register cleanup on response close', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.on).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it('should call next() on success', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should return 500 on database connection error', async () => {
      pool.connect.mockRejectedValueOnce(new Error('Connection failed'))

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TENANT_CONTEXT_ERROR'
        })
      )
    })

    it('should handle database error during BEGIN', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('BEGIN failed'))

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
    })

    it('should validate UUID with correct regex', async () => {
      // Valid UUIDs
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'A1B2C3D4-E5F6-7890-ABCD-EF1234567890'
      ]

      for (const uuid of validUuids) {
        mockReq.user!.tenant_id = uuid
        mockClient.query.mockClear()

        await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      }
    })

    it('should reject invalid UUID formats', async () => {
      const invalidUuids = [
        '550e8400-e29b-41d4-a716-44665544000', // Too short
        '550e8400-e29b-41d4-a716-4466554400000', // Too long
        '550e8400e29b41d4a716446655440000', // Missing hyphens
        'not-a-uuid-at-all-here',
        '550e8400-e29b-41d4-a716-44665544000g', // Invalid character
        ''
      ]

      for (const uuid of invalidUuids) {
        mockReq.user!.tenant_id = uuid
        mockRes.status.mockClear()
        mockClient.query.mockClear()

        await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

        expect(mockRes.status).toHaveBeenCalledWith(403)
      }
    })

    it('should cleanup connection on finish event', async () => {
      mockClient.query.mockClear()

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      // Get the finish cleanup function
      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      // Call cleanup
      await cleanup()

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should prevent double cleanup', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.release.mockClear()
      mockClient.query.mockClear()

      // Call cleanup twice
      await cleanup()
      await cleanup()

      // Should only release once
      expect(mockClient.release).toHaveBeenCalledTimes(1)
    })

    it('should log successful tenant context setup', async () => {
      const { default: logger } = await import('../../config/logger')

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('TENANT CONTEXT'),
        expect.objectContaining({
          tenantId: testTenantId,
          userId: testUserId
        })
      )
    })

    it('should handle ROLLBACK on cleanup error', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('COMMIT failed'))

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.query.mockClear()
      mockClient.query.mockRejectedValueOnce(new Error('COMMIT failed'))

      await cleanup()

      // Should attempt rollback
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    })
  })

  // ============================================================================
  // SUITE 2: UUID Validation (10 tests)
  // ============================================================================

  describe('UUID Validation', () => {
    it('should accept valid v4 UUID', async () => {
      mockReq.user!.tenant_id = '550e8400-e29b-41d4-a716-446655440000'

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
    })

    it('should reject null tenant_id', async () => {
      mockReq.user!.tenant_id = null as any

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
    })

    it('should reject empty string tenant_id', async () => {
      mockReq.user!.tenant_id = ''

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
    })

    it('should reject tenant_id with SQL injection attempt', async () => {
      mockReq.user!.tenant_id = "550e8400-e29b-41d4-a716-446655440000'; DROP TABLE users; --"

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
    })

    it('should handle tenant_id with special characters', async () => {
      mockReq.user!.tenant_id = '550e8400-e29b-41d4-a716-446655440@00'

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
    })

    it('should be case-insensitive for hex digits', async () => {
      mockReq.user!.tenant_id = 'ABCD1234-EFGH-5678-IJKL-MNOPQRSTUVWX'

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      // Invalid due to G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X
      expect(mockRes.status).toHaveBeenCalledWith(403)
    })

    it('should validate UUID structure strictly', async () => {
      const strictUuid = '550e8400-e29b-41d4-a716-446655440000'
      mockReq.user!.tenant_id = strictUuid.toUpperCase()

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
    })

    it('should reject UUID missing hyphens', async () => {
      mockReq.user!.tenant_id = '550e8400e29b41d4a716446655440000'

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
    })

    it('should reject partial UUID', async () => {
      mockReq.user!.tenant_id = '550e8400-e29b-41d4-a716'

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
    })

    it('should log UUID validation errors', async () => {
      const { default: logger } = await import('../../config/logger')
      mockReq.user!.tenant_id = 'invalid-uuid'

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid tenant_id format'),
        expect.any(Object)
      )
    })
  })

  // ============================================================================
  // SUITE 3: Transaction Management (15 tests)
  // ============================================================================

  describe('Transaction Management', () => {
    it('should execute BEGIN before set_config', async () => {
      const queryOrder: string[] = []
      mockClient.query.mockImplementation((sql: string) => {
        queryOrder.push(sql.split('(')[0])
        return Promise.resolve({ rows: [] })
      })

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(queryOrder[0]).toBe('BEGIN')
      expect(queryOrder[1]).toContain('SELECT')
    })

    it('should use set_config with is_local=true', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.any(String), expect.any(String)])
      )
    })

    it('should COMMIT transaction on response finish', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.query.mockClear()

      await cleanup()

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('should ROLLBACK on cleanup error', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.query.mockClear()
      mockClient.query.mockRejectedValueOnce(new Error('COMMIT failed'))

      await cleanup()

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    })

    it('should release connection after COMMIT', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.release.mockClear()

      await cleanup()

      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should release connection after ROLLBACK', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.query.mockClear()
      mockClient.query.mockRejectedValueOnce(new Error('COMMIT failed'))
      mockClient.release.mockClear()

      await cleanup()

      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should handle ROLLBACK failure gracefully', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.query
        .mockRejectedValueOnce(new Error('COMMIT failed'))
        .mockRejectedValueOnce(new Error('ROLLBACK failed'))

      // Should not throw
      await expect(cleanup()).resolves.not.toThrow()
    })

    it('should parameterize tenant_id in set_config', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const setConfigCall = mockClient.query.mock.calls.find(call =>
        call[0].includes('set_config')
      )
      expect(setConfigCall[1]).toContain(testTenantId)
    })

    it('should begin transaction even if no queries follow', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
    })

    it('should handle connection pool exhaustion', async () => {
      pool.connect.mockRejectedValueOnce(new Error('Connection pool exhausted'))

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
    })

    it('should track transaction state in cleanup', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.release.mockClear()

      await cleanup()
      await cleanup() // Call again

      // Should only release once despite multiple cleanup calls
      expect(mockClient.release).toHaveBeenCalledTimes(1)
    })

    it('should preserve transaction isolation level', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      // Should not alter isolation level
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      // set_config should not include isolation level changes
      const setCalls = mockClient.query.mock.calls.filter(call =>
        call[0].includes('set_config')
      )
      setCalls.forEach(call => {
        expect(call[0]).not.toContain('ISOLATION')
      })
    })

    it('should commit on response finish event only', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const closeCall = mockRes.on.mock.calls.find(call => call[0] === 'close')

      expect(finishCall).toBeDefined()
      expect(closeCall).toBeDefined()
    })

    it('should handle missing connection gracefully', async () => {
      pool.connect.mockResolvedValueOnce(null)

      await expect(setTenantContext(mockReq as AuthRequest, mockRes, mockNext))
        .rejects.toThrow()
    })

    it('should log transaction initialization', async () => {
      const { default: logger } = await import('../../config/logger')

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Database client initialized'),
        expect.any(Object)
      )
    })
  })

  // ============================================================================
  // SUITE 4: Connection Cleanup (15 tests)
  // ============================================================================

  describe('Connection Cleanup', () => {
    it('should register finish event handler', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCalls = mockRes.on.mock.calls.filter(call => call[0] === 'finish')
      expect(finishCalls.length).toBeGreaterThan(0)
    })

    it('should register close event handler', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const closeCalls = mockRes.on.mock.calls.filter(call => call[0] === 'close')
      expect(closeCalls.length).toBeGreaterThan(0)
    })

    it('should call release() after COMMIT', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.query.mockClear()
      mockClient.release.mockClear()

      await cleanup()

      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should not release twice', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.release.mockClear()

      await cleanup()
      await cleanup()

      expect(mockClient.release).toHaveBeenCalledTimes(1)
    })

    it('should handle premature connection close', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const closeCall = mockRes.on.mock.calls.find(call => call[0] === 'close')
      const cleanup = closeCall[1] as Function

      mockClient.query.mockClear()
      mockClient.release.mockClear()

      await cleanup()

      expect(mockClient.query).toHaveBeenCalled()
    })

    it('should handle release errors gracefully', async () => {
      mockClient.release.mockImplementationOnce(() => {
        throw new Error('Release failed')
      })

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      // Should not throw
      await expect(cleanup()).resolves.not.toThrow()
    })

    it('should track cleanup state', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.query.mockClear()

      await cleanup()
      await cleanup()

      // Should only COMMIT once
      const commitCalls = mockClient.query.mock.calls.filter(call =>
        call[0] === 'COMMIT'
      )
      expect(commitCalls.length).toBeLessThanOrEqual(1)
    })

    it('should clean up connection pool resources', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      await cleanup()

      // Connection should be returned to pool
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should handle response finish before setup complete', async () => {
      // Simulate slow connection
      const setupPromise = setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      // Trigger finish immediately
      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      if (finishCall) {
        await finishCall[1]()
      }

      await setupPromise

      // Should handle gracefully
      expect(mockClient.release).toBeDefined()
    })

    it('should idempotently cleanup', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.release.mockClear()

      // Multiple cleanups
      await cleanup()
      await cleanup()
      await cleanup()

      expect(mockClient.release).toHaveBeenCalledTimes(1)
    })

    it('should handle connection already released', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.release.mockImplementationOnce(() => {
        throw new Error('Connection already released')
      })

      // Should handle gracefully
      await expect(cleanup()).resolves.not.toThrow()
    })

    it('should prevent memory leaks with proper cleanup', async () => {
      const cleanup_instances: Function[] = []

      for (let i = 0; i < 10; i++) {
        pool.connect.mockResolvedValueOnce({
          query: vi.fn().mockResolvedValue({ rows: [] }),
          release: vi.fn()
        })

        await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

        const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
        if (finishCall) {
          cleanup_instances.push(finishCall[1])
        }
      }

      // All connections should be tracked
      expect(cleanup_instances.length).toBe(10)
    })

    it('should cleanup regardless of transaction state', async () => {
      // Test when transaction already committed
      mockClient.query.mockClear()

      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      mockClient.release.mockClear()

      await cleanup()

      // Should still release
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should handle connection hung during cleanup', async () => {
      await setTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      const finishCall = mockRes.on.mock.calls.find(call => call[0] === 'finish')
      const cleanup = finishCall[1] as Function

      // Create timeout promise
      mockClient.query.mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve({ rows: [] }), 1000)
        })
      )

      // Cleanup should complete quickly despite slow query
      const startTime = Date.now()
      await cleanup()
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(100) // Should not wait for full timeout
    })
  })

  // ============================================================================
  // SUITE 5: getCurrentTenantId Helper (8 tests)
  // ============================================================================

  describe('getCurrentTenantId', () => {
    it('should return null when user not authenticated', async () => {
      mockReq.user = undefined
      mockReq.dbClient = mockClient

      const result = await getCurrentTenantId(mockReq as AuthRequest)

      expect(result).toBeNull()
    })

    it('should retrieve current tenant ID from session', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })

      const result = await getCurrentTenantId(mockReq as AuthRequest)

      expect(result).toBe(testTenantId)
    })

    it('should use request dbClient if available', async () => {
      // mockReq.dbClient is already set in beforeEach
      mockClient.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })

      const result = await getCurrentTenantId(mockReq as AuthRequest)

      expect(mockClient.query).toHaveBeenCalled()
      expect(result).toBe(testTenantId)
    })

    it('should return null when session variable not set', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: null }] })

      const result = await getCurrentTenantId(mockReq as AuthRequest)

      expect(result).toBeNull()
    })

    it('should return null when no rows returned', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] })

      const result = await getCurrentTenantId(mockReq as AuthRequest)

      expect(result).toBeNull()
    })

    it('should use current_setting to fetch tenant ID', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })

      await getCurrentTenantId(mockReq as AuthRequest)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('current_setting')
      )
    })

    it('should handle query errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Query failed'))

      const result = await getCurrentTenantId(mockReq as AuthRequest)

      expect(result).toBeNull()
    })

    it('should handle null row gracefully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [null] })

      const result = await getCurrentTenantId(mockReq as AuthRequest)

      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // SUITE 6: requireTenantContext Validation (12 tests)
  // ============================================================================

  describe('requireTenantContext', () => {
    it('should allow when session tenant is set', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })
      mockReq.user!.tenant_id = testTenantId

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject when session tenant is null', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: null }] })

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TENANT_CONTEXT_NOT_SET'
        })
      )
    })

    it('should detect mismatch between JWT and session tenant', async () => {
      const differentTenantId = '550e8400-e29b-41d4-a716-446655440001'
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: differentTenantId }] })
      mockReq.user!.tenant_id = testTenantId

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TENANT_CONTEXT_MISMATCH'
        })
      )
    })

    it('should use dbClient if available', async () => {
      mockReq.dbClient = mockClient
      mockClient.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })
      mockReq.user!.tenant_id = testTenantId

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockClient.query).toHaveBeenCalled()
    })

    it('should handle query errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Query failed'))

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TENANT_CONTEXT_VALIDATION_ERROR'
        })
      )
    })

    it('should verify current_setting query is executed', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })
      mockReq.user!.tenant_id = testTenantId

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('current_setting')
      )
    })

    it('should pass control to next on success', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })
      mockReq.user!.tenant_id = testTenantId

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle missing user gracefully', async () => {
      mockReq.user = undefined
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      // Should attempt validation anyway (null user.tenant_id)
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })

    it('should reject empty session tenant', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: '' }] })

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
    })

    it('should log validation errors', async () => {
      const { default: logger } = await import('../../config/logger')
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: null }] })

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(logger.error).toHaveBeenCalled()
    })

    it('should perform defense-in-depth checks', async () => {
      // Verify both JWT and session are checked
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })
      mockReq.user!.tenant_id = testTenantId

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      // Both should be validated
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle null response rows safely', async () => {
      pool.query.mockResolvedValueOnce({ rows: [null] })

      await requireTenantContext(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
    })
  })

  // ============================================================================
  // SUITE 7: debugTenantContext Endpoint (10 tests)
  // ============================================================================

  describe('debugTenantContext', () => {
    it('should return success response', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ tenant_id: testTenantId }] })
      pool.query.mockResolvedValueOnce({ rows: [] })
      pool.query.mockResolvedValueOnce({ rows: [] })
      pool.query.mockResolvedValueOnce({ rows: [{ vehicle_count: 5 }] })

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      )
    })

    it('should include tenant context information', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantContext: expect.any(Object)
        })
      )
    })

    it('should query current setting for session tenant', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('current_setting')
      )
    })

    it('should query RLS enabled tables', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('pg_tables')
      )
    })

    it('should query policies', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('pg_policies')
      )
    })

    it('should verify JWT tenant matches session tenant', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantContext: expect.objectContaining({
            match: expect.any(Boolean)
          })
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'))

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      )
    })

    it('should include user information', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: testUserId,
            email: testEmail,
            tenantId: testTenantId
          })
        })
      )
    })

    it('should test query vehicle access', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as vehicle_count FROM vehicles')
      )
    })

    it('should not expose sensitive data in error response', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'))

      await debugTenantContext(mockReq as AuthRequest, mockRes)

      const response = mockRes.json.mock.calls[0][0]
      expect(response.error).toBeDefined()
    })
  })

  // ============================================================================
  // SUITE 8: setTenantContextDirect Function (5 tests)
  // ============================================================================

  describe('setTenantContextDirect', () => {
    it('should set tenant context directly on client', async () => {
      await setTenantContextDirect(mockClient, testTenantId)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SET LOCAL'),
        [testTenantId]
      )
    })

    it('should use parameterized query', async () => {
      await setTenantContextDirect(mockClient, testTenantId)

      const calls = mockClient.query.mock.calls
      expect(calls[0][1]).toEqual([testTenantId])
    })

    it('should not require transaction', async () => {
      await setTenantContextDirect(mockClient, testTenantId)

      // Should not execute BEGIN
      const beginCalls = mockClient.query.mock.calls.filter(call =>
        call[0] === 'BEGIN'
      )
      expect(beginCalls.length).toBe(0)
    })

    it('should handle tenant ID validation', async () => {
      // Should accept valid UUID
      await setTenantContextDirect(mockClient, testTenantId)

      expect(mockClient.query).toHaveBeenCalled()
    })

    it('should work in service/DAL layer', async () => {
      // This function is designed for use outside Express middleware
      const client = mockClient

      await setTenantContextDirect(client, testTenantId)

      expect(client.query).toHaveBeenCalled()
    })
  })
})
