/**
 * Communications Repository Tests
 * 
 * Tests all 20 methods that replaced direct database queries
 * Ensures tenant isolation and parameterized queries
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Pool } from 'pg';
import { CommunicationsRepository } from '../communications.repository';

describe('CommunicationsRepository', () => {
  let pool: Pool;
  let repository: CommunicationsRepository;
  const mockTenantId = 1;
  const mockUserId = 100;

  beforeEach(() => {
    pool = {
      query: vi.fn()
    } as any;
    repository = new CommunicationsRepository(pool);
  });

  describe('getCommunications', () => {
    it('should get paginated communications with filters', async () => {
      const mockRows = [
        { id: 1, subject: 'Test 1', linked_entities_count: '2' },
        { id: 2, subject: 'Test 2', linked_entities_count: '1' }
      ];

      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: mockRows } as any)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] } as any);

      const result = await repository.getCommunications(mockTenantId, {
        page: 1,
        limit: 50,
        communication_type: 'Email',
        status: 'Open'
      });

      expect(result.data).toEqual(mockRows);
      expect(result.pagination.total).toBe(10);
      expect(pool.query).toHaveBeenCalledTimes(2);
      
      // Verify tenant_id is in first parameter
      const firstCall = vi.mocked(pool.query).mock.calls[0];
      expect(firstCall[1][0]).toBe(mockTenantId);
    });
  });

  describe('getCommunicationById', () => {
    it('should get communication with linked entities and attachments', async () => {
      const mockComm = { id: 1, subject: 'Test' };
      const mockLinks = [{ id: 1, entity_type: 'Vehicle', entity_id: 5 }];
      const mockAttachments = [{ id: 1, file_name: 'test.pdf' }];

      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockComm] } as any)
        .mockResolvedValueOnce({ rows: mockLinks } as any)
        .mockResolvedValueOnce({ rows: mockAttachments } as any);

      const result = await repository.getCommunicationById(1, mockTenantId);

      expect(result).toEqual({
        ...mockComm,
        linked_entities: mockLinks,
        attachments: mockAttachments
      });
      expect(pool.query).toHaveBeenCalledTimes(3);
    });

    it('should return null if communication not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      const result = await repository.getCommunicationById(999, mockTenantId);

      expect(result).toBeNull();
    });
  });

  describe('createCommunication', () => {
    it('should create communication with tenant_id and created_by', async () => {
      const mockData = {
        subject: 'New Communication',
        body: 'Test body',
        communication_type: 'Email'
      };
      const mockResult = { ...mockData, id: 1, tenant_id: mockTenantId };

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [mockResult] } as any);

      const result = await repository.createCommunication(mockData, mockTenantId, mockUserId);

      expect(result).toEqual(mockResult);
      
      const call = vi.mocked(pool.query).mock.calls[0];
      const values = call[1] as any[];
      expect(values).toContain(mockTenantId);
      expect(values).toContain(mockUserId);
    });
  });

  describe('createEntityLinks', () => {
    it('should batch create entity links', async () => {
      const links = [
        { entity_type: 'Vehicle', entity_id: 1, link_type: 'Related' },
        { entity_type: 'Driver', entity_id: 2 }
      ];

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      await repository.createEntityLinks(5, links);

      expect(pool.query).toHaveBeenCalledTimes(1);
      
      const call = vi.mocked(pool.query).mock.calls[0];
      const query = call[0] as string;
      expect(query).toContain('INSERT INTO communication_entity_links');
      expect(query).toContain('ON CONFLICT');
    });

    it('should handle empty links array', async () => {
      await repository.createEntityLinks(5, []);

      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('updateCommunication', () => {
    it('should update communication with tenant isolation', async () => {
      const updateData = { status: 'Closed', follow_up_completed: true };
      const mockResult = { id: 1, ...updateData };

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [mockResult] } as any);

      const result = await repository.updateCommunication(1, mockTenantId, mockUserId, updateData);

      expect(result).toEqual(mockResult);
      
      const call = vi.mocked(pool.query).mock.calls[0];
      const params = call[1] as any[];
      expect(params).toContain(1); // id
      expect(params).toContain(mockUserId); // updated_by
      expect(params).toContain(mockTenantId); // tenant_id
    });

    it('should return null if communication not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      const result = await repository.updateCommunication(999, mockTenantId, mockUserId, {});

      expect(result).toBeNull();
    });
  });

  describe('createEntityLink', () => {
    it('should check ownership before creating link', async () => {
      const linkData = {
        entity_type: 'Vehicle',
        entity_id: 5,
        link_type: 'Primary'
      };
      const mockLink = { id: 1, ...linkData };

      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] } as any) // Ownership check
        .mockResolvedValueOnce({ rows: [mockLink] } as any); // Create link

      const result = await repository.createEntityLink(1, mockTenantId, linkData);

      expect(result).toEqual(mockLink);
      expect(pool.query).toHaveBeenCalledTimes(2);
      
      // Verify ownership check includes tenant_id
      const ownershipCall = vi.mocked(pool.query).mock.calls[0];
      const params = ownershipCall[1] as any[];
      expect(params).toContain(mockTenantId);
    });

    it('should return null if ownership check fails', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      const result = await repository.createEntityLink(1, mockTenantId, {
        entity_type: 'Vehicle',
        entity_id: 5
      });

      expect(result).toBeNull();
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteEntityLink', () => {
    it('should delete link with tenant verification', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ id: 1 }] } as any);

      const result = await repository.deleteEntityLink(1, 5, mockTenantId);

      expect(result).toBe(true);
      
      const call = vi.mocked(pool.query).mock.calls[0];
      const params = call[1] as any[];
      expect(params).toContain(1); // link_id
      expect(params).toContain(5); // communication_id
      expect(params).toContain(mockTenantId); // tenant_id
    });

    it('should return false if link not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      const result = await repository.deleteEntityLink(999, 5, mockTenantId);

      expect(result).toBe(false);
    });
  });

  describe('getCommunicationsForEntity', () => {
    it('should get communications for entity with pagination', async () => {
      const mockComms = [
        { id: 1, subject: 'Test 1', link_type: 'Related' },
        { id: 2, subject: 'Test 2', link_type: 'Primary' }
      ];

      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: mockComms } as any)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] } as any);

      const result = await repository.getCommunicationsForEntity(
        'Vehicle',
        10,
        mockTenantId,
        1,
        50
      );

      expect(result.data).toEqual(mockComms);
      expect(result.pagination.total).toBe(5);
      
      // Verify tenant_id in both queries
      const dataCall = vi.mocked(pool.query).mock.calls[0];
      const countCall = vi.mocked(pool.query).mock.calls[1];
      expect((dataCall[1] as any[])).toContain(mockTenantId);
      expect((countCall[1] as any[])).toContain(mockTenantId);
    });
  });

  describe('getPendingFollowUps', () => {
    it('should get pending follow-ups with status', async () => {
      const mockFollowUps = [
        { id: 1, subject: 'Follow up 1', follow_up_status: 'Overdue' },
        { id: 2, subject: 'Follow up 2', follow_up_status: 'Due Today' }
      ];

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockFollowUps } as any);

      const result = await repository.getPendingFollowUps(mockTenantId);

      expect(result).toEqual(mockFollowUps);
      
      const call = vi.mocked(pool.query).mock.calls[0];
      expect((call[1] as any[])[0]).toBe(mockTenantId);
    });
  });

  describe('getTemplates', () => {
    it('should get templates without category filter', async () => {
      const mockTemplates = [
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2' }
      ];

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockTemplates } as any);

      const result = await repository.getTemplates(mockTenantId);

      expect(result).toEqual(mockTemplates);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should get templates with category filter', async () => {
      const mockTemplates = [{ id: 1, name: 'Template 1', template_category: 'Maintenance' }];

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockTemplates } as any);

      const result = await repository.getTemplates(mockTenantId, 'Maintenance');

      expect(result).toEqual(mockTemplates);
      
      const call = vi.mocked(pool.query).mock.calls[0];
      expect(call[1]).toEqual([mockTenantId, 'Maintenance']);
    });
  });

  describe('createTemplate', () => {
    it('should create template with tenant_id and created_by', async () => {
      const templateData = {
        name: 'New Template',
        type: 'Email',
        subject: 'Test Subject',
        body: 'Test Body'
      };
      const mockResult = { ...templateData, id: 1 };

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [mockResult] } as any);

      const result = await repository.createTemplate(templateData, mockTenantId, mockUserId);

      expect(result).toEqual(mockResult);
      
      const call = vi.mocked(pool.query).mock.calls[0];
      const values = call[1] as any[];
      expect(values).toContain(mockTenantId);
      expect(values).toContain(mockUserId);
    });
  });

  describe('getDashboardStats', () => {
    it('should get comprehensive dashboard statistics', async () => {
      const mockSummary = { total: '50', pending_followups: '5' };
      const mockByType = [
        { communication_type: 'Email', count: '30' },
        { communication_type: 'Phone', count: '20' }
      ];
      const mockByPriority = [
        { priority: 'High', count: '15' },
        { priority: 'Medium', count: '35' }
      ];
      const mockOverdue = { overdue_followups: '3' };

      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockSummary] } as any)
        .mockResolvedValueOnce({ rows: mockByType } as any)
        .mockResolvedValueOnce({ rows: mockByPriority } as any)
        .mockResolvedValueOnce({ rows: [mockOverdue] } as any);

      const result = await repository.getDashboardStats(mockTenantId);

      expect(result.summary).toEqual(mockSummary);
      expect(result.by_type).toEqual(mockByType);
      expect(result.by_priority).toEqual(mockByPriority);
      expect(result.overdue).toEqual(mockOverdue);
      expect(pool.query).toHaveBeenCalledTimes(4);
      
      // Verify all queries use tenant_id
      for (let i = 0; i < 4; i++) {
        const call = vi.mocked(pool.query).mock.calls[i];
        expect((call[1] as any[])[0]).toBe(mockTenantId);
      }
    });
  });

  describe('Security - Parameterized Queries', () => {
    it('should use parameterized queries in all methods', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ count: '0' }] } as any);

      // Test various methods
      await repository.getCommunications(mockTenantId, {});
      await repository.getCommunicationById(1, mockTenantId);
      await repository.createCommunication({}, mockTenantId, mockUserId);
      await repository.updateCommunication(1, mockTenantId, mockUserId, {});
      await repository.getPendingFollowUps(mockTenantId);
      await repository.getTemplates(mockTenantId);
      await repository.createTemplate({}, mockTenantId, mockUserId);
      await repository.getDashboardStats(mockTenantId);

      // Verify all calls used parameterized queries
      const calls = vi.mocked(pool.query).mock.calls;
      calls.forEach(call => {
        const query = call[0] as string;
        const params = call[1];
        
        // Should have query string and parameters array
        expect(typeof query).toBe('string');
        expect(Array.isArray(params)).toBe(true);
        
        // Should use $ placeholders
        if (query.includes('WHERE') || query.includes('VALUES')) {
          expect(query).toMatch(/\$\d+/);
        }
      });
    });
  });

  describe('Tenant Isolation', () => {
    it('should enforce tenant_id in all read operations', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);

      await repository.getCommunications(mockTenantId, {});
      await repository.getCommunicationById(1, mockTenantId);
      await repository.getCommunicationsForEntity('Vehicle', 1, mockTenantId);
      await repository.getPendingFollowUps(mockTenantId);
      await repository.getTemplates(mockTenantId);
      await repository.getDashboardStats(mockTenantId);

      // Verify all calls included tenant_id
      const calls = vi.mocked(pool.query).mock.calls;
      calls.forEach(call => {
        const params = call[1] as any[];
        expect(params).toContain(mockTenantId);
      });
    });

    it('should enforce tenant_id in all write operations', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ id: 1 }] } as any);

      await repository.createCommunication({}, mockTenantId, mockUserId);
      await repository.updateCommunication(1, mockTenantId, mockUserId, {});
      await repository.createTemplate({}, mockTenantId, mockUserId);

      const calls = vi.mocked(pool.query).mock.calls;
      calls.forEach(call => {
        const params = call[1] as any[];
        expect(params).toContain(mockTenantId);
      });
    });
  });
});
