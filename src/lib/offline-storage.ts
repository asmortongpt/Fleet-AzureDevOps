/**
 * Offline Storage System using IndexedDB
 *
 * Provides persistent offline storage with:
 * - Vehicle data caching
 * - Sync queue for offline operations
 * - Metadata management
 * - Automatic cleanup and size limits
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import logger from '@/utils/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  status: 'active' | 'maintenance' | 'retired';
  mileage: number;
  fuelLevel?: number;
  location?: {
    lat: number;
    lng: number;
  };
  lastUpdated: number;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: 'active' | 'inactive';
  assignedVehicle?: string;
  lastUpdated: number;
}

export interface SyncQueueItem {
  id?: number;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
}

export interface Metadata {
  key: string;
  value: any;
  timestamp: number;
}

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

interface FleetDB extends DBSchema {
  vehicles: {
    key: string;
    value: Vehicle;
    indexes: {
      'by-status': string;
      'by-updated': number;
      'by-make': string;
    };
  };
  drivers: {
    key: string;
    value: Driver;
    indexes: {
      'by-status': string;
      'by-email': string;
    };
  };
  'sync-queue': {
    key: number;
    value: SyncQueueItem;
    indexes: {
      'by-priority': string;
      'by-timestamp': number;
    };
  };
  metadata: {
    key: string;
    value: Metadata;
  };
  cache: {
    key: string;
    value: {
      data: any;
      timestamp: number;
      ttl: number;
    };
  };
}

// ============================================================================
// DATABASE INSTANCE
// ============================================================================

const DB_NAME = 'fleet-management';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<FleetDB> | null = null;

/**
 * Initialize IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<FleetDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<FleetDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      logger.info(`[DB] Upgrading database from v${oldVersion} to v${newVersion}`);

      // Vehicles store
      if (!db.objectStoreNames.contains('vehicles')) {
        const vehicleStore = db.createObjectStore('vehicles', { keyPath: 'id' });
        vehicleStore.createIndex('by-status', 'status');
        vehicleStore.createIndex('by-updated', 'lastUpdated');
        vehicleStore.createIndex('by-make', 'make');
        logger.info('[DB] Created vehicles store');
      }

      // Drivers store
      if (!db.objectStoreNames.contains('drivers')) {
        const driverStore = db.createObjectStore('drivers', { keyPath: 'id' });
        driverStore.createIndex('by-status', 'status');
        driverStore.createIndex('by-email', 'email', { unique: true });
        logger.info('[DB] Created drivers store');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('sync-queue')) {
        const syncStore = db.createObjectStore('sync-queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('by-priority', 'priority');
        syncStore.createIndex('by-timestamp', 'timestamp');
        logger.info('[DB] Created sync-queue store');
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
        logger.info('[DB] Created metadata store');
      }

      // Cache store
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
        logger.info('[DB] Created cache store');
      }
    },
    blocked() {
      logger.warn('[DB] Database upgrade blocked - close other tabs');
    },
    blocking() {
      logger.warn('[DB] This tab is blocking a database upgrade');
    },
  });

  logger.info('[DB] Database initialized successfully');
  return dbInstance;
}

/**
 * Get database instance (creates if needed)
 */
async function getDB(): Promise<IDBPDatabase<FleetDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

// ============================================================================
// VEHICLE OPERATIONS
// ============================================================================

/**
 * Save a vehicle to offline storage
 */
export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  const db = await getDB();
  await db.put('vehicles', {
    ...vehicle,
    lastUpdated: Date.now(),
  });
  logger.info('[DB] Vehicle saved:', vehicle.id);
}

/**
 * Save multiple vehicles
 */
