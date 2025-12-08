import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';

import { auditLog, errorLog } from '../utils/logger';
import { validateTenantId, validateAssetId } from '../utils/validators';

const router = express.Router();
const pool = new Pool(); // Assuming pool is configured elsewhere

// Security headers
router.use(helmet());

// Middleware to ensure HTTPS
router.use((req, res, next) => {
  if (req.secure) {
    next();
  } else {
    res.status(403).send('HTTPS Required');
  }
});

// POST /api/assets/:id/checkout
router.post('/api/assets/:id/checkout', async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const assetId = req.params.id;

  if (!validateTenantId(tenantId) || !validateAssetId(assetId)) {
    errorLog('Invalid tenantId or assetId');
    return res.status(400).json({ error: 'Invalid tenantId or assetId' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'UPDATE assets SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
        ['checked_out', assetId, tenantId]
      );

      if (result.rowCount === 0) {
        throw new Error('Asset not found or already checked out');
      }

      await client.query(
        'INSERT INTO checkout_history (asset_id, tenant_id, action) VALUES ($1, $2, $3)',
        [assetId, tenantId, 'checkout']
      );

      await client.query('COMMIT');
      auditLog(`Asset ${assetId} checked out by tenant ${tenantId}`);
      res.status(200).json({ message: 'Asset checked out successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      errorLog(error.message);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  } catch (error) {
    errorLog(error.message);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// POST /api/assets/:id/checkin
router.post('/api/assets/:id/checkin', async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const assetId = req.params.id;

  if (!validateTenantId(tenantId) || !validateAssetId(assetId)) {
    errorLog('Invalid tenantId or assetId');
    return res.status(400).json({ error: 'Invalid tenantId or assetId' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'UPDATE assets SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
        ['available', assetId, tenantId]
      );

      if (result.rowCount === 0) {
        throw new Error('Asset not found or already checked in');
      }

      await client.query(
        'INSERT INTO checkout_history (asset_id, tenant_id, action) VALUES ($1, $2, $3)',
        [assetId, tenantId, 'checkin']
      );

      await client.query('COMMIT');
      auditLog(`Asset ${assetId} checked in by tenant ${tenantId}`);
      res.status(200).json({ message: 'Asset checked in successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      errorLog(error.message);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  } catch (error) {
    errorLog(error.message);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// GET /api/assets/:id/checkout-history
router.get('/api/assets/:id/checkout-history', async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const assetId = req.params.id;

  if (!validateTenantId(tenantId) || !validateAssetId(assetId)) {
    errorLog('Invalid tenantId or assetId');
    return res.status(400).json({ error: 'Invalid tenantId or assetId' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM checkout_history WHERE asset_id = $1 AND tenant_id = $2 ORDER BY timestamp DESC',
      [assetId, tenantId]
    );

    auditLog(`Checkout history retrieved for asset ${assetId} by tenant ${tenantId}`);
    res.status(200).json(result.rows);
  } catch (error) {
    errorLog(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;