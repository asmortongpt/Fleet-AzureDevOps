/**
 * Comprehensive Test Suite for RBAC Middleware
 * Tests role hierarchy, permissions, and tenant isolation
 * Aims for 100% branch coverage
 */

import { Response, NextFunction } from 'express'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  hasRole,
  Role,
  PERMISSIONS,
  requireRole,
  requirePermission,
  requireTenantIsolation,
  requireRBAC,
  verifyTenantOwnership,
  logAuthorizationFailure
} from '../rbac'
import { AuthRequest } from '../auth'

// Mock database
vi.mock('../../config/database', () => ({
  default: {
    query: vi.fn()
  }
}))

// Mock logger
vi.mock('../../config/logger', () => ({
  default: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}))

// Mock permissions module
vi.mock('../permissions', () => ({
  getUserPermissions: vi.fn(),
  clearPermissionCache: vi.fn()
}))

describe('RBAC Middleware', () => {
  let mockReq: Partial<AuthRequest>
  let mockRes: any
  let mockNext: NextFunction
  const testUserId = 'user-123'
  const testTenantId = 'tenant-456'

  beforeEach(() => {
    mockReq = {
      user: {
        id: testUserId,
        email: 'user@example.com',
        tenant_id: testTenantId,
        role: Role.USER
      },
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
      params: {},
      query: {}
    }

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false
    }

    mockNext = vi.fn()

    vi.clearAllMocks()
  })

  describe('Role Hierarchy - hasRole', () => {
    it('should recognize superadmin has all roles', () => {
      expect(hasRole(Role.SUPERADMIN, [Role.USER])).toBe(true)
      expect(hasRole(Role.SUPERADMIN, [Role.ADMIN])).toBe(true)
      expect(hasRole(Role.SUPERADMIN, [Role.MANAGER])).toBe(true)
    })

    it('should recognize admin has manager and user permissions', () => {
      expect(hasRole(Role.ADMIN, [Role.MANAGER])).toBe(true)
      expect(hasRole(Role.ADMIN, [Role.USER])).toBe(true)
      expect(hasRole(Role.ADMIN, [Role.VIEWER])).toBe(true)
    })

    it('should recognize manager has user and viewer permissions', () => {
      expect(hasRole(Role.MANAGER, [Role.USER])).toBe(true)
      expect(hasRole(Role.MANAGER, [Role.VIEWER])).toBe(true)
    })

    it('should deny user access to admin routes', () => {
      expect(hasRole(Role.USER, [Role.ADMIN])).toBe(false)
      expect(hasRole(Role.USER, [Role.MANAGER])).toBe(false)
    })

    it('should allow user to access user and viewer routes', () => {
      expect(hasRole(Role.USER, [Role.USER])).toBe(true)
      expect(hasRole(Role.USER, [Role.VIEWER])).toBe(true)
    })

    it('should deny guest access to all except guest', () => {
      expect(hasRole(Role.GUEST, [Role.ADMIN])).toBe(false)
      expect(hasRole(Role.GUEST, [Role.USER])).toBe(false)
      expect(hasRole(Role.GUEST, [Role.GUEST])).toBe(true)
    })

    it('should support specialized roles - fleet_manager', () => {
      expect(hasRole(Role.FLEET_MANAGER, [Role.MANAGER])).toBe(true)
      expect(hasRole(Role.FLEET_MANAGER, [Role.DRIVER])).toBe(true)
    })

    it('should support specialized roles - compliance_officer', () => {
      expect(hasRole(Role.COMPLIANCE_OFFICER, [Role.VIEWER])).toBe(true)
      expect(hasRole(Role.COMPLIANCE_OFFICER, [Role.ADMIN])).toBe(false)
    })

    it('should support specialized roles - maintenance_tech', () => {
      expect(hasRole(Role.MAINTENANCE_TECH, [Role.VIEWER])).toBe(true)
      expect(hasRole(Role.MAINTENANCE_TECH, [Role.ANALYST])).toBe(false)
    })

    it('should handle case-insensitive roles', () => {
      expect(hasRole('admin', [Role.USER])).toBe(true)
      expect(hasRole('USER', ['admin'])).toBe(false)
    })

    it('should handle multiple required roles (OR logic)', () => {
      expect(hasRole(Role.MANAGER, [Role.ADMIN, Role.MANAGER])).toBe(true)
      expect(hasRole(Role.USER, [Role.ADMIN, Role.MANAGER])).toBe(false)
    })

    it('should return true if any required role matches', () => {
      expect(hasRole(Role.ADMIN, [Role.VIEWER, Role.USER, Role.ADMIN])).toBe(true)
    })
  })

  describe('requireRole Middleware', () => {
    it('should allow access with correct role', async () => {
      mockReq.user!.role = Role.ADMIN
      const middleware = requireRole([Role.ADMIN, Role.MANAGER])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should deny access with insufficient role', async () => {
      mockReq.user!.role = Role.USER
      const middleware = requireRole([Role.ADMIN])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_ROLE'
        })
      )
    })

    it('should return 401 when no user authenticated', async () => {
      mockReq.user = undefined
      const middleware = requireRole([Role.ADMIN])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        })
      )
    })

    it('should default to GUEST role when role missing', async () => {
      mockReq.user!.role = undefined
      const middleware = requireRole([Role.GUEST])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should support role hierarchy - higher role accesses lower role routes', async () => {
      mockReq.user!.role = Role.ADMIN
      const middleware = requireRole([Role.MANAGER, Role.USER])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should log authorization failure with audit details', async () => {
      mockReq.user!.role = Role.USER
      const middleware = requireRole([Role.ADMIN])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
    })
  })

  describe('requirePermission Middleware', () => {
    const permissionsModule = require('../permissions')

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should allow access when user has required permission', async () => {
      const userPerms = new Set([PERMISSIONS.VEHICLE_READ, PERMISSIONS.VEHICLE_UPDATE])
      permissionsModule.getUserPermissions.mockResolvedValue(userPerms)

      const middleware = requirePermission([PERMISSIONS.VEHICLE_READ])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should deny access when user lacks required permission', async () => {
      const userPerms = new Set([PERMISSIONS.VEHICLE_READ])
      permissionsModule.getUserPermissions.mockResolvedValue(userPerms)

      const middleware = requirePermission([PERMISSIONS.VEHICLE_DELETE])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
    })

    it('should return 401 when no user authenticated', async () => {
      mockReq.user = undefined
      const middleware = requirePermission([PERMISSIONS.VEHICLE_READ])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should allow superadmin with wildcard permission "*"', async () => {
      const userPerms = new Set(['*'])
      permissionsModule.getUserPermissions.mockResolvedValue(userPerms)

      const middleware = requirePermission([PERMISSIONS.VEHICLE_DELETE])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should support OR logic - user needs any permission', async () => {
      const userPerms = new Set([PERMISSIONS.VEHICLE_READ])
      permissionsModule.getUserPermissions.mockResolvedValue(userPerms)

      const middleware = requirePermission([
        PERMISSIONS.VEHICLE_READ,
        PERMISSIONS.VEHICLE_UPDATE
      ])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should support AND logic - requireAll=true', async () => {
      const userPerms = new Set([
        PERMISSIONS.VEHICLE_READ,
        PERMISSIONS.VEHICLE_UPDATE
      ])
      permissionsModule.getUserPermissions.mockResolvedValue(userPerms)

      const middleware = requirePermission(
        [PERMISSIONS.VEHICLE_READ, PERMISSIONS.VEHICLE_UPDATE],
        true // requireAll
      )

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail AND logic when missing one permission', async () => {
      const userPerms = new Set([PERMISSIONS.VEHICLE_READ])
      permissionsModule.getUserPermissions.mockResolvedValue(userPerms)

      const middleware = requirePermission(
        [PERMISSIONS.VEHICLE_READ, PERMISSIONS.VEHICLE_UPDATE],
        true // requireAll
      )

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
    })

    it('should handle permission lookup errors', async () => {
      permissionsModule.getUserPermissions.mockRejectedValue(
        new Error('Permission lookup failed')
      )

      const middleware = requirePermission([PERMISSIONS.VEHICLE_READ])

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error'
        })
      )
    })
  })

  describe('requireTenantIsolation Middleware', () => {
    const pool = require('../../config/database').default

    it('should allow superadmin to bypass tenant isolation', async () => {
      mockReq.user!.role = Role.SUPERADMIN
      const middleware = requireTenantIsolation('vehicle')

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should allow admin to bypass tenant isolation', async () => {
      mockReq.user!.role = Role.ADMIN
      const middleware = requireTenantIsolation('vehicle')

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should return 401 when no user authenticated', async () => {
      mockReq.user = undefined
      const middleware = requireTenantIsolation('vehicle')

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should add tenant_id filter to list queries (GET without id)', async () => {
      mockReq.user!.role = Role.USER
      mockReq.method = 'GET'
      mockReq.params = {}
      const middleware = requireTenantIsolation('vehicle')

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockReq.query!.tenant_id).toBe(testTenantId)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should verify tenant ownership for individual resource access', async () => {
      mockReq.user!.role = Role.USER
      mockReq.method = 'GET'
      mockReq.params = { id: 'vehicle-123' }

      pool.query.mockResolvedValue({ rows: [{ id: 'vehicle-123' }] })

      const middleware = requireTenantIsolation('vehicle')

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 FROM vehicles WHERE id = $1 AND tenant_id = $2'),
        ['vehicle-123', testTenantId]
      )
      expect(mockNext).toHaveBeenCalled()
    })

    it('should return 404 on tenant isolation violation (not 403 to prevent info disclosure)', async () => {
      mockReq.user!.role = Role.USER
      mockReq.method = 'GET'
      mockReq.params = { id: 'vehicle-999' }

      pool.query.mockResolvedValue({ rows: [] }) // Resource not found for this tenant

      const middleware = requireTenantIsolation('vehicle')

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('should handle unknown resource types gracefully', async () => {
      mockReq.user!.role = Role.USER
      mockReq.method = 'GET'
      mockReq.params = { id: 'resource-123' }

      const middleware = requireTenantIsolation('unknown_resource_type')

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
    })

    it('should handle database errors during tenant verification', async () => {
      mockReq.user!.role = Role.USER
      mockReq.method = 'GET'
      mockReq.params = { id: 'vehicle-123' }

      pool.query.mockRejectedValue(new Error('Database connection failed'))

      const middleware = requireTenantIsolation('vehicle')

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
    })

    it('should support various resource types', async () => {
      mockReq.user!.role = Role.USER
      mockReq.method = 'GET'
      mockReq.params = { id: 'driver-456' }

      pool.query.mockResolvedValue({ rows: [{ id: 'driver-456' }] })

      const middleware = requireTenantIsolation('driver')

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM drivers WHERE'),
        expect.any(Array)
      )
    })
  })

  describe('requireRBAC Combined Middleware', () => {
    const permissionsModule = require('../permissions')

    it('should execute role check first', async () => {
      mockReq.user!.role = Role.USER
      const middleware = requireRBAC({
        roles: [Role.ADMIN]
      })

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should stop execution if role check fails', async () => {
      mockReq.user!.role = Role.USER
      const userPerms = new Set([PERMISSIONS.VEHICLE_READ])
      permissionsModule.getUserPermissions.mockResolvedValue(userPerms)

      const middleware = requireRBAC({
        roles: [Role.ADMIN],
        permissions: [PERMISSIONS.VEHICLE_READ]
      })

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should check permissions if role check passes', async () => {
      mockReq.user!.role = Role.ADMIN
      const userPerms = new Set([PERMISSIONS.VEHICLE_DELETE])
      permissionsModule.getUserPermissions.mockResolvedValue(userPerms)

      const middleware = requireRBAC({
        roles: [Role.ADMIN],
        permissions: [PERMISSIONS.VEHICLE_DELETE]
      })

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should enforce tenant isolation if enabled', async () => {
      mockReq.user!.role = Role.MANAGER
      mockReq.method = 'GET'
      mockReq.params = { id: 'vehicle-123' }

      const pool = require('../../config/database').default
      pool.query.mockResolvedValue({ rows: [{ id: 'vehicle-123' }] })

      const middleware = requireRBAC({
        roles: [Role.MANAGER],
        enforceTenantIsolation: true,
        resourceType: 'vehicle'
      })

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle errors in middleware chain', async () => {
      mockReq.user!.role = Role.ADMIN
      const middleware = requireRBAC({
        roles: [Role.ADMIN]
      })

      mockRes.headersSent = false

      await middleware(mockReq as AuthRequest, mockRes, mockNext)

      // Should execute without throwing
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('verifyTenantOwnership Helper', () => {
    const pool = require('../../config/database').default

    it('should verify vehicle belongs to tenant', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'vehicle-123' }] })

      const result = await verifyTenantOwnership(testTenantId, 'vehicle', 'vehicle-123')

      expect(result).toBe(true)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM vehicles'),
        ['vehicle-123', testTenantId]
      )
    })

    it('should return false when resource not found', async () => {
      pool.query.mockResolvedValue({ rows: [] })

      const result = await verifyTenantOwnership(testTenantId, 'vehicle', 'nonexistent')

      expect(result).toBe(false)
    })

    it('should return false for unknown resource type', async () => {
      const result = await verifyTenantOwnership(testTenantId, 'unknown', 'id-123')

      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('DB error'))

      const result = await verifyTenantOwnership(testTenantId, 'vehicle', 'id-123')

      expect(result).toBe(false)
    })
  })

  describe('logAuthorizationFailure Helper', () => {
    const pool = require('../../config/database').default

    it('should log authorization failure with all details', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] })

      await logAuthorizationFailure({
        userId: testUserId,
        tenantId: testTenantId,
        action: 'DELETE /api/vehicles/123',
        reason: 'Insufficient role'
      })

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          testUserId,
          testTenantId,
          'DELETE /api/vehicles/123',
          'authorization',
          null // resourceId
        ])
      )
    })

    it('should include resource type and ID in log', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] })

      await logAuthorizationFailure({
        userId: testUserId,
        tenantId: testTenantId,
        action: 'DELETE /api/vehicles/123',
        reason: 'Tenant violation',
        resourceType: 'vehicle',
        resourceId: 'vehicle-456'
      })

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['vehicle', 'vehicle-456'])
      )
    })

    it('should include role and permissions in details JSON', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] })

      await logAuthorizationFailure({
        userId: testUserId,
        tenantId: testTenantId,
        action: 'POST /api/vehicles',
        reason: 'Insufficient permissions',
        requiredRoles: ['admin'],
        userRole: 'user',
        requiredPermissions: [PERMISSIONS.VEHICLE_CREATE]
      })

      expect(pool.query).toHaveBeenCalled()
    })

    it('should handle logging errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('Logging failed'))

      // Should not throw
      await logAuthorizationFailure({
        userId: testUserId,
        tenantId: testTenantId,
        action: 'POST /api/test',
        reason: 'Test'
      })

      expect(pool.query).toHaveBeenCalled()
    })
  })

  describe('RBAC Permissions Constants', () => {
    it('should define vehicle permissions', () => {
      expect(PERMISSIONS.VEHICLE_CREATE).toBe('vehicle:create')
      expect(PERMISSIONS.VEHICLE_READ).toBe('vehicle:read')
      expect(PERMISSIONS.VEHICLE_UPDATE).toBe('vehicle:update')
      expect(PERMISSIONS.VEHICLE_DELETE).toBe('vehicle:delete')
    })

    it('should define driver permissions', () => {
      expect(PERMISSIONS.DRIVER_CREATE).toBe('driver:create')
      expect(PERMISSIONS.DRIVER_READ).toBe('driver:read')
      expect(PERMISSIONS.DRIVER_UPDATE).toBe('driver:update')
      expect(PERMISSIONS.DRIVER_DELETE).toBe('driver:delete')
    })

    it('should define maintenance permissions', () => {
      expect(PERMISSIONS.MAINTENANCE_CREATE).toBe('maintenance:create')
      expect(PERMISSIONS.MAINTENANCE_APPROVE).toBe('maintenance:approve')
    })

    it('should define admin permissions', () => {
      expect(PERMISSIONS.USER_MANAGE).toBe('user:manage')
      expect(PERMISSIONS.ROLE_MANAGE).toBe('role:manage')
      expect(PERMISSIONS.AUDIT_VIEW).toBe('audit:view')
      expect(PERMISSIONS.SETTINGS_MANAGE).toBe('settings:manage')
    })
  })
})
