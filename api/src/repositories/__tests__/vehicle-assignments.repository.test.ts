/**
 * Vehicle Assignments Repository Tests
 * Agent 51 - B3 Refactoring
 *
 * Tests all 13 repository methods with security validation
 */

import { Pool } from 'pg';

import { VehicleAssignmentsRepository, CreateAssignmentData, UpdateAssignmentData } from '../vehicle-assignments.repository';

describe('VehicleAssignmentsRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: VehicleAssignmentsRepository;
  const tenantId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    } as any;

    // Create repository instance with mocked pool
    repository = new VehicleAssignmentsRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should use parameterized queries with tenant_id filter', async () => {
      const filters = {
        assignment_type: 'designated',
        lifecycle_state: 'active',
      };
      const pagination = { page: 1, limit: 50 };

      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await repository.findAll(tenantId, filters, pagination);

      expect(mockPool.query).toHaveBeenCalled();
      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query (no string interpolation)
      expect(query).toContain('$1');
      expect(query).toContain('va.tenant_id = $1');

      // Verify tenant_id is first parameter
      expect(params[0]).toBe(tenantId);

      // Verify no SQL injection vulnerabilities
      expect(query).not.toContain(`'${tenantId}'`);
      expect(query).not.toContain(filters.assignment_type);
    });

    it('should apply user scope filtering with parameterized queries', async () => {
      const filters = {
        user_scope: 'own' as const,
        user_id: userId,
      };
      const pagination = { page: 1, limit: 50 };

      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await repository.findAll(tenantId, filters, pagination);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify user_id is parameterized
      expect(query).toContain('dr.user_id = $');
      expect(params).toContain(userId);
    });

    it('should apply pagination with parameterized queries', async () => {
      const filters = {};
      const pagination = { page: 2, limit: 25 };

      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await repository.findAll(tenantId, filters, pagination);

      const call = mockPool.query.mock.calls[0];
      const params = call[1] as any[];

      // Verify LIMIT and OFFSET are parameterized
      expect(params).toContain(25); // limit
      expect(params).toContain(25); // offset (page 2 * limit 25 - 25 = 25)
    });
  });

  describe('count', () => {
    it('should use parameterized queries with tenant_id filter', async () => {
      const filters = { lifecycle_state: 'active' };

      mockPool.query.mockResolvedValue({ rows: [{ total: '10' }], rowCount: 1 } as any);

      const result = await repository.count(tenantId, filters);

      expect(mockPool.query).toHaveBeenCalled();
      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('$1');
      expect(query).toContain('va.tenant_id = $1');
      expect(params[0]).toBe(tenantId);

      // Verify result
      expect(result).toBe(10);
    });
  });

  describe('findById', () => {
    it('should use parameterized queries with tenant_id filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440002';

      mockPool.query.mockResolvedValue({ rows: [{ id: assignmentId }], rowCount: 1 } as any);

      await repository.findById(assignmentId, tenantId);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('$1');
      expect(query).toContain('$2');
      expect(query).toContain('WHERE va.id = $1 AND va.tenant_id = $2');

      // Verify parameters
      expect(params[0]).toBe(assignmentId);
      expect(params[1]).toBe(tenantId);
    });

    it('should return null when assignment not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await repository.findById('nonexistent-id', tenantId);

      expect(result).toBeNull();
    });
  });

  describe('isDriverInAllowedRegion', () => {
    it('should use parameterized queries', async () => {
      const driverId = '550e8400-e29b-41d4-a716-446655440003';

      mockPool.query.mockResolvedValue({ rows: [{ is_allowed: true }], rowCount: 1 } as any);

      await repository.isDriverInAllowedRegion(driverId, tenantId);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('$1');
      expect(query).toContain('$2');

      // Verify parameters
      expect(params[0]).toBe(driverId);
      expect(params[1]).toBe(tenantId);
    });
  });

  describe('create', () => {
    it('should use parameterized queries with tenant_id', async () => {
      const data: CreateAssignmentData = {
        vehicle_id: '550e8400-e29b-41d4-a716-446655440004',
        driver_id: '550e8400-e29b-41d4-a716-446655440005',
        assignment_type: 'designated',
        start_date: '2025-01-01',
        is_ongoing: true,
        commuting_authorized: true,
        on_call_only: false,
        requires_secured_parking: false,
      };

      mockPool.query.mockResolvedValue({ rows: [{ id: 'new-id' }], rowCount: 1 } as any);

      await repository.create(tenantId, userId, data);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query (all $1, $2, $3, etc.)
      expect(query).toContain('$1');
      expect(query).toContain('$2');
      expect(query).toContain('$16');

      // Verify tenant_id is first parameter
      expect(params[0]).toBe(tenantId);

      // Verify no hardcoded values in query
      expect(query).not.toContain(data.vehicle_id);
      expect(query).not.toContain(data.driver_id);
    });

    it('should properly handle geographic_constraints as JSON', async () => {
      const data: CreateAssignmentData = {
        vehicle_id: '550e8400-e29b-41d4-a716-446655440004',
        driver_id: '550e8400-e29b-41d4-a716-446655440005',
        assignment_type: 'designated',
        start_date: '2025-01-01',
        is_ongoing: true,
        commuting_authorized: true,
        on_call_only: false,
        requires_secured_parking: false,
        geographic_constraints: { region: 'north', counties: ['Miami-Dade', 'Broward'] },
      };

      mockPool.query.mockResolvedValue({ rows: [{ id: 'new-id' }], rowCount: 1 } as any);

      await repository.create(tenantId, userId, data);

      const call = mockPool.query.mock.calls[0];
      const params = call[1] as any[];

      // Verify geographic_constraints is stringified
      const geoConstraintsParam = params[11]; // 12th parameter (0-indexed)
      expect(typeof geoConstraintsParam).toBe('string');
      expect(JSON.parse(geoConstraintsParam)).toEqual(data.geographic_constraints);
    });
  });

  describe('update', () => {
    it('should use parameterized queries with tenant_id filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440006';
      const data: UpdateAssignmentData = {
        start_date: '2025-02-01',
        commuting_authorized: false,
      };

      mockPool.query.mockResolvedValue({ rows: [{ id: assignmentId }], rowCount: 1 } as any);

      await repository.update(assignmentId, tenantId, data);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('WHERE id = $');
      expect(query).toContain('AND tenant_id = $');

      // Verify tenant_id and id are in parameters
      expect(params).toContain(assignmentId);
      expect(params).toContain(tenantId);

      // Verify no hardcoded values
      expect(query).not.toContain('2025-02-01');
    });

    it('should return null when no fields to update', async () => {
      const result = await repository.update('any-id', tenantId, {});

      expect(result).toBeNull();
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe('updateLifecycleState', () => {
    it('should use parameterized queries with tenant_id filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440007';
      const lifecycleState = 'active';

      mockPool.query.mockResolvedValue({ rows: [{ id: assignmentId }], rowCount: 1 } as any);

      await repository.updateLifecycleState(assignmentId, tenantId, lifecycleState);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('$1');
      expect(query).toContain('$2');
      expect(query).toContain('$3');

      // Verify parameters
      expect(params[0]).toBe(lifecycleState);
      expect(params[1]).toBe(assignmentId);
      expect(params[2]).toBe(tenantId);
    });
  });

  describe('recommend', () => {
    it('should use parameterized queries with tenant_id filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440008';
      const notes = 'Recommendation notes';

      mockPool.query.mockResolvedValue({ rows: [{ id: assignmentId }], rowCount: 1 } as any);

      await repository.recommend(assignmentId, tenantId, userId, notes);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('$1');
      expect(query).toContain('$2');
      expect(query).toContain('$3');
      expect(query).toContain('$4');

      // Verify parameters
      expect(params[0]).toBe(userId);
      expect(params[1]).toBe(notes);
      expect(params[2]).toBe(assignmentId);
      expect(params[3]).toBe(tenantId);
    });
  });

  describe('approve', () => {
    it('should use parameterized queries with tenant_id and lifecycle_state filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440009';
      const notes = 'Approval notes';

      mockPool.query.mockResolvedValue({ rows: [{ id: assignmentId }], rowCount: 1 } as any);

      await repository.approve(assignmentId, tenantId, userId, notes);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('WHERE id = $3 AND tenant_id = $4 AND lifecycle_state = \'submitted\'');

      // Verify parameters
      expect(params[0]).toBe(userId);
      expect(params[1]).toBe(notes);
      expect(params[2]).toBe(assignmentId);
      expect(params[3]).toBe(tenantId);
    });
  });

  describe('deny', () => {
    it('should use parameterized queries with tenant_id and lifecycle_state filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440010';
      const reason = 'Denial reason';

      mockPool.query.mockResolvedValue({ rows: [{ id: assignmentId }], rowCount: 1 } as any);

      await repository.deny(assignmentId, tenantId, userId, reason);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('WHERE id = $3 AND tenant_id = $4 AND lifecycle_state = \'submitted\'');

      // Verify parameters
      expect(params[0]).toBe(userId);
      expect(params[1]).toBe(reason);
      expect(params[2]).toBe(assignmentId);
      expect(params[3]).toBe(tenantId);
    });
  });

  describe('activate', () => {
    it('should use parameterized queries with tenant_id and approval_status filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440011';

      mockPool.query.mockResolvedValue({ rows: [{ id: assignmentId }], rowCount: 1 } as any);

      await repository.activate(assignmentId, tenantId);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('WHERE id = $1 AND tenant_id = $2 AND approval_status = \'approved\'');

      // Verify parameters
      expect(params[0]).toBe(assignmentId);
      expect(params[1]).toBe(tenantId);
    });
  });

  describe('terminate', () => {
    it('should use parameterized queries with tenant_id filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440012';
      const reason = 'Termination reason';
      const effectiveDate = '2025-12-31';

      mockPool.query.mockResolvedValue({ rows: [{ id: assignmentId }], rowCount: 1 } as any);

      await repository.terminate(assignmentId, tenantId, reason, effectiveDate);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('$1');
      expect(query).toContain('$2');
      expect(query).toContain('$3');
      expect(query).toContain('$4');

      // Verify parameters
      expect(params[0]).toBe(effectiveDate);
      expect(params[1]).toBe(reason);
      expect(params[2]).toBe(assignmentId);
      expect(params[3]).toBe(tenantId);
    });
  });

  describe('getHistory', () => {
    it('should use parameterized queries with tenant_id filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440013';

      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await repository.getHistory(assignmentId, tenantId);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('WHERE vah.vehicle_assignment_id = $1 AND vah.tenant_id = $2');

      // Verify parameters
      expect(params[0]).toBe(assignmentId);
      expect(params[1]).toBe(tenantId);
    });
  });

  describe('deleteDraft', () => {
    it('should use parameterized queries with tenant_id and lifecycle_state filter', async () => {
      const assignmentId = '550e8400-e29b-41d4-a716-446655440014';

      mockPool.query.mockResolvedValue({ rows: [{ id: assignmentId }], rowCount: 1 } as any);

      const result = await repository.deleteDraft(assignmentId, tenantId);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify parameterized query
      expect(query).toContain('WHERE id = $1 AND tenant_id = $2 AND lifecycle_state = \'draft\'');

      // Verify parameters
      expect(params[0]).toBe(assignmentId);
      expect(params[1]).toBe(tenantId);

      // Verify result
      expect(result).toBe(true);
    });

    it('should return false when draft not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await repository.deleteDraft('nonexistent-id', tenantId);

      expect(result).toBe(false);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in findAll filters', async () => {
      const maliciousFilters = {
        assignment_type: "'; DROP TABLE vehicle_assignments; --",
        lifecycle_state: "active' OR '1'='1",
      };
      const pagination = { page: 1, limit: 50 };

      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await repository.findAll(tenantId, maliciousFilters, pagination);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;
      const params = call[1] as any[];

      // Verify malicious input is parameterized, not interpolated
      expect(query).not.toContain('DROP TABLE');
      expect(query).not.toContain("OR '1'='1");
      expect(params).toContain(maliciousFilters.assignment_type);
      expect(params).toContain(maliciousFilters.lifecycle_state);
    });

    it('should prevent SQL injection in update', async () => {
      const assignmentId = "'; DROP TABLE vehicle_assignments; --";
      const data: UpdateAssignmentData = {
        start_date: "2025-01-01'; DELETE FROM users; --",
      };

      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await repository.update(assignmentId, tenantId, data);

      const call = mockPool.query.mock.calls[0];
      const query = call[0] as string;

      // Verify malicious input is not in query
      expect(query).not.toContain('DROP TABLE');
      expect(query).not.toContain('DELETE FROM users');
    });
  });
});
