/**
 * Offline Storage Service
 *
 * Manages offline data storage and synchronization for mobile devices.
 * Provides caching, conflict resolution, and data persistence for offline-first mobile apps.
 *
 * Features:
 * - Local data caching with TTL
 * - Conflict detection and resolution
 * - Delta sync for efficient data transfer
 * - Queue management for offline operations
 * - Background sync scheduling
 */

import { Pool } from 'pg';


export interface OfflineData {
  id: string
  tenant_id: number
  device_id: string
  data_type: 'vehicle' | 'inspection' | 'report' | 'photo' | 'hos_log' | 'route'
  data: any
  version: number
  created_at: Date
  updated_at: Date
  synced_at?: Date
  is_synced: boolean
}

export interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual'
  resolved_data?: any
}

export interface SyncQueue {
  id: number
  device_id: string
  operation: 'create' | 'update' | 'delete'
  data_type: string
  data: any
  retry_count: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  created_at: Date
  processed_at?: Date
}

export class OfflineStorageService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }
  private readonly DEFAULT_TTL_SECONDS = 3600 // 1 hour
  private readonly MAX_RETRY_COUNT = 3

  /**
   * Store data for offline access
   * Caches data on the server for quick retrieval when the device reconnects
   *
   * @param tenantId - Tenant identifier
   * @param deviceId - Device identifier
   * @param dataType - Type of data being stored
   * @param data - The data to store
   * @returns The stored offline data record
   */
  async storeOfflineData(
    tenantId: number,
    deviceId: string,
    dataType: string,
    data: any
  ): Promise<OfflineData> {
    const result = await this.db.query(
      `INSERT INTO offline_storage (
        tenant_id, device_id, data_type, data, version, is_synced
      ) VALUES ($1, $2, $3, $4, 1, false)
      ON CONFLICT (device_id, data_type, (data->>'id'))
      DO UPDATE SET
        data = EXCLUDED.data,
        version = offline_storage.version + 1,
        updated_at = CURRENT_TIMESTAMP,
        is_synced = false
      RETURNING *`,
      [tenantId, deviceId, dataType, JSON.stringify(data)]
    )

    return result.rows[0]
  }

  /**
   * Retrieve offline data for a device
   * Gets all unsynced data for the device to send back to mobile
   *
   * @param deviceId - Device identifier
   * @param since - Optional timestamp to get only data updated since this time
   * @returns Array of offline data records
   */
  async getOfflineData(deviceId: string, since?: Date): Promise<OfflineData[]> {
    let query = `
      SELECT * FROM offline_storage
      WHERE device_id = $1
    `
    const params: any[] = [deviceId]

    if (since) {
      params.push(since)
      query += ` AND updated_at > $${params.length}`
    }

    query += ` ORDER BY updated_at DESC`

    const result = await this.db.query(query, params)
    return result.rows
  }

  /**
   * Mark data as synced
   * Updates the sync status after successful synchronization
   *
   * @param id - Offline data record ID
   */
  async markAsSynced(id: string): Promise<void> {
    await this.db.query(
      `UPDATE offline_storage
       SET is_synced = true, synced_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    )
  }

  /**
   * Detect conflicts between server and client data
   * Compares versions and timestamps to identify conflicts
   *
   * @param serverData - Data currently on the server
   * @param clientData - Data from the mobile client
   * @returns True if conflict exists
   */
  detectConflict(serverData: any, clientData: any): boolean {
    if (!serverData || !clientData) {
      return false
    }

    // Check if server data has been updated after client data
    const serverTime = new Date(serverData.updated_at || serverData.created_at)
    const clientTime = new Date(clientData.updated_at || clientData.created_at)

    // Conflict if server is newer than client
    return serverTime > clientTime
  }

  /**
   * Resolve conflicts using specified strategy
   * Applies conflict resolution rules to merge or choose data
   *
   * @param serverData - Data from the server
   * @param clientData - Data from the client
   * @param strategy - Resolution strategy to apply
   * @returns Resolved data
   */
  resolveConflict(
    serverData: any,
    clientData: any,
    strategy: 'server_wins' | 'client_wins' | 'merge'
  ): any {
    switch (strategy) {
      case 'server_wins':
        return serverData

      case 'client_wins':
        return clientData

      case 'merge':
        // Merge strategy: combine data, preferring newer values
        return {
          ...serverData,
          ...clientData,
          // Add conflict markers for manual review
          _conflict_resolved: true,
          _resolution_strategy: 'merge',
          _server_version: serverData.version || 1,
          _client_version: clientData.version || 1
        }

      default:
        return serverData
    }
  }

  /**
   * Add operation to sync queue
   * Queues operations that failed due to offline status for retry
   *
   * @param deviceId - Device identifier
   * @param operation - Type of operation (create, update, delete)
   * @param dataType - Type of data
   * @param data - The data for the operation
   * @returns Queue item ID
   */
  async addToSyncQueue(
    deviceId: string,
    operation: 'create' | 'update' | 'delete',
    dataType: string,
    data: any
  ): Promise<number> {
    const result = await this.db.query(
      `INSERT INTO sync_queue (
        device_id, operation, data_type, data, retry_count, status
      ) VALUES ($1, $2, $3, $4, 0, 'pending')
      RETURNING id`,
      [deviceId, operation, dataType, JSON.stringify(data)]
    )

    return result.rows[0].id
  }

  /**
   * Get pending sync queue items
   * Retrieves operations waiting to be processed
   *
   * @param deviceId - Optional device filter
   * @param limit - Maximum number of items to retrieve
   * @returns Array of pending sync queue items
   */
  async getPendingSyncQueue(deviceId?: string, limit: number = 100): Promise<SyncQueue[]> {
    let query = `
      SELECT * FROM sync_queue
      WHERE status = 'pending'
        AND retry_count < $1
    `
    const params: any[] = [this.MAX_RETRY_COUNT]

    if (deviceId) {
      params.push(deviceId)
      query += ` AND device_id = $${params.length}`
    }

    query += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await this.db.query(query, params)
    return result.rows
  }

  /**
   * Process sync queue item
   * Executes a queued operation and updates its status
   *
   * @param queueId - Queue item ID
   * @param success - Whether the operation succeeded
   * @param errorMessage - Error message if failed
   */
  async processSyncQueueItem(
    queueId: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    if (success) {
      await this.db.query(
        `UPDATE sync_queue
         SET status = 'completed',
             processed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [queueId]
      )
    } else {
      await this.db.query(
        `UPDATE sync_queue
         SET status = 'failed',
             retry_count = retry_count + 1,
             error_message = $2,
             processed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [queueId, errorMessage]
      )
    }
  }

  /**
   * Clear old synced data
   * Removes synced data older than the specified TTL to save space
   *
   * @param ttlSeconds - Time to live in seconds (default: 1 hour)
   */
  async clearOldSyncedData(ttlSeconds: number = this.DEFAULT_TTL_SECONDS): Promise<number> {
    const result = await this.db.query(
      `DELETE FROM offline_storage
       WHERE is_synced = true
         AND synced_at < NOW() - INTERVAL '${ttlSeconds} seconds'
       RETURNING id`
    )

    console.log(`[OfflineStorage] Cleared ${result.rowCount} old synced records`)
    return result.rowCount || 0
  }

  /**
   * Get sync statistics for a device
   * Provides metrics about offline data and sync status
   *
   * @param deviceId - Device identifier
   * @returns Sync statistics
   */
  async getSyncStats(deviceId: string): Promise<any> {
    const [dataStats, queueStats] = await Promise.all([
      this.db.query(
        `SELECT
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE is_synced = false) as unsynced_records,
          COUNT(*) FILTER (WHERE is_synced = true) as synced_records,
          MAX(updated_at) as last_update,
          MAX(synced_at) as last_sync
        FROM offline_storage
        WHERE device_id = $1`,
        [deviceId]
      ),
      this.db.query(
        `SELECT
          COUNT(*) as total_queued,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_count
        FROM sync_queue
        WHERE device_id = $1`,
        [deviceId]
      )
    ])

    return {
      data: dataStats.rows[0],
      queue: queueStats.rows[0]
    }
  }

  /**
   * Calculate delta (changes) since last sync
   * Generates a minimal payload of only changed data
   *
   * @param deviceId - Device identifier
   * @param lastSyncAt - Timestamp of last successful sync
   * @returns Object containing created, updated, and deleted records
   */
  async calculateDelta(deviceId: string, lastSyncAt: Date): Promise<any> {
    const [created, updated, deleted] = await Promise.all([
      // New records created since last sync
      this.db.query(
        `SELECT * FROM offline_storage
         WHERE device_id = $1
           AND created_at > $2
           AND created_at = updated_at`,
        [deviceId, lastSyncAt]
      ),
      // Records updated since last sync
      this.db.query(
        `SELECT * FROM offline_storage
         WHERE device_id = $1
           AND updated_at > $2
           AND created_at < updated_at`,
        [deviceId, lastSyncAt]
      ),
      // Deleted records (would need a separate deleted_records table)
      this.db.query(
        `SELECT * FROM deleted_records
         WHERE device_id = $1
           AND deleted_at > $2`,
        [deviceId, lastSyncAt]
      )
    ])

    return {
      created: created.rows,
      updated: updated.rows,
      deleted: deleted.rows,
      delta_timestamp: new Date()
    }
  }
}

export default OfflineStorageService
