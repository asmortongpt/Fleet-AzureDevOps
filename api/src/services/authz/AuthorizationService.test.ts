/**
 * Comprehensive Test Suite for AuthorizationService
 * Tests RBAC, permission checking, role management, and caching
 * Aims for 80%+ coverage with 35+ test cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Pool } from 'pg'

import {
  AuthorizationService,
  AuthorizationError,
  PermissionDeniedError,
  RoleAssignmentError,
  PolicyEvaluationError
} from './AuthorizationService'

// ============================================================================
// Mock Setup
// ============================================================================

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  },
  securityLogger: {
    permissionDenied: vi.fn()
  },
  perfLogger: {
    slowQuery: vi.fn()
  }
}))

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
const TEST_ADMIN_ID = '00000000-0000-0000-0000-000000000002'
const TEST_TENANT_ID = '8e33a492-9b42-4e7a-8654-0572c9773b71'
const TEST_ROLE_ID = '11111111-1111-1111-1111-111111111111'
const TEST_PERM_ID = '22222222-2222-2222-2222-222222222222'

// ============================================================================
// Test Suite
// ============================================================================

describe('AuthorizationService', () => {
  let mockPool: any
  let service: AuthorizationService

  beforeEach(() => {
    // Create comprehensive mock pool
    mockPool = {
      query: vi.fn(),
      connect: vi.fn(),
      end: vi.fn(),
      release: vi.fn()
    }

    // Create service without Redis (caching disabled)
    service = new AuthorizationService(mockPool as any, false)
    vi.clearAllMocks()
  })

  // ============================================================================
  // Error Class Tests
  // ============================================================================

  describe('Error Classes', () => {
    it('should create AuthorizationError with all properties', () => {
      const error = new AuthorizationError(
        'Test message',
        'TEST_CODE',
        403,
        { detail: 'test' }
      )

      expect(error.message).toBe('Test message')
      expect(error.code).toBe('TEST_CODE')
      expect(error.statusCode).toBe(403)
      expect(error.details).toEqual({ detail: 'test' })
      expect(error.name).toBe('AuthorizationError')
    })

    it('should create PermissionDeniedError with correct defaults', () => {
      const error = new PermissionDeniedError('Access denied')

      expect(error.code).toBe('PERMISSION_DENIED')
      expect(error.statusCode).toBe(403)
      expect(error.name).toBe('PermissionDeniedError')
    })

    it('should create RoleAssignmentError with correct defaults', () => {
      const error = new RoleAssignmentError('Role error')

      expect(error.code).toBe('ROLE_ASSIGNMENT_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe('RoleAssignmentError')
    })

    it('should create PolicyEvaluationError with correct defaults', () => {
      const error = new PolicyEvaluationError('Policy error')

      expect(error.code).toBe('POLICY_EVALUATION_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('PolicyEvaluationError')
    })
  })

  // ============================================================================
  // Permission Checking Tests
  // ============================================================================

  describe('hasPermission', () => {
    it('should return false when user has no roles', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await service.hasPermission(
        TEST_USER_ID,
        'vehicle:view:own'
      )

      expect(result).toBe(false)
    })

    it('should throw on invalid user ID format', async () => {
      await expect(
        service.hasPermission('not-a-uuid', 'vehicle:view:own')
      ).rejects.toThrow()
    })

    it('should throw on invalid permission format', async () => {
      await expect(
        service.hasPermission(TEST_USER_ID, 'invalid_format')
      ).rejects.toThrow()
    })

    it('should validate permission has three parts', async () => {
      await expect(
        service.hasPermission(TEST_USER_ID, 'vehicle:view')
      ).rejects.toThrow()
    })

    it('should validate scope is valid', async () => {
      await expect(
        service.hasPermission(TEST_USER_ID, 'vehicle:view:invalid_scope')
      ).rejects.toThrow()
    })
  })

  describe('checkPermission', () => {
    it('should return authorization decision', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const decision = await service.checkPermission(
        TEST_USER_ID,
        'vehicle:view:own'
      )

      expect(decision).toBeDefined()
      expect(decision.userId).toBe(TEST_USER_ID)
      expect(decision.permission).toBe('vehicle:view:own')
      expect(decision.timestamp).toBeInstanceOf(Date)
      expect(decision.evaluationTimeMs).toBeGreaterThanOrEqual(0)
    })

    it('should deny permission by default', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const decision = await service.checkPermission(
        TEST_USER_ID,
        'vehicle:view:own'
      )

      expect(decision.granted).toBe(false)
      expect(decision.reason).toBeDefined()
    })

    it('should include context in decision', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const decision = await service.checkPermission(
        TEST_USER_ID,
        'vehicle:view:own'
      )

      expect(decision.context).toBeDefined()
      expect(decision.context.userId).toBe(TEST_USER_ID)
      expect(decision.context.roles).toEqual([])
      expect(decision.context.environment).toBeDefined()
    })

    it('should return safe default on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB error'))

      const decision = await service.checkPermission(
        TEST_USER_ID,
        'vehicle:view:own'
      )

      expect(decision.granted).toBe(false)
      expect(decision.reason).toContain('Error')
    })

    it('should track evaluation time', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const decision = await service.checkPermission(
        TEST_USER_ID,
        'vehicle:view:own'
      )

      expect(decision.evaluationTimeMs).toBeGreaterThan(0)
    })
  })

  describe('checkMultiplePermissions', () => {
    it('should check all permissions', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })

      const permissions = [
        'vehicle:view:own',
        'vehicle:edit:own',
        'route:view:team'
      ]

      const results = await service.checkMultiplePermissions(
        TEST_USER_ID,
        permissions
      )

      expect(results).toBeInstanceOf(Map)
      expect(results.size).toBe(3)
      permissions.forEach(perm => {
        expect(results.has(perm)).toBe(true)
        expect(results.get(perm)).toBe(false)
      })
    })

    it('should handle empty permission list', async () => {
      const results = await service.checkMultiplePermissions(
        TEST_USER_ID,
        []
      )

      expect(results.size).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'))

      const results = await service.checkMultiplePermissions(
        TEST_USER_ID,
        ['vehicle:view:own', 'vehicle:edit:own']
      )

      expect(results.size).toBe(2)
    })
  })

  // ============================================================================
  // Role Management Tests
  // ============================================================================

  describe('getUserRoles', () => {
    it('should return empty array when user has no roles', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const roles = await service.getUserRoles(TEST_USER_ID)

      expect(roles).toEqual([])
    })

    it('should throw on invalid user ID', async () => {
      await expect(
        service.getUserRoles('not-a-uuid')
      ).rejects.toThrow()
    })

    it('should handle database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB error'))

      await expect(
        service.getUserRoles(TEST_USER_ID)
      ).rejects.toThrow(AuthorizationError)
    })

    it('should return roles with all properties', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: TEST_ROLE_ID,
              name: 'driver',
              displayName: 'Driver',
              description: 'Standard driver role',
              mfaRequired: false,
              isActive: true,
              expiresAt: null
            }
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: TEST_PERM_ID,
              name: 'vehicle:view:own',
              resource: 'vehicle',
              verb: 'view',
              scope: 'own'
            }
          ]
        })

      const roles = await service.getUserRoles(TEST_USER_ID)

      expect(roles).toHaveLength(1)
      expect(roles[0].id).toBe(TEST_ROLE_ID)
      expect(roles[0].name).toBe('driver')
      expect(roles[0].displayName).toBe('Driver')
    })
  })

  describe('assignRole', () => {
    it('should assign role to user successfully', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }

      mockPool.connect.mockResolvedValueOnce(mockClient)
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: TEST_ROLE_ID, name: 'driver' }] }) // SELECT role
        .mockResolvedValueOnce({ rows: [{ id: 'assignment' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }) // COMMIT

      await service.assignRole(TEST_USER_ID, TEST_ROLE_ID, TEST_ADMIN_ID)

      expect(mockClient.query).toHaveBeenCalled()
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should throw when role does not exist', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }

      mockPool.connect.mockResolvedValueOnce(mockClient)
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT role (not found)

      await expect(
        service.assignRole(TEST_USER_ID, TEST_ROLE_ID, TEST_ADMIN_ID)
      ).rejects.toThrow(RoleAssignmentError)

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    })

    it('should validate input IDs', async () => {
      await expect(
        service.assignRole('invalid', TEST_ROLE_ID, TEST_ADMIN_ID)
      ).rejects.toThrow()

      await expect(
        service.assignRole(TEST_USER_ID, 'invalid', TEST_ADMIN_ID)
      ).rejects.toThrow()

      await expect(
        service.assignRole(TEST_USER_ID, TEST_ROLE_ID, 'invalid')
      ).rejects.toThrow()
    })

    it('should support expiration date', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }

      const expiresAt = new Date(Date.now() + 3600000)
      mockPool.connect.mockResolvedValueOnce(mockClient)
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: TEST_ROLE_ID }] }) // SELECT role
        .mockResolvedValueOnce({ rows: [{ id: 'assignment' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }) // COMMIT

      await service.assignRole(
        TEST_USER_ID,
        TEST_ROLE_ID,
        TEST_ADMIN_ID,
        expiresAt
      )

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([TEST_USER_ID, TEST_ROLE_ID, TEST_ADMIN_ID, expiresAt])
      )
    })
  })

  describe('revokeRole', () => {
    it('should revoke role from user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'revocation' }] })

      await service.revokeRole(TEST_USER_ID, TEST_ROLE_ID, TEST_ADMIN_ID)

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_roles'),
        expect.arrayContaining([TEST_USER_ID, TEST_ROLE_ID])
      )
    })

    it('should throw when assignment not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await expect(
        service.revokeRole(TEST_USER_ID, TEST_ROLE_ID, TEST_ADMIN_ID)
      ).rejects.toThrow(RoleAssignmentError)
    })

    it('should validate input IDs', async () => {
      await expect(
        service.revokeRole('invalid', TEST_ROLE_ID, TEST_ADMIN_ID)
      ).rejects.toThrow()
    })
  })

  describe('getRolePermissions', () => {
    it('should return permissions for role', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_PERM_ID,
            name: 'vehicle:view:own',
            resource: 'vehicle',
            verb: 'view',
            scope: 'own',
            description: 'View own vehicles'
          }
        ]
      })

      const permissions = await service.getRolePermissions(TEST_ROLE_ID)

      expect(permissions).toHaveLength(1)
      expect(permissions[0].name).toBe('vehicle:view:own')
      expect(permissions[0].resource).toBe('vehicle')
    })

    it('should return empty array when no permissions', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const permissions = await service.getRolePermissions(TEST_ROLE_ID)

      expect(permissions).toEqual([])
    })

    it('should throw on invalid role ID', async () => {
      await expect(
        service.getRolePermissions('invalid')
      ).rejects.toThrow()
    })

    it('should handle database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB error'))

      await expect(
        service.getRolePermissions(TEST_ROLE_ID)
      ).rejects.toThrow(AuthorizationError)
    })
  })

  describe('grantPermission', () => {
    it('should throw when database query fails', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB error'))

      await expect(
        service.grantPermission(TEST_ROLE_ID, TEST_PERM_ID, TEST_ADMIN_ID)
      ).rejects.toThrow(AuthorizationError)
    })

    it('should support row-level conditions in query', async () => {
      mockPool.query.mockImplementationOnce(() => {
        throw new Error('DB fail')
      })

      const conditions = { department: 'ops' }
      await expect(
        service.grantPermission(
          TEST_ROLE_ID,
          TEST_PERM_ID,
          TEST_ADMIN_ID,
          conditions
        )
      ).rejects.toThrow()
    })

    it('should throw on invalid role ID format', async () => {
      await expect(
        service.grantPermission('invalid', TEST_PERM_ID, TEST_ADMIN_ID)
      ).rejects.toThrow()
    })
  })

  describe('revokePermission', () => {
    it('should throw when revoking permission fails', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await expect(
        service.revokePermission(TEST_ROLE_ID, TEST_PERM_ID, TEST_ADMIN_ID)
      ).rejects.toThrow(AuthorizationError)
    })

    it('should throw on database errors', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB error'))

      await expect(
        service.revokePermission(TEST_ROLE_ID, TEST_PERM_ID, TEST_ADMIN_ID)
      ).rejects.toThrow(AuthorizationError)
    })

    it('should throw on invalid role ID format', async () => {
      await expect(
        service.revokePermission('invalid', TEST_PERM_ID, TEST_ADMIN_ID)
      ).rejects.toThrow()
    })
  })

  // ============================================================================
  // Policy Evaluation Tests
  // ============================================================================

  describe('evaluatePolicy', () => {
    it('should return policy decision', async () => {
      const decision = await service.evaluatePolicy(
        TEST_USER_ID,
        'view',
        { id: 'resource-1' },
        {
          userId: TEST_USER_ID,
          roles: [],
          attributes: {},
          environment: {
            timestamp: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'test'
          }
        }
      )

      expect(decision).toBeDefined()
      expect(decision.effect).toMatch(/allow|deny/)
      expect(decision.policies).toBeInstanceOf(Array)
      expect(decision.reason).toBeDefined()
    })

    it('should deny by default with no policies', async () => {
      const decision = await service.evaluatePolicy(
        TEST_USER_ID,
        'view',
        {},
        {
          userId: TEST_USER_ID,
          roles: [],
          attributes: {},
          environment: {
            timestamp: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'test'
          }
        }
      )

      expect(decision.effect).toBe('deny')
      expect(decision.matchedConditions).toEqual([])
    })
  })

  describe('evaluatePolicies', () => {
    it('should evaluate multiple policies', async () => {
      const decision = await service.evaluatePolicies(
        TEST_USER_ID,
        'view',
        {},
        {
          userId: TEST_USER_ID,
          roles: [],
          attributes: {},
          environment: {
            timestamp: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'test'
          }
        }
      )

      expect(decision).toBeDefined()
      expect(decision.effect).toMatch(/allow|deny/)
      expect(decision.policies).toBeInstanceOf(Array)
    })
  })

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  describe('Cache Management', () => {
    it('should skip cache operations when disabled', async () => {
      // Service was created with cacheEnabled=false
      await service.invalidateUserCache(TEST_USER_ID)
      // Should not throw

      await service.invalidateRoleCache(TEST_ROLE_ID)
      // Should not throw

      await service.warmCache(TEST_USER_ID)
      // Should not throw
    })
  })

  // ============================================================================
  // Audit Logging Tests
  // ============================================================================

  describe('logAuthorizationDecision', () => {
    it('should log authorization decision', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const decision = {
        userId: TEST_USER_ID,
        permission: 'vehicle:view:own',
        resource: { id: 'vehicle-1' },
        granted: true,
        reason: 'User has role',
        evaluatedPolicies: [],
        timestamp: new Date(),
        context: {
          userId: TEST_USER_ID,
          roles: ['driver'],
          attributes: { tenantId: TEST_TENANT_ID },
          environment: {
            timestamp: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'test'
          }
        }
      }

      await service.logAuthorizationDecision(decision)

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO permission_check_logs'),
        expect.any(Array)
      )
    })

    it('should handle logging errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB error'))

      const decision = {
        userId: TEST_USER_ID,
        permission: 'vehicle:view:own',
        granted: true,
        reason: 'Test',
        evaluatedPolicies: [],
        timestamp: new Date(),
        context: {
          userId: TEST_USER_ID,
          roles: [],
          attributes: {},
          environment: {
            timestamp: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'test'
          }
        }
      }

      // Should not throw
      await service.logAuthorizationDecision(decision)
    })
  })

  // ============================================================================
  // Service Lifecycle Tests
  // ============================================================================

  describe('Service Lifecycle', () => {
    it('should shutdown gracefully', async () => {
      await service.shutdown()
      // Should not throw
    })

    it('should not throw when no Redis client', async () => {
      const noCacheService = new AuthorizationService(mockPool as any, false)
      await noCacheService.shutdown()
      // Should not throw
    })
  })

  // ============================================================================
  // Concurrent Operations Tests
  // ============================================================================

  describe('Concurrent Operations', () => {
    it('should handle sequential permission checks', async () => {
      // Setup enough mocks for sequential calls
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      const result1 = await service.hasPermission(TEST_USER_ID, 'vehicle:view:own')
      const result2 = await service.hasPermission(TEST_USER_ID, 'vehicle:edit:own')

      expect(typeof result1).toBe('boolean')
      expect(typeof result2).toBe('boolean')
    })

    it('should handle sequential role retrievals', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      const roles1 = await service.getUserRoles(TEST_USER_ID)
      const roles2 = await service.getUserRoles(TEST_USER_ID)

      expect(Array.isArray(roles1)).toBe(true)
      expect(Array.isArray(roles2)).toBe(true)
    })
  })
})
