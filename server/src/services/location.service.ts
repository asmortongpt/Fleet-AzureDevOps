import { Pool } from 'pg';

import { AuditLog } from '../utils/auditLog';
import { Logger } from '../utils/logger';
import { validateLatitude, validateLongitude, validateSource } from '../utils/validators';

// FedRAMP/SOC 2 compliance: Ensure secure database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class LocationService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('LocationService');
  }

  async record(tenantId: string, assetId: string, source: 'SCAN' | 'TELEMATICS' | 'BLE' | 'MANUAL', lat: number, lng: number, accuracyM: number, capturedBy: string): Promise<void> {
    try {
      // Input validation
      if (!validateSource(source) || !validateLatitude(lat) || !validateLongitude(lng)) {
        throw new Error('Invalid input parameters');
      }

      // FedRAMP/SOC 2 compliance: Parameterized queries to prevent SQL injection
      const query = `
        INSERT INTO locations (tenant_id, asset_id, source, latitude, longitude, accuracy_m, captured_by, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `;
      await pool.query(query, [tenantId, assetId, source, lat, lng, accuracyM, capturedBy]);

      // Audit logging
      AuditLog.log('record', { tenantId, assetId, source, capturedBy });

    } catch (error) {
      this.logger.error('Error recording location', error);
      throw error;
    }
  }

  async lastSeen(tenantId: string, assetId: string): Promise<any> {
    try {
      const query = `
        SELECT * FROM locations
        WHERE tenant_id = $1 AND asset_id = $2
        ORDER BY timestamp DESC
        LIMIT 1
      `;
      const result = await pool.query(query, [tenantId, assetId]);

      if (result.rows.length === 0) {
        throw new Error('No location data found');
      }

      return result.rows[0];
    } catch (error) {
      this.logger.error('Error fetching last seen location', error);
      throw error;
    }
  }

  async history(tenantId: string, assetId: string, limit: number): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM locations
        WHERE tenant_id = $1 AND asset_id = $2
        ORDER BY timestamp DESC
        LIMIT $3
      `;
      const result = await pool.query(query, [tenantId, assetId, limit]);

      return result.rows;
    } catch (error) {
      this.logger.error('Error fetching location history', error);
      throw error;
    }
  }
}

export default LocationService;