/**
 * Sync Service Tests
 *
 * Tests for Microsoft Graph delta sync including:
 * - Delta query implementation
 * - Sync state management
 * - Conflict resolution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

interface SyncState {
  resourceType: string;
  deltaLink: string | null;
  lastSync: Date;
  userId: string;
}

interface DeltaResponse {
  value: any[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
}

class SyncService {
  private syncStates: Map<string, SyncState> = new Map();

  constructor(private graphService: any) {}

  async performDeltaSync(userId: string, resourceType: 'messages' | 'channels'): Promise<any[]> {
    const key = `${userId}_${resourceType}`;
    const syncState = this.syncStates.get(key);

    let deltaLink = syncState?.deltaLink;
    const allChanges: any[] = [];

    // Perform delta query
    do {
      const response: DeltaResponse = deltaLink
        ? await this.graphService.makeGraphRequest(deltaLink)
        : await this.graphService.makeGraphRequest(
            `/users/${userId}/${resourceType}/delta`
          );

      allChanges.push(...response.value);
      deltaLink = response['@odata.nextLink'] || response['@odata.deltaLink'] || null;

      // Update sync state
      if (response['@odata.deltaLink']) {
        this.syncStates.set(key, {
          resourceType,
          deltaLink: response['@odata.deltaLink'],
          lastSync: new Date(),
          userId
        });
      }
    } while (deltaLink?.includes('nextLink'));

    return allChanges;
  }

  async getSyncState(userId: string, resourceType: string): Promise<SyncState | undefined> {
    return this.syncStates.get(`${userId}_${resourceType}`);
  }

  async resetSync(userId: string, resourceType: string): Promise<void> {
    this.syncStates.delete(`${userId}_${resourceType}`);
  }

  resolveConflict(local: any, remote: any): any {
    // Use remote version if modified timestamp is newer
    const localModified = new Date(local.lastModifiedDateTime || 0);
    const remoteModified = new Date(remote.lastModifiedDateTime || 0);

    return remoteModified > localModified ? remote : local;
  }

  async syncMessages(userId: string): Promise<{ added: number; updated: number; deleted: number }> {
    const changes = await this.performDeltaSync(userId, 'messages');

    const stats = { added: 0, updated: 0, deleted: 0 };

    for (const change of changes) {
      if (change['@removed']) {
        stats.deleted++;
      } else if (change.id) {
        // Simplified: check if exists (in real implementation, check DB)
        stats.updated++;
      } else {
        stats.added++;
      }
    }

    return stats;
  }
}

describe('SyncService', () => {
  let service: SyncService;
  let mockGraphService: any;

  beforeEach(() => {
    mockGraphService = {
      makeGraphRequest: vi.fn()
    };
    service = new SyncService(mockGraphService);
  });

  describe('Delta Query', () => {
    it('should perform initial delta sync', async () => {
      const mockResponse: DeltaResponse = {
        value: [
          { id: 'msg1', subject: 'Test 1' },
          { id: 'msg2', subject: 'Test 2' }
        ],
        '@odata.deltaLink': 'https://graph.microsoft.com/v1.0/users/user1/messages/delta?$deltatoken=abc'
      };

      mockGraphService.makeGraphRequest.mockResolvedValue(mockResponse);

      const changes = await service.performDeltaSync('user1', 'messages');

      expect(changes).toHaveLength(2);
      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/users/user1/messages/delta'
      );
    });

    it('should use delta link for subsequent syncs', async () => {
      const initialResponse: DeltaResponse = {
        value: [{ id: 'msg1' }],
        '@odata.deltaLink': 'https://graph.microsoft.com/delta?$deltatoken=abc'
      };

      const subsequentResponse: DeltaResponse = {
        value: [{ id: 'msg2' }],
        '@odata.deltaLink': 'https://graph.microsoft.com/delta?$deltatoken=def'
      };

      mockGraphService.makeGraphRequest
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(subsequentResponse);

      // First sync
      await service.performDeltaSync('user1', 'messages');

      // Second sync should use delta link
      const changes = await service.performDeltaSync('user1', 'messages');

      expect(mockGraphService.makeGraphRequest).toHaveBeenLastCalledWith(
        'https://graph.microsoft.com/delta?$deltatoken=abc'
      );
    });

    it('should handle paginated delta responses', async () => {
      const page1: DeltaResponse = {
        value: [{ id: 'msg1' }],
        '@odata.nextLink': 'https://graph.microsoft.com/delta?$skiptoken=page2'
      };

      const page2: DeltaResponse = {
        value: [{ id: 'msg2' }],
        '@odata.deltaLink': 'https://graph.microsoft.com/delta?$deltatoken=final'
      };

      mockGraphService.makeGraphRequest
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const changes = await service.performDeltaSync('user1', 'messages');

      expect(changes).toHaveLength(2);
      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sync State Management', () => {
    it('should save sync state after delta sync', async () => {
      const mockResponse: DeltaResponse = {
        value: [],
        '@odata.deltaLink': 'https://graph.microsoft.com/delta?$deltatoken=xyz'
      };

      mockGraphService.makeGraphRequest.mockResolvedValue(mockResponse);

      await service.performDeltaSync('user1', 'messages');

      const syncState = await service.getSyncState('user1', 'messages');

      expect(syncState).toBeDefined();
      expect(syncState?.deltaLink).toBe('https://graph.microsoft.com/delta?$deltatoken=xyz');
      expect(syncState?.userId).toBe('user1');
      expect(syncState?.resourceType).toBe('messages');
      expect(syncState?.lastSync).toBeInstanceOf(Date);
    });

    it('should reset sync state', async () => {
      const mockResponse: DeltaResponse = {
        value: [],
        '@odata.deltaLink': 'https://graph.microsoft.com/delta?$deltatoken=xyz'
      };

      mockGraphService.makeGraphRequest.mockResolvedValue(mockResponse);

      await service.performDeltaSync('user1', 'messages');
      await service.resetSync('user1', 'messages');

      const syncState = await service.getSyncState('user1', 'messages');

      expect(syncState).toBeUndefined();
    });

    it('should maintain separate sync states per user and resource', async () => {
      const mockResponse: DeltaResponse = {
        value: [],
        '@odata.deltaLink': 'https://graph.microsoft.com/delta?$deltatoken=abc'
      };

      mockGraphService.makeGraphRequest.mockResolvedValue(mockResponse);

      await service.performDeltaSync('user1', 'messages');
      await service.performDeltaSync('user2', 'messages');
      await service.performDeltaSync('user1', 'channels');

      const state1 = await service.getSyncState('user1', 'messages');
      const state2 = await service.getSyncState('user2', 'messages');
      const state3 = await service.getSyncState('user1', 'channels');

      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state3).toBeDefined();
      expect(state1?.userId).toBe('user1');
      expect(state2?.userId).toBe('user2');
      expect(state3?.resourceType).toBe('channels');
    });
  });

  describe('Conflict Resolution', () => {
    it('should choose remote when remote is newer', () => {
      const local = {
        id: 'msg1',
        content: 'Local version',
        lastModifiedDateTime: '2025-01-15T10:00:00Z'
      };

      const remote = {
        id: 'msg1',
        content: 'Remote version',
        lastModifiedDateTime: '2025-01-15T11:00:00Z'
      };

      const resolved = service.resolveConflict(local, remote);

      expect(resolved).toEqual(remote);
      expect(resolved.content).toBe('Remote version');
    });

    it('should choose local when local is newer', () => {
      const local = {
        id: 'msg1',
        content: 'Local version',
        lastModifiedDateTime: '2025-01-15T12:00:00Z'
      };

      const remote = {
        id: 'msg1',
        content: 'Remote version',
        lastModifiedDateTime: '2025-01-15T11:00:00Z'
      };

      const resolved = service.resolveConflict(local, remote);

      expect(resolved).toEqual(local);
      expect(resolved.content).toBe('Local version');
    });

    it('should handle missing timestamps', () => {
      const local = { id: 'msg1', content: 'Local' };
      const remote = {
        id: 'msg1',
        content: 'Remote',
        lastModifiedDateTime: '2025-01-15T11:00:00Z'
      };

      const resolved = service.resolveConflict(local, remote);

      expect(resolved).toEqual(remote);
    });
  });

  describe('Message Sync', () => {
    it('should track added, updated, and deleted messages', async () => {
      const mockResponse: DeltaResponse = {
        value: [
          { id: 'msg1', subject: 'New message' },
          { id: 'msg2', subject: 'Updated message' },
          { '@removed': { reason: 'deleted' }, id: 'msg3' }
        ],
        '@odata.deltaLink': 'https://graph.microsoft.com/delta?$deltatoken=xyz'
      };

      mockGraphService.makeGraphRequest.mockResolvedValue(mockResponse);

      const stats = await service.syncMessages('user1');

      expect(stats.deleted).toBe(1);
      expect(stats.updated).toBeGreaterThan(0);
    });

    it('should handle empty delta response', async () => {
      const mockResponse: DeltaResponse = {
        value: [],
        '@odata.deltaLink': 'https://graph.microsoft.com/delta?$deltatoken=xyz'
      };

      mockGraphService.makeGraphRequest.mockResolvedValue(mockResponse);

      const stats = await service.syncMessages('user1');

      expect(stats.added).toBe(0);
      expect(stats.updated).toBe(0);
      expect(stats.deleted).toBe(0);
    });
  });
});
