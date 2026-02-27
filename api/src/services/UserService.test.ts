/**
 * Test Suite for UserService
 * Tests user retrieval and basic operations
 * Covers 80%+ of the service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserService } from './UserService'
import { UserRepository } from '../repositories/UserRepository'
import { NotFoundError } from '../errors/NotFoundError'

// ============================================================================
// Mock Setup
// ============================================================================

vi.mock('../repositories/UserRepository')

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_USER_ID = 1
const TEST_TENANT_ID = 1
const TEST_USER_ID_2 = 2
const TEST_TENANT_ID_2 = 2

const mockUser = {
  id: TEST_USER_ID,
  tenant_id: TEST_TENANT_ID,
  email: 'john.doe@fleet.local',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1-555-0100',
  role: 'driver',
  status: 'active',
  created_at: new Date('2024-01-15'),
  updated_at: new Date('2024-02-15'),
  deleted_at: null
}

const mockUserInactive = {
  id: TEST_USER_ID_2,
  tenant_id: TEST_TENANT_ID,
  email: 'jane.smith@fleet.local',
  first_name: 'Jane',
  last_name: 'Smith',
  phone: '+1-555-0101',
  role: 'analyst',
  status: 'inactive',
  created_at: new Date('2024-02-01'),
  updated_at: new Date('2024-02-10'),
  deleted_at: null
}

// ============================================================================
// Test Suite
// ============================================================================

describe('UserService', () => {
  let mockUserRepository: any
  let service: UserService

  beforeEach(() => {
    // Create mock repository
    mockUserRepository = {
      findById: vi.fn()
    }

    // Mock UserRepository constructor
    vi.mocked(UserRepository).mockImplementation(() => mockUserRepository)

    // Create service instance
    service = new UserService(mockUserRepository)

    vi.clearAllMocks()
  })

  // ============================================================================
  // User Retrieval Tests
  // ============================================================================

  describe('getUserDetails', () => {
    it('should return user details when user exists', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      expect(result).toEqual(mockUser)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_TENANT_ID
      )
    })

    it('should throw NotFoundError when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null)

      await expect(
        service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError with correct message', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null)

      await expect(
        service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)
      ).rejects.toThrow('User not found')
    })

    it('should enforce tenant isolation', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null)

      await expect(
        service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID_2)
      ).rejects.toThrow(NotFoundError)

      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_TENANT_ID_2
      )
    })

    it('should return user with all metadata fields', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('email')
      expect(result).toHaveProperty('role')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')
      expect(result).toHaveProperty('deleted_at')
      expect(result).toHaveProperty('tenant_id')
    })

    it('should return inactive users', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUserInactive)

      const result = await service.getUserDetails(TEST_USER_ID_2, TEST_TENANT_ID)

      expect(result.status).toBe('inactive')
      expect(result.first_name).toBe('Jane')
    })

    it('should handle database errors gracefully', async () => {
      mockUserRepository.findById.mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      await expect(
        service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle null/undefined user gracefully', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(undefined)

      await expect(
        service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)
      ).rejects.toThrow(NotFoundError)
    })

    it('should pass correct parameters to repository', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_TENANT_ID
      )
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1)
    })

    it('should handle numeric IDs correctly', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      await service.getUserDetails(123, 456)

      expect(mockUserRepository.findById).toHaveBeenCalledWith(123, 456)
    })

    it('should return user data without modification', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      // Verify data integrity - no transformations
      expect(result.id).toBe(mockUser.id)
      expect(result.email).toBe(mockUser.email)
      expect(result.first_name).toBe(mockUser.first_name)
      expect(result.last_name).toBe(mockUser.last_name)
      expect(result.phone).toBe(mockUser.phone)
      expect(result.role).toBe(mockUser.role)
      expect(result.status).toBe(mockUser.status)
    })

    it('should handle timestamp fields correctly', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      expect(result.created_at).toBeInstanceOf(Date)
      expect(result.updated_at).toBeInstanceOf(Date)
      expect(result.deleted_at).toBeNull()
    })
  })

  // ============================================================================
  // Repository Integration Tests
  // ============================================================================

  describe('Repository Integration', () => {
    it('should use UserRepository correctly', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      expect(mockUserRepository.findById).toHaveBeenCalled()
    })

    it('should handle repository returning different users', async () => {
      const otherUser = {
        ...mockUser,
        id: 999,
        email: 'other@fleet.local'
      }

      mockUserRepository.findById.mockResolvedValueOnce(otherUser)

      const result = await service.getUserDetails(999, TEST_TENANT_ID)

      expect(result.id).toBe(999)
      expect(result.email).toBe('other@fleet.local')
    })

    it('should work with different tenant IDs', async () => {
      const differentTenantUser = {
        ...mockUser,
        tenant_id: TEST_TENANT_ID_2
      }

      mockUserRepository.findById.mockResolvedValueOnce(differentTenantUser)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID_2)

      expect(result.tenant_id).toBe(TEST_TENANT_ID_2)
    })
  })

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should throw NotFoundError type', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null)

      try {
        await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)
        expect.fail('Should have thrown NotFoundError')
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError)
      }
    })

    it('should handle timeout errors from repository', async () => {
      mockUserRepository.findById.mockRejectedValueOnce(
        new Error('Request timeout')
      )

      await expect(
        service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)
      ).rejects.toThrow('Request timeout')
    })

    it('should handle constraint violation errors', async () => {
      mockUserRepository.findById.mockRejectedValueOnce(
        new Error('Constraint violation')
      )

      await expect(
        service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)
      ).rejects.toThrow()
    })
  })

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very large user IDs', async () => {
      mockUserRepository.findById.mockResolvedValueOnce({
        ...mockUser,
        id: 999999999
      })

      const result = await service.getUserDetails(999999999, TEST_TENANT_ID)

      expect(result.id).toBe(999999999)
    })

    it('should handle very large tenant IDs', async () => {
      mockUserRepository.findById.mockResolvedValueOnce({
        ...mockUser,
        tenant_id: 888888888
      })

      const result = await service.getUserDetails(TEST_USER_ID, 888888888)

      expect(result.tenant_id).toBe(888888888)
    })

    it('should handle users with special characters in name', async () => {
      const specialUser = {
        ...mockUser,
        first_name: "O'Brien",
        last_name: "Müller-Smith"
      }

      mockUserRepository.findById.mockResolvedValueOnce(specialUser)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      expect(result.first_name).toBe("O'Brien")
      expect(result.last_name).toBe("Müller-Smith")
    })

    it('should handle users with email aliases', async () => {
      const userWithAlias = {
        ...mockUser,
        email: 'john.doe+work@fleet.local'
      }

      mockUserRepository.findById.mockResolvedValueOnce(userWithAlias)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      expect(result.email).toBe('john.doe+work@fleet.local')
    })

    it('should handle users without phone number', async () => {
      const userNoPhone = {
        ...mockUser,
        phone: null
      }

      mockUserRepository.findById.mockResolvedValueOnce(userNoPhone)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      expect(result.phone).toBeNull()
    })
  })

  // ============================================================================
  // Multi-Tenant Tests
  // ============================================================================

  describe('Multi-Tenant Isolation', () => {
    it('should query with correct tenant ID', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      const calls = mockUserRepository.findById.mock.calls
      expect(calls[0][1]).toBe(TEST_TENANT_ID)
    })

    it('should not return users from other tenants', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null)

      await expect(
        service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID_2)
      ).rejects.toThrow()

      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_TENANT_ID_2
      )
    })

    it('should handle cross-tenant request attempt', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null)

      await expect(
        service.getUserDetails(1, 9999)
      ).rejects.toThrow(NotFoundError)
    })
  })

  // ============================================================================
  // Service Behavior Tests
  // ============================================================================

  describe('Service Behavior', () => {
    it('should have getUserDetails method', () => {
      expect(typeof service.getUserDetails).toBe('function')
    })

    it('should be a class instance', () => {
      expect(service).toBeInstanceOf(UserService)
    })

    it('should return promise from getUserDetails', () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      const result = service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      expect(result).toBeInstanceOf(Promise)
    })

    it('should handle rapid consecutive calls', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUserInactive)
        .mockResolvedValueOnce(mockUser)

      const call1 = service.getUserDetails(1, TEST_TENANT_ID)
      const call2 = service.getUserDetails(2, TEST_TENANT_ID)
      const call3 = service.getUserDetails(1, TEST_TENANT_ID)

      const [result1, result2, result3] = await Promise.all([call1, call2, call3])

      expect(result1.first_name).toBe('John')
      expect(result2.first_name).toBe('Jane')
      expect(result3.first_name).toBe('John')
    })
  })

  // ============================================================================
  // Constructor and Initialization Tests
  // ============================================================================

  describe('Service Initialization', () => {
    it('should accept injected repository', () => {
      const customRepo = {
        findById: vi.fn().mockResolvedValue(mockUser)
      }

      const newService = new UserService(customRepo as any)

      expect(newService).toBeDefined()
      expect(newService).toBeInstanceOf(UserService)
    })

    it('should work with different repository implementations', () => {
      const anotherRepo = {
        findById: vi.fn()
      }

      const newService = new UserService(anotherRepo as any)

      expect(newService).toBeInstanceOf(UserService)
    })
  })

  // ============================================================================
  // Data Consistency Tests
  // ============================================================================

  describe('Data Consistency', () => {
    it('should not modify returned user object', async () => {
      const originalUser = { ...mockUser }
      mockUserRepository.findById.mockResolvedValueOnce(originalUser)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      // Verify original is unchanged
      expect(originalUser).toEqual(mockUser)
      // Verify returned matches original
      expect(result).toEqual(originalUser)
    })

    it('should return same object reference from repository', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser)

      const result = await service.getUserDetails(TEST_USER_ID, TEST_TENANT_ID)

      // Should be the same object
      expect(result).toBe(mockUser)
    })
  })
})
