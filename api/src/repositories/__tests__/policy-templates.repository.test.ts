/**
 * Policy Templates Repository Tests
 *
 * Comprehensive test suite for PolicyTemplatesRepository
 * Tests all repository methods (representing 19 queries eliminated)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PolicyTemplatesRepository } from '../policy-templates.repository'
import { connectionManager } from '../../config/connection-manager'
import { NotFoundError, DatabaseError } from '../../errors/app-error'

// Mock the connection manager
vi.mock('../../config/connection-manager', () => ({
  connectionManager: {
    getPool: vi.fn()
  }
}))

// Mock logger
vi.mock('../../config/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}))

describe('PolicyTemplatesRepository', () => {
  let mockPool: any
  let repository: PolicyTemplatesRepository

  beforeEach(() => {
    // Create mock pool
    mockPool = {
      query: vi.fn()
    }

    // Setup connection manager mock
    vi.mocked(connectionManager.getPool).mockReturnValue(mockPool)

    // Create repository instance
    repository = new PolicyTemplatesRepository(mockPool)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Policy Templates Tests
  // ============================================================================

  describe('findAll', () => {
    it('should fetch all policy templates with pagination', async () => {
      const mockPolicies = [
        { id: 1, policy_name: 'Security Policy', status: 'Active' },
        { id: 2, policy_name: 'Privacy Policy', status: 'Active' }
      ]
      mockPool.query
        .mockResolvedValueOnce({ rows: mockPolicies })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })

      const result = await repository.findAll({
        page: 1,
        limit: 50
      })

      expect(result.data).toEqual(mockPolicies)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(mockPool.query).toHaveBeenCalledTimes(2)
    })

    it('should apply category filter', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })

      await repository.findAll({
        category: 'Information Security',
        page: 1,
        limit: 50
      })

      const query = mockPool.query.mock.calls[0][0]
      expect(query).toContain('policy_category = $1')
    })

    it('should apply status filter', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })

      await repository.findAll({
        status: 'Active',
        page: 1,
        limit: 50
      })

      const query = mockPool.query.mock.calls[0][0]
      expect(query).toContain('status = $')
    })
  })

  describe('findById', () => {
    it('should fetch policy template by ID', async () => {
      const mockPolicy = { id: 1, policy_name: 'Security Policy' }
      mockPool.query.mockResolvedValue({ rows: [mockPolicy] })

      const result = await repository.findById(1)

      expect(result).toEqual(mockPolicy)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM policy_templates WHERE id = $1'),
        [1]
      )
    })

    it('should return null if policy not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })

      const result = await repository.findById(999)

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create new policy template', async () => {
      const policyData = {
        policy_name: 'New Security Policy',
        policy_code: 'SEC-001',
        policy_content: 'Content here',
        status: 'Draft' as const,
        is_mandatory: true,
        requires_training: false,
        requires_test: false,
        version: '1.0',
        times_acknowledged: 0
      }
      const mockPolicy = { id: 1, ...policyData }
      mockPool.query.mockResolvedValue({ rows: [mockPolicy] })

      const result = await repository.create(policyData, 123)

      expect(result).toEqual(mockPolicy)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO policy_templates'),
        expect.arrayContaining([123])
      )
    })
  })

  describe('update', () => {
    it('should update policy template', async () => {
      const updateData = { policy_name: 'Updated Policy' }
      const mockPolicy = { id: 1, ...updateData }
      mockPool.query.mockResolvedValue({ rows: [mockPolicy] })

      const result = await repository.update(1, updateData, 123)

      expect(result).toEqual(mockPolicy)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE policy_templates'),
        expect.arrayContaining([1, 123])
      )
    })

    it('should return null if policy not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })

      const result = await repository.update(999, { policy_name: 'Test' }, 123)

      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // Policy Acknowledgments Tests
  // ============================================================================

  describe('findAcknowledgmentsByPolicyId', () => {
    it('should fetch acknowledgments with employee details (tenant filtered)', async () => {
      const mockAcknowledgments = [
        { id: 1, policy_id: 1, employee_name: 'John Doe', employee_id: '123' }
      ]
      mockPool.query.mockResolvedValue({ rows: mockAcknowledgments })

      const result = await repository.findAcknowledgmentsByPolicyId(1, 100)

      expect(result).toEqual(mockAcknowledgments)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('d.tenant_id = $2'),
        [1, 100]
      )
    })
  })

  describe('markPreviousAcknowledgmentsAsNotCurrent', () => {
    it('should mark previous acknowledgments as not current', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })

      await repository.markPreviousAcknowledgmentsAsNotCurrent(1, 123)

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SET is_current = FALSE'),
        [1, 123]
      )
    })
  })

  describe('createAcknowledgment', () => {
    it('should create new acknowledgment', async () => {
      const ackData = {
        policy_id: 1,
        employee_id: 123,
        signature_data: 'base64data',
        ip_address: '192.168.1.1',
        device_info: 'Chrome/Windows',
        test_taken: true,
        test_score: 95,
        test_passed: true
      }
      const mockAck = { id: 1, ...ackData }
      mockPool.query.mockResolvedValue({ rows: [mockAck] })

      const result = await repository.createAcknowledgment(ackData)

      expect(result).toEqual(mockAck)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO policy_acknowledgments'),
        expect.arrayContaining([1, 123, 'base64data', '192.168.1.1', 'Chrome/Windows', true, 95, true])
      )
    })
  })

  describe('incrementAcknowledgmentCount', () => {
    it('should increment acknowledgment count and update timestamp', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })

      await repository.incrementAcknowledgmentCount(1)

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('times_acknowledged = times_acknowledged + 1'),
        [1]
      )
    })
  })

  // ============================================================================
  // Employee Compliance Tests
  // ============================================================================

  describe('getEmployeeCompliance', () => {
    it('should fetch employee compliance data (tenant filtered)', async () => {
      const mockCompliance = {
        employee_id: 123,
        employee_name: 'John Doe',
        total_policies: 10,
        acknowledged_policies: 8,
        pending_acknowledgments: 2
      }
      mockPool.query.mockResolvedValue({ rows: [mockCompliance] })

      const result = await repository.getEmployeeCompliance(123, 100)

      expect(result).toEqual(mockCompliance)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('d.tenant_id = $2'),
        [123, 100]
      )
    })

    it('should return null if employee not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })

      const result = await repository.getEmployeeCompliance(999, 100)

      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // Policy Violations Tests
  // ============================================================================

  describe('findViolations', () => {
    it('should fetch violations with pagination (tenant filtered)', async () => {
      const mockViolations = [
        { id: 1, policy_name: 'Security Policy', employee_name: 'John Doe', severity: 'High' }
      ]
      mockPool.query
        .mockResolvedValueOnce({ rows: mockViolations })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })

      const result = await repository.findViolations({
        tenantId: 100,
        page: 1,
        limit: 50
      })

      expect(result.data).toEqual(mockViolations)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('d.tenant_id = $1'),
        expect.arrayContaining([100, 50])
      )
    })

    it('should apply employee filter', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })

      await repository.findViolations({
        tenantId: 100,
        employeeId: 123,
        page: 1,
        limit: 50
      })

      const query = mockPool.query.mock.calls[0][0]
      expect(query).toContain('pv.employee_id = $')
    })

    it('should apply severity filter', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })

      await repository.findViolations({
        tenantId: 100,
        severity: 'High',
        page: 1,
        limit: 50
      })

      const query = mockPool.query.mock.calls[0][0]
      expect(query).toContain('pv.severity = $')
    })
  })

  describe('createViolation', () => {
    it('should create new violation', async () => {
      const violationData = {
        policy_id: 1,
        employee_id: 123,
        violation_date: new Date(),
        severity: 'High' as const,
        description: 'Security breach',
        status: 'Open' as const
      }
      const mockViolation = { id: 1, ...violationData }
      mockPool.query.mockResolvedValue({ rows: [mockViolation] })

      const result = await repository.createViolation(violationData, 456)

      expect(result).toEqual(mockViolation)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO policy_violations'),
        expect.arrayContaining([456])
      )
    })
  })

  // ============================================================================
  // Policy Compliance Audits Tests
  // ============================================================================

  describe('findAudits', () => {
    it('should fetch audits with pagination', async () => {
      const mockAudits = [
        { id: 1, policy_name: 'Security Policy', auditor_name: 'Jane Smith', audit_date: new Date() }
      ]
      mockPool.query
        .mockResolvedValueOnce({ rows: mockAudits })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })

      const result = await repository.findAudits({
        page: 1,
        limit: 50
      })

      expect(result.data).toEqual(mockAudits)
      expect(result.pagination.total).toBe(1)
    })

    it('should apply policy filter', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })

      await repository.findAudits({
        policyId: 1,
        page: 1,
        limit: 50
      })

      const query = mockPool.query.mock.calls[0][0]
      expect(query).toContain('pca.policy_id = $')
    })
  })

  describe('createAudit', () => {
    it('should create new audit', async () => {
      const auditData = {
        policy_id: 1,
        audit_date: new Date(),
        auditor_name: 'Jane Smith',
        compliance_score: 95
      }
      const mockAudit = { id: 1, ...auditData }
      mockPool.query.mockResolvedValue({ rows: [mockAudit] })

      const result = await repository.createAudit(auditData, 456)

      expect(result).toEqual(mockAudit)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO policy_compliance_audits'),
        expect.arrayContaining([456])
      )
    })
  })

  // ============================================================================
  // Dashboard & Analytics Tests
  // ============================================================================

  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics (tenant filtered)', async () => {
      const mockPolicies = { active_policies: '10', overdue_reviews: '2', upcoming_reviews: '3' }
      const mockCompliance = { total_employees: '50', compliant_employees: '45' }
      const mockViolations = [{ severity: 'High', count: '5' }]

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockPolicies] })
        .mockResolvedValueOnce({ rows: [mockCompliance] })
        .mockResolvedValueOnce({ rows: mockViolations })

      const result = await repository.getDashboardStats(100)

      expect(result.policies).toEqual(mockPolicies)
      expect(result.compliance).toEqual(mockCompliance)
      expect(result.violations).toEqual(mockViolations)
      expect(mockPool.query).toHaveBeenCalledTimes(3)
    })

    it('should filter compliance and violations by tenant_id', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [] })

      await repository.getDashboardStats(100)

      // Check compliance query includes tenant filter
      const complianceQuery = mockPool.query.mock.calls[1][0]
      expect(complianceQuery).toContain('d.tenant_id = $1')

      // Check violations query includes tenant filter
      const violationsQuery = mockPool.query.mock.calls[2][0]
      expect(violationsQuery).toContain('d.tenant_id = $1')
    })
  })
})
