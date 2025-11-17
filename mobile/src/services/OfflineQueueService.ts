/**
 * Offline Queue Service
 *
 * Manages offline API requests with:
 * - Priority queue (high/medium/low)
 * - Persistent storage with AsyncStorage
 * - Automatic sync when online
 * - Retry failed requests with exponential backoff
 * - Queue status monitoring
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  QueueItem,
  QueueError,
  SyncResult,
  SyncProgress,
  SyncStats,
  Priority,
  SyncStatus,
  HttpMethod,
  OperationType,
  QueueEventType,
  QueueEvent,
  QueueEventListener,
  QueueConfig,
  SyncOptions,
  RequestInterceptor,
  ResponseInterceptor,
  DEFAULT_QUEUE_CONFIG,
  DEFAULT_RETRY_STRATEGY,
} from '../types/queue';
import DataPersistenceManager from './DataPersistence';

/**
 * Offline Queue Service Manager
 * Singleton service for managing offline API requests
 */
export class OfflineQueueService {
  private static instance: OfflineQueueService;
  private config: QueueConfig;
  private eventListeners: Map<QueueEventType, QueueEventListener[]> = new Map();
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private isProcessing = false;
  private currentProgress: SyncProgress | null = null;
  private persistence = DataPersistenceManager;

  private constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<QueueConfig>): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService(config);
    }
    return OfflineQueueService.instance;
  }

  /**
   * Initialize service
   */
  public async initialize(): Promise<void> {
    await this.persistence.initialize();
    console.log('[OfflineQueue] Service initialized');
  }

  // ==================== Queue Management ====================

  /**
   * Add item to queue
   */
  public async enqueue(
    url: string,
    method: HttpMethod,
    options: {
      body?: any;
      headers?: Record<string, string>;
      priority?: Priority;
      operationType?: OperationType;
      resourceType: string;
      resourceId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<QueueItem> {
    const queueItem: QueueItem = {
      id: uuidv4(),
      url,
      method,
      headers: options.headers,
      body: options.body,
      priority: options.priority || Priority.MEDIUM,
      status: SyncStatus.PENDING,
      operationType: options.operationType || OperationType.CREATE,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: options.metadata,
    };

    // Persist to database
    await this.saveQueueItem(queueItem);

    // Emit event
    this.emitEvent({
      type: QueueEventType.ITEM_ADDED,
      timestamp: Date.now(),
      data: queueItem,
    });

    console.log(`[OfflineQueue] Enqueued ${method} ${url} [${queueItem.priority}]`);
    return queueItem;
  }

  /**
   * Save queue item to database
   */
  private async saveQueueItem(item: QueueItem): Promise<void> {
    await this.persistence.executeSql(
      `INSERT OR REPLACE INTO queue_items (
        id, url, method, headers, body, priority, status, operation_type,
        resource_type, resource_id, retry_count, max_retries, created_at,
        updated_at, scheduled_at, error, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.url,
        item.method,
        JSON.stringify(item.headers),
        JSON.stringify(item.body),
        item.priority,
        item.status,
        item.operationType,
        item.resourceType,
        item.resourceId,
        item.retryCount,
        item.maxRetries,
        item.createdAt,
        item.updatedAt,
        item.scheduledAt,
        JSON.stringify(item.error),
        JSON.stringify(item.metadata),
      ]
    );
  }

  /**
   * Get queue item by ID
   */
  public async getQueueItem(id: string): Promise<QueueItem | null> {
    const result = await this.persistence.executeSql(
      'SELECT * FROM queue_items WHERE id = ?',
      [id]
    );

    if (result.rows.length === 0) return null;

    return this.parseQueueItem(result.rows.item(0));
  }

  /**
   * Get all queue items
   */
  public async getAllQueueItems(
    status?: SyncStatus,
    priority?: Priority
  ): Promise<QueueItem[]> {
    let sql = 'SELECT * FROM queue_items WHERE 1=1';
    const params: any[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    // Order by priority and creation time
    sql += ' ORDER BY CASE priority WHEN "high" THEN 1 WHEN "medium" THEN 2 ELSE 3 END, created_at ASC';

    const result = await this.persistence.executeSql(sql, params);
    const items: QueueItem[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      items.push(this.parseQueueItem(result.rows.item(i)));
    }

    return items;
  }

  /**
   * Parse queue item from database row
   */
  private parseQueueItem(row: any): QueueItem {
    return {
      id: row.id,
      url: row.url,
      method: row.method,
      headers: row.headers ? JSON.parse(row.headers) : undefined,
      body: row.body ? JSON.parse(row.body) : undefined,
      priority: row.priority,
      status: row.status,
      operationType: row.operation_type,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      scheduledAt: row.scheduled_at,
      error: row.error ? JSON.parse(row.error) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  /**
   * Update queue item status
   */
  private async updateQueueItemStatus(
    id: string,
    status: SyncStatus,
    error?: QueueError
  ): Promise<void> {
    await this.persistence.executeSql(
      `UPDATE queue_items
       SET status = ?, error = ?, updated_at = ?
       WHERE id = ?`,
      [status, JSON.stringify(error), Date.now(), id]
    );

    this.emitEvent({
      type: QueueEventType.ITEM_UPDATED,
      timestamp: Date.now(),
      data: { id, status, error },
    });
  }

  /**
   * Remove item from queue
   */
  public async dequeue(id: string): Promise<void> {
    await this.persistence.executeSql('DELETE FROM queue_items WHERE id = ?', [
      id,
    ]);

    this.emitEvent({
      type: QueueEventType.ITEM_REMOVED,
      timestamp: Date.now(),
      data: { id },
    });

    console.log(`[OfflineQueue] Removed item ${id}`);
  }

  /**
   * Clear completed items
   */
  public async clearCompleted(): Promise<number> {
    const result = await this.persistence.executeSql(
      'DELETE FROM queue_items WHERE status = ?',
      [SyncStatus.COMPLETED]
    );

    console.log(`[OfflineQueue] Cleared ${result.rowsAffected} completed items`);
    return result.rowsAffected;
  }

  /**
   * Clear failed items
   */
  public async clearFailed(): Promise<number> {
    const result = await this.persistence.executeSql(
      'DELETE FROM queue_items WHERE status = ?',
      [SyncStatus.FAILED]
    );

    console.log(`[OfflineQueue] Cleared ${result.rowsAffected} failed items`);
    return result.rowsAffected;
  }

  /**
   * Clear all items
   */
  public async clearAll(): Promise<void> {
    await this.persistence.executeSql('DELETE FROM queue_items');
    console.log('[OfflineQueue] Cleared all items');
  }

  // ==================== Queue Processing ====================

  /**
   * Process queue
   */
  public async processQueue(options: SyncOptions = {}): Promise<SyncResult[]> {
    if (this.isProcessing) {
      console.log('[OfflineQueue] Already processing queue');
      return [];
    }

    this.isProcessing = true;
    const results: SyncResult[] = [];

    try {
      this.emitEvent({
        type: QueueEventType.SYNC_STARTED,
        timestamp: Date.now(),
      });

      // Get pending items
      let items = await this.getAllQueueItems(SyncStatus.PENDING);

      // Filter by options
      if (options.priorities) {
        items = items.filter((item) => options.priorities!.includes(item.priority));
      }

      if (options.resourceTypes) {
        items = items.filter((item) =>
          options.resourceTypes!.includes(item.resourceType)
        );
      }

      if (options.maxItems) {
        items = items.slice(0, options.maxItems);
      }

      // Check for scheduled items
      const now = Date.now();
      items = items.filter((item) => !item.scheduledAt || item.scheduledAt <= now);

      const total = items.length;
      console.log(`[OfflineQueue] Processing ${total} items`);

      // Process items in batches
      for (let i = 0; i < items.length; i += this.config.batchSize) {
        const batch = items.slice(i, i + this.config.batchSize);
        const batchResults = await Promise.all(
          batch.map((item) => this.processQueueItem(item))
        );
        results.push(...batchResults);

        // Update progress
        this.updateProgress(items, results);
      }

      this.emitEvent({
        type: QueueEventType.SYNC_COMPLETED,
        timestamp: Date.now(),
        data: { results },
      });

      console.log(
        `[OfflineQueue] Processing complete: ${results.filter((r) => r.success).length}/${total} succeeded`
      );
    } catch (error) {
      console.error('[OfflineQueue] Processing failed:', error);
      this.emitEvent({
        type: QueueEventType.SYNC_FAILED,
        timestamp: Date.now(),
        data: { error },
      });
    } finally {
      this.isProcessing = false;
      this.currentProgress = null;
    }

    return results;
  }

  /**
   * Process single queue item
   */
  private async processQueueItem(item: QueueItem): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      // Update status to in progress
      await this.updateQueueItemStatus(item.id, SyncStatus.IN_PROGRESS);

      // Apply request interceptors
      let processedItem = item;
      for (const interceptor of this.requestInterceptors) {
        const result = await interceptor(processedItem);
        if (!result) {
          // Request cancelled
          return {
            success: false,
            queueItemId: item.id,
            error: {
              code: 'REQUEST_CANCELLED',
              message: 'Request cancelled by interceptor',
              timestamp: Date.now(),
              isRetryable: false,
            },
            duration: Date.now() - startTime,
          };
        }
        processedItem = result;
      }

      // Make HTTP request
      const config: AxiosRequestConfig = {
        url: processedItem.url,
        method: processedItem.method,
        headers: processedItem.headers,
        data: processedItem.body,
        timeout: 30000,
      };

      const response: AxiosResponse = await axios(config);

      // Create success result
      let result: SyncResult = {
        success: true,
        queueItemId: item.id,
        statusCode: response.status,
        response: response.data,
        duration: Date.now() - startTime,
      };

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        result = await interceptor(result, processedItem);
      }

      // Update status to completed
      await this.updateQueueItemStatus(item.id, SyncStatus.COMPLETED);

      console.log(`[OfflineQueue] ✓ ${item.method} ${item.url} [${response.status}]`);
      return result;
    } catch (error: any) {
      const queueError = this.createQueueError(error);

      // Check if should retry
      if (DEFAULT_RETRY_STRATEGY.shouldRetry(queueError, item.retryCount)) {
        await this.scheduleRetry(item, queueError);

        return {
          success: false,
          queueItemId: item.id,
          error: queueError,
          duration: Date.now() - startTime,
        };
      } else {
        // Mark as failed
        await this.updateQueueItemStatus(item.id, SyncStatus.FAILED, queueError);

        console.error(`[OfflineQueue] ✗ ${item.method} ${item.url}`, queueError);
        return {
          success: false,
          queueItemId: item.id,
          error: queueError,
          duration: Date.now() - startTime,
        };
      }
    }
  }

  /**
   * Create queue error from exception
   */
  private createQueueError(error: any): QueueError {
    const isNetworkError = !error.response && error.code === 'ECONNABORTED';
    const statusCode = error.response?.status;

    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      statusCode,
      timestamp: Date.now(),
      isRetryable:
        isNetworkError ||
        statusCode === 408 ||
        statusCode === 429 ||
        (statusCode >= 500 && statusCode < 600),
    };
  }

  /**
   * Schedule retry for failed item
   */
  private async scheduleRetry(
    item: QueueItem,
    error: QueueError
  ): Promise<void> {
    const retryCount = item.retryCount + 1;
    const delay = DEFAULT_RETRY_STRATEGY.getDelay(
      retryCount,
      this.config.baseRetryDelay
    );
    const scheduledAt = Date.now() + delay;

    await this.persistence.executeSql(
      `UPDATE queue_items
       SET status = ?, retry_count = ?, scheduled_at = ?, error = ?, updated_at = ?
       WHERE id = ?`,
      [
        SyncStatus.RETRYING,
        retryCount,
        scheduledAt,
        JSON.stringify(error),
        Date.now(),
        item.id,
      ]
    );

    console.log(
      `[OfflineQueue] Retry scheduled for ${item.id} (attempt ${retryCount}/${item.maxRetries}) in ${delay}ms`
    );
  }

  /**
   * Update sync progress
   */
  private updateProgress(items: QueueItem[], results: SyncResult[]): void {
    const completed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const inProgress = items.length - results.length;

    this.currentProgress = {
      total: items.length,
      completed,
      failed,
      inProgress,
      pending: items.length - results.length,
      percentage: (results.length / items.length) * 100,
    };

    this.emitEvent({
      type: QueueEventType.SYNC_PROGRESS,
      timestamp: Date.now(),
      data: this.currentProgress,
    });
  }

  // ==================== Statistics ====================

  /**
   * Get sync statistics
   */
  public async getStats(): Promise<SyncStats> {
    const allItems = await this.getAllQueueItems();
    const totalItems = allItems.length;
    const successCount = allItems.filter(
      (item) => item.status === SyncStatus.COMPLETED
    ).length;
    const failureCount = allItems.filter(
      (item) => item.status === SyncStatus.FAILED
    ).length;

    const avgRetries =
      allItems.reduce((sum, item) => sum + item.retryCount, 0) /
      (totalItems || 1);

    const lastSyncTime = await this.persistence.getMetadata('last_sync_time');

    return {
      totalItems,
      successCount,
      failureCount,
      averageRetries: avgRetries,
      averageSyncTime: 0, // TODO: Calculate from results
      lastSyncTime: lastSyncTime ? parseInt(lastSyncTime, 10) : undefined,
    };
  }

  /**
   * Get current sync progress
   */
  public getCurrentProgress(): SyncProgress | null {
    return this.currentProgress;
  }

  /**
   * Get pending count
   */
  public async getPendingCount(): Promise<number> {
    const result = await this.persistence.executeSql(
      'SELECT COUNT(*) as count FROM queue_items WHERE status = ?',
      [SyncStatus.PENDING]
    );
    return result.rows.item(0).count;
  }

  // ==================== Interceptors ====================

  /**
   * Add request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // ==================== Event System ====================

  /**
   * Add event listener
   */
  public addEventListener(
    type: QueueEventType,
    listener: QueueEventListener
  ): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(
    type: QueueEventType,
    listener: QueueEventListener
  ): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emitEvent(event: QueueEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  public getConfig(): QueueConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export default OfflineQueueService.getInstance();