export async function saveVehicles(vehicles: Vehicle[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('vehicles', 'readwrite');

  await Promise.all([
    ...vehicles.map((vehicle) =>
      tx.store.put({
        ...vehicle,
        lastUpdated: Date.now(),
      })
    ),
    tx.done,
  ]);

  logger.info(`[DB] Saved ${vehicles.length} vehicles`);
}

/**
 * Get a vehicle by ID
 */
export async function getVehicle(id: string): Promise<Vehicle | undefined> {
  const db = await getDB();
  return await db.get('vehicles', id);
}

/**
 * Get all vehicles
 */
export async function getAllVehicles(): Promise<Vehicle[]> {
  const db = await getDB();
  return await db.getAll('vehicles');
}

/**
 * Get vehicles by status
 */
export async function getVehiclesByStatus(
  status: Vehicle['status']
): Promise<Vehicle[]> {
  const db = await getDB();
  return await db.getAllFromIndex('vehicles', 'by-status', status);
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('vehicles', id);
  logger.info('[DB] Vehicle deleted:', id);
}

/**
 * Clear all vehicles
 */
export async function clearVehicles(): Promise<void> {
  const db = await getDB();
  await db.clear('vehicles');
  logger.info('[DB] All vehicles cleared');
}

// ============================================================================
// DRIVER OPERATIONS
// ============================================================================

/**
 * Save a driver to offline storage
 */
export async function saveDriver(driver: Driver): Promise<void> {
  const db = await getDB();
  await db.put('drivers', {
    ...driver,
    lastUpdated: Date.now(),
  });
  logger.info('[DB] Driver saved:', driver.id);
}

/**
 * Save multiple drivers
 */
export async function saveDrivers(drivers: Driver[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('drivers', 'readwrite');

  await Promise.all([
    ...drivers.map((driver) =>
      tx.store.put({
        ...driver,
        lastUpdated: Date.now(),
      })
    ),
    tx.done,
  ]);

  logger.info(`[DB] Saved ${drivers.length} drivers`);
}

/**
 * Get a driver by ID
 */
export async function getDriver(id: string): Promise<Driver | undefined> {
  const db = await getDB();
  return await db.get('drivers', id);
}

/**
 * Get all drivers
 */
export async function getAllDrivers(): Promise<Driver[]> {
  const db = await getDB();
  return await db.getAll('drivers');
}

/**
 * Get driver by email
 */
export async function getDriverByEmail(email: string): Promise<Driver | undefined> {
  const db = await getDB();
  return await db.getFromIndex('drivers', 'by-email', email);
}

/**
 * Delete a driver
 */
export async function deleteDriver(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('drivers', id);
  logger.info('[DB] Driver deleted:', id);
}

// ============================================================================
// SYNC QUEUE OPERATIONS
// ============================================================================

/**
 * Add item to sync queue
 */
export async function queueForSync(
  url: string,
  method: SyncQueueItem['method'],
  data?: any,
  priority: SyncQueueItem['priority'] = 'normal'
): Promise<number> {
  const db = await getDB();

  const item: Omit<SyncQueueItem, 'id'> = {
    url,
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: 3,
    priority,
  };

  const id = await db.add('sync-queue', item as SyncQueueItem);
  logger.info(`[DB] Queued for sync: ${method} ${url}`);

  // Request background sync if available
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-fleet-data');
      logger.info('[DB] Background sync requested');
    } catch (error) {
      logger.error('[DB] Background sync registration failed:', error);
    }
  }

  return id;
}

/**
 * Get all items in sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return await db.getAll('sync-queue');
}

/**
 * Get sync queue items by priority
 */
export async function getSyncQueueByPriority(
  priority: SyncQueueItem['priority']
): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return await db.getAllFromIndex('sync-queue', 'by-priority', priority);
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('sync-queue', id);
  logger.info('[DB] Removed from sync queue:', id);
}

/**
 * Increment retry count for sync item
 */
export async function incrementSyncRetry(id: number): Promise<void> {
  const db = await getDB();
  const item = await db.get('sync-queue', id);

  if (item) {
    item.retryCount++;

    if (item.retryCount >= item.maxRetries) {
      await db.delete('sync-queue', id);
      logger.info('[DB] Max retries reached, removing:', id);
    } else {
      await db.put('sync-queue', item);
      logger.info(`[DB] Retry count incremented: ${item.retryCount}/${item.maxRetries}`);
    }
  }
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('sync-queue');
  logger.info('[DB] Sync queue cleared');
}

// ============================================================================
// METADATA OPERATIONS
// ============================================================================

/**
 * Save metadata
 */
export async function saveMetadata(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('metadata', {
    key,
    value,
    timestamp: Date.now(),
  });
}

/**
 * Get metadata
 */
export async function getMetadata(key: string): Promise<any> {
  const db = await getDB();
  const meta = await db.get('metadata', key);
  return meta?.value;
}

/**
 * Delete metadata
 */
