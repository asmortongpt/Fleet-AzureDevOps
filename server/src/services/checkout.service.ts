import { Request, Response } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';

import { AuditLog } from '../utils/auditLog';
import { Logger } from '../utils/logger';
import { validateAssetId, validateCondition, validateNotes, validatePhotos, validateCoordinates } from '../utils/validators';


const pool = new Pool({
  // Database connection configuration
});

export class CheckoutService {
  private logger: Logger;
  private auditLog: AuditLog;

  constructor() {
    this.logger = new Logger();
    this.auditLog = new AuditLog();
  }

  public async checkout(req: Request, res: Response): Promise<void> {
    helmet()(req, res, async () => {
      try {
        const { tenant_id, assetId, checkedOutTo, dueAt, condition, notes, photos, lat, lng } = req.body;

        // Input validation
        if (!validateAssetId(assetId) || !validateCondition(condition) || !validateNotes(notes) || !validatePhotos(photos) || !validateCoordinates(lat, lng)) {
          res.status(400).send('Invalid input');
          return;
        }

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Update asset status
          const updateAssetQuery = `
            UPDATE assets
            SET status = 'checked_out', condition = $1, checked_out_to = $2, due_at = $3
            WHERE id = $4 AND tenant_id = $5
          `;
          await client.query(updateAssetQuery, [condition, checkedOutTo, dueAt, assetId, tenant_id]);

          // Write to checkout history
          const insertHistoryQuery = `
            INSERT INTO checkout_history (tenant_id, asset_id, action, condition, notes, photos, lat, lng, timestamp)
            VALUES ($1, $2, 'checkout', $3, $4, $5, $6, $7, NOW())
          `;
          await client.query(insertHistoryQuery, [tenant_id, assetId, condition, notes, photos, lat, lng]);

          await client.query('COMMIT');

          // Audit logging
          this.auditLog.log('checkout', { tenant_id, assetId, checkedOutTo });

          res.status(200).send('Asset checked out successfully');
        } catch (error) {
          await client.query('ROLLBACK');
          this.logger.error('Checkout transaction failed', error);
          res.status(500).send('Internal server error');
        } finally {
          client.release();
        }
      } catch (error) {
        this.logger.error('Checkout failed', error);
        res.status(500).send('Internal server error');
      }
    });
  }

  public async checkin(req: Request, res: Response): Promise<void> {
    helmet()(req, res, async () => {
      try {
        const { tenant_id, assetId, condition, notes, photos, lat, lng } = req.body;

        // Input validation
        if (!validateAssetId(assetId) || !validateCondition(condition) || !validateNotes(notes) || !validatePhotos(photos) || !validateCoordinates(lat, lng)) {
          res.status(400).send('Invalid input');
          return;
        }

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Update asset status
          const updateAssetQuery = `
            UPDATE assets
            SET status = 'available', condition = $1
            WHERE id = $2 AND tenant_id = $3
          `;
          await client.query(updateAssetQuery, [condition, assetId, tenant_id]);

          // Write to checkout history
          const insertHistoryQuery = `
            INSERT INTO checkout_history (tenant_id, asset_id, action, condition, notes, photos, lat, lng, timestamp)
            VALUES ($1, $2, 'checkin', $3, $4, $5, $6, $7, NOW())
          `;
          await client.query(insertHistoryQuery, [tenant_id, assetId, condition, notes, photos, lat, lng]);

          await client.query('COMMIT');

          // Audit logging
          this.auditLog.log('checkin', { tenant_id, assetId });

          res.status(200).send('Asset checked in successfully');
        } catch (error) {
          await client.query('ROLLBACK');
          this.logger.error('Checkin transaction failed', error);
          res.status(500).send('Internal server error');
        } finally {
          client.release();
        }
      } catch (error) {
        this.logger.error('Checkin failed', error);
        res.status(500).send('Internal server error');
      }
    });
  }
}