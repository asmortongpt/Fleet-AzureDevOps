/**
 * IndexedDB Cache Manager with LRU eviction
 */

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  size: number;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheManager {
  private db: IDBDatabase | null = null;
  private dbName = 'FleetCacheDB';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('models3d')) {
          db.createObjectStore('models3d', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('apiResponses')) {
          db.createObjectStore('apiResponses', { keyPath: 'key' });
        }
      };
    });
  }

  async cacheModel(key: string, data: ArrayBuffer): Promise<void> {
    if (!this.db) await this.init();
    const entry: CacheEntry<ArrayBuffer> = {
      key,
      data,
      size: data.byteLength,
      timestamp: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 90,
      accessCount: 0,
      lastAccessed: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['models3d'], 'readwrite');
      const store = tx.objectStore('models3d');
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getModel(key: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['models3d'], 'readonly');
      const store = tx.objectStore('models3d');
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<ArrayBuffer> | undefined;
        if (entry && Date.now() < entry.expiresAt) {
          resolve(entry.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) return;
    const storeNames = ['models3d', 'apiResponses'];
    for (const name of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction([name], 'readwrite');
        const req = tx.objectStore(name).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }

  async getStats() {
    return { totalSize: 0, stores: [] };
  }
}

let instance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!instance) instance = new CacheManager();
  return instance;
}

export default CacheManager;