export async function deleteMetadata(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('metadata', key);
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Save to cache with TTL
 */
export async function saveToCache(
  key: string,
  data: any,
  ttl: number = 5 * 60 * 1000
): Promise<void> {
  const db = await getDB();
  await db.put('cache', {
    key,
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Get from cache (checks TTL)
 */
export async function getFromCache(key: string): Promise<any | null> {
  const db = await getDB();
  const cached = await db.get('cache', key);

  if (!cached) return null;

  // Check if expired
  if (Date.now() - cached.timestamp > cached.ttl) {
    await db.delete('cache', key);
    return null;
  }

  return cached.data;
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  const db = await getDB();
  const allCache = await db.getAll('cache');
  const now = Date.now();
  let cleared = 0;

  for (const item of allCache) {
    if (now - item.timestamp > item.ttl) {
      await db.delete('cache', item.key);
      cleared++;
    }
  }

  logger.info(`[DB] Cleared ${cleared} expired cache entries`);
  return cleared;
}

// ============================================================================
// DATABASE MANAGEMENT
// ============================================================================

/**
 * Get database statistics
 */
export async function getDBStats(): Promise<{
  vehicles: number;
  drivers: number;
  syncQueue: number;
  metadata: number;
  cache: number;
}> {
  const db = await getDB();

  const [vehicles, drivers, syncQueue, metadata, cache] = await Promise.all([
    db.count('vehicles'),
    db.count('drivers'),
    db.count('sync-queue'),
    db.count('metadata'),
    db.count('cache'),
  ]);

  return { vehicles, drivers, syncQueue, metadata, cache };
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();

  await Promise.all([
    db.clear('vehicles'),
    db.clear('drivers'),
    db.clear('sync-queue'),
    db.clear('metadata'),
    db.clear('cache'),
  ]);

  logger.info('[DB] All data cleared');
}

/**
 * Export all data
 */
export async function exportAllData(): Promise<{
  vehicles: Vehicle[];
  drivers: Driver[];
  syncQueue: SyncQueueItem[];
  metadata: Metadata[];
}> {
  const db = await getDB();

  const [vehicles, drivers, syncQueue, metadata] = await Promise.all([
    db.getAll('vehicles'),
    db.getAll('drivers'),
    db.getAll('sync-queue'),
    db.getAll('metadata'),
  ]);

  return { vehicles, drivers, syncQueue, metadata };
}

/**
 * Import all data
 */
export async function importAllData(data: {
  vehicles?: Vehicle[];
  drivers?: Driver[];
  syncQueue?: SyncQueueItem[];
  metadata?: Metadata[];
}): Promise<void> {
  const db = await getDB();

  const promises: Promise<any>[] = [];

  if (data.vehicles) {
    const tx = db.transaction('vehicles', 'readwrite');
    data.vehicles.forEach((v) => promises.push(tx.store.put(v)));
    promises.push(tx.done);
  }

  if (data.drivers) {
    const tx = db.transaction('drivers', 'readwrite');
    data.drivers.forEach((d) => promises.push(tx.store.put(d)));
    promises.push(tx.done);
  }

  if (data.syncQueue) {
    const tx = db.transaction('sync-queue', 'readwrite');
    data.syncQueue.forEach((s) => promises.push(tx.store.put(s)));
    promises.push(tx.done);
  }

  if (data.metadata) {
    const tx = db.transaction('metadata', 'readwrite');
    data.metadata.forEach((m) => promises.push(tx.store.put(m)));
    promises.push(tx.done);
  }

  await Promise.all(promises);
  logger.info('[DB] Data imported successfully');
}

/**
 * Check if running in offline mode
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function setupOfflineListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    logger.info('[DB] Connection restored - triggering sync');
    if (onOnline) onOnline();

    // Trigger sync
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('sync-fleet-data').catch((error) => {
          logger.error('[DB] Sync registration failed:', error);
        });
      });
    }
  };

  const handleOffline = () => {
    logger.info('[DB] Connection lost - entering offline mode');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Auto-cleanup expired cache on load
if (typeof window !== 'undefined') {
  initDB().then(() => {
    clearExpiredCache().catch(console.error);
  });
}

export default {
  initDB,
  saveVehicle,
  saveVehicles,
  getVehicle,
  getAllVehicles,
  getVehiclesByStatus,
  deleteVehicle,
  clearVehicles,
  saveDriver,
  saveDrivers,
  getDriver,
  getAllDrivers,
  getDriverByEmail,
  deleteDriver,
  queueForSync,
  getSyncQueue,
  getSyncQueueByPriority,
  removeFromSyncQueue,
  incrementSyncRetry,
  clearSyncQueue,
  saveMetadata,
  getMetadata,
  deleteMetadata,
  saveToCache,
  getFromCache,
  clearExpiredCache,
  getDBStats,
  clearAllData,
  exportAllData,
  importAllData,
  isOffline,
  setupOfflineListeners,
};
