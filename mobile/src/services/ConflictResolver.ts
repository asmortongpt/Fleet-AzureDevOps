/**
 * Conflict Resolver Service
 *
 * Handles data conflicts between local and server data with strategies:
 * - Server wins
 * - Client wins
 * - Manual resolution
 * - Merge strategies
 * - Last write wins
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DataConflict,
  ConflictType,
  ConflictResolution,
  ConflictResolutionOptions,
  MergeStrategy,
  QueueEventType,
} from '../types/queue';
import DataPersistenceManager from './DataPersistence';

/**
 * Conflict Resolver Manager
 * Singleton service for resolving data conflicts
 */
export class ConflictResolverService {
  private static instance: ConflictResolverService;
  private persistence = DataPersistenceManager;
  private customMergeStrategies: Map<string, MergeStrategy> = new Map();
  private conflictListeners: Array<(conflict: DataConflict) => void> = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ConflictResolverService {
    if (!ConflictResolverService.instance) {
      ConflictResolverService.instance = new ConflictResolverService();
    }
    return ConflictResolverService.instance;
  }

  /**
   * Initialize service
   */
  public async initialize(): Promise<void> {
    await this.persistence.initialize();
    console.log('[ConflictResolver] Service initialized');
  }

  // ==================== Conflict Detection ====================

