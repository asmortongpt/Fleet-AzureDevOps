import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';

import { AuditLogger } from '../utils/auditLogger';
import { Logger } from '../utils/logger';
import { validateScanType, validateCoordinates } from '../utils/validators';

import { AssetService } from './asset.service';
import { LocationService } from './location.service';


const pool = new Pool();
const logger = new Logger();
const auditLogger = new AuditLogger();

export class ScanService {
  private assetService: AssetService;
  private locationService: LocationService;

  constructor(assetService: AssetService, locationService: LocationService) {
    this.assetService = assetService;
    this.locationService = locationService;
  }

  public async createSession(tenantId: string, userId: string, scanType: 'QR' | 'BARCODE' | 'RFID'): Promise<string> {
    try {
      if (!validateScanType(scanType)) {
        throw new Error('Invalid scan type');
      }

      const client = await pool.connect();
      try {
        const result = await client.query(
          'INSERT INTO scan_sessions (tenant_id, user_id, scan_type) VALUES ($1, $2, $3) RETURNING id',
          [tenantId, userId, scanType]
        );
        const sessionId = result.rows[0].id;
        auditLogger.log('createSession', { tenantId, userId, scanType, sessionId });
        return sessionId;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error creating scan session', error);
      throw error;
    }
  }

  public async recordScan(sessionId: string, tagValue: string, lat: number, lng: number, accuracyM: number): Promise<void> {
    try {
      if (!validateCoordinates(lat, lng, accuracyM)) {
        throw new Error('Invalid coordinates');
      }

      const client = await pool.connect();
      try {
        const asset = await this.assetService.findAssetByTag(tagValue, client);
        if (!asset) {
          throw new Error('Asset not found');
        }

        await this.locationService.updateLocation(asset.id, lat, lng, accuracyM, client);
        auditLogger.log('recordScan', { sessionId, tagValue, lat, lng, accuracyM });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error recording scan', error);
      throw error;
    }
  }

  public async closeSession(sessionId: string): Promise<void> {
    try {
      const client = await pool.connect();
      try {
        await client.query(
          'UPDATE scan_sessions SET closed_at = NOW() WHERE id = $1',
          [sessionId]
        );
        auditLogger.log('closeSession', { sessionId });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error closing scan session', error);
      throw error;
    }
  }
}

// Express middleware for security headers
export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  helmet()(req, res, next);
};