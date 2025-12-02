/**
 * Sync Manager Service
 *
 * Orchestrates synchronization operations:
 * - Monitor network connectivity
 * - Trigger sync when connection restored
 * - Background sync support
 * - Incremental sync (only changed data)
 * - Sync status tracking
 * - Progress indicators
 */

import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';
import BackgroundFetch from 'react-native-background-fetch';
import {
  NetworkState,
  ConnectionType,
  SyncStatus,
  SyncProgress,
  SyncOptions,
  QueueEventType,
  Priority,
} from '../types/queue';
import OfflineQueueService from './OfflineQueueService';
import ConflictResolverService from './ConflictResolver';
import DataPersistenceManager from './DataPersistence';

/**
 * Sync state
 */
interface SyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  nextSyncTime: number | null;
  syncProgress: SyncProgress | null;
  networkState: NetworkState;
}

/**
 * Sync Manager
 * Singleton service for managing synchronization
 */
export class SyncManager {
  private static instance: SyncManager;
  private queueService = OfflineQueueService;
  private conflictResolver = ConflictResolverService;
  private persistence = DataPersistenceManager;

  private networkState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: ConnectionType.NONE,
  };

  private syncState: SyncState = {
    isSyncing: false,
    lastSyncTime: null,
    nextSyncTime: null,
    syncProgress: null,
    networkState: this.networkState,
  };

  private netInfoUnsubscribe: NetInfoSubscription | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private backgroundFetchConfigured = false;
  private stateListeners: Array<(state: SyncState) => void> = [];
  private autoSyncEnabled = true;
  private syncInProgress = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize sync manager
   */
  public async initialize(): Promise<void> {
    await this.persistence.initialize();
    await this.queueService.initialize();
    await this.conflictResolver.initialize();

    // Load last sync time
    const lastSyncTime = await this.persistence.getMetadata('last_sync_time');
    if (lastSyncTime) {
      this.syncState.lastSyncTime = parseInt(lastSyncTime, 10);
    }

    // Setup network monitoring
    await this.setupNetworkMonitoring();

    // Setup background sync
    await this.setupBackgroundSync();

    // Setup periodic sync
    this.startPeriodicSync();

    // Listen to queue events
    this.setupQueueEventListeners();

    console.log('[SyncManager] Initialized successfully');
  }

  // ==================== Network Monitoring ====================

  /**
   * Setup network monitoring
   */
  private async setupNetworkMonitoring(): Promise<void> {
    // Get initial state
    const state = await NetInfo.fetch();
    this.updateNetworkState(state);

    // Subscribe to network changes
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      this.handleNetworkChange(state);
    });

    console.log('[SyncManager] Network monitoring started');
  }

  /**
   * Handle network state change
   */
  private handleNetworkChange(state: NetInfoState): void {
    const wasConnected = this.networkState.isConnected;
    this.updateNetworkState(state);

    const isNowConnected = this.networkState.isConnected;

    console.log(
      `[SyncManager] Network changed: ${wasConnected ? 'connected' : 'disconnected'} → ${isNowConnected ? 'connected' : 'disconnected'}`
    );

    // Trigger sync when connection restored
    if (!wasConnected && isNowConnected && this.autoSyncEnabled) {
      console.log('[SyncManager] Connection restored, triggering sync...');
      this.startSync({ force: false });
    }

    // Notify listeners
    this.notifyStateChange();
  }

  /**
   * Update network state
   */
  private updateNetworkState(state: NetInfoState): void {
    this.networkState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: this.mapConnectionType(state.type),
      details: {
        isConnectionExpensive: state.details?.isConnectionExpensive,
        cellularGeneration: (state.details as any)?.cellularGeneration,
        ssid: (state.details as any)?.ssid,
      },
    };

    this.syncState.networkState = this.networkState;
  }

  /**
   * Map NetInfo connection type to our enum
   */
  private mapConnectionType(type: string): ConnectionType {
    switch (type) {
      case 'wifi':
        return ConnectionType.WIFI;
      case 'cellular':
        return ConnectionType.CELLULAR;
      case 'none':
        return ConnectionType.NONE;
      default:
        return ConnectionType.UNKNOWN;
    }
  }

  /**
   * Get current network state
   */
  public getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Check if online
   */
  public isOnline(): boolean {
    return this.networkState.isConnected && this.networkState.isInternetReachable !== false;
  }

  /**
   * Check if WiFi connection
   */
  public isWiFi(): boolean {
    return this.networkState.type === ConnectionType.WIFI;
  }

  // ==================== Sync Operations ====================

  /**
   * Start sync
   */
  public async startSync(options: SyncOptions = {}): Promise<void> {
    if (this.syncInProgress) {
      console.log('[SyncManager] Sync already in progress');
      return;
    }

    // Check if online (unless force)
    if (!options.force && !this.isOnline()) {
      console.log('[SyncManager] Cannot sync: offline');
      return;
    }

    // Check WiFi requirement
    const config = this.queueService.getConfig();
    if (config.requireWifi && !this.isWiFi() && !options.force) {
      console.log('[SyncManager] Sync requires WiFi');
      return;
    }

    this.syncInProgress = true;
    this.syncState.isSyncing = true;
    this.notifyStateChange();

    try {
      console.log('[SyncManager] Starting sync...');

      // Process queue
      const results = await this.queueService.processQueue(options);

      // Auto-resolve conflicts if any
      const unresolvedCount = await this.conflictResolver.getUnresolvedCount();
      if (unresolvedCount > 0) {
        console.log(`[SyncManager] Auto-resolving ${unresolvedCount} conflicts...`);
        await this.conflictResolver.autoResolveAll();
      }

      // Update last sync time
      const now = Date.now();
      this.syncState.lastSyncTime = now;
      await this.persistence.setMetadata('last_sync_time', now.toString());

      // Clear old completed items
      await this.queueService.clearCompleted();

      const successCount = results.filter((r) => r.success).length;
      console.log(
        `[SyncManager] Sync completed: ${successCount}/${results.length} succeeded`
      );
    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.syncState.isSyncing = false;
      this.syncState.syncProgress = null;
      this.notifyStateChange();
    }
  }

  /**
   * Start incremental sync (only changed data)
   */
  public async startIncrementalSync(): Promise<void> {
    if (!this.syncState.lastSyncTime) {
      // No previous sync, do full sync
      return await this.startSync();
    }

    // Get items created after last sync
    const items = await this.queueService.getAllQueueItems(SyncStatus.PENDING);
    const incrementalItems = items.filter(
      (item) => item.createdAt > this.syncState.lastSyncTime!
    );

    console.log(
      `[SyncManager] Incremental sync: ${incrementalItems.length} new items`
    );

    if (incrementalItems.length === 0) {
      return;
    }

    await this.startSync({
      maxItems: incrementalItems.length,
    });
  }

  /**
   * Sync high priority items only
   */
  public async syncHighPriority(): Promise<void> {
    await this.startSync({
      priorities: [Priority.HIGH],
    });
  }

  /**
   * Sync specific resource type
   */
  public async syncResourceType(resourceType: string): Promise<void> {
    await this.startSync({
      resourceTypes: [resourceType],
    });
  }

  /**
   * Force sync (even if offline)
   */
  public async forceSync(): Promise<void> {
    await this.startSync({ force: true });
  }

  /**
   * Cancel sync
   */
  public cancelSync(): void {
    // Note: This will only prevent new items from being processed
    // Items currently in progress will complete
    this.syncInProgress = false;
    this.syncState.isSyncing = false;
    this.notifyStateChange();
    console.log('[SyncManager] Sync cancelled');
  }

  // ==================== Periodic Sync ====================

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    const config = this.queueService.getConfig();

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.autoSyncEnabled) {
        this.startIncrementalSync();
      }
    }, config.syncInterval);

    console.log(
      `[SyncManager] Periodic sync started (interval: ${config.syncInterval}ms)`
    );
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[SyncManager] Periodic sync stopped');
    }
  }

  /**
   * Enable auto-sync
   */
  public enableAutoSync(): void {
    this.autoSyncEnabled = true;
    console.log('[SyncManager] Auto-sync enabled');
  }

  /**
   * Disable auto-sync
   */
  public disableAutoSync(): void {
    this.autoSyncEnabled = false;
    console.log('[SyncManager] Auto-sync disabled');
  }

  /**
   * Is auto-sync enabled
   */
  public isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  // ==================== Background Sync ====================

  /**
   * Setup background sync
   */
  private async setupBackgroundSync(): Promise<void> {
    if (this.backgroundFetchConfigured) return;

    try {
      const status = await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true,
          requiresBatteryNotLow: false,
          requiresCharging: false,
          requiresDeviceIdle: false,
          requiresStorageNotLow: false,
        },
        async (taskId) => {
          console.log('[SyncManager] Background sync triggered:', taskId);
          await this.handleBackgroundSync();
          BackgroundFetch.finish(taskId);
        },
        (taskId) => {
          console.log('[SyncManager] Background sync timeout:', taskId);
          BackgroundFetch.finish(taskId);
        }
      );

      this.backgroundFetchConfigured = true;
      console.log('[SyncManager] Background sync configured:', status);
    } catch (error) {
      console.error('[SyncManager] Background sync setup failed:', error);
    }
  }

  /**
   * Handle background sync
   */
  private async handleBackgroundSync(): Promise<void> {
    try {
      if (!this.isOnline()) {
        console.log('[SyncManager] Background sync skipped: offline');
        return;
      }

      await this.startIncrementalSync();
    } catch (error) {
      console.error('[SyncManager] Background sync failed:', error);
    }
  }

  /**
   * Schedule background sync
   */
  public async scheduleBackgroundSync(delayMinutes: number = 15): Promise<void> {
    try {
      await BackgroundFetch.scheduleTask({
        taskId: 'fleet-sync',
        delay: delayMinutes * 60 * 1000, // Convert to milliseconds
        periodic: false,
        forceAlarmManager: true,
      });

      console.log(`[SyncManager] Background sync scheduled in ${delayMinutes} minutes`);
    } catch (error) {
      console.error('[SyncManager] Failed to schedule background sync:', error);
    }
  }

  // ==================== Queue Event Listeners ====================

  /**
   * Setup queue event listeners
   */
  private setupQueueEventListeners(): void {
    this.queueService.addEventListener(
      QueueEventType.SYNC_PROGRESS,
      (event) => {
        this.syncState.syncProgress = event.data;
        this.notifyStateChange();
      }
    );
  }

  // ==================== Sync State ====================

  /**
   * Get sync state
   */
  public getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Get sync progress
   */
  public getSyncProgress(): SyncProgress | null {
    return this.syncState.syncProgress;
  }

  /**
   * Is syncing
   */
  public isSyncing(): boolean {
    return this.syncState.isSyncing;
  }

  /**
   * Get last sync time
   */
  public getLastSyncTime(): number | null {
    return this.syncState.lastSyncTime;
  }

  /**
   * Get pending count
   */
  public async getPendingCount(): Promise<number> {
    return await this.queueService.getPendingCount();
  }

  /**
   * Get sync statistics
   */
  public async getSyncStats() {
    const queueStats = await this.queueService.getStats();
    const conflictStats = await this.conflictResolver.getConflictStats();
    const storageStats = await this.persistence.getStorageStats();

    return {
      queue: queueStats,
      conflicts: conflictStats,
      storage: storageStats,
      syncState: this.syncState,
    };
  }

  // ==================== State Listeners ====================

  /**
   * Add state listener
   */
  public addStateListener(listener: (state: SyncState) => void): void {
    this.stateListeners.push(listener);
  }

  /**
   * Remove state listener
   */
  public removeStateListener(listener: (state: SyncState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index > -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  /**
   * Notify state change
   */
  private notifyStateChange(): void {
    this.stateListeners.forEach((listener) => {
      try {
        listener(this.syncState);
      } catch (error) {
        console.error('[SyncManager] State listener error:', error);
      }
    });
  }

  // ==================== Cleanup ====================

  /**
   * Cleanup and shutdown
   */
  public async cleanup(): Promise<void> {
    // Stop periodic sync
    this.stopPeriodicSync();

    // Unsubscribe from network changes
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    // Stop background fetch
    if (this.backgroundFetchConfigured) {
      await BackgroundFetch.stop();
      this.backgroundFetchConfigured = false;
    }

    console.log('[SyncManager] Cleanup complete');
  }

  /**
   * Reset sync state
   */
  public async resetSyncState(): Promise<void> {
    this.syncState.lastSyncTime = null;
    this.syncState.nextSyncTime = null;
    this.syncState.syncProgress = null;
    await this.persistence.setMetadata('last_sync_time', '0');
    console.log('[SyncManager] Sync state reset');
  }
}

// Export singleton instance
export default SyncManager.getInstance();
