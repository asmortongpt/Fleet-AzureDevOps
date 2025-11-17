/**
 * OfflinePhotoQueue
 *
 * Persistent photo upload queue with offline support
 * Features:
 * - Queue photos when offline
 * - Persistent storage using AsyncStorage
 * - Auto-sync when connectivity restored
 * - Priority queue (high priority first)
 * - Upload status tracking
 * - Error handling and retry
 * - Background sync support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import PhotoUploadService, {
  UploadOptions,
  UploadProgress,
  UploadResult,
} from './PhotoUploadService';
import { AppState, AppStateStatus } from 'react-native';

export interface QueuedPhoto {
  id: string;
  fileUri: string;
  fileName: string;
  fileSize: number;
  priority: 'high' | 'normal' | 'low';
  uploadOptions: UploadOptions;
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'retry';
  retryCount: number;
  maxRetries: number;
  error?: string;
  uploadResult?: UploadResult;
  queuedAt: string;
  uploadedAt?: string;
  lastAttemptAt?: string;
}

export interface QueueStats {
  total: number;
  queued: number;
  uploading: number;
  completed: number;
  failed: number;
  totalSize: number;
  uploadedSize: number;
}

export interface SyncOptions {
  onlyOnWiFi?: boolean;
  maxConcurrent?: number;
  onProgress?: (stats: QueueStats) => void;
  onPhotoComplete?: (photo: QueuedPhoto) => void;
  onSyncComplete?: (stats: QueueStats) => void;
}

class OfflinePhotoQueue {
  private static STORAGE_KEY = '@fleet_photo_queue';
  private static STATS_KEY = '@fleet_photo_queue_stats';

  private queue: QueuedPhoto[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private autoSyncEnabled: boolean = true;
  private syncOptions: SyncOptions = {};
  private listeners: Array<(stats: QueueStats) => void> = [];
  private unsubscribeNetInfo: (() => void) | null = null;
  private appStateListener: any = null;

  /**
   * Initialize the offline queue
   */
  async initialize(autoSync: boolean = true): Promise<void> {
    try {
      // Load queue from storage
      await this.loadQueue();

      this.autoSyncEnabled = autoSync;

      // Set up network listener
      this.setupNetworkListener();

      // Set up app state listener for background sync
      this.setupAppStateListener();

      console.log(`OfflinePhotoQueue initialized with ${this.queue.length} items`);

      // Start auto-sync if online
      if (this.isOnline && this.autoSyncEnabled) {
        await this.startSync();
      }
    } catch (error) {
      console.error('Failed to initialize OfflinePhotoQueue:', error);
      throw error;
    }
  }

  /**
   * Add photo to queue
   */
  async addToQueue(
    fileUri: string,
    options: UploadOptions = {},
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    try {
      const RNFS = require('react-native-fs');
      const { v4: uuidv4 } = require('uuid');

      const fileInfo = await RNFS.stat(fileUri);
      const photoId = uuidv4();

      const queuedPhoto: QueuedPhoto = {
        id: photoId,
        fileUri,
        fileName: this.getFileName(fileUri),
        fileSize: parseInt(fileInfo.size),
        priority,
        uploadOptions: options,
        status: 'queued',
        retryCount: 0,
        maxRetries: 3,
        queuedAt: new Date().toISOString(),
      };

      // Add to queue with priority sorting
      this.queue.push(queuedPhoto);
      this.sortQueue();

      // Save to storage
      await this.saveQueue();

      // Notify listeners
      this.notifyListeners();

      console.log(`Photo ${photoId} added to queue (priority: ${priority})`);

      // Start sync if online and auto-sync enabled
      if (this.isOnline && this.autoSyncEnabled && !this.isSyncing) {
        this.startSync().catch(err =>
          console.error('Failed to start auto-sync:', err)
        );
      }

      return photoId;
    } catch (error) {
      console.error('Failed to add photo to queue:', error);
      throw error;
    }
  }

  /**
   * Add multiple photos to queue
   */
  async addBatchToQueue(
    files: Array<{
      uri: string;
      options?: UploadOptions;
      priority?: 'high' | 'normal' | 'low';
    }>
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const file of files) {
      const id = await this.addToQueue(
        file.uri,
        file.options || {},
        file.priority || 'normal'
      );
      ids.push(id);
    }

    return ids;
  }

  /**
   * Start syncing queue
   */
  async startSync(options: SyncOptions = {}): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.isOnline) {
      console.log('Cannot sync: device is offline');
      return;
    }

    // Check WiFi requirement
    if (options.onlyOnWiFi) {
      const netState = await NetInfo.fetch();
      if (netState.type !== 'wifi') {
        console.log('Cannot sync: WiFi required but not connected');
        return;
      }
    }

    this.isSyncing = true;
    this.syncOptions = options;

    try {
      console.log('Starting queue sync...');

      // Get pending photos
      const pendingPhotos = this.queue.filter(
        p => p.status === 'queued' || p.status === 'retry'
      );

      if (pendingPhotos.length === 0) {
        console.log('No pending photos to sync');
        this.isSyncing = false;
        return;
      }

      console.log(`Syncing ${pendingPhotos.length} photos...`);

      // Upload photos with concurrency control
      const maxConcurrent = options.maxConcurrent || 2;
      const chunks = this.chunkArray(pendingPhotos, maxConcurrent);

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(photo => this.uploadQueuedPhoto(photo))
        );

        // Notify progress
        if (options.onProgress) {
          options.onProgress(this.getStats());
        }
      }

      // Save final state
      await this.saveQueue();

      // Notify completion
      if (options.onSyncComplete) {
        options.onSyncComplete(this.getStats());
      }

      console.log('Queue sync completed');
    } catch (error) {
      console.error('Queue sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Stop syncing
   */
  stopSync(): void {
    this.isSyncing = false;
    console.log('Queue sync stopped');
  }

  /**
   * Remove photo from queue
   */
  async removeFromQueue(photoId: string): Promise<boolean> {
    const index = this.queue.findIndex(p => p.id === photoId);

    if (index === -1) {
      return false;
    }

    this.queue.splice(index, 1);
    await this.saveQueue();
    this.notifyListeners();

    return true;
  }

  /**
   * Clear completed photos from queue
   */
  async clearCompleted(): Promise<number> {
    const beforeCount = this.queue.length;
    this.queue = this.queue.filter(p => p.status !== 'completed');

    await this.saveQueue();
    this.notifyListeners();

    return beforeCount - this.queue.length;
  }

  /**
   * Clear failed photos from queue
   */
  async clearFailed(): Promise<number> {
    const beforeCount = this.queue.length;
    this.queue = this.queue.filter(p => p.status !== 'failed');

    await this.saveQueue();
    this.notifyListeners();

    return beforeCount - this.queue.length;
  }

  /**
   * Retry failed uploads
   */
  async retryFailed(): Promise<void> {
    const failedPhotos = this.queue.filter(p => p.status === 'failed');

    for (const photo of failedPhotos) {
      if (photo.retryCount < photo.maxRetries) {
        photo.status = 'retry';
        photo.retryCount = 0;
        photo.error = undefined;
      }
    }

    await this.saveQueue();
    this.notifyListeners();

    // Start sync
    if (this.isOnline && !this.isSyncing) {
      await this.startSync();
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const stats: QueueStats = {
      total: this.queue.length,
      queued: 0,
      uploading: 0,
      completed: 0,
      failed: 0,
      totalSize: 0,
      uploadedSize: 0,
    };

    for (const photo of this.queue) {
      stats.totalSize += photo.fileSize;

      switch (photo.status) {
        case 'queued':
        case 'retry':
          stats.queued++;
          break;
        case 'uploading':
          stats.uploading++;
          break;
        case 'completed':
          stats.completed++;
          stats.uploadedSize += photo.fileSize;
          break;
        case 'failed':
          stats.failed++;
          break;
      }
    }

    return stats;
  }

  /**
   * Get all queued photos
   */
  getQueue(): QueuedPhoto[] {
    return [...this.queue];
  }

  /**
   * Get photo by ID
   */
  getPhoto(photoId: string): QueuedPhoto | null {
    return this.queue.find(p => p.id === photoId) || null;
  }

  /**
   * Subscribe to queue updates
   */
  subscribe(callback: (stats: QueueStats) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }

    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }

    this.listeners = [];
    await this.saveQueue();
  }

  // Private helper methods

  /**
   * Upload a queued photo
   */
  private async uploadQueuedPhoto(photo: QueuedPhoto): Promise<void> {
    try {
      // Update status
      photo.status = 'uploading';
      photo.lastAttemptAt = new Date().toISOString();
      await this.saveQueue();
      this.notifyListeners();

      // Upload photo
      const result = await PhotoUploadService.uploadPhoto(
        photo.fileUri,
        photo.uploadOptions
      );

      if (result.success) {
        // Update as completed
        photo.status = 'completed';
        photo.uploadResult = result;
        photo.uploadedAt = new Date().toISOString();

        // Notify callback
        if (this.syncOptions.onPhotoComplete) {
          this.syncOptions.onPhotoComplete(photo);
        }
      } else {
        // Handle failure
        photo.retryCount++;

        if (photo.retryCount >= photo.maxRetries) {
          photo.status = 'failed';
          photo.error = result.error || 'Upload failed';
        } else {
          photo.status = 'retry';
        }
      }

      await this.saveQueue();
      this.notifyListeners();
    } catch (error: any) {
      console.error(`Failed to upload photo ${photo.id}:`, error);

      photo.retryCount++;

      if (photo.retryCount >= photo.maxRetries) {
        photo.status = 'failed';
        photo.error = error.message;
      } else {
        photo.status = 'retry';
      }

      await this.saveQueue();
      this.notifyListeners();
    }
  }

  /**
   * Set up network connectivity listener
   */
  private setupNetworkListener(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;

      console.log(`Network status changed: ${this.isOnline ? 'online' : 'offline'}`);

      // Start auto-sync when coming back online
      if (!wasOnline && this.isOnline && this.autoSyncEnabled && !this.isSyncing) {
        console.log('Device back online, starting auto-sync...');
        this.startSync().catch(err =>
          console.error('Failed to start auto-sync:', err)
        );
      }
    });
  }

  /**
   * Set up app state listener for background sync
   */
  private setupAppStateListener(): void {
    this.appStateListener = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && this.isOnline && this.autoSyncEnabled) {
          // Resume sync when app becomes active
          if (!this.isSyncing && this.getStats().queued > 0) {
            console.log('App became active, resuming sync...');
            this.startSync().catch(err =>
              console.error('Failed to resume sync:', err)
            );
          }
        }
      }
    );
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(OfflinePhotoQueue.STORAGE_KEY);

      if (data) {
        this.queue = JSON.parse(data);
        console.log(`Loaded ${this.queue.length} photos from storage`);

        // Reset any photos stuck in 'uploading' state
        for (const photo of this.queue) {
          if (photo.status === 'uploading') {
            photo.status = 'retry';
          }
        }
      } else {
        this.queue = [];
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OfflinePhotoQueue.STORAGE_KEY,
        JSON.stringify(this.queue)
      );

      // Also save stats
      await AsyncStorage.setItem(
        OfflinePhotoQueue.STATS_KEY,
        JSON.stringify(this.getStats())
      );
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };

    this.queue.sort((a, b) => {
      // First by status (queued/retry first)
      const statusOrder = { queued: 0, retry: 0, uploading: 1, completed: 2, failed: 3 };
      const statusDiff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      if (statusDiff !== 0) return statusDiff;

      // Then by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by queued time (oldest first)
      return new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime();
    });
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    for (const listener of this.listeners) {
      try {
        listener(stats);
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get file name from URI
   */
  private getFileName(uri: string): string {
    return uri.split('/').pop() || `photo_${Date.now()}.jpg`;
  }
}

export default new OfflinePhotoQueue();
