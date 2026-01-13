/**
 * Sync Service (Stubbed for Build)
 */

class SyncService {
  async getSyncStatus(): Promise<any[]> {
    return [];
  }

  async syncTeamsMessages(teamId: string, channelId: string): Promise<{ synced: number; errors: number }> {
    return { synced: 0, errors: 0 };
  }

  async syncOutlookEmails(folderId: string): Promise<{ synced: number; errors: number }> {
    return { synced: 0, errors: 0 };
  }

  async syncAllTeamsChannels(): Promise<{ totalSynced: number; totalErrors: number }> {
    return { totalSynced: 0, totalErrors: 0 };
  }

  async syncAllOutlookFolders(): Promise<{ totalSynced: number; totalErrors: number }> {
    return { totalSynced: 0, totalErrors: 0 };
  }

  async getRecentSyncErrors(limit: number): Promise<any[]> {
    return [];
  }

  async areWebhooksHealthy(): Promise<boolean> {
    return true;
  }
}

export default new SyncService();
