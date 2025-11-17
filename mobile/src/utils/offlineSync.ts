/**
 * Fleet Mobile Offline Sync Utilities
 *
 * Comprehensive utilities for offline data synchronization, queue management,
 * network monitoring, and conflict resolution
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  QueueItem,
  QueueItemType,
  SyncStatus,
  OfflineQueue,
  SyncResult,
  STORAGE_KEYS,
  DamageReport,
  InspectionReport,
  PhotoWithGPS,
} from '../types';

// ============================================================================
// Network Status Monitoring
// ============================================================================

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isConnected: boolean = false;
  private listeners: ((connected: boolean) => void)[] = [];
  private unsubscribe: (() => void) | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private initialize(): void {
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      if (this.isConnected !== connected) {
        this.isConnected = connected;
        this.notifyListeners(connected);
      }
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      this.isConnected = state.isConnected && state.isInternetReachable !== false;
    });
  }

  public isOnline(): boolean {
    return this.isConnected;
  }

  public async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable !== false;
  }

  public addListener(listener: (connected: boolean) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (connected: boolean) => void): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private notifyListeners(connected: boolean): void {
    this.listeners.forEach((listener) => listener(connected));
  }

  public cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }
}

// ============================================================================
// Offline Storage Manager
// ============================================================================

export class OfflineStorageManager {
  /**
   * Save data to local storage with optional TTL
   */
  public static async saveData<T>(
    key: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error saving data to storage:', error);
      throw error;
    }
  }

  /**
   * Load data from local storage
   */
  public static async loadData<T>(key: string): Promise<T | null> {
    try {
      const itemString = await AsyncStorage.getItem(key);
      if (!itemString) return null;

      const item = JSON.parse(itemString);

      // Check TTL
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return item.data as T;
    } catch (error) {
      console.error('Error loading data from storage:', error);
      return null;
    }
  }

  /**
   * Remove data from local storage
   */
  public static async removeData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data from storage:', error);
    }
  }

  /**
   * Clear all data from local storage
   */
  public static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Get storage size
   */
  public static async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  /**
   * Format storage size
   */
  public static formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// ============================================================================
// Sync Queue Manager
// ============================================================================

export class SyncQueueManager {
  private static instance: SyncQueueManager;
  private queue: OfflineQueue = {
    items: [],
    isProcessing: false,
  };

  private constructor() {
    this.loadQueue();
  }