  /**
   * Detect conflict between local and server data
   */
  public async detectConflict(
    queueItemId: string,
    resourceType: string,
    resourceId: string,
    localData: any,
    serverData: any
  ): Promise<DataConflict | null> {
    // No conflict if server data doesn't exist
    if (!serverData) {
      return null;
    }

    // Determine conflict type
    const conflictType = this.determineConflictType(localData, serverData);

    if (!conflictType) {
      return null; // No conflict
    }

    // Create conflict record
    const conflict: DataConflict = {
      id: uuidv4(),
      queueItemId,
      resourceType,
      resourceId,
      conflictType,
      localVersion: localData,
      serverVersion: serverData,
      localTimestamp: localData.updatedAt || localData.timestamp || Date.now(),
      serverTimestamp: serverData.updatedAt || serverData.timestamp || Date.now(),
      createdAt: Date.now(),
    };

    // Save conflict to database
    await this.saveConflict(conflict);

    // Notify listeners
    this.notifyConflictDetected(conflict);

    console.log(`[ConflictResolver] Conflict detected: ${conflictType} for ${resourceType}:${resourceId}`);
    return conflict;
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(
    localData: any,
    serverData: any
  ): ConflictType | null {
    // Check if server version was deleted
    if (serverData.deleted || serverData.status === 'deleted') {
      return ConflictType.DELETED_ON_SERVER;
    }

    // Check for version mismatch
    if (localData.version && serverData.version) {
      if (localData.version !== serverData.version) {
        return ConflictType.VERSION_MISMATCH;
      }
    }

    // Check for concurrent updates (both modified since last sync)
    const localTimestamp = localData.updatedAt || localData.timestamp || 0;
    const serverTimestamp = serverData.updatedAt || serverData.timestamp || 0;
    const lastSyncTimestamp = localData.lastSyncTimestamp || 0;

    if (localTimestamp > lastSyncTimestamp && serverTimestamp > lastSyncTimestamp) {
      return ConflictType.CONCURRENT_UPDATE;
    }

    // Check if data has actually changed
    if (this.hasDataChanged(localData, serverData)) {
      return ConflictType.CONCURRENT_UPDATE;
    }

    return null; // No conflict
  }

  /**
   * Check if data has changed (deep comparison)
   */
  private hasDataChanged(data1: any, data2: any): boolean {
    // Exclude metadata fields
    const excludeKeys = [
      'id',
      'createdAt',
      'updatedAt',
      'timestamp',
      'lastSyncTimestamp',
      'version',
    ];

    const keys1 = Object.keys(data1).filter((k) => !excludeKeys.includes(k));
    const keys2 = Object.keys(data2).filter((k) => !excludeKeys.includes(k));

    if (keys1.length !== keys2.length) return true;

    for (const key of keys1) {
      if (JSON.stringify(data1[key]) !== JSON.stringify(data2[key])) {
        return true;
      }
    }

    return false;
  }

  // ==================== Conflict Resolution ====================

  /**
   * Resolve conflict with specified strategy
   */
  public async resolveConflict(
    conflictId: string,
    options: ConflictResolutionOptions
  ): Promise<any> {
    const conflict = await this.getConflict(conflictId);
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    let resolvedData: any;

    switch (options.strategy) {
      case ConflictResolution.SERVER_WINS:
        resolvedData = await this.resolveServerWins(conflict);
        break;

      case ConflictResolution.CLIENT_WINS:
        resolvedData = await this.resolveClientWins(conflict);
        break;

      case ConflictResolution.LAST_WRITE_WINS:
        resolvedData = await this.resolveLastWriteWins(conflict);
        break;

      case ConflictResolution.MERGE:
        resolvedData = await this.resolveMerge(conflict, options);
        break;

      case ConflictResolution.MANUAL:
        if (!options.customResolver) {
          throw new Error('Manual resolution requires a custom resolver');
        }
        resolvedData = await options.customResolver(conflict);
        break;

      default:
        throw new Error(`Unknown resolution strategy: ${options.strategy}`);
    }

    // Update conflict record
    await this.updateConflictResolution(
      conflictId,
      options.strategy,
      resolvedData
    );

    console.log(`[ConflictResolver] Resolved conflict ${conflictId} with strategy: ${options.strategy}`);
    return resolvedData;
  }

  /**
   * Server wins strategy
   */
  private async resolveServerWins(conflict: DataConflict): Promise<any> {
    console.log('[ConflictResolver] Applying SERVER_WINS strategy');
    return conflict.serverVersion;
  }

  /**
   * Client wins strategy
   */
  private async resolveClientWins(conflict: DataConflict): Promise<any> {
    console.log('[ConflictResolver] Applying CLIENT_WINS strategy');
    return conflict.localVersion;
  }

  /**
   * Last write wins strategy
   */
  private async resolveLastWriteWins(conflict: DataConflict): Promise<any> {
    console.log('[ConflictResolver] Applying LAST_WRITE_WINS strategy');

    if (conflict.localTimestamp > conflict.serverTimestamp) {
      return conflict.localVersion;
    } else {
      return conflict.serverVersion;
    }
  }

  /**
   * Merge strategy
   */
  private async resolveMerge(
    conflict: DataConflict,
    options: ConflictResolutionOptions
  ): Promise<any> {
    console.log('[ConflictResolver] Applying MERGE strategy');

    // Check for custom merge strategy
    const customStrategy = this.customMergeStrategies.get(
      conflict.resourceType
    );

    if (customStrategy) {
      return await customStrategy(
        conflict.localVersion,
        conflict.serverVersion,
        conflict
      );
    }

    // Default merge strategy: field-level merge
    return this.defaultMerge(conflict);
  }

  /**
   * Default merge strategy: field-level last-write-wins
   */
  private defaultMerge(conflict: DataConflict): any {
    const merged = { ...conflict.serverVersion };

    // Merge fields from local version if they're newer
    for (const key of Object.keys(conflict.localVersion)) {
      if (key === 'id' || key === 'createdAt') continue;

      const localValue = conflict.localVersion[key];
      const serverValue = conflict.serverVersion[key];

      // If values differ, use local if it's newer
      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        if (conflict.localTimestamp > conflict.serverTimestamp) {
          merged[key] = localValue;
        }
      }
    }

    return merged;
  }

  /**
   * Register custom merge strategy for a resource type
   */
  public registerMergeStrategy(
    resourceType: string,
    strategy: MergeStrategy
  ): void {
    this.customMergeStrategies.set(resourceType, strategy);
    console.log(`[ConflictResolver] Registered custom merge strategy for ${resourceType}`);
  }

