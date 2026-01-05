// IndexedDB Offline Storage
// Stores fleet data locally for offline access

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FleetDB extends DBSchema {
  vehicles: {
    key: string;
    value: {
      id: string;
      make: string;
      model: string;
      year: number;
      vin: string;
      status: string;
      lastSync: number;
    };
    indexes: { 'by-status': string };
  };
  reservations: {
    key: string;
    value: {
      id: string;
      vehicleId: string;
      startDate: string;
      endDate: string;
      status: string;
      lastSync: number;
    };
    indexes: { 'by-vehicle': string; 'by-status': string };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      method: string;
      url: string;
      body: any;
      timestamp: number;
      retries: number;
    };
  };
}

export class OfflineStorage {
  private db: IDBPDatabase<FleetDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<FleetDB>('fleet-db', 1, {
      upgrade(db) {
        // Vehicles store
        const vehicleStore = db.createObjectStore('vehicles', { keyPath: 'id' });
        vehicleStore.createIndex('by-status', 'status');

        // Reservations store
        const reservationStore = db.createObjectStore('reservations', { keyPath: 'id' });
        reservationStore.createIndex('by-vehicle', 'vehicleId');
        reservationStore.createIndex('by-status', 'status');

        // Sync queue store
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      },
    });
  }

  // Vehicle operations
  async saveVehicles(vehicles: any[]): Promise<void> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction('vehicles', 'readwrite');
    const now = Date.now();

    await Promise.all([
      ...vehicles.map(vehicle =>
        tx.store.put({ ...vehicle, lastSync: now })
      ),
      tx.done,
    ]);
  }

  async getVehicles(): Promise<any[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('vehicles');
  }

  async getVehicle(id: string): Promise<any | undefined> {
    if (!this.db) await this.init();
    return this.db!.get('vehicles', id);
  }

  // Reservation operations
  async saveReservations(reservations: any[]): Promise<void> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction('reservations', 'readwrite');
    const now = Date.now();

    await Promise.all([
      ...reservations.map(reservation =>
        tx.store.put({ ...reservation, lastSync: now })
      ),
      tx.done,
    ]);
  }

  async getReservations(): Promise<any[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('reservations');
  }

  async getReservationsByVehicle(vehicleId: string): Promise<any[]> {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex('reservations', 'by-vehicle', vehicleId);
  }

  // Sync queue operations
  async addToSyncQueue(mutation: { method: string; url: string; body: any }): Promise<void> {
    if (!this.db) await this.init();

    await this.db!.add('syncQueue', {
      ...mutation,
      timestamp: Date.now(),
      retries: 0,
    });
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('syncQueue');
  }

  async removeFromSyncQueue(id: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('syncQueue', id);
  }

  async incrementRetries(id: number): Promise<void> {
    if (!this.db) await this.init();

    const item = await this.db!.get('syncQueue', id);
    if (item) {
      item.retries++;
      await this.db!.put('syncQueue', item);
    }
  }

  // Clear all data
  async clear(): Promise<void> {
    if (!this.db) await this.init();

    await Promise.all([
      this.db!.clear('vehicles'),
      this.db!.clear('reservations'),
      this.db!.clear('syncQueue'),
    ]);
  }

  // Get storage stats
  async getStats() {
    if (!this.db) await this.init();

    const [vehicleCount, reservationCount, syncQueueCount] = await Promise.all([
      this.db!.count('vehicles'),
      this.db!.count('reservations'),
      this.db!.count('syncQueue'),
    ]);

    return {
      vehicles: vehicleCount,
      reservations: reservationCount,
      pendingSync: syncQueueCount,
    };
  }
}

export const offlineStorage = new OfflineStorage();