  public static getInstance(): SyncQueueManager {
    if (!SyncQueueManager.instance) {
      SyncQueueManager.instance = new SyncQueueManager();
    }
    return SyncQueueManager.instance;
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueData = await OfflineStorageManager.loadData<OfflineQueue>(
        STORAGE_KEYS.OFFLINE_QUEUE
      );
      if (queueData) {
        this.queue = queueData;
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await OfflineStorageManager.saveData(STORAGE_KEYS.OFFLINE_QUEUE, this.queue);
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  /**
   * Add item to sync queue
   */
  public async addToQueue<T>(
    type: QueueItemType,
    data: T,
    priority: number = 5
  ): Promise<string> {
    const item: QueueItem<T> = {
      id: this.generateItemId(),
      type,
      data,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: SyncStatus.PENDING,
      priority,
    };

    this.queue.items.push(item);
    this.queue.items.sort((a, b) => b.priority - a.priority);

    await this.saveQueue();
    return item.id;
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): OfflineQueue {
    return { ...this.queue };
  }

  /**
   * Get pending items count
   */
  public getPendingCount(): number {
    return this.queue.items.filter(
      (item) =>
        item.status === SyncStatus.PENDING || item.status === SyncStatus.FAILED
    ).length;
  }

  /**
   * Remove item from queue
   */
  public async removeItem(itemId: string): Promise<void> {
    this.queue.items = this.queue.items.filter((item) => item.id !== itemId);
    await this.saveQueue();
  }

  /**
   * Clear synced items
   */
  public async clearSynced(): Promise<void> {
    this.queue.items = this.queue.items.filter(
      (item) => item.status !== SyncStatus.SYNCED
    );
    await this.saveQueue();
  }

  /**
   * Retry failed items
   */
  public async retryFailed(): Promise<void> {
    this.queue.items.forEach((item) => {
      if (item.status === SyncStatus.FAILED && item.attempts < item.maxAttempts) {
        item.status = SyncStatus.PENDING;
        item.error = undefined;
      }
    });
    await this.saveQueue();
  }

  /**
   * Process sync queue
   */
  public async processQueue(
    syncHandler: (item: QueueItem) => Promise<void>
  ): Promise<SyncResult> {
    if (this.queue.isProcessing) {
      return { success: false, synced: 0, failed: 0, errors: ['Queue is already processing'] };
    }

    // Check network connection
    const networkMonitor = NetworkMonitor.getInstance();
    if (!networkMonitor.isOnline()) {
      return { success: false, synced: 0, failed: 0, errors: ['No network connection'] };
    }

    this.queue.isProcessing = true;
    this.queue.lastSyncAttempt = new Date();

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    const pendingItems = this.queue.items.filter(
      (item) =>
        item.status === SyncStatus.PENDING ||
        (item.status === SyncStatus.FAILED && item.attempts < item.maxAttempts)
    );

    for (const item of pendingItems) {
      try {
        item.status = SyncStatus.SYNCING;
        await this.saveQueue();

        await syncHandler(item);

        item.status = SyncStatus.SYNCED;
        item.error = undefined;
        synced++;
        this.queue.lastSuccessfulSync = new Date();
      } catch (error) {
        item.attempts++;
        item.status = SyncStatus.FAILED;
        item.error = error instanceof Error ? error.message : 'Unknown error';
        failed++;
        errors.push(`${item.type}: ${item.error}`);
        console.error(`Failed to sync item ${item.id}:`, error);
      }
    }

    // Remove synced items
    this.queue.items = this.queue.items.filter(
      (item) => item.status !== SyncStatus.SYNCED
    );

    this.queue.isProcessing = false;
    await this.saveQueue();

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
    };
  }

  /**
   * Generate unique item ID
   */
  private generateItemId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// Conflict Resolution
// ============================================================================

export interface ConflictResolution<T> {
  useLocal: boolean;
  useRemote: boolean;
  merged?: T;
}

export class ConflictResolver {
  /**
   * Resolve conflict between local and remote data
   */
  public static resolveConflict<T extends { timestamp?: Date; updatedAt?: Date }>(
    local: T,
    remote: T,
    strategy: 'local' | 'remote' | 'newest' | 'manual' = 'newest'
  ): ConflictResolution<T> {
    switch (strategy) {
      case 'local':
        return { useLocal: true, useRemote: false };

      case 'remote':
        return { useLocal: false, useRemote: true };

      case 'newest':
        const localTime = (local.timestamp || local.updatedAt)?.getTime() || 0;
        const remoteTime = (remote.timestamp || remote.updatedAt)?.getTime() || 0;

        if (localTime > remoteTime) {
          return { useLocal: true, useRemote: false };
        } else {
          return { useLocal: false, useRemote: true };
        }

      case 'manual':
        return { useLocal: false, useRemote: false };

      default:
        return { useLocal: false, useRemote: true };
    }
  }

  /**
   * Merge damage reports
   */
  public static mergeDamageReports(
    local: DamageReport,
    remote: DamageReport
  ): DamageReport {
    return {
      ...remote,
      photos: [...new Set([...local.photos, ...remote.photos])],
      damageLocations: [
        ...new Set([...local.damageLocations, ...remote.damageLocations]),
      ],
      description:
        local.description !== remote.description
          ? `${remote.description}\n\nLocal: ${local.description}`
          : remote.description,
    };
  }

  /**
   * Merge inspection reports
   */
  public static mergeInspectionReports(
    local: InspectionReport,
    remote: InspectionReport
  ): InspectionReport {
    return {
      ...remote,
      checklist: remote.checklist.map((remoteItem) => {
        const localItem = local.checklist.find((item) => item.id === remoteItem.id);
        if (!localItem) return remoteItem;

        return {
          ...remoteItem,
          photos: [...new Set([...localItem.photos, ...remoteItem.photos])],
          defects: [...new Set([...localItem.defects, ...remoteItem.defects])],
        };
      }),
    };
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

export class BatchOperations {
  /**
   * Batch upload photos
   */
  public static async batchUploadPhotos(
    photos: PhotoWithGPS[],
    uploadHandler: (photo: PhotoWithGPS) => Promise<void>,
    onProgress?: (current: number, total: number, photo: PhotoWithGPS) => void,
    concurrency: number = 3
  ): Promise<{ success: PhotoWithGPS[]; failed: PhotoWithGPS[] }> {
    const success: PhotoWithGPS[] = [];
    const failed: PhotoWithGPS[] = [];

    // Process in batches
    for (let i = 0; i < photos.length; i += concurrency) {
      const batch = photos.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map((photo) => uploadHandler(photo))
      );

      results.forEach((result, index) => {
        const photo = batch[index];
        if (result.status === 'fulfilled') {
          success.push(photo);
        } else {
          failed.push(photo);
        }
        onProgress?.(i + index + 1, photos.length, photo);
      });
    }

    return { success, failed };
  }

  /**
   * Retry failed operations
   */
  public static async retryFailed<T>(
    items: T[],
    handler: (item: T) => Promise<void>,
    maxRetries: number = 3
  ): Promise<{ success: T[]; failed: T[] }> {
    const success: T[] = [];
    const failed: T[] = [];

    for (const item of items) {
      let attempts = 0;
      let succeeded = false;

      while (attempts < maxRetries && !succeeded) {
        try {
          await handler(item);
          success.push(item);
          succeeded = true;
        } catch (error) {
          attempts++;
          if (attempts >= maxRetries) {
            failed.push(item);
          } else {
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempts) * 1000)
            );
          }
        }
      }
    }

    return { success, failed };
  }
}

