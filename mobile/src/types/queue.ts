/**
 * Queue Types for Fleet Mobile Offline-First System
 *
 * Defines all interfaces, enums, and types for the offline queue
 * and synchronization system.
 */

/**
 * Priority levels for queue items
 */
export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Sync status for queue items
 */
export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

/**
 * Conflict resolution strategies
 */
export enum ConflictResolution {
  SERVER_WINS = 'server_wins',
  CLIENT_WINS = 'client_wins',
  MANUAL = 'manual',
  MERGE = 'merge',
  LAST_WRITE_WINS = 'last_write_wins',
}

/**
 * HTTP methods for API requests
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * Network connection type
 */
export enum ConnectionType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  NONE = 'none',
  UNKNOWN = 'unknown',
}

/**
 * Sync operation types
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
}

/**
 * Data conflict types
 */
export enum ConflictType {
  VERSION_MISMATCH = 'version_mismatch',
  CONCURRENT_UPDATE = 'concurrent_update',
  DELETED_ON_SERVER = 'deleted_on_server',
  NOT_FOUND = 'not_found',
}

/**
 * Queue item interface
 */
export interface QueueItem {
  id: string;
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  priority: Priority;
  status: SyncStatus;
  operationType: OperationType;
  resourceType: string; // e.g., 'vehicle', 'inspection', 'report'
  resourceId?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  scheduledAt?: number; // timestamp for delayed retry
  error?: QueueError;
  metadata?: Record<string, any>;
}

/**
 * Queue error information
 */
export interface QueueError {
  code: string;
  message: string;
  statusCode?: number;
  timestamp: number;
  isRetryable: boolean;
}

/**
 * Conflict data structure
 */
export interface DataConflict {
  id: string;
  queueItemId: string;
  resourceType: string;
  resourceId: string;
  conflictType: ConflictType;
  localVersion: any;
  serverVersion: any;
  localTimestamp: number;
  serverTimestamp: number;
  resolution?: ConflictResolution;
  resolvedData?: any;
  createdAt: number;
  resolvedAt?: number;
}

/**
 * Sync progress information
 */
export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  pending: number;
  percentage: number;
  currentItem?: QueueItem;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  queueItemId: string;
  statusCode?: number;
  response?: any;
  error?: QueueError;
  duration: number; // milliseconds
}

/**
 * Sync statistics
 */
export interface SyncStats {
  totalItems: number;
  successCount: number;
  failureCount: number;
  averageRetries: number;
  averageSyncTime: number;
  lastSyncTime?: number;
  nextSyncTime?: number;
}

/**
 * Network state
 */
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: ConnectionType;
  details?: {
    isConnectionExpensive?: boolean;
    cellularGeneration?: string;
    ssid?: string;
  };
}

/**
 * Offline queue configuration
 */
export interface QueueConfig {
  maxRetries: number;
  baseRetryDelay: number; // milliseconds
  maxRetryDelay: number; // milliseconds
  exponentialBase: number;
  batchSize: number;
  syncInterval: number; // milliseconds
  requireWifi: boolean;
  persistQueue: boolean;
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
  etag?: string;
  version?: number;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalSize: number; // bytes
  usedSize: number; // bytes
  availableSize: number; // bytes
  queueItemCount: number;
  cacheItemCount: number;
  databaseSize: number; // bytes
}

/**
 * Sync options
 */
export interface SyncOptions {
  force?: boolean; // Force sync even if offline
  priorities?: Priority[]; // Only sync specific priorities
  resourceTypes?: string[]; // Only sync specific resource types
  maxItems?: number; // Limit number of items to sync
  timeout?: number; // Timeout in milliseconds
}

/**
 * Conflict resolution options
 */
export interface ConflictResolutionOptions {
  strategy: ConflictResolution;
  customResolver?: (conflict: DataConflict) => Promise<any>;
  autoResolve?: boolean;
}

/**
 * Offline queue event types
 */
export enum QueueEventType {
  ITEM_ADDED = 'item_added',
  ITEM_UPDATED = 'item_updated',
  ITEM_REMOVED = 'item_removed',
  SYNC_STARTED = 'sync_started',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_FAILED = 'sync_failed',
  SYNC_PROGRESS = 'sync_progress',
  CONFLICT_DETECTED = 'conflict_detected',
  CONFLICT_RESOLVED = 'conflict_resolved',
  NETWORK_CHANGED = 'network_changed',
}

/**
 * Queue event
 */
export interface QueueEvent {
  type: QueueEventType;
  timestamp: number;
  data?: any;
}

/**
 * Queue event listener
 */
export type QueueEventListener = (event: QueueEvent) => void;

/**
 * Database migration
 */
export interface DatabaseMigration {
  version: number;
  name: string;
  up: (db: any) => Promise<void>;
  down: (db: any) => Promise<void>;
}

/**
 * Retry strategy
 */
export interface RetryStrategy {
  shouldRetry: (error: QueueError, retryCount: number) => boolean;
  getDelay: (retryCount: number, baseDelay: number) => number;
}

/**
 * Merge strategy function
 */
export type MergeStrategy<T = any> = (
  localData: T,
  serverData: T,
  conflict: DataConflict
) => Promise<T>;

/**
 * Request interceptor
 */
export type RequestInterceptor = (
  queueItem: QueueItem
) => Promise<QueueItem | null>;

/**
 * Response interceptor
 */
export type ResponseInterceptor = (
  result: SyncResult,
  queueItem: QueueItem
) => Promise<SyncResult>;

/**
 * Export all types
 */
export type {
  QueueItem,
  QueueError,
  DataConflict,
  SyncProgress,
  SyncResult,
  SyncStats,
  NetworkState,
  QueueConfig,
  CacheEntry,
  StorageStats,
  SyncOptions,
  ConflictResolutionOptions,
  QueueEvent,
  QueueEventListener,
  DatabaseMigration,
  RetryStrategy,
  MergeStrategy,
  RequestInterceptor,
  ResponseInterceptor,
};

/**
 * Export all enums
 */
export {
  Priority,
  SyncStatus,
  ConflictResolution,
  HttpMethod,
  ConnectionType,
  OperationType,
  ConflictType,
  QueueEventType,
};

/**
 * Default queue configuration
 */
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxRetries: 5,
  baseRetryDelay: 1000, // 1 second
  maxRetryDelay: 300000, // 5 minutes
  exponentialBase: 2,
  batchSize: 10,
  syncInterval: 60000, // 1 minute
  requireWifi: false,
  persistQueue: true,
};

/**
 * Default retry strategy: exponential backoff
 */
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  shouldRetry: (error: QueueError, retryCount: number): boolean => {
    if (!error.isRetryable) return false;
    if (retryCount >= 5) return false;

    // Don't retry 4xx errors except 408, 429
    if (error.statusCode) {
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return error.statusCode === 408 || error.statusCode === 429;
      }
    }

    return true;
  },

  getDelay: (retryCount: number, baseDelay: number): number => {
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, 300000); // Max 5 minutes
  },
};