  /**
   * Auto-resolve conflict based on type
   */
  public async autoResolveConflict(conflict: DataConflict): Promise<any> {
    let strategy: ConflictResolution;

    switch (conflict.conflictType) {
      case ConflictType.DELETED_ON_SERVER:
        // Server deleted, accept server state
        strategy = ConflictResolution.SERVER_WINS;
        break;

      case ConflictType.VERSION_MISMATCH:
        // Use last write wins for version mismatch
        strategy = ConflictResolution.LAST_WRITE_WINS;
        break;

      case ConflictType.CONCURRENT_UPDATE:
        // Try to merge concurrent updates
        strategy = ConflictResolution.MERGE;
        break;

      case ConflictType.NOT_FOUND:
        // Resource not found on server, use client version
        strategy = ConflictResolution.CLIENT_WINS;
        break;

      default:
        strategy = ConflictResolution.LAST_WRITE_WINS;
    }

    return await this.resolveConflict(conflict.id, {
      strategy,
      autoResolve: true,
    });
  }

  // ==================== Conflict Persistence ====================

  /**
   * Save conflict to database
   */
  private async saveConflict(conflict: DataConflict): Promise<void> {
    await this.persistence.executeSql(
      `INSERT OR REPLACE INTO conflicts (
        id, queue_item_id, resource_type, resource_id, conflict_type,
        local_version, server_version, local_timestamp, server_timestamp,
        resolution, resolved_data, created_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conflict.id,
        conflict.queueItemId,
        conflict.resourceType,
        conflict.resourceId,
        conflict.conflictType,
        JSON.stringify(conflict.localVersion),
        JSON.stringify(conflict.serverVersion),
        conflict.localTimestamp,
        conflict.serverTimestamp,
        conflict.resolution,
        JSON.stringify(conflict.resolvedData),
        conflict.createdAt,
        conflict.resolvedAt,
      ]
    );
  }

  /**
   * Get conflict by ID
   */
  public async getConflict(id: string): Promise<DataConflict | null> {
    const result = await this.persistence.executeSql(
      'SELECT * FROM conflicts WHERE id = ?',
      [id]
    );

    if (result.rows.length === 0) return null;

    return this.parseConflict(result.rows.item(0));
  }

  /**
   * Get all conflicts
   */
  public async getAllConflicts(
    resolved?: boolean
  ): Promise<DataConflict[]> {
    let sql = 'SELECT * FROM conflicts';
    const params: any[] = [];

    if (resolved !== undefined) {
      sql += ' WHERE resolved_at IS ' + (resolved ? 'NOT NULL' : 'NULL');
    }

    sql += ' ORDER BY created_at DESC';

    const result = await this.persistence.executeSql(sql, params);
    const conflicts: DataConflict[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      conflicts.push(this.parseConflict(result.rows.item(i)));
    }

    return conflicts;
  }

  /**
   * Get unresolved conflicts count
   */
  public async getUnresolvedCount(): Promise<number> {
    const result = await this.persistence.executeSql(
      'SELECT COUNT(*) as count FROM conflicts WHERE resolved_at IS NULL'
    );
    return result.rows.item(0).count;
  }

  /**
   * Parse conflict from database row
   */
  private parseConflict(row: any): DataConflict {
    return {
      id: row.id,
      queueItemId: row.queue_item_id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      conflictType: row.conflict_type,
      localVersion: JSON.parse(row.local_version),
      serverVersion: JSON.parse(row.server_version),
      localTimestamp: row.local_timestamp,
      serverTimestamp: row.server_timestamp,
      resolution: row.resolution,
      resolvedData: row.resolved_data
        ? JSON.parse(row.resolved_data)
        : undefined,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    };
  }

  /**
   * Update conflict resolution
   */
  private async updateConflictResolution(
    id: string,
    resolution: ConflictResolution,
    resolvedData: any
  ): Promise<void> {
    await this.persistence.executeSql(
      `UPDATE conflicts
       SET resolution = ?, resolved_data = ?, resolved_at = ?
       WHERE id = ?`,
      [resolution, JSON.stringify(resolvedData), Date.now(), id]
    );
  }

  /**
   * Delete conflict
   */
  public async deleteConflict(id: string): Promise<void> {
    await this.persistence.executeSql('DELETE FROM conflicts WHERE id = ?', [
      id,
    ]);
    console.log(`[ConflictResolver] Deleted conflict ${id}`);
  }

  /**
   * Clear resolved conflicts
   */
  public async clearResolvedConflicts(): Promise<number> {
    const result = await this.persistence.executeSql(
      'DELETE FROM conflicts WHERE resolved_at IS NOT NULL'
    );
    console.log(`[ConflictResolver] Cleared ${result.rowsAffected} resolved conflicts`);
    return result.rowsAffected;
  }

  // ==================== Conflict Listeners ====================

  /**
   * Add conflict listener
   */
  public addConflictListener(
    listener: (conflict: DataConflict) => void
  ): void {
    this.conflictListeners.push(listener);
  }

  /**
   * Remove conflict listener
   */
  public removeConflictListener(
    listener: (conflict: DataConflict) => void
  ): void {
    const index = this.conflictListeners.indexOf(listener);
    if (index > -1) {
      this.conflictListeners.splice(index, 1);
    }
  }

  /**
   * Notify listeners of detected conflict
   */
  private notifyConflictDetected(conflict: DataConflict): void {
    this.conflictListeners.forEach((listener) => {
      try {
        listener(conflict);
      } catch (error) {
        console.error('[ConflictResolver] Listener error:', error);
      }
    });
  }

  // ==================== Batch Operations ====================

  /**
   * Auto-resolve all unresolved conflicts
   */
  public async autoResolveAll(): Promise<number> {
    const conflicts = await this.getAllConflicts(false);
    let resolvedCount = 0;

    for (const conflict of conflicts) {
      try {
        await this.autoResolveConflict(conflict);
        resolvedCount++;
      } catch (error) {
        console.error(`[ConflictResolver] Failed to auto-resolve ${conflict.id}:`, error);
      }
    }

    console.log(`[ConflictResolver] Auto-resolved ${resolvedCount}/${conflicts.length} conflicts`);
    return resolvedCount;
  }

  /**
   * Get conflicts for specific resource
   */
  public async getConflictsForResource(
    resourceType: string,
    resourceId: string
  ): Promise<DataConflict[]> {
    const result = await this.persistence.executeSql(
      `SELECT * FROM conflicts
       WHERE resource_type = ? AND resource_id = ?
       ORDER BY created_at DESC`,
      [resourceType, resourceId]
    );

    const conflicts: DataConflict[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      conflicts.push(this.parseConflict(result.rows.item(i)));
    }

    return conflicts;
  }

  /**
   * Get conflict statistics
   */
  public async getConflictStats(): Promise<{
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<ConflictType, number>;
    byResolution: Record<ConflictResolution, number>;
  }> {
    const allConflicts = await this.getAllConflicts();

    const byType: Record<string, number> = {};
    const byResolution: Record<string, number> = {};

    let resolved = 0;
    let unresolved = 0;

    for (const conflict of allConflicts) {
      // Count by type
      byType[conflict.conflictType] = (byType[conflict.conflictType] || 0) + 1;

      // Count resolved/unresolved
      if (conflict.resolvedAt) {
        resolved++;
        if (conflict.resolution) {
          byResolution[conflict.resolution] =
            (byResolution[conflict.resolution] || 0) + 1;
        }
      } else {
        unresolved++;
      }
    }

    return {
      total: allConflicts.length,
      resolved,
      unresolved,
      byType: byType as Record<ConflictType, number>,
      byResolution: byResolution as Record<ConflictResolution, number>,
    };
  }
}

// Export singleton instance
export default ConflictResolverService.getInstance();