// ============================================================================
// Sync Statistics
// ============================================================================

export interface SyncStatistics {
  totalItems: number;
  pendingItems: number;
  syncedItems: number;
  failedItems: number;
  lastSyncAttempt?: Date;
  lastSuccessfulSync?: Date;
  storageSize: string;
  networkStatus: 'online' | 'offline';
}

export class SyncStats {
  /**
   * Get sync statistics
   */
  public static async getStatistics(): Promise<SyncStatistics> {
    const queueManager = SyncQueueManager.getInstance();
    const networkMonitor = NetworkMonitor.getInstance();
    const queue = queueManager.getQueueStatus();

    const totalItems = queue.items.length;
    const pendingItems = queue.items.filter(
      (item) => item.status === SyncStatus.PENDING
    ).length;
    const syncedItems = queue.items.filter(
      (item) => item.status === SyncStatus.SYNCED
    ).length;
    const failedItems = queue.items.filter(
      (item) => item.status === SyncStatus.FAILED
    ).length;

    const storageSize = await OfflineStorageManager.getStorageSize();

    return {
      totalItems,
      pendingItems,
      syncedItems,
      failedItems,
      lastSyncAttempt: queue.lastSyncAttempt,
      lastSuccessfulSync: queue.lastSuccessfulSync,
      storageSize: OfflineStorageManager.formatStorageSize(storageSize),
      networkStatus: networkMonitor.isOnline() ? 'online' : 'offline',
    };
  }

  /**
   * Format sync statistics for display
   */
  public static formatStatistics(stats: SyncStatistics): string {
    return `
Sync Statistics:
- Total Items: ${stats.totalItems}
- Pending: ${stats.pendingItems}
- Synced: ${stats.syncedItems}
- Failed: ${stats.failedItems}
- Network: ${stats.networkStatus}
- Storage: ${stats.storageSize}
- Last Sync: ${stats.lastSuccessfulSync?.toLocaleString() || 'Never'}
    `.trim();
  }
}

// ============================================================================
// Exported Singletons
// ============================================================================

export const networkMonitor = NetworkMonitor.getInstance();
export const syncQueue = SyncQueueManager.getInstance();
