import DataLoader from 'dataloader';
import { Pool } from 'pg';

const pool = new Pool({
  // Connection pool configuration
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

interface Vehicle {
  id: number;
  driverId: number;
  tenantId: number;
}

interface Driver {
  id: number;
  tenantId: number;
}

interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  tenantId: number;
}

interface Certification {
  id: number;
  driverId: number;
  tenantId: number;
}

interface Asset {
  id: number;
  facilityId: number;
  tenantId: number;
}

interface Facility {
  id: number;
  tenantId: number;
}

export function createVehicleDriverLoader(tenantId: number) {
  return new DataLoader<number, Driver | null>(async (vehicleIds) => {
    const result = await pool.query(
      'SELECT d.* FROM drivers d JOIN vehicles v ON d.id = v.driver_id WHERE v.id = ANY($1) AND v.tenant_id = $2',
      [vehicleIds, tenantId]
    );

    const driverMap = new Map(result.rows.map((d: Driver) => [d.id, d]));
    return vehicleIds.map(id => driverMap.get(id) || null);
  }, { maxBatchSize: 100, batchScheduleFn: callback => setTimeout(callback, 16) });
}

export function createVehicleMaintenanceLoader(tenantId: number) {
  return new DataLoader<number, MaintenanceRecord[]>(async (vehicleIds) => {
    const result = await pool.query(
      'SELECT * FROM maintenance_records WHERE vehicle_id = ANY($1) AND tenant_id = $2',
      [vehicleIds, tenantId]
    );

    const maintenanceMap = new Map<number, MaintenanceRecord[]>();
    result.rows.forEach((record: MaintenanceRecord) => {
      if (!maintenanceMap.has(record.vehicleId)) {
        maintenanceMap.set(record.vehicleId, []);
      }
      maintenanceMap.get(record.vehicleId)!.push(record);
    });

    return vehicleIds.map(id => maintenanceMap.get(id) || []);
  }, { maxBatchSize: 100, batchScheduleFn: callback => setTimeout(callback, 16) });
}

export function createDriverCertificationLoader(tenantId: number) {
  return new DataLoader<number, Certification[]>(async (driverIds) => {
    const result = await pool.query(
      'SELECT * FROM certifications WHERE driver_id = ANY($1) AND tenant_id = $2',
      [driverIds, tenantId]
    );

    const certificationMap = new Map<number, Certification[]>();
    result.rows.forEach((cert: Certification) => {
      if (!certificationMap.has(cert.driverId)) {
        certificationMap.set(cert.driverId, []);
      }
      certificationMap.get(cert.driverId)!.push(cert);
    });

    return driverIds.map(id => certificationMap.get(id) || []);
  }, { maxBatchSize: 100, batchScheduleFn: callback => setTimeout(callback, 16) });
}

export function createFacilityAssetLoader(tenantId: number) {
  return new DataLoader<number, Asset[]>(async (facilityIds) => {
    const result = await pool.query(
      'SELECT * FROM assets WHERE facility_id = ANY($1) AND tenant_id = $2',
      [facilityIds, tenantId]
    );

    const assetMap = new Map<number, Asset[]>();
    result.rows.forEach((asset: Asset) => {
      if (!assetMap.has(asset.facilityId)) {
        assetMap.set(asset.facilityId, []);
      }
      assetMap.get(asset.facilityId)!.push(asset);
    });

    return facilityIds.map(id => assetMap.get(id) || []);
  }, { maxBatchSize: 100, batchScheduleFn: callback => setTimeout(callback, 16) });
}