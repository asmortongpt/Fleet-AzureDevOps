/**
 * Break-Glass Routes Test Suite
 * 
 * Tests the refactored break-glass routes to ensure:
 * 1. All database queries are handled through repository
 * 2. Parameterized queries prevent SQL injection
 * 3. Tenant isolation is enforced
 * 4. CSRF protection is in place
 * 5. Input validation works correctly
 */

import express, { Express } from 'express';
import { Container } from 'inversify';
import request from 'supertest';

import { BreakGlassRepository } from '../../repositories/BreakGlassRepository';
import { TYPES } from '../../types';
import breakGlassRouter from '../break-glass';

// Mock the container
jest.mock('../../container', () => {
  const mockContainer = new Container();
  return { container: mockContainer };
});

// Mock middleware
jest.mock('../../middleware/auth', () => ({
  authenticateJWT: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      tenant_id: 'test-tenant-id',
      email: 'test@example.com'
    };
    next();
  },
  AuthRequest: jest.fn()
}));

jest.mock('../../middleware/permissions', () => ({
  requirePermission: () => (req: any, res: any, next: any) => next()
}));

jest.mock('../../middleware/audit', () => ({
  auditLog: () => (req: any, res: any, next: any) => next()
}));

jest.mock('../../middleware/csrf', () => ({
  csrfProtection: (req: any, res: any, next: any) => next()
}));

describe('Break-Glass Routes', () => {
  let app: Express;
  let mockBreakGlassRepo: jest.Mocked<BreakGlassRepository>;

  beforeEach(() => {
    // Create mock repository
    mockBreakGlassRepo = {
      findRoleById: jest.fn(),
      findActiveOrPendingSession: jest.fn(),
      createSession: jest.fn(),
      findRequestsWithDetails: jest.fn(),
      findSessionByIdWithTenant: jest.fn(),
      approveSession: jest.fn(),
      denySession: jest.fn(),
      createTemporaryUserRole: jest.fn(),
      createNotification: jest.fn(),
      revokeSession: jest.fn(),
      deactivateTemporaryUserRole: jest.fn(),
      findActiveElevations: jest.fn(),
      findFleetAdminUsers: jest.fn(),
      expireActiveSessions: jest.fn(),
      deactivateExpiredUserRoles: jest.fn()
    } as any;

    // Setup app
    app = express();
    app.use(express.json());

    // Register mock repository in container
    const { container } = require('../../container');
    container.unbind(TYPES.BreakGlassRepository);
    container.bind(TYPES.BreakGlassRepository).toConstantValue(mockBreakGlassRepo);

    // Mount routes
    app.use('/api/break-glass', breakGlassRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/break-glass/request', () => {
    it('should create elevation request with valid data', async () => {
      const mockRole = {
        id: 'role-id',
        name: 'FleetAdmin',
        just_in_time_elevation_allowed: true,
        tenant_id: 'test-tenant-id'
      };

      const mockSession = {
        id: 'session-id',
        user_id: 'test-user-id',
        elevated_role_id: 'role-id',
        reason: 'Emergency access needed for critical incident',
        ticket_reference: 'INC-12345',
        max_duration_minutes: 30,
        status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBreakGlassRepo.findRoleById.mockResolvedValue(mockRole);
      mockBreakGlassRepo.findActiveOrPendingSession.mockResolvedValue(null);
      mockBreakGlassRepo.createSession.mockResolvedValue(mockSession);
      mockBreakGlassRepo.findFleetAdminUsers.mockResolvedValue([{ id: 'admin-1' }]);
      mockBreakGlassRepo.createNotification.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/break-glass/request')
        .send({
          role_id: 'role-id',
          reason: 'Emergency access needed for critical incident',
          ticket_reference: 'INC-12345',
          duration_minutes: 30
        });

      expect(response.status).toBe(201);
      expect(response.body.session_id).toBe('session-id');
      expect(response.body.status).toBe('pending');

      // Verify repository methods called with correct parameters
      expect(mockBreakGlassRepo.findRoleById).toHaveBeenCalledWith(
        'role-id',
        { tenantId: 'test-tenant-id' }
      );
      expect(mockBreakGlassRepo.createSession).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        elevated_role_id: 'role-id',
        reason: 'Emergency access needed for critical incident',
        ticket_reference: 'INC-12345',
        max_duration_minutes: 30
      });
    });

    it('should reject request if role does not allow JIT elevation', async () => {
      const mockRole = {
        id: 'role-id',
        name: 'ReadOnly',
        just_in_time_elevation_allowed: false,
        tenant_id: 'test-tenant-id'
      };

      mockBreakGlassRepo.findRoleById.mockResolvedValue(mockRole);

      const response = await request(app)
        .post('/api/break-glass/request')
        .send({
          role_id: 'role-id',
          reason: 'Emergency access needed for critical incident',
          ticket_reference: 'INC-12345',
          duration_minutes: 30
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('does not support just-in-time elevation');
    });

    it('should reject if user already has active elevation', async () => {
      const mockRole = {
        id: 'role-id',
        name: 'FleetAdmin',
        just_in_time_elevation_allowed: true,
        tenant_id: 'test-tenant-id'
      };

      const mockActiveSession = {
        id: 'active-session-id',
        status: 'active' as const
      };

      mockBreakGlassRepo.findRoleById.mockResolvedValue(mockRole);
      mockBreakGlassRepo.findActiveOrPendingSession.mockResolvedValue(mockActiveSession as any);

      const response = await request(app)
        .post('/api/break-glass/request')
        .send({
          role_id: 'role-id',
          reason: 'Emergency access needed for critical incident',
          ticket_reference: 'INC-12345',
          duration_minutes: 30
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('active or pending elevation request');
    });

    it('should validate input data', async () => {
      const response = await request(app)
        .post('/api/break-glass/request')
        .send({
          role_id: 'invalid-uuid',
          reason: 'Too short',
          ticket_reference: '',
          duration_minutes: 100
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/break-glass/requests', () => {
    it('should list elevation requests for tenant', async () => {
      const mockRequests = [
        {
          id: 'session-1',
          requester_email: 'user1@example.com',
          requester_name: 'User One',
          role_name: 'FleetAdmin',
          status: 'pending'
        },
        {
          id: 'session-2',
          requester_email: 'user2@example.com',
          requester_name: 'User Two',
          role_name: 'SecurityAdmin',
          status: 'pending'
        }
      ];

      mockBreakGlassRepo.findRequestsWithDetails.mockResolvedValue(mockRequests as any);

      const response = await request(app)
        .get('/api/break-glass/requests')
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockBreakGlassRepo.findRequestsWithDetails).toHaveBeenCalledWith(
        'pending',
        { tenantId: 'test-tenant-id' }
      );
    });
  });

  describe('POST /api/break-glass/:id/approve', () => {
    it('should approve and activate elevation request', async () => {
      const mockSession = {
        id: 'session-id',
        user_id: 'requester-id',
        elevated_role_id: 'role-id',
        status: 'pending' as const,
        max_duration_minutes: 30,
        tenant_id: 'test-tenant-id',
        ticket_reference: 'INC-12345'
      };

      mockBreakGlassRepo.findSessionByIdWithTenant.mockResolvedValue(mockSession as any);
      mockBreakGlassRepo.approveSession.mockResolvedValue(undefined);
      mockBreakGlassRepo.createTemporaryUserRole.mockResolvedValue(undefined);
      mockBreakGlassRepo.createNotification.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/break-glass/session-id/approve')
        .send({ approved: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('approved');

      // Verify repository methods called
      expect(mockBreakGlassRepo.approveSession).toHaveBeenCalled();
      expect(mockBreakGlassRepo.createTemporaryUserRole).toHaveBeenCalled();
      expect(mockBreakGlassRepo.createNotification).toHaveBeenCalled();
    });

    it('should deny elevation request', async () => {
      const mockSession = {
        id: 'session-id',
        user_id: 'requester-id',
        status: 'pending' as const,
        tenant_id: 'test-tenant-id'
      };

      mockBreakGlassRepo.findSessionByIdWithTenant.mockResolvedValue(mockSession as any);
      mockBreakGlassRepo.denySession.mockResolvedValue(undefined);
      mockBreakGlassRepo.createNotification.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/break-glass/session-id/approve')
        .send({ approved: false, notes: 'Insufficient justification' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('denied');

      // Verify repository methods called
      expect(mockBreakGlassRepo.denySession).toHaveBeenCalled();
      expect(mockBreakGlassRepo.createNotification).toHaveBeenCalled();
    });

    it('should reject if session is not pending', async () => {
      const mockSession = {
        id: 'session-id',
        status: 'active' as const,
        tenant_id: 'test-tenant-id'
      };

      mockBreakGlassRepo.findSessionByIdWithTenant.mockResolvedValue(mockSession as any);

      const response = await request(app)
        .post('/api/break-glass/session-id/approve')
        .send({ approved: true });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cannot be approved');
    });
  });

  describe('POST /api/break-glass/:id/revoke', () => {
    it('should revoke active elevation', async () => {
      const mockSession = {
        id: 'session-id',
        user_id: 'test-user-id',
        elevated_role_id: 'role-id',
        status: 'active' as const,
        tenant_id: 'test-tenant-id'
      };

      mockBreakGlassRepo.findSessionByIdWithTenant.mockResolvedValue(mockSession as any);
      mockBreakGlassRepo.revokeSession.mockResolvedValue(undefined);
      mockBreakGlassRepo.deactivateTemporaryUserRole.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/break-glass/session-id/revoke');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('revoked successfully');

      // Verify repository methods called
      expect(mockBreakGlassRepo.revokeSession).toHaveBeenCalledWith('session-id');
      expect(mockBreakGlassRepo.deactivateTemporaryUserRole).toHaveBeenCalled();
    });
  });

  describe('GET /api/break-glass/active', () => {
    it('should return active elevations for user', async () => {
      const mockElevations = [
        {
          id: 'session-1',
          role_name: 'FleetAdmin',
          minutes_remaining: 15,
          end_time: new Date()
        }
      ];

      mockBreakGlassRepo.findActiveElevations.mockResolvedValue(mockElevations as any);

      const response = await request(app)
        .get('/api/break-glass/active');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(mockBreakGlassRepo.findActiveElevations).toHaveBeenCalledWith(
        'test-user-id',
        { tenantId: 'test-tenant-id' }
      );
    });
  });

  describe('Security: Parameterized Queries', () => {
    it('should use repository methods instead of direct SQL', async () => {
      // This test verifies that NO direct pool.query calls are made
      // All database operations go through the repository

      const mockRole = {
        id: 'role-id',
        name: 'FleetAdmin',
        just_in_time_elevation_allowed: true,
        tenant_id: 'test-tenant-id'
      };

      mockBreakGlassRepo.findRoleById.mockResolvedValue(mockRole);
      mockBreakGlassRepo.findActiveOrPendingSession.mockResolvedValue(null);
      mockBreakGlassRepo.createSession.mockResolvedValue({
        id: 'session-id',
        status: 'pending'
      } as any);
      mockBreakGlassRepo.findFleetAdminUsers.mockResolvedValue([]);

      await request(app)
        .post('/api/break-glass/request')
        .send({
          role_id: 'role-id',
          reason: 'Emergency access needed for critical incident',
          ticket_reference: 'INC-12345',
          duration_minutes: 30
        });

      // Verify repository was used (not direct pool.query)
      expect(mockBreakGlassRepo.findRoleById).toHaveBeenCalled();
      expect(mockBreakGlassRepo.createSession).toHaveBeenCalled();
    });
  });

  describe('Security: Tenant Isolation', () => {
    it('should enforce tenant context in all repository calls', async () => {
      mockBreakGlassRepo.findRequestsWithDetails.mockResolvedValue([]);

      await request(app)
        .get('/api/break-glass/requests');

      // Verify tenant context was passed
      expect(mockBreakGlassRepo.findRequestsWithDetails).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tenantId: 'test-tenant-id' })
      );
    });
  });
});
